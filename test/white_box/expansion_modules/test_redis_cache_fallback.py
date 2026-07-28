# -*- coding: utf-8 -*-
"""
White-box Unit Tests: Redis Cache Key Hash & Database Fallback (100% Branch Coverage)
"""
import pytest
from redis_cache_engine import RedisCacheEngine

class TestRedisCacheFallback:
    """Bộ kiểm thử cho bộ nhớ đệm Redis và khả năng phục hồi lỗi (Fault Tolerance)."""

    def test_generate_cache_key_sha1_uniqueness(self):
        p1 = {"subject": "Toán", "grade": "Lớp 12", "page": 1}
        p2 = {"page": 1, "grade": "Lớp 12", "subject": "Toán"}  # Đảo thứ tự từ điển
        p3 = {"subject": "Toán", "grade": "Lớp 11", "page": 1}

        k1 = RedisCacheEngine.generate_cache_key("tutors_list", p1)
        k2 = RedisCacheEngine.generate_cache_key("tutors_list", p2)
        k3 = RedisCacheEngine.generate_cache_key("tutors_list", p3)

        assert k1 == k2  # Cùng nội dung dù đảo thứ tự phải sinh cùng chuỗi hash
        assert k1 != k3  # Khác thông số phải sinh chuỗi hash khác nhau
        assert k1.startswith("tutors_list:")

    @pytest.mark.parametrize("prefix,params,err_msg", [
        (None, {"a": 1}, "Prefix cache key không hợp lệ"),
        ("", {"a": 1}, "Prefix cache key không hợp lệ"),
        (123, {"a": 1}, "Prefix cache key không hợp lệ"),
        ("prefix", "not_a_dict", "Query params phải là Dictionary"),
    ])
    def test_generate_cache_key_invalid_args(self, prefix, params, err_msg):
        with pytest.raises(ValueError, match=err_msg):
            RedisCacheEngine.generate_cache_key(prefix, params)

    def test_cache_hit_and_miss_lifecycle_with_ttl(self):
        engine = RedisCacheEngine(is_connected=True)
        db_calls = []

        def mock_db_query():
            db_calls.append(1)
            return [{"id": 1, "name": "Gia su An"}]

        base_time = 1700000000.0
        key = "tutors:test_key"

        # Lần 1: Cache Miss -> Gọi DB -> Lưu Cache
        res1 = engine.get_cached_or_db(key, mock_db_query, ttl_seconds=60, current_time=base_time)
        assert res1["source"] == "database" and res1["cache_status"] == "miss_then_cached"
        assert len(db_calls) == 1
        assert engine.stats["cache_misses"] == 1

        # Lần 2: Cache Hit (sau 30 giây < 60s TTL) -> Không gọi thêm DB
        res2 = engine.get_cached_or_db(key, mock_db_query, ttl_seconds=60, current_time=base_time + 30.0)
        assert res2["source"] == "cache" and res2["cache_status"] == "hit"
        assert len(db_calls) == 1
        assert engine.stats["cache_hits"] == 1

        # Lần 3: Cache Expired (sau 61 giây > 60s TTL) -> Cache Miss -> Gọi lại DB
        res3 = engine.get_cached_or_db(key, mock_db_query, ttl_seconds=60, current_time=base_time + 61.0)
        assert res3["source"] == "database" and res3["cache_status"] == "miss_then_cached"
        assert len(db_calls) == 2

    def test_redis_offline_triggers_database_fallback(self):
        """[QUAN TRỌNG] Kiểm thử khi Redis bị chết (Offline) -> tự động Fallback gọi trực tiếp DB."""
        engine = RedisCacheEngine(is_connected=False)
        db_calls = []

        def mock_db_query():
            db_calls.append(1)
            return [{"id": 99, "name": "Fallback Tutor"}]

        res = engine.get_cached_or_db("tutors:any_key", mock_db_query)
        assert res["source"] == "db_fallback"
        assert res["cache_status"] == "redis_offline"
        assert len(db_calls) == 1
        assert engine.stats["db_fallbacks"] == 1

    def test_get_cached_or_db_invalid_args(self):
        engine = RedisCacheEngine()
        with pytest.raises(ValueError, match="Cache key phải là chuỗi hợp lệ"):
            engine.get_cached_or_db(None, lambda: [])
        with pytest.raises(ValueError, match="DB Fetch callback phải là hàm thực thi hợp lệ"):
            engine.get_cached_or_db("key", "not_callable")

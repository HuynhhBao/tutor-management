# -*- coding: utf-8 -*-
"""
Module: Redis Cache Fallback & Hash Key Generation Engine
Hệ thống quản lý khóa Cache và chuyển tiếp tự động sang PostgreSQL khi Redis mất kết nối.
"""
import hashlib
import json
import time

class RedisCacheEngine:
    """Mô phỏng bộ máy Cache Redis và cơ chế tự phục hồi (Fault-tolerant Fallback)."""

    def __init__(self, is_connected: bool = True):
        self.is_connected = is_connected
        self.store = {}
        self.stats = {"cache_hits": 0, "cache_misses": 0, "db_fallbacks": 0}

    @staticmethod
    def generate_cache_key(prefix: str, query_params: dict) -> str:
        """Sinh mã băm SHA1 duy nhất cho bộ lọc truy vấn gia sư."""
        if not prefix or not isinstance(prefix, str):
            raise ValueError("Prefix cache key không hợp lệ")
        if not isinstance(query_params, dict):
            raise ValueError("Query params phải là Dictionary")
            
        sorted_str = json.dumps(query_params, sort_keys=True)
        hash_digest = hashlib.sha1(sorted_str.encode()).hexdigest()[:12]
        return f"{prefix}:{hash_digest}"

    def get_cached_or_db(self, key: str, fetch_from_db_callback, ttl_seconds: int = 300, current_time: float = None) -> dict:
        """
        Luồng rẽ nhánh Cache Lõi:
        1. Nếu Redis kết nối & có Key chưa hết hạn -> Trả về Cache (Hit).
        2. Nếu Key chưa có hoặc hết hạn -> Gọi Callback xuống DB (Miss), rồi lưu vào Cache.
        3. Nếu Redis mất kết nối -> Chuyển hướng trực tiếp sang DB (DB Fallback), không làm choáng hệ thống!
        """
        if not key or not isinstance(key, str):
            raise ValueError("Cache key phải là chuỗi hợp lệ")
        if not callable(fetch_from_db_callback):
            raise ValueError("DB Fetch callback phải là hàm thực thi hợp lệ (Callable)")
            
        now_ts = current_time if current_time is not None else time.time()

        if not self.is_connected:
            # RẼ NHÁNH FALLBACK: Redis offline -> Đẩy thẳng cho Database PostgreSQL xử lý
            self.stats["db_fallbacks"] += 1
            db_data = fetch_from_db_callback()
            return {"source": "db_fallback", "data": db_data, "cache_status": "redis_offline"}

        # Kiểm tra trong kho lưu trữ Redis sim
        if key in self.store:
            record = self.store[key]
            if now_ts < record["exp"]:
                self.stats["cache_hits"] += 1
                return {"source": "cache", "data": record["data"], "cache_status": "hit"}
            else:
                # Xóa dữ liệu quá hạn
                del self.store[key]

        # Rẽ nhánh Cache Miss: Cầu cứu DB và nạp vào Redis
        self.stats["cache_misses"] += 1
        fresh_data = fetch_from_db_callback()
        self.store[key] = {"data": fresh_data, "exp": now_ts + ttl_seconds}
        
        return {"source": "database", "data": fresh_data, "cache_status": "miss_then_cached"}

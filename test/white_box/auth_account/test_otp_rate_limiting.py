# -*- coding: utf-8 -*-
"""
White-box Unit Tests: OTP & Rate Limiting Engine (100% Branch & Statement Coverage)
"""
import pytest
import time
from otp_engine import OTPEngine, AccountLockedException

class TestOTPEngine:
    """Bộ kiểm thử cho quy luật OTP khôi phục mật khẩu."""

    @pytest.fixture
    def engine(self):
        return OTPEngine()

    def test_generate_otp_invalid_email(self, engine):
        with pytest.raises(ValueError, match="Email không hợp lệ"):
            engine.generate_otp(None)
        with pytest.raises(ValueError, match="Email không hợp lệ"):
            engine.generate_otp("invalid_email_no_at")

    def test_generate_and_verify_otp_success(self, engine):
        email = "user@edumatch.vn"
        base_time = 1700000000.0
        otp = engine.generate_otp(email, simulated_time=base_time)
        assert len(otp) == 6
        
        # Verify trong vòng 5 phút sau (300 giây) -> Thành công
        res = engine.verify_otp(email, otp, simulated_time=base_time + 300.0)
        assert res["status"] == "success"
        assert email not in engine.store  # Xóa khỏi store sau khi dùng

    def test_verify_otp_non_existent_email(self, engine):
        res = engine.verify_otp("notfound@edumatch.vn", "123456")
        assert res["status"] == "error"
        assert res["message"] == "Không tìm thấy yêu cầu đặt lại mật khẩu cho email này"

    def test_verify_otp_timeout_exceeds_15_minutes(self, engine):
        email = "timeout@edumatch.vn"
        base_time = 1700000000.0
        otp = engine.generate_otp(email, simulated_time=base_time)
        
        # Verify sau 16 phút (960 giây > 900 giây hạn)
        res = engine.verify_otp(email, otp, simulated_time=base_time + 960.0)
        assert res["status"] == "error"
        assert res["message"] == "Mã OTP đã hết hạn sử dụng (> 15 phút)"

    def test_brute_force_5_times_locks_account_and_prevents_new_otp(self, engine):
        email = "bruteforce@edumatch.vn"
        base_time = 1700000000.0
        engine.generate_otp(email, simulated_time=base_time)
        
        # Thử sai 4 lần đầu -> Báo còn lại X lần
        for i in range(1, 5):
            res = engine.verify_otp(email, "000000", simulated_time=base_time + i)
            assert res["status"] == "error"
            assert f"Còn lại {5 - i} lần thử" in res["message"]
            
        # Thử sai lần thứ 5 -> Khóa lập tức
        with pytest.raises(AccountLockedException, match="Tài khoản bruteforce@edumatch.vn bị khóa tự động vì sai mã OTP 5 lần liên tiếp"):
            engine.verify_otp(email, "000000", simulated_time=base_time + 5)
            
        # Sau khi bị khóa, gọi lại verify lần thứ 6 -> Ném tiếp ngoại lệ khóa
        with pytest.raises(AccountLockedException, match="Tài khoản bruteforce@edumatch.vn đã bị khóa do vi phạm số lần thử sai"):
            engine.verify_otp(email, "123456", simulated_time=base_time + 6)
            
        # Cố gắng yêu cầu cấp lại OTP mới cho tài khoản bị khóa -> Từ chối!
        with pytest.raises(AccountLockedException, match="Tài khoản bruteforce@edumatch.vn đang bị khóa tạm thời"):
            engine.generate_otp(email, simulated_time=base_time + 10)

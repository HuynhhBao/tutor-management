# -*- coding: utf-8 -*-
"""
Module: OTP & Forgot Password Rate-Limiting Engine
Hệ thống quản lý chuỗi thời gian OTP và chống tấn công dò mật khẩu (Brute-force lockout).
"""
import time

class AccountLockedException(Exception):
    """Ngoại lệ ném ra khi tài khoản bị khóa do thử sai OTP quá số lần quy định."""
    pass


class OTPEngine:
    """Quản lý tạo và xác thực mã OTP Khôi phục mật khẩu."""
    
    MAX_ATTEMPTS = 5
    OTP_EXPIRY_SECONDS = 900  # 15 phút

    def __init__(self):
        # Lưu trữ state tạm: {email: {"otp": code, "timestamp": ts, "attempts": count, "is_locked": bool}}
        self.store = {}

    def generate_otp(self, email: str, simulated_time: float = None) -> str:
        """Sinh mã OTP khôi phục mật khẩu và đặt thời gian hết hạn."""
        if not email or "@" not in str(email):
            raise ValueError("Email không hợp lệ")
            
        current_ts = simulated_time if simulated_time is not None else time.time()
        
        # Nếu tài khoản đã bị khóa trước đó do brute-force, từ chối cấp OTP mới
        if email in self.store and self.store[email].get("is_locked", False):
            raise AccountLockedException(f"Tài khoản {email} đang bị khóa tạm thời do nhập sai quá hạn mức.")
            
        # Sinh chuỗi giả lập 6 số
        otp_code = str(abs(hash(email + str(current_ts))))[:6].zfill(6)
        self.store[email] = {
            "otp": otp_code,
            "timestamp": current_ts,
            "attempts": 0,
            "is_locked": False
        }
        return otp_code

    def verify_otp(self, email: str, otp_input: str, simulated_time: float = None) -> dict:
        """Xác thực OTP, kiểm nghiệm rào cản timeout 15 phút và 5 lần sai."""
        if email not in self.store:
            return {"status": "error", "message": "Không tìm thấy yêu cầu đặt lại mật khẩu cho email này"}
            
        record = self.store[email]
        if record["is_locked"]:
            raise AccountLockedException(f"Tài khoản {email} đã bị khóa do vi phạm số lần thử sai.")
            
        current_ts = simulated_time if simulated_time is not None else time.time()
        elapsed = current_ts - record["timestamp"]
        
        # Kiểm tra Timeout 15 phút (900 giây)
        if elapsed > self.OTP_EXPIRY_SECONDS:
            return {"status": "error", "message": "Mã OTP đã hết hạn sử dụng (> 15 phút)"}
            
        # Kiểm tra đúng sai
        if str(otp_input) != str(record["otp"]):
            record["attempts"] += 1
            if record["attempts"] >= self.MAX_ATTEMPTS:
                record["is_locked"] = True
                raise AccountLockedException(f"Tài khoản {email} bị khóa tự động vì sai mã OTP 5 lần liên tiếp!")
            remaining = self.MAX_ATTEMPTS - record["attempts"]
            return {"status": "error", "message": f"Mã OTP không đúng (Còn lại {remaining} lần thử)"}
            
        # Nếu đúng và chưa quá hạn -> Thành công và xóa state
        del self.store[email]
        return {"status": "success", "message": "Xác minh OTP thành công! Vui lòng thiết lập mật khẩu mới."}

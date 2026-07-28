# -*- coding: utf-8 -*-
"""
Module: Password Policy Validator Engine
Hệ thống kiểm nghiệm độ mạnh mật khẩu theo chính sách an toàn thông tin EduMatch.
"""
import re

class PasswordPolicyEngine:
    """Bộ kiểm tra độ mạnh mật khẩu và chính sách bảo mật."""
    
    WEAK_DICTIONARY_WORDS = ["password", "edumatch", "12345678", "qwertyui", "admin123"]

    @classmethod
    def validate_password(cls, password: str) -> dict:
        """
        Kiểm tra rẽ nhánh độ mạnh mật khẩu:
        - Tối thiểu 8 ký tự, tối đa 64 ký tự.
        - Chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số, 1 ký tự đặc biệt (@#$%^&+=_!).
        - Không chứa từ khóa từ điển yếu.
        - Không chứa khoảng trắng.
        """
        if not password or not isinstance(password, str):
            return {"is_valid": False, "reason": "Mật khẩu không hợp lệ hoặc rỗng"}
            
        if len(password) < 8:
            return {"is_valid": False, "reason": "Mật khẩu quá ngắn (< 8 ký tự)"}
            
        if len(password) > 64:
            return {"is_valid": False, "reason": "Mật khẩu quá dài (> 64 ký tự)"}
            
        if re.search(r"\s", password):
            return {"is_valid": False, "reason": "Mật khẩu không được chứa khoảng trắng"}
            
        if not re.search(r"[A-Z]", password):
            return {"is_valid": False, "reason": "Thiếu ký tự viết hoa (A-Z)"}
            
        if not re.search(r"[a-z]", password):
            return {"is_valid": False, "reason": "Thiếu ký tự viết thường (a-z)"}
            
        if not re.search(r"[0-9]", password):
            return {"is_valid": False, "reason": "Thiếu chữ số (0-9)"}
            
        if not re.search(r"[\@\#\$\%\^\&\+\=\_\!]", password):
            return {"is_valid": False, "reason": "Thiếu ký tự đặc biệt (@#$%^&+=_!)"}
            
        pwd_lower = password.lower()
        for weak_word in cls.WEAK_DICTIONARY_WORDS:
            if weak_word in pwd_lower:
                return {"is_valid": False, "reason": f"Chứa từ khóa dễ đoán ('{weak_word}')"}
                
        return {"is_valid": True, "reason": "Mật khẩu đạt tiêu chuẩn bảo mật tối đa"}

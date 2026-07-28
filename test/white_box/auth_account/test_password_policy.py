# -*- coding: utf-8 -*-
"""
White-box Unit Tests: Password Policy Engine (100% Branch & Statement Coverage)
"""
import pytest
from password_policy_engine import PasswordPolicyEngine

class TestPasswordPolicyEngine:
    """Bộ kiểm thử cho chính sách mật khẩu."""

    @pytest.mark.parametrize("valid_pwd", [
        "Good#Key99_Val",
        "StrongP@ss1",
        "Tutor#VN2026_Secure",
        "A" * 50 + "1!a",  # Đúng dưới 64 ký tự
    ])
    def test_valid_passwords_pass(self, valid_pwd):
        res = PasswordPolicyEngine.validate_password(valid_pwd)
        assert res["is_valid"] is True
        assert res["reason"] == "Mật khẩu đạt tiêu chuẩn bảo mật tối đa"

    @pytest.mark.parametrize("invalid_pwd,expected_reason", [
        (None, "Mật khẩu không hợp lệ hoặc rỗng"),
        ("", "Mật khẩu không hợp lệ hoặc rỗng"),
        (12345678, "Mật khẩu không hợp lệ hoặc rỗng"),
        ("Sh@1a", "Mật khẩu quá ngắn (< 8 ký tự)"),
        ("A" * 65 + "1!aA", "Mật khẩu quá dài (> 64 ký tự)"),
        ("EduMatch @2026", "Mật khẩu không được chứa khoảng trắng"),
        ("edumatch@2026_lower", "Thiếu ký tự viết hoa (A-Z)"),
        ("EDUMATCH@2026_UPPER", "Thiếu ký tự viết thường (a-z)"),
        ("EduMatch@NoDigits", "Thiếu chữ số (0-9)"),
        ("EduMatch2026NoSymbol", "Thiếu ký tự đặc biệt (@#$%^&+=_!)"),
        ("MyPassword@1234", "Chứa từ khóa dễ đoán ('password')"),
        ("WelcomeEduMatch@1", "Chứa từ khóa dễ đoán ('edumatch')"),
        ("User12345678#abc", "Chứa từ khóa dễ đoán ('12345678')"),
        ("Admin123@Secret!", "Chứa từ khóa dễ đoán ('admin123')"),
        ("Qwertyui!123A", "Chứa từ khóa dễ đoán ('qwertyui')"),
    ])
    def test_invalid_passwords_rejected_by_branch(self, invalid_pwd, expected_reason):
        """Kiểm định từng nhánh rẽ một trong 100% các luật lệ về độ mạnh mật khẩu."""
        res = PasswordPolicyEngine.validate_password(invalid_pwd)
        assert res["is_valid"] is False
        assert res["reason"] == expected_reason

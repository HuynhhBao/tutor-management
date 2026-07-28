# -*- coding: utf-8 -*-
"""
White-box Unit Tests: Crypto, Bcrypt & JWT (100% Branch & Statement Coverage)
"""
import pytest
import time
import base64
import json
from auth_engine import CryptoAuthSimulator

class TestJWTDAndBcryptWhiteBox:
    """Bộ unit test kiểm thử độ mạnh mã hóa và tính vẹn toàn Token."""

    def test_password_hashing_and_verification_success(self):
        plain = "EduMatch@Sec2026"
        hashed = CryptoAuthSimulator.hash_password_bcrypt_sim(plain, salt_rounds=12)
        assert plain not in hashed
        assert hashed.startswith("$2b$12$")
        assert CryptoAuthSimulator.verify_password(plain, hashed) is True
        assert CryptoAuthSimulator.verify_password("WrongPassword123", hashed) is False

    @pytest.mark.parametrize("invalid_pwd", [None, "", "1234567"])
    def test_short_or_invalid_password_raises_error(self, invalid_pwd):
        with pytest.raises(ValueError, match="Mật khẩu phải dài tối thiểu 8 ký tự"):
            CryptoAuthSimulator.hash_password_bcrypt_sim(invalid_pwd)

    @pytest.mark.parametrize("invalid_hash,expected_bool", [
        ("", False),
        (None, False),
        ("not_a_bcrypt_hash", False),
        ("$2b$invalid_format", False),
        ("$2a$10$wrongprefixformatstring1234567890", False),
        (12345, False)
    ])
    def test_verify_password_invalid_hash_branches(self, invalid_hash, expected_bool):
        """Kiểm nghiệm 100% nhánh sai cấu trúc băm mật khẩu trong verify_password."""
        assert CryptoAuthSimulator.verify_password("EduMatch@Sec2026", invalid_hash) == expected_bool

    def test_generate_jwt_invalid_arguments(self):
        """Kiểm thử rẽ nhánh tham số không hợp lệ trong generate_jwt."""
        with pytest.raises(ValueError, match="Tham số sinh token không hợp lệ"):
            CryptoAuthSimulator.generate_jwt({"user": 1}, secret_key="")
        with pytest.raises(ValueError, match="Tham số sinh token không hợp lệ"):
            CryptoAuthSimulator.generate_jwt("not_a_dict", secret_key="secret")

    def test_jwt_generation_and_successful_decoding(self):
        secret = "edu_secret_super_key_2026"
        token = CryptoAuthSimulator.generate_jwt({"user_id": 99, "role": "admin"}, secret_key=secret)
        assert len(token.split(".")) == 3
        decoded = CryptoAuthSimulator.decode_and_verify_jwt(token, secret_key=secret)
        assert decoded["user_id"] == 99
        assert decoded["role"] == "admin"

    def test_tampered_token_signature_rejected(self):
        secret = "edu_secret_super_key_2026"
        orig_token = CryptoAuthSimulator.generate_jwt({"user_id": 10, "role": "student"}, secret_key=secret)
        header, _, sig = orig_token.split(".")
        hacker_payload = base64.urlsafe_b64encode(json.dumps({"user_id": 10, "role": "admin", "exp": time.time() + 9999}).encode()).decode().rstrip("=")
        tampered_token = f"{header}.{hacker_payload}.{sig}"
        with pytest.raises(ValueError, match="Chữ ký JWT không đúng"):
            CryptoAuthSimulator.decode_and_verify_jwt(tampered_token, secret_key=secret)

    def test_expired_token_raises_timeout_error(self):
        secret = "edu_secret_super_key_2026"
        expired_token = CryptoAuthSimulator.generate_jwt({"user_id": 1}, secret_key=secret, expires_in_seconds=-5)
        with pytest.raises(TimeoutError, match="Token đã hết hạn hiệu lực"):
            CryptoAuthSimulator.decode_and_verify_jwt(expired_token, secret_key=secret)

    @pytest.mark.parametrize("invalid_token", [
        None,
        "",
        "header_only",
        "header.payload_without_sig",
        "too.many.parts.in.this.token.string"
    ])
    def test_decode_jwt_malformed_structure_branches(self, invalid_token):
        """Kiểm nghiệm rẽ nhánh cấu trúc sai trong decode_and_verify_jwt."""
        with pytest.raises(ValueError, match="Cấu trúc Token bị lỗi"):
            CryptoAuthSimulator.decode_and_verify_jwt(invalid_token, secret_key="secret")

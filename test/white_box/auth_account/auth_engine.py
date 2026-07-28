# -*- coding: utf-8 -*-
"""
Module: Auth & Security Core Engine (RBAC, JWT Signature, Bcrypt Hashing)
Hệ thống logic lõi phục vụ kiểm thử Hộp trắng cho cụm Auth & Account.
"""
import hashlib
import hmac
import time
import base64
import json

class UnauthorizedError(Exception):
    """Lỗi 401 khi thiếu JWT Token hoặc Token sai chữ ký."""
    pass

class ForbiddenError(Exception):
    """Lỗi 403 khi Token hợp lệ nhưng Role không nằm trong danh sách được cấp phép."""
    pass


class CryptoAuthSimulator:
    """Mô phỏng cơ cấu băm mật khẩu bảo mật và sinh chữ ký Token của backend."""
    
    @classmethod
    def hash_password_bcrypt_sim(cls, password: str, salt_rounds: int = 10) -> str:
        """Mô phỏng băm mật khẩu với muối định kỳ (Salt rounds)."""
        if not password or len(password) < 8:
            raise ValueError("Mật khẩu phải dài tối thiểu 8 ký tự")
        salt = hashlib.sha256(f"{password}_salt_{salt_rounds}".encode()).hexdigest()[:16]
        hashed_body = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000).hex()
        return f"$2b${salt_rounds}${salt}{hashed_body[:31]}"

    @classmethod
    def verify_password(cls, plain_password: str, hashed_hash: str) -> bool:
        """Xác minh mật khẩu bản rõ (Plaintext) với mã băm trong Database."""
        try:
            if not hashed_hash or not isinstance(hashed_hash, str):
                return False
            parts = hashed_hash.split("$")
            if len(parts) != 4 or parts[1] != "2b":
                return False
            salt_rounds = int(parts[2])
            recomputed = cls.hash_password_bcrypt_sim(plain_password, salt_rounds)
            return recomputed == hashed_hash
        except (ValueError, IndexError, TypeError):
            return False

    @classmethod
    def generate_jwt(cls, payload: dict, secret_key: str, expires_in_seconds: int = 3600) -> str:
        """Sinh chuỗi JWT Token gồm 3 phần Header.Payload.Signature."""
        if not secret_key or not isinstance(payload, dict):
            raise ValueError("Tham số sinh token không hợp lệ")
            
        header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
        
        full_payload = payload.copy()
        full_payload["exp"] = time.time() + expires_in_seconds
        payload_enc = base64.urlsafe_b64encode(json.dumps(full_payload).encode()).decode().rstrip("=")
        
        signature = hmac.new(secret_key.encode(), f"{header}.{payload_enc}".encode(), hashlib.sha256).hexdigest()
        return f"{header}.{payload_enc}.{signature}"

    @classmethod
    def decode_and_verify_jwt(cls, token: str, secret_key: str) -> dict:
        """Giải mã và kiểm định chữ ký Token."""
        if not token or not isinstance(token, str):
            raise ValueError("Cấu trúc Token bị lỗi (Phải gồm 3 phần phân cách bởi dấu chấm)")
            
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Cấu trúc Token bị lỗi (Phải gồm 3 phần phân cách bởi dấu chấm)")
        
        header, payload_enc, sig = parts
        expected_sig = hmac.new(secret_key.encode(), f"{header}.{payload_enc}".encode(), hashlib.sha256).hexdigest()
        if sig != expected_sig:
            raise ValueError("Chữ ký JWT không đúng. Token đã bị mạo danh (Tampered)!")
            
        padding = "=" * (-len(payload_enc) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_enc + padding).decode())
        
        if payload["exp"] < time.time():
            raise TimeoutError("Token đã hết hạn hiệu lực (Expired)")
            
        return payload


class RBACMiddlewareSimulator:
    """Mô phỏng bộ middleware xác định danh tính và kiểm duyệt Role trong backend Express."""
    
    @staticmethod
    def verify_token_header(header_auth: str) -> dict:
        """Nhánh xác thực JWT Token Header."""
        if not header_auth or not isinstance(header_auth, str) or not header_auth.startswith("Bearer "):
            raise UnauthorizedError("401 Unauthorized: Thiếu Header Authorization Bearer")
        
        token = header_auth.split(" ", 1)[1].strip()
        if not token:
            raise UnauthorizedError("401 Unauthorized: Chuỗi token rỗng sau tiền tố Bearer")
            
        if token == "token_admin_valid_123":
            return {"user_id": 1, "role": "admin", "username": "admin_bao"}
        elif token == "token_tutor_valid_456":
            return {"user_id": 2, "role": "tutor", "username": "giasu_an"}
        elif token == "token_student_valid_789":
            return {"user_id": 3, "role": "student", "username": "hocvien_mai"}
        elif token == "token_expired_000":
            raise UnauthorizedError("401 Unauthorized: JWT Token đã hết hạn")
        else:
            raise UnauthorizedError("401 Unauthorized: Chữ ký Token không hợp lệ (Tampered)")

    @classmethod
    def role_guard(cls, header_auth: str, allowed_roles: list) -> dict:
        """Nhánh Phân quyền Role Guard: Xác định Quy trình rẽ nhánh truy cập."""
        if not isinstance(allowed_roles, list) or not allowed_roles:
            raise ValueError("Danh sách role được cấp phép không được rỗng")
            
        user_payload = cls.verify_token_header(header_auth)
        if user_payload["role"] not in allowed_roles:
            raise ForbiddenError(f"403 Forbidden: Tài khoản role '{user_payload['role']}' bị từ chối truy cập. Quyền yêu cầu: {allowed_roles}")
        return user_payload

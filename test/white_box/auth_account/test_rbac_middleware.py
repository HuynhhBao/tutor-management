# -*- coding: utf-8 -*-
"""
White-box Unit Tests: RBAC Security Middleware (100% Branch & Statement Coverage)
"""
import pytest
from auth_engine import RBACMiddlewareSimulator, UnauthorizedError, ForbiddenError


class TestRBACMiddleware:
    """Bộ kiểm thử cho rễ nhánh Phân Quyền Bảo Mật RBAC."""

    @pytest.mark.parametrize("valid_token,expected_role", [
        ("Bearer token_admin_valid_123", "admin"),
        ("Bearer token_tutor_valid_456", "tutor"),
        ("Bearer token_student_valid_789", "student"),
    ])
    def test_verify_token_valid_branches(self, valid_token, expected_role):
        payload = RBACMiddlewareSimulator.verify_token_header(valid_token)
        assert payload["role"] == expected_role

    @pytest.mark.parametrize("invalid_header,expected_msg", [
        (None, "Thiếu Header Authorization Bearer"),
        ("", "Thiếu Header Authorization Bearer"),
        (12345, "Thiếu Header Authorization Bearer"),
        ("Basic admin:123456", "Thiếu Header Authorization Bearer"),
        ("Bearer   ", "Chuỗi token rỗng sau tiền tố Bearer"),
        ("Bearer token_expired_000", "JWT Token đã hết hạn"),
        ("Bearer hacker_tampered_token_999", "Chữ ký Token không hợp lệ"),
    ])
    def test_verify_token_invalid_branches_raise_401(self, invalid_header, expected_msg):
        with pytest.raises(UnauthorizedError, match=expected_msg):
            RBACMiddlewareSimulator.verify_token_header(invalid_header)

    def test_role_guard_invalid_allowed_roles_param(self):
        """Kiểm nghiệm rẽ nhánh tham số allowed_roles không hợp lệ."""
        with pytest.raises(ValueError, match="Danh sách role được cấp phép không được rỗng"):
            RBACMiddlewareSimulator.role_guard("Bearer token_admin_valid_123", [])
        with pytest.raises(ValueError, match="Danh sách role được cấp phép không được rỗng"):
            RBACMiddlewareSimulator.role_guard("Bearer token_admin_valid_123", "admin") # Phải là List

    def test_admin_only_route_blocks_tutor_and_student_with_403(self):
        admin_allowed = ["admin"]
        admin_res = RBACMiddlewareSimulator.role_guard("Bearer token_admin_valid_123", admin_allowed)
        assert admin_res["username"] == "admin_bao"

        with pytest.raises(ForbiddenError, match="Tài khoản role 'tutor' bị từ chối truy cập"):
            RBACMiddlewareSimulator.role_guard("Bearer token_tutor_valid_456", admin_allowed)

        with pytest.raises(ForbiddenError, match="Tài khoản role 'student' bị từ chối truy cập"):
            RBACMiddlewareSimulator.role_guard("Bearer token_student_valid_789", admin_allowed)

    def test_shared_booking_route_for_tutor_and_student(self):
        chat_roles = ["tutor", "student", "admin"]
        tutor_res = RBACMiddlewareSimulator.role_guard("Bearer token_tutor_valid_456", chat_roles)
        student_res = RBACMiddlewareSimulator.role_guard("Bearer token_student_valid_789", chat_roles)
        assert tutor_res["role"] == "tutor"
        assert student_res["role"] == "student"

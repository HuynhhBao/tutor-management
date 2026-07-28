# -*- coding: utf-8 -*-
"""
Module: Tutor Profile & Account Operational State Engine
Quá trình chuyển đổi trạng thái Phê duyệt Hồ sơ (Sơ đồ 2) và Hoạt động Tài khoản Gia sư (Sơ đồ 3).
"""

class IllegalProfileStateException(Exception):
    """Ngoại lệ phát ra khi chuyển đổi trạng thái hồ sơ hoặc tài khoản vi phạm luồng nghiệp vụ."""
    pass


class AccountUnavailableException(Exception):
    """Ngoại lệ phát ra khi gia sư đang trong trạng thái tạm nghỉ hoặc khóa cấm nhận lớp."""
    pass


class TutorApplicationStateMachine:
    """
    Quản lý vòng đời Hồ sơ Đăng ký Gia sư (Sơ đồ 2).
    Các trạng thái: draft -> pending -> approved | rejected_profile -> resubmitted -> pending.
    """

    VALID_APPLICATION_TRANSITIONS = {
        "draft": ["pending"],
        "pending": ["approved", "rejected_profile"],
        "rejected_profile": ["resubmitted"],
        "resubmitted": ["pending"],
        "approved": []  # Hồ sơ đã được duyệt vĩnh viễn
    }

    def __init__(self, application_id: int, tutor_username: str):
        if application_id <= 0 or not tutor_username or not isinstance(tutor_username, str):
            raise ValueError("Mã hồ sơ (application_id) hoặc tài khoản gia sư không hợp lệ")

        self.application_id = application_id
        self.tutor_username = tutor_username
        self.status = "draft"
        self.review_note = ""

    def submit(self) -> str:
        """Gia sư nộp hoặc gửi lại hồ sơ cho Quản trị viên thẩm định."""
        if self.status == "draft" or self.status == "resubmitted":
            self.status = "pending"
            return self.status
        raise IllegalProfileStateException(f"Không thể nộp hồ sơ khi đang ở trạng thái '{self.status}'")

    def review_application(self, decision: str, admin_note: str = "") -> dict:
        """Quản trị viên thẩm định hồ sơ: 'approve' hoặc 'reject'."""
        if self.status != "pending":
            raise IllegalProfileStateException("Chỉ được thẩm định hồ sơ khi đang ở trạng thái 'pending'")

        if decision == "approve":
            self.status = "approved"
            self.review_note = admin_note or "Hồ sơ đủ tiêu chuẩn bằng cấp - Chấp thuận công khai"
        elif decision == "reject":
            if not admin_note:
                raise ValueError("Khi từ chối hồ sơ (reject), bắt buộc phải ghi rõ lý do (admin_note)")
            self.status = "rejected_profile"
            self.review_note = admin_note
        else:
            raise ValueError(f"Quyết định thẩm định '{decision}' không hợp lệ (hỗ trợ: 'approve' hoặc 'reject')")

        return {
            "application_id": self.application_id,
            "status": self.status,
            "review_note": self.review_note
        }

    def resubmit_after_rejection(self, corrections_note: str) -> str:
        """Gia sư chỉnh sửa thông tin và gửi yêu cầu tái xét duyệt sau khi bị từ chối."""
        if self.status != "rejected_profile":
            raise IllegalProfileStateException("Chỉ được sử dụng quyền tái nộp khi hồ sơ ở trạng thái 'rejected_profile'")
        if not corrections_note:
            raise ValueError("Bắt buộc ghi rõ nội dung khắc phục (corrections_note)")

        self.status = "resubmitted"
        self.review_note = corrections_note
        return self.status


class TutorAccountOperationalStateMachine:
    """
    Quản lý vòng đời Hoạt động & Đình chỉ Tài khoản Gia sư (Sơ đồ 3).
    Các trạng thái: active ('Sẵn sàng nhận lớp') <-> inactive ('Tạm nghỉ') -> suspended / banned.
    """

    VALID_ACCOUNT_TRANSITIONS = {
        "active": ["inactive", "suspended", "banned"],
        "inactive": ["active", "suspended", "banned"],
        "suspended": ["active", "banned"],
        "banned": []  # Cấm vĩnh viễn không thể khôi phục
    }

    def __init__(self, tutor_id: int, initial_status: str = "active"):
        if initial_status not in self.VALID_ACCOUNT_TRANSITIONS:
            raise ValueError(f"Trạng thái hoạt động khởi tạo '{initial_status}' không hợp lệ")
        self.tutor_id = tutor_id
        self.status = initial_status

    def set_status(self, new_status: str, actor: str, reason: str = "") -> dict:
        """Thay đổi trạng thái tài khoản công khai của gia sư."""
        if new_status not in self.VALID_ACCOUNT_TRANSITIONS:
            raise ValueError(f"Trạng thái tài khoản '{new_status}' không hợp lệ")
        if new_status not in self.VALID_ACCOUNT_TRANSITIONS[self.status]:
            raise IllegalProfileStateException(
                f"Chuyển trạng thái sai quy tắc: Không thể chuyển từ '{self.status}' sang '{new_status}'"
            )

        # Kiểm soát quyền thay đổi trạng thái hình phạt
        if new_status in ["suspended", "banned"] and actor != "admin":
            raise PermissionError("Chỉ Quản trị viên mới được quyền cấm (banned) hoặc đình chỉ (suspended) tài khoản")

        old_status = self.status
        self.status = new_status

        return {
            "tutor_id": self.tutor_id,
            "previous_status": old_status,
            "new_status": self.status,
            "actor": actor,
            "reason": reason or "Cập nhật trạng thái tài khoản thành công"
        }

    def verify_booking_eligibility(self) -> bool:
        """Kiểm định gia sư có đủ tiêu chuẩn để tiếp nhận ca học từ học viên hay không."""
        if self.status == "active":
            return True
        elif self.status == "inactive":
            raise AccountUnavailableException("Gia sư hiện đang trong trạng thái Tạm nghỉ, từ chối nhận lịch mới")
        else:
            raise AccountUnavailableException(f"Tài khoản gia sư hiện đang bị khóa cấm ('{self.status}'), cấm giao dịch")

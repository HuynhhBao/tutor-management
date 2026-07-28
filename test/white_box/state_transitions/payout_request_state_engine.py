# -*- coding: utf-8 -*-
"""
Module: Payout Request State Engine
Quá trình chuyển đổi trạng thái Yêu cầu Rút Lương Gia Sư và Quản lý số dư (Sơ đồ 4).
"""

class IllegalPayoutStateException(Exception):
    """Ngoại lệ phát ra khi thao tác trên các yêu cầu rút tiền đã khép lại vòng đời."""
    pass


class PayoutRequestStateMachine:
    """
    Quản lý luồng xử lý Rút thu nhập Gia sư (Sơ đồ 4).
    Các trạng thái: pending -> approved | rejected | cancelled.
    """

    VALID_PAYOUT_TRANSITIONS = {
        "pending": ["approved", "rejected", "cancelled"],
        "approved": [],  # Tất toán chuyển khoản thành công vĩnh viễn
        "rejected": [],  # Đã hủy từ chối và hoàn số dư ví
        "cancelled": []  # Gia sư tự hủy lệnh rút
    }

    def __init__(self, payout_id: str, tutor_id: int, amount: int, current_tutor_balance: int):
        if not payout_id or not isinstance(payout_id, str):
            raise ValueError("Mã định danh phiếu rút tiền không được rỗng")
        if amount < 50000:
            raise ValueError("Số tiền xin rút tối thiểu phải từ 50,000 VNĐ")
        if current_tutor_balance < amount:
            raise ValueError("Số dư ví khả dụng hiện tại không đủ để khởi tạo phiếu rút tiền")

        self.payout_id = payout_id
        self.tutor_id = tutor_id
        self.amount = amount
        self.tutor_balance = current_tutor_balance - amount  # Khấu trừ số dư sang đóng băng tạm
        self.frozen_balance = amount
        self.status = "pending"
        self.admin_note = ""

    def process_payout_action(self, action: str, actor: str, note: str = "") -> dict:
        """
        Thao tác trên phiếu rút tiền: 'approve', 'reject' (bởi admin), hoặc 'cancel' (bởi tutor).
        """
        action_map = {
            "approve": "approved",
            "reject": "rejected",
            "cancel": "cancelled"
        }
        if action not in action_map:
            raise ValueError(f"Hành động thao tác '{action}' không hợp lệ")

        target_status = action_map[action]
        allowed = self.VALID_PAYOUT_TRANSITIONS.get(self.status, [])

        if target_status not in allowed:
            raise IllegalPayoutStateException(
                f"Phiếu rút tiền đang ở trạng thái khép kín '{self.status}', không thể tiếp tục thao tác '{action}'"
            )

        # Kiểm soát thẩm quyền thao tác
        if action in ["approve", "reject"] and actor != "admin":
            raise PermissionError("Chỉ có Quản trị viên Tài chính mới được quyền phê duyệt hoặc từ chối")
        if action == "cancel" and actor != "tutor":
            raise PermissionError("Chỉ Gia sư chủ sở hữu phiếu rút mới được quyền hủy lệnh")

        old_status = self.status
        self.status = target_status
        self.admin_note = note

        result = {
            "payout_id": self.payout_id,
            "previous_status": old_status,
            "new_status": self.status,
            "actor": actor,
            "refunded_amount": 0,
            "remaining_frozen": 0,
            "current_tutor_balance": self.tutor_balance,
            "message": ""
        }

        # Quản lý sự chuyển giao và hoàn trả số dư đóng băng
        if self.status == "approved":
            # Chuyển khoản VietQR thành công -> Không hoàn lại ví, xóa cọc đóng băng
            self.frozen_balance = 0
            result["message"] = note or "Phê duyệt thanh toán thành công qua chuyển khoản Ngân hàng"
            result["current_tutor_balance"] = self.tutor_balance
        else:
            # Từ chối (rejected) hoặc tự hủy (cancelled) -> Hoàn lại 100% từ Đóng băng về Số dư Khả dụng
            self.tutor_balance += self.frozen_balance
            result["refunded_amount"] = self.frozen_balance
            self.frozen_balance = 0
            result["current_tutor_balance"] = self.tutor_balance
            if self.status == "rejected":
                result["message"] = note or "Từ chối phiếu rút do sai số tài khoản - Đã hoàn tiền về Ví Gia sư"
            else:
                result["message"] = note or "Gia sư chủ động rút lại yêu cầu - Đã hoàn tiền về Ví Gia sư"

        return result

# -*- coding: utf-8 -*-
"""
Module: Booking State Transition Engine
Quá trình chuyển đổi trạng thái Hợp đồng Đặt lịch, Hủy lịch và Tranh chấp (Sơ đồ 1).
"""

class IllegalStateTransitionException(Exception):
    """Ngoại lệ phát ra khi cố tình chuyển đổi trạng thái hợp đồng phi pháp."""
    pass


class BookingStateMachine:
    """
    Quản lý luồng vòng đời của một Hợp đồng gia sư (Booking) và các hệ quả tài chính.
    Các trạng thái: pending, confirmed, in_progress, completed, cancelled, rejected, disputed, resolved.
    """

    VALID_TRANSITIONS = {
        "pending": ["confirmed", "cancelled", "rejected"],
        "confirmed": ["in_progress", "cancelled", "disputed"],
        "in_progress": ["completed", "disputed"],
        "disputed": ["resolved"],
        "completed": ["disputed"],
        "cancelled": [],
        "rejected": [],
        "resolved": []
    }

    def __init__(self, booking_id: str, student_id: int, tutor_id: int, escrow_amount: int = 100000):
        if not booking_id or not isinstance(booking_id, str):
            raise ValueError("Mã định danh hợp đồng không được rỗng")
        if escrow_amount <= 0:
            raise ValueError("Số tiền cọc bảo chứng Escrow phải lớn hơn 0")

        self.booking_id = booking_id
        self.student_id = student_id
        self.tutor_id = tutor_id
        self.escrow_amount = escrow_amount
        self.status = "pending"
        self.history = [("init", "pending", "Khung cọc khởi tạo")]

    def transition_to(self, new_status: str, actor: str, reason: str = "") -> dict:
        """
        Chuyển trạng thái hợp đồng và tính toán tỷ lệ thanh toán bù trừ hoặc thoái trả cọc.
        Tham số actor: 'student', 'tutor', hoặc 'admin'.
        """
        if new_status not in self.VALID_TRANSITIONS:
            raise ValueError(f"Trạng thái đích '{new_status}' không thuộc định nghĩa hệ thống")
        if not actor or actor not in ["student", "tutor", "admin"]:
            raise ValueError("Quyền thao tác phải thuộc 'student', 'tutor', hoặc 'admin'")

        allowed = self.VALID_TRANSITIONS.get(self.status, [])
        if new_status not in allowed:
            raise IllegalStateTransitionException(
                f"Chuyển đổi trái phép: Không thể dịch chuyển từ '{self.status}' sang '{new_status}'"
            )

        result = {
            "booking_id": self.booking_id,
            "previous_status": self.status,
            "new_status": new_status,
            "actor": actor,
            "refunded_to_student": 0,
            "paid_to_tutor": 0,
            "retained_escrow": self.escrow_amount,
            "reason": reason
        }

        # Kiểm sát quy luật tài chính khi chuyển trạng thái
        if new_status == "cancelled":
            if self.status == "pending":
                # Hủy khi pending -> Hoàn tiền 100% tự động
                result["refunded_to_student"] = self.escrow_amount
                result["retained_escrow"] = 0
                result["reason"] = reason or "Học viên hủy trước khi gia sư xác nhận - Hoàn cọc 100%"
            else:
                # self.status == "confirmed"
                if actor == "admin":
                    # Admin hủy do sự cố bất khả kháng -> Hoàn tiền 100% cho học viên
                    result["refunded_to_student"] = self.escrow_amount
                    result["retained_escrow"] = 0
                    result["reason"] = reason or "Quản trị viên hủy lớp do sự cố - Hoàn tiền 100% tự động"
                else:
                    # Học viên tự hủy khi lớp đã confirmed -> KHÔNG hoàn tiền (Bồi thường gia sư)
                    result["refunded_to_student"] = 0
                    result["paid_to_tutor"] = self.escrow_amount
                    result["retained_escrow"] = 0
                    result["reason"] = reason or "Học viên hủy lớp đã xác nhận - Không hoàn tiền cọc"

        elif new_status == "rejected":
            # Gia sư từ chối khi pending -> Hoàn tiền 100% tự động cho học viên
            result["refunded_to_student"] = self.escrow_amount
            result["retained_escrow"] = 0
            result["reason"] = reason or "Gia sư từ chối ca dạy - Hoàn tiền 100% tự động"

        elif new_status == "completed":
            # Hoàn thành ca học -> Chuyển thanh toán từ Escrow sang gia sư
            result["paid_to_tutor"] = self.escrow_amount
            result["retained_escrow"] = 0
            result["reason"] = reason or "Ca dạy kết thúc thành công - Chuyển lương gia sư"

        elif new_status == "resolved":
            if actor != "admin":
                raise ValueError("Chỉ có quyền Quản trị viên mới được ra quyết định phán quyết giải tỏa tranh chấp")
            # Phán quyết giải quyết tranh chấp
            result["reason"] = reason or "Quản trị viên phán quyết đóng hồ sơ tranh chấp"
        else:
            # Các trạng thái 'confirmed', 'in_progress', 'disputed' không làm biến động số dư cọc ngay
            result["reason"] = reason or f"Chuyển trạng thái sang '{new_status}' thành công"

        # Cập nhật số dư cọc hiện thời và lưu nhật ký trạng thái
        self.escrow_amount = result["retained_escrow"]
        self.history.append((self.status, new_status, result["reason"]))
        self.status = new_status

        return result

    def resolve_dispute_custom_split(self, student_pct: float, tutor_pct: float, admin_note: str = "") -> dict:
        """
        Quyết định phân giải tranh chấp chuyên sâu (Khi status = 'disputed'),
        Admin chỉ định chính xác tỷ lệ hoàn tiền cho Học viên và trả công Gia sư.
        """
        if self.status != "disputed":
            raise IllegalStateTransitionException("Chỉ được phán quyết tỷ lệ chia tiền khi hợp đồng ở trạng thái 'disputed'")
        if abs(student_pct + tutor_pct - 100.0) > 0.001:
            raise ValueError("Tổng tỷ lệ phán quyết chia cho Học viên và Gia sư phải bằng chính xác 100%")

        student_share = int((self.escrow_amount * student_pct) / 100.0)
        tutor_share = self.escrow_amount - student_share

        old_status = self.status
        self.status = "resolved"
        self.escrow_amount = 0
        self.history.append((old_status, "resolved", admin_note or f"Phán quyết tỷ lệ: {student_pct}% / {tutor_pct}%"))

        return {
            "booking_id": self.booking_id,
            "previous_status": old_status,
            "new_status": "resolved",
            "actor": "admin",
            "refunded_to_student": student_share,
            "paid_to_tutor": tutor_share,
            "retained_escrow": 0,
            "reason": admin_note or "Quản trị viên phân chia chi phí tranh chấp"
        }

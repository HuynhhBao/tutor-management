# -*- coding: utf-8 -*-
"""
Module: Escrow Refund & Dispute Resolution Engine
Hệ thống xử lý hoàn tiền quỹ giữ chỗ Escrow và giải quyết tranh chấp khóa học.
"""

class EscrowEngine:
    """Quản lý các trạng thái tiền giữ trong quỹ Escrow của EduMatch."""

    @classmethod
    def process_tutor_response(cls, booking_record: dict, action: str) -> dict:
        """
        Xử lý khi Gia sư Nhận hoặc Từ chối lịch dạy:
        - action = 'confirm' -> Đốc thúc học tập, tiền vẫn giữ tại Escrow.
        - action = 'reject'  -> HOÀN TIỀN 100% TỰ ĐỘNG (Escrow 100% -> Student Wallet).
        """
        if not isinstance(booking_record, dict) or "booking_id" not in booking_record:
            raise ValueError("Hồ sơ booking không hợp lệ")
        if booking_record.get("status") != "pending":
            raise ValueError(f"Chỉ xử lý booking ở trạng thái 'pending', trạng thái hiện tại: {booking_record.get('status')}")
            
        amount = booking_record.get("escrow_amount", 0)
        if not isinstance(amount, (int, float)) or amount <= 0:
            raise ValueError("Số tiền escrow trong booking không hợp lệ")

        if action == "confirm":
            booking_record["status"] = "confirmed"
            return {
                "booking_id": booking_record["booking_id"],
                "status": "confirmed",
                "refunded_to_student": 0,
                "retained_in_escrow": amount,
                "message": "Gia sư đã đồng ý, hóa đơn chuyển sang trạng thái đã chốt."
            }
        elif action == "reject":
            # TỰ ĐỘNG HOÀN TRẢ 100% QUỸ ESCROW VỀ VÍ HỌC VIÊN
            booking_record["status"] = "rejected"
            booking_record["escrow_amount"] = 0
            return {
                "booking_id": booking_record["booking_id"],
                "status": "rejected",
                "refunded_to_student": amount,
                "retained_in_escrow": 0,
                "message": "Gia sư từ chối lớp. Đã tự động hoàn trả 100% số tiền Escrow về Ví Học Viên."
            }
        else:
            raise ValueError("Action không hỗ trợ (Chỉ nhận 'confirm' hoặc 'reject')")

    @classmethod
    def resolve_dispute(cls, booking_record: dict, student_refund_percent: float, tutor_payout_percent: float) -> dict:
        """
        Xử lý Tranh chấp giữa chừng khi lớp bị hủy do khiếu nại chất lượng:
        - Admin quyết định tỷ lệ chia tiền trả Học viên vs Gia sư (Tổng phải = 100%).
        """
        if not isinstance(booking_record, dict) or "booking_id" not in booking_record:
            raise ValueError("Hồ sơ booking không hợp lệ")
        if booking_record.get("status") not in ["confirmed", "in_dispute"]:
            raise ValueError("Chỉ giải quyết tranh chấp cho lớp đang diễn ra hoặc đang khiếu nại")
            
        if abs(student_refund_percent + tutor_payout_percent - 100.0) > 0.001:
            raise ValueError("Tổng tỷ lệ chia cho Học viên và Gia sư phải bằng chính xác 100%")
            
        amount = booking_record.get("escrow_amount", 0)
        if amount <= 0:
            raise ValueError("Số tiền trong Escrow bằng 0, không thể chia")

        student_share = int((amount * student_refund_percent) / 100.0)
        tutor_share = int(amount) - student_share  # Phần còn lại để tránh lệch số lẻ 1 đồng

        booking_record["status"] = "resolved_dispute"
        booking_record["escrow_amount"] = 0

        return {
            "booking_id": booking_record["booking_id"],
            "status": "resolved_dispute",
            "student_refund_amount": student_share,
            "tutor_payout_amount": tutor_share,
            "message": f"Tranh chấp hoàn tất. Học viên nhận {student_refund_percent}%, Gia sư nhận {tutor_payout_percent}%."
        }

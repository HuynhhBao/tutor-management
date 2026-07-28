# -*- coding: utf-8 -*-
"""
White-box Unit Tests: Escrow Automatic 100% Refund & Dispute Resolutions (100% Coverage)
"""
import pytest
from escrow_engine import EscrowEngine

class TestEscrowRefundAlgorithms:
    """Bộ kiểm thử cho các luồng rẽ nhánh Escrow Hoàn tiền và Giải quyết tranh chấp."""

    def test_process_tutor_confirm_booking_keeps_escrow(self):
        booking = {"booking_id": "b_101", "status": "pending", "escrow_amount": 500000}
        res = EscrowEngine.process_tutor_response(booking, "confirm")
        assert res["status"] == "confirmed"
        assert res["refunded_to_student"] == 0
        assert res["retained_in_escrow"] == 500000
        assert booking["status"] == "confirmed"

    def test_process_tutor_reject_booking_triggers_100_percent_automatic_refund(self):
        """[QUAN TRỌNG] Kiểm nghiệm khi Gia sư từ chối -> tự động hoàn trả 100% số tiền về Ví Học Viên."""
        booking = {"booking_id": "b_102", "status": "pending", "escrow_amount": 800000}
        res = EscrowEngine.process_tutor_response(booking, "reject")
        assert res["status"] == "rejected"
        assert res["refunded_to_student"] == 800000
        assert res["retained_in_escrow"] == 0
        assert booking["escrow_amount"] == 0

    @pytest.mark.parametrize("invalid_booking,action,expected_msg", [
        (None, "confirm", "Hồ sơ booking không hợp lệ"),
        ({"status": "confirmed", "escrow_amount": 500000, "booking_id": "b_1"}, "confirm", "Chỉ xử lý booking ở trạng thái 'pending'"),
        ({"booking_id": "b_2", "status": "pending", "escrow_amount": -100}, "confirm", "Số tiền escrow trong booking không hợp lệ"),
        ({"booking_id": "b_3", "status": "pending", "escrow_amount": 0}, "reject", "Số tiền escrow trong booking không hợp lệ"),
        ({"booking_id": "b_4", "status": "pending", "escrow_amount": 500000}, "ignore", "Action không hỗ trợ"),
    ])
    def test_process_tutor_response_invalid_branches(self, invalid_booking, action, expected_msg):
        with pytest.raises(ValueError, match=expected_msg):
            EscrowEngine.process_tutor_response(invalid_booking, action)

    @pytest.mark.parametrize("stu_pct,tutor_pct,expected_stu_val,expected_tutor_val", [
        (50.0, 50.0, 500000, 500000),      # Chia đều 50/50
        (100.0, 0.0, 1000000, 0),          # Hoàn toàn bộ cho học viên do gia sư vi phạm
        (0.0, 100.0, 0, 1000000),          # Thanh toán toàn bộ cho gia sư do học viên vi phạm
        (33.333, 66.667, 333330, 666670),  # Số lẻ thập phân không lệch 1 đồng nào
    ])
    def test_resolve_dispute_splitting_accuracy(self, stu_pct, tutor_pct, expected_stu_val, expected_tutor_val):
        booking = {"booking_id": "d_201", "status": "in_dispute", "escrow_amount": 1000000}
        res = EscrowEngine.resolve_dispute(booking, stu_pct, tutor_pct)
        assert res["student_refund_amount"] == expected_stu_val
        assert res["tutor_payout_amount"] == expected_tutor_val
        assert res["student_refund_amount"] + res["tutor_payout_amount"] == 1000000
        assert booking["status"] == "resolved_dispute"

    @pytest.mark.parametrize("invalid_b,stu_pct,tutor_pct,err_msg", [
        ("not_dict", 50.0, 50.0, "Hồ sơ booking không hợp lệ"),
        ({"booking_id": "b_1", "status": "completed"}, 50.0, 50.0, "Chỉ giải quyết tranh chấp cho lớp đang diễn ra"),
        ({"booking_id": "b_1", "status": "in_dispute", "escrow_amount": 500000}, 60.0, 50.0, "Tổng tỷ lệ chia cho Học viên và Gia sư phải bằng chính xác 100%"),
        ({"booking_id": "b_1", "status": "in_dispute", "escrow_amount": 0}, 50.0, 50.0, "Số tiền trong Escrow bằng 0, không thể chia"),
    ])
    def test_resolve_dispute_invalid_branches(self, invalid_b, stu_pct, tutor_pct, err_msg):
        with pytest.raises(ValueError, match=err_msg):
            EscrowEngine.resolve_dispute(invalid_b, stu_pct, tutor_pct)

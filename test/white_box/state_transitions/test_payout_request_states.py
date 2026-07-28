# -*- coding: utf-8 -*-
"""
Module Test: Payout Request State Engine
Kiểm nghiệm 100% Statement & Branch Coverage cho Sơ đồ 4 (Yêu cầu Rút Lương & Đóng băng số dư).
"""
import pytest
from test.white_box.state_transitions.payout_request_state_engine import (
    PayoutRequestStateMachine,
    IllegalPayoutStateException
)

class TestPayoutRequestStates:
    """Bộ kiểm thử Hộp trắng cho vòng đời Rút thu nhập Gia sư (Sơ đồ 4)."""

    def test_init_invalid_args_raises_error(self):
        """Kiểm chứng các lỗi khởi tạo phiếu rút tiền."""
        with pytest.raises(ValueError, match="Mã định danh phiếu rút tiền không được rỗng"):
            PayoutRequestStateMachine("", 10, 100000, 500000)
        with pytest.raises(ValueError, match="Mã định danh phiếu rút tiền không được rỗng"):
            PayoutRequestStateMachine(None, 10, 100000, 500000)
        with pytest.raises(ValueError, match="Số tiền xin rút tối thiểu phải từ 50,000 VNĐ"):
            PayoutRequestStateMachine("PAY_01", 10, 49999, 500000)
        with pytest.raises(ValueError, match="Số dư ví khả dụng hiện tại không đủ để khởi tạo phiếu rút tiền"):
            PayoutRequestStateMachine("PAY_02", 10, 600000, 500000)

    def test_init_valid_freezes_balance(self):
        """Kiểm tra phiếu rút hợp lệ ngay lập tức đóng băng số dư khả dụng."""
        engine = PayoutRequestStateMachine("PAY_100", 50, 200000, 1000000)
        assert engine.status == "pending"
        assert engine.frozen_balance == 200000
        assert engine.tutor_balance == 800000  # 1,000,000 - 200,000

    def test_payout_approval_by_admin(self):
        """Kiểm thử Admin phê duyệt chuyển khoản VietQR thành công."""
        engine = PayoutRequestStateMachine("PAY_101", 50, 300000, 1000000)
        res = engine.process_payout_action("approve", actor="admin", note="Chuyển khoản thành công lệnh #999")
        assert res["new_status"] == "approved"
        assert res["refunded_amount"] == 0
        assert engine.frozen_balance == 0
        assert engine.tutor_balance == 700000  # Số dư duy trì ở mức sau đóng băng
        assert "Chuyển khoản thành công" in res["message"]

    def test_payout_rejection_by_admin_auto_refunds(self):
        """Kiểm thử Admin từ chối phiếu rút: Hoàn lại 100% số dư đóng băng cho gia sư."""
        engine = PayoutRequestStateMachine("PAY_102", 51, 400000, 1000000)
        res = engine.process_payout_action("reject", actor="admin", note="Tên chủ tài khoản ngân hàng không khớp")
        assert res["new_status"] == "rejected"
        assert res["refunded_amount"] == 400000
        assert engine.frozen_balance == 0
        assert engine.tutor_balance == 1000000  # 600,000 + 400,000 refunded!
        assert "Tên chủ tài khoản" in res["message"]

    def test_payout_cancellation_by_tutor_auto_refunds(self):
        """Kiểm thử Gia sư chủ động hủy lệnh rút khi đang 'pending': Hoàn số dư ngay lập tức."""
        engine = PayoutRequestStateMachine("PAY_103", 52, 150000, 500000)
        res = engine.process_payout_action("cancel", actor="tutor", note="Hủy để dồn rút cả tháng")
        assert res["new_status"] == "cancelled"
        assert res["refunded_amount"] == 150000
        assert engine.tutor_balance == 500000
        assert "Hủy để dồn" in res["message"]

    def test_default_notes_for_reject_and_cancel(self):
        """Kiểm thử thông báo mặc định khi reject hoặc cancel không kèm note riêng."""
        e1 = PayoutRequestStateMachine("PAY_104", 53, 100000, 200000)
        r1 = e1.process_payout_action("reject", actor="admin", note="")
        assert r1["message"] == "Từ chối phiếu rút do sai số tài khoản - Đã hoàn tiền về Ví Gia sư"

        e2 = PayoutRequestStateMachine("PAY_105", 54, 100000, 200000)
        r2 = e2.process_payout_action("cancel", actor="tutor", note="")
        assert r2["message"] == "Gia sư chủ động rút lại yêu cầu - Đã hoàn tiền về Ví Gia sư"
        
        e3 = PayoutRequestStateMachine("PAY_106", 55, 100000, 200000)
        r3 = e3.process_payout_action("approve", actor="admin", note="")
        assert r3["message"] == "Phê duyệt thanh toán thành công qua chuyển khoản Ngân hàng"

    def test_permission_and_illegal_state_errors(self):
        """Kiểm thử vi phạm phân quyền và thao tác trên phiếu rút đã khép kín."""
        engine = PayoutRequestStateMachine("PAY_107", 60, 200000, 500000)
        
        # Thao tác không thuộc từ điển hệ thống
        with pytest.raises(ValueError, match="Hành động thao tác 'delete' không hợp lệ"):
            engine.process_payout_action("delete", actor="admin")

        # Gia sư tự phê duyệt hoặc tự từ chối đơn
        with pytest.raises(PermissionError, match="Chỉ có Quản trị viên Tài chính mới được quyền phê duyệt hoặc từ chối"):
            engine.process_payout_action("approve", actor="tutor")
        with pytest.raises(PermissionError, match="Chỉ có Quản trị viên Tài chính mới được quyền phê duyệt hoặc từ chối"):
            engine.process_payout_action("reject", actor="tutor")
            
        # Admin hoặc hacker cố hủy đơn của gia sư (thay vì reject)
        with pytest.raises(PermissionError, match="Chỉ Gia sư chủ sở hữu phiếu rút mới được quyền hủy lệnh"):
            engine.process_payout_action("cancel", actor="admin")

        # Hoàn tất phê duyệt
        engine.process_payout_action("approve", actor="admin")

        # Thử hủy hoặc approve lần 2 sau khi đơn đã approved
        with pytest.raises(IllegalPayoutStateException, match="Phiếu rút tiền đang ở trạng thái khép kín 'approved'.*"):
            engine.process_payout_action("approve", actor="admin")
        with pytest.raises(IllegalPayoutStateException, match="Phiếu rút tiền đang ở trạng thái khép kín 'approved'.*"):
            engine.process_payout_action("reject", actor="admin")

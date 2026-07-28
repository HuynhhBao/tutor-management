# -*- coding: utf-8 -*-
"""
Module Test: Booking State Transition Engine
Kiểm nghiệm 100% Statement & Branch Coverage cho Sơ đồ 1 (Đặt lịch, Hủy lịch & Tranh chấp).
"""
import pytest
from test.white_box.state_transitions.booking_state_engine import (
    BookingStateMachine,
    IllegalStateTransitionException
)

class TestBookingStateTransitions:
    """Bộ kiểm thử Hộp trắng trọn vẹn luồng chuyển đổi trạng thái hợp đồng Booking."""

    def test_init_invalid_args_raises_error(self):
        """Kiểm chứng các nhánh khởi tạo với tham số không hợp lệ."""
        with pytest.raises(ValueError, match="Mã định danh hợp đồng không được rỗng"):
            BookingStateMachine("", 1, 2)
        with pytest.raises(ValueError, match="Mã định danh hợp đồng không được rỗng"):
            BookingStateMachine(None, 1, 2)
        with pytest.raises(ValueError, match="Số tiền cọc bảo chứng Escrow phải lớn hơn 0"):
            BookingStateMachine("BK_01", 1, 2, escrow_amount=0)
        with pytest.raises(ValueError, match="Số tiền cọc bảo chứng Escrow phải lớn hơn 0"):
            BookingStateMachine("BK_02", 101, 201, escrow_amount=-50000)

    def test_init_valid_defaults(self):
        """Kiểm tra giá trị mặc định của một hợp đồng hợp lệ."""
        engine = BookingStateMachine("BK_100", 10, 20, 100000)
        assert engine.status == "pending"
        assert engine.escrow_amount == 100000
        assert len(engine.history) == 1
        assert engine.history[0] == ("init", "pending", "Khung cọc khởi tạo")

    def test_transition_invalid_arguments_or_illegal_path(self):
        """Kiểm chứng các lỗi do sai tham số thao tác hoặc chuyển trạng thái cấm."""
        engine = BookingStateMachine("BK_101", 10, 20)
        
        # Trạng thái đích không tồn tại
        with pytest.raises(ValueError, match="Trạng thái đích 'unknown_state' không thuộc định nghĩa hệ thống"):
            engine.transition_to("unknown_state", "student")
            
        # Quyền thao tác actor không hợp lệ
        with pytest.raises(ValueError, match="Quyền thao tác phải thuộc 'student', 'tutor', hoặc 'admin'"):
            engine.transition_to("confirmed", "hacker")
        with pytest.raises(ValueError, match="Quyền thao tác phải thuộc 'student', 'tutor', hoặc 'admin'"):
            engine.transition_to("confirmed", "")

        # Chuyển đổi trái phép: từ 'pending' không thể đi thẳng tới 'completed'
        with pytest.raises(IllegalStateTransitionException, match="Chuyển đổi trái phép: Không thể dịch chuyển từ 'pending' sang 'completed'"):
            engine.transition_to("completed", "admin")

    def test_cancel_from_pending_auto_refund_100(self):
        """Kiểm thử nhánh học viên/admin hủy lớp khi đang 'pending': Hoàn 100% tiền cọc."""
        engine = BookingStateMachine("BK_102", 10, 20, 100000)
        res = engine.transition_to("cancelled", actor="student")
        assert res["previous_status"] == "pending"
        assert res["new_status"] == "cancelled"
        assert res["refunded_to_student"] == 100000
        assert res["paid_to_tutor"] == 0
        assert engine.escrow_amount == 0
        assert "Hoàn cọc 100%" in res["reason"]

        # Sau khi đã cancelled, không thể dịch chuyển sang trạng thái nào nữa
        with pytest.raises(IllegalStateTransitionException, match="Chuyển đổi trái phép: Không thể dịch chuyển từ 'cancelled' sang 'confirmed'"):
            engine.transition_to("confirmed", "tutor")

    def test_reject_from_pending_auto_refund_100(self):
        """Kiểm thử nhánh gia sư từ chối (reject) khi 'pending': Hoàn 100% cho học viên."""
        engine = BookingStateMachine("BK_103", 10, 20, 150000)
        res = engine.transition_to("rejected", actor="tutor", reason="Gia sư trùng lịch xuất ký")
        assert res["new_status"] == "rejected"
        assert res["refunded_to_student"] == 150000
        assert engine.escrow_amount == 0

    def test_cancel_from_confirmed_student_vs_admin(self):
        """Kiểm thử 2 nhánh hủy lớp khi đã 'confirmed': Học viên hủy vs Admin hủy."""
        # Nhánh 1: Học viên tự hủy -> Không hoàn tiền (Bồi thường gia sư)
        engine_stu = BookingStateMachine("BK_104", 10, 20, 100000)
        engine_stu.transition_to("confirmed", actor="tutor")
        res_stu = engine_stu.transition_to("cancelled", actor="student")
        assert res_stu["refunded_to_student"] == 0
        assert res_stu["paid_to_tutor"] == 100000
        assert "Không hoàn tiền cọc" in res_stu["reason"]

        # Nhánh 2: Admin hủy do sự cố -> Hoàn tiền 100% tự động
        engine_adm = BookingStateMachine("BK_105", 10, 20, 200000)
        engine_adm.transition_to("confirmed", actor="tutor")
        res_adm = engine_adm.transition_to("cancelled", actor="admin")
        assert res_adm["refunded_to_student"] == 200000
        assert res_adm["paid_to_tutor"] == 0
        assert "Hoàn tiền 100% tự động" in res_adm["reason"]

    def test_happy_path_completed(self):
        """Kiểm thử chu trình trọn vẹn thành công: pending -> confirmed -> in_progress -> completed."""
        engine = BookingStateMachine("BK_106", 10, 20, 300000)
        res_conf = engine.transition_to("confirmed", actor="tutor")
        assert "Chuyển trạng thái sang" in res_conf["reason"]
        engine.transition_to("in_progress", actor="tutor", reason="Phòng học đã mở")
        res_comp = engine.transition_to("completed", actor="admin")
        assert res_comp["paid_to_tutor"] == 300000
        assert res_comp["retained_escrow"] == 0
        assert engine.status == "completed"
        # Đã completed, thử chuyển sang disputed
        engine.transition_to("disputed", actor="student", reason="Gia sư mở lại khiếu nại")
        assert engine.status == "disputed"

    def test_dispute_and_admin_resolved(self):
        """Kiểm thử luồng tranh chấp: confirmed -> disputed -> resolved qua hàm transition_to thông thường."""
        engine = BookingStateMachine("BK_107", 10, 20, 120000)
        engine.transition_to("confirmed", actor="tutor")
        engine.transition_to("disputed", actor="student", reason="Gia sư vắng mặt không thông báo")
        assert engine.status == "disputed"
        
        # Thử actor không phải admin ra phán quyết -> Bị cấm
        with pytest.raises(ValueError, match="Chỉ có quyền Quản trị viên mới được ra quyết định phán quyết giải tỏa tranh chấp"):
            engine.transition_to("resolved", actor="student")
            
        # Admin ra quyết định đóng tranh chấp
        res_res = engine.transition_to("resolved", actor="admin")
        assert engine.status == "resolved"
        assert "Quản trị viên phán quyết" in res_res["reason"]

    def test_resolve_dispute_custom_split_branches(self):
        """Kiểm thử hàm ra quyết định chia tiền cọc tùy biến khi xảy ra tranh chấp."""
        engine = BookingStateMachine("BK_108", 10, 20, 200000)
        
        # Gọi chia tiền khi chưa ở trạng thái 'disputed'
        with pytest.raises(IllegalStateTransitionException, match="Chỉ được phán quyết tỷ lệ chia tiền khi hợp đồng ở trạng thái 'disputed'"):
            engine.resolve_dispute_custom_split(50.0, 50.0)

        # Chuyển sang disputed từ in_progress
        engine.transition_to("confirmed", actor="tutor")
        engine.transition_to("in_progress", actor="tutor")
        engine.transition_to("disputed", actor="tutor", reason="Mất kết nối Internet gian đoạn")

        # Gọi chia tiền với tổng tỷ lệ không bằng 100%
        with pytest.raises(ValueError, match="Tổng tỷ lệ phán quyết chia cho Học viên và Gia sư phải bằng chính xác 100%"):
            engine.resolve_dispute_custom_split(60.0, 30.0)

        # Quyết định phán quyết hợp lệ: 70% hoàn Học viên, 30% trả Gia sư
        res = engine.resolve_dispute_custom_split(70.0, 30.0, admin_note="Lỗi đường truyền từ phía Gia sư")
        assert res["new_status"] == "resolved"
        assert res["refunded_to_student"] == 140000  # 70% of 200,000
        assert res["paid_to_tutor"] == 60000         # 30% of 200,000
        assert engine.escrow_amount == 0
        assert "Lỗi đường truyền" in res["reason"]

        # Kiểm thử mờ định admin_note rỗng
        engine_empty = BookingStateMachine("BK_109", 10, 20, 100000)
        engine_empty.transition_to("confirmed", actor="tutor")
        engine_empty.transition_to("disputed", actor="student")
        res2 = engine_empty.resolve_dispute_custom_split(50.0, 50.0, admin_note="")
        assert res2["reason"] == "Quản trị viên phân chia chi phí tranh chấp"
        assert engine_empty.history[-1][2] == "Phán quyết tỷ lệ: 50.0% / 50.0%"

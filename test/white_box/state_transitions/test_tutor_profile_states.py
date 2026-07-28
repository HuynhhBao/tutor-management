# -*- coding: utf-8 -*-
"""
Module Test: Tutor Profile & Account Operational State Engine
Kiểm nghiệm 100% Statement & Branch Coverage cho Sơ đồ 2 (Phê duyệt) và Sơ đồ 3 (Hoạt động tài khoản).
"""
import pytest
from test.white_box.state_transitions.tutor_profile_state_engine import (
    TutorApplicationStateMachine,
    TutorAccountOperationalStateMachine,
    IllegalProfileStateException,
    AccountUnavailableException
)

class TestTutorApplicationStateMachine:
    """Bộ kiểm thử Hộp trắng cho vòng đời Duyệt Hồ sơ Gia sư (Sơ đồ 2)."""

    def test_init_invalid_args_raises(self):
        """Kiểm thử nhánh lỗi khởi tạo."""
        with pytest.raises(ValueError, match="Mã hồ sơ.*hoặc tài khoản gia sư không hợp lệ"):
            TutorApplicationStateMachine(0, "user_tutor")
        with pytest.raises(ValueError, match="Mã hồ sơ.*hoặc tài khoản gia sư không hợp lệ"):
            TutorApplicationStateMachine(-5, "user_tutor")
        with pytest.raises(ValueError, match="Mã hồ sơ.*hoặc tài khoản gia sư không hợp lệ"):
            TutorApplicationStateMachine(1, "")
        with pytest.raises(ValueError, match="Mã hồ sơ.*hoặc tài khoản gia sư không hợp lệ"):
            TutorApplicationStateMachine(1, None)

    def test_valid_approval_flow(self):
        """Kiểm thử chu trình nộp hồ sơ và được Admin chấp thuận."""
        app = TutorApplicationStateMachine(1, "tutor_math")
        assert app.status == "draft"
        
        status_after = app.submit()
        assert status_after == "pending"
        assert app.status == "pending"
        
        # Admin duyệt
        res = app.review_application("approve", admin_note="Bằng Tiến sĩ Sư phạm Toán hợp lệ")
        assert res["status"] == "approved"
        assert app.status == "approved"

    def test_rejection_and_resubmission_flow(self):
        """Kiểm thử chu trình từ chối, khắc phục lỗi và nộp quay vòng."""
        app = TutorApplicationStateMachine(2, "tutor_physics")
        app.submit()
        
        # Từ chối nhưng quên nhập lý do
        with pytest.raises(ValueError, match="Khi từ chối hồ sơ.*bắt buộc phải ghi rõ lý do"):
            app.review_application("reject", admin_note="")
            
        # Từ chối hợp lệ
        res_rej = app.review_application("reject", admin_note="Ảnh thẻ bị mờ, bằng tốt nghiệp thiếu dấu giáp lai")
        assert res_rej["status"] == "rejected_profile"
        assert app.status == "rejected_profile"

        # Cố nộp lại (submit trực tiếp) khi chưa gọi hàm bổ sung giải trình
        with pytest.raises(IllegalProfileStateException, match="Không thể nộp hồ sơ khi đang ở trạng thái 'rejected_profile'"):
            app.submit()

        # Bổ sung giải trình tái nộp nhưng rỗng nội dung
        with pytest.raises(ValueError, match="Bắt buộc ghi rõ nội dung khắc phục"):
            app.resubmit_after_rejection("")

        # Tái nộp hợp lệ
        res_sub = app.resubmit_after_rejection("Đã tải lại ảnh chân dung sắc nét và công chứng bằng cấp")
        assert res_sub == "resubmitted"
        assert app.status == "resubmitted"

        # Nộp từ trạng thái resubmitted
        assert app.submit() == "pending"
        # Admin duyệt lần 2 không cần note riêng
        res_app2 = app.review_application("approve", admin_note="")
        assert res_app2["review_note"] == "Hồ sơ đủ tiêu chuẩn bằng cấp - Chấp thuận công khai"
        assert app.status == "approved"

    def test_illegal_profile_review_branches(self):
        """Kiểm thử các thao tác trái phép trên trạng thái hồ sơ."""
        app = TutorApplicationStateMachine(3, "tutor_english")
        
        # Thẩm định khi hồ sơ đang draft (chưa nộp)
        with pytest.raises(IllegalProfileStateException, match="Chỉ được thẩm định hồ sơ khi đang ở trạng thái 'pending'"):
            app.review_application("approve")

        # Quyết định không thuộc hỗ trợ (ngoài approve / reject)
        app.submit()
        with pytest.raises(ValueError, match="Quyết định thẩm định 'unknown_action' không hợp lệ"):
            app.review_application("unknown_action")

        # Thử tái nộp (resubmit_after_rejection) khi chưa bị từ chối
        with pytest.raises(IllegalProfileStateException, match="Chỉ được sử dụng quyền tái nộp khi hồ sơ ở trạng thái 'rejected_profile'"):
            app.resubmit_after_rejection("Ghi chú thừa")


class TestTutorAccountOperationalStateMachine:
    """Bộ kiểm thử Hộp trắng cho vòng đời Hoạt động Tài khoản Gia sư (Sơ đồ 3)."""

    def test_init_and_eligibility_check(self):
        """Kiểm định khởi tạo và kiểm tra khả năng tiếp nhận lớp học."""
        with pytest.raises(ValueError, match="Trạng thái hoạt động khởi tạo 'unknown' không hợp lệ"):
            TutorAccountOperationalStateMachine(100, initial_status="unknown")
            
        account = TutorAccountOperationalStateMachine(101, "active")
        assert account.verify_booking_eligibility() is True

    def test_tutor_toggle_inactive_status(self):
        """Kiểm thử gia sư tự thay đổi trạng thái sang Tạm nghỉ và Khôi phục."""
        account = TutorAccountOperationalStateMachine(102, "active")
        
        # Chuyển sang tạm nghỉ
        res = account.set_status("inactive", actor="tutor", reason="Bận thi cử 1 tuần")
        assert res["new_status"] == "inactive"
        assert account.status == "inactive"

        # Kiểm sát quyền nhận lớp khi inactive
        with pytest.raises(AccountUnavailableException, match="Gia sư hiện đang trong trạng thái Tạm nghỉ, từ chối nhận lịch mới"):
            account.verify_booking_eligibility()

        # Khôi phục về active
        account.set_status("active", actor="tutor", reason="")
        assert account.verify_booking_eligibility() is True

    def test_admin_suspensions_and_bans_enforcement(self):
        """Kiểm thử án phạt cấm/đình chỉ từ Ban quản trị."""
        account = TutorAccountOperationalStateMachine(103, "active")

        # Gia sư tự chuyển tài khoản thành banned -> Cấm thao tác hình phạt
        with pytest.raises(PermissionError, match="Chỉ Quản trị viên mới được quyền cấm.*"):
            account.set_status("banned", actor="tutor")

        # Admin định chỉ tài khoản
        account.set_status("suspended", actor="admin", reason="Bị tố cáo đi muộn 3 lần liên tiếp")
        assert account.status == "suspended"
        
        # Kiểm tra trạng thái bị cấm gia sư
        with pytest.raises(AccountUnavailableException, match="Tài khoản gia sư hiện đang bị khóa cấm.*"):
            account.verify_booking_eligibility()

        # Admin gỡ án đình chỉ về active
        account.set_status("active", actor="admin")
        assert account.status == "active"

        # Admin cấm vĩnh viễn
        account.set_status("banned", actor="admin", reason="Sử dụng bằng giả mạo")
        assert account.status == "banned"

        # Thử khôi phục từ trạng thái banned -> Cấm chuyển
        with pytest.raises(IllegalProfileStateException, match="Chuyển trạng thái sai quy tắc: Không thể chuyển từ 'banned' sang 'active'"):
            account.set_status("active", actor="admin")
            
        # Thử trạng thái đích không hợp lệ
        with pytest.raises(ValueError, match="Trạng thái tài khoản 'super_admin' không hợp lệ"):
            account.set_status("super_admin", actor="admin")

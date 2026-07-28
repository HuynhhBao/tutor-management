# -*- coding: utf-8 -*-
"""
White-box Unit Tests: Virtual Classroom Billing Time Engine (100% Branch Coverage)
"""
import pytest
from classroom_engine import ClassroomEngine

class TestClassroomBillingTime:
    """Bộ kiểm thử rãnh chiết tính giờ học cho Phòng Học Ảo EduMatch."""

    def test_short_session_under_15_mins_zero_billing(self):
        start_ts = 1700000000.0
        end_ts = 1700000600.0  # 10 phút (600 giây)
        res = ClassroomEngine.calculate_billable_payout(start_ts, end_ts, hourly_rate_vnd=200000)
        assert res["duration_minutes"] == 10.0
        assert res["billed_hours"] == 0.0
        assert res["total_payout_vnd"] == 0
        assert "Grace Period" in res["message"]

    @pytest.mark.parametrize("duration_secs,rate,expected_hours,expected_payout", [
        (3600.0, 200000, 1.0, 200000),      # Đúng 60 phút -> 1.0 giờ
        (3000.0, 300000, 1.0, 300000),      # 50 phút -> Làm tròn lên 4 block 15p = 1.0 giờ
        (1200.0, 250000, 0.5, 125000),      # 20 phút -> Làm tròn lên 2 block 15p = 0.5 giờ
        (5400.0, 400000, 1.5, 600000),      # 90 phút -> Đúng 1.5 giờ
    ])
    def test_valid_billing_durations_with_rounding(self, duration_secs, rate, expected_hours, expected_payout):
        start_ts = 1700000000.0
        res = ClassroomEngine.calculate_billable_payout(start_ts, start_ts + duration_secs, hourly_rate_vnd=rate)
        assert res["billed_hours"] == expected_hours
        assert res["total_payout_vnd"] == expected_payout
        assert "Tính công giảng dạy thành công" in res["message"]

    def test_exceeding_max_session_12_hours_raises_error(self):
        start_ts = 1700000000.0
        end_ts = start_ts + (13 * 3600)  # 13 tiếng
        with pytest.raises(ValueError, match="Thời gian một ca học không được vượt quá 12 tiếng"):
            ClassroomEngine.calculate_billable_payout(start_ts, end_ts, 200000)

    @pytest.mark.parametrize("start,end,rate,err_msg", [
        ("17000", 17001, 200000, "Mốc thời gian phải là định dạng nhị phân số hợp lệ"),
        (17000, "17001", 200000, "Mốc thời gian phải là định dạng nhị phân số hợp lệ"),
        (17001, 17000, 200000, "Thời gian kết thúc phải diễn ra sau thời gian bắt đầu"),
        (17000, 17000, 200000, "Thời gian kết thúc phải diễn ra sau thời gian bắt đầu"),
        (17000, 18000, -100, "Học phí theo giờ phải là số tự nhiên dương"),
        (17000, 18000, "200000", "Học phí theo giờ phải là số tự nhiên dương"),
    ])
    def test_invalid_arguments_raise_exceptions(self, start, end, rate, err_msg):
        with pytest.raises(ValueError, match=err_msg):
            ClassroomEngine.calculate_billable_payout(start, end, rate)

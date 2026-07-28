# -*- coding: utf-8 -*-
"""
White-box Unit Tests: Financial Commission Calculations (100% Branch Coverage)
"""
import pytest
from finance_engine import FinanceEngine

class TestCommissionCalculations:
    """Bộ Unit Test kiểm nghiệm độ chuẩn xác và rẽ nhánh của thuật toán tính phí Gia Sư."""

    @pytest.mark.parametrize("gross,rate,expected_tutor,expected_platform", [
        (300000, 15.0, 255000, 45000),      # Standard 15% commission
        (500000, 20.0, 400000, 100000),     # 20% tier commission
        (250000, 0.0, 250000, 0),           # 0% promotional tier (Gia sư hưởng trọn 100%)
        (1000000, 12.5, 875000, 125000),    # Tỷ lệ thập phân 12.5%
        (333333, 10.0, 300000, 33333),      # Làm tròn kế toán cho số tiền lẻ (33,333.3 VND -> 33,333)
    ])
    def test_calculate_payout_valid_branches(self, gross, rate, expected_tutor, expected_platform):
        result = FinanceEngine.calculate_payout(gross, rate)
        assert result["tutor_net_payout"] == expected_tutor
        assert result["platform_commission"] == expected_platform
        assert result["tutor_net_payout"] + result["platform_commission"] == gross

    def test_floating_point_precision_invariance(self):
        result = FinanceEngine.calculate_payout(299999, 15.0)
        assert result["platform_commission"] + result["tutor_net_payout"] == 299999
        assert result["tutor_net_payout"] > 0

    @pytest.mark.parametrize("invalid_gross,invalid_rate,error_msg", [
        (0, 15.0, "Tổng doanh thu phải là số dương lớn hơn 0"),
        (-500000, 15.0, "Tổng doanh thu phải là số dương lớn hơn 0"),
        ("300000", 15.0, "Tổng doanh thu phải là số dương lớn hơn 0"),
        (500000, -5.0, "Tỷ lệ hoa hồng phải nằm trong khoảng từ 0% đến 100%"),
        (500000, 105.0, "Tỷ lệ hoa hồng phải nằm trong khoảng từ 0% đến 100%"),
        (500000, "15.0", "Tỷ lệ hoa hồng phải nằm trong khoảng từ 0% đến 100%"),
    ])
    def test_invalid_arguments_raise_exceptions(self, invalid_gross, invalid_rate, error_msg):
        with pytest.raises(ValueError, match=error_msg):
            FinanceEngine.calculate_payout(invalid_gross, invalid_rate)

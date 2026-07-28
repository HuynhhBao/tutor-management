# -*- coding: utf-8 -*-
"""
Module: Finance Engine (Platform Commission Tiering & Precision Rounding)
Bộ máy xử lý chia học phí và làm tròn chuẩn kế toán Việt Nam.
"""
from decimal import Decimal, ROUND_HALF_UP

class FinanceEngine:
    """Bộ máy tính toán doanh thu và chia sẻ chiết khấu hóa đơn cho EduMatch Platform."""
    
    @staticmethod
    def calculate_payout(gross_amount: int, commission_rate_percent: float) -> dict:
        """
        Tính toán chia học phí:
        - gross_amount: Tổng tiền buổi học hoặc khóa học (VNĐ)
        - commission_rate_percent: Tỷ lệ hoa hồng nền tảng giữ lại (VD: 15.0 là 15%)
        """
        if not isinstance(gross_amount, (int, float)) or gross_amount <= 0:
            raise ValueError("Tổng doanh thu phải là số dương lớn hơn 0")
        if not isinstance(commission_rate_percent, (int, float)) or not (0.0 <= commission_rate_percent <= 100.0):
            raise ValueError("Tỷ lệ hoa hồng phải nằm trong khoảng từ 0% đến 100%")

        gross_dec = Decimal(str(gross_amount))
        rate_dec = Decimal(str(commission_rate_percent)) / Decimal("100")

        platform_fee = (gross_dec * rate_dec).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        tutor_earning = gross_dec - platform_fee

        return {
            "gross_amount": int(gross_dec),
            "platform_commission": int(platform_fee),
            "tutor_net_payout": int(tutor_earning),
            "commission_rate_applied": float(commission_rate_percent)
        }

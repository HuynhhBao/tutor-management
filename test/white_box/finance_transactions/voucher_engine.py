# -*- coding: utf-8 -*-
"""
Module: Voucher & Promotional Discount Engine
Hệ thống tính toán mã khuyến mãi, chiết khấu phần trăm, hạn Mức Giới Hạn (Cap) và kiểm tra hạn dùng.
"""
import time
from decimal import Decimal, ROUND_HALF_UP

class VoucherExpiredException(Exception):
    """Ngoại lệ khi Voucher hoặc mã giảm giá đã quá thời hạn sử dụng."""
    pass


class VoucherEngine:
    """Bộ máy tính toán áp dụng khuyến mãi học phí."""

    @classmethod
    def apply_voucher(cls, gross_amount: int, voucher_config: dict, current_time: float = None) -> dict:
        """
        Tính tiền sau khuyến mãi:
        - voucher_config gồm: code, type ('percentage' hoặc 'fixed_discount'), val, max_discount_cap, exp_timestamp
        """
        if not isinstance(gross_amount, (int, float)) or gross_amount <= 0:
            raise ValueError("Tổng hóa đơn phải là số dương")
        if not isinstance(voucher_config, dict) or "type" not in voucher_config:
            raise ValueError("Cấu hình Voucher không hợp lệ")

        now_ts = current_time if current_time is not None else time.time()
        if "exp_timestamp" in voucher_config and voucher_config["exp_timestamp"] < now_ts:
            raise VoucherExpiredException(f"Mã khuyến mãi '{voucher_config.get('code', '')}' đã hết hạn sử dụng")

        v_type = voucher_config["type"]
        val = voucher_config.get("val", 0)
        max_cap = voucher_config.get("max_discount_cap", float("inf"))

        if val < 0 or max_cap < 0:
            raise ValueError("Giá trị khuyến mãi và hạn mức tối đa không được âm")

        gross_dec = Decimal(str(gross_amount))

        if v_type == "percentage":
            if val > 100.0:
                raise ValueError("Khuyến mãi theo % không được vượt quá 100%")
            discount_calc = (gross_dec * Decimal(str(val)) / Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
            actual_discount = min(int(discount_calc), int(max_cap))
        elif v_type == "fixed_discount":
            actual_discount = min(int(val), int(max_cap))
        else:
            raise ValueError(f"Loại hình voucher '{v_type}' không được hỗ trợ")

        # Đảm bảo giảm giá không làm tổng hóa đơn bị âm
        final_discount = min(actual_discount, int(gross_amount))
        payable_amount = int(gross_amount) - final_discount

        return {
            "original_amount": int(gross_amount),
            "discount_applied": final_discount,
            "final_payable_amount": payable_amount,
            "voucher_code": voucher_config.get("code", "UNKNOWN")
        }

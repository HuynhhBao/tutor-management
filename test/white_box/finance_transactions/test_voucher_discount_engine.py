# -*- coding: utf-8 -*-
"""
White-box Unit Tests: Voucher & Discount Engine (100% Branch Coverage)
"""
import pytest
from voucher_engine import VoucherEngine, VoucherExpiredException

class TestVoucherDiscountEngine:
    """Bộ kiểm thử cho hệ thống Voucher khuyến mãi học phí."""

    def test_apply_percentage_voucher_below_cap(self):
        # Hóa đơn 500k, giảm 10% (=50k), tối đa 100k -> Giảm trọn 50k
        v_conf = {"code": "EDU10", "type": "percentage", "val": 10, "max_discount_cap": 100000, "exp_timestamp": 1800000000.0}
        res = VoucherEngine.apply_voucher(500000, v_conf, current_time=1700000000.0)
        assert res["discount_applied"] == 50000
        assert res["final_payable_amount"] == 450000

    def test_apply_percentage_voucher_exceeds_cap_restricted_to_max_cap(self):
        # Hóa đơn 2 triệu, giảm 20% (=400k), tối đa 150k -> Chỉ giảm tối đa 150k
        v_conf = {"code": "EDU20", "type": "percentage", "val": 20, "max_discount_cap": 150000}
        res = VoucherEngine.apply_voucher(2000000, v_conf)
        assert res["discount_applied"] == 150000
        assert res["final_payable_amount"] == 1850000

    def test_apply_fixed_discount_voucher(self):
        v_conf = {"code": "GIAM100K", "type": "fixed_discount", "val": 100000, "max_discount_cap": 200000}
        res = VoucherEngine.apply_voucher(350000, v_conf)
        assert res["discount_applied"] == 100000
        assert res["final_payable_amount"] == 250000

    def test_fixed_discount_exceeds_invoice_amount_stops_at_zero(self):
        # Voucher giảm 300k cho hóa đơn 200k -> Giảm 200k, không làm âm tiền
        v_conf = {"code": "HUGE300", "type": "fixed_discount", "val": 300000, "max_discount_cap": 300000}
        res = VoucherEngine.apply_voucher(200000, v_conf)
        assert res["discount_applied"] == 200000
        assert res["final_payable_amount"] == 0

    def test_expired_voucher_raises_exception(self):
        v_conf = {"code": "OLD_CODE", "type": "percentage", "val": 15, "exp_timestamp": 1600000000.0}
        with pytest.raises(VoucherExpiredException, match="Mã khuyến mãi 'OLD_CODE' đã hết hạn"):
            VoucherEngine.apply_voucher(500000, v_conf, current_time=1700000000.0)

    @pytest.mark.parametrize("invalid_gross,v_conf,err_msg", [
        (-50000, {"type": "percentage", "val": 10}, "Tổng hóa đơn phải là số dương"),
        (500000, None, "Cấu hình Voucher không hợp lệ"),
        (500000, {"code": "INVALID"}, "Cấu hình Voucher không hợp lệ"),
        (500000, {"type": "percentage", "val": -10}, "Giá trị khuyến mãi và hạn mức tối đa không được âm"),
        (500000, {"type": "percentage", "val": 10, "max_discount_cap": -50}, "Giá trị khuyến mãi và hạn mức tối đa không được âm"),
        (500000, {"type": "percentage", "val": 120}, "Khuyến mãi theo % không được vượt quá 100%"),
        (500000, {"type": "unknown_type", "val": 50000}, "Loại hình voucher 'unknown_type' không được hỗ trợ"),
    ])
    def test_invalid_arguments_raise_exceptions(self, invalid_gross, v_conf, err_msg):
        with pytest.raises(ValueError, match=err_msg):
            VoucherEngine.apply_voucher(invalid_gross, v_conf)

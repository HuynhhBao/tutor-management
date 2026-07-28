# -*- coding: utf-8 -*-
"""
White-box Unit Tests: Wallet Boundary Value Analysis (BVA) & Account State Machine (100% Coverage)
"""
import pytest
from wallet_engine import WalletTransactionService, InsufficientBalanceException, WalletFrozenException

class TestWalletBoundaryRules:
    """Bộ kiểm thử ranh giới Nạp tiền, Rút tiền và trạng thái Phong tỏa ví."""

    def test_init_negative_balance_raises_error(self):
        with pytest.raises(ValueError, match="Số dư ban đầu không được âm"):
            WalletTransactionService(initial_balance=-100000)

    @pytest.mark.parametrize("deposit_val", [10000, 500000, 100000000])
    def test_valid_deposit_within_boundaries(self, deposit_val):
        wallet = WalletTransactionService(0.0)
        res = wallet.deposit(deposit_val)
        assert res["status"] == "success"
        assert wallet.balance == deposit_val
        assert f"DEPOSIT_{deposit_val}" in wallet.transaction_log

    @pytest.mark.parametrize("invalid_val,expected_err", [
        (-50000, "Số tiền nạp phải từ 10,000 VNĐ đến 100,000,000 VNĐ"),
        (0, "Số tiền nạp phải từ 10,000 VNĐ đến 100,000,000 VNĐ"),
        (9999, "Số tiền nạp phải từ 10,000 VNĐ đến 100,000,000 VNĐ"),
        (100000001, "Số tiền nạp phải từ 10,000 VNĐ đến 100,000,000 VNĐ"),
        ("50000", "Số tiền nạp phải là định dạng số hợp lệ"),
    ])
    def test_invalid_deposit_outside_boundaries_rejected(self, invalid_val, expected_err):
        wallet = WalletTransactionService(100000.0)
        with pytest.raises(ValueError, match=expected_err):
            wallet.deposit(invalid_val)
        assert wallet.balance == 100000.0  # Không thay đổi số dư

    def test_deposit_on_frozen_account_rejected(self):
        wallet = WalletTransactionService(50000.0, is_frozen=True)
        with pytest.raises(WalletFrozenException, match="Tài khoản đang bị đóng băng"):
            wallet.deposit(100000)

    @pytest.mark.parametrize("payout_val", [50000, 100000, 500000])
    def test_valid_payout_request_success(self, payout_val):
        wallet = WalletTransactionService(500000.0)
        res = wallet.request_payout(payout_val)
        assert res["status"] == "pending_approval"
        assert wallet.balance == 500000.0 - payout_val
        assert f"PAYOUT_REQ_{payout_val}" in wallet.transaction_log

    @pytest.mark.parametrize("invalid_payout,err_type,expected_msg", [
        (49999, ValueError, "Số tiền rút tối thiểu phải từ 50,000 VNĐ"),
        (500001, InsufficientBalanceException, "Số dư khả dụng không đủ"),
        ("100000", ValueError, "Số tiền rút phải là định dạng số hợp lệ"),
    ])
    def test_invalid_payout_request_rejected(self, invalid_payout, err_type, expected_msg):
        wallet = WalletTransactionService(500000.0)
        with pytest.raises(err_type, match=expected_msg):
            wallet.request_payout(invalid_payout)

    def test_payout_on_frozen_account_rejected(self):
        wallet = WalletTransactionService(1000000.0, is_frozen=True)
        with pytest.raises(WalletFrozenException, match="Tài khoản đang bị đóng băng"):
            wallet.request_payout(100000)

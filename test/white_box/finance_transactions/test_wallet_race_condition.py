# -*- coding: utf-8 -*-
"""
White-box Multi-threading Stress Test: Database Concurrency & Race Condition in Wallet Balances (100% Coverage)
"""
import pytest
from concurrent.futures import ThreadPoolExecutor
from wallet_engine import WalletTransactionService, InsufficientBalanceException, WalletFrozenException

class TestWalletRaceCondition:
    """Bộ kiểm thử Đa luồng chứng minh an toàn tài chính Ví EduMatch."""

    def test_unsafe_race_condition_leads_to_double_spending(self):
        wallet = WalletTransactionService(initial_balance=1000000.0)
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures = [
                executor.submit(
                    lambda b_id: self._safe_wrapper_unsafe(wallet, 200000.0, b_id),
                    f"book_{i}"
                )
                for i in range(20)
            ]
            for f in futures:
                f.result()
        assert wallet.successful_deductions > 5 or wallet.balance < 0

    def test_safe_transaction_lock_prevents_race_condition_100_percent(self):
        wallet = WalletTransactionService(initial_balance=1000000.0)
        with ThreadPoolExecutor(max_workers=30) as executor:
            futures = [
                executor.submit(
                    lambda b_id: self._safe_wrapper_safe(wallet, 200000.0, b_id),
                    f"safe_book_{i}"
                )
                for i in range(50)
            ]
            for f in futures:
                f.result()

        assert wallet.successful_deductions == 5
        assert wallet.failed_deductions == 45
        assert wallet.balance == 0.0
        assert wallet.escrow_balance == 1000000.0
        assert wallet.balance + wallet.escrow_balance == 1000000.0

    def test_frozen_wallet_blocks_safe_booking(self):
        """Kiểm nghiệm rẽ nhánh từ chối booking khi tài khoản bị phong tỏa."""
        wallet = WalletTransactionService(initial_balance=500000.0, is_frozen=True)
        with pytest.raises(WalletFrozenException, match="Tài khoản ví bị phong tỏa"):
            wallet.book_tutor_safe_with_lock(100000.0, "book_frozen")

    def test_book_tutor_unsafe_insufficient_balance_branch(self):
        """Kiểm nghiệm rẽ nhánh số dư không đủ trong giao dịch không an toàn."""
        wallet = WalletTransactionService(initial_balance=100.0)
        with pytest.raises(InsufficientBalanceException, match="không đủ thanh toán"):
            wallet.book_tutor_unsafe_no_lock(500000.0, "book_fail_unsafe")
        assert wallet.failed_deductions == 1

    def _safe_wrapper_unsafe(self, wallet, amount, booking_id):
        try:
            wallet.book_tutor_unsafe_no_lock(amount, booking_id)
        except InsufficientBalanceException:
            pass

    def _safe_wrapper_safe(self, wallet, amount, booking_id):
        try:
            wallet.book_tutor_safe_with_lock(amount, booking_id)
        except InsufficientBalanceException:
            pass

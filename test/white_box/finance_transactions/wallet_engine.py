# -*- coding: utf-8 -*-
"""
Module: Wallet Transaction Engine (Concurrency Lock & BVA Rules)
Hệ thống xử lý ví điện tử, quản lý ranh giới giá trị nạp/rút và khóa chống Race Condition.
"""
import time
import threading

class InsufficientBalanceException(Exception):
    """Ngoại lệ phát ra khi số dư Ví học viên không đủ để thanh toán."""
    pass

class WalletFrozenException(Exception):
    """Ngoại lệ ném ra khi tài khoản đang bị phong tỏa tạm thời."""
    pass


class WalletTransactionService:
    """Mô phỏng bộ xử lý Giao dịch Ví trong Database PostgreSQL."""
    
    MIN_DEPOSIT = 10000         # 10k VNĐ
    MAX_DEPOSIT = 100000000     # 100 triệu VNĐ
    MIN_PAYOUT = 50000          # 50k VNĐ

    def __init__(self, initial_balance: float, is_frozen: bool = False):
        if initial_balance < 0:
            raise ValueError("Số dư ban đầu không được âm")
        self.balance = initial_balance
        self.escrow_balance = 0.0
        self.transaction_log = []
        self._db_lock = threading.Lock()
        self.is_frozen = is_frozen
        self.successful_deductions = 0
        self.failed_deductions = 0

    def deposit(self, amount: float) -> dict:
        """Nạp tiền vào Ví theo giới hạn BVA."""
        if self.is_frozen:
            raise WalletFrozenException("Tài khoản đang bị đóng băng, không thể thực hiện giao dịch")
        if not isinstance(amount, (int, float)):
            raise ValueError("Số tiền nạp phải là định dạng số hợp lệ")
        if amount < self.MIN_DEPOSIT or amount > self.MAX_DEPOSIT:
            raise ValueError(f"Số tiền nạp phải từ {self.MIN_DEPOSIT:,.0f} VNĐ đến {self.MAX_DEPOSIT:,.0f} VNĐ")
            
        with self._db_lock:
            self.balance += amount
            self.transaction_log.append(f"DEPOSIT_{amount}")
            return {"status": "success", "new_balance": self.balance}

    def request_payout(self, amount: float) -> dict:
        """Xin rút lương (Dành cho Gia sư) với kiểm tra biên tối thiểu và không vượt số dư."""
        if self.is_frozen:
            raise WalletFrozenException("Tài khoản đang bị đóng băng, không thể thực hiện giao dịch")
        if not isinstance(amount, (int, float)):
            raise ValueError("Số tiền rút phải là định dạng số hợp lệ")
        if amount < self.MIN_PAYOUT:
            raise ValueError(f"Số tiền rút tối thiểu phải từ {self.MIN_PAYOUT:,.0f} VNĐ")
        if amount > self.balance:
            raise InsufficientBalanceException("Số dư khả dụng không đủ để thực hiện yêu cầu rút tiền")
            
        with self._db_lock:
            self.balance -= amount
            self.transaction_log.append(f"PAYOUT_REQ_{amount}")
            return {"status": "pending_approval", "deducted": amount, "remaining_balance": self.balance}

    def book_tutor_unsafe_no_lock(self, amount: float, booking_id: str):
        """Mô phỏng Giao dịch THIẾU AN TOÀN (Không khóa DB Lock) -> Dễ gặp Race Condition & Double-Spending!"""
        current_bal = self.balance
        time.sleep(0.001)
        if current_bal >= amount:
            self.balance = current_bal - amount
            self.escrow_balance += amount
            self.transaction_log.append(f"SUCCESS_{booking_id}")
            self.successful_deductions += 1
        else:
            self.failed_deductions += 1
            raise InsufficientBalanceException(f"Số dư {current_bal} không đủ thanh toán {amount}")

    def book_tutor_safe_with_lock(self, amount: float, booking_id: str):
        """Mô phỏng Giao dịch AN TOÀN NGUYÊN TỬ (ACID Row Lock) -> Ngăn chặn 100% Race Condition!"""
        if self.is_frozen:
            raise WalletFrozenException("Tài khoản ví bị phong tỏa, không thể thanh toán booking")
            
        with self._db_lock:
            current_bal = self.balance
            time.sleep(0.001)
            if current_bal >= amount:
                self.balance -= amount
                self.escrow_balance += amount
                self.transaction_log.append(f"SUCCESS_{booking_id}")
                self.successful_deductions += 1
            else:
                self.failed_deductions += 1
                raise InsufficientBalanceException(f"Số dư {current_bal} không đủ thanh toán {amount}")

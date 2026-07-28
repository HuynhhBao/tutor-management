# -*- coding: utf-8 -*-
"""
Module: Virtual Classroom Billing Duration Engine
Hệ thống tính toán thời gian buổi học thực tế và tính thù lao giảng dạy Virtual Classroom.
"""
from decimal import Decimal, ROUND_HALF_UP

class ClassroomEngine:
    """Bộ máy tính giờ làm việc và học phí Phòng học trực tuyến."""

    MIN_BILLABLE_MINUTES = 15
    MAX_SESSION_HOURS = 12

    @classmethod
    def calculate_billable_payout(cls, start_time_epoch: float, end_time_epoch: float, hourly_rate_vnd: int) -> dict:
        """
        Tính tiền theo giờ cho phòng học trực tuyến:
        - Làm tròn block 15 phút theo quy chuẩn kế toán.
        - Dưới 15 phút không được chiết tính (Grace period).
        """
        if not isinstance(start_time_epoch, (int, float)) or not isinstance(end_time_epoch, (int, float)):
            raise ValueError("Mốc thời gian phải là định dạng nhị phân số hợp lệ")
        if start_time_epoch >= end_time_epoch:
            raise ValueError("Thời gian kết thúc phải diễn ra sau thời gian bắt đầu")
        if not isinstance(hourly_rate_vnd, int) or hourly_rate_vnd < 0:
            raise ValueError("Học phí theo giờ phải là số tự nhiên dương")

        total_seconds = end_time_epoch - start_time_epoch
        total_minutes = total_seconds / 60.0

        if total_minutes > cls.MAX_SESSION_HOURS * 60:
            raise ValueError(f"Thời gian một ca học không được vượt quá {cls.MAX_SESSION_HOURS} tiếng")

        if total_minutes < cls.MIN_BILLABLE_MINUTES:
            return {
                "duration_minutes": round(total_minutes, 2),
                "billed_hours": 0.0,
                "total_payout_vnd": 0,
                "message": "Thời lượng ca học dưới 15 phút (Grace Period) không chiết tính học phí."
            }

        # Làm tròn lên block 15 phút (0.25 giờ) sát nhất
        # Ví dụ: 50 phút -> 60 phút (1.0 giờ); 20 phút -> 30 phút (0.5 giờ)
        blocks_of_15 = math_ceil(total_minutes / 15.0)
        billed_hours = round(blocks_of_15 * 0.25, 2)

        rate_dec = Decimal(str(hourly_rate_vnd))
        hours_dec = Decimal(str(billed_hours))
        payout = (rate_dec * hours_dec).quantize(Decimal("1"), rounding=ROUND_HALF_UP)

        return {
            "duration_minutes": round(total_minutes, 2),
            "billed_hours": float(billed_hours),
            "total_payout_vnd": int(payout),
            "message": f"Tính công giảng dạy thành công cho {billed_hours} giờ dạy."
        }

def math_ceil(val: float) -> int:
    int_val = int(val)
    return int_val + 1 if val > int_val else int_val

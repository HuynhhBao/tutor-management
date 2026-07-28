# -*- coding: utf-8 -*-
"""
Shared PyTest Fixtures and Environment Setup for White-box Testing
Module: EduMatch White-box Test Suite
"""
import os
import sys
import pytest

# Thêm gốc dự án và thư mục data_scraping vào sys.path để import code thực tế
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../../"))
scraping_dir = os.path.join(project_root, "data_scraping")

if project_root not in sys.path:
    sys.path.insert(0, project_root)
if scraping_dir not in sys.path:
    sys.path.insert(0, scraping_dir)


@pytest.fixture
def sample_raw_tutor_records():
    """Fixture cung cấp tập dữ liệu cào Gia sư thô (chưa làm sạch) để test Preprocessing."""
    return [
        {
            "fullName": "  Huỳnh Gia Bảo  ",
            "gender": "Nam",
            "age": 28,
            "subject": "Toán, Lý, Hóa",
            "qualification": " Thạc sĩ Bách Khoa ",
            "gradeLevels": "Lớp 10, Lớp 11, Lớp 12, ĐH",
            "raw_fee": "250k/buổi",
            "rating": 4.9
        },
        {
            "fullName": "Nguyễn Thị Mai",
            "gender": "Nữ",
            "age": 24,
            "subject": "Tiếng Anh, IELTS",
            "qualification": "Cử nhân Ngoại Ngữ",
            "gradeLevels": "Lớp 6 - Lớp 12",
            "raw_fee": "300 nghìn/giờ",
            "rating": 4.8
        },
        {
            "fullName": "Trần Văn An",
            "gender": "Nam",
            "age": 22,
            "subject": "Toán",
            "qualification": "Sinh viên Sư Phạm",
            "gradeLevels": "Lớp 1 - Lớp 5",
            "raw_fee": "180.000 VNĐ",
            "rating": 4.5
        },
        {
            "fullName": "Lê Hồ Phương Thảo",
            "gender": "Nữ",
            "age": 30,
            "subject": "Văn, Lịch Sử",
            "qualification": "Giáo viên ĐH",
            "gradeLevels": "Lớp 9, Lớp 12",
            "raw_fee": None,  # Test missing fee imputation
            "rating": 5.0
        }
    ]


@pytest.fixture
def sample_wallet_user():
    """Fixture cung cấp mô phỏng tài khoản ví điện tử cho kịch bản test Race Condition."""
    return {
        "user_id": "stu_1001",
        "username": "hocvien_baodev",
        "balance": 1000000.0,  # 1 triệu VNĐ
        "is_locked": False,
        "escrow_balance": 0.0
    }

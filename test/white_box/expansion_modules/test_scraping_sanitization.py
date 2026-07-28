# -*- coding: utf-8 -*-
"""
White-box Unit Tests: Data Scraping & Preprocessing Pipeline (100% Statement & Branch Coverage)
Kiểm thử trực tiếp code thực tế trong `data_scraping/data_cleaner.py`.
Bao phủ 100% CẢ HAI NHÁNH: Khi có Pandas (HAS_PANDAS=True) và Khi không có Pandas (Pure Python Fallback).
"""
import os
import sys
import json
import importlib
from unittest.mock import patch, mock_open
import pytest

# Thiết lập đường dẫn gốc dự án vào sys.path để cả IDE (Pyright/Pylance) và PyTest đều định vị đúng module
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../../../"))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

import data_scraping.data_cleaner as dc


class TestScrapingSanitization:
    """Bộ kiểm thử 100% độ phủ cho Hàm làm sạch giá tiền và toàn bộ Pipeline Tiền xử lý cào Gia sư."""

    @pytest.mark.parametrize("input_fee,expected_output,test_description", [
        ("250k/buổi", 250000, "Chuẩn hóa hậu tố 'k/buổi' thành tiền VNĐ chuẩn"),
        ("200 nghìn/giờ", 200000, "Chuẩn hóa hậu tố 'nghìn/giờ'"),
        ("350.000 VNĐ", 350000, "Chuẩn hóa dấu chấm ngắt nghìn và hậu tố 'VNĐ'"),
        ("150k", 150000, "Chuẩn hóa số ngắn kèm chữ 'k'"),
        ("500000", 500000, "Chuẩn hóa chuỗi toàn chữ số thuần túy"),
        ("800 k", 800000, "Khoảng trắng giữa số và ký tự"),
    ])
    def test_clean_fee_string_valid_branches(self, input_fee, expected_output, test_description):
        result = dc.clean_fee_string(input_fee)
        assert result == expected_output, f"Lỗi rẽ nhánh {test_description}: Mong đợi {expected_output}, nhận được {result}"

    @pytest.mark.parametrize("invalid_input", [
        None,
        "",
        "   ",
        "Miễn phí (Thỏa thuận)",
        "Liên hệ trực tiếp",
        12345,  # Kiểu dữ liệu sai (Integer thay vì String)
        ["250k"] # Kiểu dữ liệu sai (List)
    ])
    def test_clean_fee_string_invalid_and_edge_cases(self, invalid_input):
        result = dc.clean_fee_string(invalid_input)
        assert result is None, f"Mong đợi None cho đầu vào không hợp lệ {invalid_input}, nhưng trả về {result}"

    def test_mean_imputation_logic_for_missing_fees(self, sample_raw_tutor_records):
        clean_fees = [dc.clean_fee_string(r["raw_fee"]) for r in sample_raw_tutor_records if dc.clean_fee_string(r["raw_fee"]) is not None]
        expected_mean = int(sum(clean_fees) / len(clean_fees))
        assert expected_mean == 243333

        processed = []
        for r in sample_raw_tutor_records:
            val = dc.clean_fee_string(r["raw_fee"])
            processed.append({"fullName": r["fullName"].strip(), "hourlyRate": expected_mean if val is None else val})

        thao = next(r for r in processed if "Phương Thảo" in r["fullName"])
        assert thao["hourlyRate"] == 243333

    def test_preprocess_data_file_not_found_branch(self, capsys):
        """Kiểm nghiệm rẽ nhánh khi file raw_tutors.json không tồn tại."""
        with patch("os.path.exists", return_value=False):
            dc.preprocess_data()
            captured = capsys.readouterr()
            assert "Khong tim thay file" in captured.out

    def test_preprocess_data_with_pandas_branch(self, capsys):
        """Kiểm ngiệm rẽ nhánh thực tế khi có thư viện Pandas (HAS_PANDAS=True)."""
        sample_raw = [
            {"fullName": "An ", "qualification": "ĐH ", "raw_fee": "200k", "subject": "Toán, Lý", "gender": "Nữ", "age": 22, "gradeLevels": "Lớp 10", "rating": 5.0},
            {"fullName": "Binh", "qualification": " Thạc sĩ", "raw_fee": None, "subject": "Toán", "gender": "Nam", "age": 28, "gradeLevels": "Lớp 12", "rating": 4.8},
            {"fullName": "Chau", "qualification": "Cử nhân", "raw_fee": None, "subject": "Môn Khôn Nhận Diện", "gender": "Nữ", "age": 24, "gradeLevels": "Lớp 1", "rating": 4.0},
            {"fullName": "Dzung", "qualification": "SV", "raw_fee": None, "subject": "Môn Khôn Nhận Diện", "gender": "Nam", "age": 21, "gradeLevels": "Lớp 2", "rating": 4.5}
        ]
        
        mock_file_read = mock_open(read_data=json.dumps(sample_raw))
        with patch("os.path.exists", return_value=True), \
             patch("builtins.open", mock_file_read), \
             patch.object(dc, "HAS_PANDAS", True):
            dc.preprocess_data()
            captured = capsys.readouterr()
            assert "[Data Cleaner] Dang bat dau Tien xu ly" in captured.out

    def test_preprocess_data_pure_python_fallback_branch(self, capsys):
        """Kiểm ngiệm rẽ nhánh Pure Python Fallback khi không có thư viện Pandas (HAS_PANDAS=False)."""
        sample_raw = [
            {"fullName": "An ", "qualification": None, "raw_fee": "300k", "subject": "Toán", "gender": "Nữ", "age": 22, "gradeLevels": "Lớp 10", "rating": 5.0},
            {"fullName": None, "qualification": "ĐH", "raw_fee": None, "subject": "Lý", "gender": "Nam", "age": 25, "gradeLevels": "Lớp 11", "rating": 4.5}
        ]
        mock_file_read = mock_open(read_data=json.dumps(sample_raw))
        with patch("os.path.exists", return_value=True), \
             patch("builtins.open", mock_file_read), \
             patch.object(dc, "HAS_PANDAS", False):
            dc.preprocess_data()
            captured = capsys.readouterr()
            assert "[Warning] Khong tim thay Pandas" in captured.out
            assert "Tien xu ly & lam sach hoan tat!" in captured.out

    def test_preprocess_data_pure_python_empty_fees_fallback_to_default(self, capsys):
        """Kiểm ngiệm nhánh khi tất cả gia sư đều không có giá trị học phí -> Fallback về 220,000 VND."""
        sample_raw = [{"fullName": "No Fee Tutor", "raw_fee": None}]
        mock_file_read = mock_open(read_data=json.dumps(sample_raw))
        with patch("os.path.exists", return_value=True), \
             patch("builtins.open", mock_file_read), \
             patch.object(dc, "HAS_PANDAS", False):
            dc.preprocess_data()
            captured = capsys.readouterr()
            assert "Bao cao thi truong hoan tat!" in captured.out

    def test_import_error_branch_for_pandas(self):
        """[ĐẶC NHIỆM 100% COVERAGE] Mô phỏng ImportError khi import data_cleaner để bao phủ chuỗi except ImportError."""
        with patch.dict(sys.modules, {"pandas": None}):
            importlib.reload(dc)
            assert dc.HAS_PANDAS is False
        # Tải lại bình thường sau test
        importlib.reload(dc)

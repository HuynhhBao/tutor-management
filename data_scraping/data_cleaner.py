# -*- coding: utf-8 -*-
# Module Tiền xử lý & Làm sạch dữ liệu (Data Preprocessing with Pandas)
# Môn Khai thác dữ liệu (Data Mining)
#
# Nhiệm vụ:
# 1. Đọc dữ liệu thô từ raw_tutors.json vào Pandas DataFrame
# 2. Xử lý giá tiền (Regex & Chuẩn hóa): 250k/buổi -> 250000
# 3. Xử lý dữ liệu bị khuyết (Missing Values):
#    - Học phí bị thiếu -> Dùng phương pháp Mean Imputation (Giá trung bình theo nhóm Môn học/Trình độ)
#    - Avatar bị thiếu -> Lấp đầy bằng Placeholder URL phân loại theo Giới tính
# 4. Chuẩn hóa chuỗi văn bản (String Normalization): Loại bỏ khoảng trắng thừa
# 5. Xuất báo cáo phân tích thị trường market_analytics_report.json & tập dữ liệu sạch clean_tutors.json
import json
import os
import re

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

def clean_fee_string(fee_str):
    # Dùng Regex bóc tách chữ số khỏi chuỗi giá tiền:
    # Ví dụ: 250k/buổi -> 250000; 200 nghìn/giờ -> 200000; 350.000 VNĐ -> 350000
    if not fee_str or not isinstance(fee_str, str):
        return None
    
    clean_str = fee_str.lower().replace(".", "").replace(" ", "")
    match = re.search(r'(\d+)', clean_str)
    if match:
        val = int(match.group(1))
        # Nếu số nhỏ (ví dụ 150, 200, 300) thì hiểu là nghìn VNĐ (k / nghìn)
        if val < 1000:
            val *= 1000
        return val
    return None

def preprocess_data():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(current_dir, "raw_tutors.json")
    clean_output = os.path.join(current_dir, "clean_tutors.json")
    report_output = os.path.join(current_dir, "market_analytics_report.json")

    if not os.path.exists(input_path):
        print(f"[Error] Khong tim thay file {input_path}. Vui long chay tutor_scraper.py truoc!")
        return

    with open(input_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    print(f"[Data Cleaner] Dang bat dau Tien xu ly du lieu (Data Preprocessing) cho {len(raw_data)} ho so...")

    if HAS_PANDAS:
        df = pd.DataFrame(raw_data)

        # 1. Chuẩn hóa khoảng trắng Họ và tên
        df["fullName"] = df["fullName"].astype(str).str.strip()
        df["qualification"] = df["qualification"].astype(str).str.strip()

        # 2. Xử lý giá tiền (Regex parsing)
        df["fee_clean"] = df["raw_fee"].apply(clean_fee_string)

        # 3. Kỹ thuật Mean Imputation cho Học phí bị thiếu
        # Tính mức học phí trung bình theo nhóm Môn học chính hoặc trung bình toàn tập
        mean_fee_global = int(df["fee_clean"].mean(skipna=True))
        
        # Tạo cột môn học chính (từ đầu tiên trước dấu phẩy)
        df["main_subject"] = df["subject"].apply(lambda s: str(s).split(",")[0].strip())
        subject_means = df.groupby("main_subject")["fee_clean"].mean().to_dict()

        def impute_fee(row):
            if pd.isna(row["fee_clean"]) or row["fee_clean"] is None:
                subj = row["main_subject"]
                if subj in subject_means and not pd.isna(subject_means[subj]):
                    return int(subject_means[subj])
                return mean_fee_global
            return int(row["fee_clean"])

        df["hourlyRate"] = df.apply(impute_fee, axis=1)

        # 4. Giữ nguyên Avatar là None để hệ thống tự động hiển thị Avatar theo ký tự viết tắt tên (ví dụ: Huỳnh Gia Bảo -> HB)
        df["avatar_url"] = None

        # 5. Phân tích Thao tác thị trường (Analytics Report)
        report = {
            "total_records_processed": len(df),
            "global_average_fee_vnd": mean_fee_global,
            "average_fee_by_subject": {k: int(v) if not pd.isna(v) else mean_fee_global for k, v in subject_means.items()},
            "imputation_method_used": "Pandas GroupBy Mean Imputation & Regex Currency Standardization"
        }

        # Chọn lọc các cột xuất cho Backend CSDL
        export_df = df[["fullName", "gender", "age", "subject", "qualification", "gradeLevels", "hourlyRate", "avatar_url", "rating"]]
        cleaned_list = export_df.to_dict(orient="records")

    else:
        # Fallback xử lý thuần Python nếu máy không cài sẵn Pandas
        print("[Warning] Khong tim thay Pandas, dang thuc hien tien xu ly bang Pure Python...")
        clean_fees = []
        for item in raw_data:
            fee = clean_fee_string(item.get("raw_fee"))
            if fee is not None:
                clean_fees.append(fee)
        
        global_mean = int(sum(clean_fees) / len(clean_fees)) if clean_fees else 220000

        cleaned_list = []
        for item in raw_data:
            fee = clean_fee_string(item.get("raw_fee"))
            if fee is None:
                fee = global_mean
            
            name = (item.get("fullName") or "").strip()
            cleaned_list.append({
                "fullName": name,
                "gender": item.get("gender"),
                "age": item.get("age"),
                "subject": item.get("subject"),
                "qualification": (item.get("qualification") or "").strip(),
                "gradeLevels": item.get("gradeLevels"),
                "hourlyRate": fee,
                "avatar_url": None,
                "rating": item.get("rating")
            })

        report = {
            "total_records_processed": len(cleaned_list),
            "global_average_fee_vnd": global_mean,
            "imputation_method_used": "Pure Python Mean Imputation (Fallback)"
        }

    with open(clean_output, "w", encoding="utf-8") as f:
        json.dump(cleaned_list, f, ensure_ascii=False, indent=2)

    with open(report_output, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"[Data Cleaner] Tien xu ly & lam sach hoan tat! Da xuat ra file: {clean_output}")
    print(f"[Market Analytics] Bao cao thi truong hoan tat!")

if __name__ == "__main__":  # pragma: no cover
    preprocess_data()

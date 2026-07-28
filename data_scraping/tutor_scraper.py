# -*- coding: utf-8 -*-
# Module Web Scraping & Simulated Data Collection (Khai thác dữ liệu quy mô lớn)
# Thu thập hồ sơ Gia sư thực tế (100+ hồ sơ) với định dạng giá thô, dữ liệu thiếu (missing values)
# để phục vụ khâu Tiền xử lý (Data Preprocessing) trong môn Khai thác dữ liệu.
import json
import os
import random

def generate_additional_profiles(num=70):
    last_names = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"]
    middle_names_male = ["Văn", "Hữu", "Quốc", "Tuấn", "Minh", "Đức", "Thanh", "Hoàng", "Duy", "Gia", "Thành", "Vũ", "Thái", "Bảo", "Trọng"]
    first_names_male = ["An", "Bình", "Cường", "Duy", "Đạt", "Hưng", "Hai", "Hải", "Khoa", "Long", "Minh", "Nam", "Nghĩa", "Phúc", "Quang", "Sơn", "Thắng", "Trí", "Vũ", "Tùng"]
    
    middle_names_female = ["Thị", "Ngọc", "Thùy", "Mai", "Phương", "Quỳnh", "Thảo", "Khánh", "Diệu", "Tuyết", "Gia", "Bích", "Thúy", "Nhã", "Hoàng"]
    first_names_female = ["Anh", "Chi", "Dung", "Hằng", "Hà", "Hương", "Huyen", "Linh", "Lan", "Nhung", "Oanh", "Phương", "Quyên", "Trang", "Uyen", "Vy", "Yến", "Tâm", "Nhi", "Trâm"]

    male_subjects_quals = [
        ("Toán, Lý", "Thạc sĩ Sư Phạm Toán Đại Học Sư Phạm TP.HCM", "Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học"),
        ("Vật Lý", "Giảng viên Khoa Vật lý Kỹ thuật Đại học Bách Khoa", "Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học"),
        ("Lập trình, Tin học", "Kỹ sư Phần mềm Senior tại Viettel & FPT Software", "Lớp 8, Lớp 9, Lớp 10, Lớp 11, Lớp 12"),
        ("Toán", "Cử nhân Toán Tin Đại Học Khoa Học Tự Nhiên TP.HCM", "Lớp 6, Lớp 7, Lớp 8, Lớp 9, Lớp 10"),
        ("Hóa học", "Thạc sĩ Công nghệ Hóa Dược Đại Học Bách Khoa", "Lớp 11, Lớp 12, Ôn thi Đại học"),
        ("Tiếng Anh, TOEIC", "Thạc sĩ Ngôn ngữ Anh Đại Học Xã Hội & Nhân Văn", "Lớp 9, Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học"),
        ("Tiếng Nhật", "Chứng chỉ JLPT N1 - Du học sinh 5 năm tại Tokyo", "Lớp 8, Lớp 9, Lớp 10, Lớp 11, Lớp 12"),
        ("Toán cao cấp, Giải tích", "Giảng viên Toán cơ bản Đại Học Kinh Tế TP.HCM (UEH)", "Lớp 11, Lớp 12, Ôn thi Đại học"),
        ("Lịch Sử, Địa Lý", "Cử nhân Sư phạm Lịch Sử kinh nghiệm 6 năm", "Lớp 9, Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học"),
        ("Tiếng Trung", "HSK 6 - Giảng viên thỉnh giảng Viện Khổng Tử", "Lớp 6, Lớp 7, Lớp 8, Lớp 9, Lớp 10"),
    ]

    female_subjects_quals = [
        ("Tiếng Anh, IELTS", "IELTS 8.5, Chứng chỉ sư phạm quốc tế TESOL", "Lớp 9, Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học"),
        ("Ngữ Văn", "Thạc sĩ Văn học Việt Nam Đại Học Khoa Học Xã Hội", "Lớp 8, Lớp 9, Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học"),
        ("Tiếng Hàn", "Chứng chỉ TOPIK 6 - Du học sinh Hàn Quốc Đại học Seoul", "Lớp 9, Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học"),
        ("Hóa học, Sinh học", "Cử nhân xuất sắc Công nghệ Sinh học Đại học Quốc Tế", "Lớp 9, Lớp 10, Lớp 11, Lớp 12"),
        ("Toán, Tiếng Anh", "Sinh viên xuất sắc Đại Học Ngoại Thương (FTU)", "Lớp 6, Lớp 7, Lớp 8, Lớp 9"),
        ("Đàn Piano, Thanh nhạc", "Cử nhân Sư phạm Âm nhạc Nhạc viện TP.HCM", "Lớp 6, Lớp 7, Lớp 8, Lớp 9, Lớp 10, Lớp 11, Lớp 12"),
        ("Vẽ & Mỹ thuật", "Cử nhân Mỹ thuật Công nghiệp Đại Học Kiến Trúc", "Lớp 6, Lớp 7, Lớp 8, Lớp 9, Lớp 10"),
        ("Tiếng Pháp", "Chứng chỉ DALF C1, Giảng viên tiếng Pháp trung tâm", "Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học"),
        ("Kế toán, Tài chính", "Thạc sĩ Tài chính Ngân Hàng Học Viện Ngân Hàng", "Lớp 11, Lớp 12, Ôn thi Đại học"),
        ("Tiếng Anh, IELTS", "IELTS 8.0 - Cử nhân Sư phạm Tiếng Anh trường Sư Phạm", "Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học")
    ]

    fee_formats = ["180k/buổi", "200.000 VNĐ", "220 nghìn/giờ", "250k/h", "280.000đ", "300k/h", "350K/H", "320 nghìn/buổi", "400.000 VNĐ", None, None]
    ratings = [4.5, 4.6, 4.7, 4.8, 4.9, 5.0]

    profiles = []
    for i in range(num):
        is_male = random.choice([True, False])
        if is_male:
            gender = "Nam"
            name = f"{random.choice(last_names)} {random.choice(middle_names_male)} {random.choice(first_names_male)}"
            subj, qual, grades = random.choice(male_subjects_quals)
        else:
            gender = "Nữ"
            name = f"{random.choice(last_names)} {random.choice(middle_names_female)} {random.choice(first_names_female)}"
            subj, qual, grades = random.choice(female_subjects_quals)
        
        # Tạo thêm khoảng trắng ngẫu nhiên ở 1 số hồ sơ để kiểm thử khả năng làm sạch (Data Cleaning)
        if i % 5 == 0:
            name = f"   {name}   "
            
        fee = random.choice(fee_formats)
        age = random.randint(21, 35)
        rating = random.choice(ratings)

        profiles.append({
            "fullName": name,
            "gender": gender,
            "age": age,
            "subject": subj,
            "qualification": qual,
            "gradeLevels": grades,
            "raw_fee": fee,
            "avatar_url": None, # Giữ nguyên None để sử dụng toàn bộ Avatar huy hiệu hai ký tự tắt của nền tảng
            "rating": rating
        })
    return profiles

def get_raw_tutors():
    # Tạo và mô phỏng tập dữ liệu thô (Raw dataset) quy mô lớn >100 hồ sơ gia sư từ các nguồn:
    # - Hồ sơ cơ sở cố định tiêu chuẩn (30 hồ sơ ban đầu)
    # - Hồ sơ mở rộng đa phong phú chuyên môn (70+ hồ sơ bổ sung)
    base_data = [
        {
            "fullName": "Nguyễn Thành Long",
            "gender": "Nam",
            "age": 28,
            "subject": "Toán, Lý",
            "qualification": "Thạc sĩ Sư Phạm Toán Đại Học Sư Phạm TP.HCM",
            "gradeLevels": "Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học",
            "raw_fee": "250k/buổi",
            "avatar_url": None,
            "rating": 4.9
        },
        {
            "fullName": "Trần Thị Lan Anh",
            "gender": "Nữ",
            "age": 24,
            "subject": "Hóa học",
            "qualification": "Cử nhân Hóa học Đại Học Khoa Học Tự Nhiên",
            "gradeLevels": "Lớp 8, Lớp 9, Lớp 10",
            "raw_fee": "180 nghìn/giờ",
            "avatar_url": None,
            "rating": 4.7
        },
        {
            "fullName": "Lê Vũ Minh Phúc",
            "gender": "Nam",
            "age": 22,
            "subject": "Toán",
            "qualification": "Sinh viên giỏi Đại học Bách Khoa TP.HCM",
            "gradeLevels": "Lớp 6, Lớp 7, Lớp 8, Lớp 9",
            "raw_fee": None,
            "avatar_url": None,
            "rating": 4.6
        },
        {
            "fullName": "Phạm Quốc Bảo",
            "gender": "Nam",
            "age": 32,
            "subject": "Vật Lý",
            "qualification": "Giáo viên chuyên Lý Trung Học Phổ Thông Chuyên",
            "gradeLevels": "Lớp 11, Lớp 12, Ôn thi Đại học",
            "raw_fee": "350.000 VNĐ",
            "avatar_url": None,
            "rating": 5.0
        },
        {
            "fullName": "Đỗ Thị Mai Hương",
            "gender": "Nữ",
            "age": 26,
            "subject": "Toán",
            "qualification": "Cử nhân Sư phạm Toán, kinh nghiệm 4 năm ôn thi",
            "gradeLevels": "Lớp 9, Lớp 10, Ôn thi Đại học",
            "raw_fee": "220k/buổi",
            "avatar_url": None,
            "rating": 4.8
        },
        {
            "fullName": "Vũ Anh Khoa",
            "gender": "Nam",
            "age": 25,
            "subject": "Hóa học",
            "qualification": "Thạc sĩ Kỹ thuật Hóa Bách Khoa",
            "gradeLevels": "Lớp 11, Lớp 12, Ôn thi Đại học",
            "raw_fee": None,
            "avatar_url": None,
            "rating": 4.8
        },
        {
            "fullName": "Bùi Phương Phương",
            "gender": "Nữ",
            "age": 23,
            "subject": "Sinh học",
            "qualification": "Cử nhân Công nghệ Sinh học Đại học Quốc tế",
            "gradeLevels": "Lớp 9, Lớp 10, Lớp 11, Lớp 12",
            "raw_fee": "170k/giờ",
            "avatar_url": None,
            "rating": 4.5
        },
        {
            "fullName": "Hoàng Tuyết Nhung",
            "gender": "Nữ",
            "age": 27,
            "subject": "Tiếng Anh, IELTS",
            "qualification": "IELTS 8.5, Chứng chỉ sư phạm quốc tế TESOL",
            "gradeLevels": "Lớp 9, Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học",
            "raw_fee": "320K/H",
            "avatar_url": None,
            "rating": 4.9
        },
        {
            "fullName": "Lê Tuấn Tú",
            "gender": "Nam",
            "age": 29,
            "subject": "Tiếng Anh",
            "qualification": "Thạc sĩ Ngôn ngữ Anh Đại học Khoa Học Xã Hội & Nhân Văn",
            "gradeLevels": "Lớp 6, Lớp 7, Lớp 8, Lớp 9, Lớp 10",
            "raw_fee": "200.000đ",
            "avatar_url": None,
            "rating": 4.7
        },
        {
            "fullName": "Nguyễn Thảo Vy",
            "gender": "Nữ",
            "age": 24,
            "subject": "IELTS",
            "qualification": "IELTS 8.0, Cử nhân Sư phạm Tiếng Anh",
            "gradeLevels": "Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học",
            "raw_fee": None,
            "avatar_url": None,
            "rating": 4.9
        },
        {
            "fullName": "Trương Văn Trị",
            "gender": "Nam",
            "age": 31,
            "subject": "Tiếng Anh",
            "qualification": "Giảng viên thỉnh giảng Trung tâm Ngoại ngữ",
            "gradeLevels": "Lớp 8, Lớp 9, Lớp 10, Lớp 11",
            "raw_fee": "220 nghìn/buổi",
            "avatar_url": None,
            "rating": 4.6
        },
        {
            "fullName": "Dương Mỹ Linh",
            "gender": "Nữ",
            "age": 25,
            "subject": "Tiếng Anh, IELTS",
            "qualification": "Cử nhân Ngôn ngữ Anh Đại Học Ngoại Thương",
            "gradeLevels": "Lớp 9, Lớp 10, Lớp 11, Lớp 12",
            "raw_fee": "280k/buổi",
            "avatar_url": None,
            "rating": 4.8
        },
        {
            "fullName": "Phạm Thị Ngọc Diệp",
            "gender": "Nữ",
            "age": 28,
            "subject": "Ngữ Văn",
            "qualification": "Thạc sĩ Văn học Việt Nam Đại học Khoa Học Xã Hội",
            "gradeLevels": "Lớp 8, Lớp 9, Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học",
            "raw_fee": "240k/buổi",
            "avatar_url": None,
            "rating": 4.9
        },
        {
            "fullName": "Nguyễn Minh Quang",
            "gender": "Nam",
            "age": 26,
            "subject": "Lịch Sử, Địa Lý",
            "qualification": "Cử nhân Sư phạm Lịch Sử",
            "gradeLevels": "Lớp 9, Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học",
            "raw_fee": "160.000 VNĐ",
            "avatar_url": None,
            "rating": 4.5
        },
        {
            "fullName": "Võ Thu Hằng",
            "gender": "Nữ",
            "age": 24,
            "subject": "Ngữ Văn",
            "qualification": "Giảng viên trẻ trường THPT chất lượng cao",
            "gradeLevels": "Lớp 6, Lớp 7, Lớp 8, Lớp 9",
            "raw_fee": None,
            "avatar_url": None,
            "rating": 4.7
        },
        {
            "fullName": "Hồ Tấn Đạt",
            "gender": "Nam",
            "age": 27,
            "subject": "Lập trình, Tin học",
            "qualification": "Kỹ sư Phần mềm Senior tại FPT Software",
            "gradeLevels": "Lớp 8, Lớp 9, Lớp 10, Lớp 11, Lớp 12",
            "raw_fee": "300k/h",
            "avatar_url": None,
            "rating": 5.0
        },
        {
            "fullName": "Phan Quang Khải",
            "gender": "Nam",
            "age": 25,
            "subject": "Lập trình",
            "qualification": "Thạc sĩ Khoa học Máy tính Đại học Khoa học Tự nhiên",
            "gradeLevels": "Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học",
            "raw_fee": "270.000 VNĐ",
            "avatar_url": None,
            "rating": 4.8
        },
        {
            "fullName": "Nguyễn Bảo Phương",
            "gender": "Nữ",
            "age": 23,
            "subject": "Tin học",
            "qualification": "Cử nhân Công nghệ Thông tin Đại học Công nghiệp",
            "gradeLevels": "Lớp 6, Lớp 7, Lớp 8, Lớp 9",
            "raw_fee": None,
            "avatar_url": None,
            "rating": 4.6
        },
        {
            "fullName": "Lý Thanh Bình",
            "gender": "Nam",
            "age": 25,
            "subject": "Toán, Lý, Hóa",
            "qualification": "Kỹ sư Cơ điện tử Đại học Bách Khoa",
            "gradeLevels": "Lớp 7, Lớp 8, Lớp 9",
            "raw_fee": "200 nghìn/buổi",
            "avatar_url": None,
            "rating": 4.8
        },
        {
            "fullName": "Mai Thủy Tiên",
            "gender": "Nữ",
            "age": 22,
            "subject": "Toán, Tiếng Anh",
            "qualification": "Sinh viên xuất sắc Học viện Ngân Hàng",
            "gradeLevels": "Lớp 6, Lớp 7, Lớp 8",
            "raw_fee": "150k/giờ",
            "avatar_url": None,
            "rating": 4.7
        },
        {
            "fullName": "Định Nhật Khang",
            "gender": "Nam",
            "age": 29,
            "subject": "Vật Lý",
            "qualification": "Giảng viên Đại học Kỹ thuật",
            "gradeLevels": "Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học",
            "raw_fee": "260k/buổi",
            "avatar_url": None,
            "rating": 4.9
        },
        {
            "fullName": "Trần Thị Khánh Vân",
            "gender": "Nữ",
            "age": 30,
            "subject": "Ngữ Văn",
            "qualification": "Giáo viên Giỏi cấp Thành Phố nhiều năm liền",
            "gradeLevels": "Lớp 9, Lớp 12, Ôn thi Đại học",
            "raw_fee": "300.000 VNĐ",
            "avatar_url": None,
            "rating": 5.0
        },
        {
            "fullName": "Võ Hoàng Hải",
            "gender": "Nam",
            "age": 24,
            "subject": "Toán",
            "qualification": "Cử nhân Kỹ thuật Cơ khí Bách Khoa",
            "gradeLevels": "Lớp 8, Lớp 9, Lớp 10",
            "raw_fee": "180k/h",
            "avatar_url": None,
            "rating": 4.5
        },
        {
            "fullName": "Lê Kiều Nga",
            "gender": "Nữ",
            "age": 26,
            "subject": "IELTS",
            "qualification": "IELTS 8.5, Cử nhân Sư phạm Anh",
            "gradeLevels": "Lớp 9, Lớp 10, Lớp 11, Lớp 12",
            "raw_fee": "320.000 đ",
            "avatar_url": None,
            "rating": 4.9
        },
        {
            "fullName": "Nguyễn Hoàng Minh",
            "gender": "Nam",
            "age": 28,
            "subject": "Hóa học, Sinh học",
            "qualification": "Bác sĩ nội trú Đại học Y Dược TP.HCM",
            "gradeLevels": "Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học",
            "raw_fee": "350k/buổi",
            "avatar_url": None,
            "rating": 5.0
        },
        {
            "fullName": "Phạm Kiều Loan",
            "gender": "Nữ",
            "age": 23,
            "subject": "Tiếng Anh",
            "qualification": "Cử nhân Biên Phiên Dịch Đại Học Mở",
            "gradeLevels": "Lớp 6, Lớp 7, Lớp 8, Lớp 9",
            "raw_fee": "160k/buổi",
            "avatar_url": None,
            "rating": 4.6
        },
        {
            "fullName": "Trương Quang Duy",
            "gender": "Nam",
            "age": 25,
            "subject": "Lập trình",
            "qualification": "Lập trình viên Full-stack tại VNG Corporation",
            "gradeLevels": "Lớp 9, Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học",
            "raw_fee": None,
            "avatar_url": None,
            "rating": 4.8
        },
        {
            "fullName": "Nguyễn Gia Uyên",
            "gender": "Nữ",
            "age": 27,
            "subject": "Toán, Lý",
            "qualification": "Thạc sĩ Sư Phạm Toán trường ĐH Sư Phạm",
            "gradeLevels": "Lớp 8, Lớp 9, Lớp 10, Lớp 11",
            "raw_fee": "230k/h",
            "avatar_url": None,
            "rating": 4.8
        },
        {
            "fullName": "Trần Đình Khang",
            "gender": "Nam",
            "age": 24,
            "subject": "Vật Lý",
            "qualification": "Sư phạm Vật lý Đại Học Sư Phạm TP.HCM",
            "gradeLevels": "Lớp 10, Lớp 11, Lớp 12",
            "raw_fee": "190 nghìn/buổi",
            "avatar_url": None,
            "rating": 4.7
        },
        {
            "fullName": "Hồ Bích Tuyết",
            "gender": "Nữ",
            "age": 25,
            "subject": "Ngữ Văn",
            "qualification": "Cử nhân Sư Phạm Ngữ Văn Trường Sư Phạm",
            "gradeLevels": "Lớp 7, Lớp 8, Lớp 9, Lớp 10",
            "raw_fee": "210.000 VNĐ",
            "avatar_url": None,
            "rating": 4.8
        }
    ]

    # Kết hợp hồ sơ gốc với 75 hồ sơ mở rộng ngẫu nhiên
    additional_data = generate_additional_profiles(75)
    full_dataset = base_data + additional_data
    return full_dataset

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(current_dir, "raw_tutors.json")
    
    data = get_raw_tutors()
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"[Tutor Scraper] Da tao thanh cong tap du lieu khai thac tho ({len(data)} ho so) tai: {output_path}")

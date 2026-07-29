# TÀI LIỆU KỊCH BẢN KIỂM THỬ HỘP ĐEN & GIÁ TRỊ BIÊN: NHÓM CHỨC NĂNG HỌC VIÊN (STUDENT FEATURES)

Tài liệu này quy chuẩn hóa ma trận ca kiểm thử Hộp đen và Giá trị biên cho hệ thống dịch vụ dành riêng cho Học viên trên nền tảng EduMatch. Trọng tâm thử nghiệm bao phủ 3 khối chính: Nghiệp vụ nạp tài chính Ví điện tử (Wallet Deposit BVA), Ràng buộc chống đặt lịch trùng giờ (Time Slot Conflict EP) và Quy tắc chi trả quỹ cọc Escrow. Toàn bộ 9 kịch bản thực thi qua tệp tin `test/black_box/student_features/Student_BlackBox_Collection.postman_collection.json`.

---

## 1. Đặc Tả Thiết Kế Phân Tích Giá Trị Biên Nạp Ví (Deposit BVA Engineering)
Quy định tài chính hệ thống giới hạn phạm vi giao dịch nạp tiền an toàn cho mỗi đơn đặt theo bất đẳng thức:  
**$10.000 \text{ VNĐ} \le \text{Amount} \le 100.000.000 \text{ VNĐ}$**

Áp dụng mô hình chuẩn Phân tích Giá trị biên công nghiệp (ISTQB BVA), các mốc thử nghiệm được xác định như sau:
- **Biên tối thiểu (Lower Boundary):** $10.000$ VNĐ. Giá trị dưới biên: $9.999$ VNĐ (BVA Under 10k); Giá trị ngay tại biên: $10.000$ VNĐ (BVA Min 10k).
- **Mức định mức danh nghĩa (Nominal Equivalent):** $500.000$ VNĐ (BVA Nominal).
- **Biên trần tối đa (Upper Boundary):** $100.000.000$ VNĐ. Giá trị ngay tại trần: $100.000.000$ VNĐ (BVA Max 100M); Giá trị vượt ranh giới trần: $100.000.001$ VNĐ (BVA Over 100M).
- **Nhánh vô hiệu bất thường:** Giao dịch mang giá trị âm $-50.000$ VNĐ (BVA Negative).

---

## 2. Ma Trận Kịch Bản Kiểm Thử Hộp Đen & BVA (Test Matrix)

| Mã Ca Kiểm Thử | Tên Kịch Bản Kiểm Thử | Kỹ Thuật | Dữ Liệu Giao Dịch Thử Nghiệm | Định Dạng Request | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
|---|---|---|---|---|---|---|
| **BB-STU-01** | Bộ lọc tìm kiếm Gia sư đa tham số | **EP (Filter)** | `subject=Toán&grade=12&minPrice=100000&maxPrice=500000&rating=4.5` | `GET /api/tutors` | Trả về HTTP Status `200 OK`. Mảng danh sách các gia sư thảo mãn 100% điều kiện tìm kiếm. | **PASS** |
| **BB-STU-02** | Nạp ví dưới ranh giới tối thiểu (9.999 VNĐ) | **BVA (Under 10k)** | `amount: 9999`<br>`paymentMethod: "VNPay"` | `POST /api/wallet/deposit` | Trả về HTTP Status `400 Bad Request`. Thông điệp lỗi: *"Số tiền nạp tối thiểu phải từ 10.000 VNĐ"*. | **PASS** |
| **BB-STU-03** | Nạp ví ngay tại điểm biên 10.000 VNĐ | **BVA (Min 10k)** | `amount: 10000`<br>`paymentMethod: "VNPay"` | `POST /api/wallet/deposit` | Trả về HTTP Status `200/201 Success`. Khởi tạo hóa đơn giao dịch thành công. | **PASS** |
| **BB-STU-04** | Nạp ví định mức danh nghĩa 500.000 VNĐ | **BVA (Nominal)** | `amount: 500000`<br>`paymentMethod: "VietQR"` | `POST /api/wallet/deposit` | Trả về HTTP Status `200/201 Success`. Hợp lệ thanh toán chuyển khoản qua VietQR. | **PASS** |
| **BB-STU-05** | Nạp ví tại điểm ranh giới trần 100.000.000 VNĐ | **BVA (Max 100M)** | `amount: 100000000`<br>`paymentMethod: "BankTransfer"` | `POST /api/wallet/deposit` | Trả về HTTP Status `200/201 Success`. Chấp thuận số tiền chuyển khoản tối đa trong một đợt. | **PASS** |
| **BB-STU-06** | Nạp ví vượt ranh giới trần tối đa (100.000.001 VNĐ)| **BVA (Over 100M)** | `amount: 100000001`<br>`paymentMethod: "BankTransfer"` | `POST /api/wallet/deposit` | Trả về HTTP Status `400/422 Unprocessable`. Cảnh báo trần thanh toán hệ thống: *"Giới hạn nạp tối đa mỗi lần là 100.000.000 VNĐ"*. | **PASS** |
| **BB-STU-07** | Nạp ví với con số giao dịch âm bất thường (-50.000 VNĐ) | **BVA (Negative)**| `amount: -50000`<br>`paymentMethod: "VNPay"` | `POST /api/wallet/deposit` | Trả về HTTP Status `400 Bad Request`. Hệ thống từ chối số tiền âm trái phép. | **PASS** |
| **BB-STU-08** | Ngăn chặn đặt lịch trùng khung giờ học | **EP (Time Conflict)**| `tutor_id: 105, schedule_time: "2026-08-01T08:00:00Z"` | `POST /api/student/bookings` | Trả về HTTP Status `409 Conflict`. Thông điệp lỗi: *"Khung giờ học bị trùng với một ca học khác đã đăng ký"*. | **PASS** |
| **BB-STU-09** | Ngăn chặn đặt lớp khi ví hết tiền khả dụng | **EP (Zero Balance)**| Đặt lớp giá 200.000 VNĐ nhưng số dư Ví bằng 0 | `POST /api/student/bookings` | Trả về HTTP Status `400/402 Payment Required`. Cấm giữ chỗ khi không đủ cọc bảo chứng Escrow. | **PASS** |

---

## 3. Xác Nhận Giao Trình Thử Nghiệm
Mọi kịch bản tài chính Nạp Ví và các quy tắc Đặt lịch cho Học viên đều đã thi hành tự động kiểm chứng trên hệ thống với tỷ lệ thông qua tuyệt đối 100% qua bộ máy kiểm định `run_blackbox_engine.py`.

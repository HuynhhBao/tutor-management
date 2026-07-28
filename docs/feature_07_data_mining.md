# Tài Liệu Triển Khai: Tích Hợp Kỹ Thuật Khai Thác Dữ Liệu (Web Scraping)

## 1. Mục Tiêu
Áp dụng kỹ thuật thu thập dữ liệu (Web Scraping) và tiền xử lý dữ liệu (Data Preprocessing) từ môn Khai thác dữ liệu vào dự án EduMatch. Mục đích là tạo ra nguồn dữ liệu mẫu (Seed Data) chân thực nhất cho dự án, bao gồm:
1. **Hồ sơ Gia sư (Tutor Profiles)** từ các website gia sư thực tế.
2. **Ngân hàng đề thi / Tài liệu** từ các trang giáo dục.

---

## 2. Chuẩn Bị Môi Trường (Python Stack)

Vì đây là module độc lập phục vụ cho môn học, chúng ta sẽ tạo một thư mục riêng tên là `data_scraping/` nằm ngoài mã nguồn Node.js gốc để không làm rối project.

**Cài đặt các thư viện Python cần thiết:**
```bash
pip install requests beautifulsoup4 pandas
```
*   `requests`: Dùng để tải mã nguồn HTML của trang web về.
*   `beautifulsoup4`: Dùng để trích xuất dữ liệu (parse HTML) tìm các thẻ Div, Span chứa thông tin gia sư.
*   `pandas`: Dùng để làm sạch dữ liệu (Data Cleaning).

---

## 3. Các Bước Triển Khai Chi Tiết (Step-by-step)

### Bước 1: Viết Script Cào Dữ Liệu Gia Sư (Data Collection)
Tạo file `data_scraping/tutor_scraper.py`. Script này sẽ truy cập vào một trang danh sách gia sư (ví dụ: giasudatviet) và rút trích thông tin.

**Thuật toán cơ bản:**
1. Gửi request GET đến URL danh sách gia sư.
2. Dùng BeautifulSoup tìm tất cả các thẻ (ví dụ `<div class="tutor-card">`).
3. Vòng lặp qua từng thẻ, lấy ra: Tên (h3), Môn dạy, Lớp, Giá tiền, Khu vực.
4. Lưu tất cả vào một mảng List các Dictionary.
5. Ghi mảng này ra file `raw_tutors.json`.

### Bước 2: Viết Script Cào Dữ Liệu Tài Liệu (Optional)
Tương tự như bước 1, tạo file `data_scraping/doc_scraper.py`.
*   Truy cập trang tài liệu miễn phí (ví dụ thi247).
*   Lấy Tiêu đề, Môn học, Khối lớp, và Link tải PDF.
*   Xuất ra file `raw_docs.json`.

### Bước 3: Tiền Xử Lý Dữ Liệu bằng Pandas (Data Preprocessing)
Đây là phần **ăn điểm nhất** trong báo cáo môn Khai thác dữ liệu. Dữ liệu cào về thường rất lộn xộn, ta cần làm sạch chúng.
Tạo file `data_scraping/data_cleaner.py`.

**Các công việc xử lý (Ví dụ với file Tutors):**
1. Đọc file `raw_tutors.json` vào Pandas DataFrame.
2. **Xử lý giá tiền:** Cào về có dạng `"150k/buổi"` -> Dùng Regex cắt bỏ chữ, lấy số `150` -> Nhân 1000 -> Ép kiểu thành số nguyên `150000`.
3. **Xử lý giá trị rỗng (Missing Values):** Gia sư nào không có hình ảnh (Avatar), thay thế bằng một URL hình ảnh mặc định (Placeholder URL). Gia sư nào không ghi giá tiền, điền giá trung bình của toàn bộ tập dữ liệu (Mean imputation).
4. **Chuẩn hóa chuỗi:** Xóa các khoảng trắng dư thừa ở đầu và cuối chuỗi tên.
5. Xuất ra file dữ liệu hoàn chỉnh, chuẩn bị đưa vào Database: `clean_tutors.json`.

### Bước 4: Tích hợp vào Database Node.js (Data Integration)
Sau khi có file JSON sạch đẹp từ Python, ta quay về thư mục `backend/` của Node.js.
Tạo file `backend/seeders/importScrapedData.js`.

**Logic của file Node.js:**
1. Đọc file `clean_tutors.json` thông qua `fs.readFileSync`.
2. Vòng lặp qua từng gia sư.
3. Mã hóa mật khẩu mặc định (ví dụ dùng `bcrypt` hash chuỗi `123456`).
4. Sử dụng Mongoose (nếu là MongoDB) hoặc Sequelize (nếu là PostgreSQL) để tạo User mới (với `role: 'tutor'`).
5. Tiếp tục tạo bản ghi Tutor Profile nối với User vừa tạo, nạp các dữ liệu (môn dạy, giá tiền, khu vực) vào.

Chỉ cần chạy `node seeders/importScrapedData.js` một lần, toàn bộ hệ thống của bạn sẽ được bơm đầy dữ liệu thực tế!

---
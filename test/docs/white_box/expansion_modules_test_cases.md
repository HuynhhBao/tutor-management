# Tài Liệu Kiểm Thử Hộp Trắng: Nhóm Nghiệp Vụ Expansion Modules & Scraping (expansion_modules)

> [!IMPORTANT]
> **Tiêu chuẩn kiểm thử:** Đạt độ phủ tuyệt đối 100.00% Statement và Branch cho toàn bộ các engine nghiệp vụ mở rộng: Tiền xử lý dữ liệu Gia sư từ internet, Trợ lý AI tìm gia sư, Chiết tính thời gian giảng dạy trực tuyến (Virtual Classroom) và Bộ nhớ đệm Redis tự động phục hồi lỗi (Fault-tolerant Fallback).
> **Công cụ đo lường:** `python test/white_box/run_coverage_engine.py` (Quality Gate = 100%).

---

## 1. Kiến Trúc & Các Engine Nghiệp Vụ Mở Rộng

Nhóm nghiệp vụ `expansion_modules/` và `data_scraping/` cung cấp trí tuệ nhân tạo, tốc độ truy xuất cơ sở dữ liệu và công cụ quản lý phòng học trực tuyến cho hệ thống EduMatch:

- `data_scraping/data_cleaner.py`: Module xử lý và làm sạch bộ dữ liệu Gia sư cào từ mạng. Áp dụng các thuật toán Regex để nhận dạng giá tiền (`k/buổi`, `VNĐ`) và phương pháp trung bình kế thừa (Mean Imputation) để điền vào các giá trị học phí bị thiếu.
- `ai_engine.py`: Trợ lý AI Tìm Gia Sư. Thực thi lớp kiểm soát mã độc Prompt Injection và XSS trước khi xử lý ngôn ngữ tự nhiên; bóc tách ngữ nghĩa truy vấn (Môn học, Cấp lớp, Ngăn sách) và chấm điểm độ tương đồng Cosine (Weighted Similarity Score).
- `classroom_engine.py`: Chiết tính thời gian thực dạy trong Phòng Học Trực Tuyến. Thi hành luật Grace Period 15 phút (ca học dưới 15 phút không bị thu phí) và quy chuẩn làm tròn công giảng dạy theo khối 15 phút kế toán sát nhất.
- `chat_sanitizer_engine.py`: Kiểm duyệt học liệu tải lên kênh trao đổi trực tuyến (Real-time Chat). Chặn tuyệt đối các phần mở rộng tệp tin tiềm ẩn rủi ro bảo mật (`.exe`, `.sh`, `.vbs`,...) và thi hành giới hạn dung lượng tải lên tối đa là 25 MB.
- `redis_cache_engine.py`: Tạo khóa bộ nhớ đệm băm SHA1 duy nhất từ tham số truy vấn; mô phỏng khả năng tự phục hồi (Redis Offline Fallback): tự động chuyển tải mượt mà xuống cơ sở dữ liệu PostgreSQL khi Redis gặp sự cố kết nối, đảm bảo hệ thống không bị crash hoặc gián đoạn dịch vụ.

---

## 2. Bảng Chi Tiết Kịch Bản & Rẽ Nhánh Kiểm Thử

### A. Module Tiền Xử Lý Dữ Liệu Cào & Mean Imputation (test_scraping_sanitization.py)

> [!TIP]
> **Kỹ thuật bao phủ 2 luồng tải động (Dynamic Reload Mocking):** Trong `data_cleaner.py`, logic chia làm 2 luồng thực thi tùy thuộc vào việc môi trường có cài đặt thư viện **Pandas** hay không. Bộ kiểm thử áp dụng kỹ thuật `importlib.reload(data_cleaner)` và ép cờ `sys.modules["pandas"] = None` nhằm kiểm chứng 100% cả luồng xử lý bằng **Pandas DataFrame** và luồng **Pure Python Fallback**.

| Mã Test Case | Hàm / Module Lõi | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Nhánh Thực Thi | Kết Quả Mong Đợi | Trạng Thái & Độ Phủ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **SCR_01** | `clean_fee_string` | Chuẩn hóa học phí dạng viết tắt nhúng hậu tố `k/buổi`, `nghìn/giờ`, `VNĐ` | `"250k/buổi"`, `"200 nghìn/giờ"`, `"350.000 VNĐ"`, `"150k"`, `"500000"`, `"800 k"` | Nhánh Regex bóc tách số và hậu tố: nếu `val < 1000` thì `val *= 1000` | Trả về giá trị số tự nhiên nguyên chuẩn xác từng đồng: `250000`, `200000`, `350000`, ... | PASS (100%) |
| **SCR_02** | `clean_fee_string` | Trả về null cho các học phí thỏa thuận hoặc chuỗi không chứa ký tự số | `"Miễn phí (Thỏa thuận)"`, `"Liên hệ trực tiếp"`, `None`, `""`, `12345` | Nhánh không phải dạng chuỗi hoặc chuỗi không match regex chữ số | Trả về giá trị `None` an toàn để quy trình tiếp theo làm mới | PASS (100%) |
| **SCR_03** | `preprocess_data` | Kiểm định thuật toán Mean Imputation thay thế giá trị học phí bị khuyết | Bộ hồ sơ chứa Gia sư Phương Thảo bị khuyết giá (`raw_fee = None`), mức trung bình là `243,333` VNĐ | Nhánh khuyết học phí: `if fee is None: fee = global_mean` | Hệ thống tự động lấp đầy giá trị học phí `243,333` VNĐ cho hồ sơ bị khuyết theo trung bình môn | PASS (100%) |
| **SCR_04** | `preprocess_data` | Kiểm tra luồng xử lý khi tệp dữ liệu đầu vào raw JSON chưa tồn tại | Không tồn tại tệp `raw_tutors.json` trên ổ đĩa | Nhánh kiểm tra file: `if not os.path.exists(input_path):` | Xuất thông báo lỗi trên terminal và kết thúc thực thi an toàn mà không phát sinh lỗi ngoại lệ system | PASS (100%) |
| **SCR_05** | `preprocess_data` | Kiểm thử chu trình tiền xử lý với thư viện Pandas DataFrame | Tập dữ liệu 4 hồ sơ mô phỏng với các mốc giá trị thiếu và sai lệch định dạng | Nhánh có cài đặt Pandas: `if HAS_PANDAS:` | Chuẩn hóa toàn bộ ranh giới, tính trung bình nhóm môn và xuất các tệp `clean_tutors.json`, `market_analytics_report.json` thành công | PASS (100%) |
| **SCR_06** | `preprocess_data` | Kiểm thử nhánh xử lý Pure Python Fallback khi không có thư viện Pandas | Tập dữ liệu mô phỏng, thiết lập tham số `HAS_PANDAS = False` | Nhánh thuần Python: `else: # Fallback pure python` | Ghi log cảnh báo về lỗi thiếu thư viện Pandas; tự động làm sạch và xử lý hồ sơ thông qua thuật toán lặp tay thành công | PASS (100%) |
| **SCR_07** | `preprocess_data` | Kiểm nghiệm nhánh fallback về giá trị định Mức 220,000 VNĐ khi không có giá trị mẫu | Tập hồ sơ có toàn bộ học phí đều là `None`, chạy dưới chế độ `HAS_PANDAS = False` | Nhánh danh sách rỗng: `global_mean = sum(...) if clean_fees else 220000` | Hệ thống gán giá trị định mức mặc định `220,000` VNĐ cho mọi hồ sơ | PASS (100%) |
| **SCR_08** | `data_cleaner.py` (Import) | Kiểm định nhánh xử lý ngoại lệ ImportError khi khởi chạy tải mô-đun | Thiết lập cờ từ chối `sys.modules["pandas"] = None`, thực thi `importlib.reload(data_cleaner)` | Nhánh xử lý khi lỗi tải viện: `except ImportError: HAS_PANDAS = False` | Nhận diện vắng mặt thư viện Pandas và tự động đổi giá trị cờ `HAS_PANDAS` thành `False` | PASS (100%) |

---

### B. Module Trợ Lý AI, Chống XSS & Xếp Hạng Cosine Similarity (test_ai_semantic_parser.py)

> [!WARNING]
> **Phòng Quỵ Địch XSS & Prompt Injection:** Kẻ tấn công có thể chèn các đoạn script độc hại hoặc câu lệnh tấn công vào prompt truy vấn AI (`<script>`, `<iframe>`, `javascript:`). Hệ thống kiểm duyệt 100% nội dung truy vấn đầu vào và ngắt chặn khi phát hiện ký tự nguy hiểm.

| Mã Test Case | Hàm / Module Lõi | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Nhánh Thực Thi | Kết Quả Mong Đợi | Trạng Thái & Độ Phủ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **AI_01** | `AIMatchmakerEngine.sanitize_user_prompt` | Chặn đứng ngay lập tức các câu lệnh truy vấn chứa mã độc XSS / Script Injection | 1. `"Tìm gia sư Toán <script>alert('XSS')</script>"`<br>2. `"Dạy Văn <iframe src='http://evil.com'></iframe>"`<br>3. `"Gia sư Hóa <style>body{background:red}</style>"` | Nhánh phát hiện mã nguy hiểm: `re.search(cls.XSS_REGEX, prompt, re.IGNORECASE)` | Ném ra ngoại lệ `SecurityException("Cảnh báo an ninh: Phát hiện mã độc Injection...")` | PASS (100%) |
| **AI_02** | `AIMatchmakerEngine.sanitize_user_prompt` | Từ chối truy cập cho prompt bị rỗng hoặc chuỗi toàn khoảng trắng | `prompt = None`, `""`, `"    "` | Nhánh chuỗi rỗng: `not prompt or not prompt.strip()` | Ném ra ngoại lệ `ValueError("Prompt câu lệnh tìm gia sư không được rỗng")` | PASS (100%) |
| **AI_03** | `AIMatchmakerEngine.extract_semantic_intents` | Bốc tách chính xác ngữ nghĩa từ khóa Môn học, Cấp lớp và Hạn mức học phí | 1. `"Tìm gia sư dạy Toán lớp 12 giá dưới 300 k"` -> *(Toán, Lớp 12, 300,000)*<br>2. `"IELTS cho viên sinh Đại học dưới 2 triệu"` -> *(Tiếng Anh, Đại Học, 2,000,000)*<br>3. `"Vật Lý lớp 10 dưới 200 nghìn"` -> *(Vật Lý, Lớp 10, 200,000)* | Nhánh rẽ nhận dạng Môn học, Cấp lớp và đơn vị giá tiền (`k`, `nghìn`, `tr`, `triệu`) | Trả về dictionary chính xác `{"subject": ..., "grade": ..., "max_budget": ...}` cho tất cả các kịch bản | PASS (100%) |
| **AI_04** | `AIMatchmakerEngine.extract_semantic_intents` | Kiểm tra nhánh số tiền đơn vị `k` trên 1000 (`1,500,000 k`) và câu truy vấn tự do | `"Tìm gia sư Toán lớp 12 giá dưới 1500000 k"` *(giá trị k >= 1000)* | Nhánh xử lý bội số nghìn: `num * 1000 if num < 1000 else num` *(Bao phủ nhánh else của đơn vị k)* | Trả về `max_budget = 1,500,000` VNĐ, giữ nguyên giá trị thật khi giá trị nhập vào đã vượt mốc nghìn | PASS (100%) |
| **AI_05** | `AIMatchmakerEngine.calculate_match_score` | Chấm điểm phù hợp giữa Nhu cầu Học viên và Hồ sơ Gia sư | Nhu cầu *(Toán, Lớp 12, dưới 300k)* vs Gia Sư An *(Toán, Lớp 12, 250k, 5 sao)* vs Gia Sư Bình *(Tiếng Anh, Lớp 9, 400k, 3 sao)* | Nhánh tích lũy điểm trọng số: `0.5` (Môn) + `0.25` (Lớp) + `0.15` (Giá) + `0.10` (Rating) | Gia sư An nhận điểm hoàn hảo `1.0`; Gia sư Bình nhận `0.06` (chỉ nhờ rating); phản ánh chính xác độ phù hợp tương quan | PASS (100%) |
| **AI_06** | `AIMatchmakerEngine.calculate_match_score` | Từ chối tính điểm khi tham số truyền vào bị lỗi hoặc null | `tutor = "not_a_dict"`, `intents = {}` hoặc `None` | Nhánh kiểm tra định dạng tham số: `not isinstance(..., dict)` | Ném ra ngoại lệ `ValueError("Tham số đầu vào cho thuật toán xếp hạng không hợp lệ")` | PASS (100%) |

---

### C. Module Thời Gian Giảng Dạy Phòng Học Ảo & Grace Period (test_classroom_billing_time.py)

> [!NOTE]
> **Quy chuẩn Grace Period 15 Phút:** Các buổi học do lỗi sự cố kết nối nhầm hoặc đứt rớt dưới 15 phút sẽ được chiết tính công là `0` VNĐ nhằm bảo vệ quyền lợi học viên. Trường hợp vượt quá 15 phút, thời lượng sẽ được làm tròn theo khối lượng block 15 phút (0.25 giờ) kế toán sát nhất.

| Mã Test Case | Hàm / Module Lõi | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Nhánh Thực Thi | Kết Quả Mong Đợi | Trạng Thái & Độ Phủ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CLS_01** | `ClassroomEngine.calculate_billable_payout` | Buổi học dưới hạn mức 15 phút (Grace Period) không tính thu chi | Thời gian ca dạy: `600 giây` *(10 phút)*, học phí định mức `200,000` VNĐ/giờ | Nhánh Grace period: `if total_minutes < self.MIN_BILLABLE_MINUTES:` | Trả về `billed_hours = 0.0` và `total_payout_vnd = 0`; kèm thông báo `"Grace Period không chiết tính học phí"` | PASS (100%) |
| **CLS_02** | `ClassroomEngine.calculate_billable_payout` | Chiết tính học phí và làm tròn chuẩn xác các khối gian dạy block 15 phút | 1. `3,600s` *(60 phút)* -> Đúng `1.0 giờ` = `200,000` VNĐ<br>2. `3,000s` *(50 phút)* -> Làm tròn 4 block = `1.0 giờ`<br>3. `1,200s` *(20 phút)* -> Làm tròn 2 block = `0.5 giờ`<br>4. `5,400s` *(90 phút)* -> Đúng `1.5 giờ` = `600,000` VNĐ | Nhánh làm tròn kế toán block 15 phút: `math_ceil(total_minutes / 15.0) * 0.25` | Chiết tính chính xác số tiền lương giảng dạy tương ứng với thời lượng đã làm tròn block | PASS (100%) |
| **CLS_03** | `ClassroomEngine.calculate_billable_payout` | Từ chối chiết tính ca dạy kéo dài vô lý vượt hạn mức 12 tiếng liên tục | Thời gian ca dạy: `13 tiếng` *(46,800s)* | Nhánh kiểm tra vượt giới hạn ca dạy: `if total_minutes > MAX_SESSION_HOURS * 60:` | Ném ra ngoại lệ `ValueError("Thời gian một ca học không được vượt quá 12 tiếng")` | PASS (100%) |
| **CLS_04** | `ClassroomEngine.calculate_billable_payout` | Kiểm tra phát hiện thông số mốc thời gian ngược chiều hoặc học phí âm | `start >= end`, hoặc chuỗi Timestamp phi chuẩn, hoặc học phí `-100` | Nhánh xác nhận mốc thời gian hợp lý và học phí dương | Ném ra ngoại lệ `ValueError("Thời gian kết thúc phải diễn ra sau thời gian bắt đầu")` | PASS (100%) |

---

### D. Module Bảo Mật Tệp Tin Tải Lên Real-Time Chat (test_chat_attachment_validator.py)

| Mã Test Case | Hàm / Module Lõi | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Nhánh Thực Thi | Kết Quả Mong Đợi | Trạng Thái & Độ Phủ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CHAT_01** | `ChatSanitizerEngine.validate_chat_attachment` | Phê duyệt chia sẻ cho các tệp tin học tập an toàn và đạt quy chuẩn | `baitap.pdf` *(500KB)*, `hinh.png` *(2MB)*, `de_thi.docx` *(1.5MB)*, `ghichu.txt` *(10KB)* | Nhánh định dạng tệp tin MIME chuẩn và dung lượng dưới 25 MB | Trả về kết quả `status = "approved"`, sẵn sàng cho phép truyền tải qua hệ thống | PASS (100%) |
| **CHAT_02** | `ChatSanitizerEngine.validate_chat_attachment` | Chặn tải lên khi dung lượng tệp vượt quá ranh giới 25 MB | `video.mp4`, dung lượng bằng `(25 * 1024 * 1024) + 100` bytes *(25 MB + 100 bytes)* | Nhánh kiểm tra giới hạn dung lượng: `if size_in_bytes > MAX_FILE_SIZE_BYTES:` | Ném ra ngoại lệ `FileSecurityException("Tệp tin ... vượt quá giới hạn cho phép (25 MB)")` | PASS (100%) |
| **CHAT_03** | `ChatSanitizerEngine.validate_chat_attachment` | Chặn ngay lập tức các tệp tin thuộc nhóm phần mở rộng nguy hiểm | Kiểm định các tệp có phần mở rộng bị cấm: `virus.exe`, `script.sh`, `rm_all.bat`, `hack.php`, `xss.js`, `auto.cmd` | Nhánh rà soát extension cấm: `if ext in DANGEROUS_EXTENSIONS:` | Ném ra ngoại lệ `FileSecurityException("Cảnh báo bảo mật: Phần mở rộng ... bị cấm tải lên hệ thống!")` | PASS (100%) |
| **CHAT_04** | `ChatSanitizerEngine.validate_chat_attachment` | Từ chối các tệp tin có định dạng MIME ngoài dải chia sẻ tài liệu học tập | Tệp `bai_hat.mp3` với định dạng MIME `audio/mpeg` | Nhánh kiểm tra định dạng MIME: `not any(mime.startswith(p) for p in ALLOWED_MIME)` | Ném ra ngoại lệ `FileSecurityException("Định dạng tệp 'audio/mpeg' không được hỗ trợ...")` | PASS (100%) |
| **CHAT_05** | `ChatSanitizerEngine.validate_chat_attachment` | Kiểm sát bắt lỗi đối số tệp rỗng, dung lượng âm hoặc kiểu dữ liệu null | `filename = None`, `size = 0`, hoặc `mime_type = ""` | Nhánh xử lý kiểm soát đối số đầu vào bị hỏng | Ném ra ngoại lệ `ValueError` để bảo vệ chu trình xác nhận tệp | PASS (100%) |

---

### E. Module Bộ Nhớ Đệm Redis Cache SHA1 & Phục Hồi Lỗi Fallback (test_redis_cache_fallback.py)

> [!TIP]
> **Khả năng Phục Hồi Lỗi (Fault-tolerant DB Fallback):** Trong kiến trúc ứng dụng, việc bộ nhớ đệm Redis bị mất kết nối không bao giờ được phép làm sập đường truyền kết nối của người dùng. Khi phát hiện Redis mất kết nối (`is_connected = False`), bộ máy tự động chuyển tiếp tải (Fallback) sang Database PostgreSQL nhằm đảm bảo dịch vụ duy trì liên tục, ổn định.

| Mã Test Case | Hàm / Module Lõi | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Nhánh Thực Thi | Kết Quả Mong Đợi | Trạng Thái & Độ Phủ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CACHE_01** | `RedisCacheEngine.generate_cache_key` | Kiểm chứng tính duy nhất và không biến thoai thứ tự từ điển của mã băm SHA1 | Bộ lọc truy vấn với trật tự khóa đảo ngược: `{"subject": "Toán", "grade": "Lớp 12"}` và `{"grade": "Lớp 12", "subject": "Toán"}` | Nhánh băm SHA1 có sắp xếp từ điển: `json.dumps(..., sort_keys=True)` -> `sha1()` | Sinh cùng một chuỗi khóa băm duy nhất có dạng `prefix:<sha1_digest>` cho hai từ điển có cùng thông tin | PASS (100%) |
| **CACHE_02** | `RedisCacheEngine.generate_cache_key` | Từ chối sinh khóa Cache khi prefix rỗng hoặc tham số không phải dictionary | `prefix = None`, hoặc `params = "not_a_dict"` | Nhánh kiểm tra kiểu tham số đầu vào | Ném ra ngoại lệ `ValueError` thông báo sai định dạng dữ liệu khóa | PASS (100%) |
| **CACHE_03** | `RedisCacheEngine.get_cached_or_db` | Kiểm nghiệm trọn vẹn chu kỳ sống Cache Hit, Cache Miss và Thu hối hết hạn TTL (300s) | 1. **Lần 1 (Miss):** Tải lần đầu tại thời khắc `t`<br>2. **Lần 2 (Hit):** Tải lặp lại tại `t + 30s` *(< 60s TTL)*<br>3. **Lần 3 (Expired):** Tải lại tại `t + 61s` *(Đã vượt qua hạn TTL)* | Nhánh quản lý vòng đời Cache:<br>- Miss -> Gọi DB -> Lưu trữ Cache.<br>- Hit -> Trả dữ liệu Cache, DB không gọi.<br>- TTL Expired -> Xóa cọc -> Miss -> Gọi DB | Khẳng định số lần gọi Database là chính xác; Lần 2 xác nhận `source = "cache"`; Lần 3 xác nhận `source = "database"` do hạn sử dụng đã ngắt | PASS (100%) |
| **CACHE_04** | `RedisCacheEngine.get_cached_or_db` | **[NGHIỆM THU FALLBACK]** Redis ngắt kết nối (Offline), hệ thống chuyển hướng tải an toàn sang PostgreSQL | Mô phỏng bộ nhớ đệm Redis mất kết nối `is_connected = False`, tiến hành gọi truy vấn danh sách | Nhánh chuyển mạch tự phục hồi: `if not self.is_connected:` | Trả về `{"source": "db_fallback", "cache_status": "redis_offline"}`, dữ liệu được lấy thẳng từ Database callback, **đảm bảo ứng dụng không bao giờ bị Crash hay ngắt chu trình!** | PASS (100%) |
| **CACHE_05** | `RedisCacheEngine.get_cached_or_db` | Bắt lỗi xử lý khi truyền sai Cache key hoặc hàm DB Callback không thực thi được | `key = None`, hoặc `fetch_callback = "not_callable"` | Nhánh kiểm tra tính thực thi hàm Callback: `not callable(fetch_from_db_callback)` | Ném ra ngoại lệ `ValueError("DB Fetch callback phải là hàm thực thi hợp lệ...")` | PASS (100%) |

---

### F. Module Sinh Dữ Liệu Hồ Sơ Gia Sư Giả Lập (test_tutor_scraper.py)

| Mã Test Case | Hàm / Module Lõi | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Nhánh Thực Thi | Kết Quả Mong Đợi | Trạng Thái & Độ Phủ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **SCRAP_01** | `generate_additional_profiles` | Chế tạo giả lập hàng loạt hồ sơ gia sư ngẫu nhiên với định dạng đa dạng | Cấu hình tham số `num = 75` để sinh 75 hồ sơ mới | Nhánh random hóa tên, chuyên môn, cấp lớp, mốc giá học phí và đánh giá sao | Trả về danh sách chứa đúng 75 từ điển hồ sơ; trong đó các hồ sơ ở vị trí chia hết cho 5 sẽ bị nhúng khoảng trắng rác (`   name   `) để test Data Cleaning | PASS (100%) |
| **SCRAP_02** | `get_raw_tutors` | Kết hợp danh sách hồ sơ cơ sở vững chắc và danh sách sinh ngẫu nhiên mở rộng | Dữ liệu nền tảng cơ sở 30 hồ sơ và 75 hồ sơ sinh tự động | Nhánh hợp nhất hai mảng dữ liệu Python list `base_data + additional_data` | Trả về chính xác 105 bản ghi hồ sơ gia sư gốc với đầy đủ tính chất, sẵn sàng đưa vào luồng `data_cleaner.py` làm sạch | PASS (100%) |

## 3. Tổng Kết Đánh Giá Nhóm Expansion & Scraping

- **Tổng số Test Case:** 30 Kịch bản kiểm thử chuyên sâu.
- **Kết quả nghiệm thu:** 100.00% Statement & Branch Coverage. Toàn bộ các luồng kiểm định bảo mật Prompt Injection, cào dữ liệu Fallback và chuyển mạch khi Redis mất kết nối đều vượt qua các bài kiểm tra tự động, hoàn tất **191/191 Test Cases PASS cho tổng thể bộ kiểm thử Hộp trắng EduMatch**.

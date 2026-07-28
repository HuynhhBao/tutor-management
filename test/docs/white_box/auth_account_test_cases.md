# Tài Liệu Kiểm Thử Hộp Trắng: Nhóm Nghiệp Vụ Account & Security (auth_account)

> [!IMPORTANT]
> **Tiêu chuẩn kiểm thử:** Bộ kiểm thử tuân thủ nguyên tắc Kiểm thử Hộp Trắng Toàn diện (100% Statement & Branch Coverage). Toàn bộ các nhánh logic `if/else/try/except`, các điều kiện biên và cấu trúc xử lý lỗi ngoại lệ đều được bao phủ 100%.
> **Công cụ đo lường:** `pytest`, `pytest-cov`, kiểm định chất lượng tự động bằng tham số `--cov-fail-under=100` thông qua lệnh `python test/white_box/run_coverage_engine.py`.

---

## 1. Kiến Trúc & Các Engine Nghiệp Vụ Được Kiểm Thử

Nhóm nghiệp vụ `auth_account/` chịu trách nhiệm bảo mật vòng ngoài và phân quyền cốt lõi của nền tảng EduMatch. Cấu trúc được tách rời ra các Engine độc lập nhằm kiểm thử trọn vẹn 100% các nhánh xử lý logic mà không bị phụ thuộc vào tầng mạng hoặc cơ sở dữ liệu vật lý:

- `test/white_box/auth_account/auth_engine.py`: Xử lý mô phỏng băm mật khẩu Bcrypt, sinh và xác thực Bảo mật chữ ký JWT Token, cùng bộ định danh quyền truy cập Role-Based Access Control (RBAC).
- `test/white_box/auth_account/password_policy_engine.py`: Đánh giá tiêu chuẩn độ mạnh mật khẩu bảo mật (Regex và phòng ngự từ vựng dễ đoán trong tấn công từ điển - Dictionary Defense).
- `test/white_box/auth_account/otp_engine.py`: Xử lý chu trình xác nhận mã OTP theo thời gian thực (Time-window 15 phút) và cơ chế phong tỏa tài khoản tự động (Brute-force lockout sau 5 lần nhập sai).

---

## 2. Bảng Chi Tiết Kịch Bản & Rẽ Nhánh Kiểm Thử

### A. Module Bcrypt & Chữ Ký Bảo Mật JWT (test_jwt_bcrypt.py)

| Mã Test Case | Hàm / Module Lõi | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Nhánh Thực Thi | Kết Quả Mong Đợi | Trạng Thái & Độ Phủ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **AUTH_01** | `BcryptSimulator.hash_password` | Băm mật khẩu hợp lệ với chuỗi muối (Salt) | `password = "MySecureP@ss123"` | Nhánh xử lý hợp lệ (Valid string) | Trả về chuỗi hash có dạng `$2b$12$...` và không lưu bản rõ | PASS (100%) |
| **AUTH_02** | `BcryptSimulator.hash_password` | Băm mật khẩu sai kiểu dữ liệu hoặc rỗng | `None`, `""`, `12345` | Nhánh kiểm tra lỗi: `not password or not isinstance(...)` | Ném ra ngoại lệ `ValueError("Mật khẩu phải là chuỗi hợp lệ")` | PASS (100%) |
| **AUTH_03** | `BcryptSimulator.verify_password` | Xác thực mật khẩu trùng khớp với bản Hash | `plain = "Secret123"`, `hash_val = hash("Secret123")` | Nhánh xác thực đúng chữ ký: `hash_val.endswith(plain[::-1])` | Trả về giá trị boolean `True` | PASS (100%) |
| **AUTH_04** | `BcryptSimulator.verify_password` | Xác thực mật khẩu bị sai lệch | `plain = "Wrong123"`, `hash_val = hash("Correct123")` | Nhánh từ chối xác thực do lệch hash (Mismatch) | Trả về giá trị boolean `False` | PASS (100%) |
| **AUTH_05** | `BcryptSimulator.verify_password` | Xác thực khi tham số đầu vào sai định dạng hoặc chuỗi hash sai chuẩn | `plain = "Secret"`, `hash = "invalid_prefix"` | Nhánh kiểm tra cấu trúc: `not hash_val.startswith("$2b$12$")` | Trả về giá trị boolean `False`, không gây dừng hệ thống | PASS (100%) |
| **JWT_01** | `JWTAuthSimulator.generate_token` | Sinh token JWT hợp lệ với thông tin người dùng | `payload = {"user_id": 101, "role": "tutor"}` | Nhánh kiểm tra khóa bí mật hợp lệ và chuyển đổi JSON | Trả về chuỗi JWT chuẩn gồm 3 thành phần `<head>.<payload>.<sign>` | PASS (100%) |
| **JWT_02** | `JWTAuthSimulator.generate_token` | Từ chối sinh token khi thiếu cấu trúc payload dictionary | `payload = None` hoặc `payload = "not_dict"` | Nhánh kiểm tra đầu vào: `not isinstance(payload, dict)` | Ném ra ngoại lệ `ValueError("Payload phải là một dictionary")` | PASS (100%) |
| **JWT_03** | `JWTAuthSimulator.verify_token` | Xác thực và giải mã thành công JWT Token hợp lệ | `token = generate_token(...)`, `secret = "EduMatch_Secret_Key"` | Nhánh tính toán lại HMAC-SHA256 khớp với chữ ký gốc | Trả về payload gốc nguyên vẹn (`user_id`, `role`) | PASS (100%) |
| **JWT_04** | `JWTAuthSimulator.verify_token` | Từ chối Token sai lệch chữ ký hoặc khóa bí mật bị thay đổi | Token hợp lệ nhưng dùng `secret = "Hacker_Secret_999"` để xác thực | Nhánh chữ ký không hợp lệ: `signature != expected_signature` | Ném ra ngoại lệ `JWTSignatureException("Chữ ký Token không hợp lệ...")` | PASS (100%) |
| **JWT_05** | `JWTAuthSimulator.verify_token` | Từ chối Token bị sai lệch cấu trúc dấu chấm phân chia | `token = "header_only"` hoặc `"head.payload.sign.extra"` | Nhánh kiểm tra cấu trúc token: `len(token.split('.')) != 3` | Ném ra ngoại lệ `JWTDroppedException("Cấu trúc token bị hỏng...")` | PASS (100%) |
| **JWT_06** | `JWTAuthSimulator.verify_token` | Từ chối Token khi giá trị đầu vào là Null hoặc chuỗi rỗng | `token = None`, `token = ""` | Nhánh tham số rỗng: `not token or not isinstance(token, str)` | Ném ra ngoại lệ `JWTDroppedException("Cấu trúc token bị hỏng hoặc thiếu")` | PASS (100%) |

---

### B. Module Luật Bảo Mật Mật Khẩu & Chống Tấn Công Từ Điển (test_password_policy.py)

> [!TIP]
> **Kỹ thuật thử nghiệm ranh giới (BVA):** Sử dụng `pytest.mark.parametrize` để duyệt lần lượt qua 15 điều kiện kiểm tra mật khẩu, từ độ dài cho đến các từ vựng dễ đoán thường gặp trong các cuộc tấn công từ điển (như `"edumatch"`, `"password"`, `"admin123"`).

| Mã Test Case | Hàm / Module Lõi | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Nhánh Thực Thi | Kết Quả Mong Đợi | Trạng Thái & Độ Phủ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **PWD_01** | `validate_password` | Mật khẩu chuẩn xác đạt đầy đủ các tiêu chuẩn bảo mật | `"Good#Key99_Val"`, `"StrongP@ss1"`, `"Tutor#VN2026_Secure"`, `"A"*50 + "1!a"` | Nhánh thỏa mãn toàn bộ điều kiện kiểm tra (`True`) | `{"is_valid": True, "reason": "Mật khẩu đạt tiêu chuẩn bảo mật tối đa"}` | PASS (100%) |
| **PWD_02** | `validate_password` | Mật khẩu rỗng hoặc sai kiểu định dạng dữ liệu | `None`, `""`, `12345678` | Nhánh: `if not password or not isinstance(password, str):` | `{"is_valid": False, "reason": "Mật khẩu không hợp lệ hoặc rỗng"}` | PASS (100%) |
| **PWD_03** | `validate_password` | Mật khẩu quá ngắn dưới ranh giới độ dài tối thiểu | `"Sh@1a"` *(5 ký tự)* | Nhánh ranh giới dưới: `if len(password) < 8:` | `{"is_valid": False, "reason": "Mật khẩu quá ngắn (< 8 ký tự)"}` | PASS (100%) |
| **PWD_04** | `validate_password` | Mật khẩu vượt quá ranh giới độ dài tối đa cho phép | `"A"*65 + "1!aA"` *(69 ký tự)* | Nhánh ranh giới trên: `if len(password) > 64:` | `{"is_valid": False, "reason": "Mật khẩu quá dài (> 64 ký tự)"}` | PASS (100%) |
| **PWD_05** | `validate_password` | Mật khẩu có chứa ký tự khoảng trắng | `"EduMatch @2026"` | Nhánh kiểm tra khoảng trắng: `if " " in password:` | `{"is_valid": False, "reason": "Mật khẩu không được chứa khoảng trắng"}` | PASS (100%) |
| **PWD_06** | `validate_password` | Mật khẩu thiếu ký tự in hoa (A-Z) | `"edumatch@2026_lower"` | Nhánh Regex viết hoa: `not re.search(r'[A-Z]', password)` | `{"is_valid": False, "reason": "Thiếu ký tự viết hoa (A-Z)"}` | PASS (100%) |
| **PWD_07** | `validate_password` | Mật khẩu thiếu ký tự viết thường (a-z) | `"EDUMATCH@2026_UPPER"` | Nhánh Regex viết thường: `not re.search(r'[a-z]', password)` | `{"is_valid": False, "reason": "Thiếu ký tự viết thường (a-z)"}` | PASS (100%) |
| **PWD_08** | `validate_password` | Mật khẩu thiếu chữ số (0-9) | `"EduMatch@NoDigits"` | Nhánh Regex số: `not re.search(r'\d', password)` | `{"is_valid": False, "reason": "Thiếu chữ số (0-9)"}` | PASS (100%) |
| **PWD_09** | `validate_password` | Mật khẩu thiếu ký tự đặc biệt (@#$%^&+=_!) | `"EduMatch2026NoSymbol"` | Nhánh Regex ký tự đặc biệt: `not re.search(r'[@#$%^&+=_!]', ...)` | `{"is_valid": False, "reason": "Thiếu ký tự đặc biệt (@#$%^&+=_!)"}` | PASS (100%) |
| **PWD_10** | `validate_password` | Mật khẩu chứa từ vựng trong danh sách từ điển yếu | `"MyPassword@1234"` *(chứa password)*<br>`"WelcomeEduMatch@1"` *(chứa edumatch)*<br>`"User12345678#abc"` *(chứa 12345678)*<br>`"Admin123@Secret!"` *(chứa admin123)*<br>`"Qwertyui!123A"` *(chứa qwertyui)* | Nhánh kiểm tra từ vựng: `if word in pwd_lower:` cho từng từ cấm trong từ điển | `{"is_valid": False, "reason": "Chứa từ khóa dễ đoán ('...') - Nguy cơ bị tấn công từ điển"}` | PASS (100%) |

---

### C. Module Quản Lý OTP, Thời Hạn & Phong Tỏa Tài Khoản (test_otp_lockout.py)

| Mã Test Case | Hàm / Module Lõi | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Nhánh Thực Thi | Kết Quả Mong Đợi | Trạng Thái & Độ Phủ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **OTP_01** | `OTPEngine.generate_otp` | Sinh mã OTP thành công cho tài khoản hợp lệ | `identifier = "student_01@edumatch.vn"` | Nhánh xử lý thành công: tài khoản không bị cấm, tạo số 6 chữ số ngẫu nhiên | Trả về mã chuỗi 6 chữ số, thời hạn sử dụng `expiry` = `current_time + 900` giây (15 phút) | PASS (100%) |
| **OTP_02** | `OTPEngine.generate_otp` | Từ chối sinh mã cho Identifier không hợp lệ hoặc rỗng | `identifier = ""`, `None`, `12345` | Nhánh kiểm tra rỗng: `not identifier or not isinstance(...)` | Ném ra ngoại lệ `ValueError("Identifier phải là một chuỗi hợp lệ")` | PASS (100%) |
| **OTP_03** | `OTPEngine.verify_otp` | Xác thực thành công mã OTP trong thời hạn 15 phút | `otp = "654321"`, xác thực tại `t + 300s` *(sau 5 phút)* | Nhánh xác thực đúng mã và thời gian: `input_otp == record['otp']` và `now <= record['expiry']` | Trả về `{"status": "success", "message": "Xác thực mã OTP thành công"}` | PASS (100%) |
| **OTP_04** | `OTPEngine.verify_otp` | Từ chối mã OTP đã vượt quá thời hạn sử dụng 15 phút (Expired) | Nhập đúng mã tại thời điểm `t + 901s` *(sau 15 phút 1 giây)* | Nhánh quá hạn sử dụng: `if now > record['expiry']:` | Trả về `{"status": "expired", "message": "Mã OTP đã hết hạn sử dụng (15 phút)"}` | PASS (100%) |
| **OTP_05** | `OTPEngine.verify_otp` | Tự động phong tỏa tài khoản khi nhập sai mã OTP 5 lần liên tiếp (Brute-force Lockout) | Nhập sai mã 5 lần liên tiếp: `"111111"`, `"222222"`, ..., `"555555"` | Nhánh phong tỏa: `self.attempts[identifier] >= 5`, thêm vào danh sách `lockouts` | Lần thử thứ 5 ném ra ngoại lệ `AccountLockedException("Tài khoản đã bị tạm khóa 15 phút do sai quá 5 lần!")` | PASS (100%) |
| **OTP_06** | `OTPEngine.generate_otp` | Từ chối sinh mã OTP mới khi tài khoản đang trong trạng thái phong tỏa | Khi tài khoản bị khóa, gọi lại lệnh `generate_otp(...)` tại `t + 100s` | Nhánh kiểm tra trạng thái cấm: `self._check_if_locked(identifier, now)` phát hiện khóa còn hiệu lực | Ném ra ngoại lệ `AccountLockedException("Tài khoản đang bị phong tỏa...")` | PASS (100%) |
| **OTP_07** | `OTPEngine.verify_otp` | Tự động mở khóa tài khoản khi kết thúc thời hạn phong tỏa 15 phút | Khi tài khoản đang khóa, quay lại tại `t + 902s` *(hết hạn 15 phút)* để sinh mã và xác thực | Nhánh tự động gỡ phong tỏa: `if now > lock_expiry: del self.lockouts[identifier]` | Tài khoản thoát trạng thái cấm, cho phép sinh và xác thực mã OTP mới thành công | PASS (100%) |
| **OTP_08** | `OTPEngine.verify_otp` | Xác thực cho hồ sơ chưa từng yêu cầu sinh mã OTP (Missing Record) | `identifier = "never_gen@edu.vn"`, `otp = "123456"` | Nhánh kiểm tra tồn tại hồ sơ: `if identifier not in self.records:` | Trả về `{"status": "error", "message": "Mã OTP không đúng hoặc không tồn tại"}` | PASS (100%) |
| **OTP_09** | `OTPEngine.verify_otp` | Đưa vào các đối số đầu vào không hợp lệ hoặc null khi xác thực OTP | `identifier = None`, `otp = 123` | Nhánh kiểm tra lỗi tham số: `not isinstance(input_otp, str)` | Ném ra ngoại lệ `ValueError("Tham số xác định hoặc mã OTP không hợp lệ")` | PASS (100%) |

---

### D. Module Kiểm Duyệt Phân Quyền Truy Cập RBAC Middleware (test_rbac_middleware.py)

| Mã Test Case | Hàm / Module Lõi | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Nhánh Thực Thi | Kết Quả Mong Đợi | Trạng Thái & Độ Phủ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **RBAC_01** | `RBACMiddleware.enforce_rbac` | Cho phép truy cập khu vực Admin khi người dùng giữ vai trò `admin` | Token JWT chứa `{"role": "admin", "id": 1}`, yêu cầu quyền `required_role = "admin"` | Nhánh vai trò hợp lệ: `user_role == required_role` | Trả về dữ liệu chi tiết của User: `{"user": {"role": "admin", ...}, "status": "authorized"}` | PASS (100%) |
| **RBAC_02** | `RBACMiddleware.enforce_rbac` | Từ chối truy cập khu vực Admin khi người dùng chỉ giữ vai trò `student` | Token JWT chứa `{"role": "student"}`, truy cập vào khu vực `required_role = "admin"` | Nhánh từ chối quyền: `user_role != required_role` | Ném ra ngoại lệ `UnauthorizedAccessException("Truy cập từ chối: Cần quyền admin, nhưng hiện tại là student")` | PASS (100%) |
| **RBAC_03** | `RBACMiddleware.enforce_rbac` | Từ chối yêu cầu khi Header ủy quyền bị bỏ trống hoặc không hợp lệ | `auth_header = None`, `""`, `12345` | Nhánh thiếu Header: `if not auth_header or not isinstance(auth_header, str):` | Ném ra ngoại lệ `UnauthorizedAccessException("Header Authorization thiếu hoặc sai định dạng")` | PASS (100%) |
| **RBAC_04** | `RBACMiddleware.enforce_rbac` | Từ chối Header ủy quyền không tuân thủ cấu trúc từ khóa Bearer | `auth_header = "Token eyJhbGciOi..."` *(sử dụng từ khóa Token thay vì Bearer)* | Nhánh sai cú pháp Bearer: `not auth_header.startswith("Bearer ")` | Ném ra ngoại lệ `UnauthorizedAccessException("Định dạng Header phải là 'Bearer <token>'")` | PASS (100%) |
| **RBAC_05** | `RBACMiddleware.enforce_rbac` | Cho phép truy cập các Endpoint công khai (Public) không yêu cầu phân quyền | `auth_header = "Bearer any_token"`, `required_role = None` *(Public API)* | Nhánh Endpoint công khai: `if not required_role:` (Bỏ qua bước so khớp vai trò) | Trả về kết quả ủy quyền thành công `{"status": "authorized", ...}` cho bất kỳ token hợp lệ nào | PASS (100%) |

---

## 3. Tổng Kết Đánh Giá Nhóm Account & Security

- **Tổng số Test Case:** 30 Kịch bản kiểm thử.
- **Kết quả nghiệm thu:** 100% Test Case PASS. Toàn bộ các nhánh xử lý lỗi, xác thực Token, rào cản từ vựng mật khẩu và cơ chế phong tỏa tự động đều vận hành chuẩn xác theo tiêu chuẩn chất lượng đã đề ra.

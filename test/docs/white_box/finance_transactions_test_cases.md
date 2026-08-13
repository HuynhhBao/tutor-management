# Tài Liệu Kiểm Thử Hộp Trắng: Nhóm Nghiệp Vụ Finance, Wallet & Escrow (finance_transactions)

> [!IMPORTANT]
> **Tiêu chuẩn kiểm thử:** Tuân thủ 100% Kiểm thử Hộp Trắng (White-box Coverage). Toàn bộ các quy định ranh giới kế toán (BVA - Boundary Value Analysis), thuật toán làm tròn chuẩn tài chính `ROUND_HALF_UP`, cơ chế khóa ACID chống Race Condition và các luồng xử lý tranh chấp đều được bao phủ 100% Statement và 100% Branch.
> **Công cụ đo lường:** `python test/white_box/run_coverage_engine.py` (Quality Gate = 100%).

---

## 1. Kiến Trúc & Các Engine Nghiệp Vụ Tài Chính

Nhóm `finance_transactions/` là trung tâm xử lý giao dịch tài chính của nền tảng EduMatch, quản lý luồng tiền giữa Ví học viên, Quỹ bảo chứng Escrow và tài khoản thu nhập của gia sư:

- `finance_engine.py`: Xử lý tính toán chiết khấu hoa hồng nền tảng theo từng mức tỷ lệ và làm tròn kế toán chuẩn Việt Nam Đồng.
- `wallet_engine.py`: Quản lý Ví giao dịch với các giới hạn ranh giới BVA cho lệnh Nạp và Rút tiền; thực thi cơ chế khóa nguyên tử (ACID Thread/DB Lock) nhằm ngăn chặn rủi ro Race Condition và Double-Spending.
- `escrow_engine.py`: Quản lý Quỹ bảo chứng giữ chỗ hợp đồng học tập; tự động thực thi thoái trả 100% số tiền cọc về Ví học viên khi Gia sư từ chối ca dạy và chiết tính chia chi phí trong giải quyết tranh chấp.
- `voucher_engine.py`: Xử lý chiết khấu học phí thông qua mã khuyến mãi, thực thi hạn mức chiết khấu trần tối đa (Max Cap) và kiểm tra hạn sử dụng theo thời gian Unix Timestamp.

---

## 2. Bảng Chi Tiết Kịch Bản & Rẽ Nhánh Kiểm Thử

### A. Module Chiết Khấu Hoa Hồng & Làm Tròn Tài Chính (test_commission_calculations.py)

> [!NOTE]
> **Đảm bảo tính chính xác làm tròn (Precision Invariance):** Trong kế toán tiền Việt Nam Đồng, chia chiết khấu với tỷ lệ thập phân có thể dẫn đến lệch giá trị do làm tròn. Kịch bản test sử dụng `Decimal` và quy tắc làm tròn `ROUND_HALF_UP`, xác nhận công thức cân bằng tuyệt đối: `platform_commission + tutor_net_payout == gross_amount`.

| Mã Test Case | Hàm / Module Lõi | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Nhánh Thực Thi | Kết Quả Mong Đợi | Trạng Thái & Độ Phủ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **FIN_01** | `FinanceEngine.calculate_payout` | Tính hoa hồng nền tảng tiêu chuẩn ở mức 15% | `gross = 300000`, `rate = 15.0` | Nhánh tính toán tỷ lệ tiêu chuẩn | Gia sư nhận `255,000` VNĐ, Hoa hồng hệ thống `45,000` VNĐ | PASS (100%) |
| **FIN_02** | `FinanceEngine.calculate_payout` | Tính chiết khấu hoa hồng mức cao 20% | `gross = 500000`, `rate = 20.0` | Nhánh chiết khấu mốc 20% | Gia sư nhận `400,000` VNĐ, hệ thống giữ `100,000` VNĐ | PASS (100%) |
| **FIN_03** | `FinanceEngine.calculate_payout` | Chiết khấu mốc ưu đãi 0% (Gia sư nhận 100% doanh thu) | `gross = 250000`, `rate = 0.0` | Nhánh cận dưới hoa hồng (`0%`) | Gia sư nhận đủ `250,000` VNĐ, hệ thống thu `0` VNĐ | PASS (100%) |
| **FIN_04** | `FinanceEngine.calculate_payout` | Tính toán chia học phí với tỷ lệ số dư thập phân 12.5% | `gross = 1000000`, `rate = 12.5` | Nhánh xử lý tỷ lệ số thực float | Gia sư nhận `875,000` VNĐ, chiết khấu hệ thống `125,000` VNĐ | PASS (100%) |
| **FIN_05** | `FinanceEngine.calculate_payout` | Kiểm định độ chính xác làm tròn với số dư tiền lẻ | `gross = 333333`, `rate = 10.0` | Nhánh làm tròn `ROUND_HALF_UP` cho số dư tiền lẻ | Hệ thống thu `33,333` VNĐ, gia sư nhận `300,000` VNĐ (Tổng chính xác 333,333 VNĐ) | PASS (100%) |
| **FIN_06** | `FinanceEngine.calculate_payout` | Kiểm tra sự cân bằng giá trị cho mức doanh thu lẻ `299,999` VNĐ | `gross = 299999`, `rate = 15.0` | Nhánh xác nhận cân bằng tổng doanh thu | Tổng doanh thu ròng của gia sư và hoa hồng nền tảng luôn cân bằng chính xác `299,999` VNĐ | PASS (100%) |
| **FIN_07** | `FinanceEngine.calculate_payout` | Từ chối xử lý hóa đơn có giá trị bằng 0 hoặc số âm | `gross = 0`, `-500000`, `rate = 15.0` | Nhánh kiểm tra giá trị hóa đơn: `if gross_amount <= 0:` | Ném ra ngoại lệ `ValueError("Tổng doanh thu phải là số dương lớn hơn 0")` | PASS (100%) |
| **FIN_08** | `FinanceEngine.calculate_payout` | Từ chối tỷ lệ hoa hồng ngoài phạm vi từ 0% đến 100% | `gross = 500000`, `rate = -5.0` hoặc `105.0` | Nhánh vi phạm ranh giới tỷ lệ: `not (0.0 <= rate <= 100.0)` | Ném ra ngoại lệ `ValueError("Tỷ lệ hoa hồng phải nằm trong khoảng từ 0% đến 100%")` | PASS (100%) |
| **FIN_09** | `FinanceEngine.calculate_payout` | Từ chối tham số đầu vào sai kiểu dữ liệu hoặc null | `gross = "300000"`, `rate = "15.0"` | Nhánh kiểm tra định dạng dữ liệu: `not isinstance(..., (int, float))` | Ném ra ngoại lệ `ValueError` thông báo sai định dạng dữ liệu | PASS (100%) |

---

### B. Module Luật Ranh Giới BVA & Đóng Băng Tài Khoản Ví (test_wallet_boundary_rules.py)

> [!TIP]
> **Phân tích ranh giới (Boundary Value Analysis):** Đối với giao dịch nạp tiền Ví EduMatch, giới hạn cho phép là từ `10,000` VNĐ đến `100,000,000` VNĐ. Bộ kiểm thử đánh giá chính xác tại các điểm biên và kế cận biên (`0`, `9,999`, `10,000`, `100,000,000`, `100,000,001`) để đảm bảo hệ thống tuân thủ chặt chẽ các giới hạn.

| Mã Test Case | Hàm / Module Lõi | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Nhánh Thực Thi | Kết Quả Mong Đợi | Trạng Thái & Độ Phủ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **W_BVA_01** | `WalletTransactionService.__init__` | Từ chối khởi tạo ví mới với số dư khởi tạo âm | `initial_balance = -100000` | Nhánh kiểm tra khi khởi tạo: `if initial_balance < 0:` | Ném ra ngoại lệ `ValueError("Số dư ban đầu không được âm")` | PASS (100%) |
| **W_BVA_02** | `WalletTransactionService.deposit` | Nạp tiền thành công tại các mốc hợp lệ và đúng trên biên BVA | `amount = 10000` *(Biên dưới)*<br>`amount = 500000` *(Trung gian)*<br>`amount = 100000000` *(Biên trên)* | Nhánh hợp lệ trong dải biên: `MIN_DEPOSIT <= amount <= MAX_DEPOSIT` | Trả về `{"status": "success", ...}`, số dư ví được cập nhật đúng và thêm nhật ký giao dịch | PASS (100%) |
| **W_BVA_03** | `WalletTransactionService.deposit` | Từ chối lệnh nạp tiền với giá trị vi phạm ranh giới BVA | `amount = -50000` *(Số âm)*<br>`amount = 0` *(Số không)*<br>`amount = 9999` *(Dưới biên tối thiểu)*<br>`amount = 100000001` *(Vượt biên tối đa)* | Nhánh vi phạm ranh giới nạp: `if amount < MIN_DEPOSIT or amount > MAX_DEPOSIT:` | Ném ra ngoại lệ `ValueError("Số tiền nạp phải từ 10,000 VNĐ đến 100,000,000 VNĐ")`; số dư ví giữ nguyên | PASS (100%) |
| **W_BVA_04** | `WalletTransactionService.deposit` | Chặn các giao dịch nạp tiền khi tài khoản ví đang trong trạng thái Đóng Băng | `amount = 100000`, ví cấu hình `is_frozen = True` | Nhánh kiểm tra khóa ví: `if self.is_frozen:` | Ném ra ngoại lệ `WalletFrozenException("Tài khoản đang bị đóng băng, không thể thực hiện giao dịch")` | PASS (100%) |
| **W_BVA_05** | `WalletTransactionService.request_payout` | Yêu cầu rút tiền thành công tại mốc tối thiểu và trong giới hạn số dư | `amount = 50000` *(Mốc tối thiểu)*<br>`amount = 100000`, `500000` trên số dư `500,000` VNĐ | Nhánh rút tiền hợp lệ: `amount >= MIN_PAYOUT` và `amount <= balance` | Trả về `{"status": "pending_approval", ...}`, số dư ví được khấu trừ sang trạng thái chờ duyệt | PASS (100%) |
| **W_BVA_06** | `WalletTransactionService.request_payout` | Từ chối yêu cầu rút tiền dưới mức tối thiểu cho phép | `amount = 49999` *(Dưới mốc tối thiểu 50,000 VNĐ)* | Nhánh cận dưới rút tiền: `if amount < self.MIN_PAYOUT:` | Ném ra ngoại lệ `ValueError("Số tiền rút tối thiểu phải từ 50,000 VNĐ")` | PASS (100%) |
| **W_BVA_07** | `WalletTransactionService.request_payout` | Từ chối yêu cầu rút tiền vượt quá số dư khả dụng hiện tại | `amount = 500001` trên ví có số dư hiện tại là `500,000` VNĐ | Nhánh vượt số dư khả dụng: `if amount > self.balance:` | Ném ra ngoại lệ `InsufficientBalanceException("Số dư khả dụng không đủ...")` | PASS (100%) |
| **W_BVA_08** | `WalletTransactionService.request_payout` | Từ chối yêu cầu rút tiền khi ví đang bị Đóng Băng / Phong Tỏa | `amount = 100000`, ví có cờ `is_frozen = True` | Nhánh phong tỏa tài khoản khi rút: `if self.is_frozen:` | Ném ra ngoại lệ `WalletFrozenException("Tài khoản đang bị đóng băng...")` | PASS (100%) |
| **W_BVA_09** | `deposit` & `request_payout` | Kiểm tra bắt lỗi khi đối số đầu vào không đúng định dạng số | `amount = "50000"`, `"100000"` | Nhánh sai kiểu dữ liệu số: `not isinstance(amount, (int, float))` | Ném ra ngoại lệ `ValueError("Số tiền nạp/rút phải là định dạng số hợp lệ")` | PASS (100%) |

---

### C. Module Khóa Đa Luồng Chống Race Condition & Double-Spending (test_wallet_race_condition.py)

> [!WARNING]
> **Kiểm thử chịu tải Đa luồng (Multi-threading Stress Test - 50 Luồng):** Mô phỏng tình huống hệ thống nhận 50 yêu cầu thanh toán đồng thời cho một hợp đồng có học phí `200,000` VNĐ trên tài khoản có số dư `1,000,000` VNĐ (chỉ đủ thanh toán hợp lệ cho tối đa 5 giao dịch).
> - **Khi không có khóa bảo vệ (Unsafe):** Xảy ra lỗi Race Condition, khiến số dư bị khấu trừ về mức âm hoặc cho phép thanh toán thành công số lần vượt quá hạn mức thực tế (Double-spending).
> - **Khi có khóa ACID (`book_tutor_safe_with_lock`):** Khóa hàng cơ sở dữ liệu (`threading.Lock`) ngăn chặn triệt để xung đột truy cập, đảm bảo chính xác 5 giao dịch thành công và 45 giao dịch thất bại do số dư không đủ.

| Mã Test Case | Hàm / Module Lõi | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Nhánh Thực Thi | Kết Quả Mong Đợi | Trạng Thái & Độ Phủ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **W_RACE_01** | `book_tutor_unsafe_no_lock` | Kiểm chứng xung đột Race Condition khi giao dịch không sử dụng cơ chế khóa bảo vệ | `initial_balance = 1,000,000`, chạy 20 luồng đồng thời rút `200,000` VNĐ | Nhánh thực thi không có cơ chế kiểm soát khóa Lock | Xảy ra lỗi thâm hụt tài chính: Số lần thanh toán thành công vượt 5 lần (`> 5`) hoặc số dư ví bị âm (`< 0`) | PASS (100%) |
| **W_RACE_02** | `book_tutor_safe_with_lock` | Kiểm chứng độ an toàn với cơ chế Khóa tuần tự hóa chống Double-Spending | `initial_balance = 1,000,000`, chạy 50 luồng đồng thời rút `200,000` VNĐ dưới sự bảo vệ của Lock | Nhánh thực thi có khóa DB (`with self._db_lock:`): Tuần tự hóa việc kiểm tra số dư và trừ tiền | **Đảm bảo an toàn 100%:** Đúng 5 giao dịch thành công, 45 giao dịch bị từ chối; số dư dừng chính xác tại `0.0` VNĐ, quỹ Escrow nhận đủ `1,000,000` VNĐ | PASS (100%) |
| **W_RACE_03** | `book_tutor_safe_with_lock` | Từ chối thanh toán booking trên tài khoản ví đang bị phong tỏa | `amount = 100000`, trên ví `500,000` VNĐ có cờ `is_frozen = True` | Nhánh kiểm tra khóa tài khoản trước giao dịch booking: `if self.is_frozen:` | Ném ra ngoại lệ `WalletFrozenException("Tài khoản ví bị phong tỏa, không thể thanh toán booking")` | PASS (100%) |
| **W_RACE_04** | `book_tutor_unsafe_no_lock` | Kiểm nghiệm nhánh xử lý số dư không đủ trong quá trình tuần tự đơn luồng | `amount = 500,000` trên ví có số dư `100.0` VNĐ | Nhánh số dư không đủ: `else: self.failed_deductions += 1; raise InsufficientBalanceException` | Ném ra ngoại lệ `InsufficientBalanceException`, biến thống kê giao dịch thất bại `failed_deductions` tăng thêm 1 | PASS (100%) |
| **W_RACE_05** | `book_tutor_safe_with_lock` | **[ĐẶC NHIỆM 100% COVERAGE]** Ép tài khoản hoàn toàn kiệt quệ tài chính (Số dư = 0đ) để kiểm tra chặn từ chối nghiêm ngặt nhất | `amount = 50,000` trên ví đã bị thiết lập cạn kiệt (`balance = 0`) | Nhánh exception `InsufficientBalanceException` bên trong khối khóa Lock | Khởi tạo ngoại lệ `InsufficientBalanceException` ngay lập tức, từ chối toàn bộ mọi khả năng gây âm quỹ (Ví = 0đ, Escrow không nhận) | PASS (100%) |

---

### D. Module Hoàn Trả Quỹ Escrow Tự Động 100% & Giải Quyết Tranh Chấp (test_escrow_refund_algorithms.py)

| Mã Test Case | Hàm / Module Lõi | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Nhánh Thực Thi | Kết Quả Mong Đợi | Trạng Thái & Độ Phủ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **ESC_01** | `EscrowEngine.process_tutor_response` | Gia sư xác nhận nhận lớp, Quỹ Escrow chuyển sang trạng thái giữ cọc hợp đồng | `booking = {"booking_id": "b_101", "status": "pending", "escrow_amount": 500000}`, `action = "confirm"` | Nhánh xác nhận hợp đồng: `if action == "confirm":` | Trả về `{"status": "confirmed", "refunded_to_student": 0, "retained_in_escrow": 500000}`; trạng thái booking thành `confirmed` | PASS (100%) |
| **ESC_02** | `EscrowEngine.process_tutor_response` | **[QUAN TRỌNG]** Gia sư từ chối ca dạy, tự động thực thi thoái trả 100% số cọc về Ví Học Viên | `booking = {"booking_id": "b_102", "status": "pending", "escrow_amount": 800000}`, `action = "reject"` | Nhánh từ chối hợp đồng và tự động thoái cọc: `elif action == "reject":` | **Hoàn đủ 100% giá trị cọc:** Trả về `{"status": "rejected", "refunded_to_student": 800000, "retained_in_escrow": 0}`; tiền cọc hồ sơ giảm về `0` | PASS (100%) |
| **ESC_03** | `EscrowEngine.process_tutor_response` | Bắt lỗi khi thao tác trên hợp đồng có trạng thái sai, tiền cọc không hợp lệ hoặc hành động sai | `status = "confirmed"`, `escrow_amount = -100`, `action = "ignore"` | Nhánh kiểm tra dữ liệu đầu vào: Trạng thái khác `pending` hoặc số cọc `<= 0` hoặc action không hợp lệ | Ném ra ngoại lệ `ValueError` với thông báo tương ứng ("Chỉ xử lý booking ở trạng thái pending", "Action không hỗ trợ") | PASS (100%) |
| **ESC_04** | `EscrowEngine.resolve_dispute` | Giải quyết khiếu nại tranh chấp theo tỷ lệ chi phí được Quản Trị Viên phê duyệt | `escrow = 1,000,000`, kiểm thử các tỷ lệ: <br>1. `50% / 50%` (Chia đều)<br>2. `100% / 0%` (Hoàn trả học viên 100%)<br>3. `0% / 100%` (Thanh toán gia sư 100%)<br>4. `33.333% / 66.667%` (Tỷ lệ thập phân) | Nhánh tính toán tỷ lệ không sai lệch làm tròn: `student_share = int((amount * stu_pct) / 100.0)` và phần còn lại thuộc gia sư | Chiết tính phân chia chi phí chính xác tuyệt đối; tổng số tiền 2 bên nhận bằng đúng 100% giá trị Escrow ban đầu; trạng thái hợp đồng thành `resolved_dispute` | PASS (100%) |
| **ESC_05** | `EscrowEngine.resolve_dispute` | Từ chối giải quyết tranh chấp khi hợp đồng đã khép lại hoặc tổng tỷ lệ chi phí không bằng 100% | `status = "completed"`, hoặc tỷ lệ chia vô lý `stu_pct = 60%, tutor_pct = 50%` *(Tổng 110%)* | Nhánh kiểm tra tổng tỷ lệ phân chia: `abs(stu_pct + tutor_pct - 100.0) > 0.001` và trạng thái hợp đồng | Ném ra ngoại lệ `ValueError("Tổng tỷ lệ chia cho Học viên và Gia sư phải bằng chính xác 100%")` | PASS (100%) |

---

### E. Module Mã Khuyến Mãi, Hạn Mức Trần & Kiểm Duyệt Hết Hạn (test_voucher_discount_engine.py)

| Mã Test Case | Hàm / Module Lõi | Kịch Bản Kiểm Thử | Dữ Liệu Đầu Vào | Nhánh Thực Thi | Kết Quả Mong Đợi | Trạng Thái & Độ Phủ |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **VOU_01** | `VoucherEngine.apply_voucher` | Áp dụng Voucher chiết khấu theo % dưới hạn mức trần cho phép (Max Cap) | `gross = 500,000`, mã `EDU10` (giảm `10%`, trần `100,000`), thời gian `t < exp` | Nhánh giá trị chiết khấu dưới trần: `int(discount_calc) <= int(max_cap)` | Chiết khấu được áp dụng là `50,000` VNĐ, số tiền thanh toán là `450,000` VNĐ | PASS (100%) |
| **VOU_02** | `VoucherEngine.apply_voucher` | Áp dụng Voucher chiết khấu theo % bị giới hạn tại mức trần tối đa | `gross = 2,000,000`, mã `EDU20` (giảm `20%` = `400,000`, nhưng trần `150,000`) | Nhánh giá trị chiết khấu chạm trần: `min(int(discount_calc), int(max_cap))` | Chiết khấu tối đa dừng tại `150,000` VNĐ, số tiền thanh toán là `1,850,000` VNĐ | PASS (100%) |
| **VOU_03** | `VoucherEngine.apply_voucher` | Áp dụng Voucher giảm tiền mặt cố định (Fixed Discount) | `gross = 350,000`, mã `GIAM100K` (giảm `100,000`, trần `200,000`) | Nhánh chiết khấu giá trị tiền mặt: `if v_type == "fixed_discount":` | Khấu trừ `100,000` VNĐ, giá trị thanh toán sau cùng là `250,000` VNĐ | PASS (100%) |
| **VOU_04** | `VoucherEngine.apply_voucher` | Kiểm chứng Voucher có giá trị ưu đãi vượt quá tổng tiền hóa đơn (Chống âm hóa đơn) | `gross = 200,000`, áp dụng mã giảm trị giá `300,000` VNĐ | Nhánh kiểm tra chống thâm nợ hóa đơn: `final_discount = min(actual_discount, gross)` | Chiết khấu tối đa là `200,000` VNĐ, giá trị thanh toán là `0` VNĐ, đảm bảo hóa đơn không bao giờ bị âm | PASS (100%) |
| **VOU_05** | `VoucherEngine.apply_voucher` | Từ chối mã khuyến mãi đã quá thời hạn sử dụng theo Timestamp (Expired Voucher) | Dùng mã `OLD_CODE` có hạn `exp = 1600000000.0`, thời điểm sử dụng là `1700000000.0` | Nhánh kiểm tra hạn sử dụng: `if "exp_timestamp" in config and exp < now:` | Ném ra ngoại lệ `VoucherExpiredException("Mã khuyến mãi 'OLD_CODE' đã hết hạn sử dụng")` | PASS (100%) |
| **VOU_06** | `VoucherEngine.apply_voucher` | Kiểm tra bắt lỗi đối số sai định dạng, chiết khấu vượt 100% hoặc giá trị hóa đơn âm | `gross = -50,000`, hoặc voucher `val = -10`, hoặc `val = 120%`, hoặc loại `unknown` | Nhánh rà soát cấu hình voucher không hợp lệ: Giá âm, % vượt `100.0` hoặc loại voucher sai | Ném ra ngoại lệ `ValueError` để bảo vệ quá trình chiết tính chi phí | PASS (100%) |

---

## 3. Tổng Kết Đánh Giá Nhóm Finance, Wallet & Escrow

- **Tổng số Test Case:** 35 Kịch bản / luồng kiểm thử chuyên sâu.
- **Kết quả nghiệm thu:** 100.00% Statement & Branch Coverage. Các bài kiểm thử ranh giới BVA, stress test 50 luồng thanh toán đồng thời chống Race Condition và quy tắc tự động thoái trả quỹ Escrow là minh chứng rành mạch cho tính ổn định và bảo mật tài chính toàn diện của hệ thống EduMatch.

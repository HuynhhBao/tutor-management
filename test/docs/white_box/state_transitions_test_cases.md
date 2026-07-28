# TÀI LIỆU KỊCH BẢN KIỂM THỬ HỘP TRẮNG CHUYỂN TRẠNG THÁI HỆ THỐNG (STATE TRANSITIONS ENGINE)

Tài liệu này đặc tả chi tiết toàn bộ các kịch bản kiểm thử Hộp trắng cho 4 Sơ đồ Chuyển đổi Trạng thái Lõi (Finite State Machines) tại nền tảng EduMatch, lưu trữ trong thư mục `test/white_box/state_transitions/`. Mọi luồng dịch chuyển trạng thái hợp lệ (Happy Path) và các nhánh cấm chuyển ngang trái phép (Exception Branching) đều đã được thi hành kiểm chứng với chỉ số bao phủ **100.00% Statement Coverage và 100.00% Branch Coverage**.

---

## 1. SƠ ĐỒ 1: QUY TRÌNH HỢP ĐỒNG ĐẶT LỊCH, HỦY LỊCH & TRANH CHẤP
**Mã nguồn kiểm định:** `booking_state_engine.py`  
**Bộ kiểm thử (Pytest):** `test_booking_state_transitions.py`  
**Cơ quan kiểm thử:** Lớp `BookingStateMachine`  
**Nghiệm thu độ phủ:** 65/65 Statements (100%), 28/28 Branches (100%).

| Mã Test Case | Tên Phương Thức / Test Function | Nhánh / Điều Kiện Vi Mạng | Đầu Vào Mẫu | Đầu Ra Mong Đợi / Kết Quả Kiểm Định | Trạng Thái |
|---|---|---|---|---|---|
| **ST-BKG-01** | `test_init_invalid_args_raises_error` | Khởi tạo hợp đồng với ID rỗng hoặc cọc phi thực tế | `booking_id=""`, hoặc `escrow_amount=0`, `-50000` | Phát ra ngoại lệ `ValueError` với thông báo cấm ID rỗng và cọc phải > 0. | **PASS** (100%) |
| **ST-BKG-02** | `test_init_valid_defaults` | Khởi tạo hợp đồng hợp lệ | `booking_id="BK_100"`, `escrow=100000` | Trạng thái mặc định là `"pending"`, ghi nhận nhật ký hệ thống bước khởi tạo cọc 100.000 VNĐ. | **PASS** (100%) |
| **ST-BKG-03** | `test_transition_invalid_arguments_or_illegal_path` | Dịch chuyển sang trạng thái lạ hoặc đi chéo luồng cấm | Chuyển thẳng `pending` -> `completed` hoặc `actor="hacker"` | Phát ra ngoại lệ `ValueError` khi actor/trạng thái sai; phát ra `IllegalStateTransitionException` khi thao tác cấm. | **PASS** (100%) |
| **ST-BKG-04** | `test_cancel_from_pending_auto_refund_100` | Học viên hủy khi ca học chưa được Gia sư đồng ý | Chuyển `pending` -> `cancelled`, `actor="student"` | Hoàn trả 100% (100.000 VNĐ) về số dư ví học viên, Quản trị viên không chiết khấu, khóa chuyển tiếp về sau. | **PASS** (100%) |
| **ST-BKG-05** | `test_reject_from_pending_auto_refund_100` | Gia sư từ chối tiếp nhận lớp học | Chuyển `pending` -> `rejected`, `actor="tutor"` | Hoàn 100% tiền cọc về Ví học viên, xóa cọc bảo chứng Escrow. | **PASS** (100%) |
| **ST-BKG-06** | `test_cancel_from_confirmed_student_vs_admin` | Hủy lớp khi đã chốt kíp (Học viên hủy so với Admin hủy) | Chuyển `confirmed` -> `cancelled` bởi Học viên hoặc bởi Admin | **Học viên hủy:** Không hoàn tiền (100% chuyển Gia sư bồi thường).<br>**Admin hủy:** Hoàn 100% tiền về Ví học viên do sự cố kỹ thuật/bất khả kháng. | **PASS** (100%) |
| **ST-BKG-07** | `test_happy_path_completed` | ca dạy hoàn thành trọn vẹn và đúng tiến độ | `pending` -> `confirmed` -> `in_progress` -> `completed` | Toàn bộ 100% Quỹ cọc bảo chứng Escrow chuyển thành thu nhập ròng cho Gia sư. | **PASS** (100%) |
| **ST-BKG-08** | `test_dispute_and_admin_resolved` | Giải quyết khiếu nại qua chu trình tranh chấp | `confirmed` -> `disputed` -> `resolved` (`actor="admin"`) | Thao tác từ "disputed" sang "resolved" thành công; từ chối mọi actor không phải "admin". | **PASS** (100%) |
| **ST-BKG-09** | `test_resolve_dispute_custom_split_branches` | Phán quyết chi tiết tỷ lệ hoàn học phí khi có khiếu nại | `student_pct=70.0`, `tutor_pct=30.0`, `admin_note="..."` | Chia chính xác 70% Quỹ Escrow hoàn về Học viên và 30% trả Gia sư; ném ngoại lệ nếu tổng không bằng 100% hoặc gọi khi chưa `disputed`. | **PASS** (100%) |

---

## 2. SƠ ĐỒ 2 & 3: PHÊ DUYỆT HỒ SƠ & TRẠNG THÁI HOẠT ĐỘNG TÀI KHOẢN
**Mã nguồn kiểm định:** `tutor_profile_state_engine.py`  
**Bộ kiểm thử (Pytest):** `test_tutor_profile_states.py`  
**Cơ quan kiểm thử:** Lớp `TutorApplicationStateMachine` & `TutorAccountOperationalStateMachine`  
**Nghiệm thu độ phủ:** 60/60 Statements (100%), 28/28 Branches (100%).

### A. Sơ Đồ 2: Quá Trình Kiểm Duyệt Bằng Cấp Gia Sư
| Mã Test Case | Tên Phương Thức / Test Function | Nhánh / Điều Kiện Vi Mạng | Đầu Vào Mẫu | Đầu Ra Mong Đợi / Kết Quả Kiểm Định | Trạng Thái |
|---|---|---|---|---|---|
| **ST-TUT-01** | `test_init_invalid_args_raises` | Khởi tạo hồ sơ thiếu mã định danh hoặc tên tài khoản | `application_id=0, -5` hoặc `username=""` | Phát ra ngoại lệ `ValueError` yêu cầu thông tin định danh hợp lệ. | **PASS** (100%) |
| **ST-TUT-02** | `test_valid_approval_flow` | Nộp hồ sơ nháp và Quản trị viên duyệt bằng cấp hợp lệ | `draft` -> `submit()` -> `review("approve")` | Hồ sơ sang trạng thái `"pending"`, sau đó chính thức công nhận `"approved"`. | **PASS** (100%) |
| **ST-TUT-03** | `test_rejection_and_resubmission_flow` | Bị từ chối bằng cấp, nộp bổ sung giải trình và lặp lại vòng lặp | `review("reject")` kèm ghi chú -> `resubmit_after_rejection(...)` | Yêu cầu bắt buộc phải kèm lý do khi reject; chuyển thành `"resubmitted"`, sau đó tái nộp thành `"pending"` và được chấp nhận sau khi bổ sung minh chứng. | **PASS** (100%) |
| **ST-TUT-04** | `test_illegal_profile_review_branches` | Cố ý ra quyết định duyệt khi chưa nộp nháp hoặc sai tên quyết định | Duyệt khi `"draft"` hoặc hành động `"unknown_action"` | Ném ngoại lệ `IllegalProfileStateException` khi chưa nộp và `ValueError` khi hành động không hợp lệ. | **PASS** (100%) |

### B. Sơ Đồ 3: Quản Lý Hoạt Động & Án Phạt Tài Khoản
| Mã Test Case | Tên Phương Thức / Test Function | Nhánh / Điều Kiện Vi Mạng | Đầu Vào Mẫu | Đầu Ra Mong Đợi / Kết Quả Kiểm Định | Trạng Thái |
|---|---|---|---|---|---|
| **ST-TUT-05** | `test_init_and_eligibility_check` | Khởi tạo trạng thái hoạt động tài khoản công khai | `initial_status="active"` vs `"unknown"` | Cho phép nhận hợp đồng mới (`verify_booking_eligibility() == True`); từ chối khởi tạo với trạng thái sai ngữ pháp. | **PASS** (100%) |
| **ST-TUT-06** | `test_tutor_toggle_inactive_status` | Gia sư chủ động tạm dừng nhận lớp mới do bận rộn | Chuyển `active` <-> `inactive`, `actor="tutor"` | Trạng thái chuyển thành `"inactive"` ("Tạm nghỉ"), từ chối các yêu cầu đặt lịch mới từ Học viên (`AccountUnavailableException`), sau đó cho phép kích hoạt trở lại. | **PASS** (100%) |
| **ST-TUT-07** | `test_admin_suspensions_and_bans_enforcement` | Quản trị viên phong tỏa đình chỉ hoặc cấm vi phạm vĩnh viễn | `actor="admin"`, chuyển sang `suspended` hoặc `banned` | Từ chối Gia sư tự ý chuyển sang trạng thái phạt; khóa lập tức quyền nhận lịch (`AccountSuspendedException`); từ chối mọi thao tác khôi phục nếu đã bị cấm vĩnh viễn (`banned`). | **PASS** (100%) |

---

## 3. SƠ ĐỒ 4: YÊU CẦU RÚT THU NHẬP GIA SƯ & QUẢN LÝ SỐ DƯ
**Mã nguồn kiểm định:** `payout_request_state_engine.py`  
**Bộ kiểm thử (Pytest):** `test_payout_request_states.py`  
**Cơ quan kiểm thử:** Lớp `PayoutRequestStateMachine`  
**Nghiệm thu độ phủ:** 45/45 Statements (100%), 18/18 Branches (100%).

| Mã Test Case | Tên Phương Thức / Test Function | Nhánh / Điều Kiện Vi Mạng | Đầu Vào Mẫu | Đầu Ra Mong Đợi / Kết Quả Kiểm Định | Trạng Thái |
|---|---|---|---|---|---|
| **ST-PAY-01** | `test_init_invalid_args_raises_error` | Tạo lệnh rút với số dư ví không đủ hoặc dưới mức tối thiểu | `amount < 50000` hoặc `current_balance < amount` | Phát ra `ValueError` thông báo lệnh rút tối thiểu phải từ 50,000 VNĐ và số dư khả dụng phải đủ. | **PASS** (100%) |
| **ST-PAY-02** | `test_init_valid_freezes_balance` | Khởi tạo lệnh rút tiền thu nhập thành công | Rút 200,000 VNĐ từ tài khoản có số dư 1,000,000 VNĐ | Lệnh chuyển sang `"pending"`; số dư khả dụng giảm xuống 800,000 VNĐ; 200,000 VNĐ được ghi vào quỹ cọc đóng băng chờ thanh toán (`frozen_balance`). | **PASS** (100%) |
| **ST-PAY-03** | `test_payout_approval_by_admin` | Quản trị viên hoàn tất thanh toán chuyển khoản VietQR | `process("approve", actor="admin")` | Tất toán phiếu rút thành `"approved"`, xóa nợ Quỹ cọc đóng băng, bảo toàn số dư khả dụng chính xác. | **PASS** (100%) |
| **ST-PAY-04** | `test_payout_rejection_by_admin_auto_refunds` | Quản trị viên từ chối do thông tin tài khoản ngân hàng sai lệch | `process("reject", actor="admin", note="Sai STK")` | Chuyển thành `"rejected"`, tự động **Hoàn trả 100% (400,000 VNĐ)** từ quỹ cọc đóng băng trở lại số dư khả dụng cho Gia sư. | **PASS** (100%) |
| **ST-PAY-05** | `test_payout_cancellation_by_tutor_auto_refunds` | Gia sư tự thay đổi ý định và rút lại đơn khi đang chờ duyệt | `process("cancel", actor="tutor")` | Chuyển thành `"cancelled"`, hoàn lại ngay lập tức toàn bộ số tiền cọc đóng băng về số dư khả dụng. | **PASS** (100%) |
| **ST-PAY-06** | `test_default_notes_for_reject_and_cancel` | Kiểm sát các thông báo lý do tự động khi quản trị/gia sư bỏ trống ghi chú | Không truyền `note` khi reject, cancel, approve | Ghi nhận các thông điệp giải thích mặc định chính xác theo quy chế tài chính tài khoản. | **PASS** (100%) |
| **ST-PAY-07** | `test_permission_and_illegal_state_errors` | Vi phạm thẩm quyền thao tác và can thiệp trên phiếu đã đóng hồ sơ | Gia sư cố tự `"approve"`, hoặc Admin cố thao tác lại trên đơn `"approved"` | Ném ngoại lệ `PermissionError` khi vi phạm phân quyền và `IllegalPayoutStateException` khi can thiệp vào các đơn đã kết thúc quy trình. | **PASS** (100%) |

---

## 4. TỔNG KẾT & XÁC NHẬN CHƯƠNG TRÌNH KIỂM THỬ
Toàn bộ 4 bộ máy trạng thái (Sơ đồ 1, 2, 3, 4) tại cụm kiểm thử thứ tư của EduMatch đã vượt qua bộ rào cản chất lượng (Quality Gate) với kết quả tuyệt đối:
- **TỔNG KIỂM TEST SUITES:** 23 / 23 Kịch bản chuyển đổi trạng thái mới (Tổng hệ thống đạt 211 / 211 Test cases).
- **STATEMENT COVERAGE:** 100.00%.
- **BRANCH COVERAGE:** 100.00% (Không tồn tại bất kỳ nhánh lô-gích nào rỗng hoặc chưa được kiểm nghiệm).

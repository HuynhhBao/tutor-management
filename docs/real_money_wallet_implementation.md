# Hướng dẫn chi tiết: Triển khai tính năng Ví tiền thật (Real Money Wallet)

Tài liệu này cung cấp hướng dẫn từng bước (step-by-step) để xây dựng hệ thống **Ví tiền thật** cho dự án EduMatch, tuân thủ theo kiến trúc **Modular Monolith**. Thay vì tổ chức theo các lớp (Layered) đơn thuần, tính năng Ví sẽ được đóng gói thành một Module độc lập (Wallet Module) để dễ dàng bảo trì và mở rộng sau này.

---

## 1. Tổng quan Kiến trúc (Modular Monolith)

Trong kiến trúc Modular Monolith, toàn bộ mã nguồn của tính năng Ví (Wallet) sẽ được gom gọn vào một thư mục riêng biệt mang tính nghiệp vụ (Domain-driven), tách biệt tối đa với các module khác (như User, Course, Booking) ngoại trừ các interface/service công khai mà nó bộc lộ ra.

**Cấu trúc thư mục đề xuất cho Wallet Module:**
```text
backend/
└── modules/
    └── wallet/
        ├── controllers/
        │   ├── wallet.controller.js
        │   └── transaction.controller.js
        ├── services/
        │   ├── wallet.service.js        # Core logic ví
        │   ├── transaction.service.js   # Logic ghi log giao dịch
        │   └── payment.service.js       # Tích hợp VNPay/Stripe/MoMo
        ├── models/
        │   ├── Wallet.js
        │   └── Transaction.js
        ├── routes/
        │   └── wallet.routes.js
        ├── validations/
        │   └── wallet.validation.js
        └── index.js                     # Public API của module này để các module khác gọi
```

---

## 2. Thiết kế Cơ sở dữ liệu (Database Design)

Chúng ta cần ít nhất 2 bảng chính để đảm bảo tính minh bạch và có thể truy xuất nguồn gốc (audit) mọi thay đổi về số dư.

### 2.1 Bảng `wallets` (Ví người dùng)
Lưu trữ thông tin số dư hiện tại của người dùng.
- `id` (PK, UUID/Int)
- `user_id` (FK tới bảng Users, Unique)
- `balance` (BigInt - **Lưu ý:** Lưu tiền dưới dạng số nguyên vì VND không có phần thập phân)
- `currency` (String: Mặc định là "VND")
- `status` (Enum: ACTIVE, LOCKED, SUSPENDED)
- `created_at`, `updated_at`

### 2.2 Bảng `transactions` (Lịch sử giao dịch)
Bất kỳ sự thay đổi nào đối với `balance` của `wallets` đều phải sinh ra 1 record ở đây.
- `id` (PK, UUID)
- `wallet_id` (FK tới bảng wallets)
- `type` (Enum: DEPOSIT - Nạp tiền, WITHDRAWAL - Rút tiền, PAYMENT - Thanh toán, REFUND - Hoàn tiền)
- `amount` (Decimal/BigInt - Số tiền biến động. Có thể dùng số dương/âm để dễ tính toán)
- `balance_after` (Số dư sau giao dịch - dùng để đối soát)
- `status` (Enum: PENDING, SUCCESS, FAILED, CANCELED)
- `payment_method` (String: VNPAY, MOMO, STRIPE, SYSTEM)
- `reference_id` (Mã giao dịch từ đối tác thứ 3 như VNPay_TxnRef)
- `description` (Lý do giao dịch)
- `created_at`

---

## 3. Các bước triển khai chi tiết (Step-by-Step)

### Bước 1: Khởi tạo Model và Migration
- Tạo script migration hoặc định nghĩa Schema/Model (Mongoose/Sequelize/Prisma) cho `Wallet` và `Transaction`.
- Thêm ràng buộc Database: Cột `balance` trong bảng `wallets` phải `>= 0` (Check constraint) để đảm bảo không ai có thể có số dư âm ở cấp độ CSDL.

### Bước 2: Xây dựng Wallet Service (Core Logic)
Đây là phần quan trọng nhất, mọi logic cộng/trừ tiền phải thông qua đây. **Bắt buộc phải dùng Database Transaction (ACID)**.

Tạo `wallet.service.js` với các hàm:
- `createWallet(userId)`: Khởi tạo ví 0 đồng khi user mới đăng ký.
- `getWalletBalance(userId)`: Lấy số dư hiện tại.
- `addFunds(userId, amount, description, referenceId)`: 
  - Khởi tạo DB Transaction.
  - Cập nhật balance: `UPDATE wallets SET balance = balance + amount WHERE user_id = ?`
  - Thêm record vào `transactions`.
  - Commit DB Transaction.
- `deductFunds(userId, amount, description)`:
  - Khởi tạo DB Transaction.
  - Khóa Row: `SELECT * FROM wallets WHERE user_id = ? FOR UPDATE` (Pessimistic Locking để tránh Race Condition khi 2 request trừ tiền đến cùng lúc).
  - Kiểm tra `balance >= amount`. Nếu không đủ, quăng lỗi `InsufficientBalanceError`.
  - Trừ balance và tạo record `transactions`.
  - Commit.

### Bước 3: Tích hợp Cổng thanh toán (Nạp tiền / Deposit)
Tạo `payment.service.js`:
- Tích hợp SDK của VNPay, MoMo hoặc ZaloPay.
- **Tạo luồng thanh toán:**
  1. User chọn nạp 500k -> Backend tạo giao dịch `PENDING` trong bảng `transactions`.
  2. Backend trả về URL thanh toán VNPay.
  3. User thanh toán trên VNPay.
- **Xử lý Webhook / IPN (Instant Payment Notification):**
  - Viết endpoint (vd: `POST /api/wallet/vnpay-ipn`) nhận kết quả từ VNPay.
  - Xác minh chữ ký bảo mật (Signature).
  - Nếu thành công: Gọi hàm `addFunds` của `wallet.service` và chuyển status giao dịch thành `SUCCESS`.

### Bước 4: Chức năng Rút tiền (Withdrawal)
Vì là tiền thật, hệ thống không nên tự động bắn tiền ra ngoài ngay lập tức để tránh rủi ro.
1. User (Gia sư) gửi yêu cầu rút tiền -> Tạo `transaction` với status `PENDING` type `WITHDRAWAL`. 
2. Đồng thời gọi `deductFunds` nhưng chuyển tiền này vào trạng thái "Phong tỏa" (Held balance) hoặc cứ trừ balance và chờ duyệt.
3. Admin có màn hình quản lý duyệt rút tiền. Khi Admin bấm duyệt, tiền thực sự được chuyển cho Gia sư bằng tay hoặc qua Payout API, cập nhật status thành `SUCCESS`.
4. Nếu Admin từ chối, tiền được hoàn lại (`REFUND`) cho Gia sư.

### Bước 5: Expose API Controllers & Routes
Tạo các endpoint RESTful trong thư mục routes/controllers:
- `GET /api/wallets/me`: Xem số dư và thông tin ví.
- `GET /api/wallets/me/transactions`: Xem lịch sử giao dịch (có phân trang).
- `POST /api/wallets/deposit`: Tạo link nạp tiền.
- `POST /api/wallets/withdraw`: Tạo yêu cầu rút tiền.
- `POST /api/wallets/webhook/...`: Endpoint cho bên thứ 3 gọi vào.

### Bước 6: Tích hợp với Module Khác (Giao tiếp giữa các module)
Các module khác (vd: Module Đặt lịch/Booking) **không được** gọi trực tiếp vào Database của Wallet. 
Chúng phải gọi qua file `index.js` của Wallet module.
Ví dụ: Học viên thanh toán tiền khóa học.
```javascript
// Bên trong booking.service.js
const WalletModule = require('../../modules/wallet');

async function processBookingPayment(userId, coursePrice, bookingId) {
    // WalletModule sẽ chạy DB transaction an toàn, và quăng lỗi nếu không đủ tiền
    await WalletModule.payForService(userId, coursePrice, `Thanh toán booking #${bookingId}`);
    // Đổi trạng thái booking thành PAID
}
```

---

## 4. Các Vấn đề Bảo mật Cực kỳ Quan trọng (Security & Best Practices)

1. **Race Conditions (Lỗi ghi đè dữ liệu đồng thời):**
   - Rất hay xảy ra khi 1 user click đúp vào nút "Thanh toán". Lệnh kiểm tra tiền và trừ tiền chạy song song khiến ví bị trừ âm.
   - **Cách giải quyết:** Bắt buộc dùng Locking ở Database. Ví dụ dùng `SELECT ... FOR UPDATE` trong SQL, hoặc update atomically như `UPDATE wallets SET balance = balance - amount WHERE user_id = X AND balance >= amount;`.
2. **Idempotency (Tính luỹ đẳng):**
   - Các API Webhook từ cổng thanh toán có thể bị gọi lại nhiều lần do lỗi mạng.
   - Khi nhận webhook, luôn phải kiểm tra mã giao dịch (`reference_id`) đã được xử lý (SUCCESS) trước đó hay chưa để tránh cộng tiền 2 lần.
3. **Audit Trails:**
   - Dữ liệu trong bảng `transactions` là vĩnh viễn, **KHÔNG BAO GIỜ** được viết hàm Xóa (DELETE) hoặc Sửa (UPDATE) đối với các giao dịch đã hoàn tất.
   - Chỉ được phép tạo giao dịch bù trừ (Refund) nếu có sai sót.
4. **Định dạng Tiền tệ:**
   - Hoàn toàn dùng kiểu số nguyên (BigInt) để lưu trữ VND. Vì VND không sử dụng số lẻ thập phân, điều này giúp tránh hoàn toàn các lỗi sai số dấu phẩy động (Float/Double) trong quá trình tính toán.

---

> **Note cho nhóm:** Hãy bắt đầu từ việc thống nhất Cấu trúc Database và luồng Thanh toán (VNPay hay MoMo) trước. Sau khi chốt được CSDL, các bạn Backend tạo Migration, sau đó triển khai `WalletService` với các test case đầy đủ (đặc biệt là test race-condition) trước khi ráp vào API.

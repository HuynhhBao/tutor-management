# Báo cáo Tích hợp Thanh toán VNPay - Ví Điện Tử

Tài liệu này tổng hợp toàn bộ các thay đổi về mặt kiến trúc, cơ sở dữ liệu, frontend và hướng dẫn chi tiết cách thức cấu hình cũng như kiểm thử (test) luồng nạp tiền thông qua VNPay Sandbox.

---

## 1. Tổng quan các thay đổi đã thực hiện

> [!NOTE]
> Hệ thống đã được nâng cấp toàn diện từ Backend, Database cho đến Frontend để đảm bảo luồng thanh toán VNPay chạy mượt mà trên môi trường Localhost.

### Kiến trúc Backend
- **Chuyển đổi sang Module Độc Lập:** Tách toàn bộ logic liên quan đến Ví (Wallet) và Thanh toán (Payment) thành module chuyên biệt tại `backend/modules/wallet/`. Điều này giúp tuân thủ chặt chẽ kiến trúc Monolithic Modular, dễ bảo trì và mở rộng sau này.
- **Tự động hóa luồng IPN trên Localhost:** Vì localhost không nhận được IPN Webhook từ Internet, hệ thống đã được tinh chỉnh để tận dụng `vnp_ReturnUrl`. Khi thanh toán xong, trình duyệt sẽ bị VNPay gọi về backend (`/api/wallet/vnpay-return`). Tại đây, backend sẽ tiến hành xác minh chữ ký mã hóa (Checksum), cộng tiền vào Database rồi mới redirect (chuyển hướng) người dùng về giao diện Frontend.

### Cơ sở dữ liệu (Database)
- **Cơ chế Tự động hóa Ví:** Cập nhật hàm `initDb()` trong `config/db.js` để tự động dò quét và cấp phát Ví ảo (Wallet) cho tất cả các user và gia sư cũ chưa có ví trong hệ thống.
- **Sửa lỗi Crash SQL:** Khắc phục lỗi truyền thiếu tham số vào mảng cấu trúc lệnh `INSERT` của bảng `transactions`, đảm bảo lịch sử giao dịch được ghi lại thành công.

### Giao diện (Frontend)
- **Tái cấu trúc luồng gọi API:** Cập nhật `WalletPage.jsx` và `StudentDashboard.jsx` chuyển sang dùng `apiClient` (thay vì fetch gốc) để đính kèm Token bảo mật tự động.
- **Đồng bộ Dữ liệu:** Sửa lỗi giao diện ngầm (không hiển thị số dư sau khi nạp) bằng cách chuẩn hóa cấu trúc dữ liệu JSON trả về từ backend, giúp Frontend đọc đúng biến `data.balance`.

---

## 2. Cấu hình Biến Môi Trường (.env)

> [!IMPORTANT]
> Để chức năng nạp tiền hoạt động, bạn bắt buộc phải chèn đoạn mã dưới đây vào dưới cùng của file `.env` (nằm ở thư mục gốc của project). Đừng quên khởi động lại Backend (Terminal `nodemon`) sau khi lưu file.

```env
# Cấu hình thanh toán VNPay Sandbox
VNP_TMN_CODE=CGXZLS0Z
VNP_HASH_SECRET=XNBCJFAKAZQSGTARRLGCHVZWCIOIGSHN
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:3001/api/wallet/vnpay-return
```

---

## 3. Hướng dẫn Kịch bản Kiểm thử (Test Scenario)

> [!TIP]
> VNPay Sandbox quy định rất nghiêm ngặt. Hệ thống sẽ **báo lỗi giao dịch** nếu bạn nhập sai số thẻ hoặc ngày tháng. Hãy nhập chính xác thông tin Test Card dưới đây để trải nghiệm luồng cộng tiền thành công.

**Các bước thực hiện:**

1. Đăng nhập vào trang web với tư cách Học viên.
2. Truy cập thanh điều hướng, mở trang **Ví tiền của tôi**.
3. Bấm nút **Nạp tiền ngay**, nhập số tiền (ví dụ: `500000`), chọn phương thức **VNPay** và xác nhận.
4. Giao diện sẽ được chuyển hướng sang cổng thanh toán của VNPay. Tại đây, chọn **Thẻ nội địa và tài khoản ngân hàng** -> Chọn biểu tượng ngân hàng **NCB**.
5. Nhập chính xác thông tin Thẻ Test như sau:
   - **Số thẻ:** `9704198526191432198`
   - **Tên chủ thẻ:** `NGUYEN VAN A`
   - **Ngày phát hành:** `07/15`
6. VNPay sẽ yêu cầu nhập mã OTP, bạn có thể gõ tùy ý (ví dụ: `123456`) rồi bấm Xác nhận.
7. **Kết quả mong đợi:** VNPay báo Thanh toán thành công, trang web tự động giật về lại ví tiền. Trạng thái ví lập tức được cộng `+ 500.000 đ` và lịch sử hiện một giao dịch mới báo chữ "Nạp tiền thành công".

# Quy trình làm việc với Git

Tài liệu này hướng dẫn cách push/pull code và quy trình làm việc nhóm trên Git để đảm bảo tính ổn định của mã nguồn.

## 1. Các lệnh Git cơ bản

### Cập nhật code mới nhất (Pull)
Trước khi bắt đầu làm việc, hãy luôn cập nhật code mới nhất từ branch chung:
```bash
git pull origin [tên_nhánh]
```

### Đẩy code lên server (Push)
Sau khi đã commit các thay đổi:
```bash
git push origin [tên_nhánh]
```

## 2. Phân quyền và Quy định nhánh (Branch)

Dự án sử dụng các nhánh riêng biệt cho từng thành viên để tránh xung đột:

| Thành viên | Nhánh được phép Push |
| :--- | :--- |
| **Liêm** | `develop` |
| **Thư** | `thudevelop` |
| **Bảo** | `baodevelop` |

**Quy tắc nghiêm ngặt:**
- Tuyệt đối KHÔNG push trực tiếp lên nhánh `main` hoặc `backup`.
- Mỗi thành viên chỉ làm việc và push code lên nhánh đã được phân công.

---

## 3. Quy trình chi tiết cho từng thành viên

### Đối với Liêm và Thư:
1. Kiểm tra đang ở đúng nhánh của mình:
   - Liêm: `git checkout develop`
   - Thư: `git checkout thudevelop`
2. Làm việc và chuẩn bị code (Staging):
   Bạn có thể sử dụng một trong hai cách sau để chuẩn bị code trước khi push:

   **Cách 1: Sử dụng Terminal (Dòng lệnh)**
   Liệt kê cụ thể từng file bạn muốn đẩy lên:
   ```bash
   git add đường_dẫn_đến_file
   # Ví dụ: git add frontend/src/components/Header.jsx
   ```

   **Cách 2: Sử dụng Giao diện (VS Code Source Control)**
   - Bấm vào biểu tượng **Source Control** (hình 3 vòng tròn kết nối) ở thanh công cụ bên trái.
   - Trong danh sách **Changes**, di chuột vào file muốn push và nhấn vào dấu cộng (**+**) (Stage Changes) để đưa vào danh sách chờ.

   - **LƯU Ý QUAN TRỌNG:** Tuyệt đối KHÔNG bao giờ được add hoặc push file `.env` lên GitHub để bảo mật thông tin mật khẩu và mã bí mật.
3. Commit và Push:
   ```bash
   git commit -m "Mô tả công việc đã làm"
   ```
4. Push lên nhánh tương ứng:
   - Liêm: `git push origin develop`
   - Thư: `git push origin thudevelop`

### Đối với Bảo (Trưởng nhóm/Người quản lý Merge):
1. Làm việc trên nhánh cá nhân: `git checkout baodevelop`.
2. Thực hiện nhiệm vụ tổng hợp (Merge):

#### Bước A: Merge các nhánh phụ vào nhánh `backup`
Bảo sẽ gom code từ Liêm, Thư và chính mình vào nhánh `backup` để kiểm tra:
```bash
# Chuyển sang nhánh backup
git checkout backup

# Cập nhật backup mới nhất
git pull origin backup

# Merge code từ các nhánh thành viên
git merge develop      # Lấy code của Liêm
git merge thudevelop   # Lấy code của Thư
git merge baodevelop   # Lấy code của Bảo

# Xử lý xung đột (nếu có) và push lên backup
git push origin backup
```

#### Bước B: Merge từ `backup` lên `main`
Sau khi code trên `backup` đã ổn định và chạy tốt:
```bash
# Chuyển sang nhánh main
git checkout main

# Merge từ backup vào main
git merge backup

# Đẩy code lên nhánh chính
git push origin main
```

## 4. Lưu ý quan trọng
- **Cảnh báo bảo mật:** File `.env` chứa thông tin nhạy cảm. Nếu lỡ `git add .env`, hãy dùng lệnh `git reset .env` để loại bỏ trước khi commit.
- Luôn chạy `npm run dev` để kiểm tra code có lỗi không trước khi push.
- Nếu gặp xung đột (Conflict) khi merge, hãy báo cho các thành viên liên quan để cùng xử lý.
- Nhánh `main` là nhánh sản phẩm cuối cùng, chỉ được merge từ `backup` sau khi đã kiểm tra kỹ.

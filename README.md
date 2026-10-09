# WEWIN AI History Lab

Giao diện theo prototype Competition V2. Luồng tạo bài giảng theo `md/luong-tao-slide-tom-tat.md`.

Giáo viên nhập chủ đề, tư liệu, số slide (3–30), thời lượng, trình độ tiếng Anh và template. Hệ thống đọc PDF, Word, TXT hoặc link, chia nội dung thành đúng số slide, rồi cho chỉnh sửa, trình chiếu, xuất PDF hoặc PowerPoint.

Ảnh do giáo viên đặt thủ công. Phiên bản này không dùng AI Vision.

## Chạy

```bash
npm install
npm run db:push
npm run dev
```

Mở http://localhost:3000, đăng nhập, rồi chọn thiết kế mới. Bài được tạo từ tư liệu giáo viên nhập.

## Tài khoản phát triển

Chỉ dùng trên máy local, sau `npm run db:push` và `npm run db:seed` (đăng nhập lần đầu ở môi trường dev cũng tạo các tài khoản này):

| Tên đăng nhập | Mật khẩu | Vai trò |
| --- | --- | --- |
| admin | admin123 | ADMIN, mở và lưu mọi thiết kế |
| user | user123 | USER, chỉ thấy thiết kế của mình |

Để AI viết nội dung song ngữ, thêm `OPENAI_API_KEY` vào `.env`. Model mặc định là `gpt-5-nano`.

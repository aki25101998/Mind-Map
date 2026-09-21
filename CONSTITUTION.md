# HIẾN PHÁP DỰ ÁN (PROJECT CONSTITUTION)

## 1. Thông Tin Dự Án
- **Tên dự án:** Freeform Mind Map
- **Mô tả:** Ứng dụng vẽ sơ đồ tư duy (mind map) trên nền web, hỗ trợ bảng vẽ vô tận (infinite canvas). Người dùng có thể bắt đầu với các template (Two-way, Tree, Free layout, v.v.), sau đó tự do thêm, sửa, xóa, kéo thả và tùy chỉnh màu sắc các node.
- **Công nghệ cốt lõi:** React, TypeScript, Vite, @xyflow/react, Zustand (quản lý state), IndexedDB (lưu trữ local).
- **Link Repository:** [https://github.com/aki25101998/Mind-Map.git](https://github.com/aki25101998/Mind-Map.git)

## 2. Quy Tắc Bắt Buộc (Strict Rules)
1. **Luôn luôn cập nhật GitHub và deploy Firebase:** Mỗi khi hoàn thành một chức năng mới, sửa lỗi, hoặc có bất kỳ thay đổi nào về mã nguồn, bắt buộc phải thực hiện 2 việc sau thông qua terminal:
   - Commit và push code lên repository GitHub.
   - Chạy lệnh build (`cmd.exe /c npm run build`) và deploy lên Firebase (`cmd.exe /c npx -p firebase-tools firebase deploy`) ngay lập tức.
2. **Không phá vỡ cấu trúc:** Giữ nguyên kiến trúc chia tách rõ ràng (Data Model, Canvas Renderer, Layout Engine, Persistence).
3. **Giữ UI chuẩn:** Giao diện phải luôn giữ phong cách tối (Dark Mode), hiện đại, mượt mà và tối giản.

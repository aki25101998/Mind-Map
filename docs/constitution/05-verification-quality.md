# BỘ LUẬT 05: KIỂM ĐỊNH CHẤT LƯỢNG, MÔI TRƯỜNG WINDOWS & CI/CD (VERIFICATION & DEPLOY)

- **Vị trí tài liệu:** `docs/constitution/05-verification-quality.md`
- **Các file bị điều chỉnh trực tiếp:**
  - `package.json`
  - `.oxlintrc.json`
  - `.github/workflows/ci.yml`
  - Toàn bộ các file `*.test.ts` trong dự án

---

## 1. Nguyên Tắc Cốt Lõi (Core Principles)
1. **Bằng Chứng Trước Khi Khẳng Định (Evidence Before Assertions):** Tuyệt đối không bao giờ tuyên bố "Đã sửa xong" hoặc "Code hoạt động tốt" nếu chưa thực sự chạy lệnh kiểm thử và nhìn thấy kết quả PASS trong terminal.
2. **Không Khoan Nhượng Với Lỗi (Zero Tolerance):** Dự án duy trì tiêu chuẩn 0 lỗi type TypeScript, 0 lỗi linter Oxlint, và 100% bài test Vitest vượt qua. Cấm xóa hoặc comment out bài test để che giấu lỗi code!

---

## 2. Các Bất Biến Bắt Buộc (Strict Invariants)

### 2.1 Bất Biến 1: Quy Chuẩn Lệnh Môi Trường Windows (`cmd.exe /c`)
- **Đặc thù môi trường:** Máy tính của người dùng chạy hệ điều hành Windows với PowerShell có chính sách bảo mật cấm chạy file script `.ps1` (`PSSecurityException: UnauthorizedAccess`).
- **Quy tắc bất khả kháng:**
  - ❌ **CẤM:** Chạy trực tiếp `npm test`, `npm run build`, `npx firebase ...`
  - ✅ **BẮT BUỘC:** Mọi lệnh gọi npm/npx phải đi kèm tiền tố `cmd.exe /c`:
    - `cmd.exe /c npm test`
    - `cmd.exe /c npm run lint`
    - `cmd.exe /c npm run build`
    - `cmd.exe /c npx -p firebase-tools firebase deploy`

### 2.2 Bất Biến 2: Cổng Kiểm Định 3 Pha (Three-Phase Verification Gate)
Trước khi kết thúc bất kỳ lượt trả lời nào có sửa code, AI bắt buộc phải hoàn thành 3 pha kiểm định sau:
1. **Pha 1 - Kiểm thử Đơn vị & Tình huống:**
   - Lệnh: `cmd.exe /c npm test`
   - Tiêu chuẩn: 13 test suites (119+ bài test) phải PASS toàn bộ.
2. **Pha 2 - Kiểm tra Cú pháp & Clean Code:**
   - Lệnh: `cmd.exe /c npm run lint`
   - Tiêu chuẩn: Oxlint báo 0 errors và 0 warnings.
3. **Pha 3 - Biên dịch Sản phẩm:**
   - Lệnh: `cmd.exe /c npm run build`
   - Tiêu chuẩn: `tsc -b` không có bất kỳ lỗi kiểu dữ liệu nào và Vite build thành công bundle trong thư mục `dist/`.

### 2.3 Bất Biến 3: Quy Trình Tự Động Push GitHub & Deploy Firebase
Ngay sau khi vượt qua Cổng Kiểm Định 3 Pha, AI phải tự động thực thi chuỗi lệnh sau thông qua tool `run_command` mà không cần đợi người dùng yêu cầu:
```powershell
git add . ; git commit -m "Mô tả ngắn gọn, rõ ràng thay đổi vừa thực hiện" ; git push ; cmd.exe /c npm run build ; cmd.exe /c npx -p firebase-tools firebase deploy
```

---

## 3. Checklist Dành Cho AI Khi Hoàn Thành Nhiệm Vụ
- [ ] Đã chạy `cmd.exe /c npm test` chưa? (Kết quả có 100% PASS không?)
- [ ] Đã chạy `cmd.exe /c npm run lint` chưa? (Có xuất hiện warning nào không?)
- [ ] Đã chạy `cmd.exe /c npm run build` chưa? (Có lỗi type TypeScript nào không?)
- [ ] Đã chạy chuỗi lệnh tự động commit, push GitHub và deploy Firebase chưa?

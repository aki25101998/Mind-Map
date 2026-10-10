# HIẾN PHÁP VẬN HÀNH AI (AGENT OPERATIONAL CONSTITUTION)

> **MỤC ĐÍCH TỐI THƯỢNG:** File này chứa các chỉ thị vận hành bắt buộc cao nhất dành cho AI khi lập trình trong dự án Freeform Mind Map. Mọi hành vi làm sai lệch code, phá vỡ cấu trúc có sẵn hoặc bỏ qua quy trình kiểm thử đều bị NGHIÊM CẤM TUYỆT ĐỐI.

---

## 1. Chỉ Thị Tiên Quyết: Tuân Thủ Hiến Pháp Dự Án (Constitutional Compliance)

Trước khi chỉnh sửa bất kỳ file mã nguồn nào trong thư mục `src/`, AI **BẮT BUỘC** phải:
1. Đọc và nắm vững **Mười Điều Răn Cốt Lõi** tại [`CONSTITUTION.md`](file:///d:/Project/Mind%20map/CONSTITUTION.md).
2. Tra cứu bộ luật con liên quan trong `docs/constitution/`:
   - Liên quan đến node/cạnh/liên kết/xóa/thu gọn: đọc [`01-graph-invariants.md`](file:///d:/Project/Mind%20map/docs/constitution/01-graph-invariants.md).
   - Liên quan đến kích thước/gõ text/duplicate/paste/render: đọc [`02-canvas-geometry.md`](file:///d:/Project/Mind%20map/docs/constitution/02-canvas-geometry.md).
   - Liên quan đến Auto Layout/tọa độ/hướng nhánh: đọc [`03-layout-engine.md`](file:///d:/Project/Mind%20map/docs/constitution/03-layout-engine.md).
   - Liên quan đến lưu trữ/Firestore/IndexedDB/sanitize: đọc [`04-persistence-data.md`](file:///d:/Project/Mind%20map/docs/constitution/04-persistence-data.md).
   - Liên quan đến kiểm thử/lệnh terminal/build: đọc [`05-verification-quality.md`](file:///d:/Project/Mind%20map/docs/constitution/05-verification-quality.md).
   - Liên quan đến đóng gói/biên dịch Android APK: đọc [`06-mobile-build-pipeline.md`](file:///d:/Project/Mind%20map/docs/constitution/06-mobile-build-pipeline.md).
3. **CẤM:** Không được tùy tiện sửa đổi hành vi cốt lõi để làm việc dễ hơn (ví dụ: cấm hạ thấp điều kiện kiểm tra, cấm xóa bài test, cấm thay đổi cấu trúc dữ liệu đã được bảo vệ).

---

## 2. Quy Chuẩn Lệnh Môi Trường Windows (Windows Shell Directive)

Môi trường phát triển của người dùng là **Windows với PowerShell**. PowerShell cấm chạy các script `.ps1` (`PSSecurityException`).
- ❌ **TUYỆT ĐỐI CẤM:** Chạy trực tiếp `npm ...` hoặc `npx ...` (sẽ báo lỗi quyền thực thi).
- ✅ **BẮT BUỘC:** Luôn luôn thêm tiền tố `cmd.exe /c` cho mọi câu lệnh liên quan đến npm, npx hoặc công cụ node:
  - `cmd.exe /c npm test`
  - `cmd.exe /c npm run lint`
  - `cmd.exe /c npm run build`
  - `cmd.exe /c npx -p firebase-tools firebase deploy`

---

## 3. Cổng Kiểm Định Chất Lượng 3 Lớp (Three-Phase Verification Gate)

Trước khi kết thúc câu trả lời hoặc tiến hành deploy, AI **BẮT BUỘC** phải chạy đủ 3 bước kiểm tra và xác nhận đầu ra thành công:

1. **Bước 1 - Unit & Scenario Tests:**
   ```powershell
   cmd.exe /c npm test
   ```
   *Yêu cầu:* Toàn bộ 13 test suites (119+ bài test) phải hiển thị chữ `PASS`. Không được phép có bất kỳ bài test nào FAIL.
2. **Bước 2 - Linter (Clean Code):**
   ```powershell
   cmd.exe /c npm run lint
   ```
   *Yêu cầu:* Oxlint phải báo `Found 0 warnings and 0 errors`.
3. **Bước 3 - Biên Dịch Production (TypeScript Strict Check):**
   ```powershell
   cmd.exe /c npm run build
   ```
   *Yêu cầu:* Quá trình `tsc -b` không phát sinh lỗi type và Vite hoàn tất đóng gói bundle.

---

## 4. Quy Tắc Tự Động Push GitHub và Deploy Firebase (Auto-Push & Deploy Rule)

Bất cứ khi nào bạn hoàn thành một tác vụ lập trình, sửa lỗi, hoặc thay đổi bất kỳ file code nào trong dự án này, bạn **BẮT BUỘC** phải tự động commit, push các thay đổi đó lên GitHub và deploy dự án lên Firebase trước khi kết thúc câu trả lời của mình.

### Quy trình thực hiện tự động (Automated Pipeline):
Sau khi Cổng Kiểm Định 3 Lớp đã PASS, chạy chuỗi lệnh sau thông qua `run_command`:
```powershell
git add . ; git commit -m "Mô tả ngắn gọn, rõ ràng về thay đổi vừa thực hiện" ; git push ; cmd.exe /c npm run build ; cmd.exe /c npx -p firebase-tools firebase deploy
```

**LƯU Ý QUAN TRỌNG:** 
- Đừng chờ người dùng nhắc nhở hay ra lệnh push code hay deploy.
- Hãy tự động chạy các lệnh này thông qua công cụ `run_command` của bạn ngay khi code xong và test đã pass.

---

## 5. Quy Chuẩn Đóng Gói & Xuất Bản File APK (Mobile APK Pipeline)

Bất cứ khi nào người dùng yêu cầu build, đóng gói hoặc lấy file APK để cài đặt trên điện thoại, AI **BẮT BUỘC** tuân thủ hướng dẫn tại [`docs/constitution/06-mobile-build-pipeline.md`](file:///d:/Project/Mind%20map/docs/constitution/06-mobile-build-pipeline.md) và tự động thực hiện trọn vẹn 4 bước sau mà không cần người dùng can thiệp thủ công:

1. **Đồng bộ mã nguồn & kích hoạt build cloud:** Đảm bảo test pass, build web pass, commit và push lên nhánh `main`. Nhánh `main` sẽ kích hoạt GitHub Actions workflow `.github/workflows/build-apk.yml`.
2. **Theo dõi tiến trình:** Giám sát workflow cho đến khi hoàn thành và tự động đẩy file `Freeform-MindMap.apk` lên nhánh `build-output`.
3. **Tải file APK về thư mục dự án cục bộ:**
   ```powershell
   git fetch origin build-output:build-output
   git checkout build-output -- Freeform-MindMap.apk
   git restore --staged Freeform-MindMap.apk
   ```
4. **Sao chép ra Desktop/Downloads & Mở Explorer:**
   ```powershell
   Copy-Item 'D:\Project\Mind map\Freeform-MindMap.apk' 'C:\Users\aki25\Desktop\Freeform-MindMap.apk' -Force
   Copy-Item 'D:\Project\Mind map\Freeform-MindMap.apk' 'C:\Users\aki25\Downloads\Freeform-MindMap.apk' -Force
   Start-Process explorer.exe -ArgumentList '/select,"D:\Project\Mind map\Freeform-MindMap.apk"'
   ```


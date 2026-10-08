# HIẾN PHÁP DỰ ÁN (PROJECT CONSTITUTION)
# FREEFORM MIND MAP

> **Hiệu lực thi hành:** Bắt buộc áp dụng cho mọi lập trình viên và mọi hệ thống AI (Gemini, Claude, Antigravity, Cursor, Copilot) tham gia phát triển, bảo trì hoặc tái cấu trúc mã nguồn dự án này.

---

## 1. Thông Tin Dự Án & Ranh Giới Kỹ Thuật

- **Tên dự án:** Freeform Mind Map
- **Mô tả:** Ứng dụng vẽ sơ đồ tư duy (mind map) chuyên nghiệp trên nền web với bảng vẽ vô tận (infinite canvas). Cung cấp các mẫu template đa dạng (Two-way, Tree, Org, Brace, Flow, Radial, Freeform), hỗ trợ kéo thả tự do, tạo ghi chú, phân nhánh thông minh, tùy biến màu sắc, hoạt động offline-first và đồng bộ đa thiết bị qua Cloud.
- **Ngăn xếp công nghệ chuẩn (Standard Tech Stack):**
  - **Giao diện:** React 19, TypeScript strict mode, Vite 8
  - **Bảng vẽ Canvas:** `@xyflow/react` v12 (React Flow)
  - **Quản lý State:** Zustand v5 (kiến trúc đa Slice: `documentSlice`, `nodeEdgeSlice`, `editorSlice`, `historySlice`)
  - **Thuật toán Bố cục:** Dagre, thuật toán cây phân cấp phân nhánh tự chế (`hierarchyLayout.ts`, `layoutUtils.ts`)
  - **Lưu trữ:** IndexedDB cục bộ (`idb` v8) làm primary offline cache; Google Cloud Firestore làm cloud sync & chia sẻ
  - **Kiểm thử & Chất lượng:** Vitest v5 (103+ unit & scenario tests), Oxlint v1 (0 warning policy)
  - **Triển khai & CI/CD:** Firebase Hosting, GitHub Actions
- **Link Repository:** [https://github.com/aki25101998/Mind-Map.git](https://github.com/aki25101998/Mind-Map.git)

---

## 2. Mười Điều Răn Cốt Lõi (The Ten Golden Laws)

Mọi thao tác can thiệp mã nguồn **BẮT BUỘC** phải tuân theo 10 điều bất biến dưới đây. Tuyệt đối không được tự ý sửa đổi gây sai lệch hành vi:

### Điều 1: Bất Biến Node Gốc (Root Node Immunity)
Node gốc (`type: 'main'`) là trái tim của mind map. Cấm xóa node gốc bằng thao tác phím tắt hoặc nút xóa hàng loạt nếu trên canvas vẫn còn các node con. Cấm tạo node anh/em cho node gốc (`createSiblingNode`).

### Điều 2: Phân Định Cạnh Cấu Trúc vs Cạnh Quan Hệ (Edge Taxonomy)
Phân định rạch ròi giữa Cạnh Cấu Trúc (`!edge.data?.relationship`) và Cạnh Quan Hệ (`relationship: true`). Chỉ có cạnh cấu trúc mới quyết định quan hệ Cha-Con, nút đóng/mở thu gọn node, và thuật toán Auto Layout.

### Điều 3: Cấm Chu Trình & Tự Nối Trong Cây Cấu Trúc (No Cycles / Self-Loops)
Toàn bộ cây tư duy phải là Đồ thị Định hướng Không chu trình (DAG). Cấm tự nối từ một node sang chính nó, cấm trùng lặp cạnh, và cấm tạo chu trình khép kín (`A -> B -> C -> A`). Mọi liên kết phải được kiểm duyệt qua `isValidConnection()`.

### Điều 4: Không Biến Dạng Kích Thước Node (No Dimension Deformation)
Kích thước của node (`width`, `height`) đã được đo đạc (`node.measured`) hoặc người dùng chỉnh sửa phải được bảo toàn tuyệt đối khi copy, paste, duplicate và trong suốt quá trình soạn thảo văn bản. Cấm hành vi làm teo nhỏ, phình to hoặc giật rung node.

### Điều 5: Kỹ Thuật Gương Ẩn Khi Soạn Thảo (Ghost-Mirror Architecture)
Component soạn thảo văn bản `NodeTextEditor.tsx` bắt buộc sử dụng kỹ thuật "Gương ẩn": Thẻ ẩn `<span>` quyết định kích thước tự nhiên của node, thẻ `<textarea>` phủ tuyệt đối `position: absolute` lên trên kèm class `nodrag nopan`. Cấm để `<textarea>` tự ý đội kích thước container.

### Điều 6: Bảo Toàn Hướng Nhánh Bố Cục (Branch Side Preservation)
Thuật toán Auto Layout không được tự ý hoán đổi hướng nhánh (`layoutSide: 'left' | 'right'`) mà người dùng đã định hình. Bố cục cây dọc (Top-Down Tree) và bố cục ngang (Horizontal Two-Way) phải được xử lý độc lập, không trộn lẫn hệ tọa độ.

### Điều 7: Khử Sạch Trường Undefined Trước Khi Lưu (Mandatory Sanitization)
Google Cloud Firestore từ chối mọi document chứa trường `undefined`. Bắt buộc chạy qua `sanitizeDocument()` trong `src/persistence/sanitize.ts` trước khi ghi dữ liệu xuống IndexedDB hoặc Firestore.

### Điều 8: Ưu Tiên Offline-First & Giải Quyết Xung Đột Theo Thời Gian
Dữ liệu luôn được lưu an toàn xuống IndexedDB tức thì. Khi đồng bộ với Firestore, tài liệu có nhãn thời gian `updatedAt` mới hơn sẽ được ưu tiên sử dụng. Người dùng không bao giờ bị mất dữ liệu do mất kết nối mạng.

### Điều 9: Chuẩn Lệnh Môi Trường Windows (`cmd.exe /c` Requirement)
Do chính sách bảo mật PowerShell trên Windows chặn chạy file script `.ps1`, mọi lệnh gọi `npm` hoặc `npx` bắt buộc phải chạy qua tiền tố `cmd.exe /c` (ví dụ: `cmd.exe /c npm test`, `cmd.exe /c npm run build`).

### Điều 10: Tự Động Kiểm Định & Triển Khai (3-Phase Gate & Firebase Deploy)
Không hoàn tất nhiệm vụ khi chưa vượt qua Cổng Kiểm Định 3 Pha: 103 bài test Vitest PASS 100% -> Oxlint 0 lỗi -> Build thành công. Sau khi pass, AI bắt buộc tự động commit, push GitHub và deploy lên Firebase Hosting.

### Điều 11: Đóng Gói Mobile & Biên Dịch Đám Mây (Mobile Packaging & Cloud Build Pipeline)
Toàn bộ quy trình đóng gói ứng dụng di động Android (Capacitor) phải được tự động hóa biên dịch qua GitHub Actions đám mây và đồng bộ về nhánh `build-output`. Khi người dùng yêu cầu file APK, AI có trách nhiệm tự động lấy file APK về máy, sao chép ra Desktop/Downloads và hiển thị vị trí lưu.

---

## 3. Hệ Thống 6 Bộ Luật Chi Tiết (Detailed Sub-Constitutions)

Để nắm rõ các quy định cụ thể, ví dụ mã nguồn và phạm vi file chịu ảnh hưởng, tham khảo 6 bộ luật con tương ứng:

| Mã số | Tên Bộ Luật | Đường dẫn file | Nội dung trọng tâm |
|:---:|:---|:---|:---|
| **01** | **Toàn Vẹn Đồ Thị** | [`docs/constitution/01-graph-invariants.md`](file:///d:/Project/Mind%20map/docs/constitution/01-graph-invariants.md) | DAG rules, Root immunity, Cạnh cấu trúc vs Cạnh quan hệ, Cascade deletion |
| **02** | **Ổn Định Hình Học** | [`docs/constitution/02-canvas-geometry.md`](file:///d:/Project/Mind%20map/docs/constitution/02-canvas-geometry.md) | Ghost Mirror, Canonical dimensions, Chống biến dạng duplicate/edit, Min/Max bounds |
| **03** | **Bố Cục & Layout** | [`docs/constitution/03-layout-engine.md`](file:///d:/Project/Mind%20map/docs/constitution/03-layout-engine.md) | Bảo toàn nhánh Trái/Phải, Tree Top-down, Org layout, Chống va chạm spiral search |
| **04** | **Lưu Trữ & Dữ Liệu** | [`docs/constitution/04-persistence-data.md`](file:///d:/Project/Mind%20map/docs/constitution/04-persistence-data.md) | Sanitization sạch undefined, IndexedDB offline-first, Timestamp conflict resolution |
| **05** | **Kiểm Định & CI/CD** | [`docs/constitution/05-verification-quality.md`](file:///d:/Project/Mind%20map/docs/constitution/05-verification-quality.md) | Cổng 3 pha (Vitest + Oxlint + Build), Lệnh Windows `cmd.exe /c`, Tự động Deploy Firebase |
| **06** | **Đóng Gói Mobile APK** | [`docs/constitution/06-mobile-build-pipeline.md`](file:///d:/Project/Mind%20map/docs/constitution/06-mobile-build-pipeline.md) | Capacitor Android, GitHub Actions Cloud Build, Nhánh build-output, Tự động kéo APK về máy |

---

## 4. Tuyên Bố Bắt Buộc Đối Với AI (Mandate for AI Assistants)

Bất kỳ AI nào khi nhận nhiệm vụ liên quan đến mã nguồn của dự án này phải:
1. Đọc và đối chiếu với các nguyên tắc trong file này và 5 bộ luật chi tiết.
2. Từ chối thực hiện bất kỳ gợi ý nào vi phạm 10 Điều Răn Cốt Lõi, trừ khi có chỉ thị bằng văn bản rõ ràng của chủ dự án.
3. Luôn bảo toàn tính toàn vẹn của 103 bài test hiện có và bổ sung bài test mới tương ứng khi thêm tính năng.

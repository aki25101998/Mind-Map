# BỘ LUẬT 04: CHUẨN HÓA DỮ LIỆU, SANITIZE & ĐỒNG BỘ LƯU TRỮ (PERSISTENCE & SYNC)

- **Vị trí tài liệu:** `docs/constitution/04-persistence-data.md`
- **Các file bị điều chỉnh trực tiếp:**
  - `src/persistence/persistenceService.ts`
  - `src/persistence/sanitize.ts`
  - `src/persistence/firestore.ts`
  - `src/persistence/idb.ts`
  - `src/persistence/sanitize.test.ts`
  - `src/persistence/persistenceService.test.ts`
  - `src/hooks/useAutosave.ts`

---

## 1. Nguyên Tắc Cốt Lõi (Core Principles)
1. **Bảo Vệ Dữ Liệu Tuyệt Đối (No Data Loss):** Trải nghiệm người dùng là offline-first. Nếu mất mạng hoặc Firebase lỗi, dữ liệu PHẢI được lưu trọn vẹn vào IndexedDB của trình duyệt mà không làm gián đoạn công việc của người dùng.
2. **Làm Sạch Dữ Liệu Bắt Buộc (Mandatory Sanitization):** Google Cloud Firestore sẽ ném lỗi crash ngay lập tức nếu dữ liệu chứa bất kỳ trường nào có giá trị `undefined`, hàm hoặc cấu trúc tham chiếu vòng. Mọi đối tượng trước khi ghi xuống ổ đĩa/cloud đều phải được làm sạch qua `sanitizeDocument()`.

---

## 2. Các Bất Biến Bắt Buộc (Strict Invariants)

### 2.1 Bất Biến 1: Không Được Có Trường `undefined` (Zero Undefined Invariant)
- Trong `src/persistence/sanitize.ts`:
  - Trước khi gọi `saveMindMap()` lên Firestore hoặc IndexedDB, tài liệu `MindMapDocument` phải chạy qua `sanitizeDocument(doc)`.
  - Hàm này loại bỏ triệt để mọi key có giá trị `undefined`, biến đổi các giá trị số không hợp lệ (`NaN`, `Infinity`) thành giá trị fallback an toàn.
  - Các mảng `nodes` và `edges` phải được sao chép sâu (deep clean) để tránh rò rỉ object proxy của Zustand.

### 2.2 Bất Biến 2: Chiến Lược Ưu Tiên Offline & Xử Lý Xung Đột (Offline-First & Conflict Resolution)
- Thứ tự lưu trữ khi có thay đổi:
  1. Ghi ngay lập tức vào **IndexedDB** cục bộ để đảm bảo tốc độ phản hồi < 16ms.
  2. Nếu người dùng đã đăng nhập hoặc bật tính năng chia sẻ: Đẩy lên **Firestore** bất đồng bộ qua hàng đợi debounce (`useAutosave.ts`).
- Cơ chế giải quyết xung đột khi mở sơ đồ (`loadDocument`):
  - So sánh nhãn thời gian `updatedAt`:
  - Nếu `localDoc.updatedAt > cloudDoc.updatedAt`: Ưu tiên sử dụng bản `localDoc`, đồng thời cập nhật đè lên Cloud ở chế độ ngầm.
  - Nếu `cloudDoc.updatedAt > localDoc.updatedAt`: Sử dụng bản `cloudDoc` và cập nhật lại cache IndexedDB.

### 2.3 Bất Biến 3: Tương Thích Ngược Schema (Backwards Compatibility)
- Các mind map cũ có thể thiếu các trường mới như: `locked`, `tags`, `note`, `layoutSide`, `relationship`.
- Bộ giải mã và render Canvas KHÔNG ĐƯỢC giả định rằng các trường này luôn tồn tại.
- Bắt buộc phải có giá trị mặc định an toàn:
  ```ts
  const layoutSide = node.data?.layoutSide || 'right';
  const isLocked = !!node.data?.locked;
  const isRelationship = !!edge.data?.relationship;
  ```

### 2.4 Bất Biến 4: Kiểm Soát Trạng Thái Đồng Bộ (Sync Status Fidelity)
- Giao diện người dùng phải hiển thị trung thực trạng thái lưu trữ qua `syncStatus`:
  - `'saving'`: Đang ghi dữ liệu.
  - `'saved'`: Đã lưu an toàn thành công.
  - `'offline'`: Đã lưu nội bộ, không có kết nối cloud.
  - `'error'`: Có sự cố lưu trữ (phải ghi log chi tiết nhưng không được chặn người dùng tiếp tục thao tác).

---

## 3. Checklist Dành Cho AI Khi Can Thiệp Lưu Trữ & Schema
- [ ] Bất kỳ trường mới nào thêm vào `NodeData` hoặc `EdgeData` trong `src/types.ts` có giá trị `undefined` không?
- [ ] Đã thêm logic làm sạch trường mới đó trong `src/persistence/sanitize.ts` chưa?
- [ ] Chạy lệnh `cmd.exe /c npm test` để đảm bảo 100% test trong `sanitize.test.ts` và `persistenceService.test.ts` đều PASS.

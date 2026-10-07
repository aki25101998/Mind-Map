# BỘ LUẬT 02: ỔN ĐỊNH HÌNH HỌC CANVAS & SOẠN THẢO VĂN BẢN (CANVAS GEOMETRY)

- **Vị trí tài liệu:** `docs/constitution/02-canvas-geometry.md`
- **Các file bị điều chỉnh trực tiếp:**
  - `src/canvas/nodes/useNodeEditing.ts`
  - `src/canvas/nodes/NodeTextEditor.tsx`
  - `src/canvas/nodes/NodeDecorations.tsx`
  - `src/canvas/nodes/BasicNode.tsx`, `MainNode.tsx`, `RoundedNode.tsx`, `EllipseNode.tsx`, `TextNode.tsx`
  - `src/canvas/nodes/nodeEditingGeometry.test.ts`
  - `src/store/slices/editorSlice.ts`

---

## 1. Nguyên Tắc Cốt Lõi (Core Principles)
1. **Tuyệt Đối Không Làm Biến Dạng Kích Thước Node:** Việc bắt đầu chỉnh sửa văn bản (double click), gõ chữ, kết thúc sửa văn bản (blur/enter), hoặc nhân bản (duplicate/copy-paste) KHÔNG ĐƯỢC làm nhảy vị trí, co giật, hoặc biến dạng kích thước (width/height) của Node.
2. **Kỹ Thuật Gương Ẩn (Ghost-Mirror Architecture):** Chiều dài/rộng khi gõ văn bản phải được tính toán tự nhiên thông qua thẻ ẩn (`<span>`), thẻ `<textarea>` chỉ đóng vai trò lớp phủ nhập liệu (`position: absolute`), cấm để `<textarea>` tự ý đẩy phình container.

---

## 2. Các Bất Biến Bắt Buộc (Strict Invariants)

### 2.1 Bất Biến 1: Cơ Chế Ghost-Mirror Bắt Buộc Trong `NodeTextEditor.tsx`
Mọi component chỉnh sửa văn bản của Node phải tuân thủ chuẩn:
```tsx
<div style={{ position: 'relative', display: 'inline-grid', ... }}>
  {/* 1. Ghost Mirror: Ẩn vô hình, quyết định width & height dựa trên text */}
  <span
    aria-hidden="true"
    style={{
      visibility: 'hidden',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      overflowWrap: 'break-word',
      fontSize: `${fontSize}px`,
      fontWeight: fontWeight,
      lineHeight: '1.5',
      ...
    }}
  >
    {(value || placeholder || ' ') + '\u200B'}
  </span>

  {/* 2. Textarea Nhập liệu: Phủ tuyệt đối 100% lên Ghost Mirror */}
  <textarea
    className="nodrag nopan"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      resize: 'none',
      border: 'none',
      outline: 'none',
      background: 'transparent',
      ...
    }}
  />
</div>
```
- **Cấm:** Đặt thuộc tính `width: auto` hoặc để `<textarea>` có thuộc tính `resize` tự do gây phá vỡ khung bao của Node.
- **Bắt buộc:** Textarea phải có class `nodrag nopan` để ngăn việc bấm chuột vào ô nhập chữ vô tình kích hoạt kéo thả Canvas của `@xyflow/react`.

### 2.2 Bất Biến 2: Chụp Kích Thước Chuẩn (Canonical Dimensions) Trong `useNodeEditing.ts`
- Trước khi kích hoạt `isEditing: true`, hook `useNodeEditing` phải ưu tiên lấy kích thước thực đo được từ React Flow:
  1. `internalNode?.measured?.width` và `internalNode?.measured?.height`.
  2. Nếu chưa có, fallback sang kích thước DOM offset (`el.offsetWidth`, `el.offsetHeight`).
- Trong suốt quá trình đang sửa văn bản (`isEditing: true`):
  - Kích thước không được bị reset về 0 hoặc undefined.
  - Phải tắt transition hoạt họa CSS (`transition: 'none'`) để tránh hiện tượng giật rung khung hình.

### 2.3 Bất Biến 3: Bảo Toàn Kích Thước Khi Copy, Paste & Duplicate
- Trong `editorSlice.ts`:
  - Khi thực hiện `duplicateSelected()` hoặc `pasteFromClipboard()`:
  - Nếu node gốc có `data.width` hoặc `data.height` tùy chỉnh (hoặc đã đo `node.measured`), node mới nhân bản PHẢI mang nguyên vẹn các thông số kích thước này.
  - Tuyệt đối không xóa bỏ thuộc tính `width`, `height` khiến node nhân bản bị teo nhỏ hoặc phóng to bất thường.

### 2.4 Bất Biến 4: Giới Hạn Biên Độ Kích Thước (Boundary Constraints)
- Chiều rộng mặc định:
  - Min width: `80px`.
  - Max width: `420px`.
  - Phá vỡ dòng: Bắt buộc dùng `word-break: break-word` và `overflow-wrap: break-word` để text tiếng Việt dài không bị tràn ra ngoài biên Node.

---

## 3. Checklist Dành Cho AI Khi Chạm Vào Node & Giao Diện Canvas
- [ ] Khi thêm loại Node mới hoặc sửa CSS Node, có giữ đúng cấu trúc Handle (top, right, bottom, left) và nút collapse không?
- [ ] Gõ thử văn bản dài có bị vỡ khung bao hoặc che khuất icon ghi chú / badges không?
- [ ] Chạy lệnh `cmd.exe /c npm test` để kiểm tra toàn bộ suite `nodeEditingGeometry.test.ts` và `NodeDecorations.test.ts`.

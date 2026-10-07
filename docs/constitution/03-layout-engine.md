# BỘ LUẬT 03: THUẬT TOÁN SẮP XẾP & ĐỊNH HƯỚNG NHÁNH (LAYOUT ENGINE)

- **Vị trí tài liệu:** `docs/constitution/03-layout-engine.md`
- **Các file bị điều chỉnh trực tiếp:**
  - `src/utils/hierarchyLayout.ts`
  - `src/utils/layoutUtils.ts`
  - `src/hooks/useAutoLayout.ts`
  - `src/utils/autoLayout.test.ts`

---

## 1. Nguyên Tắc Cốt Lõi (Core Principles)
1. **Bảo Toàn Hướng Nhánh (Branch Side Preservation):** Người dùng có quyền sắp xếp ý tưởng sang nhánh trái hoặc nhánh phải. Thuật toán Auto Layout KHÔNG ĐƯỢC tự ý hoán đổi nhánh trái sang phải hoặc ngược lại nếu node đã có thuộc tính `layoutSide` rõ ràng.
2. **Tách Biệt Các Loại Bố Cục (Layout Independence):** Mỗi loại bố cục (`two-way`, `one-way`, `tree`, `org`, `brace`, `flow`, `radial`) có quy tắc tính toán tọa độ riêng biệt, không được trộn lẫn logic khiến bố cục Cây từ trên xuống (Top-down Tree) bị chuyển thành bố cục Ngang (Horizontal) và ngược lại.

---

## 2. Các Bất Biến Bắt Buộc (Strict Invariants)

### 2.1 Bất Biến 1: Xử Lý Bố Cục Hai Chiều (Two-Way Layout Invariants)
- **Node gốc (Root Node):** Luôn có tọa độ trung tâm `(x: 0, y: 0)` và `layoutSide: 'center'`.
- **Nhánh cấp 1 (Direct Children of Root):**
  - Nếu node con đã có `data.layoutSide === 'left'` hoặc `'right'`, thuật toán PHẢI giữ nguyên hướng đó.
  - Nếu node con chưa có hướng (`undefined`), thuật toán phân bổ cân bằng 50/50 sang 2 bên (Trái và Phải).
- **Nhánh con cháu (Descendants):**
  - Toàn bộ con cháu của một nhánh bên Trái PHẢI tiếp tục phát triển về bên Trái (tọa độ `x` giảm dần).
  - Toàn bộ con cháu của một nhánh bên Phải PHẢI tiếp tục phát triển về bên Phải (tọa độ `x` tăng dần).
  - Cấm trường hợp một nhánh Trái lại sinh ra nhánh con rẽ ngược về bên Phải đâm xuyên qua Node Gốc.

### 2.2 Bất Biến 2: Bố Cục Cây & Tổ Chức (Tree & Org Top-Down Layout)
- Khi `layoutType === 'tree'` hoặc `'org'`:
  - Trục phân cấp là trục đứng (Vertical): Cấp cha ở trên (y nhỏ hơn), cấp con ở dưới (y lớn hơn).
  - Trục dàn trải anh em là trục ngang (Horizontal): Tự động căn giữa các node con bên dưới node cha tương ứng.
  - Khoảng cách dọc (`RANK_SEP`) và khoảng cách ngang (`NODE_SEP`) phải duy trì tối thiểu 30px - 80px để tránh đè chữ.

### 2.3 Bất Biến 3: Bỏ Qua Cạnh Quan Hệ Khi Xây Dựng Cây Layout
- Trong `buildHierarchyTree()`:
  - Chỉ duyệt qua các cạnh thỏa mãn: `!e.hidden && isStructuralEdge(e)`.
  - Cạnh quan hệ (`relationship: true`) bị loại bỏ hoàn toàn khỏi cây phân cấp layout.
  - Nếu một node chỉ được nối bằng cạnh quan hệ mà không có cạnh cấu trúc từ cha, node đó được giữ nguyên vị trí tự do hoặc đặt độc lập, không được kéo giật vào cây phân cấp chính.

### 2.4 Bất Biến 4: Chống Va Chạm & Đè Node (Collision Avoidance)
- Khi thêm node mới (`createChildNode`, `createSiblingNode`):
  - Phải sử dụng hàm `findNonCollidingPosition()` trong `src/utils/layoutUtils.ts`.
  - Hàm này sử dụng thuật toán tìm kiếm xoắn ốc (spiral search) với bước nhảy và khoảng cách an toàn (`gap = 24px`) để node mới không bị nằm đè lên bất kỳ node sẵn có nào trên canvas.

---

## 3. Checklist Dành Cho AI Khi Can Thiệp Thuật Toán Bố Cục
- [ ] Chạy Auto Layout có làm lật ngược vị trí của các nhánh đã được người dùng cố tình kéo sang trái không?
- [ ] Khi có nhiều node con với độ dài text khác nhau, các node có bị đè viền lên nhau không?
- [ ] Chạy lệnh `cmd.exe /c npm test` và kiểm tra kỹ `src/utils/autoLayout.test.ts`.

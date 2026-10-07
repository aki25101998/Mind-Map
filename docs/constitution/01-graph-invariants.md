# BỘ LUẬT 01: TOÀN VẸN ĐỒ THỊ & BẤT BIẾN CÂY TƯ DUY (GRAPH INVARIANTS)

- **Vị trí tài liệu:** `docs/constitution/01-graph-invariants.md`
- **Các file bị điều chỉnh trực tiếp:**
  - `src/store/slices/nodeEdgeSlice.ts`
  - `src/utils/graphUtils.ts`
  - `src/types.ts`
  - `src/utils/graphUtils.test.ts`
  - `src/utils/canvasScenarios.test.ts`

---

## 1. Nguyên Tắc Cốt Lõi (Core Principles)
1. **Một Cây Đồ Thị Định Hướng Không Chu Trình (DAG):** Toàn bộ các nhánh tư duy cấu trúc phải tuân thủ nghiêm ngặt mô hình cây hướng từ Root (hoặc nhiều Root độc lập) xuống lá.
2. **Bảo Vệ Node Gốc (`type: 'main'`):** Node gốc là linh hồn của Mind Map, tuyệt đối không được phép bị xóa bởi bất kỳ thao tác xóa hàng loạt hoặc phím tắt nào nếu Mind Map đang có các node khác.

---

## 2. Các Bất Biến Bắt Buộc (Strict Invariants)

### 2.1 Bất Biến 1: Bảo Vệ Node Gốc (Root Node Immunity)
- **Hành vi cấm:**
  - `deleteSelected()` KHÔNG ĐƯỢC xóa node có `type === 'main'` nếu canvas còn có các node con khác.
  - `deleteNodeById(id)` KHÔNG ĐƯỢC xóa node gốc nếu `id` là node `main`.
  - `createSiblingNode(nodeId)`: Nếu `nodeId` có `type === 'main'`, hàm này PHẢI return sớm, tuyệt đối không tạo node anh/em cho Node Gốc (Node Gốc không có anh em).
- **Trường hợp ngoại lệ duy nhất:** Khi người dùng cố tình xóa trắng toàn bộ canvas, canvas phải hiển thị nút khởi tạo lại (Reset / Blank canvas) để người dùng không bị kẹt ở màn hình đen.

### 2.2 Bất Biến 2: Phân Loại Cạnh Cấu Trúc vs Cạnh Quan Hệ (Edge Taxonomy)
Hệ thống phân định rạch ròi 2 loại cạnh:
1. **Cạnh Cấu Trúc (Structural Edge - `!edge.data?.relationship`):**
   - Đại diện cho quan hệ phân cấp Cha - Con (`Parent -> Child`).
   - Là cơ sở duy nhất để tính:
     - `computeHasChildrenMap`: Xác định node có con hay không để hiện nút thu gọn (+/-).
     - `toggleCollapse` & `computeSubtreeVisibility`: Ẩn/hiện toàn bộ cây con hậu duệ khi bấm nút đóng/mở.
     - Thuật toán Auto Layout (`hierarchyLayout.ts`).
2. **Cạnh Quan Hệ (Relationship Edge - `edge.data?.relationship === true`):**
   - Đại diện cho liên kết chéo giữa hai ý tưởng bất kỳ.
   - KHÔNG tham gia vào quan hệ cha con.
   - KHÔNG làm thay đổi trạng thái ẩn/hiện khi thu gọn node.
   - KHÔNG tác động lên hướng nhánh của thuật toán Auto Layout.

### 2.3 Bất Biến 3: Cấm Tuyệt Đối Vòng Lặp & Tự Nối (No Self-Loops & No Cycles)
Mọi thao tác tạo kết nối (`onConnect`) hoặc nối lại cạnh (`onReconnectEdge`) đều bắt buộc phải thông qua `isValidConnection()` trong `src/utils/graphUtils.ts`:
- **Cấm tự nối:** Nối từ node A sang chính node A (`source === target`).
- **Cấm cạnh trùng:** Đã tồn tại cạnh nối `A -> B` thì không tạo thêm cạnh `A -> B`.
- **Cấm cạnh đảo ngược cấu trúc:** Đã có `A -> B` cấu trúc thì cấm tạo `B -> A` cấu trúc.
- **Cấm tạo chu trình (Cycle Prevention):** Bất kỳ cạnh cấu trúc mới nào mà làm xuất hiện vòng lặp (`A -> B -> C -> A`) phải bị từ chối ngay lập tức thông qua hàm `wouldCreateCycle()`.

### 2.4 Bất Biến 4: Dọn Dẹp Cạnh & Khôi Phục Hậu Duệ Khi Xóa (Cascade Deletion)
- Khi một node bị xóa:
  - Tất cả các cạnh cấu trúc và cạnh quan hệ nối vào/ra node đó PHẢI bị xóa đồng thời.
  - Nếu node bị xóa đang ở trạng thái thu gọn (`collapsed: true`) và che giấu các node con, hệ thống phải xử lý khôi phục hiển thị hoặc xóa an toàn, không để sót các node con "mồ côi" (orphaned nodes) bị ẩn vĩnh viễn trong store.

---

## 3. Checklist Dành Cho AI Khi Chạm Vào Code Đồ Thị
Trước khi sửa bất kỳ logic nào trong `src/store/slices/nodeEdgeSlice.ts` hoặc `src/utils/graphUtils.ts`:
- [ ] Đã kiểm tra xem thay đổi có vi phạm `isValidConnection` không?
- [ ] Đã kiểm tra xem phím tắt `Delete`, `Backspace`, `Tab` (tạo con), `Enter` (tạo em) có hoạt động đúng theo phân cấp không?
- [ ] Chạy lệnh `cmd.exe /c npm test` để đảm bảo toàn bộ các test trong `graphUtils.test.ts` và `canvasScenarios.test.ts` đều PASS.

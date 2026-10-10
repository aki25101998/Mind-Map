# Design Spec: Project Organization & Collapsible Sidebar Management

- **Date:** 2026-10-10
- **Topic:** Phân loại và quản lý Mind Map theo Dự án (Project) với thanh Sidebar tiện lợi, bảo toàn 100% mục Recent Maps và Templates.
- **Status:** Approved by User, Ready for Planning

---

## 1. Executive Summary & Goals

### 1.1 Objective
Cung cấp khả năng phân loại và tổ chức các sơ đồ tư duy (Mind Maps) theo từng Dự án (Project) thông qua thanh Sidebar bên trái trực quan, gọn gàng và dễ thao tác trên cả desktop lẫn thiết bị di động.

### 1.2 Core Requirements & User Decisions
1. **Mô hình Thư mục 1 cấp (Flat Projects):**
   - Mỗi Mind Map thuộc về tối đa 1 Project (hoặc thuộc danh mục "Chưa phân loại" / Uncategorized).
   - Dự án là danh mục phẳng (không phân cấp lồng nhau phức tạp), giúp quản lý tập trung, nhẹ nhàng và trực quan.
2. **Bảo tồn 100% mục Recent Maps & Templates:**
   - Mục "Tất cả Mind Maps" trên Dashboard giữ nguyên vẹn danh sách các sơ đồ mở gần đây (Recent Maps) và thư viện mẫu có sẵn (Ready-to-use Templates).
3. **Thanh Sidebar Trực Quan (Collapsible Sidebar):**
   - Dashboard có thanh Sidebar bên trái hiển thị danh sách Project (kèm mã màu chấm tròn, số lượng mind map con bên trong) và nút tạo Project mới.
   - Hỗ trợ nút đóng/mở (Collapse ☰) để tối đa không gian làm việc; tự động chuyển thành Drawer trượt trên thiết bị di động.
   - Trong Canvas Editor, `DocumentSidebar` nhóm các sơ đồ theo từng Project tương ứng để chuyển đổi nhanh giữa các bản đồ cùng dự án.
4. **An Toàn Dữ Liệu Khi Xóa (Safe Deletion Policy):**
   - Khi xóa một Project đang chứa các sơ đồ, người dùng được lựa chọn:
     - *Mặc định (An toàn):* Giữ lại toàn bộ các sơ đồ và tự động chuyển về mục "Chưa phân loại".
     - *Xóa triệt để:* Xóa vĩnh viễn Project kèm tất cả các sơ đồ bên trong (có modal cảnh báo xác nhận rõ số lượng sơ đồ bị ảnh hưởng).
5. **Thao Tác Chuyển Đổi Project Linh Hoạt:**
   - Mỗi thẻ Mind Map trên Dashboard và Sidebar có tùy chọn "Chuyển sang Project khác" (Move to Project).
   - Khi đang đứng trong một Project cụ thể và bấm tạo Mind Map mới, sơ đồ tạo ra sẽ tự động được gán vào Project đó.

---

## 2. Architecture & Data Model

### 2.1 Entity Project (`src/types.ts`)
```ts
export interface Project {
  id: string;          // UUID v4
  name: string;        // Tên dự án (vd: "Chiến dịch Marketing Q4")
  color: string;       // Mã màu đại diện (vd: "#10b981", "#f97316", "#8b5cf6")
  description?: string;
  createdAt: number;
  updatedAt: number;
}
```

### 2.2 Mở rộng `MindMapDocument` (`src/types.ts`)
```ts
export interface MindMapDocument {
  id: string;
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  viewport: Viewport;
  templateId?: string;
  projectId?: string; // ID của Project chứa sơ đồ (nếu undefined -> Chưa phân loại)
  createdAt: number;
  updatedAt: number;
  shareEnabled?: boolean;
  shareId?: string;
  sharePermission?: 'view' | 'edit';
}
```

### 2.3 Tuân Thủ Hiến Pháp Lưu Trữ (Bộ Luật 04 & Điều 7)
1. **Làm Sạch Dữ Liệu (Zero-Undefined Invariant):**
   - Trong `src/persistence/sanitize.ts`:
     - Bổ sung hàm `sanitizeProject(project)` để loại bỏ triệt để mọi key `undefined`.
     - Trong `sanitizeDocument()`: Kiểm tra trường `projectId`. Nếu `projectId` là `undefined` hoặc chuỗi rỗng thì xóa bỏ key khỏi payload trước khi ghi vào Firestore.
2. **IndexedDB Cục Bộ (`src/persistence/idb.ts`):**
   - Nâng cấp database version từ 2 lên 3.
   - Tạo object store mới `projects` với `keyPath: 'id'`.
   - Tạo indexes: `updatedAt` (number), `uid` (string), `uid_updatedAt` (`[string, number]`).
   - Cung cấp các hàm: `saveProject()`, `getProject()`, `getAllProjects()`, `deleteProject()`.
3. **Firestore Cloud Sync (`src/persistence/firestore.ts`):**
   - Lưu trữ tại đường dẫn: `users/{uid}/projects/{projectId}`.
   - Cung cấp các hàm: `saveCloudProject()`, `getCloudProjects()`, `deleteCloudProject()`.
4. **Dịch Vụ Đồng Bộ Hóa (`src/persistence/persistenceService.ts`):**
   - Quản lý đồng bộ Offline-First cho cả Projects và Mind Maps:
     - `syncProject(project: Project)`: Lưu IndexedDB tức thì, sau đó đồng bộ lên Firestore nếu đã đăng nhập.
     - `loadAllProjects()`: Tải song song từ IndexedDB và Firestore, so sánh nhãn thời gian `updatedAt` để giải quyết xung đột dữ liệu.
     - `removeProject(id: string, deleteContainedMaps: boolean)`: Xóa project, nếu `deleteContainedMaps` là false thì cập nhật các map con thành `projectId: undefined`; nếu true thì xóa luôn các map con.

---

## 3. Component Architecture & UI Flow

### 3.1 Cấu Trúc Thành Phần Giao Diện
```
src/
├── types.ts                               # Định nghĩa Project, bổ sung projectId vào MindMapDocument
├── persistence/
│   ├── idb.ts                             # ObjectStore 'projects', schema v3
│   ├── firestore.ts                       # users/{uid}/projects CRUD
│   ├── sanitize.ts                        # sanitizeProject, sanitizeDocument(projectId)
│   └── persistenceService.ts              # syncProject, loadAllProjects, removeProject
├── components/
│   ├── project/
│   │   ├── ProjectModal.tsx               # Modal tạo / chỉnh sửa Project (Tên, chọn màu sắc)
│   │   ├── MoveToProjectModal.tsx         # Modal chuyển Mind Map sang Project khác
│   │   └── ProjectSidebar.tsx             # Thanh sidebar quản lý danh sách Projects
│   └── DocumentSidebar.tsx                # Cập nhật phân nhóm Mind Map theo Project
└── pages/
    └── Dashboard.tsx                      # Tích hợp Sidebar, bộ lọc Project, bảo toàn Recent Maps & Templates
```

### 3.2 Luồng Tương Tác Chi Tiết (UI Interactions)

1. **Khi vào Dashboard:**
   - Mặc định chọn mục `"all"` (Tất cả Mind Maps). Hiển thị toàn bộ Quick Actions, Recent Maps, và Available Templates như hiện tại.
   - Thanh Sidebar hiển thị bên trái (desktop) hoặc ẩn sau nút toggle ☰ (mobile/collapsed).
   - Sidebar liệt kê:
     - Mục hệ thống: `📁 Tất cả Mind Maps` (kèm badge tổng số), `📂 Chưa phân loại` (kèm badge số map không có projectId).
     - Mục người dùng: Danh sách các Projects với chấm màu và số lượng sơ đồ con.
     - Nút `+ Tạo Project Mới`.
2. **Khi bấm chọn một Project trong Sidebar:**
   - Khung nội dung chính chuyển sang hiển thị view của Project đó:
     - Tiêu đề Project, mã màu, mô tả (nếu có), số lượng sơ đồ.
     - Nút `+ Tạo Mind Map trong Project này`: Khởi tạo sơ đồ mới và tự động gán `projectId: activeProjectId`.
     - Lưới các thẻ sơ đồ thuộc Project đó.
     - Nút chuyển nhanh về `Tất cả sơ đồ`.
3. **Thao tác Chuyển Project (Move to Project):**
   - Click menu ba chấm `⋮` trên thẻ Mind Map -> chọn "Chuyển sang Project...".
   - Mở `MoveToProjectModal` hiển thị danh sách các Project hiện có + tùy chọn "Chưa phân loại".
   - Bấm chọn project -> cập nhật `projectId` của tài liệu và lưu qua `syncDocument`.
4. **Thao tác Xóa Project:**
   - Click menu `⋮` trên Project ở Sidebar -> chọn "Xóa Project".
   - Hộp thoại xác nhận hiện ra với 2 lựa chọn radio/nút:
     - Lựa chọn 1: "Chuyển X sơ đồ bên trong về mục Chưa phân loại" (Khuyên dùng).
     - Lựa chọn 2: "Xóa vĩnh viễn Project và toàn bộ X sơ đồ bên trong".
5. **Trong Canvas Editor (`DocumentSidebar.tsx`):**
   - Khi bấm mở `Documents`, danh sách sơ đồ được nhóm theo từng Project (với header phân mục project kèm màu sắc), giúp người dùng dễ dàng định vị các sơ đồ cùng nhóm.

---

## 4. Error Handling & Quality Verification

### 4.1 Error Handling
- Khi tạo/sửa Project: Tên dự án không được để trống (validate trim chiều dài >= 1 ký tự).
- Khi mất kết nối mạng: Dự án lưu an toàn vào IndexedDB cục bộ (offline-first); tự động đồng bộ khi có kết nối trở lại.
- Tương thích ngược: Mọi tài liệu cũ không có `projectId` được xử lý an toàn với `doc.projectId ?? undefined`.

### 4.2 Kế hoạch Kiểm Thử (Testing & Quality Gate)
- **Unit Tests:**
  - `src/persistence/sanitize.test.ts`: Kiểm tra `sanitizeProject` và đảm bảo `projectId` được làm sạch, không sinh `undefined`.
  - `src/persistence/persistenceService.test.ts`: Kiểm tra tạo, tải, cập nhật và xóa Project (cả 2 kịch bản xóa giữ map và xóa kèm map).
- **Quality Gate 3 Pha (Theo AGENTS.md):**
  1. `cmd.exe /c npm test`: Toàn bộ test suites hiện tại (113 test) và test mới phải PASS 100%.
  2. `cmd.exe /c npm run lint`: Oxlint 0 warnings, 0 errors.
  3. `cmd.exe /c npm run build`: TypeScript `tsc -b` và Vite build thành công không lỗi.
- **Tự động Commit, Push & Deploy Firebase:** Tuân thủ quy định tại AGENTS.md Mục 4.

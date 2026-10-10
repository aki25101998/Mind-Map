# Project Organization & Collapsible Sidebar Management Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cung cấp tính năng phân loại Mind Map theo Project, tích hợp Sidebar bên trái có thể thu gọn, bảo toàn 100% Recent Maps và Templates, tuân thủ nghiêm ngặt Hiến pháp dự án.

**Architecture:** Bổ sung entity `Project` và mở rộng `MindMapDocument.projectId`. Nâng cấp IndexedDB lên version 3 và đồng bộ Firestore `users/{uid}/projects` theo kiến trúc Offline-First. Xây dựng các UI component quản lý project và tích hợp vào Dashboard và DocumentSidebar.

**Tech Stack:** React 19, TypeScript, Zustand v5, IndexedDB (idb v8), Google Cloud Firestore, Lucide React icons, Vitest.

---

### Task 1: Data Model & Sanitization

**Files:**
- Modify: `src/types.ts`
- Modify: `src/persistence/sanitize.ts`
- Modify: `src/persistence/sanitize.test.ts`

- [x] **Step 1: Write unit tests in `src/persistence/sanitize.test.ts` for Project and `projectId`**

Thêm các ca kiểm thử:
- `sanitizeProject`: làm sạch các trường hợp lệ, loại bỏ các trường `undefined`.
- `sanitizeDocumentForPersistence`: bảo toàn `projectId` hợp lệ, nhưng loại bỏ key `projectId` nếu giá trị là `undefined` hoặc chuỗi rỗng.

- [x] **Step 2: Run test to verify it fails**

Run: `cmd.exe /c npm test`
Expected: FAIL (hàm `sanitizeProject` chưa được export / định nghĩa).

- [x] **Step 3: Implement data model and sanitize functions**

1. Trong `src/types.ts`:
   - Thêm `export interface Project { id: string; name: string; color: string; description?: string; createdAt: number; updatedAt: number; }`
   - Mở rộng `MindMapDocument`: thêm `projectId?: string;`
2. Trong `src/persistence/sanitize.ts`:
   - Cung cấp `sanitizeProject(project: Partial<Project>): Project`
   - Trong `sanitizeDocumentForPersistence`: xử lý `projectId`. Nếu `doc.projectId` tồn tại và là string không rỗng thì gán vào payload, ngược lại không tạo key `projectId`.

- [x] **Step 4: Run test to verify it passes**

Run: `cmd.exe /c npm test`
Expected: PASS (100% tests pass).

- [x] **Step 5: Commit changes**

```powershell
git add src/types.ts src/persistence/sanitize.ts src/persistence/sanitize.test.ts ; git commit -m "feat(models): add Project interface, extend MindMapDocument with projectId, and implement sanitization"
```

---

### Task 2: Persistence Layer (IndexedDB & Firestore)

**Files:**
- Modify: `src/persistence/idb.ts`
- Modify: `src/persistence/firestore.ts`
- Modify: `src/persistence/persistenceService.ts`
- Modify: `src/persistence/persistenceService.test.ts`

- [x] **Step 1: Write unit tests in `src/persistence/persistenceService.test.ts` for Project CRUD**

Thêm các test case:
- `syncProject` lưu vào local và cloud thành công.
- `loadAllProjects` tải và hợp nhất giữa local và cloud dựa trên `updatedAt`.
- `removeProject` với tùy chọn giữ lại mind map (chuyển về Chưa phân loại) và tùy chọn xóa triệt để.

- [x] **Step 2: Run test to verify failure**

Run: `cmd.exe /c npm test`
Expected: FAIL (các hàm `syncProject`, `loadAllProjects`, `removeProject` chưa tồn tại).

- [x] **Step 3: Implement IndexedDB v3 upgrade and Project operations in `idb.ts`**

1. Nâng version `openDB<MyDB>('MindMapDB', 3, ...)`
2. Thêm store `projects`:
   - keyPath: `'id'`
   - indexes: `updatedAt`, `uid`, `uid_updatedAt`
3. Export:
   - `saveProject(project: Project & { uid?: string }): Promise<void>`
   - `getProject(id: string): Promise<Project | undefined>`
   - `getAllProjects(uid?: string): Promise<Project[]>`
   - `deleteProject(id: string): Promise<void>`

- [x] **Step 4: Implement Firestore Project operations in `firestore.ts`**

Export:
- `saveCloudProject(project: Project): Promise<void>`
- `getCloudProjects(): Promise<Project[]>`
- `deleteCloudProject(id: string): Promise<void>`

- [x] **Step 5: Implement `persistenceService.ts` Project sync & removal logic**

Export:
- `syncProject(project: Project): Promise<SyncResult>`
- `loadAllProjects(): Promise<Project[]>`
- `removeProject(projectId: string, deleteContainedMaps?: boolean): Promise<void>`
  - Nếu `deleteContainedMaps` là `false` (mặc định): Tải tất cả maps thuộc project đó, cập nhật `projectId = undefined`, và gọi `syncDocument` lưu lại.
  - Nếu `deleteContainedMaps` là `true`: Xóa toàn bộ các document thuộc project đó.
  - Sau đó gọi `deleteProject(projectId)` ở local và cloud.

- [x] **Step 6: Run tests to verify all pass**

Run: `cmd.exe /c npm test`
Expected: PASS.

- [x] **Step 7: Commit changes**

```powershell
git add src/persistence/idb.ts src/persistence/firestore.ts src/persistence/persistenceService.ts src/persistence/persistenceService.test.ts ; git commit -m "feat(persistence): implement IndexedDB v3, Firestore sync and persistence service for Projects"
```

---

### Task 3: Project UI Components (Modals & Sidebar)

**Files:**
- Create: `src/components/project/ProjectModal.tsx`
- Create: `src/components/project/MoveToProjectModal.tsx`
- Create: `src/components/project/DeleteProjectModal.tsx`
- Create: `src/components/project/ProjectSidebar.tsx`

- [x] **Step 1: Create `ProjectModal.tsx`**

Modal cho phép:
- Nhập tên Project (bắt buộc, trim >= 1 ký tự).
- Chọn màu sắc đại diện từ bảng màu có sẵn (Sunset Orange `#f97316`, Emerald Green `#10b981`, Sky Blue `#0284c7`, Violet `#8b5cf6`, Rose `#f43f5e`, Amber `#f59e0b`).
- Nhập mô tả (tùy chọn).
- Hỗ trợ cả 2 chế độ: Tạo mới (`mode: 'create'`) hoặc Chỉnh sửa (`mode: 'edit'`).

- [x] **Step 2: Create `MoveToProjectModal.tsx`**

Modal cho phép:
- Hiển thị danh sách tất cả các Project hiện có + Tùy chọn "📂 Chưa phân loại (Unassigned)".
- Hiển thị dấu tích chọn cho Project hiện tại của sơ đồ.
- Khi bấm chọn, cập nhật `projectId` của Mind Map và gọi `onSelect(projectId)`.

- [x] **Step 3: Create `DeleteProjectModal.tsx`**

Modal xác nhận xóa Project:
- Hiển thị tên Project và số lượng Mind Map đang nằm trong Project.
- Nếu không có Mind Map nào: Hiển thị nút xác nhận xóa đơn giản.
- Nếu có >= 1 Mind Map: Cung cấp 2 lựa chọn:
  1. *(Khuyên dùng)* Giữ lại các sơ đồ và chuyển về mục "Chưa phân loại".
  2. Xóa vĩnh viễn Project kèm toàn bộ các sơ đồ bên trong.

- [x] **Step 4: Create `ProjectSidebar.tsx`**

Thanh Sidebar bên trái:
- Section ĐIỀU HƯỚNG:
  - `📁 Tất cả Mind Maps` (kèm tổng số map, active state).
  - `📂 Chưa phân loại` (kèm số map không có `projectId`).
- Section PROJECTS:
  - Header với nút `+` tạo nhanh.
  - Danh sách Project: Chấm màu đại diện, tên project, số lượng map, menu hành động `⋮` (Đổi tên, Đổi màu, Xóa).
  - Nút `+ Tạo Project Mới`.
- Hỗ trợ nút thu gọn (Collapse) và Drawer trượt trên màn hình di động (`isMobile`).

- [x] **Step 5: Verify build & lint**

Run: `cmd.exe /c npm run lint`
Expected: 0 errors, 0 warnings.

- [x] **Step 6: Commit changes**

```powershell
git add src/components/project/ ; git commit -m "feat(ui): add ProjectModal, MoveToProjectModal, DeleteProjectModal, and ProjectSidebar components"
```

---

### Task 4: Integrate Project Management into Dashboard

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [x] **Step 1: Integrate `ProjectSidebar` and project filtering into `Dashboard.tsx`**

1. State quản lý:
   - `projects: Project[]`
   - `activeFilter: string` (`'all'` | `'uncategorized'` | `projectId`)
   - `isSidebarCollapsed: boolean`
   - Modal states: `showProjectModal`, `projectToEdit`, `moveTargetDoc`, `projectToDelete`
2. Logic tải dữ liệu:
   - Khi mount Dashboard, gọi song song `loadAllDocuments()` và `loadAllProjects()`.
3. Bảo toàn 100% Recent Maps & Templates khi `activeFilter === 'all'`:
   - Giao diện giữ nguyên vẹn mục "Recent Maps" và "Ready-to-use Templates".
4. Khi `activeFilter` là một `projectId` cụ thể:
   - Hiển thị Banner Project (Tên, màu, mô tả, nút "+ Mind Map Mới" tự động gán `projectId`).
   - Hiển thị danh sách Mind Maps thuộc Project đó.
5. Thêm menu ba chấm `⋮` vào từng thẻ Mind Map:
   - Có tùy chọn "Chuyển sang Project..." mở `MoveToProjectModal`.
   - Có tùy chọn "Xóa Mind Map".
6. Cập nhật `handleSelectTemplate` và `handleImport`:
   - Nếu đang ở trong một Project cụ thể (`activeFilter !== 'all' && activeFilter !== 'uncategorized'`), sơ đồ mới sẽ tự động nhận `projectId: activeFilter`.

- [x] **Step 2: Verify tests and run lint**

Run: `cmd.exe /c npm test`
Run: `cmd.exe /c npm run lint`
Expected: All tests PASS, 0 lint warnings.

- [x] **Step 3: Commit changes**

```powershell
git add src/pages/Dashboard.tsx ; git commit -m "feat(dashboard): integrate ProjectSidebar, project filtering, and move-to-project functionality"
```

---

### Task 5: Group Mind Maps by Project in DocumentSidebar

**Files:**
- Modify: `src/components/DocumentSidebar.tsx`

- [x] **Step 1: Group documents by project in `DocumentSidebar.tsx`**

1. Tải cả `projects` khi mở `DocumentSidebar`.
2. Phân nhóm danh sách documents:
   - Nhóm theo các Project hiện có (kèm chấm màu và tên project).
   - Nhóm "Chưa phân loại" cho các sơ đồ không có `projectId`.
3. Thao tác tạo "New Document": nếu đang chọn xem project nào hoặc có thể tạo mặc định.

- [x] **Step 2: Verify tests and run lint**

Run: `cmd.exe /c npm test`
Run: `cmd.exe /c npm run lint`
Expected: All tests PASS, 0 lint warnings.

- [x] **Step 3: Commit changes**

```powershell
git add src/components/DocumentSidebar.tsx ; git commit -m "feat(editor): group mind maps by project in DocumentSidebar"
```

---

### Task 6: Comprehensive Verification, Auto-Push & Deploy

**Files:**
- All modified files

- [x] **Step 1: Run 3-Phase Verification Gate**

1. Unit tests:
   ```powershell
   cmd.exe /c npm test
   ```
   *Yêu cầu:* 100% PASS.
2. Linter:
   ```powershell
   cmd.exe /c npm run lint
   ```
   *Yêu cầu:* Found 0 warnings and 0 errors.
3. Production build:
   ```powershell
   cmd.exe /c npm run build
   ```
   *Yêu cầu:* `tsc -b` không phát sinh lỗi, Vite bundle hoàn tất.

- [x] **Step 2: Auto-Push & Firebase Deploy**

Theo Điều 10 của Hiến pháp và AGENTS.md:
```powershell
git add . ; git commit -m "feat: complete Project organization and collapsible sidebar management" ; git push ; cmd.exe /c npm run build ; cmd.exe /c npx -p firebase-tools firebase deploy
```

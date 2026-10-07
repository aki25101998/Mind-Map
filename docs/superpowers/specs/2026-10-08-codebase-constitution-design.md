# Design Spec: Freeform Mind Map Constitution & AI Coding Invariants

- **Date:** 2026-10-08
- **Topic:** Comprehensive multi-layered constitution system to prevent regressions, arbitrary alterations, and code degradation by AI assistants.
- **Status:** Approved by User, Ready for Implementation

---

## 1. Executive Summary & Goals

### 1.1 Objective
Establish an unviolable, multi-layered "Constitution" (`AGENTS.md`, `CONSTITUTION.md`, and modular sub-constitutions in `docs/constitution/`) that governs all future AI coding and developer modifications on the **Freeform Mind Map** project. 

The constitution enforces:
1. **Zero Degradation:** Absolute protection of core architectural invariants (Graph DAG rules, Root Node immunity, Node dimension stability, Layout direction preservation, Firestore sanitization).
2. **Deterministic Verification:** Mandatory pre-deployment validation pipeline (Vitest unit tests, Oxlint, TypeScript compilation).
3. **Execution Safety in Windows:** Mandatory `cmd.exe /c` execution policy compliance.
4. **Auto-Push & Deploy Continuity:** Automated GitHub push and Firebase hosting deploy on every completed task.

---

## 2. Structural Architecture

The constitution follows a **Hub-and-Spoke** hierarchy:

```text
Mind-Map/
├── AGENTS.md                                   # Layer 1: AI Operational Constitution (Injected into Agent prompt)
├── CONSTITUTION.md                             # Layer 2: Core Architectural Constitution & Golden Rules Index
└── docs/constitution/                          # Layer 3: Modular Domain-Specific Invariants & Standards
    ├── 01-graph-invariants.md                  # Graph integrity, DAG rules, root protection, edge taxonomy
    ├── 02-canvas-geometry.md                   # Node dimensions, text editor ghost-mirror, resize bounds
    ├── 03-layout-engine.md                     # Hierarchy layout, branch side retention, Dagre trees
    ├── 04-persistence-data.md                  # IDB, Firestore, sanitization, schema stability, conflict resolution
    └── 05-verification-quality.md              # 103 test suites, Oxlint, tsc, Windows cmd.exe, Git/Firebase rules
```

---

## 3. Detailed Specifications per File

### 3.1 `AGENTS.md` (Operational Constitution)
- **Role:** Directly parsed by IDE / AI agents as persistent system instructions (`<RULE[...AGENTS.md]>`).
- **Core Directives:**
  1. **Constitution First:** Before writing or modifying any code in `src/`, AI must inspect `CONSTITUTION.md` and the relevant domain file in `docs/constitution/`.
  2. **Windows Shell Rule:** Every shell command for `npm` or `npx` MUST be executed via `cmd.exe /c npm ...` or `cmd.exe /c npx ...` (due to PowerShell `npm.ps1` execution restriction).
  3. **Verification Gate:** Before claiming completion, the 3-phase verification pipeline must pass:
     - `cmd.exe /c npm test` (all 103+ Vitest tests pass).
     - `cmd.exe /c npm run lint` (0 warnings, 0 errors).
     - `cmd.exe /c npm run build` (tsc strict + Vite build success).
  4. **Auto-Commit & Auto-Deploy Rule:** Automatically run:
     `git add . ; git commit -m "..." ; git push ; cmd.exe /c npm run build ; cmd.exe /c npx -p firebase-tools firebase deploy`
     Never wait for user prompting.

---

### 3.2 `CONSTITUTION.md` (Root Architectural Constitution)
- **Role:** High-level architectural contract, project description, tech stack boundaries, and index of golden laws.
- **Contents:**
  1. **Project Metadata:** Freeform Mind Map, React 19, TypeScript, Vite, `@xyflow/react` 12, Zustand 5, IndexedDB, Firebase.
  2. **Ten Golden Laws (Mười Điều Răn Cốt Lõi):**
     - Law 1: Root Node Protection (`type: 'main'` is immune to deletion and sibling creation).
     - Law 2: Strict Edge Taxonomy (Structural vs Relationship edges).
     - Law 3: Cycle & Self-Loop Prohibition.
     - Law 4: Sizing & Dimension Immutability (Preserve measured/custom dimensions; no uncontrolled expansion).
     - Law 5: Ghost-Mirror Text Editing (Always isolate editing textarea geometry).
     - Law 6: Layout Direction Preservation (`layoutSide` 'left'/'right'/'center' must not be flipped).
     - Law 7: Zero-Undefined Persistence Sanitization (`sanitizeDocument` before IDB/Firestore writes).
     - Law 8: Offline-First Priority (Local IDB as primary, Firestore as sync/backup).
     - Law 9: Test & Lint Cleanliness (Zero failing tests, zero lint warnings).
     - Law 10: Automatic Delivery (GitHub push and Firebase deploy).
  3. **Sub-constitution Directory Index.**

---

### 3.3 Domain Sub-Constitutions (`docs/constitution/`)

#### 3.3.1 `01-graph-invariants.md` (Đồ thị & Quản lý Cây Node)
- **Target Files:** `src/store/slices/nodeEdgeSlice.ts`, `src/utils/graphUtils.ts`, `src/types.ts`.
- **Invariants:**
  - `type: 'main'` is the single anchor root. Calling `deleteSelected` or `deleteNodeById` on `main` node is rejected.
  - Calling `createSiblingNode` on `main` is rejected (root cannot have siblings).
  - Structural edges (`!edge.data?.relationship`) form a strict DAG (Directed Acyclic Graph).
  - Validation: `wouldCreateCycle`, `isValidConnection` must guard all connection and reconnection actions.
  - Relationship edges (`edge.data?.relationship === true`) do NOT count towards parent-child hierarchy, collapse propagation, or `hasChildrenMap`.
  - Node deletion must cascade to connected edges and restore visibility of descendants if a collapsed parent is removed.

#### 3.3.2 `02-canvas-geometry.md` (Hình học & Soạn thảo Văn bản)
- **Target Files:** `src/canvas/nodes/*Node.tsx`, `useNodeEditing.ts`, `NodeTextEditor.tsx`, `NodeDecorations.tsx`.
- **Invariants:**
  - Node dimensions (`width`, `height`) must NOT be wiped or corrupted during copy-paste, duplicate, or text edit.
  - `useNodeEditing` uses canonical geometry resolution:
    1. React Flow measured geometry (`node.measured.width/height`).
    2. Fallback to DOM offset measurements.
  - Text editing MUST use the ghost-mirror technique:
    - Invisible ghost `<span>` dictates width/height based on text content and typography.
    - Absolute-positioned `<textarea>` with `.nodrag .nopan` overlays the ghost without jumping or expanding out of control.
  - Custom user-resized dimensions must be respected. Auto-shrink or forced expansion is strictly forbidden.

#### 3.3.3 `03-layout-engine.md` (Thuật toán Sắp xếp & Hướng nhánh)
- **Target Files:** `src/utils/hierarchyLayout.ts`, `src/utils/layoutUtils.ts`, `src/hooks/useAutoLayout.ts`.
- **Invariants:**
  - Two-way layout: Children allocated to `left` or `right` branches must preserve their `layoutSide` or balance symmetrically from the center.
  - Tree / Org / Top-Down layouts: Support horizontal and vertical rank directions without scrambling node coordinates.
  - Dagre engine integrations must preserve node custom dimensions and avoid collisions via `findNonCollidingPosition`.
  - Non-structural edges (relationship edges) must NOT influence hierarchical tree ranks or positions.

#### 3.3.4 `04-persistence-data.md` (Lưu trữ Dữ liệu, Sanitization & Sync)
- **Target Files:** `src/persistence/persistenceService.ts`, `src/persistence/sanitize.ts`, `src/persistence/firestore.ts`, `src/persistence/idb.ts`.
- **Invariants:**
  - Strict Sanitization: Firestore and IndexedDB crash or reject records with `undefined` values, prototypes, or circular structures. `sanitizeDocument()` must always run before any save.
  - Conflict Resolution: Compare timestamps `updatedAt`. If local is newer, overwrite cloud and preserve offline changes.
  - Backward compatibility: Document schemas must maintain support for older mind map formats without crashing the parser.

#### 3.3.5 `05-verification-quality.md` (Kiểm thử, Môi trường & CI/CD)
- **Target Files:** `package.json`, `.oxlintrc.json`, all `*.test.ts` files, `.github/workflows/ci.yml`.
- **Invariants:**
  - Mandatory pre-completion commands:
    ```bash
    cmd.exe /c npm test
    cmd.exe /c npm run lint
    cmd.exe /c npm run build
    ```
  - Any code change that alters graph behavior, layout, or node geometry MUST include or update unit tests in `src/utils/*.test.ts` or `src/canvas/nodes/*.test.ts`.
  - Windows Execution Policy constraint: Never execute raw `.ps1` or bare `npm` scripts in PowerShell.
  - Mandatory auto-commit and Firebase deploy pipeline:
    ```bash
    git add . ; git commit -m "..." ; git push ; cmd.exe /c npm run build ; cmd.exe /c npx -p firebase-tools firebase deploy
    ```

---

## 4. Implementation Steps
1. Create `docs/constitution/01-graph-invariants.md`.
2. Create `docs/constitution/02-canvas-geometry.md`.
3. Create `docs/constitution/03-layout-engine.md`.
4. Create `docs/constitution/04-persistence-data.md`.
5. Create `docs/constitution/05-verification-quality.md`.
6. Update `CONSTITUTION.md` in repository root with full Golden Laws and index links.
7. Update `AGENTS.md` in repository root with strict AI behavior rules and cross-references.
8. Verify all tests, lint, and build.
9. Auto-commit, push to GitHub, and deploy to Firebase.

# Canvas Logic Upgrade & Mind Map Graph Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Mind Map Canvas to be a rock-solid, production-grade editor with strict graph integrity (no self-loops, duplicate edges, cycles in structural hierarchy), protected root node, clean delete/collapse mechanics, accurate collision detection, viewport-preserving auto layout, dedicated edge interactions, node locking, and full keyboard/search navigation without breaking existing features.

**Architecture:** Maintain existing React Flow (`@xyflow/react`) + Zustand architecture. Extract graph validation, hierarchy traversal, and nested collapse visibility into dedicated utility modules (`graphUtils.ts`, `layoutUtils.ts`). Enforce invariants at store action boundaries (`nodeEdgeSlice.ts`, `editorSlice.ts`) and supply connection guards to React Flow.

**Tech Stack:** React 19, TypeScript, Zustand 5, @xyflow/react 12, Vitest, Lucide React.

---

### Task 1: Graph Validation & Hierarchy Utilities (`graphUtils.ts` & Tests)

**Files:**
- Modify: `src/types.ts`
- Modify: `src/utils/graphUtils.ts`
- Create: `src/utils/graphUtils.test.ts`

- [ ] **Step 1: Write failing tests in `src/utils/graphUtils.test.ts`**
  - Test `isStructuralEdge`: returns true when `!edge.data?.relationship`, false when `edge.data?.relationship === true`.
  - Test `wouldCreateCycle`: detects cycles in structural graph (`A -> B`, adding `B -> A` returns true; `A -> B -> C`, adding `C -> A` returns true; adding `C -> D` returns false).
  - Test `isValidConnection`:
    - Reject self-connection (`A -> A`).
    - Reject duplicate edge (`A -> B` when `A -> B` exists).
    - Reject reverse structural edge (`B -> A` when `A -> B` exists).
    - Reject non-existent source/target.
    - Reject structural cycle.
    - Allow valid connections.
  - Test `getDescendants`: only traverses structural edges, ignoring relationship edges.
  - Test `computeHasChildrenMap`: only counts structural edges.
  - Test `computeSubtreeVisibility`: handles nested collapse correctly (`A -> B -> C -> D`; when B collapses, C & D hidden; when B expands and C was collapsed, C is visible while D remains hidden).
  - Test `findAncestors`: returns ancestor chain up to root.

- [ ] **Step 2: Run tests to verify they fail**
  - Run: `cmd.exe /c npm test`
  - Expected: FAIL due to missing utility functions.

- [ ] **Step 3: Update `src/types.ts` and implement functions in `src/utils/graphUtils.ts`**
  - Add `locked?: boolean;` and `fontWeight?: string | number;` to `NodeData` in `src/types.ts`.
  - Implement `isStructuralEdge`, `wouldCreateCycle`, `isValidConnection`, updated `getDescendants`, updated `computeHasChildrenMap`, `computeSubtreeVisibility`, and `findAncestors`.

- [ ] **Step 4: Run tests to verify they pass**
  - Run: `cmd.exe /c npm test`
  - Expected: PASS all graph validation and hierarchy tests.

---

### Task 2: Store Graph Integrity & Root Protection (`nodeEdgeSlice.ts`)

**Files:**
- Modify: `src/store/slices/nodeEdgeSlice.ts`
- Modify: `src/store/slices/types.ts`
- Test: `src/utils/graphUtils.test.ts` or integration tests

- [ ] **Step 1: Update `onConnect` with strict validation**
  - Import `isValidConnection` from `graphUtils.ts`.
  - Validate connection against current `nodes` and `edges`.
  - If invalid, return early without committing history or mutating state.

- [ ] **Step 2: Harden `deleteSelected` & `deleteNodeById` with Root Protection & Edge Deletion**
  - In `deleteSelected`:
    - Identify selected nodes excluding `type === 'main'`.
    - Identify selected edges (`edges.filter(e => e.selected)`).
    - If no non-root nodes and no edges are selected, return early without commit.
    - Remove all connected edges of deleted nodes (both structural and relationship).
    - If any remaining nodes were hidden descendants of a deleted collapsed node, restore their visibility.
    - Clean up `selectedNodeIds`, `editingNodeId`, and `contextMenu`.
    - Commit history once.
  - In `deleteNodeById`:
    - If node has `type === 'main'`, return early without commit.
    - Remove node and connected edges, commit history once.

- [ ] **Step 3: Prevent Root Sibling in `createSiblingNode`**
  - In `createSiblingNode(nodeId)`:
    - If target node has `type === 'main'` (or no parent edge), return early without creating a sibling or child.
    - Do not perform silent child creation.

- [ ] **Step 4: Upgrade `toggleCollapse` for Nested Hierarchy Restoration**
  - Use `computeSubtreeVisibility` so that expanding/collapsing accurately respects nested collapsed flags.
  - Clear selection if any selected node becomes hidden.

---

### Task 3: Node Collision Detection & Positioning (`layoutUtils.ts`)

**Files:**
- Modify: `src/utils/layoutUtils.ts`

- [ ] **Step 1: Update `findNonCollidingPosition` to use measured sizes and type-aware bounds**
  - Prioritize `node.measured?.width` and `node.measured?.height`.
  - Fallback dimensions based on `node.type`:
    - `main`: 200 x 70
    - `ellipse`: 160 x 80
    - `text`: 120 x 40
    - `rounded`: 160 x 50
    - `basic`: 160 x 50
  - Calculate candidate node size using candidate type, label length, and font size.
  - Set gap to 24px and use spiral search to avoid overlapping existing nodes.

- [ ] **Step 2: Respect locked nodes in `applyAutoLayout`**
  - Exclude nodes with `data.locked === true` from position shifts or preserve their user-assigned positions.
  - Document behavior in code.

---

### Task 4: Copy, Paste Offset & Undo/Redo Controls (`editorSlice.ts`, `TopToolbar.tsx`)

**Files:**
- Modify: `src/store/slices/editorSlice.ts`
- Modify: `src/store/slices/types.ts`
- Modify: `src/editor/TopToolbar.tsx`

- [ ] **Step 1: Improve Paste Offset in `editorSlice.ts`**
  - Add `pasteCount: number` to editor slice state.
  - In `copySelected`: reset `pasteCount: 0`.
  - In `pasteFromClipboard`:
    - Increment `pasteCount`.
    - Compute offset: `const offset = 40 * pasteCount;`
    - Apply offset `{ x: n.position.x + offset, y: n.position.y + offset }`.
    - Remap IDs, remap edge source/targets, select new nodes, commit history once.

- [ ] **Step 2: Disable Undo/Redo Buttons when Inactive**
  - In `TopToolbar.tsx`:
    - Check `historyIndex <= 0` for `canUndo`.
    - Check `historyIndex >= history.length - 1` for `canRedo`.
    - Set `disabled={!canUndo}` and `disabled={!canRedo}` on Undo and Redo buttons.
    - Update styles so disabled buttons have lower opacity (0.4) and `cursor: not-allowed`.

---

### Task 5: Edge Selection, Styling & Floating Edge Toolbar (`MindMapEdge.tsx`, `EdgeFloatingToolbar.tsx`, `MindMapCanvas.tsx`)

**Files:**
- Create: `src/canvas/edges/EdgeFloatingToolbar.tsx`
- Modify: `src/canvas/edges/MindMapEdge.tsx`
- Modify: `src/canvas/MindMapCanvas.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Enhance Edge Visuals and Selection State**
  - Ensure edge selection shows a distinct accent outline and glows on selection.
  - Support connection line and handle styling during drag in `index.css`.

- [ ] **Step 2: Create `EdgeFloatingToolbar.tsx`**
  - Floating toolbar displayed when 1 edge is selected and 0 nodes are selected.
  - Controls:
    - Edge style: Curved, Straight, Orthogonal.
    - Stroke pattern: Solid, Dashed.
    - Arrows: Arrow Start, Arrow End.
    - Color picker & stroke width selector.
    - Delete Edge button.

- [ ] **Step 3: Connect Edge Selection & Delete in `MindMapCanvas.tsx`**
  - Support deleting selected edges with Delete / Backspace key.
  - Render `EdgeFloatingToolbar` when an edge is selected.

---

### Task 6: Canvas Interactions, Node Editing & Viewport Tools (`MindMapCanvas.tsx`, `FloatingToolbar.tsx`, `ContextMenu.tsx`, `BottomToolbar.tsx`)

**Files:**
- Modify: `src/canvas/MindMapCanvas.tsx`
- Modify: `src/canvas/FloatingToolbar.tsx`
- Modify: `src/editor/ContextMenu.tsx`
- Modify: `src/editor/BottomToolbar.tsx`

- [ ] **Step 1: Standardize Double Click Canvas & Keybindings in `MindMapCanvas.tsx`**
  - Double clicking canvas creates node with label `'New Topic'`, sets it selected, and immediately enters edit mode.
  - Pass `isValidConnection` to `<ReactFlow isValidConnection={...} />`.
  - Handle `F` key to center view on selected node (`setCenter`).
  - Disable Enter creating sibling when Root is selected.
  - Pass `nodesDraggable={!isReadOnly}` and disable dragging on locked nodes.

- [ ] **Step 2: Update `FloatingToolbar.tsx`**
  - Hide "Add Sibling" button when `node.type === 'main'`.
  - Add Lock/Unlock button.
  - Add Text formatting options: Bold toggle, Text Align (left, center, right), URL field.

- [ ] **Step 3: Update `ContextMenu.tsx` and `BottomToolbar.tsx`**
  - In `ContextMenu.tsx`:
    - Hide/disable Delete and Add Sibling for root node.
    - Add "Lock Node" / "Unlock Node" action.
    - Add "Reset View" (`x: 0, y: 0, zoom: 1`).
  - In `BottomToolbar.tsx`:
    - Disable Delete if Root is the only selected node.
    - Add "Reset View" button.

---

### Task 7: Search Enhancement with Collapsed Ancestor Expansion (`CommandPalette.tsx`)

**Files:**
- Modify: `src/components/CommandPalette.tsx`

- [ ] **Step 1: Support `Ctrl+F` and Search Across All Nodes**
  - Listen to both `Ctrl+K` and `Ctrl+F` (and Cmd variants).
  - Search across label, note, and tags.
  - Show nodes even if currently inside a collapsed subtree (with a tag `(in collapsed branch)`).

- [ ] **Step 2: Auto-expand Ancestors on Selection**
  - When user selects a node from search results:
    - If node is currently hidden, find its collapsed ancestors using `findAncestors()`.
    - Expand those ancestors (`node.data.collapsed = false`).
    - Recalculate visibility so the node is visible.
    - Focus and center the viewport on the node.

---

### Task 8: Verification, Test Scenarios & Build Check

**Files:**
- All touched files

- [ ] **Step 1: Run complete test suite**
  - Run: `cmd.exe /c npm test`
  - Expected: PASS all unit tests.

- [ ] **Step 2: Run linter**
  - Run: `cmd.exe /c npm run lint`
  - Expected: No lint errors.

- [ ] **Step 3: Run production build**
  - Run: `cmd.exe /c npm run build`
  - Expected: Build succeeds cleanly.

- [ ] **Step 4: Auto-commit, Push to GitHub & Deploy to Firebase**
  - Follow AGENTS.md Constitution:
  - `git add . ; git commit -m "feat(canvas): upgrade graph integrity, root protection, edge toolbar, collision detection, and UX" ; git push ; cmd.exe /c npm run build ; cmd.exe /c npx -p firebase-tools firebase deploy`

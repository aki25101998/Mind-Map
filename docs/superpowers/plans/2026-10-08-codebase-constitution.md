# Codebase Constitution Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a robust multi-layered Constitution system (`AGENTS.md`, `CONSTITUTION.md`, and 5 domain files in `docs/constitution/`) to strictly bind all future AI coding and developer changes to core graph invariants, canvas geometry stability, layout direction preservation, Firestore sanitization, and automated verification/deploy workflows.

**Architecture:** Hub-and-Spoke constitution model: `AGENTS.md` (Operational instructions for AI context) -> `CONSTITUTION.md` (Master Architectural Ten Laws) -> `docs/constitution/` (Domain-specific rules with concrete code references).

**Tech Stack:** React 19, TypeScript, @xyflow/react 12, Zustand 5, IndexedDB, Firebase Firestore & Hosting, Vitest, Oxlint.

---

### Task 1: Create Domain Sub-Constitutions in `docs/constitution/`

**Files:**
- Create: `docs/constitution/01-graph-invariants.md`
- Create: `docs/constitution/02-canvas-geometry.md`
- Create: `docs/constitution/03-layout-engine.md`
- Create: `docs/constitution/04-persistence-data.md`
- Create: `docs/constitution/05-verification-quality.md`

- [ ] **Step 1: Write `docs/constitution/01-graph-invariants.md`**
  - Define root node protection (`type: 'main'` immunity to deletion and sibling creation).
  - Define structural edges vs relationship edges taxonomy.
  - Detail DAG invariant enforcement (`wouldCreateCycle`, `isValidConnection`).
  - Specify delete cascade and collapse propagation rules.

- [ ] **Step 2: Write `docs/constitution/02-canvas-geometry.md`**
  - Detail node dimension preservation (`useNodeEditing` canonical geometry resolution).
  - Detail Ghost-Mirror text editing architecture (`NodeTextEditor.tsx`).
  - Specify bounds, min/max dimensions, and copy/paste/duplicate dimension immutability.

- [ ] **Step 3: Write `docs/constitution/03-layout-engine.md`**
  - Detail `layoutSide` branch direction preservation in two-way layout.
  - Detail Top-Down / Tree / Org hierarchy coordinate rules in `hierarchyLayout.ts`.
  - Detail non-colliding placement constraints in `layoutUtils.ts`.

- [ ] **Step 4: Write `docs/constitution/04-persistence-data.md`**
  - Detail mandatory `sanitizeDocument` pre-save rule for Firestore and IndexedDB.
  - Detail offline-first persistence and timestamp-based conflict resolution.
  - Detail schema backward compatibility rules.

- [ ] **Step 5: Write `docs/constitution/05-verification-quality.md`**
  - Detail mandatory Windows execution syntax (`cmd.exe /c npm ...`).
  - Detail 3-phase verification gate: Tests (103+ Vitest), Oxlint, `tsc -b && vite build`.
  - Detail auto-commit and Firebase deployment requirements.

---

### Task 2: Upgrade Master Architecture Constitution (`CONSTITUTION.md`)

**Files:**
- Modify: `CONSTITUTION.md`

- [ ] **Step 1: Write comprehensive root `CONSTITUTION.md`**
  - Add project identity and core technical boundaries.
  - Enshrine the **Ten Golden Laws (Mười Điều Răn Cốt Lõi)** of Freeform Mind Map.
  - Index links to all 5 domain constitution documents in `docs/constitution/`.

---

### Task 3: Upgrade AI Operational Constitution (`AGENTS.md`)

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Write comprehensive `AGENTS.md`**
  - Prerequisite directive: Always consult `CONSTITUTION.md` and `docs/constitution/` before editing code.
  - Mandatory Windows shell syntax (`cmd.exe /c`).
  - Pre-completion verification gate (test, lint, build).
  - Automated Git push & Firebase deployment workflow.

---

### Task 4: Verification & Deployment

**Files:**
- Verify: Entire project workspace

- [ ] **Step 1: Run full Vitest suite**
  - Command: `cmd.exe /c npm test`
  - Expected: PASS all 103 tests.

- [ ] **Step 2: Run Oxlint**
  - Command: `cmd.exe /c npm run lint`
  - Expected: 0 warnings, 0 errors.

- [ ] **Step 3: Run production build**
  - Command: `cmd.exe /c npm run build`
  - Expected: Success.

- [ ] **Step 4: Execute Git Commit, Push & Firebase Deploy**
  - Command: `git add . ; git commit -m "docs: establish comprehensive codebase constitution and invariants" ; git push ; cmd.exe /c npm run build ; cmd.exe /c npx -p firebase-tools firebase deploy`

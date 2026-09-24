# Vibrant Creative Workshop Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the "Vibrant Creative Workshop" (FigJam / Miro style) visual redesign across the entire Mind Map application, keeping all functional components and layouts intact.

**Architecture:** Update central CSS design tokens in `src/styles/design-tokens.css` and `src/index.css`, then upgrade component-level styling in `Dashboard.tsx`, editor toolbars (`TopToolbar.tsx`, `BottomToolbar.tsx`, `FloatingToolbar.tsx`), modals (`ShareModal.tsx`), and pages (`Settings.tsx`, `SharePage.tsx`).

**Tech Stack:** React 19, TypeScript, ReactFlow (@xyflow/react), Lucide React, Vite, Firebase.

---

### Task 1: Design Tokens & Foundations (`src/styles/design-tokens.css` & `src/index.css`)

**Files:**
- Modify: `src/styles/design-tokens.css`
- Modify: `src/index.css`

- [ ] **Step 1: Update design tokens for Vibrant Creative Workshop in light & dark modes**
  - Add primary sunset orange gradient tokens: `--gradient-primary`, `--accent-glow`.
  - Add electric cyan secondary tokens: `--accent-secondary`, `--accent-secondary-border`.
  - Enhance border-radius tokens: `--radius-lg: 16px`, `--radius-xl: 20px`, `--radius-2xl: 24px`.
  - Configure ambient background glow for both `:root` (light) and `.dark` (dark).
  - Update node palette colors to vibrant, high-energy FigJam/Miro shades.

- [ ] **Step 2: Update `index.css` with global canvas transitions and micro-interaction classes**
  - Add smooth transitions on buttons, cards, and interactive docks.
  - Test with `npm run build`.

---

### Task 2: Redesign Dashboard Page & Template Preview Modal (`src/pages/Dashboard.tsx`)

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Upgrade Header, Status Badge & Quick Controls**
  - Replace plain user text with vibrant pill badge: `⚡ Workspace of {email}` with orange/cyan tint.
  - Update title to "Your Creative Studio" (bold 800 weight) and playful subtitle.
  - Style Theme toggle and Settings buttons with squircle bo-radius (14px) and soft hover shadows.

- [ ] **Step 2: Upgrade Primary Action Buttons**
  - Style "Start with Blank Canvas": Sunset Orange gradient, 💡 icon, soft orange drop shadow, bouncy hover (`translateY(-2px)`).
  - Style "Import Mind Map": Electric Cyan outline, 📂 icon, styled upload input.

- [ ] **Step 3: Upgrade Recent Maps & Empty State**
  - Style Recent Map cards: 18px bo-radius, vibrant icon container, title in crisp bold, relative time and node count badge.
  - Style Delete button with subtle red hover badge (`rgba(239, 68, 68, 0.12)`).
  - Enhance Empty State: Friendly dashed container with creative illustration/icon and inviting copy.

- [ ] **Step 4: Upgrade Available Templates Grid & Preview Modal**
  - Style Template cards: 20px bo-radius, dashed preview mini-canvas frame, vibrant colored category pill badges (Classic, Hierarchy, Brainstorming, etc.).
  - Style Template Preview Modal: 24px bo-radius, backdrop blur, sunset orange "Use Template" CTA.

- [ ] **Step 5: Verify dashboard build**
  - Run `npm run build`.

---

### Task 3: Upgrade Canvas Editor Toolbars & Controls (`src/editor/TopToolbar.tsx`, `BottomToolbar.tsx`, `FloatingToolbar.tsx`)

**Files:**
- Modify: `src/editor/TopToolbar.tsx`
- Modify: `src/editor/BottomToolbar.tsx`
- Modify: `src/canvas/FloatingToolbar.tsx`

- [ ] **Step 1: Refactor TopToolbar to floating creative pill dock**
  - Round corners (16px), soft shadow, vibrant pulsating sync dot for saving/saved/offline.
  - Document title input styled with rounded container and subtle focus ring.
  - Auto-layout and Export buttons styled with creative icons and color accents.

- [ ] **Step 2: Refactor BottomToolbar & FloatingToolbar**
  - Round dock corners, high-contrast active states for selected node colors and shape tools.

- [ ] **Step 3: Verify editor build**
  - Run `npm run build`.

---

### Task 4: Upgrade Modals & Pages (`src/editor/ShareModal.tsx`, `src/pages/Settings.tsx`, `src/pages/SharePage.tsx`)

**Files:**
- Modify: `src/editor/ShareModal.tsx`
- Modify: `src/pages/Settings.tsx`
- Modify: `src/pages/SharePage.tsx`

- [ ] **Step 1: Style ShareModal**
  - 20px bo-radius, vibrant permission toggle buttons (View/Edit), polished copy button.

- [ ] **Step 2: Style Settings Page**
  - Creative profile card, stylized inputs with colored focus rings, warm creative surfaces.

- [ ] **Step 3: Style SharePage**
  - Ambient creative background, matching floating header and controls.

- [ ] **Step 4: Verify full application build**
  - Run `npm run build`.

---

### Task 5: Verification, Git Push & Firebase Deploy

- [ ] **Step 1: Check git status and build status**
  - Run `npm run build`.
- [ ] **Step 2: Auto-commit and Push to GitHub**
  - `git add .`
  - `git commit -m "feat(ui): complete vibrant creative workshop redesign across dashboard and editor"`
  - `git push`
- [ ] **Step 3: Deploy to Firebase**
  - `cmd.exe /c npm run build ; cmd.exe /c npx -p firebase-tools firebase deploy`

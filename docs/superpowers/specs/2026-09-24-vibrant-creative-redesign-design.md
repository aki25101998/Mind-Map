# Design Spec: Vibrant Creative Workshop Redesign (FigJam / Miro Aesthetic)

- **Date:** 2026-09-24
- **Topic:** Complete visual overhaul of the Mind Map application to the "Vibrant Creative Workshop" design language.
- **Status:** Approved by User, Ready for Planning

---

## 1. Executive Summary & Goals

### 1.1 Objective
Transform the visual appearance and user experience of the Mind Map application from a plain, utilitarian layout into a vibrant, modern, and engaging "Creative Workshop" aesthetic inspired by FigJam and Miro.

### 1.2 Core Constraints
- **Preserve 100% of functional components, DOM structure, and layouts:**
  - Workspace header, theme toggles, settings links.
  - Quick action buttons ("Start with Blank Canvas", "Import Mind Map").
  - "Recent Maps" list / grid with opening, updating, and deletion behaviors.
  - "Available Templates" grid with live ReactFlow mini-canvas previews and preview modal.
  - Canvas editor canvas, nodes, edges, auto-layout, export, undo/redo, sync status, and sharing.
- **No changes to backend data schemas or Firestore persistence:** All document types, synchronization, and local storage mechanisms remain unaltered.
- **Support both Light and Dark modes seamlessly:** Vibrant creative themes must maintain adequate contrast, legibility, and visual harmony in both modes.

---

## 2. Design System & Tokens (`src/styles/design-tokens.css` & `src/index.css`)

### 2.1 Color Palette
- **Primary Creative Action (Sunset Orange):**
  - Gradient: `linear-gradient(135deg, #f97316 0%, #fb923c 100%)`
  - Glow/Shadow: `0 8px 24px -2px rgba(249, 115, 22, 0.35)`
  - Active/Hover: Subtle scale and enhanced glow.
- **Secondary Creative Action (Electric Cyan):**
  - Border: `2px solid #06b6d4` (Light: `#0284c7`)
  - Text & Accents: `#0284c7` (Light) / `#38bdf8` (Dark)
  - Glow: `0 4px 14px rgba(6, 182, 212, 0.25)`
- **Category & Semantic Accents:**
  - Strategy / Classic: Orange (`#ea580c` / `#f97316`)
  - Hierarchy / Organization: Emerald (`#10b981` / `#059669`)
  - Creative / Brainstorming: Purple / Violet (`#8b5cf6` / `#7c3aed`)
  - Concept / Flow: Cyan / Teal (`#06b6d4` / `#0d9488`)
  - Danger / Delete: Rose Red (`#ef4444`)

### 2.2 Backgrounds & Atmospheres
- **Dark Mode:**
  - Base: `#111827` (Deep slate)
  - Ambient glow background:
    ```css
    radial-gradient(circle at 10% 20%, rgba(249, 115, 22, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(6, 182, 212, 0.08) 0%, transparent 45%),
    #111827
    ```
  - Surface Panel: `#1f2937`
  - Panel Border: `1.5px solid #374151` (with colored border glow on hover)
- **Light Mode:**
  - Base: Warm creative canvas `#fffaf5`
  - Ambient glow background:
    ```css
    radial-gradient(circle at 10% 20%, rgba(249, 115, 22, 0.06) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(6, 182, 212, 0.06) 0%, transparent 45%),
    #fffaf5
    ```
  - Surface Panel: `#ffffff`
  - Panel Border: `1.5px solid #fed7aa` / `#e2e8f0`

### 2.3 Geometry & Radii
- Enhanced friendly curvatures:
  - `--radius-sm: 8px`
  - `--radius-md: 12px`
  - `--radius-lg: 16px`
  - `--radius-xl: 20px`
  - `--radius-2xl: 24px`
  - `--radius-pill: 9999px`

---

## 3. Component-by-Component Specifications

### 3.1 Dashboard (`src/pages/Dashboard.tsx`)
1. **Header Bar:**
   - User status badge: Pill with orange/cyan dot, subtle colored tint `rgba(249, 115, 22, 0.12)`, font-weight 600.
   - Title: "Your Creative Studio" with bold, clean typography (800 weight, letter-spacing -0.02em).
   - Subtitle: "Unleash your mind. Organize with colors and flow."
   - Quick action controls (Theme toggle & Settings button): Boasting friendly rounded squircle styling (`14px` border-radius), colored border, responsive hover effect.
2. **Action Buttons:**
   - "Start with Blank Canvas": Sunset orange gradient with 💡 icon, bouncy hover micro-interaction (`translateY(-2px)`).
   - "Import Mind Map": Cyan sketched outline with 📂 icon, styled file input trigger.
3. **Recent Maps Grid:**
   - Card styling: Bo rounded `18px`, 1.5px border with dynamic colored accent (orange/cyan alternating or based on node count), warm drop shadow.
   - Content: Document icon with soft badge background, title with bold contrast, updated relative timestamp, node count chip.
   - Delete action: Accessible trash icon with soft red hover badge (`rgba(239, 68, 68, 0.12)`).
   - Empty State: Large dashed border box (`18px` radius) with creative pencil/sparkle icon, inviting copywriting.
4. **Available Templates Grid & Modal:**
   - Template cards: Bo rounded `20px`, dashed mini-canvas boundary (`1.5px dashed #4b5563`), pill category tags with dedicated color mapping.
   - Preview Modal: Bo rounded `24px`, ambient backdrop blur (`backdrop-filter: blur(8px)`), vibrant "Use Template" CTA and clean "Cancel" secondary button.

### 3.2 Canvas Editor & Floating Docks (`src/editor/TopToolbar.tsx`, `BottomToolbar.tsx`, `FloatingToolbar.tsx`)
1. **Top Toolbar:**
   - Transformed into a sleek, floating pill-dock: `border-radius: 16px`, subtle vibrant border, soft shadow.
   - Document title input: Inline rounded bubble, highlight border when focused.
   - Sync status: Badge with vibrant green/yellow/red pulse dot.
   - Auto-Layout & Export buttons: Friendly icon + label with subtle color accents.
2. **Bottom & Floating Canvas Controls:**
   - Zoom controls, Minimap, and Node Palette: Styled as cohesive floating docks with high-contrast active states.

### 3.3 Supporting Pages & Modals (`ShareModal.tsx`, `Settings.tsx`, `SharePage.tsx`)
1. **Share Modal:**
   - Rounded corners (`20px`), vibrant permission toggle buttons (View/Edit) using cyan/orange highlights, styled copy-link button.
2. **Settings Page:**
   - Profile card with playful avatar container, stylized input fields with colored focus rings, and friendly rounded action buttons.
3. **Share Page (Public View):**
   - Matching ambient canvas atmosphere with clean floating toolbar and mode toggle.

---

## 4. Verification & Testing

1. **Visual Testing:**
   - Verify Light Mode and Dark Mode toggling across Dashboard, Editor, and Settings.
   - Verify hover and active states on all buttons and cards.
2. **Functional Integrity:**
   - Create a blank mind map from dashboard.
   - Import an existing mind map JSON file.
   - Open existing recent mind maps and delete one map.
   - Select and load a template from the template gallery.
   - Run Auto-Layout, Export PNG/SVG/JSON in the editor.
   - Open Share Modal and toggle permissions.
3. **Responsive Verification:**
   - Mobile and desktop viewport responsiveness for Dashboard grids.
4. **Build & Automated Deployment:**
   - Build succeeds: `npm run build` with zero TypeScript/lint errors.
   - Git commit & push.
   - Firebase deployment passes cleanly.

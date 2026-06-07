# Implementation Plan - Redesign Admin Portal to Cozy Light Theme

We will redesign the admin login page (`src/app/admin/page.tsx`), admin dashboard (`src/app/admin/dashboard/page.tsx`), and its components (modals like `ProductModal`, `ChangePasswordModal`, and custom switches, inputs, etc.) from their current dark theme styles (`bg-[#0D0D12]`, `glass-dark`, `text-white`, etc.) to match the light, warm, cozy aesthetic of the home page (cream background, pink, lavender, and soft dark text) using the `glass` class, signature backgrounds, and readable dark text (`text-[#2D2D2D]` or `text-foreground`).

## Milestones

1. **Planning & Setup**: Create plans and prepare the work directory.
2. **Implementation (Worker)**:
   - Redesign `src/app/admin/page.tsx` (Admin Login) to light theme.
   - Redesign `src/app/admin/dashboard/page.tsx` (Dashboard layout, Sidebar, Headers, StatCard, Badge, Fields, Switches, Modals, etc.) to light theme.
3. **Verification**: Run `npm run build` and `npm run test:e2e` to verify correct presentation, selector preservation, and behavior.

## Detailed Task Breakdown

### Task 1: Redesign Admin Login Page (`src/app/admin/page.tsx`)
- Background: Replace `bg-[#0D0D12]` with `bg-gradient-hero` (defined in globals.css).
- Card Container: Change `glass-dark` class to `glass` class. Remove/adjust the border line accent if needed or keep it light-themed.
- Text: Change all text from white/white-opacity (`text-white`, `text-white/40`, `text-white/20`, etc.) to dark foreground (`text-foreground` or `text-[#2D2D2D]`, and appropriate low-opacity variants like `text-foreground/40`).
- Input Fields: Change inputs from `bg-white/[0.03] border border-white/[0.08]` to solid white background (`bg-white`), and border `border-border` (`#F0E4DB`). Text inside inputs should be readable (`text-foreground`).
- Logo & Icon: Change icon container shadow or background if it has hardcoded dark/night theme styling, and adjust the title colors (`text-foreground` instead of `text-white`).
- Bottom Info / Footer: Back to store and other elements to use soft dark text.
- Maintain error animations, show/hide eye logic, inputs elements with `#admin-password` and `#admin-login-btn` unmodified.

### Task 2: Redesign Admin Dashboard Page (`src/app/admin/dashboard/page.tsx`)
- Main Layout Background: Replace `bg-[#0D0D12]` (line 670) and related dark backgrounds with `bg-[#FFF7F2]`.
- Sidebar & Header: Update sidebars to use the `glass` class or a semi-transparent white like `bg-white/80 border-r border-border` with dark text.
- Text colors: Change general text colors from white/gray-on-dark (`text-white`, `text-white/30`, etc.) to dark foreground (`text-foreground` / `text-[#2D2D2D]`).
- Stat Cards: Update `StatCard` to use `glass` (or `bg-white`) and dark text/accents.
- Badge: Maintain color schemes but adapt backgrounds/borders to look nice on light themes, or keep existing ones if appropriate.
- Inputs, Dropdowns, Selects: Update `inputCls` and `selectCls` to use solid white background (`bg-white`), border `border-border` (`#F0E4DB`), and dark text.
- Product Table/Rows: Update table container background to `bg-white/50 backdrop-blur-md` and rows to hover with light hover states instead of `hover:bg-white/[0.015]`.
- Modals (`ProductModal`, `ChangePasswordModal`): Update modal container cards from `glass-dark` to `glass` or `bg-white`, make tabs, fields, labels, inputs and buttons light-themed.
- Custom Switch: Update background for switch when inactive to a light border/bg instead of dark.
- Toast & Tooltips: Adapt toast alerts to light backgrounds or maintain readable states.

### Task 3: Verification
- Verify build compiles cleanly.
- Verify E2E tests run and pass without failures.

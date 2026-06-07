# Original User Request

## Initial Request — 2026-06-07T07:56:03+05:30

Redesign the admin login page and the admin dashboard to match the light, warm, cozy aesthetic of the home page (cream, pink, lavender, and soft dark text) instead of the current dark theme.

Working directory: c:\Users\sri charan\Documents\projects\crochett-and-co
Integrity mode: development

## Requirements

### R1. Transition Admin Login to Light Theme
- Change background from deep dark (`bg-[#0D0D12]`) to the home page's signature light gradient (`bg-gradient-hero`).
- Change the login card container from dark/transparent to the light-themed glassmorphic style (`glass` class in `globals.css`).
- Change all text colors to the dark, readable foreground (`text-[#2D2D2D]` / `text-foreground`).
- Change input fields from dark transparent to solid white, with border `border-border` (which is `#F0E4DB` in the CSS variables).
- Maintain all error messages, loading states, shake animation, and form functionality.

### R2. Transition Admin Dashboard to Light Theme
- Update the main layout background of the dashboard to `bg-[#FFF7F2]` or a soft light gradient.
- Redesign the sidebar and header to use the light-themed glassmorphic panel (`glass` class or a semi-transparent white like `bg-white/80` with a subtle border).
- Change all text from white/gray-on-dark to dark foreground (`text-foreground`).
- Redesign `StatCard`, table rows, inputs, select dropdowns, and buttons to use light-themed card backgrounds (`bg-white` or `glass`) and appropriate border colors.
- Maintain the brand gradient buttons (rose-pink / lavender) and appropriate color badges (e.g. green for in stock, red for out of stock).

### R3. Update Interactive Modals to Light Theme
- Redesign both `ProductModal` and `ChangePasswordModal` to have a light background (`bg-white` or a light-themed glassmorphism).
- Ensure input boxes, labels, and tabs within the modals use light-theme styling (dark text, light borders, white backgrounds).

### R4. Maintain Functional & E2E Test Integrity
- All existing functionalities (login check, product CRUD, state management, password changes, etc.) must remain unchanged.
- Ensure all test selectors (such as IDs like `#admin-password` and `#admin-login-btn`) and test structures remain preserved so the E2E test suite (`npm run test:e2e`) passes.

## Acceptance Criteria

### Aesthetic & Visual
- Both the admin login and dashboard pages look like the home page, utilizing the home page's theme: cream, pink, lavender, and soft dark text.
- No dark mode elements/backgrounds are used in the admin view.
- All inputs, buttons, tables, and cards look clean, elegant, and readable in the new light theme.

### Functional Verification
- Running `npm run build` succeeds without TypeScript/compilation errors.
- Running `npm run test:e2e` passes all E2E tests.

# Categories, Orders, and Analytics Dashboard Design Plan

This document outlines the detailed design and frontend implementation plan for the Categories, Orders, and Analytics tabs in the Crochett & Co Admin Dashboard (`src/app/admin/dashboard/page.tsx`).

---

## 1. Dashboard Structure & Navigation Analysis

### Current Layout (`src/app/admin/dashboard/page.tsx`)
- **State Management**: Uses state for `modal` type, search queries, active category/flag filters, and page numbers.
- **Sidebar**: Defined in `sidebarContent`. Renders navigation items using the `NavItem` component.
  - Currently, "Categories", "Orders", and "Analytics" nav items are set with the `disabled` property.
- **Header**: Contains the active tab title, item count, and an action button (e.g., "Add Product").
- **Main Area**: Includes:
  1. A grid of four `StatCard` components.
  2. Filter bar (search and dropdowns).
  3. Main grid/table displaying products list.
  4. Pagination footer controls.

---

## 2. Tab State Switching Plan

### State Definition
Introduce the active tab state in `AdminDashboard`:
```typescript
const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'orders' | 'analytics'>('products');
```

### Navigation Integration
Modify `sidebarContent` to bind tab switching triggers to `NavItem`:
```tsx
<NavItem 
  icon={<Package />} 
  label="Products" 
  active={activeTab === 'products'} 
  onClick={() => { setActiveTab('products'); setMobileMenuOpen(false); }} 
/>
<NavItem 
  icon={<Layers />} 
  label="Categories" 
  active={activeTab === 'categories'} 
  onClick={() => { setActiveTab('categories'); setMobileMenuOpen(false); }} 
/>
<NavItem 
  icon={<ShoppingBag />} 
  label="Orders" 
  active={activeTab === 'orders'} 
  onClick={() => { setActiveTab('orders'); setMobileMenuOpen(false); }} 
/>
<NavItem 
  icon={<TrendingUp />} 
  label="Analytics" 
  active={activeTab === 'analytics'} 
  onClick={() => { setActiveTab('analytics'); setMobileMenuOpen(false); }} 
/>
```

---

## 3. Categories Management CRUD Tab Plan

### Data Strategy
- **Zustand Store**: Fetch list via `GET /api/categories` on mount. Save to `useAdminStore` state (`categories`).
- **CRUD Operations**:
  - **Create**: `POST /api/categories`
  - **Update**: `PUT /api/categories/[id]`
  - **Delete**: `DELETE /api/categories/[id]`

### Tab Layout & UI Structure
- **Search Bar**: A search text input filtering local categories by name/description.
- **Add Button**: Displays "+ Add Category" next to the search bar or in the header when the Categories tab is active.
- **Category Grid**:
  - Render a grid of cards using category gradient styles (e.g., `bg-gradient-to-br from-rose-pink/10 to-lavender/10 border border-rose-pink/20`).
  - Render the emoji icon in a stylized round bubble.
  - Display Name, Slug, Description, and the number of products using the category (`productCount`).
  - Action buttons: "Edit" (pencil icon) and "Delete" (trash icon).

### Category Edit Modal / Drawer
A dedicated modal with:
- **Name**: Text input.
- **Slug**: Disabled text input auto-generated using `slugify(name)`.
- **Icon**: E.g., Text input for emoji or select picker of predetermined craft emojis (💐, 🌸, 🌷, 🌹, 🌻, 🔑, 🎁, etc.).
- **Description**: Textarea.
- **Gradient**: Dropdown picker or text input for Tailwind classes (e.g. `from-rose-pink/20 to-lavender/20`).

---

## 4. Orders Management Tab Plan

### Data Strategy
- **API Fetching**: Query `/api/orders` when switching to the orders tab or on mount.
- **Update**: `PUT /api/orders/[id]` with status payload.
- **Delete**: `DELETE /api/orders/[id]`.

### UI Components
- **Search**: Search input filtering orders by Customer Name, ID, or Email.
- **Status Filter**: Tab or button pills for quick filtering: `All`, `Pending`, `Shipped`, `Completed`, `Cancelled`.
- **Tracking List / Table**:
  - **Columns/Cards**: Order ID, Customer Details (Name, Email, Phone), Date/Time, Items List (names, quantity, individual prices), Total Amount.
  - **Status badges**:
    - `Pending`: Amber badge.
    - `Shipped`: Sky blue badge.
    - `Completed`: Emerald/green badge.
    - `Cancelled`: Red/gray badge.
- **Status Update Control**:
  - Inline select element (dropdown) to immediately change the status, triggering the `PUT` API endpoint.
- **Delete Action**: A trashcan button to purge the order, prompting a confirmation dialog beforehand.

---

## 5. Analytics Tab Plan

### KPI Overview Cards
Four summary cards positioned at the top of the analytics dashboard:
1. **Total Revenue**: Sum of `totalAmount` across all completed (or non-cancelled) orders.
2. **Average Order Value (AOV)**: `Total Revenue / Total Orders` (excluding cancelled).
3. **Total Orders**: Count of successful/placed orders.
4. **Active Customers**: Count of unique customer emails in the order records.

### Interactive SVG/CSS Visual Charts
1. **Monthly Sales & Revenue (Bar Chart)**:
   - Group orders by year-month (e.g., `2026-06`).
   - Draw an SVG grid containing vertical `<rect>` elements representing the sales volumes.
   - Tooltips on hover displaying the raw value (e.g., `₹45,200`).
2. **Top-Selling Categories (Horizontal Bar Chart)**:
   - Map orders items back to product categories.
   - Render horizontal flex containers with widths set dynamically via CSS (e.g., `style={{ width: '${percentage}%' }}`).
3. **Order Status Breakdown (Donut/Pie Chart)**:
   - An SVG `<circle>` chart using `strokeDasharray` and `strokeDashoffset` coordinates.
   - Color coded indicators representing the proportion of orders per status (Pending: Amber, Shipped: Blue, Completed: Green, Cancelled: Red).

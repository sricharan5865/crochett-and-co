# Original User Request

## Initial Request — 2026-06-07T08:18:38+05:30

Implement fully functional, beautiful, and professional Categories, Orders, and Analytics management panels in the admin dashboard, following the existing light-theme aesthetic.

Working directory: c:\Users\sri charan\Documents\projects\crochett-and-co
Integrity mode: development

## Proposed Changes

### 1. Database & APIs
- **Categories**:
  - Create `/api/categories/route.ts` supporting `GET` (list all categories) and `POST` (create new category).
  - Create `/api/categories/[id]/route.ts` supporting `PUT` (edit category) and `DELETE` (delete category).
- **Orders**:
  - Add `Order` interface to `src/lib/data/orders.ts` (fields: `id`, `customerName`, `customerEmail`, `customerPhone`, `items: {productId, productName, quantity, price}[]`, `status` ('pending' | 'shipped' | 'completed' | 'cancelled'), `totalAmount`, `date`).
  - Initialize a new JSON store: `src/lib/data/live_orders.json` with realistic mock order data.
  - Expose order database functions in `src/lib/db.ts` (`getOrders()`, `getOrderById(id)`, `saveOrder(order)`, `deleteOrder(id)`).
  - Create `/api/orders/route.ts` supporting `GET` and `POST`, and `/api/orders/[id]/route.ts` supporting `PUT` and `DELETE`.

### 2. Frontend User Interface
- Enable the **Categories**, **Orders**, and **Analytics** navigation items in the sidebar.
- Implement State-Based Tab Switching (`activeTab: 'products' | 'categories' | 'orders' | 'analytics'`).
- **Categories Tab**:
  - Add search bar & "Add Category" button.
  - Display a beautiful list/grid of categories featuring their gradients, icons, name, slug, description, and product count.
  - Implement a category editor modal/drawer to add/edit.
- **Orders Tab**:
  - Add search & status filter (All, Pending, Shipped, Completed, Cancelled).
  - Display a clean order tracking list containing date, customer name, total, status, and items.
  - Add an action button/dropdown/modal to update the status of any order (e.g., from 'pending' to 'shipped') or delete the order record.
- **Analytics Tab**:
  - Display interactive visual charts (using styled CSS/SVG bars/donuts) for monthly sales, revenue, top-selling categories, and order status breakdown.
  - Include key cards: total revenue, average order value, total orders, active customers.

## Verification & Testing
- **Production Build**: Verify by compiling the app (`npm run build`).
- **E2E Tests**: Verify all existing tests (`npm run test:e2e`) pass with no regressions.
- **Manual Verification**: Run tests on the UI interactions in the new tabs.

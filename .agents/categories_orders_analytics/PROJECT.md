# Project: Categories, Orders, and Analytics Panels

## Architecture
- **API Routes**:
  - `/api/categories/route.ts`: `GET`, `POST`
  - `/api/categories/[id]/route.ts`: `PUT`, `DELETE`
  - `/api/orders/route.ts`: `GET`, `POST`
  - `/api/orders/[id]/route.ts`: `PUT`, `DELETE`
- **Data Access Layer (`src/lib/db.ts`)**:
  - Added order interface and database CRUD functions for orders (`getOrders`, `getOrderById`, `saveOrder`, `deleteOrder`).
  - Fallback local database support in `src/lib/data/live_orders.json`.
- **Frontend Dashboard (`src/app/admin/dashboard/page.tsx`)**:
  - State-based Tab switching for `products`, `categories`, `orders`, and `analytics`.
  - Categories tab: CRUD UI.
  - Orders tab: List, filter, status update, and deletion UI.
  - Analytics tab: SVG/CSS interactive charts, summary cards.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | Database Layer & API Setup | Implement Live Orders JSON, Database Helper Functions in db.ts, Categories & Orders API endpoints | None | DONE |
| M2 | Frontend UI Layout & Tabs | Enable sidebar items, add state-based tab switching | M1 | PLANNED |
| M3 | Categories CRUD Interface | Add Categories grid, Search/Filter, Create/Edit/Delete drawer or modal | M2 | PLANNED |
| M4 | Orders Management Interface | Add Orders tracking list, search, status filters, update status and delete UI | M2 | PLANNED |
| M5 | Analytics Visualization | Add summary key cards, interactive charts (monthly sales, revenue, top-selling categories) using SVG/CSS | M2 | PLANNED |
| M6 | E2E Testing & Audit | Verify build with `npm run build`, and E2E test compliance with `npm run test:e2e` and Forensic Auditor | M1, M2, M3, M4, M5 | PLANNED |

## Code Layout
- `src/lib/data/orders.ts` - Orders interfaces
- `src/lib/data/live_orders.json` - Local database file for live orders
- `src/lib/db.ts` - Database CRUD API integration
- `src/app/api/categories/route.ts` - Categories API
- `src/app/api/categories/[id]/route.ts` - Category detail API
- `src/app/api/orders/route.ts` - Orders API
- `src/app/api/orders/[id]/route.ts` - Order detail API
- `src/app/admin/dashboard/page.tsx` - Admin dashboard updates

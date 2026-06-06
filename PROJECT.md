# Project: Crochett & Co Admin Portal

## Architecture
The Crochett & Co Admin Portal will consist of:
1. **Data Access Layer (`src/lib/db.ts`)**: A unified API for reading/writing products, categories, and admin configuration.
   - Dual-mode: Firebase (if configured via env vars) or Local Fallback (using a local JSON file `src/lib/data/live_products.json` and `src/lib/data/live_categories.json`).
   - Dynamic caching/state propagation to ensure public-facing pages reflect updates instantly.
2. **Admin Portal Routes (`src/app/admin/`)**:
   - `/admin/login`: Secure authentication screen.
   - `/admin/dashboard`: CRUD operations for products and categories, and password change utility.
3. **Authentication Layer (`src/lib/auth.ts`)**:
   - Cookie-based session or JWT authentication for `/admin` subroutes.
   - Password hashing/verification logic.
4. **Dynamic Rendering**:
   - Marking storefront pages (home, shop, categories, product details) to dynamically fetch data from the data access layer.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | E2E Test Suite | Build opaque-box E2E test infra, write Tier 1-4 tests, publish `TEST_READY.md` | None | IN_PROGRESS (1389ab46-2d2f-4047-af43-1879d5e4102e) |
| M2 | Database Layer & Fallback | Set up the unified data layer with Firebase integration and local JSON fallback | None | IN_PROGRESS (0c2cf5ff-42c9-450d-b23d-a65725178039) |
| M3 | Admin Authentication | Add login screen, default credentials, session management, password editing | M2 | PLANNED |
| M4 | Content & Product CRUD | Build admin dashboard and forms to add, edit, and delete products | M3 | PLANNED |
| M5 | Storefront Integration | Connect home, shop, categories, wishlist, cart, product detail pages to live data | M4 | PLANNED |
| M6 | E2E Test Pass (Phase 1) | Pass 100% of E2E tests (Tiers 1-4) | M1, M5 | PLANNED |
| M7 | Adversarial Hardening (Phase 2)| Challenger-led Tier 5 testing and white-box coverage hardening | M6 | PLANNED |

## Interface Contracts
### Data Access Layer (`src/lib/db.ts`)
- `getProducts(): Promise<Product[]>`
- `getProductBySlug(slug: string): Promise<Product | undefined>`
- `getCategoryBySlug(slug: string): Promise<Category | undefined>`
- `saveProduct(product: Product): Promise<void>`
- `deleteProduct(id: string): Promise<void>`
- `getAdminPasswordHash(): Promise<string>`
- `saveAdminPasswordHash(hash: string): Promise<void>`

### Authentication Layer (`src/lib/auth.ts`)
- `verifyPassword(password: string): Promise<boolean>`
- `updatePassword(newPassword: string): Promise<boolean>`
- `isAuthenticated(req: NextRequest): Promise<boolean>`

## Code Layout
- `src/lib/db.ts` — Database operations (Firebase / JSON fallback)
- `src/lib/auth.ts` — Authentication utilities
- `src/app/admin/` — Admin portal pages and login route
- `src/app/api/` — API routes for products, config, and auth check
- `src/lib/data/live_products.json` — Local fallback JSON database for products
- `src/lib/data/live_categories.json` — Local fallback JSON database for categories
- `src/lib/data/admin_config.json` — Local fallback JSON for admin settings (including hashed password)

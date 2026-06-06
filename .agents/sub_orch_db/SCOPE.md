# Scope: Milestone M2 — Database Layer & Fallback

## Architecture
- **Data Access Layer (`src/lib/db.ts`)**: Defines unified functions for fetching/saving products, categories, and admin configuration.
- **Dual-Mode Operation**:
  - Mode A (Firebase): Active when environment variables (`NEXT_PUBLIC_FIREBASE_API_KEY`, etc.) are defined.
  - Mode B (Local Fallback): Reads/writes to local JSON files under `src/lib/data/` if Firebase isn't configured.
- **Data Files**:
  - `src/lib/data/live_products.json`
  - `src/lib/data/live_categories.json`
  - `src/lib/data/admin_config.json` (stores admin password hash)
- **State Integration**: Dynamic caching/global state propagation so that updates in the admin dashboard immediately sync/propagate to frontend storefront views (home, shop, categories, etc.).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Explore | Investigate codebase structure and select appropriate Firebase npm packages | None | DONE |
| 2 | Fallback Data | Pre-populate live_products.json, live_categories.json, and admin_config.json with default data and password hash | None | DONE |
| 3 | Core Implementation | Implement src/lib/db.ts interface contracts and dual-mode database behavior | M2 | DONE |
| 4 | Verification & Build | Verify build compiles, and verify the caching/state propagation mechanism | M3 | IN_PROGRESS (Reviewer 1/2) |
| 5 | Integrity Audit | Perform Forensic Integrity Audit for development mode | M4 | IN_PROGRESS (Auditor) |

## Interface Contracts
### Data Access Layer (`src/lib/db.ts`)
- `getProducts(): Promise<Product[]>`
- `getProductBySlug(slug: string): Promise<Product | undefined>`
- `getCategoryBySlug(slug: string): Promise<Category | undefined>`
- `saveProduct(product: Product): Promise<void>`
- `deleteProduct(id: string): Promise<void>`
- `getAdminPasswordHash(): Promise<string>`
- `saveAdminPasswordHash(hash: string): Promise<void>`

*(Note: categories are usually read-only or read/write if the admin wants. We should also add category retrieval helper if needed, but we follow the exact functions specified in PROJECT.md).*
- `getCategories(): Promise<Category[]>` (It will be needed by shop and categories pages, though not explicitly in the contract, let's keep that in mind or define it if required by code layout.)

## Code Layout
- `src/lib/db.ts`
- `src/lib/data/live_products.json`
- `src/lib/data/live_categories.json`
- `src/lib/data/admin_config.json`

# Handoff Report — Explorer DB

## 1. Observation
- **Direct Codebase Check**:
  - `src/lib/db.ts` exposes unified database helper methods using `dbInstance` dispatcher which runs in dual mode: `FirebaseDatabase` when Firebase environment variables are configured and `JsonDatabase` as local fallback using file reads and writes (via `JsonDbFile`).
  - Lines 21-25 of `src/lib/db.ts` defines `getCategories()`, `getCategoryById()`, `getCategoryBySlug()`, `saveCategory()`, and `deleteCategory()` under the `IDatabase` interface:
    ```typescript
    // Categories
    getCategories(): Promise<Category[]>;
    getCategoryById(id: string): Promise<Category | undefined>;
    getCategoryBySlug(slug: string): Promise<Category | undefined>;
    saveCategory(category: Category): Promise<void>;
    deleteCategory(id: string): Promise<void>;
    ```
  - Both `JsonDatabase` and `FirebaseDatabase` already implement these category CRUD methods fully, reading from `src/lib/data/live_categories.json` and Firestore collection `'categories'` respectively.
  - No database interface, cache layer, or handler currently exists for `Orders` in `src/lib/db.ts` or `src/lib/data/`.
  - API endpoints reside in `src/app/api/` (e.g., `src/app/api/products/route.ts` and `src/app/api/products/[id]/route.ts`).
  - The E2E tests (`e2e-tests/suites/tier1_feature.js` and `e2e-tests/suites/tier2_boundary.js`) assert standard CRUD behaviors (e.g. invalid inputs, duplicate slugs, negative prices, missing authorization) returning HTTP status codes such as 400, 401, 404, 409, and 500.

## 2. Logic Chain
- **Database CRUD**: To align `Orders` CRUD operations with the existing `Products` and `Categories` paradigm, we must expose `getOrders`, `getOrderById`, `saveOrder`, and `deleteOrder` under `IDatabase` and cache them in the in-memory global cache (`DbCache.orders`) to minimize database reads.
- **Mock Data and Schema**: An `Order` interface defined in `src/lib/data/orders.ts` and mock order array stored in `src/lib/data/live_orders.json` will replicate the local JSON store mechanism utilized by products and categories.
- **API Endpoints Authentication**: Because orders contain customer-identifying information, fetching orders (`GET`) and modifying orders (`PUT`/`DELETE`) must check `isAuthenticated(req)` returning `401 Unauthorized` on failure, mimicking the pattern in `src/app/api/products/route.ts` line 17. Creating orders (`POST`), however, should be public so storefront users can checkout.
- **Input Validation**: Similar to product validations (e.g. negative price checks in `src/app/api/products/route.ts` line 30), order inputs must validate negative values for item price and non-positive counts for item quantity.

## 3. Caveats
- No actual database modifications have been performed in this step as it is a read-only investigation.
- The plan assumes checkout is handled on a public endpoint `/api/orders` (unauthenticated POST), but actual deployment details could introduce stripe/payment gateway webhooks which might require alternative authentication or validation signatures.

## 4. Conclusion
- The blueprint to integrate Categories and Orders database layers, schema mock data, and API routes has been fully mapped out and documented in `findings.md`. 
- The implementation is completely actionable and maps structurally to the layout conventions already present in the codebase.

## 5. Verification Method
- **File Inspections**: Inspect `findings.md` to confirm the planned schema, interface extensions, and API mappings are correct and comply with the project standards.
- **Local Testing command**: Once implemented, run E2E suites:
  ```powershell
  npm run test:e2e
  ```
- **Production Build validation**: Run:
  ```powershell
  npm run build
  ```

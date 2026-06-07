# Handoff Report — Explorer 3

## 1. Observation
We have observed the following files and structural configurations:

1. **Database Interface Contracts in `PROJECT.md`** (lines 28-36):
   ```
   28: ## Interface Contracts
   29: ### Data Access Layer (`src/lib/db.ts`)
   30: - `getProducts(): Promise<Product[]>`
   31: - `getProductBySlug(slug: string): Promise<Product | undefined>`
   32: - `getCategoryBySlug(slug: string): Promise<Category | undefined>`
   33: - `saveProduct(product: Product): Promise<void>`
   34: - `deleteProduct(id: string): Promise<void>`
   35: - `getAdminPasswordHash(): Promise<string>`
   36: - `saveAdminPasswordHash(hash: string): Promise<void>`
   ```

2. **Static Imports in Storefront Components**:
   - `src/app/categories/page.tsx` line 3: `import { categories } from "@/lib/data/categories";`
   - `src/app/shop/page.tsx` lines 6-8: 
     ```typescript
     import { products } from "@/lib/data/products";
     import { categories } from "@/lib/data/categories";
     import { occasions } from "@/lib/data/categories";
     ```
   - `src/app/categories/[slug]/page.tsx` lines 4-5:
     ```typescript
     import { categories, getCategoryBySlug } from "@/lib/data/categories";
     import { getProductsByCategory } from "@/lib/data/products";
     ```

3. **Current Type Definitions**:
   - `Product` is defined in `src/lib/data/products.ts` (lines 1-22) and contains fields like `id`, `name`, `slug`, `price`, `category`, and `occasion`.
   - `Category` is defined in `src/lib/data/categories.ts` (lines 1-9) and contains fields like `id`, `name`, `slug`, `icon`, `gradient`.

---

## 2. Logic Chain
1. **Category Management and Storefront Requirements**:
   - Since `PROJECT.md` specifies that the admin dashboard must support CRUD operations for both products and categories, and storefront routes need to dynamically read categories to show listings (as seen in `src/app/categories/page.tsx`), the database contract is currently missing necessary methods.
   - Specifically, we need to be able to fetch all categories (`getCategories()`), get a category by ID for edit forms (`getCategoryById()`), save a category (`saveCategory()`), and delete a category (`deleteCategory()`).
   - We also need to fetch a single product by ID (`getProductById()`) for product editing forms in the admin dashboard.

2. **Concurrency-Safe Local Fallback**:
   - Because Next.js server actions and API handlers run concurrently in Node.js, multiple requests can execute reads and writes to `live_products.json`, `live_categories.json`, and `admin_config.json` at the same time.
   - If two write requests execute concurrently without isolation, it causes **race conditions** where one update overwrites another.
   - If a read happens during a write, or if a write is interrupted, it causes **partial file writes / JSON corruption**.
   - To prevent race conditions, we must serialize reads and writes within the Node.js process using a promise-based memory queue (mutex) for each file.
   - To prevent file corruption, we must perform atomic file updates by writing to a temporary file (`.json.tmp-...`) and then renaming it to the target file (`fs.rename`), which is an atomic OS operation.

3. **Dual-Mode Dispatching**:
   - By creating a common interface `IDatabase` and two implementations (`JsonDatabase` and `FirebaseDatabase`), `src/lib/db.ts` can dynamically instantiate the appropriate class depending on whether the Firebase environment variables are defined.

---

## 3. Caveats
- **Firebase Configuration**: This report does not cover the selection of specific Firebase SDK packages or env keys, which are being investigated by Explorer 2.
- **Password Hashing**: The exact password hashing algorithm and default salt configuration are left to Explorer 2 to detail.
- **Scale / Cloud Deployment**: The in-memory mutex only ensures concurrency safety within a single Node.js process. It is not distributed. If the application is scaled horizontally across multiple instances (e.g. Serverless/Vercel) without Firebase, local JSON files will not sync. In such environments, Firebase must be configured and used.

---

## 4. Conclusion
We recommend:
1. Expanding the `src/lib/db.ts` contract to include category CRUD methods (`getCategories`, `getCategoryById`, `saveCategory`, `deleteCategory`) and product-by-ID fetching (`getProductById`).
2. Implementing an abstract `IDatabase` interface in `src/lib/db.ts` that delegates requests dynamically based on the presence of Firebase environment variables.
3. Using the `JsonDbFile` helper class that implements a memory-based mutex (promise queue) and atomic writes (temporary file + rename) for the local JSON fallback mode.

---

## 5. Verification Method
1. **Compilation Check**: After implementation, verify that the code compiles successfully by running:
   ```powershell
   npm run build
   ```
2. **Concurrency Integration Test**: Verify concurrency safety by writing a simple script that calls `saveProduct()` 100 times concurrently (using `Promise.all`), then verify that:
   - No file corruption occurs (JSON parses successfully).
   - All 100 operations complete successfully.
   - The final product list contains the expected records.

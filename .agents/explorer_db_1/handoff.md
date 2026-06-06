# Handoff Report — Explorer 1

This handoff outlines the database strategy investigation findings and implementation suggestions for Milestone M2.

## 1. Observation
We conducted a read-only codebase audit and observed the following:
* **Package Dependencies (`package.json`):** No database dependencies exist in the manifest. Line 11-25 contains:
  ```json
  "dependencies": {
    "@base-ui/react": "^1.5.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.17.0",
    "motion": "^12.40.0",
    "next": "16.2.7",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "shadcn": "^4.10.0",
    "tailwind-merge": "^3.6.0",
    "three": "^0.184.0",
    "tw-animate-css": "^1.4.0",
    "zustand": "^5.0.14"
  }
  ```
* **Mock Data Structure (`src/lib/data/products.ts` and `src/lib/data/categories.ts`):** These files export raw arrays of typed interface data (e.g. `export const products: Product[]`) and synchronous filter utilities.
* **Storefront Access Patterns:**
  * `src/app/shop/page.tsx` is a Client Component (Line 1: `"use client";`) and imports mock data synchronously:
    ```typescript
    import { products } from "@/lib/data/products";
    import { categories } from "@/lib/data/categories";
    ```
  * `src/app/categories/page.tsx` is a Server Component (Line 17) using sync filters inside mapping functions:
    ```typescript
    const actualCount = getProductsByCategory(category.slug).length;
    ```
  * `src/app/shop/[slug]/page.tsx` and `src/app/categories/[slug]/page.tsx` are Server Components utilizing synchronous data imports to generate static paths (`generateStaticParams()`) and metadata.

## 2. Logic Chain
1. Since the storefront needs to support Firebase Firestore, we need a standard driver. The official `firebase` client SDK works across both Next.js Client and Server Components, making it the ideal single package dependency.
2. Because the current mock data is fetched synchronously but Firestore is asynchronous, any direct migration of imports will break page rendering and static generation.
3. Therefore, we must abstract data retrieval into a dual-mode service (`src/lib/db.ts`) that matches the existing helper function signatures but returns `Promise<T>`.
4. If catalog pages query Firestore directly on render or Client Components query Firestore in realtime (`onSnapshot`), read costs will scale with user traffic and SEO will be degraded.
5. Thus, we conclude that the optimal architecture is a **Server-Seeded Hybrid model** using Next.js ISR (Incremental Static Regeneration) for SEO and static page caching, with client-side SWR/State initialized with server-fetched fallback data for dynamic filtering.

## 3. Caveats
* We assume Firestore security rules will be configured to allow read operations publicly on `products` and `categories`.
* Writing operations (like saving a custom order or sending contact inquiries) have not been fully specified here but can easily be handled using standard Firestore collection adds via Server Actions or Route Handlers.
* Full-text search on Firestore is limited natively. Our recommendation uses in-memory filtering for the small product catalog to avoid paying for external indexing services (like Algolia/Elasticsearch).

## 4. Conclusion
* Create `src/lib/db.ts` to implement the dual-mode data layer driven by `NEXT_PUBLIC_DB_MODE`.
* Install the `firebase` package and configure the env variables in `.env.local`.
* Restructure storefront routes to make pages asynchronous Server Components that fetch initial data and pass it to Client views to preserve SEO and load speed.

## 5. Verification Method
1. **Mode Switch Verification:** When `NEXT_PUBLIC_DB_MODE` is set to `local`, verify the site runs identically to the current mock data state.
2. **Seeding Validation:** Run the proposed seed script (`npx tsx src/scripts/seed-firestore.ts`) and confirm documents are created in Firestore.
3. **Firestore Mode Verification:** Change `NEXT_PUBLIC_DB_MODE` to `firebase`. Inspect network requests or insert a test product in Firestore. Verify the new product appears on the shop page after revalidation/refresh.
4. **Compile Test:** Run `npm run build` or `next build` to ensure all static routes generate correctly with the new async parameters.

# Database Design Strategy and Codebase Audit for Milestone M2

## Executive Summary
This report analyzes the requirements for integrating a dual-mode database access layer supporting both **Firebase Firestore** and **Local Fallback JSON** for *Crochett & Co*. By auditing the existing codebase, we found that all storefront routes currently retrieve mock data synchronously. To migrate smoothly without sacrificing performance or SEO, we propose:
1. Installing the official `firebase` client SDK.
2. Abstracting all data access patterns into `src/lib/db.ts` with matching asynchronous signatures.
3. Structuring storefront pages with a **Hybrid Server-Seeded Model** (Server Components fetch initial data and pass it to Client Components for interactive filtering).
4. Leveraging **Next.js Incremental Static Regeneration (ISR)** for high-speed edge caching, with **SWR** for immediate background revalidation.

---

## 1. Package Dependencies Analysis
An audit of `package.json` reveals **no existing database dependencies** (such as `firebase`, `firebase-admin`, `@google-cloud/firestore`, or database clients). 

### Recommendation
* **Primary Dependency:** Install `firebase` (client-side Web SDK):
  ```bash
  npm install firebase
  ```
* **Rationale:** The standard `firebase` package works in both browser (Client Components) and Node.js environments (Server Components, Route Handlers, Server Actions). For a read-heavy storefront, using the web SDK keeps configuration unified and avoids the heavier Node-only wrapper libraries like `firebase-admin`.
* **Required Environment Variables:**
  Create `.env.local` containing:
  ```env
  NEXT_PUBLIC_DB_MODE=local   # Toggle between 'local' and 'firebase'
  NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
  NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
  ```

---

## 2. Storefront Routes and Mock Data Audit
We inspected the existing routes to determine how they import mock data and how their React tree is structured:

| Route / Component | Type | Imports / Usage | Migration Impact |
|---|---|---|---|
| `src/app/page.tsx` | **Server** | Renders subcomponents. Does not fetch data directly. | Low impact; page remains static. |
| `src/components/home/featured-products.tsx` | **Client** | `import { getFeaturedProducts }` from `@/lib/data/products`. Calls it synchronously on render. | High impact; needs to be refactored into a Server Component wrapper that fetches data asynchronously and passes it to a Client Carousel component. |
| `src/components/home/shop-by-occasion.tsx` | **Client** | `import { occasions }` from `@/lib/data/categories`. Iterates directly on the array. | Medium impact; can be seeded via Server Component parent or load from a static local constant. |
| `src/app/shop/page.tsx` | **Client** | `import { products }`, `categories`, and `occasions`. Performs complex client-side search/filtering. | High impact; should be split into a parent Server Component that fetches initial data asynchronously, and passes it to the client view wrapper. |
| `src/app/categories/page.tsx` | **Server** | `import { categories }` and `getProductsByCategory` to count products per category. | Medium impact; needs to use `await getCategories()`. Product counting should be done in-memory to avoid N+1 queries. |
| `src/app/shop/[slug]/page.tsx` | **Server** | `import { getProductBySlug }` and `products` for metadata, static paths, and details. | High impact; `generateStaticParams()` and the page body must become asynchronous. |
| `src/app/categories/[slug]/page.tsx` | **Server** | `import { categories }` and `getProductsByCategory` for metadata, static paths, and lists. | High impact; `generateStaticParams()` and page body must become asynchronous. |

### Structural Challenge: Sync to Async Transition
Because mock data imports are currently synchronous, rewriting pages to fetch directly from a Firestore database would block client renders. We must rewrite data retrievals to return `Promise<T>` and refactor page trees accordingly.

---

## 3. Dual-Mode Data Access Layer (`src/lib/db.ts`)
To support seamless switching between Firebase Firestore and local mock data, we recommend creating a unified data access layer `src/lib/db.ts`. 

### Proposed Firestore Collections Design
* `products`: Documents keyed by product ID (or slug). Scheme matches `Product` interface.
* `categories`: Documents keyed by category slug. Scheme matches `Category` interface.
* `occasions`: Documents keyed by occasion slug. Scheme matches `Occasion` interface.

### Code Sketch for `src/lib/db.ts`
```typescript
import { products as mockProducts, Product } from "./data/products";
import { categories as mockCategories, Category, occasions as mockOccasions, Occasion } from "./data/categories";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";

const isFirebase = process.env.NEXT_PUBLIC_DB_MODE === "firebase";

// Firebase App initialization (safe for both Client & Server)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = isFirebase ? getFirestore(app) : null;

// ==========================================
// PRODUCTS ACCESS
// ==========================================

export async function getProducts(): Promise<Product[]> {
  if (isFirebase && db) {
    const colRef = collection(db, "products");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  }
  return mockProducts;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (isFirebase && db) {
    const colRef = collection(db, "products");
    const q = query(colRef, where("slug", "==", slug));
    const snap = await getDocs(q);
    if (snap.empty) return undefined;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Product;
  }
  return mockProducts.find(p => p.slug === slug);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  if (isFirebase && db) {
    const colRef = collection(db, "products");
    const q = query(colRef, where("category", "==", categorySlug));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  }
  return mockProducts.filter(p => p.category === categorySlug);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (isFirebase && db) {
    const colRef = collection(db, "products");
    const q = query(colRef, where("isFeatured", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  }
  return mockProducts.filter(p => p.isFeatured);
}

export async function getBestsellers(): Promise<Product[]> {
  if (isFirebase && db) {
    const colRef = collection(db, "products");
    const q = query(colRef, where("isBestseller", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  }
  return mockProducts.filter(p => p.isBestseller);
}

export async function getTrendingProducts(): Promise<Product[]> {
  if (isFirebase && db) {
    const colRef = collection(db, "products");
    const q = query(colRef, where("isTrending", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  }
  return mockProducts.filter(p => p.isTrending);
}

export async function getNewProducts(): Promise<Product[]> {
  if (isFirebase && db) {
    const colRef = collection(db, "products");
    const q = query(colRef, where("isNew", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  }
  return mockProducts.filter(p => p.isNew);
}

export async function getProductsByOccasion(occasion: string): Promise<Product[]> {
  if (isFirebase && db) {
    const colRef = collection(db, "products");
    const q = query(colRef, where("occasion", "array-contains", occasion));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  }
  return mockProducts.filter(p => p.occasion.includes(occasion));
}

export async function searchProducts(queryStr: string): Promise<Product[]> {
  if (isFirebase && db) {
    // Small catalog size optimization: fetch all and filter in memory to avoid costly search index setup
    const all = await getProducts();
    const lower = queryStr.toLowerCase();
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower) ||
        p.tags.some((t) => t.toLowerCase().includes(lower))
    );
  }
  const lower = queryStr.toLowerCase();
  return mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower) ||
      p.tags.some((t) => t.toLowerCase().includes(lower))
  );
}

// ==========================================
// CATEGORIES ACCESS
// ==========================================

export async function getCategories(): Promise<Category[]> {
  if (isFirebase && db) {
    const colRef = collection(db, "categories");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
  }
  return mockCategories;
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  if (isFirebase && db) {
    const colRef = collection(db, "categories");
    const q = query(colRef, where("slug", "==", slug));
    const snap = await getDocs(q);
    if (snap.empty) return undefined;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Category;
  }
  return mockCategories.find(c => c.slug === slug);
}

// ==========================================
// OCCASIONS ACCESS
// ==========================================

export async function getOccasions(): Promise<Occasion[]> {
  if (isFirebase && db) {
    const colRef = collection(db, "occasions");
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Occasion));
  }
  return mockOccasions;
}

export async function getOccasionBySlug(slug: string): Promise<Occasion | undefined> {
  if (isFirebase && db) {
    const colRef = collection(db, "occasions");
    const q = query(colRef, where("slug", "==", slug));
    const snap = await getDocs(q);
    if (snap.empty) return undefined;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Occasion;
  }
  return mockOccasions.find(o => o.slug === slug);
}
```

---

## 4. Database Seeding Script Recommendation
To bootstrap the Firestore database effortlessly, the implementer can use a simple script. Placing it in `src/scripts/seed-firestore.ts` enables instant migration:

```typescript
import { products } from "../lib/data/products";
import { categories, occasions } from "../lib/data/categories";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("Starting seeding process...");

  // Seed Products
  for (const product of products) {
    await setDoc(doc(db, "products", product.id), product);
    console.log(`Seeded Product: ${product.name}`);
  }

  // Seed Categories
  for (const category of categories) {
    await setDoc(doc(db, "categories", category.id), category);
    console.log(`Seeded Category: ${category.name}`);
  }

  // Seed Occasions
  for (const occasion of occasions) {
    await setDoc(doc(db, "occasions", occasion.id), occasion);
    console.log(`Seeded Occasion: ${occasion.name}`);
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
```
*(Run via `npx tsx src/scripts/seed-firestore.ts`)*

---

## 5. UI Revalidation and Storefront Update Strategy
We analyzed how to ensure updates on the database are immediately and efficiently visible on the public storefront.

### Comparison of Approaches

| Approach | SEO Performance | Client Interactivity | Read Load (Firestore Costs) | Recommendation Rating |
|---|---|---|---|---|
| **1. Next.js ISR (Incremental Static Regeneration)** | **Excellent** | Medium | **Very Low** | **Highly Recommended** (Default Strategy) |
| **2. SWR (Stale-While-Revalidate)** | Good (when seeded) | **Excellent** | Medium | **Recommended** (For Interactive Pages) |
| **3. Zustand Global Cache** | None | Good | Low | Not recommended for dynamic catalog. |
| **4. Firestore `onSnapshot` (Realtime)** | None | **Excellent** | **Very High** | Not recommended for public catalog due to cost. |

### Suggested Hybrid Implementation Plan
We recommend a **Server-Seeded Hybrid SWR / ISR model**:
1. **Catalog & Static Pages:** Utilize **Next.js Server Components** to fetch initial lists from `db.ts` during server-rendering. Use Next.js dynamic routing with **ISR** to cache the pages at the edge. 
   - Define a revalidation duration (e.g., `export const revalidate = 60;` or `3600` on shop and category routes).
   - Alternatively, use **on-demand revalidation** via Server Actions / Webhooks: `revalidatePath('/shop')` or `revalidatePath('/categories')` when content is modified in an admin panel.
2. **Dynamic Shop Filtering:**
   - Keep `src/app/shop/page.tsx` as a Server Component.
   - Fetch initial products, categories, and occasions on the server.
   - Pass these into a client component wrapper (e.g., `ShopClientView`), seeding the local filter state.
   - Use `SWR` with the server-rendered results as `fallbackData` to instantly display products to the user and crawlable bots (for SEO), while checking Firestore in the background for any immediate changes.
   ```typescript
   // Example SWR Hook in Client Component
   const { data: products } = useSWR('products-list', getProducts, {
     fallbackData: initialProducts, // Loaded from Server Component SSR
     revalidateOnFocus: false,      // Prevent unnecessary loads
   });
   ```

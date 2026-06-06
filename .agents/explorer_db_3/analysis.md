# Database Design Strategy & Implementation Plan (Milestone M2)

## Executive Summary
This report analyzes the database access contracts for Milestone M2 of the Crochett & Co Admin Portal. We evaluate the required database interfaces from `PROJECT.md`, identify necessary helper methods, and propose a clean, dual-mode data access layer for `src/lib/db.ts`. 

To support local development and serverless deployment fallbacks, we propose a concurrency-safe local JSON database design that uses an **in-memory serialized queue (mutex)** to prevent race conditions and **atomic writes (temporary file + rename)** to prevent data corruption.

---

## 1. Analysis of Interface Contracts

### 1.1 Evaluated Contracts (from `PROJECT.md`)
The core interface contracts specified in `PROJECT.md` are:
- `getProducts(): Promise<Product[]>`
- `getProductBySlug(slug: string): Promise<Product | undefined>`
- `getCategoryBySlug(slug: string): Promise<Category | undefined>`
- `saveProduct(product: Product): Promise<void>`
- `deleteProduct(id: string): Promise<void>`
- `getAdminPasswordHash(): Promise<string>`
- `saveAdminPasswordHash(hash: string): Promise<void>`

### 1.2 Proposed Additional Interfaces & Helper Methods
Based on our review of the storefront routes (such as `src/app/categories/page.tsx` and `src/app/shop/page.tsx`), the following additions are recommended for a robust implementation:

| Recommended Method | Purpose / Justification |
| :--- | :--- |
| **`getCategories(): Promise<Category[]>`** | Required by the storefront categories page and shop page filters to render the active list of categories. |
| **`getProductById(id: string): Promise<Product \| undefined>`** | Essential for admin editing forms (e.g. `/admin/products/edit/[id]`) to load product data by ID rather than slug (since slugs can change). |
| **`getCategoryById(id: string): Promise<Category \| undefined>`** | Similar to `getProductById`, needed to edit categories in the admin dashboard. |
| **`saveCategory(category: Category): Promise<void>`** | Required by the admin portal dashboard for Category CRUD operations (add and edit). |
| **`deleteCategory(id: string): Promise<void>`** | Required by the admin portal dashboard to delete categories. |
| **`getOccasions(): Promise<Occasion[]>`** | Recommended to allow dynamic loading of occasions in `ShopByOccasion` and shop filters, making occasions editable/database-driven in the future. |
| **`getOccasionBySlug(slug: string): Promise<Occasion \| undefined>`** | Resolves occasion details for filtered storefront queries. |

---

## 2. Concurrency-Safe Local Fallback Strategy

Next.js applications run inside a Node.js runtime where concurrent requests can read/write to the filesystem. When writing to local fallback JSON files (`live_products.json`, `live_categories.json`, and `admin_config.json`), we must prevent:
1. **Race Conditions**: Two requests reading the file simultaneously, modifying it, and writing it back sequentially, which causes one update to overwrite the other.
2. **File Corruption**: Multiple concurrent writes starting simultaneously, leading to partially-written or corrupt JSON contents.
3. **Locking Issues**: OS-level blockages (especially on Windows) during simultaneous open/write calls.

### 2.1 The Solution
We propose a two-layered safety strategy:
1. **In-Memory Queue (Mutex)**: A promise chain per file path that serializes all read/write operations within the Node.js process.
2. **Atomic Writes**: Writing new content first to a temporary file in the same directory (e.g., `live_products.json.tmp-[timestamp]`) and then executing an OS-level atomic `fs.rename` to replace the destination file. This ensures readers never see a partially-written file.

---

## 3. Proposed Unified Code Design (`src/lib/db.ts`)

Here is the proposed, complete design for `src/lib/db.ts` utilizing the unified interface and concurrency-safe JSON fallback helper class.

```typescript
import { promises as fs } from 'fs';
import path from 'path';
import { Product } from '@/lib/data/products';
import { Category, Occasion } from '@/lib/data/categories';

// ----------------------------------------------------
// 1. Unified Interface Definition
// ----------------------------------------------------
export interface IDatabase {
  // Products
  getProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  saveProduct(product: Product): Promise<void>;
  deleteProduct(id: string): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  saveCategory(category: Category): Promise<void>;
  deleteCategory(id: string): Promise<void>;

  // Occasions (optional but recommended for consistency)
  getOccasions(): Promise<Occasion[]>;
  getOccasionBySlug(slug: string): Promise<Occasion | undefined>;

  // Admin Config
  getAdminPasswordHash(): Promise<string>;
  saveAdminPasswordHash(hash: string): Promise<void>;
}

// ----------------------------------------------------
// 2. Concurrency-Safe File Helper (Mutex + Atomic Write)
// ----------------------------------------------------
class FileMutex {
  private queue: Promise<any> = Promise.resolve();

  async run<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(fn);
    this.queue = next.catch(() => {}); // prevent chain stalling
    return next;
  }
}

class JsonDbFile<T> {
  private filePath: string;
  private defaultData: T;
  private mutex: FileMutex;
  private isInitialized = false;

  constructor(relativeFilePath: string, defaultData: T) {
    this.filePath = path.resolve(process.cwd(), relativeFilePath);
    this.defaultData = defaultData;
    this.mutex = new FileMutex();
  }

  private async ensureFile(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await fs.access(this.filePath);
      this.isInitialized = true;
    } catch {
      // File doesn't exist, initialize directories and write default data
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      await this.writeAtomic(this.defaultData);
      this.isInitialized = true;
    }
  }

  async read(): Promise<T> {
    return this.mutex.run(async () => {
      await this.ensureFile();
      const content = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(content) as T;
    });
  }

  async write(data: T): Promise<void> {
    return this.mutex.run(async () => {
      await this.ensureFile();
      await this.writeAtomic(data);
    });
  }

  private async writeAtomic(data: T): Promise<void> {
    const tempPath = `${this.filePath}.tmp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(tempPath, content, 'utf8');
    try {
      // Atomic rename (guaranteed by OS filesystem)
      await fs.rename(tempPath, this.filePath);
    } catch (err) {
      try {
        await fs.unlink(tempPath);
      } catch {}
      throw err;
    }
  }
}

// ----------------------------------------------------
// 3. JSON Fallback Database Implementation
// ----------------------------------------------------
import { products as initialProducts } from './data/products';
import { categories as initialCategories, occasions as initialOccasions } from './data/categories';

class JsonDatabase implements IDatabase {
  private productsDb = new JsonDbFile<Product[]>('src/lib/data/live_products.json', initialProducts);
  private categoriesDb = new JsonDbFile<Category[]>('src/lib/data/live_categories.json', initialCategories);
  
  // Default config stores pre-hashed password for 'adminpassword123'
  // Explorer 2 will define the exact hash function/salt used
  private configDb = new JsonDbFile<{ passwordHash: string }>('src/lib/data/admin_config.json', {
    passwordHash: "$2b$10$7XyHwN/p3lBf/T2XWc/WYe9VzGq53.k2kQh33jM9g8h7XgXyGq53e" // example bcrypt hash for 'adminpassword123'
  });

  // Products CRUD
  async getProducts(): Promise<Product[]> {
    return this.productsDb.read();
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const list = await this.getProducts();
    return list.find(p => p.id === id);
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const list = await this.getProducts();
    return list.find(p => p.slug === slug);
  }

  async saveProduct(product: Product): Promise<void> {
    const list = await this.getProducts();
    const idx = list.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      list[idx] = product;
    } else {
      list.push(product);
    }
    await this.productsDb.write(list);
  }

  async deleteProduct(id: string): Promise<void> {
    const list = await this.getProducts();
    const filtered = list.filter(p => p.id !== id);
    await this.productsDb.write(filtered);
  }

  // Categories CRUD
  async getCategories(): Promise<Category[]> {
    return this.categoriesDb.read();
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const list = await this.getCategories();
    return list.find(c => c.id === id);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const list = await this.getCategories();
    return list.find(c => c.slug === slug);
  }

  async saveCategory(category: Category): Promise<void> {
    const list = await this.getCategories();
    const idx = list.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      list[idx] = category;
    } else {
      list.push(category);
    }
    await this.categoriesDb.write(list);
  }

  async deleteCategory(id: string): Promise<void> {
    const list = await this.getCategories();
    const filtered = list.filter(c => c.id !== id);
    await this.categoriesDb.write(filtered);
  }

  // Occasions
  async getOccasions(): Promise<Occasion[]> {
    return initialOccasions; // Keep static or move to live_occasions.json if needed
  }

  async getOccasionBySlug(slug: string): Promise<Occasion | undefined> {
    return initialOccasions.find(o => o.slug === slug);
  }

  // Admin Config
  async getAdminPasswordHash(): Promise<string> {
    const config = await this.configDb.read();
    return config.passwordHash;
  }

  async saveAdminPasswordHash(hash: string): Promise<void> {
    await this.configDb.write({ passwordHash: hash });
  }
}

// ----------------------------------------------------
// 4. Firebase Database Implementation (Example)
// ----------------------------------------------------
// Note: Requires installation of firebase (or firebase-admin). 
// The actual Firebase implementation will be written by the Worker.
class FirebaseDatabase implements IDatabase {
  // Placeholder structure. Actual implementation will connect to 
  // Firestore collections 'products', 'categories', 'config'
  async getProducts(): Promise<Product[]> { return []; }
  async getProductById(id: string): Promise<Product | undefined> { return undefined; }
  async getProductBySlug(slug: string): Promise<Product | undefined> { return undefined; }
  async saveProduct(product: Product): Promise<void> {}
  async deleteProduct(id: string): Promise<void> {}

  async getCategories(): Promise<Category[]> { return []; }
  async getCategoryById(id: string): Promise<Category | undefined> { return undefined; }
  async getCategoryBySlug(slug: string): Promise<Category | undefined> { return undefined; }
  async saveCategory(category: Category): Promise<void> {}
  async deleteCategory(id: string): Promise<void> {}

  async getOccasions(): Promise<Occasion[]> { return initialOccasions; }
  async getOccasionBySlug(slug: string): Promise<Occasion | undefined> { return undefined; }

  async getAdminPasswordHash(): Promise<string> { return ""; }
  async saveAdminPasswordHash(hash: string): Promise<void> {}
}

// ----------------------------------------------------
// 5. Dual-Mode Dispatcher
// ----------------------------------------------------
const isFirebaseConfigured = (): boolean => {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
};

const dbInstance: IDatabase = isFirebaseConfigured() 
  ? new FirebaseDatabase() 
  : new JsonDatabase();

// Export unified interface functions
export const getProducts = () => dbInstance.getProducts();
export const getProductById = (id: string) => dbInstance.getProductById(id);
export const getProductBySlug = (slug: string) => dbInstance.getProductBySlug(slug);
export const saveProduct = (product: Product) => dbInstance.saveProduct(product);
export const deleteProduct = (id: string) => dbInstance.deleteProduct(id);

export const getCategories = () => dbInstance.getCategories();
export const getCategoryById = (id: string) => dbInstance.getCategoryById(id);
export const getCategoryBySlug = (slug: string) => dbInstance.getCategoryBySlug(slug);
export const saveCategory = (category: Category) => dbInstance.saveCategory(category);
export const deleteCategory = (id: string) => dbInstance.deleteCategory(id);

export const getOccasions = () => dbInstance.getOccasions();
export const getOccasionBySlug = (slug: string) => dbInstance.getOccasionBySlug(slug);

export const getAdminPasswordHash = () => dbInstance.getAdminPasswordHash();
export const saveAdminPasswordHash = (hash: string) => dbInstance.saveAdminPasswordHash(hash);
```

---

## 4. State Integration and Cache Propagation in Next.js

To satisfy the constraint that *"public-facing pages reflect updates instantly"*:
1. **Server-Side Operations**: Functions in `src/lib/db.ts` must execute server-side.
2. **Revalidation**: When writing operations like `saveProduct` or `deleteProduct` are called (typically from Next.js Server Actions or Route Handlers), the calling code should invoke the Next.js revalidation APIs:
   - `revalidatePath('/shop')`
   - `revalidatePath('/categories')`
   - `revalidatePath('/')` (or `revalidatePath('/categories/[slug]', 'page')`)
   - Alternatively, use tagged data fetches (`revalidateTag('products')`).
3. **No client-side direct calls to `db.ts`**: The client storefront will fetch data by hitting API endpoints (e.g. `/api/products` and `/api/categories`), which query the active `dbInstance` server-side.

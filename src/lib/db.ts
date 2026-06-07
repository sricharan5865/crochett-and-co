import { promises as fs } from 'fs';
import path from 'path';
import { products as initialProducts, Product } from './data/products';
import { categories as initialCategories, occasions as initialOccasions, Category, Occasion } from './data/categories';
import { Order } from './data/orders';
import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-expect-error - firebase package types might not resolve during bundler resolution
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, deleteDoc, Firestore, QueryDocumentSnapshot } from 'firebase/firestore';

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

  // Occasions
  getOccasions(): Promise<Occasion[]>;
  getOccasionBySlug(slug: string): Promise<Occasion | undefined>;

  // Admin Config
  getAdminPasswordHash(): Promise<string>;
  saveAdminPasswordHash(hash: string): Promise<void>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  saveOrder(order: Order): Promise<void>;
  deleteOrder(id: string): Promise<void>;
}

// ----------------------------------------------------
// 2. Global In-Memory Cache Store
// ----------------------------------------------------
interface DbCache {
  products: Product[] | null;
  categories: Category[] | null;
  occasions: Occasion[] | null;
  adminPasswordHash: string | null;
  orders: Order[] | null;
}

const getGlobalCache = (): DbCache => {
  const g = global as typeof globalThis & { __dbCache?: DbCache };
  if (!g.__dbCache) {
    g.__dbCache = {
      products: null,
      categories: null,
      occasions: null,
      adminPasswordHash: null,
      orders: null,
    };
  }
  return g.__dbCache;
};

const invalidateCache = (key: keyof DbCache) => {
  const cache = getGlobalCache();
  cache[key] = null;
};

// ----------------------------------------------------
// 3. Concurrency-Safe File Helper (Mutex + Atomic Write)
// ----------------------------------------------------
class FileMutex {
  private queue: Promise<unknown> = Promise.resolve();

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
      await this.write(this.defaultData);
      this.isInitialized = true;
    }
  }

  async read(): Promise<T> {
    return this.mutex.run(async () => {
      try {
        const fsSync = require('fs');
        if (!fsSync.existsSync(this.filePath)) {
          const dir = path.dirname(this.filePath);
          fsSync.mkdirSync(dir, { recursive: true });
          fsSync.writeFileSync(this.filePath, JSON.stringify(this.defaultData, null, 2), 'utf8');
        }
        const content = fsSync.readFileSync(this.filePath, 'utf8');
        return JSON.parse(content) as T;
      } catch {
        return this.defaultData;
      }
    });
  }

  async write(data: T): Promise<void> {
    return this.mutex.run(async () => {
      const fsSync = require('fs');
      const dir = path.dirname(this.filePath);
      fsSync.mkdirSync(dir, { recursive: true });
      const tempPath = `${this.filePath}.tmp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      fsSync.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      try {
        fsSync.renameSync(tempPath, this.filePath);
      } catch (err) {
        try {
          fsSync.unlinkSync(tempPath);
        } catch {}
        throw err;
      }
    });
  }
}

// ----------------------------------------------------
// 4. JSON Fallback Database Implementation
// ----------------------------------------------------
class JsonDatabase implements IDatabase {
  private productsDb = new JsonDbFile<Product[]>('src/lib/data/live_products.json', initialProducts);
  private categoriesDb = new JsonDbFile<Category[]>('src/lib/data/live_categories.json', initialCategories);
  private ordersDb = new JsonDbFile<Order[]>('src/lib/data/live_orders.json', []);
  private configDb = new JsonDbFile<{ passwordHash: string }>('src/lib/data/admin_config.json', {
    passwordHash: 'pbkdf2:100000:default_pbkdf2_salt_value_2026:cb9d7b8505eb5c6bac81e3c8ca0e44a9fed24724672b250e7fd869c4fc4b048250a46f4357b0766f1f9ad248ae566f6f81d73ec4f71a8c9faf347a784c4066d1'
  });

  // Products CRUD
  async getProducts(): Promise<Product[]> {
    const result = await this.productsDb.read();
    return result;
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
    const result = await this.categoriesDb.read();
    return result;
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
    return initialOccasions;
  }

  async getOccasionBySlug(slug: string): Promise<Occasion | undefined> {
    const list = await this.getOccasions();
    return list.find(o => o.slug === slug);
  }

  // Admin Config
  async getAdminPasswordHash(): Promise<string> {
    const config = await this.configDb.read();
    return config.passwordHash;
  }

  async saveAdminPasswordHash(hash: string): Promise<void> {
    await this.configDb.write({ passwordHash: hash });
  }

  // Orders CRUD
  async getOrders(): Promise<Order[]> {
    return await this.ordersDb.read();
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const list = await this.getOrders();
    return list.find(o => o.id === id);
  }

  async saveOrder(order: Order): Promise<void> {
    const list = await this.getOrders();
    const idx = list.findIndex(o => o.id === order.id);
    if (idx >= 0) {
      list[idx] = order;
    } else {
      list.push(order);
    }
    await this.ordersDb.write(list);
  }

  async deleteOrder(id: string): Promise<void> {
    const list = await this.getOrders();
    const filtered = list.filter(o => o.id !== id);
    await this.ordersDb.write(filtered);
  }
}

// ----------------------------------------------------
// 5. Firebase Firestore Database Implementation
// ----------------------------------------------------
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isFirebaseConfigured = (): boolean => {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
};

let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  } catch (error) {
    console.error('Failed to initialize Firebase app or firestore:', error);
  }
}

class FirebaseDatabase implements IDatabase {
  // Products CRUD
  async getProducts(): Promise<Product[]> {
    const cache = getGlobalCache();
    if (cache.products) return cache.products;

    if (!db) return [];
    const colRef = collection(db, 'products');
    const snap = await getDocs(colRef);
    const result = snap.docs.map((d: QueryDocumentSnapshot) => ({ ...d.data(), id: d.id } as Product));
    cache.products = result;
    return result;
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
    if (!db) return;
    const docRef = doc(db, 'products', product.id);
    await setDoc(docRef, product);
    invalidateCache('products');
  }

  async deleteProduct(id: string): Promise<void> {
    if (!db) return;
    const docRef = doc(db, 'products', id);
    await deleteDoc(docRef);
    invalidateCache('products');
  }

  // Categories CRUD
  async getCategories(): Promise<Category[]> {
    const cache = getGlobalCache();
    if (cache.categories) return cache.categories;

    if (!db) return [];
    const colRef = collection(db, 'categories');
    const snap = await getDocs(colRef);
    const result = snap.docs.map((d: QueryDocumentSnapshot) => ({ ...d.data(), id: d.id } as Category));
    cache.categories = result;
    return result;
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
    if (!db) return;
    const docRef = doc(db, 'categories', category.id);
    await setDoc(docRef, category);
    invalidateCache('categories');
  }

  async deleteCategory(id: string): Promise<void> {
    if (!db) return;
    const docRef = doc(db, 'categories', id);
    await deleteDoc(docRef);
    invalidateCache('categories');
  }

  // Occasions
  async getOccasions(): Promise<Occasion[]> {
    const cache = getGlobalCache();
    if (cache.occasions) return cache.occasions;

    if (!db) return initialOccasions;
    const colRef = collection(db, 'occasions');
    const snap = await getDocs(colRef);
    if (snap.empty) {
      cache.occasions = initialOccasions;
      return initialOccasions;
    }
    const result = snap.docs.map((d: QueryDocumentSnapshot) => ({ ...d.data(), id: d.id } as Occasion));
    cache.occasions = result;
    return result;
  }

  async getOccasionBySlug(slug: string): Promise<Occasion | undefined> {
    const list = await this.getOccasions();
    return list.find(o => o.slug === slug);
  }

  // Admin Config
  async getAdminPasswordHash(): Promise<string> {
    const cache = getGlobalCache();
    if (cache.adminPasswordHash) return cache.adminPasswordHash;

    if (!db) return '';
    const docRef = doc(db, 'config', 'admin');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const hash = data?.passwordHash || '';
      cache.adminPasswordHash = hash;
      return hash;
    }
    return '';
  }

  async saveAdminPasswordHash(hash: string): Promise<void> {
    if (!db) return;
    const docRef = doc(db, 'config', 'admin');
    await setDoc(docRef, { passwordHash: hash }, { merge: true });
    invalidateCache('adminPasswordHash');
  }

  // Orders CRUD
  async getOrders(): Promise<Order[]> {
    const cache = getGlobalCache();
    if (cache.orders) return cache.orders;

    if (!db) return [];
    const colRef = collection(db, 'orders');
    const snap = await getDocs(colRef);
    const result = snap.docs.map((d: QueryDocumentSnapshot) => ({ ...d.data(), id: d.id } as Order));
    cache.orders = result;
    return result;
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const list = await this.getOrders();
    return list.find(o => o.id === id);
  }

  async saveOrder(order: Order): Promise<void> {
    if (!db) return;
    const docRef = doc(db, 'orders', order.id);
    await setDoc(docRef, order);
    invalidateCache('orders');
  }

  async deleteOrder(id: string): Promise<void> {
    if (!db) return;
    const docRef = doc(db, 'orders', id);
    await deleteDoc(docRef);
    invalidateCache('orders');
  }
}

// ----------------------------------------------------
// 6. Dual-Mode Dispatcher
// ----------------------------------------------------
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

export const getOrders = () => dbInstance.getOrders();
export const getOrderById = (id: string) => dbInstance.getOrderById(id);
export const saveOrder = (order: Order) => dbInstance.saveOrder(order);
export const deleteOrder = (id: string) => dbInstance.deleteOrder(id);

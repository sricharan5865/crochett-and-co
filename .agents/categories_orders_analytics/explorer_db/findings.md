# Database, Interface, and API Implementation Plan

This document outlines the detailed plans and designs for introducing Categories and Orders management capabilities, including the interface edits, the mock data structure, database integration, and API route planning.

---

## 1. Database Interface Integration (`src/lib/db.ts`)

To integrate `Orders` management and preserve dual-mode support (JSON file-based storage for local fallback and Firebase Firestore for production), the following updates are proposed for `src/lib/db.ts`:

### 1.1 Types and Imports
Import the `Order` interface from the new `@/lib/data/orders` file:
```typescript
import { Order } from './data/orders';
```

### 1.2 Unified Interface (`IDatabase`)
Extend the `IDatabase` interface to include Orders CRUD operations:
```typescript
export interface IDatabase {
  // ... existing Products, Categories, Occasions, and Admin Config ...

  // Orders
  getOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  saveOrder(order: Order): Promise<void>;
  deleteOrder(id: string): Promise<void>;
}
```

### 1.3 In-Memory Cache Store (`DbCache`)
Add `orders` cache to prevent redundant reads:
```typescript
interface DbCache {
  products: Product[] | null;
  categories: Category[] | null;
  occasions: Occasion[] | null;
  adminPasswordHash: string | null;
  orders: Order[] | null; // Added
}

const getGlobalCache = (): DbCache => {
  const g = global as typeof globalThis & { __dbCache?: DbCache };
  if (!g.__dbCache) {
    g.__dbCache = {
      products: null,
      categories: null,
      occasions: null,
      adminPasswordHash: null,
      orders: null, // Added
    };
  }
  return g.__dbCache;
};
```

### 1.4 JSON Fallback Database (`JsonDatabase`)
Instantiate `JsonDbFile` mapping to `live_orders.json`:
```typescript
class JsonDatabase implements IDatabase {
  // ... other stores
  private ordersDb = new JsonDbFile<Order[]>('src/lib/data/live_orders.json', []);

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
```

### 1.5 Firebase Firestore Database (`FirebaseDatabase`)
Implement Firebase collection CRUD operations:
```typescript
class FirebaseDatabase implements IDatabase {
  // ... other methods

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
```

### 1.6 Exported Dispatcher Methods
Expose dispatch functions:
```typescript
export const getOrders = () => dbInstance.getOrders();
export const getOrderById = (id: string) => dbInstance.getOrderById(id);
export const saveOrder = (order: Order) => dbInstance.saveOrder(order);
export const deleteOrder = (id: string) => dbInstance.deleteOrder(id);
```

---

## 2. Order Interface and Mock Data Schema (`src/lib/data/orders.ts` & `live_orders.json`)

### 2.1 Interface Definition (`src/lib/data/orders.ts`)
```typescript
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'pending' | 'shipped' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  date: string; // ISO-8601 string
}
```

### 2.2 Realistic Mock Data Store (`src/lib/data/live_orders.json`)
```json
[
  {
    "id": "ord_1",
    "customerName": "Alice Smith",
    "customerEmail": "alice.smith@example.com",
    "customerPhone": "+1 (555) 019-2834",
    "items": [
      {
        "productId": "1",
        "productName": "Signature Rose Bouquet",
        "quantity": 1,
        "price": 2499
      },
      {
        "productId": "3",
        "productName": "Single Stem Tulip",
        "quantity": 3,
        "price": 599
      }
    ],
    "status": "pending",
    "totalAmount": 4296,
    "date": "2026-06-05T09:14:32Z"
  },
  {
    "id": "ord_2",
    "customerName": "Michael Scott",
    "customerEmail": "mscott@dundermifflin.com",
    "customerPhone": "+1 (555) 014-9988",
    "items": [
      {
        "productId": "5",
        "productName": "Crochet Sunflower Arrangement",
        "quantity": 2,
        "price": 1850
      }
    ],
    "status": "shipped",
    "totalAmount": 3700,
    "date": "2026-06-06T14:45:00Z"
  },
  {
    "id": "ord_3",
    "customerName": "Emma Watson",
    "customerEmail": "emma.watson@example.com",
    "customerPhone": "+1 (555) 012-3456",
    "items": [
      {
        "productId": "2",
        "productName": "Lavender Dream Set",
        "quantity": 1,
        "price": 3500
      }
    ],
    "status": "completed",
    "totalAmount": 3500,
    "date": "2026-06-04T11:20:15Z"
  },
  {
    "id": "ord_4",
    "customerName": "John Doe",
    "customerEmail": "john.doe@example.com",
    "customerPhone": "+1 (555) 011-2233",
    "items": [
      {
        "productId": "7",
        "productName": "Crochet Hair Pin Set",
        "quantity": 1,
        "price": 999
      }
    ],
    "status": "cancelled",
    "totalAmount": 999,
    "date": "2026-06-03T16:05:00Z"
  }
]
```

---

## 3. API Routes Design and Implementation Plan

All API endpoints must handle standard CRUD validation, authentication controls (via `isAuthenticated`), and error responses with correct status codes (400, 401, 404, 409, 500).

### 3.1 `/api/categories/route.ts`
- **`GET`**: Returns list of all categories. Public access (unauthenticated).
  - *Response*: `200 OK` (list of Categories).
- **`POST`**: Creates a new category. Requires Admin Authentication (`isAuthenticated`).
  - *Payload Validation*: Ensures `id`, `name`, `slug`, and `gradient` are non-empty strings. Checks that `slug` is unique among existing categories.
  - *Response*: `201 Created` (new Category object) or `401 Unauthorized`, `400 Bad Request`, `409 Conflict`.

### 3.2 `/api/categories/[id]/route.ts`
- **`PUT`**: Updates category details by id. Requires Admin Authentication.
  - *Payload Validation*: Validates updated fields (`name`, `slug` etc. cannot be empty if provided). Ensures updated `slug` doesn't conflict with another category.
  - *Response*: `200 OK` (updated Category) or `401 Unauthorized`, `400 Bad Request`, `404 Not Found`, `409 Conflict`.
- **`DELETE`**: Deletes a category by id. Requires Admin Authentication.
  - *Validation*: Checks if category exists.
  - *Response*: `200 OK` (`{ success: true }`) or `401 Unauthorized`, `404 Not Found`.

### 3.3 `/api/orders/route.ts`
- **`GET`**: Returns a list of all orders. Requires Admin Authentication (since orders contain customer names, emails, and phone numbers).
  - *Response*: `200 OK` (list of Orders) or `401 Unauthorized`.
- **`POST`**: Places a new order. Public access (to allow users checking out to place an order).
  - *Payload Validation*:
    - Check presence and format of `customerName`, `customerEmail`, `customerPhone`.
    - Check that `items` is a non-empty array where each item contains `productId`, `productName`, `quantity` (positive integer), and `price` (non-negative number).
    - Auto-generate `id` (e.g. using a timestamp + unique string) if not provided, set initial `status` to `'pending'`, and recalculate `totalAmount` based on items list to prevent client-side total forging.
  - *Response*: `201 Created` (placed Order object) or `400 Bad Request`.

### 3.4 `/api/orders/[id]/route.ts`
- **`GET`**: Returns a single order by its ID. Requires Admin Authentication.
  - *Response*: `200 OK` (Order object) or `401 Unauthorized`, `404 Not Found`.
- **`PUT`**: Updates an order's details (typically the `status`). Requires Admin Authentication.
  - *Payload Validation*: Ensures status updates match the `OrderStatus` type (`'pending' | 'shipped' | 'completed' | 'cancelled'`).
  - *Response*: `200 OK` (updated Order object) or `401 Unauthorized`, `400 Bad Request`, `404 Not Found`.
- **`DELETE`**: Deletes an order record. Requires Admin Authentication.
  - *Response*: `200 OK` (`{ success: true }`) or `401 Unauthorized`, `404 Not Found`.

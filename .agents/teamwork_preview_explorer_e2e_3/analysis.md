# E2E Testing Strategy Analysis: Tier 3/4 Design, Persistence Simulation, and Cleanup Strategy

## Executive Summary
This document provides the design specification for the opaque-box End-to-End (E2E) testing suite for the Crochett & Co Admin Portal. The analysis focuses on:
1. **Tier 3 (Cross-Feature Combinations)** and **Tier 4 (Real-World Scenarios)** test cases.
2. **Persistence Mode Simulation** (Firebase vs. Local JSON fallback) using dynamic environment injection via process isolation.
3. **Database Cleanup and Idempotency** protocols to ensure test runs are repeatable, non-destructive, and resilient to failures.

---

## 1. Design of Tier 3 (Cross-Feature) & Tier 4 (Real-World) Test Cases

Since the test runner operates as a native Node.js script utilizing `fetch` (opaque-box, no browser interface), it interacts with the system via HTTP calls to API endpoints and parsing of the returned HTML on the storefront and dashboard routes.

### Tier 3: Cross-Feature Combinations (Pairwise Coverage)

#### T3.1: Full Auth & Product CRUD Lifecycle (Golden Path)
* **Objective**: Validate the full pipeline from authentication, creation, verification, modification, storefront visibility, and eventual deletion.
* **Procedure & Endpoints**:
  1. **Login**: POST `/api/auth/login` with body `{"username": "admin", "password": "defaultPassword"}`. Capture the `Set-Cookie` session header (e.g. `session_token=xyz`).
  2. **Create**: POST `/api/products` with the auth cookie and body:
     ```json
     {
       "name": "E2E Orchid Bloom",
       "slug": "e2e-orchid-bloom",
       "description": "Handmade crochet orchid.",
       "price": 899,
       "category": "crochet-flowers",
       "inStock": true,
       "customizable": true,
       "tags": ["orchid", "special"]
     }
     ```
     *Assert status code 201 (Created) or 200 (OK).*
  3. **Verify Admin List**: GET `/admin/dashboard` (with auth cookie). Verify that the returned HTML contains `e2e-orchid-bloom` and `E2E Orchid Bloom`.
  4. **Verify Storefront**: GET `/shop` (no auth). Parse HTML to verify that the product card with slug `e2e-orchid-bloom` and price `899` is rendered.
  5. **Update**: PUT `/api/products` (or `/api/products/e2e-orchid-bloom`) with the auth cookie and body:
     ```json
     {
       "id": "<product_id>",
       "name": "E2E Orchid Bloom (Modified)",
       "slug": "e2e-orchid-bloom",
       "price": 1099,
       "inStock": false
     }
     ```
     *Assert status code 200 (OK).*
  6. **Verify Storefront Update**: GET `/shop/e2e-orchid-bloom` (no auth). Verify that the HTML displays the updated name `"E2E Orchid Bloom (Modified)"`, the price `"1099"`, and an "Out of Stock" status label/badge.
  7. **Unauthenticated Delete Attempt**: DELETE `/api/products/e2e-orchid-bloom` (no auth cookie). *Assert status code 401 (Unauthorized) or 403 (Forbidden).*
  8. **Delete**: DELETE `/api/products/e2e-orchid-bloom` with the auth cookie. *Assert status code 200 (OK).*
  9. **Final Verification**: GET `/shop/e2e-orchid-bloom` (no auth). *Assert status code 404 (Not Found).*

#### T3.2: Administrator Password Change & Session Invalidation Flow
* **Objective**: Validate that a password change updates the database, invalidates existing sessions, and credentials update successfully.
* **Procedure & Endpoints**:
  1. **Login (Default)**: POST `/api/auth/login` with default password `admin123`. Save `Cookie_A`.
  2. **Change Password**: POST `/api/auth/change-password` with `Cookie_A` and body:
     ```json
     {
       "oldPassword": "admin123",
       "newPassword": "temporaryE2EPassword2026!"
     }
     ```
     *Assert status code 200 (OK).*
  3. **Check Session Invalidation**: POST `/api/products` with `Cookie_A` to create a product. *Assert status code 401 (Unauthorized)*, confirming the session was invalidated immediately upon password change.
  4. **Login (Old Password)**: POST `/api/auth/login` with `password: "admin123"`. *Assert status code 401 (Unauthorized).*
  5. **Login (New Password)**: POST `/api/auth/login` with `password: "temporaryE2EPassword2026!"`. *Assert status code 200 (OK)* and capture `Cookie_B`.
  6. **Restore Password (Idempotency)**: POST `/api/auth/change-password` with `Cookie_B` and body:
     ```json
     {
       "oldPassword": "temporaryE2EPassword2026!",
       "newPassword": "admin123"
     }
     ```
     *Assert status code 200 (OK).*
  7. **Verify Restore**: POST `/api/auth/login` with `password: "admin123"`. *Assert status code 200 (OK).*

#### T3.3: Server Restarts & Persistence Validation
* **Objective**: Confirm that product data written during the test run persists after server shutdown and restart.
* **Procedure & Endpoints**:
  1. **Login**: POST `/api/auth/login` with default credentials. Save auth cookie.
  2. **Create**: POST `/api/products` with auth cookie and body:
     ```json
     {
       "name": "Persisted Rose",
       "slug": "persisted-rose",
       "price": 450,
       "inStock": true,
       "category": "crochet-flowers"
     }
     ```
     *Assert status code 201/200.*
  3. **Verify Publicly**: GET `/shop` and assert `"Persisted Rose"` is in the HTML.
  4. **Stop Server**: Terminate the spawned Next.js dev server process.
  5. **Restart Server**: Spawn the Next.js process again on the same port. Poll `/` until it returns 200.
  6. **Verify Post-Restart**: GET `/shop` (without logging in). Assert that `"Persisted Rose"` is still present in the HTML.
  7. **Cleanup**: Login again, and DELETE `/api/products/persisted-rose`.

#### T3.4: Storefront Cart Price Sync
* **Objective**: Verify that client-side cart calculations update dynamically when an admin modifies product prices.
* **Procedure & Endpoints**:
  1. **Create Product**: Admin creates product `"Cart Tulip"` with slug `"cart-tulip"`, price `500`.
  2. **Simulate Cart Addition**: The E2E runner simulates a client-side cart adding 2 units of `cart-tulip`.
  3. **Update Price**: Admin updates the product price to `650` via POST/PUT `/api/products`.
  4. **Sync & Checkout**: The E2E runner fetches the latest product details from `/api/products/cart-tulip` (or parsed HTML from `/shop/cart-tulip`). It synchronizes the price to `650` in its simulated cart, computes the total (`650 * 2 = 1300`), and generates the WhatsApp checkout link.
  5. **Assert Link Content**: Assert that the generated WhatsApp link contains the URI-encoded price `650` and the correct total `₹1,300`.
  6. **Cleanup**: Delete product `"cart-tulip"`.

#### T3.5: Storefront Cart Deletion and Stock-out Integration
* **Objective**: Verify that when a product is deleted or set to out-of-stock, customer checkout sessions for that product are invalidated or updated.
* **Procedure & Endpoints**:
  1. **Create Product**: Admin creates product `"Ephemeral Rose"`, slug `"ephemeral-rose"`, price `350`.
  2. **Cart Simulation**: Add 1 unit of `ephemeral-rose` to simulated cart.
  3. **Admin Deletion**: Admin deletes product `ephemeral-rose`.
  4. **Storefront Verification**: GET `/shop/ephemeral-rose` (should return 404).
  5. **Cart Validation**: The E2E runner simulates a cart page load by sending a bulk validation request to `/api/products/validate-cart` (or querying each item's availability API). Verify that `ephemeral-rose` is flagged as "unavailable" or removed, and the cart total excludes it.
  6. **Cleanup**: Verify the deleted item is gone from all catalog pages.

---

### Tier 4: Real-World Application Scenarios (Customer & Admin Journeys)

#### T4.1: Catalog Setup and Customer Launch Journey
* **Objective**: Validate the workflow from category/product creation to storefront listing, filtering, searching, and checkout.
* **Procedure**:
  1. **Create Category**: Admin creates category `"Seasonal Special"`, slug `"seasonal-special"`.
  2. **Create Products**:
     - Product A: `"Monstera Plant"`, slug `"monstera-plant"`, price `1200`, category `"seasonal-special"`, tags `["plant", "green"]`, occasion `["birthday"]`.
     - Product B: `"Holiday Holly Wreath"`, slug `"hollywood-wreath"`, price `1500`, category `"seasonal-special"`, tags `["wreath", "red"]`, occasion `["christmas"]`.
  3. **Search Storefront**: GET `/shop?searchQuery=monstera`. Assert HTML contains `"Monstera Plant"` and does NOT contain `"Holiday Holly Wreath"`.
  4. **Filter Category**: GET `/categories/seasonal-special` or filter `/shop`. Assert both products are returned in the HTML.
  5. **Filter Occasion**: GET `/shop?occasion=christmas`. Assert only `"Holiday Holly Wreath"` is present.
  6. **Simulate Order**: Add both to a simulated cart. Compute expected subtotal (`1200 + 1500 = 2700`). Verify generated WhatsApp order message lists both items and their subtotal correctly.
  7. **Cleanup**: Delete both products and the category.

#### T4.2: Sale / Discount Promotional Campaign Setup
* **Objective**: Set up a discount campaign on specific products, verifying that storefront badges, original crossed-out prices, and checkout totals reflect the discount.
* **Procedure**:
  1. **Create Product**: Admin creates product `"Promo Sunflower"`, slug `"promo-sunflower"`, price `1000`.
  2. **Verify Original Storefront**: GET `/shop/promo-sunflower`. Assert HTML shows `₹1,000` and no sale tags.
  3. **Activate Sale**: PUT `/api/products/promo-sunflower` setting: `price: 800`, `originalPrice: 1000`, tags: `["sale"]`.
  4. **Verify Storefront Sale**:
     - GET `/shop`. Assert the product card has a "Sale" badge, the price `1000` is struck out, and the current price is `800`.
     - GET `/shop/promo-sunflower`. Assert the same.
  5. **Checkout Verification**: Simulating cart checkout lists price as `800` and computes subtotal at the discounted price.
  6. **Cleanup**: Delete product.

#### T4.3: Inventory Stock-out Flow
* **Objective**: Verify storefront action states, purchase restrictions, and cart warning flags when a product is marked out-of-stock.
* **Procedure**:
  1. **Create Product**: Admin creates `"Stockout Tulip"`, slug `"stockout-tulip"`, price `400`, `inStock: true`.
  2. **Verify Available**: GET `/shop/stockout-tulip`. Assert the page contains the active "Add to Cart" button (e.g., checks for absence of `disabled` attribute or presence of class).
  3. **Mark Out of Stock**: Admin updates product: `inStock: false`.
  4. **Verify Storefront Disabled**:
     - GET `/shop/stockout-tulip`. Assert the "Add to Cart" button is replaced with "Out of Stock" or is disabled.
     - GET `/shop`. Assert the product card exhibits an "Out of Stock" overlay or badge.
  5. **Cart Invalidation**: Simulated cart holding `stockout-tulip` checks storefront/API status. Verify that it flags the item as out of stock and refuses to include it in the WhatsApp checkout message.
  6. **Cleanup**: Delete product.

#### T4.4: Custom Order and Bouquet Builder Flow
* **Objective**: Validate dynamic generation of WhatsApp inquiry links on custom orders and custom bouquet creation screens.
* **Procedure**:
  1. **Custom Order Page**:
     - GET `/custom-orders`. Parse the form input requirements.
     - Simulate sending a custom order inquiry by constructing the WhatsApp message payload with: Name="Alice", Product="Dino Plushie", Budget="1200", Notes="Sage green".
     - Assert that the generated link is correctly formatted as `https://wa.me/919XXXXXXXXX?text=...` and the decoded string contains the details.
  2. **Bouquet Builder**:
     - Simulate user selection: 4 Roses (₹150/each) + 2 Sunflowers (₹200/each) + Kraft Wrapping (₹50) = Total ₹1050.
     - Verify that the total is calculated correctly (₹1,050) and matches the final price dynamically rendered in the build screen.
     - Verify the custom WhatsApp message lists the flower quantities and wrapping type.

#### T4.5: Graceful Database Fallback Verification
* **Objective**: Ensure that storefront and basic administrative functions fail gracefully and display default static JSON data when Firebase experiences an outage.
* **Procedure**:
  1. **Disable Firebase**: Spawn Next.js server with corrupted or empty Firebase credentials (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY=""`).
  2. **Catalog Integrity**: GET `/shop`. Assert status `200` and verify that the default static catalog (e.g. `"Rose Bouquet — Classic Red"`, `"Sunflower Sunshine Bouquet"`) loads successfully.
  3. **Storefront Details**: GET `/shop/rose-bouquet-classic-red`. Assert status `200` and proper detail rendering.
  4. **Admin Login Fallback**: GET `/admin` and POST to `/api/auth/login` with default fallback credentials from `admin_config.json`. Assert login is successful and session cookie is established.
  5. **Write Fallback**: POST a temporary product to `/api/products`. Verify it is successfully appended to the local `live_products.json` file and visible on the storefront.
  6. **Cleanup**: Purge the temporary product from `live_products.json` to restore fallback files.

---

## 2. Firebase vs. Local JSON Fallback Simulation for Opaque-Box Testing

To test both persistence modes in an opaque-box manner without modifying the application source code during test execution, the test runner must isolate the environments. 

### Process Isolation (Spawning Separate Dev Server Instances)
Next.js loads environment variables at startup. To toggle between Firebase and Local fallback databases, the E2E test runner should execute tests in two distinct cycles, spawning the server process each time with specific environment configurations.

#### Node.js Server Spawner implementation
The test runner (`e2e-tests/runner.js`) can spawn Next.js as a child process using the following module-level utility:

```javascript
const { spawn } = require('child_process');
const http = require('http');

function spawnNextServer(envOverrides = {}) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, ...envOverrides };
    // Force development environment or specific test config
    env.NODE_ENV = 'development'; 
    
    const serverProcess = spawn('npm', ['run', 'dev'], {
      env,
      shell: true,
      stdio: 'pipe'
    });

    let stdoutData = '';
    serverProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    // Handle process errors
    serverProcess.on('error', (err) => {
      reject(err);
    });

    // Poll server until it is ready
    const pollInterval = setInterval(() => {
      const req = http.get('http://localhost:3000/', (res) => {
        if (res.statusCode === 200) {
          clearInterval(pollInterval);
          resolve(serverProcess);
        }
      });
      req.on('error', () => {
        // Dev server not ready yet
      });
    }, 500);

    // Timeout after 15 seconds
    setTimeout(() => {
      clearInterval(pollInterval);
      serverProcess.kill();
      reject(new Error('Next.js dev server failed to start within timeout.'));
    }, 15000);
  });
}
```

### Configuration Environment Profiles

#### Mode A: Local JSON Fallback Profile
To force the database layer (`src/lib/db.ts`) into Local Fallback mode, the runner starts the server with Firebase credentials explicitly unset or with an explicit configuration bypass env var:

```javascript
const localServer = await spawnNextServer({
  // Clear Firebase configs to trigger fallback
  NEXT_PUBLIC_FIREBASE_API_KEY: '',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: '',
  FIREBASE_CLIENT_EMAIL: '',
  FIREBASE_PRIVATE_KEY: '',
  // Optional explicit bypass flag
  DB_MODE: 'local'
});
```

#### Mode B: Firebase Emulator Profile
To run E2E tests against Firebase without polluting production databases or requiring external network calls, tests must target the **Firebase Local Emulator Suite** (specifically Firestore and Firebase Auth).
The test runner configures the Next.js process to redirect Firebase client calls to the local emulator endpoints:

```javascript
const firebaseServer = await spawnNextServer({
  NEXT_PUBLIC_FIREBASE_API_KEY: 'mock-api-key',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'crochett-and-co-test-project',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'localhost',
  
  // Point client/server Firebase SDKs to the local emulator hosts
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
  
  DB_MODE: 'firebase'
});
```
*Note: The test runner must execute `npx firebase emulators:start` in a separate background process before starting Mode B tests, and terminate it on completion.*

---

## 3. Database Cleanup & Idempotency Strategy

To keep the test suite idempotent and prevent leftover test data, configuration drift, or password lockouts, the runner must implement a multi-layered cleanup strategy.

### 1. Local JSON Database Backup & Restore Protocol
For tests running in Local Fallback mode, files under `src/lib/data/` (`live_products.json`, `live_categories.json`, `admin_config.json`) are modified. The runner ensures complete reset by caching files before tests and restoring them on exit.

```javascript
const fs = require('fs');
const path = require('path');

const TARGET_FILES = [
  'src/lib/data/live_products.json',
  'src/lib/data/live_categories.json',
  'src/lib/data/admin_config.json'
];

const BACKUP_DIR = path.join(__dirname, '../.backup');

function backupLocalDatabase() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
  }
  TARGET_FILES.forEach(file => {
    const fullPath = path.resolve(file);
    if (fs.existsSync(fullPath)) {
      fs.copyFileSync(fullPath, path.join(BACKUP_DIR, path.basename(file)));
    }
  });
}

function restoreLocalDatabase() {
  TARGET_FILES.forEach(file => {
    const backupPath = path.join(BACKUP_DIR, path.basename(file));
    const fullPath = path.resolve(file);
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, fullPath);
    }
  });
  // Clean backup directory
  fs.readdirSync(BACKUP_DIR).forEach(file => {
    fs.unlinkSync(path.join(BACKUP_DIR, file));
  });
  fs.rmdirSync(BACKUP_DIR);
}
```

### 2. Firebase Emulator Purge via REST API
When testing in Firebase mode, the Local Emulator database can be instantly purged before/after each test spec using Firebase's administrative REST endpoints. This is faster and cleaner than deleting documents one by one.

* **Purge Firestore**:
  ```javascript
  async function clearFirestore(projectId = 'crochett-and-co-test-project') {
    const url = `http://127.0.0.1:8080/emulator/v1/projects/${projectId}/databases/(default)/documents`;
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`Failed to clear Firestore emulator: ${response.statusText}`);
    }
  }
  ```
* **Purge Auth Users**:
  ```javascript
  async function clearAuth(projectId = 'crochett-and-co-test-project') {
    const url = `http://127.0.0.1:9099/emulator/v1/projects/${projectId}/accounts`;
    const response = await fetch(url, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`Failed to clear Firebase Auth emulator: ${response.statusText}`);
    }
  }
  ```

### 3. Password Lockout Prevention (Panic Recovery)
If a password test fails midway, the dashboard might remain locked under the modified password. To prevent stalling subsequent test suites:
- **Local Fallback**: The `restoreLocalDatabase` function will overwrite the modified `admin_config.json` with the original backed-up copy.
- **Firebase Mode**: Since the Auth emulator is purged and re-seeded programmatically at the start of each run, the admin user is recreated with the default credentials (`admin123`) before any tests start.

### 4. Process Exit and Signal Handling (Fault-Tolerance)
If the test runner encounters a fatal error, is terminated via `Ctrl+C`, or crashes, the local files must still be restored. The runner registers process hooks to trap these events:

```javascript
function setupSignalHandlers() {
  const cleanupAndExit = () => {
    console.log('\nCleaning up databases and shutting down servers...');
    try {
      restoreLocalDatabase();
    } catch (e) {
      // Backups might have already been restored
    }
    process.exit();
  };

  process.on('SIGINT', cleanupAndExit);
  process.on('SIGTERM', cleanupAndExit);
  process.on('exit', () => {
    try {
      restoreLocalDatabase();
    } catch (e) {
      // Clean exit
    }
  });
}
```

---

## 4. Key Architectural Recommendations for the Runner Layout

To keep the E2E codebase neat, we recommend structuring the `e2e-tests/` directory as follows:

```
e2e-tests/
├── .backup/                 # Temporary backup folder created during runs
├── runner.js                # Core test coordinator (spawns servers, handles cleanup, runs hooks)
├── helpers.js               # Common API clients, HTML parsers, and DB purgers
└── suites/
    ├── tier1_feature.js     # Single feature verification (Auth, CRUD)
    ├── tier2_boundary.js    # Invalid inputs, injection tests, edge inputs
    ├── tier3_cross.js       # Cross-feature lifecycle combinations (T3.1 - T3.5)
    └── tier4_realworld.js   # End-to-end user journeys (T4.1 - T4.5)
```

This layout separates orchestrative logic (`runner.js` and `helpers.js`) from test case declarations, enabling easy mode-switching and centralized test reporting.

# E2E Testing Investigation and Design Report

This report analyzes the Next.js setup, public storefront routes, and designs a custom Node.js opaque-box integration test runner to verify administrative authentication, password management, and product CRUD.

---

## 1. Next.js Server & Port Configuration

### Findings from `package.json`
- **Scripts**:
  - `"dev": "next dev"` (runs Next.js in development mode)
  - `"start": "next start"` (runs Next.js in production mode)
- **Port Settings**: No custom port is defined in `package.json` or `next.config.ts`.
- **Default Port**: Next.js defaults to running on port `3000`.
- **Runner Configuration Recommendation**:
  - To avoid port conflicts with standard dev/production environments, the E2E test runner should spawn the server on an alternative port (e.g., `3001`).
  - Next.js supports custom ports using the `-p` or `--port` flag (e.g. `npx next dev -p 3001` or `PORT=3001 next dev`). Using the command-line argument is more robust across platforms than setting environment variables directly.

---

## 2. Storefront Routes, Components, & Rendering

### Storefront Routes and Purpose
The storefront currently exposes the following public routes under `src/app/`:

| Route | File Path | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Homepage showing featured collections, custom design CTA, testimonials, FAQ. |
| `/shop` | `src/app/shop/page.tsx` | Shop catalog with search, price filtering, sorting, category/occasion filters. |
| `/shop/[slug]` | `src/app/shop/[slug]/page.tsx` | Product details page with options, related products, and WhatsApp enquiry links. |
| `/categories` | `src/app/categories/page.tsx` | Categories overview catalog. |
| `/categories/[slug]`| `src/app/categories/[slug]/page.tsx`| List of products filtered by category. |
| `/cart` | `src/app/cart/page.tsx` | Cart summary page using a client-side state store (`zustand`). |
| `/wishlist` | `src/app/wishlist/page.tsx` | Wishlist summary page using client-side state store. |
| `/build-your-bouquet`| `src/app/build-your-bouquet/page.tsx`| Custom 3D interactive bouquet builder page. |
| `/custom-orders` | `src/app/custom-orders/page.tsx` | Custom order request form. |
| `/about` | `src/app/about/page.tsx` | About page. |
| `/contact` | `src/app/contact/page.tsx` | Contact form. |
| `/faq` | `src/app/faq/page.tsx` | Frequently Asked Questions. |
| `/gallery` | `src/app/gallery/page.tsx` | Instagram photo/media gallery. |

### Component Architecture & Product Rendering
- **`ProductCard` (`src/components/products/product-card.tsx`)**:
  - Renders product name, rating, formatted price (e.g. `₹1,499`), and badges (`New`, `Bestseller`, `Trending`, `% OFF`).
  - Contains an **"Add to Cart"** button, a **"Wishlist"** heart icon, and a **"WhatsApp Inquiry"** link.
- **`ProductDetail` (`src/components/products/product-detail.tsx`)**:
  - Renders full details, large product name, prices, long description, color swatches, cart/wishlist buttons, and related products grid.
- **`CategoryProductGrid` (`src/components/products/category-product-grid.tsx`)**:
  - Standard grid helper mapping a list of products to `ProductCard` components.

### Current Data Flow vs. Future Database Layer
- Currently, storefront pages import the static array `products` and `categories` directly from `src/lib/data/products.ts` and `src/lib/data/categories.ts`.
- Storefront pages are currently client-side or use static routing (`generateStaticParams`).
- **Implication for E2E Testing**:
  - To support live CRUD updates, the storefront pages must be modified to dynamically fetch from the DB access layer (using `src/lib/db.ts` methods: `getProducts()`, `getProductBySlug(slug)`), and components/routes must be set to revalidate or run dynamically (e.g., `export const dynamic = "force-dynamic"`).
  - The E2E tests will verify that edits done in the admin panel instantly propagate to `/shop`, `/categories/[slug]`, and `/shop/[slug]` by making HTTP GET requests to these public storefront routes and asserting on the returned HTML.

---

## 3. Opaque-Box Test Runner Architecture

A custom test runner in Node.js can execute tests in a fast, lightweight, and completely dependency-free manner by using child process control and the native `fetch` API.

### Spawning the Server
We spawn the Next.js dev server as a child process. Since the development environment is Windows:
1. We must set `shell: true` inside `spawn` options to correctly execute `npx`/`npm` commands on Windows.
2. We pass the port using `-p <port>` and override the `PORT` env var.
3. We redirect or pipe standard output/error so that they do not block execution, and write logs to `e2e-tests/logs/dev-server.log` for debugging.

```javascript
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || '3001';
const logStream = fs.createWriteStream(path.join(__dirname, 'logs', 'dev-server.log'));

const devProcess = spawn('npx', ['next', 'dev', '-p', port], {
  env: { ...process.env, PORT: port },
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe']
});

devProcess.stdout.pipe(logStream);
devProcess.stderr.pipe(logStream);
```

### Polling for Readiness
The runner must poll the root page `/` periodically. It handles connection errors (which occur when the server hasn't bound to the port yet) and returns once it receives a `200 OK`.
```javascript
async function waitForServer(port, timeoutMs = 45000) {
  const url = `http://localhost:${port}`;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (e) {
      // Connection refused/failed; wait and retry
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server failed to start on port ${port} within ${timeoutMs}ms`);
}
```

### Cookie-based Session and Authentication
Since tests are opaque-box, they mimic the browser:
1. Authenticate by sending credentials (username/password) to `/api/auth/login` (or `/admin/login`).
2. Read the `Set-Cookie` header from the response.
3. Pass the retrieved `Cookie` header in all subsequent restricted requests (`/admin/dashboard`, CRUD APIs).

```javascript
// Helper to extract session cookies
const setCookieHeader = response.headers.get('set-cookie');
const sessionCookie = setCookieHeader ? setCookieHeader.split(';')[0] : '';
```

### CRUD Integration and Storefront Dynamic Reflection
The tests execute HTTP sequences representing user journeys:
1. **Unauthenticated Check**: Check that accessing admin endpoints without the session cookie returns `401 Unauthorized` or redirects.
2. **Create**: Send a `POST` with product JSON details to `/api/products` (using auth cookie). Verify it returns status 201.
3. **Storefront Reflection**: Request `/shop` and `/shop/[slug]` (storefront routes). Extract text and check that the new product name, price, and category are rendered in the HTML.
4. **Update**: Send a `PUT` or `POST` modifying fields (e.g., price `1499` -> `1199`) to `/api/products/[id]`. Verify 200.
5. **Update Storefront Reflection**: Request `/shop/[slug]` and verify that the HTML output displays the updated price (`1199` / `₹1,199`).
6. **Delete**: Send a `DELETE` request to `/api/products/[id]`. Verify 200.
7. **Delete Storefront Reflection**: Request `/shop/[slug]` and assert it returns status `404` or "Not Found". Verify the product is no longer present on the `/shop` listing page.

### Graceful Process Shutdown
On Windows, child processes spawned through shells create a process tree. If you call `devProcess.kill()`, only the shell wrapper dies, leaving the child Next.js process orphaned and locking the port.
To solve this cross-platform:
1. On Windows, use `taskkill /pid <PID> /T /F` to kill the process tree.
2. On POSIX, use `SIGTERM` or standard `.kill()`.

```javascript
function killServer(child) {
  return new Promise((resolve) => {
    if (!child) return resolve();
    if (process.platform === 'win32') {
      const { exec } = require('child_process');
      exec(`taskkill /pid ${child.pid} /T /F`, () => resolve());
    } else {
      child.kill('SIGTERM');
      child.on('exit', () => resolve());
      setTimeout(resolve, 2000); // safety fallback
    }
  });
}
```

---

## 4. Recommended File Layout

All E2E testing resources should live under `e2e-tests/` in the project root:

```
e2e-tests/
├── logs/
│   └── dev-server.log        # Dev server output logs
├── runner.js                 # Command-line entry point & process orchestrator
├── helpers.js                # Shared HTTP request, Cookie, and HTML assertion utilities
└── suites/
    ├── tier1_feature.js      # Basic CRUD & Authentication happy path tests
    ├── tier2_boundary.js     # Edge cases, validation rules, invalid inputs
    ├── tier3_cross.js        # Auth-CRUD lifecycle and data persistence checks
    └── tier4_realworld.js    # Discounts, inventory exhaustion, customizable products
```

To integrate with the project CLI workflow, the following script can be added to `package.json`:
```json
"scripts": {
  "test:e2e": "node e2e-tests/runner.js"
}
```

---

## 5. Detailed Design & Draft Code Layout

Below are complete, self-contained drafts of the test runner, helpers, and test suite structure. These can be written as-is to the project directory once implementation starts.

### Draft 1: `e2e-tests/runner.js`
This file launches the Next.js dev server, runs the test suites sequentially, compiles assertion logs, and ensures clean resource teardown.

```javascript
/**
 * Opaque-Box E2E Test Runner for Crochett & Co
 * Orchestrates dev server lifecycle, runs suites, prints test status reports.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

const PORT = process.env.PORT || '3001';
const BASE_URL = `http://localhost:${PORT}`;
const LOGS_DIR = path.join(__dirname, 'logs');

// Ensure log directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR);
}

const logStream = fs.createWriteStream(path.join(LOGS_DIR, 'dev-server.log'));

let devProcess = null;

async function main() {
  console.log('==================================================');
  console.log('🚀 Starting Crochett & Co E2E Test Harness...');
  console.log('==================================================');

  try {
    // 1. Spawn Next.js Dev Server
    console.log(`[Harness] Spawning Next.js dev server on port ${PORT}...`);
    devProcess = spawn('npx', ['next', 'dev', '-p', PORT], {
      env: { ...process.env, PORT: PORT },
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    devProcess.stdout.pipe(logStream);
    devProcess.stderr.pipe(logStream);

    // Monitor for startup crash
    devProcess.on('exit', (code) => {
      if (code !== null && code !== 0) {
        console.error(`[Error] Dev server exited unexpectedly with code ${code}. Check e2e-tests/logs/dev-server.log`);
        process.exit(1);
      }
    });

    // 2. Poll Server Readiness
    console.log('[Harness] Waiting for server to become ready...');
    await helpers.waitForServer(PORT);
    console.log('[Harness] Server is ready! Beginning test suites...\n');

    // 3. Import & Execute Test Suites
    const suites = [
      { name: 'Tier 1: Feature Coverage', path: './suites/tier1_feature' },
      { name: 'Tier 2: Boundary & Corner Cases', path: './suites/tier2_boundary' },
      { name: 'Tier 3: Cross-Feature Combinations', path: './suites/tier3_cross' },
      { name: 'Tier 4: Real-World Scenarios', path: './suites/tier4_realworld' }
    ];

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    const failuresList = [];

    for (const suite of suites) {
      console.log(`--------------------------------------------------`);
      console.log(`🏃 Running Suite: ${suite.name}`);
      console.log(`--------------------------------------------------`);
      
      try {
        const suiteModule = require(suite.path);
        const results = await suiteModule.run(BASE_URL);
        
        totalTests += results.total;
        passedTests += results.passed;
        failedTests += results.failed;
        failuresList.push(...results.failures);
      } catch (err) {
        console.error(`[Suite Crash] Failed to execute suite ${suite.name}:`, err);
        failedTests++;
        totalTests++;
        failuresList.push({ name: `${suite.name} initialization`, error: err.message });
      }
    }

    // 4. Output Summary Report
    console.log('\n==================================================');
    console.log('📊 E2E Test Suite Summary Report');
    console.log('==================================================');
    console.log(`Total Assertions Run: ${totalTests}`);
    console.log(`✅ Passed:             ${passedTests}`);
    console.log(`❌ Failed:             ${failedTests}`);

    if (failedTests > 0) {
      console.log('\n❌ Failure Details:');
      failuresList.forEach((f, idx) => {
        console.log(`  ${idx + 1}. [${f.suite}] ${f.test}: ${f.error}`);
      });
      process.exitCode = 1;
    } else {
      console.log('\n🎉 All E2E Integration tests passed successfully!');
      process.exitCode = 0;
    }

  } catch (err) {
    console.error('\n💥 Critical Error in test harness execution:', err.message);
    process.exitCode = 1;
  } finally {
    // 5. Gracefully Kill Child Process Tree
    if (devProcess) {
      console.log('\n[Harness] Shutting down Next.js dev server...');
      await helpers.killServer(devProcess);
      console.log('[Harness] Dev server shutdown complete.');
    }
    console.log('==================================================');
  }
}

main();
process.on('SIGINT', async () => {
  if (devProcess) {
    console.log('\n[Harness] Interrupted! Force closing dev server...');
    await helpers.killServer(devProcess);
  }
  process.exit(1);
});
```

### Draft 2: `e2e-tests/helpers.js`
This file encapsulates direct network operations, assertions, authentication logic, and process control.

```javascript
/**
 * Shared Helper Functions for E2E Tests
 */
const { exec } = require('child_process');

/**
 * Polls the base URL until it responds with 200 OK
 */
async function waitForServer(port, timeoutMs = 60000) {
  const url = `http://localhost:${port}`;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (e) {
      // Ignore network errors during boot
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server failed to start on port ${port} within ${timeoutMs}ms`);
}

/**
 * Terminate Next.js dev server process tree (supports Windows & Unix)
 */
function killServer(child) {
  return new Promise((resolve) => {
    if (!child) return resolve();
    if (process.platform === 'win32') {
      exec(`taskkill /pid ${child.pid} /T /F`, () => resolve());
    } else {
      child.kill('SIGTERM');
      child.on('exit', () => resolve());
      setTimeout(resolve, 2000);
    }
  });
}

/**
 * Simple HTTP client helpers to manage session cookies and JSON requests
 */
const httpClient = {
  async get(url, headers = {}) {
    return fetch(url, { method: 'GET', headers });
  },

  async post(url, body, headers = {}) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body)
    });
  },

  async put(url, body, headers = {}) {
    return fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body)
    });
  },

  async delete(url, headers = {}) {
    return fetch(url, { method: 'DELETE', headers });
  }
};

/**
 * Helper to authenticate and return session cookie header
 */
async function login(baseUrl, username = 'admin', password = 'adminpassword123') {
  const res = await httpClient.post(`${baseUrl}/api/auth/login`, { username, password });
  if (!res.ok) {
    throw new Error(`Login failed with status ${res.status}`);
  }
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error('No Set-Cookie header returned on successful login');
  }
  // Extract session token cookie
  return setCookie.split(';')[0];
}

/**
 * Simple Assertion Aggregator
 */
class TestSuiteContext {
  constructor(suiteName) {
    this.suiteName = suiteName;
    this.total = 0;
    this.passed = 0;
    this.failed = 0;
    this.failures = [];
  }

  assert(condition, message) {
    this.total++;
    if (condition) {
      this.passed++;
      console.log(`  ✅ [PASS] ${message}`);
    } else {
      this.failed++;
      console.error(`  ❌ [FAIL] ${message}`);
      this.failures.push({ suite: this.suiteName, test: message, error: 'Assertion failed' });
    }
  }

  assertEquiv(actual, expected, message) {
    this.total++;
    if (actual === expected) {
      this.passed++;
      console.log(`  ✅ [PASS] ${message}`);
    } else {
      this.failed++;
      console.error(`  ❌ [FAIL] ${message} (Expected: "${expected}", Got: "${actual}")`);
      this.failures.push({
        suite: this.suiteName,
        test: message,
        error: `Expected: "${expected}", Got: "${actual}"`
      });
    }
  }

  recordError(testName, err) {
    this.total++;
    this.failed++;
    console.error(`  💥 [CRASH] ${testName}: ${err.message}`);
    this.failures.push({ suite: this.suiteName, test: testName, error: err.message });
  }

  getResults() {
    return {
      total: this.total,
      passed: this.passed,
      failed: this.failed,
      failures: this.failures
    };
  }
}

module.exports = {
  waitForServer,
  killServer,
  httpClient,
  login,
  TestSuiteContext
};
```

### Draft 3: `e2e-tests/suites/tier1_feature.js`
This file implements a subset of Tier 1 tests to verify authentication, password change, and basic product CRUD lifecycle reflection on storefronts.

```javascript
/**
 * Tier 1: Happy Path Feature Coverage Test Suite
 */
const { httpClient, login, TestSuiteContext } = require('../helpers');

async function run(baseUrl) {
  const ctx = new TestSuiteContext('Tier 1: Feature Coverage');

  // We keep track of dynamic elements so tests can run cleanly
  const testProductSlug = 'e2e-happy-rose';
  const testProduct = {
    name: 'E2E Happy Rose',
    slug: testProductSlug,
    description: 'A beautiful E2E test rose bouquet generated by test runner.',
    shortDescription: 'E2E Rose Bouquet',
    price: 888,
    originalPrice: 1000,
    category: 'crochet-bouquets',
    occasion: ['birthday'],
    images: [],
    colors: ['Red'],
    inStock: true,
    customizable: true,
    tags: ['e2e', 'rose', 'happy']
  };

  let sessionCookie = '';

  // 1. Admin Authentication Tests
  try {
    console.log('🔑 Running Admin Authentication tests...');
    
    // T1.1: Success Login
    sessionCookie = await login(baseUrl, 'admin', 'adminpassword123');
    ctx.assert(sessionCookie.length > 0, 'Login succeeds with default credentials');

    // T1.2: Incorrect credentials fail
    try {
      await login(baseUrl, 'admin', 'wrongpassword');
      ctx.assert(false, 'Login with incorrect credentials should have failed');
    } catch (e) {
      ctx.assert(true, 'Login with incorrect credentials fails');
    }

    // T1.3: Access dashboard page unauthenticated
    const unauthDash = await httpClient.get(`${baseUrl}/admin/dashboard`);
    ctx.assert(
      unauthDash.status === 401 || unauthDash.status === 403 || unauthDash.redirected,
      'Accessing admin dashboard without a session returns 401/403 or redirects to login'
    );

    // T1.4: Access dashboard authenticated
    const authDash = await httpClient.get(`${baseUrl}/admin/dashboard`, { 'Cookie': sessionCookie });
    ctx.assertEquiv(authDash.status, 200, 'Accessing admin dashboard with session cookie returns 200 OK');

  } catch (err) {
    ctx.recordError('Authentication Suite', err);
  }

  // 2. Product CRUD & Storefront Reflection Tests
  try {
    console.log('📦 Running Product CRUD & Storefront Reflection tests...');

    // Cleanup first in case previous run aborted
    await httpClient.delete(`${baseUrl}/api/products/${testProductSlug}`, { 'Cookie': sessionCookie });

    // T3.1: Create product
    const createRes = await httpClient.post(`${baseUrl}/api/products`, testProduct, { 'Cookie': sessionCookie });
    ctx.assert(createRes.status === 201 || createRes.status === 200, 'Create product returns successful response code');

    // T3.3: Verify created product is reflected in /shop catalog
    const shopRes = await httpClient.get(`${baseUrl}/shop`);
    const shopHtml = await shopRes.text();
    ctx.assert(
      shopHtml.includes(testProduct.name) && shopHtml.includes('888'),
      'Created product name and price appear in public shop catalog HTML (Dynamic Reflection)'
    );

    // T3.4: Verify product detail page loads and displays properties
    const detailsRes = await httpClient.get(`${baseUrl}/shop/${testProductSlug}`);
    ctx.assertEquiv(detailsRes.status, 200, 'Product details page /shop/[slug] returns 200 OK');
    const detailsHtml = await detailsRes.text();
    ctx.assert(
      detailsHtml.includes(testProduct.description),
      'Product details page displays correct description text'
    );

    // T4.1: Update product price
    const updatedProduct = { ...testProduct, price: 777 };
    const updateRes = await httpClient.put(`${baseUrl}/api/products/${testProductSlug}`, updatedProduct, { 'Cookie': sessionCookie });
    ctx.assertEquiv(updateRes.status, 200, 'Updating product returns 200 OK');

    // T4.3: Verify updated price is reflected on /shop storefront
    const shopUpdatedRes = await httpClient.get(`${baseUrl}/shop`);
    const shopUpdatedHtml = await shopUpdatedRes.text();
    ctx.assert(
      shopUpdatedHtml.includes('777') && !shopUpdatedHtml.includes('888'),
      'Storefront /shop catalog reflects updated product price instantly'
    );

    // T5.1: Delete product
    const deleteRes = await httpClient.delete(`${baseUrl}/api/products/${testProductSlug}`, { 'Cookie': sessionCookie });
    ctx.assertEquiv(deleteRes.status, 200, 'Deleting product returns 200 OK');

    // T5.3: Verify product detail page now returns 404
    const detailsDeletedRes = await httpClient.get(`${baseUrl}/shop/${testProductSlug}`);
    ctx.assert(
      detailsDeletedRes.status === 404 || detailsDeletedRes.redirected,
      'Accessing deleted product detail page returns 404 Not Found'
    );

    // T5.4: Verify product is removed from catalog listing
    const shopDeletedRes = await httpClient.get(`${baseUrl}/shop`);
    const shopDeletedHtml = await shopDeletedRes.text();
    ctx.assert(
      !shopDeletedHtml.includes(testProduct.name),
      'Deleted product is no longer present in public shop catalog HTML'
    );

  } catch (err) {
    ctx.recordError('Product CRUD Suite', err);
  }

  // 3. Password Management Tests
  try {
    console.log('🔐 Running Password Management tests...');
    
    // T2.1: Change password
    const pwdRes = await httpClient.post(
      `${baseUrl}/api/auth/change-password`,
      { currentPassword: 'adminpassword123', newPassword: 'newsecurepassword456' },
      { 'Cookie': sessionCookie }
    );
    ctx.assertEquiv(pwdRes.status, 200, 'Password change request succeeds (returns 200)');

    // T2.2: Old password fails to authenticate
    try {
      await login(baseUrl, 'admin', 'adminpassword123');
      ctx.assert(false, 'Login with old password should fail after change');
    } catch (e) {
      ctx.assert(true, 'Old password fails to authenticate post-change');
    }

    // T2.3: New password successfully authenticates
    const newSessionCookie = await login(baseUrl, 'admin', 'newsecurepassword456');
    ctx.assert(newSessionCookie.length > 0, 'New password successfully authenticates');

    // T2.5: Restore default password (idempotency teardown)
    const restoreRes = await httpClient.post(
      `${baseUrl}/api/auth/change-password`,
      { currentPassword: 'newsecurepassword456', newPassword: 'adminpassword123' },
      { 'Cookie': newSessionCookie }
    );
    ctx.assertEquiv(restoreRes.status, 200, 'Restoring default password succeeds');

  } catch (err) {
    ctx.recordError('Password Management Suite', err);
  }

  return ctx.getResults();
}

module.exports = { run };
```

---

## 6. Synthesis and Reconciliations
- **No Active Server Configs**: Next.js lacks ports in config or env files, meaning the local default is `3000`. Overriding via CLI arguments (`-p 3001`) guarantees isolated test runs.
- **Dynamic Routing Requirement**: While the current codebase statically exports params for slug paths, dynamic product modifications necessitate forcing dynamic rendering on `/shop`, `/categories/[slug]`, and `/shop/[slug]` (or configuring proper ISR/revalidation API hooks) in the next steps (M5).
- **Graceful Termination**: E2E testing on Windows requires process tree execution killing (`taskkill /pid <PID> /T /F`) to prevent orphaned node processes from holding port `3001` open. This is handled in the custom runner.

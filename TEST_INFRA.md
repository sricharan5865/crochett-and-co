# Crochett & Co — E2E Test Suite Infrastructure

This document details the architecture, design patterns, layouts, and methodology used in the opaque-box End-to-End (E2E) testing framework for Crochett & Co.

---

## 1. Test Suite Architecture

The E2E test suite is designed as an **opaque-box testing framework**. It does not look at the internal details of how the Next.js server resolves the database (Firebase vs. JSON fallback), but rather tests the public HTTP endpoints and HTML pages to ensure the system behaves according to contract specifications.

### Key Components

1. **Test Runner (`e2e-tests/runner.js`)**:
   - Manages the lifecycle of the Next.js dev server. It spawns the server on a dedicated testing port (`3001`), waits for it to become ready, sequentially runs the test suites, gathers and logs test assertions/results, and guarantees teardown.
   - Restores the system state on completion or interrupt.
2. **Helper Utilities (`e2e-tests/helpers.js`)**:
   - **`waitForServer(port, timeout)`**: Dual-mode polling (using TCP sockets via `node:net` and HTTP `fetch`) to detect when the Next.js server is ready.
   - **`killServer(childProcess)`**: Cleanly terminates the spawned server process and all its subprocesses (supporting Windows `taskkill /pid /t /f` and standard POSIX `SIGTERM`).
   - **`httpClient`**: A stateful fetch-based HTTP client wrapper supporting GET, POST, PUT, and DELETE. It automatically stores and transmits session cookies.
   - **`login(baseUrl, user, pass)`**: Encapsulates authentication against `/api/auth/login` and handles cookie management.
   - **`TestSuiteContext`**: An assertion manager that tracks assertion counts, registers passes/fails, captures failure stack traces, and exposes `assert` and `assertEquiv` helper methods.
   - **File Fallback Backup & Restore**: Automatically backs up and restores `live_products.json`, `live_categories.json`, and `admin_config.json` before and after testing.

---

## 2. Features Under Test

The test suites verify five core operational features:
1. **Admin Authentication**: Safe access control for login/logout and protected dashboard paths.
2. **Admin Password Management**: Ability to update password hashes, authenticate under new credentials, reject old ones, and fallback to default.
3. **Product Creation & Listing**: CRUD operations to dynamically add products and check their reflections on storefront paths.
4. **Product Updating**: Modifying product metadata, prices, and stock statuses, verifying instant updates.
5. **Product Deletion**: Removing products, verifying they return 404 on slug paths, and checking catalog cleanup.

---

## 3. Test Layout

All testing artifacts reside in the `e2e-tests/` directory at the project root:

```
e2e-tests/
├── runner.js                # Core test executor and server manager
├── helpers.js               # Shared network, process, backup, and assertion utilities
└── suites/
    ├── tier1_feature.js     # Tier 1: Core Feature Coverage
    ├── tier2_boundary.js    # Tier 2: Boundary & Corner Cases
    ├── tier3_cross.js       # Tier 3: Cross-Feature Combinations
    └── tier4_realworld.js   # Tier 4: Real-World Scenarios
```

---

## 4. The 4-Tier Testing Methodology

The testing infrastructure follows a tiered approach to systematically verify features:

### Tier 1: Feature Coverage (>=5 tests/feature, >=25 assertions)
Validates standard functionality (the "happy path") for each of the 5 features. Asserts that logins succeed, CRUD operations modify public storefront views, and password updates restrict/permit access correctly.

### Tier 2: Boundary & Corner Cases (>=5 tests/feature, >=25 assertions)
Validates how the system handles bad inputs, edge cases, and invalid configurations. Checks empty/long/injected password inputs, negative prices, duplicate product slugs, non-existent product IDs, and unauthenticated requests.

### Tier 3: Cross-Feature Combinations (5 pairwise scenarios)
Validates interactions between different components and states:
- **T3.1: Full Auth + CRUD Lifecycle**: Login -> Create -> Update -> Logout -> Verify Public -> Login -> Delete.
- **T3.2: Auth Change Flow**: Login -> Change Password -> Logout -> Login old (fails) -> Login new (passes) -> Restore default password.
- **T3.3: Persistence / Reload simulation**: Verifies that created products are physically written to the underlying JSON database file to persist across server restarts.
- **T3.4: Storefront Cart Price Update**: Verifies that when a product's price is updated, the details endpoint yields the new price (ensuring the storefront cart can sync prices).
- **T3.5: Storefront Cart Deletion**: Verifies that when a product is deleted, its detail endpoint returns 404 (ensuring the storefront cart can remove deleted items).

### Tier 4: Real-World Scenarios (5 integration flows)
Validates end-to-end user and business journeys:
- **T4.1: Catalog Setup & Launch**: Launching multiple products in a new category, checking storefront rendering, and deleting them.
- **T4.2: Sale/Discount Campaign**: Setting `price` and `originalPrice` on products, and checking storefront discount markers.
- **T4.3: Inventory Stock-out Flow**: Marking products out-of-stock and confirming order CTAs are disabled on the page.
- **T4.4: Customizable Product WhatsApp CTA**: Creating a customizable product and verifying that the details page renders a WhatsApp CTA link.
- **T4.5: Graceful Database Fallback**: Verifying that in the absence of Firebase configuration, the application falls back and loads products from the local JSON database.

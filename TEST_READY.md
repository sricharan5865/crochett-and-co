# Crochett & Co — E2E Test Suite Readiness

The opaque-box End-to-End (E2E) testing suite is fully implemented and ready for execution.

---

## Execution Command

You can run the entire E2E test suite with the following npm command:

```bash
npm run test:e2e
```

Alternatively, you can run the runner script directly with Node:

```bash
node e2e-tests/runner.js
```

---

## Test Coverage Checklist

The following table summarizes the E2E test coverage across the 4-tier methodology:

| Feature / Scenario | Tier 1: Feature Coverage | Tier 2: Boundary & Corner Cases | Tier 3: Cross-Feature Combinations | Tier 4: Real-World Scenarios |
| :--- | :---: | :---: | :---: | :---: |
| **Admin Authentication** | Yes (5 tests) | Yes (5 tests) | - | - |
| **Password Management** | Yes (5 tests) | Yes (5 tests) | - | - |
| **Product Creation** | Yes (5 tests) | Yes (5 tests) | - | - |
| **Product Updating** | Yes (5 tests) | Yes (5 tests) | - | - |
| **Product Deletion** | Yes (5 tests) | Yes (5 tests) | - | - |
| **Auth + CRUD Lifecycle** | - | - | Yes (T3.1) | - |
| **Password Change Flow** | - | - | Yes (T3.2) | - |
| **Persistence / Reload** | - | - | Yes (T3.3) | - |
| **Cart Price Syncing** | - | - | Yes (T3.4) | - |
| **Cart Item Deletion** | - | - | Yes (T3.5) | - |
| **Catalog Launch Scenario**| - | - | - | Yes (T4.1) |
| **Discount Campaign Scenario**| - | - | - | Yes (T4.2) |
| **Inventory Stock-out Flow**| - | - | - | Yes (T4.3) |
| **WhatsApp Inquiry Flow** | - | - | - | Yes (T4.4) |
| **Database Fallback Flow** | - | - | - | Yes (T4.5) |

---

## Verification Notes

Running `npm run test:e2e` will:
1. Spin up the Next.js dev server on port `3001` in the background.
2. Back up existing fallback database JSON files.
3. Wait for the server to bind and respond on port `3001`.
4. Run the 4 suites sequentially.
5. Print a detailed assertion report.
6. Terminate the Next.js process tree and restore all backed-up database files.
7. Exit with code `0` on success, or code `1` if any assertions fail.

*Note: Since the backend logic and API endpoints are currently concurrent or planned milestones, the E2E tests are expected to fail during execution at this stage. Once the backend routes are implemented, these tests will verify their functional correctness.*

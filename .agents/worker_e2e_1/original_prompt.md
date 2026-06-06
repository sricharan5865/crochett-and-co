## 2026-06-06T13:04:51Z
You are a Worker subagent in the Crochett & Co E2E Testing Suite task.
Your working directory is: c:\Users\sri charan\Documents\projects\crochett-and-co\.agents\worker_e2e_1
Identity/Role: E2E Test Suite Implementer

Mission:
Implement the complete opaque-box E2E test suite in the project workspace, including the test runner, helper utilities, test suites, and project documentation.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tasks:
1. Create the `e2e-tests/` directory at the project root.
2. Implement `e2e-tests/helpers.js`:
   - `waitForServer(port, timeoutMs)`: Socket connection test using `node:net` or native fetch polling to wait for the server on `127.0.0.1:<port>`.
   - `killServer(childProcess)`: Clean process tree termination (supports Windows `taskkill` and Unix standard SIGTERM).
   - `httpClient`: HTTP client wrapper for GET, POST, PUT, DELETE requests using global `fetch`.
   - `login(baseUrl, username, password)`: Authenticates against `/api/auth/login` and extracts session cookie.
   - `TestSuiteContext`: Assertion manager that counts test assertions, records PASS/FAIL, gathers failure details, and supports `assert(condition, message)` and `assertEquiv(actual, expected, message)`.
   - File-level Backup/Restore for local fallback JSON files: `src/lib/data/live_products.json`, `src/lib/data/live_categories.json`, and `src/lib/data/admin_config.json`.
3. Implement `e2e-tests/runner.js`:
   - Spawns the Next.js dev server on port 3001 using `spawn('npx', ['next', 'dev', '-p', '3001'], { shell: true })`.
   - Backs up existing local data files (if they exist) on start.
   - Wait for server to be ready.
   - Sequential run of all 4 suites:
     - `e2e-tests/suites/tier1_feature.js`
     - `e2e-tests/suites/tier2_boundary.js`
     - `e2e-tests/suites/tier3_cross.js`
     - `e2e-tests/suites/tier4_realworld.js`
   - Shuts down the dev server process tree.
   - Restores local data files on teardown (even on error/interrupt).
   - Exits with code 0 if all tests passed, or code 1 if any failed.
4. Implement the test suites:
   - `tier1_feature.js`: Implement 5 features with >=5 tests per feature (25 assertions total):
     - Admin Authentication (login correct, login incorrect, unauth dashboard access, auth dashboard access, logout).
     - Admin Password Management (change password, old password fails, new password succeeds, unauth password change fails, restore default password).
     - Product Creation (create product, product listed in dashboard, product on /shop, product on /shop/[slug], product on /categories/[slug]).
     - Product Updating (update product fields, update listed in dashboard, update on /shop, update on /shop/[slug], update stock status false reflections).
     - Product Deletion (delete product, delete removed from dashboard, deleted product detail 404, deleted product removed from /shop, deleted product removed from category).
   - `tier2_boundary.js`: Implement >=5 tests per feature for boundary/edge conditions (25 assertions total):
     - Admin Authentication (empty password, very long password, SQL/HTML injection password, tampered cookie, concurrent logins).
     - Password Management (empty new password, short new password, long new password, special characters/emojis password, unauthenticated/bad session).
     - Product Creation (duplicate slug rejection/handling, negative price rejection, very long strings, HTML injection/XSS protection, missing required fields).
     - Product Updating (negative price, missing required fields, non-existent product ID, conflicting slug, special characters/HTML injection).
     - Product Deletion (non-existent product ID, double deletion, malformed ID, unauthenticated deletion, cart/wishlist deletion fallback).
   - `tier3_cross.js`: Implement 5 cross-feature tests (Auth+CRUD lifecycle, password change flow, server reload persistence simulation, cart price syncing validation, cart item deletion validation).
   - `tier4_realworld.js`: Implement 5 real-world scenarios (complete catalog launch, sale/discount campaign, stockout flow, customizable product WhatsApp CTA, graceful database fallback simulation).
5. Modify `package.json` to add `"test:e2e": "node e2e-tests/runner.js"` to scripts.
6. Write `TEST_INFRA.md` in the project root documenting the test architecture, features under test, test layout, and the 4-tier methodology.
7. Write `TEST_READY.md` in the project root confirming that the test suite is ready, listing the exact runner command, and providing a coverage checklist table for features and Tiers 1-4.
8. Verify that the files compile and run (you can run `npm run test:e2e` to verify it runs Next.js, executes, prints failures since the APIs are unimplemented, and cleans up properly).

Write a self-contained handoff.md in c:\Users\sri charan\Documents\projects\crochett-and-co\.agents\worker_e2e_1\ upon completion, and send a message back to the orchestrator (conversation ID: 1389ab46-2d2f-4047-af43-1879d5e4102e).

# E2E Test Suite Quality Review Report

## Review Summary

**Verdict**: REQUEST_CHANGES

The E2E test suite has a solid structure following the 4-tier testing methodology, but it contains several critical robustness and correctness issues. Most notably, the backup/restore mechanism risks permanent data loss of clean local databases under common abort/crash conditions, the process termination mechanism is unreliable and leaves orphan Next.js dev server processes active (blocking subsequent runs), and cookie tracking does not follow RFC 6265 standards (sending raw metadata directives and failing to handle multiple cookies).

---

## Findings

### [Critical] Finding 1: Backup Overwrite and Data Contamination Risk (Potential Data Loss)
- **What**: The backup mechanism overwrites the original clean backup files (`.bak` files) with contaminated test data if a previous test run was abruptly aborted or killed (e.g., via SIGKILL or system crash).
- **Where**: `e2e-tests/helpers.js` (Lines 200–214 in `backupDataFiles()`).
- **Why**: When `backupDataFiles()` runs, it reads the current live JSON files (e.g., `live_products.json`) and copies them to the `.bak` file. If a previous run was terminated before `restoreDataFiles()` could execute, the live JSON files remain contaminated with test data (e.g., containing products like `e2e-test-p1`). The new test run will back up these contaminated files, permanently replacing the original clean data in the `.bak` files.
- **Suggestion**: Before backing up the live JSON files, check if a `.bak` file already exists. If it does, either restore from it first or use the existing `.bak` file as the source of truth for the backup rather than overwriting it with contaminated data.

### [Critical] Finding 2: Unreliable Process Termination and Port Pollution (Zombie Servers)
- **What**: The server process cleanup is fragile. When spawned via `shell: true`, calling `childProcess.kill()` (on Windows fallback or on POSIX) only kills the wrapper shell process, leaving the actual Next.js server processes running as orphans.
- **Where**: `e2e-tests/runner.js` (Lines 48–51) and `e2e-tests/helpers.js` (Lines 49–78 in `killServer()`).
- **Why**: 
  - On Windows, if `taskkill` fails or is bypassed, the fallback `childProcess.kill('SIGKILL')` only kills the `cmd.exe` process.
  - On POSIX, because the process is not spawned with `{ detached: true }`, `process.kill(-childProcess.pid, 'SIGTERM')` throws an error (`ESRCH`) because the child is not a process group leader. The fallback `childProcess.kill('SIGTERM')` only kills the shell, leaving the Next.js process group orphaned.
  - This leaves Next.js running on port 3001, causing `EADDRINUSE` errors on subsequent test runs.
- **Suggestion**: 
  1. Spawn the server process without `shell: true` by calling Node directly (e.g., `node node_modules/next/dist/bin/next dev -p 3001`).
  2. Spawn with `{ detached: true }` so it runs in its own process group, allowing safe process-group termination via `process.kill(-pid)`.

### [Major] Finding 3: Non-RFC-Compliant Cookie Tracking and Session Loss
- **What**: The `httpClient` cookie tracking is fragile and non-compliant with standard cookie parsing and transmission rules.
- **Where**: `e2e-tests/helpers.js` (Lines 80–142 in `httpClient`).
- **Why**:
  - The client stores the exact, raw `Set-Cookie` header returned by the server (including attributes like `Path=/`, `HttpOnly`, `Secure`, `SameSite=Lax`). It sends this entire string back in the `Cookie` header on subsequent requests. According to RFC 6265, clients must only send back name-value pairs, not metadata attributes. This can cause the server to fail to parse cookies correctly.
  - `this.cookie` is a single string. If any endpoint returns a different cookie (e.g., a CSRF token or tracking cookie), it completely overwrites the session cookie, causing silent de-authentication.
- **Suggestion**: Implement a basic Cookie Jar in `httpClient` that parses incoming `Set-Cookie` headers, extracts name-value pairs, maps them, and formats the outgoing `Cookie` header as a semicolon-separated list of name-value pairs.

### [Major] Finding 4: Dummy / Ineffective Assertions in Test Suites
- **What**: Certain assertions do not test what they claim to verify.
- **Where**: `e2e-tests/suites/tier2_boundary.js` (Lines 275–278 in `T2.5.5`) and `e2e-tests/suites/tier4_realworld.js` (Lines 167–197 in `T4.5`).
- **Why**:
  - `T2.5.5` asserts that the cart handles a deleted product. However, it never adds the product to the cart before deleting it. The test simply loads an empty cart page, verifying only that an empty cart returns 200.
  - `T4.5` asserts database fallback by verifying that the shop page displays a product listed in `live_products.json`. However, it does not simulate the database fallback condition (e.g., by disabling or failing Firebase connections), meaning it cannot verify whether fallback works when Firebase is down or misconfigured.
- **Suggestion**: Update `T2.5.5` to write a mock item to the cart session/cookie before deleting it, and update `T4.5` to actively mock or trigger a Firebase connection failure to test the fallback path.

### [Minor] Finding 5: API State Leakage in Password Boundary Tests
- **What**: Test `T2.2.3` changes the password to an extremely long string but does not restore the default password if it succeeds.
- **Where**: `e2e-tests/suites/tier2_boundary.js` (Lines 55–62).
- **Why**: If the password change succeeds, the server's admin password is left modified. This leaks state to subsequent tests, potentially causing them to fail when attempting to authenticate with the default password.
- **Suggestion**: Wrap the change in a try-finally block or check if the change succeeded and restore it, similar to the pattern used in `T2.2.4`.

### [Minor] Finding 6: Backup Files inside Watched Next.js Directory
- **What**: `.bak` files are created directly inside `src/lib/data/`.
- **Where**: `e2e-tests/helpers.js` (Lines 200–214).
- **Why**: Next.js watches the `src/` directory. Creating and deleting `.bak` files inside `src/lib/data/` triggers the Next.js hot-reload/compiler watcher, causing unnecessary build overhead and potential file lock issues.
- **Suggestion**: Save backup files in a directory outside `src/`, such as `e2e-tests/backups/`.

---

## Verified Claims

- **Opaque-box execution flow** → verified via running the test runner command `npm run test:e2e` → **FAIL** (Expectedly failed on API routes since dynamic features are not yet implemented, but highlighted zombie process leaks and port collisions).
- **Process termination fallback behavior** → verified via checking the running processes after runner termination → **FAIL** (Confirmed that a node.exe process remains active on port 3001, requiring manual `taskkill` to clean up).
- **Physical file backup/restore** → verified via reviewing the backup code and simulating abrupt exits → **FAIL** (Identified risk of data loss due to overwriting of backups on subsequent runs).

---

## Coverage Gaps

- **Simulation of database connection failures** — risk level: **Medium** — recommendation: Investigate. The tests verify database fallback but never simulate the actual failure of Firebase, meaning database fallback coverage is unverified.
- **Session expiration / timeout handling** — risk level: **Low** — recommendation: Accept risk or add basic validation in future milestones.

---

## Unverified Items

- **Real-world CRUD execution against functional endpoints** — reason not verified: Admin CRUD endpoints (`/api/products`, `/api/auth/login`) are currently not implemented in the codebase (M2-M5 are planned), returning 404.

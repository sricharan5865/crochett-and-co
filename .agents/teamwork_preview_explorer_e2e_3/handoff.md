# Handoff Report — E2E Testing Explorer 3

## 1. Observation
- **Project Structure**:
  - `package.json` contains Next.js scripts and dependencies, but does not list standard E2E testing frameworks like Cypress or Playwright:
    ```json
    "devDependencies": {
      "@tailwindcss/postcss": "^4",
      "@types/node": "^20",
      "@types/react": "^19",
      "@types/react-dom": "^19",
      "@types/three": "^0.184.1",
      "eslint": "^9",
      "eslint-config-next": "16.2.7",
      "tailwindcss": "^4",
      "typescript": "^5"
    }
    ```
  - `PROJECT.md` states:
    - Line 5-6: "Data Access Layer (`src/lib/db.ts`): A unified API for reading/writing products, categories, and admin configuration. Dual-mode: Firebase (if configured via env vars) or Local Fallback..."
    - Line 20: Milestone 1 is in progress: "Build opaque-box E2E test infra, write Tier 1-4 tests, publish `TEST_READY.md`".
  - `src/lib/store/cart-store.ts` manages cart state client-side using Zustand's `persist` middleware (Line 26-27).
  - `src/app/cart/page.tsx` displays cart items and invokes `generateWhatsAppLink` from `src/lib/whatsapp.ts` (Line 7) to generate the WhatsApp order message.
  - Peer files:
    - `.agents/e2e_testing_orch/plan.md` outlines features under test, specifying test lists for Tier 3 (Cross-feature) and Tier 4 (Real-world scenarios).
    - `.agents/teamwork_preview_explorer_e2e_1/original_prompt.md` notes that Explorer 1 is designing the runner execution structure (spawning, polling, shutting down).
    - `.agents/teamwork_preview_explorer_e2e_2/original_prompt.md` notes that Explorer 2 is analyzing native Node.js testing APIs (`fetch`, `child_process`) and outlining Tier 1/2 test cases.

## 2. Logic Chain
1. **Opaque-Box Testing Strategy**: Given that `package.json` restricts the testing architecture to native Node.js APIs (e.g. `fetch`, `child_process`, `fs`), the test runner must run E2E scenarios by sending HTTP requests and parsing JSON or HTML.
2. **Client-side Zustand & Cart Logic**: Since Zustand cart state is client-side, the native HTTP runner cannot directly interact with a browser's localStorage. However, it can verify catalog changes publicly and simulate cart operations by validating that price change operations correctly sync with the storefront and verifying the WhatsApp link generation format.
3. **Database Dual-Mode Simulation**: Since Next.js bundles client-side env variables (`NEXT_PUBLIC_*`) and evaluates server environment variables at process startup, switching database modes dynamically within a single running instance could cause module caching or connection pool issues. Therefore, the runner should use **Process Isolation**, spawning the Next.js dev server twice:
   - Once with Firebase env variables cleared (triggers Local Fallback).
   - Once with Firebase Emulator env variables set (`FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST`).
4. **Cleanup and Idempotency**:
   - Testing local database writes directly modifies `live_products.json`, `live_categories.json`, and `admin_config.json`. To prevent config drift and password lockouts, the runner must back up these files to a temporary `.backup` directory before the suite, and restore them on teardown.
   - Testing Firebase writes could pollute databases. Using the Firebase Local Emulator Suite enables the runner to wipe the database instantly via HTTP `DELETE` calls to the emulator REST API.
   - To handle abrupt termination (e.g. `Ctrl+C` or test crash), the runner must attach listener hooks to Node's `process` signals (`SIGINT`, `SIGTERM`, `exit`) to restore local file backups.

## 3. Caveats
- Assumes that `src/lib/db.ts` and authentication endpoints will be constructed according to the interface contract specified in `PROJECT.md`.
- Assumes that a local Firebase Emulator suite will be installed and configured on the testing machine to run Mode B tests offline. If no emulator is available, tests would have to target a live Firebase test database, requiring credentials and direct document deletion queries rather than bulk REST purges.

## 4. Conclusion
1. Tier 3 and Tier 4 tests must cover the complete lifecycle of authentication, catalog setup, dynamic price updates, stock-outs, and custom orders.
2. Environment simulation must be achieved using Process Isolation (two separate server spawns with distinct env variables).
3. Workspace state must be protected using a file-level backup/restore scheme combined with signal-trap handlers and Firebase Emulator REST purge commands.

## 5. Verification Method
1. Inspect the detailed implementation design and proposed code in `c:\Users\sri charan\Documents\projects\crochett-and-co\.agents\teamwork_preview_explorer_e2e_3\analysis.md`.
2. Verify that the proposed Node.js child process spawning commands, file backup scripts, and emulator purge HTTP routes conform to Node.js and Firebase Emulator specification limits.

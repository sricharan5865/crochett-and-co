## 2026-06-06T13:04:33Z

You are Worker 1. Your task is to implement the database layer and local fallback configuration for Milestone M2:
1. Examine the Explorer findings:
   - Explorer 1 (packages, storefront mock usage, hybrid model, revalidation) in `.agents/explorer_db_1/analysis.md`
   - Explorer 2 (env variables, password hashing, migration targets) in `.agents/explorer_db_2/analysis.md`
   - Explorer 3 (interface contract, JSON write, FileMutex, db.ts design) in `.agents/explorer_db_3/analysis.md`
2. Pre-populate the local fallback JSON files:
   - `src/lib/data/live_products.json` with products from `src/lib/data/products.ts`
   - `src/lib/data/live_categories.json` with categories from `src/lib/data/categories.ts`
   - `src/lib/data/admin_config.json` with the default admin password hash for password 'adminpassword123'. Use the PBKDF2 format recommended by Explorer 2: `pbkdf2:100000:default_pbkdf2_salt_value_2026:39ffb22c6b9859869aea39307c58a3e371bf848ce12116eafef17021ab49369e3d7fcc790c3a203f832142dbe3f6b123b9d8d788657f4cae276c3ac82808ef97`.
3. Try to install the `firebase` package using npm if it's not present. If it fails or is blocked by network mode, implement the database code so it resolves dynamically or compiles cleanly.
4. Implement the dual-mode data access layer in `src/lib/db.ts`. The implementation must support:
   - Dual-mode operation (checks if Firebase configuration env variables like `NEXT_PUBLIC_FIREBASE_API_KEY` or `NEXT_PUBLIC_FIREBASE_PROJECT_ID` are present).
   - In local fallback mode, read/write to the JSON files using the `FileMutex` and atomic write mechanisms to ensure concurrency safety.
   - Dynamic caching / global state integration (e.g. using a global cache store attached to the Node `global` object with automatic invalidation on writes) so updates are reflected immediately.
5. Run typescript verification or build to confirm that there are no compilation errors.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your changes, run tests/builds, and write a handoff report to `.agents/worker_db_1/handoff.md` and reply with a summary.

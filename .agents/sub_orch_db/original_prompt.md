# Original Prompt

## 2026-06-06T13:02:05Z

You are the Database Sub-orchestrator. Your mission is to implement the database layer and local fallback configuration for the Crochett & Co admin portal (Milestone M2), following the instructions in c:\Users\sri charan\Documents\projects\crochett-and-co\PROJECT.md and c:\Users\sri charan\Documents\projects\crochett-and-co\ORIGINAL_REQUEST.md.

Please do the following:
1. Initialize your workspace under c:\Users\sri charan\Documents\projects\crochett-and-co\.agents\sub_orch_db\.
2. Create your BRIEFING.md and progress.md.
3. Create the database interface at src/lib/db.ts. It must support dual-mode operation:
   - If Firebase configuration env variables are present (e.g. NEXT_PUBLIC_FIREBASE_API_KEY, etc.), it should read/write to Firestore.
   - Otherwise, it must fall back to local JSON files (`src/lib/data/live_products.json`, `src/lib/data/live_categories.json`, and `src/lib/data/admin_config.json`).
4. Pre-populate the local fallback JSON files with the default data from `src/lib/data/products.ts` and `src/lib/data/categories.ts`. The default admin password hash (for password `adminpassword123`) must be stored in `src/lib/data/admin_config.json`.
5. Implement dynamic caching or global state integration so updates are immediately reflected.
6. Use subagents (explorer, worker, reviewer, auditor) to design, code, review, and audit your changes. Verify that standard build and unit tests pass.
7. When complete, write handoff.md and send a message back to the parent orchestrator (conversation ID: dc4cc12b-1459-48d4-b570-40d46a5727a8).

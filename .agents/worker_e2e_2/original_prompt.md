## 2026-06-06T13:14:48Z

You are a Worker subagent in the Crochett & Co E2E Testing Suite task.
Your working directory is: c:\Users\sri charan\Documents\projects\crochett-and-co\.agents\worker_e2e_2
Identity/Role: E2E Test Suite Fixer

Mission:
Apply fixes to the E2E test suite in the project workspace to resolve critical process termination leaks, backup data contamination risks, non-compliant cookie tracking, false positive assertions, and other issues identified in the quality reviews.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tasks to implement:
1. Port Binding & Startup (runner.js):
   - Check if port 3001 is already in use before spawning the dev server. Fail fast if it is.
   - Force Next.js to bind explicitly to IPv4 by passing `-H 127.0.0.1` (or `--hostname 127.0.0.1`) to the spawn arguments.
   - Bind an exit handler on the dev server process to abort the test runner immediately with exit code 1 if Next.js crashes or exits prematurely.

2. Dev Server Process Spawn & Termination (runner.js & helpers.js):
   - Spawn Next.js directly using Node without `shell: true`. You can do this by executing `process.execPath` (which is node) with the path to the Next.js CLI: `path.resolve('node_modules/next/dist/bin/next')`.
   - Pass `{ detached: true }` (or equivalent) so that the process group can be killed reliably.
   - Update `killServer` in `helpers.js` to ensure that on Windows, `taskkill` is used, and on POSIX, `process.kill(-pid, 'SIGTERM')` is used (since detached: true is set, pid is the process group leader).

3. Backup/Restore Mechanism (helpers.js & runner.js):
   - Save backup files in a directory outside the watched `src/` tree (e.g. `e2e-tests/backups/`). Create the folder if it doesn't exist.
   - In `backupDataFiles`, check if a backup file already exists. If a backup file exists, DO NOT overwrite it with current files. This prevents backing up contaminated data from a crashed previous run.

4. RFC-Compliant Cookie Jar (helpers.js):
   - Update the `httpClient` wrapper to parse incoming `Set-Cookie` headers properly. Extract ONLY the name-value pair (ignoring attributes like Path, HttpOnly, Secure, SameSite, Max-Age).
   - Maintain a map or list of cookies so multiple cookies (like session cookie and any other tokens) are tracked without overwriting each other.
   - Format the outgoing `Cookie` header as a semicolon-separated list of name-value pairs (e.g., `Cookie: name1=value1; name2=value2`).

5. Error Handling & False-Positive Prevention (helpers.js & suites):
   - In `login` helper and `httpClient`, do NOT catch/swallow network-level errors (like connection refused, DNS lookup failure, fetch failure, socket timeouts) and return null.
   - Differentiate network/system errors from HTTP responses (e.g. 401/403/404). Network/system errors MUST throw/bubble up to fail the tests, while HTTP error status codes (e.g. 401 Unauthorized) are returned normally so the test can assert them.
   - In deletion and cleanup tests, verify preconditions first. Make sure the product exists (assert 200 on shop or details) before deleting it and asserting it is gone.

6. API State Leakage (tier2_boundary.js):
   - Ensure that `T2.2.3` (very long password) restores the default password on completion or failure using a try-finally block.

7. Dummy Assertions & Fallback verification:
   - In `T2.5.5`, ensure the product is added to the cart *before* deleting it.
   - In `T4.5` (Database Fallback), simulate the Firebase database connection failure condition (e.g. by setting invalid Firebase config/environment variables or bypassing/mocking the Firebase config check so it forces JSON fallback), and verify that it loads products successfully from the local JSON database.

8. Verify the E2E tests:
   - Run `npm run test:e2e` to verify the runner executes, fails properly on unimplemented endpoints, and cleans up cleanly.
   - Run `npm run lint` and `npm run build` to ensure the project compiles and linting passes without any errors.

Write a self-contained handoff.md in c:\Users\sri charan\Documents\projects\crochett-and-co\.agents\worker_e2e_2\ upon completion, and send a message back to the orchestrator (conversation ID: 1389ab46-2d2f-4047-af43-1879d5e4102e).

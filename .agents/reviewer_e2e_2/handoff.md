# Handoff Report — E2E Test Suite Quality Review

## 1. Observation
- **Process termination leaks**:
  - We ran `npm run test:e2e` inside `c:\Users\sri charan\Documents\projects\crochett-and-co`.
  - The runner crashed or exited with code 1.
  - Subsequently, running the command again failed with:
    `Error: listen EADDRINUSE: address already in use :::3001`
  - Running `netstat -ano | findstr :3001` revealed:
    `TCP    0.0.0.0:3001           0.0.0.0:0              LISTENING       8572`
  - Checking the PID `8572` using `tasklist /fi "PID eq 8572"` confirmed it was `node.exe`.
  - In `e2e-tests/helpers.js` (lines 49–78):
    ```javascript
    function killServer(childProcess) {
      if (!childProcess) return;
      ...
      if (process.platform === 'win32') {
        try {
          const { execSync } = require('node:child_process');
          execSync(`taskkill /pid ${childProcess.pid} /t /f`, { stdio: 'ignore' });
        } catch {
          try {
            childProcess.kill('SIGKILL');
          } catch {}
        }
      } else {
        try {
          process.kill(-childProcess.pid, 'SIGTERM');
        } catch {
          try {
            childProcess.kill('SIGTERM');
          } catch {}
        }
      }
    }
    ```
  - Spawning the dev server in `runner.js` uses `shell: true`:
    ```javascript
    devServerProcess = spawn('npx', ['next', 'dev', '-p', '3001'], {
      shell: true,
      stdio: 'inherit'
    });
    ```
- **Backup overwrite risk**:
  - In `e2e-tests/helpers.js` (lines 200–209):
    ```javascript
    function backupDataFiles() {
      console.log('Backing up local data files...');
      for (const relPath of FILES_TO_BACKUP) {
        const absPath = path.resolve(process.cwd(), relPath);
        if (fs.existsSync(absPath)) {
          const content = fs.readFileSync(absPath, 'utf8');
          backupStore[relPath] = content;
          // Write a backup copy file as safety
          fs.writeFileSync(absPath + '.bak', content, 'utf8');
    ```
  - The backup is physically written next to the original files in `src/lib/data/` as `.bak` files.
- **Cookie Tracking implementation**:
  - In `e2e-tests/helpers.js` (lines 111–114 in `httpClient.request`):
    ```javascript
    const setCookieHeader = res.headers.get('set-cookie');
    if (setCookieHeader) {
      this.cookie = setCookieHeader;
    }
    ```
  - The client then sends this exact string back in outgoing requests (lines 91–93):
    ```javascript
    if (this.cookie) {
      headers['Cookie'] = this.cookie;
    }
    ```
- **Dummy assertions**:
  - In `e2e-tests/suites/tier2_boundary.js` (lines 275–278 in `T2.5.5`):
    ```javascript
    // T2.5.5: Cart/wishlist deletion fallback
    // Verify cart page loads without errors even if a referenced product is deleted.
    const cartRes = await httpClient.get(`${baseUrl}/cart`);
    ctx.assert(cartRes.status === 200, 'T2.5.5: Cart page handles deleted product gracefully and loads successfully');
    ```

---

## 2. Logic Chain
1. Spawning `npx` via `spawn('npx', ..., { shell: true })` creates a nested child process structure (shell -> npx -> node next dev -> next worker).
2. On POSIX, because the process group is not detached (`detached: true` is not set), `process.kill(-childProcess.pid, 'SIGTERM')` throws `ESRCH`. It falls back to `childProcess.kill('SIGTERM')`, which only terminates the wrapper shell, leaving the Next.js process tree running as orphans.
3. On Windows, if `taskkill` is missing or fails (or if signals are bypassed), the fallback `childProcess.kill('SIGKILL')` only kills the shell, leaving `node.exe` running.
4. This results in zombie processes listening on port 3001, blocking subsequent test runs.
5. In the backup mechanism, the runner unconditionally writes to `.bak` files at startup. If a previous run was abruptly aborted and left the databases contaminated with test products, starting a new runner will read the contaminated live files and write them to the `.bak` file, permanently destroying the original clean backup.
6. The `httpClient` stores the raw `Set-Cookie` header (including parameters like `Path=/; HttpOnly`) and injects it verbatim into the outgoing `Cookie` request header. This is non-RFC-compliant and can cause session decoding failures on the server.
7. Furthermore, since `this.cookie` is a single string rather than a map, any response setting a secondary cookie (e.g. a tracking cookie or CSRF token) will overwrite and destroy the session cookie.
8. Test `T2.5.5` purports to verify cart behavior with deleted products but loads the cart page empty, completely failing to test the desired integration scenario.

---

## 3. Caveats
- The review was performed while the application backend endpoints `/api/auth/login` and `/api/products` are not yet implemented (they currently return 404). Thus, the exact behavior of the server in parsing the non-standard `Cookie` request header could not be verified dynamically against the actual implementation, but is inferred based on standard Node.js/Next.js/Express HTTP parsing libraries.

---

## 4. Conclusion
The E2E test suite (`runner.js`, `helpers.js`, `suites/*`) contains **critical bugs and design deficiencies** that must be resolved before proceeding to Milestone M2/M3:
- A verdict of **REQUEST_CHANGES** is issued.
- The process spawning/termination mechanism must be rewritten to avoid orphaned zombie processes.
- The backup/restore mechanism must protect original `.bak` files from being overwritten by contaminated data upon runner start.
- The cookie tracking client must be refactored to parse/store cookie maps and send only valid name-value pairs, preventing session loss when multiple cookies are present.

---

## 5. Verification Method
- **To reproduce the zombie process leak**:
  1. Force-terminate the test runner (e.g., via Ctrl+C or sending SIGINT) during the wait period.
  2. Run `netstat -ano | findstr :3001` to confirm that the `node.exe` process is still listening on port 3001.
- **To verify backup overwrite bug**:
  1. Manually corrupt `src/lib/data/live_products.json` by adding a dummy item.
  2. Run `npm run test:e2e` and cancel it immediately.
  3. Verify that `live_products.json.bak` now contains the corrupted/contaminated product list instead of the clean list.
- **Project Test Execution**:
  - Run the test suite using `npm run test:e2e`.

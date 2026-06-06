const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');

// 1. waitForServer: Wait for the server on 127.0.0.1:<port>
async function waitForServer(port, timeoutMs = 20000) {
  const startTime = Date.now();
  console.log(`Waiting for server on port ${port}...`);
  while (Date.now() - startTime < timeoutMs) {
    const connected = await new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(400);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, '127.0.0.1');
    });

    if (connected) {
      console.log(`Server connected via TCP socket on port ${port}.`);
      return true;
    }

    try {
      const res = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(400) });
      if (res.status) {
        console.log(`Server responded via HTTP fetch on port ${port}.`);
        return true;
      }
    } catch {
      // Ignored
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timeout waiting for server on port ${port} after ${timeoutMs}ms`);
}

// 2. killServer: Clean process tree termination (supports Windows taskkill and Unix standard SIGTERM)
function killServer(childProcess) {
  if (!childProcess) return;
  console.log(`Terminating server process tree for PID ${childProcess.pid}...`);
  if (process.platform === 'win32') {
    try {
      const { execSync } = require('node:child_process');
      execSync(`taskkill /pid ${childProcess.pid} /t /f`, { stdio: 'ignore' });
      console.log(`Process tree for PID ${childProcess.pid} terminated via taskkill.`);
    } catch {
      try {
        childProcess.kill('SIGKILL');
        console.log(`Fallback kill (SIGKILL) executed for PID ${childProcess.pid}.`);
      } catch {
        // Ignored
      }
    }
  } else {
    try {
      process.kill(-childProcess.pid, 'SIGTERM');
      console.log(`Process group for PID ${childProcess.pid} terminated via SIGTERM.`);
    } catch {
      try {
        childProcess.kill('SIGTERM');
        console.log(`Fallback kill (SIGTERM) executed for PID ${childProcess.pid}.`);
      } catch {
        // Ignored
      }
    }
  }
}

// 3. httpClient: HTTP client wrapper for GET, POST, PUT, DELETE requests using global fetch
const httpClient = {
  cookie: '',
  setCookie(cookieStr) {
    this.cookie = cookieStr || '';
  },
  clearCookie() {
    this.cookie = '';
  },
  async request(method, url, options = {}) {
    const headers = { ...options.headers };
    if (this.cookie) {
      headers['Cookie'] = this.cookie;
    }

    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof URLSearchParams)) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }

    const { body: _, ...restOptions } = options;
    const fetchOptions = {
      method,
      headers,
      body,
      ...restOptions
    };

    const res = await fetch(url, fetchOptions);

    // Extract and store session cookie automatically if returned
    const setCookieHeader = res.headers.get('set-cookie');
    if (setCookieHeader) {
      this.cookie = setCookieHeader;
    }

    const contentType = res.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    return {
      status: res.status,
      headers: res.headers,
      data
    };
  },
  get(url, options) {
    return this.request('GET', url, options);
  },
  post(url, body, options) {
    return this.request('POST', url, { ...options, body });
  },
  put(url, body, options) {
    return this.request('PUT', url, { ...options, body });
  },
  delete(url, options) {
    return this.request('DELETE', url, options);
  }
};

// 4. login: Authenticates against /api/auth/login and extracts session cookie
async function login(baseUrl, username, password) {
  httpClient.clearCookie();
  const url = `${baseUrl}/api/auth/login`;
  try {
    // Send both username/email to match whatever field name the endpoint expects
    const res = await httpClient.post(url, { username, email: username, password });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      httpClient.setCookie(setCookie);
      return setCookie;
    }
    return null;
  } catch (err) {
    console.error(`Login request error: ${err.message}`);
    return null;
  }
}

// 5. TestSuiteContext: Assertion manager
class TestSuiteContext {
  constructor(suiteName) {
    this.suiteName = suiteName;
    this.totalAssertions = 0;
    this.passedAssertions = 0;
    this.failedAssertions = 0;
    this.failures = [];
  }

  assert(condition, message) {
    this.totalAssertions++;
    if (condition) {
      this.passedAssertions++;
    } else {
      this.failedAssertions++;
      const stack = new Error().stack;
      this.failures.push({ message, stack });
      console.error(`  [FAIL] ${message}`);
    }
  }

  assertEquiv(actual, expected, message) {
    const isEquiv = JSON.stringify(actual) === JSON.stringify(expected);
    this.assert(isEquiv, `${message} (Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)})`);
  }
}

// 6. Backup/Restore for fallback JSON files
const FILES_TO_BACKUP = [
  'src/lib/data/live_products.json',
  'src/lib/data/live_categories.json',
  'src/lib/data/admin_config.json'
];

const backupStore = {};

function backupDataFiles() {
  console.log('Backing up local data files...');
  for (const relPath of FILES_TO_BACKUP) {
    const absPath = path.resolve(process.cwd(), relPath);
    if (fs.existsSync(absPath)) {
      const content = fs.readFileSync(absPath, 'utf8');
      backupStore[relPath] = content;
      // Write a backup copy file as safety
      fs.writeFileSync(absPath + '.bak', content, 'utf8');
      console.log(`  Backed up: ${relPath} (size: ${content.length} bytes)`);
    } else {
      backupStore[relPath] = null;
      console.log(`  No file found to backup: ${relPath}`);
    }
  }
}

function restoreDataFiles() {
  console.log('Restoring local data files...');
  for (const relPath of FILES_TO_BACKUP) {
    const absPath = path.resolve(process.cwd(), relPath);
    const bakPath = absPath + '.bak';

    if (fs.existsSync(bakPath)) {
      const content = fs.readFileSync(bakPath, 'utf8');
      fs.writeFileSync(absPath, content, 'utf8');
      try {
        fs.unlinkSync(bakPath);
      } catch {
        // Ignored
      }
      console.log(`  Restored from physical backup: ${relPath}`);
    } else if (backupStore[relPath] !== undefined) {
      const content = backupStore[relPath];
      if (content !== null) {
        fs.writeFileSync(absPath, content, 'utf8');
        console.log(`  Restored from memory backup: ${relPath}`);
      } else {
        if (fs.existsSync(absPath)) {
          try {
            fs.unlinkSync(absPath);
          } catch {
            // Ignored
          }
          console.log(`  Deleted temporary file created during run: ${relPath}`);
        }
      }
    }
  }
}

module.exports = {
  waitForServer,
  killServer,
  httpClient,
  login,
  TestSuiteContext,
  backupDataFiles,
  restoreDataFiles
};

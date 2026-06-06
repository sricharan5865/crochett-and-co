const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const net = require('net');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const WORKSPACE_DIR = __dirname;
const PRISTINE_DIR = path.join(WORKSPACE_DIR, 'pristine_backup');

const DATA_FILES = [
  'src/lib/data/live_products.json',
  'src/lib/data/live_categories.json',
  'src/lib/data/admin_config.json'
];

// Help helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. Pristine backup
function backupToPristine() {
  console.log('=== Step 1: Creating Pristine Backup ===');
  if (!fs.existsSync(PRISTINE_DIR)) {
    fs.mkdirSync(PRISTINE_DIR);
  }
  for (const file of DATA_FILES) {
    const src = path.join(PROJECT_ROOT, file);
    const dest = path.join(PRISTINE_DIR, path.basename(file));
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  Saved pristine copy of ${file}`);
    } else {
      console.log(`  Warning: Pristine file ${file} does not exist!`);
    }
  }
}

// Restore from pristine
function restoreFromPristine() {
  console.log('=== Restoring Workspace to Pristine State ===');
  for (const file of DATA_FILES) {
    const dest = path.join(PROJECT_ROOT, file);
    const src = path.join(PRISTINE_DIR, path.basename(file));
    const bak = dest + '.bak';
    
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  Restored ${file}`);
    }
    if (fs.existsSync(bak)) {
      try {
        fs.unlinkSync(bak);
        console.log(`  Removed leftover backup file: ${bak}`);
      } catch (err) {
        console.error(`  Failed to remove ${bak}:`, err.message);
      }
    }
  }
}

// Check if port 3001 is listening and return PID if so (Windows specific)
function getPort3001Pid() {
  try {
    const output = execSync('netstat -ano', { encoding: 'utf8' });
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes(':3001') && line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        return parseInt(pid, 10);
      }
    }
  } catch (err) {
    // Ignored
  }
  return null;
}

// Kill a process forcefully by PID
function killPid(pid) {
  if (!pid) return;
  console.log(`  Killing process PID ${pid}...`);
  try {
    execSync(`taskkill /pid ${pid} /t /f`, { stdio: 'ignore' });
    console.log(`  Process ${pid} killed successfully.`);
  } catch (err) {
    console.log(`  Failed to kill process ${pid} via taskkill (might be already dead).`);
  }
}

// Run Experiment 1: Data Loss Vulnerability due to unsafe backup overwrite
async function runExperiment1() {
  console.log('\n=== Experiment 1: Data Loss / Overwrite Backup Vulnerability ===');
  restoreFromPristine();

  // Verify no .bak files exist
  for (const file of DATA_FILES) {
    const bak = path.join(PROJECT_ROOT, file + '.bak');
    if (fs.existsSync(bak)) {
      throw new Error(`Cleanup failed: leftover .bak file ${bak} still exists!`);
    }
  }

  // 1. Spawn runner (First Run)
  console.log('1. Starting E2E Runner (First Run)...');
  const runner1 = spawn('node', ['e2e-tests/runner.js'], {
    cwd: PROJECT_ROOT,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Wait for runner to perform backup
  let backupDone = false;
  runner1.stdout.on('data', (data) => {
    const str = data.toString();
    if (str.includes('Spawning Next.js dev server') || str.includes('Waiting for server')) {
      backupDone = true;
    }
  });

  const startTime = Date.now();
  while (!backupDone && Date.now() - startTime < 10000) {
    await sleep(200);
  }

  if (!backupDone) {
    runner1.kill('SIGKILL');
    throw new Error('Timeout waiting for runner to start and perform backup.');
  }

  console.log('  Runner has created backups. Now forcefully killing the runner (simulating abnormal exit/crash)...');
  
  // Force kill the runner
  runner1.kill('SIGKILL');
  await sleep(1000);

  // Verify .bak files are left behind
  const productFile = path.join(PROJECT_ROOT, 'src/lib/data/live_products.json');
  const productBak = productFile + '.bak';
  
  if (!fs.existsSync(productBak)) {
    throw new Error(`Vulnerability test failed: live_products.json.bak was not left behind on abnormal exit.`);
  }
  console.log('  Confirmed: .bak files left on disk.');

  // Clean up any orphaned dev server from this first run to prevent port conflicts
  const orphanedPid = getPort3001Pid();
  if (orphanedPid) {
    console.log(`  Found orphaned dev server with PID ${orphanedPid} from first run.`);
    killPid(orphanedPid);
  }

  // 2. Simulate dirty data file modifications (e.g. test runner added fake test products)
  console.log('2. Simulating dirty changes to live_products.json...');
  const dirtyContent = JSON.stringify([{ id: "dirty-e2e-test-product", name: "DIRTY PRODUCT DO NOT SAVE" }], null, 2);
  fs.writeFileSync(productFile, dirtyContent, 'utf8');

  // 3. Start E2E Runner again (Second Run)
  console.log('3. Starting E2E Runner (Second Run) while dirty files and .bak are present...');
  const runner2 = spawn('node', ['e2e-tests/runner.js'], {
    cwd: PROJECT_ROOT,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  backupDone = false;
  runner2.stdout.on('data', (data) => {
    const str = data.toString();
    if (str.includes('Spawning Next.js dev server') || str.includes('Waiting for server')) {
      backupDone = true;
    }
  });

  const startTime2 = Date.now();
  while (!backupDone && Date.now() - startTime2 < 10000) {
    await sleep(200);
  }

  if (!backupDone) {
    runner2.kill('SIGKILL');
    throw new Error('Timeout waiting for second runner to start.');
  }

  console.log('  Second runner started and performed backup. Killing second runner...');
  runner2.kill('SIGKILL');
  await sleep(1000);

  // Clean up any orphaned dev server from second run
  const orphanedPid2 = getPort3001Pid();
  if (orphanedPid2) {
    killPid(orphanedPid2);
  }

  // 4. Inspect backup file content
  console.log('4. Inspecting the content of the backup file live_products.json.bak...');
  const backupContent = fs.readFileSync(productBak, 'utf8');
  if (backupContent.includes('DIRTY PRODUCT DO NOT SAVE')) {
    console.log('  [BUG CONFIRMED] The backup file live_products.json.bak was overwritten with dirty content!');
    console.log('  Original data is permanently lost because the runner did not check if a backup already existed.');
  } else {
    console.log('  [PASS] Backup file was not overwritten with dirty content.');
  }
}

// Run Experiment 2: Orphaned Next.js dev server / Process Leak
async function runExperiment2() {
  console.log('\n=== Experiment 2: Process Leak / Orphaned Dev Server ===');
  restoreFromPristine();

  // Make sure port 3001 is clear
  const initialPid = getPort3001Pid();
  if (initialPid) {
    console.log(`  Port 3001 is already bound to PID ${initialPid}. Cleaning up first.`);
    killPid(initialPid);
    await sleep(1000);
  }

  // Spawn runner
  console.log('1. Spawning E2E Runner...');
  const runner = spawn('node', ['e2e-tests/runner.js'], {
    cwd: PROJECT_ROOT,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Wait for the server to be ready
  let serverReady = false;
  runner.stdout.on('data', (data) => {
    const str = data.toString();
    if (str.includes('Server connected via TCP socket')) {
      serverReady = true;
    }
  });

  console.log('  Waiting for server to start...');
  const startTime = Date.now();
  while (!serverReady && Date.now() - startTime < 35000) {
    await sleep(500);
  }

  if (!serverReady) {
    runner.kill('SIGKILL');
    throw new Error('Timeout waiting for Next.js dev server to start.');
  }

  console.log('  Dev server is up and listening on port 3001.');
  const runnerPid = runner.pid;
  console.log(`  Runner process PID is ${runnerPid}.`);

  // Forcefully terminate the runner process (simulating a crash or force-kill)
  console.log('2. Forcefully killing the runner process (simulating abnormal termination of runner)...');
  killPid(runnerPid);
  await sleep(2000);

  // Check if port 3001 is still bound
  const leakedPid = getPort3001Pid();
  if (leakedPid) {
    console.log(`  [BUG CONFIRMED] Next.js dev server (PID ${leakedPid}) is still running and listening on port 3001!`);
    console.log('  The process leaked and became an orphan after the runner terminated.');
    
    // Clean up
    killPid(leakedPid);
  } else {
    console.log('  [PASS] Next.js dev server was cleaned up or port 3001 was freed.');
  }
}

async function main() {
  try {
    backupToPristine();
    await runExperiment1();
    await runExperiment2();
  } catch (err) {
    console.error('Test execution failed with error:', err);
  } finally {
    restoreFromPristine();
    console.log('\nVerification completed.');
  }
}

main();

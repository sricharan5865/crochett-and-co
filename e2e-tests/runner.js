const { spawn } = require('node:child_process');
const { waitForServer, killServer, backupDataFiles, restoreDataFiles } = require('./helpers');

let devServerProcess = null;

async function main() {
  console.log('Starting E2E test runner...');
  let allPassed = true;

  // 1. Backup existing local data files
  backupDataFiles();

  // Setup signal and exit handlers for guaranteed cleanup and restore
  const cleanupAndExit = (exitCode) => {
    if (devServerProcess) {
      console.log('Cleaning up server process...');
      killServer(devServerProcess);
      devServerProcess = null;
    }
    restoreDataFiles();
    console.log(`Exiting test runner with code: ${exitCode}`);
    process.exit(exitCode);
  };

  process.on('SIGINT', () => {
    console.log('\n[Runner] Interrupted by SIGINT. Running cleanup...');
    cleanupAndExit(130);
  });

  process.on('SIGTERM', () => {
    console.log('\n[Runner] Interrupted by SIGTERM. Running cleanup...');
    cleanupAndExit(143);
  });

  process.on('uncaughtException', (err) => {
    console.error('\n[Runner] Uncaught Exception:', err);
    cleanupAndExit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('\n[Runner] Unhandled Rejection:', reason);
    cleanupAndExit(1);
  });

  try {
    // 2. Spawn Next.js dev server on port 3001
    console.log('Spawning Next.js dev server on port 3001...');
    devServerProcess = spawn('npx', ['next', 'dev', '-p', '3001'], {
      shell: true,
      stdio: 'inherit'
    });

    // 3. Wait for the server to be ready
    await waitForServer(3001, 30000);

    const baseUrl = 'http://127.0.0.1:3001';

    // 4. Require the suites
    const tier1 = require('./suites/tier1_feature');
    const tier2 = require('./suites/tier2_boundary');
    const tier3 = require('./suites/tier3_cross');
    const tier4 = require('./suites/tier4_realworld');

    const contexts = [];

    console.log('\n==================================================');
    console.log('             Executing Test Suites                ');
    console.log('==================================================');

    // Run T1
    console.log('\n[Suite] Running Tier 1: Feature Coverage');
    try {
      const ctx1 = await tier1.run(baseUrl);
      contexts.push(ctx1);
      if (ctx1.failedAssertions > 0) allPassed = false;
    } catch (err) {
      console.error('Tier 1 suite failed to execute to completion:', err);
      allPassed = false;
      contexts.push({ suiteName: 'Tier 1: Feature Coverage', totalAssertions: 1, passedAssertions: 0, failedAssertions: 1, failures: [{ message: err.message, stack: err.stack }] });
    }

    // Run T2
    console.log('\n[Suite] Running Tier 2: Boundary & Corner Cases');
    try {
      const ctx2 = await tier2.run(baseUrl);
      contexts.push(ctx2);
      if (ctx2.failedAssertions > 0) allPassed = false;
    } catch (err) {
      console.error('Tier 2 suite failed to execute to completion:', err);
      allPassed = false;
      contexts.push({ suiteName: 'Tier 2: Boundary & Corner Cases', totalAssertions: 1, passedAssertions: 0, failedAssertions: 1, failures: [{ message: err.message, stack: err.stack }] });
    }

    // Run T3
    console.log('\n[Suite] Running Tier 3: Cross-Feature Combinations');
    try {
      const ctx3 = await tier3.run(baseUrl);
      contexts.push(ctx3);
      if (ctx3.failedAssertions > 0) allPassed = false;
    } catch (err) {
      console.error('Tier 3 suite failed to execute to completion:', err);
      allPassed = false;
      contexts.push({ suiteName: 'Tier 3: Cross-Feature Combinations', totalAssertions: 1, passedAssertions: 0, failedAssertions: 1, failures: [{ message: err.message, stack: err.stack }] });
    }

    // Run T4
    console.log('\n[Suite] Running Tier 4: Real-World Scenarios');
    try {
      const ctx4 = await tier4.run(baseUrl);
      contexts.push(ctx4);
      if (ctx4.failedAssertions > 0) allPassed = false;
    } catch (err) {
      console.error('Tier 4 suite failed to execute to completion:', err);
      allPassed = false;
      contexts.push({ suiteName: 'Tier 4: Real-World Scenarios', totalAssertions: 1, passedAssertions: 0, failedAssertions: 1, failures: [{ message: err.message, stack: err.stack }] });
    }

    // 5. Print aggregate report
    console.log('\n==================================================');
    console.log('             E2E Test Execution Summary           ');
    console.log('==================================================');

    let totalAsserts = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    for (const ctx of contexts) {
      console.log(`\n${ctx.suiteName}:`);
      console.log(`  Total Assertions: ${ctx.totalAssertions}`);
      console.log(`  Passed:           ${ctx.passedAssertions}`);
      console.log(`  Failed:           ${ctx.failedAssertions}`);
      totalAsserts += ctx.totalAssertions;
      totalPassed += ctx.passedAssertions;
      totalFailed += ctx.failedAssertions;
    }

    console.log('\n==================================================');
    console.log(`Total Executed Assertions: ${totalAsserts}`);
    console.log(`Total Passed Assertions:   ${totalPassed}`);
    console.log(`Total Failed Assertions:   ${totalFailed}`);
    console.log('==================================================');

    if (totalFailed > 0) {
      console.log('\n--- DETAILED FAILURES ---');
      for (const ctx of contexts) {
        if (ctx.failures && ctx.failures.length > 0) {
          console.log(`\nIn ${ctx.suiteName}:`);
          for (const fail of ctx.failures) {
            console.error(`  - ${fail.message}`);
            if (fail.stack) {
              const lines = fail.stack.split('\n').slice(0, 3).join('\n');
              console.error(lines);
            }
          }
        }
      }
      allPassed = false;
    } else {
      console.log('\n🏆 ALL TESTS PASSED SUCCESSFULLY!');
    }

    cleanupAndExit(allPassed ? 0 : 1);
  } catch (err) {
    console.error('Fatal error encountered during runner execution:', err);
    cleanupAndExit(1);
  }
}

if (require.main === module) {
  main();
}

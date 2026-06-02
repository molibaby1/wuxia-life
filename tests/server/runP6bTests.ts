import { runP6bUnitTests } from './runP6bUnitTests.js';
import { requireDatabaseUrl, runP6bDbTests } from './runP6bDbTests.js';

async function main(): Promise<void> {
  runP6bUnitTests();
  const databaseUrl = requireDatabaseUrl();
  await runP6bDbTests(databaseUrl);
  console.log('P6B server tests passed');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

/**
 * Headless unit test entry (P5 US-020).
 */

import { runRandomSourceTests } from './randomSource.test';
import { runTimeSourceTests } from './timeSource.test';
import { runCatalogAdapterTests } from './catalogAdapter.test';
import { runSnapshotAdapterTests } from './snapshotAdapter.test';
import { runHeadlessSessionTests } from './headlessSession.test';
import { runCatalogVersionPinningTests } from './catalogVersionPinning.test';
import { runParityHarnessTests } from './parityHarness.test';

async function main(): Promise<void> {
  runRandomSourceTests();
  runTimeSourceTests();
  runCatalogAdapterTests();
  runSnapshotAdapterTests();
  runCatalogVersionPinningTests();
  await runHeadlessSessionTests();
  runParityHarnessTests();
  console.log('headless test suite: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

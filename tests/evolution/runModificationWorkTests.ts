import { runModificationWorkContractTests } from './modificationWorkContract.test';
import { runModificationWorkSourceTests } from './modificationWorkSource.test';
import { runDeepSeekModificationWorkTests } from './deepseekModificationWork.test';
import { runModificationWorkLoopTests } from './modificationWorkLoop.test';
import { runInvestigationHandoffTests } from './investigationHandoff.test';
import { runModificationWorkV2LoopTests } from './modificationWorkV2Loop.test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

async function main(): Promise<void> {
  const harnessSource = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../../scripts/evolution/runModificationWork.ts'),
    'utf8',
  );
  assert.equal(
    /\brunPhase0\b/.test(harnessSource),
    false,
    'modification work harness must not import or call runPhase0',
  );

  runInvestigationHandoffTests();
  runModificationWorkContractTests();
  await runModificationWorkSourceTests();
  await runDeepSeekModificationWorkTests();
  await runModificationWorkLoopTests();
  await runModificationWorkV2LoopTests();
  console.log('Modification work tests: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

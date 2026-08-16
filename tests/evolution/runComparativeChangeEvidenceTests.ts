import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runComparativeFeedbackContractTests } from './comparativeFeedbackContract.test';
import { runDeepSeekComparativeExperienceFeedbackTests } from './deepseekComparativeExperienceFeedback.test';
import { runComparativeChangeEvidenceLoopTests } from './comparativeChangeEvidenceLoop.test';

async function main(): Promise<void> {
  const harnessSource = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../../scripts/evolution/runComparativeChangeEvidence.ts'),
    'utf8',
  );
  assert.equal(
    /\brunPhase0\b/.test(harnessSource),
    false,
    'comparative harness must not import or call runPhase0',
  );

  runComparativeFeedbackContractTests();
  await runDeepSeekComparativeExperienceFeedbackTests();
  await runComparativeChangeEvidenceLoopTests();
  console.log('Comparative change evidence tests: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

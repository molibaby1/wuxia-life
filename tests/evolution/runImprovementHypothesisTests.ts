import { runImprovementHypothesisContractTests } from './improvementHypothesisContract.test';
import { runImprovementHypothesisSourceTests } from './improvementHypothesisSource.test';
import { runDeepSeekImprovementHypothesisTests } from './deepseekImprovementHypothesis.test';
import { runImprovementHypothesisLoopTests } from './improvementHypothesisLoop.test';

async function main(): Promise<void> {
  runImprovementHypothesisContractTests();
  await runImprovementHypothesisSourceTests();
  await runDeepSeekImprovementHypothesisTests();
  await runImprovementHypothesisLoopTests();
  console.log('Improvement hypothesis successor tests: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

import { runExternalFeedbackContractTests } from './externalFeedbackContract.test';
import { runDeepSeekPlayerExperienceFeedbackTests } from './deepseekPlayerExperienceFeedback.test';
import { runMinimalExternalFeedbackLoopTests } from './minimalExternalFeedbackLoop.test';

async function main(): Promise<void> {
  runExternalFeedbackContractTests();
  await runDeepSeekPlayerExperienceFeedbackTests();
  await runMinimalExternalFeedbackLoopTests();
  console.log('Minimal external feedback tests: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

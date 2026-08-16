import { runHypothesisInvestigationContractTests } from './hypothesisInvestigationContract.test';
import { runHypothesisInvestigationSourceTests } from './hypothesisInvestigationSource.test';
import { runHypothesisInvestigationEvidenceTests } from './hypothesisInvestigationEvidence.test';
import { runDeepSeekHypothesisInvestigationTests } from './deepseekHypothesisInvestigation.test';
import { runHypothesisInvestigationLoopTests } from './hypothesisInvestigationLoop.test';
import { runCrossRunCohortInvestigationTests } from './crossRunCohortInvestigation.test';

async function main(): Promise<void> {
  runHypothesisInvestigationContractTests();
  await runHypothesisInvestigationSourceTests();
  await runHypothesisInvestigationEvidenceTests();
  await runDeepSeekHypothesisInvestigationTests();
  await runHypothesisInvestigationLoopTests();
  await runCrossRunCohortInvestigationTests();
  console.log('Hypothesis investigation successor tests: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

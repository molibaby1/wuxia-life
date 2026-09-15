import { runBoundedSourceTransitionTests } from './boundedSourceTransition.test';
import { runCandidateHumanFollowupRetentionTests } from './candidateHumanFollowupRetention.test';
import { runCandidateLaneTests } from './candidateLane.test';
import { runCandidatePoolContractTests } from './candidatePoolContract.test';
import { runCandidateReviewContinuationTests } from './candidateReviewContinuation.test';
import { runCandidateSelectionRetirementTests } from './candidateSelectionRetirement.test';
import { runCandidateSessionReconciliationTests } from './candidateSessionReconciliation.test';
import { runCandidateSessionStoreTests } from './candidateSessionStore.test';
import { runCandidateSliceBudgetTests } from './candidateSliceBudget.test';
import { runMultiCandidateHumanReviewSummaryTests } from './multiCandidateHumanReviewSummary.test';
import { runMultiCandidateOperationalIndexTests } from './multiCandidateOperationalIndex.test';
import { runMultiCandidateOperationalRunReportTests } from './multiCandidateOperationalRunReport.test';
import { runMultiCandidateOrdinaryEvolutionOperatorTests } from './multiCandidateOrdinaryEvolutionOperator.test';
import { runMultiCandidateReportArchiveTests } from './multiCandidateReportArchive.test';
import { runMultiCandidateSessionManifestContractTests } from './multiCandidateSessionManifestContract.test';
import { runMultiCandidateSessionSliceTests } from './multiCandidateSessionSlice.test';
import { runMultiCandidateTerminalEvidenceTests } from './multiCandidateTerminalEvidence.test';
import { runSourceCandidateAnalysisTests } from './sourceCandidateAnalysis.test';
import { runSourceCandidatePoolTests } from './sourceCandidatePool.test';

export async function runMultiCandidateSessionAcceptanceTests(): Promise<void> {
  await runCandidatePoolContractTests();
  await runMultiCandidateSessionManifestContractTests();
  await runSourceCandidateAnalysisTests();
  await runCandidateLaneTests();
  await runSourceCandidatePoolTests();
  await runCandidateSessionStoreTests();
  runCandidateSliceBudgetTests();
  await runCandidateReviewContinuationTests();
  await runCandidateHumanFollowupRetentionTests();
  await runBoundedSourceTransitionTests();
  await runMultiCandidateSessionSliceTests();
  await runCandidateSessionReconciliationTests();
  await runMultiCandidateOrdinaryEvolutionOperatorTests();
  await runMultiCandidateOperationalRunReportTests();
  await runMultiCandidateReportArchiveTests();
  runMultiCandidateHumanReviewSummaryTests();
  await runMultiCandidateOperationalIndexTests();
  await runMultiCandidateTerminalEvidenceTests();
  await runCandidateSelectionRetirementTests();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMultiCandidateSessionAcceptanceTests().then(() => console.log('multiCandidateSessionAcceptance.test.ts: ok')).catch(error => { console.error(error); process.exit(1); });
}

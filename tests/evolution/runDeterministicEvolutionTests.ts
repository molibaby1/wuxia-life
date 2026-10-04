import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export interface DeterministicEvolutionSuite {
  name: string;
  entry: string;
  boundary: string;
}

export interface DeterministicEvolutionSuiteResult {
  name: string;
  entry: string;
  boundary: string;
  status: number | null;
}

export type DeterministicEvolutionChildRunner = (
  suite: DeterministicEvolutionSuite,
) => Promise<number | null>;

export const DETERMINISTIC_EVOLUTION_SUITES = [
  { name: 'candidatePoolContract', entry: 'tests/evolution/candidatePoolContract.test.ts', boundary: 'state-contract' },
  { name: 'candidateSessionStore', entry: 'tests/evolution/candidateSessionStore.test.ts', boundary: 'durable-storage' },
  { name: 'candidateSliceBudget', entry: 'tests/evolution/candidateSliceBudget.test.ts', boundary: 'session-orchestration' },
  { name: 'multiCandidateSessionManifestContract', entry: 'tests/evolution/multiCandidateSessionManifestContract.test.ts', boundary: 'durable-storage' },
  { name: 'candidateLaneFailureContract', entry: 'tests/evolution/candidateLaneFailureContract.test.ts', boundary: 'candidate-lane' },
  { name: 'sourceCandidateAnalysis', entry: 'tests/evolution/sourceCandidateAnalysis.test.ts', boundary: 'source-analysis' },
  { name: 'sourceCandidatePool', entry: 'tests/evolution/sourceCandidatePool.test.ts', boundary: 'source-analysis' },
  { name: 'candidateLane', entry: 'tests/evolution/candidateLane.test.ts', boundary: 'candidate-lane' },
  { name: 'candidateReviewContinuation', entry: 'tests/evolution/candidateReviewContinuation.test.ts', boundary: 'solution-review' },
  { name: 'candidateSessionReconciliation', entry: 'tests/evolution/candidateSessionReconciliation.test.ts', boundary: 'durable-storage' },
  { name: 'participantHardTimeoutPolicyV1', entry: 'tests/evolution/participantHardTimeoutPolicyV1.test.ts', boundary: 'participant-transport' },
  { name: 'participantFailureOutcomeContract', entry: 'tests/evolution/participantFailureOutcomeContract.test.ts', boundary: 'participant-transport' },
  { name: 'participantFailureRouting', entry: 'tests/evolution/participantFailureRouting.test.ts', boundary: 'participant-transport' },
  { name: 'structuredTerminalEnvelope', entry: 'tests/evolution/structuredTerminalEnvelope.test.ts', boundary: 'participant-transport' },
  { name: 'envelopeRetransmission', entry: 'tests/evolution/envelopeRetransmission.test.ts', boundary: 'participant-transport' },
  { name: 'referenceParticipantBinding', entry: 'tests/evolution/referenceParticipantBinding.test.ts', boundary: 'participant-transport' },
  { name: 'problemAgnosticSolutionContracts', entry: 'tests/evolution/problemAgnosticSolutionContracts.test.ts', boundary: 'solution-review' },
  { name: 'solutionAgentLoop', entry: 'tests/evolution/solutionAgentLoop.test.ts', boundary: 'solution-review' },
  { name: 'solutionReviewerLoop', entry: 'tests/evolution/solutionReviewerLoop.test.ts', boundary: 'solution-review' },
  { name: 'solutionDecisionRouter', entry: 'tests/evolution/solutionDecisionRouter.test.ts', boundary: 'solution-review' },
  { name: 'autonomousAuthoringContracts', entry: 'tests/evolution/autonomousAuthoringContracts.test.ts', boundary: 'autonomous-authoring' },
  { name: 'preschoolAutonomousAuthoringAdmission', entry: 'tests/evolution/preschoolAutonomousAuthoringAdmission.test.ts', boundary: 'autonomous-authoring' },
  { name: 'shadowAuthoringExecution', entry: 'tests/evolution/shadowAuthoringExecution.test.ts', boundary: 'autonomous-authoring' },
  { name: 'preschoolShadowAuthoringVerification', entry: 'tests/evolution/preschoolShadowAuthoringVerification.test.ts', boundary: 'autonomous-authoring' },
  { name: 'preschoolAutonomousAuthoringReferenceTrial', entry: 'tests/evolution/preschoolAutonomousAuthoringReferenceTrial.test.ts', boundary: 'autonomous-authoring' },
  { name: 'multiCandidateSessionSlice', entry: 'tests/evolution/multiCandidateSessionSlice.test.ts', boundary: 'session-orchestration' },
  { name: 'multiCandidateOrdinaryEvolutionOperator', entry: 'tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts', boundary: 'operator' },
  { name: 'ordinaryEvolutionOperator', entry: 'tests/evolution/ordinaryEvolutionOperator.test.ts', boundary: 'operator' },
] as const satisfies readonly DeterministicEvolutionSuite[];

export async function runDeterministicEvolutionSuites(
  suites: readonly DeterministicEvolutionSuite[],
  runChild: DeterministicEvolutionChildRunner,
): Promise<DeterministicEvolutionSuiteResult[]> {
  const results: DeterministicEvolutionSuiteResult[] = [];
  for (const suite of suites) {
    const status = await runChild(suite);
    results.push({ name: suite.name, entry: suite.entry, boundary: suite.boundary, status });
  }
  return results;
}

function runSuiteInChildProcess(suite: DeterministicEvolutionSuite): Promise<number | null> {
  return new Promise(resolveStatus => {
    let child;
    try {
      child = spawn('npm', ['exec', '--', 'tsx', suite.entry], { stdio: 'inherit' });
    } catch (error) {
      console.error(`[${suite.name}] failed to spawn npm:`, error);
      resolveStatus(null);
      return;
    }

    child.once('error', error => {
      console.error(`[${suite.name}] failed to spawn npm:`, error);
      resolveStatus(null);
    });
    child.once('close', code => resolveStatus(code));
  });
}

export async function runDeterministicEvolutionTests(): Promise<DeterministicEvolutionSuiteResult[]> {
  return runDeterministicEvolutionSuites(DETERMINISTIC_EVOLUTION_SUITES, async suite => {
    console.log(`\n=== Evolution suite: ${suite.name} [${suite.boundary}] ${suite.entry} ===`);
    return runSuiteInChildProcess(suite);
  });
}

async function main(): Promise<void> {
  const results = await runDeterministicEvolutionTests();
  const failures = results.filter(result => result.status !== 0);
  if (failures.length > 0) {
    console.error(`\nFailed deterministic evolution suites (${failures.length}/${results.length}):`);
    for (const failure of failures) {
      console.error(`- ${failure.name} [${failure.boundary}] ${failure.entry} (status: ${failure.status ?? 'spawn error or signal'})`);
    }
    process.exitCode = 1;
    return;
  }
  console.log(`\nAll ${results.length} deterministic evolution suites passed.`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  void main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

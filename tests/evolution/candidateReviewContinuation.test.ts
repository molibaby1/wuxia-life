import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateSolutionDecision } from '../../src/evolution/solutionDecisionContract';
import { runCandidateReviewContinuation } from '../../scripts/evolution/runCandidateReviewContinuation';
import type { WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';

const participant: WorkspaceAgentParticipantOptions = { executable: 'test-participant', buildArgs: () => [] };
function baseDecision(problemId: string): unknown {
  return {
    schemaVersion: 'solution-decision-v1', problemId, route: 'DEFER_MORE_WORK_REQUESTED', reasonCode: 'REVIEW_REQUEST_MORE_WORK',
    inputs: {
      solutionStatus: 'OPTIONS', reviewerDecision: 'REQUEST_MORE_WORK', solutionScope: 'configuration', reviewScope: 'config_only',
      permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false },
      budget: { actualParticipantJobs: 2, maxParticipantJobs: 4, retryCount: 0 },
    },
  };
}
function effectiveDecision(problemId: string): ReturnType<typeof validateSolutionDecision> {
  return validateSolutionDecision({
    schemaVersion: 'solution-decision-v1', problemId, route: 'SKIP', reasonCode: 'REVIEW_ACCEPT_NO_ACTION',
    inputs: {
      solutionStatus: 'OPTIONS', reviewerDecision: 'ACCEPT_NO_ACTION', solutionScope: 'configuration', reviewScope: 'config_only',
      permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false },
      budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 },
    },
  });
}

export async function runCandidateReviewContinuationTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'candidate-continuation-'));
  const h1 = join(root, 'h1');
  const h2 = join(root, 'h2');
  for (const lane of [h1, h2]) await mkdir(lane, { recursive: true });
  const calls: string[] = [];
  for (const [candidateRef, lane] of [['pool/hypothesis-000001', h1], ['pool/hypothesis-000002', h2]] as const) {
    const id = candidateRef.split('/').at(-1)!;
    const basePath = join(lane, 'decision.json');
    const packagePath = join(lane, 'problem-package.json');
    await writeFile(basePath, JSON.stringify(baseDecision(`problem-${id}`)));
    await writeFile(packagePath, JSON.stringify({ source: { runRef: 'cohort-run-000001' } }));
    const result = await runCandidateReviewContinuation({
      candidateRef,
      candidateLaneRoot: lane,
      baseDecisionPath: basePath,
      problemPackagePath: packagePath,
      sourceFingerprintSha256: 'a'.repeat(64),
      participant,
      dependencies: {
        runCandidateContinuation: async () => {
          calls.push(candidateRef);
          return {
            status: 'completed' as const,
            continuationRef: 'review-continuation-000001' as const,
            participantJobs: 1 as const,
            terminalRoute: 'SKIP' as const,
            terminalReasonCode: 'REVIEW_ACCEPT_NO_ACTION' as const,
            decision: effectiveDecision(`problem-${id}`),
            decisionPath: join(lane, 'review-continuation-000001/decision.json'),
            effectiveSolutionPath: join(lane, 'review-continuation-000001/solution-revision/result.json'),
            effectiveReviewPath: null,
          };
        },
      },
    });
    assert.equal(result.status, 'completed');
    if (result.status === 'completed') assert.equal(result.effectiveDecision.problemId, `problem-${id}`);
  }
  assert.deepEqual(calls, ['pool/hypothesis-000001', 'pool/hypothesis-000002']);
  const ordinaryLane = join(root, 'ordinary');
  await mkdir(ordinaryLane, { recursive: true });
  const ordinaryDecision = join(ordinaryLane, 'decision.json');
  const ordinaryPackage = join(ordinaryLane, 'problem-package.json');
  await writeFile(ordinaryDecision, JSON.stringify({
    schemaVersion: 'solution-decision-v1', problemId: 'problem-skip', route: 'SKIP', reasonCode: 'NO_PROPOSAL',
    inputs: { solutionStatus: 'NO_PROPOSAL', reviewerDecision: null, solutionScope: null, reviewScope: null, permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false }, budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 } },
  }));
  await writeFile(ordinaryPackage, JSON.stringify({ source: { runRef: 'cohort-run-000001' } }));
  const notRequested = await runCandidateReviewContinuation({ candidateRef: 'pool/hypothesis-000003', candidateLaneRoot: ordinaryLane, baseDecisionPath: ordinaryDecision, problemPackagePath: ordinaryPackage, sourceFingerprintSha256: 'a'.repeat(64), participant });
  assert.equal(notRequested.status, 'not_requested');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCandidateReviewContinuationTests()
    .then(() => console.log('candidateReviewContinuation.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { emptyMatchingPlayerSurfaceArtifacts } from '../../scripts/evolution/causalAttribution/emptyMatchingPlayerSurfaceArtifacts';
import { runCandidateLane } from '../../scripts/evolution/runCandidateLane';
import type { WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';

const participant: WorkspaceAgentParticipantOptions = { executable: 'test-participant', buildArgs: () => [] };

async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

export async function runCandidateLaneTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'candidate-lane-'));
  const sourceRoot = join(root, 'source-analysis');
  const laneRoot = join(root, 'candidates/hypothesis-000002');
  const sourceRunRef = 'cohort-run-000001';
  const surface = emptyMatchingPlayerSurfaceArtifacts();
  await mkdir(join(sourceRoot, 'source'), { recursive: true });
  await mkdir(join(sourceRoot, `feedback-runs/${sourceRunRef}`), { recursive: true });
  await mkdir(join(sourceRoot, `hypothesis-runs/${sourceRunRef}`), { recursive: true });
  await mkdir(join(sourceRoot, `game-runs/${sourceRunRef}/internal`), { recursive: true });
  await writeFile(join(sourceRoot, 'source/observable-payload.json'), surface.observableBytes);
  await writeFile(join(sourceRoot, `feedback-runs/${sourceRunRef}/feedback.json`), JSON.stringify({ overallImpression: 'Observed.', observations: [] }));
  await writeFile(join(sourceRoot, `hypothesis-runs/${sourceRunRef}/hypotheses.json`), JSON.stringify({ hypotheses: [] }));
  await writeFile(join(sourceRoot, `game-runs/${sourceRunRef}/internal/player-surface-source.json`), surface.surfaceBytes);
  const candidate = {
    hypothesisId: 'hypothesis-000002',
    hypothesis: 'The second candidate.',
    observedBasis: 'Observed in the second candidate evidence.',
    feedbackRefs: ['overallImpression'],
    evidenceRefs: [],
    unknowns: ['Cause remains unknown.'],
    productSignificance: 'It matters.',
  };
  let solutionContractPacket: unknown;
  const laneInput = {
    repositoryRoot: process.cwd(),
    sourceRoot,
    laneRoot,
    poolId: 'candidate-pool-test',
    candidateRef: 'candidate-pool-test/hypothesis-000002',
    candidate,
    sourceIndex: 1,
    hypothesisSetRef: `hypothesis-runs/${sourceRunRef}/hypotheses.json`,
    hypothesisSetSha256: 'a'.repeat(64),
    sourceRunRef,
    sourceExperimentRootHash: 'b'.repeat(64),
    sourceFingerprintSha256: 'c'.repeat(64),
    observablePayloadRef: 'source/observable-payload.json',
    externalFeedbackRef: `feedback-runs/${sourceRunRef}/feedback.json`,
    improvementHypothesisRef: `hypothesis-runs/${sourceRunRef}/hypotheses.json`,
    authorityRefs: ['docs/product/auto-evolution-model.md'],
    participant,
    participantMode: 'local-subagent',
    dependencies: {
      captureAuthoritativeFingerprint: async () => 'd'.repeat(64),
      runSolutionAgent: async input => {
        solutionContractPacket = input.autonomousAuthoringContractPacket;
        return {
          ok: true,
          result: {
          schemaVersion: 'solution-work-v1',
          problemId: 'problem-hypothesis-000002',
          status: 'INSUFFICIENT_EVIDENCE',
          options: [],
          summary: 'Evidence is insufficient.',
          repoRefs: [],
          artifactRefs: [],
          },
          invocationPath: join(input.destinationRoot, 'invocation.json'),
          rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
          resultPath: join(input.destinationRoot, 'result.json'),
        };
      },
      runSolutionReviewer: async () => {
        throw new Error('reviewer must not run for insufficient evidence');
      },
    },
  } as const;
  const result = await runCandidateLane(laneInput);
  assert.equal(result.status, 'completed');
  if (result.status !== 'completed') return;
  assert.equal(result.hypothesisId, 'hypothesis-000002');
  assert.equal(result.sourceIndex, 1);
  assert.equal(result.actualParticipantJobs, 1);
  assert.equal(result.decision.route, 'DEFER');
  assert.equal(result.effectiveSolutionPath, join(laneRoot, 'solution-agent/result.json'));
  assert.equal(result.effectiveReviewPath, null);
  assert.equal(result.autonomousAuthoringAdmissionPath, null);
  assert.equal(JSON.parse(await readFile(join(laneRoot, 'candidate-activation.json'), 'utf8')).hypothesisId, 'hypothesis-000002');
  assert.equal(await readFile(join(laneRoot, 'diagnostic/causal-attribution.json'), 'utf8').then(value => JSON.parse(value).hypothesisId), 'hypothesis-000002');
  assert.equal(await readFile(join(laneRoot, 'problem-package.json'), 'utf8').then(value => JSON.parse(value).problemId), 'problem-hypothesis-000002');
  const persistedContractPacket = JSON.parse(await readFile(join(laneRoot, 'autonomous-authoring-contract-packet.json'), 'utf8'));
  assert.deepEqual(solutionContractPacket, persistedContractPacket);
  assert.equal(persistedContractPacket.authorityIdentifier, 'contract-constrained-autonomous-authoring-v1-20260924');
  assert.equal(
    await fileExists(join(laneRoot, 'agent-workspaces/solution/game-runs', sourceRunRef, 'internal/player-surface-source.json')),
    false,
  );
  assert.equal(
    await fileExists(join(laneRoot, 'agent-workspaces/solution/autonomous-authoring-contract-packet.json')),
    false,
  );
  assert.equal(await import('node:fs/promises').then(fs => fs.lstat(join(laneRoot, 'selection/selected-hypothesis.json')).then(() => true, () => false)), false);

  const reviewerLaneRoot = join(root, 'candidates/hypothesis-000002-reviewer');
  let reviewerSolutionPacket: unknown;
  let reviewerContractPacket: unknown;
  const reviewerLaneResult = await runCandidateLane({
    ...laneInput,
    laneRoot: reviewerLaneRoot,
    dependencies: {
      ...laneInput.dependencies,
      runSolutionAgent: async input => {
        reviewerSolutionPacket = input.autonomousAuthoringContractPacket;
        return {
          ok: true,
          result: {
            schemaVersion: 'solution-work-v1',
            problemId: 'problem-hypothesis-000002',
            status: 'OPTIONS',
            options: [{
              optionId: 'option-000001',
              proposedChange: 'A bounded change.',
              rationale: 'It fits the evidence.',
              repoRefs: [],
              artifactRefs: [],
              changeScope: 'configuration',
              expectedPlayerObservableDifference: 'A visible difference.',
              risks: [],
              unknowns: [],
            }],
            recommendedOptionId: 'option-000001',
            summary: 'One option.',
            repoRefs: [],
            artifactRefs: [],
          },
          invocationPath: join(input.destinationRoot, 'invocation.json'),
          rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
          resultPath: join(input.destinationRoot, 'result.json'),
        };
      },
      runSolutionReviewer: async input => {
        reviewerContractPacket = input.autonomousAuthoringContractPacket;
        return {
          ok: true,
          review: {
            schemaVersion: 'solution-review-v1',
            problemId: 'problem-hypothesis-000002',
            decision: 'ACCEPT_OPTION',
            acceptedOptionId: 'option-000001',
            scopeAssessment: 'config_only',
            assessment: 'Independently reviewed.',
            repoRefs: [],
            artifactRefs: [],
            concerns: [],
          },
          invocationPath: join(input.destinationRoot, 'invocation.json'),
          rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
          reviewPath: join(input.destinationRoot, 'review.json'),
        };
      },
    },
  });
  assert.equal(reviewerLaneResult.status, 'completed');
  assert.deepEqual(reviewerSolutionPacket, reviewerContractPacket);
  assert.deepEqual(reviewerContractPacket, persistedContractPacket);
  assert.equal(
    await fileExists(join(reviewerLaneRoot, 'agent-workspaces/reviewer/game-runs', sourceRunRef, 'internal/player-surface-source.json')),
    false,
  );

  const missingRepoLaneRoot = join(root, 'candidates/hypothesis-000002-missing-repo');
  let missingRepoRepositoryRoot: string | undefined;
  const missingRepoResult = await runCandidateLane({
    ...laneInput,
    laneRoot: missingRepoLaneRoot,
    dependencies: {
      ...laneInput.dependencies,
      runSolutionAgent: async input => {
        missingRepoRepositoryRoot = input.repositoryRoot;
        return {
          ok: false,
          errorKind: 'invalid_output' as const,
          message: 'repoRef target missing from canonical repository',
          failure: {
            origin: 'OUTPUT_REFERENCE' as const,
            reason: 'MISSING_TARGET' as const,
            participantErrorKind: 'invalid_output',
            message: 'repoRef target missing from canonical repository',
          },
          invocationPath: join(input.destinationRoot, 'invocation.json'),
          rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
          failurePath: join(input.destinationRoot, 'failure.json'),
        };
      },
    },
  });
  assert.equal(missingRepoResult.status, 'participant_failure');
  if (missingRepoResult.status !== 'participant_failure') return;
  assert.equal(missingRepoRepositoryRoot, process.cwd());
  assert.deepEqual(JSON.parse(await readFile(join(missingRepoLaneRoot, 'workflow-outcome.json'), 'utf8')), {
    schemaVersion: 'candidate-lane-failure-v2',
    candidateRef: 'candidate-pool-test/hypothesis-000002',
    hypothesisId: 'hypothesis-000002',
    sourceIndex: 1,
    stage: 'SOLUTION',
    actualParticipantJobs: 1,
    retryCount: 0,
    failureOrigin: 'OUTPUT_REFERENCE',
    failureReason: 'MISSING_TARGET',
    containment: 'CANDIDATE_LOCAL',
    participantErrorKind: 'invalid_output',
    message: 'repoRef target missing from canonical repository',
  });
  assert.equal(missingRepoResult.failure.schemaVersion, 'candidate-lane-failure-v2');
  assert.equal(missingRepoResult.failure.containment, 'CANDIDATE_LOCAL');

  const timeoutLaneRoot = join(root, 'candidates/hypothesis-000002-timeout');
  const timeoutResult = await runCandidateLane({
    ...laneInput,
    laneRoot: timeoutLaneRoot,
    dependencies: {
      ...laneInput.dependencies,
      runSolutionAgent: async input => ({
        ok: false,
        errorKind: 'timeout' as const,
        message: 'solution timed out',
        failure: {
          origin: 'PARTICIPANT_RUNTIME' as const,
          reason: 'TIMEOUT' as const,
          participantErrorKind: 'timeout',
          message: 'solution timed out',
        },
        invocationPath: join(input.destinationRoot, 'invocation.json'),
        rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
        failurePath: join(input.destinationRoot, 'failure.json'),
      }),
    },
  });
  assert.equal(timeoutResult.status, 'participant_failure');
  if (timeoutResult.status !== 'participant_failure') return;
  assert.equal(timeoutResult.failure.schemaVersion, 'candidate-lane-failure-v2');
  assert.equal(timeoutResult.failure.failureOrigin, 'PARTICIPANT_RUNTIME');
  assert.equal(timeoutResult.failure.failureReason, 'TIMEOUT');
  assert.equal(timeoutResult.failure.containment, 'SESSION_FAIL_CLOSED');
  assert.equal(timeoutResult.failure.retryCount, 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCandidateLaneTests()
    .then(() => console.log('candidateLane.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

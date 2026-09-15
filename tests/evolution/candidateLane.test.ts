import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { emptyMatchingPlayerSurfaceArtifacts } from '../../scripts/evolution/causalAttribution/emptyMatchingPlayerSurfaceArtifacts';
import { runCandidateLane } from '../../scripts/evolution/runCandidateLane';
import type { WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';

const participant: WorkspaceAgentParticipantOptions = { executable: 'test-participant', buildArgs: () => [] };

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
  const result = await runCandidateLane({
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
      runSolutionAgent: async input => ({
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
      }),
      runSolutionReviewer: async () => {
        throw new Error('reviewer must not run for insufficient evidence');
      },
    },
  });
  assert.equal(result.status, 'completed');
  if (result.status !== 'completed') return;
  assert.equal(result.hypothesisId, 'hypothesis-000002');
  assert.equal(result.sourceIndex, 1);
  assert.equal(result.actualParticipantJobs, 1);
  assert.equal(result.decision.route, 'DEFER');
  assert.equal(JSON.parse(await readFile(join(laneRoot, 'candidate-activation.json'), 'utf8')).hypothesisId, 'hypothesis-000002');
  assert.equal(await readFile(join(laneRoot, 'diagnostic/causal-attribution.json'), 'utf8').then(value => JSON.parse(value).hypothesisId), 'hypothesis-000002');
  assert.equal(await readFile(join(laneRoot, 'problem-package.json'), 'utf8').then(value => JSON.parse(value).problemId), 'problem-hypothesis-000002');
  assert.equal(await import('node:fs/promises').then(fs => fs.lstat(join(laneRoot, 'selection/selected-hypothesis.json')).then(() => true, () => false)), false);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCandidateLaneTests()
    .then(() => console.log('candidateLane.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

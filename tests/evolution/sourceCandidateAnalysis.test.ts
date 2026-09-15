import assert from 'node:assert/strict';
import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  runSourceCandidateAnalysis,
  type RunSourceCandidateAnalysisOptions,
} from '../../scripts/evolution/runSourceCandidateAnalysis';
import type { WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';

const participant: WorkspaceAgentParticipantOptions = {
  executable: 'test-participant',
  buildArgs: () => [],
};

async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function buildFixture(hypotheses: unknown[], noProblemAssessment: unknown = null): Promise<{
  root: string;
  sourceRoot: string;
  experimentRoot: string;
  options: RunSourceCandidateAnalysisOptions;
}> {
  const root = await mkdtemp(join(tmpdir(), 'source-candidate-analysis-'));
  const sourceRoot = join(root, 'sealed-source');
  await mkdir(join(sourceRoot, 'reviewer-input'), { recursive: true });
  await writeFile(join(sourceRoot, 'reviewer-input/observable-payload.json'), JSON.stringify({ entries: [{ entryId: 'entry-000001' }] }));
  const experimentRoot = join(root, '.tmp/evolution/source-candidate-analysis');
  const options: RunSourceCandidateAnalysisOptions = {
    repositoryRoot: root,
    fixedSourceRoot: sourceRoot,
    experimentRoot,
    apiKey: 'test-key',
    workspaceAgentParticipant: participant,
    dependencies: {
      preflightFixedSource: async () => ({
        sourceRunRef: 'cohort-run-000001',
        sourceRoot,
        experimentRootHash: 'a'.repeat(64),
        observablePayloadHash: 'b'.repeat(64),
        sourceFingerprintSha256: 'c'.repeat(64),
      }),
      runExternalFeedback: async ({ outRoot }) => {
        const dir = join(outRoot!, 'feedback-runs/cohort-run-000001');
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, 'feedback.json'), JSON.stringify({
          overallImpression: 'The source was observed.',
          observations: [],
        }));
        return {
          runRef: 'cohort-run-000001',
          invocationRef: 'feedback-000001',
          phase0RunPath: sourceRoot,
          feedbackDir: dir,
          humanReportPath: join(dir, 'human-review.md'),
          observablePayloadHash: 'b'.repeat(64),
          experimentRootHash: 'a'.repeat(64),
        };
      },
      runImprovementHypothesis: async ({ outRoot }) => {
        const dir = join(outRoot!, 'hypothesis-runs/cohort-run-000001');
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, 'hypotheses.json'), JSON.stringify({
          schemaVersion: 'improvement-hypothesis-set-v2',
          hypotheses,
          noProblemAssessment,
        }));
        return {
          runRef: 'cohort-run-000001',
          feedbackInvocationRef: 'feedback-000001',
          hypothesisInvocationRef: 'hypothesis-000001',
          hypothesisDir: dir,
          humanReportPath: join(dir, 'human-review.md'),
          experimentRootHash: 'a'.repeat(64),
          observablePayloadHash: 'b'.repeat(64),
          feedbackHash: 'd'.repeat(64),
        };
      },
      captureAuthoritativeFingerprint: async () => 'e'.repeat(64),
    },
  };
  return { root, sourceRoot, experimentRoot, options };
}

const hypothesis = (text: string) => ({
  hypothesis: text,
  observedBasis: 'Observed in the source.',
  feedbackRefs: ['overallImpression'],
  evidenceRefs: ['entry-000001'],
  unknowns: ['Cause remains unknown.'],
  productSignificance: 'It matters to the product.',
});

export async function runSourceCandidateAnalysisTests(): Promise<void> {
  const fixture = await buildFixture([hypothesis('First candidate.'), hypothesis('Second candidate.')]);
  const result = await runSourceCandidateAnalysis(fixture.options);
  assert.equal(result.status, 'completed');
  if (result.status !== 'completed') return;
  assert.deepEqual(result.hypotheses.map(item => item.hypothesisId), ['hypothesis-000001', 'hypothesis-000002']);
  assert.equal(result.actualParticipantJobs, 2);
  assert.equal(await exists(join(fixture.experimentRoot, 'selection/selected-hypothesis.json')), false);
  assert.equal(result.authoritativeFingerprintSha256, 'e'.repeat(64));

  const zeroFixture = await buildFixture([], {
    rationale: 'No supported problem was formed.',
    feedbackRefs: ['overallImpression'],
    evidenceRefs: [],
  });
  const zero = await runSourceCandidateAnalysis(zeroFixture.options);
  assert.equal(zero.status, 'completed');
  if (zero.status === 'completed') {
    assert.deepEqual(zero.hypotheses, []);
    assert.deepEqual(zero.noProblemAssessment, {
      rationale: 'No supported problem was formed.',
      feedbackRefs: ['overallImpression'],
      evidenceRefs: [],
    });
  }
  assert.equal(await readFile(join(zeroFixture.experimentRoot, 'source/observable-payload.json'), 'utf8'), '{"entries":[{"entryId":"entry-000001"}]}');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSourceCandidateAnalysisTests()
    .then(() => console.log('sourceCandidateAnalysis.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

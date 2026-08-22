import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildParticipantFailureOutcome,
  proveLegacyParticipantFailure,
} from '../../scripts/evolution/problemAgnosticSolution/participantFailureRouting';

async function fixtureRoot(): Promise<{ repositoryRoot: string; experimentRoot: string }> {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'participant-failure-routing-'));
  const experimentRoot = join(repositoryRoot, 'experiment');
  await mkdir(experimentRoot, { recursive: true });
  return { repositoryRoot, experimentRoot };
}

async function writeLegacyFailure(input: {
  experimentRoot: string;
  stage: 'EXTERNAL_FEEDBACK' | 'IMPROVEMENT_HYPOTHESIS';
  runRef: string;
  status?: 'failed' | 'completed';
  errorKind?: string;
}): Promise<void> {
  const directory = input.stage === 'EXTERNAL_FEEDBACK' ? 'feedback-runs' : 'hypothesis-runs';
  const runDirectory = join(input.experimentRoot, directory, input.runRef);
  await mkdir(runDirectory, { recursive: true });
  await writeFile(join(runDirectory, 'invocation.json'), JSON.stringify({
    schemaVersion: input.stage === 'EXTERNAL_FEEDBACK'
      ? 'minimal-external-feedback-invocation-v1'
      : 'improvement-hypothesis-invocation-v1',
    runRef: input.runRef,
    ...(input.stage === 'EXTERNAL_FEEDBACK'
      ? { invocationRef: `${input.runRef}-deepseek-player-feedback-001` }
      : {
        feedbackInvocationRef: `${input.runRef}-deepseek-player-feedback-001`,
        hypothesisInvocationRef: `${input.runRef}-deepseek-improvement-hypothesis-001`,
      }),
    status: input.status ?? 'failed',
    ...(input.errorKind === undefined ? {} : { errorKind: input.errorKind }),
  }));
  await writeFile(join(runDirectory, 'human-review.md'), 'failure evidence');
}

export async function runParticipantFailureRoutingTests(): Promise<void> {
  const feedbackFixture = await fixtureRoot();
  await writeLegacyFailure({
    ...feedbackFixture,
    stage: 'EXTERNAL_FEEDBACK',
    runRef: 'cohort-run-000001',
    errorKind: 'provider',
  });
  const feedbackFailure = await proveLegacyParticipantFailure({
    experimentRoot: feedbackFixture.experimentRoot,
    stage: 'EXTERNAL_FEEDBACK',
    runRef: 'cohort-run-000001',
  });
  assert.equal(feedbackFailure?.participantErrorKind, 'provider');
  assert.deepEqual(feedbackFailure?.failureArtifactRefs, [
    'feedback-runs/cohort-run-000001/invocation.json',
    'feedback-runs/cohort-run-000001/human-review.md',
  ]);

  const hypothesisFixture = await fixtureRoot();
  await writeLegacyFailure({
    ...hypothesisFixture,
    stage: 'IMPROVEMENT_HYPOTHESIS',
    runRef: 'cohort-run-000001',
    errorKind: 'parse',
  });
  const hypothesisFailure = await proveLegacyParticipantFailure({
    experimentRoot: hypothesisFixture.experimentRoot,
    stage: 'IMPROVEMENT_HYPOTHESIS',
    runRef: 'cohort-run-000001',
  });
  assert.equal(hypothesisFailure?.participantErrorKind, 'parse');

  const wrongHypothesisFixture = await fixtureRoot();
  const wrongHypothesisDirectory = join(
    wrongHypothesisFixture.experimentRoot,
    'hypothesis-runs/cohort-run-000001',
  );
  await mkdir(wrongHypothesisDirectory, { recursive: true });
  await writeFile(
    join(wrongHypothesisDirectory, 'invocation.json'),
    JSON.stringify({
      schemaVersion: 'improvement-hypothesis-invocation-v1',
      runRef: 'cohort-run-000001',
      invocationRef: 'cohort-run-000001-deepseek-improvement-hypothesis-001',
      status: 'failed',
      errorKind: 'parse',
    }),
  );
  await writeFile(join(wrongHypothesisDirectory, 'human-review.md'), 'failure evidence');
  assert.equal(await proveLegacyParticipantFailure({
    experimentRoot: wrongHypothesisFixture.experimentRoot,
    stage: 'IMPROVEMENT_HYPOTHESIS',
    runRef: 'cohort-run-000001',
  }), null);

  const missingFixture = await fixtureRoot();
  assert.equal(await proveLegacyParticipantFailure({
    experimentRoot: missingFixture.experimentRoot,
    stage: 'IMPROVEMENT_HYPOTHESIS',
    runRef: 'cohort-run-000001',
  }), null);

  const completedFixture = await fixtureRoot();
  await writeLegacyFailure({
    ...completedFixture,
    stage: 'IMPROVEMENT_HYPOTHESIS',
    runRef: 'cohort-run-000001',
    status: 'completed',
    errorKind: 'parse',
  });
  assert.equal(await proveLegacyParticipantFailure({
    experimentRoot: completedFixture.experimentRoot,
    stage: 'IMPROVEMENT_HYPOTHESIS',
    runRef: 'cohort-run-000001',
  }), null);

  const malformedFixture = await fixtureRoot();
  const malformedDirectory = join(malformedFixture.experimentRoot, 'hypothesis-runs/cohort-run-000001');
  await mkdir(malformedDirectory, { recursive: true });
  await writeFile(join(malformedDirectory, 'invocation.json'), '{not-json');
  assert.equal(await proveLegacyParticipantFailure({
    experimentRoot: malformedFixture.experimentRoot,
    stage: 'IMPROVEMENT_HYPOTHESIS',
    runRef: 'cohort-run-000001',
  }), null);

  const buildFixture = await fixtureRoot();
  await mkdir(join(buildFixture.experimentRoot, 'solution-agent'), { recursive: true });
  await writeFile(join(buildFixture.experimentRoot, 'solution-agent/failure.json'), '{}');
  const built = await buildParticipantFailureOutcome({
    ...buildFixture,
    stage: 'SOLUTION',
    participantErrorKind: 'invalid_output',
    failureArtifactRefs: [join(buildFixture.experimentRoot, 'solution-agent/failure.json')],
  });
  assert.equal(built.failedStage, 'SOLUTION');
  assert.equal(built.participantJobNumber, 3);
  assert.deepEqual(built.failureArtifactRefs, ['solution-agent/failure.json']);

  const isolatedWorkspaceFixture = await fixtureRoot();
  const isolatedWorkspaceRoot = join(isolatedWorkspaceFixture.repositoryRoot, 'isolated-workspace');
  const p2ArtifactRoot = join(isolatedWorkspaceFixture.repositoryRoot, 'p2-artifacts');
  await mkdir(isolatedWorkspaceRoot, { recursive: true });
  await mkdir(join(p2ArtifactRoot, 'solution-agent'), { recursive: true });
  await writeFile(join(p2ArtifactRoot, 'solution-agent/failure.json'), '{}');
  const isolatedBuilt = await buildParticipantFailureOutcome({
    repositoryRoot: isolatedWorkspaceRoot,
    experimentRoot: p2ArtifactRoot,
    stage: 'SOLUTION',
    participantErrorKind: 'timeout',
    failureArtifactRefs: [join(p2ArtifactRoot, 'solution-agent/failure.json')],
  });
  assert.equal(isolatedBuilt.failedStage, 'SOLUTION');
  assert.deepEqual(isolatedBuilt.failureArtifactRefs, ['solution-agent/failure.json']);

  await assert.rejects(() => buildParticipantFailureOutcome({
    ...buildFixture,
    stage: 'SOLUTION',
    participantErrorKind: 'invalid_output',
    failureArtifactRefs: [join(buildFixture.repositoryRoot, 'outside.json')],
  }));
  await assert.rejects(() => buildParticipantFailureOutcome({
    ...buildFixture,
    stage: 'REVIEWER',
    participantErrorKind: 'invalid_output',
    failureArtifactRefs: ['../outside.json'],
  }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runParticipantFailureRoutingTests()
    .then(() => console.log('participantFailureRouting.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

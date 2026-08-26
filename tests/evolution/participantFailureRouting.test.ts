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
  participantProvider?: string;
  invocationRefFlavor?: 'deepseek' | 'local';
}): Promise<void> {
  const directory = input.stage === 'EXTERNAL_FEEDBACK' ? 'feedback-runs' : 'hypothesis-runs';
  const runDirectory = join(input.experimentRoot, directory, input.runRef);
  const invocationRefFlavor = input.invocationRefFlavor ?? 'deepseek';
  const invocationPrefix = invocationRefFlavor === 'local' ? 'local' : 'deepseek';
  await mkdir(runDirectory, { recursive: true });
  await writeFile(join(runDirectory, 'invocation.json'), JSON.stringify({
    schemaVersion: input.stage === 'EXTERNAL_FEEDBACK'
      ? 'minimal-external-feedback-invocation-v1'
      : 'improvement-hypothesis-invocation-v1',
    runRef: input.runRef,
    ...(input.stage === 'EXTERNAL_FEEDBACK'
      ? { invocationRef: `${input.runRef}-${invocationPrefix}-player-feedback-001` }
      : {
        feedbackInvocationRef: `${input.runRef}-${invocationPrefix}-player-feedback-001`,
        hypothesisInvocationRef: `${input.runRef}-${invocationPrefix}-improvement-hypothesis-001`,
      }),
    ...(input.participantProvider === undefined
      ? {}
      : { participant: { provider: input.participantProvider } }),
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

  const localFeedbackFixture = await fixtureRoot();
  await writeLegacyFailure({
    ...localFeedbackFixture,
    stage: 'EXTERNAL_FEEDBACK',
    runRef: 'local-feedback-000001',
    errorKind: 'timeout',
    participantProvider: 'codex-local-subagent',
    invocationRefFlavor: 'local',
  });
  const localFeedbackFailure = await proveLegacyParticipantFailure({
    experimentRoot: localFeedbackFixture.experimentRoot,
    stage: 'EXTERNAL_FEEDBACK',
    runRef: 'local-feedback-000001',
  });
  assert.equal(localFeedbackFailure?.participantErrorKind, 'timeout');

  const localHypothesisFixture = await fixtureRoot();
  await writeLegacyFailure({
    ...localHypothesisFixture,
    stage: 'IMPROVEMENT_HYPOTHESIS',
    runRef: 'local-hypothesis-000001',
    errorKind: 'provider',
    participantProvider: 'codex-local-subagent',
    invocationRefFlavor: 'local',
  });
  const localHypothesisFailure = await proveLegacyParticipantFailure({
    experimentRoot: localHypothesisFixture.experimentRoot,
    stage: 'IMPROVEMENT_HYPOTHESIS',
    runRef: 'local-hypothesis-000001',
  });
  assert.equal(localHypothesisFailure?.participantErrorKind, 'provider');

  const deepSeekProviderFixture = await fixtureRoot();
  await writeLegacyFailure({
    ...deepSeekProviderFixture,
    stage: 'EXTERNAL_FEEDBACK',
    runRef: 'deepseek-provider-000001',
    errorKind: 'provider',
    participantProvider: 'deepseek',
  });
  const deepSeekProviderFailure = await proveLegacyParticipantFailure({
    experimentRoot: deepSeekProviderFixture.experimentRoot,
    stage: 'EXTERNAL_FEEDBACK',
    runRef: 'deepseek-provider-000001',
  });
  assert.equal(deepSeekProviderFailure?.participantErrorKind, 'provider');

  const localProviderDeepSeekRefFixture = await fixtureRoot();
  await writeLegacyFailure({
    ...localProviderDeepSeekRefFixture,
    stage: 'EXTERNAL_FEEDBACK',
    runRef: 'mismatched-local-provider-000001',
    errorKind: 'provider',
    participantProvider: 'codex-local-subagent',
  });
  assert.equal(await proveLegacyParticipantFailure({
    experimentRoot: localProviderDeepSeekRefFixture.experimentRoot,
    stage: 'EXTERNAL_FEEDBACK',
    runRef: 'mismatched-local-provider-000001',
  }), null);

  const deepSeekProviderLocalRefFixture = await fixtureRoot();
  await writeLegacyFailure({
    ...deepSeekProviderLocalRefFixture,
    stage: 'IMPROVEMENT_HYPOTHESIS',
    runRef: 'mismatched-deepseek-provider-000001',
    errorKind: 'provider',
    participantProvider: 'deepseek',
    invocationRefFlavor: 'local',
  });
  assert.equal(await proveLegacyParticipantFailure({
    experimentRoot: deepSeekProviderLocalRefFixture.experimentRoot,
    stage: 'IMPROVEMENT_HYPOTHESIS',
    runRef: 'mismatched-deepseek-provider-000001',
  }), null);

  const unknownProviderFixture = await fixtureRoot();
  await writeLegacyFailure({
    ...unknownProviderFixture,
    stage: 'EXTERNAL_FEEDBACK',
    runRef: 'unknown-provider-000001',
    errorKind: 'provider',
    participantProvider: 'unknown-provider',
  });
  assert.equal(await proveLegacyParticipantFailure({
    experimentRoot: unknownProviderFixture.experimentRoot,
    stage: 'EXTERNAL_FEEDBACK',
    runRef: 'unknown-provider-000001',
  }), null);

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

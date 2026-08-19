import assert from 'node:assert/strict';
import {
  parseParticipantFailureOutcome,
  validateParticipantFailureOutcome,
  type ParticipantFailureOutcomeV1,
} from '../../src/evolution/participantFailureOutcomeContract';

function outcome(
  overrides: Partial<ParticipantFailureOutcomeV1> = {},
): ParticipantFailureOutcomeV1 {
  return {
    schemaVersion: 'participant-failure-outcome-v1',
    outcome: 'PARTICIPANT_FAILURE',
    failedStage: 'IMPROVEMENT_HYPOTHESIS',
    participantJobNumber: 2,
    route: 'DEFER',
    participantErrorKind: 'parse',
    failureArtifactRefs: ['hypothesis-runs/cohort-run-000001/invocation.json'],
    budget: {
      actualParticipantJobs: 2,
      maxParticipantJobs: 4,
      retryCount: 0,
    },
    ...overrides,
  };
}

function assertRejected(value: unknown): void {
  assert.throws(() => validateParticipantFailureOutcome(value));
}

export function runParticipantFailureOutcomeContractTests(): void {
  for (const [failedStage, participantJobNumber] of [
    ['EXTERNAL_FEEDBACK', 1],
    ['IMPROVEMENT_HYPOTHESIS', 2],
    ['SOLUTION', 3],
    ['REVIEWER', 4],
  ] as const) {
    const valid = validateParticipantFailureOutcome(outcome({ failedStage, participantJobNumber, budget: {
      actualParticipantJobs: participantJobNumber,
      maxParticipantJobs: 4,
      retryCount: 0,
    } }));
    assert.equal(valid.failedStage, failedStage);
    assert.equal(valid.participantJobNumber, participantJobNumber);
  }

  const parsed = parseParticipantFailureOutcome(JSON.stringify(outcome()));
  assert.equal(parsed.outcome, 'PARTICIPANT_FAILURE');
  assert.equal(parsed.route, 'DEFER');

  assertRejected({ ...outcome(), route: 'SKIP' });
  assertRejected({ ...outcome(), budget: { actualParticipantJobs: 2, maxParticipantJobs: 4, retryCount: 1 } });
  assertRejected({ ...outcome(), budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 } });
  assertRejected({ ...outcome(), failedStage: 'SOLUTION', participantJobNumber: 2 });
  assertRejected({ ...outcome(), participantErrorKind: '' });
  assertRejected({ ...outcome(), failureArtifactRefs: [] });
  assertRejected({ ...outcome(), failureArtifactRefs: ['/tmp/failure.json'] });
  assertRejected({ ...outcome(), failureArtifactRefs: ['../failure.json'] });
  assertRejected({ ...outcome(), failureArtifactRefs: ['nested/../../failure.json'] });
  assertRejected({ ...outcome(), failureArtifactRefs: ['.'] });
  assertRejected({ ...outcome(), extra: true } as unknown);
  assertRejected({ ...outcome(), budget: { actualParticipantJobs: 2, maxParticipantJobs: 4, retryCount: 0, extra: true } } as unknown);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runParticipantFailureOutcomeContractTests();
  console.log('participantFailureOutcomeContract.test.ts: ok');
}

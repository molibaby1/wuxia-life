import assert from 'node:assert/strict';
import {
  buildCandidateLaneFailureV2,
  containmentForParticipantFailure,
  parseCandidateLaneFailureV2,
} from '../../scripts/evolution/candidateLaneFailureContract';
import {
  classifyWorkspaceAgentFailure,
  ParticipantOutputValidationError,
} from '../../scripts/evolution/problemAgnosticSolution/participantFailureClassification';

const failureInput = {
  candidateRef: 'pool-1/hypothesis-000001',
  hypothesisId: 'hypothesis-000001',
  sourceIndex: 0,
  stage: 'SOLUTION' as const,
  actualParticipantJobs: 1 as const,
  failureOrigin: 'OUTPUT_REFERENCE' as const,
  failureReason: 'MISSING_TARGET' as const,
  participantErrorKind: 'invalid_output',
  message: 'repoRef target missing from canonical repository',
};

function assertInvalid(value: unknown, pattern: RegExp): void {
  assert.throws(() => parseCandidateLaneFailureV2(JSON.stringify(value)), pattern);
}

export async function runCandidateLaneFailureContractTests(): Promise<void> {
  assert.equal(containmentForParticipantFailure({
    origin: 'OUTPUT_REFERENCE',
    reason: 'MISSING_TARGET',
    participantErrorKind: 'invalid_output',
    message: 'missing',
  }), 'CANDIDATE_LOCAL');

  assert.equal(containmentForParticipantFailure({
    origin: 'OUTPUT_IDENTITY',
    reason: 'PROBLEM_ID_MISMATCH',
    participantErrorKind: 'invalid_output',
    message: 'wrong problem',
  }), 'SESSION_FAIL_CLOSED');

  assert.equal(containmentForParticipantFailure({
    origin: 'PROVIDER_PROTOCOL',
    reason: 'PROVIDER_PROTOCOL_FAILURE',
    participantErrorKind: 'invalid_output',
    message: 'failed completed-turn protocol',
  }), 'SESSION_FAIL_CLOSED');

  assert.equal(containmentForParticipantFailure({
    origin: 'OUTPUT_REFERENCE',
    reason: 'ESCAPES_ALLOWED_ROOT',
    participantErrorKind: 'invalid_output',
    message: 'escape',
  }), 'SESSION_FAIL_CLOSED');

  const hostInfrastructureFailure = buildCandidateLaneFailureV2({
    ...failureInput,
    failureOrigin: 'HOST_INFRASTRUCTURE',
    failureReason: 'UNCLASSIFIED',
    participantErrorKind: 'process',
    message: 'host runner threw',
  });
  assert.equal(hostInfrastructureFailure.containment, 'SESSION_FAIL_CLOSED');
  assert.deepEqual(
    parseCandidateLaneFailureV2(JSON.stringify(hostInfrastructureFailure)),
    hostInfrastructureFailure,
  );

  const failure = buildCandidateLaneFailureV2(failureInput);
  assert.equal(failure.schemaVersion, 'candidate-lane-failure-v2');
  assert.equal(failure.retryCount, 0);
  assert.equal(failure.containment, 'CANDIDATE_LOCAL');
  assert.deepEqual(parseCandidateLaneFailureV2(JSON.stringify(failure)), failure);

  assert.throws(() => parseCandidateLaneFailureV2(JSON.stringify({
    ...failure,
    containment: 'SESSION_FAIL_CLOSED',
  })), /containment/i);

  assertInvalid({ ...failure, schemaVersion: undefined }, /schemaVersion|missing/i);
  assertInvalid({ ...failure, retryCount: 1 }, /retryCount/i);
  assertInvalid({ ...failure, candidateRef: 'pool-1/hypothesis-000002' }, /candidateRef|identity/i);
  assertInvalid({ ...failure, sourceIndex: -1 }, /sourceIndex/i);
  assertInvalid({ ...failure, stage: 'UNKNOWN_STAGE' }, /stage/i);
  assertInvalid({ ...failure, failureOrigin: 'OUTPUT_ENVELOPE', failureReason: 'TIMEOUT' }, /origin|reason|combination/i);
  assertInvalid({ ...failure, extra: true }, /unknown|extra/i);
  assertInvalid(null, /object/i);

  assert.deepEqual(classifyWorkspaceAgentFailure({
    errorKind: 'runtime_unavailable',
    message: 'runtime unavailable',
  }), {
    origin: 'PARTICIPANT_RUNTIME',
    reason: 'RUNTIME_UNAVAILABLE',
    participantErrorKind: 'runtime_unavailable',
    message: 'runtime unavailable',
  });
  assert.deepEqual(classifyWorkspaceAgentFailure({
    errorKind: 'process',
    message: 'process failed',
  }), {
    origin: 'PARTICIPANT_RUNTIME',
    reason: 'PROCESS_FAILURE',
    participantErrorKind: 'process',
    message: 'process failed',
  });
  assert.deepEqual(classifyWorkspaceAgentFailure({
    errorKind: 'timeout',
    message: 'timed out',
  }), {
    origin: 'PARTICIPANT_RUNTIME',
    reason: 'TIMEOUT',
    participantErrorKind: 'timeout',
    message: 'timed out',
  });
  assert.deepEqual(classifyWorkspaceAgentFailure({
    errorKind: 'continuation',
    message: 'continuation failed',
  }), {
    origin: 'PROVIDER_PROTOCOL',
    reason: 'CONTINUATION_PROTOCOL_FAILURE',
    participantErrorKind: 'continuation',
    message: 'continuation failed',
  });
  assert.deepEqual(classifyWorkspaceAgentFailure({
    errorKind: 'invalid_output',
    message: 'provider rejected completed output',
  }), {
    origin: 'PROVIDER_PROTOCOL',
    reason: 'PROVIDER_PROTOCOL_FAILURE',
    participantErrorKind: 'invalid_output',
    message: 'provider rejected completed output',
  });

  const facts = classifyWorkspaceAgentFailure({
    errorKind: 'invalid_output',
    message: 'human-readable validation detail',
  });
  const error = new ParticipantOutputValidationError(facts);
  assert.equal(error.message, 'human-readable validation detail');
  assert.deepEqual(error.facts, facts);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCandidateLaneFailureContractTests()
    .then(() => console.log('candidateLaneFailureContract.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

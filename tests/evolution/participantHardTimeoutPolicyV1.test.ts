import assert from 'node:assert/strict';
import {
  PARTICIPANT_ABSOLUTE_TIMEOUT_MS,
  PARTICIPANT_STDOUT_INACTIVITY_TIMEOUT_MS,
  PARTICIPANT_TIMEOUT_EVALUATION_START_MS,
} from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import { ENVELOPE_RETRANSMISSION_TIMEOUT_MS } from '../../scripts/evolution/problemAgnosticSolution/envelopeRetransmission';

export async function runParticipantHardTimeoutPolicyV1Tests(): Promise<void> {
  assert.equal(
    PARTICIPANT_TIMEOUT_EVALUATION_START_MS,
    1_800_000,
    'activity-aware timeout policy v1 evaluation window starts at 1800000ms',
  );
  assert.equal(PARTICIPANT_STDOUT_INACTIVITY_TIMEOUT_MS, 600_000);
  assert.equal(PARTICIPANT_ABSOLUTE_TIMEOUT_MS, 2_700_000);
  assert.equal(ENVELOPE_RETRANSMISSION_TIMEOUT_MS, 60_000);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runParticipantHardTimeoutPolicyV1Tests()
    .then(() => console.log('participantHardTimeoutPolicyV1.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

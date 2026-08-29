import assert from 'node:assert/strict';
import { DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import { ENVELOPE_RETRANSMISSION_TIMEOUT_MS } from '../../scripts/evolution/problemAgnosticSolution/envelopeRetransmission';

export async function runParticipantHardTimeoutPolicyV1Tests(): Promise<void> {
  assert.equal(
    DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS,
    1_800_000,
    'hard-timeout policy v1 default hard boundary must be 1800000ms',
  );
  assert.equal(
    ENVELOPE_RETRANSMISSION_TIMEOUT_MS,
    60_000,
    'retransmission ceiling must remain independent at 60000ms',
  );
  assert.notEqual(
    DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS,
    ENVELOPE_RETRANSMISSION_TIMEOUT_MS,
    'hard boundary must not be conflated with retransmission ceiling',
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runParticipantHardTimeoutPolicyV1Tests()
    .then(() => console.log('participantHardTimeoutPolicyV1.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

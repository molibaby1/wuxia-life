import { renderStructuredFinalOutputContractV1 } from '../../../src/evolution/participantStructuredOutputContract';
import type { WorkspaceAgentJobInput } from './agentParticipant';

export const ENVELOPE_RETRANSMISSION_TIMEOUT_MS = 60_000 as const;

export type EnvelopeRetransmissionOutcome =
  | 'NOT_ATTEMPTED'
  | 'SUCCEEDED'
  | 'TIMEOUT'
  | 'CONTINUATION_FAILURE'
  | 'RUNTIME_FAILURE'
  | 'ENVELOPE_FAILURE'
  | 'SCHEMA_FAILURE';

export interface EnvelopeRetransmissionObservation {
  eligible: boolean;
  attempted: boolean;
  outcome: EnvelopeRetransmissionOutcome;
}

export function isEnvelopeRetransmissionEnabledForRole(
  role: WorkspaceAgentJobInput['role'],
): boolean {
  return role === 'solution';
}

export function renderEnvelopeRetransmissionRequestV1(input: {
  expectedRoleSchemaName: string;
}): string {
  return [
    'The previous terminal payload was rejected by the Host.',
    '',
    'Failure class: ENVELOPE_FAILURE.',
    '',
    'Re-emit the same Role result only.',
    'Do not perform new reasoning or investigation.',
    'Do not change the semantic content merely because retransmission was requested.',
    '',
    renderStructuredFinalOutputContractV1({
      roleSchemaName: input.expectedRoleSchemaName,
    }),
  ].join('\n');
}

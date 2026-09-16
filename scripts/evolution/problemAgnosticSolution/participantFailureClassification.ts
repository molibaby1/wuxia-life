export type ParticipantFailureOrigin =
  | 'PARTICIPANT_RUNTIME'
  | 'PROVIDER_PROTOCOL'
  | 'OUTPUT_ENVELOPE'
  | 'OUTPUT_SCHEMA'
  | 'OUTPUT_IDENTITY'
  | 'OUTPUT_INTERNAL_CONSISTENCY'
  | 'OUTPUT_REFERENCE'
  | 'HOST_INFRASTRUCTURE'
  | 'UNKNOWN';

export type ParticipantFailureReason =
  | 'RUNTIME_UNAVAILABLE'
  | 'PROCESS_FAILURE'
  | 'TIMEOUT'
  | 'PROVIDER_PROTOCOL_FAILURE'
  | 'CONTINUATION_PROTOCOL_FAILURE'
  | 'EMPTY_ENVELOPE'
  | 'INVALID_JSON_ENVELOPE'
  | 'NON_OBJECT_ENVELOPE'
  | 'ROLE_SCHEMA_INVALID'
  | 'PROBLEM_ID_MISMATCH'
  | 'OPTION_ID_MISMATCH'
  | 'MALFORMED_LOCATOR'
  | 'MISSING_TARGET'
  | 'NOT_REGULAR_FILE'
  | 'ABSOLUTE_PATH'
  | 'ESCAPES_ALLOWED_ROOT'
  | 'IO_ERROR'
  | 'WORKSPACE_MATERIALIZATION_MISMATCH'
  | 'SKILL_DELIVERY_FAILURE'
  | 'UNCLASSIFIED';

export interface ParticipantFailureFacts {
  origin: ParticipantFailureOrigin;
  reason: ParticipantFailureReason;
  participantErrorKind: string | null;
  message: string;
}

export class ParticipantOutputValidationError extends Error {
  readonly facts: ParticipantFailureFacts;

  constructor(facts: ParticipantFailureFacts) {
    super(facts.message);
    this.name = 'ParticipantOutputValidationError';
    this.facts = facts;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function classifyWorkspaceAgentFailure(input: {
  errorKind: 'runtime_unavailable' | 'process' | 'timeout' | 'invalid_output' | 'continuation';
  message: string;
}): ParticipantFailureFacts {
  const mapping: Record<typeof input.errorKind, {
    origin: ParticipantFailureOrigin;
    reason: ParticipantFailureReason;
  }> = {
    runtime_unavailable: {
      origin: 'PARTICIPANT_RUNTIME',
      reason: 'RUNTIME_UNAVAILABLE',
    },
    process: {
      origin: 'PARTICIPANT_RUNTIME',
      reason: 'PROCESS_FAILURE',
    },
    timeout: {
      origin: 'PARTICIPANT_RUNTIME',
      reason: 'TIMEOUT',
    },
    continuation: {
      origin: 'PROVIDER_PROTOCOL',
      reason: 'CONTINUATION_PROTOCOL_FAILURE',
    },
    invalid_output: {
      origin: 'PROVIDER_PROTOCOL',
      reason: 'PROVIDER_PROTOCOL_FAILURE',
    },
  };
  return {
    ...mapping[input.errorKind],
    participantErrorKind: input.errorKind,
    message: input.message,
  };
}

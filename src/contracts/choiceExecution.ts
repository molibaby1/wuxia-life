/**
 * Choice execution contract types (P4 US-009).
 *
 * Request/response transport shapes only — does not replace runtime choice execution.
 *
 * @see docs/contracts/choice-execution-request-contract.md
 * @see docs/contracts/choice-execution-response-contract.md
 */

import type { ChoiceFeedbackModel, ChoiceFeedbackVisibility } from '../types/choiceFeedback';
import type {
  GameStateSnapshot,
  GameStateSnapshotState,
  SnapshotEventRecord,
  SnapshotRouteHistoryEntry,
  SourcePlatform,
} from './gameStateSnapshot';

export const CHOICE_EXECUTION_REQUEST_VERSION = '1.0.0' as const;
export const CHOICE_EXECUTION_RESPONSE_VERSION = '1.0.0' as const;

/** Inline snapshot or server-resolved reference. */
export interface SnapshotReference {
  snapshotId?: string;
  snapshot?: GameStateSnapshot;
}

export interface ChoicePlayerInput {
  kind: 'confirm' | 'text' | 'number' | 'custom';
  value?: string | number | boolean;
  token?: string;
}

export interface ChoiceAction {
  eventId: string;
  choiceId: string;
  outcomeId?: string;
  playerInput?: ChoicePlayerInput;
}

export interface RandomContext {
  seed: string | number;
  sequence: number;
}

export interface ClientMetadata {
  platform?: SourcePlatform;
  clientVersion?: string;
  traceId?: string;
  submittedAt?: number;
}

export interface ChoiceExecutionRequest {
  requestVersion: typeof CHOICE_EXECUTION_REQUEST_VERSION;
  snapshotRef: SnapshotReference;
  action: ChoiceAction;
  randomContext?: RandomContext;
  clientMetadata?: ClientMetadata;
}

export interface ExecutionAppend {
  eventHistory: SnapshotEventRecord[];
  generatedLogs: string[];
}

export interface ExecutionDeltas {
  routeChanges?: SnapshotRouteHistoryEntry[];
  relationshipChanges?: Array<{ relationId: string; delta: number }>;
  lifeMemoryInputs?: Partial<
    Pick<GameStateSnapshotState, 'flags' | 'criticalChoices' | 'lifePath'>
  >;
}

export interface NextEventHints {
  nextEventIds?: string[];
  autoAdvance?: boolean;
}

export interface ExecutionWarning {
  code: string;
  message: string;
  visibility: ChoiceFeedbackVisibility;
}

export interface ChoiceExecutionDiagnostics {
  engineVersion: string;
  eventCatalogVersion: string;
  snapshotHashBefore?: string;
  snapshotHashAfter?: string;
  executionMs?: number;
}

export interface ChoiceExecutionError {
  code: string;
  message: string;
  details?: string;
  field?: string;
}

export interface ChoiceExecutionSuccessResponse {
  responseVersion: typeof CHOICE_EXECUTION_RESPONSE_VERSION;
  status: 'success';
  traceId?: string;
  nextSnapshot: GameStateSnapshot;
  feedback: ChoiceFeedbackModel;
  append: ExecutionAppend;
  deltas: ExecutionDeltas;
  hints: NextEventHints;
  diagnostics: ChoiceExecutionDiagnostics;
  warnings?: ExecutionWarning[];
}

export interface ChoiceExecutionFailureResponse {
  responseVersion: typeof CHOICE_EXECUTION_RESPONSE_VERSION;
  status: 'failure';
  traceId?: string;
  error: ChoiceExecutionError;
  diagnostics?: ChoiceExecutionDiagnostics;
  partialSnapshot?: GameStateSnapshot;
}

export type ChoiceExecutionResponse =
  | ChoiceExecutionSuccessResponse
  | ChoiceExecutionFailureResponse;

/**
 * Headless session shared types (P5 US-003).
 */

import type { ChoiceFeedbackModel } from '../../types/choiceFeedback';
import type {
  ActiveActionSummaryDisplay,
  DisturbanceNarrativeDisplay,
} from '../../types/activeActionTypes';
import type { SessionPhase } from '../../contracts/sessionProgression';
import type { EventDefinition } from '../../types/eventTypes';

export type HeadlessErrorCode =
  | 'CATALOG_VERSION_UNKNOWN'
  | 'CATALOG_VERSION_MISMATCH'
  | 'SNAPSHOT_INVALID'
  | 'SNAPSHOT_FORBIDDEN_FIELD'
  | 'EVENT_NOT_FOUND'
  | 'CHOICE_NOT_AVAILABLE'
  | 'STALE_EVENT'
  | 'STALE_CHOICE'
  | 'TERMINAL_STATE'
  | 'AUTOMATIC_PROGRESSION_LIMIT'
  | 'SESSION_NOT_INITIALIZED'
  | 'INVALID_SESSION_PHASE'
  | 'INVALID_ACTION'
  | 'INVALID_ACK_KIND';

export interface HeadlessSessionError {
  code: HeadlessErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface PlayerSafeEventPayload {
  eventId: string;
  title: string;
  text: string;
  eventType: string;
  choices?: Array<{
    id: string;
    text: string;
    available: boolean;
  }>;
  autoEffects?: boolean;
}

export interface NextEventResult {
  eventId: string;
  event: PlayerSafeEventPayload;
  requiresChoice: boolean;
  isAutomatic: boolean;
  raw: EventDefinition;
}

export interface ProgressAutomaticResult {
  stepsExecuted: number;
  stoppedReason: 'choice_required' | 'terminal' | 'no_event' | 'safety_limit';
  lastEventId?: string;
  error?: HeadlessSessionError;
}

export interface HeadlessTerminalState {
  isTerminal: true;
  isAlive: boolean;
  deathReason?: string;
  endingId?: string;
  age: number;
}

export interface HeadlessProgressionVolatileState {
  pendingActionSummary: ActiveActionSummaryDisplay | null;
  pendingDisturbanceNarrative: DisturbanceNarrativeDisplay | null;
}

export interface HeadlessSessionVolatileState extends HeadlessProgressionVolatileState {
  currentEvent: EventDefinition | null;
  lastFeedback: ChoiceFeedbackModel | null;
  lastOutcomeText: string | null;
}

export class HeadlessProgressionError extends Error {
  readonly code: Extract<
    HeadlessErrorCode,
    'INVALID_SESSION_PHASE' | 'INVALID_ACTION' | 'INVALID_ACK_KIND'
  >;

  constructor(
    code: Extract<HeadlessErrorCode, 'INVALID_SESSION_PHASE' | 'INVALID_ACTION' | 'INVALID_ACK_KIND'>,
    message: string,
  ) {
    super(message);
    this.name = 'HeadlessProgressionError';
    this.code = code;
  }
}

export type ProgressionAckKind = 'action_summary' | 'disturbance';

export type { SessionPhase };

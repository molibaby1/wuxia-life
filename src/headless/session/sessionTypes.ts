/**
 * Headless session shared types (P5 US-003).
 */

import type { ChoiceFeedbackModel } from '../../types/choiceFeedback';
import type {
  ActiveActionSummaryDisplay,
  DisturbanceNarrativeDisplay,
  PassiveNarrativeDisplay,
  PeriodSummaryDisplay,
} from '../../types/activeActionTypes';
import type { SessionPhase } from '../../contracts/sessionProgression';
import type { EventDefinition } from '../../types/eventTypes';
import type { AnnualPassiveMemoryPlan } from '../../core/activePlanning/annualPassiveMemory';

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
    description?: string;

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
  ending?: { id: string; name: string; description: string; category: string };
  age: number;
}

export interface HeadlessProgressionVolatileState {
  pendingActionSummary: ActiveActionSummaryDisplay | null;
  pendingDisturbanceNarrative: DisturbanceNarrativeDisplay | null;
  pendingPeriodSummary: PeriodSummaryDisplay | null;
  passiveNarrative: PassiveNarrativeDisplay | null;
  annualPassiveMemory: AnnualPassiveMemoryPlan | null;
  /** Automatic story event awaiting player continue (not in snapshot). */
  pendingStoryEventId: string | null;
  /** Daily / runtime-built events not resolvable via catalog id alone. */
  pendingEphemeralStoryEvent?: EventDefinition | null;
}

export interface HeadlessSessionVolatileState {
  currentEvent: EventDefinition | null;
  lastFeedback: ChoiceFeedbackModel | null;
  lastOutcomeText: string | null;
  pendingActionSummary: ActiveActionSummaryDisplay | null;
  pendingDisturbanceNarrative: DisturbanceNarrativeDisplay | null;
  pendingPeriodSummary: PeriodSummaryDisplay | null;
  passiveNarrative: PassiveNarrativeDisplay | null;
  annualPassiveMemory: AnnualPassiveMemoryPlan | null;
  /** True after story-gap passive served for ages 5–7; allows lite planning on same gap. */
  storyGapPassiveServed: boolean;
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

export type ProgressionAckKind =
  | 'action_summary'
  | 'disturbance'
  | 'story_automatic'
  | 'passive_continue'
  | 'period_summary';

export type { SessionPhase };

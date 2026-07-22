/**
 * P7.2 session progression contract — server-authoritative active planning.
 *
 * @see docs/designs/p7-2-session-progression-api.md
 * @see docs/PRD/p7-2-server-authoritative-active-planning.md
 */

import type {
  ActiveActionSummaryDisplay,
  DisturbanceNarrativeDisplay,
  PassiveNarrativeDisplay,
  PeriodSummaryDisplay,
} from '../types/activeActionTypes';
import type { LifeMemorySummary } from '../types/lifeMemory';
import type { Investments, PlayerLifeStates } from '../types/eventTypes';

/**
 * Authoritative session phase for client UI routing.
 *
 * State machine: story_event → (choice) → active_planning | story_event | terminal;
 * active_planning → (active-action) → action_summary → (ack) → disturbance_narrative | active_planning | story_event.
 */
export type SessionPhase =
  | 'story_event'
  | 'active_planning'
  | 'passive_progression'
  | 'period_summary'
  | 'action_summary'
  | 'disturbance_narrative'
  | 'terminal';

/** Planning option aligned with `buildActiveActionChoices` output. */
export interface PlanningOptionDto {
  actionId: string;
  text: string;
  description: string;
  rewardSummary: string;
  costSummary: string;
  riskLevel: string;
  category: string;
}

export interface StoryEventDto {
  eventId: string;
  title: string;
  text: string;
  isAutomatic: boolean;
  choices?: Array<{ id: string; text: string; available: boolean }>;
}

export interface ActiveActionRequest {
  expectedSlotVersion: number;
  expectedSnapshotId: string;
  actionId: string;
}

export type ProgressionAckKind =
  | 'action_summary'
  | 'disturbance'
  | 'story_automatic'
  | 'passive_continue'
  | 'period_summary';

export interface ProgressionAckRequest {
  expectedSlotVersion: number;
  expectedSnapshotId: string;
  ackKind: ProgressionAckKind;
}

export interface HeadlessTerminalDto {
  isTerminal: true;
  isAlive: boolean;
  deathReason?: string;
  endingId?: string;
  ending?: { id: string; name: string; description: string; category: string };
  age: number;
}

/** Authoritative player-facing stats for API clients (subset of runtime state). */
export interface PlayerSummaryDto {
  name: string;
  age: number;
  martialPower: number;
  externalSkill: number;
  internalSkill: number;
  qinggong: number;
  chivalry: number;
  constitution: number;
  comprehension: number;
  money: number;
  reputation: number;
  connections: number;
  knowledge: number;
  businessAcumen: number;
  influence: number;
  charisma: number;
  sect?: string;
  alive: boolean;
  investments: Investments;
  currentYear: number;
  currentMonth: number;
  currentDay: number;
  /** Habit shaping axes for main-screen shapingSummary (P122 API mode). */
  lifeStates?: PlayerLifeStates;
}

/**
 * Shared progression payload for create, restore, choice, active-action, and progression-ack.
 *
 * When `sessionPhase` is omitted (legacy clients), infer from `nextEvent` / `planningOptions`.
 */
export interface SessionProgressionPayload {
  sessionPhase: SessionPhase;
  nextEvent: StoryEventDto | null;
  planningOptions: PlanningOptionDto[];
  activeActionSummary: ActiveActionSummaryDisplay | null;
  disturbanceNarrative: DisturbanceNarrativeDisplay | null;
  periodSummary: PeriodSummaryDisplay | null;
  passiveNarrative: PassiveNarrativeDisplay | null;
  slotVersion: number;
  snapshotId: string;
  terminal: HeadlessTerminalDto | null;
  lifeMemory: LifeMemorySummary;
  player: PlayerSummaryDto;
}

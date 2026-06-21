/**
 * Headless engine session contract (P5 US-003).
 * @see docs/contracts/choice-execution-request-contract.md
 * @see docs/contracts/game-state-snapshot-contract.md
 */

import type { ChoiceExecutionRequest, ChoiceExecutionResponse } from '../../contracts/choiceExecution';
import type { GameStateSnapshot } from '../../contracts/gameStateSnapshot';
import type { LifeMemorySummary } from '../../types/lifeMemory';
import type { EventDefinition } from '../../types/eventTypes';
import type { HeadlessSessionDependencies } from '../dependencies/HeadlessSessionDependencies';
import type { PlanningOptionDto } from '../../contracts/sessionProgression';
import type { ProgressionAckKind, SessionPhase } from './sessionTypes';
import type {
  HeadlessProgressionVolatileState,
  HeadlessSessionError,
  HeadlessTerminalState,
  NextEventResult,
  ProgressAutomaticResult,
} from './sessionTypes';

export interface HeadlessSessionCreateOptions {
  playerName: string;
  gender: 'male' | 'female';
  catalogVersion?: string;
  randomSeed?: number;
}

export interface HeadlessEngineSession {
  readonly sessionId: string;
  readonly dependencies: HeadlessSessionDependencies;

  /** Replace runtime state from a validated snapshot (async: may re-select next event internally). */
  hydrate(snapshot: GameStateSnapshot): Promise<void>;

  /** Select and attach the next playable event; does not execute choice effects. */
  getNextEvent(): Promise<NextEventResult | null>;

  /** Run automatic event chains until choice required, terminal, or safety limit. */
  progressAutomatic(options?: { maxSteps?: number }): Promise<ProgressAutomaticResult>;

  /** Apply a trusted choice per P4 choice-execution request shape. */
  executeChoice(request: ChoiceExecutionRequest): Promise<ChoiceExecutionResponse>;

  /** Serialize current runtime state to `GameStateSnapshot`. */
  serialize(): GameStateSnapshot;

  /** Reset to a new life per current runtime restart rules. */
  restart(options: HeadlessSessionCreateOptions): Promise<void>;

  /** Read ending/death terminal state if progression has stopped. */
  getTerminalState(): HeadlessTerminalState | null;

  /** Derive life memory summary from current state (no UI). */
  getLifeMemory(): LifeMemorySummary;

  /** Current event id if one is pending player action. */
  getCurrentEvent(): EventDefinition | null;

  /** Map attached current event to API next-event shape without selecting a new event. */
  describePendingEvent(): NextEventResult | null;

  /** Last structured error for observability (cleared on success). */
  getLastError(): HeadlessSessionError | null;

  /** P7.2: authoritative phase for API / client routing. */
  getSessionPhase(): SessionPhase;

  /** P7.2: volatile summary/disturbance UI state (not in serialize()). */
  getProgressionVolatileState(): HeadlessProgressionVolatileState;

  /** P7.2: restore volatile UI state after snapshot hydrate (server request boundary). */
  applyProgressionVolatileState(state: HeadlessProgressionVolatileState): void;

  /** P7.2: planning options when phase is active_planning. */
  getPlanningOptions(): PlanningOptionDto[];

  /** P7.2: execute one active action; mutates engine state and volatile summary. */
  executeActiveAction(actionId: string): Promise<void>;

  /** P7.2: ack summary or disturbance; may re-resolve story/planning without snapshot write. */
  acknowledgeProgression(ackKind: ProgressionAckKind): Promise<void>;

  /** Ensure passive childhood narrative is ready when phase is passive_progression. */
  ensurePassivePresentation(): void;

  /** P8.1: advance in-game calendar when phase loop does not advance age. */
  advanceCalendar(amount: number, unit: 'year' | 'month'): Promise<void>;

  /** P11: whether a critical/mandatory event is pending at current age. */
  hasPendingForcedEvent(): boolean;

  /** Read mutable engine state (playability runner / tests). */
  getRuntimeState(): import('../../types/eventTypes').GameState;
}

export type HeadlessEngineSessionFactory = (
  options: HeadlessSessionCreateOptions | { snapshot: GameStateSnapshot },
  dependencies?: Partial<HeadlessSessionDependencies>,
) => HeadlessEngineSession;

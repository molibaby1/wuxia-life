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
import type {
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

  /** Last structured error for observability (cleared on success). */
  getLastError(): HeadlessSessionError | null;
}

export type HeadlessEngineSessionFactory = (
  options: HeadlessSessionCreateOptions | { snapshot: GameStateSnapshot },
  dependencies?: Partial<HeadlessSessionDependencies>,
) => HeadlessEngineSession;

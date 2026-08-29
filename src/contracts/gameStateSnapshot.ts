/**
 * Game state snapshot contract types (P4 US-004).
 *
 * Transport/persistence contract — plain JSON shape for adapters, API, and
 * backend separation. Does NOT replace runtime `GameState` in eventTypes.ts.
 *
 * @see docs/contracts/game-state-snapshot-contract.md
 */

import type {
  CriticalChoices,
  EffectDefinition,
  InventoryItem,
  KarmaSystem,
  LifePath,
  PlayerLifeStates,
  HealthStatus,
  StatusId,
  TraitId,
  Facts,
  Investments,
  Relationship,
  AffiliationId,
} from '../types/eventTypes';
import type { WealthCapacity } from '../types/wealthCapacity';
import type { ActionFocusStreak, ActionHistoryEntry } from '../types/activeActionTypes';
import type { OriginWorldviewShaping } from '../narrative/profile/types';

/** Snapshot contract schema version (§2). */
export const GAME_STATE_SNAPSHOT_SCHEMA_VERSION = '3.16.0' as const;

/** Origin platform identifier for snapshot provenance (§3.2). */
export type SourcePlatform =
  | 'web-browser'
  | 'node-headless'
  | 'export-json'
  | 'api-server'
  | 'mini-program';

/** Engine calendar time (§5). */
export interface SnapshotCurrentTime {
  year: number;
  month: number;
  day: number;
}

/**
 * Persisted player subset for snapshot payload (§6).
 * Separate from runtime `PlayerState`; canonical player fields are explicit.
 */
export interface SnapshotPlayerState {
  name: string;
  age: number;
  gender: 'male' | 'female';
  alive: boolean;

  martialPower: number;
  chivalry: number;
  constitution: number;
  affiliation: AffiliationId | null;
  title: string | null;
  reputation: number;
  wealthCapacity: WealthCapacity;
  knowledge: number;
  charisma: number;
  businessAcumen: number;
  influence: number;
  connections: number;
  martialHeritage: number;
  scholarlyHeritage: number;
  merchantNetwork: number;
  investments: Investments;

  traits: TraitId[];
  healthStatus: HealthStatus;
  statuses: StatusId[];
  lifeStates: PlayerLifeStates;
  relationships?: Relationship[];
  spouse: string | null;
  children: number;
  timeUnit?: 'year' | 'month' | 'day';
  monthProgress?: number;
  dayProgress?: number;
  deathReason?: string;

  /** @deprecated Prefer top-level `state.flags` (§6.2). */
  flags: Record<string, unknown>;
  /** @deprecated Prefer `state.eventHistory` (§6.2). */
  events?: unknown[];
  /** @deprecated Prefer `state.inventory` (§6.2). */
  items?: unknown[];
}

/** Canonical triggered-event audit record (§9.1). */
export interface SnapshotEventRecord {
  eventId: string;
  age?: number;
  timestamp?: number | SnapshotCurrentTime;
  triggeredAt?: number | SnapshotCurrentTime;
  gameTime?: number;
  realTime?: number;
  selectedChoice?: string;
  /** Partial snapshot at event time; nested keys follow same contract rules (§9.3). */
  stateSnapshot?: PartialGameStateSnapshotState;
  appliedEffects?: EffectDefinition[];
}

/**
 * Persisted game progress payload (§5).
 * Omits derived fields such as `statistics` and volatile session state.
 */
export interface GameStateSnapshotState {
  player: SnapshotPlayerState;
  facts: Facts;
  flags: Record<string, unknown>;
  relations: Record<string, number>;
  eventHistory: SnapshotEventRecord[];

  currentTime?: SnapshotCurrentTime;
  lifePath?: LifePath;
  karma?: KarmaSystem;
  criticalChoices?: CriticalChoices;
  achievements?: string[];
  inventory?: InventoryItem[];
  ending?: unknown;
  saveVersion?: string;
  lastSavedAt?: number;
  gameTimestamp?: number;

  /** Active planning history required for future scheduling context. */
  actionHistory: ActionHistoryEntry[];
  /** Active planning streak required for future action availability. */
  actionFocusStreak: ActionFocusStreak;
  /** Childhood shaping accumulator; explicitly save-compatible. */
  p16TendencyShaping?: OriginWorldviewShaping;

  /** Pending automatic story event ID for volatile state restoration across server restarts. */
  pendingStoryEventId?: string;

  /** @deprecated Superseded by `eventHistory` (§9.2). */
  triggeredEvents?: string[];
  /** @deprecated Legacy alias; prefer `eventHistory` (§9.2). */
  events?: SnapshotEventRecord[];
}

/**
 * Strict partial state used only inside eventHistory[*].stateSnapshot.
 * Presence is optional, but every present key remains closed and validated.
 */
export type PartialGameStateSnapshotState = Omit<Partial<GameStateSnapshotState>, 'player'> & {
  player?: Partial<SnapshotPlayerState>;
};

/** Required and optional snapshot envelope metadata (§3.1). */
export interface GameStateSnapshotMetadata {
  schemaVersion: string;
  engineVersion: string;
  eventCatalogVersion: string;
  createdAt: number;
  updatedAt: number;
  sourcePlatform: SourcePlatform;
  snapshotId?: string;
  lifeMemorySchemaVersion?: string;
  contentHash?: string;
}

/** Versioned, JSON-serializable game state snapshot (§1, §3). */
export interface GameStateSnapshot {
  metadata: GameStateSnapshotMetadata;
  state: GameStateSnapshotState;
}

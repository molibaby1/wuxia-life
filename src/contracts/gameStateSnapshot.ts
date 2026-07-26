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
  IdentityInfo,
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
} from '../types/eventTypes';
import type { LifeRoadId, LifeRoadStage } from '../types/lifeRoad';

/** Snapshot contract schema version (§2). */
export const GAME_STATE_SNAPSHOT_SCHEMA_VERSION = '3.5.0' as const;

/** Origin platform identifier for snapshot provenance (§3.2). */
export type SourcePlatform =
  | 'web-browser'
  | 'node-headless'
  | 'export-json'
  | 'api-server'
  | 'mini-program';

/** Route lifecycle phase (§7.1). */
export type RouteLifecycle =
  | 'inactive'
  | 'temporary'
  | 'active'
  | 'locked_in'
  | 'turned'
  | 'completed'
  | 'failed';

/** Route category (§7.1). */
export type RouteCategory = 'main' | 'secondary';

/** Structured route state entry keyed by routeId (§7.1). */
export interface SnapshotRouteState {
  routeId: string;
  lifecycle: RouteLifecycle;
  category: RouteCategory;
  lockedIn: boolean;
  lastChangedAtAge?: number;
  sourceEventId?: string;
  reason?: string;
}

/** Append-only route transition log entry (§7.2). */
export interface SnapshotRouteHistoryEntry {
  routeId: string;
  from: RouteLifecycle;
  to: RouteLifecycle;
  category: RouteCategory;
  lockedIn: boolean;
  age?: number;
  eventId?: string;
  reason?: string;
  timestamp: number;
}

export interface SnapshotRoadCommitment {
  roadId: LifeRoadId;
  position?: 'primary' | 'secondary';
  committedAtAge: number;
  sourceChoiceId?: string;
  sourceEventId?: string;
  proofCount: number;
  latestProofEventId?: string;
  lifecycle: LifeRoadStage;
}

/** Engine calendar time (§5). */
export interface SnapshotCurrentTime {
  year: number;
  month: number;
  day: number;
}

/**
 * Persisted player subset for snapshot payload (§6).
 * Separate from runtime `PlayerState`; core identity required, progression optional.
 */
export interface SnapshotPlayerState {
  name: string;
  age: number;
  gender: 'male' | 'female';
  alive: boolean;

  martialPower?: number;
  externalSkill?: number;
  internalSkill?: number;
  qinggong?: number;
  chivalry?: number;
  constitution?: number;
  comprehension?: number;
  sect?: string | null;
  title?: string | null;
  reputation?: number;
  money?: number;
  knowledge?: number;
  charisma?: number;
  businessAcumen?: number;
  influence?: number;
  wealth?: number;
  connections?: number;
  martialHeritage?: number;
  scholarlyHeritage?: number;
  merchantNetwork?: number;
  investments: Investments;

  traits: TraitId[];
  healthStatus: HealthStatus;
  statuses: StatusId[];
  lifeStates?: PlayerLifeStates;
  relationships?: Relationship[];
  spouse?: string | null;
  children?: number;
  timeUnit?: 'year' | 'month' | 'day';
  monthProgress?: number;
  dayProgress?: number;
  deathReason?: string;

  /** @deprecated Prefer top-level `state.flags` (§6.2). */
  flags?: Record<string, unknown>;
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
  stateSnapshot?: Partial<GameStateSnapshotState>;
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
  routeStates?: Record<string, SnapshotRouteState>;
  routeHistory?: SnapshotRouteHistoryEntry[];
  roadCommitments?: Partial<Record<LifeRoadId, SnapshotRoadCommitment>>;
  lifePath?: LifePath;
  identity?: IdentityInfo;
  karma?: KarmaSystem;
  criticalChoices?: CriticalChoices;
  achievements?: string[];
  inventory?: InventoryItem[];
  ending?: unknown;
  saveVersion?: string;
  lastSavedAt?: number;
  gameTimestamp?: number;

  /** Pending automatic story event ID for volatile state restoration across server restarts. */
  pendingStoryEventId?: string;

  /** @deprecated Superseded by `eventHistory` (§9.2). */
  triggeredEvents?: string[];
  /** @deprecated Legacy alias; prefer `eventHistory` (§9.2). */
  events?: SnapshotEventRecord[];
}

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

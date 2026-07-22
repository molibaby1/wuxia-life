/**
 * P4 US-006: Game state snapshot contract tests.
 *
 * Validates JSON round-trip, required metadata, minimal persistence shape,
 * and basic forbidden-field detection (full validation in US-023).
 *
 * @see docs/contracts/game-state-snapshot-contract.md
 */

import { assert, assertDeepEqual } from '../GameTestFramework';
import {
  GAME_STATE_SNAPSHOT_SCHEMA_VERSION,
  type GameStateSnapshot,
  type GameStateSnapshotMetadata,
} from '../../src/contracts/gameStateSnapshot';
import {
  gameStateSnapshotAge50,
  serializeGameStateSnapshotAge50Fixture,
} from '../../src/contracts/fixtures/gameStateSnapshotAge50';

const REQUIRED_METADATA_KEYS: (keyof GameStateSnapshotMetadata)[] = [
  'schemaVersion',
  'engineVersion',
  'eventCatalogVersion',
  'createdAt',
  'updatedAt',
  'sourcePlatform',
];

const REQUIRED_STATE_KEYS = ['player', 'flags', 'relations', 'eventHistory'] as const;

const REQUIRED_PLAYER_KEYS = ['name', 'age', 'gender', 'alive', 'investments'] as const;

/** Derived or volatile keys that must not be required for a valid persisted snapshot. */
const OPTIONAL_DERIVED_OR_VOLATILE_STATE_KEYS = [
  'statistics',
  'currentTime',
  'routeStates',
  'routeHistory',
  'lifePath',
  'identity',
  'karma',
  'criticalChoices',
  'achievements',
  'inventory',
  'ending',
  'saveVersion',
  'lastSavedAt',
  'gameTimestamp',
] as const;

/** Forbidden keys per game-state-snapshot-contract.md §12 (basic structural check). */
const FORBIDDEN_STATE_KEYS = [
  'statistics',
  'lifeMemorySummary',
  'LifeMemorySummary',
  'currentEvent',
  'availableChoices',
  'lastEffects',
  'lastOutcomeText',
  'lastChoiceFeedback',
  'isAutoPlaying',
  'eventsThisYear',
  'lastYear',
  'annualEventPressure',
  'eventCooldown',
  'activeStoryLines',
  'pendingEventOutcomeNote',
  'suppressLethalSetbacks',
] as const;

const FORBIDDEN_TOP_LEVEL_KEYS = ['engineState', 'gameEngine', 'localStorage'] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function roundTripJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getMissingRequiredMetadata(metadata: unknown): string[] {
  if (!isPlainObject(metadata)) {
    return ['metadata must be a plain object'];
  }

  const missing: string[] = [];
  for (const key of REQUIRED_METADATA_KEYS) {
    const value = metadata[key];
    if (value === undefined || value === null || value === '') {
      missing.push(`metadata.${key}`);
    }
  }
  return missing;
}

function assertRequiredMetadataPresent(metadata: unknown): void {
  const missing = getMissingRequiredMetadata(metadata);
  assert(missing.length === 0, `required metadata missing: ${missing.join(', ')}`);
}

function detectForbiddenSnapshotFields(snapshot: unknown): string[] {
  const violations: string[] = [];

  if (!isPlainObject(snapshot)) {
    return ['snapshot root must be a plain object'];
  }

  for (const key of FORBIDDEN_TOP_LEVEL_KEYS) {
    if (key in snapshot) {
      violations.push(`forbidden top-level key: ${key}`);
    }
  }

  const state = snapshot.state;
  if (state !== undefined && isPlainObject(state)) {
    for (const key of FORBIDDEN_STATE_KEYS) {
      if (key in state) {
        violations.push(`forbidden state key: ${key}`);
      }
    }
  }

  return violations;
}

function createMinimalValidSnapshot(): GameStateSnapshot {
  return {
    metadata: {
      schemaVersion: GAME_STATE_SNAPSHOT_SCHEMA_VERSION,
      engineVersion: '0.0.0',
      eventCatalogVersion: '1.0.0',
      createdAt: 1717200000000,
      updatedAt: 1717200000000,
      sourcePlatform: 'node-headless',
    },
    state: {
      player: {
        name: 'Minimal',
        age: 1,
        gender: 'male',
        alive: true,
        investments: { martial: 0, statecraft: 0, official: 0, hermit: 0 },
      },
      flags: {},
      relations: {},
      eventHistory: [],
    },
  };
}

function assertMinimalSnapshotHasOnlyRequiredPersistenceFields(snapshot: GameStateSnapshot): void {
  for (const key of REQUIRED_STATE_KEYS) {
    assert(key in snapshot.state, `minimal snapshot must include state.${key}`);
  }

  for (const key of REQUIRED_PLAYER_KEYS) {
    assert(
      key in snapshot.state.player,
      `minimal snapshot must include state.player.${key}`,
    );
  }

  for (const key of OPTIONAL_DERIVED_OR_VOLATILE_STATE_KEYS) {
    assert(
      !(key in snapshot.state),
      `minimal snapshot must omit optional derived/volatile state.${key}`,
    );
  }
}

console.log('=== P4 US-006: Snapshot Contract Tests ===\n');

// 1. Valid snapshot JSON stringify/parse round trip
{
  const serialized = serializeGameStateSnapshotAge50Fixture();
  assert(typeof serialized === 'string' && serialized.length > 0, 'fixture serializes to non-empty JSON');

  const parsed = JSON.parse(serialized) as GameStateSnapshot;
  assertDeepEqual(parsed, gameStateSnapshotAge50, 'age-50 fixture round-trips through JSON');

  const doubleRoundTrip = roundTripJson(parsed);
  assertDeepEqual(doubleRoundTrip, gameStateSnapshotAge50, 'double JSON round-trip is stable');

  console.log('✓ valid snapshot JSON round trip');
}

// 2. Required metadata present
{
  assertRequiredMetadataPresent(gameStateSnapshotAge50.metadata);

  assert(
    gameStateSnapshotAge50.metadata.schemaVersion === GAME_STATE_SNAPSHOT_SCHEMA_VERSION,
    'fixture schemaVersion must match contract constant',
  );

  const metadataOnly = roundTripJson(gameStateSnapshotAge50.metadata);
  assertRequiredMetadataPresent(metadataOnly);

  const missingSchema = { ...gameStateSnapshotAge50.metadata };
  delete (missingSchema as Partial<GameStateSnapshotMetadata>).schemaVersion;
  assert(
    getMissingRequiredMetadata(missingSchema).includes('metadata.schemaVersion'),
    'missing schemaVersion must be reported',
  );

  console.log('✓ required metadata present');
}

// 3. Derived/volatile fields not required for persistence (minimal valid snapshot)
{
  const minimal = createMinimalValidSnapshot();
  assertMinimalSnapshotHasOnlyRequiredPersistenceFields(minimal);

  const minimalRoundTrip = roundTripJson(minimal);
  assertDeepEqual(minimalRoundTrip, minimal, 'minimal snapshot round-trips through JSON');
  assertRequiredMetadataPresent(minimalRoundTrip.metadata);
  assert(
    detectForbiddenSnapshotFields(minimalRoundTrip).length === 0,
    'minimal snapshot must not contain forbidden keys',
  );

  console.log('✓ minimal valid snapshot without derived/volatile fields');
}

// 4. Forbidden fields detection (basic structural check)
{
  const cleanViolations = detectForbiddenSnapshotFields(gameStateSnapshotAge50);
  assert(
    cleanViolations.length === 0,
    `age-50 fixture must not contain forbidden keys: ${cleanViolations.join(', ')}`,
  );

  const withForbiddenState = roundTripJson(gameStateSnapshotAge50);
  withForbiddenState.state.statistics = { eventsTriggered: 99 };
  withForbiddenState.state.lifeMemorySummary = { schemaVersion: '1.0.0' };
  withForbiddenState.state.currentEvent = { id: 'pending_event' };

  const forbiddenViolations = detectForbiddenSnapshotFields(withForbiddenState);
  assert(
    forbiddenViolations.some((v) => v.includes('statistics')),
    'forbidden detector must flag state.statistics',
  );
  assert(
    forbiddenViolations.some((v) => v.includes('lifeMemorySummary')),
    'forbidden detector must flag state.lifeMemorySummary',
  );
  assert(
    forbiddenViolations.some((v) => v.includes('currentEvent')),
    'forbidden detector must flag volatile state.currentEvent',
  );

  const withForbiddenTopLevel = {
    ...roundTripJson(gameStateSnapshotAge50),
    engineState: { currentEvent: null },
  };
  const topLevelViolations = detectForbiddenSnapshotFields(withForbiddenTopLevel);
  assert(
    topLevelViolations.some((v) => v.includes('engineState')),
    'forbidden detector must flag top-level engineState',
  );

  console.log('✓ forbidden fields detection');
}

console.log('\n✅ All snapshot contract tests passed');

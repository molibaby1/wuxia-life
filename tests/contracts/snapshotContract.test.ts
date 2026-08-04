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
import { GameEngineIntegration } from '../../src/core/GameEngineIntegration';
import { FixedTimeSource } from '../../src/headless/adapters/timeSource';
import { defaultSnapshotConverter } from '../../src/headless/snapshot/SnapshotConverter';
import { validateGameStateSnapshot } from '../../src/contracts/validation/contractValidation';

const REQUIRED_METADATA_KEYS: (keyof GameStateSnapshotMetadata)[] = [
  'schemaVersion',
  'engineVersion',
  'eventCatalogVersion',
  'createdAt',
  'updatedAt',
  'sourcePlatform',
];

const REQUIRED_STATE_KEYS = ['player', 'facts', 'flags', 'relations', 'eventHistory', 'actionHistory', 'actionFocusStreak'] as const;

const REQUIRED_PLAYER_KEYS = [
  'name',
  'age',
  'gender',
  'alive',
  'affiliation',
  'title',
  'spouse',
  'investments',
  'traits',
  'healthStatus',
  'statuses',
  'lifeStates',
] as const;

/** Derived or volatile keys that must not be required for a valid persisted snapshot. */
const OPTIONAL_DERIVED_OR_VOLATILE_STATE_KEYS = [
  'statistics',
  'currentTime',
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
  'route' + 'States',
  'route' + 'History',
  'road' + 'Commitments',
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
      facts: {},
      player: {
        name: 'Minimal',
        age: 1,
        gender: 'male',
        alive: true,
        affiliation: null,
        title: null,
        martialPower: 0,
        chivalry: 0,
        constitution: 0,
        comprehension: 0,
        reputation: 0,
        money: 0,
        knowledge: 0,
        charisma: 0,
        businessAcumen: 0,
        influence: 0,
        connections: 0,
        martialHeritage: 0,
        scholarlyHeritage: 0,
        merchantNetwork: 0,
        investments: { martial: 0, statecraft: 0, official: 0, hermit: 0 },
        flags: {},
        children: 0,
        traits: [],
        healthStatus: 'healthy',
        statuses: [],
        lifeStates: { trainingHabit: 0, studyHabit: 0, businessHabit: 0 },
        spouse: null,
      },
      flags: {},
      relations: {},
      eventHistory: [],
      actionHistory: [],
      actionFocusStreak: { category: null, count: 0 },
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

{
  const minimal = createMinimalValidSnapshot();
  assert(validateGameStateSnapshot(minimal).ok, 'minimal snapshot with complete lifeStates is valid');
  const restoredMinimal = defaultSnapshotConverter.fromSnapshot(minimal);
  assertDeepEqual(
    restoredMinimal.player.lifeStates,
    { trainingHabit: 0, studyHabit: 0, businessHabit: 0 },
    'minimal snapshot preserves complete lifeStates on restore',
  );

  const valid = JSON.parse(JSON.stringify(gameStateSnapshotAge50)) as GameStateSnapshot;
  assert(validateGameStateSnapshot(valid).ok, 'valid three-key lifeStates snapshot passes');
  defaultSnapshotConverter.fromSnapshot(valid);

  const legacy = JSON.parse(JSON.stringify(valid)) as any;
  legacy.metadata.schemaVersion = '3.7.0';
  assert(!validateGameStateSnapshot(legacy).ok, 'snapshot schema 3.7.0 must be rejected');

  const legacyField = JSON.parse(JSON.stringify(valid)) as any;
  legacyField.state.player.lifeStates.discipline = 1;
  assert(!validateGameStateSnapshot(legacyField).ok, 'legacy discipline field must be rejected');
  let threw = false;
  try {
    defaultSnapshotConverter.fromSnapshot(legacyField);
  } catch {
    threw = true;
  }
  assert(threw, 'converter must reject legacy discipline field');

  for (const key of ['familyBond', 'socialMomentum']) {
    const oldAxis = JSON.parse(JSON.stringify(valid)) as any;
    oldAxis.state.player.lifeStates[key] = 1;
    assert(!validateGameStateSnapshot(oldAxis).ok, `${key} snapshot must be rejected`);
    let axisThrew = false;
    try {
      defaultSnapshotConverter.fromSnapshot(oldAxis);
    } catch {
      axisThrew = true;
    }
    assert(axisThrew, `converter must reject ${key}`);
  }

  const missingLifeStates = JSON.parse(JSON.stringify(valid)) as any;
  delete missingLifeStates.state.player.lifeStates;
  assert(!validateGameStateSnapshot(missingLifeStates).ok, 'snapshot missing lifeStates must be rejected');
  let missingThrew = false;
  try {
    defaultSnapshotConverter.fromSnapshot(missingLifeStates);
  } catch {
    missingThrew = true;
  }
  assert(missingThrew, 'converter must reject snapshot missing lifeStates');

  for (const key of ['trainingHabit', 'studyHabit', 'businessHabit']) {
    const missingHabit = JSON.parse(JSON.stringify(valid)) as any;
    delete missingHabit.state.player.lifeStates[key];
    assert(!validateGameStateSnapshot(missingHabit).ok, `${key} missing must be rejected`);
  }

  for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -1, 6]) {
    const invalidValue = JSON.parse(JSON.stringify(valid)) as any;
    invalidValue.state.player.lifeStates.trainingHabit = value;
    assert(!validateGameStateSnapshot(invalidValue).ok, `lifeStates value ${String(value)} must be rejected`);
  }
  console.log('✓ lifeStates snapshot validation and conversion boundary');
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

  const oldSnapshot = structuredClone(gameStateSnapshotAge50);
  oldSnapshot.metadata.schemaVersion = '3.4.0' as never;
  let rejected = false;
  try {
    defaultSnapshotConverter.fromSnapshot(oldSnapshot);
  } catch (error) {
    rejected = error instanceof Error && /3\.13\.0/.test(error.message);
  }
  assert(rejected, '3.4.0 snapshot must be rejected without migration');

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

// Canonical Player State V1 Slice 3A: facts are required, persisted, and independent from legacy flags.
{
  const engine = new GameEngineIntegration();
  const initialState = engine.getGameState();
  assertDeepEqual(initialState.facts, {}, 'new GameState initializes facts to an empty object');
  assert(!Object.prototype.hasOwnProperty.call(initialState.player, 'facts'), 'PlayerState must not contain facts');

  initialState.facts = {
    boolean_fact: true,
    string_fact: 'resolved',
    number_fact: 3,
  };
  initialState.flags = { legacy_marker: true };
  initialState.player.flags = { player_legacy_marker: true };

  const snapshot = defaultSnapshotConverter.toSnapshot(initialState, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: new FixedTimeSource(1717200000000),
  });
  const roundTrippedSnapshot = JSON.parse(JSON.stringify(snapshot)) as GameStateSnapshot;
  const restored = defaultSnapshotConverter.fromSnapshot(roundTrippedSnapshot);

  assertDeepEqual(restored.facts, initialState.facts, 'facts preserve boolean/string/number values through persistence');
  assert(restored.flags.legacy_marker === true, 'legacy top-level flag remains in flags');
  assert(!Object.prototype.hasOwnProperty.call(restored.facts, 'legacy_marker'), 'legacy flags are not copied into facts');
  assert(!Object.prototype.hasOwnProperty.call(restored.flags, 'boolean_fact'), 'facts are not copied into flags');
  assert(!Object.prototype.hasOwnProperty.call(restored.player, 'facts'), 'restored PlayerState must not contain facts');
  console.log('✓ canonical facts initialize and round-trip independently from legacy flags');
}

{
  const runtime = new GameEngineIntegration().getGameState();
  delete (runtime.player as any).lifeStates;
  let serializeThrew = false;
  try {
    defaultSnapshotConverter.toSnapshot(runtime, {
      eventCatalogVersion: '1.0.0',
      sourcePlatform: 'node-headless',
      time: new FixedTimeSource(1717200000000),
    });
  } catch {
    serializeThrew = true;
  }
  assert(serializeThrew, 'serializer must reject missing lifeStates instead of completing it');
  assert(
    validateGameStateSnapshot(createMinimalValidSnapshot()).ok,
    'valid complete lifeStates remains accepted',
  );
  console.log('✓ lifeStates is mandatory for validation and serialization');
}

console.log('\n✅ All snapshot contract tests passed');

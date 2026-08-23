import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assert } from './GameTestFramework';
import {
  CANONICAL_SNAPSHOT_PLAYER_KEYS,
  validateCanonicalSnapshot,
} from '../src/contracts/validation/canonicalGameStateValidation';
import {
  GAME_STATE_SNAPSHOT_SCHEMA_VERSION,
  type GameStateSnapshot,
} from '../src/contracts/gameStateSnapshot';
import { gameStateSnapshotAge50 } from '../src/contracts/fixtures/gameStateSnapshotAge50';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { dailyEvents } from '../src/data/life/dailyEvents';
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { CHALLENGE_SCENES } from '../src/data/challengeScenes';

const LEGACY_MARTIAL_FIELDS = ['externalSkill', 'internalSkill', 'qinggong'] as const;

function cloneSnapshot(snapshot: GameStateSnapshot): GameStateSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as GameStateSnapshot;
}

function countLegacyFieldDefinitions(source: string): number {
  let count = 0;
  for (const field of LEGACY_MARTIAL_FIELDS) {
    count += (source.match(new RegExp(`\\b${field}\\s*\\??\\s*:`, 'g')) ?? []).length;
    count += (source.match(new RegExp(`\\|\\s*'${field}'`, 'g')) ?? []).length;
  }
  return count;
}

function countLegacyMentions(source: string): number {
  let count = 0;
  for (const field of LEGACY_MARTIAL_FIELDS) {
    count += (source.match(new RegExp(`\\b${field}\\b`, 'g')) ?? []).length;
  }
  return count;
}

function issuesIncludePath(issues: Array<{ path: string }>, path: string): boolean {
  return issues.some(issue => issue.path === path);
}

function run(): void {
  const eventTypesSource = readFileSync(resolve('src/types/eventTypes.ts'), 'utf8');
  const effectsSource = readFileSync(resolve('src/types/effects.ts'), 'utf8');
  assert(
    countLegacyFieldDefinitions(eventTypesSource) === 0,
    'PlayerState/PlayerStats/TraitStatKey must not define legacy martial fields',
  );
  assert(
    countLegacyFieldDefinitions(effectsSource) === 0,
    'StatType must not define legacy martial fields',
  );

  assert(
    GAME_STATE_SNAPSHOT_SCHEMA_VERSION === '3.15.0',
    `schema version must be 3.15.0, got ${GAME_STATE_SNAPSHOT_SCHEMA_VERSION}`,
  );

  for (const field of LEGACY_MARTIAL_FIELDS) {
    assert(
      !(CANONICAL_SNAPSHOT_PLAYER_KEYS as readonly string[]).includes(field),
      `PLAYER_KEYS must not include ${field}`,
    );
  }

  const fixturePlayer = gameStateSnapshotAge50.state.player as Record<string, unknown>;
  for (const field of LEGACY_MARTIAL_FIELDS) {
    assert(!(field in fixturePlayer), `age50 fixture player must not contain ${field}`);
  }

  const engine = new GameEngineIntegration();
  engine.startNewGame('Legacy Martial Removal', 'male');
  const initialPlayer = engine.getGameState().player as Record<string, unknown>;
  for (const field of LEGACY_MARTIAL_FIELDS) {
    assert(!(field in initialPlayer), `startNewGame player must not contain ${field}`);
  }

  for (const field of LEGACY_MARTIAL_FIELDS) {
    assert(
      !ConditionEvaluator.DIRECT_PLAYER_PROPERTIES.has(field),
      `DIRECT_PLAYER_PROPERTIES must not include ${field}`,
    );
  }

  assert(
    countLegacyMentions(JSON.stringify(CHALLENGE_SCENES)) === 0,
    'challengeScenes must not mention legacy martial fields',
  );

  const morning = dailyEvents.find(event => event.id === 'daily_morning_training');
  assert(Boolean(morning), 'daily_morning_training must exist');
  assert(
    !JSON.stringify(morning).includes('externalSkill'),
    'daily morning training must not write externalSkill',
  );

  const model = buildMainScreenModel(
    {
      name: 'legacy-removal',
      age: 20,
      martialPower: 20,
      chivalry: 20,
      constitution: 20,
      money: 100,
      wealthCapacity: 'no_surplus',
      affiliation: null,
      alive: true,
      currentYear: 20,
      currentMonth: 1,
      currentDay: 1,
      reputation: 20,
      connections: 20,
      charisma: 20,
      knowledge: 20,
      businessAcumen: 20,
    },
    {
      schemaVersion: '3.0.0',
      derivedAtAge: 20,
      risks: [],
    } as never,
  );
  const exposedKeys = new Set([
    ...model.coreStats.map(item => item.key),
    ...model.fullStatGroups.flatMap(group => group.items.map(item => item.key)),
  ]);
  for (const field of LEGACY_MARTIAL_FIELDS) {
    assert(!exposedKeys.has(field), `mainScreenModel must not expose ${field}`);
  }

  const clean = cloneSnapshot(gameStateSnapshotAge50 as GameStateSnapshot);
  assert(
    validateCanonicalSnapshot(clean).length === 0,
    'clean 3.15.0 fixture must validate',
  );

  for (const field of LEGACY_MARTIAL_FIELDS) {
    const topLevel = cloneSnapshot(clean) as GameStateSnapshot & {
      state: { player: Record<string, unknown> };
    };
    topLevel.state.player[field] = 1;
    const topIssues = validateCanonicalSnapshot(topLevel);
    assert(
      issuesIncludePath(topIssues, `snapshot.state.player.${field}`),
      `snapshot validation must reject top-level player.${field}`,
    );

    const nested = cloneSnapshot(clean) as GameStateSnapshot & {
      state: { eventHistory: Array<{ stateSnapshot?: { player: Record<string, unknown> } }> };
    };
    const nestedRecord = nested.state.eventHistory.find(entry => entry.stateSnapshot?.player);
    assert(Boolean(nestedRecord?.stateSnapshot?.player), 'fixture must include nested stateSnapshot.player');
    nestedRecord!.stateSnapshot!.player[field] = 1;
    const nestedIssues = validateCanonicalSnapshot(nested);
    assert(
      nestedIssues.some(issue => issue.path.includes(`stateSnapshot.player.${field}`)),
      `snapshot validation must reject nested stateSnapshot player.${field}`,
    );
  }

  const oldSchema = cloneSnapshot(clean);
  oldSchema.metadata.schemaVersion = '3.12.0';
  const oldIssues = validateCanonicalSnapshot(oldSchema);
  assert(
    oldIssues.some(
      issue =>
        issue.path === 'snapshot.metadata.schemaVersion' &&
        issue.message.includes('3.15.0'),
    ),
    '3.12.0 schemaVersion must be rejected',
  );

  console.log('canonicalLegacyMartialFieldRemoval.test.ts: ok');
}

run();

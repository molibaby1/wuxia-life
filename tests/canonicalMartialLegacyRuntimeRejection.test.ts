import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assert } from './GameTestFramework';
import { StatModifyHandler } from '../src/core/EventExecutor';
import { EffectType, type EffectDefinition, type GameState, type PlayerState } from '../src/types/eventTypes';

const LEGACY_TARGETS = ['externalSkill', 'internalSkill', 'qinggong'] as const;

function createState(overrides: Partial<PlayerState> = {}): GameState {
  return {
    saveVersion: '1.0.0',
    lastSavedAt: Date.now(),
    gameTimestamp: Date.now(),
    player: {
      name: 'runtime-rejection',
      gender: 'male',
      age: 20,
      martialPower: 30,
      chivalry: 10,
      constitution: 80,
      charisma: 20,
      knowledge: 25,
      connections: 15,
      reputation: 20,
      money: 100,
      flags: {},
      events: [],
      relationships: [],
      alive: true,
      ...overrides,
    },
    triggeredEvents: [],
    eventHistory: [],
    flags: {},
    relations: {},
    inventory: [],
    statistics: {
      totalEvents: 0,
      totalChoices: 0,
      playTime: 0,
    },
  };
}

function statEffect(target: string, value: number, operator: 'add' | 'set' = 'add'): EffectDefinition {
  return {
    type: EffectType.STAT_MODIFY,
    target,
    value,
    operator,
  };
}

function snapshotStats(player: PlayerState): Record<string, number> {
  return {
    martialPower: player.martialPower,
    constitution: player.constitution,
    knowledge: player.knowledge,
  };
}

async function assertRejected(
  handler: StatModifyHandler,
  state: GameState,
  target: string,
  value: number,
): Promise<void> {
  const beforePlayer = JSON.stringify(state.player);
  const beforeStats = snapshotStats(state.player);
  const after = await handler.execute(statEffect(target, value, 'add'), state);
  const afterStats = snapshotStats(after.player);

  assert(JSON.stringify(after.player) === beforePlayer, `${target} ${value} must not mutate player`);
  assert(afterStats.martialPower === beforeStats.martialPower, `${target}: martialPower must stay unchanged`);
  assert(afterStats.constitution === beforeStats.constitution, `${target}: constitution must stay unchanged`);
  assert(afterStats.knowledge === beforeStats.knowledge, `${target}: knowledge must stay unchanged`);
}

function assertAllowlistSealed(): void {
  const source = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../src/core/EventExecutor.ts'),
    'utf8',
  );

  const allowlistBlock = source.match(
    /private static readonly MODIFIABLE_PLAYER_STATS = new Set<string>\(\[([\s\S]*?)\]\);/,
  )?.[1];
  assert(Boolean(allowlistBlock), 'MODIFIABLE_PLAYER_STATS initializer must be readable');
  for (const field of LEGACY_TARGETS) {
    assert(
      !new RegExp(`['"]${field}['"]`).test(allowlistBlock!),
      `MODIFIABLE_PLAYER_STATS must not include ${field}`,
    );
  }

  const executeBlock = source.match(/async execute\(effect: EffectDefinition, state: GameState\): Promise<GameState> \{([\s\S]*?)\n  \}/)?.[1];
  assert(Boolean(executeBlock), 'StatModifyHandler.execute body must be readable');
  assert(
    !/target === ['"]internalSkill['"]/.test(executeBlock!),
    'execute must not keep internalSkill bonus branch',
  );
  assert(
    !/target === ['"]externalSkill['"]/.test(executeBlock!),
    'execute must not keep externalSkill bonus branch',
  );
  assert(
    /!StatModifyHandler\.MODIFIABLE_PLAYER_STATS\.has\(target\)/.test(executeBlock!),
    'execute must use allowlist-only rejection gate',
  );

  const clampBlock = source.match(/private clampValue\(value: number, statName: string\): number \{([\s\S]*?)\n  \}/)?.[1];
  assert(Boolean(clampBlock), 'clampValue body must be readable');
  const rangesBlock = clampBlock!.match(/const ranges: Record<string, \[number, number\]> = \{([\s\S]*?)\};/)?.[1];
  assert(Boolean(rangesBlock), 'clamp ranges object must be readable');
  for (const field of LEGACY_TARGETS) {
    assert(!new RegExp(`${field}\\s*:`).test(rangesBlock!), `clamp ranges must not include ${field}`);
  }
}

async function run(): Promise<void> {
  const handler = new StatModifyHandler();
  const rich = createState({
    constitution: 80,
    knowledge: 80,
    martialPower: 30,
  });

  // A/B/C: legacy targets rejected for both positive and negative deltas; no floor(/20) side effects.
  await assertRejected(handler, rich, 'externalSkill', 5);
  await assertRejected(handler, rich, 'internalSkill', 5);
  await assertRejected(handler, rich, 'qinggong', 5);
  await assertRejected(handler, rich, 'internalSkill', -5);
  await assertRejected(handler, rich, 'qinggong', 1);

  // D: canonical stat_modify still works.
  let state = createState({ martialPower: 30, constitution: 20, knowledge: 25 });
  state = await handler.execute(statEffect('martialPower', 5, 'add'), state);
  assert(state.player.martialPower === 35, 'martialPower +5 must apply');
  state = await handler.execute(statEffect('constitution', 3, 'add'), state);
  assert(state.player.constitution === 23, 'constitution +3 must apply');
  state = await handler.execute(statEffect('knowledge', -2, 'add'), state);
  assert(state.player.knowledge === 23, 'knowledge -2 must apply');

  // E: same silent no-op failure shape as ordinary unknown target.
  const unknownBefore = createState();
  const unknownAfter = await handler.execute(statEffect('unknown_legacy_stat', 5, 'add'), unknownBefore);
  assert(
    JSON.stringify(unknownAfter.player) === JSON.stringify(unknownBefore.player),
    'unknown_legacy_stat must silently leave player unchanged',
  );
  const legacyAfter = await handler.execute(statEffect('externalSkill', 5, 'add'), unknownBefore);
  assert(
    JSON.stringify(legacyAfter.player) === JSON.stringify(unknownBefore.player),
    'legacy martial target must share unknown-target silent rejection semantics',
  );

  assertAllowlistSealed();
  console.log('canonicalMartialLegacyRuntimeRejection.test.ts: ok');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});

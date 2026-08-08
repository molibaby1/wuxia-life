import { assert } from './GameTestFramework';
import { SETBACK_EVENTS } from '../src/data/setbackEvents';
import {
  applySetbackEffects,
  applySetbackStatChanges,
  SETBACK_MODIFIABLE_STATS,
} from '../src/core/SetbackEventSystem';
import type { GameState, PlayerState } from '../src/types/eventTypes';

const LEGACY_MARTIAL_FIELDS = new Set(['externalSkill', 'internalSkill', 'qinggong']);
const CULTIVATION_DEVIATION_ID = ' cultivation_deviation';

function createState(overrides: Partial<PlayerState> = {}): GameState {
  return {
    saveVersion: '1.0.0',
    lastSavedAt: Date.now(),
    gameTimestamp: Date.now(),
    player: {
      name: 'setback-pruning',
      gender: 'male',
      age: 20,
      martialPower: 40,
      chivalry: 20,
      constitution: 60,
      charisma: 20,
      knowledge: 25,
      connections: 15,
      reputation: 30,
      money: 200,
      businessAcumen: 10,
      flags: {},
      events: [],
      relationships: [],
      alive: true,
      ...overrides,
    },
    currentTime: { year: 20, month: 1, day: 1 },
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

function collectFormalStatChangeKeys(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const event of SETBACK_EVENTS) {
    for (const key of Object.keys(event.effects.statChanges ?? {})) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

function run(): void {
  const before = createState({
    martialPower: 40,
    constitution: 60,
  });
  const after = applySetbackEffects(before, CULTIVATION_DEVIATION_ID);

  // A / RED→GREEN: formal cultivation_deviation must not mutate legacy martial fields.
  assert(after.player.martialPower === 25, 'cultivation_deviation must keep martialPower -15');
  assert(after.player.constitution === 50, 'cultivation_deviation must keep constitution -10');

  // B: unknown / legacy keys must not create ghost properties or mutate existing fields.
  const ghostPlayer = applySetbackStatChanges(createState().player, {
    unknown_setback_stat: 99,
    martialPower: -5,
  });
  assert(ghostPlayer.martialPower === 35, 'canonical martialPower setback must still apply beside ignored keys');
  assert(
    !Object.prototype.hasOwnProperty.call(ghostPlayer, 'unknown_setback_stat'),
    'unknown setback key must not create a ghost PlayerState property',
  );

  // C: formal canonical keys keep clamp-at-zero semantics.
  const clamped = applySetbackStatChanges(
    createState({ martialPower: 3, constitution: 2, money: 50 }).player,
    { martialPower: -10, constitution: -5, money: -100 },
  );
  assert(clamped.martialPower === 0, 'martialPower setback must clamp at 0');
  assert(clamped.constitution === 0, 'constitution setback must clamp at 0');
  assert(clamped.money === 0, 'money setback must clamp at 0');

  assert(
    applySetbackStatChanges(createState({ reputation: 30 }).player, { reputation: -25 }).reputation === 5,
    'reputation setback must apply exact delta',
  );
  assert(
    applySetbackStatChanges(createState({ knowledge: 25 }).player, { knowledge: -5 }).knowledge === 20,
    'knowledge setback must apply exact delta',
  );
  assert(
    applySetbackStatChanges(createState({ connections: 15 }).player, { connections: -15 }).connections === 0,
    'connections setback must clamp at 0',
  );

  // D: formal inventory sealed.
  const counts = collectFormalStatChangeKeys();
  for (const field of LEGACY_MARTIAL_FIELDS) {
    assert((counts.get(field) ?? 0) === 0, `formal setbackEvents must not contain ${field}`);
  }
  for (const key of counts.keys()) {
    assert(SETBACK_MODIFIABLE_STATS.has(key), `formal setback key ${key} must be in Setback allowlist`);
  }

  console.log('canonicalMartialSetbackProducerPruning.test.ts: ok');
}

run();

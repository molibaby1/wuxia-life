import { assert } from './GameTestFramework';
import { resolveActiveAction } from '../src/core/activePlanning/ActionResultResolver';
import { CriticalChoiceSystem } from '../src/core/CriticalChoiceSystem';
import { traitSystem } from '../src/core/TraitSystem';
import { activeActionCatalog } from '../src/data/activeActionCatalog';
import { childhoodActionCatalog } from '../src/data/childhoodActionCatalog';
import { coreTalents } from '../src/data/traits/coreTalents';
import { weaknesses } from '../src/data/traits/weaknesses';
import type { ActiveActionDefinition } from '../src/types/activeActionTypes';
import type { GameState, PlayerState } from '../src/types/eventTypes';

const LEGACY_MARTIAL_FIELDS = new Set(['externalSkill', 'internalSkill', 'qinggong']);

type StatEntry = { stat: string };

function legacyRewardCount(catalog: ActiveActionDefinition[]): number {
  return catalog.reduce(
    (count, action) => count + action.rewards.filter(reward => LEGACY_MARTIAL_FIELDS.has(reward.stat)).length,
    0,
  );
}

function collectLegacyTraitEntries(): Array<{ id: string; kind: 'initial' | 'growth'; stat: string }> {
  const hits: Array<{ id: string; kind: 'initial' | 'growth'; stat: string }> = [];
  for (const trait of [...coreTalents, ...weaknesses]) {
    for (const entry of trait.initialStats ?? []) {
      if (LEGACY_MARTIAL_FIELDS.has(entry.stat)) hits.push({ id: trait.id, kind: 'initial', stat: entry.stat });
    }
    for (const entry of trait.growthModifiers ?? []) {
      if (LEGACY_MARTIAL_FIELDS.has(entry.stat)) hits.push({ id: trait.id, kind: 'growth', stat: entry.stat });
    }
  }
  return hits;
}

function findAction(id: string): ActiveActionDefinition {
  const action =
    activeActionCatalog.find(item => item.id === id) ?? childhoodActionCatalog.find(item => item.id === id);
  assert(Boolean(action), `${id} must exist`);
  return action!;
}

function rewardRange(action: ActiveActionDefinition, stat: string): { min: number; max: number } | undefined {
  const reward = action.rewards.find(item => item.stat === stat);
  return reward ? { min: reward.min, max: reward.max } : undefined;
}

function createPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    name: '测试玩家',
    gender: 'male',
    age: 18,
    martialPower: 20,
    chivalry: 25,
    constitution: 20,
    charisma: 20,
    knowledge: 20,
    connections: 10,
    reputation: 50,
    money: 100,
    flags: {},
    events: [],
    relationships: [],
    alive: true,
    ...overrides,
  };
}

function createState(playerOverrides: Partial<PlayerState> = {}): GameState {
  return {
    saveVersion: '1.0.0',
    lastSavedAt: Date.now(),
    gameTimestamp: Date.now(),
    player: createPlayer(playerOverrides),
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
    criticalChoices: {},
  };
}

function assertNoLegacyKeys(deltas: Record<string, number>, label: string): void {
  for (const key of Object.keys(deltas)) {
    assert(!LEGACY_MARTIAL_FIELDS.has(key), `${label} must not produce legacy martial delta ${key}`);
  }
}

function testGreenStatic(): void {
  assert(legacyRewardCount(activeActionCatalog) === 0, 'activeActionCatalog must have 0 legacy martial rewards');
  assert(legacyRewardCount(childhoodActionCatalog) === 0, 'childhoodActionCatalog must have 0 legacy martial rewards');

  const training = findAction('action_training_basic');
  const trainingMp = rewardRange(training, 'martialPower');
  assert(Boolean(trainingMp) && trainingMp!.min === 1 && trainingMp!.max === 2, 'action_training_basic must keep martialPower 1~2');
  assert(Boolean(rewardRange(training, 'constitution')), 'action_training_basic must keep constitution reward');

  const childhood = findAction('action_childhood_training');
  const childhoodMp = rewardRange(childhood, 'martialPower');
  assert(
    !childhoodMp,
    'action_childhood_training must not offer a martialPower reward that the childhood age gate discards',
  );
  const childhoodConstitution = rewardRange(childhood, 'constitution');
  assert(
    Boolean(childhoodConstitution) && childhoodConstitution!.min === 1 && childhoodConstitution!.max === 2,
    'action_childhood_training must keep its age-valid constitution reward visible',
  );

  const yard = findAction('action_childhood_yard_play');
  assert(!rewardRange(yard, 'martialPower'), 'yard play must not add martialPower');
  assert(Boolean(rewardRange(yard, 'constitution')), 'yard play must keep constitution reward');

  const traitLegacy = collectLegacyTraitEntries();
  assert(traitLegacy.length === 0, `trait catalogs must have 0 legacy martial fields, got ${JSON.stringify(traitLegacy)}`);

  const martialBorn = coreTalents.find(item => item.id === 'martial_born');
  assert(Boolean(martialBorn), 'martial_born must exist');
  assert(
    (martialBorn!.initialStats as StatEntry[]).filter(item => item.stat === 'martialPower').length === 1,
    'martial_born must keep exactly one martialPower initialStat',
  );
  assert(
    martialBorn!.initialStats!.some(item => item.stat === 'martialPower' && item.value === 3),
    'martial_born must keep martialPower +3',
  );
  assert(
    martialBorn!.growthModifiers!.some(item => item.stat === 'martialPower' && item.multiplier === 1.15),
    'martial_born must keep martialPower ×1.15',
  );
  assert(martialBorn!.summary.includes('功力与体魄突出'), 'martial_born summary must use canonical martial wording');

  for (const id of ['keen_mind', 'perfect_memory'] as const) {
    const talent = coreTalents.find(item => item.id === id);
    assert(Boolean(talent), `${id} must exist`);
    assert(
      !(talent!.initialStats ?? []).some(item => item.stat === 'martialPower'),
      `${id} must not gain compensatory martialPower initialStat`,
    );
    assert(
      !(talent!.growthModifiers ?? []).some(item => item.stat === 'martialPower'),
      `${id} must not gain compensatory martialPower growthModifier`,
    );
  }
  const keenMind = coreTalents.find(item => item.id === 'keen_mind')!;
  assert(!keenMind.summary.includes('内功'), 'keen_mind summary must not claim independent internal-skill growth');

  const slowWitted = weaknesses.find(item => item.id === 'slow_witted');
  assert(Boolean(slowWitted), 'slow_witted must exist');
  assert(
    !(slowWitted!.growthModifiers ?? []).some(item => item.stat === 'martialPower'),
    'slow_witted must not gain martialPower penalty',
  );
  assert(
    (slowWitted!.growthModifiers ?? []).some(item => item.stat === 'knowledge'),
    'slow_witted must apply its learning penalty to knowledge growth',
  );

  const hermitState = createState({ martialPower: 20, flags: {} });
  CriticalChoiceSystem.recordChoice(hermitState, 'midlife_choice', 'hermit', true);
  assert(hermitState.player.flags['retired'] === true, 'hermit must keep retired flag');
  assert(hermitState.player.martialPower === 20, 'hermit must not modify martialPower');

}

function testGreenBehavior(): void {
  const adult = createState({ age: 18, martialPower: 20});
  const adultResult = resolveActiveAction({ state: adult, actionId: 'action_training_basic', random: () => 0.99 });
  assert(Boolean(adultResult), 'adult training must resolve');
  assertNoLegacyKeys(adultResult!.deltas, 'adult training');
  assert((adultResult!.deltas.martialPower ?? 0) > 0, 'adult training must increase martialPower');

  const age7 = createState({ age: 7, martialPower: 5});
  const age7Result = resolveActiveAction({
    state: age7,
    actionId: 'action_childhood_training',
    random: () => 0.99,
  });
  assert(Boolean(age7Result), 'age 7 childhood training must resolve');
  assertNoLegacyKeys(age7Result!.deltas, 'age 7 childhood training');
  assert(
    (age7Result!.deltas.martialPower ?? 0) === 0,
    'age 7 childhood training must not produce martialPower',
  );
  assert(age7Result!.deltas.constitution === 2, 'age 7 childhood training must produce its age-valid reward');

  const age8 = createState({ age: 8, martialPower: 5});
  const age8Result = resolveActiveAction({
    state: age8,
    actionId: 'action_childhood_training',
    random: () => 0.99,
  });
  assert(Boolean(age8Result), 'age 8 childhood training must resolve');
  assertNoLegacyKeys(age8Result!.deltas, 'age 8 childhood training');
  assert(
    (age8Result!.deltas.martialPower ?? 0) === 0,
    'age 8 childhood training must remain constitution-only',
  );
  assert(age8Result!.deltas.constitution === 2, 'age 8 childhood training must keep the same visible reward');

  const yardState = createState({ age: 6, martialPower: 5});
  const yardResult = resolveActiveAction({
    state: yardState,
    actionId: 'action_childhood_yard_play',
    random: () => 0.99,
  });
  assert(Boolean(yardResult), 'yard play must resolve');
  assertNoLegacyKeys(yardResult!.deltas, 'yard play');
  assert((yardResult!.deltas.martialPower ?? 0) === 0, 'yard play must not produce martialPower');

  const baseline = createPlayer({ martialPower: 10});
  const martialBornPlayer = traitSystem.applyTraits(baseline, ['martial_born']);
  assert(martialBornPlayer.martialPower === 13, 'applyTraits(martial_born) must apply existing martialPower +3');

  const keenPlayer = traitSystem.applyTraits(
    createPlayer({ martialPower: 10}),
    ['keen_mind'],
  );
  assert(keenPlayer.martialPower === 10, 'applyTraits(keen_mind) must not add compensatory martialPower');

  const memoryPlayer = traitSystem.applyTraits(
    createPlayer({ martialPower: 10}),
    ['perfect_memory'],
  );
  assert(memoryPlayer.martialPower === 10, 'applyTraits(perfect_memory) must not add compensatory martialPower');
}

testGreenStatic();
testGreenBehavior();
console.log('canonicalMartialNonEventProducerPruning.test.ts: ok');

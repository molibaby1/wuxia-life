import assert from 'node:assert/strict';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventExecutor } from '../src/core/EventExecutor';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import type { EffectDefinition, EventChoice, EventDefinition, GameState } from '../src/types/eventTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

const MONEY_SENTINELS = [0, 317, 9999] as const;
const TARGET_EVENT_IDS = [
  'beggars_trial_entry',
  'beggars_assembly',
  'beggars_ending_official',
] as const;
const WEALTH_REPLACEMENT_EFFECTS = new Set([
  'wealth_capacity_set',
  'wealth_capacity_raise_to',
  'wealth_capacity_lower_to',
  'wealth_capacity_at_least',
]);
const SCORED_STATS = new Set([
  'martialPower',
  'knowledge',
  'constitution',
  'chivalry',
  'charisma',
  'reputation',
]);

function getEvent(id: string): EventDefinition {
  const event = EventLoader.getInstance().getEventById(id);
  assert(event, `missing Beggars event: ${id}`);
  return event;
}

function getChoice(event: EventDefinition, id: string): EventChoice {
  const choice = event.choices?.find(candidate => candidate.id === id);
  assert(choice, `missing choice ${id} in ${event.id}`);
  return choice;
}

function effectTarget(effect: EffectDefinition): string | undefined {
  return effect.target ?? effect.stat ?? effect.flag;
}

function isMoneyEffect(effect: EffectDefinition): boolean {
  return effect.type === 'stat_modify' && effectTarget(effect) === 'money';
}

function isWealthReplacementEffect(effect: EffectDefinition): boolean {
  if (WEALTH_REPLACEMENT_EFFECTS.has(effect.type)) return true;
  return effect.type === 'stat_modify' && effectTarget(effect) === 'wealth';
}

function eventEffects(event: EventDefinition): EffectDefinition[] {
  return [
    ...(event.autoEffects ?? []),
    ...(event.choices ?? []).flatMap(choice => choice.effects ?? []),
  ];
}

function scoreEffects(effects: EffectDefinition[] | undefined): number {
  let score = 0;
  for (const effect of effects ?? []) {
    const target = effectTarget(effect) ?? '';
    if (target === 'money') continue;
    if (effect.operator === 'add') {
      const value = typeof effect.value === 'number' ? effect.value : 0;
      score += SCORED_STATS.has(target) ? value * 2 : value;
    } else if (effect.operator === 'subtract') {
      const value = typeof effect.value === 'number' ? effect.value : 0;
      score -= value;
    }
  }
  return score;
}

/** Mirrors D6 pickAutoChoice wallet-inert scoring for Beggars choice events. */
function pickAutoChoiceId(event: EventDefinition): string {
  assert(event.choices?.length, `${event.id} must have choices`);
  let best = event.choices[0]!;
  let bestScore = -Infinity;
  for (const choice of event.choices) {
    const score = (typeof choice.weight === 'number' ? choice.weight : 1) + scoreEffects(choice.effects);
    if (score > bestScore) {
      bestScore = score;
      best = choice;
    }
  }
  return best.id;
}

function createScenario(money: number, flags: Record<string, boolean>): {
  engine: GameEngineIntegration;
  state: GameState;
} {
  const engine = new GameEngineIntegration();
  engine.startNewGame('Beggars Route Wallet Retirement', 'male');
  engine.setSuppressLethalSetbacks(true);
  const state = engine.getGameState();
  state.player.money = money;
  state.player.chivalry = 10;
  state.player.reputation = 10;
  state.player.knowledge = 10;
  state.player.charisma = 10;
  state.player.traits = [];
  state.flags = { ...flags };
  state.player.flags = { ...flags };
  return { engine, state };
}

function meaningfulTrialShare(state: GameState): Record<string, unknown> {
  return {
    chivalry: state.player.chivalry,
    wealthCapacity: state.player.wealthCapacity,
    beggars_trial_started: Boolean(state.flags.beggars_trial_started),
    beggars_trial_shared: Boolean(state.flags.beggars_trial_shared),
  };
}

function meaningfulAssemblyTrade(state: GameState): Record<string, unknown> {
  return {
    wealthCapacity: state.player.wealthCapacity,
    beggars_assembly_done: Boolean(state.flags.beggars_assembly_done),
    beggars_path_trade: Boolean(state.flags.beggars_path_trade),
  };
}

function meaningfulEndingOfficial(state: GameState): Record<string, unknown> {
  return {
    reputation: state.player.reputation,
    wealthCapacity: state.player.wealthCapacity,
    beggars_ending_official: Boolean(state.flags.beggars_ending_official),
  };
}

function testAuthoringRetirement(): void {
  assert.equal(TARGET_EVENT_IDS.length, 3, 'D7 must retire exactly three target events');

  let totalMoneyWrites = 0;
  for (const eventId of TARGET_EVENT_IDS) {
    const event = getEvent(eventId);
    const moneyWrites = eventEffects(event).filter(isMoneyEffect).length;
    totalMoneyWrites += moneyWrites;
    assert.equal(moneyWrites, 0, `${eventId} money writes must be 0`);
    assert.equal(
      eventEffects(event).some(isWealthReplacementEffect),
      false,
      `${eventId} must not gain Wealth replacement`,
    );
  }
  assert.equal(totalMoneyWrites, 0, 'D7 target wallet flow total must be 0');

  const trial = getEvent('beggars_trial_entry');
  assert.equal(trial.eventType, 'choice');
  assert.deepEqual(trial.ageRange, { min: 14, max: 22 });
  assert.deepEqual(trial.triggers, [{ type: 'age_reach', value: 14 }]);
  assert.deepEqual(trial.conditions, [
    {
      type: 'expression',
      expression: 'flags.has("beggars_trial_active") && !flags.has("beggars_trial_started")',
    },
  ]);
  assert.equal(trial.weight, 60);
  assert.equal(trial.metadata?.autoResolve, true);
  assert.equal(trial.metadata?.enabled, true);
  assert.deepEqual(
    trial.choices?.map(choice => choice.id),
    ['beggars_trial_help', 'beggars_trial_share', 'beggars_trial_wary'],
  );
  assert.deepEqual(
    trial.choices?.map(choice => choice.weight),
    [3, 2, 1],
  );

  const share = getChoice(trial, 'beggars_trial_share');
  assert(share.effects?.some(effect => effect.type === 'stat_modify' && effectTarget(effect) === 'chivalry' && effect.value === 2));
  assert(share.effects?.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'beggars_trial_shared'));
  assert(share.effects?.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'beggars_trial_started'));
  assert(share.effects?.some(effect => effect.type === 'event_record' && effect.target === 'beggars_trial_share'));
  assert(share.effects?.some(effect => effect.type === 'time_advance' && effect.value === 10));

  const assembly = getEvent('beggars_assembly');
  assert.equal(assembly.eventType, 'choice');
  assert.deepEqual(assembly.ageRange, { min: 19, max: 30 });
  assert.deepEqual(assembly.triggers, [{ type: 'age_reach', value: 19 }]);
  assert.deepEqual(assembly.conditions, [
    {
      type: 'expression',
      expression:
        'flags.has("route_beggars") && flags.has("beggars_rumor_network") && !flags.has("beggars_assembly_done")',
    },
  ]);
  assert.equal(assembly.weight, 28);
  assert.equal(assembly.metadata?.autoResolve, true);
  assert.equal(assembly.metadata?.enabled, true);
  assert.deepEqual(
    assembly.choices?.map(choice => choice.id),
    ['beggars_assembly_unity', 'beggars_assembly_relief', 'beggars_assembly_trade'],
  );
  assert.deepEqual(
    assembly.choices?.map(choice => choice.weight),
    [2, 2, 1],
  );

  const trade = getChoice(assembly, 'beggars_assembly_trade');
  assert(trade.effects?.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'beggars_path_trade'));
  assert(trade.effects?.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'beggars_assembly_done'));
  assert(trade.effects?.some(effect => effect.type === 'event_record' && effect.target === 'beggars_assembly_trade'));
  assert(trade.effects?.some(effect => effect.type === 'time_advance' && effect.value === 15));
  assert.equal(
    (trade.effects ?? []).filter(effect => effect.type === 'stat_modify').length,
    0,
    'trade branch must not invent a replacement numeric stat reward',
  );

  const unity = getChoice(assembly, 'beggars_assembly_unity');
  assert(unity.effects?.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'beggars_path_unity'));
  assert(unity.effects?.some(effect => effect.type === 'stat_modify' && effectTarget(effect) === 'charisma' && effect.value === 3));

  const relief = getChoice(assembly, 'beggars_assembly_relief');
  assert(relief.effects?.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'beggars_path_relief'));
  assert(relief.effects?.some(effect => effect.type === 'stat_modify' && effectTarget(effect) === 'chivalry' && effect.value === 3));

  const ending = getEvent('beggars_ending_official');
  assert.equal(ending.eventType, 'auto');
  assert.deepEqual(ending.ageRange, { min: 26, max: 45 });
  assert.deepEqual(ending.triggers, [{ type: 'age_reach', value: 26 }]);
  assert.deepEqual(ending.conditions, [
    {
      type: 'expression',
      expression:
        'flags.has("route_beggars") && flags.has("beggars_path_official") && !flags.has("beggars_ending_official")',
    },
  ]);
  assert.equal(ending.weight, 14);
  assert.equal(ending.metadata?.enabled, true);
  assert(ending.autoEffects?.some(effect => effect.type === 'stat_modify' && effectTarget(effect) === 'reputation' && effect.value === 5));
  assert(ending.autoEffects?.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'beggars_ending_official'));
  assert(ending.autoEffects?.some(effect => effect.type === 'event_record' && effect.target === 'beggars_ending_official'));
  assert(ending.autoEffects?.some(effect => effect.type === 'time_advance' && effect.value === 1 && effect.timeUnit === 'year'));
}

function testEligibilityAndAutoResolveAreMoneyIndependent(): void {
  const evaluator = new ConditionEvaluator();
  const trial = getEvent('beggars_trial_entry');
  const assembly = getEvent('beggars_assembly');

  const trialEligibility = MONEY_SENTINELS.map(money => {
    const { state } = createScenario(money, { beggars_trial_active: true });
    return evaluator.evaluate(trial.conditions?.[0]!, state);
  });
  assert.deepEqual(trialEligibility, [true, true, true], 'trial eligibility must ignore wallet');

  const assemblyEligibility = MONEY_SENTINELS.map(money => {
    const { state } = createScenario(money, {
      route_beggars: true,
      beggars_rumor_network: true,
    });
    return evaluator.evaluate(assembly.conditions?.[0]!, state);
  });
  assert.deepEqual(assemblyEligibility, [true, true, true], 'assembly eligibility must ignore wallet');

  const trialSelections = MONEY_SENTINELS.map(() => pickAutoChoiceId(trial));
  assert.deepEqual(
    trialSelections,
    [trialSelections[0], trialSelections[0], trialSelections[0]],
    'trial autoResolve selection must ignore wallet balance',
  );

  const assemblySelections = MONEY_SENTINELS.map(() => pickAutoChoiceId(assembly));
  assert.deepEqual(
    assemblySelections,
    [assemblySelections[0], assemblySelections[0], assemblySelections[0]],
    'assembly autoResolve selection must ignore wallet balance',
  );

  // With D6 wallet-inert scoring, trade has no scored stats; unity/relief remain preferred.
  assert.notEqual(assemblySelections[0], 'beggars_assembly_trade');
}

async function testTrialShareRuntime(): Promise<void> {
  const trial = getEvent('beggars_trial_entry');
  const share = getChoice(trial, 'beggars_trial_share');
  const outcomes: Record<string, unknown>[] = [];

  for (const money of MONEY_SENTINELS) {
    const { engine, state } = createScenario(money, { beggars_trial_active: true });
    const beforeChivalry = state.player.chivalry;
    await engine.executeChoiceEffects(share.effects ?? [], trial.id, share.id);
    const after = engine.getGameState();
    assert.equal(after.player.money, money, `beggars_trial_share must preserve money=${money}`);
    assert.equal(after.player.chivalry, beforeChivalry + 2);
    assert.equal(after.flags.beggars_trial_shared, true);
    assert.equal(after.flags.beggars_trial_started, true);
    outcomes.push(meaningfulTrialShare(after));
  }

  assert.deepEqual(outcomes[0], outcomes[1]);
  assert.deepEqual(outcomes[0], outcomes[2]);
}

async function testAssemblyTradeRuntime(): Promise<void> {
  const assembly = getEvent('beggars_assembly');
  const trade = getChoice(assembly, 'beggars_assembly_trade');
  const outcomes: Record<string, unknown>[] = [];

  for (const money of MONEY_SENTINELS) {
    const { engine } = createScenario(money, {
      route_beggars: true,
      beggars_rumor_network: true,
    });
    await engine.executeChoiceEffects(trade.effects ?? [], assembly.id, trade.id);
    const after = engine.getGameState();
    assert.equal(after.player.money, money, `beggars_assembly_trade must preserve money=${money}`);
    assert.equal(after.flags.beggars_path_trade, true);
    assert.equal(after.flags.beggars_assembly_done, true);
    outcomes.push(meaningfulAssemblyTrade(after));
  }

  assert.deepEqual(outcomes[0], outcomes[1]);
  assert.deepEqual(outcomes[0], outcomes[2]);
}

async function testEndingOfficialRuntime(): Promise<void> {
  const ending = getEvent('beggars_ending_official');
  const outcomes: Record<string, unknown>[] = [];

  for (const money of MONEY_SENTINELS) {
    const { engine, state } = createScenario(money, {
      route_beggars: true,
      beggars_path_official: true,
    });
    const beforeReputation = state.player.reputation;
    const after = await new EventExecutor().executeEffects(ending.autoEffects ?? [], engine.getGameState());
    assert.equal(after.player.money, money, `beggars_ending_official must preserve money=${money}`);
    assert.equal(after.player.reputation, beforeReputation + 5);
    assert.equal(after.flags.beggars_ending_official, true);
    outcomes.push(meaningfulEndingOfficial(after));
  }

  assert.deepEqual(outcomes[0], outcomes[1]);
  assert.deepEqual(outcomes[0], outcomes[2]);
}

async function main(): Promise<void> {
  testAuthoringRetirement();
  testEligibilityAndAutoResolveAreMoneyIndependent();
  await testTrialShareRuntime();
  await testAssemblyTradeRuntime();
  await testEndingOfficialRuntime();
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.15.0');
  console.log('globalMoneyBeggarsRouteWalletRetirement.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

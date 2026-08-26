import assert from 'node:assert/strict';
import { EventLoader } from '../src/core/EventLoader';
import { EventExecutor } from '../src/core/EventExecutor';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import type { EffectDefinition, EventChoice, EventDefinition, GameState } from '../src/types/eventTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

const MONEY_SENTINELS = [0, 317, 9999] as const;
const WEALTH_REPLACEMENT_EFFECTS = new Set([
  'wealth_capacity_set',
  'wealth_capacity_raise_to',
  'wealth_capacity_lower_to',
  'wealth_capacity_at_least',
]);

const EXPECTATIONS = [
  {
    id: 'medical_payoff_pragmatic',
    eventType: 'choice',
    ageRange: { min: 43, max: 47 },
    trigger: { type: 'age_reach', value: 43 },
    choiceIds: ['pragmatic_holder', 'pragmatic_breaker', 'pragmatic_master'],
  },
  {
    id: 'medical_imperial_doctor',
    eventType: 'choice',
    ageRange: { min: 28, max: 42 },
    trigger: { type: 'age_reach', value: 28 },
    choiceIds: ['medical_imperial_doctor_choice_1', 'medical_imperial_doctor_choice_2'],
  },
  {
    id: 'medical_palace_intrigue',
    eventType: 'choice',
    ageRange: { min: 30, max: 45 },
    trigger: { type: 'age_reach', value: 30 },
    choiceIds: ['medical_palace_intrigue_choice_1', 'medical_palace_intrigue_choice_2'],
  },
  {
    id: 'medical_on_ramp_pragmatic',
    eventType: 'auto',
    ageRange: { min: 31, max: 34 },
    trigger: { type: 'age_reach', value: 31 },
    choiceIds: [],
  },
  {
    id: 'medical_pressure_pragmatic',
    eventType: 'auto',
    ageRange: { min: 37, max: 41 },
    trigger: { type: 'age_reach', value: 37 },
    choiceIds: [],
  },
  {
    id: 'medical_late_life_pragmatic_fallen',
    eventType: 'auto',
    ageRange: { min: 52, max: 56 },
    trigger: { type: 'age_reach', value: 52 },
    choiceIds: [],
  },
  {
    id: 'medical_late_life_pragmatic_master',
    eventType: 'auto',
    ageRange: { min: 52, max: 56 },
    trigger: { type: 'age_reach', value: 52 },
    choiceIds: [],
  },
] as const;

function getEvent(id: string): EventDefinition {
  const event = EventLoader.getInstance().getEventById(id);
  assert(event, `missing Medical event: ${id}`);
  return event;
}

function getChoice(event: EventDefinition, id: string): EventChoice {
  const choice = event.choices?.find(candidate => candidate.id === id);
  assert(choice, `missing choice ${id} in ${event.id}`);
  return choice;
}

function eventEffects(event: EventDefinition): EffectDefinition[] {
  return [
    ...(event.autoEffects ?? []),
    ...(event.choices ?? []).flatMap(choice => choice.effects ?? []),
  ];
}

function isMoneyEffect(effect: EffectDefinition): boolean {
  return effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money';
}

function effectTarget(effect: EffectDefinition): string | undefined {
  return effect.target ?? effect.flag ?? effect.stat;
}

function isWealthReplacementEffect(effect: EffectDefinition): boolean {
  if (WEALTH_REPLACEMENT_EFFECTS.has(effect.type)) return true;
  return effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'wealth';
}

function createScenario(money: number, flags: Record<string, boolean>): { engine: GameEngineIntegration; state: GameState } {
  const engine = new GameEngineIntegration();
  engine.startNewGame('Medical Wallet Retirement', 'male');
  engine.setSuppressLethalSetbacks(true);
  const state = engine.getGameState();
  state.player.money = money;
  state.player.traits = [];
  state.player.reputation = 10;
  state.player.connections = 10;
  state.player.charisma = 10;
  state.player.chivalry = 10;
  state.player.constitution = 10;
  state.flags = { ...flags };
  state.player.flags = { ...flags };
  return { engine, state };
}

function meaningfulState(state: GameState, flags: string[]): Record<string, unknown> {
  return {
    reputation: state.player.reputation,
    connections: state.player.connections,
    charisma: state.player.charisma,
    chivalry: state.player.chivalry,
    constitution: state.player.constitution,
    wealthCapacity: state.player.wealthCapacity,
    flags: Object.fromEntries(flags.map(flag => [flag, Boolean(state.flags[flag])])),
  };
}

async function assertMoneyInvariant(
  label: string,
  run: (money: number) => Promise<GameState>,
  flags: string[],
): Promise<void> {
  const outcomes: Record<string, unknown>[] = [];
  for (const money of MONEY_SENTINELS) {
    const state = await run(money);
    assert.equal(state.player.money, money, `${label} must preserve money=${money}`);
    outcomes.push(meaningfulState(state, flags));
  }
  assert.deepEqual(outcomes[0], outcomes[1], `${label} meaning must not depend on money=317`);
  assert.deepEqual(outcomes[0], outcomes[2], `${label} meaning must not depend on money=9999`);
}

async function executeAutoEffects(engine: GameEngineIntegration, event: EventDefinition): Promise<GameState> {
  return new EventExecutor().executeEffects(event.autoEffects ?? [], engine.getGameState());
}

function testAuthoringAndScheduleContracts(): void {
  for (const expectation of EXPECTATIONS) {
    const event = getEvent(expectation.id);
    assert.equal(event.eventType, expectation.eventType, `${event.id} event type must remain unchanged`);
    assert.deepEqual(event.ageRange, expectation.ageRange, `${event.id} age range must remain unchanged`);
    assert.deepEqual(event.triggers, [expectation.trigger], `${event.id} trigger must remain unchanged`);
    assert.deepEqual(event.choices?.map(choice => choice.id) ?? [], expectation.choiceIds);
    assert.equal(
      eventEffects(event).filter(isMoneyEffect).length,
      0,
      `${event.id} must have no legacy money write`,
    );
    assert.equal(
      eventEffects(event).some(isWealthReplacementEffect),
      false,
      `${event.id} must not gain a Wealth replacement`,
    );
  }

  const imperial = getEvent('medical_imperial_doctor');
  const imperialAccept = getChoice(imperial, 'medical_imperial_doctor_choice_1').effects ?? [];
  assert(imperialAccept.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'medical_imperial'));
  assert(imperialAccept.some(effect => effect.type === 'stat_modify' && effectTarget(effect) === 'reputation' && effect.value === 30));
  assert(imperialAccept.some(effect => effect.type === 'stat_modify' && effectTarget(effect) === 'charisma' && effect.value === 10));

  const palace = getEvent('medical_palace_intrigue');
  const palaceChoice = getChoice(palace, 'medical_palace_intrigue_choice_2').effects ?? [];
  assert(palaceChoice.some(effect => effect.type === 'stat_modify' && effectTarget(effect) === 'reputation' && effect.value === 15));

  const onRamp = getEvent('medical_on_ramp_pragmatic');
  assert(onRamp.autoEffects?.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'medical_on_ramp_done'));
  assert(onRamp.autoEffects?.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'tavern_medical_on_ramp_pragmatic'));
  assert(onRamp.autoEffects?.some(effect => effect.type === 'event_record' && effect.target === 'medical_on_ramp'));

  const pressure = getEvent('medical_pressure_pragmatic');
  assert(pressure.autoEffects?.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'medical_midlife_pressure_done'));
  assert(pressure.autoEffects?.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'tavern_medical_pressure_pragmatic'));
  assert(pressure.autoEffects?.some(effect => effect.type === 'event_record' && effect.target === 'medical_pressure'));

  const payoff = getEvent('medical_payoff_pragmatic');
  assert(payoff.autoEffects?.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'medical_payoff_done'));
  assert(payoff.autoEffects?.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'medical_age40_identity_done'));
  assert(getChoice(payoff, 'pragmatic_holder').effects?.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'tavern_medical_payoff_pragmatic_holder'));
  assert(getChoice(payoff, 'pragmatic_master').effects?.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'tavern_medical_payoff_pragmatic_master'));

  for (const id of ['medical_late_life_pragmatic_fallen', 'medical_late_life_pragmatic_master']) {
    const event = getEvent(id);
    assert(event.autoEffects?.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'medical_late_life_done'));
    assert(event.autoEffects?.some(effect => effect.type === 'flag_set' && effectTarget(effect) === 'medical_late_life_identity_done'));
    assert(event.autoEffects?.some(effect => effect.type === 'event_record' && effect.target === 'medical_late_life'));
  }
}

async function testRuntimeWalletInvariance(): Promise<void> {
  await assertMoneyInvariant('imperial doctor', async money => {
    const { engine } = createScenario(money, { medical_divine_doctor_fame: true });
    const event = getEvent('medical_imperial_doctor');
    await engine.executeChoiceEffects(getChoice(event, 'medical_imperial_doctor_choice_1').effects ?? [], event.id, 'medical_imperial_doctor_choice_1');
    return engine.getGameState();
  }, ['medical_imperial']);

  await assertMoneyInvariant('palace intrigue', async money => {
    const { engine } = createScenario(money, { medical_imperial: true });
    const event = getEvent('medical_palace_intrigue');
    await engine.executeChoiceEffects(getChoice(event, 'medical_palace_intrigue_choice_2').effects ?? [], event.id, 'medical_palace_intrigue_choice_2');
    return engine.getGameState();
  }, []);

  await assertMoneyInvariant('pragmatic on-ramp', async money => {
    const { engine } = createScenario(money, {
      tavern_medical_bridge_crossed: true,
      tavern_embrace_pragmatic_healer: true,
    });
    return executeAutoEffects(engine, getEvent('medical_on_ramp_pragmatic'));
  }, ['medical_on_ramp_done', 'tavern_medical_on_ramp_pragmatic']);

  await assertMoneyInvariant('pragmatic pressure', async money => {
    const { engine } = createScenario(money, {
      medical_on_ramp_done: true,
      tavern_medical_on_ramp_pragmatic: true,
    });
    return executeAutoEffects(engine, getEvent('medical_pressure_pragmatic'));
  }, ['medical_midlife_pressure_done', 'tavern_medical_pressure_pragmatic']);

  for (const choiceId of ['pragmatic_holder', 'pragmatic_master'] as const) {
    await assertMoneyInvariant(`pragmatic payoff ${choiceId}`, async money => {
      const { engine } = createScenario(money, {
        medical_midlife_pressure_done: true,
        tavern_medical_pressure_pragmatic: true,
      });
      const event = getEvent('medical_payoff_pragmatic');
      const stateAfterAuto = await executeAutoEffects(engine, event);
      return new EventExecutor().executeEffects(getChoice(event, choiceId).effects ?? [], stateAfterAuto);
    }, ['medical_payoff_done', 'medical_age40_identity_done', `tavern_medical_payoff_pragmatic_${choiceId === 'pragmatic_holder' ? 'holder' : 'master'}`]);
  }

  const lateLifeScenarios = [
    ['medical_late_life_pragmatic_fallen', 'tavern_medical_payoff_pragmatic_holder', 'tavern_medical_late_pragmatic_fallen'],
    ['medical_late_life_pragmatic_master', 'tavern_medical_payoff_pragmatic_master', 'tavern_medical_late_pragmatic_master'],
  ] as const;
  for (const [eventId, payoffFlag, lateLifeFlag] of lateLifeScenarios) {
    await assertMoneyInvariant(eventId, async money => {
      const { engine } = createScenario(money, {
        medical_payoff_done: true,
        tavern_medical_payoff_pragmatic_holder: payoffFlag.endsWith('holder'),
        tavern_medical_payoff_pragmatic_master: payoffFlag.endsWith('master'),
        tavern_medical_bridge_crossed: true,
      });
      return executeAutoEffects(engine, getEvent(eventId));
    }, ['medical_late_life_done', 'medical_late_life_identity_done', lateLifeFlag]);
  }
}

async function main(): Promise<void> {
  testAuthoringAndScheduleContracts();
  await testRuntimeWalletInvariance();
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.15.0');
  console.log('globalMoneyMedicalRouteRewardRetirement.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

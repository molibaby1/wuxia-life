import assert from 'node:assert/strict';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import type { EffectDefinition, EventChoice, EventDefinition, GameState } from '../src/types/eventTypes';

const MONEY_SENTINELS = [0, 317, 9999] as const;
const WEALTH_REPLACEMENT_EFFECTS = new Set([
  'wealth_capacity_set',
  'wealth_capacity_raise_to',
  'wealth_capacity_lower_to',
  'wealth_capacity_at_least',
]);

type ChoiceExpectation = {
  id: string;
  statTarget: string;
  statDelta: number;
  flag: string;
  retiredMoneyDelta?: number;
};

type EventExpectation = {
  id: string;
  ageRange: { min: number; max: number };
  trigger: { type: 'age_reach'; value: number };
  condition: string;
  tags: string[];
  choices: ChoiceExpectation[];
};

const EXPECTATIONS: EventExpectation[] = [
  {
    id: 'p27_mentor_obligation_consequence',
    ageRange: { min: 30, max: 38 },
    trigger: { type: 'age_reach', value: 30 },
    condition: 'lifeStates.trainingHabit >= 3 || flags.has("origin_martial_family")',
    tags: ['p27', 'habit_trajectory', 'consequence', 'training'],
    choices: [
      { id: 'accept_disciples', statTarget: 'reputation', statDelta: 6, flag: 'p27_mentor_obligation_taken', retiredMoneyDelta: -20 },
      { id: 'decline_disciples', statTarget: 'martialPower', statDelta: 3, flag: 'p27_mentor_obligation_declined' },
    ],
  },
  {
    id: 'p27_renown_upkeep_pressure',
    ageRange: { min: 32, max: 40 },
    trigger: { type: 'age_reach', value: 32 },
    condition: 'lifeStates.studyHabit >= 3',
    tags: ['p27', 'habit_trajectory', 'consequence', 'study'],
    choices: [
      { id: 'maintain_public_reputation', statTarget: 'reputation', statDelta: 6, flag: 'p27_renown_upkeep_accepted', retiredMoneyDelta: -15 },
      { id: 'withdraw_from_public', statTarget: 'knowledge', statDelta: 3, flag: 'p27_renown_upkeep_declined' },
    ],
  },
  {
    id: 'p42_study_habit_merchant_ledger_echo',
    ageRange: { min: 26, max: 34 },
    trigger: { type: 'age_reach', value: 26 },
    condition: 'lifeStates.studyHabit >= 3 && (lifeStates.businessHabit >= 2 || player.businessAcumen >= 30)',
    tags: ['p42', 'habit_trajectory', 'study', 'archetype_merchant'],
    choices: [
      { id: 'reform_ledgers', statTarget: 'businessAcumen', statDelta: 8, flag: 'p42_merchant_ledger_echo_taken', retiredMoneyDelta: 90 },
      { id: 'consult_only', statTarget: 'businessAcumen', statDelta: 4, flag: 'p42_merchant_ledger_echo_consult', retiredMoneyDelta: 40 },
    ],
  },
];

function getEvent(id: string): EventDefinition {
  const event = EventLoader.getInstance().getEventById(id);
  assert(event, `missing event: ${id}`);
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

function meaningfulOutcome(state: GameState, expectation: ChoiceExpectation): Record<string, unknown> {
  return {
    stat: state.player[expectation.statTarget as keyof typeof state.player],
    wealthCapacity: state.player.wealthCapacity,
    flag: state.flags[expectation.flag],
  };
}

function createScenario(money: number, eventId: string): { engine: GameEngineIntegration; state: GameState } {
  const engine = new GameEngineIntegration();
  engine.startNewGame('Habit Consequence Wallet Retirement', 'male');
  const state = engine.getGameState();
  state.player.money = money;
  state.player.reputation = 10;
  state.player.martialPower = 10;
  state.player.knowledge = 10;
  state.player.businessAcumen = 10;
  state.player.traits = [];
  state.flags = {};
  state.player.flags = {};
  state.player.lifeStates = {
    ...state.player.lifeStates,
    trainingHabit: eventId === 'p27_mentor_obligation_consequence' ? 3 : 0,
    studyHabit: eventId === 'p27_renown_upkeep_pressure' || eventId === 'p42_study_habit_merchant_ledger_echo' ? 3 : 0,
    businessHabit: eventId === 'p42_study_habit_merchant_ledger_echo' ? 2 : 0,
  };
  return { engine, state };
}

function testAuthoringContracts(): void {
  assert.equal(
    EXPECTATIONS.flatMap(expectation => expectation.choices).filter(choice => choice.retiredMoneyDelta !== undefined).length,
    4,
    'D5 must retire exactly four legacy wallet writes',
  );

  for (const expectation of EXPECTATIONS) {
    const event = getEvent(expectation.id);
    assert.equal(event.eventType, 'choice', `${event.id} must remain a choice event`);
    assert.deepEqual(event.ageRange, expectation.ageRange, `${event.id} age range must remain unchanged`);
    assert.deepEqual(event.triggers, [expectation.trigger], `${event.id} trigger must remain unchanged`);
    assert.deepEqual(
      event.conditions,
      [{ type: 'expression', expression: expectation.condition }],
      `${event.id} habit eligibility must remain unchanged`,
    );
    assert.equal(event.metadata?.enabled, true, `${event.id} must remain enabled`);
    assert.deepEqual(event.metadata?.tags, expectation.tags, `${event.id} tags must remain unchanged`);
    assert.deepEqual(event.choices?.map(choice => choice.id), expectation.choices.map(choice => choice.id));

    const effects = (event.choices ?? []).flatMap(choice => choice.effects ?? []);
    assert.equal(
      effects.filter(isMoneyEffect).length,
      0,
      `${event.id} must have no legacy money writes`,
    );
    assert.equal(
      effects.some(isWealthReplacementEffect),
      false,
      `${event.id} must not gain a Wealth replacement`,
    );

    for (const choiceExpectation of expectation.choices) {
      const choice = getChoice(event, choiceExpectation.id);
      const nonWalletEffects = (choice.effects ?? []).filter(effect => !isMoneyEffect(effect));
      assert.equal(nonWalletEffects.length, 2, `${event.id}/${choice.id} must retain two non-wallet effects`);
      assert(
        nonWalletEffects.some(
          effect =>
            effect.type === 'stat_modify' &&
            effectTarget(effect) === choiceExpectation.statTarget &&
            effect.value === choiceExpectation.statDelta,
        ),
        `${event.id}/${choice.id} must retain ${choiceExpectation.statTarget} ${choiceExpectation.statDelta}`,
      );
      assert(
        nonWalletEffects.some(
          effect => effect.type === 'flag_set' && effectTarget(effect) === choiceExpectation.flag && effect.value === true,
        ),
        `${event.id}/${choice.id} must retain ${choiceExpectation.flag}`,
      );
    }
  }
}

function testEligibilityIsMoneyIndependent(): void {
  const evaluator = new ConditionEvaluator();
  for (const expectation of EXPECTATIONS) {
    const event = getEvent(expectation.id);
    const eligible = MONEY_SENTINELS.map(money => {
      const { state } = createScenario(money, expectation.id);
      return evaluator.evaluate(event.conditions?.[0]!, state);
    });
    assert.deepEqual(eligible, MONEY_SENTINELS.map(() => true), `${event.id} eligibility must not depend on money`);

    const { state } = createScenario(0, expectation.id);
    state.player.lifeStates = {
      ...state.player.lifeStates,
      trainingHabit: expectation.id === 'p27_mentor_obligation_consequence' ? 2 : state.player.lifeStates.trainingHabit,
      studyHabit: expectation.id !== 'p27_mentor_obligation_consequence' ? 2 : state.player.lifeStates.studyHabit,
      businessHabit: expectation.id === 'p42_study_habit_merchant_ledger_echo' ? 1 : state.player.lifeStates.businessHabit,
    };
    assert.equal(evaluator.evaluate(event.conditions?.[0]!, state), false, `${event.id} habit threshold must remain active`);
  }
}

async function testRuntimeWalletInvariance(): Promise<void> {
  for (const expectation of EXPECTATIONS) {
    const event = getEvent(expectation.id);
    for (const choiceExpectation of expectation.choices) {
      const outcomes: Record<string, unknown>[] = [];
      for (const money of MONEY_SENTINELS) {
        const { engine, state } = createScenario(money, expectation.id);
        const beforeStat = state.player[choiceExpectation.statTarget as keyof typeof state.player];
        await engine.executeChoiceEffects(getChoice(event, choiceExpectation.id).effects ?? [], event.id, choiceExpectation.id);
        const after = engine.getGameState();
        assert.equal(after.player.money, money, `${event.id}/${choiceExpectation.id} must preserve money=${money}`);
        assert.equal(
          after.player[choiceExpectation.statTarget as keyof typeof after.player],
          (beforeStat as number) + choiceExpectation.statDelta,
          `${event.id}/${choiceExpectation.id} must preserve its non-wallet stat effect`,
        );
        assert.equal(after.flags[choiceExpectation.flag], true, `${event.id}/${choiceExpectation.id} must preserve its choice flag`);
        outcomes.push(meaningfulOutcome(after, choiceExpectation));
      }

      assert.deepEqual(outcomes[0], outcomes[1], `${event.id}/${choiceExpectation.id} must not depend on money=317`);
      assert.deepEqual(outcomes[0], outcomes[2], `${event.id}/${choiceExpectation.id} must not depend on money=9999`);
    }
  }
}

async function main(): Promise<void> {
  testAuthoringContracts();
  testEligibilityIsMoneyIndependent();
  await testRuntimeWalletInvariance();
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.15.0');
  console.log('globalMoneyHabitConsequenceWalletRetirement.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

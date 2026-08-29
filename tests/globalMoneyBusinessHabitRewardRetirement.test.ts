import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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
  reputationDelta?: number;
  reputationValue?: number;
  merchantNetworkDelta?: number;
  flag: string;
};

type EventExpectation = {
  id: string;
  ageRange: { min: number; max: number };
  triggerAge: number;
  condition: string;
  habitThreshold: number;
  choices: ChoiceExpectation[];
};

const EXPECTATIONS: EventExpectation[] = [
  {
    id: 'p26_business_habit_obligation',
    ageRange: { min: 34, max: 44 },
    triggerAge: 34,
    condition: 'lifeStates.businessHabit >= 3',
    habitThreshold: 3,
    choices: [
      { id: 'take_long_term_ledger', reputationValue: 5, flag: 'p26_business_obligation_taken' },
      { id: 'stay_small_scale', flag: 'p26_business_obligation_declined' },
    ],
  },
  {
    id: 'p42_business_habit_youth_stall',
    ageRange: { min: 16, max: 21 },
    triggerAge: 16,
    condition: 'lifeStates.businessHabit >= 2',
    habitThreshold: 2,
    choices: [
      { id: 'expand_with_kin', merchantNetworkDelta: 5, flag: 'p42_business_youth_kin_stall' },
      { id: 'solo_stall', reputationDelta: 4, flag: 'p42_business_youth_solo_stall' },
    ],
  },
  {
    id: 'p42_business_habit_midlife_syndicate',
    ageRange: { min: 38, max: 46 },
    triggerAge: 38,
    condition: 'lifeStates.businessHabit >= 3',
    habitThreshold: 3,
    choices: [
      { id: 'join_syndicate', merchantNetworkDelta: 10, flag: 'p42_business_syndicate_joined' },
      { id: 'decline_syndicate', flag: 'p42_business_syndicate_declined' },
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

function isMoneyEffect(effect: EffectDefinition): boolean {
  return effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money';
}

function isWealthReplacementEffect(effect: EffectDefinition): boolean {
  if (WEALTH_REPLACEMENT_EFFECTS.has(effect.type)) return true;
  return effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'wealth';
}

function testAuthoringAndScheduleContracts(): void {
  for (const expectation of EXPECTATIONS) {
    const event = getEvent(expectation.id);
    assert.deepEqual(event.ageRange, expectation.ageRange, `${event.id} age range must remain unchanged`);
    assert.deepEqual(event.triggers, [{ type: 'age_reach', value: expectation.triggerAge }], `${event.id} trigger must remain unchanged`);
    assert.deepEqual(event.conditions, [{ type: 'expression', expression: expectation.condition }], `${event.id} eligibility must remain unchanged`);
    assert.equal(event.eventType, 'choice', `${event.id} must remain a choice event`);
    assert.deepEqual(event.choices?.map(choice => choice.id), expectation.choices.map(choice => choice.id));

    const effects = (event.choices ?? []).flatMap(choice => choice.effects ?? []);
    assert.equal(effects.filter(isMoneyEffect).length, 0, `${event.id} must have no legacy money reward`);
    assert.equal(effects.some(isWealthReplacementEffect), false, `${event.id} must not gain a Wealth replacement`);
  }
}

function createScenario(money: number, habit: number): { engine: GameEngineIntegration; state: GameState } {
  const engine = new GameEngineIntegration();
  engine.startNewGame('Business Habit Wallet Retirement', 'male');
  const state = engine.getGameState();
  state.player.reputation = 10;
  state.player.merchantNetwork = 10;
  state.player.traits = [];
  state.player.lifeStates = { ...state.player.lifeStates, businessHabit: habit };
  return { engine, state };
}

function nonWalletOutcome(state: GameState): { reputation: number; merchantNetwork: number; flags: Record<string, boolean> } {
  return {
    reputation: state.player.reputation,
    merchantNetwork: state.player.merchantNetwork,
    flags: { ...state.flags },
  };
}

function testEligibilityAndWalletInvariance(): Promise<void> {
  const evaluator = new ConditionEvaluator();

  return (async () => {
    for (const expectation of EXPECTATIONS) {
      const event = getEvent(expectation.id);
      const eligibleOutcomes = MONEY_SENTINELS.map(money => {
        const { state } = createScenario(money, expectation.habitThreshold);
        return evaluator.evaluate(event.conditions?.[0]!, state);
      });
      assert.deepEqual(eligibleOutcomes, MONEY_SENTINELS.map(() => true), `${event.id} eligibility must not depend on money`);

      const ineligible = createScenario(0, expectation.habitThreshold - 1).state;
      assert.equal(evaluator.evaluate(event.conditions?.[0]!, ineligible), false, `${event.id} habit threshold must remain active`);

      for (const choiceExpectation of expectation.choices) {
        const outcomes: Array<ReturnType<typeof nonWalletOutcome>> = [];
        for (const money of MONEY_SENTINELS) {
          const { engine, state } = createScenario(money, expectation.habitThreshold);
          const beforeReputation = state.player.reputation;
          const beforeMerchantNetwork = state.player.merchantNetwork;
          const choice = getChoice(event, choiceExpectation.id);

          await engine.executeChoiceEffects(choice.effects ?? [], event.id, choice.id);
          const after = engine.getGameState();

          assert.equal('money' in after.player, false, `${event.id}/${choice.id} must preserve money=${money}`);
          assert.equal(
            after.player.reputation,
            choiceExpectation.reputationValue ?? beforeReputation + (choiceExpectation.reputationDelta ?? 0),
          );
          assert.equal(after.player.merchantNetwork, beforeMerchantNetwork + (choiceExpectation.merchantNetworkDelta ?? 0));
          assert.equal(after.flags[choiceExpectation.flag], true, `${event.id}/${choice.id} must preserve ${choiceExpectation.flag}`);
          assert.equal(after.player.wealthCapacity, state.player.wealthCapacity, `${event.id}/${choice.id} must not alter Wealth Capacity`);
          outcomes.push(nonWalletOutcome(after));
        }

        assert.deepEqual(outcomes[0], outcomes[1], `${event.id}/${choiceExpectation.id} must have the same non-wallet outcome at money=0 and 317`);
        assert.deepEqual(outcomes[0], outcomes[2], `${event.id}/${choiceExpectation.id} must have the same non-wallet outcome at money=0 and 9999`);
      }
    }
  })();
}

function testYouthStallMilestoneEvidence(): void {
  const milestones = JSON.parse(fs.readFileSync(path.resolve('src/data/life-milestones.json'), 'utf8')) as Array<{
    id: string;
    conditions?: Array<{ type?: string; eventId?: string }>;
  }>;
  const milestone = milestones.find(item => item.id === 'business-first-stall');
  assert(milestone, 'business-first-stall milestone must remain present');
  assert.deepEqual(milestone.conditions, [{ type: 'event_occurred', eventId: 'p42_business_habit_youth_stall', label: '经历小摊初立' }]);
}

async function main(): Promise<void> {
  testAuthoringAndScheduleContracts();
  await testEligibilityAndWalletInvariance();
  testYouthStallMilestoneEvidence();
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.16.0');
  console.log('globalMoneyBusinessHabitRewardRetirement.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

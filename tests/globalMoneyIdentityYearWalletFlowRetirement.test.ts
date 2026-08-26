import assert from 'node:assert/strict';
import { EventLoader } from '../src/core/EventLoader';
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

type EventExpectation = {
  id: string;
  version: string;
  category: string;
  priority: number;
  weight: number;
  ageRange: { min: number; max: number };
  triggers: Array<{ type: string; value: number }>;
  choiceIds: string[];
};

const EXPECTATIONS: EventExpectation[] = [
  {
    id: 'commoner_year_farming',
    version: '1.0.0',
    category: 'life_year',
    priority: 30,
    weight: 60,
    ageRange: { min: 18, max: 65 },
    triggers: [
      { type: 'age_reach', value: 18 },
      { type: 'random', value: 0.25 },
    ],
    choiceIds: ['farming_diligent', 'farming_leisure'],
  },
  {
    id: 'merchant_year_trade',
    version: '1.0.0',
    category: 'life_year',
    priority: 50,
    weight: 70,
    ageRange: { min: 20, max: 60 },
    triggers: [
      { type: 'age_reach', value: 20 },
      { type: 'random', value: 0.35 },
    ],
    choiceIds: ['trade_risk', 'trade_stable'],
  },
  {
    id: 'merchant_year_crisis',
    version: '1.0.0',
    category: 'life_year',
    priority: 45,
    weight: 50,
    ageRange: { min: 25, max: 55 },
    triggers: [
      { type: 'age_reach', value: 25 },
      { type: 'random', value: 0.2 },
    ],
    choiceIds: ['crisis_innovate', 'crisis_retreat'],
  },
];

function getEvent(id: string): EventDefinition {
  const event = EventLoader.getInstance().getEventById(id);
  assert(event, `missing Identity-Year event: ${id}`);
  return event;
}

function getChoice(event: EventDefinition, id: string): EventChoice {
  const choice = event.choices?.find(candidate => candidate.id === id);
  assert(choice, `missing choice ${id} in ${event.id}`);
  return choice;
}

function allEffects(event: EventDefinition): EffectDefinition[] {
  return [
    ...(event.autoEffects ?? []),
    ...(event.choices ?? []).flatMap(choice => choice.effects ?? []),
  ];
}

function isMoneyEffect(effect: EffectDefinition): boolean {
  return effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money';
}

function isWealthReplacementEffect(effect: EffectDefinition): boolean {
  if (WEALTH_REPLACEMENT_EFFECTS.has(effect.type)) return true;
  return effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'wealth';
}

function createScenario(money: number): { engine: GameEngineIntegration; state: GameState } {
  const engine = new GameEngineIntegration();
  engine.startNewGame('Identity-Year Wallet Retirement', 'male');
  const state = engine.getGameState();
  state.player.money = money;
  state.player.traits = [];
  state.player.constitution = 10;
  state.player.businessAcumen = 10;
  state.player.connections = 10;
  state.player.merchantNetwork = 10;
  state.player.influence = 10;
  state.flags = {};
  state.player.flags = {};
  return { engine, state };
}

async function executeChoice(eventId: string, choiceId: string, money: number): Promise<GameState> {
  const { engine } = createScenario(money);
  const event = getEvent(eventId);
  await engine.executeChoiceEffects(getChoice(event, choiceId).effects ?? [], event.id, choiceId);
  return engine.getGameState();
}

function testAuthoringAndSchedulingContracts(): void {
  for (const expectation of EXPECTATIONS) {
    const event = getEvent(expectation.id);
    assert.equal(event.version, expectation.version);
    assert.equal(event.category, expectation.category);
    assert.equal(event.priority, expectation.priority);
    assert.equal(event.weight, expectation.weight);
    assert.deepEqual(event.ageRange, expectation.ageRange, `${event.id} age range must remain unchanged`);
    assert.deepEqual(event.triggers, expectation.triggers, `${event.id} triggers must remain unchanged`);
    assert.deepEqual(event.conditions ?? [], [], `${event.id} eligibility must remain unchanged`);
    assert.deepEqual(event.thresholds ?? {}, {}, `${event.id} thresholds must remain unchanged`);
    assert.deepEqual(event.choices?.map(choice => choice.id), expectation.choiceIds);
    assert.equal(
      allEffects(event).filter(isMoneyEffect).length,
      0,
      `${event.id} must have no legacy money write`,
    );
    assert.equal(
      allEffects(event).some(isWealthReplacementEffect),
      false,
      `${event.id} must not gain a Wealth replacement`,
    );
  }
}

async function testChoiceSemanticsAndMoneyInvariance(): Promise<void> {
  const assertions: Array<{
    eventId: string;
    choiceId: string;
    expected: (state: GameState) => void;
  }> = [
    {
      eventId: 'commoner_year_farming',
      choiceId: 'farming_diligent',
      expected: state => assert.equal(state.player.constitution, 13),
    },
    {
      eventId: 'commoner_year_farming',
      choiceId: 'farming_leisure',
      expected: state => assert.equal(state.player.constitution, 11),
    },
    {
      eventId: 'merchant_year_trade',
      choiceId: 'trade_risk',
      expected: state => assert.equal(state.player.businessAcumen, 13),
    },
    {
      eventId: 'merchant_year_trade',
      choiceId: 'trade_stable',
      expected: state => {
        assert.equal(state.player.connections, 15);
        assert.equal(state.player.merchantNetwork, 13);
      },
    },
    {
      eventId: 'merchant_year_crisis',
      choiceId: 'crisis_innovate',
      expected: state => {
        assert.equal(state.player.businessAcumen, 15);
        assert.equal(state.player.influence, 13);
        assert.equal(state.flags.overcome_crisis, true);
      },
    },
    {
      eventId: 'merchant_year_crisis',
      choiceId: 'crisis_retreat',
      expected: state => assert.equal(state.player.businessAcumen, 11),
    },
  ];

  for (const assertion of assertions) {
    const outcomes: Array<Record<string, unknown>> = [];
    for (const money of MONEY_SENTINELS) {
      const state = await executeChoice(assertion.eventId, assertion.choiceId, money);
      assert.equal(state.player.money, money, `${assertion.eventId}/${assertion.choiceId} must preserve money=${money}`);
      assertion.expected(state);
      outcomes.push({
        constitution: state.player.constitution,
        businessAcumen: state.player.businessAcumen,
        connections: state.player.connections,
        merchantNetwork: state.player.merchantNetwork,
        influence: state.player.influence,
        wealthCapacity: state.player.wealthCapacity,
        flags: { ...state.flags },
      });
    }
    assert.deepEqual(outcomes[0], outcomes[1], `${assertion.eventId}/${assertion.choiceId} must be money-invariant at 317`);
    assert.deepEqual(outcomes[0], outcomes[2], `${assertion.eventId}/${assertion.choiceId} must be money-invariant at 9999`);
  }
}

async function main(): Promise<void> {
  testAuthoringAndSchedulingContracts();
  await testChoiceSemanticsAndMoneyInvariance();
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.15.0');
  console.log('globalMoneyIdentityYearWalletFlowRetirement.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

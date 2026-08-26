import { strict as assert } from 'node:assert';
import { gameEngine } from '../src/core/GameEngineIntegration';
import { useNewGameEngine } from '../src/composables/useNewGameEngine';
import { EffectType } from '../src/types/eventTypes';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';

type TestChoice = {
  id: string;
  text: string;
  weight?: number;
  effects?: Array<Record<string, unknown>>;
  outcomes?: Array<{
    id: string;
    text: string;
    effects: Array<Record<string, unknown>>;
  }>;
};

type AutoResolveResult = {
  selectedChoiceId: string;
  executedEffects: Array<Record<string, unknown>>;
};

function statEffect(target: string, value: number, operator: 'add' | 'subtract' = 'add') {
  return {
    type: EffectType.STAT_MODIFY,
    target,
    value,
    operator,
  };
}

async function runAutoResolveCase(options: {
  choices: TestChoice[];
  money: number;
}): Promise<AutoResolveResult> {
  const engine = useNewGameEngine();
  const state = gameEngine.getGameState();
  state.player.money = options.money;

  const originalGetGameState = gameEngine.getGameState;
  const originalIsChoiceAvailable = gameEngine.isChoiceAvailable;
  const originalExecuteChoiceEffects = gameEngine.executeChoiceEffects;
  const originalSelectEvent = gameEngine.selectEvent;
  const originalAdvanceTime = gameEngine.advanceTime;

  let selectedChoiceId = '';
  let executedEffects: Array<Record<string, unknown>> = [];

  try {
    (gameEngine as any).getGameState = () => state;
    (gameEngine as any).isChoiceAvailable = () => true;
    (gameEngine as any).executeChoiceEffects = async (
      effects: Array<Record<string, unknown>>,
      _eventId: string,
      choiceId: string,
    ) => {
      selectedChoiceId = choiceId;
      executedEffects = effects;
      return state;
    };
    (gameEngine as any).advanceTime = () => state;
    (gameEngine as any).selectEvent = () => ({
      id: 'global-money-auto-resolve-scoring-event',
      eventType: 'choice',
      metadata: { autoResolve: true },
      choices: options.choices,
    });

    engine.getNextEvent();
    await new Promise(resolve => setTimeout(resolve, 0));

    return { selectedChoiceId, executedEffects };
  } finally {
    (gameEngine as any).getGameState = originalGetGameState;
    (gameEngine as any).isChoiceAvailable = originalIsChoiceAvailable;
    (gameEngine as any).executeChoiceEffects = originalExecuteChoiceEffects;
    (gameEngine as any).selectEvent = originalSelectEvent;
    (gameEngine as any).advanceTime = originalAdvanceTime;
    engine.engineState.currentEvent = null;
    engine.engineState.availableChoices = [];
    engine.engineState.lastEffects = [];
    engine.engineState.lastOutcomeText = null;
    engine.engineState.lastChoiceFeedback = null;
  }
}

async function testDirectPositiveMoneyIsInert(): Promise<void> {
  const result = await runAutoResolveCase({
    money: 317,
    choices: [
      {
        id: 'wallet-reward',
        text: '获得银两',
        weight: 0,
        effects: [statEffect('money', 100)],
      },
      {
        id: 'stronger-normal-choice',
        text: '正常选择',
        weight: 50,
        effects: [statEffect('reputation', 0)],
      },
    ],
  });

  assert.equal(result.selectedChoiceId, 'stronger-normal-choice');
  assert.equal(result.executedEffects[0]?.target, 'reputation');
}

async function testDirectNegativeMoneyDoesNotPenalizeNonMoneyUtility(): Promise<void> {
  const result = await runAutoResolveCase({
    money: 317,
    choices: [
      {
        id: 'reputation-with-cost',
        text: '承担代价换取名望',
        weight: 50,
        effects: [statEffect('reputation', 10), statEffect('money', 100, 'subtract')],
      },
      {
        id: 'neutral-choice',
        text: '保持现状',
        weight: 0,
        effects: [statEffect('reputation', 0)],
      },
    ],
  });

  assert.equal(result.selectedChoiceId, 'reputation-with-cost');
}

async function testOutcomeMoneyIsInertForPositiveAndNegativeFlows(): Promise<void> {
  const positive = await runAutoResolveCase({
    money: 317,
    choices: [
      {
        id: 'outcome-wallet-reward',
        text: '结果给予银两',
        weight: 0,
        outcomes: [{ id: 'reward', text: '获得银两', effects: [statEffect('money', 100)] }],
      },
      {
        id: 'outcome-normal-choice',
        text: '结果给予名望',
        weight: 0,
        outcomes: [{ id: 'normal', text: '获得名望', effects: [statEffect('reputation', 1)] }],
      },
    ],
  });
  assert.equal(positive.selectedChoiceId, 'outcome-normal-choice');

  const negative = await runAutoResolveCase({
    money: 317,
    choices: [
      {
        id: 'outcome-reputation-with-cost',
        text: '结果以银两为代价换取名望',
        weight: 0,
        outcomes: [{
          id: 'cost',
          text: '名望提升',
          effects: [statEffect('reputation', 10), statEffect('money', 100, 'subtract')],
        }],
      },
      {
        id: 'outcome-weaker-normal-choice',
        text: '结果给予少量名望',
        weight: 0,
        outcomes: [{ id: 'weaker', text: '少量名望', effects: [statEffect('reputation', 1)] }],
      },
    ],
  });
  assert.equal(negative.selectedChoiceId, 'outcome-reputation-with-cost');
}

async function testNonMoneyWeightedStatAndAutoResolveExecutionRemain(): Promise<void> {
  const result = await runAutoResolveCase({
    money: 317,
    choices: [
      {
        id: 'reputation-choice',
        text: '提升名望',
        weight: 0,
        effects: [statEffect('reputation', 10)],
      },
      {
        id: 'neutral-choice',
        text: '保持现状',
        weight: 0,
        effects: [statEffect('reputation', 0)],
      },
    ],
  });

  assert.equal(result.selectedChoiceId, 'reputation-choice');
  assert.equal(result.executedEffects[0]?.target, 'reputation');
}

async function testMoneyBalanceDoesNotChangeSelectedChoice(): Promise<void> {
  const choices: TestChoice[] = [
    {
      id: 'wallet-dependent-choice',
      text: '钱包选项',
      weight: 0,
      effects: [statEffect('money', 100)],
    },
    {
      id: 'stable-choice',
      text: '稳定选项',
      weight: 50,
      effects: [statEffect('reputation', 0)],
    },
  ];

  const selected = [] as string[];
  for (const money of [0, 317, 9999]) {
    selected.push((await runAutoResolveCase({ money, choices })).selectedChoiceId);
  }

  assert.deepEqual(selected, ['stable-choice', 'stable-choice', 'stable-choice']);
}

async function testManualChoiceStillExecutesNormally(): Promise<void> {
  const engine = useNewGameEngine();
  const state = gameEngine.getGameState();
  const originalGetGameState = gameEngine.getGameState;
  const originalExecuteChoiceEffects = gameEngine.executeChoiceEffects;
  let executedChoiceId = '';

  try {
    (gameEngine as any).getGameState = () => state;
    (gameEngine as any).executeChoiceEffects = async (
      _effects: Array<Record<string, unknown>>,
      _eventId: string,
      choiceId: string,
    ) => {
      executedChoiceId = choiceId;
      return state;
    };
    engine.engineState.currentEvent = {
      id: 'global-money-manual-choice-event',
      eventType: 'choice',
      choices: [{
        id: 'manual-choice',
        text: '手动选择',
        effects: [statEffect('reputation', 1)],
      }],
    } as any;

    assert.equal(await engine.handleChoice({ id: 'manual-choice' } as any), true);
    assert.equal(executedChoiceId, 'manual-choice');
  } finally {
    (gameEngine as any).getGameState = originalGetGameState;
    (gameEngine as any).executeChoiceEffects = originalExecuteChoiceEffects;
    engine.engineState.currentEvent = null;
    engine.engineState.availableChoices = [];
    engine.engineState.lastEffects = [];
    engine.engineState.lastOutcomeText = null;
    engine.engineState.lastChoiceFeedback = null;
  }
}

await testDirectPositiveMoneyIsInert();
await testDirectNegativeMoneyDoesNotPenalizeNonMoneyUtility();
await testOutcomeMoneyIsInertForPositiveAndNegativeFlows();
await testNonMoneyWeightedStatAndAutoResolveExecutionRemain();
await testMoneyBalanceDoesNotChangeSelectedChoice();
await testManualChoiceStillExecutesNormally();
assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.15.0');

console.log('globalMoneyLocalAutoResolveScoringRetirement.test.ts: ok');

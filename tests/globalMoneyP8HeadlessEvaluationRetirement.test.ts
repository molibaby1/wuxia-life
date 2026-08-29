import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import {
  selectPersonaChoice,
} from '../src/headless/playability/choiceScoring';
import { createPersonaHeadlessSession } from '../src/headless/playability/createPersonaSession';
import {
  collectFrustrationMetrics,
  collectReplayMetrics,
  evaluatePersonaGoals,
} from '../src/p8/collectPersonaMetrics';
import { applyPersonaChoiceBias } from '../src/p8/personaChoiceBias';
import { getP8PersonaById } from '../src/p8/personas';
import type { EventDefinition, EventChoice, GameState, StatType } from '../src/types/eventTypes';
import type { GameProcessRecord, GameProcessReport } from '../src/types/simulationRecordTypes';

function makeState(
  money: number,
  overrides: { wealth?: number; flags?: Record<string, unknown>; reputation?: number } = {},
): GameState {
  const state = new GameEngineIntegration().getGameState();
  state.player.money = money;
  if (overrides.wealth === undefined) {
    delete state.player.wealth;
  } else {
    state.player.wealth = overrides.wealth;
  }
  if (overrides.reputation !== undefined) {
    state.player.reputation = overrides.reputation;
  }
  state.flags = { ...(overrides.flags ?? {}) };
  state.player.flags = { ...(overrides.flags ?? {}) };
  return state;
}

function makeRecord(
  gameState: GameState,
  eventId = 'evaluation_fixture',
  outcomeText = '',
  stateBefore?: GameState,
  executedEffects?: GameProcessRecord['outcomeEvidence']['executedEffects'],
): GameProcessRecord {
  return {
    age: 40,
    eventId,
    eventTitle: '评价 fixture',
    eventType: 'auto',
    outcomeText,
    gameState,
    timestamp: '',
    ...(stateBefore
      ? {
          outcomeEvidence: {
            stateBefore,
            stateAfter: gameState,
            ...(executedEffects === undefined ? {} : { executedEffects }),
          },
        }
      : {}),
  };
}

function goalResults(
  money: number,
  flags: Record<string, unknown> = {},
  eventIds: string[] = [],
): ReturnType<typeof evaluatePersonaGoals> {
  const persona = getP8PersonaById('p8-wealth-shen');
  assert(persona, 'wealth persona must exist');
  const state = makeState(money, { flags });
  const records = eventIds.length
    ? eventIds.map(eventId => makeRecord(state, eventId))
    : [makeRecord(state)];
  return evaluatePersonaGoals(
    persona,
    { finalAge: 40, records: [] } as unknown as GameProcessReport,
    records,
  );
}

function resultByGoalId(result: ReturnType<typeof evaluatePersonaGoals>, goalId: string) {
  const goal = result.goals.find(item => item.goalId === goalId);
  assert(goal, `missing goal result: ${goalId}`);
  return goal;
}

function testPersonaGoalRetirement(): void {
  const persona = getP8PersonaById('p8-wealth-shen');
  assert(persona, 'wealth persona must exist');

  assert.equal(
    persona.shortTermGoals.some(goal => goal.evidenceSpec.stat === 'money'),
    false,
    'wealth persona goals must not use legacy money thresholds',
  );
  const routeGoal = persona.shortTermGoals.find(goal => goal.id === 'shen-merchant-route');
  assert(routeGoal, 'wealth persona must retain the canonical Merchant route goal');
  assert.deepEqual(routeGoal.evidenceSpec, { flag: 'route_merchant' });
  assert.equal(routeGoal.ageBand, '0-20');

  const firstShopGoal = persona.shortTermGoals.find(goal => goal.id === 'shen-first-shop');
  assert(firstShopGoal, 'wealth persona must retain the canonical first-shop goal');
  assert.deepEqual(firstShopGoal.evidenceSpec, { eventId: 'merchant_first_shop' });
  assert.equal(firstShopGoal.ageBand, '30-40');

  const noRouteLowMoney = goalResults(0);
  const noRouteHighMoney = goalResults(999999);
  assert.deepEqual(noRouteLowMoney, noRouteHighMoney, 'money must not decide Merchant route goal status');
  assert.equal(resultByGoalId(noRouteLowMoney, 'shen-merchant-route').status, 'missed');

  const routeLowMoney = goalResults(0, { route_merchant: true });
  const routeHighMoney = goalResults(999999, { route_merchant: true });
  assert.deepEqual(routeLowMoney, routeHighMoney, 'money must not change canonical Merchant route evidence');
  assert.equal(resultByGoalId(routeLowMoney, 'shen-merchant-route').status, 'achieved');

  const withoutShop = goalResults(999999, { route_merchant: true }, ['other_event']);
  const withShop = goalResults(0, { route_merchant: true }, ['merchant_first_shop']);
  assert.equal(resultByGoalId(withoutShop, 'shen-first-shop').status, 'missed');
  assert.equal(resultByGoalId(withShop, 'shen-first-shop').status, 'achieved');
}

function testPersonaMoneyBiasRetired(): void {
  const wealthPersona = getP8PersonaById('p8-wealth-shen');
  const martialPersona = getP8PersonaById('p8-martial-lin');
  assert(wealthPersona && martialPersona, 'bias fixtures must exist');

  const moneyScore = applyPersonaChoiceBias({
    persona: wealthPersona,
    baseScore: 5,
    choiceId: 'earn_money',
    effects: [{ type: 'stat_modify', target: 'money', value: 20, operator: 'add' }],
  });
  const neutralScore = applyPersonaChoiceBias({
    persona: wealthPersona,
    baseScore: 5,
    choiceId: 'learn_knowledge',
    effects: [{ type: 'stat_modify', target: 'knowledge', value: 20, operator: 'add' }],
  });
  assert.equal(moneyScore, neutralScore, 'wealth persona must not add a money-specific bias');

  const martialScore = applyPersonaChoiceBias({
    persona: martialPersona,
    baseScore: 5,
    choiceId: 'train_martial',
    effects: [{ type: 'stat_modify', target: 'martialPower', value: 20, operator: 'add' }],
  });
  assert(martialScore > 5, 'unrelated martial persona bias must remain active');
}

function choice(id: string, target: StatType): EventChoice {
  return {
    id,
    text: id,
    effects: [{ type: 'stat_modify', stat: target, target, value: 20, operator: 'add' }],
  } as EventChoice;
}

async function testHeadlessMoneyScoringRetired(): Promise<void> {
  const persona = getP8PersonaById('p8-wealth-shen');
  assert(persona, 'wealth persona must exist');
  const event = {
    id: 'evaluation_fixture',
    version: '1.0.0',
    category: 'special_event',
    priority: 2,
    weight: 1,
    ageRange: { min: 0, max: 80 },
    triggers: [],
    content: { text: 'fixture' },
    eventType: 'choice',
    choices: [choice('money_gain', 'money'), choice('business_gain', 'businessAcumen'), choice('neutral_gain', 'knowledge')],
  } as unknown as EventDefinition;

  const selection = selectPersonaChoice(createPersonaHeadlessSession(persona), event, persona);
  assert(selection, 'headless choice selection must return a result');
  const moneyCandidate = selection.scoreCandidates.find(candidate => candidate.choiceId === 'money_gain');
  const businessCandidate = selection.scoreCandidates.find(candidate => candidate.choiceId === 'business_gain');
  const neutralCandidate = selection.scoreCandidates.find(candidate => candidate.choiceId === 'neutral_gain');
  assert(moneyCandidate && businessCandidate && neutralCandidate, 'all scoring candidates must be observable');
  assert.equal(
    moneyCandidate.personaAdjustedScore,
    neutralCandidate.personaAdjustedScore,
    'wealth tendency must not specially weight money',
  );
  assert(
    businessCandidate.personaAdjustedScore > moneyCandidate.personaAdjustedScore,
    'existing businessAcumen wealth tendency weighting must remain',
  );
  assert.equal(selection.choice.id, 'business_gain');
}

function testWalletFrustrationRetired(): void {
  const moneyDecrease = collectFrustrationMetrics([
    makeRecord(makeState(0), 'money_loss', '手头变化', makeState(100)),
  ]);
  assert.equal(moneyDecrease.setbacks.length, 0, 'money decrease must not create a wealth setback');

  const numericWealthDecrease = collectFrustrationMetrics([
    makeRecord(makeState(100, { wealth: 0 }), 'wealth_loss', '状态变化', makeState(100, { wealth: 100 })),
  ]);
  assert.equal(numericWealthDecrease.setbacks.length, 0, 'numeric wealth decrease must not create a wealth setback');

  const negativeStatMoney = collectFrustrationMetrics([
    makeRecord(
      makeState(80),
      'stat_money_loss',
      '数值变化',
      makeState(100),
      [{ type: 'stat_modify', stat: 'money', target: 'money', value: 20, operator: 'subtract' }],
    ),
  ]);
  assert.equal(negativeStatMoney.setbacks.length, 0, 'negative stat_modify money must not create a wealth setback');

  const moneyModify = collectFrustrationMetrics([
    makeRecord(
      makeState(80),
      'money_modify_loss',
      '数值变化',
      makeState(100),
      [{ type: 'money_modify', value: 20, operator: 'subtract' }],
    ),
  ]);
  assert.equal(moneyModify.setbacks.length, 0, 'money_modify subtract must not create a wealth setback');

  const reputationDecrease = collectFrustrationMetrics([
    makeRecord(
      makeState(100, { reputation: 5 }),
      'reputation_loss',
      '声望下降',
      makeState(100, { reputation: 10 }),
    ),
  ]);
  assert.equal(reputationDecrease.setbacks.length, 1, 'real reputation decrease must remain a setback');
}

function replayReport(personaId: string, finalMoney: number): GameProcessReport {
  const stableRecord = makeRecord(makeState(0), 'active_action:action_training_basic');
  return {
    id: personaId,
    timestamp: '',
    config: {} as GameProcessReport['config'],
    randomSeed: 1,
    runMode: 'age_range',
    ageRange: { startAge: 0, endAge: 40 },
    totalYears: 40,
    finalAge: 40,
    isAlive: true,
    deathReason: null,
    totalEvents: 1,
    totalChoices: 0,
    totalSaves: 0,
    totalLoads: 0,
    persistenceConsistency: { totalChecks: 0, passedChecks: 0, failedChecks: 0, results: [] },
    records: [{ ...stableRecord, progressionKind: 'active_action', activeActionId: 'action_training_basic' }],
    finalGameState: makeState(finalMoney),
    statistics: {
      childhoodEvents: 0,
      youthEvents: 0,
      adultEvents: 1,
      elderlyEvents: 0,
      autoEvents: 1,
      choiceEvents: 0,
      martialPowerGrowth: 0,
      sectJoined: null,
      children: 0,
    },
  };
}

function testReplayMoneyInvariance(): void {
  const low = collectReplayMetrics([
    { personaId: 'p8-wealth-shen', report: replayReport('wealth', 0) },
    { personaId: 'p8-explorer-lu', report: replayReport('explorer', 0) },
  ]);
  const high = collectReplayMetrics([
    { personaId: 'p8-wealth-shen', report: replayReport('wealth', 0) },
    { personaId: 'p8-explorer-lu', report: replayReport('explorer', 999999) },
  ]);
  assert.equal(
    low.pairwiseSimilarities[0]?.score,
    high.pairwiseSimilarities[0]?.score,
    'changing only final legacy money must not change replay similarity',
  );
  const metricsSource = fs.readFileSync(path.resolve('src/p8/collectPersonaMetrics.ts'), 'utf8');
  assert.equal(metricsSource.includes('moneySignal'), false, 'replay must not retain the legacy money signal');
  assert.equal(metricsSource.includes('wealthCapacity'), false, 'replay must not add a numeric Wealth replacement signal');
}

async function main(): Promise<void> {
  testPersonaGoalRetirement();
  testPersonaMoneyBiasRetired();
  await testHeadlessMoneyScoringRetired();
  testWalletFrustrationRetired();
  testReplayMoneyInvariance();
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.15.0');
  console.log('globalMoneyP8HeadlessEvaluationRetirement.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

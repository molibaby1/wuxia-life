import { executeActiveActionOnState } from '../src/core/activePlanning/ActivePlanningService';
import { buildPeriodSummary } from '../src/core/activePlanning/periodSummaryBuilder';
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import {
  P122_BUSINESS_HABIT_SHAPING_THRESHOLD,
  P122_CONTINUATION_AGE_MAX,
  P122_PRIMARY_AGE_MAX,
  P122_PRIMARY_AGE_MIN,
  P122_SAMPLE_ACTIONS,
  P122_SAMPLE_ORIGIN_ID,
  isP122MerchantSampleScope,
} from '../src/hvg/p122MerchantSampleBaseline';
import { buildCurrentShapingSummary } from '../src/utils/habitShapingSummary';
import { formatLongTermFlag } from '../src/utils/playerFacingLabels';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function merchantSampleState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 5,
      traits: ['keen_mind', 'lazy', 'bold'],
      lifeStates: createDefaultPlayerLifeStates({ businessHabit: 0 }),
      flags: {},
      ...overrides.player,
    } as PlayerState,
    flags: {
      origin_merchant_family: true,
      origin_id: P122_SAMPLE_ORIGIN_ID,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

function testBaselineScopeLocked(): void {
  assert(P122_SAMPLE_ACTIONS.length === 2, 'sample actions locked to errand + apprentice');
  assert(P122_BUSINESS_HABIT_SHAPING_THRESHOLD === 2, 'businessHabit threshold is 2');
  assert(P122_PRIMARY_AGE_MIN === 5 && P122_PRIMARY_AGE_MAX === 8, 'primary band 5-8');
  assert(P122_CONTINUATION_AGE_MAX === 12, 'continuation band ends at 12');

  const inScope = merchantSampleState({ player: { age: 7 } as PlayerState });
  assert(isP122MerchantSampleScope(inScope), 'merchant_house age 7 is in sample scope');

  const outScope = merchantSampleState({ player: { age: 14 } as PlayerState });
  assert(!isP122MerchantSampleScope(outScope), 'age 14 outside sample scope');
}

function testShapingSummaryTransition(): void {
  const state = merchantSampleState();
  assert(
    buildCurrentShapingSummary(state.player.lifeStates) === '塑形未成',
    'starts at 塑形未成',
  );

  for (const actionId of P122_SAMPLE_ACTIONS) {
    executeActiveActionOnState(state, actionId, {
      random: () => 0.5,
      includeDisturbance: false,
    });
  }

  assert(
    (state.player.lifeStates?.businessHabit ?? 0) >= P122_BUSINESS_HABIT_SHAPING_THRESHOLD,
    'two sample actions reach businessHabit threshold',
  );
  const summary = buildCurrentShapingSummary(state.player.lifeStates);
  assert(summary.includes('营生'), 'shapingSummary shows business axis');
  assert(summary.includes('渐成'), 'shapingSummary shows tier at threshold 2');

  const model = buildMainScreenModel(
    {
      martialPower: 10,
      externalSkill: 10,
      internalSkill: 10,
      qinggong: 10,
      constitution: 10,
      chivalry: 10,
      comprehension: 10,
      reputation: 10,
      money: 50,
      sect: null,
      lifeStates: state.player.lifeStates,
    },
    {
      schemaVersion: '1.0.0',
      derivedAtAge: state.player.age ?? 5,
      routeStatus: {
        primary: { routeId: 'merchant', name: '商路', phase: '路线进行中' },
        diagnostic: { routeStates: {}, activeRouteFlags: [] },
      },
    },
  );
  assert(model.shapingSummary === summary, 'main screen shapingSummary matches habit wiring');
}

function testLongTermImpactAfterShapingActions(): void {
  const state = merchantSampleState();
  const first = executeActiveActionOnState(state, P122_SAMPLE_ACTIONS[0], {
    random: () => 0.5,
    includeDisturbance: false,
  });
  assert(first !== null, 'errand executes');
  const firstImpacts = first!.activeActionSummary.longTermImpactLines ?? [];
  assert(
    firstImpacts.some(line => line.includes('营生塑形加深') || line.includes('营生方向已被记住')),
    'errand shows shaping or echo long-term impact',
  );

  const second = executeActiveActionOnState(state, P122_SAMPLE_ACTIONS[1], {
    random: () => 0.5,
    includeDisturbance: false,
  });
  assert(second !== null, 'apprentice executes');
  const secondImpacts = second!.activeActionSummary.longTermImpactLines ?? [];
  assert(
    secondImpacts.some(line => line.includes('营生塑形加深')),
    'apprentice tier cross shows shaping long-term impact',
  );
  assert(
    formatLongTermFlag('p9_echo_business_hook', true).includes('营生方向'),
    'echo hook label readable as life-path continuation',
  );
}

function testPeriodSummaryShapingGrowth(): void {
  const lifeStates = createDefaultPlayerLifeStates({ businessHabit: 2 });
  const period = buildPeriodSummary({
    sourceLabel: '童年岁月',
    headline: '帮衬家里',
    body: '这一季你多在货摊与账本边打转。',
    lifeStates,
  });
  assert(
    period.body.includes('营生'),
    'period summary body includes shaping growth line for business axis',
  );
  assert(
    period.body.includes('反复做事'),
    'period summary distinguishes behavior-driven growth from passive age gain',
  );
}

function testNoSecondRouteParallelization(): void {
  const scholar = merchantSampleState({
    flags: { origin_scholar_family: true, origin_merchant_family: false },
    player: {
      traits: ['keen_mind', 'lazy', 'bold'],
    } as PlayerState,
  });
  assert(!isP122MerchantSampleScope(scholar), 'scholar route excluded from P122 sample');
}

function testHvgBaselineDoesNotRegress(): void {
  const state = merchantSampleState();
  executeActiveActionOnState(state, P122_SAMPLE_ACTIONS[0], {
    random: () => 0.5,
    includeDisturbance: false,
  });
  assert(Boolean(state.flags?.p9_echo_business_hook), 'errand still sets p9_echo_business_hook');
  executeActiveActionOnState(state, P122_SAMPLE_ACTIONS[1], {
    random: () => 0.5,
    includeDisturbance: false,
  });
  assert(
    buildCurrentShapingSummary(state.player.lifeStates) === '营生 · 渐成',
    'hvg baseline shapingSummary unchanged',
  );
}

export async function runP122EarlyVisibleGrowthFeedbackTests(): Promise<void> {
  testBaselineScopeLocked();
  testShapingSummaryTransition();
  testLongTermImpactAfterShapingActions();
  testPeriodSummaryShapingGrowth();
  testNoSecondRouteParallelization();
  testHvgBaselineDoesNotRegress();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP122EarlyVisibleGrowthFeedbackTests()
    .then(() => console.log('p122EarlyVisibleGrowthFeedbackTests: ok'))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

import { executeActiveActionOnState } from '../src/core/activePlanning/ActivePlanningService';
import { buildPeriodSummary } from '../src/core/activePlanning/periodSummaryBuilder';
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import { getOrdinaryEarlyLifeChoiceForOrigin } from '../src/p25/ordinaryOriginEarlyLife';
import {
  P129_CONTINUATION_AGE_MAX,
  P129_PRIMARY_ACTION,
  P129_PRIMARY_AGE_MIN,
  P129_PRIMARY_AGE_MAX,
  P129_PERIOD_SHAPING_AXIS_LABEL,
  P129_SAMPLE_ORIGIN_ID,
  P129_EXPECTED_SHAPING_SUMMARY_AT_THRESHOLD,
  P129_SOCIAL_MOMENTUM_SHAPING_THRESHOLD,
  isP129TavernSampleScope,
} from '../src/hvg/p129TavernSampleBaseline';
import { buildCurrentShapingSummary } from '../src/utils/habitShapingSummary';
import { formatLongTermFlag } from '../src/utils/playerFacingLabels';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function tavernSampleState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 5,
      traits: ['keen_mind', 'lazy', 'bold'],
      lifeStates: createDefaultPlayerLifeStates({ socialMomentum: 0 }),
      flags: {},
      ...overrides.player,
    } as PlayerState,
    flags: {
      origin_tavern_hand: true,
      origin_id: P129_SAMPLE_ORIGIN_ID,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

function testBaselineScopeLocked(): void {
  assert(P129_PRIMARY_AGE_MIN === 5 && P129_PRIMARY_AGE_MAX === 8, 'primary band 5-8');
  assert(P129_CONTINUATION_AGE_MAX === 13, 'continuation band ends at 13');
  assert(P129_SOCIAL_MOMENTUM_SHAPING_THRESHOLD === 2, 'socialMomentum threshold is 2');
  assert(P129_PRIMARY_ACTION === 'action_socializing_lite', 'primary action locked');

  const inScope = tavernSampleState({ player: { age: 7 } as PlayerState });
  assert(isP129TavernSampleScope(inScope), 'tavern_hand age 7 is in sample scope');

  const outScope = tavernSampleState({ player: { age: 14 } as PlayerState });
  assert(!isP129TavernSampleScope(outScope), 'age 14 outside sample scope');
}

function testShapingSummaryTransition(): void {
  const state = tavernSampleState();
  assert(
    buildCurrentShapingSummary(state.player.lifeStates) === '塑形未成',
    'starts at 塑形未成',
  );

  for (let i = 0; i < P129_SOCIAL_MOMENTUM_SHAPING_THRESHOLD; i++) {
    executeActiveActionOnState(state, P129_PRIMARY_ACTION, {
      random: () => 0.5,
      includeDisturbance: false,
    });
  }

  assert(
    (state.player.lifeStates?.socialMomentum ?? 0) >= P129_SOCIAL_MOMENTUM_SHAPING_THRESHOLD,
    'two socializing actions reach socialMomentum threshold',
  );
  const summary = buildCurrentShapingSummary(state.player.lifeStates);
  assert(summary.includes('人情'), 'shapingSummary shows social axis');
  assert(summary.includes('渐成'), 'shapingSummary shows tier at threshold 2');
  assert(summary === P129_EXPECTED_SHAPING_SUMMARY_AT_THRESHOLD, 'expected social shaping phrase at threshold');
  assert(!summary.includes('酒肆'), 'copy is growth direction not origin flavor');

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
        primary: { routeId: 'wanderer', name: '未定', phase: '未入门' },
        diagnostic: { routeStates: {}, activeRouteFlags: [] },
      },
    },
  );
  assert(model.shapingSummary === summary, 'main screen shapingSummary matches habit wiring');
}

function testLongTermImpactAfterSocializingActions(): void {
  const state = tavernSampleState();
  const first = executeActiveActionOnState(state, P129_PRIMARY_ACTION, {
    random: () => 0.5,
    includeDisturbance: false,
  });
  assert(first !== null, 'first socializing executes');
  const firstImpacts = first!.activeActionSummary.longTermImpactLines ?? [];
  assert(
    firstImpacts.some(line => line.includes('人情往来加深') || line.includes('人情方向已被记住')),
    'first socializing shows shaping or echo long-term impact',
  );

  const second = executeActiveActionOnState(state, P129_PRIMARY_ACTION, {
    random: () => 0.5,
    includeDisturbance: false,
  });
  assert(second !== null, 'second socializing executes');
  const secondImpacts = second!.activeActionSummary.longTermImpactLines ?? [];
  assert(
    secondImpacts.some(line => line.includes('人情往来加深')),
    'second socializing tier cross shows shaping long-term impact',
  );
  assert(
    formatLongTermFlag('p9_echo_social_hook', true).includes('人情方向'),
    'echo hook label readable as life-path continuation',
  );
  assert(
    formatLongTermFlag('p9_early_social_focus', true).includes('人情重心'),
    'early focus label readable as life-path continuation',
  );
}

function testPeriodSummaryShapingGrowth(): void {
  const lifeStates = createDefaultPlayerLifeStates({ socialMomentum: 2 });
  const period = buildPeriodSummary({
    sourceLabel: '童年岁月',
    headline: '交游小成',
    body: '这一季你多与玩伴相处、听故事学人情。',
    lifeStates,
  });
  assert(
    period.body.includes(P129_PERIOD_SHAPING_AXIS_LABEL),
    'period summary body includes shaping growth line for social axis',
  );
  assert(
    period.body.includes('反复做事'),
    'period summary distinguishes behavior-driven growth from passive age gain',
  );
}

function testContinuationReadability(): void {
  const state = tavernSampleState();
  for (let i = 0; i < P129_SOCIAL_MOMENTUM_SHAPING_THRESHOLD; i++) {
    executeActiveActionOnState(state, P129_PRIMARY_ACTION, {
      random: () => 0.5,
      includeDisturbance: false,
    });
  }

  const fork = getOrdinaryEarlyLifeChoiceForOrigin(P129_SAMPLE_ORIGIN_ID);
  assert(fork?.id === 'ordinary_tavern_network_fork', 'tavern childhood fork exists');
  assert(
    (fork?.prompt ?? '').includes('客人'),
    'fork prompt references guest/network theme readable after social shaping',
  );

  const evaluator = new ConditionEvaluator();
  const loader = EventLoader.getInstance();
  const p28 = loader.getEventById('p28_social_momentum_network_fork');
  const p28State = {
    ...state,
    player: { ...state.player, age: 24 } as PlayerState,
  } as GameState;
  assert(
    Boolean(p28 && evaluator.evaluate(p28.conditions![0], p28State)),
    'p28 eligible after socialMomentum threshold on sample path',
  );
  assert(
    (p28?.content?.text ?? '').includes('人情往来'),
    'p28 copy references prior social shaping rhythm',
  );
}

function testNoMultiOriginParallelization(): void {
  const farmPeasant = tavernSampleState({
    flags: { origin_farm_peasant: true, origin_tavern_hand: false },
    player: {
      traits: ['keen_mind', 'lazy', 'bold'],
    } as PlayerState,
  });
  assert(!isP129TavernSampleScope(farmPeasant), 'farm_peasant excluded from P129 sample');

  const merchant = tavernSampleState({
    flags: { origin_merchant_family: true, origin_tavern_hand: false },
    player: {
      traits: ['keen_mind', 'lazy', 'bold'],
    } as PlayerState,
  });
  assert(!isP129TavernSampleScope(merchant), 'merchant_house excluded from P129 sample');
}

export async function runP129OrdinaryOriginVisibleGrowthTests(): Promise<void> {
  testBaselineScopeLocked();
  testShapingSummaryTransition();
  testLongTermImpactAfterSocializingActions();
  testPeriodSummaryShapingGrowth();
  testContinuationReadability();
  testNoMultiOriginParallelization();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP129OrdinaryOriginVisibleGrowthTests()
    .then(() => console.log('p129OrdinaryOriginVisibleGrowthTests: ok'))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

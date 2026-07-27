import { executeActiveActionOnState } from '../src/core/activePlanning/ActivePlanningService';
import { buildPeriodSummary } from '../src/core/activePlanning/periodSummaryBuilder';
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import {
  P127_CONTINUATION_AGE_MAX,
  P127_PRIMARY_ACTION,
  P127_PRIMARY_AGE_MIN,
  P127_PRIMARY_AGE_MAX,
  P127_SAMPLE_ORIGIN_ID,
  P127_TRAINING_HABIT_SHAPING_THRESHOLD,
  isP127MartialSampleScope,
} from '../src/hvg/p127MartialSampleBaseline';
import { formatLongTermFlag } from '../src/utils/playerFacingLabels';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function martialSampleState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 5,
      traits: ['keen_mind', 'lazy', 'bold'],
      lifeStates: createDefaultPlayerLifeStates({ trainingHabit: 0 }),
      flags: {},
      ...overrides.player,
    } as PlayerState,
    flags: {
      origin_wuxia_family: true,
      origin_id: P127_SAMPLE_ORIGIN_ID,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

function testBaselineScopeLocked(): void {
  assert(P127_PRIMARY_AGE_MIN === 5 && P127_PRIMARY_AGE_MAX === 8, 'primary band 5-8');
  assert(P127_CONTINUATION_AGE_MAX === 16, 'continuation band ends at 16');
  assert(P127_TRAINING_HABIT_SHAPING_THRESHOLD === 2, 'trainingHabit threshold is 2');
  assert(P127_PRIMARY_ACTION === 'action_childhood_training', 'primary action locked');

  const inScope = martialSampleState({ player: { age: 7 } as PlayerState });
  assert(isP127MartialSampleScope(inScope), 'martial_family age 7 is in sample scope');

  const outScope = martialSampleState({ player: { age: 18 } as PlayerState });
  assert(!isP127MartialSampleScope(outScope), 'age 18 outside sample scope');
}

function testShapingSummaryTransition(): void {
  const state = martialSampleState();

  for (let i = 0; i < P127_TRAINING_HABIT_SHAPING_THRESHOLD; i++) {
    executeActiveActionOnState(state, P127_PRIMARY_ACTION, {
      random: () => 0.5,
      includeDisturbance: false,
    });
  }

  assert(
    (state.player.lifeStates?.trainingHabit ?? 0) >= P127_TRAINING_HABIT_SHAPING_THRESHOLD,
    'two training actions reach trainingHabit threshold',
  );

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
  assert(model.shapingSummary === '塑形未成', 'practice habits do not define shaping summary');
}

function testLongTermImpactAfterTrainingActions(): void {
  const state = martialSampleState();
  const first = executeActiveActionOnState(state, P127_PRIMARY_ACTION, {
    random: () => 0.5,
    includeDisturbance: false,
  });
  assert(first !== null, 'first training executes');
  const firstImpacts = first!.activeActionSummary.longTermImpactLines ?? [];
  assert(
    firstImpacts.includes('练功实践有所积累'),
    'first training shows explicit practice feedback',
  );

  const second = executeActiveActionOnState(state, P127_PRIMARY_ACTION, {
    random: () => 0.5,
    includeDisturbance: false,
  });
  assert(second !== null, 'second training executes');
  const secondImpacts = second!.activeActionSummary.longTermImpactLines ?? [];
  assert(
    secondImpacts.includes('练功实践有所积累'),
    'second training keeps explicit practice feedback',
  );
  assert(
    formatLongTermFlag('p9_echo_training_hook', true).includes('习武方向'),
    'echo hook label readable as life-path continuation',
  );
  assert(
    formatLongTermFlag('p9_early_training_focus', true).includes('习武重心'),
    'early focus label readable as life-path continuation',
  );
}

function testPeriodSummaryShapingGrowth(): void {
  const lifeStates = createDefaultPlayerLifeStates({ trainingHabit: 2 });
  const period = buildPeriodSummary({
    sourceLabel: '童年岁月',
    headline: '练功小成',
    body: '这一季你多在院中练基本功。',
    lifeStates,
  });
  assert(
    period.body.includes('练功实践'),
    'period summary body includes descriptive martial practice line',
  );
  assert(
    period.body.includes('开始重复'),
    'period summary distinguishes repeated practice from passive age gain',
  );
}

function testContinuationReadability(): void {
  const state = martialSampleState();
  for (let i = 0; i < P127_TRAINING_HABIT_SHAPING_THRESHOLD; i++) {
    executeActiveActionOnState(state, P127_PRIMARY_ACTION, {
      random: () => 0.5,
      includeDisturbance: false,
    });
  }

  const evaluator = new ConditionEvaluator();
  const loader = EventLoader.getInstance();
  const p42 = loader.getEventById('p42_training_habit_youth_sparring');
  const p42State = {
    ...state,
    player: { ...state.player, age: 15 } as PlayerState,
  } as GameState;
  assert(
    Boolean(p42 && evaluator.evaluate(p42.conditions![0], p42State)),
    'p42 eligible after trainingHabit threshold on sample path',
  );
  assert(
    (p42?.content?.text ?? '').includes('练武节律'),
    'p42 copy references prior training rhythm',
  );
}

function testNoScholarParallelization(): void {
  const scholar = martialSampleState({
    flags: { origin_scholar_family: true, origin_wuxia_family: false },
    player: {
      traits: ['keen_mind', 'lazy', 'bold'],
    } as PlayerState,
  });
  assert(!isP127MartialSampleScope(scholar), 'scholar route excluded from P127 sample');
}

export async function runP127MartialSecondVisibleGrowthTests(): Promise<void> {
  testBaselineScopeLocked();
  testShapingSummaryTransition();
  testLongTermImpactAfterTrainingActions();
  testPeriodSummaryShapingGrowth();
  testContinuationReadability();
  testNoScholarParallelization();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP127MartialSecondVisibleGrowthTests()
    .then(() => console.log('p127MartialSecondVisibleGrowthTests: ok'))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

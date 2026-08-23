import {
  buildActiveActionSummaryDisplay,
} from '../src/core/activePlanning/activeActionSummaryBuilder';
import {
  executeActiveActionOnState,
} from '../src/core/activePlanning/ActivePlanningService';
import { calculatePublicStatDeltas } from '../src/core/activePlanning/periodSummaryBuilder';
import type { ActionResult } from '../src/types/activeActionTypes';
import type { GameState } from '../src/types/eventTypes';
import { GameTestFramework } from './GameTestFramework';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

type PresentationOptions = {
  diminishingReturn?: boolean;
  publicDelta?: Record<string, number>;
};

function makeResult(
  actionId: string,
  category: string,
  deltas: Record<string, number>,
  metadata: Record<string, unknown> = {},
): ActionResult {
  return {
    actionId,
    deltas,
    duration: { value: 1, unit: 'quarter' },
    metadata: {
      actionId,
      category,
      duration: { value: 1, unit: 'quarter' },
      risk: 'low',
      sourceKind: 'active_action',
      rewardSummary: '配置收益',
      costSummary: '时间投入',
      riskSummary: '风险较低',
      ...metadata,
    },
  } as ActionResult;
}

function present(
  result: ActionResult,
  options: PresentationOptions = {},
): Record<string, unknown> {
  return buildActiveActionSummaryDisplay(result, options as never) as unknown as Record<string, unknown>;
}

function createState(): GameState {
  return (new GameTestFramework() as unknown as { createTestState(): GameState }).createTestState();
}

function testMartialNormalAndRepeatDiffer(): void {
  const normal = present(makeResult('action_training_basic', 'training', { martialPower: 2 }));
  const repeat = present(
    makeResult('action_training_basic', 'training', { martialPower: 1 }, { diminishingReturn: true }),
    { diminishingReturn: true },
  );
  assert(String(normal.resultExplanation).includes('练功'), 'martial normal must name its category');
  assert(String(normal.resultExplanation).includes('功力+2'), 'martial normal must use actual delta');
  assert(String(repeat.diminishingReturnNotice).includes('收益递减'), 'martial repeat must expose formal diminishing return');
  assert(normal.resultExplanation !== repeat.resultExplanation, 'martial normal and repeat must differ');
}

function testStudyNormalAndDiminishingDiffer(): void {
  const normal = present(makeResult('action_study_basic', 'study', { knowledge: 2 }));
  const diminishing = present(
    makeResult('action_study_basic', 'study', { knowledge: 1 }, { diminishingReturn: true }),
    { diminishingReturn: true },
  );
  assert(String(normal.resultExplanation).includes('读书'), 'study result must name study');
  assert(String(normal.resultExplanation).includes('学识+2'), 'study result must include actual knowledge delta');
  assert(String(diminishing.resultExplanation).includes('读书'), 'diminishing study must keep category fact');
  assert(String(diminishing.diminishingReturnNotice).includes('收益递减'), 'study diminishing notice required');
}

function testBusinessPositiveZeroNegativeAndRepeat(): void {
  const positive = present(makeResult('action_business_basic', 'business', { businessAcumen: 2, reputation: 1 }));
  const zero = present(makeResult('action_business_basic', 'business', {}, { diminishingReturn: true }), {
    diminishingReturn: true,
  });
  const negative = present(makeResult('action_business_basic', 'business', { businessAcumen: -1, reputation: -1 }));
  assert(String(positive.resultExplanation).includes('营生'), 'business result must name business');
  assert(String(positive.resultExplanation).includes('经营+2'), 'business result must use positive actual delta');
  assert(String(zero.resultExplanation).includes('没有带来可见数值变化'), 'zero result must not claim success');
  assert(!('resourcePressureNotice' in zero), 'zero result must not expose resource pressure');
  assert(String(negative.resultExplanation).includes('经营-1'), 'negative result must remain visible');
  assert(String(negative.resultExplanation).includes('代价'), 'negative result must explain the cost direction');
}

function testCategorySwitchesRemainDistinct(): void {
  const martial = present(makeResult('action_training_basic', 'training', { martialPower: 1 }));
  const study = present(makeResult('action_study_basic', 'study', { knowledge: 1 }));
  const business = present(makeResult('action_business_basic', 'business', { businessAcumen: 1 }));
  const travel = present(makeResult('action_travel_basic', 'travel', { connections: 1 }));
  assert(martial.resultExplanation !== study.resultExplanation, 'martial to study must differ');
  assert(study.resultExplanation !== business.resultExplanation, 'study to business must differ');
  assert(business.resultExplanation !== travel.resultExplanation, 'business to travel must differ');
  assert(String(travel.resultExplanation).includes('游历'), 'travel result must name travel');
}

function testDeterminismAndActualDeltaPrecedence(): void {
  const result = makeResult('action_training_basic', 'training', { martialPower: 1 }, {
    rewardSummary: '功力+99',
  });
  const first = present(result, { publicDelta: { martialPower: 1 } });
  const second = present(result, { publicDelta: { martialPower: 1 } });
  assert(JSON.stringify(first) === JSON.stringify(second), 'same presentation input must be deterministic');
  assert(String(first.resultExplanation).includes('功力+1'), 'actual public delta must override configured summary');
  assert(!String(first.resultExplanation).includes('功力+99'), 'theoretical configured reward must not leak into result');
  const forbidden = `${String(first.resultExplanation)}${String(first.diminishingReturnNotice ?? '')}`;
  assert(!/阈值|结局|ending|随机|未来|将会|后续事件/.test(forbidden), 'result must not promise hidden or future outcomes');
}

function testRealExecutionUsesBeforeAfterDelta(): void {
  const state = createState();
  const before = structuredClone(state.player);
  const execution = executeActiveActionOnState(state, 'action_training_basic', {
    random: () => 0.5,
    includeDisturbance: false,
  });
  assert(execution !== null, 'real active action must execute');
  const actualDelta = calculatePublicStatDeltas(before, state.player);
  assert(
    execution!.activeActionSummary.appliedDeltaSummary?.includes(`功力+${actualDelta.martialPower}`) === true,
    'real summary must use before/after public delta',
  );
  assert(
    execution!.activeActionSummary.resultExplanation?.includes(`功力+${actualDelta.martialPower}`) === true,
    'real result explanation must use before/after public delta',
  );
}

export async function runActiveActionResultDifferentiationTests(): Promise<void> {
  testMartialNormalAndRepeatDiffer();
  testStudyNormalAndDiminishingDiffer();
  testBusinessPositiveZeroNegativeAndRepeat();
  testCategorySwitchesRemainDistinct();
  testDeterminismAndActualDeltaPrecedence();
  testRealExecutionUsesBeforeAfterDelta();
  console.log('activeActionResultDifferentiation.test.ts: 16 focused scenarios ok');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runActiveActionResultDifferentiationTests().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

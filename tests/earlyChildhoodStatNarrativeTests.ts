import { buildActiveActionSummaryDisplay } from '../src/core/activePlanning/activeActionSummaryBuilder';
import { buildPeriodSummary } from '../src/core/activePlanning/periodSummaryBuilder';
import type { ActionResult } from '../src/types/activeActionTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runEarlyChildhoodStatNarrativeTests(): void {
  const period = buildPeriodSummary({
    sourceLabel: '童年岁月',
    headline: '识文断字',
    body: '你在长辈面前跟读蒙学字卡。',
    deltas: { comprehension: 1 },
    deltaCause: '识文断字',
  });
  assert(period.statDeltaSummary.includes('因「识文断字」'), 'period summary binds cause');
  assert(period.narrativeText.includes('因「识文断字」'), 'period narrative binds cause');

  const action = buildActiveActionSummaryDisplay({
    actionId: 'action_childhood_training',
    duration: { value: 1, unit: 'quarter' },
    deltas: { martialPower: 1 },
    metadata: {
      rewardSummary: '功力+1',
      costSummary: '时间投入',
      riskSummary: '低',
    },
  } as ActionResult);
  assert(action.appliedDeltaSummary.includes('因「'), 'active action summary binds cause');
  assert(action.appliedDeltaSummary.includes('功力'), 'active action summary includes stat');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runEarlyChildhoodStatNarrativeTests();
  console.log('earlyChildhoodStatNarrativeTests: ok');
}

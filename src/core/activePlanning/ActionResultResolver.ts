import { getActionById, getMinimumActions } from '../../data/activeActionCatalog';
import type {
  ActionFocusStreak,
  ActionResult,
  ActiveActionDefinition,
  RiskLevel,
} from '../../types/activeActionTypes';
import type { GameState } from '../../types/eventTypes';
import { clampActionDeltasForAge } from './ageActionStatCaps';
import { formatStatDeltaSummary } from './periodSummaryBuilder';

export interface ActionResolverInput {
  state: GameState;
  actionId: string;
  focusStreak?: ActionFocusStreak;
  random?: () => number;
}

/** Authoritative same-category repeat diminishing rule — consumed by resolveActiveAction. */
export const SAME_CATEGORY_REPEAT_DIMINISHING_THRESHOLD = 3 as const;
export const SAME_CATEGORY_REPEAT_REWARD_MULTIPLIER = 0.7 as const;

/**
 * Structured repeat-mechanism facts for Investigation evidence.
 * Must stay derived from the same constants resolveActiveAction consumes.
 */
export function activeActionRepeatMechanismFacts(): {
  sameCategoryRepeatThreshold: typeof SAME_CATEGORY_REPEAT_DIMINISHING_THRESHOLD;
  rewardMultiplierWhenRepeated: typeof SAME_CATEGORY_REPEAT_REWARD_MULTIPLIER;
  riskEscalatesWhenRepeated: true;
  diminishingReturnFlagWhenRepeated: true;
} {
  return {
    sameCategoryRepeatThreshold: SAME_CATEGORY_REPEAT_DIMINISHING_THRESHOLD,
    rewardMultiplierWhenRepeated: SAME_CATEGORY_REPEAT_REWARD_MULTIPLIER,
    riskEscalatesWhenRepeated: true,
    diminishingReturnFlagWhenRepeated: true,
  };
}

function rollBetween(min: number, max: number, random: () => number): number {
  if (max <= min) return min;
  return min + Math.floor(random() * (max - min + 1));
}

function escalateRisk(risk: RiskLevel): RiskLevel {
  if (risk === 'low') return 'medium';
  if (risk === 'medium') return 'high';
  return 'high';
}

function buildSummaries(action: ActiveActionDefinition): Pick<ActionResult['metadata'], 'rewardSummary' | 'costSummary' | 'riskSummary'> {
  const rewardParts = action.rewards.map(r => `${r.stat}+${r.min}~${r.max}`);
  const costParts = action.costs.map(c => `${c.stat ?? 'resource'}-${c.amount}`);
  return {
    rewardSummary: rewardParts.join('，') || '稳步成长',
    costSummary: costParts.join('，') || '时间投入',
    riskSummary: action.risk === 'low' ? '风险较低' : action.risk === 'medium' ? '偶有变数' : '变数较大',
  };
}

export function resolveActiveAction(input: ActionResolverInput): ActionResult | null {
  const action = getActionById(input.actionId);
  if (!action) return null;

  const random = input.random ?? Math.random;
  const streak = input.focusStreak ?? { category: null, count: 0 };
  const sameCategoryRepeat = streak.category === action.category ? streak.count + 1 : 1;
  const diminished = sameCategoryRepeat >= SAME_CATEGORY_REPEAT_DIMINISHING_THRESHOLD;
  const rewardMultiplier = diminished ? SAME_CATEGORY_REPEAT_REWARD_MULTIPLIER : 1;
  const effectiveRisk = diminished ? escalateRisk(action.risk) : action.risk;

  const deltas: Record<string, number> = {};
  for (const reward of action.rewards) {
    const raw = rollBetween(reward.min, reward.max, random);
    const value = Math.max(0, Math.round(raw * rewardMultiplier));
    if (value !== 0) {
      deltas[reward.stat] = (deltas[reward.stat] ?? 0) + value;
    }
  }
  for (const cost of action.costs) {
    const key = cost.stat;
    deltas[key] = (deltas[key] ?? 0) - cost.amount;
  }

  const age = input.state.player?.age ?? 0;
  const clamped = clampActionDeltasForAge(age, deltas);
  for (const key of Object.keys(deltas)) {
    if (!(key in clamped)) delete deltas[key];
    else deltas[key] = clamped[key];
  }

  const summaries = buildSummaries(action);
  const appliedDeltaSummary = formatStatDeltaSummary(deltas);
  return {
    actionId: action.id,
    deltas,
    duration: action.duration,
    metadata: {
      actionId: action.id,
      category: action.category,
      duration: action.duration,
      risk: effectiveRisk,
      sourceKind: 'active_action',
      ...summaries,
      rewardSummary:
        appliedDeltaSummary !== '本期未见明显数值变化'
          ? appliedDeltaSummary
          : summaries.rewardSummary,
      riskSummary:
        diminished
          ? `${summaries.riskSummary}（重复投入，收益递减）`
          : summaries.riskSummary,
      diminishingReturn: diminished,

    },
  };
}

export function listResolvableMinimumActionIds(): string[] {
  return getMinimumActions().map(action => action.id);
}

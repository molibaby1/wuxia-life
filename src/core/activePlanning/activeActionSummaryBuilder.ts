import { getActionById } from '../../data/activeActionCatalog';
import type { ActionDuration, ActionResult, ActiveActionSummaryDisplay } from '../../types/activeActionTypes';
import { formatStatDeltaSummary } from './periodSummaryBuilder';

export interface ActiveActionResultPresentationOptions {
  hasPendingDisturbance?: boolean;
  longTermImpactLines?: string[];
  publicDelta?: Record<string, number>;
  diminishingReturn?: boolean;
}

export function formatActionDurationLabel(duration: ActionDuration): string {
  switch (duration.unit) {
    case 'month':
      return `${duration.value}个月`;
    case 'quarter':
      return `${duration.value}个季度`;
    case 'short_stage':
      return `${duration.value}段短期精进`;
    case 'year':
      return `${duration.value}年`;
    case 'milestone':
      return `${duration.value}个里程碑阶段`;
    default:
      return `${duration.value}期`;
  }
}

export function buildActiveActionSummaryDisplay(
  actionResult: ActionResult,
  options?: ActiveActionResultPresentationOptions,
): ActiveActionSummaryDisplay {
  const action = getActionById(actionResult.actionId);
  const actionName = action?.name ?? actionResult.actionId;
  const publicDelta = options?.publicDelta ?? actionResult.deltas;
  const deltaSummary = formatStatDeltaSummary(publicDelta);
  const categoryLabel = getActionCategoryLabel(actionResult.metadata.category);
  const resultExplanation = buildResultExplanation(categoryLabel, deltaSummary, publicDelta);
  const diminishingReturn = options?.diminishingReturn ?? actionResult.metadata.diminishingReturn === true;
  const nextStepHint = options?.hasPendingDisturbance
    ? '本期行动已落定，稍后或有江湖小扰动需要你留意。'
    : '本期行动已落定，点击继续安排下一期人生。';

  return {
    sourceLabel: '主动行动',
    actionName,
    durationLabel: formatActionDurationLabel(actionResult.duration),
    rewardSummary: actionResult.metadata.rewardSummary,
    costSummary: actionResult.metadata.costSummary,
    riskSummary: actionResult.metadata.riskSummary,
    appliedDeltaSummary:
      deltaSummary === '本期未见明显数值变化'
        ? deltaSummary
        : `因「${actionName}」：${deltaSummary}`,
    resultExplanation,
    diminishingReturnNotice: diminishingReturn
      ? '同类连续投入已触发正式收益递减，本次变化按实际结果展示。'
      : undefined,
    nextStepHint,
    longTermImpactLines: options?.longTermImpactLines?.length
      ? options.longTermImpactLines
      : undefined,
  };
}

function getActionCategoryLabel(category: string): string {
  switch (category) {
    case 'training':
      return '练功';
    case 'study':
      return '读书';
    case 'business':
      return '营生';
    case 'socializing':
      return '交游';
    case 'travel':
      return '游历';
    default:
      return '本次行动';
  }
}

function buildResultExplanation(
  categoryLabel: string,
  deltaSummary: string,
  publicDelta: Record<string, number>,
): string {
  if (deltaSummary === '本期未见明显数值变化') {
    return `你完成了${categoryLabel}，但本次没有带来可见数值变化。`;
  }
  const hasPositive = Object.values(publicDelta).some(value => value > 0);
  const hasNegative = Object.values(publicDelta).some(value => value < 0);
  const direction = hasPositive && hasNegative
    ? '同时有收获与代价'
    : hasNegative
      ? '并承担了可见代价'
      : '并产生了可见变化';
  return `你完成了${categoryLabel}，${direction}：${deltaSummary}。`;
}

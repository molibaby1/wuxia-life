import { getActionById } from '../../data/activeActionCatalog';
import type { ActionDuration, ActionResult, ActiveActionSummaryDisplay } from '../../types/activeActionTypes';
import { formatStatDeltaSummary } from './periodSummaryBuilder';

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
  options?: { hasPendingDisturbance?: boolean; longTermImpactLines?: string[] },
): ActiveActionSummaryDisplay {
  const action = getActionById(actionResult.actionId);
  const actionName = action?.name ?? actionResult.actionId;
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
      formatStatDeltaSummary(actionResult.deltas) === '本期未见明显数值变化'
        ? formatStatDeltaSummary(actionResult.deltas)
        : `因「${actionName}」：${formatStatDeltaSummary(actionResult.deltas)}`,
    nextStepHint,
    longTermImpactLines: options?.longTermImpactLines?.length
      ? options.longTermImpactLines
      : undefined,
  };
}

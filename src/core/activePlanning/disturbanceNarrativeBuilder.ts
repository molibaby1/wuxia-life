import type { ActionResult, DisturbanceNarrativeDisplay } from '../../types/activeActionTypes';
import { getActionById } from '../../data/activeActionCatalog';
import { getDisturbanceNarrativeCopy } from './disturbanceNarrativeCatalog';

export function buildDisturbanceNarrativeDisplay(
  disturbanceId: string,
  fallbackTitle: string,
  actionResult: ActionResult,
): DisturbanceNarrativeDisplay | null {
  const copy = getDisturbanceNarrativeCopy(disturbanceId);
  if (!copy) return null;

  const sourceAction = getActionById(actionResult.actionId);
  return {
    sourceLabel: '江湖扰动',
    disturbanceId,
    title: copy.title || fallbackTitle,
    bodyText: copy.bodyText,
    sourceActionName: sourceAction?.name ?? actionResult.actionId,
    impactSummary: copy.impactSummary,
    returnToPlanHint: copy.returnToPlanHint,
  };
}

export function markDisturbanceNarrativeShown(state: import('../../types/eventTypes').GameState, disturbanceId: string): void {
  const history = state.actionHistory ?? [];
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const entry = history[i];
    if (entry.sourceKind === 'random_disturbance' && entry.actionId === disturbanceId) {
      entry.narrativeShownToPlayer = true;
      return;
    }
  }
}

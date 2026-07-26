import type { ChoiceFeedbackModel } from './choiceFeedback';
import { formatLongTermFlag, formatRouteLabel } from '../utils/playerFacingLabels';

export interface ProgressionOverlayDetailRow {
  label: string;
  value: string;
}

export interface ProgressionOverlayCard {
  id: string;
  sourceLabel?: string;
  title: string;
  body?: string;
  detailRows?: ProgressionOverlayDetailRow[];
  metaLines?: string[];
}

export interface ProgressionOverlayPayload {
  cards: ProgressionOverlayCard[];
}

export function compactOverlayMetaLines(
  ...lines: Array<string | undefined | null | false>
): string[] {
  return lines.filter((line): line is string => typeof line === 'string' && line.trim().length > 0);
}

export function compactOverlayDetailRows(
  rows: ProgressionOverlayDetailRow[],
): ProgressionOverlayDetailRow[] {
  return rows.filter(row => Boolean(row.value?.trim()));
}

function formatDelta(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function getStatName(stat: string): string {
  const statNames: Record<string, string> = {
    martialPower: '功力',
    externalSkill: '外功',
    internalSkill: '内功',
    qinggong: '轻功',
    chivalry: '侠义',
    charisma: '魅力',
    constitution: '体魄',
    comprehension: '悟性',
    reputation: '名望',
    influence: '影响力',
    connections: '人脉',
    knowledge: '学识',
    businessAcumen: '经营',
    money: '银两',
  };
  return statNames[stat] || stat;
}

export function buildChoiceFeedbackOverlayCard(
  id: string,
  sourceLabel: string,
  title: string,
  feedback: ChoiceFeedbackModel,
): ProgressionOverlayCard | null {
  const body = feedback.player.narrativeResult?.trim();
  if (!body) return null;

  const metaLines: string[] = [];

  for (const impact of feedback.player.statImpacts) {
    if (impact.visibility !== 'player' || impact.delta === 0) continue;
    metaLines.push(
      `${getStatName(String(impact.label || impact.stat))} ${formatDelta(impact.delta)}`,
    );
  }

  for (const impact of feedback.player.relationshipImpacts) {
    if (impact.visibility !== 'player' || impact.delta === 0) continue;
    metaLines.push(
      `${impact.relationName || '某位关系人'} ${formatDelta(impact.delta)}`,
    );
  }

  const routeImpact = feedback.player.routeImpact;
  if (
    routeImpact &&
    routeImpact.visibility === 'player' &&
    (routeImpact.from || routeImpact.to)
  ) {
    metaLines.push(
      `路线：${formatRouteLabel(routeImpact.from)} → ${formatRouteLabel(routeImpact.to)}`,
    );
  }

  for (const flag of feedback.player.longTermFlags) {
    if (flag.visibility !== 'player') continue;
    metaLines.push(formatLongTermFlag(flag.flag, flag.value));
  }

  return {
    id,
    sourceLabel,
    title,
    body,
    metaLines: compactOverlayMetaLines(...metaLines),
  };
}

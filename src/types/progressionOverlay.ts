import type { ChoiceFeedbackModel } from './choiceFeedback';
import type {
  ActiveActionSummaryDisplay,
  AutomaticStageResultDisplay,
  PeriodSummaryDisplay,
} from './activeActionTypes';
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
    chivalry: '侠义',
    charisma: '魅力',
    constitution: '体魄',
    reputation: '名望',
    influence: '影响力',
    connections: '人脉',
    knowledge: '学识',
    businessAcumen: '经营',
  };
  return statNames[stat] || stat;
}

const PLAYER_RESULT_STATS = [
  'martialPower',
  'chivalry',
  'charisma',
  'constitution',
  'reputation',
  'influence',
  'connections',
  'knowledge',
  'businessAcumen',
] as const;

function buildDeltaMetaLines(deltas: Record<string, number>): string[] {
  return PLAYER_RESULT_STATS.flatMap(stat => {
    const delta = typeof deltas[stat] === 'number' ? deltas[stat] : 0;
    return delta === 0 ? [] : [`${getStatName(stat)} ${formatDelta(delta)}`];
  });
}

export function buildStageResultOverlayCard(
  id: string,
  title: string,
  metaLines: Array<string | undefined | null | false> = [],
): ProgressionOverlayCard {
  return {
    id,
    title,
    metaLines: compactOverlayMetaLines(...metaLines),
  };
}

export function buildPlayerDeltaOverlayCard(
  id: string,
  title: string,
  before: object,
  after: object,
): ProgressionOverlayCard {
  const beforeValues = before as Record<string, unknown>;
  const afterValues = after as Record<string, unknown>;
  const deltas = Object.fromEntries(PLAYER_RESULT_STATS.map(stat => {
    const beforeValue = typeof beforeValues[stat] === 'number' ? beforeValues[stat] : 0;
    const afterValue = typeof afterValues[stat] === 'number' ? afterValues[stat] : 0;
    return [stat, afterValue - beforeValue];
  }));
  return buildStageResultOverlayCard(id, title, buildDeltaMetaLines(deltas));
}

export function buildAutomaticStageOverlayCards(
  results: AutomaticStageResultDisplay[],
): ProgressionOverlayCard[] {
  return results.map(result => ({
    id: result.id,
    sourceLabel: result.sourceKind === 'setback' ? '突发变故' : undefined,
    title: result.title,
    body: result.body?.trim() || undefined,
    metaLines: buildDeltaMetaLines(result.deltas),
  }));
}

export function buildChoiceFeedbackOverlayCard(
  id: string,
  stageTitle: string,
  selectedChoiceTitle: string,
  feedback: ChoiceFeedbackModel,
  selectedChoiceTexts: Array<string | undefined> = [],
): ProgressionOverlayCard | null {
  const narrativeResult = feedback.player.narrativeResult?.trim();
  const repeatedChoiceTexts = new Set(
    selectedChoiceTexts
      .map(text => text?.trim())
      .filter((text): text is string => Boolean(text)),
  );
  const body = narrativeResult && !repeatedChoiceTexts.has(narrativeResult)
    ? narrativeResult
    : undefined;

  const metaLines: string[] = [`选择：${selectedChoiceTitle}`];

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

  const compactMetaLines = compactOverlayMetaLines(...metaLines);
  return {
    id,
    title: stageTitle,
    body,
    metaLines: compactMetaLines,
  };
}

export function buildActiveActionOverlayCard(
  id: string,
  summary: ActiveActionSummaryDisplay,
): ProgressionOverlayCard {
  return {
    id,
    title: summary.actionName,
    body: summary.resultExplanation?.trim() || undefined,
    metaLines: compactOverlayMetaLines(
      summary.appliedDeltaSummary,
      summary.diminishingReturnNotice,
      ...(summary.longTermImpactLines ?? []),
    ),
  };
}

export function buildPeriodSummaryOverlayCard(
  id: string,
  summary: PeriodSummaryDisplay,
): ProgressionOverlayCard {
  const deltaLines = summary.statDeltaSummary
    .replace(/^因「.*?」：/, '')
    .split('，')
    .map(line => line.trim().replace(/([^\s])([+-]\d+)/u, '$1 $2'));

  return {
    id,
    title: summary.headline,
    metaLines: compactOverlayMetaLines(...deltaLines),
  };
}

export function buildPeriodSummaryOverlayCards(
  id: string,
  summary: PeriodSummaryDisplay,
): ProgressionOverlayCard[] {
  return summary.stageResults?.length
    ? buildAutomaticStageOverlayCards(summary.stageResults)
    : [buildPeriodSummaryOverlayCard(id, summary)];
}

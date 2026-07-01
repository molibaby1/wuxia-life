import type { EndingInfo } from '../core/EndingSystem';
import type { P19FinalSummaryComposition } from '../narrative/profile/types';
import type { GameState } from '../types/eventTypes';
import {
  buildLateLifeShapingRecapLine,
  buildShapingPatternEndingTone,
} from '../utils/habitShapingSummary';
import { readMergedFlags } from '../p17/stateAccess';
import { buildLaterLifeLegacyReport } from '../p18/laterLifeLegacySelection';
import { buildEndgameCategoryReport } from './endgameCategories';
import { buildHistoricalMemoryReport } from './historicalMemory';
import { buildPreEndgameRecoveryReport } from './preEndgameRecovery';

function legacyContinuationLine(state: GameState, worldId: string): string {
  const report = buildLaterLifeLegacyReport(state, new Set(['legacy']), state.player?.age ?? 0, worldId);
  if (report.activeLegacyOutcomes.includes('p18_outcome_transmission_success')) {
    return '所传之道有人接续，身后仍留一脉未断的传承。';
  }
  if (report.activeLegacyOutcomes.includes('p18_outcome_inherited_burden')) {
    return '所留重担压在后继者肩上，传承线变得脆弱。';
  }
  if (report.successionQualityScore >= 0.65) {
    return '弟子与后人仍承续你留下的技艺与名望。';
  }
  if (report.activeSuccessorRoles.length > 0) {
    return '身后仍有人承接你的身份与责任，但深浅不一。';
  }
  return '你没有留下清晰的传承线，人生收束在个人命运之内。';
}

function personalFateLine(ending: EndingInfo, categoryLabel: string): string {
  return `【${categoryLabel}】${ending.name}——${ending.description}`;
}

export function composeP19FinalSummary(
  state: GameState,
  ending: EndingInfo,
  worldId = 'wuxia',
): P19FinalSummaryComposition {
  const age = state.player?.age ?? 0;
  const categoryReport = buildEndgameCategoryReport(state, worldId);
  const recoveryReport = buildPreEndgameRecoveryReport(state, new Set(['legacy']), age, worldId);
  const memoryReport = buildHistoricalMemoryReport(state, worldId);

  const recoveryLines =
    recoveryReport.explicitSummaryLines.length > 0
      ? recoveryReport.explicitSummaryLines
      : recoveryReport.activeRecoveries.length === 0
        ? ['暮年未触发明确的收束回收，许多线索仍悬而未决。']
        : [];

  const legacyLine = legacyContinuationLine(state, worldId);
  const shapingRecapLine = buildLateLifeShapingRecapLine(state.player?.lifeStates);
  const shapingPatternToneLine = buildShapingPatternEndingTone(
    state.player?.lifeStates,
    readMergedFlags(state),
  );
  const historicalMemoryLines = [
    memoryReport.posthumousReputation,
    memoryReport.divergenceScore >= 0.35
      ? `与你自觉的「${memoryReport.livedSelfUnderstanding.replace(/。$/, '')}」不同，后世记忆另有侧重。`
      : '',
  ].filter(Boolean);

  const sections = [
    personalFateLine(ending, categoryReport.selectedCategory.label),
    shapingRecapLine,
    ...(shapingPatternToneLine ? [shapingPatternToneLine] : []),
    ...recoveryLines,
    legacyLine,
    ...historicalMemoryLines,
  ];

  return {
    endgameCategory: categoryReport.selectedCategory,
    personalFateLine: sections[0],
    recoveryLines,
    legacyContinuationLine: legacyLine,
    historicalMemoryLines,
    composedSummary: sections.join('\n'),
    shapingRecapLine,
    shapingPatternToneLine: shapingPatternToneLine || undefined,
  };
}

export function formatP19FinalSummaryForDisplay(composition: P19FinalSummaryComposition): string {
  return composition.composedSummary;
}

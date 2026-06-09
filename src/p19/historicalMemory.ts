import type {
  HistoricalMemoryPattern,
  HistoricalMemoryReport,
  HistoricalMemoryTone,
  ResolvedHistoricalMemory,
} from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import type { GameState } from '../types/eventTypes';
import { inferLivedSelfUnderstanding, patternTriggersActive } from './stateAccess';

const TONE_RANK: Record<HistoricalMemoryTone, number> = {
  admired: 5,
  respected: 4,
  mixed: 3,
  disputed: 2,
  feared: 1,
  forgotten: 0,
};

function toneFromScore(score: number): HistoricalMemoryTone {
  if (score >= 4.5) return 'admired';
  if (score >= 3.5) return 'respected';
  if (score >= 2.5) return 'mixed';
  if (score >= 1.5) return 'disputed';
  if (score >= 0.5) return 'feared';
  return 'forgotten';
}

export function resolveActiveHistoricalMemoryPatterns(
  state: GameState,
  worldId = 'wuxia',
): ResolvedHistoricalMemory[] {
  const patterns = getWorldProfile(worldId).historicalMemoryPatterns ?? [];
  const results: ResolvedHistoricalMemory[] = [];
  for (const pattern of patterns) {
    if (
      !patternTriggersActive(
        state,
        pattern.triggerFlags,
        pattern.lifePathSignals,
        pattern.requireAllTriggerFlags,
      )
    ) {
      continue;
    }
    results.push({
      patternId: pattern.id,
      label: pattern.label,
      dimension: pattern.dimension,
      memoryTone: pattern.memoryTone,
      intensity: pattern.baseIntensity,
      livedRealityDelta: pattern.livedRealityDelta ?? 0,
    });
  }
  return results.sort((a, b) => b.intensity - a.intensity);
}

function buildPosthumousReputation(
  tone: HistoricalMemoryTone,
  patterns: ResolvedHistoricalMemory[],
  patternDefs: HistoricalMemoryPattern[],
): string {
  const defById = new Map(patternDefs.map(p => [p.id, p]));
  const lines = patterns
    .slice(0, 2)
    .map(p => defById.get(p.patternId)?.summaryLine)
    .filter(Boolean) as string[];
  if (lines.length > 0) {
    return lines.join(' ');
  }
  switch (tone) {
    case 'admired':
      return '后世仍把你当作侠义典范来传颂。';
    case 'respected':
      return '后人记得你的守责与传功，评价偏正。';
    case 'feared':
      return '江湖后世提起你时，多带忌惮与戒惧。';
    case 'disputed':
      return '关于你的评价始终争论不休，难有定论。';
    case 'forgotten':
      return '你的名字并未在江湖传说中留下多少痕迹。';
    default:
      return '后世对你的记忆混杂着褒贬与沉默。';
  }
}

export function buildHistoricalMemoryReport(
  state: GameState,
  worldId = 'wuxia',
): HistoricalMemoryReport {
  const patternDefs = getWorldProfile(worldId).historicalMemoryPatterns ?? [];
  const activePatterns = resolveActiveHistoricalMemoryPatterns(state, worldId);
  const livedSelfUnderstanding = inferLivedSelfUnderstanding(state);

  if (activePatterns.length === 0) {
    return {
      selectedTone: 'mixed',
      dominantDimension: 'jianghu_reputation',
      activePatterns: [],
      livedSelfUnderstanding,
      posthumousReputation: '后世对你的记忆并不鲜明，多半随日常一同淡去。',
      divergenceScore: 0,
      classificationLines: ['No active historical-memory patterns; default mixed tone'],
    };
  }

  let toneScore = 0;
  let toneWeight = 0;
  let divergenceScore = 0;
  const classificationLines: string[] = [];

  for (const item of activePatterns) {
    toneScore += TONE_RANK[item.memoryTone] * item.intensity;
    toneWeight += item.intensity;
    divergenceScore += Math.abs(item.livedRealityDelta) * item.intensity;
    const def = patternDefs.find(p => p.id === item.patternId);
    if (def?.classificationReason) {
      classificationLines.push(`${def.id}: ${def.classificationReason}`);
    }
  }

  const selectedTone = toneFromScore(toneWeight > 0 ? toneScore / toneWeight : 2);
  const dominantDimension = activePatterns[0].dimension;
  const posthumousReputation = buildPosthumousReputation(selectedTone, activePatterns, patternDefs);
  const normalizedDivergence = toneWeight > 0 ? divergenceScore / toneWeight : 0;

  return {
    selectedTone,
    dominantDimension,
    activePatterns,
    livedSelfUnderstanding,
    posthumousReputation,
    divergenceScore: normalizedDivergence,
    classificationLines,
  };
}

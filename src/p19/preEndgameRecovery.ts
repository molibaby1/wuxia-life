import type {
  PreEndgameRecoveryPattern,
  PreEndgameRecoveryReport,
  ResolvedPreEndgameRecovery,
} from '../narrative/profile/types';
import type { ConsequenceTagWeight } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import type { EventDefinition, GameState } from '../types/eventTypes';
import { combineSchedulingMultiplier, P17_LATER_LIFE_MIN_AGE } from '../p17/laterLifeSelection';
import { patternTriggersActive } from './stateAccess';

function clampMultiplier(value: number): number {
  return Math.max(0.35, Math.min(3.5, value));
}

function applyTagWeights(
  tags: Set<string>,
  weights: ConsequenceTagWeight[] | undefined,
  intensity: number,
  accumulator: { opportunity: number; risk: number },
  channel: 'opportunity' | 'risk',
): void {
  if (!weights?.length) return;
  for (const weight of weights) {
    if (!tags.has(weight.tag)) continue;
    const scaled = 1 + (weight.multiplier - 1) * intensity;
    if (channel === 'opportunity') {
      accumulator.opportunity *= scaled;
    } else if (weight.multiplier >= 1) {
      accumulator.risk *= scaled;
    } else {
      accumulator.risk *= 1 - (1 - weight.multiplier) * intensity;
    }
  }
}

export function collectEndgameEventTags(event: EventDefinition): Set<string> {
  const tags = new Set<string>(event.metadata?.tags ?? []);
  if (event.category) tags.add(event.category);
  if (event.storyLine) tags.add(event.storyLine);
  const id = event.id.toLowerCase();
  if (id.includes('elderly') || id.includes('legacy') || id.includes('retire')) tags.add('legacy');
  if (id.includes('relationship') || id.includes('reunion')) tags.add('relationship');
  if (id.includes('feud') || id.includes('revenge') || id.includes('enemy')) tags.add('conflict');
  if (id.includes('sect') || id.includes('faction')) tags.add('faction');
  if (id.includes('decline') || id.includes('collapse')) tags.add('decline');
  if (id.includes('continuity') || id.includes('transmission')) tags.add('continuity');
  return tags;
}

function resolvePatternIntensity(pattern: PreEndgameRecoveryPattern, state: GameState): number {
  if (!patternTriggersActive(state, pattern.triggerFlags, pattern.lifePathSignals)) {
    return 0;
  }
  return pattern.baseIntensity;
}

export function resolveActivePreEndgameRecoveries(
  state: GameState,
  worldId = 'wuxia',
): ResolvedPreEndgameRecovery[] {
  const patterns = getWorldProfile(worldId).preEndgameRecoveryPatterns ?? [];
  const results: ResolvedPreEndgameRecovery[] = [];
  for (const pattern of patterns) {
    const intensity = resolvePatternIntensity(pattern, state);
    if (intensity <= 0) continue;
    results.push({
      patternId: pattern.id,
      label: pattern.label,
      dimension: pattern.dimension,
      recoveryKind: pattern.recoveryKind,
      intensity,
      summaryLine: pattern.summaryLine,
    });
  }
  return results.sort((a, b) => b.intensity - a.intensity);
}

export function buildPreEndgameRecoveryReport(
  state: GameState,
  eventTags: Set<string>,
  age: number,
  worldId = 'wuxia',
): PreEndgameRecoveryReport {
  const empty: PreEndgameRecoveryReport = {
    age,
    activeRecoveries: [],
    reconciliatoryCount: 0,
    destructiveCount: 0,
    explicitSummaryLines: [],
    opportunityMultiplier: 1,
    riskMultiplier: 1,
    combinedMultiplier: 1,
  };
  if (age < P17_LATER_LIFE_MIN_AGE) return empty;

  const activeRecoveries = resolveActivePreEndgameRecoveries(state, worldId);
  const patterns = getWorldProfile(worldId).preEndgameRecoveryPatterns ?? [];
  const patternById = new Map(patterns.map(p => [p.id, p]));
  const accum = { opportunity: 1, risk: 1 };

  for (const item of activeRecoveries) {
    const pattern = patternById.get(item.patternId);
    if (!pattern) continue;
    applyTagWeights(eventTags, pattern.opportunityTags, item.intensity, accum, 'opportunity');
    applyTagWeights(eventTags, pattern.riskTags, item.intensity, accum, 'risk');
    if (pattern.recoveryKind === 'collapse' || pattern.recoveryKind === 'retribution') {
      accum.risk *= 1 + item.intensity * 0.15;
    }
    if (pattern.recoveryKind === 'reconciliation' || pattern.recoveryKind === 'reward') {
      accum.opportunity *= 1 + item.intensity * 0.12;
    }
  }

  const reconciliatoryCount = activeRecoveries.filter(
    r => r.recoveryKind === 'reconciliation' || r.recoveryKind === 'reward',
  ).length;
  const destructiveCount = activeRecoveries.filter(
    r => r.recoveryKind === 'collapse' || r.recoveryKind === 'retribution',
  ).length;
  const explicitSummaryLines = activeRecoveries
    .filter(r => {
      const p = patternById.get(r.patternId);
      return p?.explicitInSummary && r.summaryLine;
    })
    .map(r => r.summaryLine!);

  const opportunityMultiplier = clampMultiplier(accum.opportunity);
  const riskMultiplier = clampMultiplier(accum.risk);

  return {
    age,
    activeRecoveries,
    reconciliatoryCount,
    destructiveCount,
    explicitSummaryLines,
    opportunityMultiplier,
    riskMultiplier,
    combinedMultiplier: combineSchedulingMultiplier(opportunityMultiplier, riskMultiplier),
  };
}

export function getPreEndgameRecoveryMultiplier(
  state: GameState,
  event: EventDefinition,
  worldId = 'wuxia',
): { multiplier: number; report: PreEndgameRecoveryReport } {
  const age = state.player?.age ?? 0;
  const eventTags = collectEndgameEventTags(event);
  const report = buildPreEndgameRecoveryReport(state, eventTags, age, worldId);
  return { multiplier: report.combinedMultiplier, report };
}

export function getPreEndgameRecoveryMultiplierForTags(
  state: GameState,
  eventTags: Set<string>,
  worldId = 'wuxia',
): { multiplier: number; report: PreEndgameRecoveryReport } {
  const age = state.player?.age ?? 0;
  const report = buildPreEndgameRecoveryReport(state, eventTags, age, worldId);
  return { multiplier: report.combinedMultiplier, report };
}

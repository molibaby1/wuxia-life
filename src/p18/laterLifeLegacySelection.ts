import type { EventDefinition } from '../types/eventTypes';
import type { GameState } from '../types/eventTypes';
import type { ConsequenceTagWeight, LaterLifeLegacyReport } from '../narrative/profile/types';
import { combineSchedulingMultiplier, P17_LATER_LIFE_MIN_AGE } from '../p17/laterLifeSelection';
import { collectUnmetCultivationPressure } from './cultivationPressure';
import {
  resolveActiveInheritanceChannels,
  toResolvedInheritanceChannels,
} from './inheritanceChannels';
import { computeSuccessionQualityScore, resolveActiveLegacyOutcomes } from './legacyOutcomes';
import { resolveActiveCultivationCostPatterns } from './cultivationPressure';
import { resolveActiveSuccessorRoles } from './successorRoles';

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
  if (!weights?.length) {
    return;
  }
  for (const weight of weights) {
    if (!tags.has(weight.tag)) {
      continue;
    }
    const scaled = 1 + (weight.multiplier - 1) * intensity;
    if (channel === 'opportunity') {
      accumulator.opportunity *= scaled;
      continue;
    }
    if (weight.multiplier >= 1) {
      accumulator.risk *= scaled;
    } else {
      accumulator.risk *= 1 - (1 - weight.multiplier) * intensity;
    }
  }
}

export function collectLegacyEventTags(event: EventDefinition): Set<string> {
  const tags = new Set<string>(event.metadata?.tags ?? []);
  if (event.category) {
    tags.add(event.category);
  }
  if (event.storyLine) {
    tags.add(event.storyLine);
  }
  const id = event.id.toLowerCase();
  if (id.includes('legacy') || id.includes('inherit')) tags.add('legacy');
  if (id.includes('disciple') || id.includes('heir') || id.includes('child')) tags.add('family');
  if (id.includes('elderly') || id.includes('retire')) tags.add('continuity');
  if (id.includes('betrayal') || id.includes('collapse')) tags.add('betrayal');
  if (id.includes('feud') || id.includes('vendetta')) tags.add('feud');
  if (id.includes('sect') || id.includes('transmission')) tags.add('training');
  return tags;
}

export function buildLaterLifeLegacyReport(
  state: GameState,
  eventTags: Set<string>,
  age: number,
  worldId = 'wuxia',
): LaterLifeLegacyReport {
  const emptyReport: LaterLifeLegacyReport = {
    age,
    activeSuccessorRoles: [],
    activeInheritanceChannels: [],
    activeCultivationCostPatterns: [],
    activeLegacyOutcomes: [],
    unmetCultivationPressure: [],
    aggregateUnmetPressure: 0,
    successionQualityScore: 0,
    opportunityMultiplier: 1,
    riskMultiplier: 1,
    combinedMultiplier: 1,
  };

  if (age < P17_LATER_LIFE_MIN_AGE) {
    return emptyReport;
  }

  const successorRoles = resolveActiveSuccessorRoles(state, worldId);
  const inheritanceChannels = resolveActiveInheritanceChannels(state, worldId);
  const cultivationCosts = resolveActiveCultivationCostPatterns(state, worldId);
  const legacyOutcomes = resolveActiveLegacyOutcomes(state, worldId);
  const unmetCultivationPressure = collectUnmetCultivationPressure(state, worldId);

  const accum = { opportunity: 1, risk: 1 };

  for (const item of inheritanceChannels) {
    applyTagWeights(eventTags, item.pattern.opportunityTags, item.intensity, accum, 'opportunity');
    applyTagWeights(eventTags, item.pattern.riskTags, item.intensity, accum, 'risk');
    if (item.stabilityPenalty > 0) {
      accum.risk *= 1 + item.stabilityPenalty * 0.5;
    }
  }

  for (const item of cultivationCosts) {
    if (item.aggregatePressure > 0) {
      for (const neglectTag of item.pattern.neglectRiskTags ?? []) {
        if (!eventTags.has(neglectTag.tag)) {
          continue;
        }
        const scaled = 1 + (neglectTag.multiplier - 1) * item.aggregatePressure;
        accum.risk *= scaled;
      }
      accum.opportunity *= 1 - item.aggregatePressure * 0.25;
    }
  }

  for (const item of legacyOutcomes) {
    applyTagWeights(eventTags, item.pattern.opportunityTags, item.intensity, accum, 'opportunity');
    applyTagWeights(eventTags, item.pattern.riskTags, item.intensity, accum, 'risk');
  }

  const successionQualityScore = computeSuccessionQualityScore(state, worldId);
  const hasLegacyEngagement =
    successorRoles.length > 0 ||
    inheritanceChannels.length > 0 ||
    cultivationCosts.length > 0 ||
    legacyOutcomes.length > 0;
  if (hasLegacyEngagement) {
    if (successionQualityScore > 0.7) {
      if (eventTags.has('legacy') || eventTags.has('continuity')) {
        accum.opportunity *= 1 + (successionQualityScore - 0.7) * 0.8;
      }
    } else if (successionQualityScore < 0.35) {
      if (eventTags.has('legacy') || eventTags.has('instability') || eventTags.has('decline')) {
        accum.risk *= 1 + (0.35 - successionQualityScore) * 1.2;
      }
    }
  }

  const opportunityMultiplier = clampMultiplier(accum.opportunity);
  const riskMultiplier = clampMultiplier(accum.risk);
  const combinedMultiplier = combineSchedulingMultiplier(opportunityMultiplier, riskMultiplier);

  const aggregateUnmetPressure =
    unmetCultivationPressure.length === 0
      ? 0
      : unmetCultivationPressure.reduce((sum, item) => sum + item.pressure, 0) /
        unmetCultivationPressure.length;

  return {
    age,
    activeSuccessorRoles: successorRoles.map(item => item.config.id),
    activeInheritanceChannels: toResolvedInheritanceChannels(inheritanceChannels),
    activeCultivationCostPatterns: cultivationCosts.map(item => item.pattern.id),
    activeLegacyOutcomes: legacyOutcomes.map(item => item.pattern.id),
    unmetCultivationPressure,
    aggregateUnmetPressure,
    successionQualityScore,
    opportunityMultiplier,
    riskMultiplier,
    combinedMultiplier,
  };
}

export function getLaterLifeLegacyMultiplier(
  state: GameState,
  event: EventDefinition,
  worldId = 'wuxia',
): { multiplier: number; report: LaterLifeLegacyReport } {
  const age = state.player?.age ?? 0;
  const eventTags = collectLegacyEventTags(event);
  const report = buildLaterLifeLegacyReport(state, eventTags, age, worldId);
  return { multiplier: report.combinedMultiplier, report };
}

export function getLaterLifeLegacyMultiplierForTags(
  state: GameState,
  eventTags: Set<string>,
  worldId = 'wuxia',
): { multiplier: number; report: LaterLifeLegacyReport } {
  const age = state.player?.age ?? 0;
  const report = buildLaterLifeLegacyReport(state, eventTags, age, worldId);
  return { multiplier: report.combinedMultiplier, report };
}

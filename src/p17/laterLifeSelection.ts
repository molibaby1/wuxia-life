import type { EventDefinition } from '../types/eventTypes';
import type { GameState } from '../types/eventTypes';
import type { LaterLifeConsequenceReport } from '../narrative/profile/types';
import type { ConsequenceTagWeight } from '../narrative/profile/types';
import { collectUnmetMaintenancePressure, resolveActiveAchievementMaintenance } from './achievementMaintenance';
import { resolveActiveFactionConsequences, toResolvedFactionPatterns } from './factionConsequences';
import {
  resolveActiveRelationshipConsequences,
  toResolvedRelationshipPatterns,
} from './relationshipConsequences';

export const P17_LATER_LIFE_MIN_AGE = 25;

function clampMultiplier(value: number): number {
  return Math.max(0.35, Math.min(3.5, value));
}

/**
 * Merge opportunity and risk channels for one event's tag set.
 * - Risk dampening (multiplier < 1) always compounds with opportunity so shielding works.
 * - When both channels escalate weight, use the dominant channel to preserve route/persona divergence.
 */
export function combineSchedulingMultiplier(opportunity: number, risk: number): number {
  if (risk < 1) {
    return clampMultiplier(opportunity * risk);
  }
  if (risk > 1 && opportunity > 1) {
    return clampMultiplier(Math.max(opportunity, risk));
  }
  if (risk > 1) {
    return clampMultiplier(risk);
  }
  return clampMultiplier(opportunity);
}

export function collectEventTags(event: EventDefinition): Set<string> {
  const tags = new Set<string>(event.metadata?.tags ?? []);
  if (event.category) {
    tags.add(event.category);
  }
  if (event.storyLine) {
    tags.add(event.storyLine);
  }
  const id = event.id.toLowerCase();
  if (id.includes('relationship')) tags.add('relationship');
  if (id.includes('sect') || id.includes('faction') || id.includes('orthodox')) tags.add('faction');
  if (id.includes('sect')) tags.add('sect');
  if (id.includes('family') || id.includes('marriage') || id.includes('child')) tags.add('family');
  if (id.includes('hero') || id.includes('reputation')) tags.add('prestige');
  if (id.includes('conflict') || id.includes('enemy') || id.includes('revenge')) tags.add('conflict');
  if (id.includes('official') || id.includes('court')) tags.add('official');
  if (id.includes('debt') || id.includes('gray')) tags.add('duty');
  if (id.includes('backlash') || id.includes('decline')) tags.add('decline');
  return tags;
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

export function buildLaterLifeConsequenceReport(
  state: GameState,
  eventTags: Set<string>,
  age: number,
  worldId = 'wuxia',
): LaterLifeConsequenceReport {
  const emptyReport: LaterLifeConsequenceReport = {
    age,
    activeRelationshipPatterns: [],
    activeFactionPatterns: [],
    activeMaintenancePatterns: [],
    unmetMaintenance: [],
    aggregateUnmetPressure: 0,
    opportunityMultiplier: 1,
    riskMultiplier: 1,
    combinedMultiplier: 1,
  };

  if (age < P17_LATER_LIFE_MIN_AGE) {
    return emptyReport;
  }

  const relationshipActive = resolveActiveRelationshipConsequences(state, worldId);
  const factionActive = resolveActiveFactionConsequences(state, worldId);
  const maintenanceActive = resolveActiveAchievementMaintenance(state, worldId);
  const unmetMaintenance = collectUnmetMaintenancePressure(state, worldId);

  const accum = { opportunity: 1, risk: 1 };

  for (const item of relationshipActive) {
    applyTagWeights(eventTags, item.pattern.opportunityTags, item.intensity, accum, 'opportunity');
    applyTagWeights(eventTags, item.pattern.riskTags, item.intensity, accum, 'risk');
  }

  for (const item of factionActive) {
    applyTagWeights(eventTags, item.pattern.opportunityTags, item.intensity, accum, 'opportunity');
    applyTagWeights(eventTags, item.pattern.riskTags, item.intensity, accum, 'risk');
  }

  for (const item of maintenanceActive) {
    applyTagWeights(
      eventTags,
      item.pattern.opportunityTags,
      1 - item.aggregatePressure * 0.5,
      accum,
      'opportunity',
    );
    if (item.aggregatePressure > 0) {
      for (const neglectTag of item.pattern.neglectRiskTags ?? []) {
        if (!eventTags.has(neglectTag.tag)) {
          continue;
        }
        const scaled = 1 + (neglectTag.multiplier - 1) * item.aggregatePressure;
        accum.risk *= scaled;
      }
    }
  }

  const opportunityMultiplier = clampMultiplier(accum.opportunity);
  const riskMultiplier = clampMultiplier(accum.risk);
  const combinedMultiplier = combineSchedulingMultiplier(opportunityMultiplier, riskMultiplier);

  const aggregateUnmetPressure =
    unmetMaintenance.length === 0
      ? 0
      : unmetMaintenance.reduce((sum, item) => sum + item.pressure, 0) / unmetMaintenance.length;

  return {
    age,
    activeRelationshipPatterns: toResolvedRelationshipPatterns(relationshipActive),
    activeFactionPatterns: toResolvedFactionPatterns(factionActive),
    activeMaintenancePatterns: maintenanceActive.map(item => item.pattern.id),
    unmetMaintenance,
    aggregateUnmetPressure,
    opportunityMultiplier,
    riskMultiplier,
    combinedMultiplier,
  };
}

export function getLaterLifeConsequenceMultiplier(
  state: GameState,
  event: EventDefinition,
  worldId = 'wuxia',
): { multiplier: number; report: LaterLifeConsequenceReport } {
  const age = state.player?.age ?? 0;
  const eventTags = collectEventTags(event);
  const report = buildLaterLifeConsequenceReport(state, eventTags, age, worldId);
  return { multiplier: report.combinedMultiplier, report };
}

export function getLaterLifeConsequenceMultiplierForTags(
  state: GameState,
  eventTags: Set<string>,
  worldId = 'wuxia',
): { multiplier: number; report: LaterLifeConsequenceReport } {
  const age = state.player?.age ?? 0;
  const report = buildLaterLifeConsequenceReport(state, eventTags, age, worldId);
  return { multiplier: report.combinedMultiplier, report };
}

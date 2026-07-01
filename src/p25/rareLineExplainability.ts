import { traitSystem } from '../core/TraitSystem';
import {
  computeRareLineProbability,
  deriveRareLineRollResultsFromFlags,
  getRareLineOpportunityMultiplier,
} from '../p16/rareEventLines';
import { getWorldProfile } from '../narrative/worldProfile';
import type { EventDefinition, PlayerState } from '../types/eventTypes';

export interface RareLineExplainRecord {
  lineId: string;
  label: string;
  triggered: boolean;
  reason: string;
  opportunityTags: string[];
  weightMultiplierForEvent?: number;
}

export interface RareLineSchedulingExplainReport {
  layer: 'runtime';
  surface: 'GameEngineIntegration.pickWeightedFormalEvent';
  records: RareLineExplainRecord[];
  eventTagMultiplier?: number;
}

function explainMissedLine(
  lineId: string,
  label: string,
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
  worldId: string,
): RareLineExplainRecord {
  const profile = getWorldProfile(worldId);
  const line = profile.rareEventLines?.find(entry => entry.id === lineId);
  if (!line) {
    return { lineId, label, triggered: false, reason: 'line config missing', opportunityTags: [] };
  }
  const prob = computeRareLineProbability(line, player, flags);
  if (prob <= 0) {
    const age = player?.age ?? 0;
    const origin = player?.traitProfile?.origin;
    if (line.originConditions?.length && (!origin || !line.originConditions.includes(origin))) {
      return {
        lineId,
        label,
        triggered: false,
        reason: `origin ${origin ?? 'none'} not in ${line.originConditions.join(',')}`,
        opportunityTags: line.altersOpportunityTags ?? [],
      };
    }
    if (line.stageConditions?.minAge !== undefined && age < line.stageConditions.minAge) {
      return {
        lineId,
        label,
        triggered: false,
        reason: `age ${age} < minAge ${line.stageConditions.minAge}`,
        opportunityTags: line.altersOpportunityTags ?? [],
      };
    }
    if (line.stageConditions?.maxAge !== undefined && age > line.stageConditions.maxAge) {
      return {
        lineId,
        label,
        triggered: false,
        reason: `age ${age} > maxAge ${line.stageConditions.maxAge}`,
        opportunityTags: line.altersOpportunityTags ?? [],
      };
    }
    const missingPrior = (line.priorChoiceFlags ?? []).filter(flag => !flags[flag]);
    if (missingPrior.length > 0) {
      return {
        lineId,
        label,
        triggered: false,
        reason: `missing prior flags: ${missingPrior.join(',')}`,
        opportunityTags: line.altersOpportunityTags ?? [],
      };
    }
    return {
      lineId,
      label,
      triggered: false,
      reason: 'checkpoint roll missed (probability)',
      opportunityTags: line.altersOpportunityTags ?? [],
    };
  }
  const rolled = deriveRareLineRollResultsFromFlags(flags, worldId).find(r => r.lineId === lineId);
  if (rolled?.triggered) {
    return {
      lineId,
      label,
      triggered: true,
      reason: `flags: ${(line.unlocksFlags ?? []).join(',')}`,
      opportunityTags: line.altersOpportunityTags ?? [],
    };
  }
  return {
    lineId,
    label,
    triggered: false,
    reason: `eligible p=${prob} but flag not set (missed window at checkpoint)`,
    opportunityTags: line.altersOpportunityTags ?? [],
  };
}

export function buildRareLineExplainReport(
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
  event?: EventDefinition,
  worldId = 'wuxia',
): RareLineSchedulingExplainReport {
  const rollResults = deriveRareLineRollResultsFromFlags(flags, worldId);
  const records = (getWorldProfile(worldId).rareEventLines ?? []).map(line =>
    rollResults.find(r => r.lineId === line.id)?.triggered
      ? {
          lineId: line.id,
          label: line.label,
          triggered: true,
          reason: `unlocks ${(line.unlocksFlags ?? []).join(',')}`,
          opportunityTags: line.altersOpportunityTags ?? [],
        }
      : explainMissedLine(line.id, line.label, player, flags, worldId),
  );

  let eventTagMultiplier: number | undefined;
  if (event) {
    const tags = traitSystem.getEventBiasTags(event);
    eventTagMultiplier = getRareLineOpportunityMultiplier(rollResults, tags);
    for (const record of records) {
      if (record.triggered) {
        const overlap = record.opportunityTags.filter(tag => tags.has(tag as never));
        if (overlap.length > 0) {
          record.weightMultiplierForEvent = eventTagMultiplier;
        }
      }
    }
  }

  return {
    layer: 'runtime',
    surface: 'GameEngineIntegration.pickWeightedFormalEvent',
    records,
    eventTagMultiplier,
  };
}

export function formatRareLineExplainReport(report: RareLineSchedulingExplainReport): string[] {
  return report.records.map(
    r =>
      `${r.lineId}: ${r.triggered ? 'TRIGGERED' : 'MISSED'} — ${r.reason}` +
      (r.weightMultiplierForEvent ? ` (event weight ×${r.weightMultiplierForEvent})` : ''),
  );
}

import type { StagePacingSnapshot, WholeLifePacingReport } from '../narrative/profile/types';
import { getProfileStageForAge } from '../narrative/worldProfile';
import { getWorldProfile } from '../narrative/worldProfile';
import type { EventDefinition } from '../types/eventTypes';
import type { GameState } from '../types/eventTypes';
import { selectArchetypeFamily } from './archetypeCoverage';
import { getPlayerAge } from './stateAccess';

function getStageSnapshot(
  stageId: string,
  profileId: string,
  worldId = 'wuxia',
): StagePacingSnapshot | null {
  const pacingProfile = getWorldProfile(worldId).archetypePacingProfiles?.find(
    entry => entry.archetypeFamilyId === profileId,
  );
  const stageProfile = pacingProfile?.stageProfiles.find(entry => entry.stageId === stageId);
  if (!stageProfile || !pacingProfile) {
    return null;
  }
  return {
    stageId,
    densityMultiplier: stageProfile.densityMultiplier,
    routePressureOffsetYears: stageProfile.routePressureOffsetYears,
    payoffSpacingMultiplier: stageProfile.payoffSpacingMultiplier,
    callbackCadenceYears: stageProfile.callbackCadenceYears,
    effectiveDensity: stageProfile.densityMultiplier,
  };
}

export function buildWholeLifePacingReport(
  state: GameState,
  worldId = 'wuxia',
): WholeLifePacingReport {
  const age = getPlayerAge(state);
  const family = selectArchetypeFamily(state, worldId);
  const pacingProfile = getWorldProfile(worldId).archetypePacingProfiles?.find(
    entry => entry.archetypeFamilyId === family.familyId,
  );
  const currentStage = getProfileStageForAge(age);
  const currentStageId = currentStage?.id ?? 'stage_0_10';
  const stageSnapshots =
    pacingProfile?.stageProfiles.map(stage => ({
      stageId: stage.stageId,
      densityMultiplier: stage.densityMultiplier,
      routePressureOffsetYears: stage.routePressureOffsetYears,
      payoffSpacingMultiplier: stage.payoffSpacingMultiplier,
      callbackCadenceYears: stage.callbackCadenceYears,
      effectiveDensity: stage.densityMultiplier,
    })) ?? [];

  const currentSnapshot = stageSnapshots.find(entry => entry.stageId === currentStageId);
  const pacingMultiplier = currentSnapshot?.densityMultiplier ?? 1;

  const comparisonLines = [
    `archetype=${family.label} stage=${currentStageId} density=${pacingMultiplier.toFixed(2)}`,
    `route_offset=${currentSnapshot?.routePressureOffsetYears ?? 0}y payoff_spacing=${currentSnapshot?.payoffSpacingMultiplier?.toFixed(2) ?? '1.00'}`,
    `callback_cadence=${currentSnapshot?.callbackCadenceYears ?? 4}y closure=${pacingProfile?.endgameClosureRhythm ?? 'standard'}`,
  ];

  return {
    age,
    archetypeFamilyId: family.familyId,
    currentStageId,
    stageSnapshots,
    endgameClosureRhythm: pacingProfile?.endgameClosureRhythm ?? 'standard',
    pacingMultiplier,
    comparisonLines,
  };
}

export function getWholeLifePacingMultiplier(
  state: GameState,
  event: EventDefinition,
  worldId = 'wuxia',
): number {
  const report = buildWholeLifePacingReport(state, worldId);
  const snapshot = report.stageSnapshots.find(entry => entry.stageId === report.currentStageId);
  if (!snapshot) {
    return 1;
  }

  let multiplier = snapshot.densityMultiplier;
  const tags = new Set<string>(event.metadata?.tags ?? []);
  if (event.category) {
    tags.add(event.category);
  }

  if (tags.has('payoff') || tags.has('achievement') || tags.has('milestone')) {
    multiplier *= 2 - snapshot.payoffSpacingMultiplier;
  }
  if (tags.has('callback') || tags.has('echo')) {
    multiplier *= snapshot.callbackCadenceYears <= 3 ? 1.1 : 0.95;
  }

  if (report.age >= 55) {
    switch (report.endgameClosureRhythm) {
      case 'early':
        multiplier *= 1.15;
        break;
      case 'delayed':
        multiplier *= 0.9;
        break;
      case 'fragmented':
        multiplier *= 1.05;
        break;
      default:
        break;
    }
  }

  return Math.max(0.35, Math.min(3.5, multiplier));
}

export function formatPacingComparisonMarkdown(
  baseline: WholeLifePacingReport,
  tuned: WholeLifePacingReport,
): string {
  const lines = [
    '# P20 Pacing Comparison',
    '',
    `| Metric | Baseline (${baseline.archetypeFamilyId}) | Tuned (${tuned.archetypeFamilyId}) |`,
    '| --- | --- | --- |',
    `| Stage | ${baseline.currentStageId} | ${tuned.currentStageId} |`,
    `| Density | ${baseline.pacingMultiplier.toFixed(2)} | ${tuned.pacingMultiplier.toFixed(2)} |`,
    `| Closure rhythm | ${baseline.endgameClosureRhythm} | ${tuned.endgameClosureRhythm} |`,
  ];
  return lines.join('\n');
}

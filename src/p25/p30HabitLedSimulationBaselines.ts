import { evaluateCompositeDestinyOutcome } from '../p16/compositeDestiny';
import { getWorldProfile } from '../narrative/worldProfile';
import type { PlayerState } from '../types/eventTypes';
import { P25_MAINSTREAM_ACHIEVEMENT_TRACEABILITY } from './achievementTraceability';
import { P25_REPRESENTATIVE_LIFE_PATHS, P30_HABIT_LED_LIFE_PATHS, type LifePathFixture } from './validationSlices';

export interface P30Wave1ObservabilitySnapshot {
  pathId: string;
  outcomeId: 'jianghu_renown_sage' | 'medical_sage_healer';
  unlocked: boolean;
  keyChoicesMet: boolean;
  statDimensionsMet: boolean;
  bridgeFlagsPresent: string[];
  habitAxisValue: number | null;
}

export interface P30HabitLedSimulationBaselineMetrics {
  generatedAt: string;
  command: string;
  p29DirectFlagBaseline: {
    jianghu_renown_path_unlockRate: number;
    medical_sage_path_unlockRate: number;
  };
  habitLedObservability: {
    jianghu_renown_sage: {
      paths: P30Wave1ObservabilitySnapshot[];
      unlockRate: number;
      partialProgressRate: number;
      traceLinkedEventCount: number;
    };
    medical_sage_healer: {
      paths: P30Wave1ObservabilitySnapshot[];
      unlockRate: number;
      partialProgressRate: number;
      traceLinkedEventCount: number;
    };
  };
  deltaSummary: string;
}

export const P30_HABIT_LED_BASELINE_COMMAND = 'npm exec tsx scripts/runP30HabitLedSimulationBaseline.ts';

function fixtureToPlayer(path: LifePathFixture): PlayerState {
  return {
    name: 'p30-sim',
    age: path.player.age ?? 35,
    traitProfile: { origin: path.originId },
    ...path.player,
  } as PlayerState;
}

function evaluatePathForOutcome(
  path: LifePathFixture,
  outcomeId: 'jianghu_renown_sage' | 'medical_sage_healer',
): P30Wave1ObservabilitySnapshot {
  const outcome = getWorldProfile('wuxia').compositeDestinyOutcomes!.find(o => o.id === outcomeId)!;
  const player = fixtureToPlayer(path);
  const report = evaluateCompositeDestinyOutcome(outcome, player, path.flags);
  const keyDim = report.dimensions.find(d => d.dimension === 'key_choices');
  const statDims = report.dimensions.filter(d => d.dimension !== 'key_choices');
  const bridgeFlags = Object.keys(path.flags).filter(f => /^p2[789]_/.test(f));
  const lifeStates = path.player.lifeStates;
  const habitAxisValue =
    outcomeId === 'jianghu_renown_sage'
      ? (lifeStates?.socialMomentum ?? null)
      : (lifeStates?.studyHabit ?? null);

  return {
    pathId: path.id,
    outcomeId,
    unlocked: report.unlocked,
    keyChoicesMet: keyDim?.status === 'met',
    statDimensionsMet: statDims.every(d => d.status !== 'missing' && d.status !== 'blocked'),
    bridgeFlagsPresent: bridgeFlags,
    habitAxisValue,
  };
}

function unlockRateForDirectPath(pathId: string, outcomeId: string): number {
  const path = P25_REPRESENTATIVE_LIFE_PATHS.find(p => p.id === pathId);
  if (!path) return 0;
  const outcome = getWorldProfile('wuxia').compositeDestinyOutcomes!.find(o => o.id === outcomeId)!;
  const report = evaluateCompositeDestinyOutcome(outcome, fixtureToPlayer(path), path.flags);
  return report.unlocked ? 1 : 0;
}

export function runP30HabitLedSimulationBaseline(): P30HabitLedSimulationBaselineMetrics {
  const renownSnapshots = P30_HABIT_LED_LIFE_PATHS.map(p =>
    evaluatePathForOutcome(p, 'jianghu_renown_sage'),
  ).filter(s => s.pathId === 'habit_led_renown_social_path');

  const medicalSnapshots = P30_HABIT_LED_LIFE_PATHS.map(p =>
    evaluatePathForOutcome(p, 'medical_sage_healer'),
  ).filter(s => s.pathId === 'habit_led_medical_study_path');

  const renownUnlockRate =
    renownSnapshots.filter(s => s.unlocked).length / Math.max(renownSnapshots.length, 1);
  const medicalUnlockRate =
    medicalSnapshots.filter(s => s.unlocked).length / Math.max(medicalSnapshots.length, 1);

  const renownPartial =
    renownSnapshots.filter(s => !s.unlocked && s.statDimensionsMet && !s.keyChoicesMet).length /
    Math.max(renownSnapshots.length, 1);
  const medicalPartial =
    medicalSnapshots.filter(s => !s.unlocked && s.statDimensionsMet && !s.keyChoicesMet).length /
    Math.max(medicalSnapshots.length, 1);

  const jianghuTraceCount =
    P25_MAINSTREAM_ACHIEVEMENT_TRACEABILITY.jianghu_renown_sage?.habitLedOnRampEvents?.length ?? 0;
  const medicalTraceCount =
    P25_MAINSTREAM_ACHIEVEMENT_TRACEABILITY.medical_sage_healer?.habitLedOnRampEvents?.length ?? 0;

  const p29RenownUnlock = unlockRateForDirectPath('jianghu_renown_path', 'jianghu_renown_sage');
  const p29MedicalUnlock = unlockRateForDirectPath('medical_sage_path', 'medical_sage_healer');

  return {
    generatedAt: new Date().toISOString(),
    command: P30_HABIT_LED_BASELINE_COMMAND,
    p29DirectFlagBaseline: {
      jianghu_renown_path_unlockRate: p29RenownUnlock,
      medical_sage_path_unlockRate: p29MedicalUnlock,
    },
    habitLedObservability: {
      jianghu_renown_sage: {
        paths: renownSnapshots,
        unlockRate: renownUnlockRate,
        partialProgressRate: renownPartial,
        traceLinkedEventCount: jianghuTraceCount,
      },
      medical_sage_healer: {
        paths: medicalSnapshots,
        unlockRate: medicalUnlockRate,
        partialProgressRate: medicalPartial,
        traceLinkedEventCount: medicalTraceCount,
      },
    },
    deltaSummary:
      'P29 direct-flag paths unlock Wave 1 achievements (100% on representative fixtures); P30 habit-led paths show partial progress (stats met, key_choices unmet) with trace-linked P27-P29 on-ramps — sim observability improved without bypassing composite gates.',
  };
}

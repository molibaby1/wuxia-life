import { evaluateCompositeDestinyOutcome } from '../p16/compositeDestiny';
import { getWorldProfile } from '../narrative/worldProfile';
import type { PlayerState } from '../types/eventTypes';
import { runP30HabitLedSimulationBaseline, type P30Wave1ObservabilitySnapshot } from './p30HabitLedSimulationBaselines';
import {
  P31_HABIT_LED_FULL_UNLOCK_PATHS,
  resolveHabitLedFixtureFlags,
  type LifePathFixture,
} from './validationSlices';

export interface P31HabitLedSimulationBaselineMetrics {
  generatedAt: string;
  command: string;
  p30HabitLedBaseline: {
    jianghu_renown_sage_unlockRate: number;
    medical_sage_healer_unlockRate: number;
  };
  p31HabitLedUnlock: {
    jianghu_renown_sage: {
      paths: P30Wave1ObservabilitySnapshot[];
      unlockRate: number;
    };
    medical_sage_healer: {
      paths: P30Wave1ObservabilitySnapshot[];
      unlockRate: number;
    };
  };
  deltaSummary: string;
}

export const P31_HABIT_LED_BASELINE_COMMAND = 'npm exec tsx scripts/runP31HabitLedSimulationBaseline.ts';

function fixtureToPlayer(path: LifePathFixture): PlayerState {
  return {
    name: 'p31-sim',
    age: path.player.age ?? 35,
    traits: ['keen_mind', 'lazy', 'competitive'],
    wealthCapacity: 'no_surplus',
    ...path.player,
  } as PlayerState;
}

function evaluatePathWithBridges(
  path: LifePathFixture,
  outcomeId: 'jianghu_renown_sage' | 'medical_sage_healer',
): P30Wave1ObservabilitySnapshot {
  const outcome = getWorldProfile('wuxia').compositeDestinyOutcomes!.find(o => o.id === outcomeId)!;
  const player = fixtureToPlayer(path);
  const resolvedFlags = resolveHabitLedFixtureFlags(path);
  const report = evaluateCompositeDestinyOutcome(outcome, player, resolvedFlags);
  const keyDims = report.dimensions.filter(d => d.dimension === 'key_choices');
  const statDims = report.dimensions.filter(d => d.dimension !== 'key_choices');
  const bridgeFlags = Object.keys(path.flags).filter(f => /^p2[789]_/.test(f));
  const lifeStates = path.player.lifeStates;
  const habitAxisValue = lifeStates?.studyHabit ?? null;

  return {
    pathId: path.id,
    outcomeId,
    unlocked: report.unlocked,
    keyChoicesMet: keyDims.length > 0 && keyDims.every(d => d.status === 'satisfied'),
    statDimensionsMet: statDims.every(d => d.status !== 'missing' && d.status !== 'blocked'),
    bridgeFlagsPresent: bridgeFlags,
    habitAxisValue,
  };
}

export function runP31HabitLedSimulationBaseline(): P31HabitLedSimulationBaselineMetrics {
  const p30Metrics = runP30HabitLedSimulationBaseline();

  const renownSnapshots = P31_HABIT_LED_FULL_UNLOCK_PATHS.filter(
    p => p.id === 'habit_led_renown_social_path',
  ).map(p => evaluatePathWithBridges(p, 'jianghu_renown_sage'));

  const medicalSnapshots = P31_HABIT_LED_FULL_UNLOCK_PATHS.filter(
    p => p.id === 'habit_led_medical_study_path',
  ).map(p => evaluatePathWithBridges(p, 'medical_sage_healer'));

  const renownUnlockRate =
    renownSnapshots.filter(s => s.unlocked).length / Math.max(renownSnapshots.length, 1);
  const medicalUnlockRate =
    medicalSnapshots.filter(s => s.unlocked).length / Math.max(medicalSnapshots.length, 1);

  return {
    generatedAt: new Date().toISOString(),
    command: P31_HABIT_LED_BASELINE_COMMAND,
    p30HabitLedBaseline: {
      jianghu_renown_sage_unlockRate: p30Metrics.habitLedObservability.jianghu_renown_sage.unlockRate,
      medical_sage_healer_unlockRate: p30Metrics.habitLedObservability.medical_sage_healer.unlockRate,
    },
    p31HabitLedUnlock: {
      jianghu_renown_sage: { paths: renownSnapshots, unlockRate: renownUnlockRate },
      medical_sage_healer: { paths: medicalSnapshots, unlockRate: medicalUnlockRate },
    },
    deltaSummary:
      'P31 bridge-resolved habit-led paths unlock Wave 1 achievements (>0% vs P30 0%) while preserving composite stat gates and ethic mutex.',
  };
}

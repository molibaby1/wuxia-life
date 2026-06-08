/**
 * P11 normalized narrative signal vocabulary.
 *
 * Stage signals map 1:1 to stageConfig.feedbackExpectation.expectedSignals for ages 0–40.
 * Route coverage kinds mirror routeDefinitions entry / reinforcement / divergence / identity.
 *
 * Scheduling and reports MUST use these keys — do not invent parallel aliases.
 */
import type { RouteCoverageKind, StageSignalKey } from './types';

export const STAGE_SIGNAL_KEYS: readonly StageSignalKey[] = [
  'origin',
  'childhood_choice',
  'early_active_action',
  'route_entry',
  'training_milestone',
  'first_turning_point',
  'route_reinforcement',
  'identity_signal',
  'relationship_shift',
  'route_divergence',
  'achievement',
  'age40_identity',
] as const;

export const ROUTE_COVERAGE_KINDS: readonly RouteCoverageKind[] = [
  'entry',
  'reinforcement',
  'divergence',
  'identity',
] as const;

export function isStageSignalKey(value: string): value is StageSignalKey {
  return (STAGE_SIGNAL_KEYS as readonly string[]).includes(value);
}

export function parseAgeBand(band: string): { min: number; max: number } {
  const [minRaw, maxRaw] = band.split('-').map(part => Number(part.trim()));
  return { min: minRaw, max: maxRaw ?? minRaw };
}

export function ageInBand(age: number, band: string): boolean {
  const { min, max } = parseAgeBand(band);
  return age >= min && age <= max;
}

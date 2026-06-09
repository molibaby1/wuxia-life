import { EventLoader } from '../core/EventLoader';
import type { LlmTuningValidationResult } from '../narrative/profile/types';
import { P20_SCHOLAR_STATESMAN } from '../narrative/profile/wuxiaReplayabilitySurfaces';
import { getWorldProfile } from '../narrative/worldProfile';
import {
  fieldPathAllowed,
  getTuningSamples,
  validateLlmTuningInputs,
  type LlmTuningDraftInput,
} from './llmTuningContract';

const TUNING_VALUE_BOUNDS: Record<string, { min: number; max: number }> = {
  pathAffinity: { min: 0, max: 1.5 },
  weight: { min: 1, max: 100 },
  baseWeight: { min: 0.5, max: 2 },
  densityMultiplier: { min: 0.5, max: 1.5 },
  payoffSpacingMultiplier: { min: 0.5, max: 2 },
  exactRepeatSuppression: { min: 0, max: 1 },
};

export function validateTuningOutput(
  input: LlmTuningDraftInput,
  proposedValue: number,
): LlmTuningValidationResult {
  const profile = getWorldProfile();
  const inputCheck = validateLlmTuningInputs(input, profile);
  const allowed = fieldPathAllowed(input.targetFieldPath, profile);
  const leaf = input.targetFieldPath.split('.').pop() ?? '';
  const bounds = TUNING_VALUE_BOUNDS[leaf];
  const withinBounds = bounds ? proposedValue >= bounds.min && proposedValue <= bounds.max : true;
  const samples = getTuningSamples(profile);
  const matchingSample = samples.find(s => s.targetFieldPath === input.targetFieldPath);
  const measurableDelta = matchingSample
    ? Math.abs(matchingSample.tunedValue - matchingSample.baselineValue) > 0
    : Math.abs(proposedValue - 1) > 0.01;

  const valid = inputCheck.valid && allowed && withinBounds;
  let decision: LlmTuningValidationResult['decision'] = valid ? 'pass' : 'fail';
  if (valid && !measurableDelta) decision = 'warning';

  return {
    valid,
    tuningClass: input.tuningClass,
    fieldPath: input.targetFieldPath,
    withinBounds,
    measurableDelta,
    detail: valid
      ? `Tuning ${input.targetFieldPath}=${proposedValue} within bounds`
      : `Invalid tuning: allowed=${allowed} bounds=${withinBounds} missing=${inputCheck.missing.join(',')}`,
    decision,
  };
}

/** Detect off-target tuning (e.g. scholar weight decrease when delta expects increase). */
export function detectOffTargetTuning(
  sampleId: string,
  actualValue: number,
): boolean {
  const samples = getTuningSamples();
  const sample = samples.find(s => s.id === sampleId);
  if (!sample) return true;
  if (sample.expectedDelta === 'increase') return actualValue < sample.baselineValue;
  if (sample.expectedDelta === 'tighten_spacing') return actualValue > sample.baselineValue;
  return false;
}

export function getScholarTuningEvidence(): {
  baseWeight: number;
  payoffSpacingStage2030: number;
  pathAffinityTuned: number;
} {
  const profile = getWorldProfile();
  const scholarFamily = profile.archetypeFamilyConfigs?.find(f => f.id === P20_SCHOLAR_STATESMAN.id);
  const scholarPacing = profile.archetypePacingProfiles?.find(
    p => p.archetypeFamilyId === P20_SCHOLAR_STATESMAN.id,
  );
  const stage2030 = scholarPacing?.stageProfiles.find(s => s.stageId === 'stage_20_30');
  const routeSample = profile.tuningSampleConfigs?.find(s => s.id === 'p21_tune_route_scholar_distribution');
  const routeEvent = EventLoader.getInstance().getEventById('p21_scholar_route_reinforcement');
  return {
    baseWeight: scholarFamily?.baseWeight ?? 1,
    payoffSpacingStage2030: stage2030?.payoffSpacingMultiplier ?? 1,
    pathAffinityTuned: routeEvent?.metadata?.pathAffinity?.scholarly ?? routeSample?.tunedValue ?? 1,
  };
}

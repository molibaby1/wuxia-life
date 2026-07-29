import type { EventDefinition } from '../types/eventTypes';
import { eventCoversMissingStageSignal } from './signalDetection';
import type { NarrativeSchedulingContext } from './types';

const STAGE_BIAS_MULTIPLIER = 2.2;

export function getStageSchedulingMultiplier(
  event: EventDefinition,
  context: NarrativeSchedulingContext,
): number {
  if (context.missingStageSignals.length === 0) {
    return 1;
  }
  if (!eventCoversMissingStageSignal(event, context.missingStageSignals)) {
    return 1;
  }
  return STAGE_BIAS_MULTIPLIER;
}

export function getNarrativeSchedulingMultiplier(
  event: EventDefinition,
  context: NarrativeSchedulingContext,
): number {
  return getStageSchedulingMultiplier(event, context);
}

export function describeSchedulingBias(
  event: EventDefinition,
  context: NarrativeSchedulingContext,
): string[] {
  const reasons: string[] = [];
  if (eventCoversMissingStageSignal(event, context.missingStageSignals)) {
    reasons.push(`stage-missing:${context.missingStageSignals.join(',')}`);
  }
  return reasons;
}

export {
  STAGE_BIAS_MULTIPLIER,
};

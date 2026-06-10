import type {
  RcBiasDirection,
  RcEvaluationSchemaConfig,
  RcReleaseReadiness,
} from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';

export interface RcEvaluationInput {
  buildId: string;
  candidateLabel: string;
  internalHealthScore: number;
  externalAppealScore: number;
}

export interface RcEvaluationOutput {
  buildId: string;
  candidateLabel: string;
  internalHealthScore: number;
  externalAppealScore: number;
  alignmentGap: number;
  biasDirection: RcBiasDirection;
  releaseReadiness: RcReleaseReadiness;
  blockers: string;
  strengths: string;
  deferredItems: string;
}

export function evaluateRcCandidate(
  input: RcEvaluationInput,
  schema: RcEvaluationSchemaConfig = getWorldProfile().rcEvaluationSchema!,
): RcEvaluationOutput {
  const alignmentGap = input.internalHealthScore - input.externalAppealScore;
  let biasDirection: RcBiasDirection = 'aligned';
  if (alignmentGap > schema.releaseReadinessThresholds.maxAlignmentGap) {
    biasDirection = 'overestimate';
  } else if (alignmentGap < -schema.releaseReadinessThresholds.maxAlignmentGap) {
    biasDirection = 'underestimate';
  }

  const { minInternalHealth, minExternalAppeal, maxAlignmentGap } =
    schema.releaseReadinessThresholds;

  let releaseReadiness: RcReleaseReadiness = 'ship';
  const blockers: string[] = [];
  const strengths: string[] = [];

  if (input.internalHealthScore < minInternalHealth) {
    blockers.push('Internal health below RC threshold');
    releaseReadiness = 'hold';
  }
  if (input.externalAppealScore < minExternalAppeal) {
    blockers.push('External appeal below RC threshold');
    releaseReadiness = releaseReadiness === 'ship' ? 'redirect' : 'hold';
  }
  if (Math.abs(alignmentGap) > maxAlignmentGap) {
    blockers.push(`Alignment gap ${alignmentGap.toFixed(2)} exceeds ${maxAlignmentGap}`);
    if (biasDirection === 'overestimate') {
      releaseReadiness = 'redirect';
    } else {
      releaseReadiness = releaseReadiness === 'ship' ? 'hold' : releaseReadiness;
    }
  }

  if (input.internalHealthScore >= minInternalHealth) {
    strengths.push('Internal gates healthy');
  }
  if (input.externalAppealScore >= minExternalAppeal) {
    strengths.push('External appeal meets threshold');
  }
  if (biasDirection === 'aligned') {
    strengths.push('Internal and external signals aligned');
  }

  return {
    buildId: input.buildId,
    candidateLabel: input.candidateLabel,
    internalHealthScore: input.internalHealthScore,
    externalAppealScore: input.externalAppealScore,
    alignmentGap,
    biasDirection,
    releaseReadiness,
    blockers: blockers.join('; ') || 'none',
    strengths: strengths.join('; ') || 'none',
    deferredItems: 'none',
  };
}

import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { EventLoader } from '../../../src/core/EventLoader';
import { canonicalJson } from '../phase0/provenance';
import {
  BOUNDED_FORMAL_EVENT_AUTHORING_SAFE_PROJECTION_V1,
  BOUNDED_FORMAL_EVENT_HABIT_PRECEDENTS,
} from '../../../src/evolution/boundedFormalEventAuthoringContract';
import { HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT } from '../../../src/evolution/boundedFormalEventReferenceRequirement';
import { readBoundedFormalEventPredicateEvidence } from './evaluateBoundedFormalEventAdmission';

export interface BoundedFormalEventParticipantEvidenceV1 {
  contract: typeof BOUNDED_FORMAL_EVENT_AUTHORING_SAFE_PROJECTION_V1;
  predicateEvidence: Awaited<ReturnType<typeof readBoundedFormalEventPredicateEvidence>>;
  currentEventIds: string[];
  habitPrecedents: Array<{
    eventId: string;
    sourcePath: string;
    ageRange: { min: number; max: number };
    trigger: { type: string; value: number };
    conditions: Array<{ type: string; expression: string }>;
    allowedEffectShapes: Array<Record<string, string>>;
    excludedEffectTypes: string[];
  }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stablePrettyJson(value: unknown): string {
  return JSON.stringify(JSON.parse(canonicalJson(value)) as unknown, null, 2);
}

function shapeEffects(event: Record<string, unknown>): {
  allowedEffectShapes: Array<Record<string, string>>;
  excludedEffectTypes: string[];
} {
  const effects: unknown[] = [];
  if (Array.isArray(event.choices)) {
    for (const choice of event.choices) {
      if (isRecord(choice) && Array.isArray(choice.effects)) effects.push(...choice.effects);
    }
  }
  if (Array.isArray(event.autoEffects)) effects.push(...event.autoEffects);

  const allowedEffectShapes: Array<Record<string, string>> = [];
  const excludedEffectTypes = new Set<string>();
  for (const effect of effects) {
    if (!isRecord(effect) || typeof effect.type !== 'string') {
      excludedEffectTypes.add('unknown');
      continue;
    }
    if (effect.type === 'stat_modify' && typeof effect.target === 'string' && typeof effect.operator === 'string') {
      const allowedTargets: readonly string[] = BOUNDED_FORMAL_EVENT_AUTHORING_SAFE_PROJECTION_V1.allowedEffects.statModifyTargets;
      if (allowedTargets.includes(effect.target)
        && ['add', 'subtract', 'multiply', 'divide'].includes(effect.operator)) {
        allowedEffectShapes.push({ type: effect.type, target: effect.target, operator: effect.operator });
      } else {
        excludedEffectTypes.add(effect.type);
      }
      continue;
    }
    if (effect.type === 'life_state_change' && typeof effect.target === 'string') {
      const allowedTargets: readonly string[] = BOUNDED_FORMAL_EVENT_AUTHORING_SAFE_PROJECTION_V1.allowedEffects.lifeStateChangeTargets;
      if (allowedTargets.includes(effect.target)) {
        allowedEffectShapes.push({ type: effect.type, target: effect.target });
      } else {
        excludedEffectTypes.add(effect.type);
      }
      continue;
    }
    if ((effect.type === 'status_add' || effect.type === 'status_remove') && typeof effect.status === 'string') {
      const allowedStatusIds: readonly string[] = BOUNDED_FORMAL_EVENT_AUTHORING_SAFE_PROJECTION_V1.allowedEffects.statusIds;
      if (allowedStatusIds.includes(effect.status)) {
        allowedEffectShapes.push({ type: effect.type, status: effect.status });
      } else {
        excludedEffectTypes.add(effect.type);
      }
      continue;
    }
    excludedEffectTypes.add(effect.type);
  }
  return { allowedEffectShapes, excludedEffectTypes: [...excludedEffectTypes].sort() };
}

async function readHabitPrecedent(repositoryRoot: string, item: {
  eventId: string;
  sourcePath: string;
  expression: string;
}): Promise<BoundedFormalEventParticipantEvidenceV1['habitPrecedents'][number]> {
  const events: unknown = JSON.parse(await readFile(join(repositoryRoot, item.sourcePath), 'utf8')) as unknown;
  if (!Array.isArray(events)) throw new Error(`${item.sourcePath} must contain an Event array`);
  const event = events.find(candidate => isRecord(candidate) && candidate.id === item.eventId);
  if (!isRecord(event)
    || !isRecord(event.ageRange)
    || !Array.isArray(event.triggers)
    || !Array.isArray(event.conditions)) {
    throw new Error(`Canonical habit precedent is missing or malformed: ${item.eventId}`);
  }
  const trigger = event.triggers[0];
  if (!isRecord(trigger) || trigger.type !== 'age_reach' || typeof trigger.value !== 'number') {
    throw new Error(`Canonical habit precedent has no age_reach trigger: ${item.eventId}`);
  }
  const conditions = event.conditions.filter(isRecord).map(condition => ({
    type: String(condition.type ?? ''),
    expression: String(condition.expression ?? ''),
  }));
  if (!conditions.some(condition => condition.type === 'expression' && condition.expression === item.expression)) {
    throw new Error(`Canonical habit precedent no longer supports its recorded access predicate: ${item.eventId}`);
  }
  const effects = shapeEffects(event);
  return {
    eventId: item.eventId,
    sourcePath: item.sourcePath,
    ageRange: {
      min: Number(event.ageRange.min),
      max: Number(event.ageRange.max),
    },
    trigger: { type: trigger.type, value: trigger.value },
    conditions,
    ...effects,
  };
}

export async function readBoundedFormalEventParticipantEvidence(
  repositoryRoot: string,
): Promise<BoundedFormalEventParticipantEvidenceV1> {
  const root = resolve(repositoryRoot);
  const predicateEvidence = await readBoundedFormalEventPredicateEvidence(root);
  const habitPrecedents = await Promise.all([
    readHabitPrecedent(root, {
      eventId: BOUNDED_FORMAL_EVENT_HABIT_PRECEDENTS.trainingHabit.eventId,
      sourcePath: BOUNDED_FORMAL_EVENT_HABIT_PRECEDENTS.trainingHabit.sourcePath,
      expression: BOUNDED_FORMAL_EVENT_HABIT_PRECEDENTS.trainingHabit.expression,
    }),
    readHabitPrecedent(root, {
      eventId: BOUNDED_FORMAL_EVENT_HABIT_PRECEDENTS.businessHabit.eventId,
      sourcePath: BOUNDED_FORMAL_EVENT_HABIT_PRECEDENTS.businessHabit.sourcePath,
      expression: BOUNDED_FORMAL_EVENT_HABIT_PRECEDENTS.businessHabit.expression,
    }),
  ]);
  const currentEventIds = EventLoader.getInstance().getAllEvents()
    .map(event => event.id)
    .sort((left, right) => left.localeCompare(right));
  return {
    contract: BOUNDED_FORMAL_EVENT_AUTHORING_SAFE_PROJECTION_V1,
    predicateEvidence,
    currentEventIds,
    habitPrecedents,
  };
}

export function renderBoundedFormalEventProposalPrompt(input: {
  invocationRef: string;
  evidence: BoundedFormalEventParticipantEvidenceV1;
}): string {
  return [
    'Role: author exactly one new bounded Formal Event for the supplied Human-direct Requirement.',
    'Author the concrete Event yourself. Do not repeat a prepared fixture, copy a canonical Event, or pre-assume a plot, choice, age, or exact effect value.',
    'Use only the supplied v1 safe projection and repository evidence. Existing precedent effect shapes are evidence, not permission to copy their values; excluded effects are explicitly outside this Contract.',
    'If the Requirement is not applicable or the bounded Contract cannot express it, return the matching applicabilityClaim and contractPayload: null. Do not widen the Contract.',
    `Set proposedBy exactly to ${JSON.stringify(`bounded-formal-event-proposal:${input.invocationRef}`)}.`,
    'Return one JSON object only, with fields schemaVersion, contractId, contractVersion, requirement, proposedBy, applicabilityClaim, contractPayload. Do not include a review or reviewer answer.',
    'Fixed Requirement:',
    stablePrettyJson(HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT),
    'Bounded Formal Event v1 safe Contract projection:',
    stablePrettyJson(input.evidence.contract),
    'Current canonical Event, schema, condition, effect, and access evidence:',
    stablePrettyJson({
      predicateEvidence: input.evidence.predicateEvidence,
      habitPrecedents: input.evidence.habitPrecedents,
      existingEventIdsToAvoid: input.evidence.currentEventIds,
    }),
  ].join('\n\n');
}

export function renderBoundedFormalEventReviewPrompt(input: {
  invocationRef: string;
  proposal: unknown;
  requirementSha256: string;
  proposalSha256: string;
  evidence: BoundedFormalEventParticipantEvidenceV1;
}): string {
  return renderBoundedFormalEventReviewPromptTemplate({
    invocationRef: input.invocationRef,
    evidence: input.evidence,
  })
    .replace(JSON.stringify(BOUNDED_FORMAL_EVENT_REVIEW_REQUIREMENT_SHA_MARKER), JSON.stringify(input.requirementSha256))
    .replace(JSON.stringify(BOUNDED_FORMAL_EVENT_REVIEW_PROPOSAL_SHA_MARKER), JSON.stringify(input.proposalSha256))
    .replace(BOUNDED_FORMAL_EVENT_REVIEW_PROPOSAL_MARKER, stablePrettyJson(input.proposal));
}

export const BOUNDED_FORMAL_EVENT_REVIEW_REQUIREMENT_SHA_MARKER = '<HOST_FIXED_REQUIREMENT_SHA256>' as const;
export const BOUNDED_FORMAL_EVENT_REVIEW_PROPOSAL_SHA_MARKER = '<AUTHORIZED_PROPOSAL_SHA256>' as const;
export const BOUNDED_FORMAL_EVENT_REVIEW_PROPOSAL_MARKER = '<PROPOSAL_FROM_AUTHORIZED_AUTHOR_INVOCATION>' as const;

export function renderBoundedFormalEventReviewPromptTemplate(input: {
  invocationRef: string;
  evidence: BoundedFormalEventParticipantEvidenceV1;
}): string {
  return [
    'Role: independently review one bounded Formal Event proposal against its exact Requirement and the supplied v1 safe Contract projection.',
    'This is a fresh Reviewer invocation. Do not reuse the author identity or thread. Assess applicability, conformance, execution envelope, Requirement coverage, Past → Present → Future coherence, and concrete blockers.',
    'Do not repair or rewrite the proposal. ACCEPT is valid only when all assessments are positive and blockers is empty; otherwise choose an appropriate non-accept decision and report blockers.',
    `Set reviewerRef exactly to ${JSON.stringify(`bounded-formal-event-review:${input.invocationRef}`)}.`,
    `Set requirementSha256 exactly to ${JSON.stringify(BOUNDED_FORMAL_EVENT_REVIEW_REQUIREMENT_SHA_MARKER)} and proposalSha256 exactly to ${JSON.stringify(BOUNDED_FORMAL_EVENT_REVIEW_PROPOSAL_SHA_MARKER)}.`,
    'Return one JSON object only, with fields schemaVersion, contractId, contractVersion, requirementSha256, proposalSha256, reviewerRef, decision, applicabilityAssessment, conformance, executionEnvelope, requirementCoverage, pastPresentFutureAssessment, assessment, blockers.',
    'Role-schema output Contract (representation only; do not infer a review conclusion):',
    '- "schemaVersion": a string exactly "autonomous-authoring-review-assessment-v2".',
    '- "decision": a string exactly one of "ACCEPT" | "REJECT" | "REQUEST_MORE_WORK" | "DEFER" | "ESCALATE".',
    '- "applicabilityAssessment": one string, exactly one of "APPLICABLE" | "NOT_APPLICABLE" | "INSUFFICIENT_EVIDENCE" | "CONTRACT_CHANGE_REQUIRED".',
    '- "conformance": one string, exactly one of "CONFORMING" | "NON_CONFORMING" | "AMBIGUOUS".',
    '- "executionEnvelope": one string, exactly one of "WITHIN_ENVELOPE" | "EXECUTION_ENVELOPE_EXCEEDED" | "UNKNOWN".',
    '- "requirementCoverage": one string, exactly one of "COVERED" | "NOT_COVERED" | "UNCERTAIN".',
    '- "pastPresentFutureAssessment": one string, exactly one of "COHERENT" | "INCOHERENT" | "UNCERTAIN".',
    '- "assessment": a plain non-empty string.',
    '- "blockers": an array of strings.',
    'Do not wrap any assessment field in an object such as {"status": "...", "details": "..."}; put explanations in assessment or blockers.',
    'These are representation rules only and do not imply a review conclusion.',
    'Fixed Requirement:',
    stablePrettyJson(HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT),
    'Bounded Formal Event v1 safe Contract projection:',
    stablePrettyJson(input.evidence.contract),
    'Proposal to review:',
    BOUNDED_FORMAL_EVENT_REVIEW_PROPOSAL_MARKER,
    'Current canonical Event, schema, condition, effect, and access evidence:',
    stablePrettyJson({
      predicateEvidence: input.evidence.predicateEvidence,
      habitPrecedents: input.evidence.habitPrecedents,
      existingEventIdsToAvoid: input.evidence.currentEventIds,
    }),
  ].join('\n\n');
}

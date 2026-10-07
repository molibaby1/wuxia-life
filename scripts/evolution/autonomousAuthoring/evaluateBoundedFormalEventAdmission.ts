import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { EventLoader } from '../../../src/core/EventLoader';
import {
  assessBoundedFormalEventApplicability,
  deriveBoundedFormalEventPredicateEvidence,
  BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS,
  BOUNDED_FORMAL_EVENT_CONTRACT_ID,
  BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
  BOUNDED_FORMAL_EVENT_MAX_NEW_EVENTS,
  type BoundedFormalEventRequirementBoundaryEvidenceV1,
  type BoundedFormalEventPredicateEvidenceV1,
} from '../../../src/evolution/boundedFormalEventAuthoringContract';
import {
  validateBoundedFormalEventProposalV2,
  validateBoundedFormalEventReviewAssessmentV2,
} from '../../../src/evolution/boundedFormalEventProposalContract';
import {
  validateBoundedFormalEventAdmissionV2,
  type BoundedFormalEventAdmissionStatusV2,
  type BoundedFormalEventAdmissionV2,
} from '../../../src/evolution/boundedFormalEventAdmissionContract';
import { validateAuthoringRequirementV1 } from '../../../src/evolution/authoringRequirementContract';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import { captureAuthoritativeFingerprint } from '../problemAgnosticSolution/agentWorkspace';

function parseEventArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('P22 content expansion file must contain an Event array');
  return value;
}

export async function readBoundedFormalEventPredicateEvidence(repositoryRoot: string): Promise<BoundedFormalEventPredicateEvidenceV1> {
  try {
    const [p22Raw, merchantRaw] = await Promise.all([
      readFile(join(repositoryRoot, 'src/data/lines/p22-content-expansions.json'), 'utf8'),
      readFile(join(repositoryRoot, 'src/data/lines/merchant.json'), 'utf8'),
    ]);
    const p22Events = parseEventArray(JSON.parse(p22Raw) as unknown);
    const merchantEvents = parseEventArray(JSON.parse(merchantRaw) as unknown);
    return deriveBoundedFormalEventPredicateEvidence([
      { path: 'src/data/lines/p22-content-expansions.json', events: p22Events },
      { path: 'src/data/lines/merchant.json', events: merchantEvents },
    ]);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return deriveBoundedFormalEventPredicateEvidence([]);
    }
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return deriveBoundedFormalEventPredicateEvidence([]);
    throw error;
  }
}

function reasonForStatus(status: BoundedFormalEventAdmissionStatusV2): string {
  switch (status) {
    case 'ELIGIBLE': return 'Host confirmed this one-event proposal is within the bounded Formal Event Contract.';
    case 'NOT_APPLICABLE': return 'The fixed Requirement does not meet both observed P22 Habit predicates.';
    case 'INSUFFICIENT_EVIDENCE': return 'Host lacks stable predicate or Habit evidence for this Requirement.';
    case 'CONTRACT_CHANGE_REQUIRED': return 'The proposal claims it needs semantics outside this Formal Event Contract.';
    case 'EXECUTION_ENVELOPE_EXCEEDED': return 'The proposal exceeds the one-Event execution envelope.';
    case 'REVIEW_REJECTED': return 'Independent review is missing, mismatched, non-conforming, or not accepted.';
    case 'AUTHORITY_STALE': return 'The authoritative repository changed while Host admission was being prepared.';
  }
}

export async function evaluateBoundedFormalEventAdmission(input: {
  repositoryRoot: string;
  requirement: unknown;
  proposal: unknown;
  review?: unknown;
  observedLifeStates?: { trainingHabit?: unknown; businessHabit?: unknown } | null;
  requirementBoundaryEvidence?: BoundedFormalEventRequirementBoundaryEvidenceV1 | null;
}): Promise<BoundedFormalEventAdmissionV2> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const beforeFingerprint = await captureAuthoritativeFingerprint(repositoryRoot);
  const requirement = validateAuthoringRequirementV1(input.requirement);
  const existingIds = EventLoader.getInstance().getAllEvents().map(event => event.id);
  const proposal = validateBoundedFormalEventProposalV2(input.proposal, existingIds);
  if (canonicalJson(proposal.requirement) !== canonicalJson(requirement)) {
    throw new Error('Host admission Requirement must exactly match the proposal Requirement');
  }
  const predicateEvidence = await readBoundedFormalEventPredicateEvidence(repositoryRoot);
  const applicability = assessBoundedFormalEventApplicability(
    requirement,
    input.observedLifeStates,
    predicateEvidence,
    input.requirementBoundaryEvidence,
  );

  let reviewSha256: string | null = null;
  let reviewerRef: string | null = null;
  let status: BoundedFormalEventAdmissionStatusV2 = 'INSUFFICIENT_EVIDENCE';
  const reasons = [...applicability.reasons];

  if (applicability.status === 'NOT_APPLICABLE') {
    status = 'NOT_APPLICABLE';
  } else if (applicability.status === 'INSUFFICIENT_EVIDENCE') {
    status = 'INSUFFICIENT_EVIDENCE';
  } else if (applicability.status === 'CONTRACT_CHANGE_REQUIRED') {
    status = 'CONTRACT_CHANGE_REQUIRED';
  } else if (proposal.applicabilityClaim === 'CONTRACT_CHANGE_REQUIRED') {
    status = 'CONTRACT_CHANGE_REQUIRED';
  } else if (proposal.applicabilityClaim !== 'APPLICABLE') {
    status = 'INSUFFICIENT_EVIDENCE';
    reasons.push('Proposal applicability claim does not match Host evidence.');
  } else if (input.review === undefined || input.review === null) {
    status = 'REVIEW_REJECTED';
    reasons.push('No independent review artifact was supplied.');
  } else {
    const review = validateBoundedFormalEventReviewAssessmentV2(input.review);
    const requirementSha256 = sha256Hex(canonicalJson(requirement));
    const proposalSha256 = sha256Hex(canonicalJson(proposal));
    reviewSha256 = sha256Hex(canonicalJson(review));
    reviewerRef = review.reviewerRef;
    const reviewMatches = review.requirementSha256 === requirementSha256
      && review.proposalSha256 === proposalSha256
      && review.reviewerRef !== proposal.proposedBy
      && review.applicabilityAssessment === 'APPLICABLE'
      && review.conformance === 'CONFORMING'
      && review.executionEnvelope === 'WITHIN_ENVELOPE'
      && review.requirementCoverage === 'COVERED'
      && review.pastPresentFutureAssessment === 'COHERENT'
      && review.decision === 'ACCEPT'
      && review.blockers.length === 0;
    status = reviewMatches ? 'ELIGIBLE' : 'REVIEW_REJECTED';
    if (!reviewMatches) reasons.push('Independent review does not match the exact Requirement and proposal or did not accept all required assessments.');
  }

  const afterFingerprint = await captureAuthoritativeFingerprint(repositoryRoot);
  if (beforeFingerprint !== afterFingerprint) {
    status = 'AUTHORITY_STALE';
    reasons.push('Authoritative repository fingerprint changed during admission.');
  }

  const result = {
    schemaVersion: 'autonomous-authoring-admission-v2',
    contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID,
    contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
    status,
    requirementSha256: sha256Hex(canonicalJson(requirement)),
    proposalSha256: sha256Hex(canonicalJson(proposal)),
    reviewSha256,
    proposedBy: proposal.proposedBy,
    reviewerRef,
    authoritativeFingerprintBefore: beforeFingerprint,
    allowedWritePaths: BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS,
    maxNewEvents: BOUNDED_FORMAL_EVENT_MAX_NEW_EVENTS,
    applicability,
    predicateEvidence,
    reasons: reasons.length > 0 ? reasons : [reasonForStatus(status)],
  };
  return validateBoundedFormalEventAdmissionV2(result);
}

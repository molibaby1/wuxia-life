import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, join, relative, resolve, sep } from 'node:path';
import {
  parseReviewContinuation,
  parseReviewContinuationRevisionRequest,
  type ReviewContinuationV1,
} from '../../../src/evolution/reviewContinuationContract';
import { parseSolutionDecision, type SolutionDecisionV1 } from '../../../src/evolution/solutionDecisionContract';
import { parseSolutionReview, type SolutionReviewV1 } from '../../../src/evolution/solutionReviewContract';
import { parseSolutionWork, type SolutionWorkV1 } from '../../../src/evolution/solutionWorkContract';
import {
  buildWorkflowDecisionAudit,
  type WorkflowAuditStatus,
  type WorkflowDecisionAuditV1,
} from './buildWorkflowDecisionAudit';
import type { WorkflowSummary } from './buildOperationalRunReport';

export const WORKFLOW_CONTINUATION_AUDIT_SCHEMA_VERSION = 'ae-workflow-continuation-audit-v1' as const;
export type WorkflowContinuationAuditStatus = WorkflowAuditStatus | 'participant_failure';

type ReviewerRequestProjection = Pick<
  WorkflowDecisionAuditV1['reviewer'],
  'decision' | 'assessment' | 'acceptedOptionId' | 'scopeAssessment' | 'concerns'
>;
type ContinuationSolutionProjection = Omit<WorkflowDecisionAuditV1['solution'], 'status'> & {
  status: WorkflowContinuationAuditStatus;
};
type ContinuationReviewProjection = Omit<WorkflowDecisionAuditV1['reviewer'], 'status'> & {
  status: WorkflowContinuationAuditStatus;
};
type ContinuationDecisionProjection = Omit<WorkflowDecisionAuditV1['decision'], 'status'> & {
  status: WorkflowContinuationAuditStatus;
};

export interface WorkflowContinuationAuditV1 {
  schemaVersion: typeof WORKFLOW_CONTINUATION_AUDIT_SCHEMA_VERSION;
  continuationRef: string;
  revisionRequest: {
    status: WorkflowContinuationAuditStatus;
    artifactRef: string | null;
    reviewerRequest: ReviewerRequestProjection;
  };
  revisedSolution: ContinuationSolutionProjection;
  reReview: ContinuationReviewProjection;
  continuationDecision: ContinuationDecisionProjection;
}

export interface AuditedWorkflowContinuationSummary extends WorkflowSummary {
  decisionAudit: WorkflowDecisionAuditV1;
  continuationAudit: WorkflowContinuationAuditV1 | null;
}

interface JsonRecord {
  [key: string]: unknown;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertExactKeys(value: JsonRecord, allowed: readonly string[], label: string): void {
  const allowedKeys = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) throw new Error(`${label} contains unknown field: ${key}`);
  }
  for (const key of allowed) {
    if (!(key in value)) throw new Error(`${label} is missing field: ${key}`);
  }
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function nullableString(value: unknown, label: string): string | null {
  if (value === null) return null;
  return nonEmptyString(value, label);
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value.map((item, index) => nonEmptyString(item, `${label}[${index}]`));
}

function enumValue<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) throw new Error(`${label} has invalid value: ${String(value)}`);
  return value as T;
}

const STATUSES: readonly WorkflowContinuationAuditStatus[] = ['completed', 'failed', 'not_run', 'missing', 'participant_failure'];
const SOLUTION_STATUSES: readonly SolutionWorkV1['status'][] = ['OPTIONS', 'NO_PROPOSAL', 'INSUFFICIENT_EVIDENCE', 'ESCALATE'];
const REVIEW_DECISIONS: readonly SolutionReviewV1['decision'][] = ['ACCEPT_OPTION', 'ACCEPT_NO_ACTION', 'REJECT', 'REQUEST_MORE_WORK', 'DEFER', 'ESCALATE'];
const REVIEW_SCOPES: readonly NonNullable<SolutionReviewV1['scopeAssessment']>[] = ['config_only', 'code_required', 'mixed', 'uncertain'];
const SOLUTION_ROUTES: readonly SolutionDecisionV1['route'][] = ['READY_FOR_CONFIG_EXECUTION', 'READY_FOR_SHADOW_AUTHORING', 'SKIP', 'DEFER', 'DEFER_MORE_WORK_REQUESTED', 'ESCALATE_HUMAN'];
const DECISION_REASONS: readonly SolutionDecisionV1['reasonCode'][] = ['ACCEPTED_CONFIGURATION_SCOPE', 'ACCEPTED_AUTONOMOUS_AUTHORING_SCOPE', 'AUTONOMOUS_AUTHORING_INSUFFICIENT_EVIDENCE', 'AUTONOMOUS_AUTHORING_CONTRACT_CHANGE_REQUIRED', 'AUTONOMOUS_AUTHORING_EXECUTION_ENVELOPE_EXCEEDED', 'AUTONOMOUS_AUTHORING_AUTHORITY_STALE', 'ACCEPTED_REQUIRES_HUMAN_AUTHORITY', 'EXECUTION_AUTHORITY_UNCERTAIN', 'ACCEPTED_OUT_OF_SCOPE', 'NO_PROBLEM_FORMED', 'NO_PROPOSAL', 'INSUFFICIENT_EVIDENCE', 'REVIEW_REJECTED', 'REVIEW_ACCEPT_NO_ACTION', 'REVIEW_REQUEST_MORE_WORK', 'REVIEW_DEFERRED', 'EXPLICIT_ESCALATION', 'PARTICIPANT_FAILURE'];

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function readJson(path: string): Promise<unknown | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as unknown;
  } catch {
    return null;
  }
}

function reviewerRequestFromBase(base: WorkflowDecisionAuditV1): ReviewerRequestProjection {
  return {
    decision: base.reviewer.decision,
    assessment: base.reviewer.assessment,
    acceptedOptionId: base.reviewer.acceptedOptionId,
    scopeAssessment: base.reviewer.scopeAssessment,
    concerns: [...base.reviewer.concerns],
  };
}

function emptySolution(status: WorkflowContinuationAuditStatus, artifactRef: string | null): ContinuationSolutionProjection {
  return { status, artifactRef, solutionStatus: null, summary: null, recommendedOptionId: null, options: [] };
}

function emptyReview(status: WorkflowContinuationAuditStatus, artifactRef: string | null): ContinuationReviewProjection {
  return { status, artifactRef, decision: null, assessment: null, acceptedOptionId: null, scopeAssessment: null, concerns: [] };
}

function emptyDecision(status: WorkflowContinuationAuditStatus, artifactRef: string | null): ContinuationDecisionProjection {
  return { status, artifactRef, route: null, reasonCode: null };
}

async function projectRevisedSolution(root: string, continuation: ReviewContinuationV1): Promise<ContinuationSolutionProjection> {
  const base = 'review-continuation-000001/solution-revision';
  const resultRef = `${base}/result.json`;
  const failureRef = `${base}/failure.json`;
  const resultPath = join(root, resultRef);
  const failurePath = join(root, failureRef);
  if (continuation.revisionStatus === 'participant_failure' || await isFile(failurePath)) {
    return emptySolution('participant_failure', await isFile(failurePath) ? failureRef : null);
  }
  if (!(await isFile(resultPath))) return emptySolution('missing', null);
  try {
    const solution = parseSolutionWork(await readFile(resultPath, 'utf8'));
    return {
      status: 'completed',
      artifactRef: resultRef,
      solutionStatus: solution.status,
      summary: solution.summary,
      recommendedOptionId: solution.recommendedOptionId ?? null,
      options: solution.options,
    };
  } catch {
    return emptySolution('missing', resultRef);
  }
}

async function projectReReview(root: string, continuation: ReviewContinuationV1): Promise<ContinuationReviewProjection> {
  const reviewRef = 'review-continuation-000001/reviewer-agent/review.json';
  const failureRef = 'review-continuation-000001/reviewer-agent/failure.json';
  if (continuation.reReviewStatus === 'not_run') return emptyReview('not_run', null);
  if (continuation.reReviewStatus === 'participant_failure' || await isFile(join(root, failureRef))) {
    return emptyReview('participant_failure', await isFile(join(root, failureRef)) ? failureRef : null);
  }
  if (!(await isFile(join(root, reviewRef)))) return emptyReview('missing', null);
  try {
    const review = parseSolutionReview(await readFile(join(root, reviewRef), 'utf8'));
    return {
      status: 'completed',
      artifactRef: reviewRef,
      decision: review.decision,
      assessment: review.assessment,
      acceptedOptionId: review.acceptedOptionId ?? null,
      scopeAssessment: review.scopeAssessment ?? null,
      concerns: review.concerns,
    };
  } catch {
    return emptyReview('missing', reviewRef);
  }
}

async function projectContinuationDecision(root: string, continuation: ReviewContinuationV1): Promise<ContinuationDecisionProjection> {
  const decisionRef = 'review-continuation-000001/decision.json';
  if (continuation.terminalStatus === 'participant_failure') return emptyDecision('participant_failure', null);
  if (!(await isFile(join(root, decisionRef)))) return emptyDecision('missing', null);
  try {
    const decision = parseSolutionDecision(await readFile(join(root, decisionRef), 'utf8'));
    return { status: 'completed', artifactRef: decisionRef, route: decision.route, reasonCode: decision.reasonCode };
  } catch {
    return emptyDecision('missing', decisionRef);
  }
}

export async function buildWorkflowContinuationAudit(input: {
  workflowRoot: string;
}): Promise<WorkflowContinuationAuditV1 | null> {
  const root = resolve(input.workflowRoot);
  const continuationRef = 'review-continuation-000001';
  const continuationJsonRef = `${continuationRef}/continuation.json`;
  if (!(await isFile(join(root, continuationJsonRef)))) return null;
  const continuationValue = await readJson(join(root, continuationJsonRef));
  let continuation: ReviewContinuationV1;
  try {
    continuation = parseReviewContinuation(JSON.stringify(continuationValue));
  } catch (error) {
    throw new Error(`invalid continuation artifact ${continuationJsonRef}: ${String(error)}`);
  }
  const base = await buildWorkflowDecisionAudit({ workflowRoot: root });
  const requestRef = `${continuationRef}/revision-request.json`;
  const requestPath = join(root, requestRef);
  let requestStatus: WorkflowContinuationAuditStatus = 'missing';
  if (await isFile(requestPath)) {
    try {
      parseReviewContinuationRevisionRequest(await readFile(requestPath, 'utf8'));
      requestStatus = 'completed';
    } catch {
      requestStatus = 'missing';
    }
  }
  return {
    schemaVersion: WORKFLOW_CONTINUATION_AUDIT_SCHEMA_VERSION,
    continuationRef,
    revisionRequest: {
      status: requestStatus,
      artifactRef: await isFile(requestPath) ? requestRef : null,
      reviewerRequest: reviewerRequestFromBase(base),
    },
    revisedSolution: await projectRevisedSolution(root, continuation),
    reReview: await projectReReview(root, continuation),
    continuationDecision: await projectContinuationDecision(root, continuation),
  };
}

function parseProjectionStatus(value: unknown, label: string): WorkflowContinuationAuditStatus {
  return enumValue(value, STATUSES, `${label}.status`);
}

function parseContinuationReviewer(value: unknown, label: string, allowParticipantFailure: boolean): ContinuationReviewProjection {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  assertExactKeys(value, ['status', 'artifactRef', 'decision', 'assessment', 'acceptedOptionId', 'scopeAssessment', 'concerns'], label);
  const status = parseProjectionStatus(value.status, label);
  if (!allowParticipantFailure && status === 'participant_failure') throw new Error(`${label}.status must not be participant_failure`);
  const decision = value.decision === null ? null : enumValue(value.decision, REVIEW_DECISIONS, `${label}.decision`);
  const assessment = nullableString(value.assessment, `${label}.assessment`);
  const acceptedOptionId = nullableString(value.acceptedOptionId, `${label}.acceptedOptionId`);
  const scopeAssessment = value.scopeAssessment === null ? null : enumValue(value.scopeAssessment, REVIEW_SCOPES, `${label}.scopeAssessment`);
  const concerns = stringArray(value.concerns, `${label}.concerns`);
  if (decision === 'ACCEPT_OPTION' && (acceptedOptionId === null || scopeAssessment === null)) throw new Error(`${label}.ACCEPT_OPTION requires accepted option scope fields`);
  if (decision !== 'ACCEPT_OPTION' && (acceptedOptionId !== null || scopeAssessment !== null)) throw new Error(`${label}.${String(decision)} must not contain accepted option scope fields`);
  if (status !== 'completed' && (decision !== null || assessment !== null || acceptedOptionId !== null || scopeAssessment !== null || concerns.length > 0)) throw new Error(`${label}.${status} must not contain semantic result fields`);
  return { status, artifactRef: nullableString(value.artifactRef, `${label}.artifactRef`), decision, assessment, acceptedOptionId, scopeAssessment, concerns };
}

function parseContinuationSolution(value: unknown, label: string): ContinuationSolutionProjection {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  assertExactKeys(value, ['status', 'artifactRef', 'solutionStatus', 'summary', 'recommendedOptionId', 'options'], label);
  const status = parseProjectionStatus(value.status, label);
  const solutionStatus = value.solutionStatus === null ? null : enumValue(value.solutionStatus, SOLUTION_STATUSES, `${label}.solutionStatus`);
  const summary = nullableString(value.summary, `${label}.summary`);
  const recommendedOptionId = nullableString(value.recommendedOptionId, `${label}.recommendedOptionId`);
  if (!Array.isArray(value.options)) throw new Error(`${label}.options must be an array`);
  if (value.options.length > 3) throw new Error(`${label}.options must contain at most three options`);
  const options = value.options.map((option, index) => {
    if (!isRecord(option)) throw new Error(`${label}.options[${index}] must be an object`);
    assertExactKeys(option, ['optionId', 'proposedChange', 'rationale', 'repoRefs', 'artifactRefs', 'changeScope', 'expectedPlayerObservableDifference', 'risks', 'unknowns'], `${label}.options[${index}]`);
    const optionId = `option-${String(index + 1).padStart(6, '0')}`;
    if (option.optionId !== optionId) throw new Error(`${label}.options[${index}].optionId must be ${optionId}`);
    return {
      optionId,
      proposedChange: nonEmptyString(option.proposedChange, `${label}.options[${index}].proposedChange`),
      rationale: nonEmptyString(option.rationale, `${label}.options[${index}].rationale`),
      repoRefs: stringArray(option.repoRefs, `${label}.options[${index}].repoRefs`),
      artifactRefs: stringArray(option.artifactRefs, `${label}.options[${index}].artifactRefs`),
      changeScope: enumValue(option.changeScope, ['configuration', 'program', 'mixed', 'uncertain'] as const, `${label}.options[${index}].changeScope`),
      expectedPlayerObservableDifference: nonEmptyString(option.expectedPlayerObservableDifference, `${label}.options[${index}].expectedPlayerObservableDifference`),
      risks: stringArray(option.risks, `${label}.options[${index}].risks`),
      unknowns: stringArray(option.unknowns, `${label}.options[${index}].unknowns`),
    };
  });
  if (solutionStatus === 'OPTIONS' && options.length === 0) throw new Error(`${label}.OPTIONS requires options`);
  if (solutionStatus !== null && solutionStatus !== 'OPTIONS' && options.length !== 0) throw new Error(`${label}.${solutionStatus} must not contain options`);
  if (recommendedOptionId !== null && !options.some(option => option.optionId === recommendedOptionId)) throw new Error(`${label}.recommendedOptionId must reference an option`);
  if (status !== 'completed' && (solutionStatus !== null || summary !== null || recommendedOptionId !== null || options.length > 0)) throw new Error(`${label}.${status} must not contain semantic result fields`);
  return { status, artifactRef: nullableString(value.artifactRef, `${label}.artifactRef`), solutionStatus, summary, recommendedOptionId, options };
}

function parseContinuationDecision(value: unknown, label: string): ContinuationDecisionProjection {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  assertExactKeys(value, ['status', 'artifactRef', 'route', 'reasonCode'], label);
  const status = parseProjectionStatus(value.status, label);
  const route = value.route === null ? null : enumValue(value.route, SOLUTION_ROUTES, `${label}.route`);
  const reasonCode = value.reasonCode === null ? null : enumValue(value.reasonCode, DECISION_REASONS, `${label}.reasonCode`);
  if (status === 'completed' && (route === null || reasonCode === null)) throw new Error(`${label} requires route and reasonCode when completed`);
  if (status !== 'completed' && (route !== null || reasonCode !== null)) throw new Error(`${label} must not contain route or reasonCode unless completed`);
  return { status, artifactRef: nullableString(value.artifactRef, `${label}.artifactRef`), route, reasonCode };
}

export function parseWorkflowContinuationAudit(value: unknown, label = 'continuationAudit'): WorkflowContinuationAuditV1 {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  assertExactKeys(value, ['schemaVersion', 'continuationRef', 'revisionRequest', 'revisedSolution', 'reReview', 'continuationDecision'], label);
  if (value.schemaVersion !== WORKFLOW_CONTINUATION_AUDIT_SCHEMA_VERSION) throw new Error(`${label}.schemaVersion must be ${WORKFLOW_CONTINUATION_AUDIT_SCHEMA_VERSION}`);
  if (!isRecord(value.revisionRequest)) throw new Error(`${label}.revisionRequest must be an object`);
  assertExactKeys(value.revisionRequest, ['status', 'artifactRef', 'reviewerRequest'], `${label}.revisionRequest`);
  const revisionRequestStatus = parseProjectionStatus(value.revisionRequest.status, `${label}.revisionRequest`);
  if (!isRecord(value.revisionRequest.reviewerRequest)) throw new Error(`${label}.revisionRequest.reviewerRequest must be an object`);
  assertExactKeys(value.revisionRequest.reviewerRequest, ['decision', 'assessment', 'acceptedOptionId', 'scopeAssessment', 'concerns'], `${label}.revisionRequest.reviewerRequest`);
  const reviewerRequest = parseContinuationReviewer({
    status: 'completed',
    artifactRef: null,
    decision: value.revisionRequest.reviewerRequest.decision,
    assessment: value.revisionRequest.reviewerRequest.assessment,
    acceptedOptionId: value.revisionRequest.reviewerRequest.acceptedOptionId,
    scopeAssessment: value.revisionRequest.reviewerRequest.scopeAssessment,
    concerns: value.revisionRequest.reviewerRequest.concerns,
  }, `${label}.revisionRequest.reviewerRequest`, false);
  return {
    schemaVersion: WORKFLOW_CONTINUATION_AUDIT_SCHEMA_VERSION,
    continuationRef: nonEmptyString(value.continuationRef, `${label}.continuationRef`),
    revisionRequest: {
      status: revisionRequestStatus,
      artifactRef: nullableString(value.revisionRequest.artifactRef, `${label}.revisionRequest.artifactRef`),
      reviewerRequest: {
        decision: reviewerRequest.decision,
        assessment: reviewerRequest.assessment,
        acceptedOptionId: reviewerRequest.acceptedOptionId,
        scopeAssessment: reviewerRequest.scopeAssessment,
        concerns: reviewerRequest.concerns,
      },
    },
    revisedSolution: parseContinuationSolution(value.revisedSolution, `${label}.revisedSolution`),
    reReview: parseContinuationReviewer(value.reReview, `${label}.reReview`, true),
    continuationDecision: parseContinuationDecision(value.continuationDecision, `${label}.continuationDecision`),
  };
}

async function isWorkflowRoot(root: string): Promise<boolean> {
  return await isFile(join(root, 'decision.json'))
    || await isFile(join(root, 'workflow-outcome.json'))
    || (basename(root).startsWith('problem-agnostic-agent-solution-loop-instance-') && await isFile(join(root, 'source/observable-payload.json')));
}

async function discoverWorkflowRoots(root: string): Promise<string[]> {
  const resolvedRoot = resolve(root);
  const found: string[] = [];
  async function visit(directory: string): Promise<void> {
    if (await isWorkflowRoot(directory)) {
      found.push(directory);
      return;
    }
    let entries;
    try {
      entries = (await readdir(directory, { withFileTypes: true }))
        .filter(entry => entry.isDirectory())
        .sort((left, right) => left.name.localeCompare(right.name));
    } catch {
      return;
    }
    for (const entry of entries) await visit(join(directory, entry.name));
  }
  await visit(resolvedRoot);
  return found;
}

export async function collectWorkflowContinuationAudits(
  root: string,
  workflowRoots?: string[],
): Promise<Map<string, WorkflowContinuationAuditV1>> {
  const resolvedRoot = resolve(root);
  const audits = new Map<string, WorkflowContinuationAuditV1>();
  const roots = workflowRoots ?? await discoverWorkflowRoots(root);
  for (const workflowRoot of roots) {
    const audit = await buildWorkflowContinuationAudit({ workflowRoot });
    if (audit === null) continue;
    const identity = relative(resolvedRoot, workflowRoot).split(sep).join('/') || basename(workflowRoot);
    if (audits.has(identity)) throw new Error(`duplicate workflow identity for continuation audit: ${identity}`);
    audits.set(identity, audit);
  }
  return audits;
}

export function attachWorkflowContinuationAudits(
  summaries: Array<WorkflowSummary & { decisionAudit: WorkflowDecisionAuditV1 }>,
  audits: Map<string, WorkflowContinuationAuditV1>,
): AuditedWorkflowContinuationSummary[] {
  const identities = new Set(summaries.map(summary => summary.identity));
  for (const identity of audits.keys()) {
    if (!identities.has(identity)) throw new Error(`continuation audit has no matching workflow summary: ${identity}`);
  }
  return summaries.map(summary => ({ ...summary, continuationAudit: audits.get(summary.identity) ?? null }));
}

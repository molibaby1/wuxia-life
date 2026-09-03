import { readdir, readFile, stat } from 'node:fs/promises';
import { basename, join, relative, resolve, sep } from 'node:path';
import {
  parseExternalFeedback,
  validateExternalFeedbackReferences,
  type ExternalFeedback,
} from '../../../src/evolution/externalFeedbackContract';
import {
  IMPROVEMENT_HYPOTHESIS_SET_SCHEMA_VERSION,
  parseStoredImprovementHypothesisSet,
  validateImprovementHypothesisReferences,
  type NoProblemAssessment,
  type StoredImprovementHypothesisSet,
} from '../../../src/evolution/improvementHypothesisContract';
import {
  serializeObservablePayload,
  type ObservablePayload,
} from '../../../src/evolution/playerObservableTranscript';
import { parseSolutionDecision, type SolutionDecisionV1 } from '../../../src/evolution/solutionDecisionContract';
import { parseSolutionReview, type SolutionReviewV1 } from '../../../src/evolution/solutionReviewContract';
import { parseSolutionWork, type SolutionWorkV1 } from '../../../src/evolution/solutionWorkContract';
import type { WorkflowSummary } from './buildOperationalRunReport';

export const WORKFLOW_DECISION_AUDIT_SCHEMA_VERSION = 'ae-workflow-decision-audit-v1' as const;

export type WorkflowAuditStatus = 'completed' | 'failed' | 'not_run' | 'missing';
export type SelectionAuditStatus = WorkflowAuditStatus | 'none' | 'selected';

export type NoProblemAssessmentAudit =
  | ({ status: 'recorded' } & NoProblemAssessment)
  | { status: 'unavailable'; reason: 'legacy_contract' }
  | { status: 'not_applicable' }
  | { status: 'missing' };

export interface WorkflowDecisionAuditV1 {
  schemaVersion: typeof WORKFLOW_DECISION_AUDIT_SCHEMA_VERSION;
  externalFeedback: {
    status: WorkflowAuditStatus;
    artifactRef: string | null;
    overallImpression: string | null;
    observations: ExternalFeedback['observations'];
  };
  improvementHypothesis: {
    status: WorkflowAuditStatus;
    artifactRef: string | null;
    hypothesisCount: number | null;
    hypotheses: StoredImprovementHypothesisSet['hypotheses'];
    noProblemAssessment: NoProblemAssessmentAudit;
  };
  selection: {
    status: SelectionAuditStatus;
    artifactRef: string | null;
    selectedHypothesisId: string | null;
  };
  solution: {
    status: WorkflowAuditStatus;
    artifactRef: string | null;
    solutionStatus: SolutionWorkV1['status'] | null;
    summary: string | null;
    recommendedOptionId: string | null;
    options: SolutionWorkV1['options'];
  };
  reviewer: {
    status: WorkflowAuditStatus;
    artifactRef: string | null;
    decision: SolutionReviewV1['decision'] | null;
    assessment: string | null;
    acceptedOptionId: string | null;
    scopeAssessment: SolutionReviewV1['scopeAssessment'] | null;
    concerns: string[];
  };
  decision: {
    status: 'completed' | 'missing';
    artifactRef: string | null;
    route: SolutionDecisionV1['route'] | null;
    reasonCode: SolutionDecisionV1['reasonCode'] | null;
  };
}

export interface AuditedWorkflowSummary extends WorkflowSummary {
  decisionAudit: WorkflowDecisionAuditV1;
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
  value.forEach((item, index) => nonEmptyString(item, `${label}[${index}]`));
  return [...value] as string[];
}

function enumValue<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new Error(`${label} has invalid value: ${String(value)}`);
  }
  return value as T;
}

const WORKFLOW_AUDIT_STATUSES: readonly WorkflowAuditStatus[] = ['completed', 'failed', 'not_run', 'missing'];
const SELECTION_AUDIT_STATUSES: readonly SelectionAuditStatus[] = [
  ...WORKFLOW_AUDIT_STATUSES,
  'none',
  'selected',
];
const SOLUTION_STATUSES: readonly SolutionWorkV1['status'][] = [
  'OPTIONS',
  'NO_PROPOSAL',
  'INSUFFICIENT_EVIDENCE',
  'ESCALATE',
];
const REVIEW_DECISIONS: readonly SolutionReviewV1['decision'][] = [
  'ACCEPT_OPTION',
  'ACCEPT_NO_ACTION',
  'REJECT',
  'REQUEST_MORE_WORK',
  'DEFER',
  'ESCALATE',
];
const REVIEW_SCOPES: readonly NonNullable<SolutionReviewV1['scopeAssessment']>[] = [
  'config_only',
  'code_required',
  'mixed',
  'uncertain',
];
const SOLUTION_ROUTES: readonly SolutionDecisionV1['route'][] = [
  'READY_FOR_CONFIG_EXECUTION',
  'SKIP',
  'DEFER',
  'DEFER_MORE_WORK_REQUESTED',
  'ESCALATE_HUMAN',
];
const DECISION_REASON_CODES: readonly SolutionDecisionV1['reasonCode'][] = [
  'ACCEPTED_CONFIGURATION_SCOPE',
  'ACCEPTED_OUT_OF_SCOPE',
  'NO_PROBLEM_FORMED',
  'NO_PROPOSAL',
  'INSUFFICIENT_EVIDENCE',
  'REVIEW_REJECTED',
  'REVIEW_ACCEPT_NO_ACTION',
  'REVIEW_REQUEST_MORE_WORK',
  'REVIEW_DEFERRED',
  'EXPLICIT_ESCALATION',
  'PARTICIPANT_FAILURE',
];

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

async function pathIsFile(path: string): Promise<boolean> {
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

async function readJsonRecord(path: string): Promise<JsonRecord | null> {
  const value = await readJson(path);
  return isRecord(value) ? value : null;
}

async function findRunArtifact(
  root: string,
  directory: string,
  runRef: string | null,
  fileName: string,
): Promise<{ path: string; ref: string; exists: boolean }> {
  if (runRef !== null) {
    const ref = `${directory}/${runRef}/${fileName}`;
    const path = join(root, ref);
    return { path, ref, exists: await pathIsFile(path) };
  }

  try {
    const entries = (await readdir(join(root, directory), { withFileTypes: true }))
      .filter(entry => entry.isDirectory())
      .sort((left, right) => left.name.localeCompare(right.name));
    if (entries.length !== 1) {
      return { path: join(root, directory, fileName), ref: `${directory}/${fileName}`, exists: false };
    }
    const ref = `${directory}/${entries[0].name}/${fileName}`;
    const path = join(root, ref);
    return { path, ref, exists: await pathIsFile(path) };
  } catch {
    return { path: join(root, directory, fileName), ref: `${directory}/${fileName}`, exists: false };
  }
}

function sourceRunRef(problemPackage: JsonRecord | null): string | null {
  if (!isRecord(problemPackage?.source)) return null;
  return stringValue(problemPackage.source.runRef);
}

function failureStage(workflowOutcome: JsonRecord | null): string | null {
  return stringValue(workflowOutcome?.failedStage);
}

function stageStatus(input: {
  failedStage: string | null;
  stage: string;
  artifactExists: boolean;
  parsed: boolean;
}): WorkflowAuditStatus {
  if (input.failedStage === input.stage) return 'failed';
  if (input.parsed) return 'completed';
  if (input.artifactExists) return 'missing';
  return 'missing';
}

function noProblemAssessment(
  set: StoredImprovementHypothesisSet,
): NoProblemAssessmentAudit {
  if (set.hypotheses.length > 0) return { status: 'not_applicable' };
  if (set.schemaVersion === 'improvement-hypothesis-set-v1') {
    return { status: 'unavailable', reason: 'legacy_contract' };
  }
  if (set.noProblemAssessment === null) return { status: 'missing' };
  return { status: 'recorded', ...set.noProblemAssessment };
}

function parseObservablePayload(value: unknown): ObservablePayload | null {
  if (!isRecord(value)) return null;
  try {
    return JSON.parse(serializeObservablePayload(value as ObservablePayload)) as ObservablePayload;
  } catch {
    return null;
  }
}

function emptyExternalFeedback(status: WorkflowAuditStatus, artifactRef: string | null) {
  return {
    status,
    artifactRef,
    overallImpression: null,
    observations: [],
  } satisfies WorkflowDecisionAuditV1['externalFeedback'];
}

export async function buildWorkflowDecisionAudit(input: {
  workflowRoot: string;
}): Promise<WorkflowDecisionAuditV1> {
  const root = resolve(input.workflowRoot);
  const problemPackage = await readJsonRecord(join(root, 'problem-package.json'));
  const workflowOutcome = await readJsonRecord(join(root, 'workflow-outcome.json'));
  const failedStage = failureStage(workflowOutcome);
  const runRef = sourceRunRef(problemPackage);
  const observable = parseObservablePayload(await readJson(join(root, 'source/observable-payload.json')));

  const feedbackArtifact = await findRunArtifact(root, 'feedback-runs', runRef, 'feedback.json');
  const feedbackValue = await readJson(feedbackArtifact.path);
  let feedback: ExternalFeedback | null = null;
  try {
    if (typeof feedbackValue === 'string') feedback = parseExternalFeedback(feedbackValue);
    else if (feedbackValue !== null) feedback = parseExternalFeedback(JSON.stringify(feedbackValue));
    if (feedback && observable) validateExternalFeedbackReferences(feedback, observable);
    else feedback = null;
  } catch {
    feedback = null;
  }
  const feedbackStatus = stageStatus({
    failedStage,
    stage: 'EXTERNAL_FEEDBACK',
    artifactExists: feedbackArtifact.exists,
    parsed: feedback !== null,
  });

  const hypothesisArtifact = await findRunArtifact(root, 'hypothesis-runs', runRef, 'hypotheses.json');
  const hypothesisValue = await readJson(hypothesisArtifact.path);
  let hypothesis: StoredImprovementHypothesisSet | null = null;
  try {
    if (hypothesisValue !== null) {
      hypothesis = parseStoredImprovementHypothesisSet(JSON.stringify(hypothesisValue));
      if (feedback && observable) validateImprovementHypothesisReferences(hypothesis, feedback, observable);
      else if (hypothesis.hypotheses.length > 0 || hypothesis.noProblemAssessment !== null) hypothesis = null;
    }
  } catch {
    hypothesis = null;
  }
  const hypothesisStatus = feedbackStatus !== 'completed'
    ? (failedStage === 'EXTERNAL_FEEDBACK' ? 'not_run' : 'missing')
    : stageStatus({
      failedStage,
      stage: 'IMPROVEMENT_HYPOTHESIS',
      artifactExists: hypothesisArtifact.exists,
      parsed: hypothesis !== null,
    });

  const selectionPath = join(root, 'selection/selected-hypothesis.json');
  const selectionArtifact = await readJsonRecord(selectionPath);
  const selectedHypothesisId = stringValue(selectionArtifact?.selectedHypothesisId);
  const selectionStatus: SelectionAuditStatus = feedbackStatus !== 'completed'
    || hypothesisStatus === 'failed'
    || hypothesisStatus === 'not_run'
    ? 'not_run'
    : hypothesisStatus !== 'completed'
    ? 'missing'
    : hypothesis?.hypotheses.length === 0
    ? 'none'
    : selectedHypothesisId === null
    ? 'missing'
    : 'selected';

  const solutionPath = join(root, 'solution-agent/result.json');
  const solutionArtifactExists = await pathIsFile(solutionPath);
  let solution: SolutionWorkV1 | null = null;
  try {
    if (solutionArtifactExists) solution = parseSolutionWork(await readFile(solutionPath, 'utf8'));
  } catch {
    solution = null;
  }
  const solutionStatus = selectionStatus === 'none' || selectionStatus === 'not_run'
    ? 'not_run'
    : stageStatus({
      failedStage,
      stage: 'SOLUTION',
      artifactExists: solutionArtifactExists,
      parsed: solution !== null,
    });

  const reviewerPath = join(root, 'reviewer-agent/review.json');
  const reviewerArtifactExists = await pathIsFile(reviewerPath);
  let reviewer: SolutionReviewV1 | null = null;
  try {
    if (reviewerArtifactExists) reviewer = parseSolutionReview(await readFile(reviewerPath, 'utf8'));
  } catch {
    reviewer = null;
  }
  const reviewerShouldRun = solutionStatus === 'completed' && solution?.status === 'OPTIONS';
  const reviewerStatus = !reviewerShouldRun
    ? 'not_run'
    : stageStatus({
      failedStage,
      stage: 'REVIEWER',
      artifactExists: reviewerArtifactExists,
      parsed: reviewer !== null,
    });

  const decisionPath = join(root, 'decision.json');
  const decisionArtifactExists = await pathIsFile(decisionPath);
  let decision: SolutionDecisionV1 | null = null;
  try {
    if (decisionArtifactExists) decision = parseSolutionDecision(await readFile(decisionPath, 'utf8'));
  } catch {
    decision = null;
  }

  return {
    schemaVersion: WORKFLOW_DECISION_AUDIT_SCHEMA_VERSION,
    externalFeedback: feedback === null
      ? emptyExternalFeedback(feedbackStatus, feedbackArtifact.exists ? feedbackArtifact.ref : null)
      : {
        status: feedbackStatus,
        artifactRef: feedbackArtifact.ref,
        overallImpression: feedback.overallImpression,
        observations: feedback.observations,
      },
    improvementHypothesis: hypothesis === null
      ? {
        status: hypothesisStatus,
        artifactRef: hypothesisArtifact.exists ? hypothesisArtifact.ref : null,
        hypothesisCount: null,
        hypotheses: [],
        noProblemAssessment: { status: 'missing' },
      }
      : {
        status: hypothesisStatus,
        artifactRef: hypothesisArtifact.ref,
        hypothesisCount: hypothesis.hypotheses.length,
        hypotheses: hypothesis.hypotheses,
        noProblemAssessment: noProblemAssessment(hypothesis),
      },
    selection: {
      status: selectionStatus,
      artifactRef: selectionArtifact === null ? null : 'selection/selected-hypothesis.json',
      selectedHypothesisId: selectionStatus === 'selected' ? selectedHypothesisId : null,
    },
    solution: {
      status: solutionStatus,
      artifactRef: solution === null ? (solutionArtifactExists ? 'solution-agent/result.json' : null) : 'solution-agent/result.json',
      solutionStatus: solution?.status ?? null,
      summary: solution?.summary ?? null,
      recommendedOptionId: solution?.recommendedOptionId ?? null,
      options: solution?.options ?? [],
    },
    reviewer: {
      status: reviewerStatus,
      artifactRef: reviewer === null ? (reviewerArtifactExists ? 'reviewer-agent/review.json' : null) : 'reviewer-agent/review.json',
      decision: reviewer?.decision ?? null,
      assessment: reviewer?.assessment ?? null,
      acceptedOptionId: reviewer?.acceptedOptionId ?? null,
      scopeAssessment: reviewer?.scopeAssessment ?? null,
      concerns: reviewer?.concerns ?? [],
    },
    decision: {
      status: decision === null ? 'missing' : 'completed',
      artifactRef: decision === null ? (decisionArtifactExists ? 'decision.json' : null) : 'decision.json',
      route: decision?.route ?? null,
      reasonCode: decision?.reasonCode ?? null,
    },
  };
}

async function isWorkflowRoot(root: string): Promise<boolean> {
  if (await pathIsFile(join(root, 'decision.json')) || await pathIsFile(join(root, 'workflow-outcome.json'))) return true;
  return basename(root).startsWith('problem-agnostic-agent-solution-loop-instance-')
    && await pathIsFile(join(root, 'source/observable-payload.json'));
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

export async function collectWorkflowDecisionAudits(root: string): Promise<Map<string, WorkflowDecisionAuditV1>> {
  const resolvedRoot = resolve(root);
  const audits = new Map<string, WorkflowDecisionAuditV1>();
  for (const workflowRoot of await discoverWorkflowRoots(resolvedRoot)) {
    const identity = relative(resolvedRoot, workflowRoot).split(sep).join('/') || basename(workflowRoot);
    if (audits.has(identity)) throw new Error(`duplicate workflow identity for decision audit: ${identity}`);
    audits.set(identity, await buildWorkflowDecisionAudit({ workflowRoot }));
  }
  return audits;
}

export function attachWorkflowDecisionAudits(
  summaries: WorkflowSummary[],
  audits: Map<string, WorkflowDecisionAuditV1>,
): AuditedWorkflowSummary[] {
  const identities = new Set(summaries.map(summary => summary.identity));
  for (const identity of audits.keys()) {
    if (!identities.has(identity)) throw new Error(`decision audit has no matching workflow summary: ${identity}`);
  }
  return summaries.map(summary => {
    const decisionAudit = audits.get(summary.identity);
    if (!decisionAudit) throw new Error(`workflow summary has no decision audit: ${summary.identity}`);
    return { ...summary, decisionAudit };
  });
}

export function parseWorkflowDecisionAudit(value: unknown, label = 'decisionAudit'): WorkflowDecisionAuditV1 {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  if (value.schemaVersion !== WORKFLOW_DECISION_AUDIT_SCHEMA_VERSION) {
    throw new Error(`${label}.schemaVersion must be ${WORKFLOW_DECISION_AUDIT_SCHEMA_VERSION}`);
  }
  assertExactKeys(value, [
    'schemaVersion',
    'externalFeedback',
    'improvementHypothesis',
    'selection',
    'solution',
    'reviewer',
    'decision',
  ], label);

  const externalFeedback = parseAuditExternalFeedback(value.externalFeedback, `${label}.externalFeedback`);
  const improvementHypothesis = parseAuditHypothesis(value.improvementHypothesis, `${label}.improvementHypothesis`);
  const selection = parseAuditSelection(value.selection, `${label}.selection`);
  const solution = parseAuditSolution(value.solution, `${label}.solution`);
  const reviewer = parseAuditReviewer(value.reviewer, `${label}.reviewer`);
  const decision = parseAuditDecision(value.decision, `${label}.decision`);

  return {
    schemaVersion: WORKFLOW_DECISION_AUDIT_SCHEMA_VERSION,
    externalFeedback,
    improvementHypothesis,
    selection,
    solution,
    reviewer,
    decision,
  };
}

function artifactRef(value: unknown, label: string): string | null {
  return nullableString(value, label);
}

function parseAuditExternalFeedback(
  value: unknown,
  label: string,
): WorkflowDecisionAuditV1['externalFeedback'] {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  assertExactKeys(value, ['status', 'artifactRef', 'overallImpression', 'observations'], label);
  const status = enumValue(value.status, WORKFLOW_AUDIT_STATUSES, `${label}.status`);
  const overallImpression = nullableString(value.overallImpression, `${label}.overallImpression`);
  if (!Array.isArray(value.observations)) throw new Error(`${label}.observations must be an array`);
  const observations = value.observations.map((observation, index) => {
    const observationLabel = `${label}.observations[${index}]`;
    if (!isRecord(observation)) throw new Error(`${observationLabel} must be an object`);
    assertExactKeys(observation, ['feedback', 'evidenceRefs'], observationLabel);
    return {
      feedback: nonEmptyString(observation.feedback, `${observationLabel}.feedback`),
      evidenceRefs: stringArray(observation.evidenceRefs, `${observationLabel}.evidenceRefs`),
    };
  });
  return {
    status,
    artifactRef: artifactRef(value.artifactRef, `${label}.artifactRef`),
    overallImpression,
    observations,
  };
}

function parseAuditAssessment(
  value: unknown,
  label: string,
): NoProblemAssessmentAudit {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  if (value.status === 'recorded') {
    assertExactKeys(value, ['status', 'rationale', 'feedbackRefs', 'evidenceRefs'], label);
    return {
      status: 'recorded',
      rationale: nonEmptyString(value.rationale, `${label}.rationale`),
      feedbackRefs: stringArray(value.feedbackRefs, `${label}.feedbackRefs`),
      evidenceRefs: stringArray(value.evidenceRefs, `${label}.evidenceRefs`),
    };
  }
  if (value.status === 'unavailable') {
    assertExactKeys(value, ['status', 'reason'], label);
    if (value.reason !== 'legacy_contract') throw new Error(`${label}.reason must be legacy_contract`);
    return { status: 'unavailable', reason: 'legacy_contract' };
  }
  if (value.status === 'not_applicable' || value.status === 'missing') {
    assertExactKeys(value, ['status'], label);
    return { status: value.status };
  }
  throw new Error(`${label}.status has invalid value: ${String(value.status)}`);
}

function parseAuditHypothesis(
  value: unknown,
  label: string,
): WorkflowDecisionAuditV1['improvementHypothesis'] {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  assertExactKeys(value, ['status', 'artifactRef', 'hypothesisCount', 'hypotheses', 'noProblemAssessment'], label);
  const status = enumValue(value.status, WORKFLOW_AUDIT_STATUSES, `${label}.status`);
  if (!Array.isArray(value.hypotheses)) throw new Error(`${label}.hypotheses must be an array`);
  let hypotheses: StoredImprovementHypothesisSet['hypotheses'];
  if (value.hypotheses.length === 0) {
    hypotheses = [];
  } else {
    try {
      hypotheses = parseStoredImprovementHypothesisSet(JSON.stringify({
        schemaVersion: IMPROVEMENT_HYPOTHESIS_SET_SCHEMA_VERSION,
        hypotheses: value.hypotheses,
        noProblemAssessment: null,
      })).hypotheses;
    } catch (error) {
      throw new Error(`${label}.hypotheses is invalid: ${String(error)}`);
    }
  }
  const hypothesisCount = value.hypothesisCount === null
    ? null
    : value.hypothesisCount;
  if (hypothesisCount !== null && (
    typeof hypothesisCount !== 'number'
    || !Number.isInteger(hypothesisCount)
    || hypothesisCount < 0
    || hypothesisCount !== hypotheses.length
  )) {
    throw new Error(`${label}.hypothesisCount must equal the hypothesis array length or be null`);
  }
  const noProblemAssessment = parseAuditAssessment(value.noProblemAssessment, `${label}.noProblemAssessment`);
  if (status === 'completed') {
    if (hypothesisCount === null) throw new Error(`${label}.hypothesisCount is required when completed`);
    if (hypothesisCount === 0 && !['recorded', 'unavailable'].includes(noProblemAssessment.status)) {
      throw new Error(`${label}.noProblemAssessment is required for an empty completed hypothesis set`);
    }
    if (hypothesisCount > 0 && noProblemAssessment.status !== 'not_applicable') {
      throw new Error(`${label}.noProblemAssessment must be not_applicable for non-empty hypotheses`);
    }
  }
  return {
    status,
    artifactRef: artifactRef(value.artifactRef, `${label}.artifactRef`),
    hypothesisCount,
    hypotheses,
    noProblemAssessment,
  };
}

function parseAuditSelection(
  value: unknown,
  label: string,
): WorkflowDecisionAuditV1['selection'] {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  assertExactKeys(value, ['status', 'artifactRef', 'selectedHypothesisId'], label);
  const status = enumValue(value.status, SELECTION_AUDIT_STATUSES, `${label}.status`);
  const selectedHypothesisId = nullableString(value.selectedHypothesisId, `${label}.selectedHypothesisId`);
  if (status === 'selected' && selectedHypothesisId === null) {
    throw new Error(`${label}.selectedHypothesisId is required when selected`);
  }
  if (status !== 'selected' && selectedHypothesisId !== null) {
    throw new Error(`${label}.selectedHypothesisId must be null unless selected`);
  }
  return {
    status,
    artifactRef: artifactRef(value.artifactRef, `${label}.artifactRef`),
    selectedHypothesisId,
  };
}

function parseAuditSolution(
  value: unknown,
  label: string,
): WorkflowDecisionAuditV1['solution'] {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  assertExactKeys(value, ['status', 'artifactRef', 'solutionStatus', 'summary', 'recommendedOptionId', 'options'], label);
  const status = enumValue(value.status, WORKFLOW_AUDIT_STATUSES, `${label}.status`);
  const solutionStatus = value.solutionStatus === null
    ? null
    : enumValue(value.solutionStatus, SOLUTION_STATUSES, `${label}.solutionStatus`);
  const summary = nullableString(value.summary, `${label}.summary`);
  const recommendedOptionId = nullableString(value.recommendedOptionId, `${label}.recommendedOptionId`);
  if (!Array.isArray(value.options)) throw new Error(`${label}.options must be an array`);
  if (value.options.length > 3) throw new Error(`${label}.options must contain at most three options`);
  const options = value.options.map((option, index) => {
    const optionLabel = `${label}.options[${index}]`;
    if (!isRecord(option)) throw new Error(`${optionLabel} must be an object`);
    assertExactKeys(option, [
      'optionId',
      'proposedChange',
      'rationale',
      'repoRefs',
      'artifactRefs',
      'changeScope',
      'expectedPlayerObservableDifference',
      'risks',
      'unknowns',
    ], optionLabel);
    const expectedOptionId = `option-${String(index + 1).padStart(6, '0')}`;
    if (option.optionId !== expectedOptionId) throw new Error(`${optionLabel}.optionId must be ${expectedOptionId}`);
    return {
      optionId: expectedOptionId,
      proposedChange: nonEmptyString(option.proposedChange, `${optionLabel}.proposedChange`),
      rationale: nonEmptyString(option.rationale, `${optionLabel}.rationale`),
      repoRefs: stringArray(option.repoRefs, `${optionLabel}.repoRefs`),
      artifactRefs: stringArray(option.artifactRefs, `${optionLabel}.artifactRefs`),
      changeScope: enumValue(option.changeScope, ['configuration', 'program', 'mixed', 'uncertain'] as const, `${optionLabel}.changeScope`),
      expectedPlayerObservableDifference: nonEmptyString(option.expectedPlayerObservableDifference, `${optionLabel}.expectedPlayerObservableDifference`),
      risks: stringArray(option.risks, `${optionLabel}.risks`),
      unknowns: stringArray(option.unknowns, `${optionLabel}.unknowns`),
    };
  });
  if (solutionStatus === 'OPTIONS' && options.length === 0) throw new Error(`${label}.OPTIONS requires options`);
  if (solutionStatus !== null && solutionStatus !== 'OPTIONS' && options.length !== 0) {
    throw new Error(`${label}.${solutionStatus} must not contain options`);
  }
  if (recommendedOptionId !== null && !options.some(option => option.optionId === recommendedOptionId)) {
    throw new Error(`${label}.recommendedOptionId must reference an option`);
  }
  if (solutionStatus !== 'OPTIONS' && recommendedOptionId !== null) {
    throw new Error(`${label}.recommendedOptionId must be null unless solutionStatus is OPTIONS`);
  }
  return {
    status,
    artifactRef: artifactRef(value.artifactRef, `${label}.artifactRef`),
    solutionStatus,
    summary,
    recommendedOptionId,
    options,
  };
}

function parseAuditReviewer(
  value: unknown,
  label: string,
): WorkflowDecisionAuditV1['reviewer'] {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  assertExactKeys(value, ['status', 'artifactRef', 'decision', 'assessment', 'acceptedOptionId', 'scopeAssessment', 'concerns'], label);
  const status = enumValue(value.status, WORKFLOW_AUDIT_STATUSES, `${label}.status`);
  const decision = value.decision === null ? null : enumValue(value.decision, REVIEW_DECISIONS, `${label}.decision`);
  const assessment = nullableString(value.assessment, `${label}.assessment`);
  const acceptedOptionId = nullableString(value.acceptedOptionId, `${label}.acceptedOptionId`);
  const scopeAssessment = value.scopeAssessment === null
    ? null
    : enumValue(value.scopeAssessment, REVIEW_SCOPES, `${label}.scopeAssessment`);
  const concerns = stringArray(value.concerns, `${label}.concerns`);
  if (decision === 'ACCEPT_OPTION') {
    if (acceptedOptionId === null || scopeAssessment === null) throw new Error(`${label}.ACCEPT_OPTION requires accepted option scope fields`);
  } else if (decision !== null && (acceptedOptionId !== null || scopeAssessment !== null)) {
    throw new Error(`${label}.${decision} must not contain accepted option scope fields`);
  }
  return {
    status,
    artifactRef: artifactRef(value.artifactRef, `${label}.artifactRef`),
    decision,
    assessment,
    acceptedOptionId,
    scopeAssessment,
    concerns,
  };
}

function parseAuditDecision(
  value: unknown,
  label: string,
): WorkflowDecisionAuditV1['decision'] {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  assertExactKeys(value, ['status', 'artifactRef', 'route', 'reasonCode'], label);
  const status = enumValue(value.status, ['completed', 'missing'] as const, `${label}.status`);
  const route = value.route === null ? null : enumValue(value.route, SOLUTION_ROUTES, `${label}.route`);
  const reasonCode = value.reasonCode === null ? null : enumValue(value.reasonCode, DECISION_REASON_CODES, `${label}.reasonCode`);
  if (status === 'completed' && (route === null || reasonCode === null)) {
    throw new Error(`${label} requires route and reasonCode when completed`);
  }
  if (status === 'missing' && (route !== null || reasonCode !== null)) {
    throw new Error(`${label} must not contain route or reasonCode when missing`);
  }
  return {
    status,
    artifactRef: artifactRef(value.artifactRef, `${label}.artifactRef`),
    route,
    reasonCode,
  };
}

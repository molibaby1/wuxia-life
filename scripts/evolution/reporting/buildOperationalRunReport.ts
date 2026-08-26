import { mkdir, readdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { validatePhase0RunRef } from '../phase0/provenance';

const WORKFLOW_DIRECTORY_PREFIX = 'problem-agnostic-agent-solution-loop-instance-';
const DEFAULT_ROOT = '.tmp/evolution';
const DEFAULT_OUTPUT_PATH = 'artifacts/reports/auto-evolution-run-report.md';
const TERMINAL_WORKFLOW_SIGNATURE_ARTIFACTS = [
  'decision.json',
  'workflow-outcome.json',
] as const;

const STRUCTURED_ARTIFACTS = [
  'problem-package.json',
  'source/observable-payload.json',
  'selection/selected-hypothesis.json',
  'solution-agent/invocation.json',
  'solution-agent/result.json',
  'solution-agent/failure.json',
  'solution-agent/execution-trace.json',
  'reviewer-agent/invocation.json',
  'reviewer-agent/review.json',
  'reviewer-agent/failure.json',
  'decision.json',
  'workflow-outcome.json',
] as const;

const EXECUTION_TRACE_PATH = 'solution-agent/execution-trace.json';

type FirstAttemptClassification = 'VALID' | 'ENVELOPE_FAILURE' | 'SCHEMA_FAILURE';
type RetransmissionOutcome =
  | 'NOT_ATTEMPTED'
  | 'SUCCEEDED'
  | 'TIMEOUT'
  | 'CONTINUATION_FAILURE'
  | 'RUNTIME_FAILURE'
  | 'ENVELOPE_FAILURE'
  | 'SCHEMA_FAILURE';
type FinalStructuredOutput = 'VALID' | 'FAILED';

export interface StructuredTerminalDeliverySummary {
  firstAttempt: FirstAttemptClassification | null;
  retransmission: RetransmissionOutcome | null;
  finalStructuredOutput: FinalStructuredOutput | null;
}

type JsonRecord = Record<string, unknown>;

export interface BuildOperationalRunReportInput {
  root: string;
  outputPath: string;
}

export interface BuildOperationalRunReportResult {
  reportPath: string;
  workflowCount: number;
}

interface WorkflowSummary {
  identity: string;
  status: string;
  sourceRunRef: string | null;
  problemStatement: string | null;
  solutionStatus: string | null;
  reviewerDecision: string | null;
  terminalRoute: string | null;
  reason: string | null;
  failedStage: string | null;
  participantErrorKind: string | null;
  authoritativeModification: 'NO' | 'UNAVAILABLE';
  lastAvailableArtifact: string | null;
  artifactRefs: string[];
  structuredTerminalDelivery: StructuredTerminalDeliverySummary | null;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function nestedRecord(value: unknown, key: string): JsonRecord | null {
  if (!isRecord(value)) return null;
  return isRecord(value[key]) ? value[key] : null;
}

async function readStructuredArtifact(path: string): Promise<JsonRecord | null> {
  try {
    const artifact = JSON.parse(await readFile(path, 'utf8')) as unknown;
    return isRecord(artifact) ? artifact : null;
  } catch {
    return null;
  }
}

async function readSafeReferencedInvocation(root: string, reference: unknown): Promise<JsonRecord | null> {
  if (typeof reference !== 'string' || reference.length === 0 || reference.includes('\\') || isAbsolute(reference)) {
    return null;
  }

  const resolvedRoot = resolve(root);
  const candidate = resolve(resolvedRoot, reference);
  const relativeCandidate = relative(resolvedRoot, candidate);
  if (
    !relativeCandidate
    || relativeCandidate === '..'
    || relativeCandidate.startsWith(`..${sep}`)
    || isAbsolute(relativeCandidate)
    || basename(candidate) !== 'invocation.json'
  ) {
    return null;
  }

  try {
    const realRoot = await realpath(resolvedRoot);
    const realCandidate = await realpath(candidate);
    const realRelativeCandidate = relative(realRoot, realCandidate);
    if (
      !realRelativeCandidate
      || realRelativeCandidate === '..'
      || realRelativeCandidate.startsWith(`..${sep}`)
      || isAbsolute(realRelativeCandidate)
      || !(await stat(realCandidate)).isFile()
    ) {
      return null;
    }
    return readStructuredArtifact(realCandidate);
  } catch {
    return null;
  }
}

async function sourceRunRefFromParticipantFailure(
  root: string,
  workflowOutcome: JsonRecord | null,
): Promise<string | null> {
  if (workflowOutcome?.outcome !== 'PARTICIPANT_FAILURE' || !Array.isArray(workflowOutcome.failureArtifactRefs)) {
    return null;
  }

  for (const reference of workflowOutcome.failureArtifactRefs) {
    const invocation = await readSafeReferencedInvocation(root, reference);
    if (invocation?.status !== 'failed') continue;
    const runRef = stringValue(invocation.runRef);
    if (runRef === null) continue;
    try {
      return validatePhase0RunRef(runRef);
    } catch {
      // Invalid persisted provenance is not a source ref.
    }
  }
  return null;
}

async function existingArtifactRefs(root: string): Promise<string[]> {
  const refs: string[] = [];
  for (const reference of STRUCTURED_ARTIFACTS) {
    try {
      const artifactPath = join(root, reference);
      if ((await stat(artifactPath)).isFile()) refs.push(reference);
    } catch {
      // Missing artifacts are part of the observable workflow state.
    }
  }
  return refs;
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function isWorkflowRoot(root: string): Promise<boolean> {
  for (const artifact of TERMINAL_WORKFLOW_SIGNATURE_ARTIFACTS) {
    if (await isFile(join(root, artifact))) return true;
  }

  const hasSourceArtifact = await isFile(join(root, 'source/observable-payload.json'));
  if (await isFile(join(root, 'problem-package.json')) && hasSourceArtifact) return true;

  return basename(root).startsWith(WORKFLOW_DIRECTORY_PREFIX) && hasSourceArtifact;
}

async function discoverWorkflowRoots(root: string): Promise<string[]> {
  const resolvedRoot = resolve(root);
  const workflowRoots: string[] = [];

  async function visit(directory: string): Promise<void> {
    if (await isWorkflowRoot(directory)) {
      workflowRoots.push(directory);
      return;
    }

    const entries = (await readdir(directory, { withFileTypes: true }))
      .filter(entry => entry.isDirectory())
      .sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);
    for (const entry of entries) {
      await visit(join(directory, entry.name));
    }
  }

  await visit(resolvedRoot);
  return workflowRoots;
}

function displayWorkflowIdentity(scanRoot: string, workflowRoot: string): string {
  const stableRelativePath = relative(resolve(scanRoot), workflowRoot).split(sep).join('/');
  return stableRelativePath || basename(workflowRoot);
}

function isAttempt(value: unknown): value is 0 | 1 {
  return value === 0 || value === 1;
}

function terminalValidationEvents(trace: JsonRecord): JsonRecord[] {
  if (!Array.isArray(trace.events)) return [];
  return trace.events.filter(event => (
    isRecord(event)
    && event.type === 'participant_terminal_validation'
    && isAttempt(event.attempt)
  ));
}

function retransmissionRequested(trace: JsonRecord): boolean {
  if (!Array.isArray(trace.events)) return false;
  return trace.events.some(event => (
    isRecord(event) && event.type === 'participant_envelope_retransmission_requested'
  ));
}

function retransmissionCompletedEvent(trace: JsonRecord): JsonRecord | null {
  if (!Array.isArray(trace.events)) return null;
  for (const event of trace.events) {
    if (isRecord(event) && event.type === 'participant_envelope_retransmission_completed') {
      return event;
    }
  }
  return null;
}

function classifyFirstAttempt(validation: JsonRecord | undefined): FirstAttemptClassification | null {
  if (validation === undefined) return null;
  if (validation.envelopeValid === false) return 'ENVELOPE_FAILURE';
  if (validation.schemaValid === false) return 'SCHEMA_FAILURE';
  if (validation.envelopeValid === true && validation.schemaValid === true) return 'VALID';
  return null;
}

function mapRuntimeOutcome(
  runtimeOutcome: unknown,
): 'TIMEOUT' | 'CONTINUATION_FAILURE' | 'RUNTIME_FAILURE' | null {
  if (runtimeOutcome === 'TIMEOUT') return 'TIMEOUT';
  if (runtimeOutcome === 'CONTINUATION_FAILURE') return 'CONTINUATION_FAILURE';
  if (runtimeOutcome === 'RUNTIME_FAILURE') return 'RUNTIME_FAILURE';
  return null;
}

function deriveRetransmissionOutcome(
  trace: JsonRecord,
  attempt1Validation: JsonRecord | undefined,
): RetransmissionOutcome {
  if (!retransmissionRequested(trace)) return 'NOT_ATTEMPTED';

  const completed = retransmissionCompletedEvent(trace);
  if (completed === null) return 'NOT_ATTEMPTED';

  if (completed.runtimeOutcome !== 'COMPLETED') {
    return mapRuntimeOutcome(completed.runtimeOutcome) ?? 'RUNTIME_FAILURE';
  }

  if (attempt1Validation === undefined) return 'RUNTIME_FAILURE';
  if (attempt1Validation.envelopeValid === false) return 'ENVELOPE_FAILURE';
  if (attempt1Validation.schemaValid === false) return 'SCHEMA_FAILURE';
  if (attempt1Validation.envelopeValid === true && attempt1Validation.schemaValid === true) {
    return 'SUCCEEDED';
  }
  return 'RUNTIME_FAILURE';
}

function deriveFinalStructuredOutput(validations: JsonRecord[]): FinalStructuredOutput | null {
  if (validations.some(validation => validation.accepted === true)) return 'VALID';
  if (validations.length > 0) return 'FAILED';
  return null;
}

function summarizeStructuredTerminalDelivery(trace: JsonRecord | null): StructuredTerminalDeliverySummary | null {
  if (trace === null || trace.schemaVersion !== 'participant-execution-trace-v1') return null;

  const validations = terminalValidationEvents(trace);
  if (validations.length === 0) return null;

  const attempt0Validation = validations.find(validation => validation.attempt === 0);
  const attempt1Validation = validations.find(validation => validation.attempt === 1);
  const firstAttempt = classifyFirstAttempt(attempt0Validation);
  const retransmission = deriveRetransmissionOutcome(trace, attempt1Validation);
  const finalStructuredOutput = deriveFinalStructuredOutput(validations);

  if (firstAttempt === null && retransmission === 'NOT_ATTEMPTED' && finalStructuredOutput === null) {
    return null;
  }

  return {
    firstAttempt,
    retransmission,
    finalStructuredOutput,
  };
}

interface StructuredTerminalAggregateCounts {
  firstPassStructuredOutputSuccesses: number;
  firstPassEnvelopeFailures: number;
  retransmissionsAttempted: number;
  retransmissionsSucceeded: number;
  finalStructuredOutputSuccesses: number;
}

function aggregateStructuredTerminalDelivery(
  summaries: WorkflowSummary[],
): StructuredTerminalAggregateCounts | null {
  const observed = summaries
    .map(summary => summary.structuredTerminalDelivery)
    .filter((summary): summary is StructuredTerminalDeliverySummary => summary !== null);
  if (observed.length === 0) return null;

  return {
    firstPassStructuredOutputSuccesses: observed.filter(summary => (
      summary.firstAttempt === 'VALID' && summary.finalStructuredOutput === 'VALID'
    )).length,
    firstPassEnvelopeFailures: observed.filter(summary => summary.firstAttempt === 'ENVELOPE_FAILURE').length,
    retransmissionsAttempted: observed.filter(summary => (
      summary.retransmission !== null && summary.retransmission !== 'NOT_ATTEMPTED'
    )).length,
    retransmissionsSucceeded: observed.filter(summary => summary.retransmission === 'SUCCEEDED').length,
    finalStructuredOutputSuccesses: observed.filter(summary => summary.finalStructuredOutput === 'VALID').length,
  };
}

async function summarizeWorkflow(root: string, identity: string): Promise<WorkflowSummary> {
  const problemPackage = await readStructuredArtifact(join(root, 'problem-package.json'));
  const solution = await readStructuredArtifact(join(root, 'solution-agent/result.json'));
  const reviewer = await readStructuredArtifact(join(root, 'reviewer-agent/review.json'));
  const decision = await readStructuredArtifact(join(root, 'decision.json'));
  const workflowOutcome = await readStructuredArtifact(join(root, 'workflow-outcome.json'));
  const artifactRefs = await existingArtifactRefs(root);
  const problem = nestedRecord(problemPackage, 'problem');
  const source = nestedRecord(problemPackage, 'source');
  const permissions = nestedRecord(problemPackage, 'permissions');
  const decisionInputs = nestedRecord(decision, 'inputs');

  const outcome = stringValue(workflowOutcome?.outcome);
  const route = stringValue(workflowOutcome?.route) ?? stringValue(decision?.route);
  const status = outcome ?? route ?? 'INCOMPLETE';
  const authoritativeModification = outcome === 'PARTICIPANT_FAILURE'
    ? 'NO'
    : permissions?.authoritativeProductWrite === false
    && permissions.productExecution === false
      ? 'NO'
      : 'UNAVAILABLE';
  const fallbackSourceRunRef = await sourceRunRefFromParticipantFailure(root, workflowOutcome);
  const executionTrace = await readStructuredArtifact(join(root, EXECUTION_TRACE_PATH));
  const structuredTerminalDelivery = summarizeStructuredTerminalDelivery(executionTrace);

  return {
    identity,
    status,
    sourceRunRef: stringValue(source?.runRef) ?? fallbackSourceRunRef,
    problemStatement: stringValue(problem?.statement),
    solutionStatus: stringValue(solution?.status) ?? stringValue(solution?.kind),
    reviewerDecision: stringValue(reviewer?.decision) ?? stringValue(decisionInputs?.reviewerDecision),
    terminalRoute: route,
    reason: stringValue(decision?.reasonCode),
    failedStage: stringValue(workflowOutcome?.failedStage),
    participantErrorKind: stringValue(workflowOutcome?.participantErrorKind),
    authoritativeModification,
    lastAvailableArtifact: artifactRefs.at(-1) ?? null,
    artifactRefs,
    structuredTerminalDelivery,
  };
}

function renderOptionalLine(label: string, value: string | null): string[] {
  return value === null ? [] : [`- ${label}: ${value}`];
}

function renderWorkflow(summary: WorkflowSummary, index: number): string[] {
  const lines = [
    `## ${index}. ${summary.identity}`,
    '',
    `- Status: ${summary.status}`,
    ...renderOptionalLine('Source run ref', summary.sourceRunRef),
    ...renderOptionalLine('Problem statement', summary.problemStatement),
    ...renderOptionalLine('Solution status / result kind', summary.solutionStatus),
    ...renderOptionalLine('Reviewer decision', summary.reviewerDecision),
  ];

  if (summary.terminalRoute === null) {
    lines.push('- Terminal outcome: NOT RECORDED');
  } else {
    lines.push(`- Terminal route / workflow outcome: ${summary.terminalRoute}`);
  }
  lines.push(...renderOptionalLine('Reason', summary.reason));
  lines.push(...renderOptionalLine('Failed stage', summary.failedStage));
  lines.push(...renderOptionalLine('Participant error kind', summary.participantErrorKind));
  lines.push(`- Authoritative modification in this workflow: ${summary.authoritativeModification}`);

  if (summary.structuredTerminalDelivery !== null) {
    lines.push('', '### Structured terminal delivery', '');
    if (summary.structuredTerminalDelivery.firstAttempt !== null) {
      lines.push(`- First attempt: ${summary.structuredTerminalDelivery.firstAttempt}`);
    }
    if (summary.structuredTerminalDelivery.retransmission !== null) {
      lines.push(`- Bounded retransmission: ${summary.structuredTerminalDelivery.retransmission}`);
    }
    if (summary.structuredTerminalDelivery.finalStructuredOutput !== null) {
      lines.push(`- Final structured output: ${summary.structuredTerminalDelivery.finalStructuredOutput}`);
    }
  }

  if (summary.status === 'READY_FOR_CONFIG_EXECUTION') {
    lines.push('- Accepted configuration work is ready for separately authorized execution.');
  }
  if (summary.status === 'INCOMPLETE') {
    lines.push(...renderOptionalLine('Last available artifact', summary.lastAvailableArtifact));
  }

  lines.push('', '### Relevant artifact references', '');
  if (summary.artifactRefs.length === 0) {
    lines.push('- unavailable');
  } else {
    lines.push(...summary.artifactRefs.map(reference => `- ${reference}`));
  }
  lines.push('');
  return lines;
}

function renderReport(summaries: WorkflowSummary[]): string {
  const aggregateCounts = aggregateStructuredTerminalDelivery(summaries);
  const headerLines = [
    '# Auto Evolution Run Report',
    '',
    `Observed workflow runs: ${summaries.length}`,
  ];

  if (aggregateCounts !== null) {
    headerLines.push(
      '',
      '## Structured terminal delivery aggregates',
      '',
      `- First-pass structured-output successes: ${aggregateCounts.firstPassStructuredOutputSuccesses}`,
      `- First-pass envelope failures: ${aggregateCounts.firstPassEnvelopeFailures}`,
      `- Retransmissions attempted: ${aggregateCounts.retransmissionsAttempted}`,
      `- Retransmissions succeeded: ${aggregateCounts.retransmissionsSucceeded}`,
      `- Final structured-output successes: ${aggregateCounts.finalStructuredOutputSuccesses}`,
    );
  }

  return [
    ...headerLines,
    '',
    ...summaries.flatMap((summary, index) => renderWorkflow(summary, index + 1)),
  ].join('\n');
}

export async function buildOperationalRunReport(
  input: BuildOperationalRunReportInput,
): Promise<BuildOperationalRunReportResult> {
  const workflowRoots = await discoverWorkflowRoots(input.root);
  const summaries = await Promise.all(workflowRoots.map(root => (
    summarizeWorkflow(root, displayWorkflowIdentity(input.root, root))
  )));
  const report = renderReport(summaries);
  await mkdir(dirname(resolve(input.outputPath)), { recursive: true });
  await writeFile(input.outputPath, report, 'utf8');
  return { reportPath: input.outputPath, workflowCount: summaries.length };
}

function parseArgs(args: string[]): BuildOperationalRunReportInput {
  let root = DEFAULT_ROOT;
  let outputPath = DEFAULT_OUTPUT_PATH;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--root' || argument === '--output') {
      const value = args[index + 1];
      if (!value) throw new Error(`${argument} requires a path`);
      if (argument === '--root') root = value;
      else outputPath = value;
      index += 1;
      continue;
    }
    throw new Error(`unknown argument: ${argument}`);
  }
  return { root, outputPath };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildOperationalRunReport(parseArgs(process.argv.slice(2)))
    .then(result => {
      console.log(`Observed workflow runs: ${result.workflowCount}`);
      console.log(`Wrote ${result.reportPath}`);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

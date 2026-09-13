import { execFileSync } from 'node:child_process';
import { lstat, mkdir, open, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
  parseStoredImprovementHypothesisSet,
  type ImprovementHypothesis,
} from '../../../src/evolution/improvementHypothesisContract';
import { canonicalJson, sha256Hex } from '../phase0/provenance';

const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export const SELECTION_PRIORITY_REPLAY_CASE_SCHEMA = 'ae-selection-priority-replay-case-v1' as const;
export const SELECTION_PRIORITY_REPLAY_PRESENTATION_SCHEMA = 'ae-selection-priority-replay-presentation-v1' as const;
export const SELECTION_PRIORITY_REPLAY_RESULT_SCHEMA = 'ae-selection-replay-result-v1' as const;

export type SelectionPriorityReplaySourceKind =
  | 'retained_hypothesis_artifact'
  | 'operational_report_projection';

export interface SelectionPriorityReplayCaseManifest {
  schemaVersion: typeof SELECTION_PRIORITY_REPLAY_CASE_SCHEMA;
  caseId: string;
  sessionId: string;
  sourceKind: SelectionPriorityReplaySourceKind;
  sourceRef: 'source/hypotheses.json';
  sourceSha256: string;
  sourceHistoricalRef: string | null;
  sourceReportRef: string;
  sourceReportSha256: string;
  sourceReportJsonPointer: '/workflows/0/decisionAudit/improvementHypothesis';
  hypothesisCount: number;
  historicalSelectedHypothesisId: string;
}

export type SelectionPriorityReplayCandidate = Omit<ImprovementHypothesis, 'hypothesisId'> & {
  presentationIndex: number;
  sourceIndex: number;
  sourceHypothesisId: string;
  sourceHypothesisSha256: string;
};

export type SelectionPriorityReplayOrder = 'original' | 'reversed';

export interface SelectionPriorityReplayPresentation {
  schemaVersion: typeof SELECTION_PRIORITY_REPLAY_PRESENTATION_SCHEMA;
  caseId: string;
  presentationId: string;
  order: SelectionPriorityReplayOrder;
  sourceHypothesesSha256: string;
  candidates: SelectionPriorityReplayCandidate[];
  presentationSha256: string;
}

export interface SelectionPriorityReplayResult {
  schemaVersion: typeof SELECTION_PRIORITY_REPLAY_RESULT_SCHEMA;
  caseId: string;
  presentationId: string;
  sourceHypothesesSha256: string;
  presentationSha256: string;
  selected: {
    sourceIndex: number;
    sourceHypothesisId: string;
    sourceHypothesisSha256: string;
  };
  rationale: {
    productMateriality: string;
    evidenceReadiness: string;
    investigationLeverage: string;
    problemSpecificity: string;
    overallReason: string;
  };
  createdAt: string;
}

export interface BuildSelectionPriorityReplayCaseInput {
  caseId: string;
  sessionId: string;
  sourcePath?: string;
  sourceHistoricalRef?: string;
  reportPath?: string;
  sourceReportRef: string;
  outputRoot: string;
}

export interface BuiltSelectionPriorityReplayCase {
  outputPath: string;
  caseManifest: SelectionPriorityReplayCaseManifest;
  original: SelectionPriorityReplayPresentation;
  reversed: SelectionPriorityReplayPresentation;
}

export interface SelectionPriorityReplayCorpusManifest {
  schemaVersion: 'ae-selection-priority-replay-corpus-v1';
  repositoryBranch: string;
  repositoryHead: string;
  caseCount: number;
  cases: Array<{ caseId: string; caseRef: string }>;
  ordinarySessionsExecuted: false;
  participantInvocationsExecuted: false;
  productionSelectionModified: false;
}

interface ReportHypothesisSource {
  hypotheses: unknown[];
  selectedHypothesisId: string;
}

interface FixedCorpusCase {
  sessionId: string;
  sourcePath?: string;
  sourceHistoricalRef?: string;
  reportPath?: string;
  sourceReportRef: string;
}

export const SELECTION_PRIORITY_REPLAY_FIXED_CORPUS: readonly FixedCorpusCase[] = [
  {
    sessionId: 'ordinary-run-20260909-000001',
    reportPath: 'artifacts/evolution/run-reports/ae-report-558d77abf4524696/report.json',
    sourceReportRef: 'artifacts/evolution/run-reports/ae-report-558d77abf4524696/report.json',
  },
  {
    sessionId: 'ordinary-run-20260909-000003',
    sourcePath: 'artifacts/evolution/human-follow-up/items/item-7494a607f91d48d428c0999901e3659c14a1b936fbedf0c7059af4867a022ade/evidence/hypothesis-runs/ordinary-run-20260909-000003/hypotheses.json',
    sourceHistoricalRef: 'artifacts/evolution/human-follow-up/items/item-7494a607f91d48d428c0999901e3659c14a1b936fbedf0c7059af4867a022ade/evidence/hypothesis-runs/ordinary-run-20260909-000003/hypotheses.json',
    reportPath: 'artifacts/evolution/run-reports/ae-report-817156e45a642225/report.json',
    sourceReportRef: 'artifacts/evolution/run-reports/ae-report-817156e45a642225/report.json',
  },
  {
    sessionId: 'ordinary-run-20260910-000005',
    sourcePath: 'artifacts/evolution/fixed-cases/ordinary-run-20260910-000005-round-1/input/artifacts/hypothesis-runs/ordinary-run-20260910-000005/hypotheses.json',
    sourceHistoricalRef: 'artifacts/evolution/fixed-cases/ordinary-run-20260910-000005-round-1/input/artifacts/hypothesis-runs/ordinary-run-20260910-000005/hypotheses.json',
    reportPath: 'artifacts/evolution/run-reports/ae-report-75cd46054a69ad80/report.json',
    sourceReportRef: 'artifacts/evolution/run-reports/ae-report-75cd46054a69ad80/report.json',
  },
  {
    sessionId: 'ordinary-run-20260910-000006',
    sourcePath: 'artifacts/evolution/fixed-cases/ordinary-run-20260910-000006-round-1/input/artifacts/hypothesis-runs/ordinary-run-20260910-000006/hypotheses.json',
    sourceHistoricalRef: 'artifacts/evolution/fixed-cases/ordinary-run-20260910-000006-round-1/input/artifacts/hypothesis-runs/ordinary-run-20260910-000006/hypotheses.json',
    reportPath: 'artifacts/evolution/run-reports/ae-report-0b95509246cd82d6/report.json',
    sourceReportRef: 'artifacts/evolution/run-reports/ae-report-0b95509246cd82d6/report.json',
  },
  {
    sessionId: 'ordinary-run-20260910-000007',
    sourcePath: 'artifacts/evolution/fixed-cases/ordinary-run-20260910-000007-round-1/input/artifacts/hypothesis-runs/ordinary-run-20260910-000007/hypotheses.json',
    sourceHistoricalRef: 'artifacts/evolution/fixed-cases/ordinary-run-20260910-000007-round-1/input/artifacts/hypothesis-runs/ordinary-run-20260910-000007/hypotheses.json',
    reportPath: 'artifacts/evolution/run-reports/ae-report-ea0fbb02c6d22422/report.json',
    sourceReportRef: 'artifacts/evolution/run-reports/ae-report-ea0fbb02c6d22422/report.json',
  },
  {
    sessionId: 'ordinary-run-20260911-000001',
    reportPath: 'artifacts/evolution/run-reports/ae-report-a80bd131f1b8ad6f/report.json',
    sourceReportRef: 'artifacts/evolution/run-reports/ae-report-a80bd131f1b8ad6f/report.json',
  },
  {
    sessionId: 'ordinary-run-20260911-000002',
    reportPath: 'artifacts/evolution/run-reports/ae-report-1192046673b1ab2e/report.json',
    sourceReportRef: 'artifacts/evolution/run-reports/ae-report-1192046673b1ab2e/report.json',
  },
  {
    sessionId: 'ordinary-run-20260911-000003',
    sourcePath: 'artifacts/evolution/human-follow-up/items/item-69fb68e9de3676b65e4b387afb2c5544eefb16fddb7686d3aee1b3ac4c4b948a/evidence/hypothesis-runs/ordinary-run-20260911-000003/hypotheses.json',
    sourceHistoricalRef: 'artifacts/evolution/human-follow-up/items/item-69fb68e9de3676b65e4b387afb2c5544eefb16fddb7686d3aee1b3ac4c4b948a/evidence/hypothesis-runs/ordinary-run-20260911-000003/hypotheses.json',
    reportPath: 'artifacts/evolution/run-reports/ae-report-6098afd31aea3b09/report.json',
    sourceReportRef: 'artifacts/evolution/run-reports/ae-report-6098afd31aea3b09/report.json',
  },
];

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) throw new Error(`${label} contains unknown field: ${key}`);
  }
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function sha256(value: unknown, label: string): string {
  const result = nonEmptyString(value, label);
  if (!SHA256_PATTERN.test(result)) throw new Error(`${label} must be a SHA-256 hex string`);
  return result;
}

function integer(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return value;
}

function parseJson(raw: string, label: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`${label} must be valid JSON`);
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    const stat = await lstat(path);
    if (!stat.isFile()) throw new Error(`source must be a regular file: ${path}`);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function writeCreateOnly(path: string, bytes: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(bytes);
  } finally {
    await handle.close();
  }
}

async function assertAbsent(paths: readonly string[]): Promise<void> {
  for (const path of paths) {
    try {
      await lstat(path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw error;
    }
    throw new Error(`experimental artifact already exists: ${path}`);
  }
}

const SOURCE_REPORT_JSON_POINTER = '/workflows/0/decisionAudit/improvementHypothesis' as const;

function reportHypotheses(
  reportBytes: string,
  reportPath: string,
  sessionId: string,
): ReportHypothesisSource {
  const report = parseJson(reportBytes, `source report ${reportPath}`);
  assertObject(report, `source report ${reportPath}`);
  if (!Array.isArray(report.workflows) || report.workflows.length === 0) {
    throw new Error(`source report ${reportPath} must contain workflows[0]`);
  }
  assertObject(report.workflows[0], `${reportPath}.workflows[0]`);
  if (report.workflows[0].sourceRunRef !== sessionId) {
    throw new Error(`${reportPath}.workflows[0].sourceRunRef does not match ${sessionId}`);
  }
  if (report.sessionExecution !== undefined) {
    assertObject(report.sessionExecution, `${reportPath}.sessionExecution`);
    if (
      report.sessionExecution.multiRoundRunRef !== undefined
      && report.sessionExecution.multiRoundRunRef !== sessionId
    ) {
      throw new Error(`${reportPath}.sessionExecution.multiRoundRunRef does not match ${sessionId}`);
    }
  }
  const audit = report.workflows[0].decisionAudit;
  assertObject(audit, `${reportPath}.workflows[0].decisionAudit`);
  const improvementHypothesis = audit.improvementHypothesis;
  assertObject(improvementHypothesis, `${reportPath}.decisionAudit.improvementHypothesis`);
  if (improvementHypothesis.status !== 'completed') {
    throw new Error(`${reportPath}.decisionAudit.improvementHypothesis.status must be completed`);
  }
  if (!Array.isArray(improvementHypothesis.hypotheses)) {
    throw new Error(`${reportPath}.decisionAudit.improvementHypothesis.hypotheses must be an array`);
  }
  if (
    typeof improvementHypothesis.hypothesisCount !== 'number'
    || !Number.isInteger(improvementHypothesis.hypothesisCount)
    || improvementHypothesis.hypothesisCount <= 0
  ) {
    throw new Error(`${reportPath}.decisionAudit.improvementHypothesis.hypothesisCount must be a positive integer`);
  }
  if (improvementHypothesis.hypothesisCount !== improvementHypothesis.hypotheses.length) {
    throw new Error(`${reportPath}.hypothesisCount does not match hypotheses length`);
  }
  const selection = audit.selection;
  assertObject(selection, `${reportPath}.workflows[0].decisionAudit.selection`);
  const selectedHypothesisId = nonEmptyString(
    selection.selectedHypothesisId,
    `${reportPath}.workflows[0].decisionAudit.selection.selectedHypothesisId`,
  );
  return { hypotheses: improvementHypothesis.hypotheses, selectedHypothesisId };
}

function projectionBytes(reportSource: ReportHypothesisSource): string {
  const projected = {
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: reportSource.hypotheses,
    noProblemAssessment: null,
  };
  parseStoredImprovementHypothesisSet(canonicalJson(projected));
  return `${canonicalJson(projected)}\n`;
}

async function resolveSource(input: BuildSelectionPriorityReplayCaseInput): Promise<{
  bytes: string;
  sourceKind: SelectionPriorityReplaySourceKind;
  sourceHistoricalRef: string | null;
  reportBytes: string;
  reportRef: string;
  historicalSelectedHypothesisId: string;
}> {
  if (!input.reportPath) throw new Error('reportPath is required');
  const sourceReportRef = nonEmptyString(input.sourceReportRef, 'sourceReportRef');

  const exactExists = input.sourcePath ? await fileExists(input.sourcePath) : false;
  const reportBytes = await readFile(input.reportPath, 'utf8');
  const reportSource = reportHypotheses(reportBytes, input.reportPath, input.sessionId);
  const reportSet = parseStoredImprovementHypothesisSet(projectionBytes(reportSource));
  const selectedHypothesisId = reportSource.selectedHypothesisId;
  if (!reportSet.hypotheses.some(hypothesis => hypothesis.hypothesisId === selectedHypothesisId)) {
    throw new Error(`historical selection references unknown hypothesis: ${selectedHypothesisId}`);
  }

  if (exactExists) {
    const bytes = await readFile(input.sourcePath!, 'utf8');
    const exactSet = parseStoredImprovementHypothesisSet(bytes);
    if (exactSet.hypotheses.length === 0) throw new Error('historical hypothesis set must not be empty');
    if (canonicalJson(exactSet.hypotheses) !== canonicalJson(reportSet.hypotheses)) {
      throw new Error('historical source and report projection semantic fields do not match');
    }
    const sourceHistoricalRef = nonEmptyString(input.sourceHistoricalRef, 'sourceHistoricalRef');
    return {
      bytes,
      sourceKind: 'retained_hypothesis_artifact',
      sourceHistoricalRef,
      reportBytes,
      reportRef: sourceReportRef,
      historicalSelectedHypothesisId: selectedHypothesisId,
    };
  }

  const bytes = projectionBytes(reportSource);
  const projectedSet = parseStoredImprovementHypothesisSet(bytes);
  if (projectedSet.hypotheses.length === 0) throw new Error('projected hypothesis set must not be empty');
  return {
    bytes,
    sourceKind: 'operational_report_projection',
    sourceHistoricalRef: null,
    reportBytes,
    reportRef: sourceReportRef,
    historicalSelectedHypothesisId: selectedHypothesisId,
  };
}

function candidatesFromSource(sourceBytes: string): SelectionPriorityReplayCandidate[] {
  const set = parseStoredImprovementHypothesisSet(sourceBytes);
  return set.hypotheses.map((hypothesis, sourceIndex) => {
    const { hypothesisId, ...semantic } = hypothesis;
    return {
      presentationIndex: sourceIndex,
      sourceIndex,
      sourceHypothesisId: hypothesisId,
      sourceHypothesisSha256: sha256Hex(canonicalJson(hypothesis)),
      ...semantic,
    };
  });
}

export function buildSelectionPriorityReplayPresentation(input: {
  caseId: string;
  presentationId: string;
  order: SelectionPriorityReplayOrder;
  sourceHypothesesSha256: string;
  candidates: readonly SelectionPriorityReplayCandidate[];
}): SelectionPriorityReplayPresentation {
  const candidates = input.candidates.map((candidate, presentationIndex) => ({
    ...candidate,
    presentationIndex,
  }));
  const unsigned = {
    schemaVersion: SELECTION_PRIORITY_REPLAY_PRESENTATION_SCHEMA,
    caseId: input.caseId,
    presentationId: input.presentationId,
    order: input.order,
    sourceHypothesesSha256: input.sourceHypothesesSha256,
    candidates,
  };
  return {
    ...unsigned,
    presentationSha256: sha256Hex(canonicalJson(unsigned)),
  };
}

export async function buildSelectionPriorityReplayCase(
  input: BuildSelectionPriorityReplayCaseInput,
): Promise<BuiltSelectionPriorityReplayCase> {
  const resolved = await resolveSource(input);
  const sourceSha256 = sha256Hex(resolved.bytes);
  const candidates = candidatesFromSource(resolved.bytes);
  const outputPath = resolve(input.outputRoot, input.caseId);
  const sourceOutputPath = join(outputPath, 'source', 'hypotheses.json');
  const casePath = join(outputPath, 'case.json');
  const originalPath = join(outputPath, 'presentations', 'original.json');
  const reversedPath = join(outputPath, 'presentations', 'reversed.json');
  await assertAbsent([casePath, sourceOutputPath, originalPath, reversedPath]);

  const caseManifest: SelectionPriorityReplayCaseManifest = {
    schemaVersion: SELECTION_PRIORITY_REPLAY_CASE_SCHEMA,
    caseId: input.caseId,
    sessionId: input.sessionId,
    sourceKind: resolved.sourceKind,
    sourceRef: 'source/hypotheses.json',
    sourceSha256,
    sourceHistoricalRef: resolved.sourceHistoricalRef,
    sourceReportRef: resolved.reportRef,
    sourceReportSha256: sha256Hex(resolved.reportBytes),
    sourceReportJsonPointer: SOURCE_REPORT_JSON_POINTER,
    hypothesisCount: candidates.length,
    historicalSelectedHypothesisId: resolved.historicalSelectedHypothesisId,
  };
  const original = buildSelectionPriorityReplayPresentation({
    caseId: input.caseId,
    presentationId: `${input.caseId}-original`,
    order: 'original',
    sourceHypothesesSha256: sourceSha256,
    candidates,
  });
  const reversed = buildSelectionPriorityReplayPresentation({
    caseId: input.caseId,
    presentationId: `${input.caseId}-reversed`,
    order: 'reversed',
    sourceHypothesesSha256: sourceSha256,
    candidates: [...candidates].reverse(),
  });

  await writeCreateOnly(sourceOutputPath, resolved.bytes);
  await writeCreateOnly(casePath, `${canonicalJson(caseManifest)}\n`);
  await writeCreateOnly(originalPath, `${canonicalJson(original)}\n`);
  await writeCreateOnly(reversedPath, `${canonicalJson(reversed)}\n`);
  return { outputPath, caseManifest, original, reversed };
}

export async function prepareSelectionPriorityReplayCorpus(options: {
  repoRoot?: string;
  outputRoot: string;
}): Promise<BuiltSelectionPriorityReplayCase[]> {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const outputRoot = resolve(options.outputRoot);
  const corpusPath = join(outputRoot, 'corpus.json');
  await assertAbsent([corpusPath]);
  const repositoryBranch = execFileSync('git', ['branch', '--show-current'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  const repositoryHead = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  if (!repositoryBranch) throw new Error('repository branch must be populated');
  if (!/^[a-f0-9]{40}$/.test(repositoryHead)) throw new Error('repository HEAD must be a commit SHA');
  const results: BuiltSelectionPriorityReplayCase[] = [];
  for (const corpusCase of SELECTION_PRIORITY_REPLAY_FIXED_CORPUS) {
    results.push(await buildSelectionPriorityReplayCase({
      caseId: corpusCase.sessionId,
      sessionId: corpusCase.sessionId,
      sourcePath: corpusCase.sourcePath ? resolve(repoRoot, corpusCase.sourcePath) : undefined,
      sourceHistoricalRef: corpusCase.sourceHistoricalRef,
      reportPath: corpusCase.reportPath ? resolve(repoRoot, corpusCase.reportPath) : undefined,
      sourceReportRef: corpusCase.sourceReportRef,
      outputRoot,
    }));
  }
  const corpusManifest: SelectionPriorityReplayCorpusManifest = {
    schemaVersion: 'ae-selection-priority-replay-corpus-v1',
    repositoryBranch,
    repositoryHead,
    caseCount: results.length,
    cases: results.map(result => ({
      caseId: result.caseManifest.caseId,
      caseRef: `${result.caseManifest.caseId}/case.json`,
    })),
    ordinarySessionsExecuted: false,
    participantInvocationsExecuted: false,
    productionSelectionModified: false,
  };
  await writeCreateOnly(corpusPath, `${canonicalJson(corpusManifest)}\n`);
  return results;
}

export function parseSelectionPriorityReplayResult(
  rawResult: string,
  presentation: SelectionPriorityReplayPresentation,
): SelectionPriorityReplayResult {
  const parsed = parseJson(rawResult, 'selection replay result');
  assertObject(parsed, 'selection replay result');
  assertExactKeys(parsed, [
    'schemaVersion', 'caseId', 'presentationId', 'sourceHypothesesSha256',
    'presentationSha256', 'selected', 'rationale', 'createdAt',
  ], 'selection replay result');
  if (parsed.schemaVersion !== SELECTION_PRIORITY_REPLAY_RESULT_SCHEMA) {
    throw new Error(`schemaVersion must be ${SELECTION_PRIORITY_REPLAY_RESULT_SCHEMA}`);
  }
  const caseId = nonEmptyString(parsed.caseId, 'caseId');
  const presentationId = nonEmptyString(parsed.presentationId, 'presentationId');
  const sourceHypothesesSha256 = sha256(parsed.sourceHypothesesSha256, 'sourceHypothesesSha256');
  const presentationSha256 = sha256(parsed.presentationSha256, 'presentationSha256');
  if (caseId !== presentation.caseId) throw new Error('result caseId does not match presentation');
  if (presentationId !== presentation.presentationId) throw new Error('result presentationId does not match presentation');
  if (sourceHypothesesSha256 !== presentation.sourceHypothesesSha256) {
    throw new Error('result sourceHypothesesSha256 does not match presentation');
  }
  const { presentationSha256: declaredPresentationSha256, ...unsignedPresentation } = presentation;
  if (declaredPresentationSha256 !== sha256Hex(canonicalJson(unsignedPresentation))) {
    throw new Error('presentation hash does not match presentation content');
  }
  if (presentationSha256 !== presentation.presentationSha256) {
    throw new Error('result presentationSha256 does not match presentation');
  }

  assertObject(parsed.selected, 'selected');
  assertExactKeys(parsed.selected, ['sourceIndex', 'sourceHypothesisId', 'sourceHypothesisSha256'], 'selected');
  const sourceIndex = integer(parsed.selected.sourceIndex, 'selected.sourceIndex');
  const sourceHypothesisId = nonEmptyString(parsed.selected.sourceHypothesisId, 'selected.sourceHypothesisId');
  const sourceHypothesisSha256 = sha256(parsed.selected.sourceHypothesisSha256, 'selected.sourceHypothesisSha256');
  const candidate = presentation.candidates.find(item => item.sourceIndex === sourceIndex);
  if (candidate === undefined) throw new Error('selected candidate does not exist in presentation');
  if (candidate.sourceHypothesisId !== sourceHypothesisId || candidate.sourceHypothesisSha256 !== sourceHypothesisSha256) {
    throw new Error('selected candidate identity or hash does not match presentation');
  }

  assertObject(parsed.rationale, 'rationale');
  assertExactKeys(parsed.rationale, [
    'productMateriality', 'evidenceReadiness', 'investigationLeverage',
    'problemSpecificity', 'overallReason',
  ], 'rationale');
  const rationale = {
    productMateriality: nonEmptyString(parsed.rationale.productMateriality, 'rationale.productMateriality'),
    evidenceReadiness: nonEmptyString(parsed.rationale.evidenceReadiness, 'rationale.evidenceReadiness'),
    investigationLeverage: nonEmptyString(parsed.rationale.investigationLeverage, 'rationale.investigationLeverage'),
    problemSpecificity: nonEmptyString(parsed.rationale.problemSpecificity, 'rationale.problemSpecificity'),
    overallReason: nonEmptyString(parsed.rationale.overallReason, 'rationale.overallReason'),
  };
  return {
    schemaVersion: SELECTION_PRIORITY_REPLAY_RESULT_SCHEMA,
    caseId,
    presentationId,
    sourceHypothesesSha256,
    presentationSha256,
    selected: { sourceIndex, sourceHypothesisId, sourceHypothesisSha256 },
    rationale,
    createdAt: nonEmptyString(parsed.createdAt, 'createdAt'),
  };
}

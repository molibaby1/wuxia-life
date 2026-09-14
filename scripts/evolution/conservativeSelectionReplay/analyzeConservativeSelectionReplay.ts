import { lstat, mkdir, open, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
  CONSERVATIVE_SELECTION_RESULT_SCHEMA,
  type ConservativeSelectionCandidate,
  type ConservativeSelectionInput,
  type ConservativeSelectionMapping,
  type ConservativeSelectionTrustedResult,
} from './conservativeSelectionContracts';
import type { ConservativeSelectionExperimentManifest, ConservativeSelectionJobManifest } from './prepareConservativeSelectionReplay';
import type { ConservativeSelectionExecutionSummary } from './runConservativeSelectionReplay';
import { canonicalJson, sha256Hex } from '../phase0/provenance';

export interface ConservativeSelectionAnalysisItem {
  job: Pick<ConservativeSelectionJobManifest, 'jobId' | 'invocationOrdinal' | 'caseId' | 'presentationId' | 'sampleOrdinal'>;
  result: ConservativeSelectionTrustedResult;
  input: ConservativeSelectionInput;
  mapping: ConservativeSelectionMapping;
}

export interface ConservativeSelectionDiagnosticMachineSummary {
  schemaVersion: 'ae-conservative-selection-diagnostic-machine-summary-v1';
  experimentSha256: string;
  executionSha256: string;
  plannedJobCount: number;
  validDecisionCount: number;
  participantContractFailureCount: number;
  technicalFailureCount: number;
  technicalSufficiency: { pass: boolean; reasons: string[]; validPairCount: number };
  perCase: Array<{
    caseId: string;
    validDecisionCount: number;
    decisionDistribution: Record<string, number>;
    presentations: Array<{ presentationId: 'original' | 'reversed'; validDecisionCount: number; decisionDistribution: Record<string, number> }>;
  }>;
  pairwisePermutation: Array<{
    caseId: string;
    sampleOrdinal: number;
    originalJobId: string | null;
    reversedJobId: string | null;
    originalDecision: string | null;
    reversedDecision: string | null;
    agreement: boolean | null;
  }>;
  permutationGate: { pass: boolean; validPairCount: number; agreementCount: number };
  protection000005: { pass: boolean; validCount: number; keepBaselineCount: number };
  concentration000007: { pass: boolean; validCount: number; decisionDistribution: Record<string, number>; maxCount: number };
  overrideCount: number;
  overrideAuditRequired: boolean;
  ordinarySessionsExecuted: false;
  productionSelectionModified: false;
}

export interface ConservativeSelectionHumanAuditRequest {
  schemaVersion: 'ae-conservative-selection-human-audit-request-v1';
  items: Array<{ auditId: string; baseline: ConservativeSelectionCandidate; challenger: ConservativeSelectionCandidate }>;
}

export interface ConservativeSelectionHumanAuditMapping {
  schemaVersion: 'ae-conservative-selection-human-audit-mapping-v1';
  items: Array<{ auditId: string; jobId: string; baselineSourceHypothesisSha256: string; challengerSourceHypothesisSha256: string }>;
}

export interface ConservativeSelectionDiagnosticBuildResult {
  machineSummary: ConservativeSelectionDiagnosticMachineSummary;
  humanAuditRequest: ConservativeSelectionHumanAuditRequest;
  humanAuditMapping: ConservativeSelectionHumanAuditMapping;
}

const CASES = [
  'ordinary-run-20260910-000005',
  'ordinary-run-20260910-000006',
  'ordinary-run-20260910-000007',
  'ordinary-run-20260911-000002',
] as const;

export function sourceDecisionKey(result: ConservativeSelectionTrustedResult): string {
  if (result.decision === 'KEEP_BASELINE') return 'KEEP_BASELINE';
  if (result.decision === 'NO_CLEAR_PREFERENCE') return 'NO_CLEAR_PREFERENCE';
  if (!result.selected) throw new Error('OVERRIDE result must have a selected candidate');
  return `OVERRIDE:${result.selected.sourceHypothesisSha256}`;
}

function countBy(values: readonly string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}

function candidateFor(input: ConservativeSelectionInput, ref: string): ConservativeSelectionCandidate {
  const candidate = input.candidates.find(item => item.candidateRef === ref);
  if (!candidate) throw new Error(`input candidate is absent: ${ref}`);
  return {
    candidateRef: candidate.candidateRef,
    hypothesis: candidate.hypothesis,
    observedBasis: candidate.observedBasis,
    feedbackRefs: [...candidate.feedbackRefs],
    evidenceRefs: [...candidate.evidenceRefs],
    ...(candidate.patternEvidenceRefs !== undefined ? { patternEvidenceRefs: [...candidate.patternEvidenceRefs] } : {}),
    unknowns: [...candidate.unknowns],
    productSignificance: candidate.productSignificance,
  };
}

export function buildConservativeSelectionDiagnostic(input: {
  experimentSha256: string;
  executionSha256: string;
  plannedJobCount: number;
  items: ConservativeSelectionAnalysisItem[];
  executionCounts: { participantContractFailureCount: number; technicalFailureCount: number };
}): ConservativeSelectionDiagnosticBuildResult {
  const byKey = new Map(input.items.map(item => [`${item.job.caseId}:${item.job.presentationId}:${item.job.sampleOrdinal}`, item]));
  const pairwisePermutation = [] as ConservativeSelectionDiagnosticMachineSummary['pairwisePermutation'];
  for (const caseId of CASES) {
    for (const sampleOrdinal of [1, 2, 3]) {
      const original = byKey.get(`${caseId}:original:${sampleOrdinal}`);
      const reversed = byKey.get(`${caseId}:reversed:${sampleOrdinal}`);
      const originalDecision = original ? sourceDecisionKey(original.result) : null;
      const reversedDecision = reversed ? sourceDecisionKey(reversed.result) : null;
      pairwisePermutation.push({
        caseId,
        sampleOrdinal,
        originalJobId: original?.job.jobId ?? null,
        reversedJobId: reversed?.job.jobId ?? null,
        originalDecision,
        reversedDecision,
        agreement: originalDecision === null || reversedDecision === null
          ? null
          : originalDecision === reversedDecision,
      });
    }
  }
  const validPairCount = pairwisePermutation.filter(pair => pair.agreement !== null).length;
  const agreementCount = pairwisePermutation.filter(pair => pair.agreement === true).length;
  const perCase = CASES.map(caseId => {
    const caseItems = input.items.filter(item => item.job.caseId === caseId);
    const presentations = (['original', 'reversed'] as const).map(presentationId => {
      const values = caseItems.filter(item => item.job.presentationId === presentationId).map(item => sourceDecisionKey(item.result));
      return { presentationId, validDecisionCount: values.length, decisionDistribution: countBy(values) };
    });
    const values = caseItems.map(item => sourceDecisionKey(item.result));
    return { caseId, validDecisionCount: values.length, decisionDistribution: countBy(values), presentations };
  });
  const protectionValues = input.items.filter(item => item.job.caseId === CASES[0]).map(item => item.result);
  const keepBaselineCount = protectionValues.filter(result => result.decision === 'KEEP_BASELINE').length;
  const concentrationValues = input.items.filter(item => item.job.caseId === CASES[2]).map(item => sourceDecisionKey(item.result));
  const concentrationDistribution = countBy(concentrationValues);
  const maxCount = Object.values(concentrationDistribution).length === 0 ? 0 : Math.max(...Object.values(concentrationDistribution));
  const reasons: string[] = [];
  for (const item of perCase.flatMap(caseSummary => caseSummary.presentations)) {
    if (item.validDecisionCount < 2) reasons.push(`${item.presentationId} has fewer than 2 valid decisions`);
  }
  if (validPairCount < 10) reasons.push('fewer than 10 valid original/reversed pairs remain');
  if (protectionValues.length < 5) reasons.push('000005 has fewer than 5 valid decisions');
  const overrideItems = input.items.filter(item => item.result.decision === 'OVERRIDE');
  const auditItems = overrideItems.map((item, index) => {
    const selected = item.result.selected;
    if (!selected) throw new Error(`override ${item.job.jobId} has no selected candidate`);
    const baselineMapping = item.mapping.candidates.find(candidate => candidate.isBaseline);
    if (!baselineMapping) throw new Error(`override ${item.job.jobId} has no baseline mapping`);
    return {
      auditId: `audit-${String(index + 1).padStart(3, '0')}`,
      baseline: candidateFor(item.input, baselineMapping.candidateRef),
      challenger: candidateFor(item.input, selected.candidateRef),
      baselineSourceHypothesisSha256: baselineMapping.sourceHypothesisSha256,
      challengerSourceHypothesisSha256: selected.sourceHypothesisSha256,
      jobId: item.job.jobId,
    };
  });
  return {
    machineSummary: {
      schemaVersion: 'ae-conservative-selection-diagnostic-machine-summary-v1',
      experimentSha256: input.experimentSha256,
      executionSha256: input.executionSha256,
      plannedJobCount: input.plannedJobCount,
      validDecisionCount: input.items.length,
      participantContractFailureCount: input.executionCounts.participantContractFailureCount,
      technicalFailureCount: input.executionCounts.technicalFailureCount,
      technicalSufficiency: { pass: reasons.length === 0, reasons, validPairCount },
      perCase,
      pairwisePermutation,
      permutationGate: { pass: validPairCount >= 10 && agreementCount >= 10, validPairCount, agreementCount },
      protection000005: { pass: protectionValues.length >= 5 && keepBaselineCount >= 5, validCount: protectionValues.length, keepBaselineCount },
      concentration000007: { pass: maxCount >= 5, validCount: concentrationValues.length, decisionDistribution: concentrationDistribution, maxCount },
      overrideCount: overrideItems.length,
      overrideAuditRequired: overrideItems.length > 0,
      ordinarySessionsExecuted: false,
      productionSelectionModified: false,
    },
    humanAuditRequest: {
      schemaVersion: 'ae-conservative-selection-human-audit-request-v1',
      items: auditItems.map(({ auditId, baseline, challenger }) => ({ auditId, baseline, challenger })),
    },
    humanAuditMapping: {
      schemaVersion: 'ae-conservative-selection-human-audit-mapping-v1',
      items: auditItems.map(({ auditId, jobId, baselineSourceHypothesisSha256, challengerSourceHypothesisSha256 }) => ({ auditId, jobId, baselineSourceHypothesisSha256, challengerSourceHypothesisSha256 })),
    },
  };
}

async function writeCreateOnly(path: string, bytes: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try { await handle.writeFile(bytes); } finally { await handle.close(); }
}

async function assertAbsent(path: string): Promise<void> {
  try { await lstat(path); } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`diagnostic artifact already exists: ${path}`);
}

export async function analyzeConservativeSelectionReplay(options: { repoRoot?: string; experimentRoot: string }): Promise<ConservativeSelectionDiagnosticBuildResult> {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const experimentRoot = resolve(options.experimentRoot);
  const experimentBytes = await readFile(join(experimentRoot, 'experiment.json'), 'utf8');
  const executionBytes = await readFile(join(experimentRoot, 'execution.json'), 'utf8');
  const experiment = JSON.parse(experimentBytes) as ConservativeSelectionExperimentManifest;
  const execution = JSON.parse(executionBytes) as ConservativeSelectionExecutionSummary;
  const items: ConservativeSelectionAnalysisItem[] = [];
  for (const executionJob of execution.jobs) {
    if (executionJob.terminalStatus !== 'success') continue;
    const job = experiment.jobs.find(item => item.jobId === executionJob.jobId);
    if (!job) throw new Error(`execution job absent from experiment: ${executionJob.jobId}`);
    const input = JSON.parse(await readFile(join(experimentRoot, job.blindInputRef), 'utf8')) as ConservativeSelectionInput;
    const mapping = JSON.parse(await readFile(join(experimentRoot, job.mappingRef), 'utf8')) as ConservativeSelectionMapping;
    const result = JSON.parse(await readFile(join(experimentRoot, `jobs/${job.jobId}/result.json`), 'utf8')) as ConservativeSelectionTrustedResult;
    if (result.schemaVersion !== CONSERVATIVE_SELECTION_RESULT_SCHEMA) throw new Error(`invalid trusted result: ${job.jobId}`);
    items.push({ job, result, input, mapping });
  }
  const built = buildConservativeSelectionDiagnostic({
    experimentSha256: sha256Hex(experimentBytes),
    executionSha256: sha256Hex(executionBytes),
    plannedJobCount: experiment.jobCount,
    items,
    executionCounts: execution,
  });
  await assertAbsent(join(experimentRoot, 'diagnostic-machine-summary.json'));
  await assertAbsent(join(experimentRoot, 'human-audit-request.json'));
  await assertAbsent(join(experimentRoot, 'human-audit-mapping.json'));
  await writeCreateOnly(join(experimentRoot, 'diagnostic-machine-summary.json'), `${canonicalJson(built.machineSummary)}\n`);
  await writeCreateOnly(join(experimentRoot, 'human-audit-request.json'), `${canonicalJson(built.humanAuditRequest)}\n`);
  await writeCreateOnly(join(experimentRoot, 'human-audit-mapping.json'), `${canonicalJson(built.humanAuditMapping)}\n`);
  return built;
}

function argumentValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

if (process.argv[1]?.endsWith('analyzeConservativeSelectionReplay.ts')) {
  const repoRoot = argumentValue(process.argv.slice(2), '--repo-root') ?? process.cwd();
  const experimentRoot = argumentValue(process.argv.slice(2), '--experiment-root')
    ?? join(repoRoot, 'artifacts/ae-conservative-selection-override-replay-v1-20260914');
  analyzeConservativeSelectionReplay({ repoRoot, experimentRoot })
    .then(summary => console.log(`analyzed ${summary.machineSummary.validDecisionCount} valid decisions; ${summary.machineSummary.overrideCount} overrides`))
    .catch(error => { console.error(error); process.exitCode = 1; });
}

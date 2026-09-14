import { execFileSync } from 'node:child_process';
import { lstat, mkdir, open, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { ConservativeSelectionDiagnosticMachineSummary, ConservativeSelectionHumanAuditMapping, ConservativeSelectionHumanAuditRequest } from './analyzeConservativeSelectionReplay';
import type { ConservativeSelectionExecutionSummary } from './runConservativeSelectionReplay';
import { canonicalJson, sha256Hex } from '../phase0/provenance';

export interface ConservativeSelectionHumanAuditResponse {
  schemaVersion: 'ae-conservative-selection-human-audit-response-v1';
  items: Array<{
    auditId: string;
    verdict: 'SUPPORTED_OVERRIDE' | 'UNSUPPORTED_OVERRIDE' | 'INCONCLUSIVE';
    answers: {
      baselineInvestigationEligible: boolean;
      challengerInvestigationEligible: boolean;
      materiallySuperiorForSlot: boolean;
      superiorityNotBroadMaterialityOnly: boolean;
      challengerStillBounded: boolean;
      givingUpBaselineJustified: boolean;
    };
    note: string;
  }>;
}

export type ConservativeSelectionTerminalVerdict =
  | 'CONSERVATIVE_OVERRIDE_SUPPORTED_ON_DIAGNOSTIC_CORPUS'
  | 'CONSERVATIVE_OVERRIDE_NOT_SUPPORTED'
  | 'INCONCLUSIVE_TECHNICAL';

const RESPONSE_KEYS = ['schemaVersion', 'items'] as const;
const ITEM_KEYS = ['auditId', 'verdict', 'answers', 'note'] as const;
const ANSWER_KEYS = [
  'baselineInvestigationEligible', 'challengerInvestigationEligible', 'materiallySuperiorForSlot',
  'superiorityNotBroadMaterialityOnly', 'challengerStillBounded', 'givingUpBaselineJustified',
] as const;

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${label} must be an object`);
}

function assertExactKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) if (!allowedSet.has(key)) throw new Error(`${label} contains unknown field: ${key}`);
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function boolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${label} must be a boolean`);
  return value;
}

export function validateConservativeSelectionHumanAuditResponse(
  raw: unknown,
  request: ConservativeSelectionHumanAuditRequest,
): ConservativeSelectionHumanAuditResponse {
  assertObject(raw, 'human audit response');
  assertExactKeys(raw, RESPONSE_KEYS, 'human audit response');
  if (raw.schemaVersion !== 'ae-conservative-selection-human-audit-response-v1') throw new Error('human audit response schemaVersion is invalid');
  if (!Array.isArray(raw.items)) throw new Error('human audit response items must be an array');
  const requested = new Set(request.items.map(item => item.auditId));
  const seen = new Set<string>();
  const items = raw.items.map((rawItem, index) => {
    assertObject(rawItem, `human audit response.items[${index}]`);
    assertExactKeys(rawItem, ITEM_KEYS, `human audit response.items[${index}]`);
    const auditId = nonEmptyString(rawItem.auditId, `human audit response.items[${index}].auditId`);
    if (!requested.has(auditId)) throw new Error(`unknown auditId: ${auditId}`);
    if (seen.has(auditId)) throw new Error(`duplicate auditId: ${auditId}`);
    seen.add(auditId);
    const verdict = rawItem.verdict;
    if (verdict !== 'SUPPORTED_OVERRIDE' && verdict !== 'UNSUPPORTED_OVERRIDE' && verdict !== 'INCONCLUSIVE') throw new Error(`invalid audit verdict: ${auditId}`);
    assertObject(rawItem.answers, `human audit response.items[${index}].answers`);
    assertExactKeys(rawItem.answers, ANSWER_KEYS, `human audit response.items[${index}].answers`);
    const answers = Object.fromEntries(ANSWER_KEYS.map(key => [key, boolean(rawItem.answers[key], `answers.${key}`)])) as ConservativeSelectionHumanAuditResponse['items'][number]['answers'];
    return { auditId, verdict, answers, note: nonEmptyString(rawItem.note, `human audit response.items[${index}].note`) };
  });
  if (seen.size !== requested.size) throw new Error('human audit response does not cover every requested auditId');
  return { schemaVersion: 'ae-conservative-selection-human-audit-response-v1', items };
}

export function determineConservativeSelectionTerminalVerdict(
  machineSummary: ConservativeSelectionDiagnosticMachineSummary,
  audits: Array<{ verdict: string }>,
  humanSemanticVerdict: 'supported' | 'not-supported' | undefined,
  humanSemanticNote: string,
): ConservativeSelectionTerminalVerdict {
  if (!machineSummary.technicalSufficiency.pass) return 'INCONCLUSIVE_TECHNICAL';
  if (!machineSummary.protection000005.pass || !machineSummary.permutationGate.pass || !machineSummary.concentration000007.pass) {
    return 'CONSERVATIVE_OVERRIDE_NOT_SUPPORTED';
  }
  if (audits.some(audit => audit.verdict === 'UNSUPPORTED_OVERRIDE')) return 'CONSERVATIVE_OVERRIDE_NOT_SUPPORTED';
  if (humanSemanticVerdict !== 'supported' && humanSemanticVerdict !== 'not-supported') throw new Error('human semantic verdict is required');
  if (typeof humanSemanticNote !== 'string' || humanSemanticNote.length === 0) throw new Error('human semantic note is required');
  return humanSemanticVerdict === 'supported'
    ? 'CONSERVATIVE_OVERRIDE_SUPPORTED_ON_DIAGNOSTIC_CORPUS'
    : 'CONSERVATIVE_OVERRIDE_NOT_SUPPORTED';
}

export interface ConservativeSelectionDiagnosticSummary {
  schemaVersion: 'ae-conservative-selection-diagnostic-summary-v1';
  repositoryBranch: string;
  repositoryHead: string;
  gitStatusShort: string;
  sourceCorpusSha256: string;
  experimentSha256: string;
  systemPromptSha256: string;
  plannedJobCount: number;
  validDecisionCount: number;
  participantContractFailureCount: number;
  technicalFailureCount: number;
  retriedJobCount: number;
  totalHttpAttempts: number;
  retryDetails: Array<{ jobId: string; reasons: string[] }>;
  perCase: ConservativeSelectionDiagnosticMachineSummary['perCase'];
  pairwisePermutation: ConservativeSelectionDiagnosticMachineSummary['pairwisePermutation'];
  protection000005: ConservativeSelectionDiagnosticMachineSummary['protection000005'];
  concentration000007: ConservativeSelectionDiagnosticMachineSummary['concentration000007'];
  permutationGate: ConservativeSelectionDiagnosticMachineSummary['permutationGate'];
  technicalSufficiency: ConservativeSelectionDiagnosticMachineSummary['technicalSufficiency'];
  overrideCount: number;
  humanOverrideAudits: ConservativeSelectionHumanAuditResponse['items'];
  humanSemanticVerdict: 'supported' | 'not-supported' | null;
  humanSemanticNote: string | null;
  terminalVerdict: ConservativeSelectionTerminalVerdict;
  ordinarySessionsExecuted: false;
  productionSelectionModified: false;
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
  throw new Error(`diagnostic summary already exists: ${path}`);
}

function gitText(repoRoot: string, args: string[]): string {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
}

export async function finalizeConservativeSelectionReplay(options: {
  repoRoot?: string;
  experimentRoot: string;
  humanAuditPath: string;
  humanSemanticVerdict?: 'supported' | 'not-supported';
  humanSemanticNote?: string;
}): Promise<ConservativeSelectionDiagnosticSummary> {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const experimentRoot = resolve(options.experimentRoot);
  const experimentBytes = await readFile(join(experimentRoot, 'experiment.json'), 'utf8');
  const executionBytes = await readFile(join(experimentRoot, 'execution.json'), 'utf8');
  const machine = JSON.parse(await readFile(join(experimentRoot, 'diagnostic-machine-summary.json'), 'utf8')) as ConservativeSelectionDiagnosticMachineSummary;
  const request = JSON.parse(await readFile(join(experimentRoot, 'human-audit-request.json'), 'utf8')) as ConservativeSelectionHumanAuditRequest;
  const mapping = JSON.parse(await readFile(join(experimentRoot, 'human-audit-mapping.json'), 'utf8')) as ConservativeSelectionHumanAuditMapping;
  if (mapping.schemaVersion !== 'ae-conservative-selection-human-audit-mapping-v1') throw new Error('human audit mapping schemaVersion is invalid');
  if (!Array.isArray(mapping.items)) throw new Error('human audit mapping items must be an array');
  const requestIds = new Set(request.items.map(item => item.auditId));
  const mappingIds = new Set(mapping.items.map(item => item.auditId));
  if (mappingIds.size !== mapping.items.length || mappingIds.size !== requestIds.size || [...requestIds].some(id => !mappingIds.has(id))) {
    throw new Error('human audit mapping does not cover the audit request exactly');
  }
  const humanResponse = validateConservativeSelectionHumanAuditResponse(JSON.parse(await readFile(resolve(options.humanAuditPath), 'utf8')) as unknown, request);
  const execution = JSON.parse(executionBytes) as ConservativeSelectionExecutionSummary;
  const experiment = JSON.parse(experimentBytes) as { repositoryBranch: string; repositoryHead: string; sourceCorpusSha256: string; systemPromptSha256: string };
  const terminalVerdict = determineConservativeSelectionTerminalVerdict(machine, humanResponse.items, options.humanSemanticVerdict, options.humanSemanticNote ?? '');
  const summary: ConservativeSelectionDiagnosticSummary = {
    schemaVersion: 'ae-conservative-selection-diagnostic-summary-v1',
    repositoryBranch: experiment.repositoryBranch,
    repositoryHead: experiment.repositoryHead,
    gitStatusShort: gitText(repoRoot, ['status', '--short']),
    sourceCorpusSha256: experiment.sourceCorpusSha256,
    experimentSha256: sha256Hex(experimentBytes),
    systemPromptSha256: experiment.systemPromptSha256,
    plannedJobCount: machine.plannedJobCount,
    validDecisionCount: machine.validDecisionCount,
    participantContractFailureCount: execution.participantContractFailureCount,
    technicalFailureCount: execution.technicalFailureCount,
    retriedJobCount: execution.retriedJobCount,
    totalHttpAttempts: execution.totalHttpAttempts,
    retryDetails: execution.jobs.filter(job => job.retried).map(job => ({ jobId: job.jobId, reasons: job.retryReasons })),
    perCase: machine.perCase,
    pairwisePermutation: machine.pairwisePermutation,
    protection000005: machine.protection000005,
    concentration000007: machine.concentration000007,
    permutationGate: machine.permutationGate,
    technicalSufficiency: machine.technicalSufficiency,
    overrideCount: machine.overrideCount,
    humanOverrideAudits: humanResponse.items,
    humanSemanticVerdict: options.humanSemanticVerdict ?? null,
    humanSemanticNote: options.humanSemanticNote ?? null,
    terminalVerdict,
    ordinarySessionsExecuted: false,
    productionSelectionModified: false,
  };
  await assertAbsent(join(experimentRoot, 'diagnostic-summary.json'));
  await writeCreateOnly(join(experimentRoot, 'diagnostic-summary.json'), `${canonicalJson(summary)}\n`);
  return summary;
}

function argumentValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

if (process.argv[1]?.endsWith('finalizeConservativeSelectionReplay.ts')) {
  const args = process.argv.slice(2);
  const repoRoot = argumentValue(args, '--repo-root') ?? process.cwd();
  const experimentRoot = argumentValue(args, '--experiment-root') ?? join(repoRoot, 'artifacts/ae-conservative-selection-override-replay-v1-20260914');
  const humanAuditPath = argumentValue(args, '--human-audit');
  const humanSemanticVerdict = argumentValue(args, '--human-semantic-verdict') as 'supported' | 'not-supported' | undefined;
  const humanSemanticNote = argumentValue(args, '--human-semantic-note');
  if (!humanAuditPath) {
    console.error('--human-audit is required');
    process.exitCode = 1;
  } else {
    finalizeConservativeSelectionReplay({ repoRoot, experimentRoot, humanAuditPath, humanSemanticVerdict, humanSemanticNote })
      .then(summary => console.log(`finalized: ${summary.terminalVerdict}`))
      .catch(error => { console.error(error); process.exitCode = 1; });
  }
}

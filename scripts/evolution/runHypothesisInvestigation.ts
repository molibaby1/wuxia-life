import { open, lstat, mkdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  parseHypothesisInvestigationResult,
  validateHypothesisInvestigationReferences,
  type HypothesisInvestigationResult,
  type InvestigationStatement,
} from '../../src/evolution/hypothesisInvestigationContract';
import {
  buildInvestigationEvidence,
  investigationEvidenceRefs,
  type CohortEvidenceInput,
  type InvestigationEvidenceMode,
  type InvestigationEvidencePack,
} from './hypothesisInvestigation/buildInvestigationEvidence';
import type { ExperiencePatternEvidence } from '../../src/evolution/experiencePatternEvidenceContract';
import {
  DEEPSEEK_HYPOTHESIS_INVESTIGATION_MODEL,
  invokeDeepSeekHypothesisInvestigation,
  type DeepSeekHypothesisInvestigationFailure,
  type DeepSeekHypothesisInvestigationSuccess,
} from './hypothesisInvestigation/deepseekHypothesisInvestigation';
import {
  loadHypothesisInvestigationSource,
  type HypothesisInvestigationSource,
} from './hypothesisInvestigation/loadHypothesisInvestigationSource';
import {
  canonicalJson,
  resolvePhase0RunPath,
  sha256Hex,
  validatePhase0RunRef,
} from './phase0/provenance';

const DEFAULT_MEF_SOURCE_ROOT = 'artifacts/reports/evolution/minimal-external-feedback';
const DEFAULT_HYPOTHESIS_SOURCE_ROOT = 'artifacts/reports/evolution/improvement-hypothesis';
const DEFAULT_OUT_ROOT = 'artifacts/reports/evolution/hypothesis-investigation';
const DIRECT_INVOCATION_SCHEMA_VERSION = 'hypothesis-investigation-invocation-v1' as const;
const LONGITUDINAL_INVOCATION_SCHEMA_VERSION = 'hypothesis-investigation-invocation-v2' as const;
const COHORT_INVOCATION_SCHEMA_VERSION = 'hypothesis-investigation-invocation-v3' as const;
const HYPOTHESIS_ID_PATTERN = /^hypothesis-\d{6}$/;
const DOTENV_PATH = resolve(process.cwd(), '.env');
const SEALED_LONGITUDINAL_EVIDENCE_HASH =
  'eef9feac4b9df40d1d490b9db9c275d42cc2cff2b5392a4beee8301d5bc376d6';

/** ponytail: tiny KEY=VALUE loader; no multiline/escape support — upgrade to dotenv if needed */
async function loadDotEnvIfPresent(path = DOTENV_PATH): Promise<void> {
  try {
    const text = await readFile(path, 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

export interface RunHypothesisInvestigationOptions {
  runRef: string;
  hypothesisId: string;
  mefSourceRoot?: string;
  hypothesisSourceRoot?: string;
  outRoot?: string;
  evidenceMode?: InvestigationEvidenceMode;
  cohortEvidence?: CohortEvidenceInput;
  patternEvidence?: ExperiencePatternEvidence;
  sealedLongitudinalEvidenceHash?: string;
  apiKey: string;
}

export interface RunHypothesisInvestigationTestHooks {
  invoke?: typeof invokeDeepSeekHypothesisInvestigation;
}

export interface RunHypothesisInvestigationResult {
  runRef: string;
  hypothesisId: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  investigationInvocationRef: string;
  investigationDir: string;
  humanReportPath: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  feedbackHash: string;
  patternEvidenceHash?: string;
  hypothesesHash: string;
  selectedHypothesisHash: string;
  evidencePackHash: string;
  status: 'completed' | 'failed';
}

interface InvestigationParticipant {
  kind: 'llm';
  provider: 'deepseek';
  modelRequested: typeof DEEPSEEK_HYPOTHESIS_INVESTIGATION_MODEL;
  modelReturned?: string;
  providerResponseId?: string;
}

interface HypothesisInvestigationInvocationRecord {
  schemaVersion:
    | typeof DIRECT_INVOCATION_SCHEMA_VERSION
    | typeof LONGITUDINAL_INVOCATION_SCHEMA_VERSION
    | typeof COHORT_INVOCATION_SCHEMA_VERSION;
  evidenceMode?: 'longitudinal-v1' | 'cohort-v1';
  runRef: string;
  hypothesisId: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  investigationInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  feedbackHash: string;
  patternEvidenceHash?: string;
  hypothesesHash: string;
  selectedHypothesisHash: string;
  evidencePackHash: string;
  participant: InvestigationParticipant;
  status: 'completed' | 'failed';
  errorKind?: 'provider' | 'parse' | 'invalid_reference';
}

async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function assertTargetAbsent(path: string, label: string): Promise<void> {
  if (await exists(path)) {
    throw new Error(`${label} already exists: ${path}`);
  }
}

async function writeCreateOnly(path: string, bytes: string | Uint8Array): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(bytes);
  } finally {
    await handle.close();
  }
}

function requireApiKey(apiKey: string): string {
  if (!apiKey.trim()) throw new Error('apiKey must not be empty');
  return apiKey;
}

function validateHypothesisId(hypothesisId: string): string {
  if (!HYPOTHESIS_ID_PATTERN.test(hypothesisId)) {
    throw new Error(`invalid hypothesisId: ${hypothesisId}`);
  }
  return hypothesisId;
}

function buildParticipant(
  invokeResult?: DeepSeekHypothesisInvestigationSuccess,
): InvestigationParticipant {
  return {
    kind: 'llm',
    provider: 'deepseek',
    modelRequested: DEEPSEEK_HYPOTHESIS_INVESTIGATION_MODEL,
    ...(invokeResult
      ? {
        modelReturned: invokeResult.model,
        providerResponseId: invokeResult.responseId,
      }
      : {}),
  };
}

function renderStatements(
  title: string,
  statements: InvestigationStatement[],
): string[] {
  if (statements.length === 0) {
    return [`## ${title}`, '', '（无）', ''];
  }
  return [
    `## ${title}`,
    '',
    ...statements.flatMap((item, index) => [
      `### ${index + 1}`,
      item.statement,
      ...item.evidenceRefs.map(ref => `- evidence: ${ref}`),
      '',
    ]),
  ];
}

function renderHumanReview(input: {
  runRef: string;
  hypothesisId: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  investigationInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  feedbackHash: string;
  patternEvidenceHash?: string;
  hypothesesHash: string;
  selectedHypothesisHash: string;
  evidencePackHash: string;
  status: 'completed' | 'failed';
  errorKind?: string;
  participant: InvestigationParticipant;
  source: HypothesisInvestigationSource;
  evidencePack: InvestigationEvidencePack;
  rawParticipantResponse?: string;
  investigation?: HypothesisInvestigationResult;
}): string {
  const selected = input.source.selectedHypothesis;
  const sections = [
    '# Human Review — Hypothesis Investigation',
    '',
    `- runRef: ${input.runRef}`,
    `- selected hypothesis: ${input.hypothesisId}`,
    `- feedbackInvocationRef: ${input.feedbackInvocationRef}`,
    `- hypothesisInvocationRef: ${input.hypothesisInvocationRef}`,
    `- investigationInvocationRef: ${input.investigationInvocationRef}`,
    `- experimentRootHash: ${input.experimentRootHash}`,
    `- observablePayloadHash: ${input.observablePayloadHash}`,
    `- feedbackHash: ${input.feedbackHash}`,
    ...(input.patternEvidenceHash
      ? [`- patternEvidenceHash: ${input.patternEvidenceHash}`]
      : []),
    `- hypothesesHash: ${input.hypothesesHash}`,
    `- selectedHypothesisHash: ${input.selectedHypothesisHash}`,
    `- evidencePackHash: ${input.evidencePackHash}`,
    `- provider: ${input.participant.provider}`,
    `- modelRequested: ${input.participant.modelRequested}`,
    ...(input.participant.modelReturned
      ? [`- modelReturned: ${input.participant.modelReturned}`]
      : []),
    `- status: ${input.status}`,
    ...(input.errorKind ? [`- errorKind: ${input.errorKind}`] : []),
    '',
    'Investigation 是对一条 Human-selected hypothesis 的只读客观调查。',
    'investigation ≠ hypothesis verdict。',
    '相关机制 ≠ proven root cause。',
    '任何 Human decision ≠ modification authorization。',
    '本 successor STOP。',
    '',
    '## Selected hypothesis',
    '',
    selected.hypothesis,
    '',
    '### Observed basis',
    selected.observedBasis,
    '',
    '### Unknowns',
    ...selected.unknowns.map(item => `- ${item}`),
    '',
    '## Source-run vs current-product',
    '',
    `- storyLines: ${input.evidencePack.storyLines.join(', ') || '（无）'}`,
    `- source-run authority: sealed Phase 0 artifacts for this run`,
    `- current-product authority: current runtime catalog slice labeled separately`,
    '',
  ];

  if (input.rawParticipantResponse !== undefined) {
    sections.push(
      '## 原始 participant response',
      '',
      '```',
      input.rawParticipantResponse,
      '```',
      '',
    );
  } else {
    sections.push('## 原始 participant response', '', '（无）', '');
  }

  if (input.status === 'completed' && input.investigation) {
    sections.push(
      ...renderStatements('Confirmed facts / 已确认事实', input.investigation.confirmedFacts),
      ...renderStatements('Relevant mechanisms / 相关机制', input.investigation.relevantMechanisms),
      ...renderStatements(
        'Limiting / contradictory evidence / 限制性 evidence',
        input.investigation.limitingEvidence,
      ),
      '## Unresolved questions / 仍未知',
      '',
      ...(input.investigation.unresolvedQuestions.length === 0
        ? ['（无）']
        : input.investigation.unresolvedQuestions.map(item => `- ${item}`)),
      '',
      '## Evidence gaps / 证据缺口',
      '',
      ...(input.investigation.evidenceGaps.length === 0
        ? ['（无）']
        : input.investigation.evidenceGaps.map(item => `- ${item}`)),
      '',
    );
  }

  sections.push(
    '## Human decision',
    '',
    '- 值得进入后续产品决策',
    '- 需要更多 evidence',
    '- 暂不继续',
    '',
    '以上选项都不是 hypothesis truth verdict，也不构成 modification / candidate / Verifier 授权。',
    '',
    '## STOP boundary',
    '',
    '本 successor 在 investigation artifact + Human review 后 STOP；',
    '不得自动进入 modification proposal、candidate、Verifier、promotion 或 second investigation。',
    '',
    'STOP',
    '',
  );

  return sections.join('\n');
}

async function saveRawResponses(
  investigationDir: string,
  invokeResult: DeepSeekHypothesisInvestigationSuccess | DeepSeekHypothesisInvestigationFailure,
): Promise<void> {
  if (invokeResult.rawProviderResponse !== undefined) {
    await writeCreateOnly(
      join(investigationDir, 'raw-provider-response.txt'),
      invokeResult.rawProviderResponse,
    );
  }
  if (invokeResult.ok) {
    await writeCreateOnly(
      join(investigationDir, 'raw-participant-response.txt'),
      invokeResult.rawParticipantResponse,
    );
  }
}

async function persistFailure(input: {
  investigationDir: string;
  record: HypothesisInvestigationInvocationRecord;
  source: HypothesisInvestigationSource;
  evidencePack: InvestigationEvidencePack;
  rawParticipantResponse?: string;
}): Promise<string> {
  const humanReportPath = join(input.investigationDir, 'human-review.md');
  await writeCreateOnly(join(input.investigationDir, 'invocation.json'), canonicalJson(input.record));
  await writeCreateOnly(
    humanReportPath,
    renderHumanReview({
      runRef: input.record.runRef,
      hypothesisId: input.record.hypothesisId,
      feedbackInvocationRef: input.record.feedbackInvocationRef,
      hypothesisInvocationRef: input.record.hypothesisInvocationRef,
      investigationInvocationRef: input.record.investigationInvocationRef,
      experimentRootHash: input.record.experimentRootHash,
      observablePayloadHash: input.record.observablePayloadHash,
      feedbackHash: input.record.feedbackHash,
      patternEvidenceHash: input.record.patternEvidenceHash,
      hypothesesHash: input.record.hypothesesHash,
      selectedHypothesisHash: input.record.selectedHypothesisHash,
      evidencePackHash: input.record.evidencePackHash,
      status: 'failed',
      errorKind: input.record.errorKind,
      participant: input.record.participant,
      source: input.source,
      evidencePack: input.evidencePack,
      rawParticipantResponse: input.rawParticipantResponse,
    }),
  );
  return humanReportPath;
}

export async function runHypothesisInvestigation(
  options: RunHypothesisInvestigationOptions,
  testHooks: RunHypothesisInvestigationTestHooks = {},
): Promise<RunHypothesisInvestigationResult> {
  const apiKey = requireApiKey(options.apiKey);
  const runRef = validatePhase0RunRef(options.runRef);
  const hypothesisId = validateHypothesisId(options.hypothesisId);

  const source = await loadHypothesisInvestigationSource({
    mefSourceRoot: resolve(options.mefSourceRoot ?? DEFAULT_MEF_SOURCE_ROOT),
    hypothesisSourceRoot: resolve(
      options.hypothesisSourceRoot ?? DEFAULT_HYPOTHESIS_SOURCE_ROOT,
    ),
    runRef,
    hypothesisId,
  });

  const evidenceMode = options.evidenceMode ?? 'direct-v1';
  if (
    source.patternEvidence !== undefined
    && options.patternEvidence !== undefined
    && canonicalJson(source.patternEvidence) !== canonicalJson(options.patternEvidence)
  ) {
    throw new Error('pattern evidence does not match the source hypothesis artifact');
  }
  const patternEvidence = source.patternEvidence ?? options.patternEvidence;
  const patternEvidenceBytes = source.patternEvidenceBytes
    ?? (patternEvidence !== undefined ? canonicalJson(patternEvidence) : undefined);
  const patternEvidenceHash = source.patternEvidenceHash
    ?? (patternEvidenceBytes !== undefined ? sha256Hex(patternEvidenceBytes) : undefined);
  if (evidenceMode === 'cohort-v1') {
    const longitudinalPack = await buildInvestigationEvidence({
      source,
      evidenceMode: 'longitudinal-v1',
      ...(patternEvidence !== undefined ? { patternEvidence } : {}),
    });
    const longitudinalHash = sha256Hex(canonicalJson(longitudinalPack));
    const expectedHash = patternEvidence === undefined
      ? options.sealedLongitudinalEvidenceHash ?? SEALED_LONGITUDINAL_EVIDENCE_HASH
      : undefined;
    if (expectedHash !== undefined && longitudinalHash !== expectedHash) {
      throw new Error(
        `rebuilt longitudinal-v1 hash mismatch: expected ${expectedHash}, got ${longitudinalHash}`,
      );
    }
    if (!options.cohortEvidence) {
      throw new Error('cohort-v1 requires cohortEvidence');
    }
  }

  const evidencePack = await buildInvestigationEvidence({
    source,
    evidenceMode,
    ...(options.cohortEvidence !== undefined
      ? { cohortEvidence: options.cohortEvidence }
      : {}),
    ...(patternEvidence !== undefined
      ? { patternEvidence }
      : {}),
  });
  const evidencePackBytes = canonicalJson(evidencePack);
  const evidencePackHash = sha256Hex(evidencePackBytes);

  const investigationInvocationRef = evidenceMode === 'cohort-v1'
    ? `${runRef}-${hypothesisId}-deepseek-hypothesis-investigation-cohort-001`
    : evidenceMode === 'longitudinal-v1'
      ? `${runRef}-${hypothesisId}-deepseek-hypothesis-investigation-longitudinal-001`
      : `${runRef}-${hypothesisId}-deepseek-hypothesis-investigation-001`;
  const outRoot = resolve(options.outRoot ?? DEFAULT_OUT_ROOT);
  const investigationRunsRoot = join(outRoot, 'investigation-runs');
  const runDir = resolvePhase0RunPath(investigationRunsRoot, runRef);
  const investigationDir = resolvePhase0RunPath(runDir, hypothesisId);

  await assertTargetAbsent(investigationDir, 'investigation run target');
  await mkdir(investigationRunsRoot, { recursive: true });
  await mkdir(runDir, { recursive: true });
  await mkdir(investigationDir, { recursive: false });

  await writeCreateOnly(
    join(investigationDir, 'source-hypotheses.json'),
    source.sourceHypothesesBytes,
  );
  await writeCreateOnly(
    join(investigationDir, 'source-hypothesis-invocation.json'),
    source.sourceHypothesisInvocationBytes,
  );
  if (patternEvidenceBytes !== undefined) {
    await writeCreateOnly(
      join(investigationDir, 'source-pattern-evidence.json'),
      patternEvidenceBytes,
    );
  }
  await writeCreateOnly(
    join(investigationDir, 'investigation-evidence.json'),
    evidencePackBytes,
  );

  const invoke = testHooks.invoke ?? invokeDeepSeekHypothesisInvestigation;
  const invokeResult = await invoke({
    apiKey,
    invocationRef: investigationInvocationRef,
    runRef: source.runRef,
    hypothesisId: source.hypothesisId,
    hypothesisInvocationRef: source.hypothesisInvocationRef,
    experimentRootHash: source.experimentRootHash,
    evidencePackHash,
    evidencePackBytes,
  });

  await saveRawResponses(investigationDir, invokeResult);

  const baseRecord = {
    schemaVersion: evidenceMode === 'cohort-v1'
      ? COHORT_INVOCATION_SCHEMA_VERSION
      : evidenceMode === 'longitudinal-v1'
        ? LONGITUDINAL_INVOCATION_SCHEMA_VERSION
        : DIRECT_INVOCATION_SCHEMA_VERSION,
    ...(evidenceMode === 'longitudinal-v1' || evidenceMode === 'cohort-v1'
      ? { evidenceMode }
      : {}),
    runRef,
    hypothesisId,
    feedbackInvocationRef: source.feedbackInvocationRef,
    hypothesisInvocationRef: source.hypothesisInvocationRef,
    investigationInvocationRef,
    experimentRootHash: source.experimentRootHash,
    observablePayloadHash: source.observablePayloadHash,
    feedbackHash: source.feedbackHash,
    ...(patternEvidenceHash !== undefined ? { patternEvidenceHash } : {}),
    hypothesesHash: source.hypothesesHash,
    selectedHypothesisHash: source.selectedHypothesisHash,
    evidencePackHash,
  } as const;

  if (!invokeResult.ok) {
    await persistFailure({
      investigationDir,
      record: {
        ...baseRecord,
        participant: buildParticipant(),
        status: 'failed',
        errorKind: 'provider',
      },
      source,
      evidencePack,
    });
    throw new Error(`investigation participant invocation failed: ${invokeResult.errorKind}`);
  }

  const participant = buildParticipant(invokeResult);
  let parsed: HypothesisInvestigationResult;
  try {
    parsed = parseHypothesisInvestigationResult(invokeResult.rawParticipantResponse);
  } catch (error) {
    await persistFailure({
      investigationDir,
      record: {
        ...baseRecord,
        participant,
        status: 'failed',
        errorKind: 'parse',
      },
      source,
      evidencePack,
      rawParticipantResponse: invokeResult.rawParticipantResponse,
    });
    throw error;
  }

  try {
    validateHypothesisInvestigationReferences(
      parsed,
      investigationEvidenceRefs(evidencePack),
    );
  } catch (error) {
    await persistFailure({
      investigationDir,
      record: {
        ...baseRecord,
        participant,
        status: 'failed',
        errorKind: 'invalid_reference',
      },
      source,
      evidencePack,
      rawParticipantResponse: invokeResult.rawParticipantResponse,
    });
    throw error;
  }

  await writeCreateOnly(join(investigationDir, 'investigation.json'), canonicalJson(parsed));
  await writeCreateOnly(
    join(investigationDir, 'invocation.json'),
    canonicalJson({
      ...baseRecord,
      participant,
      status: 'completed',
    } satisfies HypothesisInvestigationInvocationRecord),
  );

  const humanReportPath = join(investigationDir, 'human-review.md');
  await writeCreateOnly(
    humanReportPath,
    renderHumanReview({
      runRef,
      hypothesisId,
      feedbackInvocationRef: source.feedbackInvocationRef,
      hypothesisInvocationRef: source.hypothesisInvocationRef,
      investigationInvocationRef,
      experimentRootHash: source.experimentRootHash,
      observablePayloadHash: source.observablePayloadHash,
      feedbackHash: source.feedbackHash,
      patternEvidenceHash,
      hypothesesHash: source.hypothesesHash,
      selectedHypothesisHash: source.selectedHypothesisHash,
      evidencePackHash,
      status: 'completed',
      participant,
      source,
      evidencePack,
      rawParticipantResponse: invokeResult.rawParticipantResponse,
      investigation: parsed,
    }),
  );

  return {
    runRef,
    hypothesisId,
    feedbackInvocationRef: source.feedbackInvocationRef,
    hypothesisInvocationRef: source.hypothesisInvocationRef,
    investigationInvocationRef,
    investigationDir,
    humanReportPath,
    experimentRootHash: source.experimentRootHash,
    observablePayloadHash: source.observablePayloadHash,
    feedbackHash: source.feedbackHash,
    ...(patternEvidenceHash !== undefined ? { patternEvidenceHash } : {}),
    hypothesesHash: source.hypothesesHash,
    selectedHypothesisHash: source.selectedHypothesisHash,
    evidencePackHash,
    status: 'completed',
  };
}

interface CliArgs {
  runRef: string;
  hypothesisId: string;
  mefSourceRoot?: string;
  hypothesisSourceRoot?: string;
  outRoot?: string;
  evidenceMode?: InvestigationEvidenceMode;
}

function validateEvidenceMode(value: string): InvestigationEvidenceMode {
  if (value !== 'direct-v1' && value !== 'longitudinal-v1' && value !== 'cohort-v1') {
    throw new Error(`invalid evidence mode: ${value}`);
  }
  return value;
}

function requireValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`missing value for ${flag}`);
  return value;
}

function parseCliArgs(argv: string[]): CliArgs {
  const values = new Map<string, string>();
  const allowed = new Set([
    '--run-ref',
    '--hypothesis-id',
    '--mef-source-root',
    '--hypothesis-source-root',
    '--out-root',
    '--evidence-mode',
  ]);

  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    if (!allowed.has(flag)) throw new Error(`unknown argument: ${flag}`);
    if (values.has(flag)) throw new Error(`duplicate argument: ${flag}`);
    values.set(flag, requireValue(argv, index, flag));
  }

  if (!values.has('--run-ref')) throw new Error('missing required argument: --run-ref');
  if (!values.has('--hypothesis-id')) {
    throw new Error('missing required argument: --hypothesis-id');
  }

  return {
    runRef: values.get('--run-ref')!,
    hypothesisId: values.get('--hypothesis-id')!,
    ...(values.has('--mef-source-root')
      ? { mefSourceRoot: values.get('--mef-source-root')! }
      : {}),
    ...(values.has('--hypothesis-source-root')
      ? { hypothesisSourceRoot: values.get('--hypothesis-source-root')! }
      : {}),
    ...(values.has('--out-root') ? { outRoot: values.get('--out-root')! } : {}),
    ...(values.has('--evidence-mode')
      ? { evidenceMode: validateEvidenceMode(values.get('--evidence-mode')!) }
      : {}),
  };
}

async function main(argv: string[]): Promise<void> {
  await loadDotEnvIfPresent();
  const args = parseCliArgs(argv);
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is required');
  const result = await runHypothesisInvestigation({
    runRef: args.runRef,
    hypothesisId: args.hypothesisId,
    apiKey,
    ...(args.mefSourceRoot !== undefined ? { mefSourceRoot: args.mefSourceRoot } : {}),
    ...(args.hypothesisSourceRoot !== undefined
      ? { hypothesisSourceRoot: args.hypothesisSourceRoot }
      : {}),
    ...(args.outRoot !== undefined ? { outRoot: args.outRoot } : {}),
    ...(args.evidenceMode !== undefined ? { evidenceMode: args.evidenceMode } : {}),
  });
  process.stdout.write(`${canonicalJson(result)}\n`);
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error);
    process.exit(1);
  });
}

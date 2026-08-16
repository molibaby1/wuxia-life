import { open, lstat, mkdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  parseComparativeFeedback,
  validateComparativeFeedbackReferences,
  type ComparativeFeedback,
} from '../../src/evolution/comparativeFeedbackContract';
import type { ObservableEntry, ObservablePayload } from '../../src/evolution/playerObservableTranscript';
import {
  DEEPSEEK_COMPARATIVE_EXPERIENCE_MODEL,
  invokeDeepSeekComparativeExperienceFeedback,
  type DeepSeekComparativeExperienceFailure,
  type DeepSeekComparativeExperienceSuccess,
} from './comparativeFeedback/deepseekComparativeExperienceFeedback';
import {
  canonicalJson,
  resolvePhase0RunPath,
  sha256Hex,
  validatePhase0RunRef,
  validatePhase0RunSeal,
} from './phase0/provenance';

const DEFAULT_OUT_ROOT = 'artifacts/reports/evolution/comparative-change-evidence';
const INVOCATION_SCHEMA_VERSION = 'comparative-change-evidence-invocation-v1' as const;
const ALLOWED_OBSERVABLE_REL = join('reviewer-input', 'observable-payload.json');
const SUBJECTIVE_DISCLAIMER =
  '反馈为该参与者的主观比较意见；系统未自动选定 winner，也未判定候选更好或应保留。';
const EXPLICIT_STOP = 'STOP — Skeleton 003 ends after Human review of this comparative evidence.';
const DOTENV_PATH = resolve(process.cwd(), '.env');

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

export interface RunComparativeChangeEvidenceOptions {
  baselineRunPath: string;
  candidateRunPath: string;
  baselineExperimentRootHash: string;
  candidateExperimentRootHash: string;
  outRoot?: string;
  apiKey: string;
}

export interface RunComparativeChangeEvidenceTestHooks {
  invoke?: typeof invokeDeepSeekComparativeExperienceFeedback;
}

export interface RunComparativeChangeEvidenceResult {
  baselineRunRef: string;
  candidateRunRef: string;
  invocationRef: string;
  comparisonDir: string;
  humanReportPath: string;
  baselineObservablePayloadHash: string;
  candidateObservablePayloadHash: string;
  baselineExperimentRootHash: string;
  candidateExperimentRootHash: string;
  status: 'completed' | 'failed';
}

interface InvocationParticipant {
  kind: 'llm';
  provider: 'deepseek';
  modelRequested: typeof DEEPSEEK_COMPARATIVE_EXPERIENCE_MODEL;
  modelReturned?: string;
  providerResponseId?: string;
  thinking: { type: 'disabled' };
}

interface InvocationRecord {
  schemaVersion: typeof INVOCATION_SCHEMA_VERSION;
  baselineRunRef: string;
  candidateRunRef: string;
  invocationRef: string;
  experienceMapping: { A: 'baseline'; B: 'candidate' };
  baselineExperimentRootHash: string;
  candidateExperimentRootHash: string;
  baselineObservablePayloadHash: string;
  candidateObservablePayloadHash: string;
  participant: InvocationParticipant;
  status: 'completed' | 'failed';
  errorKind?: string;
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

function buildParticipant(invokeResult?: DeepSeekComparativeExperienceSuccess): InvocationParticipant {
  return {
    kind: 'llm',
    provider: 'deepseek',
    modelRequested: DEEPSEEK_COMPARATIVE_EXPERIENCE_MODEL,
    thinking: { type: 'disabled' },
    ...(invokeResult
      ? {
        modelReturned: invokeResult.model,
        providerResponseId: invokeResult.responseId,
      }
      : {}),
  };
}

function renderEntry(entry: ObservableEntry): string {
  const lines = [`### ${entry.entryId}`, `- kind: ${entry.kind}`];
  if (entry.age !== undefined) lines.push(`- age: ${entry.age}`);
  if (entry.title !== undefined) lines.push(`- title: ${entry.title}`);
  if (entry.body !== undefined) lines.push(`- body: ${entry.body}`);
  for (const choice of entry.visibleChoices ?? []) {
    const description = choice.description ? ` — ${choice.description}` : '';
    lines.push(`- visible choice: ${choice.label}${description}`);
  }
  if (entry.selectedChoiceRef !== undefined) {
    const selected = entry.visibleChoices?.find(choice => choice.choiceRef === entry.selectedChoiceRef);
    lines.push(`- selected choice: ${selected?.label ?? entry.selectedChoiceRef}`);
  }
  if (entry.visibleOutcome !== undefined) lines.push(`- visible outcome: ${entry.visibleOutcome}`);
  for (const line of entry.visibleFeedbackLines ?? []) {
    lines.push(`- visible feedback: ${line}`);
  }
  return lines.join('\n');
}

function renderHumanReview(input: {
  baselineRunRef: string;
  candidateRunRef: string;
  invocationRef: string;
  baselineExperimentRootHash: string;
  candidateExperimentRootHash: string;
  baselineObservablePayloadHash: string;
  candidateObservablePayloadHash: string;
  status: 'completed' | 'failed';
  errorKind?: string;
  participant: InvocationParticipant;
  experienceA: ObservablePayload;
  experienceB: ObservablePayload;
  rawParticipantResponse?: string;
  parsedFeedback?: ComparativeFeedback;
}): string {
  const sections = [
    '# Human Review — Skeleton 003 Comparative Change Evidence',
    '',
    `- baselineRunRef: ${input.baselineRunRef}`,
    `- candidateRunRef: ${input.candidateRunRef}`,
    `- invocationRef: ${input.invocationRef}`,
    `- baselineExperimentRootHash: ${input.baselineExperimentRootHash}`,
    `- candidateExperimentRootHash: ${input.candidateExperimentRootHash}`,
    `- baselineObservablePayloadHash: ${input.baselineObservablePayloadHash}`,
    `- candidateObservablePayloadHash: ${input.candidateObservablePayloadHash}`,
    '- internalMapping: Experience A = baseline; Experience B = candidate',
    `- provider: ${input.participant.provider}`,
    `- modelRequested: ${input.participant.modelRequested}`,
    ...(input.participant.modelReturned ? [`- modelReturned: ${input.participant.modelReturned}`] : []),
    '- thinking: disabled',
    `- status: ${input.status}`,
    ...(input.errorKind ? [`- errorKind: ${input.errorKind}`] : []),
    '',
    SUBJECTIVE_DISCLAIMER,
    '',
    '## Experience A（baseline，玩家可见材料）',
    '',
    input.experienceA.entries.map(renderEntry).join('\n\n') || '（无可展示条目）',
    '',
    '## Experience B（candidate，玩家可见材料）',
    '',
    input.experienceB.entries.map(renderEntry).join('\n\n') || '（无可展示条目）',
    '',
    '## 原始 participant response',
    '',
  ];

  if (input.rawParticipantResponse !== undefined) {
    sections.push('```', input.rawParticipantResponse, '```', '');
  } else {
    sections.push('（无原始 participant response）', '');
  }

  if (input.parsedFeedback) {
    sections.push(
      '## 解析后的比较反馈（辅助）',
      '',
      `- overallComparison: ${input.parsedFeedback.overallComparison}`,
      ...input.parsedFeedback.observations.flatMap((observation, index) => [
        `- observation[${index}]: ${observation.comparison}`,
        `  - experienceARefs: ${observation.experienceARefs.join(', ') || '(none)'}`,
        `  - experienceBRefs: ${observation.experienceBRefs.join(', ') || '(none)'}`,
      ]),
      '',
    );
  }

  sections.push(EXPLICIT_STOP, '');
  return `${sections.join('\n')}\n`;
}

async function persistFailure(input: {
  comparisonDir: string;
  record: InvocationRecord;
  experienceA: ObservablePayload;
  experienceB: ObservablePayload;
  rawParticipantResponse?: string;
}): Promise<string> {
  const humanReportPath = join(input.comparisonDir, 'human-review.md');
  await writeCreateOnly(join(input.comparisonDir, 'invocation.json'), canonicalJson(input.record));
  await writeCreateOnly(
    humanReportPath,
    renderHumanReview({
      baselineRunRef: input.record.baselineRunRef,
      candidateRunRef: input.record.candidateRunRef,
      invocationRef: input.record.invocationRef,
      baselineExperimentRootHash: input.record.baselineExperimentRootHash,
      candidateExperimentRootHash: input.record.candidateExperimentRootHash,
      baselineObservablePayloadHash: input.record.baselineObservablePayloadHash,
      candidateObservablePayloadHash: input.record.candidateObservablePayloadHash,
      status: 'failed',
      errorKind: input.record.errorKind,
      participant: input.record.participant,
      experienceA: input.experienceA,
      experienceB: input.experienceB,
      rawParticipantResponse: input.rawParticipantResponse,
    }),
  );
  return humanReportPath;
}

async function saveRawResponses(
  comparisonDir: string,
  invokeResult: DeepSeekComparativeExperienceSuccess | DeepSeekComparativeExperienceFailure,
): Promise<void> {
  if (invokeResult.rawProviderResponse !== undefined) {
    await writeCreateOnly(
      join(comparisonDir, 'raw-provider-response.txt'),
      invokeResult.rawProviderResponse,
    );
  }
  if (invokeResult.ok) {
    await writeCreateOnly(
      join(comparisonDir, 'raw-participant-response.txt'),
      invokeResult.rawParticipantResponse,
    );
  }
}

async function loadSealedObservable(input: {
  runPath: string;
  expectedExperimentRootHash: string;
}): Promise<{
  runRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  observablePayloadBytes: string;
  observablePayload: ObservablePayload;
}> {
  const runPath = resolve(input.runPath);
  const envelope = JSON.parse(
    await readFile(join(runPath, 'provenance', 'experiment-envelope.json'), 'utf8'),
  ) as { runRef: string; observablePayloadHash: string };
  const runRef = validatePhase0RunRef(envelope.runRef);
  await validatePhase0RunSeal(runPath, input.expectedExperimentRootHash);

  const observablePayloadBytes = await readFile(join(runPath, ALLOWED_OBSERVABLE_REL), 'utf8');
  const actualHash = sha256Hex(observablePayloadBytes);
  if (actualHash !== envelope.observablePayloadHash) {
    throw new Error(
      `observable payload hash mismatch for ${runRef}: expected ${envelope.observablePayloadHash}, got ${actualHash}`,
    );
  }

  return {
    runRef,
    experimentRootHash: input.expectedExperimentRootHash,
    observablePayloadHash: envelope.observablePayloadHash,
    observablePayloadBytes,
    observablePayload: JSON.parse(observablePayloadBytes) as ObservablePayload,
  };
}

export async function runComparativeChangeEvidence(
  options: RunComparativeChangeEvidenceOptions,
  testHooks: RunComparativeChangeEvidenceTestHooks = {},
): Promise<RunComparativeChangeEvidenceResult> {
  const apiKey = requireApiKey(options.apiKey);
  const outRoot = resolve(options.outRoot ?? DEFAULT_OUT_ROOT);

  const baseline = await loadSealedObservable({
    runPath: options.baselineRunPath,
    expectedExperimentRootHash: options.baselineExperimentRootHash,
  });
  const candidate = await loadSealedObservable({
    runPath: options.candidateRunPath,
    expectedExperimentRootHash: options.candidateExperimentRootHash,
  });

  const invocationRef = `ae-skeleton-003-comparative-001`;
  const comparisonDir = resolvePhase0RunPath(outRoot, 'ae-skeleton-003-comparison');
  await assertTargetAbsent(comparisonDir, 'comparative evidence target');

  await mkdir(outRoot, { recursive: true });
  try {
    await mkdir(comparisonDir, { recursive: false });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'EEXIST') {
      throw new Error(`comparative evidence target already exists: ${comparisonDir}`);
    }
    throw error;
  }

  await writeCreateOnly(
    join(comparisonDir, 'experience-a-observable-payload.json'),
    baseline.observablePayloadBytes,
  );
  await writeCreateOnly(
    join(comparisonDir, 'experience-b-observable-payload.json'),
    candidate.observablePayloadBytes,
  );

  const invoke = testHooks.invoke ?? invokeDeepSeekComparativeExperienceFeedback;
  const invokeResult = await invoke({
    apiKey,
    invocationRef,
    experienceAPayloadBytes: baseline.observablePayloadBytes,
    experienceBPayloadBytes: candidate.observablePayloadBytes,
  });

  await saveRawResponses(comparisonDir, invokeResult);

  const baseRecord = {
    schemaVersion: INVOCATION_SCHEMA_VERSION,
    baselineRunRef: baseline.runRef,
    candidateRunRef: candidate.runRef,
    invocationRef,
    experienceMapping: { A: 'baseline', B: 'candidate' } as const,
    baselineExperimentRootHash: baseline.experimentRootHash,
    candidateExperimentRootHash: candidate.experimentRootHash,
    baselineObservablePayloadHash: baseline.observablePayloadHash,
    candidateObservablePayloadHash: candidate.observablePayloadHash,
  };

  if (!invokeResult.ok) {
    await persistFailure({
      comparisonDir,
      record: {
        ...baseRecord,
        participant: buildParticipant(),
        status: 'failed',
        errorKind: invokeResult.errorKind,
      },
      experienceA: baseline.observablePayload,
      experienceB: candidate.observablePayload,
    });
    throw new Error(`comparative participant invocation failed: ${invokeResult.errorKind}`);
  }

  const participant = buildParticipant(invokeResult);
  let parsed: ComparativeFeedback;
  try {
    parsed = parseComparativeFeedback(invokeResult.rawParticipantResponse);
  } catch (error) {
    await persistFailure({
      comparisonDir,
      record: {
        ...baseRecord,
        participant,
        status: 'failed',
        errorKind: 'parse',
      },
      experienceA: baseline.observablePayload,
      experienceB: candidate.observablePayload,
      rawParticipantResponse: invokeResult.rawParticipantResponse,
    });
    throw error;
  }

  try {
    validateComparativeFeedbackReferences(
      parsed,
      baseline.observablePayload,
      candidate.observablePayload,
    );
  } catch (error) {
    await persistFailure({
      comparisonDir,
      record: {
        ...baseRecord,
        participant,
        status: 'failed',
        errorKind: 'invalid_reference',
      },
      experienceA: baseline.observablePayload,
      experienceB: candidate.observablePayload,
      rawParticipantResponse: invokeResult.rawParticipantResponse,
    });
    throw error;
  }

  await writeCreateOnly(join(comparisonDir, 'comparative-feedback.json'), canonicalJson(parsed));
  await writeCreateOnly(
    join(comparisonDir, 'invocation.json'),
    canonicalJson({
      ...baseRecord,
      participant,
      status: 'completed',
    } satisfies InvocationRecord),
  );
  const humanReportPath = join(comparisonDir, 'human-review.md');
  await writeCreateOnly(
    humanReportPath,
    renderHumanReview({
      baselineRunRef: baseline.runRef,
      candidateRunRef: candidate.runRef,
      invocationRef,
      baselineExperimentRootHash: baseline.experimentRootHash,
      candidateExperimentRootHash: candidate.experimentRootHash,
      baselineObservablePayloadHash: baseline.observablePayloadHash,
      candidateObservablePayloadHash: candidate.observablePayloadHash,
      status: 'completed',
      participant,
      experienceA: baseline.observablePayload,
      experienceB: candidate.observablePayload,
      rawParticipantResponse: invokeResult.rawParticipantResponse,
      parsedFeedback: parsed,
    }),
  );

  return {
    baselineRunRef: baseline.runRef,
    candidateRunRef: candidate.runRef,
    invocationRef,
    comparisonDir,
    humanReportPath,
    baselineObservablePayloadHash: baseline.observablePayloadHash,
    candidateObservablePayloadHash: candidate.observablePayloadHash,
    baselineExperimentRootHash: baseline.experimentRootHash,
    candidateExperimentRootHash: candidate.experimentRootHash,
    status: 'completed',
  };
}

interface CliArgs {
  baselineRunPath: string;
  candidateRunPath: string;
  baselineExperimentRootHash: string;
  candidateExperimentRootHash: string;
  outRoot?: string;
}

function requireValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`missing value for ${flag}`);
  return value;
}

function parseCliArgs(argv: string[]): CliArgs {
  const values = new Map<string, string>();
  const allowed = new Set([
    '--baseline-run-path',
    '--candidate-run-path',
    '--baseline-experiment-root-hash',
    '--candidate-experiment-root-hash',
    '--out-root',
  ]);

  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    if (!allowed.has(flag)) throw new Error(`unknown argument: ${flag}`);
    if (values.has(flag)) throw new Error(`duplicate argument: ${flag}`);
    values.set(flag, requireValue(argv, index, flag));
  }

  const required = [
    '--baseline-run-path',
    '--candidate-run-path',
    '--baseline-experiment-root-hash',
    '--candidate-experiment-root-hash',
  ] as const;
  for (const flag of required) {
    if (!values.has(flag)) throw new Error(`missing required argument: ${flag}`);
  }

  return {
    baselineRunPath: values.get('--baseline-run-path')!,
    candidateRunPath: values.get('--candidate-run-path')!,
    baselineExperimentRootHash: values.get('--baseline-experiment-root-hash')!,
    candidateExperimentRootHash: values.get('--candidate-experiment-root-hash')!,
    ...(values.has('--out-root') ? { outRoot: values.get('--out-root')! } : {}),
  };
}

async function main(argv: string[]): Promise<void> {
  await loadDotEnvIfPresent();
  const args = parseCliArgs(argv);
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is required');
  const result = await runComparativeChangeEvidence({
    baselineRunPath: args.baselineRunPath,
    candidateRunPath: args.candidateRunPath,
    baselineExperimentRootHash: args.baselineExperimentRootHash,
    candidateExperimentRootHash: args.candidateExperimentRootHash,
    apiKey,
    ...(args.outRoot !== undefined ? { outRoot: args.outRoot } : {}),
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

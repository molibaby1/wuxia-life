import { open, lstat, mkdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  parseImprovementHypothesisSet,
  validateImprovementHypothesisReferences,
  type ImprovementHypothesis,
  type ImprovementHypothesisSet,
} from '../../src/evolution/improvementHypothesisContract';
import {
  computeExperiencePatternEvidenceHash,
} from './experiencePattern/buildExperiencePatternEvidence';
import {
  validateExperiencePatternEvidence,
  type ExperiencePatternEvidence,
} from '../../src/evolution/experiencePatternEvidenceContract';
import type { ExternalFeedback } from '../../src/evolution/externalFeedbackContract';
import type { ObservableEntry, ObservablePayload } from '../../src/evolution/playerObservableTranscript';
import {
  DEEPSEEK_IMPROVEMENT_HYPOTHESIS_MODEL,
  invokeDeepSeekImprovementHypothesis,
  type DeepSeekImprovementHypothesisFailure,
  type DeepSeekImprovementHypothesisSuccess,
} from './improvementHypothesis/deepseekImprovementHypothesis';
import { buildImprovementHypothesisPrompt } from './improvementHypothesis/deepseekImprovementHypothesis';
import {
  createEvidenceOnlyWorkspace,
  runLocalEvidenceOnlyParticipant,
  type EvidenceOnlyWorkspaceManifest,
  type LocalEvidenceOnlyParticipantFailure,
  type LocalEvidenceOnlyParticipantSuccess,
} from './localEvidenceOnlyParticipant';
import type { WorkspaceAgentParticipantOptions } from './problemAgnosticSolution/agentParticipant';
import {
  loadExternalFeedbackSource,
  type ExternalFeedbackSource,
} from './improvementHypothesis/loadExternalFeedbackSource';
import {
  canonicalJson,
  resolvePhase0RunPath,
  validatePhase0RunRef,
} from './phase0/provenance';

const DEFAULT_SOURCE_ROOT = 'artifacts/reports/evolution/minimal-external-feedback';
const DEFAULT_OUT_ROOT = 'artifacts/reports/evolution/improvement-hypothesis';
const LEGACY_INVOCATION_SCHEMA_VERSION = 'improvement-hypothesis-invocation-v1' as const;
const PATTERN_INVOCATION_SCHEMA_VERSION = 'improvement-hypothesis-invocation-v2' as const;
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

export interface RunImprovementHypothesisOptions {
  runRef: string;
  sourceRoot?: string;
  outRoot?: string;
  apiKey?: string;
  localParticipant?: WorkspaceAgentParticipantOptions;
  patternEvidence?: ExperiencePatternEvidence;
}

export interface RunImprovementHypothesisTestHooks {
  invoke?: typeof invokeDeepSeekImprovementHypothesis;
}

export interface RunImprovementHypothesisResult {
  runRef: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  hypothesisDir: string;
  humanReportPath: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  feedbackHash: string;
  patternEvidenceHash?: string;
}

interface HypothesisParticipant {
  kind: 'llm' | 'agent';
  provider: string;
  modelRequested: string;
  modelReturned?: string;
  providerResponseId?: string;
  reasoningEffort?: string;
  evidenceOnlyWorkspace?: {
    inputFiles: string[];
    manifestSha256: string;
  };
}

interface HypothesisInvocationRecord {
  schemaVersion:
    | typeof LEGACY_INVOCATION_SCHEMA_VERSION
    | typeof PATTERN_INVOCATION_SCHEMA_VERSION;
  runRef: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  feedbackHash: string;
  patternEvidenceHash?: string;
  participant: HypothesisParticipant;
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

function requireApiKey(apiKey: string | undefined): string {
  if (!apiKey?.trim()) throw new Error('apiKey must not be empty');
  return apiKey;
}

type HypothesisInvokeResult =
  | DeepSeekImprovementHypothesisSuccess
  | DeepSeekImprovementHypothesisFailure
  | LocalEvidenceOnlyParticipantSuccess
  | LocalEvidenceOnlyParticipantFailure;

function buildParticipant(
  invokeResult?: HypothesisInvokeResult,
  localParticipant?: WorkspaceAgentParticipantOptions,
  evidenceWorkspace?: EvidenceOnlyWorkspaceManifest,
): HypothesisParticipant {
  if (localParticipant) {
    return {
      kind: 'agent',
      provider: 'codex-local-subagent',
      modelRequested: localParticipant.model ?? 'host-configured',
      ...(localParticipant.reasoningEffort ? { reasoningEffort: localParticipant.reasoningEffort } : {}),
      ...(evidenceWorkspace
        ? {
          evidenceOnlyWorkspace: {
            inputFiles: evidenceWorkspace.files,
            manifestSha256: evidenceWorkspace.manifestSha256,
          },
        }
        : {}),
    };
  }
  return {
    kind: 'llm',
    provider: 'deepseek',
    modelRequested: DEEPSEEK_IMPROVEMENT_HYPOTHESIS_MODEL,
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

function resolveFeedbackRefText(feedback: ExternalFeedback, ref: string): string {
  if (ref === 'overallImpression') return feedback.overallImpression;
  const match = /^observations\[(\d+)\]$/.exec(ref);
  if (match) {
    const index = Number(match[1]);
    const observation = feedback.observations[index];
    if (observation) return observation.feedback;
  }
  return '(unavailable)';
}

function renderHypothesisSection(
  hypothesis: ImprovementHypothesis,
  feedback: ExternalFeedback,
  observablePayload: ObservablePayload,
  patternEvidenceBytes?: string,
): string {
  const entryById = new Map(
    observablePayload.entries.map(entry => [entry.entryId, entry] as const),
  );
  return [
    `## ${hypothesis.hypothesisId}`,
    '',
    '### 可能的问题',
    hypothesis.hypothesis,
    '',
    '### 已观察到的依据',
    hypothesis.observedBasis,
    '',
    '### Feedback references',
    ...hypothesis.feedbackRefs.map(
      ref => `- ${ref}: ${resolveFeedbackRefText(feedback, ref)}`,
    ),
    '',
    '### Player-observable evidence',
    ...(hypothesis.evidenceRefs.length === 0
      ? ['- （无 entry 引用）']
      : hypothesis.evidenceRefs.map(ref => {
        const entry = entryById.get(ref);
        return entry
          ? `- ${ref}:\n${renderEntry(entry)}`
          : `- ${ref}: (unavailable)`;
      })),
    ...(hypothesis.patternEvidenceRefs !== undefined
      ? [
        '',
        '### Experience Pattern Evidence references',
        ...(hypothesis.patternEvidenceRefs.length === 0
          ? ['- （无 Pattern 引用）']
          : hypothesis.patternEvidenceRefs.map(ref => `- ${ref}`)),
        ...(patternEvidenceBytes !== undefined
          ? ['Pattern Evidence artifact 已在本次 hypothesis run 中按 hash 保存。']
          : []),
      ]
      : []),
    '',
    '### 当前仍不知道',
    ...hypothesis.unknowns.map(item => `- ${item}`),
    '',
    '### 为什么值得进一步调查',
    hypothesis.productSignificance,
    '',
    '### Human decision',
    '- 继续调查',
    '- 暂不继续',
    '- 当前无法判断',
    '',
  ].join('\n');
}

function renderHumanReview(input: {
  runRef: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  feedbackHash: string;
  patternEvidenceHash?: string;
  status: 'completed' | 'failed';
  errorKind?: string;
  participant: HypothesisParticipant;
  sourceFeedback: ExternalFeedback;
  sourceFeedbackBytes: string;
  patternEvidenceBytes?: string;
  rawHypothesisParticipantResponse?: string;
  hypotheses?: ImprovementHypothesisSet;
  observablePayload: ObservablePayload;
}): string {
  const sections = [
    '# Human Review — Improvement Hypotheses',
    '',
    `- runRef: ${input.runRef}`,
    `- feedbackInvocationRef: ${input.feedbackInvocationRef}`,
    `- hypothesisInvocationRef: ${input.hypothesisInvocationRef}`,
    `- experimentRootHash: ${input.experimentRootHash}`,
    `- observablePayloadHash: ${input.observablePayloadHash}`,
    `- feedbackHash: ${input.feedbackHash}`,
    ...(input.patternEvidenceHash
      ? [`- patternEvidenceHash: ${input.patternEvidenceHash}`]
      : []),
    `- provider: ${input.participant.provider}`,
    `- modelRequested: ${input.participant.modelRequested}`,
    ...(input.participant.modelReturned
      ? [`- modelReturned: ${input.participant.modelReturned}`]
      : []),
    `- status: ${input.status}`,
    ...(input.errorKind ? [`- errorKind: ${input.errorKind}`] : []),
    '',
    '改善假设是基于一次具体体验与一份 participant feedback 的可撤销产品推断；',
    '它不是已确认缺陷，不是 participant correctness 判定，也不是修改命令。',
    '继续调查 ≠ 已证实 / ≠ implementation authorization。',
    '',
    '## Source participant feedback',
    '',
    '```',
    input.sourceFeedbackBytes,
    '```',
    '',
    '## 原始 hypothesis participant response',
    '',
  ];

  if (input.rawHypothesisParticipantResponse !== undefined) {
    sections.push('```', input.rawHypothesisParticipantResponse, '```', '');
  } else {
    sections.push('（无原始 hypothesis participant response）', '');
  }

  if (input.status === 'completed' && input.hypotheses) {
    if (input.hypotheses.hypotheses.length === 0) {
      sections.push(
        '## 结果',
        '',
        '本次形成 0 条 improvement hypothesis。这是合法 completed result，表示当前材料不足以形成值得 Human 审阅的改善假设，不表示 participant failure。',
        '',
      );
    } else {
      for (const hypothesis of input.hypotheses.hypotheses) {
        sections.push(
          renderHypothesisSection(
            hypothesis,
            input.sourceFeedback,
            input.observablePayload,
            input.patternEvidenceBytes,
          ),
        );
      }
    }
  }

  sections.push(
    '## STOP boundary',
    '',
    'Human 即使选择“继续调查”，本 successor 仍然 STOP；',
    '不得自动进入 modification proposal、candidate、Verifier、promotion 或 implementation。',
    '',
    'STOP',
    '',
  );

  return sections.join('\n');
}

async function saveRawResponses(
  hypothesisDir: string,
  invokeResult: HypothesisInvokeResult,
): Promise<void> {
  if ('rawProviderResponse' in invokeResult && invokeResult.rawProviderResponse !== undefined) {
    await writeCreateOnly(
      join(hypothesisDir, 'raw-provider-response.txt'),
      invokeResult.rawProviderResponse,
    );
  }
  if (invokeResult.ok) {
    await writeCreateOnly(
      join(hypothesisDir, 'raw-participant-response.txt'),
      invokeResult.rawParticipantResponse,
    );
  }
}

async function persistFailure(input: {
  hypothesisDir: string;
  record: HypothesisInvocationRecord;
  source: ExternalFeedbackSource;
  patternEvidenceBytes?: string;
  rawHypothesisParticipantResponse?: string;
}): Promise<string> {
  const humanReportPath = join(input.hypothesisDir, 'human-review.md');
  await writeCreateOnly(join(input.hypothesisDir, 'invocation.json'), canonicalJson(input.record));
  await writeCreateOnly(
    humanReportPath,
    renderHumanReview({
      runRef: input.record.runRef,
      feedbackInvocationRef: input.record.feedbackInvocationRef,
      hypothesisInvocationRef: input.record.hypothesisInvocationRef,
      experimentRootHash: input.record.experimentRootHash,
      observablePayloadHash: input.record.observablePayloadHash,
      feedbackHash: input.record.feedbackHash,
      status: 'failed',
      errorKind: input.record.errorKind,
      participant: input.record.participant,
      sourceFeedback: input.source.feedback,
      sourceFeedbackBytes: input.source.feedbackBytes,
      patternEvidenceHash: input.record.patternEvidenceHash,
      patternEvidenceBytes: input.patternEvidenceBytes,
      rawHypothesisParticipantResponse: input.rawHypothesisParticipantResponse,
      observablePayload: input.source.observablePayload,
    }),
  );
  return humanReportPath;
}

export async function runImprovementHypothesis(
  options: RunImprovementHypothesisOptions,
  testHooks: RunImprovementHypothesisTestHooks = {},
): Promise<RunImprovementHypothesisResult> {
  const localParticipant = options.localParticipant;
  const apiKey = localParticipant ? undefined : requireApiKey(options.apiKey);
  const runRef = validatePhase0RunRef(options.runRef);

  const source = await loadExternalFeedbackSource({
    sourceRoot: resolve(options.sourceRoot ?? DEFAULT_SOURCE_ROOT),
    runRef,
  });
  const normalizedPatternEvidence = options.patternEvidence === undefined
    ? undefined
    : validateExperiencePatternEvidence(options.patternEvidence);
  const patternEvidenceBytes = normalizedPatternEvidence === undefined
    ? undefined
    : canonicalJson(normalizedPatternEvidence);
  const patternEvidenceHash = patternEvidenceBytes === undefined
    ? undefined
    : computeExperiencePatternEvidenceHash(normalizedPatternEvidence!);
  if (
    normalizedPatternEvidence?.patternEvidenceHash !== undefined
    && normalizedPatternEvidence.patternEvidenceHash !== patternEvidenceHash
  ) {
    throw new Error(
      `patternEvidenceHash mismatch: expected ${patternEvidenceHash}, got ${normalizedPatternEvidence.patternEvidenceHash}`,
    );
  }

  const hypothesisInvocationRef = `${runRef}-${localParticipant ? 'local-improvement-hypothesis' : 'deepseek-improvement-hypothesis'}-001`;
  const hypothesisRoot = resolve(options.outRoot ?? DEFAULT_OUT_ROOT);
  const hypothesisRunsRoot = join(hypothesisRoot, 'hypothesis-runs');
  const hypothesisDir = resolvePhase0RunPath(hypothesisRunsRoot, runRef);
  await assertTargetAbsent(hypothesisDir, 'hypothesis run target');
  await mkdir(hypothesisRunsRoot, { recursive: true });
  await mkdir(hypothesisDir, { recursive: false });

  await writeCreateOnly(
    join(hypothesisDir, 'source-observable-payload.json'),
    source.observablePayloadBytes,
  );
  await writeCreateOnly(join(hypothesisDir, 'source-feedback.json'), source.feedbackBytes);
  await writeCreateOnly(
    join(hypothesisDir, 'source-feedback-raw-participant-response.txt'),
    source.rawFeedbackParticipantResponse,
  );
  if (patternEvidenceBytes !== undefined) {
    await writeCreateOnly(
      join(hypothesisDir, 'source-pattern-evidence.json'),
      patternEvidenceBytes,
    );
  }

  let invokeResult: HypothesisInvokeResult;
  let evidenceWorkspace: EvidenceOnlyWorkspaceManifest | undefined;
  if (testHooks.invoke) {
    invokeResult = await testHooks.invoke({
      apiKey: apiKey ?? '',
      invocationRef: hypothesisInvocationRef,
      runRef: source.runRef,
      feedbackInvocationRef: source.feedbackInvocationRef,
      experimentRootHash: source.experimentRootHash,
      observablePayloadHash: source.observablePayloadHash,
      feedbackHash: source.feedbackHash,
      observablePayloadBytes: source.observablePayloadBytes,
      feedbackBytes: source.feedbackBytes,
      ...(patternEvidenceBytes !== undefined ? { patternEvidenceBytes } : {}),
    });
  } else if (localParticipant) {
    evidenceWorkspace = await createEvidenceOnlyWorkspace({
      workspaceRoot: join(hypothesisDir, 'participant-workspace'),
      files: {
        'input/observable-payload.json': source.observablePayloadBytes,
        'input/feedback.json': source.feedbackBytes,
        ...(patternEvidenceBytes !== undefined
          ? { 'input/pattern-evidence.json': patternEvidenceBytes }
          : {}),
      },
    });
    invokeResult = await runLocalEvidenceOnlyParticipant({
      invocationRef: hypothesisInvocationRef,
      role: 'hypothesis',
      workspaceRoot: evidenceWorkspace.workspaceRoot,
      prompt: buildImprovementHypothesisPrompt({
        runRef: source.runRef,
        feedbackInvocationRef: source.feedbackInvocationRef,
        experimentRootHash: source.experimentRootHash,
        observablePayloadHash: source.observablePayloadHash,
        feedbackHash: source.feedbackHash,
        observablePayloadBytes: source.observablePayloadBytes,
        feedbackBytes: source.feedbackBytes,
        ...(patternEvidenceBytes !== undefined ? { patternEvidenceBytes } : {}),
      }),
      participant: localParticipant,
    });
  } else {
    invokeResult = await invokeDeepSeekImprovementHypothesis({
      apiKey: apiKey!,
      invocationRef: hypothesisInvocationRef,
      runRef: source.runRef,
      feedbackInvocationRef: source.feedbackInvocationRef,
      experimentRootHash: source.experimentRootHash,
      observablePayloadHash: source.observablePayloadHash,
      feedbackHash: source.feedbackHash,
      observablePayloadBytes: source.observablePayloadBytes,
      feedbackBytes: source.feedbackBytes,
      ...(patternEvidenceBytes !== undefined ? { patternEvidenceBytes } : {}),
    });
  }

  await saveRawResponses(hypothesisDir, invokeResult);

  const baseRecord = {
    schemaVersion: patternEvidenceBytes === undefined
      ? LEGACY_INVOCATION_SCHEMA_VERSION
      : PATTERN_INVOCATION_SCHEMA_VERSION,
    runRef,
    feedbackInvocationRef: source.feedbackInvocationRef,
    hypothesisInvocationRef,
    experimentRootHash: source.experimentRootHash,
    observablePayloadHash: source.observablePayloadHash,
    feedbackHash: source.feedbackHash,
    ...(patternEvidenceHash !== undefined ? { patternEvidenceHash } : {}),
  } as const;

  if (!invokeResult.ok) {
    await persistFailure({
      hypothesisDir,
      record: {
        ...baseRecord,
        participant: buildParticipant(invokeResult, localParticipant, evidenceWorkspace),
        status: 'failed',
        errorKind: 'provider',
      },
      source,
      patternEvidenceBytes,
    });
    throw new Error(`hypothesis participant invocation failed: ${invokeResult.errorKind}`);
  }

  const participant = buildParticipant(invokeResult, localParticipant, evidenceWorkspace);
  let parsed: ImprovementHypothesisSet;
  try {
    parsed = parseImprovementHypothesisSet(invokeResult.rawParticipantResponse);
  } catch (error) {
    await persistFailure({
      hypothesisDir,
      record: {
        ...baseRecord,
        participant,
        status: 'failed',
        errorKind: 'parse',
      },
      source,
      patternEvidenceBytes,
      rawHypothesisParticipantResponse: invokeResult.rawParticipantResponse,
    });
    throw error;
  }

  try {
    validateImprovementHypothesisReferences(
      parsed,
      source.feedback,
      source.observablePayload,
      normalizedPatternEvidence,
    );
  } catch (error) {
    await persistFailure({
      hypothesisDir,
      record: {
        ...baseRecord,
        participant,
        status: 'failed',
        errorKind: 'invalid_reference',
      },
      source,
      patternEvidenceBytes,
      rawHypothesisParticipantResponse: invokeResult.rawParticipantResponse,
    });
    throw error;
  }

  await writeCreateOnly(join(hypothesisDir, 'hypotheses.json'), canonicalJson(parsed));
  await writeCreateOnly(
    join(hypothesisDir, 'invocation.json'),
    canonicalJson({
      ...baseRecord,
      participant,
      status: 'completed',
    } satisfies HypothesisInvocationRecord),
  );

  const humanReportPath = join(hypothesisDir, 'human-review.md');
  await writeCreateOnly(
    humanReportPath,
    renderHumanReview({
      runRef,
      feedbackInvocationRef: source.feedbackInvocationRef,
      hypothesisInvocationRef,
      experimentRootHash: source.experimentRootHash,
      observablePayloadHash: source.observablePayloadHash,
      feedbackHash: source.feedbackHash,
      patternEvidenceHash,
      status: 'completed',
      participant,
      sourceFeedback: source.feedback,
      sourceFeedbackBytes: source.feedbackBytes,
      patternEvidenceBytes,
      rawHypothesisParticipantResponse: invokeResult.rawParticipantResponse,
      hypotheses: parsed,
      observablePayload: source.observablePayload,
    }),
  );

  return {
    runRef,
    feedbackInvocationRef: source.feedbackInvocationRef,
    hypothesisInvocationRef,
    hypothesisDir,
    humanReportPath,
    experimentRootHash: source.experimentRootHash,
    observablePayloadHash: source.observablePayloadHash,
    feedbackHash: source.feedbackHash,
    ...(patternEvidenceHash !== undefined ? { patternEvidenceHash } : {}),
  };
}

interface CliArgs {
  runRef: string;
  sourceRoot?: string;
  outRoot?: string;
}

function requireValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`missing value for ${flag}`);
  return value;
}

function parseCliArgs(argv: string[]): CliArgs {
  const values = new Map<string, string>();
  const allowed = new Set(['--run-ref', '--source-root', '--out-root']);

  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    if (!allowed.has(flag)) throw new Error(`unknown argument: ${flag}`);
    if (values.has(flag)) throw new Error(`duplicate argument: ${flag}`);
    values.set(flag, requireValue(argv, index, flag));
  }

  if (!values.has('--run-ref')) throw new Error('missing required argument: --run-ref');

  return {
    runRef: values.get('--run-ref')!,
    ...(values.has('--source-root') ? { sourceRoot: values.get('--source-root')! } : {}),
    ...(values.has('--out-root') ? { outRoot: values.get('--out-root')! } : {}),
  };
}

async function main(argv: string[]): Promise<void> {
  await loadDotEnvIfPresent();
  const args = parseCliArgs(argv);
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is required');
  const result = await runImprovementHypothesis({
    runRef: args.runRef,
    apiKey,
    ...(args.sourceRoot !== undefined ? { sourceRoot: args.sourceRoot } : {}),
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

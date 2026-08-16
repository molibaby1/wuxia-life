import { open, lstat, mkdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  parseExternalFeedback,
  validateExternalFeedbackReferences,
  type ExternalFeedback,
} from '../../src/evolution/externalFeedbackContract';
import type { ObservableEntry, ObservablePayload } from '../../src/evolution/playerObservableTranscript';
import { getP8PersonaById } from '../../src/p8/personas';
import type { P8Persona } from '../../src/p8/types';
import {
  DEEPSEEK_PLAYER_EXPERIENCE_MODEL,
  invokeDeepSeekPlayerExperienceFeedback,
  type DeepSeekPlayerExperienceFailure,
  type DeepSeekPlayerExperienceSuccess,
} from './externalFeedback/deepseekPlayerExperienceFeedback';
import {
  canonicalJson,
  resolvePhase0AnchorPath,
  resolvePhase0RunPath,
  sha256Hex,
  validatePhase0RunRef,
  validatePhase0RunSeal,
} from './phase0/provenance';
import { runPhase0 } from './phase0/runPhase0';

const DEFAULT_OUT_ROOT = 'artifacts/reports/evolution/minimal-external-feedback';
const INVOCATION_SCHEMA_VERSION = 'minimal-external-feedback-invocation-v1' as const;
const ALLOWED_OBSERVABLE_REL = join('reviewer-input', 'observable-payload.json');
const SUBJECTIVE_DISCLAIMER = '反馈为该参与者的主观意见，未经过体验正确率/资格评分。';
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

export interface RunMinimalExternalFeedbackOptions {
  runRef: string;
  persona: P8Persona;
  seed: number;
  endAge: number;
  catalogVersion: string;
  maxSteps?: number;
  outRoot?: string;
  apiKey: string;
}

export interface RunMinimalExternalFeedbackTestHooks {
  invoke?: typeof invokeDeepSeekPlayerExperienceFeedback;
}

export interface RunMinimalExternalFeedbackResult {
  runRef: string;
  invocationRef: string;
  phase0RunPath: string;
  feedbackDir: string;
  humanReportPath: string;
  observablePayloadHash: string;
  experimentRootHash: string;
}

interface InvocationParticipant {
  kind: 'llm';
  provider: 'deepseek';
  modelRequested: typeof DEEPSEEK_PLAYER_EXPERIENCE_MODEL;
  modelReturned?: string;
  providerResponseId?: string;
}

interface InvocationRecord {
  schemaVersion: typeof INVOCATION_SCHEMA_VERSION;
  runRef: string;
  invocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
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

function buildParticipant(invokeResult?: DeepSeekPlayerExperienceSuccess): InvocationParticipant {
  return {
    kind: 'llm',
    provider: 'deepseek',
    modelRequested: DEEPSEEK_PLAYER_EXPERIENCE_MODEL,
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
  runRef: string;
  invocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  status: 'completed' | 'failed';
  errorKind?: string;
  participant: InvocationParticipant;
  observablePayload: ObservablePayload;
  rawParticipantResponse?: string;
  parsedFeedback?: ExternalFeedback;
}): string {
  const sections = [
    '# Human Review',
    '',
    `- runRef: ${input.runRef}`,
    `- invocationRef: ${input.invocationRef}`,
    `- experimentRootHash: ${input.experimentRootHash}`,
    `- observablePayloadHash: ${input.observablePayloadHash}`,
    `- provider: ${input.participant.provider}`,
    `- modelRequested: ${input.participant.modelRequested}`,
    ...(input.participant.modelReturned ? [`- modelReturned: ${input.participant.modelReturned}`] : []),
    `- status: ${input.status}`,
    ...(input.errorKind ? [`- errorKind: ${input.errorKind}`] : []),
    '',
    SUBJECTIVE_DISCLAIMER,
    '',
    '## 参与者当时看到的玩家体验',
    '',
    input.observablePayload.entries.map(renderEntry).join('\n\n') || '（无可展示条目）',
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
      '## 解析后的反馈（辅助）',
      '',
      `- overallImpression: ${input.parsedFeedback.overallImpression}`,
      ...input.parsedFeedback.observations.flatMap((observation, index) => [
        `- observation[${index}]: ${observation.feedback}`,
        `  - evidenceRefs: ${observation.evidenceRefs.join(', ') || '(none)'}`,
      ]),
      '',
    );
  }

  return `${sections.join('\n')}\n`;
}

async function persistFailure(input: {
  feedbackDir: string;
  record: InvocationRecord;
  observablePayload: ObservablePayload;
  rawParticipantResponse?: string;
}): Promise<string> {
  const humanReportPath = join(input.feedbackDir, 'human-review.md');
  await writeCreateOnly(join(input.feedbackDir, 'invocation.json'), canonicalJson(input.record));
  await writeCreateOnly(
    humanReportPath,
    renderHumanReview({
      runRef: input.record.runRef,
      invocationRef: input.record.invocationRef,
      experimentRootHash: input.record.experimentRootHash,
      observablePayloadHash: input.record.observablePayloadHash,
      status: 'failed',
      errorKind: input.record.errorKind,
      participant: input.record.participant,
      observablePayload: input.observablePayload,
      rawParticipantResponse: input.rawParticipantResponse,
    }),
  );
  return humanReportPath;
}

async function saveRawResponses(
  feedbackDir: string,
  invokeResult: DeepSeekPlayerExperienceSuccess | DeepSeekPlayerExperienceFailure,
): Promise<void> {
  if (invokeResult.rawProviderResponse !== undefined) {
    await writeCreateOnly(
      join(feedbackDir, 'raw-provider-response.txt'),
      invokeResult.rawProviderResponse,
    );
  }
  if (invokeResult.ok) {
    await writeCreateOnly(
      join(feedbackDir, 'raw-participant-response.txt'),
      invokeResult.rawParticipantResponse,
    );
  }
}

export async function runMinimalExternalFeedback(
  options: RunMinimalExternalFeedbackOptions,
  testHooks: RunMinimalExternalFeedbackTestHooks = {},
): Promise<RunMinimalExternalFeedbackResult> {
  const apiKey = requireApiKey(options.apiKey);
  const runRef = validatePhase0RunRef(options.runRef);
  const invocationRef = `${runRef}-deepseek-player-feedback-001`;
  const outRoot = resolve(options.outRoot ?? DEFAULT_OUT_ROOT);
  const gameRunsRoot = join(outRoot, 'game-runs');
  const anchorRoot = join(outRoot, 'game-run-anchors');
  const feedbackRoot = join(outRoot, 'feedback-runs');
  const phase0RunPath = resolvePhase0RunPath(gameRunsRoot, runRef);
  const anchorPath = resolvePhase0AnchorPath(anchorRoot, runRef);
  const feedbackDir = resolvePhase0RunPath(feedbackRoot, runRef);

  await assertTargetAbsent(phase0RunPath, 'Phase 0 final run target');
  await assertTargetAbsent(anchorPath, 'Phase 0 anchor target');
  await assertTargetAbsent(feedbackDir, 'feedback run target');

  const phase0 = await runPhase0({
    runRef,
    persona: options.persona,
    seed: options.seed,
    endAge: options.endAge,
    catalogVersion: options.catalogVersion,
    ...(options.maxSteps !== undefined ? { maxSteps: options.maxSteps } : {}),
    outRoot: gameRunsRoot,
    anchorRoot,
  });

  await validatePhase0RunSeal(phase0.outDir, phase0.experimentRootHash);

  const observablePayloadBytes = await readFile(join(phase0.outDir, ALLOWED_OBSERVABLE_REL), 'utf8');
  const actualHash = sha256Hex(observablePayloadBytes);
  if (actualHash !== phase0.observablePayloadHash) {
    throw new Error(
      `observable payload hash mismatch: expected ${phase0.observablePayloadHash}, got ${actualHash}`,
    );
  }
  const observablePayload = JSON.parse(observablePayloadBytes) as ObservablePayload;

  await mkdir(feedbackRoot, { recursive: true });
  try {
    await mkdir(feedbackDir, { recursive: false });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'EEXIST') {
      throw new Error(`feedback run target already exists: ${feedbackDir}`);
    }
    throw error;
  }
  await writeCreateOnly(join(feedbackDir, 'observable-payload.json'), observablePayloadBytes);

  const invoke = testHooks.invoke ?? invokeDeepSeekPlayerExperienceFeedback;
  const invokeResult = await invoke({
    apiKey,
    invocationRef,
    observablePayloadBytes,
  });

  await saveRawResponses(feedbackDir, invokeResult);

  const baseRecord = {
    schemaVersion: INVOCATION_SCHEMA_VERSION,
    runRef,
    invocationRef,
    experimentRootHash: phase0.experimentRootHash,
    observablePayloadHash: phase0.observablePayloadHash,
  } as const;

  if (!invokeResult.ok) {
    await persistFailure({
      feedbackDir,
      record: {
        ...baseRecord,
        participant: buildParticipant(),
        status: 'failed',
        errorKind: invokeResult.errorKind,
      },
      observablePayload,
    });
    throw new Error(`external participant invocation failed: ${invokeResult.errorKind}`);
  }

  const participant = buildParticipant(invokeResult);
  let parsed: ExternalFeedback;
  try {
    parsed = parseExternalFeedback(invokeResult.rawParticipantResponse);
  } catch (error) {
    await persistFailure({
      feedbackDir,
      record: {
        ...baseRecord,
        participant,
        status: 'failed',
        errorKind: 'parse',
      },
      observablePayload,
      rawParticipantResponse: invokeResult.rawParticipantResponse,
    });
    throw error;
  }

  try {
    validateExternalFeedbackReferences(parsed, observablePayload);
  } catch (error) {
    await persistFailure({
      feedbackDir,
      record: {
        ...baseRecord,
        participant,
        status: 'failed',
        errorKind: 'invalid_reference',
      },
      observablePayload,
      rawParticipantResponse: invokeResult.rawParticipantResponse,
    });
    throw error;
  }

  await writeCreateOnly(join(feedbackDir, 'feedback.json'), canonicalJson(parsed));
  await writeCreateOnly(
    join(feedbackDir, 'invocation.json'),
    canonicalJson({
      ...baseRecord,
      participant,
      status: 'completed',
    } satisfies InvocationRecord),
  );
  const humanReportPath = join(feedbackDir, 'human-review.md');
  await writeCreateOnly(
    humanReportPath,
    renderHumanReview({
      runRef,
      invocationRef,
      experimentRootHash: phase0.experimentRootHash,
      observablePayloadHash: phase0.observablePayloadHash,
      status: 'completed',
      participant,
      observablePayload,
      rawParticipantResponse: invokeResult.rawParticipantResponse,
      parsedFeedback: parsed,
    }),
  );

  return {
    runRef,
    invocationRef,
    phase0RunPath: phase0.outDir,
    feedbackDir,
    humanReportPath,
    observablePayloadHash: phase0.observablePayloadHash,
    experimentRootHash: phase0.experimentRootHash,
  };
}

interface CliArgs {
  runRef: string;
  personaId: string;
  seed: number;
  endAge: number;
  catalogVersion: string;
  maxSteps?: number;
  outRoot?: string;
}

function requireValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`missing value for ${flag}`);
  return value;
}

function parseIntegerArg(flag: string, value: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new Error(`${flag} must be a safe integer`);
  return parsed;
}

function parseCliArgs(argv: string[]): CliArgs {
  const values = new Map<string, string>();
  const allowed = new Set([
    '--run-ref',
    '--persona',
    '--seed',
    '--end-age',
    '--catalog-version',
    '--max-steps',
    '--out-root',
  ]);

  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    if (!allowed.has(flag)) throw new Error(`unknown argument: ${flag}`);
    if (values.has(flag)) throw new Error(`duplicate argument: ${flag}`);
    values.set(flag, requireValue(argv, index, flag));
  }

  const required = ['--run-ref', '--persona', '--seed', '--end-age', '--catalog-version'] as const;
  for (const flag of required) {
    if (!values.has(flag)) throw new Error(`missing required argument: ${flag}`);
  }

  return {
    runRef: values.get('--run-ref')!,
    personaId: values.get('--persona')!,
    seed: parseIntegerArg('--seed', values.get('--seed')!),
    endAge: parseIntegerArg('--end-age', values.get('--end-age')!),
    catalogVersion: values.get('--catalog-version')!,
    ...(values.has('--max-steps')
      ? { maxSteps: parseIntegerArg('--max-steps', values.get('--max-steps')!) }
      : {}),
    ...(values.has('--out-root') ? { outRoot: values.get('--out-root')! } : {}),
  };
}

async function main(argv: string[]): Promise<void> {
  await loadDotEnvIfPresent();
  const args = parseCliArgs(argv);
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is required');
  const persona = getP8PersonaById(args.personaId);
  if (!persona) throw new Error(`unknown P8 persona: ${args.personaId}`);
  const result = await runMinimalExternalFeedback({
    runRef: args.runRef,
    persona,
    seed: args.seed,
    endAge: args.endAge,
    catalogVersion: args.catalogVersion,
    apiKey,
    ...(args.maxSteps !== undefined ? { maxSteps: args.maxSteps } : {}),
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

import { execFileSync } from 'node:child_process';
import { lstat, mkdir, open, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import {
  buildConservativeSelectionProjection,
  CONSERVATIVE_SELECTION_INPUT_SCHEMA,
  CONSERVATIVE_SELECTION_MAPPING_SCHEMA,
  CONSERVATIVE_SELECTION_RESPONSE_SCHEMA,
  type ConservativeSelectionMapping,
  type ConservativeSelectionInput,
} from './conservativeSelectionContracts';
import {
  CONSERVATIVE_SELECTION_SYSTEM_PROMPT,
  DEEPSEEK_CONSERVATIVE_SELECTION_MODEL,
} from './deepseekConservativeSelection';
import type {
  SelectionPriorityReplayCaseManifest,
  SelectionPriorityReplayPresentation,
} from '../selectionPriorityReplay/selectionPriorityReplay';
import { canonicalJson, sha256Hex } from '../phase0/provenance';

export const CONSERVATIVE_SELECTION_DIAGNOSTIC_CASES = [
  'ordinary-run-20260910-000005',
  'ordinary-run-20260910-000006',
  'ordinary-run-20260910-000007',
  'ordinary-run-20260911-000002',
] as const;

export const CONSERVATIVE_SELECTION_SOURCE_CORPUS_SHA256 =
  '33e7e8cc87e001a7c5fb695f1f9c866189a9acadf9cb1ec3f574b6e69b5d869e' as const;
export const CONSERVATIVE_SELECTION_MODEL = 'deepseek-v4-flash' as const;
export const CONSERVATIVE_SELECTION_EXPERIMENT_SCHEMA = 'ae-conservative-selection-experiment-v1' as const;
export const CONSERVATIVE_SELECTION_ACCEPTANCE_CRITERIA_VERSION = 'conservative-selection-diagnostic-v1' as const;

const FROZEN_INVOCATION_ORDER = [
  ['ordinary-run-20260910-000005', 'original', 1],
  ['ordinary-run-20260910-000006', 'reversed', 1],
  ['ordinary-run-20260910-000007', 'original', 1],
  ['ordinary-run-20260911-000002', 'reversed', 1],
  ['ordinary-run-20260910-000005', 'reversed', 1],
  ['ordinary-run-20260910-000006', 'original', 1],
  ['ordinary-run-20260910-000007', 'reversed', 1],
  ['ordinary-run-20260911-000002', 'original', 1],
  ['ordinary-run-20260910-000006', 'original', 2],
  ['ordinary-run-20260910-000007', 'reversed', 2],
  ['ordinary-run-20260911-000002', 'original', 2],
  ['ordinary-run-20260910-000005', 'reversed', 2],
  ['ordinary-run-20260910-000006', 'reversed', 2],
  ['ordinary-run-20260910-000007', 'original', 2],
  ['ordinary-run-20260911-000002', 'reversed', 2],
  ['ordinary-run-20260910-000005', 'original', 2],
  ['ordinary-run-20260910-000007', 'original', 3],
  ['ordinary-run-20260911-000002', 'reversed', 3],
  ['ordinary-run-20260910-000005', 'original', 3],
  ['ordinary-run-20260910-000006', 'reversed', 3],
  ['ordinary-run-20260910-000007', 'reversed', 3],
  ['ordinary-run-20260911-000002', 'original', 3],
  ['ordinary-run-20260910-000005', 'reversed', 3],
  ['ordinary-run-20260910-000006', 'original', 3],
] as const;

export interface ConservativeSelectionJobManifest {
  jobId: string;
  invocationOrdinal: number;
  caseId: string;
  presentationId: 'original' | 'reversed';
  sampleOrdinal: number;
  model: typeof CONSERVATIVE_SELECTION_MODEL;
  presentationRef: string;
  presentationSha256: string;
  blindInputRef: string;
  blindInputSha256: string;
  mappingRef: string;
  mappingSha256: string;
  systemPromptRef: 'system-prompt.txt';
  systemPromptSha256: string;
  responseSchemaVersion: typeof CONSERVATIVE_SELECTION_RESPONSE_SCHEMA;
  acceptanceCriteriaVersion: typeof CONSERVATIVE_SELECTION_ACCEPTANCE_CRITERIA_VERSION;
}

export interface ConservativeSelectionExperimentManifest {
  schemaVersion: typeof CONSERVATIVE_SELECTION_EXPERIMENT_SCHEMA;
  sourceCorpusRef: string;
  sourceCorpusSha256: typeof CONSERVATIVE_SELECTION_SOURCE_CORPUS_SHA256;
  repositoryBranch: string;
  repositoryHead: string;
  model: typeof CONSERVATIVE_SELECTION_MODEL;
  jobCount: 24;
  systemPromptRef: 'system-prompt.txt';
  systemPromptSha256: string;
  responseSchemaVersion: typeof CONSERVATIVE_SELECTION_RESPONSE_SCHEMA;
  acceptanceCriteriaVersion: typeof CONSERVATIVE_SELECTION_ACCEPTANCE_CRITERIA_VERSION;
  invocationOrder: string[];
  jobs: ConservativeSelectionJobManifest[];
  ordinarySessionsExecuted: false;
  participantInvocationsExecuted: false;
  productionSelectionModified: false;
}

export interface PreparedConservativeSelectionReplay {
  outputRoot: string;
  experiment: ConservativeSelectionExperimentManifest;
}

async function assertAbsent(path: string): Promise<void> {
  try {
    await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`experimental artifact already exists: ${path}`);
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

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

function repositoryText(repoRoot: string, args: string[]): string {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
}

function semanticPresentation(candidate: SelectionPriorityReplayPresentation['candidates'][number]): unknown {
  const {
    presentationIndex: _presentationIndex,
    sourceIndex: _sourceIndex,
    sourceHypothesisId: _sourceHypothesisId,
    sourceHypothesisSha256: _sourceHypothesisSha256,
    ...semantic
  } = candidate;
  return semantic;
}

function assertSemanticParity(
  original: SelectionPriorityReplayPresentation,
  reversed: SelectionPriorityReplayPresentation,
): void {
  const originalSemantic = original.candidates.map(semanticPresentation).map(canonicalJson).sort();
  const reversedSemantic = reversed.candidates.map(semanticPresentation).map(canonicalJson).sort();
  if (canonicalJson(originalSemantic) !== canonicalJson(reversedSemantic)) {
    throw new Error('original and reversed presentation semantic fields do not match');
  }
}

function assertCorpusManifest(corpus: unknown): asserts corpus is {
  schemaVersion: 'ae-selection-priority-replay-corpus-v1';
  caseCount: number;
  cases: Array<{ caseId: string; caseRef: string }>;
  ordinarySessionsExecuted: false;
  participantInvocationsExecuted: false;
  productionSelectionModified: false;
} {
  if (typeof corpus !== 'object' || corpus === null || Array.isArray(corpus)) throw new Error('source corpus must be an object');
  const value = corpus as Record<string, unknown>;
  if (value.schemaVersion !== 'ae-selection-priority-replay-corpus-v1') throw new Error('source corpus schemaVersion is invalid');
  if (value.caseCount !== 8 || !Array.isArray(value.cases)) throw new Error('source corpus caseCount is invalid');
  if (value.ordinarySessionsExecuted !== false || value.participantInvocationsExecuted !== false || value.productionSelectionModified !== false) {
    throw new Error('source corpus execution flags are invalid');
  }
}

export async function prepareConservativeSelectionReplay(options: {
  repoRoot?: string;
  sourceRoot?: string;
  outputRoot: string;
}): Promise<PreparedConservativeSelectionReplay> {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const sourceRoot = resolve(options.sourceRoot ?? join(repoRoot, 'artifacts/ae-selection-priority-replay-v1-20260911'));
  const outputRoot = resolve(options.outputRoot);
  await assertAbsent(outputRoot);
  const corpusPath = join(sourceRoot, 'corpus.json');
  const corpusBytes = await readFile(corpusPath, 'utf8');
  if (sha256Hex(corpusBytes) !== CONSERVATIVE_SELECTION_SOURCE_CORPUS_SHA256) throw new Error('source corpus SHA-256 does not match frozen corpus');
  const corpus = JSON.parse(corpusBytes) as unknown;
  assertCorpusManifest(corpus);
  const caseIds = new Set(corpus.cases.map(item => item.caseId));
  for (const caseId of CONSERVATIVE_SELECTION_DIAGNOSTIC_CASES) {
    if (!caseIds.has(caseId)) throw new Error(`diagnostic case is absent from source corpus: ${caseId}`);
  }

  const repositoryBranch = repositoryText(repoRoot, ['branch', '--show-current']);
  const repositoryHead = repositoryText(repoRoot, ['rev-parse', 'HEAD']);
  const systemPromptSha256 = sha256Hex(CONSERVATIVE_SELECTION_SYSTEM_PROMPT);
  const jobs: ConservativeSelectionJobManifest[] = [];
  const projections = new Map<string, {
    presentation: SelectionPriorityReplayPresentation;
    input: ConservativeSelectionInput;
    mapping: ConservativeSelectionMapping;
    presentationRef: string;
  }>();

  for (const caseId of CONSERVATIVE_SELECTION_DIAGNOSTIC_CASES) {
    const caseRoot = join(sourceRoot, caseId);
    const caseManifest = await readJson<SelectionPriorityReplayCaseManifest>(join(caseRoot, 'case.json'));
    if (caseManifest.caseId !== caseId || caseManifest.hypothesisCount <= 0) throw new Error(`invalid frozen case manifest: ${caseId}`);
    const sourcePath = join(caseRoot, 'source', 'hypotheses.json');
    const sourceBytes = await readFile(sourcePath, 'utf8');
    if (sha256Hex(sourceBytes) !== caseManifest.sourceSha256) throw new Error(`source artifact hash mismatch: ${caseId}`);
    const originalPath = join(caseRoot, 'presentations', 'original.json');
    const reversedPath = join(caseRoot, 'presentations', 'reversed.json');
    const original = await readJson<SelectionPriorityReplayPresentation>(originalPath);
    const reversed = await readJson<SelectionPriorityReplayPresentation>(reversedPath);
    if (original.sourceHypothesesSha256 !== caseManifest.sourceSha256 || reversed.sourceHypothesesSha256 !== caseManifest.sourceSha256) {
      throw new Error(`presentation source hash mismatch: ${caseId}`);
    }
    assertSemanticParity(original, reversed);
    for (const [presentationId, presentation, presentationPath] of [
      ['original', original, originalPath],
      ['reversed', reversed, reversedPath],
    ] as const) {
      const projection = buildConservativeSelectionProjection(presentation);
      projections.set(`${caseId}:${presentationId}`, {
        presentation,
        input: projection.input,
        mapping: projection.mapping,
        presentationRef: relative(repoRoot, presentationPath).split('/').join('/'),
      });
    }
  }

  const systemPromptBytes = `${CONSERVATIVE_SELECTION_SYSTEM_PROMPT}\n`;
  const experiment: ConservativeSelectionExperimentManifest = {
    schemaVersion: CONSERVATIVE_SELECTION_EXPERIMENT_SCHEMA,
    sourceCorpusRef: relative(repoRoot, corpusPath).split('/').join('/'),
    sourceCorpusSha256: CONSERVATIVE_SELECTION_SOURCE_CORPUS_SHA256,
    repositoryBranch,
    repositoryHead,
    model: CONSERVATIVE_SELECTION_MODEL,
    jobCount: 24,
    systemPromptRef: 'system-prompt.txt',
    systemPromptSha256: sha256Hex(systemPromptBytes),
    responseSchemaVersion: CONSERVATIVE_SELECTION_RESPONSE_SCHEMA,
    acceptanceCriteriaVersion: CONSERVATIVE_SELECTION_ACCEPTANCE_CRITERIA_VERSION,
    invocationOrder: [],
    jobs,
    ordinarySessionsExecuted: false,
    participantInvocationsExecuted: false,
    productionSelectionModified: false,
  };
  await writeCreateOnly(join(outputRoot, 'system-prompt.txt'), systemPromptBytes);

  for (const [invocationIndex, [caseId, presentationId, sampleOrdinal]] of FROZEN_INVOCATION_ORDER.entries()) {
    const jobId = `job-${String(invocationIndex + 1).padStart(3, '0')}`;
    const projection = projections.get(`${caseId}:${presentationId}`);
    if (!projection) throw new Error(`missing prepared projection: ${caseId}:${presentationId}`);
    const inputBytes = `${canonicalJson(projection.input)}\n`;
    const mappingBytes = `${canonicalJson(projection.mapping)}\n`;
    const job: ConservativeSelectionJobManifest = {
      jobId,
      invocationOrdinal: invocationIndex + 1,
      caseId,
      presentationId,
      sampleOrdinal,
      model: CONSERVATIVE_SELECTION_MODEL,
      presentationRef: projection.presentationRef,
      presentationSha256: projection.presentation.presentationSha256,
      blindInputRef: `jobs/${jobId}/input.json`,
      blindInputSha256: sha256Hex(canonicalJson(projection.input)),
      mappingRef: `jobs/${jobId}/mapping.json`,
      mappingSha256: sha256Hex(mappingBytes),
      systemPromptRef: 'system-prompt.txt',
      systemPromptSha256: experiment.systemPromptSha256,
      responseSchemaVersion: CONSERVATIVE_SELECTION_RESPONSE_SCHEMA,
      acceptanceCriteriaVersion: CONSERVATIVE_SELECTION_ACCEPTANCE_CRITERIA_VERSION,
    };
    jobs.push(job);
    experiment.invocationOrder.push(jobId);
    await writeCreateOnly(join(outputRoot, job.blindInputRef), inputBytes);
    await writeCreateOnly(join(outputRoot, job.mappingRef), mappingBytes);
    await writeCreateOnly(join(outputRoot, `jobs/${jobId}/job.json`), `${canonicalJson(job)}\n`);
  }
  await writeCreateOnly(join(outputRoot, 'experiment.json'), `${canonicalJson(experiment)}\n`);
  return { outputRoot, experiment };
}

function argumentValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

if (process.argv[1]?.endsWith('prepareConservativeSelectionReplay.ts')) {
  const repoRoot = argumentValue(process.argv.slice(2), '--repo-root') ?? process.cwd();
  const outputRoot = argumentValue(process.argv.slice(2), '--output-root')
    ?? join(repoRoot, 'artifacts/ae-conservative-selection-override-replay-v1-20260914');
  prepareConservativeSelectionReplay({ repoRoot, outputRoot })
    .then(prepared => console.log(`prepared ${prepared.experiment.jobCount} jobs at ${prepared.outputRoot}`))
    .catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
}

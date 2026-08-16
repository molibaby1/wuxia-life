import { open, lstat, mkdir, mkdtemp } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createDefaultRuntimeEventCatalog } from '../../../src/core/EventLoaderRuntimeCatalog';
import type { RuntimeEventCatalog } from '../../../src/core/RuntimeEventCatalog';
import {
  HEADLESS_API_PLAYER_SURFACE_ID,
  serializeObservablePayload,
} from '../../../src/evolution/playerObservableTranscript';
import { projectHeadlessApiPlayerObservablePayload } from '../../../src/evolution/wuxiaPlayerObservableProjector';
import { EXPERIENCE_TRACE_SELECTION_POLICY } from '../../../src/headless/playability/experienceTraceTypes';
import { runHeadlessPersona } from '../../../src/headless/playability/headlessPersonaRunner';
import { HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION } from '../../../src/headless/playability/playerSurfaceCapture';
import { getP8PersonaById } from '../../../src/p8/personas';
import type { P8Persona } from '../../../src/p8/types';
import {
  canonicalJson,
  captureCatalogInput,
  captureWorktreeSourceFingerprint,
  createExperimentEnvelope,
  publishPhase0RunNoReplace,
  resolvePhase0AnchorPath,
  resolvePhase0RunPath,
  sealPhase0Run,
  sha256Hex,
  validatePhase0RunRef,
  validatePhase0RunSeal,
  writePhase0RunAnchor,
} from './provenance';

const DEFAULT_PHASE0_OUT_ROOT = '.tmp/evolution/phase0';
const DEFAULT_PHASE0_ANCHOR_ROOT = '.tmp/evolution/phase0-anchors';
const DEFAULT_MAX_STEPS = 2400;
const PHASE0_ORCHESTRATOR_ACTOR = 'phase0-orchestrator-v1';
const PHASE0_RUN_INPUT_VERSION = 'phase0-run-input-v1' as const;
const PHASE0_RUN_DATA_ACCESS_MANIFEST_VERSION = 'phase0-run-data-access-manifest-v1' as const;

export interface RunPhase0Options {
  runRef: string;
  outRoot?: string;
  anchorRoot?: string;
  persona: P8Persona;
  seed: number;
  endAge: number;
  catalogVersion: string;
  maxSteps?: number;
  runtimeCatalog?: RuntimeEventCatalog;
}

/** Test-only orchestration barriers for deterministic failure-path coverage. */
export interface RunPhase0TestHooks {
  beforePublish?: (context: {
    stagingDir: string;
    finalRunPath: string;
    anchorPath: string;
    experimentRootHash: string;
  }) => void | Promise<void>;
  beforeAnchor?: (context: {
    stagingDir: string;
    finalRunPath: string;
    anchorPath: string;
    experimentRootHash: string;
  }) => void | Promise<void>;
}

export interface RunPhase0Result {
  runRef: string;
  outDir: string;
  anchorPath: string;
  observablePayloadHash: string;
  experimentRootHash: string;
}

interface Phase0RunInputV1 {
  schemaVersion: typeof PHASE0_RUN_INPUT_VERSION;
  runRef: string;
  seed: number;
  endAge: number;
  catalogVersion: string;
  maxSteps: number;
  surfaceId: typeof HEADLESS_API_PLAYER_SURFACE_ID;
  playerSurfaceSourceVersion: typeof HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION;
  selectionPolicy: typeof EXPERIENCE_TRACE_SELECTION_POLICY;
  activePlanningDecisionSurface: 'excluded';
}

interface Phase0RunDataAccessManifestV1 {
  schemaVersion: typeof PHASE0_RUN_DATA_ACCESS_MANIFEST_VERSION;
  allowedRunData: ['reviewer-input/observable-payload.json'];
  forbiddenRunData: [
    'internal/player-surface-source.json',
    'provenance/experiment-envelope.json',
    'provenance/source-fingerprint.json',
    'inputs/run-input.json',
    'inputs/persona.json',
    'inputs/catalog.json',
  ];
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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

async function assertTargetAbsent(path: string, label: 'final run' | 'anchor'): Promise<void> {
  if (await exists(path)) {
    throw new Error(`Phase 0 ${label} target already exists: ${path}`);
  }
}

function resolveStagingRoot(outRoot: string): string {
  const resolvedOutRoot = resolve(outRoot);
  return join(dirname(resolvedOutRoot), 'phase0-staging');
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

async function writeCanonicalJsonArtifact(stagingDir: string, path: string, value: unknown): Promise<void> {
  await writeCreateOnly(join(stagingDir, path), canonicalJson(value));
}

function contentRef(value: unknown): string {
  return sha256Hex(Buffer.from(canonicalJson(value), 'utf8'));
}

function validateInteger(name: string, value: number, minimum?: number): void {
  if (!Number.isSafeInteger(value) || (minimum !== undefined && value < minimum)) {
    throw new Error(`${name} must be a safe integer${minimum !== undefined ? ` >= ${minimum}` : ''}`);
  }
}

export async function runPhase0(
  options: RunPhase0Options,
  testHooks: RunPhase0TestHooks = {},
): Promise<RunPhase0Result> {
  const runRef = validatePhase0RunRef(options.runRef);
  validateInteger('seed', options.seed);
  validateInteger('endAge', options.endAge, 0);
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
  validateInteger('maxSteps', maxSteps, 1);
  if (!options.catalogVersion.trim()) throw new Error('catalogVersion must not be empty');

  const outRoot = resolve(options.outRoot ?? DEFAULT_PHASE0_OUT_ROOT);
  const anchorRoot = resolve(options.anchorRoot ?? DEFAULT_PHASE0_ANCHOR_ROOT);
  const finalRunPath = resolvePhase0RunPath(outRoot, runRef);
  const anchorPath = resolvePhase0AnchorPath(anchorRoot, runRef);

  // Preflight both externally visible identities before simulation starts.
  await assertTargetAbsent(finalRunPath, 'final run');
  await assertTargetAbsent(anchorPath, 'anchor');

  const stagingRoot = resolveStagingRoot(outRoot);
  await mkdir(stagingRoot, { recursive: true });
  const stagingDir = await mkdtemp(join(stagingRoot, `${runRef}-`));

  const runtimeCatalog = options.runtimeCatalog ?? createDefaultRuntimeEventCatalog();
  const sourceFingerprint = await captureWorktreeSourceFingerprint(process.cwd());
  const catalogInput = captureCatalogInput(runtimeCatalog);
  const personaInput = cloneJson(options.persona);
  const runInput: Phase0RunInputV1 = {
    schemaVersion: PHASE0_RUN_INPUT_VERSION,
    runRef,
    seed: options.seed,
    endAge: options.endAge,
    catalogVersion: options.catalogVersion,
    maxSteps,
    surfaceId: HEADLESS_API_PLAYER_SURFACE_ID,
    playerSurfaceSourceVersion: HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION,
    selectionPolicy: EXPERIENCE_TRACE_SELECTION_POLICY,
    activePlanningDecisionSurface: 'excluded',
  };

  await writeCanonicalJsonArtifact(stagingDir, 'inputs/run-input.json', runInput);
  await writeCanonicalJsonArtifact(stagingDir, 'inputs/persona.json', personaInput);
  await writeCanonicalJsonArtifact(stagingDir, 'inputs/catalog.json', catalogInput);
  await writeCanonicalJsonArtifact(stagingDir, 'provenance/source-fingerprint.json', sourceFingerprint);

  const run = await runHeadlessPersona({
    persona: options.persona,
    endAge: options.endAge,
    catalogVersion: options.catalogVersion,
    maxSteps,
    seed: options.seed,
    runtimeCatalog,
    playerSurfaceTrace: true,
  });
  if (!run.playerSurfaceTrace) {
    throw new Error('Phase 0 run did not produce player surface trace');
  }

  const surfaceSource = cloneJson(run.playerSurfaceTrace);
  await writeCanonicalJsonArtifact(stagingDir, 'internal/player-surface-source.json', surfaceSource);

  const observablePayload = projectHeadlessApiPlayerObservablePayload(surfaceSource);
  const observablePayloadBytes = serializeObservablePayload(observablePayload);
  const observablePayloadHash = sha256Hex(Buffer.from(observablePayloadBytes, 'utf8'));
  await writeCreateOnly(
    join(stagingDir, 'reviewer-input/observable-payload.json'),
    observablePayloadBytes,
  );

  const sourceFingerprintHash = contentRef(sourceFingerprint);
  const configFingerprint = contentRef(catalogInput);
  const seedRef = contentRef({ seed: options.seed });
  const personaRef = contentRef(personaInput);
  const policyRef = contentRef(EXPERIENCE_TRACE_SELECTION_POLICY);
  const envelope = createExperimentEnvelope({
    runRef,
    sourceFingerprint: sourceFingerprintHash,
    configFingerprint,
    seedRef,
    personaRef,
    policyRef,
    endAge: options.endAge,
    observablePayloadHash,
  });
  await writeCanonicalJsonArtifact(stagingDir, 'provenance/experiment-envelope.json', envelope);

  const accessManifest: Phase0RunDataAccessManifestV1 = {
    schemaVersion: PHASE0_RUN_DATA_ACCESS_MANIFEST_VERSION,
    allowedRunData: ['reviewer-input/observable-payload.json'],
    forbiddenRunData: [
      'internal/player-surface-source.json',
      'provenance/experiment-envelope.json',
      'provenance/source-fingerprint.json',
      'inputs/run-input.json',
      'inputs/persona.json',
      'inputs/catalog.json',
    ],
  };
  await writeCanonicalJsonArtifact(
    stagingDir,
    'provenance/phase0-run-data-access-manifest.json',
    accessManifest,
  );

  const { experimentRootHash } = await sealPhase0Run(stagingDir, runRef);
  await validatePhase0RunSeal(stagingDir, experimentRootHash);

  await testHooks.beforePublish?.({ stagingDir, finalRunPath, anchorPath, experimentRootHash });
  await publishPhase0RunNoReplace(stagingDir, finalRunPath, experimentRootHash);

  await testHooks.beforeAnchor?.({ stagingDir, finalRunPath, anchorPath, experimentRootHash });
  const writtenAnchorPath = await writePhase0RunAnchor(anchorRoot, {
    schemaVersion: 'phase0-run-anchor-v1',
    runRef,
    experimentRootHash,
    status: 'generated_awaiting_human',
    timestamp: new Date().toISOString(),
    actorRef: PHASE0_ORCHESTRATOR_ACTOR,
  });

  return {
    runRef,
    outDir: finalRunPath,
    anchorPath: writtenAnchorPath,
    observablePayloadHash,
    experimentRootHash,
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
  anchorRoot?: string;
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
    '--anchor-root',
  ]);

  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    if (!allowed.has(flag)) throw new Error(`unknown Phase 0 argument: ${flag}`);
    if (values.has(flag)) throw new Error(`duplicate Phase 0 argument: ${flag}`);
    values.set(flag, requireValue(argv, index, flag));
  }

  const required = ['--run-ref', '--persona', '--seed', '--end-age', '--catalog-version'] as const;
  for (const flag of required) {
    if (!values.has(flag)) throw new Error(`missing required Phase 0 argument: ${flag}`);
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
    ...(values.has('--anchor-root') ? { anchorRoot: values.get('--anchor-root')! } : {}),
  };
}

async function main(argv: string[]): Promise<void> {
  const args = parseCliArgs(argv);
  const persona = getP8PersonaById(args.personaId);
  if (!persona) throw new Error(`unknown P8 persona: ${args.personaId}`);
  const result = await runPhase0({
    runRef: args.runRef,
    persona,
    seed: args.seed,
    endAge: args.endAge,
    catalogVersion: args.catalogVersion,
    ...(args.maxSteps !== undefined ? { maxSteps: args.maxSteps } : {}),
    ...(args.outRoot !== undefined ? { outRoot: args.outRoot } : {}),
    ...(args.anchorRoot !== undefined ? { anchorRoot: args.anchorRoot } : {}),
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

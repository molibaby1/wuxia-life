import { spawnSync } from 'node:child_process';
import { open, lstat, mkdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  canonicalJson,
  sha256Hex,
  validatePhase0RunSeal,
} from '../phase0/provenance';
import {
  COHORT_CATALOG_VERSION,
  COHORT_END_AGE,
  COHORT_REGISTRATIONS,
  buildCohortPlan,
  validateCohortRegistrations,
  type CohortPlan,
} from './cohortPlan';
import { EXPECTED_CANDIDATE_CATALOG_SHA256 } from './prepareRuntimeWorkspace';

export interface CohortPhase0RunRecord {
  cohortRunId: string;
  runRef: string;
  personaId: string;
  seed: number;
  outDir: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  sourceFingerprintHash: string;
  catalogSha256: string;
}

export interface CohortPhase0BatchResult {
  plan: CohortPlan;
  runs: CohortPhase0RunRecord[];
  sharedSourceFingerprintHash: string;
  sharedCatalogSha256: string;
}

interface Phase0CliResult {
  runRef: string;
  outDir: string;
  anchorPath: string;
  observablePayloadHash: string;
  experimentRootHash: string;
}

async function assertAbsent(path: string, label: string): Promise<void> {
  try {
    await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`${label} already exists: ${path}`);
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

function runPhase0InRuntimeWorkspace(input: {
  runtimeWorkspace: string;
  runRef: string;
  personaId: string;
  seed: number;
  outRoot: string;
  anchorRoot: string;
}): Phase0CliResult {
  // Must execute workspace-local Phase0 so Candidate C catalog/modules load — not root origin.
  const result = spawnSync(
    'bun',
    [
      'scripts/evolution/phase0/runPhase0.ts',
      '--run-ref',
      input.runRef,
      '--persona',
      input.personaId,
      '--seed',
      String(input.seed),
      '--end-age',
      String(COHORT_END_AGE),
      '--catalog-version',
      COHORT_CATALOG_VERSION,
      '--out-root',
      input.outRoot,
      '--anchor-root',
      input.anchorRoot,
    ],
    {
      cwd: input.runtimeWorkspace,
      encoding: 'utf8',
      env: process.env,
    },
  );
  if (result.status !== 0) {
    throw new Error(
      `Phase0 failed for ${input.runRef}: ${result.stderr || result.stdout || `exit ${String(result.status)}`}`,
    );
  }
  const lines = result.stdout.trim().split(/\r?\n/).filter(Boolean);
  const last = lines[lines.length - 1];
  if (!last) throw new Error(`Phase0 produced no JSON result for ${input.runRef}`);
  return JSON.parse(last) as Phase0CliResult;
}

export async function runCohortPhase0Batch(input: {
  runtimeWorkspace: string;
  outRoot: string;
  anchorRoot: string;
  mappingPath: string;
}): Promise<CohortPhase0BatchResult> {
  const plan = buildCohortPlan();
  validateCohortRegistrations(plan.registrations);
  await assertAbsent(input.mappingPath, 'cohort run mapping');

  const outRoot = resolve(input.outRoot);
  const anchorRoot = resolve(input.anchorRoot);
  const runtimeWorkspace = resolve(input.runtimeWorkspace);
  const runs: CohortPhase0RunRecord[] = [];
  let sharedSourceFingerprintHash: string | undefined;
  let sharedCatalogSha256: string | undefined;

  for (const registration of COHORT_REGISTRATIONS) {
    const runRef = registration.cohortRunId;
    const result = runPhase0InRuntimeWorkspace({
      runtimeWorkspace,
      runRef,
      personaId: registration.personaId,
      seed: registration.seed,
      outRoot,
      anchorRoot,
    });
    await validatePhase0RunSeal(result.outDir, result.experimentRootHash);

    const catalogBytes = await readFile(join(result.outDir, 'inputs', 'catalog.json'));
    const catalogSha256 = sha256Hex(catalogBytes);
    if (catalogSha256 !== EXPECTED_CANDIDATE_CATALOG_SHA256) {
      throw new Error(
        `catalog hash mismatch for ${runRef}: expected ${EXPECTED_CANDIDATE_CATALOG_SHA256}, got ${catalogSha256}`,
      );
    }

    const runInput = await readJson<{ seed: number }>(
      join(result.outDir, 'inputs', 'run-input.json'),
    );
    const personaInput = await readJson<{ id: string }>(
      join(result.outDir, 'inputs', 'persona.json'),
    );
    if (runInput.seed !== registration.seed) {
      throw new Error(`seed mismatch for ${runRef}`);
    }
    if (personaInput.id !== registration.personaId) {
      throw new Error(`persona mismatch for ${runRef}`);
    }

    const fingerprint = await readJson<unknown>(
      join(result.outDir, 'provenance', 'source-fingerprint.json'),
    );
    const sourceFingerprintHash = sha256Hex(canonicalJson(fingerprint));
    const envelope = await readJson<{ sourceFingerprint: string; configFingerprint: string }>(
      join(result.outDir, 'provenance', 'experiment-envelope.json'),
    );
    if (envelope.sourceFingerprint !== sourceFingerprintHash) {
      throw new Error(`source fingerprint envelope mismatch for ${runRef}`);
    }
    if (envelope.configFingerprint !== catalogSha256) {
      throw new Error(`catalog fingerprint envelope mismatch for ${runRef}`);
    }

    if (sharedSourceFingerprintHash === undefined) {
      sharedSourceFingerprintHash = sourceFingerprintHash;
    } else if (sharedSourceFingerprintHash !== sourceFingerprintHash) {
      throw new Error('cohort Phase0 source fingerprints are not identical');
    }
    if (sharedCatalogSha256 === undefined) {
      sharedCatalogSha256 = catalogSha256;
    } else if (sharedCatalogSha256 !== catalogSha256) {
      throw new Error('cohort Phase0 catalogs are not identical');
    }

    runs.push({
      cohortRunId: registration.cohortRunId,
      runRef,
      personaId: registration.personaId,
      seed: registration.seed,
      outDir: result.outDir,
      experimentRootHash: result.experimentRootHash,
      observablePayloadHash: result.observablePayloadHash,
      sourceFingerprintHash,
      catalogSha256,
    });
  }

  if (runs.length !== COHORT_REGISTRATIONS.length) {
    throw new Error(
      `expected exactly ${COHORT_REGISTRATIONS.length} sealed cohort runs, got ${runs.length}`,
    );
  }
  if (!sharedSourceFingerprintHash || !sharedCatalogSha256) {
    throw new Error('cohort Phase0 shared fingerprints were not established');
  }

  const mapping = {
    schemaVersion: 'cross-run-cohort-run-mapping-v1',
    plan,
    sharedSourceFingerprintHash,
    sharedCatalogSha256,
    runs,
  };
  await writeCreateOnly(input.mappingPath, `${canonicalJson(mapping)}\n`);

  return {
    plan,
    runs,
    sharedSourceFingerprintHash,
    sharedCatalogSha256,
  };
}

async function main(argv: string[]): Promise<void> {
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!flag || !value || value.startsWith('--')) {
      throw new Error(`invalid arguments near ${String(flag)}`);
    }
    values.set(flag, value);
  }
  const required = [
    '--runtime-workspace',
    '--out-root',
    '--anchor-root',
    '--mapping-path',
  ] as const;
  for (const flag of required) {
    if (!values.has(flag)) throw new Error(`missing required argument: ${flag}`);
  }
  const result = await runCohortPhase0Batch({
    runtimeWorkspace: resolve(values.get('--runtime-workspace')!),
    outRoot: resolve(values.get('--out-root')!),
    anchorRoot: resolve(values.get('--anchor-root')!),
    mappingPath: resolve(values.get('--mapping-path')!),
  });
  process.stdout.write(`${canonicalJson({
    runCount: result.runs.length,
    sharedSourceFingerprintHash: result.sharedSourceFingerprintHash,
    sharedCatalogSha256: result.sharedCatalogSha256,
  })}\n`);
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error);
    process.exit(1);
  });
}

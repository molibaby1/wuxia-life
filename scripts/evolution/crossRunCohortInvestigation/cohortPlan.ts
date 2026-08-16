import { open, lstat, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { canonicalJson, sha256Hex } from '../phase0/provenance';

export const COHORT_SIGNAL_DEFINITION =
  'exact_player_observable_lines_from_fixed_candidate_c_baseline' as const;

export const COHORT_SIGNAL_LINES = [
  '银两已用尽，当前可见资源压力较高。',
  '银两已透支，当前可见资源压力较高。',
] as const;

export const COHORT_END_AGE = 80;
export const COHORT_CATALOG_VERSION = '1.0.0';
export const COHORT_ANCHOR_PERSONA_ID = 'p8-scholar-su';
export const COHORT_ANCHOR_SEED = 101;

export const COHORT_PLAN_SCHEMA_VERSION = 'cross-run-cohort-plan-v1' as const;

/** Fixed official P8 roster for this experiment. Anchor persona/seed is excluded. */
export const COHORT_REGISTRATIONS = [
  { cohortRunId: 'cohort-run-000001', personaId: 'p8-martial-lin', seed: 801 },
  { cohortRunId: 'cohort-run-000002', personaId: 'p8-scholar-su', seed: 802 },
  { cohortRunId: 'cohort-run-000003', personaId: 'p8-social-gu', seed: 803 },
  { cohortRunId: 'cohort-run-000004', personaId: 'p8-wealth-shen', seed: 804 },
  { cohortRunId: 'cohort-run-000005', personaId: 'p8-cautious-han', seed: 805 },
  { cohortRunId: 'cohort-run-000006', personaId: 'p8-deviant-ye', seed: 806 },
  { cohortRunId: 'cohort-run-000007', personaId: 'p8-explorer-lu', seed: 807 },
  { cohortRunId: 'cohort-run-000008', personaId: 'p8-balanced-wei', seed: 808 },
] as const;

export type CohortRegistration = (typeof COHORT_REGISTRATIONS)[number];

export interface CohortPlan {
  schemaVersion: typeof COHORT_PLAN_SCHEMA_VERSION;
  endAge: typeof COHORT_END_AGE;
  catalogVersion: typeof COHORT_CATALOG_VERSION;
  signalDefinition: typeof COHORT_SIGNAL_DEFINITION;
  signalLines: typeof COHORT_SIGNAL_LINES;
  anchorExcluded: {
    personaId: typeof COHORT_ANCHOR_PERSONA_ID;
    seed: typeof COHORT_ANCHOR_SEED;
  };
  registrations: CohortRegistration[];
}

export function buildCohortPlan(): CohortPlan {
  return {
    schemaVersion: COHORT_PLAN_SCHEMA_VERSION,
    endAge: COHORT_END_AGE,
    catalogVersion: COHORT_CATALOG_VERSION,
    signalDefinition: COHORT_SIGNAL_DEFINITION,
    signalLines: COHORT_SIGNAL_LINES,
    anchorExcluded: {
      personaId: COHORT_ANCHOR_PERSONA_ID,
      seed: COHORT_ANCHOR_SEED,
    },
    registrations: [...COHORT_REGISTRATIONS],
  };
}

export function validateCohortRegistrations(
  registrations: readonly { cohortRunId: string; personaId: string; seed: number }[],
): void {
  if (registrations.length !== COHORT_REGISTRATIONS.length) {
    throw new Error(
      `cohort registration count must be ${COHORT_REGISTRATIONS.length}, got ${registrations.length}`,
    );
  }

  const expectedIds = new Set(COHORT_REGISTRATIONS.map(entry => entry.cohortRunId));
  const seenIds = new Set<string>();
  const seenPersonaSeed = new Set<string>();

  for (let index = 0; index < registrations.length; index += 1) {
    const actual = registrations[index]!;
    const expected = COHORT_REGISTRATIONS[index]!;
    if (actual.cohortRunId !== expected.cohortRunId) {
      throw new Error(`cohort registration order mismatch at index ${index}`);
    }
    if (actual.personaId !== expected.personaId || actual.seed !== expected.seed) {
      throw new Error(`cohort registration mismatch for ${expected.cohortRunId}`);
    }
    if (seenIds.has(actual.cohortRunId)) {
      throw new Error(`duplicate cohortRunId: ${actual.cohortRunId}`);
    }
    seenIds.add(actual.cohortRunId);
    if (!expectedIds.has(actual.cohortRunId)) {
      throw new Error(`unexpected cohortRunId: ${actual.cohortRunId}`);
    }
    if (
      actual.personaId === COHORT_ANCHOR_PERSONA_ID
      && actual.seed === COHORT_ANCHOR_SEED
    ) {
      throw new Error('anchor p8-scholar-su / seed 101 must not be a cohort registration');
    }
    const personaSeedKey = `${actual.personaId}:${actual.seed}`;
    if (seenPersonaSeed.has(personaSeedKey)) {
      throw new Error(`duplicate persona/seed registration: ${personaSeedKey}`);
    }
    seenPersonaSeed.add(personaSeedKey);
  }

  if (seenIds.size !== expectedIds.size) {
    throw new Error('cohort registration set does not match the fixed roster');
  }
}

export function assertSignalLinesPresentInText(sourceText: string): void {
  for (const line of COHORT_SIGNAL_LINES) {
    if (!sourceText.includes(line)) {
      throw new Error(`preregistered signal missing from sealed source evidence: ${line}`);
    }
  }
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

export async function writeCohortPlanCreateOnly(path: string): Promise<{
  plan: CohortPlan;
  planHash: string;
}> {
  const plan = buildCohortPlan();
  validateCohortRegistrations(plan.registrations);
  const bytes = `${canonicalJson(plan)}\n`;
  await assertAbsent(path, 'cohort plan');
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(bytes);
  } finally {
    await handle.close();
  }
  return { plan, planHash: sha256Hex(bytes) };
}

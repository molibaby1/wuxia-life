import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  serializeObservablePayload,
  type ObservableEntry,
  type ObservablePayload,
} from '../../../src/evolution/playerObservableTranscript';
import {
  HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION,
  type HeadlessApiPlayerSurfaceStep,
  type HeadlessApiPlayerSurfaceTrace,
} from '../../../src/headless/playability/playerSurfaceCapture';
import {
  resolveActiveActionIdFromSurfaceStep,
} from '../hypothesisInvestigation/buildInvestigationEvidence';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import {
  COHORT_REGISTRATIONS,
  COHORT_SIGNAL_DEFINITION,
  COHORT_SIGNAL_LINES,
  type CohortPlan,
  validateCohortRegistrations,
} from './cohortPlan';

export const COHORT_EVIDENCE_SCHEMA_VERSION = 'cross-run-cohort-evidence-v1' as const;

export interface CohortPressureEntry {
  entryId: string;
  age?: number;
  matchedSignalLine: string;
  actionId: string;
}

export interface CohortPressureAgeRange {
  min: number;
  max: number;
}

export interface CohortRunSummary {
  cohortRunId: string;
  pressureEntryCount: number;
  pressureAgeRange: CohortPressureAgeRange | null;
  pressureEntries: CohortPressureEntry[];
}

export interface CohortEvidenceBundle {
  schemaVersion: typeof COHORT_EVIDENCE_SCHEMA_VERSION;
  signalDefinition: typeof COHORT_SIGNAL_DEFINITION;
  signalLines: typeof COHORT_SIGNAL_LINES;
  denominator: number;
  runsWithPressureCount: number;
  runsWithPressure: string[];
  runsWithoutPressure: string[];
  totalOccurrences: number;
  runs: CohortRunSummary[];
}

interface EntryRange {
  entryIds: string[];
  step: HeadlessApiPlayerSurfaceStep;
}

function entryRef(index: number): string {
  return `entry-${String(index).padStart(6, '0')}`;
}

function emittedEntryCount(step: HeadlessApiPlayerSurfaceStep): number {
  const cards = step.presentationCards ?? [];
  if (step.kind === 'story_event') {
    return 1 + Math.max(0, cards.length - 1);
  }
  return cards.length;
}

function mapObservableEntriesToSteps(
  source: HeadlessApiPlayerSurfaceTrace,
): Map<string, EntryRange> {
  const map = new Map<string, EntryRange>();
  let cursor = 0;
  for (const step of source.steps) {
    const count = emittedEntryCount(step);
    if (count <= 0) continue;
    const entryIds: string[] = [];
    for (let offset = 0; offset < count; offset += 1) {
      entryIds.push(entryRef(cursor + offset + 1));
    }
    for (const entryId of entryIds) {
      map.set(entryId, { entryIds, step });
    }
    cursor += count;
  }
  return map;
}

function matchedSignalLine(entry: ObservableEntry): string | undefined {
  for (const line of entry.visibleFeedbackLines ?? []) {
    if ((COHORT_SIGNAL_LINES as readonly string[]).includes(line)) {
      return line;
    }
  }
  return undefined;
}

function assertNoForbiddenFields(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenFields(item, `${path}[${index}]`));
    return;
  }
  if (typeof value !== 'object' || value === null) return;
  for (const [key, child] of Object.entries(value)) {
    const lowered = key.toLowerCase();
    if (
      lowered.includes('persona')
      || lowered === 'seed'
      || lowered.includes('prevalence')
      || lowered.includes('significance')
      || lowered.includes('confidence')
      || lowered.includes('probability')
      || lowered === 'verdict'
      || lowered === 'playerstate'
      || lowered === 'experiencetrace'
      || lowered === 'finalstate'
    ) {
      throw new Error(`forbidden cohort participant field: ${path}.${key}`);
    }
    assertNoForbiddenFields(child, `${path}.${key}`);
  }
}

export function collectPressureEntriesFromObservable(
  payload: ObservablePayload,
  surface: HeadlessApiPlayerSurfaceTrace,
): CohortPressureEntry[] {
  if (surface.schemaVersion !== HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION) {
    throw new Error(`unsupported player surface source version: ${String(surface.schemaVersion)}`);
  }
  const entryToStep = mapObservableEntriesToSteps(surface);
  const pressureEntries: CohortPressureEntry[] = [];
  for (const entry of payload.entries) {
    const matched = matchedSignalLine(entry);
    if (!matched) continue;
    const mapped = entryToStep.get(entry.entryId);
    if (!mapped) {
      throw new Error(`pressure entry missing player-surface mapping: ${entry.entryId}`);
    }
    if (mapped.step.kind !== 'active_action_result') {
      throw new Error(`pressure entry is not an active_action_result: ${entry.entryId}`);
    }
    const actionId = resolveActiveActionIdFromSurfaceStep(mapped.step);
    pressureEntries.push({
      entryId: entry.entryId,
      ...((entry.age ?? mapped.step.age) !== undefined
        ? { age: entry.age ?? mapped.step.age }
        : {}),
      matchedSignalLine: matched,
      actionId,
    });
  }
  return pressureEntries;
}

export function buildCohortEvidenceBundle(input: {
  plan: CohortPlan;
  runs: Array<{
    cohortRunId: string;
    payload: ObservablePayload;
    surface: HeadlessApiPlayerSurfaceTrace;
  }>;
}): CohortEvidenceBundle {
  validateCohortRegistrations(input.plan.registrations);
  if (input.runs.length !== COHORT_REGISTRATIONS.length) {
    throw new Error(
      `cohort evidence requires exactly ${COHORT_REGISTRATIONS.length} runs, got ${input.runs.length}`,
    );
  }

  const runs: CohortRunSummary[] = [];
  for (let index = 0; index < COHORT_REGISTRATIONS.length; index += 1) {
    const expected = COHORT_REGISTRATIONS[index]!;
    const run = input.runs[index]!;
    if (run.cohortRunId !== expected.cohortRunId) {
      throw new Error(`cohort evidence run order mismatch at ${expected.cohortRunId}`);
    }
    const pressureEntries = collectPressureEntriesFromObservable(run.payload, run.surface);
    const ages = pressureEntries
      .map(entry => entry.age)
      .filter((age): age is number => age !== undefined);
    runs.push({
      cohortRunId: run.cohortRunId,
      pressureEntryCount: pressureEntries.length,
      pressureAgeRange: ages.length > 0
        ? { min: Math.min(...ages), max: Math.max(...ages) }
        : null,
      pressureEntries,
    });
  }

  const runsWithPressure = runs
    .filter(run => run.pressureEntryCount > 0)
    .map(run => run.cohortRunId);
  const runsWithoutPressure = runs
    .filter(run => run.pressureEntryCount === 0)
    .map(run => run.cohortRunId);

  const bundle: CohortEvidenceBundle = {
    schemaVersion: COHORT_EVIDENCE_SCHEMA_VERSION,
    signalDefinition: COHORT_SIGNAL_DEFINITION,
    signalLines: COHORT_SIGNAL_LINES,
    denominator: COHORT_REGISTRATIONS.length,
    runsWithPressureCount: runsWithPressure.length,
    runsWithPressure,
    runsWithoutPressure,
    totalOccurrences: runs.reduce((total, run) => total + run.pressureEntryCount, 0),
    runs,
  };
  assertNoForbiddenFields(bundle, 'cohortEvidence');
  return bundle;
}

export function cohortEvidenceItems(
  bundle: CohortEvidenceBundle,
): Array<{
  evidenceId: string;
  authority: 'comparison';
  kind: 'cohort_summary' | 'cohort_run';
  payload: unknown;
}> {
  const items: Array<{
    evidenceId: string;
    authority: 'comparison';
    kind: 'cohort_summary' | 'cohort_run';
    payload: unknown;
  }> = [
    {
      evidenceId: 'cohort:summary',
      authority: 'comparison',
      kind: 'cohort_summary',
      payload: {
        signalDefinition: bundle.signalDefinition,
        signalLines: [...bundle.signalLines],
        denominator: bundle.denominator,
        runsWithPressureCount: bundle.runsWithPressureCount,
        runsWithPressure: [...bundle.runsWithPressure],
        runsWithoutPressure: [...bundle.runsWithoutPressure],
        totalOccurrences: bundle.totalOccurrences,
        note: 'Descriptive count only. Not an estimate over all players.',
      },
    },
  ];
  for (const run of bundle.runs) {
    items.push({
      evidenceId: `cohort:${run.cohortRunId}`,
      authority: 'comparison',
      kind: 'cohort_run',
      payload: {
        cohortRunId: run.cohortRunId,
        pressureEntryCount: run.pressureEntryCount,
        pressureAgeRange: run.pressureAgeRange,
        pressureEntries: run.pressureEntries,
      },
    });
  }
  assertNoForbiddenFields(items, 'cohortEvidenceItems');
  return items;
}

export async function loadCohortRunArtifacts(input: {
  gameRunPath: string;
}): Promise<{ payload: ObservablePayload; surface: HeadlessApiPlayerSurfaceTrace }> {
  const payloadBytes = await readFile(
    join(input.gameRunPath, 'reviewer-input', 'observable-payload.json'),
    'utf8',
  );
  const surfaceBytes = await readFile(
    join(input.gameRunPath, 'internal', 'player-surface-source.json'),
    'utf8',
  );
  const payload = JSON.parse(payloadBytes) as ObservablePayload;
  const surface = JSON.parse(surfaceBytes) as HeadlessApiPlayerSurfaceTrace;
  if (serializeObservablePayload(payload) !== payloadBytes) {
    throw new Error('cohort observable payload serialization mismatch');
  }
  return { payload, surface };
}

export function cohortEvidenceHash(bundle: CohortEvidenceBundle): string {
  return sha256Hex(canonicalJson(bundle));
}

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createDefaultRuntimeEventCatalog } from '../../src/core/EventLoaderRuntimeCatalog';
import { createWeightOverlayRuntimeCatalog } from '../../src/core/WeightOverlayRuntimeCatalog';
import type { RuntimeEventCatalog } from '../../src/core/RuntimeEventCatalog';
import { runHeadlessPersona } from '../../src/headless/playability/headlessPersonaRunner';
import { collectAgencyMetrics } from '../../src/p8/collectPersonaMetrics';
import type { P8Persona } from '../../src/p8/types';
import { captureCatalogSnapshot } from './catalogSnapshot';
import { stableJsonHash, stableStringify } from './hash';
import { validateWeightOverlay } from './scopeValidator';
import type { WeightOverlay } from './types';
import { createB1Manifest, type B1ArtifactManifest } from './manifest';
import { validateB1EvidenceChain } from './evidenceChain';

const ENGINE_VERSION = 'b1-headless-runtime-catalog-v1';
const METRICS_VERSION = 'b1-scheduling-metrics-v1';

type B10SchedulingMetrics = {
  eventCounts: Record<string, number>;
  totalSelections: number;
};

type B10RawTrace = {
  schemaVersion: 'b1-raw-trace-v1';
  personaId: string;
  seed: number;
  endAge: number;
  records: Array<{
    age: number;
    eventId: string;
    eventType: string;
    progressionKind?: string;
    activeActionId?: string;
    selectedChoiceId?: string;
  }>;
};

type B10VisibleTrace = {
  schemaVersion: 'b1-visible-trace-v1';
  steps: Array<{
    age: number;
    title: string;
    text: string;
    eventType: string;
  }>;
};

export type B10ArmResult = {
  runtimeCatalog: RuntimeEventCatalog;
  catalogHash: string;
  rawTrace: B10RawTrace;
  rawTraceHash: string;
  visibleTrace: B10VisibleTrace;
  visibleTraceHash: string;
  metrics: {
    version: typeof METRICS_VERSION;
    agency: ReturnType<typeof collectAgencyMetrics>;
  };
  metricHash: string;
  finalStateHash: string;
  scheduling: B10SchedulingMetrics;
};

export type B10RunResult = {
  runId: string;
  outDir: string;
  terminalVerdict: 'awaiting_human' | 'blocked';
  manifest: B1ArtifactManifest;
  baseline: B10ArmResult;
  candidate: B10ArmResult;
};

export type RunB10Options = {
  runId?: string;
  outRoot?: string;
  persona: P8Persona;
  seed: number;
  endAge: number;
  overlay: WeightOverlay;
  baseCatalog?: RuntimeEventCatalog;
  maxSteps?: number;
};

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${stableStringify(value)}\n`, 'utf8');
}

function sourceFingerprint(): B10RunResult['manifest']['sourceFingerprint'] {
  const git = (args: string[]): string => execFileSync('git', args, { encoding: 'utf8' }).trim();
  return {
    head: git(['rev-parse', 'HEAD']),
    branch: git(['rev-parse', '--abbrev-ref', 'HEAD']),
    worktreeHash: stableJsonHash({
      tracked: git(['diff', 'HEAD']),
      staged: git(['diff', '--cached']),
      status: git(['status', '--porcelain=v1']),
    }),
  };
}

function schedulingMetrics(rawTrace: B10RawTrace): B10SchedulingMetrics {
  const eventCounts: Record<string, number> = {};
  for (const record of rawTrace.records) {
    if (record.progressionKind !== 'story_event') continue;
    eventCounts[record.eventId] = (eventCounts[record.eventId] ?? 0) + 1;
  }
  return {
    eventCounts: Object.fromEntries(Object.entries(eventCounts).sort(([left], [right]) => left.localeCompare(right))),
    totalSelections: Object.values(eventCounts).reduce((sum, count) => sum + count, 0),
  };
}

function canonicalFinalStateHash(finalGameState: unknown): string {
  const normalized = structuredClone(finalGameState) as { gameTimestamp?: unknown };
  delete normalized.gameTimestamp;
  return stableJsonHash(normalized);
}

async function runArm(input: {
  catalog: RuntimeEventCatalog;
  catalogVersion: string;
  persona: P8Persona;
  seed: number;
  endAge: number;
  maxSteps?: number;
}): Promise<B10ArmResult> {
  const result = await runHeadlessPersona({
    persona: { ...input.persona, seed: input.seed },
    seed: input.seed,
    endAge: input.endAge,
    catalogVersion: input.catalogVersion,
    runtimeCatalog: input.catalog,
    maxSteps: input.maxSteps,
  });
  const rawTrace: B10RawTrace = {
    schemaVersion: 'b1-raw-trace-v1',
    personaId: result.personaId,
    seed: result.randomSeed,
    endAge: input.endAge,
    records: result.records.map(record => ({
      age: record.age,
      eventId: record.eventId,
      eventType: record.eventType,
      ...(record.progressionKind ? { progressionKind: record.progressionKind } : {}),
      ...(record.activeActionId ? { activeActionId: record.activeActionId } : {}),
      ...(record.selectedChoice?.id ? { selectedChoiceId: record.selectedChoice.id } : {}),
    })),
  };
  const visibleTrace: B10VisibleTrace = {
    schemaVersion: 'b1-visible-trace-v1',
    steps: result.records
      .filter(record => record.progressionKind === 'story_event')
      .map(record => ({
        age: record.age,
        title: record.eventTitle,
        text: record.eventText,
        eventType: record.eventType,
      })),
  };
  const metrics = {
    version: METRICS_VERSION,
    agency: collectAgencyMetrics(result.records),
  } as const;
  return {
    runtimeCatalog: input.catalog,
    catalogHash: captureCatalogSnapshot(input.catalog).baseCatalogHash,
    rawTrace,
    rawTraceHash: stableJsonHash(rawTrace),
    visibleTrace,
    visibleTraceHash: stableJsonHash(visibleTrace),
    metrics,
    metricHash: stableJsonHash(metrics),
    finalStateHash: canonicalFinalStateHash(result.finalGameState),
    scheduling: schedulingMetrics(rawTrace),
  };
}

/** Runs one sealed Headless-only B1.0 baseline/candidate pair; it never changes the formal catalog. */
export async function runB10(options: RunB10Options): Promise<B10RunResult> {
  const runId = options.runId ?? `b1-${Date.now()}`;
  const outDir = join(options.outRoot ?? '.tmp/b1', runId);
  const normalizedOutDir = outDir.replaceAll('\\', '/');
  if (/(^|\/)docs\/test-reports(?:\/|$)/.test(normalizedOutDir) ||
    /(^|\/)src\/data(?:\/|$)/.test(normalizedOutDir)) {
    throw new Error(`B1 artifact path is forbidden: ${outDir}`);
  }
  if (existsSync(outDir)) {
    throw new Error(`refusing to overwrite existing B1 artifact directory: ${outDir}`);
  }

  const baselineCatalog = options.baseCatalog ?? createDefaultRuntimeEventCatalog();
  const validation = validateWeightOverlay(baselineCatalog, options.overlay);
  if (validation.status === 'blocked') {
    throw new Error(`B1 overlay blocked: ${validation.code}`);
  }
  const candidateCatalog = createWeightOverlayRuntimeCatalog(baselineCatalog, options.overlay);
  const manifest = createB1Manifest({
    runId,
    sourceFingerprint: sourceFingerprint(),
    baseCatalogHash: validation.baseCatalogHash,
    overlayHash: validation.overlayHash,
    seedBundleHash: stableJsonHash({ seed: options.seed, personaId: options.persona.id, endAge: options.endAge }),
    engineVersion: ENGINE_VERSION,
    metricsVersion: METRICS_VERSION,
    persona: { ...options.persona, seed: options.seed },
    seed: options.seed,
    endAge: options.endAge,
  });

  mkdirSync(join(outDir, 'raw-traces'), { recursive: true });
  mkdirSync(join(outDir, 'player-visible-traces'), { recursive: true });
  mkdirSync(join(outDir, 'metrics'), { recursive: true });
  writeJson(join(outDir, 'manifest.json'), manifest);
  writeJson(join(outDir, 'base-catalog.json'), captureCatalogSnapshot(baselineCatalog));
  writeJson(join(outDir, 'overlay.json'), options.overlay);

  const baseline = await runArm({
    catalog: baselineCatalog,
    catalogVersion: '1.0.0',
    persona: options.persona,
    seed: options.seed,
    endAge: options.endAge,
    maxSteps: options.maxSteps,
  });
  const candidate = await runArm({
    catalog: candidateCatalog,
    catalogVersion: '1.0.0',
    persona: options.persona,
    seed: options.seed,
    endAge: options.endAge,
    maxSteps: options.maxSteps,
  });

  writeJson(join(outDir, 'raw-traces', 'baseline.json'), baseline.rawTrace);
  writeJson(join(outDir, 'raw-traces', 'candidate.json'), candidate.rawTrace);
  writeJson(join(outDir, 'player-visible-traces', 'baseline.json'), baseline.visibleTrace);
  writeJson(join(outDir, 'player-visible-traces', 'candidate.json'), candidate.visibleTrace);
  writeJson(join(outDir, 'metrics', 'baseline.json'), baseline.metrics);
  writeJson(join(outDir, 'metrics', 'candidate.json'), candidate.metrics);
  const evidence = validateB1EvidenceChain({ outDir, manifest });
  writeJson(join(outDir, 'evidence-index.json'), evidence);
  writeJson(join(outDir, 'run-summary.json'), {
    runId,
    terminalVerdict: 'awaiting_human',
    manifest,
    baseline: withoutRuntimeCatalog(baseline),
    candidate: withoutRuntimeCatalog(candidate),
    evidence,
    note: 'B1.0 proves only the isolated Headless injection boundary; it does not authorize B1.1 or formal catalog changes.',
  });

  return { runId, outDir, terminalVerdict: 'awaiting_human', manifest, baseline, candidate };
}

function withoutRuntimeCatalog(arm: B10ArmResult): Omit<B10ArmResult, 'runtimeCatalog'> {
  const { runtimeCatalog: _runtimeCatalog, ...serializable } = arm;
  return serializable;
}

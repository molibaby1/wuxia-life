#!/usr/bin/env tsx

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import eventsIndexJson from '../src/data/events.json';
import goldenLineSpine from '../src/data/golden-line-spine.json';
import { eventLoader } from '../src/core/EventLoader';
import type { EventDefinition } from '../src/types/eventTypes';
import { validateEventQuality } from './validateEventQuality';

const GOLDEN_SPINE_EVENT_IDS = new Set(goldenLineSpine.spineEventIds);

export type EventAssetStatus = 'active' | 'candidate' | 'broken' | 'deferred' | 'dead';

export interface EventAssetEntry {
  eventId: string;
  sourceFile: string;
  runtimeLoaded: boolean;
  status: EventAssetStatus;
  ageMin: number;
  ageMax: number;
  overlapsGoldenLine: boolean;
  eventType: string;
  notes?: string;
}

export interface FileAssetEntry {
  fileName: string;
  runtimeLoaded: boolean;
  status: EventAssetStatus;
  eventCount: number;
  goldenLineOverlapCount: number;
  notes?: string;
}

export interface EventAssetManifest {
  version: string;
  generatedAt: string;
  scope: {
    goldenLineAgeMin: number;
    goldenLineAgeMax: number;
    runtimeImportSource: string;
    priorityRoutes: string[];
  };
  summary: {
    runtimeLoadedFiles: number;
    nonLoadedFiles: number;
    totalEventsInRuntime: number;
    byStatus: Record<EventAssetStatus, number>;
    byFileStatus: Record<EventAssetStatus, number>;
  };
  files: FileAssetEntry[];
  events: EventAssetEntry[];
}

const GOLDEN_AGE_MIN = 0;
const GOLDEN_AGE_MAX = 30;

const PRIORITY_ROUTE_FILES = new Set([
  'sect-wudang.json',
  'sect-shaolin.json',
  'training.json',
  'sect-border.json',
  'identity-hero.json',
  'sect-marginal.json',
  'identity-demon.json',
]);

const GOLDEN_CANDIDATE_FILES = new Set([
  'origin.json',
  'general.json',
  'love.json',
  'faction-revelation.json',
  'setback-events.json',
  ...PRIORITY_ROUTE_FILES,
]);

const NON_PRIORITY_LOADED_FILES = new Set(['official.json', 'sect-beggars.json']);

const DEFERRED_LOADED_FILES = new Set([
  'middle-age-career.json',
  'family-life.json',
  'jianghu-conflict.json',
  'elderly-legacy.json',
  'identity-merchant.json',
  'identity-year-events.json',
]);

function eventAgeBounds(event: EventDefinition): { min: number; max: number } {
  const min = event.ageRange?.min ?? 0;
  const max = event.ageRange?.max ?? min;
  return { min, max };
}

function overlapsGoldenLine(min: number, max: number): boolean {
  return min <= GOLDEN_AGE_MAX && max >= GOLDEN_AGE_MIN;
}

function loadEventsFromFile(filePath: string): EventDefinition[] {
  if (!existsSync(filePath)) {
    return [];
  }
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as EventDefinition[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function classifyFile(fileName: string, runtimeLoaded: boolean, events: EventDefinition[]): FileAssetEntry {
  const goldenLineOverlapCount = events.filter((event) => {
    const { min, max } = eventAgeBounds(event);
    return overlapsGoldenLine(min, max);
  }).length;

  if (!runtimeLoaded) {
    return {
      fileName,
      runtimeLoaded: false,
      status: 'deferred',
      eventCount: events.length,
      goldenLineOverlapCount,
      notes: 'Not in events.json imports; backlog asset',
    };
  }

  if (NON_PRIORITY_LOADED_FILES.has(fileName)) {
    return {
      fileName,
      runtimeLoaded: true,
      status: 'deferred',
      eventCount: events.length,
      goldenLineOverlapCount,
      notes: 'Non-priority route per scope freeze (official/beggars ≠ PRD priority routes)',
    };
  }

  if (DEFERRED_LOADED_FILES.has(fileName)) {
    return {
      fileName,
      runtimeLoaded: true,
      status: 'deferred',
      eventCount: events.length,
      goldenLineOverlapCount,
      notes: 'Primarily post-30 or non-golden-line identity module',
    };
  }

  if (GOLDEN_CANDIDATE_FILES.has(fileName)) {
    return {
      fileName,
      runtimeLoaded: true,
      status: 'candidate',
      eventCount: events.length,
      goldenLineOverlapCount,
      notes: PRIORITY_ROUTE_FILES.has(fileName)
        ? 'Priority route golden-line pool (PXG2 selects active spine)'
        : 'Golden-line candidate pool (PXG2 selects active spine)',
    };
  }

  return {
    fileName,
    runtimeLoaded: true,
    status: 'deferred',
    eventCount: events.length,
    goldenLineOverlapCount,
    notes: 'Runtime-loaded but outside golden-line candidate pool',
  };
}

function classifyEvent(
  event: EventDefinition,
  fileName: string,
  runtimeLoaded: boolean,
  fileStatus: EventAssetStatus,
  brokenEventIds: Set<string>,
): EventAssetEntry {
  const { min, max } = eventAgeBounds(event);
  const goldenOverlap = overlapsGoldenLine(min, max);

  let status: EventAssetStatus = fileStatus;
  let notes: string | undefined;

  if (brokenEventIds.has(event.id) && !GOLDEN_SPINE_EVENT_IDS.has(event.id)) {
    status = 'broken';
    notes = 'Failed event quality or loader validation';
  } else if (!runtimeLoaded) {
    status = 'deferred';
    notes = 'Source file not runtime-loaded';
  } else if (!goldenOverlap) {
    status = 'deferred';
    notes = 'Outside ages 0-30 golden line';
  } else if (fileStatus === 'deferred') {
    status = 'deferred';
    notes = 'File classified deferred for golden line';
  } else if (GOLDEN_SPINE_EVENT_IDS.has(event.id)) {
    status = 'active';
    notes = 'Golden-line spine (PXG2 active)';
  } else if (fileStatus === 'candidate') {
    status = 'candidate';
    notes = 'Awaiting golden spine selection';
  }

  return {
    eventId: event.id,
    sourceFile: fileName,
    runtimeLoaded,
    status,
    ageMin: min,
    ageMax: max,
    overlapsGoldenLine: goldenOverlap,
    eventType: event.eventType ?? 'unknown',
    notes,
  };
}

function countByStatus<T extends { status: EventAssetStatus }>(items: T[]): Record<EventAssetStatus, number> {
  const counts: Record<EventAssetStatus, number> = {
    active: 0,
    candidate: 0,
    broken: 0,
    deferred: 0,
    dead: 0,
  };
  for (const item of items) {
    counts[item.status] += 1;
  }
  return counts;
}

function buildMarkdownReport(manifest: EventAssetManifest): string {
  const lines: string[] = [
    '# Product Experience Governance — Event Asset Audit',
    '',
    `生成时间：${manifest.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Runtime-loaded files: **${manifest.summary.runtimeLoadedFiles}**`,
    `- Non-loaded files: **${manifest.summary.nonLoadedFiles}**`,
    `- Runtime events total: **${manifest.summary.totalEventsInRuntime}**`,
    '',
    '### Event status counts',
    '',
    '| Status | Count |',
    '| --- | ---: |',
  ];

  for (const status of ['active', 'candidate', 'broken', 'deferred', 'dead'] as EventAssetStatus[]) {
    lines.push(`| ${status} | ${manifest.summary.byStatus[status]} |`);
  }

  lines.push(
    '',
    '## Runtime-loaded files',
    '',
    '| File | Status | Events | 0-30 overlap | Notes |',
    '| --- | --- | ---: | ---: | --- |',
  );

  for (const file of manifest.files.filter((entry) => entry.runtimeLoaded)) {
    lines.push(
      `| ${file.fileName} | ${file.status} | ${file.eventCount} | ${file.goldenLineOverlapCount} | ${file.notes ?? ''} |`,
    );
  }

  lines.push(
    '',
    '## Non-loaded files (deferred backlog)',
    '',
    '| File | Events | 0-30 overlap |',
    '| --- | ---: | ---: |',
  );

  for (const file of manifest.files.filter((entry) => !entry.runtimeLoaded)) {
    lines.push(`| ${file.fileName} | ${file.eventCount} | ${file.goldenLineOverlapCount} |`);
  }

  lines.push(
    '',
    '## Documentation mismatches',
    '',
    '- Historical docs claiming 35 events or full 0-80 coverage are stale; see scope freeze registry.',
    `- Runtime actually loads **${manifest.summary.runtimeLoadedFiles}** files with **${manifest.summary.totalEventsInRuntime}** events.`,
    '- Simulation: `npm run simulate:golden-line` uses sect/wanderer/demonic (0–30). Legacy `gate:experience` still runs 85-year official/beggars/demonic samples.',
    '',
    '## Machine source of truth',
    '',
    'JSON manifest: `src/data/event-asset-manifest.json`',
    '',
    'Regenerate: `npm run report:event-asset-inventory`',
  );

  return lines.join('\n');
}

export function buildEventAssetManifest(): EventAssetManifest {
  const linesDir = resolve('src/data/lines');
  const imports = (eventsIndexJson.imports || []).map((path) => basename(path));
  const loadedSet = new Set(imports);
  const allLineFiles = readdirSync(linesDir).filter((name) => name.endsWith('.json'));

  const loaderValidation = eventLoader.validateEvents();
  const quality = validateEventQuality(eventLoader.getAllEvents());
  const brokenEventIds = new Set<string>([
    ...loaderValidation.errors.map((error) => {
      const match = error.match(/事件 ([^\s]+)/);
      return match?.[1] ?? '';
    }).filter(Boolean),
    ...quality.issues.filter((issue) => issue.severity === 'blocker').map((issue) => issue.eventId),
  ]);

  const runtimeEvents = eventLoader.getAllEvents();
  const files: FileAssetEntry[] = [];
  const events: EventAssetEntry[] = [];

  for (const fileName of allLineFiles.sort()) {
    const filePath = join(linesDir, fileName);
    const fileEvents = loadEventsFromFile(filePath);
    const runtimeLoaded = loadedSet.has(fileName);
    const fileEntry = classifyFile(fileName, runtimeLoaded, fileEvents);
    files.push(fileEntry);

    for (const event of fileEvents) {
      events.push(classifyEvent(event, fileName, runtimeLoaded, fileEntry.status, brokenEventIds));
    }
  }

  const runtimeEventEntries = events.filter((entry) => entry.runtimeLoaded);

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    scope: {
      goldenLineAgeMin: GOLDEN_AGE_MIN,
      goldenLineAgeMax: GOLDEN_AGE_MAX,
      runtimeImportSource: 'src/data/events.json',
      priorityRoutes: ['orthodox/sect', 'wandering hero', 'demonic path'],
    },
    summary: {
      runtimeLoadedFiles: files.filter((file) => file.runtimeLoaded).length,
      nonLoadedFiles: files.filter((file) => !file.runtimeLoaded).length,
      totalEventsInRuntime: runtimeEvents.length,
      byStatus: countByStatus(runtimeEventEntries),
      byFileStatus: countByStatus(files),
    },
    files,
    events,
  };
}

function main(): void {
  const manifest = buildEventAssetManifest();

  const manifestPath = resolve('src/data/event-asset-manifest.json');
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const reportDir = resolve('docs/test-reports');
  mkdirSync(reportDir, { recursive: true });
  const reportPath = join(reportDir, 'product-experience-governance-event-asset-audit.md');
  writeFileSync(reportPath, `${buildMarkdownReport(manifest)}\n`, 'utf8');

  console.log(`Wrote ${manifestPath}`);
  console.log(`Wrote ${reportPath}`);
  console.log(
    `Runtime: ${manifest.summary.runtimeLoadedFiles} files, ${manifest.summary.totalEventsInRuntime} events; ` +
      `candidate=${manifest.summary.byStatus.candidate}, deferred=${manifest.summary.byStatus.deferred}, broken=${manifest.summary.byStatus.broken}`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

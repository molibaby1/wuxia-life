import * as fs from 'fs';
import * as path from 'path';
import { EventLoader } from '../core/EventLoader';
import type { EventDefinition } from '../types/eventTypes';

const AXIS_KEYS = ['socialMomentum', 'familyBond'] as const;
type ShapingAxisKey = (typeof AXIS_KEYS)[number];

export const AUDIT_VERSION = 'p44-v1';

export const AGE_BANDS = [
  { id: 'childhood', min: 0, max: 12 },
  { id: 'youth', min: 13, max: 19 },
  { id: 'early_adult', min: 20, max: 34 },
  { id: 'midlife', min: 35, max: 49 },
  { id: 'later_life', min: 50, max: 999 },
] as const;

export type AgeBandId = (typeof AGE_BANDS)[number]['id'];

export interface CoverageReader {
  eventId: string;
  axis: ShapingAxisKey;
  bands: AgeBandId[];
  poolHint: string;
  minAge: number;
  maxAge: number;
}

export interface CoverageGap {
  axis: ShapingAxisKey;
  band: AgeBandId;
  readerCount: number;
  severity: 'gap' | 'low_density';
}

export interface HabitCoverageAuditResult {
  matrix: Record<ShapingAxisKey, Record<AgeBandId | 'total', number>>;
  gaps: CoverageGap[];
  lowDensity: CoverageGap[];
  readers: CoverageReader[];
}

export interface CanonicalOperatorAuditResult {
  producerCount: number;
  consumerCount: number;
  forbiddenReferences: string[];
  blockers: string[];
}

export interface ArchetypeAxisReport {
  axis: ShapingAxisKey;
  readerCount: number;
  clusterVariants: string[];
  differentiation: 'strong' | 'partial' | 'thin';
  sampleEvents: string[];
  thinAreas: string[];
}

export interface ArchetypeDifferentiationResult {
  axes: ArchetypeAxisReport[];
  convergenceWarnings: Array<{ axis: ShapingAxisKey; reason: string }>;
}

export interface RecapSurfaceReport {
  surface: string;
  file: string;
  helper: string;
  wired: boolean;
  reason?: string;
}

export interface RecapAbsorptionResult {
  wiredSurfaces: RecapSurfaceReport[];
  unwiredSurfaces: RecapSurfaceReport[];
  allRequiredEngineSurfacesWired: boolean;
}

export interface P44HabitOperatorAuditResult {
  auditVersion: typeof AUDIT_VERSION;
  generatedAt: string;
  coverage: HabitCoverageAuditResult;
  operatorAudit: CanonicalOperatorAuditResult;
  archetypeDifferentiation: ArchetypeDifferentiationResult;
  recapAbsorption: RecapAbsorptionResult;
}

function ageBandsForRange(minAge: number, maxAge: number): AgeBandId[] {
  return AGE_BANDS.filter((band) => minAge <= band.max && maxAge >= band.min).map((band) => band.id);
}

function poolHintFromEvent(event: EventDefinition): string {
  const id = event.id ?? '';
  if (id.includes('merchant') || id.includes('business')) return 'merchant';
  if (id.includes('medical') || id.includes('healer')) return 'medical';
  if (id.includes('family')) return 'family-life';
  if (id.includes('social') || id.includes('relationship') || id.includes('patron')) return 'relationship';
  if (id.startsWith('p22')) return 'p22';
  if (id.startsWith('p21') || id.startsWith('p26') || id.startsWith('p27')) return 'p21';
  if (id.startsWith('p42')) return 'p42';
  return 'other';
}

function axisReaderMatch(raw: string): ShapingAxisKey | null {
  for (const axis of AXIS_KEYS) {
    if (raw.includes(`lifeStates.${axis}`) || raw.includes(`"${axis}"`) || raw.includes(`${axis} >=`)) {
      return axis;
    }
  }
  return null;
}

function emptyMatrix(): HabitCoverageAuditResult['matrix'] {
  const matrix = {} as HabitCoverageAuditResult['matrix'];
  for (const axis of AXIS_KEYS) {
    matrix[axis] = {
      childhood: 0,
      youth: 0,
      early_adult: 0,
      midlife: 0,
      later_life: 0,
      total: 0,
    };
  }
  return matrix;
}

export function runHabitCoverageAudit(loader = EventLoader.getInstance()): HabitCoverageAuditResult {
  const matrix = emptyMatrix();
  const readers: CoverageReader[] = [];

  for (const event of loader.getAllEvents()) {
    const raw = JSON.stringify(event.conditions ?? []);
    const axis = axisReaderMatch(raw);
    if (!axis) continue;

    const minAge = event.ageRange?.min ?? 0;
    const maxAge = event.ageRange?.max ?? minAge;
    const bands = ageBandsForRange(minAge, maxAge);

    readers.push({
      eventId: event.id,
      axis,
      bands,
      poolHint: poolHintFromEvent(event),
      minAge,
      maxAge,
    });

    matrix[axis].total += 1;
    for (const band of bands) {
      matrix[axis][band] += 1;
    }
  }

  const gaps: CoverageGap[] = [];
  const lowDensity: CoverageGap[] = [];

  for (const axis of AXIS_KEYS) {
    for (const band of AGE_BANDS) {
      const readerCount = matrix[axis][band.id];
      const entry: CoverageGap = { axis, band: band.id, readerCount, severity: 'gap' };
      if (readerCount === 0) gaps.push(entry);
      else if (readerCount === 1) lowDensity.push({ ...entry, severity: 'low_density' });
    }
  }

  return { matrix, gaps, lowDensity, readers };
}

function walkFiles(dir: string, onFile: (filePath: string) => void): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, onFile);
    else onFile(full);
  }
}

export function runCanonicalOperatorAudit(rootDir = process.cwd()): CanonicalOperatorAuditResult {
  let producerCount = 0;
  let consumerCount = 0;
  const forbiddenReferences: string[] = [];
  const blockers: string[] = [];
  const scanRoots = ['src/data', 'src/core', 'src/components', 'src/p19', 'src/p20', 'src/utils', 'src/p44'];
  walkFiles(path.join(rootDir, 'src'), (filePath) => {
    if (!/\.(ts|tsx|json)$/.test(filePath) || filePath.endsWith('habitOperatorAudit.ts')) return;
    const relative = path.relative(rootDir, filePath).replace(/\\/g, '/');
    if (!scanRoots.some(root => relative.startsWith(root))) return;
    const source = fs.readFileSync(filePath, 'utf8');
    producerCount += (source.match(/habitEffects|type:\s*['"]life_state_change['"]|stateEffects/g) ?? []).length;
    consumerCount += (source.match(/practiceTrajectorySummary|lifeStates\.(trainingHabit|studyHabit|businessHabit)/g) ?? []).length;
    if (/projectHabitCompatibilityFlags|mapLegacyHabitFlagToLifeState|buildShapingPatternEndingTone/.test(source)) {
      forbiddenReferences.push(relative);
    }
    if (/getWeight[\s\S]{0,500}(trainingHabit|studyHabit|businessHabit)/.test(source)) blockers.push(`${relative}: group multiplier reads practice`);
    if (/getFormalEventStateMultiplier[\s\S]{0,500}(trainingHabit|studyHabit|businessHabit)/.test(source)) blockers.push(`${relative}: formal multiplier reads practice`);
  });
  return { producerCount, consumerCount, forbiddenReferences, blockers };
}

const CLUSTER_SIGNALS: Array<{ id: string; patterns: RegExp[] }> = [
  { id: 'martial', patterns: [/martial/i, /sect/i, /training/i, /sparring/i, /guardian/i, /clan/i] },
  { id: 'scholar', patterns: [/scholar/i, /academy/i, /copybook/i, /chronicle/i, /study/i] },
  { id: 'merchant', patterns: [/merchant/i, /ledger/i, /stall/i, /syndicate/i, /wealth/i, /business/i] },
  { id: 'healer', patterns: [/healer/i, /medical/i, /case_record/i] },
  { id: 'social', patterns: [/social/i, /patron/i, /network/i, /introduction/i, /testimonial/i] },
  { id: 'family', patterns: [/family/i, /reunion/i, /estate/i, /elder_care/i, /sibling/i] },
];

function detectClusterVariants(eventIds: string[]): string[] {
  const found = new Set<string>();
  for (const eventId of eventIds) {
    for (const signal of CLUSTER_SIGNALS) {
      if (signal.patterns.some((pattern) => pattern.test(eventId))) found.add(signal.id);
    }
  }
  return [...found].sort();
}

function differentiationLevel(variants: string[], readerCount: number): ArchetypeAxisReport['differentiation'] {
  if (readerCount === 0) return 'thin';
  if (variants.length >= 2) return 'strong';
  if (variants.length === 1 && readerCount >= 2) return 'partial';
  return 'thin';
}

export function runArchetypeDifferentiationAudit(
  coverage: HabitCoverageAuditResult = runHabitCoverageAudit(),
): ArchetypeDifferentiationResult {
  const axes: ArchetypeAxisReport[] = [];
  const convergenceWarnings: ArchetypeDifferentiationResult['convergenceWarnings'] = [];

  for (const axis of AXIS_KEYS) {
    const axisReaders = coverage.readers.filter((reader) => reader.axis === axis);
    const eventIds = axisReaders.map((reader) => reader.eventId);
    const clusterVariants = detectClusterVariants(eventIds);
    const differentiation = differentiationLevel(clusterVariants, axisReaders.length);
    const thinAreas: string[] = [];

    if (differentiation === 'thin') {
      thinAreas.push('no cluster-specific reader pairs');
      convergenceWarnings.push({ axis, reason: 'no cluster-specific reader pairs' });
    } else if (differentiation === 'partial') {
      thinAreas.push('single cluster dominates; add contrasting archetype echo');
      convergenceWarnings.push({ axis, reason: 'single cluster dominates; add contrasting archetype echo' });
    }

    axes.push({
      axis,
      readerCount: axisReaders.length,
      clusterVariants,
      differentiation,
      sampleEvents: eventIds.slice(0, 4),
      thinAreas,
    });
  }

  return { axes, convergenceWarnings };
}

const RECAP_SURFACE_EXPECTATIONS: Array<{ surface: string; file: string; helpers: string[] }> = [
  { surface: 'Main-screen shaping row', file: 'src/components/mainScreenModel.ts', helpers: ['buildTendencySummary'] },
  { surface: 'Life-memory practice trajectory', file: 'src/core/deriveLifeMemorySummary.ts', helpers: ['derivePracticeTrajectoryLines'] },
  {
    surface: 'P19 final summary',
    file: 'src/p19/finalSummaryComposition.ts',
    helpers: ['buildLateLifePracticeRecapLine'],
  },
  { surface: 'Ending fallback summary', file: 'src/core/EndingSystem.ts', helpers: ['buildLateLifePracticeRecapLine'] },
  { surface: 'Self-understanding', file: 'src/p19/stateAccess.ts', helpers: ['socialMomentum', 'familyBond'] },
];

const DEFERRED_SURFACES: RecapSurfaceReport[] = [
  {
    surface: 'Ending UI',
    file: 'src/components/EndingScreen.vue',
    helper: 'buildLateLifePracticeRecapLine',
    wired: false,
    reason: 'deferred UI wiring',
  },
];

export function runRecapAbsorptionAudit(rootDir = process.cwd()): RecapAbsorptionResult {
  const wiredSurfaces: RecapSurfaceReport[] = [];
  const unwiredSurfaces: RecapSurfaceReport[] = [...DEFERRED_SURFACES];

  for (const expected of RECAP_SURFACE_EXPECTATIONS) {
    const abs = path.join(rootDir, expected.file);
    const content = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
    const wired = expected.helpers.every((helper) => content.includes(helper));
    const report: RecapSurfaceReport = {
      surface: expected.surface,
      file: expected.file,
      helper: expected.helpers.join(', '),
      wired,
    };
    if (wired) wiredSurfaces.push(report);
    else {
      const missing = expected.helpers.filter((helper) => !content.includes(helper));
      unwiredSurfaces.push({ ...report, reason: `missing ${missing.join(', ')}` });
    }
  }

  return {
    wiredSurfaces,
    unwiredSurfaces,
    allRequiredEngineSurfacesWired: unwiredSurfaces.every((surface) => surface.reason === 'deferred UI wiring'),
  };
}

export function runP44HabitOperatorAudit(rootDir = process.cwd()): P44HabitOperatorAuditResult {
  const coverage = runHabitCoverageAudit();
  return {
    auditVersion: AUDIT_VERSION,
    generatedAt: new Date().toISOString(),
    coverage,
    operatorAudit: runCanonicalOperatorAudit(rootDir),
    archetypeDifferentiation: runArchetypeDifferentiationAudit(coverage),
    recapAbsorption: runRecapAbsorptionAudit(rootDir),
  };
}

export function formatCoverageAuditMarkdown(result: HabitCoverageAuditResult): string {
  const header = '| Axis | childhood | youth | early adult | midlife | later life | Total |';
  const sep = '| --- | --- | --- | --- | --- | --- | --- |';
  const rows = AXIS_KEYS.map((axis) => {
    const row = result.matrix[axis];
    return `| ${axis} | ${row.childhood} | ${row.youth} | ${row.early_adult} | ${row.midlife} | ${row.later_life} | ${row.total} |`;
  });

  const gapLines = result.gaps
    .slice(0, 20)
    .map((gap) => `- **${gap.axis}** / ${gap.band}: 0 readers`)
    .join('\n');
  const lowLines = result.lowDensity
    .slice(0, 20)
    .map((gap) => `- **${gap.axis}** / ${gap.band}: 1 reader (single-sample risk)`)
    .join('\n');

  return [
    '# P44 Habit Coverage Audit',
    '',
    '## Coverage matrix',
    header,
    sep,
    ...rows,
    '',
    '## Gaps (0 readers)',
    gapLines || '- *(none)*',
    '',
    '## Low density (1 reader)',
    lowLines || '- *(none)*',
    '',
    `Total gated readers inventoried: **${result.readers.length}**`,
  ].join('\n');
}

export function formatArchetypeDifferentiationMarkdown(result: ArchetypeDifferentiationResult): string {
  const rows = result.axes.map((axis) =>
    [
      `### ${axis.axis}`,
      `- Differentiation: **${axis.differentiation}**`,
      `- Readers: ${axis.readerCount}`,
      `- Cluster variants: ${axis.clusterVariants.join(', ') || '(none)'}`,
      `- Sample events: ${axis.sampleEvents.join(', ') || '(none)'}`,
      axis.thinAreas.length ? `- Thin areas: ${axis.thinAreas.join('; ')}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  );

  const warnings = result.convergenceWarnings
    .map((warning) => `- **${warning.axis}**: ${warning.reason}`)
    .join('\n');

  return [
    '# P44 Archetype Differentiation Audit',
    '',
    ...rows,
    '',
    '## Convergence warnings',
    warnings || '- *(none)*',
  ].join('\n');
}

export function formatCanonicalOperatorMarkdown(result: CanonicalOperatorAuditResult): string {
  return [
    '# P44 Canonical Operator Audit',
    '',
    `- Habit producers: ${result.producerCount}`,
    `- Practice consumers: ${result.consumerCount}`,
    `- Forbidden helper references: ${result.forbiddenReferences.join(', ') || '(none)'}`,
    `- Multiplier blockers: ${result.blockers.join(', ') || '(none)'}`,
  ].join('\n');
}

export function formatP44AuditSummaryMarkdown(result: P44HabitOperatorAuditResult): string {
  return [
    '# P44 Habit Operator Audit Summary',
    '',
    `Generated: ${result.generatedAt}`,
    '',
    formatCoverageAuditMarkdown(result.coverage),
    '',
    '---',
    '',
    formatCanonicalOperatorMarkdown(result.operatorAudit),
    '',
    '---',
    '',
    formatArchetypeDifferentiationMarkdown(result.archetypeDifferentiation),
    '',
    '---',
    '',
    '## Recap absorption',
    `- Engine surfaces wired: ${result.recapAbsorption.allRequiredEngineSurfacesWired ? 'yes' : 'no'}`,
    `- Wired: ${result.recapAbsorption.wiredSurfaces.map((s) => s.surface).join(', ')}`,
    `- Manual/deferred: ${result.recapAbsorption.unwiredSurfaces.map((s) => s.surface).join(', ')}`,
  ].join('\n');
}

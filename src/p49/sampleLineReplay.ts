import { deriveLifeMemorySummary } from '../core/deriveLifeMemorySummary';
import type { GameState } from '../types/eventTypes';
import type { LifeMemorySummary } from '../types/lifeMemory';
import type { GameProcessRecord, GameProcessReport } from '../types/simulationRecordTypes';
import {
  deriveSampleLineAge40Identity,
  deriveSampleLineCostLabel,
  deriveSampleLineCurrentGoal,
  type SampleLineId,
} from '../p50/sampleLineExpression';

export type P49SampleLineRouteTrack = 'sect' | 'demonic' | 'wealth';

export interface P49SampleLineMatrixEntry {
  lineId: SampleLineId;
  label: string;
  seed: number;
  personaName: string;
  gender: 'male' | 'female';
  choiceTendency: 'martial' | 'risk_averse' | 'wealth';
  routeTrack?: 'sect' | 'demonic';
  p8PersonaId?: string;
  sampleId: string;
}

export interface P49CheckpointExport {
  age: number;
  eventIds: string[];
  routeFlags: string[];
  currentGoal?: string;
  costLabel?: string;
  lifeMemoryEntry: string;
  age40Identity?: string;
  post40PayoffDone?: boolean;
}

export interface P49LineReplaySummary {
  lineId: SampleLineId;
  label: string;
  seed: number;
  checkpoints: P49CheckpointExport[];
  finalAge: number;
  deterministicHash: string;
}

export interface P49SampleLineReplayReport {
  generatedAt: string;
  checkpointAges: number[];
  lines: P49LineReplaySummary[];
}

export const P49_CHECKPOINT_AGES = [13, 18, 25, 32, 40, 45, 50] as const;

export const P49_SAMPLE_LINE_MATRIX: P49SampleLineMatrixEntry[] = [
  {
    lineId: 'orthodox',
    label: '正派武道',
    seed: 301,
    personaName: '顾清和',
    gender: 'male',
    choiceTendency: 'martial',
    routeTrack: 'sect',
    sampleId: 'golden-sect',
  },
  {
    lineId: 'demonic',
    label: '邪路偏锋',
    seed: 303,
    personaName: '沈夜',
    gender: 'male',
    choiceTendency: 'risk_averse',
    routeTrack: 'demonic',
    sampleId: 'golden-demonic',
  },
  {
    lineId: 'merchant',
    label: '商路崛起',
    seed: 804,
    personaName: '沈聚财',
    gender: 'male',
    choiceTendency: 'wealth',
    p8PersonaId: 'p8-wealth-shen',
    sampleId: 'p8-wealth-shen',
  },
];

function findCheckpointRecord(records: GameProcessRecord[], age: number): GameProcessRecord | null {
  const atOrBefore = [...records].reverse().find((record) => record.age <= age);
  return atOrBefore ?? records[0] ?? null;
}

function collectRouteFlags(state: GameState): string[] {
  const flags = state.flags ?? {};
  return Object.keys(flags)
    .filter((key) => key.startsWith('route_') && flags[key] === true)
    .sort();
}

function collectRecentEventIds(records: GameProcessRecord[], age: number, limit = 5): string[] {
  const lowerAge = Math.max(0, age - 8);
  return records
    .filter((record) => record.age <= age && record.age >= lowerAge)
    .slice(-limit)
    .map((record) => record.eventId);
}

function buildLifeMemoryEntry(lifeMemory: LifeMemorySummary): string {
  const parts: string[] = [];
  if (lifeMemory.routeStatus?.currentGoalLabel) {
    parts.push(`goal=${lifeMemory.routeStatus.currentGoalLabel}`);
  } else if (lifeMemory.routeStatus?.primary) {
    parts.push(`route=${lifeMemory.routeStatus.primary.name}`);
  }
  if (lifeMemory.keyChoices?.[0]) {
    parts.push(`choice=${lifeMemory.keyChoices[0].label}`);
  }
  if (lifeMemory.achievements?.[0]) {
    parts.push(`achievement=${lifeMemory.achievements[0].label}`);
  }
  return parts.join(' | ') || 'none';
}

function stableHash(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return `h${Math.abs(hash)}`;
}

export function summarizeSampleLineRun(input: {
  entry: P49SampleLineMatrixEntry;
  report: GameProcessReport;
}): P49LineReplaySummary {
  const checkpoints = P49_CHECKPOINT_AGES.map((age): P49CheckpointExport => {
    const record = findCheckpointRecord(input.report.records, age);
    if (!record) {
      return { age, eventIds: [], routeFlags: [], lifeMemoryEntry: 'none' };
    }
    const lifeMemory = deriveLifeMemorySummary(record.gameState);
    const flags = record.gameState.flags ?? {};
    return {
      age,
      eventIds: collectRecentEventIds(input.report.records, age),
      routeFlags: collectRouteFlags(record.gameState),
      currentGoal: deriveSampleLineCurrentGoal(record.gameState),
      costLabel: deriveSampleLineCostLabel(record.gameState),
      lifeMemoryEntry: buildLifeMemoryEntry(lifeMemory),
      age40Identity: age >= 38 ? deriveSampleLineAge40Identity(record.gameState) : undefined,
      post40PayoffDone: age >= 45 ? Boolean(
        flags.orthodox_age45_payoff_done
        || flags.demonic_age45_payoff_done
        || flags.merchant_age45_payoff_done,
      ) : undefined,
    };
  });

  return {
    lineId: input.entry.lineId,
    label: input.entry.label,
    seed: input.entry.seed,
    checkpoints,
    finalAge: input.report.finalAge,
    deterministicHash: stableHash(checkpoints),
  };
}

export type CrossLineDimension = 'goal' | 'cost' | 'identity' | 'continue' | 'replay';

export type CrossLineVerdict = 'distinct' | 'partial' | 'collapsed';

export interface P49CrossLineComparisonRow {
  checkpointAge: number;
  dimension: CrossLineDimension;
  verdict: CrossLineVerdict;
  detail: string;
}

const DIMENSION_LABELS: Record<CrossLineDimension, string> = {
  goal: '当前目标',
  cost: '代价感知',
  identity: '身份总结',
  continue: '继续意愿代理',
  replay: '重开差异代理',
};

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function classifyDistinctness(values: string[]): CrossLineVerdict {
  const unique = uniqueValues(values);
  if (unique.length >= 3) {
    return 'distinct';
  }
  if (unique.length === 2) {
    return 'partial';
  }
  return 'collapsed';
}

export function buildCrossLineComparison(report: P49SampleLineReplayReport): P49CrossLineComparisonRow[] {
  const rows: P49CrossLineComparisonRow[] = [];
  for (const age of report.checkpointAges) {
    const snapshots = report.lines.map((line) => line.checkpoints.find((cp) => cp.age === age)!);
    const goals = snapshots.map((cp) => cp.currentGoal ?? cp.lifeMemoryEntry);
    const costs = snapshots.map((cp) => cp.costLabel ?? '守正代价');
    const identities = snapshots.map((cp) => cp.age40Identity ?? cp.lifeMemoryEntry);
    const continues = snapshots.map((cp) => cp.routeFlags.join(',') || 'none');
    const replays = report.lines.map((line) => {
      const cp = line.checkpoints.find((checkpoint) => checkpoint.age === age)!;
      return `${line.lineId}:${cp.eventIds.slice(-2).join('+') || 'none'}`;
    });

    const dimensions: Array<[CrossLineDimension, string[]]> = [
      ['goal', goals],
      ['cost', costs],
      ['identity', identities],
      ['continue', continues],
      ['replay', replays],
    ];

    for (const [dimension, values] of dimensions) {
      const verdict = classifyDistinctness(values);
      rows.push({
        checkpointAge: age,
        dimension,
        verdict,
        detail: values.join(' || '),
      });
    }
  }
  return rows;
}

export function formatP49ReplayMarkdown(report: P49SampleLineReplayReport): string {
  const lines: string[] = [
    '# P49 Sample Lines Replay Latest',
    '',
    `Generated: ${report.generatedAt}`,
    `Checkpoint ages: ${report.checkpointAges.join(', ')}`,
  ];

  for (const line of report.lines) {
    lines.push('');
    lines.push(`## ${line.label} (seed ${line.seed})`);
    lines.push('');
    lines.push(`- Final age: ${line.finalAge}`);
    lines.push(`- Deterministic hash: ${line.deterministicHash}`);
    lines.push('');
    lines.push('| Age | Current goal | Route flags | Recent events | Life-memory entry |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const checkpoint of line.checkpoints) {
      lines.push(
        `| ${checkpoint.age} | ${checkpoint.currentGoal ?? '—'} | ${checkpoint.routeFlags.join(', ') || 'none'} | ${checkpoint.eventIds.join(', ') || 'none'} | ${checkpoint.lifeMemoryEntry} |`,
      );
    }
    const age40 = line.checkpoints.find((cp) => cp.age === 40);
    if (age40?.age40Identity) {
      lines.push('');
      lines.push(`**Age-40 identity:** ${age40.age40Identity}`);
    }
    const age45 = line.checkpoints.find((cp) => cp.age === 45);
    if (age45?.post40PayoffDone) {
      lines.push('');
      lines.push(`**Age-45 40+ payoff:** done — ${age45.currentGoal ?? '—'}`);
    }
  }

  return lines.join('\n');
}

export function formatP49CrossLineMarkdown(
  report: P49SampleLineReplayReport,
  comparison: P49CrossLineComparisonRow[],
): string {
  const lines: string[] = [
    '# P49 Sample Lines Cross-Line Comparison Latest',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Checkpoint | Dimension | Verdict | Detail |',
    '| --- | --- | --- | --- |',
  ];

  for (const row of comparison) {
    lines.push(
      `| ${row.checkpointAge} | ${DIMENSION_LABELS[row.dimension]} | ${row.verdict} | ${row.detail} |`,
    );
  }

  const collapsed = comparison.filter((row) => row.verdict === 'collapsed').length;
  const partial = comparison.filter((row) => row.verdict === 'partial').length;
  lines.push('');
  lines.push(`Summary: distinct=${comparison.length - collapsed - partial}, partial=${partial}, collapsed=${collapsed}`);

  return lines.join('\n');
}

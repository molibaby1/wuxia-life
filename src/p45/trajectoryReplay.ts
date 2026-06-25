import { deriveLifeMemorySummary } from '../core/deriveLifeMemorySummary';
import { getP8PersonaById } from '../p8/personas';
import { deriveDominantShapingLines } from '../utils/habitShapingSummary';
import type { GameState } from '../types/eventTypes';
import type { LifeMemorySummary } from '../types/lifeMemory';
import type { GameProcessRecord, GameProcessReport } from '../types/simulationRecordTypes';

export interface P45ReplayMatrixEntry {
  personaLabel: string;
  personaId: string;
  seed: number;
}

export interface P45CheckpointSummary {
  age: number;
  dominantAxes: string[];
  routeSignal: string;
  identitySignals: string[];
  consequenceSignals: string[];
}

export interface P45FinalSummary {
  routeSignal: string;
  lifeMemoryEntryPoints: string[];
  summaryEntry: string;
}

export interface P45TrajectorySummary {
  personaLabel: string;
  personaId: string;
  seed: number;
  checkpoints: P45CheckpointSummary[];
  finalSummary: P45FinalSummary;
}

export interface P45TrajectoryReport {
  generatedAt: string;
  ageWindow: { startAge: number; endAge: number };
  checkpointAges: number[];
  summaries: P45TrajectorySummary[];
}

export const P45_CHECKPOINT_AGES = [10, 20, 30, 40] as const;

export const P45_REPLAY_MATRIX: P45ReplayMatrixEntry[] = [
  { personaLabel: 'Martial / training-leaning', personaId: 'p8-martial-lin', seed: 801 },
  { personaLabel: 'Scholarly / study-leaning', personaId: 'p8-scholar-su', seed: 802 },
  { personaLabel: 'Business / livelihood-leaning', personaId: 'p8-wealth-shen', seed: 804 },
  { personaLabel: 'Mixed / balanced tendency', personaId: 'p8-balanced-wei', seed: 808 },
];

function findCheckpointRecord(records: GameProcessRecord[], age: number): GameProcessRecord | null {
  const atOrBefore = [...records].reverse().find(record => record.age <= age);
  return atOrBefore ?? records[0] ?? null;
}

function formatDominantAxes(state: GameState): string[] {
  return deriveDominantShapingLines(state.player.lifeStates, 2)
    .map(line => `${line.label} · ${line.tierLabel}`);
}

function formatRouteSignal(lifeMemory: LifeMemorySummary): string {
  const primary = lifeMemory.routeStatus?.primary;
  if (!primary) {
    return 'route: none';
  }
  const secondary = lifeMemory.routeStatus?.secondary
    ? ` / secondary=${lifeMemory.routeStatus.secondary.name}(${lifeMemory.routeStatus.secondary.phase})`
    : '';
  const faction = lifeMemory.routeStatus?.factionLabel ? ` / faction=${lifeMemory.routeStatus.factionLabel}` : '';
  return `route: ${primary.name}(${primary.phase})${secondary}${faction}`;
}

function collectIdentitySignals(state: GameState): string[] {
  const signals: string[] = [];
  const flags = state.flags ?? {};
  const personaId = state.flags?.p8_persona_id;
  if (typeof personaId === 'string') {
    signals.push(`persona=${personaId}`);
  }
  const namedFlags = [
    'joined_sect',
    'scholar_path_started',
    'merchant_network_growing',
    'demonic_path_touched',
    'route_orthodox',
    'route_demonic',
    'route_wanderer',
    'route_merchant',
    'sectMember',
  ] as const;
  for (const key of namedFlags) {
    if (flags[key]) {
      signals.push(key);
    }
  }
  return signals.slice(0, 4);
}

function collectConsequenceSignals(records: GameProcessRecord[], age: number): string[] {
  const lowerAge = Math.max(0, age - 10);
  return records
    .filter(record => record.age <= age && record.age >= lowerAge)
    .filter(record =>
      /^(p21|p22|p26|p27|p28|p29|p42)_/.test(record.eventId)
      || /route|identity|summary|callback|obligation|consequence/.test(record.eventId),
    )
    .slice(-2)
    .map(record => `${record.eventId}: ${record.eventTitle}`);
}

function buildLifeMemoryEntryPoints(summary: LifeMemorySummary): string[] {
  const entries: string[] = [];
  for (const habit of summary.habitTrajectory ?? []) {
    entries.push(`${habit.label} · ${habit.tierLabel}`);
  }
  if (summary.keyChoices?.[0]) {
    entries.push(`key-choice=${summary.keyChoices[0].label}`);
  }
  if (summary.achievements?.[0]) {
    entries.push(`achievement=${summary.achievements[0].label}`);
  }
  return entries.slice(0, 4);
}

function buildSummaryEntry(report: GameProcessReport, lifeMemory: LifeMemorySummary): string {
  const persona = typeof report.config.p8PersonaId === 'string' ? getP8PersonaById(report.config.p8PersonaId) : undefined;
  const identity = [
    report.statistics.sectJoined ? `sect=${report.statistics.sectJoined}` : null,
    report.statistics.growthBiasSummary?.[0] ? `growth=${report.statistics.growthBiasSummary[0]}` : null,
    lifeMemory.habitTrajectory?.[0] ? `dominant=${lifeMemory.habitTrajectory[0].label}` : null,
    persona?.strategySummary ?? null,
  ].filter(Boolean);
  return identity.join(' / ') || 'summary: none';
}

export function summarizeTrajectoryRun(input: {
  personaLabel: string;
  personaId: string;
  seed: number;
  report: GameProcessReport;
}): P45TrajectorySummary {
  const checkpoints = P45_CHECKPOINT_AGES.map((age): P45CheckpointSummary => {
    const record = findCheckpointRecord(input.report.records, age);
    if (!record) {
      return {
        age,
        dominantAxes: [],
        routeSignal: 'route: none',
        identitySignals: [],
        consequenceSignals: [],
      };
    }
    const lifeMemory = deriveLifeMemorySummary(record.gameState);
    return {
      age,
      dominantAxes: formatDominantAxes(record.gameState),
      routeSignal: formatRouteSignal(lifeMemory),
      identitySignals: collectIdentitySignals(record.gameState),
      consequenceSignals: collectConsequenceSignals(input.report.records, age),
    };
  });

  const finalState = input.report.records.at(-1)?.gameState;
  const finalLifeMemory = finalState ? deriveLifeMemorySummary(finalState) : undefined;

  return {
    personaLabel: input.personaLabel,
    personaId: input.personaId,
    seed: input.seed,
    checkpoints,
    finalSummary: {
      routeSignal: finalLifeMemory ? formatRouteSignal(finalLifeMemory) : 'route: none',
      lifeMemoryEntryPoints: finalLifeMemory ? buildLifeMemoryEntryPoints(finalLifeMemory) : [],
      summaryEntry: finalLifeMemory ? buildSummaryEntry(input.report, finalLifeMemory) : 'summary: none',
    },
  };
}

export function formatP45TrajectoryMarkdown(report: P45TrajectoryReport): string {
  const lines: string[] = [
    '# P45 Trajectory Replay Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Age window: ${report.ageWindow.startAge}-${report.ageWindow.endAge}`,
    `Checkpoints: ${report.checkpointAges.join(', ')}`,
  ];

  for (const summary of report.summaries) {
    lines.push('');
    lines.push(`## ${summary.personaLabel}`);
    lines.push('');
    lines.push(`- Persona: ${summary.personaId}`);
    lines.push(`- Seed: ${summary.seed}`);
    lines.push('');
    lines.push('| Age | Dominant axes | Route signal | Identity signals | Consequence signals |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const checkpoint of summary.checkpoints) {
      lines.push(
        `| ${checkpoint.age} | ${checkpoint.dominantAxes.join(' / ') || 'none'} | ${checkpoint.routeSignal} | ${checkpoint.identitySignals.join(', ') || 'none'} | ${checkpoint.consequenceSignals.join(' / ') || 'none'} |`,
      );
    }
    lines.push('');
    lines.push('### Final Summary');
    lines.push(`- Route: ${summary.finalSummary.routeSignal}`);
    lines.push(`- Life-memory entry points: ${summary.finalSummary.lifeMemoryEntryPoints.join(' / ') || 'none'}`);
    lines.push(`- Summary entry: ${summary.finalSummary.summaryEntry}`);
  }

  return lines.join('\n');
}

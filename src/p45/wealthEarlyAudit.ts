import { dailyEventSystem } from '../core/DailyEventSystem';
import type { GameProcessRecord, GameProcessReport } from '../types/simulationRecordTypes';

export interface WealthEarlyCheckpoint {
  age: number;
  lifeStates: {
    trainingHabit: number;
    studyHabit: number;
    businessHabit: number;
  };
  money: number;
  businessAcumen: number;
  routeFlags: string[];
}

export interface WealthEarlyAudit {
  personaId: string;
  activeActionCounts: Record<string, number>;
  dailyGroupCounts: Record<string, number>;
  checkpoints: WealthEarlyCheckpoint[];
  routeSignalAges: Array<{ age: number; signal: string }>;
  notableEarlyEvents: Array<{ age: number; eventId: string; title: string }>;
}

const CHECKPOINT_AGES = [5, 10, 15, 20] as const;
const ROUTE_SIGNAL_KEYS = [
  'p8_route_wealth',
  'p9_early_business_focus',
  'route_demonic',
  'route_orthodox',
  'route_merchant',
  'route_wealth_committed',
  'p22_wealth_route_forked',
  'route_wanderer',
  'scholar_path_started',
  'merchant_network_growing',
  'origin_merchant_family',
];

function checkpointRecord(records: GameProcessRecord[], age: number): GameProcessRecord | null {
  return [...records].reverse().find(record => record.age <= age) ?? null;
}

function countActiveActions(records: GameProcessRecord[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const record of records) {
    if (record.progressionKind !== 'active_action' || !record.activeActionId) continue;
    const category = record.activeActionId.includes('business')
      ? 'business'
      : record.activeActionId.includes('training')
        ? 'training'
        : record.activeActionId.includes('study')
          ? 'study'
          : record.activeActionId.includes('socializing')
            ? 'socializing'
            : record.activeActionId.includes('travel')
              ? 'travel'
              : 'other';
    counts[category] = (counts[category] ?? 0) + 1;
  }
  return counts;
}

function countDailyGroups(records: GameProcessRecord[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const record of records) {
    const config = dailyEventSystem.getConfigByVariantId(record.eventId);
    if (!config) continue;
    counts[config.group] = (counts[config.group] ?? 0) + 1;
  }
  return counts;
}

function collectRouteSignalAges(records: GameProcessRecord[]): Array<{ age: number; signal: string }> {
  const seen = new Set<string>();
  const hits: Array<{ age: number; signal: string }> = [];
  for (const record of records) {
    const flags = record.gameState.flags ?? {};
    for (const key of ROUTE_SIGNAL_KEYS) {
      if (flags[key] && !seen.has(key)) {
        seen.add(key);
        hits.push({ age: record.age, signal: key });
      }
    }
  }
  return hits;
}

function collectNotableEvents(records: GameProcessRecord[]): Array<{ age: number; eventId: string; title: string }> {
  return records
    .filter(record =>
      record.progressionKind === 'active_action'
      || record.eventId.startsWith('p21_')
      || record.eventId.startsWith('p22_')
      || record.eventId.startsWith('p26_')
      || record.eventId.startsWith('p27_')
      || record.eventId.startsWith('p29_')
      || /route|identity|merchant|business|demonic/.test(record.eventId),
    )
    .slice(0, 12)
    .map(record => ({ age: record.age, eventId: record.eventId, title: record.eventTitle }));
}

export function summarizeWealthEarlyAudit(report: GameProcessReport): WealthEarlyAudit {
  const records = report.records.filter(record => record.age <= 20);
  return {
    personaId: report.config.p8PersonaId ?? 'unknown',
    activeActionCounts: countActiveActions(records),
    dailyGroupCounts: countDailyGroups(records),
    checkpoints: CHECKPOINT_AGES.map(age => {
      const record = checkpointRecord(records, age);
      return {
        age,
        lifeStates: {
          trainingHabit: record?.gameState.player.lifeStates.trainingHabit ?? 0,
          studyHabit: record?.gameState.player.lifeStates.studyHabit ?? 0,
          businessHabit: record?.gameState.player.lifeStates.businessHabit ?? 0,
        },
        money: record?.gameState.player.money ?? 0,
        businessAcumen: record?.gameState.player.businessAcumen ?? 0,
        routeFlags: ROUTE_SIGNAL_KEYS.filter(key => Boolean(record?.gameState.flags?.[key])),
      };
    }),
    routeSignalAges: collectRouteSignalAges(records),
    notableEarlyEvents: collectNotableEvents(records),
  };
}

export function formatWealthEarlyAuditMarkdown(audit: WealthEarlyAudit): string {
  const lines: string[] = [
    '# P45 Wealth Early Audit',
    '',
    `Persona: ${audit.personaId}`,
    '',
    '## Active Actions',
  ];
  for (const [category, count] of Object.entries(audit.activeActionCounts)) {
    lines.push(`- ${category}: ${count}`);
  }
  lines.push('');
  lines.push('## Daily Groups');
  for (const [group, count] of Object.entries(audit.dailyGroupCounts)) {
    lines.push(`- ${group}: ${count}`);
  }
  lines.push('');
  lines.push('## Checkpoints');
  lines.push('| Age | trainingHabit | studyHabit | businessHabit | money | businessAcumen | routeFlags |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const cp of audit.checkpoints) {
    lines.push(`| ${cp.age} | ${cp.lifeStates.trainingHabit} | ${cp.lifeStates.studyHabit} | ${cp.lifeStates.businessHabit} | ${cp.money} | ${cp.businessAcumen} | ${cp.routeFlags.join(', ') || 'none'} |`);
  }
  lines.push('');
  lines.push('## Route Signal Ages');
  for (const hit of audit.routeSignalAges) {
    lines.push(`- age ${hit.age}: ${hit.signal}`);
  }
  lines.push('');
  lines.push('## Notable Early Events');
  for (const event of audit.notableEarlyEvents) {
    lines.push(`- age ${event.age}: ${event.eventId} - ${event.title}`);
  }
  return lines.join('\n');
}

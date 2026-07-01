import { eventLoader } from '../core/EventLoader';
import { evaluateMixedDestinies } from '../p16/compositeDestiny';
import type { PlayerState } from '../types/eventTypes';
import { P25_MIXED_ACHIEVEMENT_TRACEABILITY } from './achievementTraceability';

export interface MixedUnlockTraceRecord {
  outcomeId: string;
  unlocked: boolean;
  flagPointers: Array<{ flag: string; present: boolean; setterEvents: string[] }>;
  eventPointers: string[];
  unmetCrossTracks?: Record<string, string>;
}

export interface MixedUnlockTraceReport {
  layer: 'world profile / content';
  records: MixedUnlockTraceRecord[];
}

function findFlagSetters(flag: string): string[] {
  return eventLoader
    .getAllEvents()
    .filter(event => {
      const scan = (effects: Array<{ type?: string; flag?: string; target?: string }> | undefined) =>
        (effects ?? []).some(e => e.type === 'flag_set' && (e.flag === flag || e.target === flag));
      if (scan(event.autoEffects as never)) return true;
      for (const choice of event.choices ?? []) {
        if (scan(choice.effects as never)) return true;
        for (const outcome of choice.outcomes ?? []) {
          if (scan(outcome.effects as never)) return true;
        }
      }
      return false;
    })
    .map(e => e.id);
}

export function buildMixedUnlockTraceReport(
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
  worldId = 'wuxia',
): MixedUnlockTraceReport {
  const reports = evaluateMixedDestinies(player, flags, worldId);
  const records: MixedUnlockTraceRecord[] = reports.map(report => {
    const trace = P25_MIXED_ACHIEVEMENT_TRACEABILITY[report.outcomeId];
    const choiceFlags = trace?.choiceFlags ?? [];
    const flagPointers = choiceFlags.map(flag => ({
      flag,
      present: Boolean(flags[flag]),
      setterEvents: findFlagSetters(flag),
    }));
    const eventPointers = trace?.midLifeConsequenceSurfaces ?? [];
    return {
      outcomeId: report.outcomeId,
      unlocked: report.unlocked,
      flagPointers,
      eventPointers,
      unmetCrossTracks: report.unmetCrossTracks,
    };
  });
  return { layer: 'world profile / content', records };
}

export function formatMixedUnlockTraceReport(report: MixedUnlockTraceReport): string[] {
  return report.records.map(record => {
    const flags = record.flagPointers
      .map(f => `${f.flag}=${f.present ? 'set' : `missing→${f.setterEvents.slice(0, 2).join('|') || '?'}`}`)
      .join('; ');
    const events = record.eventPointers.join(',');
    const cross = record.unmetCrossTracks
      ? ` cross=${Object.keys(record.unmetCrossTracks).join(',')}`
      : '';
    return `${record.outcomeId}: ${record.unlocked ? 'UNLOCKED' : 'LOCKED'} flags[${flags}] events[${events}]${cross}`;
  });
}

import { getWorldProfile } from '../narrative/worldProfile';
import type {
  CompositeDestinyOutcome,
  CompositeDestinyProgressReport,
  CompositeDestinyRequirement,
  DestinyDimension,
} from '../narrative/profile/types';
import type { PlayerState } from '../types/eventTypes';
import { readDimensionValueForDestiny } from './originSurfaces';

function evaluateRequirement(
  req: CompositeDestinyRequirement,
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
): { status: 'satisfied' | 'missing' | 'blocked'; currentValue?: number; detail: string } {
  if (req.blockedByFlags?.some(flag => flags[flag])) {
    return { status: 'blocked', detail: `blocked by ${req.blockedByFlags.join(',')}` };
  }
  if (req.requiredFlags?.length) {
    const missing = req.requiredFlags.filter(flag => !flags[flag]);
    if (missing.length > 0) {
      return { status: 'missing', detail: `missing flags: ${missing.join(',')}` };
    }
    return { status: 'satisfied', detail: `flags present: ${req.requiredFlags.join(',')}` };
  }
  if (req.minValue !== undefined) {
    const current = readDimensionValueForDestiny(player, flags, req.dimension);
    if (current < req.minValue) {
      return {
        status: 'missing',
        currentValue: current,
        detail: `${req.dimension} ${current} < ${req.minValue}`,
      };
    }
    return {
      status: 'satisfied',
      currentValue: current,
      detail: `${req.dimension} ${current} >= ${req.minValue}`,
    };
  }
  return { status: 'satisfied', detail: `${req.dimension} no threshold` };
}

export function evaluateCompositeDestinyOutcome(
  outcome: CompositeDestinyOutcome,
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
): CompositeDestinyProgressReport {
  const dimensions = outcome.requirements.map(req => {
    const result = evaluateRequirement(req, player, flags);
    return {
      dimension: req.dimension as DestinyDimension,
      status: result.status,
      currentValue: result.currentValue,
      requiredValue: req.minValue,
      detail: result.detail,
    };
  });

  const requireAll = outcome.requireAll !== false;
  const unlocked = requireAll
    ? dimensions.every(d => d.status === 'satisfied')
    : dimensions.some(d => d.status === 'satisfied');

  return {
    outcomeId: outcome.id,
    outcomeLabel: outcome.label,
    unlocked,
    dimensions,
  };
}

export function evaluateAllCompositeDestinies(
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
  worldId = 'wuxia',
): CompositeDestinyProgressReport[] {
  const outcomes = getWorldProfile(worldId).compositeDestinyOutcomes ?? [];
  return outcomes.map(outcome => evaluateCompositeDestinyOutcome(outcome, player, flags));
}

export function formatCompositeDestinyReport(report: CompositeDestinyProgressReport): string {
  const dimSummary = report.dimensions
    .map(d => `${d.dimension}=${d.status}${d.currentValue !== undefined ? `(${d.currentValue})` : ''}`)
    .join('; ');
  return `${report.outcomeLabel}: ${report.unlocked ? 'UNLOCKED' : 'LOCKED'} [${dimSummary}]`;
}

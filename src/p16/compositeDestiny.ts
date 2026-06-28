import { getWorldProfile } from '../narrative/worldProfile';
import type {
  CompositeDestinyOutcome,
  CompositeDestinyProgressReport,
  CompositeDestinyRequirement,
  DestinyDimension,
} from '../narrative/profile/types';
import type { PlayerState } from '../types/eventTypes';
import { readDimensionValueForDestiny } from './originSurfaces';

function isLuckRequirement(req: CompositeDestinyRequirement): boolean {
  return req.gateKind === 'luck' || (req.dimension === 'special_event' && req.gateKind !== 'choice');
}

function isChoiceRequirement(req: CompositeDestinyRequirement): boolean {
  return (
    req.gateKind === 'choice' ||
    (req.dimension === 'key_choices' &&
      (req.requiredFlags?.length || req.anyOfFlags?.length) &&
      req.gateKind !== 'luck')
  );
}

function isStatRequirement(req: CompositeDestinyRequirement): boolean {
  return !isLuckRequirement(req) && !isChoiceRequirement(req);
}

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
  if (req.anyOfFlags?.length) {
    const present = req.anyOfFlags.filter(flag => flags[flag]);
    if (present.length === 0) {
      return { status: 'missing', detail: `missing any of flags: ${req.anyOfFlags.join(',')}` };
    }
    return { status: 'satisfied', detail: `flags present (any): ${present.join(',')}` };
  }
  if (req.minValue !== undefined || req.maxValue !== undefined) {
    const current = readDimensionValueForDestiny(player, flags, req.dimension);
    if (req.maxValue !== undefined && current > req.maxValue) {
      return {
        status: 'missing',
        currentValue: current,
        detail: `${req.dimension} ${current} > ${req.maxValue}`,
      };
    }
    if (req.minValue !== undefined && current < req.minValue) {
      return {
        status: 'missing',
        currentValue: current,
        detail: `${req.dimension} ${current} < ${req.minValue}`,
      };
    }
    const bound =
      req.minValue !== undefined && req.maxValue !== undefined
        ? `${req.minValue}..${req.maxValue}`
        : req.minValue !== undefined
          ? `>= ${req.minValue}`
          : `<= ${req.maxValue}`;
    return {
      status: 'satisfied',
      currentValue: current,
      detail: `${req.dimension} ${current} within ${bound}`,
    };
  }
  return { status: 'satisfied', detail: `${req.dimension} no threshold` };
}

function buildUnmetCrossTracks(
  outcome: CompositeDestinyOutcome,
  dimensions: CompositeDestinyProgressReport['dimensions'],
): Record<string, string> | undefined {
  if (!outcome.crossTrackGroups?.length) return undefined;
  const unmet: Record<string, string> = {};
  for (const group of outcome.crossTrackGroups) {
    const groupSatisfied = group.requirementIndices.every(
      idx => dimensions[idx]?.status === 'satisfied',
    );
    if (!groupSatisfied) {
      const details = group.requirementIndices
        .filter(idx => dimensions[idx]?.status !== 'satisfied')
        .map(idx => dimensions[idx]!.detail)
        .join('; ');
      unmet[group.trackId] = `${group.trackLabel}: ${details}`;
    }
  }
  return Object.keys(unmet).length > 0 ? unmet : undefined;
}

function applyMutexToReports(
  reports: CompositeDestinyProgressReport[],
  outcomes: CompositeDestinyOutcome[],
): CompositeDestinyProgressReport[] {
  const unlocked = new Set(reports.filter(r => r.unlocked).map(r => r.outcomeId));
  return reports.map(report => {
    const outcome = outcomes.find(o => o.id === report.outcomeId);
    if (!report.unlocked || !outcome?.mutexWith?.length) return report;
    const conflict = outcome.mutexWith.find(id => unlocked.has(id) && id !== report.outcomeId);
    if (!conflict) return report;
    return {
      ...report,
      unlocked: false,
      dimensions: [
        ...report.dimensions,
        {
          dimension: 'key_choices' as DestinyDimension,
          status: 'blocked' as const,
          detail: `mutex with ${conflict}`,
        },
      ],
    };
  });
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
  let unlocked = requireAll
    ? dimensions.every(d => d.status === 'satisfied')
    : dimensions.some(d => d.status === 'satisfied');

  const unmetGates: { choice?: string; luck?: string } = {};
  if (outcome.tier === 'pinnacle' || outcome.grindCannotSubstituteLuck) {
    for (let i = 0; i < outcome.requirements.length; i++) {
      const req = outcome.requirements[i]!;
      const dim = dimensions[i]!;
      if (dim.status !== 'satisfied') {
        if (isChoiceRequirement(req)) {
          unmetGates.choice = dim.detail;
        } else if (isLuckRequirement(req)) {
          unmetGates.luck = dim.detail;
        }
      }
    }
    if (outcome.grindCannotSubstituteLuck) {
      const statsSatisfied = outcome.requirements.every(
        (req, i) => !isStatRequirement(req) || dimensions[i]?.status === 'satisfied',
      );
      const luckSatisfied = outcome.requirements.every(
        (req, i) => !isLuckRequirement(req) || dimensions[i]?.status === 'satisfied',
      );
      if (statsSatisfied && !luckSatisfied) {
        unlocked = false;
      }
    }
  }

  const unmetCrossTracks =
    outcome.tier === 'mixed' ? buildUnmetCrossTracks(outcome, dimensions) : undefined;

  return {
    outcomeId: outcome.id,
    outcomeLabel: outcome.label,
    unlocked,
    dimensions,
    unmetGates: Object.keys(unmetGates).length > 0 ? unmetGates : undefined,
    unmetCrossTracks,
  };
}

export function evaluateAllCompositeDestinies(
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
  worldId = 'wuxia',
): CompositeDestinyProgressReport[] {
  const profile = getWorldProfile(worldId);
  const outcomes = [
    ...(profile.compositeDestinyOutcomes ?? []),
    ...(profile.pinnacleDestinyOutcomes ?? []),
    ...(profile.mixedDestinyOutcomes ?? []),
  ];
  const reports = outcomes.map(outcome => evaluateCompositeDestinyOutcome(outcome, player, flags));
  return applyMutexToReports(reports, outcomes);
}

export function evaluateMixedDestinies(
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
  worldId = 'wuxia',
): CompositeDestinyProgressReport[] {
  const profile = getWorldProfile(worldId);
  const mixed = profile.mixedDestinyOutcomes ?? [];
  const allOutcomes = [
    ...(profile.compositeDestinyOutcomes ?? []),
    ...(profile.pinnacleDestinyOutcomes ?? []),
    ...mixed,
  ];
  const reports = mixed.map(outcome => evaluateCompositeDestinyOutcome(outcome, player, flags));
  return applyMutexToReports(reports, allOutcomes);
}

export function evaluatePinnacleDestinies(
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
  worldId = 'wuxia',
): CompositeDestinyProgressReport[] {
  const outcomes = getWorldProfile(worldId).pinnacleDestinyOutcomes ?? [];
  return outcomes.map(outcome => evaluateCompositeDestinyOutcome(outcome, player, flags));
}

export function formatCompositeDestinyReport(report: CompositeDestinyProgressReport): string {
  const dimSummary = report.dimensions
    .map(d => `${d.dimension}=${d.status}${d.currentValue !== undefined ? `(${d.currentValue})` : ''}`)
    .join('; ');
  const gateSummary = report.unmetGates
    ? ` | gates: choice=${report.unmetGates.choice ? 'unmet' : 'ok'} luck=${report.unmetGates.luck ? 'unmet' : 'ok'}`
    : '';
  const crossSummary = report.unmetCrossTracks
    ? ` | cross-tracks: ${Object.keys(report.unmetCrossTracks).join(',')}=unmet`
    : '';
  return `${report.outcomeLabel}: ${report.unlocked ? 'UNLOCKED' : 'LOCKED'} [${dimSummary}]${gateSummary}${crossSummary}`;
}

import { getAllStageConfigs } from '../narrative/config/stageConfig';
import { WUXIA_ROUTE_DEFINITIONS } from '../narrative/config/routeDefinitions';
import type { GameProcessRecord } from '../types/simulationRecordTypes';
import { detectStageSignalsForStage, observeRoutePoint } from './signalDetection';
import { classifyMissingSignals } from './gapClassification';
import { PERSONA_ROUTE_MAP } from './schedulingContext';
import type {
  P11SchedulingGateReport,
  RouteBaselineEntry,
  RoutePointAuditEntry,
  StageBaselineEntry,
  StageGapEntry,
  StageSignalKey,
} from './types';
import { isStageSignalKey } from './signalVocabulary';

const STAGE_AGE_BANDS: Record<string, string> = {
  stage_0_10: '0-10',
  stage_10_20: '10-20',
  stage_20_30: '20-30',
  stage_30_40: '30-40',
};

function lastRecordOf(records: GameProcessRecord[]): GameProcessRecord | undefined {
  return records.length > 0 ? records[records.length - 1] : undefined;
}

function mergeRecords(bundles: Array<{ records: GameProcessRecord[] }>): GameProcessRecord[] {
  return bundles.flatMap(bundle => bundle.records);
}

export function buildStageBaseline(
  personaBundles: Array<{ personaId: string; records: GameProcessRecord[] }>,
): StageBaselineEntry[] {
  const allRecords = mergeRecords(personaBundles);
  const lastBundle = personaBundles.length > 0 ? personaBundles[personaBundles.length - 1] : undefined;
  const finalState = lastBundle ? lastRecordOf(lastBundle.records)?.gameState : undefined;

  return getAllStageConfigs().map(stage => {
    const expectedSignals = stage.feedbackExpectation.expectedSignals.filter(isStageSignalKey);
    const detectedSignals = detectStageSignalsForStage(stage.id, {
      records: allRecords,
      finalState,
      ageMin: stage.ageMin,
      ageMax: stage.ageMax,
    });
    const detectedKeys = new Set(detectedSignals.map(item => item.key));
    const missingSignals = expectedSignals.filter(signal => !detectedKeys.has(signal));

    return {
      stageId: stage.id,
      ageBand: STAGE_AGE_BANDS[stage.id] ?? `${stage.ageMin}-${stage.ageMax}`,
      expectedSignals,
      detectedSignals,
      missingSignals,
    };
  });
}

export function buildStageGapReport(
  stageBaseline: StageBaselineEntry[],
  personaBundles: Array<{ personaId: string; records: GameProcessRecord[] }>,
): StageGapEntry[] {
  const observedAcrossPersonas = new Set<StageSignalKey>();

  for (const bundle of personaBundles) {
    for (const stage of getAllStageConfigs()) {
      const detected = detectStageSignalsForStage(stage.id, {
        records: bundle.records,
        finalState: lastRecordOf(bundle.records)?.gameState,
        ageMin: stage.ageMin,
        ageMax: stage.ageMax,
      });
      for (const item of detected) {
        observedAcrossPersonas.add(item.key);
      }
    }
  }

  const gaps: StageGapEntry[] = [];
  for (const entry of stageBaseline) {
    if (entry.missingSignals.length === 0) {
      continue;
    }
    gaps.push(...classifyMissingSignals(entry.stageId, entry.missingSignals, observedAcrossPersonas));
  }
  return gaps;
}

export function buildRouteBaseline(
  personaBundles: Array<{ personaId: string; records: GameProcessRecord[] }>,
): RouteBaselineEntry[] {
  const routePersonas = new Map<string, string[]>();
  for (const bundle of personaBundles) {
    const routeId = PERSONA_ROUTE_MAP[bundle.personaId];
    if (!routeId) {
      continue;
    }
    const list = routePersonas.get(routeId) ?? [];
    list.push(bundle.personaId);
    routePersonas.set(routeId, list);
  }

  const primaryRoutes = [
    'route_martial',
    'route_scholar',
    'route_social',
    'route_wealth',
    'route_wanderer',
    'route_deviant',
  ];

  return primaryRoutes.map(routeId => {
    const route = WUXIA_ROUTE_DEFINITIONS.find(item => item.id === routeId)!;
    const personaIds = routePersonas.get(routeId) ?? [];
    const records = personaBundles
      .filter(bundle => personaIds.includes(bundle.personaId))
      .flatMap(bundle => bundle.records);
    const lastRecord = lastRecordOf(records);
    const finalFlags = {
      ...(lastRecord?.gameState?.flags ?? {}),
      ...(lastRecord?.gameState?.player?.flags ?? {}),
    };

    const allPoints = [
      ...route.entrySignals,
      ...route.reinforcementPoints,
      ...route.divergencePoints,
      ...route.identitySignals,
    ];

    const points: RoutePointAuditEntry[] = allPoints.map(point => {
      const { observed, sources } = observeRoutePoint(point, records, finalFlags);
      return {
        routeId,
        routeLabel: route.label,
        point,
        observed,
        observationSources: sources,
      };
    });

    return {
      routeId,
      routeLabel: route.label,
      personaIds,
      points,
      neverScheduledPoints: points.filter(item => !item.observed),
    };
  });
}

export function assembleP11SchedulingGateReport(
  personaBundles: Array<{ personaId: string; records: GameProcessRecord[] }>,
): P11SchedulingGateReport {
  const stageCoverage = buildStageBaseline(personaBundles);
  const stageGaps = buildStageGapReport(stageCoverage, personaBundles);
  const routeCoverage = buildRouteBaseline(personaBundles);

  const stageBandsWithGaps = stageCoverage.filter(entry => entry.missingSignals.length > 0).length;
  const routePointsNeverScheduled = routeCoverage.reduce(
    (sum, route) => sum + route.neverScheduledPoints.length,
    0,
  );

  let decision: P11SchedulingGateReport['decision'] = 'pass';
  if (stageBandsWithGaps >= 3 || routePointsNeverScheduled >= 8) {
    decision = 'fail';
  } else if (stageBandsWithGaps > 0 || routePointsNeverScheduled > 0) {
    decision = 'warning';
  }

  const notes: string[] = [];
  if (stageGaps.some(gap => gap.cause === 'no-content')) {
    notes.push('Some missing stage signals have no declared content coverage.');
  }
  if (stageGaps.some(gap => gap.cause === 'weak-scheduling')) {
    notes.push('Some stage signals have content but weak scheduling coverage.');
  }
  if (routePointsNeverScheduled > 0) {
    notes.push(`${routePointsNeverScheduled} configured route points never scheduled in persona runs.`);
  }

  return {
    schemaVersion: 'p11-scheduling-v1',
    generatedAt: new Date().toISOString(),
    decision,
    stageCoverage,
    stageGaps,
    routeCoverage,
    summary: {
      stageBandsWithGaps,
      routePointsNeverScheduled,
      notes,
    },
  };
}

export function formatStageBaselineMarkdown(
  stageBaseline: StageBaselineEntry[],
  stageGaps: StageGapEntry[],
): string {
  const lines: string[] = [
    '# P11 Stage Expectation Baseline',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
  ];

  for (const entry of stageBaseline) {
    lines.push(`## ${entry.ageBand} (${entry.stageId})`);
    lines.push('');
    lines.push('### Expected signals');
    for (const signal of entry.expectedSignals) {
      lines.push(`- ${signal}`);
    }
    lines.push('');
    lines.push('### Detected signals');
    if (entry.detectedSignals.length === 0) {
      lines.push('- (none detected)');
    } else {
      for (const detected of entry.detectedSignals) {
        lines.push(`- **${detected.key}** @ ages ${detected.ages.join(', ')} — ${detected.sources.slice(0, 3).join('; ')}`);
      }
    }
    lines.push('');
    lines.push('### Missing signals');
    if (entry.missingSignals.length === 0) {
      lines.push('- (none)');
    } else {
      for (const signal of entry.missingSignals) {
        lines.push(`- ${signal}`);
      }
    }
    lines.push('');
  }

  if (stageGaps.length > 0) {
    lines.push('## Gap classification');
    lines.push('');
    for (const gap of stageGaps) {
      lines.push(`- **${gap.stageId}/${gap.signal}** → ${gap.cause}`);
      lines.push(`  - Example: ${gap.example}`);
    }
  }

  return lines.join('\n');
}

export function formatRouteBaselineMarkdown(routeBaseline: RouteBaselineEntry[]): string {
  const lines: string[] = [
    '# P11 Route Scheduling Baseline Audit',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
  ];

  for (const route of routeBaseline) {
    lines.push(`## ${route.routeLabel} (${route.routeId})`);
    lines.push(`Personas: ${route.personaIds.join(', ') || '(none)'}`);
    lines.push('');
    for (const point of route.points) {
      const status = point.observed ? 'OBSERVED' : 'MISSING';
      lines.push(`- [${status}] ${point.point.kind} @ ${point.point.ageBand}: ${point.point.description}`);
      if (point.point.eventId) {
        lines.push(`  - eventId: ${point.point.eventId}`);
      }
      if (point.point.flagKey) {
        lines.push(`  - flagKey: ${point.point.flagKey}`);
      }
      if (point.observationSources.length > 0) {
        lines.push(`  - sources: ${point.observationSources.join(', ')}`);
      }
    }
    if (route.neverScheduledPoints.length > 0) {
      lines.push('');
      lines.push('### Never scheduled');
      for (const point of route.neverScheduledPoints) {
        lines.push(`- ${point.point.kind} @ ${point.point.ageBand}: ${point.point.description}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function formatP11GateMarkdown(report: P11SchedulingGateReport): string {
  const lines = [
    '# P11 Scheduling Gate Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Decision: **${report.decision.toUpperCase()}**`,
    '',
    '## Summary',
    `- Stage bands with gaps: ${report.summary.stageBandsWithGaps}/4`,
    `- Route points never scheduled: ${report.summary.routePointsNeverScheduled}`,
    ...report.summary.notes.map(note => `- ${note}`),
    '',
    formatStageBaselineMarkdown(report.stageCoverage, report.stageGaps),
    '',
    formatRouteBaselineMarkdown(report.routeCoverage),
  ];
  return lines.join('\n');
}

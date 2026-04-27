import {
  P2_SIMULATION_METRIC_DEFINITIONS,
  type SimulationMetricDefinition,
} from './gameplaySimulationMetricDefinitions';
import type { GameProcessReport } from '../tests/GameProcessSimulator';

export type SimulationGateStatus = 'pass' | 'warning' | 'fail';

export interface SimulationWaiver {
  metricKey: string;
  reason: string;
}

export interface SimulationMetricEvaluation {
  key: SimulationMetricDefinition['key'];
  label: string;
  severity: 'blocker' | 'warning' | 'info';
  actualValue: number | null;
  thresholdMin?: number;
  thresholdMax?: number;
  status: SimulationGateStatus;
  detail: string;
  waived: boolean;
  waiverReason?: string;
}

export interface SimulationGateResult {
  decision: 'pass' | 'fail';
  blockingMetrics: SimulationMetricEvaluation[];
  warningMetrics: SimulationMetricEvaluation[];
  infoMetrics: SimulationMetricEvaluation[];
}

const METRIC_DEFINITION_MAP = new Map(
  P2_SIMULATION_METRIC_DEFINITIONS.map(def => [def.key, def] as const),
);

function evaluateRange(
  key: SimulationMetricDefinition['key'],
  value: number | null,
): Pick<SimulationMetricEvaluation, 'status' | 'detail'> {
  if (value === null) {
    return { status: 'warning', detail: `${key}: insufficient sample` };
  }
  const definition = METRIC_DEFINITION_MAP.get(key);
  if (!definition) {
    return { status: 'warning', detail: `${key}: definition missing` };
  }
  const { min, max } = definition.baseline;
  const pieces = [`actual=${value.toFixed(4)}`];
  if (typeof min === 'number') {
    pieces.push(`min=${min}`);
  }
  if (typeof max === 'number') {
    pieces.push(`max=${max}`);
  }

  if (typeof min === 'number' && value < min) {
    return { status: 'fail', detail: `${pieces.join(', ')} (below min)` };
  }
  if (typeof max === 'number' && value > max) {
    return { status: 'fail', detail: `${pieces.join(', ')} (above max)` };
  }

  return { status: 'pass', detail: pieces.join(', ') };
}

function countRouteLifecycle(
  reports: GameProcessReport[],
): { started: number; completed: number; failed: number } {
  let started = 0;
  let completed = 0;
  let failed = 0;
  for (const report of reports) {
    const finalState = report.records.length > 0 ? report.records[report.records.length - 1].gameState : null;
    const routeStates = finalState?.routeStates || {};
    for (const routeState of Object.values(routeStates)) {
      if (!routeState || typeof routeState !== 'object') {
        continue;
      }
      const lifecycle = (routeState as { lifecycle?: string }).lifecycle;
      if (!lifecycle || lifecycle === 'inactive') {
        continue;
      }
      started += 1;
      if (lifecycle === 'completed') {
        completed += 1;
      } else if (lifecycle === 'failed') {
        failed += 1;
      }
    }
  }
  return { started, completed, failed };
}

function computeMetrics(reports: GameProcessReport[]): Record<SimulationMetricDefinition['key'], number | null> {
  const totalEvents = reports.reduce((sum, report) => sum + report.totalEvents, 0);
  const totalChoices = reports.reduce((sum, report) => sum + report.totalChoices, 0);
  const totalAutoEvents = reports.reduce((sum, report) => sum + report.statistics.autoEvents, 0);
  const totalSaves = reports.reduce((sum, report) => sum + report.totalSaves, 0);
  const deaths = reports.filter(report => !report.isAlive).length;
  const lifeCount = reports.length;
  const withFamilyOrRomance = reports.filter(report => {
    const spouse = report.statistics.spouse;
    const children = report.statistics.children || 0;
    return Boolean(spouse) || children > 0;
  }).length;

  const endingCounts = new Map<string, number>();
  for (const report of reports) {
    const ending = report.statistics.endingSummary || report.deathReason || 'unknown';
    endingCounts.set(ending, (endingCounts.get(ending) || 0) + 1);
  }
  const maxEndingShare = lifeCount > 0
    ? Math.max(...Array.from(endingCounts.values())) / lifeCount
    : null;

  const { started, completed, failed } = countRouteLifecycle(reports);

  return {
    choice_rate: totalEvents > 0 ? totalChoices / totalEvents : null,
    auto_event_rate: totalEvents > 0 ? totalAutoEvents / totalEvents : null,
    route_completion_rate: started > 0 ? completed / started : null,
    route_breakage_rate: started > 0 ? failed / started : null,
    death_rate: lifeCount > 0 ? deaths / lifeCount : null,
    ending_distribution: maxEndingShare,
    romance_family_achievement_rate: lifeCount > 0 ? withFamilyOrRomance / lifeCount : null,
    save_count: lifeCount > 0 ? totalSaves / lifeCount : null,
  };
}

export function validateWaivers(waivers: SimulationWaiver[]): void {
  for (const waiver of waivers) {
    if (!waiver.metricKey || !waiver.metricKey.trim()) {
      throw new Error('Waiver metric key is required.');
    }
    if (!waiver.reason || !waiver.reason.trim()) {
      throw new Error(`Waiver reason is required for metric "${waiver.metricKey}".`);
    }
  }
}

export function parseWaiverArg(raw: string): SimulationWaiver {
  const separator = raw.indexOf(':');
  if (separator < 0) {
    throw new Error(`Invalid waiver format "${raw}". Use metricKey:reason.`);
  }
  const metricKey = raw.slice(0, separator).trim();
  const reason = raw.slice(separator + 1).trim();
  if (!metricKey) {
    throw new Error(`Invalid waiver format "${raw}". metricKey is empty.`);
  }
  if (!reason) {
    throw new Error(`Invalid waiver format "${raw}". reason is empty.`);
  }
  return { metricKey, reason };
}

function evaluateEndingDistribution(value: number | null): Pick<SimulationMetricEvaluation, 'status' | 'detail' | 'severity'> {
  if (value === null) {
    return { severity: 'warning', status: 'warning', detail: 'ending_distribution: insufficient sample' };
  }
  if (value > 0.85) {
    return { severity: 'blocker', status: 'fail', detail: `actual=${value.toFixed(4)}, blocker>0.85` };
  }
  if (value > 0.7) {
    return { severity: 'warning', status: 'warning', detail: `actual=${value.toFixed(4)}, warning>0.70` };
  }
  return { severity: 'info', status: 'pass', detail: `actual=${value.toFixed(4)}` };
}

export function evaluateSimulationGate(
  reports: GameProcessReport[],
  waivers: SimulationWaiver[] = [],
): SimulationGateResult {
  validateWaivers(waivers);
  const waiverMap = new Map(waivers.map(item => [item.metricKey, item.reason] as const));
  const metrics = computeMetrics(reports);
  const evaluations: SimulationMetricEvaluation[] = [];

  for (const definition of P2_SIMULATION_METRIC_DEFINITIONS) {
    const actualValue = metrics[definition.key];
    let severity = definition.severity;
    let status: SimulationGateStatus = 'pass';
    let detail = '';

    if (definition.key === 'ending_distribution') {
      const endingResult = evaluateEndingDistribution(actualValue);
      severity = endingResult.severity;
      status = endingResult.status;
      detail = endingResult.detail;
    } else {
      const rangeResult = evaluateRange(definition.key, actualValue);
      status = rangeResult.status;
      detail = rangeResult.detail;
      if (status === 'fail' && definition.severity === 'info') {
        status = 'warning';
      }
    }

    const waiverReason = waiverMap.get(definition.key);
    const waived = Boolean(waiverReason);
    const finalStatus = status === 'fail' && waived ? 'warning' : status;

    evaluations.push({
      key: definition.key,
      label: definition.label,
      severity,
      actualValue,
      thresholdMin: definition.baseline.min,
      thresholdMax: definition.baseline.max,
      status: finalStatus,
      detail,
      waived,
      waiverReason,
    });
  }

  const blockingMetrics = evaluations.filter(metric => metric.severity === 'blocker');
  const warningMetrics = evaluations.filter(metric => metric.severity === 'warning');
  const infoMetrics = evaluations.filter(metric => metric.severity === 'info');
  const hasBlockingFailure = blockingMetrics.some(metric => metric.status === 'fail');

  return {
    decision: hasBlockingFailure ? 'fail' : 'pass',
    blockingMetrics,
    warningMetrics,
    infoMetrics,
  };
}

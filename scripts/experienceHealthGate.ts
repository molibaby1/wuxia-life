import { computeExperienceDerivedMetrics } from './computeExperienceMetricsFromReports';
import {
  EXPERIENCE_HEALTH_METRIC_DEFINITIONS,
  type ExperienceHealthMetricDefinition,
  type ExperienceHealthMetricKey,
} from './experienceHealthMetricDefinitions';
import {
  evaluateSimulationGate,
  parseWaiverArg,
  type SimulationGateResult,
  type SimulationMetricEvaluation,
  type SimulationWaiver,
} from './gameplaySimulationGate';
import type { GameProcessReport } from '../tests/GameProcessSimulator';

export type ExperienceHealthGateStatus = 'pass' | 'warning' | 'fail';

export interface ExperienceHealthMetricEvaluation {
  key: ExperienceHealthMetricKey;
  label: string;
  severity: 'blocker' | 'warning' | 'info';
  actualValue: number | null;
  thresholdMin?: number;
  thresholdMax?: number;
  status: ExperienceHealthGateStatus;
  detail: string;
  waived: boolean;
  waiverReason?: string;
  nonWaivable: boolean;
}

export interface ExperienceHealthGateResult {
  decision: 'pass' | 'fail';
  warningsFailed: boolean;
  blockingMetrics: ExperienceHealthMetricEvaluation[];
  warningMetrics: ExperienceHealthMetricEvaluation[];
  infoMetrics: ExperienceHealthMetricEvaluation[];
  p2Gate: SimulationGateResult;
  derivedMetrics: ReturnType<typeof computeExperienceDerivedMetrics>;
}

const DEFINITION_MAP = new Map(
  EXPERIENCE_HEALTH_METRIC_DEFINITIONS.map(def => [def.key, def] as const),
);

const P2_KEYS = new Set(
  EXPERIENCE_HEALTH_METRIC_DEFINITIONS.filter(def =>
    [
      'choice_rate',
      'auto_event_rate',
      'route_completion_rate',
      'route_breakage_rate',
      'death_rate',
      'ending_distribution',
      'romance_family_achievement_rate',
      'save_count',
    ].includes(def.key)
  ).map(def => def.key)
);

export { parseWaiverArg, type SimulationWaiver };

export function validateExperienceWaivers(waivers: SimulationWaiver[]): void {
  for (const waiver of waivers) {
    if (!waiver.metricKey?.trim()) {
      throw new Error('Waiver metric key is required.');
    }
    if (!waiver.reason?.trim()) {
      throw new Error(`Waiver reason is required for metric "${waiver.metricKey}".`);
    }
    if (waiver.reason.trim().length < 10) {
      throw new Error(
        `Waiver reason for "${waiver.metricKey}" must be at least 10 characters.`,
      );
    }
    const definition = DEFINITION_MAP.get(waiver.metricKey as ExperienceHealthMetricKey);
    if (definition?.nonWaivable) {
      throw new Error(`Metric "${waiver.metricKey}" cannot be waived.`);
    }
  }
}

function evaluateRange(
  definition: ExperienceHealthMetricDefinition,
  value: number | null,
): Pick<ExperienceHealthMetricEvaluation, 'status' | 'detail'> {
  if (value === null) {
    return { status: 'warning', detail: `${definition.key}: insufficient sample` };
  }

  const pieces = [`actual=${value.toFixed(4)}`];
  if (typeof definition.baseline.min === 'number') {
    pieces.push(`min=${definition.baseline.min}`);
  }
  if (typeof definition.baseline.max === 'number') {
    pieces.push(`max=${definition.baseline.max}`);
  }

  if (typeof definition.baseline.min === 'number' && value < definition.baseline.min) {
    return { status: 'fail', detail: `${pieces.join(', ')} (below min)` };
  }
  if (typeof definition.baseline.max === 'number' && value > definition.baseline.max) {
    return { status: 'fail', detail: `${pieces.join(', ')} (above max)` };
  }

  return { status: 'pass', detail: pieces.join(', ') };
}

function evaluateEndingDistribution(
  value: number | null,
): Pick<ExperienceHealthMetricEvaluation, 'status' | 'detail' | 'severity'> {
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

function mapP2Evaluation(
  metric: SimulationMetricEvaluation,
  waiverMap: Map<string, string>,
): ExperienceHealthMetricEvaluation {
  const definition = DEFINITION_MAP.get(metric.key as ExperienceHealthMetricKey);
  const waiverReason = waiverMap.get(metric.key);
  const waived = Boolean(waiverReason);
  const finalStatus = metric.status === 'fail' && waived ? 'warning' : metric.status;

  return {
    key: metric.key as ExperienceHealthMetricKey,
    label: metric.label,
    severity: metric.severity,
    actualValue: metric.actualValue,
    thresholdMin: metric.thresholdMin,
    thresholdMax: metric.thresholdMax,
    status: finalStatus,
    detail: metric.detail,
    waived,
    waiverReason,
    nonWaivable: definition?.nonWaivable ?? false,
  };
}

function evaluateDerivedMetric(
  definition: ExperienceHealthMetricDefinition,
  value: number | null,
  waiverMap: Map<string, string>,
): ExperienceHealthMetricEvaluation {
  let status: ExperienceHealthGateStatus = 'pass';
  let detail = '';
  let severity = definition.severity;

  if (definition.key === 'ending_distribution') {
    const ending = evaluateEndingDistribution(value);
    severity = ending.severity;
    status = ending.status;
    detail = ending.detail;
  } else {
    const range = evaluateRange(definition, value);
    status = range.status;
    detail = range.detail;
    if (status === 'fail' && definition.severity === 'info') {
      status = 'warning';
    }
  }

  const waiverReason = waiverMap.get(definition.key);
  const waived = Boolean(waiverReason);
  const finalStatus = status === 'fail' && waived ? 'warning' : status;

  return {
    key: definition.key,
    label: definition.label,
    severity,
    actualValue: value,
    thresholdMin: definition.baseline.min,
    thresholdMax: definition.baseline.max,
    status: finalStatus,
    detail,
    waived,
    waiverReason,
    nonWaivable: definition.nonWaivable ?? false,
  };
}

export function evaluateExperienceHealthGate(
  reports: GameProcessReport[],
  waivers: SimulationWaiver[] = [],
): ExperienceHealthGateResult {
  validateExperienceWaivers(waivers);
  const waiverMap = new Map(waivers.map(item => [item.metricKey, item.reason] as const));
  const p2Gate = evaluateSimulationGate(reports, waivers);
  const derivedMetrics = computeExperienceDerivedMetrics(reports);

  const evaluations: ExperienceHealthMetricEvaluation[] = [];

  for (const metric of [
    ...p2Gate.blockingMetrics,
    ...p2Gate.warningMetrics,
    ...p2Gate.infoMetrics,
  ]) {
    if (P2_KEYS.has(metric.key as ExperienceHealthMetricKey)) {
      evaluations.push(mapP2Evaluation(metric, waiverMap));
    }
  }

  for (const definition of EXPERIENCE_HEALTH_METRIC_DEFINITIONS) {
    if (P2_KEYS.has(definition.key)) {
      continue;
    }
    const value = derivedMetrics[definition.key as keyof typeof derivedMetrics] ?? null;
    evaluations.push(evaluateDerivedMetric(definition, value, waiverMap));
  }

  const blockingMetrics = evaluations.filter(metric => metric.severity === 'blocker');
  const warningMetrics = evaluations.filter(metric => metric.severity === 'warning');
  const infoMetrics = evaluations.filter(metric => metric.severity === 'info');
  const hasBlockingFailure = blockingMetrics.some(metric => metric.status === 'fail');
  const warningsFailed =
    warningMetrics.some(metric => metric.status === 'fail') ||
    infoMetrics.some(metric => metric.status === 'fail');

  return {
    decision: hasBlockingFailure ? 'fail' : 'pass',
    warningsFailed,
    blockingMetrics,
    warningMetrics,
    infoMetrics,
    p2Gate,
    derivedMetrics,
  };
}

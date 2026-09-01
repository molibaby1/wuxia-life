import { computeExperienceDerivedMetrics } from './computeExperienceMetricsFromReports';
import { buildDeathRiskTelemetry } from './deathRiskTelemetry';
import {
  EXPERIENCE_HEALTH_METRIC_DEFINITIONS,
  type ExperienceHealthMetricDefinition,
  type ExperienceHealthMetricKey,
} from './experienceHealthMetricDefinitions';
import {
  P3_DEATH_RATE_MAX,
  P3_EVAL_COHORT_LABEL,
} from './p3TrustTargets';
import {
  evaluateSimulationGate,
  parseWaiverArg,
  type SimulationGateResult,
  type SimulationMetricEvaluation,
  type SimulationWaiver,
} from './gameplaySimulationGate';
import type { GameProcessReport } from '../src/types/simulationRecordTypes';

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
  p3EvalSampleCount?: number;
  /** US-029: P3-EVAL trust metrics enforced as blockers when present. */
  p3TrustEnforced?: boolean;
}

export type P3EvalReportEntry = {
  report: GameProcessReport;
  sampleId: string;
};

const P3_ONLY_KEYS = new Set<ExperienceHealthMetricKey>([
  'death_without_warning_count',
  'p2_legacy_death_rate',
]);

const DEFINITION_MAP = new Map(
  EXPERIENCE_HEALTH_METRIC_DEFINITIONS.map(def => [def.key, def] as const),
);

const P2_KEYS = new Set(
  EXPERIENCE_HEALTH_METRIC_DEFINITIONS.filter(def =>
    [
      'choice_rate',
      'auto_event_rate',
      'death_rate',
      'ending_distribution',
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

function evaluateP3DeathMetrics(entries: P3EvalReportEntry[]): {
  deathRate: number | null;
  deathWithoutWarningCount: number;
} {
  if (entries.length === 0) {
    return { deathRate: null, deathWithoutWarningCount: 0 };
  }

  const deaths = entries.filter(entry => !entry.report.isAlive).length;
  let deathWithoutWarningCount = 0;
  for (const entry of entries) {
    const telemetry = buildDeathRiskTelemetry(entry.report, entry.sampleId);
    if (telemetry?.deathWithoutWarning) {
      deathWithoutWarningCount += 1;
    }
  }

  return {
    deathRate: deaths / entries.length,
    deathWithoutWarningCount,
  };
}

function applyP3DeathEvaluations(
  evaluations: ExperienceHealthMetricEvaluation[],
  p3EvalEntries: P3EvalReportEntry[],
  p2Reports: GameProcessReport[],
  waiverMap: Map<string, string>,
): void {
  const { deathRate, deathWithoutWarningCount } = evaluateP3DeathMetrics(p3EvalEntries);
  const deathMetric = evaluations.find(metric => metric.key === 'death_rate');
  if (deathMetric) {
    const status: ExperienceHealthGateStatus =
      deathRate !== null && deathRate > P3_DEATH_RATE_MAX ? 'fail' : 'pass';
    const waiverReason = waiverMap.get('death_rate');
    const waived = Boolean(waiverReason);
    deathMetric.severity = 'blocker';
    deathMetric.actualValue = deathRate;
    deathMetric.thresholdMin = undefined;
    deathMetric.thresholdMax = P3_DEATH_RATE_MAX;
    deathMetric.detail = `${P3_EVAL_COHORT_LABEL} actual=${deathRate?.toFixed(4) ?? 'n/a'}, max=${P3_DEATH_RATE_MAX}, samples=${p3EvalEntries.length}`;
    deathMetric.status = status === 'fail' && waived ? 'warning' : status;
    deathMetric.waived = waived;
    deathMetric.waiverReason = waiverReason;
    deathMetric.nonWaivable = true;
  }

  const dwwDefinition = DEFINITION_MAP.get('death_without_warning_count');
  if (dwwDefinition) {
    const status: ExperienceHealthGateStatus =
      deathWithoutWarningCount > 0 ? 'fail' : 'pass';
    const waiverReason = waiverMap.get('death_without_warning_count');
    const waived = Boolean(waiverReason);
    evaluations.push({
      key: 'death_without_warning_count',
      label: dwwDefinition.label,
      severity: dwwDefinition.severity,
      actualValue: deathWithoutWarningCount,
      thresholdMax: dwwDefinition.baseline.max,
      status: status === 'fail' && waived ? 'warning' : status,
      detail: `P3-EVAL actual=${deathWithoutWarningCount}, max=0, samples=${p3EvalEntries.length}`,
      waived,
      waiverReason,
      nonWaivable: dwwDefinition.nonWaivable ?? false,
    });
  }

  const p2LegacyDefinition = DEFINITION_MAP.get('p2_legacy_death_rate');
  if (p2LegacyDefinition) {
    const p2Deaths = p2Reports.filter(report => !report.isAlive).length;
    const p2DeathRate = p2Reports.length > 0 ? p2Deaths / p2Reports.length : null;
    const range = evaluateRange(p2LegacyDefinition, p2DeathRate);
    const waiverReason = waiverMap.get('p2_legacy_death_rate');
    const waived = Boolean(waiverReason);
    const finalStatus = range.status === 'fail' && waived ? 'warning' : range.status;
    evaluations.push({
      key: 'p2_legacy_death_rate',
      label: p2LegacyDefinition.label,
      severity: p2LegacyDefinition.severity,
      actualValue: p2DeathRate,
      thresholdMin: p2LegacyDefinition.baseline.min,
      thresholdMax: p2LegacyDefinition.baseline.max,
      status: finalStatus === 'fail' && p2LegacyDefinition.severity === 'info' ? 'warning' : finalStatus,
      detail: `P2-LEGACY ${range.detail}, samples=${p2Reports.length}`,
      waived,
      waiverReason,
      nonWaivable: false,
    });
  }
}

export function evaluateExperienceHealthGate(
  reports: GameProcessReport[],
  waivers: SimulationWaiver[] = [],
  p3EvalEntries: P3EvalReportEntry[] = [],
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
    if (P2_KEYS.has(definition.key) || P3_ONLY_KEYS.has(definition.key)) {
      continue;
    }
    const value = derivedMetrics[definition.key as keyof typeof derivedMetrics] ?? null;
    evaluations.push(evaluateDerivedMetric(definition, value, waiverMap));
  }

  if (p3EvalEntries.length > 0) {
    applyP3DeathEvaluations(evaluations, p3EvalEntries, reports, waiverMap);
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
    p3EvalSampleCount: p3EvalEntries.length > 0 ? p3EvalEntries.length : undefined,
    p3TrustEnforced: p3EvalEntries.length > 0,
  };
}

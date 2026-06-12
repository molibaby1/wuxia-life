import type {
  P8MetricVerdict,
  P8PersonaRunMetrics,
  P8PlayabilityReport,
  P8PlayabilityRuntimePath,
  ReplayMetricPayload,
} from './types';
import { P8_METRIC_DEFINITIONS } from './metricDefinitions';

function verdict(
  key: P8MetricVerdict['key'],
  status: P8MetricVerdict['status'],
  severity: P8MetricVerdict['severity'],
  detail: string,
  evidence: unknown[] = [],
  actualValue?: number | string | null,
  threshold?: number,
): P8MetricVerdict {
  return { key, status, severity, detail, evidence, actualValue, threshold };
}

export function evaluateP8Gate(
  personaRuns: P8PersonaRunMetrics[],
  replay: ReplayMetricPayload,
): { verdicts: P8MetricVerdict[]; decision: 'pass' | 'fail' } {
  const verdicts: P8MetricVerdict[] = [];

  for (const run of personaRuns) {
    const agencyDef = P8_METRIC_DEFINITIONS.find(d => d.key === 'agency')!;
    if (run.agency.repeatedSameActionStreakMax > (agencyDef.thresholdMax ?? 4)) {
      verdicts.push(
        verdict(
          'agency',
          'fail',
          'blocker',
          `${run.personaId}: repeated same action streak ${run.agency.repeatedSameActionStreakMax}`,
          run.agency.repeatedStreakExamples,
          run.agency.repeatedSameActionStreakMax,
          agencyDef.thresholdMax,
        ),
      );
    } else {
      verdicts.push(
        verdict(
          'agency',
          'pass',
          'blocker',
          `${run.personaId}: max streak ${run.agency.repeatedSameActionStreakMax}`,
          [],
          run.agency.repeatedSameActionStreakMax,
        ),
      );
    }

    const causalityDef = P8_METRIC_DEFINITIONS.find(d => d.key === 'causality')!;
    if (run.causality.directEchoCount < (causalityDef.thresholdMin ?? 3)) {
      verdicts.push(
        verdict(
          'causality',
          'warning',
          'warning',
          `${run.personaId}: direct echoes ${run.causality.directEchoCount}`,
          run.causality.strongestExamples,
          run.causality.directEchoCount,
          causalityDef.thresholdMin,
        ),
      );
    } else {
      verdicts.push(
        verdict('causality', 'pass', 'warning', `${run.personaId}: direct echoes ${run.causality.directEchoCount}`),
      );
    }

    const pacingDef = P8_METRIC_DEFINITIONS.find(d => d.key === 'pacing')!;
    if (run.pacing.longestLowImpactSpanYears > (pacingDef.thresholdMax ?? 8)) {
      verdicts.push(
        verdict(
          'pacing',
          'fail',
          'blocker',
          `${run.personaId}: low-impact span ${run.pacing.longestLowImpactSpanYears}y`,
          [{ start: run.pacing.lowImpactSpanStartAge, end: run.pacing.lowImpactSpanEndAge }],
          run.pacing.longestLowImpactSpanYears,
          pacingDef.thresholdMax,
        ),
      );
    } else if (run.pacing.longestLowImpactSpanYears > 5) {
      verdicts.push(
        verdict(
          'pacing',
          'warning',
          'warning',
          `${run.personaId}: low-impact span ${run.pacing.longestLowImpactSpanYears}y`,
        ),
      );
    } else {
      verdicts.push(verdict('pacing', 'pass', 'blocker', `${run.personaId}: pacing ok`));
    }

    const frustrationDef = P8_METRIC_DEFINITIONS.find(d => d.key === 'frustration')!;
    if (run.frustration.opaqueRatio > (frustrationDef.thresholdMax ?? 0.35)) {
      verdicts.push(
        verdict(
          'frustration',
          'fail',
          'blocker',
          `${run.personaId}: opaque ratio ${run.frustration.opaqueRatio.toFixed(2)}`,
          run.frustration.opaqueExamples,
          run.frustration.opaqueRatio,
          frustrationDef.thresholdMax,
        ),
      );
    } else {
      verdicts.push(
        verdict('frustration', 'pass', 'blocker', `${run.personaId}: opaque ratio ${run.frustration.opaqueRatio.toFixed(2)}`),
      );
    }

    const narrativeDef = P8_METRIC_DEFINITIONS.find(d => d.key === 'narrative_memory')!;
    if (
      run.narrativeMemory.evidenceCitations.length < (narrativeDef.thresholdMin ?? 3) ||
      run.narrativeMemory.missingTurningPoint ||
      run.narrativeMemory.missingIdentity
    ) {
      verdicts.push(
        verdict(
          'narrative_memory',
          'warning',
          'warning',
          `${run.personaId}: narrative gaps (citations=${run.narrativeMemory.evidenceCitations.length})`,
          run.narrativeMemory.evidenceCitations,
        ),
      );
    } else {
      verdicts.push(verdict('narrative_memory', 'pass', 'warning', `${run.personaId}: narrative ok`));
    }
  }

  const achievementDef = P8_METRIC_DEFINITIONS.find(d => d.key === 'achievement')!;
  const zeroAchieved = personaRuns.filter(r => r.achievement.achievedCount === 0).length;
  const zeroRatio = personaRuns.length > 0 ? zeroAchieved / personaRuns.length : 0;
  if (zeroRatio > (achievementDef.thresholdMax ?? 0.6)) {
    verdicts.push(
      verdict(
        'achievement',
        'warning',
        'warning',
        `${zeroAchieved}/${personaRuns.length} personas with zero achieved goals`,
        personaRuns.map(r => ({ id: r.personaId, achieved: r.achievement.achievedCount })),
        zeroRatio,
        achievementDef.thresholdMax,
      ),
    );
  } else {
    verdicts.push(verdict('achievement', 'pass', 'warning', `goal achievement spread ok (${zeroRatio.toFixed(2)} zero)`));
  }

  const replayDef = P8_METRIC_DEFINITIONS.find(d => d.key === 'replayability')!;
  if (replay.nearDuplicateWarnings.length > 0) {
    verdicts.push(
      verdict(
        'replayability',
        'warning',
        'warning',
        `${replay.nearDuplicateWarnings.length} near-duplicate pairs`,
        replay.nearDuplicateWarnings,
      ),
    );
  } else {
    verdicts.push(verdict('replayability', 'pass', 'warning', 'persona outputs sufficiently distinct'));
  }

  const blockingFailures = verdicts.filter(v => v.status === 'fail' && v.severity === 'blocker');
  const decision = blockingFailures.length > 0 ? 'fail' : 'pass';
  return { verdicts, decision };
}

export interface AssemblePlayabilityReportOptions {
  runtimePath?: P8PlayabilityRuntimePath;
  catalogVersion?: string;
  engineVersion?: string;
}

export function assemblePlayabilityReport(
  personaRuns: P8PersonaRunMetrics[],
  replay: ReplayMetricPayload,
  endAge: number,
  options: AssemblePlayabilityReportOptions = {},
): P8PlayabilityReport {
  const { verdicts, decision } = evaluateP8Gate(personaRuns, replay);
  const generatedAt = new Date().toISOString();
  return {
    schemaVersion: 'p8-v1',
    generatedAt,
    runtimePath: options.runtimePath,
    catalogVersion: options.catalogVersion,
    engineVersion: options.engineVersion,
    decision,
    endAge,
    personaRuns,
    replay,
    verdicts,
    blockingFailures: verdicts.filter(v => v.status === 'fail' && v.severity === 'blocker'),
    warnings: verdicts.filter(v => v.status === 'warning'),
  };
}

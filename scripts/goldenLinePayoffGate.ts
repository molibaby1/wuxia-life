import goldenLinePayoffMap from '../src/data/golden-line-payoff-map.json';
import type { GoldenLineSimulationRun, GoldenLineReplayRecord } from './goldenLineSimulation';

export type PayoffGateFinding = {
  gate: 'payoff';
  severity: 'blocker' | 'warning' | 'info';
  status: 'pass' | 'fail' | 'warning';
  sampleId?: string;
  detail: string;
  age?: number;
  eventId?: string;
  choiceId?: string;
  expectedPayoffEventIds?: string[];
  blockReason?: PayoffBlockReason;
  findingType?: PayoffFindingType;
  segment?: PayoffSegment;
  gapId?: string;
};

export const PAYOFF_RATE_THRESHOLD = goldenLinePayoffMap.summary.threshold;

export type PayoffSegment = '0-30' | '31-50' | 'full';

export type PayoffBlockReason =
  | 'static_data_mismatch'
  | 'condition_unmet'
  | 'priority_ordering'
  | 'age_window_miss'
  | 'route_fixture_skip'
  | 'simulation_strategy'
  | 'timing_exceeded'
  | 'unknown';

export type PayoffFindingType =
  | 'simulated_gap'
  | 'qualified_gap'
  | 'timing_exceeded'
  | 'never_reached'
  | 'fixture_excluded'
  | 'segment_fail';

type PayoffEntry = (typeof goldenLinePayoffMap.entries)[number];

export type MissedPayoffOpportunity = {
  findingType: PayoffFindingType;
  sampleId: string;
  segment: PayoffSegment;
  keyChoiceEventId: string;
  choiceId: string;
  keyChoiceAge: number;
  expectedPayoffEventIds: string[];
  expectedPayoffTypes: string[];
  firstPayoffMaxAge: number;
  recommendedPayoffMaxAge: number;
  actualFirstPayoffAge: number | null;
  ageDistance: number | null;
  blockReason: PayoffBlockReason;
  blockReasonDetail: string;
  durableWrites: string[];
  readMechanismDeclared: string;
  readMechanismVerified: boolean;
  gapId?: string;
};

export type PayoffSampleSegmentMetrics = {
  keyChoicesMade: number;
  simulatedHits: number;
  simulatedPayoffRate: number;
};

export type PayoffSampleSummary = {
  id: string;
  segment: PayoffSegment;
  keyChoicesMade: number;
  simulatedHits: number;
  simulatedPayoffRate: number;
  segmentYouth: PayoffSampleSegmentMetrics;
  segmentMidlife: PayoffSampleSegmentMetrics;
  missedOpportunityIds: string[];
  pass: boolean;
};

export type PayoffOpportunitySummary = {
  evalCohort: 'P3-EVAL';
  staticPayoffRate: number;
  simulatedPayoffThreshold: number;
  samples: PayoffSampleSummary[];
  missedOpportunityCount: number;
  neverReachedKeyChoiceCount: number;
  topBlockReasons: PayoffBlockReason[];
  timingExceededCount: number;
};

export type PayoffGateEvaluation = {
  summary: PayoffOpportunitySummary;
  missedOpportunities: MissedPayoffOpportunity[];
  neverReached: Array<{
    keyChoiceEventId: string;
    expectedPayoffEventIds: string[];
    blockReason: PayoffBlockReason;
    blockReasonDetail: string;
  }>;
  findings: PayoffGateFinding[];
};

const PRIORITY_ROUTE_SAMPLE_IDS = new Set([
  'golden-sect',
  'golden-wanderer',
  'golden-demonic',
]);

/** PR-02: routeTrack fixture pre-writes route before key choice events fire. */
const ROUTE_FIXTURE_SKIPPED_KEY_CHOICES: Record<string, string[]> = {
  demonic: ['demonic_encounter'],
};

const GAP_ID_BY_KEY_CHOICE: Partial<Record<string, string>> = {
  martial_arts_enlightenment: 'G1',
};

function segmentForAge(age: number): '0-30' | '31-50' {
  return age <= 30 ? '0-30' : '31-50';
}

function getRecommendedMaxAgeDistance(keyChoiceAge: number): number {
  if (keyChoiceAge <= 10) {
    return 3;
  }
  if (keyChoiceAge <= 17) {
    return 5;
  }
  if (keyChoiceAge <= 30) {
    return 8;
  }
  return 10;
}

function getHardCapAgeDistance(keyChoiceAge: number): number {
  if (keyChoiceAge <= 10) {
    return 5;
  }
  if (keyChoiceAge <= 17) {
    return 8;
  }
  if (keyChoiceAge <= 30) {
    return 12;
  }
  return 15;
}

function firstPayoffMaxAge(keyChoiceAge: number): number {
  return keyChoiceAge + getHardCapAgeDistance(keyChoiceAge);
}

function recommendedPayoffMaxAge(keyChoiceAge: number): number {
  return keyChoiceAge + getRecommendedMaxAgeDistance(keyChoiceAge);
}

/** Declining demonic_encounter is a valid payoff: the demonic chain is intentionally not entered. */
function isDeclineDemonicPayoffSatisfied(record: GoldenLineReplayRecord): boolean {
  return record.eventId === 'demonic_encounter' && record.choiceId === 'decline_demonic';
}

function isPayoffHit(
  entry: PayoffEntry,
  eventIdsSeen: Set<string>,
  maxAge?: number,
): { hit: boolean; firstPayoffAge: number | null } {
  let firstPayoffAge: number | null = null;
  for (const payoff of entry.payoffs) {
    if (!eventIdsSeen.has(payoff.eventId)) {
      continue;
    }
    const payoffAge = payoff.ageRange[0];
    if (maxAge !== undefined && payoffAge > maxAge) {
      continue;
    }
    if (firstPayoffAge === null || payoffAge < firstPayoffAge) {
      firstPayoffAge = payoffAge;
    }
  }
  return { hit: firstPayoffAge !== null, firstPayoffAge };
}

function isFixtureExcluded(run: GoldenLineSimulationRun, keyChoiceEventId: string): boolean {
  const track = run.sample.routeTrack;
  if (!track) {
    return false;
  }
  const skipped = ROUTE_FIXTURE_SKIPPED_KEY_CHOICES[track];
  if (!skipped?.includes(keyChoiceEventId)) {
    return false;
  }
  const occurred = run.replay.some(
    record => record.eventId === keyChoiceEventId && record.choiceId,
  );
  return !occurred;
}

function resolveGapId(
  keyChoiceEventId: string,
  sampleId: string,
): string | undefined {
  const base = GAP_ID_BY_KEY_CHOICE[keyChoiceEventId];
  if (base) {
    return base;
  }
  if (keyChoiceEventId === 'orthodox_trial_entry' && sampleId === 'golden-neutral-baseline') {
    return 'G4';
  }
  return undefined;
}

function inferBlockReason(
  entry: PayoffEntry,
  record: GoldenLineReplayRecord,
  run: GoldenLineSimulationRun,
  hit: boolean,
  firstPayoffAge: number | null,
): { reason: PayoffBlockReason; detail: string; verified: boolean } {
  const keyChoiceId = entry.keyChoiceEventId;
  const track = run.sample.routeTrack;

  if (isFixtureExcluded(run, keyChoiceId)) {
    return {
      reason: 'route_fixture_skip',
      detail: `routeTrack fixture pre-synced route before ${keyChoiceId} could fire`,
      verified: false,
    };
  }

  if (keyChoiceId === 'martial_arts_enlightenment') {
    return {
      reason: 'static_data_mismatch',
      detail:
        'declared focus flags are not read by martial_improvement or sect_trial payoff conditions',
      verified: false,
    };
  }

  if (keyChoiceId === 'orthodox_trial_entry') {
    return {
      reason: 'priority_ordering',
      detail: 'the Mingyue character entry and trial chain compete for an early payoff slot',
      verified: true,
    };
  }

  if (keyChoiceId === 'demonic_encounter' && track === 'demonic') {
    return {
      reason: 'route_fixture_skip',
      detail: 'demonic fixture synced route_demonic without demonic_encounter key choice',
      verified: false,
    };
  }

  if (!hit && firstPayoffAge === null) {
    const gap = run.replay[run.replay.length - 1]?.age ?? record.age;
    if (gap > firstPayoffMaxAge(record.age)) {
      return {
        reason: 'timing_exceeded',
        detail: `no payoff event before hard cap age ${firstPayoffMaxAge(record.age)}`,
        verified: true,
      };
    }
  }

  if (hit && firstPayoffAge !== null && firstPayoffAge - record.age > getHardCapAgeDistance(record.age)) {
    return {
      reason: 'timing_exceeded',
      detail: `first payoff at age ${firstPayoffAge} exceeds hard cap distance`,
      verified: true,
    };
  }

  return {
    reason: 'unknown',
    detail: 'no classified block reason; see expected payoff events',
    verified: true,
  };
}

function inferNeverReachedReason(keyChoiceEventId: string): {
  reason: PayoffBlockReason;
  detail: string;
} {
  if (keyChoiceEventId === 'demonic_encounter') {
    return {
      reason: 'route_fixture_skip',
      detail: 'demonic track fixture may skip demonic_encounter entirely',
    };
  }
  if (keyChoiceEventId === 'hero_first_case') {
    return {
      reason: 'condition_unmet',
      detail: 'hero identity and faction gates not satisfied in P3-EVAL replays',
    };
  }
  if (keyChoiceEventId === 'sect_trial_final') {
    return {
      reason: 'route_fixture_skip',
      detail: 'sect fixture may sync sect_trial_completed without sect_trial_final event',
    };
  }
  return {
    reason: 'condition_unmet',
    detail: 'prerequisite chain not completed in deterministic replay',
  };
}

/** Causal-gap inventory is a triage signal; payoff thresholds do not block the gate. */
function severityForSimulatedGap(_sampleId: string): 'warning' {
  return 'warning';
}

function buildKeyChoiceRecords(
  run: GoldenLineSimulationRun,
  payoffByKeyChoice: Map<string, PayoffEntry>,
): GoldenLineReplayRecord[] {
  return run.replay.filter(
    record => record.choiceId && payoffByKeyChoice.has(record.eventId),
  );
}

function computeSegmentMetrics(
  records: GoldenLineReplayRecord[],
  payoffByKeyChoice: Map<string, PayoffEntry>,
  eventIdsSeen: Set<string>,
  segment: '0-30' | '31-50',
): PayoffSampleSegmentMetrics {
  const filtered = records.filter(record => segmentForAge(record.age) === segment);
  let hits = 0;
  for (const record of filtered) {
    const entry = payoffByKeyChoice.get(record.eventId);
    if (!entry) {
      continue;
    }
    const hasHit = isDeclineDemonicPayoffSatisfied(record)
      ? true
      : segment === '31-50'
        ? entry.payoffs.some(
            payoff => payoff.ageRange[0] >= 31 && eventIdsSeen.has(payoff.eventId),
          )
        : entry.payoffs.some(
            payoff => payoff.ageRange[0] <= 30 && eventIdsSeen.has(payoff.eventId),
          );
    if (hasHit) {
      hits += 1;
    }
  }
  const keyChoicesMade = filtered.length;
  return {
    keyChoicesMade,
    simulatedHits: hits,
    simulatedPayoffRate: keyChoicesMade === 0 ? 1 : hits / keyChoicesMade,
  };
}

export function evaluatePayoffGate(runs: GoldenLineSimulationRun[]): PayoffGateEvaluation {
  const payoffByKeyChoice = new Map<string, PayoffEntry>(
    goldenLinePayoffMap.entries.map(entry => [entry.keyChoiceEventId, entry]),
  );
  const staticPayoffRate = goldenLinePayoffMap.summary.payoffRate;
  const findings: PayoffGateFinding[] = [];
  const missedOpportunities: MissedPayoffOpportunity[] = [];
  const neverReached: PayoffGateEvaluation['neverReached'] = [];
  const sampleSummaries: PayoffSampleSummary[] = [];
  const blockReasonCounts = new Map<PayoffBlockReason, number>();
  let timingExceededCount = 0;

  findings.push({
    gate: 'payoff',
    severity: 'info',
    status: staticPayoffRate < PAYOFF_RATE_THRESHOLD ? 'warning' : 'pass',
    detail: `Static key-choice payoff map coverage ${(staticPayoffRate * 100).toFixed(1)}% (threshold ${PAYOFF_RATE_THRESHOLD * 100}%; causal-gap signal only)`,
  });

  const allKeyChoiceIds = new Set(payoffByKeyChoice.keys());
  const reachedInCohort = new Set<string>();
  for (const run of runs) {
    for (const record of run.replay) {
      if (!record.choiceId) {
        continue;
      }
      const entry = payoffByKeyChoice.get(record.eventId);
      if (!entry) {
        continue;
      }
      if (entry.choiceIds.length > 0 && !entry.choiceIds.includes(record.choiceId)) {
        continue;
      }
      reachedInCohort.add(record.eventId);
    }
  }
  for (const keyChoiceEventId of allKeyChoiceIds) {
    if (reachedInCohort.has(keyChoiceEventId)) {
      continue;
    }
    const entry = payoffByKeyChoice.get(keyChoiceEventId);
    if (!entry) {
      continue;
    }
    const { reason, detail } = inferNeverReachedReason(keyChoiceEventId);
    neverReached.push({
      keyChoiceEventId,
      expectedPayoffEventIds: entry.payoffs.map(payoff => payoff.eventId),
      blockReason: reason,
      blockReasonDetail: detail,
    });
    findings.push({
      gate: 'payoff',
      severity: 'info',
      status: 'warning',
      eventId: keyChoiceEventId,
      detail: `Never-reached key choice (cohort): ${keyChoiceEventId}; expected=${entry.payoffs.map(p => p.eventId).join(', ')}; blockReason=${reason} (${detail})`,
    });
  }

  for (const run of runs) {
    const sampleId = run.sample.id;
    const eventIdsSeen = new Set(run.replay.map(record => record.eventId));
    const keyChoiceRecords = buildKeyChoiceRecords(run, payoffByKeyChoice);

    let simulatedHits = 0;
    let denominator = 0;
    const missedIds: string[] = [];

    for (const record of keyChoiceRecords) {
      const entry = payoffByKeyChoice.get(record.eventId);
      if (!entry) {
        continue;
      }

      if (isFixtureExcluded(run, record.eventId)) {
        const gapId = resolveGapId(record.eventId, sampleId);
        missedOpportunities.push({
          findingType: 'fixture_excluded',
          sampleId,
          segment: segmentForAge(record.age),
          keyChoiceEventId: record.eventId,
          choiceId: record.choiceId ?? '',
          keyChoiceAge: record.age,
          expectedPayoffEventIds: entry.payoffs.map(payoff => payoff.eventId),
          expectedPayoffTypes: entry.payoffs.map(payoff => payoff.payoffType),
          firstPayoffMaxAge: firstPayoffMaxAge(record.age),
          recommendedPayoffMaxAge: recommendedPayoffMaxAge(record.age),
          actualFirstPayoffAge: null,
          ageDistance: null,
          blockReason: 'route_fixture_skip',
          blockReasonDetail: 'excluded from simulated denominator (PR-02 route fixture)',
          durableWrites: entry.durableWrites,
          readMechanismDeclared: entry.payoffs[0]?.readMechanism ?? '',
          readMechanismVerified: false,
          gapId,
        });
        findings.push({
          gate: 'payoff',
          severity: 'info',
          status: 'warning',
          sampleId,
          eventId: record.eventId,
          choiceId: record.choiceId,
          detail: `fixture_excluded: ${record.eventId} not in denominator; expected=${entry.payoffs.map(p => p.eventId).join(', ')}`,
        });
        continue;
      }

      denominator += 1;
      if (isDeclineDemonicPayoffSatisfied(record)) {
        simulatedHits += 1;
        continue;
      }
      const { hit, firstPayoffAge } = isPayoffHit(entry, eventIdsSeen);
      if (hit) {
        simulatedHits += 1;
        if (
          firstPayoffAge !== null &&
          firstPayoffAge - record.age > getHardCapAgeDistance(record.age)
        ) {
          timingExceededCount += 1;
          const gapId = resolveGapId(record.eventId, sampleId);
          missedOpportunities.push({
            findingType: 'timing_exceeded',
            sampleId,
            segment: segmentForAge(record.age),
            keyChoiceEventId: record.eventId,
            choiceId: record.choiceId ?? '',
            keyChoiceAge: record.age,
            expectedPayoffEventIds: entry.payoffs.map(payoff => payoff.eventId),
            expectedPayoffTypes: entry.payoffs.map(payoff => payoff.payoffType),
            firstPayoffMaxAge: firstPayoffMaxAge(record.age),
            recommendedPayoffMaxAge: recommendedPayoffMaxAge(record.age),
            actualFirstPayoffAge: firstPayoffAge,
            ageDistance: firstPayoffAge - record.age,
            blockReason: 'timing_exceeded',
            blockReasonDetail: `first payoff at age ${firstPayoffAge} exceeds hard cap`,
            durableWrites: entry.durableWrites,
            readMechanismDeclared: entry.payoffs[0]?.readMechanism ?? '',
            readMechanismVerified: true,
            gapId,
          });
        }
        continue;
      }

      const { reason, detail, verified } = inferBlockReason(
        entry,
        record,
        run,
        hit,
        firstPayoffAge,
      );
      blockReasonCounts.set(reason, (blockReasonCounts.get(reason) ?? 0) + 1);
      const gapId = resolveGapId(record.eventId, sampleId);
      if (gapId) {
        missedIds.push(gapId);
      }

      missedOpportunities.push({
        findingType: 'simulated_gap',
        sampleId,
        segment: segmentForAge(record.age),
        keyChoiceEventId: record.eventId,
        choiceId: record.choiceId ?? '',
        keyChoiceAge: record.age,
        expectedPayoffEventIds: entry.payoffs.map(payoff => payoff.eventId),
        expectedPayoffTypes: entry.payoffs.map(payoff => payoff.payoffType),
        firstPayoffMaxAge: firstPayoffMaxAge(record.age),
        recommendedPayoffMaxAge: recommendedPayoffMaxAge(record.age),
        actualFirstPayoffAge: null,
        ageDistance: null,
        blockReason: reason,
        blockReasonDetail: detail,
        durableWrites: entry.durableWrites,
        readMechanismDeclared: entry.payoffs[0]?.readMechanism ?? '',
        readMechanismVerified: verified,
        gapId,
      });

      const severity = severityForSimulatedGap(sampleId);
      findings.push({
        gate: 'payoff',
        severity,
        status: severity === 'blocker' ? 'fail' : 'warning',
        sampleId,
        eventId: record.eventId,
        choiceId: record.choiceId,
        expectedPayoffEventIds: entry.payoffs.map(payoff => payoff.eventId),
        blockReason: reason,
        findingType: 'simulated_gap',
        segment: segmentForAge(record.age),
        gapId,
        detail: `simulated_gap: choice=${record.choiceId} expected=${entry.payoffs.map(p => p.eventId).join('|')} blockReason=${reason} (${detail})`,
      });
    }

    const simulatedPayoffRate = denominator === 0 ? 1 : simulatedHits / denominator;
    const segmentYouth = computeSegmentMetrics(
      keyChoiceRecords,
      payoffByKeyChoice,
      eventIdsSeen,
      '0-30',
    );
    const segmentMidlife = computeSegmentMetrics(
      keyChoiceRecords,
      payoffByKeyChoice,
      eventIdsSeen,
      '31-50',
    );

    const samplePass = simulatedPayoffRate >= PAYOFF_RATE_THRESHOLD;
    if (!samplePass) {
      const severity = severityForSimulatedGap(sampleId);
      findings.push({
        gate: 'payoff',
        severity,
        status: severity === 'blocker' ? 'fail' : 'warning',
        sampleId,
        detail: `Simulated payoff ${(simulatedPayoffRate * 100).toFixed(1)}% < ${PAYOFF_RATE_THRESHOLD * 100}% (${simulatedHits}/${denominator}); static map=${(staticPayoffRate * 100).toFixed(1)}%; causal-gap signal only`,
      });
    }

    for (const segmentLabel of ['0-30', '31-50'] as const) {
      const segmentMetrics = segmentLabel === '0-30' ? segmentYouth : segmentMidlife;
      if (
        segmentMetrics.keyChoicesMade > 0 &&
        segmentMetrics.simulatedPayoffRate < PAYOFF_RATE_THRESHOLD &&
        PRIORITY_ROUTE_SAMPLE_IDS.has(sampleId)
      ) {
        findings.push({
          gate: 'payoff',
          severity: 'warning',
          status: 'warning',
          sampleId,
          findingType: 'segment_fail',
          segment: segmentLabel,
          detail: `segment_fail ${segmentLabel}: simulated ${(segmentMetrics.simulatedPayoffRate * 100).toFixed(1)}% < ${PAYOFF_RATE_THRESHOLD * 100}%; causal-gap signal only`,
        });
      }
    }

    if (samplePass) {
      findings.push({
        gate: 'payoff',
        severity: 'info',
        status: 'pass',
        sampleId,
        detail: `Simulated payoff OK: ${(simulatedPayoffRate * 100).toFixed(1)}% (${simulatedHits}/${denominator}); static=${(staticPayoffRate * 100).toFixed(1)}%`,
      });
    }

    sampleSummaries.push({
      id: sampleId,
      segment: 'full',
      keyChoicesMade: denominator,
      simulatedHits,
      simulatedPayoffRate,
      segmentYouth,
      segmentMidlife,
      missedOpportunityIds: [...new Set(missedIds)],
      pass: samplePass,
    });
  }

  const topBlockReasons = [...blockReasonCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([reason]) => reason);

  const summary: PayoffOpportunitySummary = {
    evalCohort: 'P3-EVAL',
    staticPayoffRate,
    simulatedPayoffThreshold: PAYOFF_RATE_THRESHOLD,
    samples: sampleSummaries,
    missedOpportunityCount: missedOpportunities.filter(
      opportunity => opportunity.findingType === 'simulated_gap',
    ).length,
    neverReachedKeyChoiceCount: neverReached.length,
    topBlockReasons,
    timingExceededCount,
  };

  return {
    summary,
    missedOpportunities,
    neverReached,
    findings,
  };
}

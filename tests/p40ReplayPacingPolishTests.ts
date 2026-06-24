/**
 * P40 replay pacing polish regression — deviant-ye span ≤5y, near-duplicate ≤3.
 */

import { getP8GatePersonas, getP8PersonaById } from '../src/p8/personas';
import { runHeadlessPersona } from '../src/headless/playability/headlessPersonaRunner';
import { adaptHeadlessRunToGameProcessReport } from '../src/headless/playability/adaptToGameProcessReport';
import { P8_GATE_END_AGE } from '../src/p8/metricDefinitions';
import {
  collectReplayMetrics,
  buildPersonaRunMetrics,
} from '../src/p8/collectPersonaMetrics';
import { evaluateP8Gate } from '../src/p8/playabilityGate';
import type { HeadlessPersonaRunResult } from '../src/headless/playability/types';

const CATALOG_VERSION = '1.0.0';
const NEAR_DUPLICATE_THRESHOLD = 0.82;
const MAX_NEAR_DUPLICATE_PAIRS = 3;
const MAX_DEVIANT_LOW_IMPACT_SPAN = 5;
const MAX_FRUSTRATION_OPAQUE_RATIO = 0.35;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function runPersonaBundle(personaId: string) {
  const persona = getP8PersonaById(personaId);
  assert(Boolean(persona), `missing persona ${personaId}`);
  const result: HeadlessPersonaRunResult = await runHeadlessPersona({
    persona: persona!,
    endAge: P8_GATE_END_AGE,
    catalogVersion: CATALOG_VERSION,
  });
  const report = adaptHeadlessRunToGameProcessReport(
    { persona: persona!, endAge: P8_GATE_END_AGE, catalogVersion: CATALOG_VERSION },
    result,
  );
  const metrics = buildPersonaRunMetrics(
    persona!,
    report,
    result.choiceDiagnostics,
    result.activeActionSelectionReasons,
  );
  return { persona: persona!, report, metrics };
}

async function testDeviantYePacingSpan(): Promise<void> {
  const { metrics } = await runPersonaBundle('p8-deviant-ye');
  assert(
    metrics.pacing.longestLowImpactSpanYears <= MAX_DEVIANT_LOW_IMPACT_SPAN,
    `p8-deviant-ye low-impact span ${metrics.pacing.longestLowImpactSpanYears}y exceeds ${MAX_DEVIANT_LOW_IMPACT_SPAN}y`,
  );
}

async function testNearDuplicatePairCount(): Promise<void> {
  const runs = [];
  for (const persona of getP8GatePersonas()) {
    const { report } = await runPersonaBundle(persona.id);
    runs.push({ personaId: persona.id, report });
  }
  const replay = collectReplayMetrics(runs);
  const highPairs = replay.pairwiseSimilarities.filter(p => p.score >= NEAR_DUPLICATE_THRESHOLD);
  assert(
    highPairs.length <= MAX_NEAR_DUPLICATE_PAIRS,
    `near-duplicate pairs ${highPairs.length} exceed ${MAX_NEAR_DUPLICATE_PAIRS}: ${replay.nearDuplicateWarnings.join('; ')}`,
  );
}

async function testFrustrationNoRegression(): Promise<void> {
  for (const persona of getP8GatePersonas()) {
    const { metrics } = await runPersonaBundle(persona.id);
    assert(
      metrics.frustration.opaqueRatio <= MAX_FRUSTRATION_OPAQUE_RATIO,
      `${persona.id} opaque ratio ${metrics.frustration.opaqueRatio} exceeds ${MAX_FRUSTRATION_OPAQUE_RATIO}`,
    );
  }
}

async function testGateDecisionPass(): Promise<void> {
  const metricsList = [];
  const runs = [];
  for (const persona of getP8GatePersonas()) {
    const { report, metrics } = await runPersonaBundle(persona.id);
    metricsList.push(metrics);
    runs.push({ personaId: persona.id, report });
  }
  const replay = collectReplayMetrics(runs);
  const evaluation = evaluateP8Gate(metricsList, replay);
  assert(evaluation.decision === 'pass', `gate decision ${evaluation.decision} expected pass`);
}

async function main(): Promise<void> {
  await testDeviantYePacingSpan();
  await testNearDuplicatePairCount();
  await testFrustrationNoRegression();
  await testGateDecisionPass();
  console.log('p40ReplayPacingPolishTests: all passed');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

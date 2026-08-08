/**
 * P40 replay pacing polish regression — deviant-ye span ≤5y and frustration ≤0.35.
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
const MAX_DEVIANT_LOW_IMPACT_SPAN = 5;
const MAX_FRUSTRATION_OPAQUE_RATIO = 0.35;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

type PersonaBundle = {
  persona: NonNullable<ReturnType<typeof getP8PersonaById>>;
  report: ReturnType<typeof adaptHeadlessRunToGameProcessReport>;
  metrics: ReturnType<typeof buildPersonaRunMetrics>;
};

async function runPersonaBundle(personaId: string): Promise<PersonaBundle> {
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

// ponytail: one headless pass per persona; all assertions share this bundle (was 25 runs).
async function runAllPersonaBundles(): Promise<Map<string, PersonaBundle>> {
  const bundles = new Map<string, PersonaBundle>();
  for (const persona of getP8GatePersonas()) {
    bundles.set(persona.id, await runPersonaBundle(persona.id));
  }
  return bundles;
}

function assertDeviantYePacingSpan(bundles: Map<string, PersonaBundle>): void {
  const deviant = bundles.get('p8-deviant-ye');
  assert(Boolean(deviant), 'missing p8-deviant-ye bundle');
  assert(
    deviant!.metrics.pacing.longestLowImpactSpanYears <= MAX_DEVIANT_LOW_IMPACT_SPAN,
    `p8-deviant-ye low-impact span ${deviant!.metrics.pacing.longestLowImpactSpanYears}y exceeds ${MAX_DEVIANT_LOW_IMPACT_SPAN}y`,
  );
}

function assertFrustrationNoRegression(bundles: Map<string, PersonaBundle>): void {
  for (const [personaId, bundle] of bundles) {
    assert(
      bundle.metrics.frustration.opaqueRatio <= MAX_FRUSTRATION_OPAQUE_RATIO,
      `${personaId} opaque ratio ${bundle.metrics.frustration.opaqueRatio} exceeds ${MAX_FRUSTRATION_OPAQUE_RATIO}`,
    );
  }
}

function assertGateDecisionPass(
  metricsList: ReturnType<typeof buildPersonaRunMetrics>[],
  replay: ReturnType<typeof collectReplayMetrics>,
): void {
  const evaluation = evaluateP8Gate(metricsList, replay);
  assert(evaluation.decision === 'pass', `gate decision ${evaluation.decision} expected pass`);
}

async function main(): Promise<void> {
  const bundles = await runAllPersonaBundles();
  const runs = [...bundles.entries()].map(([personaId, bundle]) => ({
    personaId,
    report: bundle.report,
  }));
  const replay = collectReplayMetrics(runs);
  const metricsList = [...bundles.values()].map(bundle => bundle.metrics);

  assertDeviantYePacingSpan(bundles);
  assertFrustrationNoRegression(bundles);
  assertGateDecisionPass(metricsList, replay);
  console.log('p40ReplayPacingPolishTests: all passed');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

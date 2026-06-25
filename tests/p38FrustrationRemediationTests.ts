/**
 * P38 frustration remediation regression — isolated entry.
 * Runs independently: npm exec tsx tests/p38FrustrationRemediationTests.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { EventLoader } from '../src/core/EventLoader';
import { collectFrustrationMetrics } from '../src/p8/collectPersonaMetrics';
import type { GameProcessRecord } from '../src/types/simulationRecordTypes';

const BLOCKER_PERSONAS = [
  'p8-martial-lin',
  'p8-social-gu',
  'p8-wealth-shen',
  'p8-cautious-han',
  'p8-deviant-ye',
  'p8-balanced-wei',
] as const;

const PASSING_PERSONAS = ['p8-scholar-su', 'p8-explorer-lu'] as const;

const FIXED_EVENT_IDS = [
  'setback_injury',
  'setback_property_loss',
  'love_secret_help',
  'setback_cultivation_deviation',
] as const;

function fixedEventText(eventId: (typeof FIXED_EVENT_IDS)[number]): string {
  const text = EventLoader.getInstance().getEventById(eventId)?.content?.text;
  if (!text) throw new Error(`missing narrative text for ${eventId}`);
  return text;
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function record(eventId: string, text: string): GameProcessRecord {
  return { age: 20, eventId, outcomeText: text, eventTitle: eventId } as GameProcessRecord;
}

function testFixedSetbackClassifications(): void {
  for (const eventId of FIXED_EVENT_IDS) {
    assert(fixedEventText(eventId).length > 0, `${eventId} narrative loaded from EventLoader`);
  }

  const injury = collectFrustrationMetrics([record('setback_injury', fixedEventText('setback_injury'))]);
  assert(injury.opaqueRatio === 0, 'setback_injury should not be opaque');
  assert(injury.setbacks[0]?.classification === 'explained', 'setback_injury should be explained');

  const property = collectFrustrationMetrics([
    record('setback_property_loss', fixedEventText('setback_property_loss')),
  ]);
  assert(property.opaqueRatio === 0, 'setback_property_loss should not be opaque');
  assert(property.setbacks[0]?.classification === 'explained', 'setback_property_loss should be explained');

  const love = collectFrustrationMetrics([record('love_secret_help', fixedEventText('love_secret_help'))]);
  assert(love.setbacks.length === 0, 'love_secret_help should not register as setback');

  const cultivation = collectFrustrationMetrics([
    record('setback_cultivation_deviation', fixedEventText('setback_cultivation_deviation')),
  ]);
  assert(cultivation.setbacks.length === 0, 'setback_cultivation_deviation should not register as opaque setback');
}

function testBaselineOpaqueNarrativesWereOpaque(): void {
  const legacyInjury = collectFrustrationMetrics([
    record(
      'setback_injury',
      '在一次练功中，你不慎受伤。疼痛让你意识到江湖险恶，需要更加小心谨慎。',
    ),
  ]);
  assert(legacyInjury.opaqueRatio === 1, 'legacy setback_injury narrative was opaque baseline');

  const legacyLove = collectFrustrationMetrics([
    record('love_secret_help', '你在暗处协助明月度过危机，未曾留下姓名。'),
  ]);
  assert(legacyLove.opaqueRatio === 1, 'legacy love_secret_help was opaque baseline');
}

function testBlockerPersonaThresholdFromGateReport(): void {
  const gatePath = path.join(process.cwd(), 'docs/test-reports/p8-playability-gate-latest.json');
  if (!fs.existsSync(gatePath)) {
    console.log('p38FrustrationRemediationTests: skipping gate report assert (run gate:playability first)');
    return;
  }
  const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8')) as {
    personaRuns?: Array<{ personaId: string; frustration?: { opaqueRatio: number } }>;
  };

  let belowThreshold = 0;
  for (const personaId of BLOCKER_PERSONAS) {
    const run = gate.personaRuns?.find(p => p.personaId === personaId);
    if (!run?.frustration) continue;
    if (run.frustration.opaqueRatio < 0.35) belowThreshold += 1;
  }
  assert(
    belowThreshold >= 4,
    `expected ≥4/6 blocker personas opaque ratio <0.35, got ${belowThreshold}`,
  );

  for (const personaId of PASSING_PERSONAS) {
    const run = gate.personaRuns?.find(p => p.personaId === personaId);
    if (!run?.frustration) continue;
    assert(
      run.frustration.opaqueRatio < 0.35,
      `${personaId} should not regress (opaque ratio ${run.frustration.opaqueRatio})`,
    );
  }
}

function main(): void {
  testFixedSetbackClassifications();
  testBaselineOpaqueNarrativesWereOpaque();
  testBlockerPersonaThresholdFromGateReport();
  console.log('p38FrustrationRemediationTests: all passed');
}

main();

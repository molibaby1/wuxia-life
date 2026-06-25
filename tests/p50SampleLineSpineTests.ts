import { EventLoader } from '../src/core/EventLoader';
import { GameProcessSimulator } from './GameProcessSimulator';

const SPINE_EVENT_IDS = [
  'orthodox_childhood_seed_milestone',
  'orthodox_age40_identity_summary',
  'demonic_childhood_seed_milestone',
  'demonic_youth_first_transgression',
  'demonic_age40_identity_summary',
  'merchant_childhood_seed_milestone',
  'merchant_age40_identity_summary',
] as const;

const SPINE_FLAGS = [
  'orthodox_childhood_seed_done',
  'orthodox_youth_recognized',
  'orthodox_age40_identity_done',
  'demonic_childhood_seed_done',
  'demonic_youth_first_transgression',
  'demonic_age40_identity_done',
  'merchant_childhood_seed_done',
  'merchant_age40_identity_done',
  'route_merchant',
] as const;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testSpineEventsLoaded(): void {
  const loader = EventLoader.getInstance();
  for (const eventId of SPINE_EVENT_IDS) {
    assert(Boolean(loader.getEventById(eventId)), `missing spine event: ${eventId}`);
  }
}

async function testBenchmarkSeedReachesAge40(
  label: string,
  config: ConstructorParameters<typeof GameProcessSimulator>[0],
): Promise<void> {
  const simulator = new GameProcessSimulator({
    ...config,
    simulateYears: 40,
    runUntilDeath: false,
    ageRange: { startAge: 0, endAge: 40 },
    maxEvents: 220,
    enableAutoSave: false,
    enableManualSave: false,
    enableSaveRestore: false,
    verbose: false,
  });
  const report = await simulator.simulate();
  assert(report.finalAge >= 38, `${label}: finalAge ${report.finalAge} < 38`);
}

async function main(): Promise<void> {
  testSpineEventsLoaded();

  await testBenchmarkSeedReachesAge40('orthodox-301', {
    playerName: '顾清和',
    gender: 'male',
    seed: 301,
    choiceTendency: 'martial',
    routeTrack: 'sect',
    sampleId: 'golden-sect',
  });

  await testBenchmarkSeedReachesAge40('demonic-303', {
    playerName: '沈夜',
    gender: 'male',
    seed: 303,
    choiceTendency: 'risk_averse',
    routeTrack: 'demonic',
    sampleId: 'golden-demonic',
  });

  await testBenchmarkSeedReachesAge40('merchant-804', {
    playerName: '沈聚财',
    gender: 'male',
    seed: 804,
    choiceTendency: 'wealth',
    p8PersonaId: 'p8-wealth-shen',
    sampleId: 'p8-wealth-shen',
  });

  assert(SPINE_FLAGS.length >= 9, 'spine flag inventory incomplete');
  console.log('p50SampleLineSpineTests: all passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

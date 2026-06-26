import { EventLoader } from '../src/core/EventLoader';
import type { GameProcessReport } from '../src/types/simulationRecordTypes';
import {
  deriveSampleLineAge40Identity,
  deriveSampleLineCurrentGoal,
  isPlayerVisibleSampleLineText,
} from '../src/p50/sampleLineExpression';
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
): Promise<GameProcessReport> {
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
  return report;
}

async function testMerchant804ShopChain(): Promise<void> {
  const report = await testBenchmarkSeedReachesAge40('merchant-804-shop', {
    playerName: '沈聚财',
    gender: 'male',
    seed: 804,
    choiceTendency: 'wealth',
    p8PersonaId: 'p8-wealth-shen',
    sampleId: 'p8-wealth-shen',
  });

  const shopEvent = report.records.find((record) => record.eventId === 'merchant_first_shop');
  assert(Boolean(shopEvent), 'seed 804: merchant_first_shop never fired');
  assert(
    (shopEvent?.age ?? 99) >= 16 && (shopEvent?.age ?? 0) <= 22,
    `seed 804: merchant_first_shop at age ${shopEvent?.age}, expected 16-22`,
  );

  const rec25 = [...report.records].reverse().find((record) => record.age <= 25);
  const flags = rec25?.gameState.flags ?? {};
  const hasShop =
    flags.merchant_shop_grocery || flags.merchant_shop_weapon || flags.merchant_shop_herb;
  assert(Boolean(hasShop), 'seed 804: no merchant_shop_* flag by age 25');

  const goal25 = deriveSampleLineCurrentGoal(rec25!.gameState) ?? '';
  assert(!goal25.includes('尚未开张'), `seed 804 age 25 goal still pre-shop: ${goal25}`);
  assert(
    goal25.includes('店铺') || goal25.includes('经营') || goal25.includes('周转'),
    `seed 804 age 25 goal not merchant-operating: ${goal25}`,
  );
}

async function testBenchmarkAge40Identity(
  label: string,
  config: ConstructorParameters<typeof GameProcessSimulator>[0],
  expectedFlag: string,
): Promise<void> {
  const report = await testBenchmarkSeedReachesAge40(label, config);
  const rec40 = [...report.records].reverse().find((record) => record.age <= 40);
  assert(Boolean(rec40), `${label}: missing age 40 checkpoint record`);
  const flags = rec40!.gameState.flags ?? {};
  assert(Boolean(flags[expectedFlag]), `${label}: expected ${expectedFlag} at age 40`);
  const identity = deriveSampleLineAge40Identity(rec40!.gameState);
  assert(Boolean(identity), `${label}: missing dedicated age-40 identity text`);
  assert(isPlayerVisibleSampleLineText(identity!), `${label}: raw key in age-40 identity`);
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

  await testMerchant804ShopChain();

  await testBenchmarkAge40Identity('orthodox-301-age40', {
    playerName: '顾清和',
    gender: 'male',
    seed: 301,
    choiceTendency: 'martial',
    routeTrack: 'sect',
    sampleId: 'golden-sect',
  }, 'orthodox_age40_identity_done');

  await testBenchmarkAge40Identity('demonic-303-age40', {
    playerName: '沈夜',
    gender: 'male',
    seed: 303,
    choiceTendency: 'risk_averse',
    routeTrack: 'demonic',
    sampleId: 'golden-demonic',
  }, 'demonic_age40_identity_done');

  await testBenchmarkAge40Identity('merchant-804-age40', {
    playerName: '沈聚财',
    gender: 'male',
    seed: 804,
    choiceTendency: 'wealth',
    p8PersonaId: 'p8-wealth-shen',
    sampleId: 'p8-wealth-shen',
  }, 'merchant_age40_identity_done');

  assert(SPINE_FLAGS.length >= 9, 'spine flag inventory incomplete');
  console.log('p50SampleLineSpineTests: all passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

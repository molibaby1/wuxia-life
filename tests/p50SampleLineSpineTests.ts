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
  'orthodox_age25_righteousness_cost_milestone',
  'orthodox_age32_gray_pressure_milestone',
  'orthodox_age40_identity_summary',
  'orthodox_age45_legacy_stewardship',
  'demonic_childhood_seed_milestone',
  'demonic_youth_first_transgression',
  'demonic_age40_identity_summary',
  'demonic_age45_territory_consolidation',
  'merchant_childhood_seed_milestone',
  'hvg_merchant_early_opportunity_fork',
  'hvg_merchant_post_fork_confirmation',
  'hvg_merchant_first_responsibility_challenge',
  'hvg_merchant_post_shop_operating_rhythm',
  'hvg_merchant_first_operating_pressure',
  'merchant_age40_identity_summary',
  'merchant_midlife_debt_milestone',
  'merchant_age45_expansion_fork',
  'magnate_on_ramp',
  'magnate_midlife_pressure',
  'magnate_payoff',
  'magnate_late_life',
] as const;

const SPINE_FLAGS = [
  'orthodox_childhood_seed_done',
  'orthodox_youth_recognized',
  'orthodox_righteousness_cost_visible',
  'orthodox_gray_pressure_visible',
  'orthodox_age40_identity_done',
  'orthodox_age45_payoff_done',
  'demonic_childhood_seed_done',
  'demonic_youth_first_transgression',
  'demonic_age40_identity_done',
  'demonic_age45_payoff_done',
  'merchant_childhood_seed_done',
  'merchant_midlife_debt',
  'merchant_age40_identity_done',
  'merchant_age45_payoff_done',
  'route_merchant',
  'magnate_on_ramp_done',
  'magnate_midlife_pressure_done',
  'magnate_payoff_done',
  'magnate_late_life_done',
  'magnate_late_life_identity_done',
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

async function testBenchmarkSeedReachesAge(
  label: string,
  config: ConstructorParameters<typeof GameProcessSimulator>[0],
  endAge: number,
): Promise<GameProcessReport> {
  const simulator = new GameProcessSimulator({
    ...config,
    simulateYears: endAge,
    runUntilDeath: false,
    ageRange: { startAge: 0, endAge },
    maxEvents: endAge <= 40 ? 220 : 280,
    enableAutoSave: false,
    enableManualSave: false,
    enableSaveRestore: false,
    verbose: false,
  });
  const report = await simulator.simulate();
  assert(report.finalAge >= endAge - 2, `${label}: finalAge ${report.finalAge} < ${endAge - 2}`);
  return report;
}

async function testBenchmarkSeedReachesAge40(
  label: string,
  config: ConstructorParameters<typeof GameProcessSimulator>[0],
): Promise<GameProcessReport> {
  return testBenchmarkSeedReachesAge(label, config, 40);
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

function assertAge25Goal(
  label: string,
  report: GameProcessReport,
  predicate: (goal: string) => boolean,
  forbidden: string[],
): void {
  const rec25 = [...report.records].reverse().find((record) => record.age <= 25);
  assert(Boolean(rec25), `${label}: missing age 25 checkpoint record`);
  const goal25 = deriveSampleLineCurrentGoal(rec25!.gameState) ?? '';
  assert(isPlayerVisibleSampleLineText(goal25), `${label}: raw key in age-25 goal: ${goal25}`);
  assert(predicate(goal25), `${label}: age-25 goal off-line: ${goal25}`);
  for (const fragment of forbidden) {
    assert(!goal25.includes(fragment), `${label}: forbidden fragment "${fragment}" in goal: ${goal25}`);
  }
}

async function testOrthodox301Age25Goal(): Promise<void> {
  const report = await testBenchmarkSeedReachesAge40('orthodox-301-age25', {
    playerName: '顾清和',
    gender: 'male',
    seed: 301,
    choiceTendency: 'martial',
    routeTrack: 'sect',
    sampleId: 'golden-sect',
  });
  // mandatory mainline reinjection can surface orthodox_age25_righteousness_cost_milestone first
  assertAge25Goal(
    'seed 301',
    report,
    (goal) =>
      goal.includes('行侠')
      || goal.includes('门派')
      || goal.includes('守正')
      || goal.includes('义务'),
    ['店铺', '经营', '试探底线', '力量与地盘'],
  );
}

async function testDemonic303Age25Goal(): Promise<void> {
  const report = await testBenchmarkSeedReachesAge40('demonic-303-age25', {
    playerName: '沈夜',
    gender: 'male',
    seed: 303,
    choiceTendency: 'risk_averse',
    routeTrack: 'demonic',
    sampleId: 'golden-demonic',
  });
  assertAge25Goal(
    'seed 303',
    report,
    (goal) => goal.includes('力量') || goal.includes('地盘') || goal.includes('邪') || goal.includes('诱惑'),
    ['店铺', '经营', '行侠守义'],
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

async function testBenchmarkAge45Payoff(
  label: string,
  config: ConstructorParameters<typeof GameProcessSimulator>[0],
  expectedEventId: string,
  expectedFlag: string,
): Promise<void> {
  const report = await testBenchmarkSeedReachesAge(label, config, 50);
  const payoffEvent = report.records.find((record) => record.eventId === expectedEventId);
  assert(Boolean(payoffEvent), `${label}: expected 40+ payoff event ${expectedEventId}`);
  assert(
    (payoffEvent?.age ?? 0) >= 44 && (payoffEvent?.age ?? 99) <= 48,
    `${label}: ${expectedEventId} at age ${payoffEvent?.age}, expected 44-48`,
  );
  const rec45 = [...report.records].reverse().find((record) => record.age <= 45);
  assert(Boolean(rec45), `${label}: missing age 45 checkpoint record`);
  assert(Boolean(rec45!.gameState.flags?.[expectedFlag]), `${label}: expected ${expectedFlag} by age 45`);
}

async function testOrthodox301ResidualSpineSignals(): Promise<void> {
  const report = await testBenchmarkSeedReachesAge('orthodox-301-residual', {
    playerName: '顾清和',
    gender: 'male',
    seed: 301,
    choiceTendency: 'martial',
    routeTrack: 'sect',
    sampleId: 'golden-sect',
  }, 50);

  const costEvent = report.records.find((record) => record.eventId === 'orthodox_age25_righteousness_cost_milestone');
  assert(Boolean(costEvent), 'seed 301: orthodox_age25_righteousness_cost_milestone never fired');
  assert(
    (costEvent?.age ?? 99) >= 25 && (costEvent?.age ?? 0) <= 28,
    `seed 301: righteousness cost event at age ${costEvent?.age}, expected 25-28`,
  );

  const grayEvent = report.records.find((record) => record.eventId === 'orthodox_age32_gray_pressure_milestone');
  assert(Boolean(grayEvent), 'seed 301: orthodox_age32_gray_pressure_milestone never fired');
  assert(
    (grayEvent?.age ?? 99) >= 32 && (grayEvent?.age ?? 0) <= 36,
    `seed 301: gray pressure event at age ${grayEvent?.age}, expected 32-36`,
  );

  const rec28 = [...report.records].reverse().find((record) => record.age <= 28);
  assert(Boolean(rec28?.gameState.flags?.orthodox_righteousness_cost_visible), 'seed 301: missing orthodox_righteousness_cost_visible by age 28');
  const goal28 = deriveSampleLineCurrentGoal(rec28!.gameState) ?? '';
  assert(goal28.includes('代价') || goal28.includes('义务'), `seed 301 age-28 goal missing cost signal: ${goal28}`);

  const rec35 = [...report.records].reverse().find((record) => record.age <= 35);
  assert(Boolean(rec35?.gameState.flags?.orthodox_gray_pressure_visible), 'seed 301: missing orthodox_gray_pressure_visible by age 35');
  const goal35 = deriveSampleLineCurrentGoal(rec35!.gameState) ?? '';
  assert(goal35.includes('灰度') || goal35.includes('代价'), `seed 301 age-35 goal missing gray signal: ${goal35}`);
}

async function testMerchant804ResidualDebtSpine(): Promise<void> {
  const report = await testBenchmarkSeedReachesAge('merchant-804-residual', {
    playerName: '沈聚财',
    gender: 'male',
    seed: 804,
    choiceTendency: 'wealth',
    p8PersonaId: 'p8-wealth-shen',
    sampleId: 'p8-wealth-shen',
  }, 50);

  const debtEvent = report.records.find((record) => record.eventId === 'merchant_midlife_debt_milestone');
  assert(Boolean(debtEvent), 'seed 804: merchant_midlife_debt_milestone never fired');
  assert(
    (debtEvent?.age ?? 99) >= 32 && (debtEvent?.age ?? 0) <= 38,
    `seed 804: midlife debt event at age ${debtEvent?.age}, expected 32-38`,
  );

  const rec35 = [...report.records].reverse().find((record) => record.age <= 35);
  assert(Boolean(rec35?.gameState.flags?.merchant_midlife_debt), 'seed 804: missing merchant_midlife_debt by age 35');
  const goal35 = deriveSampleLineCurrentGoal(rec35!.gameState) ?? '';
  assert(
    goal35.includes('人情') || goal35.includes('周转') || goal35.includes('债') || goal35.includes('巨贾') || goal35.includes('产业'),
    `seed 804 age-35 goal missing debt/magnate signal: ${goal35}`,
  );

  const rec40 = [...report.records].reverse().find((record) => record.age <= 40);
  const identity40 = deriveSampleLineAge40Identity(rec40!.gameState) ?? '';
  assert(
    identity40.includes('债') || identity40.includes('人情') || identity40.includes('巨贾'),
    `seed 804 age-40 identity missing debt/favor/magnate signal: ${identity40}`,
  );
}

async function testMagnateChainSim(): Promise<void> {
  const report = await testBenchmarkSeedReachesAge('magnate-804-chain', {
    playerName: '沈聚财',
    gender: 'male',
    seed: 804,
    choiceTendency: 'wealth',
    p8PersonaId: 'p8-wealth-shen',
    sampleId: 'p8-wealth-shen',
  }, 50);

  const onRamp = report.records.find((record) => record.eventId === 'magnate_on_ramp');
  assert(Boolean(onRamp), 'seed 804: magnate_on_ramp never fired');
  assert(
    (onRamp?.age ?? 99) >= 28 && (onRamp?.age ?? 0) <= 32,
    `seed 804: magnate_on_ramp at age ${onRamp?.age}, expected 28-32`,
  );

  const pressure = report.records.find((record) => record.eventId === 'magnate_midlife_pressure');
  assert(Boolean(pressure), 'seed 804: magnate_midlife_pressure never fired');
  assert(
    (pressure?.age ?? 99) >= 36 && (pressure?.age ?? 0) <= 40,
    `seed 804: magnate_midlife_pressure at age ${pressure?.age}, expected 36-40`,
  );

  const payoff = report.records.find((record) => record.eventId === 'magnate_payoff');
  assert(Boolean(payoff), 'seed 804: magnate_payoff never fired');
  assert(
    (payoff?.age ?? 99) >= 42 && (payoff?.age ?? 0) <= 46,
    `seed 804: magnate_payoff at age ${payoff?.age}, expected 42-46`,
  );

  const rec30 = [...report.records].reverse().find((record) => record.age <= 30);
  assert(Boolean(rec30?.gameState.flags?.magnate_on_ramp_done), 'seed 804: missing magnate_on_ramp_done by age 30');
  const goal30 = deriveSampleLineCurrentGoal(rec30!.gameState) ?? '';
  assert(
    goal30.includes('巨贾') || goal30.includes('产业'),
    `seed 804 age-30 goal missing magnate signal: ${goal30}`,
  );

  const rec38 = [...report.records].reverse().find((record) => record.age <= 38);
  assert(Boolean(rec38?.gameState.flags?.magnate_midlife_pressure_done), 'seed 804: missing magnate_midlife_pressure_done by age 38');
  const goal38 = deriveSampleLineCurrentGoal(rec38!.gameState) ?? '';
  assert(
    goal38.includes('人情') || goal38.includes('巨贾'),
    `seed 804 age-38 goal missing magnate pressure signal: ${goal38}`,
  );

  const rec44 = [...report.records].reverse().find((record) => record.age <= 44);
  assert(Boolean(rec44?.gameState.flags?.magnate_payoff_done), 'seed 804: missing magnate_payoff_done by age 44');
  const goal44 = deriveSampleLineCurrentGoal(rec44!.gameState) ?? '';
  assert(
    goal44.includes('巨贾') || goal44.includes('守住'),
    `seed 804 age-44 goal missing magnate payoff signal: ${goal44}`,
  );

  const lateLife = report.records.find((record) => record.eventId === 'magnate_late_life');
  assert(Boolean(lateLife), 'seed 804: magnate_late_life never fired');
  assert(
    (lateLife?.age ?? 99) >= 48 && (lateLife?.age ?? 0) <= 56,
    `seed 804: magnate_late_life at age ${lateLife?.age}, expected 48-56`,
  );

  const rec50 = [...report.records].reverse().find((record) => record.age <= 50);
  assert(Boolean(rec50?.gameState.flags?.magnate_late_life_done), 'seed 804: missing magnate_late_life_done by age 50');
  const goal50 = deriveSampleLineCurrentGoal(rec50!.gameState) ?? '';
  assert(
    goal50.includes('晚年') || goal50.includes('收束') || goal50.includes('守成'),
    `seed 804 age-50 goal missing late-life signal: ${goal50}`,
  );

  const rec40 = [...report.records].reverse().find((record) => record.age <= 40);
  const identity40 = deriveSampleLineAge40Identity(rec40!.gameState) ?? '';
  assert(
    identity40.includes('巨贾'),
    `seed 804 age-40 identity missing magnate signal: ${identity40}`,
  );
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

  await testOrthodox301Age25Goal();
  await testDemonic303Age25Goal();

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

  await testBenchmarkAge45Payoff('orthodox-301-age45', {
    playerName: '顾清和',
    gender: 'male',
    seed: 301,
    choiceTendency: 'martial',
    routeTrack: 'sect',
    sampleId: 'golden-sect',
  }, 'orthodox_age45_legacy_stewardship', 'orthodox_age45_payoff_done');

  await testBenchmarkAge45Payoff('demonic-303-age45', {
    playerName: '沈夜',
    gender: 'male',
    seed: 303,
    choiceTendency: 'risk_averse',
    routeTrack: 'demonic',
    sampleId: 'golden-demonic',
  }, 'demonic_age45_territory_consolidation', 'demonic_age45_payoff_done');

  {
    const report = await testBenchmarkSeedReachesAge('merchant-804-age45', {
      playerName: '沈聚财',
      gender: 'male',
      seed: 804,
      choiceTendency: 'wealth',
      p8PersonaId: 'p8-wealth-shen',
      sampleId: 'p8-wealth-shen',
    }, 50);
    const payoff = report.records.find((record) => record.eventId === 'magnate_payoff');
    assert(Boolean(payoff), 'seed 804: magnate_payoff never fired at 42-46');
    assert(
      (payoff?.age ?? 99) >= 42 && (payoff?.age ?? 0) <= 46,
      `seed 804: magnate_payoff at age ${payoff?.age}, expected 42-46`,
    );
    const rec45 = [...report.records].reverse().find((record) => record.age <= 45);
    assert(Boolean(rec45!.gameState.flags?.merchant_age45_payoff_done), 'seed 804: missing merchant_age45_payoff_done by age 45');
  }

  await testOrthodox301ResidualSpineSignals();
  await testMerchant804ResidualDebtSpine();
  await testMagnateChainSim();

  assert(SPINE_FLAGS.length >= 12, 'spine flag inventory incomplete');
  console.log('p50SampleLineSpineTests: all passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

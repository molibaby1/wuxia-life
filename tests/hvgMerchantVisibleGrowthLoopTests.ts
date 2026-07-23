import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import { executeActiveActionOnState } from '../src/core/activePlanning/ActivePlanningService';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import { buildCurrentShapingSummary } from '../src/utils/habitShapingSummary';
import {
  MERCHANT_LATE_CHILDHOOD_BUSINESS_LITE_ID,
  resolveChildhoodActionPalette,
} from '../src/p16/childhoodAgency';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function merchantState(overrides: Partial<GameState> = {}): GameState {
  const lifeStates = createDefaultPlayerLifeStates({
    businessHabit: 0,
    ...(overrides.player?.lifeStates ?? {}),
  });
  return {
    ...overrides,
    player: {
      age: 7,
      traits: ['keen_mind', 'lazy', 'bold'],
      lifeStates,
      flags: {},
      ...overrides.player,
    } as PlayerState,
    flags: {
      origin_merchant_family: true,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

function testBusinessActionsAccumulateHabit(): void {
  const state = merchantState({ player: { age: 5 } as PlayerState });
  const errand = executeActiveActionOnState(state, 'action_household_errand', {
    random: () => 0.5,
    includeDisturbance: false,
  });
  assert(errand !== null, 'errand should execute');
  assert((state.player.lifeStates?.businessHabit ?? 0) >= 1, 'errand should add businessHabit');

  const apprentice = executeActiveActionOnState(state, 'action_household_apprentice', {
    random: () => 0.5,
    includeDisturbance: false,
  });
  assert(apprentice !== null, 'apprentice should execute');
  assert((state.player.lifeStates?.businessHabit ?? 0) >= 2, 'two business actions should reach businessHabit 2');
  assert(
    buildCurrentShapingSummary(state.player.lifeStates).includes('营生'),
    'shaping summary should show business axis at tier 2',
  );
}

function testConfirmationRequiresHabitNotWealthAlone(): void {
  const evaluator = new ConditionEvaluator();
  const loader = EventLoader.getInstance();
  const event = loader.getEventById('merchant_childhood_seed_milestone');
  assert(Boolean(event), 'merchant_childhood_seed_milestone should load');

  const wealthOnly = merchantState({
    flags: { p8_route_wealth: true },
    player: {
      age: 8,
      lifeStates: createDefaultPlayerLifeStates({ businessHabit: 0 }),
    } as PlayerState,
  });
  assert(
    !evaluator.evaluate(event!.conditions![0], wealthOnly),
    'p8_route_wealth alone must not trigger confirmation',
  );

  const habitReady = merchantState({
    flags: { p9_echo_business_hook: true },
    player: {
      age: 8,
      lifeStates: createDefaultPlayerLifeStates({ businessHabit: 2 }),
    } as PlayerState,
  });
  assert(
    evaluator.evaluate(event!.conditions![0], habitReady),
    'businessHabit >= 2 with echo hook should trigger confirmation',
  );
}

function testForkChoiceEffectsCompleteOnceGate(): void {
  const loader = EventLoader.getInstance();
  const fork = loader.getEventById('hvg_merchant_early_opportunity_fork');
  assert(Boolean(fork), 'hvg_merchant_early_opportunity_fork should load');
  assert(
    !fork!.autoEffects?.length,
    'choice events must not rely on autoEffects; useNewGameEngine only applies choice.effects',
  );
  for (const choice of fork!.choices ?? []) {
    const targets = (choice.effects ?? []).map(effect => effect.target);
    assert(
      targets.includes('hvg_merchant_early_fork_done'),
      `${choice.id} must set hvg_merchant_early_fork_done`,
    );
    assert(
      targets.includes('hvg_merchant_early_opportunity_fork'),
      `${choice.id} must record hvg_merchant_early_opportunity_fork`,
    );
  }
}

function testForkFollowsConfirmation(): void {
  const evaluator = new ConditionEvaluator();
  const loader = EventLoader.getInstance();
  const fork = loader.getEventById('hvg_merchant_early_opportunity_fork');
  assert(Boolean(fork), 'hvg_merchant_early_opportunity_fork should load');

  const beforeConfirm = merchantState({
    flags: { p9_echo_business_hook: true },
    player: {
      age: 10,
      lifeStates: createDefaultPlayerLifeStates({ businessHabit: 2 }),
    } as PlayerState,
  });
  assert(!evaluator.evaluate(fork!.conditions![0], beforeConfirm), 'fork before seed done');

  const afterConfirm = merchantState({
    flags: {
      merchant_childhood_seed_done: true,
    },
    player: { age: 10 } as PlayerState,
  });
  assert(evaluator.evaluate(fork!.conditions![0], afterConfirm), 'fork after seed done');
}

function testTalentDiscoveryAcceptsHvgTracks(): void {
  const evaluator = new ConditionEvaluator();
  const loader = EventLoader.getInstance();
  const talent = loader.getEventById('merchant_talent_discovery');
  assert(Boolean(talent), 'merchant_talent_discovery should load');

  const ledgerTrack = merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      merchant_childhood_seed_done: true,
      route_merchant: true,
    },
    player: {
      age: 10,
      charisma: 8,
      money: 10,
    } as PlayerState,
  });
  assert(
    evaluator.evaluate(talent!.conditions![0], ledgerTrack),
    'ledger track should satisfy merchant_talent_discovery gate',
  );

  const caravanTrack = merchantState({
    flags: {
      hvg_merchant_caravan_track: true,
      merchant_childhood_seed_done: true,
      route_merchant: true,
    },
    player: {
      age: 10,
      charisma: 8,
      money: 10,
    } as PlayerState,
  });
  assert(
    evaluator.evaluate(talent!.conditions![0], caravanTrack),
    'caravan track should satisfy merchant_talent_discovery gate',
  );
}

function testMerchantLateChildhoodBusinessPalette(): void {
  const palette = resolveChildhoodActionPalette({
    age: 10,
    player: {
      traits: ['keen_mind', 'lazy', 'bold'],
    } as PlayerState,
    flags: { origin_merchant_family: true },
  });
  assert(
    palette.some(action => action.id === MERCHANT_LATE_CHILDHOOD_BUSINESS_LITE_ID),
    'origin_merchant_family age 10 palette should include household apprentice',
  );

  const earlyPalette = resolveChildhoodActionPalette({
    age: 6,
    player: {
      traits: ['keen_mind', 'lazy', 'bold'],
    } as PlayerState,
    flags: { origin_merchant_family: true },
  });
  assert(
    earlyPalette.some(action => action.id === 'action_household_errand'),
    'origin_merchant_family age 6 palette should inject household errand',
  );

  const scholarPalette = resolveChildhoodActionPalette({
    age: 10,
    player: { traits: ['keen_mind', 'lazy', 'bold'] } as PlayerState,
    flags: { origin_scholar_family: true, p8_persona_id: 'p8-scholar-su' },
  });
  assert(
    !scholarPalette.some(action => action.id === MERCHANT_LATE_CHILDHOOD_BUSINESS_LITE_ID),
    'scholar primary flag must not include merchant business carve-out',
  );

  const traitOnlyMerchant = resolveChildhoodActionPalette({
    age: 6,
    player: {
      traits: ['keen_mind', 'lazy', 'bold'],
    } as PlayerState,
    flags: {},
  });
  assert(
    !traitOnlyMerchant.some(action => action.id === 'action_household_errand'),
    'trait-only merchant_house must not open merchant childhood gate without primary flag',
  );
}

function testBusinessFeedbackOnTierCross(): void {
  const state = merchantState({ player: { age: 5 } as PlayerState });
  executeActiveActionOnState(state, 'action_household_errand', {
    random: () => 0.5,
    includeDisturbance: false,
  });
  const second = executeActiveActionOnState(state, 'action_household_apprentice', {
    random: () => 0.5,
    includeDisturbance: false,
  });
  assert(
    second?.feedbackText.includes('营生塑形渐成'),
    'businessHabit tier cross should append shaping feedback',
  );
  assert(second?.feedbackText.includes('营生告一段落'), 'business category label should be 营生');
}

export async function runHvgMerchantVisibleGrowthLoopTests(): Promise<void> {
  testBusinessActionsAccumulateHabit();
  testConfirmationRequiresHabitNotWealthAlone();
  testForkChoiceEffectsCompleteOnceGate();
  testForkFollowsConfirmation();
  testTalentDiscoveryAcceptsHvgTracks();
  testMerchantLateChildhoodBusinessPalette();
  testBusinessFeedbackOnTierCross();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runHvgMerchantVisibleGrowthLoopTests()
    .then(() => console.log('hvgMerchantVisibleGrowthLoopTests: ok'))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

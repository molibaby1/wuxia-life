/**
 * P16 origin-driven growth and composite destiny tests.
 */

import { getWorldProfile, WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import {
  ADULT_CHILDHOOD_BLOCKED_ACTIONS,
  applyYouthTransitionSeeds,
  childhoodPalettesDifferByArchetype,
  isActionSuppressedForAge,
  isInfantBand,
  promoteYouthRouteEntryFromUpbringing,
  resolveChildhoodActionPalette,
  shouldOfferDailyPlanning,
} from '../src/p16/childhoodAgency';
import { resolveActiveAction } from '../src/core/activePlanning/ActionResultResolver';
import type { EventDefinition, GameState, PlayerState } from '../src/types/eventTypes';
import {
  evaluateAllCompositeDestinies,
  evaluateCompositeDestinyOutcome,
  formatCompositeDestinyReport,
} from '../src/p16/compositeDestiny';
import {
  getOriginChildhoodEventMultiplier,
  getOriginSurfaceById,
  summarizeOriginResourceContrast,
} from '../src/p16/originSurfaces';
import { computeRareLineProbability, rollRareEventLines } from '../src/p16/rareEventLines';
import { assembleP16GateReport } from '../src/p16/reportBuilder';
import {
  profileHasP16Sections,
  runOriginChoiceLuckSlice,
  runOriginVarianceSlice,
} from '../src/p16/validationSlices';
import {
  applyChildhoodShapingFromEvent,
  buildTendencySurfaceSummary,
  createEmptyTendencyAccumulator,
} from '../src/p16/tendencyShaping';
import { selectPassiveNarrative } from '../src/data/infantPassiveNarratives';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testOriginSurfaceSchema(): void {
  const profile = getWorldProfile();
  assert((profile.originSurfaces?.length ?? 0) >= 6, 'origin surfaces populated');
  const merchant = getOriginSurfaceById('merchant_house');
  const poor = getOriginSurfaceById('poor_family');
  assert(merchant !== undefined && poor !== undefined, 'known origins');
  assert(
    merchant!.immediateConditions.familyResources > poor!.immediateConditions.familyResources,
    'merchant richer than poor',
  );
  assert(
    merchant!.shapingTendencies.ambition !== poor!.shapingTendencies.discipline ||
      merchant!.shapingTendencies.ambition > 0,
    'shaping tendencies present',
  );
}

function testOriginEventWeighting(): void {
  const player: PlayerState = {
    name: 't',
    age: 8,
    traitProfile: {
      origin: 'poor_family',
      coreTalent: 'keen_mind',
      weakness: 'frail',
      temperament: 'disciplined',
    },
  } as PlayerState;
  const poorSurvival = getOriginChildhoodEventMultiplier(player, new Set(['survival']));
  player.traitProfile!.origin = 'merchant_house';
  const merchantBusiness = getOriginChildhoodEventMultiplier(player, new Set(['business']));
  player.traitProfile!.origin = 'scholar_house';
  const scholarComprehension = getOriginChildhoodEventMultiplier(player, new Set(['comprehension']));
  assert(poorSurvival > 1, 'poor survival bias');
  assert(merchantBusiness > 1, 'merchant business bias');
  assert(scholarComprehension > 1, 'scholar comprehension bias');
  const contrast = summarizeOriginResourceContrast('merchant_house', 'poor_family');
  assert(contrast.materiallyDifferent, 'material contrast');
}

function testOriginPassiveNarratives(): void {
  const scholarState = {
    player: { age: 0, traitProfile: { origin: 'scholar_house' } } as PlayerState,
    flags: { origin_scholar_family: true },
    eventHistory: [],
  } as GameState;
  const frontierState = {
    player: { age: 0, traitProfile: { origin: 'frontier_military' } } as PlayerState,
    flags: { origin_frontier: true },
    eventHistory: [],
  } as GameState;
  const scholarPick = selectPassiveNarrative(scholarState, () => 0);
  const frontierPick = selectPassiveNarrative(frontierState, () => 0);
  assert(scholarPick.id === 'scholar_infant_01_hall_birth', 'scholar chain starts at N1');
  assert(frontierPick.id === 'frontier_infant_01_camp_birth', 'frontier chain starts at N1');
  assert(scholarPick.id !== frontierPick.id, 'origin picks differ at age 0');

  const scholarAfterN1 = {
    ...scholarState,
    eventHistory: [{ eventId: 'scholar_infant_01_hall_birth', age: 0 }],
    flags: { ...scholarState.flags, scholar_infant_hall_birth: true },
  } as GameState;
  const scholarN2 = selectPassiveNarrative(scholarAfterN1, () => 0);
  assert(scholarN2.id === 'scholar_infant_02_swaddle_ink', 'scholar chain advances to N2 in order');
}

function testChildhoodAgency(): void {
  for (const adultId of ADULT_CHILDHOOD_BLOCKED_ACTIONS) {
    assert(isActionSuppressedForAge(adultId, 5), `adult action blocked at age 5: ${adultId}`);
    assert(isActionSuppressedForAge(adultId, 10), `adult action blocked at age 10: ${adultId}`);
  }

  for (const infantAge of [0, 1, 2]) {
    const infantPalette = resolveChildhoodActionPalette({ age: infantAge, player: {} as PlayerState });
    assert(infantPalette.length === 0, `infant palette empty at age ${infantAge}`);
    assert(!shouldOfferDailyPlanning(infantAge), `no daily planning at age ${infantAge}`);
  }

  const preschoolPalette = resolveChildhoodActionPalette({ age: 4, player: {} as PlayerState });
  assert(preschoolPalette.length === 0, 'preschool palette empty at age 4');

  const age5Palette = resolveChildhoodActionPalette({
    age: 5,
    player: { traitProfile: { origin: 'scholar_house' } } as PlayerState,
  });
  assert(age5Palette.length >= 1 && age5Palette.length <= 2, 'age 5 offers light planning');

  const age7Palette = resolveChildhoodActionPalette({
    age: 7,
    player: { traitProfile: { origin: 'scholar_house' } } as PlayerState,
  });
  assert(age7Palette.length >= 1 && age7Palette.length <= 2, 'age 7 offers light planning');
  assert(
    age5Palette.map(a => a.id).join(',') !== age7Palette.map(a => a.id).join(','),
    'age 5 vs 7 scholar palettes differ in action ids',
  );
  assert(
    age5Palette.some(a => a.id === 'action_childhood_yard_play' || a.id === 'action_errand_nearby'),
    'age 5 band includes 5–6 lite action id',
  );

  const martialAge5 = resolveChildhoodActionPalette({
    age: 5,
    player: { traitProfile: { origin: 'martial_house' } } as PlayerState,
    flags: { origin_wuxia_family: true },
  });
  const martialAge7 = resolveChildhoodActionPalette({
    age: 7,
    player: { traitProfile: { origin: 'martial_house' } } as PlayerState,
    flags: { origin_wuxia_family: true },
  });
  assert(
    martialAge5.map(a => a.id).join(',') !== martialAge7.map(a => a.id).join(','),
    'martial origin age 5 vs 7 palettes differ',
  );
  assert(martialAge5.length <= 2 && martialAge7.length <= 2, 'lite palette max 2 at 5–7');

  const infantAction = resolveActiveAction({
    state: {
      player: { age: 0, martialPower: 0, chivalry: 0, internalSkill: 0, comprehension: 10 } as PlayerState,
      flags: {},
    } as GameState,
    actionId: 'action_childhood_training',
    random: () => 0.99,
  });
  assert(infantAction !== null, 'infant action resolves');
  assert((infantAction!.deltas.chivalry ?? 0) === 0, 'infant no chivalry from training');
  assert((infantAction!.deltas.internalSkill ?? 0) === 0, 'infant no internal skill from training');
  assert(isInfantBand(0), 'age 0 is infant band');

  const scholarPalette = resolveChildhoodActionPalette({
    age: 6,
    player: { traitProfile: { origin: 'scholar_house' } } as PlayerState,
    flags: { p8_persona_id: 'p8-scholar-su' },
  });
  assert(
    scholarPalette.some(a => a.id === 'action_study_lite'),
    'scholar persona gets study-lite at age 6',
  );
  assert(
    !scholarPalette.some(a => a.id === 'action_study_basic'),
    'no full adult study at age 6',
  );

  const businessPalette = resolveChildhoodActionPalette({
    age: 6,
    player: { traitProfile: { origin: 'merchant_house' } } as PlayerState,
    flags: { p8_persona_id: 'p8-wealth-shen' },
  });
  assert(
    businessPalette.some(a => a.id === 'action_errand_nearby'),
    'business persona gets 5–6 band errand action at age 6',
  );
  const businessAge7 = resolveChildhoodActionPalette({
    age: 7,
    player: { traitProfile: { origin: 'merchant_house' } } as PlayerState,
    flags: { p8_persona_id: 'p8-wealth-shen' },
  });
  assert(
    businessAge7.some(a => a.id === 'action_household_apprentice'),
    'business persona gets household apprentice at age 7',
  );
  assert(!businessPalette.some(a => a.id === 'action_business_basic'), 'no adult business');

  const socialPalette = resolveChildhoodActionPalette({
    age: 8,
    player: { traitProfile: { origin: 'streetborn' } } as PlayerState,
    flags: { p8_persona_id: 'p8-social-gu' },
  });
  assert(
    !socialPalette.some(a => a.category === 'socializing' || a.category === 'business'),
    'late childhood suppresses socializing/business categories at age 8',
  );
  assert(
    socialPalette.some(a => a.id === 'action_study_lite' || a.id === 'action_childhood_training'),
    'late childhood still offers training or study at age 8',
  );

  const travelPalette = resolveChildhoodActionPalette({
    age: 8,
    player: { traitProfile: { origin: 'frontier_military' } } as PlayerState,
    flags: { p8_persona_id: 'p8-explorer-lu' },
  });
  assert(!travelPalette.some(a => a.category === 'travel'), 'late childhood suppresses travel at age 8');
  assert(travelPalette.some(a => a.id === 'action_childhood_training'), 'frontier late childhood keeps training');

  assert(childhoodPalettesDifferByArchetype(), 'archetype palettes do not all collapse to training');

  const age20 = resolveChildhoodActionPalette({ age: 20, player: {} as PlayerState });
  assert(
    !age20.every(a =>
      ['action_training_basic', 'action_study_basic', 'action_socializing_basic', 'action_business_basic', 'action_travel_basic'].includes(a.id),
    ) || age20.length < 5,
    'youth palette at age 20 must not dump all five adult basics',
  );

  const age21 = resolveChildhoodActionPalette({ age: 21, player: {} as PlayerState });
  assert(age21.some(a => a.id === 'action_business_basic'), 'adult palette restores full actions at age 21+');
}

function testTendencyShaping(): void {
  const event = {
    id: 'test_survival',
    category: 'random_encounter',
    metadata: { tags: ['survival'] },
  } as EventDefinition;
  const player = { name: 't', age: 6, traitProfile: { origin: 'frontier_military' } } as PlayerState;
  let acc = createEmptyTendencyAccumulator();
  for (let i = 0; i < 3; i++) {
    acc = applyChildhoodShapingFromEvent(acc, event, player);
  }
  const surfaced = buildTendencySurfaceSummary(acc);
  assert(surfaced.length >= 1, 'endurance surfaced');
}

function testCompositeDestiny(): void {
  const outcomes = WUXIA_WORLD_PROFILE.compositeDestinyOutcomes ?? [];
  assert(outcomes.length >= 3, 'three composite outcomes');
  const player = { martialPower: 95, connections: 20, money: 10, reputation: 10 } as PlayerState;
  const lone = outcomes.find(o => o.id === 'lone_sword_legend')!;
  const withRare = evaluateCompositeDestinyOutcome(lone, player, { p16_rare_master_encounter: true });
  const withoutRare = evaluateCompositeDestinyOutcome(lone, player, { p16_alliance_brokered: false });
  assert(withRare.unlocked, 'lone sword with rare and low social');
  assert(!withoutRare.unlocked, 'lone sword without rare blocked');
  const sect = outcomes.find(o => o.id === 'sect_leader_statesman')!;
  const sectReport = evaluateCompositeDestinyOutcome(sect, player, { p16_alliance_brokered: true });
  assert(!sectReport.unlocked, 'sect leader needs social capital');
  assert(sectReport.dimensions.some(d => d.status === 'missing'), 'missing dimensions reported');
}

function testRareEventLines(): void {
  const lines = WUXIA_WORLD_PROFILE.rareEventLines ?? [];
  assert(lines.length >= 2, 'rare lines configured');
  const player = {
    name: 't',
    age: 12,
    traitProfile: { origin: 'martial_family', coreTalent: 'keen_mind', weakness: 'frail', temperament: 'disciplined' },
  } as PlayerState;
  const prob = computeRareLineProbability(lines[0], player, { p9_early_training_focus: true });
  assert(prob > 0, 'eligible rare line probability');
  const rolls = rollRareEventLines(player, { p9_early_training_focus: true }, () => 0.01);
  assert(rolls.some(r => r.triggered), 'low roll triggers line');
}

function testValidationSlices(): void {
  const originSlice = runOriginVarianceSlice();
  assert(originSlice.originChangesEarlyArc, 'origin changes early arc');
  const luckSlice = runOriginChoiceLuckSlice();
  assert(luckSlice.compositeUnlockCase?.lockedWithoutRare, 'composite needs rare line');
  assert(profileHasP16Sections(), 'profile has p16 sections');
}

function testP16GateReport(): void {
  const report = assembleP16GateReport();
  assert(report.decision !== 'fail', `gate decision ${report.decision}`);
  assert(report.originVariance.surfaceCount >= 6, 'gate origin count');
  assert(report.compositeDestiny.outcomeCount >= 3, 'gate composite count');
}

function testYouthRouteEntryPromotion(): void {
  const deferredOnly: GameState = {
    flags: { p16_deferred_business_upbringing: true },
    player: { age: 13, traitProfile: { origin: 'merchant_house' } } as PlayerState,
  } as GameState;
  promoteYouthRouteEntryFromUpbringing(deferredOnly);
  assert(deferredOnly.flags.p9_early_business_focus === true, 'deferred business promotes early focus');
  assert(deferredOnly.flags.p9_echo_business_hook === true, 'deferred business promotes echo hook');

  const echoOnly: GameState = {
    flags: { p9_echo_business_hook: true },
    player: { age: 13 } as PlayerState,
  } as GameState;
  promoteYouthRouteEntryFromUpbringing(echoOnly);
  assert(echoOnly.flags.p9_early_business_focus === true, 'childhood echo hook promotes early focus');

  const youthTransition: GameState = {
    flags: {},
    player: { age: 12, traitProfile: { origin: 'merchant_house' } } as PlayerState,
  } as GameState;
  applyYouthTransitionSeeds(youthTransition, 12, 13);
  assert(
    youthTransition.flags.p16_deferred_business_upbringing === true,
    'merchant origin seeds deferred business upbringing',
  );
  assert(
    youthTransition.flags.p9_early_business_focus === true,
    'youth transition locks wealth route entry',
  );

  const businessLocked: GameState = {
    flags: {
      p9_echo_business_hook: true,
      p9_early_business_focus: true,
      p16_deferred_travel_upbringing: true,
    },
    player: { age: 13, traitProfile: { origin: 'streetborn' } } as PlayerState,
  } as GameState;
  promoteYouthRouteEntryFromUpbringing(businessLocked);
  assert(
    businessLocked.flags.p9_early_travel_focus !== true,
    'childhood business path blocks deferred travel promotion',
  );

  const demonicTravelEcho: GameState = {
    flags: { p8_route_demonic: true, p9_echo_travel_hook: true },
    player: { age: 13 } as PlayerState,
  } as GameState;
  promoteYouthRouteEntryFromUpbringing(demonicTravelEcho);
  assert(
    demonicTravelEcho.flags.p9_early_travel_focus !== true,
    'demonic childhood travel echo must not promote wanderer focus',
  );
  assert(
    demonicTravelEcho.flags.p9_demonic_restless_journey === true,
    'demonic childhood travel echo promotes restless journey instead',
  );

  const demonicDeferredTravel: GameState = {
    flags: { p8_route_demonic: true, p16_deferred_travel_upbringing: true },
    player: { age: 13, traitProfile: { origin: 'streetborn' } } as PlayerState,
  } as GameState;
  promoteYouthRouteEntryFromUpbringing(demonicDeferredTravel);
  assert(
    demonicDeferredTravel.flags.p9_early_travel_focus !== true,
    'demonic deferred travel upbringing must not promote wanderer focus',
  );
  assert(
    demonicDeferredTravel.flags.p9_echo_travel_hook !== true,
    'demonic deferred travel upbringing must not seed wanderer echo hook',
  );
}

function run(): void {
  testOriginSurfaceSchema();
  testOriginEventWeighting();
  testOriginPassiveNarratives();
  testChildhoodAgency();
  testYouthRouteEntryPromotion();
  testTendencyShaping();
  testCompositeDestiny();
  testRareEventLines();
  testValidationSlices();
  testP16GateReport();
  console.log('✔ p16OriginDestinyTests passed');
}

run();

/**
 * P16 origin-driven growth and composite destiny tests.
 */

import { getWorldProfile, WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import {
  ADULT_CHILDHOOD_BLOCKED_ACTIONS,
  applyYouthTransitionSeeds,
  childhoodPalettesDifferByArchetype,
  isActionSuppressedForAge,
  promoteYouthRouteEntryFromUpbringing,
  resolveChildhoodActionPalette,
} from '../src/p16/childhoodAgency';
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
import { traitSystem } from '../src/core/TraitSystem';

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

function testChildhoodAgency(): void {
  for (const adultId of ADULT_CHILDHOOD_BLOCKED_ACTIONS) {
    assert(isActionSuppressedForAge(adultId, 5), `adult action blocked at age 5: ${adultId}`);
    assert(isActionSuppressedForAge(adultId, 10), `adult action blocked at age 10: ${adultId}`);
  }

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
    businessPalette.some(a => a.id === 'action_household_apprentice'),
    'business persona gets household apprentice at age 6',
  );
  assert(!businessPalette.some(a => a.id === 'action_business_basic'), 'no adult business');

  const socialPalette = resolveChildhoodActionPalette({
    age: 8,
    player: { traitProfile: { origin: 'streetborn' } } as PlayerState,
    flags: { p8_persona_id: 'p8-social-gu' },
  });
  assert(
    socialPalette.some(a => a.id === 'action_socializing_lite'),
    'social persona gets socializing-lite',
  );

  const travelPalette = resolveChildhoodActionPalette({
    age: 8,
    player: { traitProfile: { origin: 'frontier_military' } } as PlayerState,
    flags: { p8_persona_id: 'p8-explorer-lu' },
  });
  assert(travelPalette.some(a => a.id === 'action_errand_nearby'), 'travel persona gets errand-lite');

  assert(childhoodPalettesDifferByArchetype(), 'archetype palettes do not all collapse to training');

  const age20 = resolveChildhoodActionPalette({ age: 20, player: {} as PlayerState });
  assert(age20.some(a => a.id === 'action_business_basic'), 'adult palette restores full actions');
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
}

function run(): void {
  testOriginSurfaceSchema();
  testOriginEventWeighting();
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

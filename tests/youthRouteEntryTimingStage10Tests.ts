/**
 * Stage-10 US-006: route-entry timing — p9_early_* must not appear from childhood palette before 13.
 */
import {
  applyYouthTransitionSeeds,
  promoteYouthRouteEntryFromUpbringing,
  resolveChildhoodActionPalette,
} from '../src/p16/childhoodAgency';
import { getActionById } from '../src/data/activeActionCatalog';
import { getOriginSurfaceById } from '../src/p16/originSurfaces';
import type { PrimaryOriginFamilyFlag } from '../src/p16/primaryOriginFlag';
import type { GameState, PlayerState } from '../src/types/eventTypes';

const EARLY_FOCUS_FLAGS = [
  'p9_early_business_focus',
  'p9_early_travel_focus',
  'p9_early_social_focus',
] as const;

const CHILDHOOD_AGES = [8, 10, 12] as const;

const ORIGINS: Array<{
  name: string;
  flag: PrimaryOriginFamilyFlag;
  traitOrigin: string;
  personaId: string;
}> = [
  { name: 'scholar', flag: 'origin_scholar_family', traitOrigin: 'scholar_house', personaId: 'p8-scholar-su' },
  { name: 'martial', flag: 'origin_wuxia_family', traitOrigin: 'martial_house', personaId: 'p8-martial-lin' },
  { name: 'merchant', flag: 'origin_merchant_family', traitOrigin: 'merchant_house', personaId: 'p8-wealth-shen' },
  { name: 'frontier', flag: 'origin_frontier', traitOrigin: 'frontier_military', personaId: 'p8-explorer-lu' },
];

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function actionSetsEarlyFocus(actionId: string): string[] {
  const action = getActionById(actionId);
  const flags = action?.onCompleteFlags ?? [];
  return flags.filter(f => EARLY_FOCUS_FLAGS.includes(f as (typeof EARLY_FOCUS_FLAGS)[number]));
}

function testChildhoodPaletteDoesNotExposeEarlyFocusActions(): void {
  for (const origin of ORIGINS) {
    for (const age of CHILDHOOD_AGES) {
      const palette = resolveChildhoodActionPalette({
        age,
        player: { traits: [] } as PlayerState,
        flags: { [origin.flag]: true, p8_persona_id: origin.personaId },
      });
      for (const action of palette) {
        const earlyFlags = actionSetsEarlyFocus(action.id);
        assert(
          earlyFlags.length === 0,
          `${origin.name} age ${age}: palette action ${action.id} sets early focus flags ${earlyFlags.join(',')}`,
        );
      }
    }
  }
}

function testYouthTransitionSeedsPerOrigin(): void {
  for (const origin of ORIGINS) {
    const state: GameState = {
      flags: { [origin.flag]: true, origin_id: origin.traitOrigin },
      player: { age: 12, traits: [] } as PlayerState,
    } as GameState;
    applyYouthTransitionSeeds(state, 12, 13);
    const surface = getOriginSurfaceById(origin.traitOrigin);

    if (origin.name === 'merchant' || origin.name === 'scholar') {
      assert(
        state.flags.p16_deferred_business_upbringing === true,
        `${origin.name}: expected deferred business upbringing at 12→13`,
      );
      assert(
        state.flags.p9_early_business_focus === true,
        `${origin.name}: expected p9_early_business_focus after youth transition`,
      );
    }

    if (origin.name === 'merchant' && surface && surface.immediateConditions.socialCapital >= 0.4) {
      assert(state.flags.p9_early_social_focus === true, 'merchant: expected social focus promotion');
    }

    for (const age of CHILDHOOD_AGES) {
      const palette = resolveChildhoodActionPalette({
        age,
        player: { traits: [] } as PlayerState,
        flags: { ...state.flags, [origin.flag]: true, p8_persona_id: origin.personaId },
      });
      for (const action of palette) {
        assert(
          actionSetsEarlyFocus(action.id).length === 0,
          `${origin.name} age ${age} with post-transition flags: ${action.id} must not set p9_early_*`,
        );
      }
    }
  }
}

function testYouthRouteEntryPromotionRegression(): void {
  const deferredOnly: GameState = {
    flags: { p16_deferred_business_upbringing: true },
    player: { age: 13, traits: [] } as PlayerState,
  } as GameState;
  promoteYouthRouteEntryFromUpbringing(deferredOnly);
  assert(deferredOnly.flags.p9_early_business_focus === true, 'deferred business promotes early focus');

  const demonicTravelEcho: GameState = {
    flags: { p8_route_demonic: true, p9_echo_travel_hook: true },
    player: { age: 13, traits: [] } as PlayerState,
  } as GameState;
  promoteYouthRouteEntryFromUpbringing(demonicTravelEcho);
  assert(demonicTravelEcho.flags.p9_early_travel_focus !== true, 'demonic echo must not promote wanderer focus');
  assert(
    demonicTravelEcho.flags.p9_demonic_restless_journey === true,
    'demonic echo promotes restless journey',
  );
}

export function runYouthRouteEntryTimingStage10Tests(): void {
  testChildhoodPaletteDoesNotExposeEarlyFocusActions();
  testYouthTransitionSeedsPerOrigin();
  testYouthRouteEntryPromotionRegression();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    runYouthRouteEntryTimingStage10Tests();
    console.log('youthRouteEntryTimingStage10Tests: ok');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

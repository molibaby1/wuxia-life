import { getWorldProfile } from '../../../src/narrative/worldProfile';
import type { GameState, PlayerState } from '../../../src/types/eventTypes';
import {
  getOriginChildhoodEventMultiplier,
  getOriginGuidanceEventMultiplier,
  getOriginMaterialEventMultiplier,
  getOriginSurfaceById,
  summarizeOriginResourceContrast,
} from '../../../src/p16/originSurfaces';
import { evaluateAllCompositeDestinies } from '../../../src/p16/compositeDestiny';
import { rollRareEventLines } from '../../../src/p16/rareEventLines';

export interface OriginVarianceSliceResult {
  slice: 'origin_variance';
  contrasts: ReturnType<typeof summarizeOriginResourceContrast>[];
  weightSamples: Array<{
    originId: string;
    survivalTagMultiplier: number;
    learningTagMultiplier: number;
  }>;
  originChangesEarlyArc: boolean;
}

export interface OriginChoiceLuckSliceResult {
  slice: 'origin_choice_luck';
  compositeUnlockCase: {
    outcomeId: string;
    requiresRareLine: boolean;
    requiresChoiceFlags: boolean;
    unlockedWithBoth: boolean;
    lockedWithoutRare: boolean;
  } | null;
  rareLineDivergence: {
    seedA: string;
    seedB: string;
    lineA: string[];
    lineB: string[];
    diverged: boolean;
  };
}

function makePlayerWithOrigin(originId: string, age = 8): PlayerState {
  const player: PlayerState = {
    name: 'test',
    age,
    traits: ['keen_mind', 'frail', 'disciplined'],
  } as PlayerState;
  return player;
}

function makeStateWithOrigin(originId: string, age = 8): GameState {
  return {
    player: makePlayerWithOrigin(originId, age),
    flags: { origin_id: originId },
  } as GameState;
}

export function runOriginVarianceSlice(): OriginVarianceSliceResult {
  const contrasts = [
    summarizeOriginResourceContrast('merchant_house', 'poor_family'),
    summarizeOriginResourceContrast('scholar_house', 'frontier_military'),
    summarizeOriginResourceContrast('martial_family', 'streetborn'),
  ];

  const originIds = ['merchant_house', 'poor_family', 'scholar_house'];
  const weightSamples = originIds.map(originId => {
    const state = makeStateWithOrigin(originId);
    const surface = getOriginSurfaceById(originId);
    const survival = getOriginMaterialEventMultiplier(surface, new Set(['survival']));
    const learning = getOriginGuidanceEventMultiplier(surface, new Set(['learning']));
    const combinedSurvival = getOriginChildhoodEventMultiplier(state, new Set(['survival']));
    const combinedLearning = getOriginChildhoodEventMultiplier(state, new Set(['learning']));
    return {
      originId,
      survivalTagMultiplier: combinedSurvival,
      learningTagMultiplier: combinedLearning,
    };
  });

  const originChangesEarlyArc = contrasts.some(c => c.materiallyDifferent) &&
    weightSamples.some((a, i) =>
      weightSamples.some((b, j) => i !== j && Math.abs(a.survivalTagMultiplier - b.survivalTagMultiplier) > 0.15),
    );

  return {
    slice: 'origin_variance',
    contrasts,
    weightSamples,
    originChangesEarlyArc,
  };
}

export function runOriginChoiceLuckSlice(): OriginChoiceLuckSliceResult {
  const player: PlayerState = makePlayerWithOrigin('martial_family', 35);
  player.martialPower = 95;
  player.connections = 20;

  const flagsWithAll = {
    p16_rare_master_encounter: true,
  };

  const flagsWithoutRare: Record<string, unknown> = {};

  const reportsWith = evaluateAllCompositeDestinies(player, flagsWithAll);
  const reportsWithout = evaluateAllCompositeDestinies(player, flagsWithoutRare);

  const loneSword = reportsWith.find(r => r.outcomeId === 'lone_sword_legend');
  const loneSwordBlocked = reportsWithout.find(r => r.outcomeId === 'lone_sword_legend');

  const compositeUnlockCase = loneSword
    ? {
        outcomeId: loneSword.outcomeId,
        requiresRareLine: true,
        requiresChoiceFlags: false,
        unlockedWithBoth: loneSword.unlocked,
        lockedWithoutRare: loneSwordBlocked ? !loneSwordBlocked.unlocked : true,
      }
    : null;

  const basePlayer = makePlayerWithOrigin('martial_family', 12);
  const baseFlags = { p9_early_training_focus: true, origin_id: 'martial_family' };
  let seed = 0.05;
  const rngA = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  seed = 0.95;
  const rngB = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const lineA = rollRareEventLines(basePlayer, baseFlags, rngA)
    .filter(r => r.triggered)
    .map(r => r.lineId);
  const lineB = rollRareEventLines(basePlayer, baseFlags, rngB)
    .filter(r => r.triggered)
    .map(r => r.lineId);

  return {
    slice: 'origin_choice_luck',
    compositeUnlockCase,
    rareLineDivergence: {
      seedA: 'low',
      seedB: 'high',
      lineA,
      lineB,
      diverged: lineA.join() !== lineB.join(),
    },
  };
}

export function profileHasP16Sections(worldId = 'wuxia'): boolean {
  const profile = getWorldProfile(worldId);
  return (
    (profile.originSurfaces?.length ?? 0) >= 3 &&
    (profile.compositeDestinyOutcomes?.length ?? 0) >= 3 &&
    (profile.rareEventLines?.length ?? 0) >= 1 &&
    (profile.childhoodShapingRules?.length ?? 0) >= 2
  );
}

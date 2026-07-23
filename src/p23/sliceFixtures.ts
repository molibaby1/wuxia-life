import {
  P20_DEMONIC_OUTLAW,
  P20_HERMIT_WITHDRAWAL,
  P20_MARTIAL_ASCENDANT,
  P20_SCHOLAR_STATESMAN,
  P20_WEALTH_MERCHANT,
} from '../narrative/profile/wuxiaReplayabilitySurfaces';
import type { ExperienceDimension, ReplaySliceConfig } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import type { GameState, PlayerState } from '../types/eventTypes';
import { buildArchetypeCoverageReport } from '../p20/archetypeCoverage';
import { buildWholeLifePacingReport } from '../p20/wholeLifePacing';
import { buildEndgameCategoryReport } from '../p19/endgameCategories';
import { buildHistoricalMemoryReport } from '../p19/historicalMemory';

function basePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  const { flags: overrideFlags, ...rest } = overrides;
  return {
    age: 18,
    name: 'slice',
    gender: 'male',
    martialPower: 30,
    externalSkill: 28,
    internalSkill: 25,
    qinggong: 22,
    chivalry: 30,
    constitution: 50,
    comprehension: 40,
    sect: null,
    title: null,
    reputation: 15,
    money: 200,
    knowledge: 25,
    charisma: 30,
    businessAcumen: 20,
    influence: 15,
    connections: 10,
    martialHeritage: 5,
    scholarlyHeritage: 5,
    merchantNetwork: 5,
    investments: { martial: 0, statecraft: 0, official: 0, hermit: 0 },
    traits: [],
    children: 0,
    spouse: null,
    alive: true,
    ...rest,
    flags: { ...(overrideFlags ?? {}) },
  };
}

export function buildSliceState(sliceId: string): GameState {
  const slice = getWorldProfile().replaySliceConfigs?.find(s => s.id === sliceId);
  if (!slice) {
    throw new Error(`Unknown replay slice: ${sliceId}`);
  }
  return buildStateForSlice(slice);
}

function buildStateForSlice(slice: ReplaySliceConfig): GameState {
  const family = slice.archetypeFamilyId;
  const seedFlags = Object.fromEntries(slice.seedFlags.map(f => [f, true]));

  if (family === P20_MARTIAL_ASCENDANT.id) {
    return {
      player: basePlayer({ age: 15, flags: seedFlags }),
      facts: {},
      flags: { origin_id: 'martial_family', ...seedFlags },
      achievements: [],
      eventHistory: [],
      relations: {},
    };
  }
  if (family === P20_SCHOLAR_STATESMAN.id) {
    return {
      player: basePlayer({ age: 55, knowledge: 70, scholarlyHeritage: 45, flags: seedFlags }),
      facts: {},
      flags: { origin_id: 'scholar_house', ...seedFlags },
      achievements: [],
      eventHistory: [],
      relations: {},
      lifePath: {
        primaryIdentity: 'scholarly',
        faction: 'neutral',
        lifeStage: 'legacy',
        achievements: [],
        relationships: { allies: ['a1'], enemies: [], mentors: ['m1'], disciples: ['d1'] },
        commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
        focus: { martial: 0, business: 0, academic: 1, leadership: 0.2 },
      },
    };
  }
  if (family === P20_DEMONIC_OUTLAW.id) {
    return {
      player: basePlayer({ age: 42, flags: seedFlags }),
      facts: {},
      flags: { origin_id: 'martial_family', ...seedFlags },
      achievements: [],
      eventHistory: [],
      relations: {},
      lifePath: {
        primaryIdentity: 'martial',
        faction: 'evil',
        lifeStage: 'legacy',
        achievements: [],
        relationships: { allies: [], enemies: ['e1'], mentors: [], disciples: [] },
        commitments: { cannotJoin: [], mustProtect: [], swornEnemies: ['e1'] },
        focus: { martial: 1, business: 0, academic: 0, leadership: 0 },
      },
    };
  }
  if (family === P20_WEALTH_MERCHANT.id) {
    return {
      player: basePlayer({ age: 35, money: 1800, merchantNetwork: 40, flags: seedFlags }),
      facts: {},
      flags: { origin_id: 'merchant_house', ...seedFlags },
      achievements: [],
      eventHistory: [],
      relations: {},
      lifePath: {
        primaryIdentity: 'wealth',
        faction: 'neutral',
        lifeStage: 'achievement',
        achievements: [],
        relationships: { allies: ['t1'], enemies: [], mentors: [], disciples: [] },
        commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
        focus: { martial: 0, business: 1, academic: 0, leadership: 0.3 },
      },
    };
  }
  if (family === P20_HERMIT_WITHDRAWAL.id) {
    return {
      player: basePlayer({ age: 62, flags: seedFlags }),
      facts: {},
      flags: { origin_id: 'poor_family', ...seedFlags },
      achievements: [],
      eventHistory: [],
      relations: {},
    };
  }
  throw new Error(`Unhandled archetype family for slice ${slice.id}`);
}

function sliceComponentScores(sliceId: string, state = buildSliceState(sliceId)) {
  const archetype = buildArchetypeCoverageReport(state);
  const pacing = buildWholeLifePacingReport(state);
  const endgame = buildEndgameCategoryReport(state);
  const memory = buildHistoricalMemoryReport(state);

  return {
    archetypeNorm: Math.min(1, archetype.selectedFamily.score / 4),
    pacingNorm: Math.min(1, pacing.pacingMultiplier),
    signalNorm: Math.min(1, archetype.selectedFamily.matchedSignals.length / 5),
    distinctiveNorm: archetype.distinctiveBeyondRouteLabel ? 1 : 0.35,
    endgameNorm: Math.min(1, endgame.selectedCategory.weight / 2),
    memoryNorm: Math.min(
      1,
      memory.activePatterns.length > 0
        ? 0.5 + memory.divergenceScore * 0.3 + memory.activePatterns.length * 0.08
        : 0.35,
    ),
    consequenceNorm: Math.min(
      1,
      (archetype.selectedFamily.matchedSignals.filter(s =>
        ['social', 'legacy', 'growth'].includes(s),
      ).length +
        (state.lifePath?.relationships?.enemies?.length ?? 0) * 0.15) /
        3,
    ),
  };
}

export function scoreSliceExperience(
  sliceId: string,
  dimension?: ExperienceDimension,
): number {
  const state = buildSliceState(sliceId);
  const c = sliceComponentScores(sliceId, state);
  const slice = getWorldProfile().replaySliceConfigs?.find(s => s.id === sliceId);
  const fadePenalty = slice?.seedFlags.includes('fade_legacy') ? 0.22 : 0;
  const lowEngagementPenalty = slice?.seedFlags.includes('low_engagement') ? 0.12 : 0;

  switch (dimension) {
    case 'archetype_strength':
    case 'replay_distinctiveness':
    case 'route_differentiation': {
      const expectedFamily = slice?.archetypeFamilyId;
      const archetype = buildArchetypeCoverageReport(state);
      const candidate = archetype.candidates.find(f => f.familyId === expectedFamily);
      const familyFit = candidate ? Math.min(1, candidate.score / 3.5) : c.archetypeNorm * 0.5;
      return Math.max(
        0,
        familyFit * 0.45 + c.signalNorm * 0.3 + c.distinctiveNorm * 0.25 - fadePenalty - lowEngagementPenalty,
      );
    }
    case 'stage_pacing_health':
      return c.pacingNorm * 0.55 + c.archetypeNorm * 0.2 + c.signalNorm * 0.25;
    case 'mid_late_payoff':
      return c.consequenceNorm * 0.45 + c.signalNorm * 0.3 + c.archetypeNorm * 0.25;
    case 'legacy_resonance':
    case 'endgame_aftertaste': {
      const flags = { ...(state.flags ?? {}), ...(state.player?.flags ?? {}) };
      const transmissionBoost = ['teaching_legacy', 'martial_transmission', 'master_legacy'].some(
        f => flags[f],
      )
        ? 0.18
        : 0;
      return Math.min(
        1,
        c.endgameNorm * 0.3 +
          c.memoryNorm * 0.28 +
          c.archetypeNorm * 0.18 +
          c.signalNorm * 0.12 +
          transmissionBoost -
          fadePenalty -
          lowEngagementPenalty,
      );
    }
    default: {
      const emphasis = slice?.emphasis ?? 'origin_early_growth';
      if (emphasis === 'legacy_endgame_memory') {
        return c.endgameNorm * 0.35 + c.memoryNorm * 0.35 + c.archetypeNorm * 0.2 + c.pacingNorm * 0.1;
      }
      if (emphasis === 'midlife_consequence') {
        return c.consequenceNorm * 0.35 + c.signalNorm * 0.3 + c.pacingNorm * 0.2 + c.archetypeNorm * 0.15;
      }
      return c.archetypeNorm * 0.35 + c.signalNorm * 0.3 + c.pacingNorm * 0.25 + c.distinctiveNorm * 0.1;
    }
  }
}

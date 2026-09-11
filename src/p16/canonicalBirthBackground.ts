import { applyStatModifyEffect } from '../core/statModifySemantics';
import { applyLiveOpsActivationFlags } from '../p22/liveOpsActivation';
import { EffectType } from '../types/eventTypes';
import type { EffectDefinition, GameState, OriginId } from '../types/eventTypes';

export const BIRTH_BACKGROUND_CANDIDATES = [
  'martial_family',
  'scholar_house',
  'merchant_house',
  'frontier_military',
] as const satisfies readonly OriginId[];

export type BirthBackgroundId = (typeof BIRTH_BACKGROUND_CANDIDATES)[number];

export const BIRTH_BACKGROUND_TO_PRIMARY_FLAG: Record<BirthBackgroundId, string> = {
  martial_family: 'origin_wuxia_family',
  scholar_house: 'origin_scholar_family',
  merchant_house: 'origin_merchant_family',
  frontier_military: 'origin_frontier',
};

const PRIMARY_FLAGS = Object.values(BIRTH_BACKGROUND_TO_PRIMARY_FLAG);

const BIRTH_BACKGROUND_EFFECTS: Record<BirthBackgroundId, EffectDefinition[]> = {
  martial_family: [
    { type: EffectType.STAT_MODIFY, target: 'martialPower', value: 5, operator: 'add' },
    { type: EffectType.STAT_MODIFY, target: 'constitution', value: 6, operator: 'add' },
  ],
  scholar_house: [
    { type: EffectType.STAT_MODIFY, target: 'knowledge', value: 8, operator: 'add' },
    { type: EffectType.STAT_MODIFY, target: 'chivalry', value: 4, operator: 'add' },
  ],
  merchant_house: [
    { type: EffectType.WEALTH_CAPACITY_SET, value: 'comfortable_means' },
    { type: EffectType.STAT_MODIFY, target: 'connections', value: 2, operator: 'add' },
    { type: EffectType.STAT_MODIFY, target: 'charisma', value: 6, operator: 'add' },
  ],
  frontier_military: [
    { type: EffectType.STAT_MODIFY, target: 'martialPower', value: 4, operator: 'add' },
    { type: EffectType.STAT_MODIFY, target: 'constitution', value: 4, operator: 'add' },
    { type: EffectType.STAT_MODIFY, target: 'chivalry', value: 2, operator: 'subtract' },
  ],
};

export function isBirthBackgroundId(value: unknown): value is BirthBackgroundId {
  return (BIRTH_BACKGROUND_CANDIDATES as readonly unknown[]).includes(value);
}

export function getCanonicalBirthBackground(state: GameState): BirthBackgroundId | null {
  const fact = state.facts?.birth_background;
  if (isBirthBackgroundId(fact)) return fact;

  return null;
}

/** Explicit compatibility read for states that predate facts.birth_background. */
export function getLegacyBirthBackgroundProjection(state: GameState): BirthBackgroundId | null {
  const mergedFlags = {
    ...(state.flags ?? {}),
    ...(state.player?.flags ?? {}),
  };
  const flaggedBackgrounds = BIRTH_BACKGROUND_CANDIDATES.filter(candidate =>
    Boolean(mergedFlags[BIRTH_BACKGROUND_TO_PRIMARY_FLAG[candidate]]),
  );
  if (flaggedBackgrounds.length === 1) return flaggedBackgrounds[0]!;

  const originId = state.flags?.origin_id ?? state.player?.flags?.origin_id;
  if (isBirthBackgroundId(originId)) return originId;

  return null;
}

export function getBirthBackgroundNarrative(state: GameState): string | null {
  switch (getCanonicalBirthBackground(state)) {
    case 'martial_family':
      return '你出生在武学世家，自幼耳濡目染，拳脚根基比同龄人更扎实。';
    case 'scholar_house':
      return '你生在书香门第，家学渊源让你学识过人，也更重仁义礼法。';
    case 'merchant_house':
      return '你生在商贾之家，家中殷实，你也学会了察言观色与待人接物。';
    case 'frontier_military':
      return '你生在边疆之家，骑射与身法自幼练起，性情也更刚烈自由。';
    default:
      return null;
  }
}

export interface BirthBackgroundResolutionOptions {
  /** Production uses random resolution; debug may explicitly replace it. */
  override?: BirthBackgroundId;
  random?: () => number;
}

function chooseRandomBackground(random: () => number): BirthBackgroundId {
  const value = random();
  const normalized = Number.isFinite(value) ? Math.min(0.999999999, Math.max(0, value)) : 0;
  return BIRTH_BACKGROUND_CANDIDATES[Math.floor(normalized * BIRTH_BACKGROUND_CANDIDATES.length)]!;
}

function projectLegacyOriginFlags(
  state: GameState,
  background: BirthBackgroundId,
): Record<string, any> {
  const nextFlags = {
    ...(state.flags ?? {}),
    ...(state.player?.flags ?? {}),
  };
  for (const flag of PRIMARY_FLAGS) delete nextFlags[flag];
  for (const legacyAlias of [
    'bornInWuxiaFamily',
    'bornInScholarFamily',
    'bornInMerchantFamily',
    'bornInFrontierFamily',
  ]) {
    delete nextFlags[legacyAlias];
  }
  const primaryFlag = BIRTH_BACKGROUND_TO_PRIMARY_FLAG[background];
  nextFlags[primaryFlag] = true;
  nextFlags.origin_id = background;
  return applyLiveOpsActivationFlags(nextFlags, background);
}

/** Resolve and persist the one canonical birth background for a life. */
export function resolveBirthBackground(
  state: GameState,
  options: BirthBackgroundResolutionOptions = {},
): GameState {
  const stored = state.facts?.birth_background;
  if (stored !== undefined) {
    if (!isBirthBackgroundId(stored)) {
      throw new Error(`Invalid canonical birth background: ${String(stored)}`);
    }
    if (options.override !== undefined && options.override !== stored) {
      throw new Error('Birth background has already been resolved');
    }
    const projectedFlags = projectLegacyOriginFlags(state, stored);
    return {
      ...state,
      flags: projectedFlags,
      player: {
        ...state.player,
        flags: projectedFlags,
      },
    };
  }

  const background = options.override ?? chooseRandomBackground(options.random ?? Math.random);
  if (!isBirthBackgroundId(background)) {
    throw new Error(`Invalid birth background override: ${String(background)}`);
  }

  let resolvedState = state;
  for (const effect of BIRTH_BACKGROUND_EFFECTS[background]) {
    if (effect.type === EffectType.STAT_MODIFY) {
      resolvedState = applyStatModifyEffect(effect, resolvedState);
    } else if (effect.type === EffectType.WEALTH_CAPACITY_SET) {
      resolvedState = {
        ...resolvedState,
        player: {
          ...resolvedState.player,
          wealthCapacity: effect.value,
        },
      };
    }
  }
  const nextFlags = projectLegacyOriginFlags(state, background);
  const eventId = BIRTH_BACKGROUND_TO_PRIMARY_FLAG[background];
  const eventRecord = {
    eventId,
    timestamp: state.currentTime
      ? { ...state.currentTime }
      : { year: state.player.age, month: 1, day: 1 },
    age: state.player.age,
  };

  return {
    ...resolvedState,
    facts: {
      ...(resolvedState.facts ?? {}),
      birth_background: background,
    },
    flags: nextFlags,
    player: {
      ...resolvedState.player,
      flags: nextFlags,
      events: [...(resolvedState.player.events ?? []), eventRecord],
    },
  };
}

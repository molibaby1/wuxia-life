import { traitSystem } from './TraitSystem';
import type { EffectDefinition, GameState } from '../types/eventTypes';

const MODIFIABLE_PLAYER_STATS = new Set([
  'age',
  'children',
  'martialPower',
  'chivalry',
  'charisma',
  'constitution',
  'reputation',
  'knowledge',
  'connections',
  'businessAcumen',
  'influence',
  'martialHeritage',
  'scholarlyHeritage',
  'merchantNetwork',
]);

const NON_NEGATIVE_CANONICAL_STATS = new Set([
  'martialPower',
  'constitution',
  'knowledge',
  'connections',
  'reputation',
]);

function clampValue(value: number, statName: string): number {
  if (NON_NEGATIVE_CANONICAL_STATS.has(statName)) {
    return Math.max(0, value);
  }

  if (statName === 'chivalry') {
    return value;
  }

  const ranges: Record<string, [number, number]> = {
    charisma: [0, 100],
  };
  const range = ranges[statName];
  if (!range) return value;
  return Math.max(range[0], Math.min(range[1], value));
}

/** Shared stat_modify semantics used by declarative effects and birth resolution. */
export function applyStatModifyEffect(effect: EffectDefinition, state: GameState): GameState {
  const target = effect.target || effect.stat;
  const { value, operator = 'set', randomRange } = effect;

  if (!target || typeof target !== 'string') {
    console.warn('[StatModifyHandler] 跳过无效属性修改效果:', effect);
    return state;
  }

  let finalValue = value;
  if (randomRange) {
    finalValue = Math.floor(
      Math.random() * (randomRange.maxValue - randomRange.minValue + 1)
      + randomRange.minValue,
    );
  }

  if (!MODIFIABLE_PLAYER_STATS.has(target)) {
    return state;
  }

  const rawCurrentValue = (state.player as any)[target];
  const currentValue = rawCurrentValue ?? 0;
  let adjustedValue = finalValue;
  if (operator === 'add' && adjustedValue > 0) {
    const multiplier = traitSystem.getGrowthMultiplier(state.player, target);
    adjustedValue = Math.max(1, Math.round(adjustedValue * multiplier));
  }

  let newValue: number;
  switch (operator) {
    case 'add':
      newValue = currentValue + adjustedValue;
      break;
    case 'subtract':
      newValue = currentValue - adjustedValue;
      break;
    case 'multiply':
      newValue = currentValue * adjustedValue;
      break;
    case 'divide':
      newValue = adjustedValue === 0 ? currentValue : Math.floor(currentValue / adjustedValue);
      break;
    default:
      newValue = adjustedValue;
  }

  return {
    ...state,
    player: {
      ...state.player,
      [target]: clampValue(newValue, target),
    },
  };
}

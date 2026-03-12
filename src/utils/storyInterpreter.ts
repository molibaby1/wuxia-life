import type { Condition, Effect, PlayerState } from '../types';

export function evaluateCondition(condition: Condition, state: PlayerState): boolean {
  switch (condition.op) {
    case 'eq':
      return state[condition.field!] === condition.value;
    case 'ne':
      return state[condition.field!] !== condition.value;
    case 'gt':
      return (state[condition.field!] as number) > condition.value;
    case 'gte':
      return (state[condition.field!] as number) >= condition.value;
    case 'lt':
      return (state[condition.field!] as number) < condition.value;
    case 'lte':
      return (state[condition.field!] as number) <= condition.value;
    case 'hasFlag':
      return state.flags.has(condition.value as string);
    case 'hasEvent':
      return state.events.has(condition.value as string);
    case 'not':
      return !evaluateCondition(condition.conditions![0], state);
    case 'and':
      return condition.conditions!.every(c => evaluateCondition(c, state));
    case 'or':
      return condition.conditions!.some(c => evaluateCondition(c, state));
    case 'random':
      return Math.random() < condition.value;
    default:
      return true;
  }
}

export function applyEffects(effects: Effect[], state: PlayerState): Partial<PlayerState> {
  const updates: Partial<PlayerState> = {};
  
  for (const effect of effects) {
    if (effect.condition && !evaluateCondition(effect.condition, state)) {
      continue;
    }
    
    switch (effect.op) {
      case 'set':
        if (effect.field) {
          updates[effect.field] = effect.value;
        }
        break;
      case 'add':
        if (effect.field) {
          const current = (state[effect.field] as number) || 0;
          updates[effect.field] = current + effect.value;
        }
        break;
      case 'sub':
        if (effect.field) {
          const current = (state[effect.field] as number) || 0;
          updates[effect.field] = Math.max(0, current - effect.value);
        }
        break;
      case 'min':
        if (effect.field) {
          const current = (state[effect.field] as number) || 0;
          updates[effect.field] = Math.max(effect.value, current);
        }
        break;
      case 'addFlag':
        if (!updates.flags) {
          updates.flags = new Set();
        }
        (updates.flags as Set<string>).add(effect.value);
        break;
      case 'addEvent':
        if (!updates.events) {
          updates.events = new Set();
        }
        (updates.events as Set<string>).add(effect.value);
        break;
      case 'clearFlags':
        updates.flags = new Set();
        break;
      case 'clearEvents':
        updates.events = new Set();
        break;
      case 'randomAge':
        const addAge = Math.floor(Math.random() * (effect.maxValue - effect.minValue + 1)) + effect.minValue;
        updates.age = state.age + addAge;
        break;
    }
    
    if (effect.effects) {
      const nestedUpdates = applyEffects(effect.effects, state);
      Object.assign(updates, nestedUpdates);
    }
  }
  
  return updates;
}

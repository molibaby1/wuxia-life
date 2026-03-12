/**
 * 条件评估器
 * 用于评估事件条件
 */

import type { Condition, PlayerState } from '../types';

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

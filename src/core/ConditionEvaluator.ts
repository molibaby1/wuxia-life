/**
 * 条件评估器实现
 * 
 * 设计原则：
 * - 安全的表达式解析：使用安全的解析方式，避免 eval
 * - 可扩展：支持动态添加新的条件处理器
 * - 高性能：缓存解析结果，提高评估速度
 * 
 * @version 1.0.0
 * @since 2026-03-12
 */

import type {
  EventCondition,
  GameState,
  IConditionEvaluator,
  PlayerLifeStates,
} from '../types/eventTypes';
import { readPlayerNumeric } from '../utils/playerStatAccess';

export type Condition = EventCondition;

interface CustomHandlerCondition {
  type: 'custom';
  handler: string;
  params: Record<string, unknown>;
}

interface CompositeCondition {
  op: 'and' | 'or' | 'not';
  conditions?: EventCondition[];
  condition?: EventCondition;
}

type EvaluatorCondition = EventCondition | CustomHandlerCondition | CompositeCondition;

/**
 * 条件评估器实现
 */
export class ConditionEvaluator implements IConditionEvaluator {
  private handlers: Map<string, CustomConditionHandler>;
  private cache: Map<string, boolean>;
  static readonly DIRECT_PLAYER_PROPERTIES = new Set([
    'age',
    'martialPower',
    'externalSkill',
    'internalSkill',
    'qinggong',
    'constitution',
    'charisma',
    'comprehension',
    'chivalry',
    'reputation',
    'connections',
    'money',
    'knowledge',
    'businessAcumen',
    'influence',
    'wealth',
    'health',
    'energy',
  ]);
  
  constructor() {
    this.handlers = new Map();
    this.cache = new Map();
    this.registerDefaultHandlers();
  }
  
  /**
   * 评估条件
   */
  evaluate(condition: EventCondition, state: GameState): boolean {
    if (condition.type === 'expression') {
      return this.evaluateExpression(condition.expression, state);
    }
    const customCond = condition as unknown as CustomHandlerCondition;
    if (customCond.type === 'custom' && customCond.handler) {
      const handler = this.handlers.get(customCond.handler);
      if (!handler) {
        console.warn(`Unknown condition handler: ${customCond.handler}`);
        return false;
      }
      return handler.evaluate(customCond.params || {}, state);
    }
    console.warn(`Unknown condition type: ${(condition as { type: string }).type}`);
    return false;
  }
  
  /**
   * 评估表达式
   */
  private evaluateExpression(expression: string, state: GameState): boolean {
    // 检查缓存
    const cacheKey = `${expression}_${this.getStateHash(state)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // 解析并评估表达式
    let result = false;
    try {
      result = this.parseAndEvaluate(expression, state);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`[ConditionEvaluator] Expression rejected "${expression}": ${reason}`);
      result = false;
    }
    
    // 缓存结果
    this.cache.set(cacheKey, result);
    
    return result;
  }
  
  /**
   * 解析并评估表达式
   */
  private parseAndEvaluate(expression: string, state: GameState): boolean {
    const normalized = expression.trim();
    if (!normalized) {
      throw new Error('Empty expression');
    }

    const parser = new ConditionExpressionParser(normalized, state);
    return parser.evaluate();
  }
  
  /**
   * 获取状态哈希（用于缓存）
   */
  private getStateHash(state: GameState): string {
    const playerSlice: Record<string, unknown> = {};
    for (const key of ConditionEvaluator.DIRECT_PLAYER_PROPERTIES) {
      playerSlice[key] = readPlayerNumeric(state.player, key);
    }
    return JSON.stringify({
      player: playerSlice,
      lifeStates: state.player?.lifeStates || {},
      flags: state.flags,
      playerFlags: state.player?.flags || {},
      triggeredEvents: state.triggeredEvents,
      eventHistory: (state.eventHistory || []).map(entry => entry.eventId),
    });
  }
  
  /**
   * 注册默认处理器
   */
  private registerDefaultHandlers() {
    // 注册年龄检查处理器
    this.handlers.set('age_check', {
      evaluate: (params, state) => {
        const { min, max } = params || {};
        const age = state.player.age;
        const minValue = typeof min === 'number' && Number.isFinite(min) ? min : undefined;
        const maxValue = typeof max === 'number' && Number.isFinite(max) ? max : undefined;

        if (min !== undefined && minValue === undefined) return false;
        if (max !== undefined && maxValue === undefined) return false;
        
        if (minValue !== undefined && age < minValue) return false;
        if (maxValue !== undefined && age > maxValue) return false;
        
        return true;
      },
    });
    
    // 注册属性检查处理器
    this.handlers.set('stat_check', {
      evaluate: (params, state) => {
        const { stat, min, max } = params || {};
        if (typeof stat !== 'string') return false;
        const minValue = typeof min === 'number' && Number.isFinite(min) ? min : undefined;
        const maxValue = typeof max === 'number' && Number.isFinite(max) ? max : undefined;
        if (min !== undefined && minValue === undefined) return false;
        if (max !== undefined && maxValue === undefined) return false;
        const value = readPlayerNumeric(state.player, stat);
        
        if (minValue !== undefined && value < minValue) return false;
        if (maxValue !== undefined && value > maxValue) return false;
        
        return true;
      },
    });
    
    // 注册 Flag 检查处理器
    this.handlers.set('flag_check', {
      evaluate: (params, state) => {
        const { flag, has } = params || {};
        if (typeof flag !== 'string') return false;
        if (has !== undefined && typeof has !== 'boolean') return false;
        const hasFlag = !!state.flags[flag];
        
        return has === true ? hasFlag : !hasFlag;
      },
    });
  }
  
  /**
   * 注册自定义处理器
   */
  registerHandler(name: string, handler: CustomConditionHandler) {
    this.handlers.set(name, handler);
  }
  
  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }
}

type TokenType = 'identifier' | 'number' | 'string' | 'boolean' | 'operator' | 'paren' | 'eof';

interface Token {
  type: TokenType;
  value: string;
  position: number;
}

class ConditionExpressionParser {
  private readonly tokens: Token[];
  private index = 0;

  constructor(
    private readonly expression: string,
    private readonly state: GameState,
  ) {
    this.tokens = this.tokenize(expression);
  }

  evaluate(): boolean {
    const value = this.parseExpression();
    const remaining = this.current();
    if (remaining.type !== 'eof') {
      throw this.error(`Unexpected token "${remaining.value}"`, remaining.position);
    }
    return this.toBoolean(value);
  }

  private tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < input.length) {
      const ch = input[i];
      if (/\s/.test(ch)) {
        i += 1;
        continue;
      }

      const twoCharOp = input.slice(i, i + 2);
      if (['>=', '<=', '==', '!=', '&&', '||'].includes(twoCharOp)) {
        tokens.push({ type: 'operator', value: twoCharOp, position: i });
        i += 2;
        continue;
      }

      if (['>', '<', '!'].includes(ch)) {
        tokens.push({ type: 'operator', value: ch, position: i });
        i += 1;
        continue;
      }

      if (ch === '(' || ch === ')') {
        tokens.push({ type: 'paren', value: ch, position: i });
        i += 1;
        continue;
      }

      if (ch === "'" || ch === '"') {
        const quote = ch;
        const start = i;
        i += 1;
        let value = '';
        while (i < input.length) {
          const current = input[i];
          if (current === '\\') {
            if (i + 1 >= input.length) {
              throw this.error('Unterminated string literal', start);
            }
            value += input[i + 1];
            i += 2;
            continue;
          }
          if (current === quote) {
            i += 1;
            break;
          }
          value += current;
          i += 1;
        }
        if (i > input.length || input[i - 1] !== quote) {
          throw this.error('Unterminated string literal', start);
        }
        tokens.push({ type: 'string', value, position: start });
        continue;
      }

      if (ch === '-' && i + 1 < input.length && /[0-9]/.test(input[i + 1])) {
        const start = i;
        i += 1;
        while (i < input.length && /[0-9.]/.test(input[i])) {
          i += 1;
        }
        const value = input.slice(start, i);
        if (!/^-\d+(\.\d+)?$/.test(value)) {
          throw this.error(`Invalid number literal "${value}"`, start);
        }
        tokens.push({ type: 'number', value, position: start });
        continue;
      }

      if (/[0-9]/.test(ch)) {
        const start = i;
        i += 1;
        while (i < input.length && /[0-9.]/.test(input[i])) {
          i += 1;
        }
        const value = input.slice(start, i);
        if (!/^\d+(\.\d+)?$/.test(value)) {
          throw this.error(`Invalid number literal "${value}"`, start);
        }
        tokens.push({ type: 'number', value, position: start });
        continue;
      }

      if (/[A-Za-z_]/.test(ch)) {
        const start = i;
        i += 1;
        while (i < input.length && /[A-Za-z0-9_.]/.test(input[i])) {
          i += 1;
        }
        const raw = input.slice(start, i);
        const upperRaw = raw.toUpperCase();
        if (upperRaw === 'AND' || upperRaw === 'OR' || upperRaw === 'NOT') {
          tokens.push({
            type: 'operator',
            value: upperRaw === 'AND' ? '&&' : upperRaw === 'OR' ? '||' : '!',
            position: start,
          });
          continue;
        }
        if (raw === 'true' || raw === 'false') {
          tokens.push({ type: 'boolean', value: raw, position: start });
          continue;
        }
        tokens.push({ type: 'identifier', value: raw, position: start });
        continue;
      }

      throw this.error(`Invalid token "${ch}"`, i);
    }

    tokens.push({ type: 'eof', value: '<eof>', position: input.length });
    return tokens;
  }

  private parseExpression(): unknown {
    return this.parseOr();
  }

  private parseOr(): unknown {
    let left = this.parseAnd();
    while (this.matchOperator('||')) {
      const right = this.parseAnd();
      left = this.toBoolean(left) || this.toBoolean(right);
    }
    return left;
  }

  private parseAnd(): unknown {
    let left = this.parseUnary();
    while (this.matchOperator('&&')) {
      const right = this.parseUnary();
      left = this.toBoolean(left) && this.toBoolean(right);
    }
    return left;
  }

  private parseUnary(): unknown {
    if (this.matchOperator('!')) {
      return !this.toBoolean(this.parseUnary());
    }
    return this.parsePrimary();
  }

  private parsePrimary(): unknown {
    if (this.matchParen('(')) {
      const value = this.parseExpression();
      this.consumeParen(')', 'Expected ")"');
      return value;
    }
    return this.parsePredicate();
  }

  private parsePredicate(): unknown {
    const left = this.parseOperandOrQuery();
    const operator = this.current();
    if (operator.type === 'operator' && ['>', '>=', '<', '<=', '==', '!='].includes(operator.value)) {
      this.advance();
      const right = this.parseOperandOrQuery();
      return this.compare(left, right, operator.value);
    }
    return left;
  }

  private parseOperandOrQuery(): unknown {
    const token = this.current();
    if (token.type === 'number') {
      this.advance();
      return Number(token.value);
    }
    if (token.type === 'string') {
      this.advance();
      return token.value;
    }
    if (token.type === 'boolean') {
      this.advance();
      return token.value === 'true';
    }
    if (token.type !== 'identifier') {
      throw this.error(`Expected operand, got "${token.value}"`, token.position);
    }
    this.advance();
    return this.resolveIdentifier(token);
  }

  private resolveIdentifier(token: Token): unknown {
    const identifier = token.value;

    if (identifier === 'flags.has' || identifier === 'events.has') {
      this.consumeParen('(', `Expected "(" after ${identifier}`);
      const argument = this.current();
      if (argument.type !== 'string') {
        throw this.error(`${identifier} requires a string literal argument`, argument.position);
      }
      this.advance();
      this.consumeParen(')', `Expected ")" after ${identifier} argument`);
      return identifier === 'flags.has'
        ? this.hasFlag(argument.value)
        : this.hasEvent(argument.value);
    }

    if (identifier.startsWith('player.')) {
      const property = identifier.slice('player.'.length);
      return this.resolvePlayerProperty(property, token.position);
    }

    if (identifier.startsWith('lifeStates.')) {
      const property = identifier.slice('lifeStates.'.length);
      this.assertSafeProperty(property, token.position);
      return this.state.player?.lifeStates?.[property as keyof typeof this.state.player.lifeStates] ?? 0;
    }

    if (identifier.startsWith('flags.')) {
      const flagKey = identifier.slice('flags.'.length);
      this.assertSafeProperty(flagKey, token.position);
      return this.hasFlag(flagKey);
    }

    if (identifier.includes('.')) {
      throw this.error(`Unsupported property access "${identifier}"`, token.position);
    }

    if (ConditionEvaluator.DIRECT_PLAYER_PROPERTIES.has(identifier)) {
      return readPlayerNumeric(this.state.player, identifier);
    }

    throw this.error(`Unsupported property "${identifier}"`, token.position);
  }

  private compare(left: unknown, right: unknown, operator: string): boolean {
    switch (operator) {
      case '>':
        return Number(left) > Number(right);
      case '>=':
        return Number(left) >= Number(right);
      case '<':
        return Number(left) < Number(right);
      case '<=':
        return Number(left) <= Number(right);
      case '==':
        return left == right;
      case '!=':
        return left != right;
      default:
        throw this.error(`Unsupported comparison operator "${operator}"`);
    }
  }

  private hasFlag(flagName: string): boolean {
    return !!this.state.flags?.[flagName] || !!this.state.player?.flags?.[flagName];
  }

  private hasEvent(eventId: string): boolean {
    if ((this.state.triggeredEvents || []).includes(eventId)) {
      return true;
    }
    const history = this.state.eventHistory || [];
    if (history.some(entry => entry.eventId === eventId)) {
      return true;
    }
    const choiceRecords = this.state.player?.events || [];
    return choiceRecords.some(entry => entry.eventId === eventId);
  }

  private assertSafeProperty(property: string, position: number) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(property)) {
      throw this.error(`Unsupported property access "${property}"`, position);
    }
  }

  private resolvePlayerProperty(property: string, position: number): unknown {
    if (property.startsWith('lifeStates.')) {
      const lifeStateKey = property.slice('lifeStates.'.length);
      this.assertSafeProperty(lifeStateKey, position);
      return this.state.player?.lifeStates?.[lifeStateKey as keyof PlayerLifeStates] ?? 0;
    }

    this.assertSafeProperty(property, position);
    const playerRecord = this.state.player as unknown as Record<string, unknown>;
    return playerRecord[property];
  }

  private toBoolean(value: unknown): boolean {
    return Boolean(value);
  }

  private matchOperator(operator: string): boolean {
    const token = this.current();
    if (token.type === 'operator' && token.value === operator) {
      this.advance();
      return true;
    }
    return false;
  }

  private matchParen(value: '(' | ')'): boolean {
    const token = this.current();
    if (token.type === 'paren' && token.value === value) {
      this.advance();
      return true;
    }
    return false;
  }

  private consumeParen(value: '(' | ')', message: string) {
    if (!this.matchParen(value)) {
      const token = this.current();
      throw this.error(message, token.position);
    }
  }

  private current(): Token {
    return this.tokens[this.index];
  }

  private advance(): Token {
    const token = this.tokens[this.index];
    if (this.index < this.tokens.length - 1) {
      this.index += 1;
    }
    return token;
  }

  private error(reason: string, position?: number): Error {
    const prefix = position === undefined ? '' : `at ${position}: `;
    return new Error(`${prefix}${reason}`);
  }
}

/**
 * 自定义条件处理器接口
 */
export interface CustomConditionHandler {
  evaluate(params: Record<string, unknown>, state: GameState): boolean;
}

/**
 * 复合条件评估器（支持 AND/OR/NOT）
 */
export class CompositeConditionEvaluator implements IConditionEvaluator {
  private baseEvaluator: ConditionEvaluator;
  
  constructor(baseEvaluator?: ConditionEvaluator) {
    this.baseEvaluator = baseEvaluator || new ConditionEvaluator();
  }
  
  evaluate(condition: EventCondition, state: GameState): boolean {
    // 如果是简单条件，直接评估
    if (condition.type === 'expression') {
      return this.baseEvaluator.evaluate(condition, state);
    }

    const compositeCond = condition as unknown as CompositeCondition;
    if (compositeCond.op === 'and' && compositeCond.conditions) {
      return compositeCond.conditions.every(c => this.evaluate(c, state));
    }

    if (compositeCond.op === 'or' && compositeCond.conditions) {
      return compositeCond.conditions.some(c => this.evaluate(c, state));
    }

    if (compositeCond.op === 'not' && compositeCond.condition) {
      return !this.evaluate(compositeCond.condition, state);
    }

    // 默认调用基础评估器
    return this.baseEvaluator.evaluate(condition, state);
  }
}

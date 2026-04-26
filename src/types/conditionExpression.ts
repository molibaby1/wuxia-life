import type { PlayerState } from './eventTypes';

/**
 * P1 条件表达式（Condition Expression）语法版本。
 * 当前作为白名单语法的文档化类型入口，后续受控解析器（US-017）应以此为准实现。
 */
export const CONDITION_EXPRESSION_GRAMMAR_VERSION = 'p1-v1' as const;

/**
 * 当前允许的 player 属性访问键。
 */
export type ConditionPlayerProperty = keyof PlayerState;

/**
 * 当前允许的比较运算符。
 */
export type ConditionComparisonOperator = '>' | '>=' | '<' | '<=' | '==' | '!=';

/**
 * 当前允许的逻辑运算符（支持符号和关键字别名）。
 */
export type ConditionLogicOperator = '&&' | '||' | '!' | 'AND' | 'OR' | 'NOT';

/**
 * 条件表达式载体类型。
 * 说明：表达式在数据层仍以 string 存储，但语义必须遵循本文件定义的语法白名单。
 */
export type ConditionExpression = string;

/**
 * 条件表达式支持的原子能力（用于文档化与测试枚举）。
 */
export interface ConditionExpressionCapabilities {
  playerPropertyAccess: 'player.<property>' | '<property>';
  flagQuery: "flags.has('flag_name')";
  eventQuery: "events.has('event_id')";
  comparisonOperators: ConditionComparisonOperator[];
  logicOperators: ConditionLogicOperator[];
  parentheses: true;
}

export const SUPPORTED_CONDITION_EXPRESSION_CAPABILITIES: ConditionExpressionCapabilities = {
  playerPropertyAccess: 'player.<property>',
  flagQuery: "flags.has('flag_name')",
  eventQuery: "events.has('event_id')",
  comparisonOperators: ['>', '>=', '<', '<=', '==', '!='],
  logicOperators: ['&&', '||', '!', 'AND', 'OR', 'NOT'],
  parentheses: true,
};

/**
 * 明确列出的不支持语法。出现以下语法时应视为非法表达式。
 */
export const UNSUPPORTED_CONDITION_EXPRESSION_SYNTAX = [
  'assignment operators (=, +=, -=, *=, /=, %=)',
  'bitwise operators (&, |, ^, ~, <<, >>, >>>)',
  'ternary operator (condition ? a : b)',
  'array/object literals ([...], {...})',
  'template literals (`...`)',
  'new / this / class / function keywords',
  'global object access (window, globalThis, process, console, Math, Date)',
  'arbitrary function calls (except flags.has(...) and events.has(...))',
  'member chaining outside whitelist (e.g. player.__proto__, flags.constructor)',
] as const;

export type ConditionExpressionErrorCode =
  | 'EMPTY_EXPRESSION'
  | 'INVALID_TOKEN'
  | 'UNSUPPORTED_SYNTAX'
  | 'UNSUPPORTED_PROPERTY_ACCESS'
  | 'UNBALANCED_PARENTHESES'
  | 'EVALUATION_FAILED';

/**
 * 非法表达式的统一错误结构定义。
 */
export interface ConditionExpressionError {
  code: ConditionExpressionErrorCode;
  expression: string;
  message: string;
  position?: number;
  token?: string;
}

/**
 * P1 目标语法（EBNF 近似定义，用于实现与测试对齐）。
 */
export const CONDITION_EXPRESSION_EBNF = `
Expression   ::= OrExpr ;
OrExpr       ::= AndExpr ( ("||" | "OR") AndExpr )* ;
AndExpr      ::= UnaryExpr ( ("&&" | "AND") UnaryExpr )* ;
UnaryExpr    ::= ( "!" | "NOT" ) UnaryExpr | Primary ;
Primary      ::= "(" Expression ")" | Predicate ;
Predicate    ::= Operand ComparisonOp Operand | FlagQuery | EventQuery | Operand ;
Operand      ::= PlayerProperty | DirectPlayerProperty | NumberLiteral | BooleanLiteral | StringLiteral ;
PlayerProperty ::= "player." Identifier ;
DirectPlayerProperty ::= Identifier ;
FlagQuery    ::= "flags.has(" StringLiteral ")" ;
EventQuery   ::= "events.has(" StringLiteral ")" ;
ComparisonOp ::= ">" | ">=" | "<" | "<=" | "==" | "!=" ;
`.trim();

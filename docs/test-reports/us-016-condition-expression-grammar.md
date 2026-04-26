# US-016 Condition Expression Grammar

This document defines the explicit P1 condition expression grammar used by event and choice conditions.
The purpose is to make condition evaluation safe, testable, and diagnosable.

## 1. Supported Syntax

Supported capabilities:

- Property access:
  - `player.<property>` (for example: `player.age`, `player.martialPower`)
  - direct player stat/property token (for example: `age`, `martialPower`) as compatibility shorthand
- Flag query:
  - `flags.has('flag_name')`
- Event query:
  - `events.has('event_id')`
- Comparison operators:
  - `>`, `>=`, `<`, `<=`, `==`, `!=`
- Logic operators:
  - symbol form: `&&`, `||`, `!`
  - keyword aliases: `AND`, `OR`, `NOT`
- Parentheses:
  - standard grouping with `(` and `)`

## 2. Grammar (EBNF)

```text
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
```

Type-level source of truth:

- `src/types/conditionExpression.ts`

## 3. Unsupported Syntax

The following syntax is explicitly unsupported and must be treated as invalid:

- assignment operators (`=`, `+=`, `-=`, `*=`, `/=`, `%=`)
- bitwise operators (`&`, `|`, `^`, `~`, `<<`, `>>`, `>>>`)
- ternary operator (`condition ? a : b`)
- array/object literals (`[...]`, `{...}`)
- template literals (`` `...` ``)
- `new`, `this`, `class`, `function` keywords
- global object access (`window`, `globalThis`, `process`, `console`, `Math`, `Date`)
- arbitrary function calls (anything other than `flags.has(...)` and `events.has(...)`)
- member chaining outside whitelist (for example `player.__proto__`, `flags.constructor`)

## 4. Invalid Expression Error Behavior

Invalid expression handling contract (P1):

- Evaluator should fail closed: invalid expression evaluates to `false`
- Error payload should contain:
  - `code` (machine-readable error code)
  - `expression` (original expression text)
  - `message` (human-readable reason)
  - optional `position` and `token` for diagnostics
- Baseline error code set:
  - `EMPTY_EXPRESSION`
  - `INVALID_TOKEN`
  - `UNSUPPORTED_SYNTAX`
  - `UNSUPPORTED_PROPERTY_ACCESS`
  - `UNBALANCED_PARENTHESES`
  - `EVALUATION_FAILED`

The above error shape is reflected in:

- `ConditionExpressionError` and related types in `src/types/conditionExpression.ts`

# PRD: P125 Wuxia Full Stats Panel Martial Role Clarification

> **Derived from:** `docs/PRD/p121-wuxia-experience-optimization-growth-feedback-and-merchant-adolescence.md`
> **Supporting analysis:** `docs/test-reports/2026-06-30-martial-attribute-simplification-analysis.md`, `docs/designs/p7-attribute-visibility-tiers.md`
> **Stage slug:** `p125-wuxia-full-stats-panel-martial-role-clarification`
> **Stage type:** explanation-layer cleanup after main-screen narrowing

## 1. Introduction

P123、P124 解决的是“第一眼看什么”的问题。P125 才处理“点开完整属性后，玩家怎么理解这些武功细分到底各干什么”。

这个阶段不做减字段，不做数值迁移，只做一件事：

**把完整属性页里的武功相关说明写清楚主次职责，避免玩家继续把五项都当成同级主成长轴。**

## 2. Goals

- 明确 `martialPower` 是总读数
- 明确 `externalSkill` / `internalSkill` / `qinggong` 是风格或特长细分
- 明确 `constitution` 更接近生存底子
- 让完整属性页承担“解释职责”，而不是继续制造混乱

## 3. Core Problem

即使第一屏收敛了，如果完整属性页仍然把五项武功相关数值并排呈现、描述也都像一级主轴，玩家仍然会得到同样的错觉：

- 每一项都像必须盯着涨
- 但又不知道哪个才代表“我整体变强了”

所以 P125 的任务不是减少数据，而是**把解释层整理明白**。

## 4. Scope

### In Scope

- 只改完整属性页中的分组、排序、说明文案
- 允许把 `constitution` 从“战斗”语义中适度抽离
- 允许调整 group label，使主次更明确

### Out of Scope

- 不改第一屏主显
- 不改 `tendencySummary`
- 不删字段
- 不改事件逻辑
- 不改属性值计算

## 5. User Stories

### US-001: Clarify what the overall martial readout is

**Description:** As a player, I want the full panel to tell me which value is my overall martial readout, so I stop treating every combat-related number as equal.

**Acceptance Criteria:**

- [ ] 完整属性页能明确读出 `martialPower` 是综合武学总读数
- [ ] 玩家不会把 `externalSkill` / `internalSkill` / `qinggong` 再误解成与总读数完全同级

### US-002: Clarify which martial stats are specialization-style dimensions

**Description:** As a player, I want to understand which combat stats are style/specialization dimensions, so they feel like flavorful differentiation instead of mandatory co-primary bars.

**Acceptance Criteria:**

- [ ] `externalSkill`、`internalSkill`、`qinggong` 的文案更接近风格/特长解释
- [ ] 不再让这些字段同时承担“总战力说明”职责

### US-003: Separate survival base from combat specialization

**Description:** As a player, I want 体魄 to read like survival foundation rather than one more martial technique branch.

**Acceptance Criteria:**

- [ ] `constitution` 的位置或文案更贴近生存/恢复/承伤底子
- [ ] 不再默认和外功/内功/轻功一起被理解为武学细分三兄弟

## 6. Functional Requirements

- FR-1: 完整属性页必须保留所有现有武功相关字段。
- FR-2: `martialPower` 必须被表达为综合武学总读数。
- FR-3: `externalSkill`、`internalSkill`、`qinggong` 必须被表达为细分/特长/风格维度。
- FR-4: `constitution` 必须被表达为生存底子，而不是纯武学分支。
- FR-5: 本轮只允许展示解释层修改，不允许数值系统改动。

## 7. Non-Goals

- 不做字段合并
- 不做属性移除
- 不改事件条件
- 不改成长奖励
- 不做新帮助系统

## 8. Likely Touchpoints

- `src/components/MainScreenStatsPanel.vue`
- `src/components/mainScreenModel.ts`

## 9. Verification Standard

- 完整属性页对武功相关字段的主次职责解释更清楚
- 玩家能读懂“总读数 vs 细分风格 vs 生存底子”
- 不影响现有属性可见性和完整性

## 10. Recommended Execution Order

1. 先明确 `martialPower` 的总读数文案
2. 再重写武功细分字段说明
3. 最后处理 `constitution` 的归位表达


# P119 Validation Shape — Founding Patriarch Endgame Implementation

> **Date:** 2026-07-02
> **Source:** P118 Founding Patriarch Endgame Design-First
> **Target stage:** P119 Founding Patriarch Endgame Playable Implementation
> **Route:** `founding_patriarch`（开派祖师）
> **Contract:** `docs/PRD/p118-founding-patriarch-endgame-contract.md`
> **Status:** Not skipped — GO verdict from P118-003

---

## 1. Purpose

本文件定义 P119（endgame implementation 阶段）的验证形状：targeted proof 需要展示哪些链路节点、regression tests 至少覆盖哪些断言、什么证据算 endgame closed。目的是在 implementation 开始前就锁定验证标准。

本验证形状基于 P80→P81 renown endgame 验证模式，并参考 P117 founding-patriarch late-life 测试实践。

---

## 2. Targeted Proof Chain

### 2.1 Chain Nodes Overview

| # | Node | Type | Verification Point |
|---|------|------|-------------------|
| 1 | **Scholar + faction commitment** | P16/P22 | `p16_scholar_mentor` + `p22_faction_continuation_active` |
| 2 | **Founding-patriarch entry reached** | P113 | `founding_patriarch_bridge_entry` fires |
| 3 | **On-ramp checkpoint** | P113 | `founding_patriarch_on_ramp_done` |
| 4 | **Pressure event fires** | P115 | `founding_patriarch_midlife_pressure` |
| 5 | **Payoff event fires** | P113 | `founding_patriarch_payoff_echo` |
| 6 | **Late-life event fires** | P117 | `founding_patriarch_late_life_*` at age 52–56 |
| 7 | **Late-life checkpoint** | P117 | `founding_patriarch_late_life_done` + late-life marker |
| 8 | **Pre-endgame expression** | baseline | cost label / goal reflect late-life branch |
| 9 | **Pre-endgame state** | baseline | `late_life_done` = true, `endgame_echo_done` = false |
| 10 | **Endgame event fires** | **P119 core** | `founding_patriarch_endgame_echo_*` at age 60–65 |
| 11 | **Endgame checkpoint set** | **P119 core** | `founding_patriarch_endgame_echo_done` = true |
| 12 | **Endgame identity done** | **P119 core** | `founding_patriarch_endgame_identity_done` = true |
| 13 | **Endgame branch marker set** | **P119 core** | matching `founding_patriarch_endgame_*` set |
| 14 | **Endgame expression — cost label** | **P119 core** | cost label reflects endgame branch |
| 15 | **Endgame expression — current goal** | **P119 core** | goal reflects endgame branch |
| 16 | **Endgame expression — identity** | **P119 core** | identity reflects endgame branch |

### 2.2 Core Nodes (Must Show)

必须展示的核心节点（P0）：

1. **节点 9:** Pre-endgame state (late-life done, endgame not done)
2. **节点 10:** Endgame event fires at correct age
3. **节点 11:** Checkpoint flag set
4. **节点 13:** Branch marker traceable to late-life marker
5. **节点 14:** Cost label endgame update (per branch)
6. **节点 15:** Current goal endgame update (per branch)

共 6 个核心节点。**每个 late-life branch 方向至少 1 条 proof path**（2 paths minimum for branches A/B）。

Bonus: 节点 16 identity update；至少 1 条 on-ramp variant 叠加 endgame branch。

### 2.3 Branch Path Requirements

| Branch | Minimum Proof Path | Key Assertions |
|--------|-------------------|----------------|
| A: 门规守成 | Scholar on-ramp → pressure rule_first → payoff → late-life rule_keeper → endgame rule_echo | `endgame_rule_echo` + cost/goal 开派终局·规 |
| B: 盟约续责 | Alliance on-ramp → pressure alliance_first → payoff → late-life alliance_bearer → endgame alliance_echo | `endgame_alliance_echo` + cost/goal 开派终局·盟 |

### 2.4 No Full Lifetime Exhaust Required

**不需要：**
- Full birth-to-death 穷举
- 多种子组合爆炸
- Stat 阈值边界测试
- `gate:p20` broad rerun
- 2×3 pressure×payoff×late-life×endgame identity 全矩阵

只需要 targeted proof：2 条 endgame branch paths + 至少 1 条 on-ramp variant 叠加。

---

## 3. Regression Tests

### 3.1 P119 New Tests (`tests/p119FoundingPatriarchEndgameTests.ts`)

#### Group 1: Endgame Event Wiring

| # | Assertion | Priority |
|---|-----------|----------|
| R1 | `founding_patriarch_endgame_echo_*` 存在于 `sample-lines-spine.json` | P0 |
| R2 | 事件类型是 **auto**（非 choice） | P0 |
| R3 | 触发条件包含 `founding_patriarch_late_life_done` | P0 |
| R4 | 年龄范围 60–65 | P0 |
| R5 | 2 个条件分支存在（keyed on late-life marker） | P0 |
| R6 | 所有分支设置 `founding_patriarch_endgame_echo_done` | P0 |
| R7 | 所有分支设置 `founding_patriarch_endgame_identity_done` | P0 |
| R8 | 各分支设置对应 `founding_patriarch_endgame_*` marker | P0 |
| R9 | 各分支互斥（不可同时设多个 endgame marker） | P0 |
| R10 | Endgame 不 unset `founding_patriarch_late_life_done` | P0 |
| R11 | Endgame 无 stat 变化 | P0 |

#### Group 2: Pre-Endgame Expression

| # | Assertion | Priority |
|---|-----------|----------|
| R12 | Late-life done 但 endgame 未 done 时，cost label 是 late-life branch label | P0 |
| R13 | Late-life done 但 endgame 未 done 时，goal 是 late-life branch state | P0 |

#### Group 3: Post-Endgame Expression (per branch)

| # | Assertion | Priority |
|---|-----------|----------|
| R14 | Endgame A 后，cost label = "开派终局·规" | P0 |
| R15 | Endgame A 后，goal 含门规碑立语义 | P0 |
| R16 | Endgame B 后，cost label = "开派终局·盟" | P0 |
| R17 | Endgame B 后，goal 含盟约碑立语义 | P0 |
| R18 | Endgame A 后，identity 反映 rule_echo | P1 |
| R19 | Endgame B 后，identity 反映 alliance_echo | P1 |
| R20 | 至少 1 条 on-ramp variant + endgame branch 表达正确 | P1 |

#### Group 4: Spine Ordering

| # | Assertion | Priority |
|---|-----------|----------|
| R21 | Spine 顺序：entry → pressure → payoff → late-life → endgame | P0 |
| R22 | Endgame 不可在 late-life 之前触发 | P0 |

### 3.2 Prior Stage Regression (Must Not Break)

| # | Test Suite | Priority |
|---|------------|----------|
| R23 | `p113FoundingPatriarchBridgeTests` | P0 |
| R24 | `p115FoundingPatriarchMidlifePressureTests` | P0 |
| R25 | `p117FoundingPatriarchLateLifeTests` | P0 |
| R26 | `p37AdditionalMixedPinnacleParityTests` | P0 |
| R27 | P102–P110 patron spine tests | P0 |
| R28 | `npm run guard:sample-lines-baseline` | P0 |
| R29 | `npm run typecheck` | P0 |

---

## 4. Endgame Closed Definition

### 4.1 Closure Criteria (12-criteria pattern, aligned with P117)

| # | Criterion | Evidence |
|---|-----------|----------|
| C1 | Endgame event fires as auto | Targeted proof nodes 10–11 |
| C2 | All checkpoint flags set | `endgame_echo_done` + `endgame_identity_done` |
| C3 | Branch marker traceable | One of 2 `founding_patriarch_endgame_*` |
| C4 | Cost label updates per branch | R14–R17 |
| C5 | Current goal updates per branch | R15, R17 |
| C6 | Identity updates (minimum 1 branch) | R18–R19 |
| C7 | 开派治理风味一致 | Manual review — 山门/书斋/门规/盟约 |
| C8 | No P113/P115/P117 regressions | R23–R25 pass |
| C9 | No P37/patron regressions | R26–R27 pass |
| C10 | Typecheck passes | R29 |
| C11 | Guard sample-lines-baseline | R28 |
| C12 | No stat changes in endgame | R11 |

**12/12 = endgame closed.**

### 4.2 What Does NOT Count as Closed

- 仅设 flag 但表达不更新
- 仅 1 个 branch 有表达分化
- 破坏 P117 late-life gate 或表达
- Endgame 设为 choice 事件（与 contract 不符）
- Endgame 添加 stat 变化（与 lightweight 约束不符）

---

## 5. Non-Regression Boundaries

| Closed Stage | What Must Not Change |
|--------------|---------------------|
| P113 bridge entry | Entry gates, on-ramp markers, entry expressions |
| P115 pressure | Pressure event, pressure expressions |
| P113 payoff | Payoff choice event, payoff expressions |
| P117 late-life | Late-life auto events, late-life expressions, late-life gate |
| P37 lifetime traces | Founding-patriarch traceability evidence |
| P102–P110 patron | Patron spine events and expressions |
| Expression priority | endgame > late_life > payoff > pressure > on-ramp |

**Allowed change:** New `founding_patriarch_endgame_echo_*` auto event(s); endgame expression branches; new endgame branch markers.

---

## 6. Test Execution Commands

```
npm run typecheck
npm exec tsx tests/p119FoundingPatriarchEndgameTests.ts
npm exec tsx tests/p117FoundingPatriarchLateLifeTests.ts
npm exec tsx tests/p115FoundingPatriarchMidlifePressureTests.ts
npm exec tsx tests/p113FoundingPatriarchBridgeTests.ts
npm exec tsx tests/p37AdditionalMixedPinnacleParityTests.ts
npm run guard:sample-lines-baseline
```

---

**P118-006 complete.**

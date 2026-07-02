# P117 Validation Shape — Founding Patriarch Late-Life Implementation

> **Date:** 2026-07-02
> **Source:** P116 Founding Patriarch Late-Life Design-First
> **Target stage:** P117 Founding Patriarch Late-Life Playable Implementation
> **Route:** `founding_patriarch`（开派祖师）
> **Contract:** `docs/PRD/p116-founding-patriarch-late-life-contract.md`

---

## 1. Purpose

本文件定义 P117（late-life implementation 阶段）的验证形状：targeted proof 需要展示哪些链路节点、regression tests 至少覆盖哪些断言、什么证据算 late-life closed。目的是在 implementation 开始前就锁定验证标准。

本验证形状基于 P109→P110 patron late-life 验证模式，并参考 P115 founding-patriarch pressure 测试实践。

---

## 2. Targeted Proof Chain

### 2.1 Chain Nodes Overview

| # | Node | Type | Verification Point |
|---|------|------|-------------------|
| 1 | **Scholar/faction commitment** | P16/P22 | `p16_scholar_mentor` or `p16_alliance_brokered` + faction flags |
| 2 | **Bridge entry reached** | P113 | `founding_patriarch_bridge_entry` fires at age 32–38 |
| 3 | **On-ramp checkpoint** | P113 | `founding_patriarch_on_ramp_done` + variant marker set |
| 4 | **Pressure event fires** | P115 | `founding_patriarch_midlife_pressure` fires at age 40–45 |
| 5 | **Pressure checkpoint** | P115 | `founding_patriarch_midlife_pressure_done` + pressure marker set |
| 6 | **Payoff event fires** | P113 | `founding_patriarch_payoff_echo` fires at age 48–52 |
| 7 | **Payoff checkpoint** | P113 | `founding_patriarch_payoff_done` + payoff marker set |
| 8 | **Pre-late-life expression** | baseline | cost label / goal reflect payoff choice |
| 9 | **Pre-late-life state** | baseline | `payoff_done` = true, `late_life_done` = false |
| 10 | **Late-life event fires** | **P117 core** | `founding_patriarch_late_life` fires at age 52–56 |
| 11 | **Late-life checkpoint set** | **P117 core** | `founding_patriarch_late_life_done` = true |
| 12 | **Late-life identity done** | **P117 core** | `founding_patriarch_late_life_identity_done` = true |
| 13 | **Branch marker set** | **P117 core** | matching `founding_patriarch_late_*` set |
| 14 | **Late-life expression — cost label** | **P117 core** | cost label reflects late-life branch |
| 15 | **Late-life expression — current goal** | **P117 core** | goal reflects late-life branch |
| 16 | **Late-life expression — identity** | **P117 core** | identity reflects late-life branch |
| 17 | **Endgame interface reserved** | contract-only | `founding_patriarch_endgame_echo_done` not set |

### 2.2 Core Nodes (Must Show)

必须展示的核心节点（P0）：

1. **节点 9:** Pre-late-life state (payoff done, late-life not done)
2. **节点 10:** Late-life event fires at correct age
3. **节点 11:** Checkpoint flag set
4. **节点 13:** Branch marker traceable to pressure marker
5. **节点 14:** Cost label late-life update (per branch)
6. **节点 15:** Current goal late-life update (per branch)

共 6 个核心节点。**每个 pressure branch 方向至少 1 条 proof path**（2 paths minimum for branches A/B）。

Bonus: 节点 16 identity update；至少 1 条 on-ramp variant overlay。

### 2.3 Branch Path Requirements

| Branch | Minimum Proof Path | Key Assertions |
|--------|-------------------|----------------|
| A: 门规守成终老 | Scholar on-ramp → pressure rule_first → payoff any → late-life A | `late_rule_keeper` + cost/goal |
| B: 盟约续责终老 | Alliance on-ramp → pressure alliance_first → payoff any → late-life B | `late_alliance_bearer` + cost/goal |

### 2.4 No Full Lifetime Exhaust Required

**不需要：**
- Full birth-to-death 穷举
- 多种子组合爆炸
- Stat 阈值边界测试（增强项 defer）
- `gate:p20` broad rerun
- 2×3 pressure×payoff identity 全矩阵

只需要 targeted proof：2 条 late-life branch paths + 至少 1 条 on-ramp variant overlay。

---

## 3. Regression Tests

### 3.1 P117 New Tests (`tests/p117FoundingPatriarchLateLifeTests.ts`)

#### Group 1: Late-Life Event Wiring

| # | Assertion | Priority |
|---|-----------|----------|
| R1 | `founding_patriarch_late_life` 存在于 `sample-lines-spine.json` | P0 |
| R2 | 事件类型是 **auto**（非 choice） | P0 |
| R3 | 触发条件包含 `founding_patriarch_payoff_done` | P0 |
| R4 | 年龄范围 52–56 | P0 |
| R5 | 2 个条件分支存在（keyed on pressure marker） | P0 |
| R6 | 所有分支设置 `founding_patriarch_late_life_done` | P0 |
| R7 | 所有分支设置 `founding_patriarch_late_life_identity_done` | P0 |
| R8 | 各分支设置对应 `founding_patriarch_late_*` marker | P0 |
| R9 | 各分支互斥（不可同时设多个 late-life marker） | P0 |
| R10 | Late-life 不设置 `founding_patriarch_endgame_echo_done` | P0 |

#### Group 2: Pre-Late-Life Expression

| # | Assertion | Priority |
|---|-----------|----------|
| R11 | Payoff done 但 late-life 未 done 时，cost label 是 payoff choice label | P0 |
| R12 | Payoff done 但 late-life 未 done 时，goal 是 payoff choice state | P0 |

#### Group 3: Post-Late-Life Expression (per branch)

| # | Assertion | Priority |
|---|-----------|----------|
| R13 | Late-life A 后，cost label = "门规守成之累" | P0 |
| R14 | Late-life A 后，goal 含守门规至终语义 | P0 |
| R15 | Late-life B 后，cost label = "盟约续责之累" | P0 |
| R16 | Late-life B 后，goal 含守盟约至终语义 | P0 |
| R17 | Late-life A 后，identity 反映 rule_keeper | P1 |
| R18 | 至少 1 条 on-ramp variant + late-life branch 表达正确 | P1 |

#### Group 4: Spine Ordering

| # | Assertion | Priority |
|---|-----------|----------|
| R19 | Spine 顺序：entry → pressure → payoff → late-life | P0 |
| R20 | Late-life 不可在 payoff 之前触发 | P0 |
| R21 | Late-life branch marker 匹配 pressure marker | P0 |

### 3.2 Prior Stage Regression (Must Not Break)

| # | Test Suite | Priority |
|---|------------|----------|
| R22 | `p113FoundingPatriarchBridgeTests` | P0 |
| R23 | `p115FoundingPatriarchMidlifePressureTests` | P0 |
| R24 | `p37AdditionalMixedPinnacleParityTests` | P0 |
| R25 | `p102MerchantMartialPatronBridgeTests` | P0 |
| R26 | `p106MerchantMartialPatronPressureTests` | P0 |
| R27 | `p108MerchantMartialPatronPayoffTests` | P0 |
| R28 | `p110MerchantMartialPatronLateLifeTests` | P0 |
| R29 | `npm run guard:sample-lines-baseline` | P0 |
| R30 | `npm run typecheck` | P0 |

---

## 4. Late-Life Closed Definition

### 4.1 Closure Criteria (12-criteria pattern, aligned with P109/P110)

| # | Criterion | Evidence |
|---|-----------|----------|
| C1 | Late-life event fires as auto | Targeted proof nodes 10–11 |
| C2 | All checkpoint flags set | `late_life_done` + `late_life_identity_done` |
| C3 | Branch marker traceable to pressure marker | One of 2 `founding_patriarch_late_*` |
| C4 | Cost label updates per branch | R13–R16 |
| C5 | Current goal updates per branch | R14, R16 |
| C6 | Identity updates (minimum 1 branch) | R17 |
| C7 | 开派治理风味一致 | Manual review — 山门/书斋/门规/盟约 |
| C8 | No P113/P115 regressions | R22–R23 pass |
| C9 | No P37/patron regressions | R24–R28 pass |
| C10 | Typecheck passes | R30 |
| C11 | Guard sample-lines-baseline | R29 |
| C12 | Endgame interfaces reserved | `endgame_echo_done` not set by late-life |

**12/12 = late-life closed.**

### 4.2 What Does NOT Count as Closed

- 仅设 flag 但表达不更新
- 仅 1 个 branch 有表达分化
- 破坏 P113 payoff gate 或 P115 pressure gate
- Late-life 设为 choice 事件（与 contract 不符）
- Late-life branch key 改用 payoff marker（与 contract 不符）

---

## 5. Non-Regression Boundaries

| Closed Stage | What Must Not Change |
|--------------|---------------------|
| P113 bridge entry + payoff | Entry gates, on-ramp markers, payoff event structure |
| P115 pressure | Pressure event, pressure expressions, pressure gate |
| P37 pinnacle parity | Lifetime trace unlock rates |
| P102–P112 patron spine | Patron events and expressions |
| Expression priority | late_life > payoff > pressure > on-ramp |

**Allowed change:** New `founding_patriarch_late_life` auto event; late-life expression branches; new late-life branch markers.

---

## 6. Test Execution Commands

```
npm run typecheck
npm exec tsx tests/p117FoundingPatriarchLateLifeTests.ts
npm exec tsx tests/p115FoundingPatriarchMidlifePressureTests.ts
npm exec tsx tests/p113FoundingPatriarchBridgeTests.ts
npm exec tsx tests/p37AdditionalMixedPinnacleParityTests.ts
npm run guard:sample-lines-baseline
```

---

**P116-005 complete.**

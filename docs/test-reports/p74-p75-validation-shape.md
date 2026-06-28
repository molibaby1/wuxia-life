# P75 Validation Shape — Renown Pressure Implementation

> **Date:** 2026-06-29
> **Source:** P74 Renown Pressure Design-First
> **Target stage:** P75 Renown Pressure Implementation
> **Route:** jianghu_renown_sage（江湖名宿）
> **Origin:** tavern_hand（酒肆帮工）

---

## 1. Purpose

本文件定义 P75（pressure implementation 阶段）的验证形状：targeted proof 需要展示哪些链路节点、regression tests 至少覆盖哪些断言、什么证据算 pressure closed。目的是在 implementation 开始前就锁定验证标准，避免 P75 实施后再争论"什么算 done"。

本验证形状基于 P70→P71 的验证模式，并参考 P73 on-ramp 的验证实践。

---

## 2. Targeted Proof Chain

Targeted proof 是 P75 的核心验证——证明 pressure 链路是通的。

### 2.1 Chain Nodes Overview

Targeted proof 需展示以下链路节点：

| # | Node | Type | Verification Point |
|---|------|------|-----------------|
| 1 | **Pre-bridge state** | baseline | tavern_hand + ally_network, no renown flags |
| 2 | **Bridge crossed** | P71 | `tavern_renown_bridge_crossed` + `route_renown_committed` set |
| 3 | **Entry expression** | P72 | `detectSampleLine()` returns `jianghu_renown_sage` |
| 4 | **On-ramp reached** | P73 | `renown_on_ramp` fires at age 32-35, `renown_on_ramp_done` set |
| 5 | **Pre-pressure state** | baseline (P73 后，P75 前) | `renown_on_ramp_done` = true, `renown_midlife_pressure_done` = false |
| 6 | **Pressure event fires** | **P75 core** | `renown_midlife_pressure` fires at age 37-41 |
| 7 | **Pressure checkpoint set** | **P75 core** | `renown_midlife_pressure_done` = true |
| 8 | **Pressure expression — cost label** | **P75 core** | cost label changes from "江湖声名之累" to "人情债渐重" |
| 9 | **Pressure expression — current goal** | **P75 core** | current goal changes to pressure state |
| 10 | **Pressure expression — life memory** | P75 bonus | life memory has pressure-specific text |
| 11 | **Pressure expression — summary** | P75 bonus | summary updates to pressure state |
| 12 | **Payoff flag interface reserved** | contract-only | `renown_payoff_done` is reserved but not set |

### 2.2 Core Nodes (Must Show)

必须展示的核心节点（P0）：

1. **节点 5:** Pre-pressure state — on-ramp done, pressure not done
2. **节点 6:** Pressure event fires — 在正确年龄范围触发
3. **节点 7:** Pressure checkpoint set — `renown_midlife_pressure_done` 被正确设置
4. **节点 8:** Cost label 更新 — "人情债渐重"
5. **节点 9:** Current goal 更新 — pressure 状态

共 5 个核心节点

### 2.3 Bonus Nodes (Nice to Show)

加分节点（P1，有时间就做）：

1. 节点 10: Life memory 更新
2. 节点 11: Summary 更新
3. 节点 1-4: 完整链路回溯（bridge → entry → on-ramp → pressure）

### 2.4 No Full Lifetime Exhaust Required

**不需要** ：
- Full birth-to-death 穷举
- 多种子组合爆炸
- 所有 origin × 所有 route 的组合验证
- Stat 阈值的边界测试（stat threshold 是增强项，非必须

只需要 targeted 的 targeted proof：1 条基准路径上的 pressure 链路打通

---

## 3. Regression Tests

### 3.1 P75 New Tests (新增)

P75 新增的 regression tests 应覆盖以下断言：

#### Group 1: Pressure Event Wiring (事件配置)

| # | Assertion | Priority |
|---|-----------|----------|
| R1 | `renown_midlife_pressure` 事件存在于 `sample-lines-spine.json` | P0 |
| R2 | 事件触发条件包含 `renown_on_ramp_done` | P0 |
| R3 | 事件年龄范围是 37-41 | P0 |
| R4 | 事件类型是 auto | P0 |
| R5 | 事件设置 `renown_midlife_pressure_done` flag | P0 |

#### Group 2: Pre-Pressure State (压力前状态)

| # | Assertion | Priority |
|---|-----------|----------|
| R6 | On-ramp done 但 pressure 未 done 时，cost label 是 "江湖声名之累" | P0 |
| R7 | On-ramp done 但 pressure 未 done 时，current goal 是 on-ramp 状态 | P0 |

#### Group 3: Post-Pressure Expression Updates (压力后表达更新)

| # | Assertion | Priority |
|---|-----------|----------|
| R8 | Pressure done 后，sample line cost label 变为 "人情债渐重" | P0 |
| R9 | Pressure done 后，sample line current goal 变为 pressure 状态 | P0 |
| R10 | Pressure done 后，ordinary origin current goal 变为 pressure 状态 | P0 |
| R11 | Pressure done 后，ordinary origin life memory 有 pressure 特定文本 | P1 |
| R12 | Pressure done 后，ordinary origin summary 有 pressure 特定文本 | P1 |

#### Group 4: Distinct from Merchant Pressure (与 merchant pressure 区分)

| # | Assertion | Priority |
|---|-----------|----------|
| R13 | Renown pressure cost label 与 merchant pressure cost label 不同 | P0 |
| R14 | Renown pressure current goal 与 merchant pressure current goal 不同 | P1 |

#### Group 5: No Regression of P71/P72/P73 (既有功能不退化)

| # | Assertion | Priority |
|---|-----------|----------|
| R15 | P71 bridge 事件仍能正常触发 | P0 |
| R16 | P72 entry differentiation 仍正常工作 | P0 |
| R17 | P73 on-ramp 事件仍能正常触发 | P0 |
| R18 | P73 on-ramp expression 仍正常显示 | P0 |

### 3.2 Test Count Estimate

- **P0 断言：约 10-12 个
- **P1 断言：约 4-5 个
- **总计：约 14-17 个断言**

与 P73 on-ramp 的 19 个 tests 规模相当。

---

## 4. What Counts As Pressure Closed

### 4.1 Closure Criteria (Done Definition)

P75 pressure 阶段算 closed 的标准：

| # | Criterion | Method |
|---|-----------|--------|
| C1 | **Pressure event fires** | Targeted proof 显示节点 6-7 |
| C2 | **Checkpoint flag set** | `renown_midlife_pressure_done` = true |
| C3 | **Cost label updates** | "人情债渐重" 显示正确 |
| C4 | **Current goal updates** | pressure 状态目标显示正确 |
| C5 | **Tavern-born flavor consistent** | Manual review of all text |
| C6 | **No P71/P72/P73 regressions | 所有既有测试通过 |
| C7 | **Typecheck passes** | `tsc --noEmit` 通过 |
| C8 | **Guard: sample-lines-baseline passes** | baseline guard 通过 |
| C9 | **Payoff flag interfaces reserved** | 代码中可见预留接口 |

**9 条标准全部满足才算 pressure closed。**

### 4.2 Must-Have vs Nice-to-Have

**Must-have (P0):**
- C1-C4: 核心功能完整（事件 + flag + 2 个核心表达更新）
- C5: 风味一致性
- C6-C8: 质量闸门

**Nice-to-have (P1):**
- Life memory + summary 表达更新
- 与 merchant pressure 的文字区分度验证

---

## 5. Regression Boundaries for P71/P72/P73 Existing Evidence

### 5.1 What Must Not Regress

P75 实施后，以下既有证据必须保持通过：

| Stage | Evidence | Verification |
|-------|----------|--------------|
| **P71 Bridge** | Bridge 事件触发 + flag 设置 + 3 expression 更新 | P71 bridge tests 通过 |
| **P72 Entry** | 6 expression surfaces 差异化 + detectSampleLine() 识别 | P72 entry tests 通过 |
| **P73 On-ramp** | On-ramp 事件触发 + checkpoint flag + 4 expression 更新 | P73 on-ramp tests 通过 |
| **Sample line baseline** | baseline guard 全量通过 | `guard:sample-lines-baseline` 通过 |
| **Typecheck** | TypeScript 类型检查通过 | `tsc --noEmit` 通过 |

### 5.2 What Is Allowed to Change

以下内容允许变化（因为是 pressure 阶段的正常更新）：

- Sample line current goal（on-ramp → pressure）
- Sample line cost label（江湖声名之累 → 人情债渐重）
- Ordinary origin current goal（on-ramp → pressure）
- Ordinary origin life memory（新增 pressure 文本）
- Ordinary origin summary（on-ramp → pressure）

这些是 pressure 阶段的预期变化，不算 regression。

### 5.3 Regression Guard Strategy

P75 实施时，应先跑：
1. 先跑 P71/P72/P73 既有测试，确认 baseline 通过
2. 新增 pressure 测试
3. 实施 pressure 代码
4. 再跑全部测试，确认既有测试都通过
5. 最后跑 typecheck + baseline guard

---

## 6. Validation Pattern Reference

### 6.1 Precedent From Previous Stages

| Stage | Proof Nodes | Test Count | Pattern |
|-------|-----------|------------|---------|
| P70→P71 Bridge | 11 nodes | 15 tests | Targeted proof + narrow regression |
| P73 On-ramp | 8 nodes | 19 tests | Targeted proof + narrow regression |
| P74→P75 Pressure | ~12 nodes (5 core) | ~14-17 tests | Targeted proof + narrow regression |

模式一致：targeted proof 证明链路通，narrow regression 确保不退化。

### 6.2 Why This Shape

为什么选这个验证形状：

1. **与先例一致**：P70→P71、P73 都是这个模式，验证成本最低
2. **足够证明**：5 个核心节点足以证明 pressure 链路是通的
3. **不做过度**：不需要 full lifetime exhaust，符合 small-step
4. **风味可检查**：tavern-born 风味通过 manual review 验证
5. **有回归防护**：P71/P72/P73 既有测试确保不退化

---

## 7. P75 Exit Checklist

P75 完成时的 checklist：

- [ ] Pressure 事件配置正确（触发条件、年龄范围、auto 类型、flag 设置）
- [ ] 2 个核心 expression 更新（cost label + current goal）
- [ ] Targeted proof 文档（5+ 核心节点）
- [ ] ~14-17 个 regression tests（5 groups）
- [ ] P71/P72/P73 既有测试全部通过
- [ ] Typecheck 通过
- [ ] Sample-lines-baseline guard 通过
- [ ] Tavern-born 风味 review 通过
- [ ] Payoff flag 接口预留
- [ ] Closure report 输出

---

**P74-005 complete.** Validation shape saved.

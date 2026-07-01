# P87 Validation Shape — Medical Pressure Implementation

> **Date:** 2026-06-29
> **Source:** P86 Medical Pressure Design-First
> **Target stage:** P87 Medical Pressure Implementation
> **Route:** `medical_sage_healer`（一代名医）
> **Origin:** `tavern_hand`（酒肆帮工）
> **Variants:** Compassionate (仁心医者) + Pragmatic (世故人医)

---

## 1. Purpose

本文件定义 P87（pressure implementation 阶段）的验证形状：targeted proof 需要展示哪些链路节点、regression tests 至少覆盖哪些断言、什么证据算 pressure closed。目的是在 implementation 开始前就锁定验证标准，避免 P87 实施后再争论"什么算 done"。

本验证形状基于 P74→P75 的验证模式，并参考 P85 on-ramp 的验证实践。**关键区别：medical 路线有 2 个 variant，验证需覆盖两个 variant。**

---

## 2. Targeted Proof Chain

Targeted proof 是 P87 的核心验证——证明 pressure 链路是通的（2 个 variant 各一条链路）。

### 2.1 Chain Nodes Overview (Both Variants)

Targeted proof 需展示以下链路节点（每个 variant 各一套）：

| # | Node | Type | Verification Point |
|---|------|------|-----------------|
| 1 | **Pre-bridge state** | baseline | tavern_hand, no medical flags |
| 2 | **Bridge crossed** | P83 | `tavern_medical_bridge_crossed` + `route_medical_committed` set |
| 3 | **Entry expression** | P84 | `detectSampleLine()` returns `medical_sage_healer` |
| 4 | **On-ramp reached** | P85 | `medical_on_ramp_compassionate` / `medical_on_ramp_pragmatic` fires, `medical_on_ramp_done` set |
| 5 | **Pre-pressure state** | baseline (P85 后，P87 前) | `medical_on_ramp_done` = true, `medical_midlife_pressure_done` = false |
| 6 | **Pressure event fires** | **P87 core** | `medical_pressure_compassionate` / `medical_pressure_pragmatic` fires at correct age |
| 7 | **Pressure checkpoint set** | **P87 core** | `medical_midlife_pressure_done` = true |
| 8 | **Pressure variant marker set** | **P87 core** | `tavern_medical_pressure_compassionate` / `tavern_medical_pressure_pragmatic` = true |
| 9 | **Pressure expression — cost label** | **P87 core** | cost label changes (仁心之累→仁心耗尽 / 世故之秤→人情债缠身) |
| 10 | **Pressure expression — current goal** | **P87 core** | current goal changes to pressure state |
| 11 | **Pressure expression — life memory** | P87 bonus | life memory has pressure-specific text |
| 12 | **Pressure expression — summary** | P87 bonus | summary updates to pressure state |
| 13 | **Payoff flag interface reserved** | contract-only | `medical_payoff_done` is reserved but not set |

### 2.2 Core Nodes (Must Show — Per Variant)

每个 variant 必须展示的核心节点（P0）：

1. **节点 5:** Pre-pressure state — on-ramp done, pressure not done
2. **节点 6:** Pressure event fires — 在正确年龄范围触发
3. **节点 7:** Pressure checkpoint set — `medical_midlife_pressure_done` 被正确设置
4. **节点 8:** Variant marker set — variant-specific flag 被正确设置
5. **节点 9:** Cost label 更新 — 仁心耗尽 / 人情债缠身
6. **节点 10:** Current goal 更新 — pressure 状态

每个 variant 6 个核心节点，**共 12 个核心节点（2 variants × 6）**

### 2.3 Bonus Nodes (Nice to Show)

加分节点（P1，有时间就做）：

1. 节点 11: Life memory 更新（2 variants）
2. 节点 12: Summary 更新（2 variants）
3. 节点 1-4: 完整链路回溯（bridge → entry → on-ramp → pressure）

### 2.4 No Full Lifetime Exhaust Required

**不需要** ：
- Full birth-to-death 穷举
- 多种子组合爆炸
- 所有 origin × 所有 route 的组合验证
- Stat 阈值的边界测试（stat threshold 是增强项，非必须）
- 两个 variant 之间的互斥验证（已由 on-ramp 保证）

只需要 targeted 的 targeted proof：2 条基准路径（compassionate + pragmatic）上的 pressure 链路打通

---

## 3. Regression Tests

### 3.1 P87 New Tests (新增)

P87 新增的 regression tests 应覆盖以下断言（2 variants）：

#### Group 1: Pressure Event Wiring (事件配置)

| # | Assertion | Priority |
|---|-----------|----------|
| R1 | `medical_pressure_compassionate` 事件存在于 `sample-lines-spine.json` | P0 |
| R2 | `medical_pressure_pragmatic` 事件存在于 `sample-lines-spine.json` | P0 |
| R3 | Compassionate 事件触发条件包含 `medical_on_ramp_done` + `tavern_medical_on_ramp_compassionate` | P0 |
| R4 | Pragmatic 事件触发条件包含 `medical_on_ramp_done` + `tavern_medical_on_ramp_pragmatic` | P0 |
| R5 | Compassionate 事件年龄范围是 36-40 | P0 |
| R6 | Pragmatic 事件年龄范围是 37-41 | P0 |
| R7 | 两个事件都是 auto 类型 | P0 |
| R8 | 两个事件都设置 `medical_midlife_pressure_done` flag | P0 |
| R9 | Compassionate 事件设置 `tavern_medical_pressure_compassionate` | P0 |
| R10 | Pragmatic 事件设置 `tavern_medical_pressure_pragmatic` | P0 |

#### Group 2: Pre-Pressure State (压力前状态)

| # | Assertion | Priority |
|---|-----------|----------|
| R11 | On-ramp done 但 pressure 未 done 时，compassionate cost label 是 "仁心之累" | P0 |
| R12 | On-ramp done 但 pressure 未 done 时，pragmatic cost label 是 "世故之秤" | P0 |
| R13 | On-ramp done 但 pressure 未 done 时，compassionate current goal 是 on-ramp 状态 | P0 |
| R14 | On-ramp done 但 pressure 未 done 时，pragmatic current goal 是 on-ramp 状态 | P0 |

#### Group 3: Post-Pressure Expression Updates (压力后表达更新)

| # | Assertion | Priority |
|---|-----------|----------|
| R15 | Pressure done 后，compassionate sample line cost label 变为 "仁心耗尽" | P0 |
| R16 | Pressure done 后，pragmatic sample line cost label 变为 "人情债缠身" | P0 |
| R17 | Pressure done 后，compassionate sample line current goal 变为 pressure 状态 | P0 |
| R18 | Pressure done 后，pragmatic sample line current goal 变为 pressure 状态 | P0 |
| R19 | Pressure done 后，compassionate ordinary origin current goal 变为 pressure 状态 | P0 |
| R20 | Pressure done 后，pragmatic ordinary origin current goal 变为 pressure 状态 | P0 |
| R21 | Pressure done 后，compassionate ordinary origin life memory 有 pressure 特定文本 | P1 |
| R22 | Pressure done 后，pragmatic ordinary origin life memory 有 pressure 特定文本 | P1 |
| R23 | Pressure done 后，compassionate ordinary origin summary 有 pressure 特定文本 | P1 |
| R24 | Pressure done 后，pragmatic ordinary origin summary 有 pressure 特定文本 | P1 |

#### Group 4: Variant Differentiation (两个 variant 有区分)

| # | Assertion | Priority |
|---|-----------|----------|
| R25 | Compassionate 与 pragmatic 的 cost label 不同 | P0 |
| R26 | Compassionate 与 pragmatic 的 current goal 不同 | P0 |
| R27 | Compassionate 与 pragmatic 的 life memory 不同 | P1 |
| R28 | Compassionate 与 pragmatic 的 summary 不同 | P1 |

#### Group 5: Distinct from Other Routes (与其他路线 pressure 区分)

| # | Assertion | Priority |
|---|-----------|----------|
| R29 | Medical pressure cost label 与 merchant pressure cost label 不同 | P0 |
| R30 | Medical pressure cost label 与 renown pressure cost label 不同 | P0 |
| R31 | Medical pressure current goal 与 merchant/renown 不同 | P1 |

#### Group 6: No Regression of P83/P84/P85 (既有功能不退化)

| # | Assertion | Priority |
|---|-----------|----------|
| R32 | P83 bridge 事件仍能正常触发 | P0 |
| R33 | P84 entry differentiation 仍正常工作 | P0 |
| R34 | P85 on-ramp 事件仍能正常触发（2 variants） | P0 |
| R35 | P85 on-ramp expression 仍正常显示（2 variants） | P0 |
| R36 | `detectSampleLine()` 优先级不变（medical > renown > merchant） | P0 |

### 3.2 Test Count Estimate

- **P0 断言：** 约 22-25 个
- **P1 断言：** 约 8-10 个
- **总计：约 30-35 个断言**

比 P75 renown pressure 多一些，因为有 2 个 variant。与 P85 on-ramp 的 8 个 test groups 规模相当（但每个 group 内的断言更多）。

---

## 4. What Counts As Pressure Closed

### 4.1 Closure Criteria (Done Definition)

P87 pressure 阶段算 closed 的标准：

| # | Criterion | Method |
|---|-----------|--------|
| C1 | **Compassionate pressure event fires** | Targeted proof 显示节点 6-8 (compassionate) |
| C2 | **Pragmatic pressure event fires** | Targeted proof 显示节点 6-8 (pragmatic) |
| C3 | **Checkpoint flag set (shared)** | `medical_midlife_pressure_done` = true |
| C4 | **Variant markers set** | 2 个 variant-specific flags 都正确设置 |
| C5 | **Cost label updates (both variants)** | 仁心耗尽 / 人情债缠身 显示正确 |
| C6 | **Current goal updates (both variants)** | pressure 状态目标显示正确 |
| C7 | **Two-variant differentiation** | 两个 variant 的表达有本质差异 |
| C8 | **Tavern-born healer flavor consistent** | Manual review of all text |
| C9 | **No P83/P84/P85 regressions** | 所有既有测试通过 |
| C10 | **Typecheck passes** | `tsc --noEmit` 通过 |
| C11 | **Guard: sample-lines-baseline passes** | baseline guard 通过 |
| C12 | **Payoff flag interfaces reserved** | 代码中可见预留接口 |

**12 条标准全部满足才算 pressure closed。**

### 4.2 Must-Have vs Nice-to-Have

**Must-have (P0):**
- C1-C6: 核心功能完整（2 events + 3 flags + 2 个核心表达更新 × 2 variants）
- C7: variant 差异化
- C8: 风味一致性
- C9-C11: 质量闸门

**Nice-to-have (P1):**
- Life memory + summary 表达更新（2 variants）
- 与 merchant/renown pressure 的文字区分度验证
- Bonus 节点的 targeted proof

---

## 5. Regression Boundaries for P83/P84/P85 Existing Evidence

### 5.1 What Must Not Regress

P87 实施后，以下既有证据必须保持通过：

| Stage | Evidence | Verification |
|-------|----------|--------------|
| **P83 Bridge** | Bridge 事件触发 + flag 设置 + 3 expression 更新 | P83 bridge tests 通过 |
| **P84 Entry** | 7 expression surfaces 差异化 + detectSampleLine() 识别 | P84 entry tests 通过 |
| **P85 On-ramp** | On-ramp 事件触发（2 variants）+ checkpoint flag + 4 expression 更新 | P85 on-ramp tests 通过 |
| **Sample line baseline** | baseline guard 全量通过 | `guard:sample-lines-baseline` 通过 |
| **Typecheck** | TypeScript 类型检查通过 | `tsc --noEmit` 通过 |
| **Renown pressure (P75)** | Renown pressure 不退化（互不干扰） | P75 tests 通过 |
| **Merchant pressure** | Merchant pressure 不退化 | Merchant pressure tests 通过 |

### 5.2 What Is Allowed to Change

以下内容允许变化（因为是 pressure 阶段的正常更新）：

- Sample line current goal（on-ramp → pressure，2 variants）
- Sample line cost label（仁心之累 → 仁心耗尽 / 世故之秤 → 人情债缠身）
- Ordinary origin current goal（on-ramp → pressure，2 variants）
- Ordinary origin life memory（新增 pressure 文本，2 variants）
- Ordinary origin summary（on-ramp → pressure，2 variants）

这些是 pressure 阶段的预期变化，不算 regression。

### 5.3 Regression Guard Strategy

P87 实施时，应先跑：
1. 先跑 P83/P84/P85 既有测试，确认 baseline 通过
2. 新增 pressure 测试（先写测试再实现——如果遵循 TDD 的话）
3. 实施 pressure 代码
4. 再跑全部测试，确认既有测试都通过
5. 最后跑 typecheck + baseline guard

---

## 6. Validation Pattern Reference

### 6.1 Precedent From Previous Stages

| Stage | Proof Nodes | Test Count | Pattern |
|-------|-----------|------------|---------|
| P82→P83 Bridge | ~14 nodes | ~21 assertions | Targeted proof + narrow regression |
| P85 On-ramp | 8 test groups | 8/8 tests passed | Targeted proof + narrow regression |
| P74→P75 Renown Pressure | ~12 nodes (5 core) | ~14-17 tests | Targeted proof + narrow regression |
| **P86→P87 Medical Pressure** | **~26 nodes (12 core, 2 variants)** | **~30-35 assertions** | **Targeted proof + narrow regression (2 variants)** |

模式一致：targeted proof 证明链路通，narrow regression 确保不退化。但 medical 路线因为有 2 个 variant，节点和断言数量大约是 renown 的 2 倍。

### 6.2 Why This Shape

为什么选这个验证形状：

1. **与先例一致**：P70→P71、P73、P75 都是这个模式，验证成本最低
2. **覆盖 2 variants**：medical 路线有 2 个 variant，必须都覆盖
3. **足够证明**：12 个核心节点足以证明 pressure 链路是通的
4. **不做过度**：不需要 full lifetime exhaust，符合 small-step
5. **风味可检查**：tavern-born healer 风味通过 manual review 验证
6. **有回归防护**：P83/P84/P85 既有测试确保不退化
7. **variant 差异化可验证**：专门的 test group 验证 2 variants 有区分

---

## 7. P87 Exit Checklist

P87 完成时的 checklist：

- [ ] Compassionate pressure 事件配置正确（触发条件、年龄范围 36-40、auto 类型、flag 设置）
- [ ] Pragmatic pressure 事件配置正确（触发条件、年龄范围 37-41、auto 类型、flag 设置）
- [ ] 共享 checkpoint: `medical_midlife_pressure_done`
- [ ] Variant markers: `tavern_medical_pressure_compassionate` / `tavern_medical_pressure_pragmatic`
- [ ] 2 个核心 expression 更新（cost label + current goal）× 2 variants = 4 个核心更新
- [ ] Bonus expression 更新（life memory + summary）× 2 variants = 4 个 bonus 更新
- [ ] Targeted proof 文档（12+ 核心节点，2 variants）
- [ ] ~30-35 个 regression assertions（6 groups）
- [ ] P83/P84/P85 既有测试全部通过
- [ ] Renown/merchant pressure 不退化
- [ ] Typecheck 通过
- [ ] Sample-lines-baseline guard 通过
- [ ] Tavern-born healer 风味 review 通过
- [ ] Two-variant differentiation 验证通过
- [ ] Payoff flag 接口预留
- [ ] Closure report 输出

---

**P86-005 complete.** Validation shape saved.

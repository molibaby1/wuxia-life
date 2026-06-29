# P89 Validation Shape — Medical Payoff Implementation

> **Date:** 2026-06-29
> **Source:** P88 Medical Payoff Design-First
> **Target stage:** P89 Medical Payoff Implementation
> **Route:** `medical_sage_healer`（一代名医）
> **Origin:** `tavern_hand`（酒肆帮工）
> **Variants:** Compassionate (仁心医者) + Pragmatic (世故人医)
> **Branches:** 2 variants × 3 choices = 6 payoff branches

---

## 1. Purpose

本文件定义 P89（payoff implementation 阶段）的验证形状：targeted proof 需要展示哪些链路节点、regression tests 至少覆盖哪些断言、什么证据算 payoff closed。目的是在 implementation 开始前就锁定验证标准，避免 P89 实施后再争论"什么算 done"。

本验证形状基于 P76→P77 的验证模式，并参考 P85/P87 的 2-variant 验证实践。**关键区别：medical 路线有 2 个 variant × 3 个 choices = 6 个 payoff 分支，验证需覆盖全部 6 个分支。**

---

## 2. Targeted Proof Chain

Targeted proof 是 P89 的核心验证——证明 payoff 链路是通的（6 个分支各一条链路）。

### 2.1 Chain Nodes Overview (6 Branches)

Targeted proof 需展示以下链路节点（每个分支各一套）：

| # | Node | Type | Verification Point |
|---|------|------|-----------------|
| 1 | **Pre-payoff state** | baseline (P87 后，P89 前) | `medical_midlife_pressure_done` = true, `medical_payoff_done` = false, pressure expression 正确 |
| 2 | **Payoff event fires** | **P89 core** | `medical_payoff_compassionate` / `medical_payoff_pragmatic` 在正确年龄触发 |
| 3 | **Player sees 3 choices** | **P89 core** | 三个选项都正确显示，文案和 stat 预览正确 |
| 4 | **Choice A: flags set** | **P89 core** | `medical_payoff_done` + `medical_age40_identity_done` + choice-A marker 都设置 |
| 5 | **Choice A: stats correct** | **P89 core** | stat 变化与 contract 一致 |
| 6 | **Choice B: flags set** | **P89 core** | `medical_payoff_done` + `medical_age40_identity_done` + choice-B marker 都设置 |
| 7 | **Choice B: stats correct** | **P89 core** | stat 变化与 contract 一致 |
| 8 | **Choice C: flags set** | **P89 core** | `medical_payoff_done` + `medical_age40_identity_done` + choice-C marker 都设置 |
| 9 | **Choice C: stats correct** | **P89 core** | stat 变化与 contract 一致 |
| 10 | **Cost label per choice** | **P89 core** | 三个选项各自的 cost label 正确 |
| 11 | **Current goal per choice (sample line)** | **P89 core** | 三个选项各自的 sample line current goal 正确 |
| 12 | **Current goal per choice (ordinary origin)** | **P89 core** | 三个选项各自的 ordinary origin current goal 正确 |
| 13 | **Age-40 identity per choice** | P89 bonus | 三个选项各自的 age-40 identity 文本正确 |
| 14 | **Life memory per choice** | P89 bonus | Ordinary origin 的 life memory 按 choice 更新 |
| 15 | **Origin summary per choice** | P89 bonus | Ordinary origin 的 summary 按 choice 更新 |
| 16 | **Full chain traceback** | P89 bonus | 从 bridge → entry → on-ramp → pressure → payoff 完整链路回溯 |
| 17 | **Mutex with other variants** | P89 bonus | Compassionate 与 pragmatic payoff 互斥 |

### 2.2 Core Nodes (Must Show — Per Variant)

每个 variant 必须展示的核心节点（P0）：

1. **节点 1:** Pre-payoff state — pressure done, payoff not done
2. **节点 2:** Payoff event fires — 在正确年龄范围触发
3. **节点 3:** 3 choices 显示正确
4. **节点 4-5:** Choice A: flags + stats
5. **节点 6-7:** Choice B: flags + stats
6. **节点 8-9:** Choice C: flags + stats
7. **节点 10:** Cost label 更新（3 choices）
8. **节点 11-12:** Current goal 更新（sample line + ordinary origin，3 choices each）

每个 variant 8 个核心节点组，**共 16 个核心节点组（2 variants × 8）**，展开后约 30+ 个具体验证点。

### 2.3 Bonus Nodes (Nice to Show)

加分节点（P1，有时间就做）：

1. 节点 13: Age-40 identity 更新（2 variants × 3 choices = 6 个）
2. 节点 14: Life memory 更新（2 variants × 3 choices = 6 个）
3. 节点 15: Summary 更新（2 variants × 3 choices = 6 个）
4. 节点 16: 完整链路回溯（bridge → entry → on-ramp → pressure → payoff）
5. 节点 17: Variant 互斥验证

### 2.4 No Full Lifetime Exhaust Required

**不需要**：
- Full birth-to-death 穷举
- 多种子组合爆炸
- 所有 origin × 所有 route 的组合验证
- 6 个分支的所有可能排列组合
- Stat 阈值的边界测试
- Late-life / endgame 内容验证

只需要 targeted 的 targeted proof：6 条基准路径（2 variants × 3 choices）上的 payoff 链路打通。

---

## 3. Regression Tests

### 3.1 P89 New Tests (新增)

P89 新增的 regression tests 应覆盖以下断言（2 variants × 3 choices）：

#### Group 1: Payoff Event Wiring (事件配置)

| # | Assertion | Priority |
|---|-----------|----------|
| R1 | `medical_payoff_compassionate` 事件存在于 `sample-lines-spine.json` | P0 |
| R2 | `medical_payoff_pragmatic` 事件存在于 `sample-lines-spine.json` | P0 |
| R3 | Compassionate 事件类型为 choice，有 3 个选项 | P0 |
| R4 | Pragmatic 事件类型为 choice，有 3 个选项 | P0 |
| R5 | Compassionate 事件触发条件包含 `medical_midlife_pressure_done` + `tavern_medical_pressure_compassionate` | P0 |
| R6 | Pragmatic 事件触发条件包含 `medical_midlife_pressure_done` + `tavern_medical_pressure_pragmatic` | P0 |
| R7 | Compassionate 事件年龄范围是 42-46 | P0 |
| R8 | Pragmatic 事件年龄范围是 43-47 | P0 |
| R9 | 两个事件都设置 `medical_payoff_done` flag | P0 |
| R10 | 两个事件都设置 `medical_age40_identity_done` flag | P0 |

#### Group 2: Pre-Payoff State (payoff 前状态)

| # | Assertion | Priority |
|---|-----------|----------|
| R11 | Pressure done 但 payoff 未 done 时，compassionate cost label 是 "仁心耗尽" | P0 |
| R12 | Pressure done 但 payoff 未 done 时，pragmatic cost label 是 "人情债缠身" | P0 |
| R13 | Pressure done 但 payoff 未 done 时，compassionate current goal 是 pressure 状态 | P0 |
| R14 | Pressure done 但 payoff 未 done 时，pragmatic current goal 是 pressure 状态 | P0 |

#### Group 3: Compassionate Variant — 3 Choices (Compassionate 三个选项)

| # | Assertion | Priority |
|---|-----------|----------|
| R15 | Choice A (硬扛): `tavern_medical_payoff_compassionate_holder` 设置 + stats 正确 (con-2, chivalry+3, rep+2) | P0 |
| R16 | Choice A: cost label = "油尽灯枯" | P0 |
| R17 | Choice A: sample line current goal 正确 | P0 |
| R18 | Choice A: ordinary origin current goal 正确 | P0 |
| R19 | Choice B (放手): `tavern_medical_payoff_compassionate_let_go` 设置 + stats 正确 (con+2, chivalry-1, rep-1, charisma+1) | P0 |
| R20 | Choice B: cost label = "释然行医" | P0 |
| R21 | Choice B: sample line current goal 正确 | P0 |
| R22 | Choice B: ordinary origin current goal 正确 | P0 |
| R23 | Choice C (传承): `tavern_medical_payoff_compassionate_legacy` 设置 + stats 正确 (con+1, rep+1, chivalry+1, charisma+2) | P0 |
| R24 | Choice C: cost label = "仁心传承" | P0 |
| R25 | Choice C: sample line current goal 正确 | P0 |
| R26 | Choice C: ordinary origin current goal 正确 | P0 |

#### Group 4: Pragmatic Variant — 3 Choices (Pragmatic 三个选项)

| # | Assertion | Priority |
|---|-----------|----------|
| R27 | Choice A (硬扛): `tavern_medical_payoff_pragmatic_holder` 设置 + stats 正确 (rep+4, con+3, money+60, chivalry-2) | P0 |
| R28 | Choice A: cost label = "声名所累" | P0 |
| R29 | Choice A: sample line current goal 正确 | P0 |
| R30 | Choice A: ordinary origin current goal 正确 | P0 |
| R31 | Choice B (撕破): `tavern_medical_payoff_pragmatic_breaker` 设置 + stats 正确 (rep-3, con-5, charisma-1, con+2, chivalry+1) | P0 |
| R32 | Choice B: cost label = "快意江湖" | P0 |
| R33 | Choice B: sample line current goal 正确 | P0 |
| R34 | Choice B: ordinary origin current goal 正确 | P0 |
| R35 | Choice C (练达): `tavern_medical_payoff_pragmatic_master` 设置 + stats 正确 (rep+2, con+1, charisma+4, money+30) | P0 |
| R36 | Choice C: cost label = "人情练达" | P0 |
| R37 | Choice C: sample line current goal 正确 | P0 |
| R38 | Choice C: ordinary origin current goal 正确 | P0 |

#### Group 5: Age-40 Identity (Bonus P1)

| # | Assertion | Priority |
|---|-----------|----------|
| R39 | Compassionate A: age-40 identity = "油尽灯枯的仁心医者" | P1 |
| R40 | Compassionate B: age-40 identity = "释然通透的医者" | P1 |
| R41 | Compassionate C: age-40 identity = "传道授业的仁医之师" | P1 |
| R42 | Pragmatic A: age-40 identity = "声名赫赫的权贵御医" | P1 |
| R43 | Pragmatic B: age-40 identity = "快意恩仇的江湖游医" | P1 |
| R44 | Pragmatic C: age-40 identity = "人情练达的一代名医" | P1 |

#### Group 6: Life Memory + Summary (Bonus P1)

| # | Assertion | Priority |
|---|-----------|----------|
| R45 | Compassionate 3 choices 的 life memory 各有不同文本 | P1 |
| R46 | Pragmatic 3 choices 的 life memory 各有不同文本 | P1 |
| R47 | Compassionate 3 choices 的 summary 各有不同文本 | P1 |
| R48 | Pragmatic 3 choices 的 summary 各有不同文本 | P1 |

#### Group 7: Variant Differentiation (两个 variant 有区分)

| # | Assertion | Priority |
|---|-----------|----------|
| R49 | Compassionate 与 pragmatic 的 payoff cost label 不同（所有 3+3 组合） | P0 |
| R50 | Compassionate A 与 Pragmatic A 的 identity 不同（虽然都叫"硬扛"，但内容不同） | P0 |
| R51 | Compassionate 与 pragmatic 的 current goal 有本质差异 | P0 |
| R52 | 6 个分支的 identity 全部不同 | P1 |

#### Group 8: Distinct from Other Routes (与其他路线 payoff 区分)

| # | Assertion | Priority |
|---|-----------|----------|
| R53 | Medical payoff 与 merchant payoff 模式不同（choice vs auto） | P0 |
| R54 | Medical compassionate payoff 与 renown payoff 风味不同（仁心 vs 人情） | P1 |
| R55 | Medical pragmatic payoff 与 renown payoff 风味不同（权贵 vs 江湖） | P1 |

#### Group 9: No Regression of P83/P84/P85/P87 (既有功能不退化)

| # | Assertion | Priority |
|---|-----------|----------|
| R56 | P83 bridge 事件仍能正常触发 | P0 |
| R57 | P84 entry differentiation 仍正常工作 | P0 |
| R58 | P85 on-ramp 事件仍能正常触发（2 variants） | P0 |
| R59 | P85 on-ramp expression 仍正常显示（2 variants） | P0 |
| R60 | P87 pressure 事件仍能正常触发（2 variants） | P0 |
| R61 | P87 pressure expression 仍正常显示（2 variants） | P0 |
| R62 | `detectSampleLine()` 优先级不变（medical > renown > merchant） | P0 |

### 3.2 Test Count Estimate

- **P0 断言：** 约 40-45 个
- **P1 断言：** 约 15-20 个
- **总计：约 55-65 个断言**

比 P77 renown payoff 多一些，因为有 2 个 variant × 3 个 choices = 6 个分支。模式与 P87 pressure 类似，但分支更多。

---

## 4. What Counts As Payoff Closed

### 4.1 Closure Criteria (Done Definition)

P89 payoff 阶段算 closed 的标准：

| # | Criterion | Method |
|---|-----------|--------|
| C1 | **Compassionate payoff event fires** | Targeted proof 显示节点 2 (compassionate) |
| C2 | **Pragmatic payoff event fires** | Targeted proof 显示节点 2 (pragmatic) |
| C3 | **6 choices all work** | 每个选项都设置正确的 flags + stats |
| C4 | **Checkpoint flags set (shared)** | `medical_payoff_done` + `medical_age40_identity_done` = true |
| C5 | **6 choice markers set** | 6 个 choice-specific flags 都正确设置（三选一） |
| C6 | **Cost label updates (all 6 branches)** | 6 个 cost label 都正确 |
| C7 | **Current goal updates (all 6 branches)** | sample line + ordinary origin 都正确 |
| C8 | **Two-variant differentiation** | 两个 variant 的 payoff 有本质差异 |
| C9 | **Six-branch differentiation** | 6 个分支的 identity 全部不同 |
| C10 | **Tavern-born healer flavor consistent** | Manual review of all text |
| C11 | **No P83/P84/P85/P87 regressions** | 所有既有测试通过 |
| C12 | **Typecheck passes** | `tsc --noEmit` 通过 |
| C13 | **Guard: sample-lines-baseline passes** | baseline guard 通过 |
| C14 | **Late-life flag interfaces reserved** | 命名和预留位置正确 |

**14 条标准全部满足才算 payoff closed。**

### 4.2 Must-Have vs Nice-to-Have

**Must-have (P0):**
- C1-C8: 核心功能完整（2 events + 6 choices + flags + 2 个核心表达更新 × 6 branches）
- C10-C13: 质量闸门 + 风味一致性

**Nice-to-have (P1):**
- Age-40 identity 文本更新（6 branches）
- Life memory + summary 表达更新（6 branches）
- 与 merchant/renown payoff 的文字区分度验证
- Bonus 节点的 targeted proof
- 6 个分支的全部 identity 差异化验证

---

## 5. Regression Boundaries for P83/P84/P85/P87 Existing Evidence

### 5.1 What Must Not Regress

P89 实施后，以下既有证据必须保持通过：

| Stage | Evidence | Verification |
|-------|----------|--------------|
| **P83 Bridge** | Bridge 事件触发 + flag 设置 + 3 expression 更新 | P83 bridge tests 通过 |
| **P84 Entry** | 7 expression surfaces 差异化 + detectSampleLine() 识别 | P84 entry tests 通过 |
| **P85 On-ramp** | On-ramp 事件触发（2 variants）+ checkpoint flag + 4 expression 更新 | P85 on-ramp tests 通过 |
| **P87 Pressure** | Pressure 事件触发（2 variants）+ checkpoint flag + 5 expression 更新 | P87 pressure tests 通过 |
| **Sample line baseline** | baseline guard 全量通过 | `guard:sample-lines-baseline` 通过 |
| **Typecheck** | TypeScript 类型检查通过 | `tsc --noEmit` 通过 |
| **Renown payoff (P77)** | Renown payoff 不退化（互不干扰） | P77 tests 通过（若存在） |
| **Renown pressure (P75)** | Renown pressure 不退化 | P75 tests 通过 |
| **Merchant pressure** | Merchant pressure 不退化 | Merchant pressure tests 通过 |

### 5.2 What Is Allowed to Change

以下内容允许变化（因为是 payoff 阶段的正常更新）：

- Sample line current goal（pressure → payoff，6 branches）
- Sample line cost label（仁心耗尽/人情债缠身 → 6 个新 label）
- Sample line age-40 identity（新增 payoff 后身份）
- Ordinary origin current goal（pressure → payoff，6 branches）
- Ordinary origin life memory（新增 payoff 文本，6 branches）
- Ordinary origin summary（pressure → payoff，6 branches）

这些是 payoff 阶段的预期变化，不算 regression。

### 5.3 Regression Guard Strategy

P89 实施时，应先跑：
1. 先跑 P83/P84/P85/P87 既有测试，确认 baseline 通过
2. 新增 payoff 测试（先写测试再实现——如果遵循 TDD 的话）
3. 实施 payoff 代码
4. 再跑全部测试，确认既有测试都通过
5. 最后跑 typecheck + baseline guard

---

## 6. Validation Pattern Reference

### 6.1 Precedent From Previous Stages

| Stage | Proof Nodes | Test Count | Pattern |
|-------|-----------|------------|---------|
| P76→P77 Renown Payoff | ~16 nodes (11 core) | ~25 tests | Targeted proof + narrow regression |
| P85 Medical On-Ramp | 8 test groups | 8/8 tests | Targeted proof + narrow regression (2 var) |
| P86→P87 Medical Pressure | ~26 nodes (12 core, 2 var) | ~30-35 tests | Targeted proof + narrow regression (2 var) |
| **P88→P89 Medical Payoff** | **~40+ nodes (30+ core, 6 branches)** | **~55-65 tests** | **Targeted proof + narrow regression (6 branches)** |

模式一致：targeted proof 证明链路通，narrow regression 确保不退化。但 medical payoff 因为有 6 个分支，节点和断言数量大约是 renown payoff 的 2 倍多。

### 6.2 Why This Shape

为什么选这个验证形状：

1. **与先例一致**：P70→P71、P73、P75、P77 都是这个模式，验证成本最低
2. **覆盖 6 branches**：medical payoff 有 2 variants × 3 choices，必须都覆盖
3. **足够证明**：30+ 核心节点足以证明 payoff 链路是通的
4. **不做过度**：不需要 full lifetime exhaust，符合 small-step
5. **风味可检查**：tavern-born healer 风味通过 manual review 验证
6. **有回归防护**：P83/P84/P85/P87 既有测试确保不退化
7. **6-branch 差异化可验证**：专门的 test group 验证 6 个分支都不同

---

## 7. P89 Exit Checklist

P89 完成时的 checklist：

- [ ] Compassionate payoff 事件配置正确（触发条件、年龄范围 42-46、choice 类型、3 个选项、flag 设置）
- [ ] Pragmatic payoff 事件配置正确（触发条件、年龄范围 43-47、choice 类型、3 个选项、flag 设置）
- [ ] 共享 checkpoint: `medical_payoff_done` + `medical_age40_identity_done`
- [ ] 6 个 choice markers: 3 compassionate + 3 pragmatic
- [ ] 2 个核心 expression 更新（cost label + current goal）× 6 branches × 2 surfaces = 24 个核心更新
- [ ] Bonus expression 更新（age-40 identity + life memory + summary）× 6 branches
- [ ] Targeted proof 文档（30+ 核心节点，6 branches）
- [ ] ~55-65 个 regression assertions（9 groups）
- [ ] P83/P84/P85/P87 既有测试全部通过
- [ ] Renown/merchant pressure 不退化
- [ ] Typecheck 通过
- [ ] Sample-lines-baseline guard 通过
- [ ] Tavern-born healer 风味 review 通过
- [ ] Two-variant differentiation 验证通过
- [ ] Six-branch differentiation 验证通过
- [ ] Late-life flag 接口预留
- [ ] Closure report 输出

---

## 8. Evidence Format

### Targeted Proof Document
- 文件名：`docs/test-reports/p89-medical-payoff-targeted-proof.md`
- 结构：按 core node 顺序排列，每个 node 有证据说明，6 branches 分别列出
- Bonus nodes 单独列在后面

### Test Suite
- 文件名：`tests/p89TavernHandMedicalPayoffSpineTests.ts`
- 按 Group 1-9 组织测试
- 每个测试有清晰的描述和断言

### Closure Report
- 文件名：`docs/test-reports/p89-medical-payoff-closure-report.md`
- 包含：targeted proof 摘要、regression 结果、closure criteria 检查表、handoff 给下一阶段的内容

---

**P88-005 complete.** Validation shape saved.

# P91 Validation Shape — Medical Late-Life Implementation

> **Date:** 2026-06-29
> **Source:** P90 Medical Late-Life Design-First
> **Target stage:** P91 Medical Late-Life Implementation
> **Route:** `medical_sage_healer`（一代名医）
> **Origin:** `tavern_hand`（酒肆帮工）
> **Variants:** Compassionate (仁心医者) + Pragmatic (世故人医)
> **Branches:** 2 variants × 3 choices = 6 late-life branches

---

## 1. Purpose

本文件定义 P91（late-life implementation 阶段）的验证形状：targeted proof 需要展示哪些链路节点、regression tests 至少覆盖哪些断言、什么证据算 late-life closed。目的是在 implementation 开始前就锁定验证标准，避免 P91 实施后再争论"什么算 done"。

本验证形状基于 P78→P79（renown late-life）的验证模式，并扩展到 medical 路线的 2-variant × 3-choice = 6-branch 结构。**关键区别：medical late-life 有 6 个分支（renown 只有 3 个），验证需覆盖全部 6 个分支。**

---

## 2. Targeted Proof Chain

Targeted proof 是 P91 的核心验证——证明 late-life 链路是通的（6 个分支各一条链路）。

### 2.1 Chain Nodes Overview (6 Branches)

Targeted proof 需展示以下链路节点（每个分支各一套）：

| # | Node | Type | Verification Point |
|---|------|------|-----------------|
| 1 | **Pre-late-life state** | baseline (P89 后，P91 前) | `medical_payoff_done` = true, `medical_late_life_done` = false, payoff expression 正确 |
| 2 | **Late-life event fires** | **P91 core** | `medical_late_life` 在正确年龄触发（52-56 岁） |
| 3 | **Branch Comp-A: flags set** | **P91 core** | `medical_late_life_done` + `medical_late_life_identity_done` + `tavern_medical_late_compassionate_final` 都设置 |
| 4 | **Branch Comp-A: stats correct** | **P91 core** | stat 变化与 contract 一致（con-3, chivalry+3, rep+2, charisma+1） |
| 5 | **Branch Comp-B: flags set** | **P91 core** | `medical_late_life_done` + `medical_late_life_identity_done` + `tavern_medical_late_compassionate_peaceful` 都设置 |
| 6 | **Branch Comp-B: stats correct** | **P91 core** | stat 变化与 contract 一致（con+2, charisma+3, chivalry+1, rep+1） |
| 7 | **Branch Comp-C: flags set** | **P91 core** | `medical_late_life_done` + `medical_late_life_identity_done` + `tavern_medical_late_compassionate_legacy` 都设置 |
| 8 | **Branch Comp-C: stats correct** | **P91 core** | stat 变化与 contract 一致（rep+4, chivalry+2, charisma+2, conn+2） |
| 9 | **Branch Prag-A: flags set** | **P91 core** | `medical_late_life_done` + `medical_late_life_identity_done` + `tavern_medical_late_pragmatic_fallen` 都设置 |
| 10 | **Branch Prag-A: stats correct** | **P91 core** | stat 变化与 contract 一致（rep-3, conn-4, money-2, charisma+2, con+1） |
| 11 | **Branch Prag-B: flags set** | **P91 core** | `medical_late_life_done` + `medical_late_life_identity_done` + `tavern_medical_late_pragmatic_wanderer` 都设置 |
| 12 | **Branch Prag-B: stats correct** | **P91 core** | stat 变化与 contract 一致（con+2, chivalry+2, charisma+2, conn-3） |
| 13 | **Branch Prag-C: flags set** | **P91 core** | `medical_late_life_done` + `medical_late_life_identity_done` + `tavern_medical_late_pragmatic_master` 都设置 |
| 14 | **Branch Prag-C: stats correct** | **P91 core** | stat 变化与 contract 一致（rep+4, conn+3, charisma+3, money+2, con+1） |
| 15 | **Cost label per branch** | **P91 core** | 6 个分支各自的 cost label 正确 |
| 16 | **Current goal per branch (sample line)** | **P91 core** | 6 个分支各自的 sample line current goal 正确 |
| 17 | **Current goal per branch (ordinary origin)** | **P91 core** | 6 个分支各自的 ordinary origin current goal 正确 |
| 18 | **Late-life identity per branch** | P91 bonus | 6 个分支各自的 late-life identity 文本正确 |
| 19 | **Life memory per branch** | P91 bonus | Ordinary origin 的 life memory 按 branch 更新 |
| 20 | **Origin summary per branch** | P91 bonus | Ordinary origin 的 summary 按 branch 更新 |
| 21 | **Full chain traceback** | P91 bonus | 从 bridge → entry → on-ramp → pressure → payoff → late-life 完整链路回溯 |
| 22 | **Variant-level differentiation** | P91 bonus | Compassionate 与 pragmatic late-life 有本质差异（body/spirit vs social/position） |

### 2.2 Core Nodes (Must Show — Per Branch)

每个分支必须展示的核心节点（P0）：

1. **节点 1:** Pre-late-life state — payoff done, late-life not done
2. **节点 2:** Late-life event fires — 在正确年龄范围触发
3. **节点 3-4 (or 5-6, etc.):** Branch flags + stats
4. **节点 15:** Cost label 更新（6 branches）
5. **节点 16-17:** Current goal 更新（sample line + ordinary origin，6 branches each）

6 个分支 × 约 8 个核心节点组 = **约 48 个核心验证点**。

### 2.3 Bonus Nodes (Nice to Show)

加分节点（P1，有时间就做）：

1. 节点 18: Late-life identity 更新（6 branches）
2. 节点 19: Life memory 更新（6 branches）
3. 节点 20: Summary 更新（6 branches）
4. 节点 21: 完整链路回溯（bridge → entry → on-ramp → pressure → payoff → late-life）
5. 节点 22: Variant 级别的差异化验证

### 2.4 No Full Lifetime Exhaust Required

**不需要**：
- Full birth-to-death 穷举
- 多种子组合爆炸
- 所有 origin × 所有 route 的组合验证
- 6 个分支的所有可能排列组合
- Stat 阈值的边界测试
- Endgame / final legacy 内容验证

只需要 targeted 的 targeted proof：6 条基准路径（2 variants × 3 choices）上的 late-life 链路打通。

---

## 3. Regression Tests

### 3.1 P91 New Tests (新增)

P91 新增的 regression tests 应覆盖以下断言（6 branches）：

#### Group 1: Late-Life Event Wiring (事件配置)

| # | Assertion | Priority |
|---|-----------|----------|
| R1 | `medical_late_life` 事件存在于 `sample-lines-spine.json` | P0 |
| R2 | 事件类型为 auto | P0 |
| R3 | 事件触发条件包含 `medical_payoff_done` | P0 |
| R4 | 事件触发条件包含 `!medical_late_life_done` (互斥 guard) | P0 |
| R5 | 事件年龄范围是 52-56 | P0 |
| R6 | 事件排除 orthodox/demonic childhood seeds | P0 |
| R7 | 事件设置 `medical_late_life_done` flag | P0 |
| R8 | 事件设置 `medical_late_life_identity_done` flag | P0 |
| R9 | 事件设置正确的 6 个 branch-specific marker（六选一） | P0 |
| R10 | 事件设置 event_record: `medical_late_life` | P0 |

#### Group 2: Pre-Late-Life State (late-life 前状态)

| # | Assertion | Priority |
|---|-----------|----------|
| R11 | Payoff done 但 late-life 未 done 时，compassionate-A cost label 是 "油尽灯枯" | P0 |
| R12 | Payoff done 但 late-life 未 done 时，pragmatic-A cost label 是 "声名所累" | P0 |
| R13 | Payoff done 但 late-life 未 done 时，current goal 是 payoff 状态 | P0 |
| R14 | Payoff done 但 late-life 未 done 时，age-40 identity 是 payoff 状态 | P0 |

#### Group 3: Compassionate Variant — 3 Branches (Compassionate 三个分支)

| # | Assertion | Priority |
|---|-----------|----------|
| R15 | Branch Comp-A: `tavern_medical_late_compassionate_final` 设置 + stats 正确（con-3, chivalry+3, rep+2, charisma+1） | P0 |
| R16 | Branch Comp-A: cost label = "最后仁心" | P0 |
| R17 | Branch Comp-A: sample line current goal 正确 | P0 |
| R18 | Branch Comp-A: ordinary origin current goal 正确 | P0 |
| R19 | Branch Comp-B: `tavern_medical_late_compassionate_peaceful` 设置 + stats 正确（con+2, charisma+3, chivalry+1, rep+1） | P0 |
| R20 | Branch Comp-B: cost label = "从容自在" | P0 |
| R21 | Branch Comp-B: sample line current goal 正确 | P0 |
| R22 | Branch Comp-B: ordinary origin current goal 正确 | P0 |
| R23 | Branch Comp-C: `tavern_medical_late_compassionate_legacy` 设置 + stats 正确（rep+4, chivalry+2, charisma+2, conn+2） | P0 |
| R24 | Branch Comp-C: cost label = "仁心传承" | P0 |
| R25 | Branch Comp-C: sample line current goal 正确 | P0 |
| R26 | Branch Comp-C: ordinary origin current goal 正确 | P0 |

#### Group 4: Pragmatic Variant — 3 Branches (Pragmatic 三个分支)

| # | Assertion | Priority |
|---|-----------|----------|
| R27 | Branch Prag-A: `tavern_medical_late_pragmatic_fallen` 设置 + stats 正确（rep-3, conn-4, money-2, charisma+2, con+1） | P0 |
| R28 | Branch Prag-A: cost label = "人走茶凉" | P0 |
| R29 | Branch Prag-A: sample line current goal 正确 | P0 |
| R30 | Branch Prag-A: ordinary origin current goal 正确 | P0 |
| R31 | Branch Prag-B: `tavern_medical_late_pragmatic_wanderer` 设置 + stats 正确（con+2, chivalry+2, charisma+2, conn-3） | P0 |
| R32 | Branch Prag-B: cost label = "逍遥自在" | P0 |
| R33 | Branch Prag-B: sample line current goal 正确 | P0 |
| R34 | Branch Prag-B: ordinary origin current goal 正确 | P0 |
| R35 | Branch Prag-C: `tavern_medical_late_pragmatic_master` 设置 + stats 正确（rep+4, conn+3, charisma+3, money+2, con+1） | P0 |
| R36 | Branch Prag-C: cost label = "德高望重" | P0 |
| R37 | Branch Prag-C: sample line current goal 正确 | P0 |
| R38 | Branch Prag-C: ordinary origin current goal 正确 | P0 |

#### Group 5: Late-Life Identity (Bonus P1)

| # | Assertion | Priority |
|---|-----------|----------|
| R39 | Comp-A: late-life identity = "燃尽自己的最后仁心" | P1 |
| R40 | Comp-B: late-life identity = "从容自在的老者" | P1 |
| R41 | Comp-C: late-life identity = "仁心满天下的老宗师" | P1 |
| R42 | Prag-A: late-life identity = "失势的老御医" | P1 |
| R43 | Prag-B: late-life identity = "逍遥自在的老游医" | P1 |
| R44 | Prag-C: late-life identity = "德高望重的老名医" | P1 |

#### Group 6: Life Memory + Summary (Bonus P1)

| # | Assertion | Priority |
|---|-----------|----------|
| R45 | Compassionate 3 branches 的 life memory 各有不同文本 | P1 |
| R46 | Pragmatic 3 branches 的 life memory 各有不同文本 | P1 |
| R47 | Compassionate 3 branches 的 summary 各有不同文本 | P1 |
| R48 | Pragmatic 3 branches 的 summary 各有不同文本 | P1 |

#### Group 7: Variant Differentiation (两个 variant 有区分)

| # | Assertion | Priority |
|---|-----------|----------|
| R49 | Compassionate 与 pragmatic 的 late-life cost label 不同（所有 3+3 组合） | P0 |
| R50 | Compassionate late-life 是 body/spirit 轴（constitution + chivalry 主导） | P0 |
| R51 | Pragmatic late-life 是 social/position 轴（reputation + connections + money 主导） | P0 |
| R52 | Compassionate 与 pragmatic 的 current goal 有本质差异 | P0 |
| R53 | 6 个分支的 identity 全部不同 | P1 |

#### Group 8: Distinct from Renown Late-Life (与 renown late-life 区分)

| # | Assertion | Priority |
|---|-----------|----------|
| R54 | Medical late-life 有 6 branches（renown 只有 3 个） | P0 |
| R55 | Medical compassionate late-life 与 renown late-life 风味不同（仁心医者 vs 江湖名声） | P1 |
| R56 | Medical pragmatic late-life 与 renown late-life 风味不同（权贵御医 vs 江湖人情） | P1 |
| R57 | Medical late-life stat 配置与 renown late-life 不同（chivalry + constitution vs pure social） | P1 |

#### Group 9: No Regression of P83/P84/P85/P87/P89 (既有功能不退化)

| # | Assertion | Priority |
|---|-----------|----------|
| R58 | P83 bridge 事件仍能正常触发 | P0 |
| R59 | P84 entry differentiation 仍正常工作 | P0 |
| R60 | P85 on-ramp 事件仍能正常触发（2 variants） | P0 |
| R61 | P85 on-ramp expression 仍正常显示（2 variants） | P0 |
| R62 | P87 pressure 事件仍能正常触发（2 variants） | P0 |
| R63 | P87 pressure expression 仍正常显示（2 variants） | P0 |
| R64 | P89 payoff 事件仍能正常触发（2 variants × 3 choices） | P0 |
| R65 | P89 payoff expression 仍正常显示（6 branches） | P0 |
| R66 | `detectSampleLine()` 优先级不变（medical > renown > merchant） | P0 |
| R67 | Renown late-life (P79) 不退化（互不干扰） | P1 |

### 3.2 Test Count Estimate

- **P0 断言：** 约 45-50 个
- **P1 断言：** 约 15-20 个
- **总计：约 60-70 个断言**

比 P79 renown late-life（约 20-25 个）多很多，因为有 6 个分支（renown 只有 3 个）+ 2 个 variant 的差异化验证。模式与 P89 payoff 类似，但分支更多（6 vs 6 是一样的，但 late-life 是 auto 事件，不需要验证 choice 显示）。

---

## 4. What Counts As Late-Life Closed

### 4.1 Closure Criteria (Done Definition)

P91 late-life 阶段算 closed 的标准：

| # | Criterion | Method |
|---|-----------|--------|
| C1 | **Late-life auto event fires correctly** | Targeted proof 显示节点 2 |
| C2 | **6 branches all work** | 每个分支都设置正确的 flags + stats |
| C3 | **Checkpoint flags set (shared)** | `medical_late_life_done` + `medical_late_life_identity_done` = true |
| C4 | **6 branch markers set correctly** | 6 个 branch-specific flags 都正确设置（六选一） |
| C5 | **Cost label updates (all 6 branches)** | 6 个 cost label 都正确 |
| C6 | **Current goal updates (all 6 branches)** | sample line + ordinary origin 都正确 |
| C7 | **Two-variant differentiation verified** | 两个 variant 的 late-life 有本质差异（body/spirit vs social/position） |
| C8 | **Six-branch differentiation verified** | 6 个分支的 identity 全部不同 |
| C9 | **Tavern-born healer flavor consistent** | Manual review of all text |
| C10 | **No P83/P84/P85/P87/P89 regressions** | 所有既有测试通过 |
| C11 | **Typecheck passes** | `tsc --noEmit` 通过 |
| C12 | **Guard: sample-lines-baseline passes** | baseline guard 通过 |
| C13 | **Endgame flag interface reserved** | `medical_endgame_echo_done` 命名和预留位置正确 |
| C14 | **Clearly differentiated from renown late-life** | 6 branches vs 3, healer identity vs jianghu identity |

**14 条标准全部满足才算 late-life closed。**（与 P89 payoff 的 14 条对应，保持一致模式）

### 4.2 Must-Have vs Nice-to-Have

**Must-have (P0):**
- C1-C7: 核心功能完整（1 event + 6 branches + flags + 2 个核心表达更新 × 6 branches）
- C9-C12: 质量闸门 + 风味一致性

**Nice-to-have (P1):**
- Late-life identity 文本更新（6 branches）
- Life memory + summary 表达更新（6 branches）
- 与 renown late-life 的文字区分度验证
- Bonus 节点的 targeted proof
- 6 个分支的全部 identity 差异化验证

---

## 5. Regression Boundaries for P83/P84/P85/P87/P89 Existing Evidence

### 5.1 What Must Not Regress

P91 实施后，以下既有证据必须保持通过：

| Stage | Evidence | Verification |
|-------|----------|--------------|
| **P83 Bridge** | Bridge 事件触发 + flag 设置 + 3 expression 更新 | P83 bridge tests 通过 |
| **P84 Entry** | 7 expression surfaces 差异化 + detectSampleLine() 识别 | P84 entry tests 通过 |
| **P85 On-ramp** | On-ramp 事件触发（2 variants）+ checkpoint flag + 4 expression 更新 | P85 on-ramp tests 通过 |
| **P87 Pressure** | Pressure 事件触发（2 variants）+ checkpoint flag + 5 expression 更新 | P87 pressure tests 通过 |
| **P89 Payoff** | Payoff 事件触发（2 variants × 3 choices）+ checkpoint flags + 5 expression 更新 | P89 payoff tests 通过 |
| **Sample line baseline** | baseline guard 全量通过 | `guard:sample-lines-baseline` 通过 |
| **Typecheck** | TypeScript 类型检查通过 | `tsc --noEmit` 通过 |
| **Renown late-life (P79)** | Renown late-life 不退化（互不干扰） | P79 tests 通过（若存在） |
| **Renown payoff (P77)** | Renown payoff 不退化 | P77 tests 通过 |
| **Merchant pressure** | Merchant pressure 不退化 | Merchant pressure tests 通过 |

### 5.2 What Is Allowed to Change

以下内容允许变化（因为是 late-life 阶段的正常更新）：

- Sample line current goal（payoff → late-life，6 branches）
- Sample line cost label（6 个 payoff label → 6 个 late-life label）
- Sample line age-40 identity（新增 late-life identity 层，优先级更高）
- Ordinary origin current goal（payoff → late-life，6 branches）
- Ordinary origin life memory（新增 late-life 文本，6 branches）
- Ordinary origin summary（payoff → late-life，6 branches）

这些是 late-life 阶段的预期变化，不算 regression。

### 5.3 Regression Guard Strategy

P91 实施时，应先跑：
1. 先跑 P83/P84/P85/P87/P89 既有测试，确认 baseline 通过
2. 新增 late-life 测试（先写测试再实现——如果遵循 TDD 的话）
3. 实施 late-life 代码
4. 再跑全部测试，确认既有测试都通过
5. 最后跑 typecheck + baseline guard

---

## 6. Validation Pattern Reference

### 6.1 Precedent From Previous Stages

| Stage | Proof Nodes | Test Count | Pattern |
|-------|-----------|------------|---------|
| P78→P79 Renown Late-Life | ~13 nodes (8 core) | ~20-25 tests | Targeted proof + narrow regression (3 branches) |
| P85 Medical On-Ramp | 8 test groups | 8/8 tests | Targeted proof + narrow regression (2 var) |
| P87 Medical Pressure | ~26 nodes (12 core, 2 var) | ~30-35 tests | Targeted proof + narrow regression (2 var) |
| P89 Medical Payoff | ~40+ nodes (30+ core, 6 branches) | ~55-65 tests | Targeted proof + narrow regression (6 branches) |
| **P90→P91 Medical Late-Life** | **~48+ nodes (40+ core, 6 branches)** | **~60-70 tests** | **Targeted proof + narrow regression (6 branches + var diff)** |

模式一致：targeted proof 证明链路通，narrow regression 确保不退化。但 medical late-life 因为有 6 个分支 + 2-variant 差异化验证，节点和断言数量比 renown late-life 多很多。

### 6.2 Why This Shape

为什么选这个验证形状：

1. **与先例一致**：P78→P79、P85、P87、P89 都是这个模式，验证成本最低
2. **覆盖 6 branches**：medical late-life 有 2 variants × 3 choices，必须都覆盖
3. **Variant 差异化验证**：专门验证 compassionate vs pragmatic 的 late-life 轴不同（body/spirit vs social/position）
4. **足够证明**：40+ 核心节点足以证明 late-life 链路是通的
5. **不做过度**：不需要 full lifetime exhaust，符合 small-step
6. **风味可检查**：tavern-born healer 风味通过 manual review 验证
7. **有回归防护**：P83/P84/P85/P87/P89 既有测试确保不退化
8. **6-branch 差异化可验证**：专门的 test group 验证 6 个分支都不同
9. **与 renown late-life 区分**：确保 medical late-life 不是 renown 的翻版

---

## 7. P91 Exit Checklist

P91 完成时的 checklist：

- [ ] Late-life auto 事件配置正确（触发条件、年龄范围 52-56、auto 类型、6 分支逻辑、flag 设置）
- [ ] 共享 checkpoint: `medical_late_life_done` + `medical_late_life_identity_done`
- [ ] 6 个 branch markers: 3 compassionate + 3 pragmatic
- [ ] 2 个核心 expression 更新（cost label + current goal）× 6 branches × 2 surfaces = 24 个核心更新
- [ ] Bonus expression 更新（late-life identity + life memory + summary）× 6 branches
- [ ] Targeted proof 文档（40+ 核心节点，6 branches）
- [ ] ~60-70 个 regression assertions（9 groups）
- [ ] P83/P84/P85/P87/P89 既有测试全部通过
- [ ] Renown late-life / payoff 不退化
- [ ] Typecheck 通过
- [ ] Sample-lines-baseline guard 通过
- [ ] Tavern-born healer 风味 review 通过
- [ ] Two-variant differentiation 验证通过（body/spirit vs social/position）
- [ ] Six-branch differentiation 验证通过
- [ ] Endgame flag 接口预留
- [ ] Closure report 输出

---

## 8. Evidence Format

### Targeted Proof Document
- 文件名：`docs/test-reports/p91-medical-late-life-targeted-proof.md`
- 结构：按 core node 顺序排列，每个 node 有证据说明，6 branches 分别列出
- Bonus nodes 单独列在后面

### Test Suite
- 文件名：`tests/p91TavernHandMedicalLateLifeSpineTests.ts`
- 按 Group 1-9 组织测试
- 每个测试有清晰的描述和断言

### Closure Report
- 文件名：`docs/test-reports/p91-medical-late-life-closure-report.md`
- 包含：targeted proof 摘要、regression 结果、closure criteria 检查表、handoff 给下一阶段的内容

---

**P90-005 complete.** Validation shape saved.

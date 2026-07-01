# P76 — P77 Validation Shape

> **Purpose:** 预先锁定 P77（payoff implementation）的验证框架，确保 implementation 阶段按明确的标准被评判，而不是边做边改标准。
> **Source:** Based on P76 payoff contract and existing renown route validation patterns (P71/P72/P73/P75).

## 1. Overview

P77 = renown payoff implementation stage。验证分三层：

1. **Targeted proof** — 展示核心链路（pressure → payoff → expression changes），每个 choice 方向各走一遍
2. **Narrow regression** — 覆盖关键断言，确保没有回归
3. **Closure criteria** — 9 项验收标准，全部满足才算 payoff closed

**不需要 full lifetime exhaust。** 只验证 renown payoff 相关的链路。

---

## 2. Targeted Proof Chain Nodes

Targeted proof 需要展示从 pressure 到 payoff 的完整链路，以及 payoff 后的表达变化。

### Core Nodes（必须验证，共 11 个）

| # | Node | Description | Priority |
|---|------|-------------|----------|
| 1 | Pre-payoff baseline | Post-pressure state 正确：`renown_midlife_pressure_done` = true，cost label = "人情债渐重"，current goal = pressure 版本 | Core |
| 2 | Payoff event fires | `renown_midlife_payoff` 在 age 43-47 之间触发 | Core |
| 3 | Player sees 3 choices | 三个选项都正确显示，文案和 stat 预览正确 | Core |
| 4 | Option A: flags set | 选择 A 后，`renown_midlife_payoff_done` + `renown_age40_identity_done` + `tavern_renown_payoff_hard_holder` 都设置 | Core |
| 5 | Option A: stats correct | reputation +5, connections +3, charisma +2 | Core |
| 6 | Option B: flags set | 选择 B 后，`renown_midlife_payoff_done` + `renown_age40_identity_done` + `tavern_renown_payoff_breaker` 都设置 | Core |
| 7 | Option B: stats correct | reputation -2, connections -4, charisma -1 | Core |
| 8 | Option C: flags set | 选择 C 后，`renown_midlife_payoff_done` + `renown_age40_identity_done` + `tavern_renown_payoff_balancer` 都设置 | Core |
| 9 | Option C: stats correct | reputation +2, connections +1, charisma +3 | Core |
| 10 | Cost label per choice | 三个选项各自的 cost label 正确（声名之累 / 快意恩仇 / 人情练达） | Core |
| 11 | Current goal per choice | 三个选项各自的 current goal 正确 | Core |

### Bonus Nodes（验证了更好，不强制，共 5 个）

| # | Node | Description | Priority |
|---|------|-------------|----------|
| 12 | Age-40 identity per choice | 三个选项各自的 age-40 identity 文本正确 | Bonus |
| 13 | Life memory updates | Ordinary origin 的 life memory 按 choice 更新 | Bonus |
| 14 | Origin summary updates | Ordinary origin 的 summary 按 choice 更新 | Bonus |
| 15 | Full chain traceback | 从 bridge → entry → on-ramp → pressure → payoff 完整链路回溯 | Bonus |
| 16 | Mutex with other lines | 不与 orthodox/demonic/merchant payoff 冲突 | Bonus |

**Targeted proof 文档应包含：** 每个 core node 的验证证据（截图或日志），bonus node 可选。

---

## 3. Regression Test Groups

### Group 1: Event Wiring（4 tests）
- [ ] `renown_midlife_payoff` 事件存在于 sample-lines-spine.json
- [ ] 事件类型为 choice，有 3 个选项
- [ ] 触发条件正确：`renown_midlife_pressure_done` + `!renown_midlife_payoff_done` + 排除 orthodox/demonic
- [ ] 年龄范围正确：43-47 岁

### Group 2: Pre-Payoff State（2 tests）
- [ ] Post-pressure state 正确：cost label = "人情债渐重"
- [ ] Post-pressure state 正确：current goal = pressure 版本

### Group 3: Option A Post-Payoff（4 tests）
- [ ] Flags 正确设置：`renown_midlife_payoff_done` + `renown_age40_identity_done` + `tavern_renown_payoff_hard_holder`
- [ ] Stats 正确：reputation +5, connections +3, charisma +2
- [ ] Cost label = "声名之累"
- [ ] Current goal = "硬扛所有人情债，保住江湖名声"

### Group 4: Option B Post-Payoff（4 tests）
- [ ] Flags 正确设置：`renown_midlife_payoff_done` + `renown_age40_identity_done` + `tavern_renown_payoff_breaker`
- [ ] Stats 正确：reputation -2, connections -4, charisma -1
- [ ] Cost label = "快意恩仇"
- [ ] Current goal = "撕破脸皮，断了不该还的债"

### Group 5: Option C Post-Payoff（4 tests）
- [ ] Flags 正确设置：`renown_midlife_payoff_done` + `renown_age40_identity_done` + `tavern_renown_payoff_balancer`
- [ ] Stats 正确：reputation +2, connections +1, charisma +3
- [ ] Cost label = "人情练达"
- [ ] Current goal = "拿捏人情往来的分寸，找到平衡"

### Group 6: Distinct from Merchant Payoff（2 tests）
- [ ] Renown payoff 是 choice 事件，merchant payoff 是 auto 事件
- [ ] Renown cost label 与 merchant cost label 不同

### Group 7: No Regression — P71/P72/P73/P75（5 tests）
- [ ] P71 bridge 事件仍然正常触发和设置 flags
- [ ] P72 entry differentiation 仍然正确（renown 能被检测到）
- [ ] P73 on-ramp 事件仍然正常触发和设置 flags
- [ ] P75 pressure 事件仍然正常触发和设置 flags
- [ ] P75 pressure expression 仍然正确（未被 payoff 代码影响）

**预计总测试数：~25 tests**

---

## 4. Closure Criteria（9 项）

P77 完成时必须全部满足：

1. ✅ **Payoff event fires correctly** — `renown_midlife_payoff` 在正确的条件和年龄触发
2. ✅ **Three choices all work** — 每个选项都设置正确的 flags 和 stats
3. ✅ **Cost label updates per choice** — 三个选项的 cost label 都正确
4. ✅ **Current goal updates per choice** — 三个选项的 current goal 都正确
5. ✅ **Age-40 identity updates per choice** — 三个选项的 age-40 identity 都正确（bonus，但建议实现）
6. ✅ **Tavern-born flavor consistent** — 所有表达都保持酒肆出身风味
7. ✅ **No P71/P72/P73/P75 regressions** — 之前阶段的证据不退化
8. ✅ **Typecheck passes** — `npm run typecheck` 通过
9. ✅ **Sample-lines-baseline guard passes** — `npm run guard:sample-lines-baseline` 通过

---

## 5. Regression Boundaries

### 必须验证不退化的既有证据

| Stage | What to verify | How |
|-------|---------------|-----|
| **P71** (Bridge) | Bridge 事件触发 + flags 设置 + expression 正确 | 复用 P71 测试套件的关键断言 |
| **P72** (Entry diff) | `detectSampleLine()` 正确识别 renown | 复用 P72 测试套件的关键断言 |
| **P73** (On-ramp) | On-ramp 事件触发 + flags 设置 + expression 正确 | 复用 P73 测试套件的关键断言 |
| **P75** (Pressure) | Pressure 事件触发 + flags 设置 + expression 正确 | 复用 P75 测试套件的关键断言 |

### 不需要验证的（超出边界）

- Full lifetime exhaust（不需要跑完整的一生模拟）
- 其他路线的 payoff（orthodox/demonic/merchant 不归 P77 管）
- 其他出身的 renown（仅 tavern_hand + ally_network seed）
- Late-life / endgame 内容（P78+）
- 第二条 renown seed（mentor-bond，deferred）

---

## 6. Evidence Format

### Targeted Proof Document
- 文件名：`docs/test-reports/p77-renown-payoff-targeted-proof.md`
- 结构：按 core node 顺序排列，每个 node 有证据说明
- Bonus nodes 单独列在后面

### Test Suite
- 文件名：`tests/p77TavernHandRenownPayoffSpineTests.ts`
- 按 Group 1-7 组织测试
- 每个测试有清晰的描述和断言

### Closure Report
- 文件名：`docs/test-reports/p77-renown-payoff-closure-report.md`
- 包含：targeted proof 摘要、regression 结果、closure criteria 检查表、handoff 给下一阶段的内容

---

## 7. What Counts as "Payoff Closed"

满足以下全部条件，renown payoff 阶段才算 closed：

1. 9 项 closure criteria 全部 ✅
2. Targeted proof 所有 11 个 core nodes 验证通过
3. Regression tests 全部通过（~25 tests）
4. P71/P72/P73/P75 的既有证据不退化
5. Tavern-born 风味一致（人工检查或代码审查）
6. Typecheck + guard 都通过
7. Closure report 产出，明确与下一阶段（P78 late-life 或其他路线）的边界

---

*Validation shape locked by P76. P77 implementation must validate against this shape.*

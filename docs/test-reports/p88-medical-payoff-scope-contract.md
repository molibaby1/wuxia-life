# P88 Medical Payoff Scope Contract

> **Date:** 2026-06-29
> **Stage:** P88 Wuxia Medical Payoff Design-First
> **Contract type:** Design-first scope boundary
> **Route:** `medical_sage_healer` (一代名医)
> **Origin:** `tavern_hand` (酒肆帮工)
> **Variants:** compassionate (仁心医者) + pragmatic (世故人医)

---

## 1. Purpose

P88 是 `medical_sage_healer` 路线的 payoff 阶段 **design-first contract** 阶段。本契约明确 P88 的范围边界：做什么、不做什么、允许哪些层、禁止哪些扩展。目的是确保 P88 保持 design-first 定位，不滑向 partial implementation，也不扩成 full medical route 规划。

P88 之于 P89（payoff implementation），如同 P76 之于 P77（renown payoff implementation）。不同的是 medical 路线有 **2 个 variant**（compassionate + pragmatic），每个 variant 有 **3 个 choices**，P88 需同时覆盖 2×3=6 个 payoff 分支的设计。

**Core question for P88:** Medical payoff 应该是什么样的？（2 variants × 3 choices，各自的价值判断和身份走向是什么？）

---

## 2. Allowed Layers (P88 允许做的事)

| Layer | Allowed? | Description | Examples |
|-------|----------|-------------|----------|
| **Gap audit / prerequisite analysis** | ✅ | 盘点现有基础设施，明确 payoff 之前有什么 | Prerequisite audit (P88-001) |
| **Scope contract** | ✅ | 锁定范围边界，防止 scope creep | Scope contract (P88-002) |
| **Direction comparison / selection** | ✅ | 每个 variant 比较至少 3 个 payoff choice 方向，各选定 3 个（即 2×3=6 分支） | Payoff direction comparison (P88-003) |
| **Payoff contract definition** | ✅ | 定义 payoff 的 flag、gate、事件结构、表达更新（2 variants × 3 choices） | Payoff contract (P88-004) |
| **Validation shape definition** | ✅ | 定义 P89 implementation 阶段的 proof / regression 形状 | P89 validation shape (P88-005) |
| **Closure report / handoff** | ✅ | 汇总产出，明确与 P89 的边界 + GO/NO-GO | Closure report (P88-006) |
| **Documentation** | ✅ | 所有产出均为文档形式 | PRD 文档、test-reports 文档 |

### 2.1 Allowed Summary

P88 只做 6 类事：
1. **Audit** — 摸清家底（prerequisite audit，覆盖 2 variants）
2. **Scope** — 锁定边界（scope contract）
3. **Compare** — 选定方向（payoff direction comparison per variant，每 variant 至少 3 个候选）
4. **Contract** — 定义契约（payoff contract, 2 variants × 3 choices = 6 branches）
5. **Shape** — 锁定验证形状（validation shape for P89）
6. **Closure** — 收口交付（closure report + GO/NO-GO）

所有产出均为文档，**零运行时代码改动**。

---

## 3. Forbidden Expansions (P88 禁止做的事)

| Forbidden Expansion | Why Forbidden | Deferred To |
|---------------------|---------------|-------------|
| **Runtime event wiring** | Design-first 阶段不写 runtime 代码 | P89 (implementation) |
| **Runtime expression updates** | Design-first 阶段不改表达层代码 | P89 (implementation) |
| **New framework / system** | P88 只定义契约，不建新系统 | 远期待评估 |
| **Bulk content wave** | 不批量新增事件、文本 | P89+ 分阶段实施 |
| **Late-life / endgame design** | Payoff 只定义到 payoff，不越界到 late-life / endgame | P90+ (design-first for late-life) |
| **Age-40 identity implementation** | 只定义 contract，不改代码 | P89 (implementation) |
| **Poison path (毒医路线)** | 不在 P88 范围内 — 与 compassionate/pragmatic 分支无关 | 远期路线规划 |
| **Plague hero / medical pure full抉择** | Defer 到 late-life 或独立路线 | P90+ 或独立 stage |
| **Other origins (farm/town/apprentice)** | 仅 tavern_hand | 后续 replication 阶段 |
| **Full medical route lifecycle planning** | Bounded design-first，不做大而全规划 | 远期路线图 |
| **Stat threshold gate validation** | 不做阈值验证，只定义契约 | P89 实施时验证 |
| **Cross-route interactions** | 不设计 medical × merchant / renown 等跨路线交互 | 远期待评估 |
| **New UI components** | 不新增 UI，只复用现有表达面 | 远期待评估 |
| **Orthodox/demonic childhood seeds** | 仅 tavern-born 普通出身路线 | 远期扩展 |
| **Choice event implementation** | 只定义 choice 结构，不写 JSON 配置 | P89 (implementation) |
| **Test writing** | 只定义 validation shape，不写测试代码 | P89 (implementation) |

### 3.1 Forbidden Summary — The Red Line

P88 的红线：**不碰 `src/` 下任何运行时代码**。

唯一例外：`docs/` 目录下的文档新增/修改。

---

## 4. Boundary With Adjacent Stages

### 4.1 P87 (Pressure Implementation) → P88 (Payoff Design-First)

| Aspect | P87 | P88 |
|--------|-----|-----|
| **Stage type** | Implementation (runtime changes) | Design-first (docs only) |
| **Focus** | Pressure 事件 + 表达落地 | Payoff 方向选择 + 契约定义（2 variants × 3 choices） |
| **Runtime changes** | ✅ Yes (event + expression + tests) | ❌ No |
| **Checkpoint flag** | Sets `medical_midlife_pressure_done` | Defines `medical_payoff_done` + `medical_age40_identity_done` (contract only) |
| **Variants** | 2 variants (compassionate + pragmatic) | 2 variants (same) × 3 choices each |
| **Branches** | 2 pressure branches | 6 payoff branches |

**P88 从 P87 继承：**
- `medical_midlife_pressure_done` 作为 payoff 的上游 gate
- 2 variant markers (`tavern_medical_pressure_compassionate` / `_pragmatic`)
- 7 表达面作为 payoff expression 的载体
- Tavern-born healer 风味锚点体系（酒肆小药庐底色）
- Renown payoff 先例作为参考模式
- Pressure 事件中埋下的 payoff narrative hooks
- P87 closure report 中建议的 3 choice 方向

### 4.2 P88 (Payoff Design-First) → P89 (Payoff Implementation)

| Aspect | P88 | P89 |
|--------|-----|-----|
| **Stage type** | Design-first (contract) | Implementation (runtime) |
| **Deliverable** | Contract 文档 + validation shape（2 variants × 3 choices） | 可玩 payoff choice 事件 + 表达更新 + 测试（6 分支） |
| **Runtime changes** | ❌ No | ✅ Yes |
| **Tests** | 不新增测试 | 新增 targeted proof + regression tests |
| **Checkpoint** | 定义 `medical_payoff_done` + `medical_age40_identity_done` 语义 | 设置 `medical_payoff_done` + `medical_age40_identity_done` flag |
| **Variants × Choices** | 2 variants × 3 choices = 6 branches designed | 2 variants × 3 choices = 6 branches implemented |

**P88 交付给 P89 的内容：**
1. 每个 variant 3 个 payoff choice 方向（共 6 个）
2. Payoff contract（flag、gate、事件结构、表达更新）× 6 branches
3. Age-40 identity 深化定义 × 6 branches
4. P89 validation shape（targeted proof 节点 + regression 边界）
5. GO / NO-GO 建议
6. Late-life / endgame 阶段 flag 接口预留

---

## 5. Quality-First Priority Order

P88 内部各 story 的优先级遵循 quality-first 原则：

1. **Prerequisite audit (P88-001)** — 先摸清家底，确保从真实基础出发
2. **Scope contract (P88-002)** — 先锁定边界，防止范围蔓延
3. **Direction comparison (P88-003)** — 先选对方向，再深入细节（2 variants 各至少 3 个候选）
4. **Payoff contract (P88-004)** — 方向确定后定义详细契约（2 variants × 3 choices）
5. **Validation shape (P88-005)** — 契约确定后锁定验证标准
6. **Closure report (P88-006)** — 最后汇总收口

这个顺序确保：每一步都建立在前一步已验证的基础上，减少返工风险。

---

## 6. Small-Step Principle

P88 遵循 small-step 原则：

- **每个 variant 只定义 1 个核心 payoff choice 事件**（3 个选项），不做完整 payoff 链
- **每个 variant 3 个 choices 各有 1 个核心身份标记**，不做过多分支
- **只定义 payoff 阶段**，不提前设计 late-life / endgame
- **只针对 tavern_hand origin**，不并行做其他出身
- **2 variants 并行设计但各自 bounded**，不因为有 2 个 variant 就失控
- **Choice-based 是默认方向，但保留退化为 auto 的选项**（若复杂度太高）

Small-step 的好处：
- 验证成本低
- 方向可调整
- 风味易保持
- 与 renown 路线的迭代节奏对齐

---

## 7. Scope Guardrails (范围护栏)

### 7.1 Guardrail 1: Zero Runtime Changes

**Rule:** P88 全过程 `src/` 目录零改动。

**Check:** `git diff --name-only main...HEAD | grep "^src/"` 应为空。

### 7.2 Guardrail 2: Three Choices Per Variant

**Rule:** 每个 variant 选定 3 个 payoff choice 方向（A / B / C），不多不少。

**Rationale:** 3 个 choice 是 "有意义的选择空间 + bounded 实现量" 的平衡点。少于 3 个选择感不足，多于 3 个实现成本太高。

### 7.3 Guardrail 3: No Late-Life Leakage

**Rule:** Payoff contract 只为 late-life / endgame 预留 flag 接口，不深入 late-life 细节。

**Rationale:** Late-life 是另一个阶段，有自己的 design-first 和 implementation。提前设计 late-life 会导致 scope creep。

### 7.4 Guardrail 4: Tavern-Born Healer Flavor First

**Rule:** 所有 payoff 设计必须通过 tavern-born healer 风味检查。

**Checklist:**
- [ ] 核心机制与医术/药材/病患/人情相关，而非武功
- [ ] 叙事与酒肆小药庐或酒肆出身强相关
- [ ] 与 merchant payoff（商业帝国/财富自由）明确区分
- [ ] 与 renown payoff（江湖名声/人情债）明确区分但可呼应
- [ ] 与 generic 江湖 payoff（正邪/门派/恩怨）明确区分
- [ ] Compassionate 与 pragmatic 两个 variant 风味有差异

### 7.5 Guardrail 5: Two-Variant Differentiation

**Rule:** Compassionate 和 pragmatic 两个 variant 的 payoff 设计必须有本质差异，不能只是换皮。

**Rationale:** Medical 路线的核心价值之一就是 variant 分化。Payoff 阶段应该深化这种分化，而不是削弱。

**Differentiation test:**
- Compassionate payoff = 理想主义的代价与抉择（向内）
- Pragmatic payoff = 现实主义的代价与抉择（向外）
- 两者的 3 个 choice 方向不应是简单镜像

### 7.6 Guardrail 7: Choice Meaningfulness

**Rule:** 每个 variant 的 3 个 choice 必须有实质差异，不能只是数值换皮。

**Rationale:** Choice-based payoff 的核心价值是玩家 agency。如果 3 个选择只是数值不同，不如做 auto。

**Meaningfulness test:** 每个 choice 应该在以下维度有明显区别：
- 身份走向（identity marker）
- 核心叙事弧光
- Player-facing expression（至少 3 个表面有差异化文本）
- Stat 变化方向（不只是数值大小，而是维度不同）

---

## 8. NO-GO Conditions

如果出现以下情况，P88 应显式声明 NO-GO，不进入 P89：

1. **方向无法收敛** — 比较后发现 2 个 variant 都找不到既符合 tavern-born 风味又足够 bounded 的 payoff 方向
2. **基础不足** — Prerequisite audit 发现 pressure 基础仍有重大缺口
3. **风险过高** — Payoff 设计需要新系统或大规模重构，超出 small-step 范围
4. **价值存疑** — Payoff 阶段对玩家体验的提升不明显，不值得投入（2× 于 renown 的工作量，是否有 2× 的价值？）
5. **Variant 弱化** — 两个 variant 的 payoff 方向差异不够，失去 variant 分化的意义
6. **Choice 无意义** — 3 个 choice 只是数值换皮，没有实质的身份/叙事差异
7. **Choice-based 太复杂** — 2×3=6 分支的实现量超出可控范围，且无法简化为 auto

出现 NO-GO 时，P88 仍输出 closure report，但明确建议不进入 P89。

---

## 9. Rollback Strategy

- **Document-only rollback**：P88 是纯文档阶段，回滚就是删除/归档 P88 文档，不影响任何 runtime 行为
- **可退化为 auto**：如果 choice-based 太复杂，可在 P88 内就决定用 auto payoff（类似 merchant），P89 按 auto 实现（但 2 variants 仍保留）
- **可完全 NO-GO**：如果没有合适的 payoff shape，可以显式 NO-GO，medical 路线停在 pressure 阶段
- **可单 variant NO-GO**：如果某个 variant 的 payoff 方向不强，可只推进另一个 variant（但不推荐，会破坏 variant 对称）

---

## 10. Compliance Verification

P88 完成时需验证以下范围合规项：

| Check | Method | Expected Result |
|-------|--------|-----------------|
| Zero runtime changes | `git diff --name-only` | No files under `src/` modified |
| All 6 stories passed | prd.json `passes` field | All `true` |
| Payoff contract exists | File check | `docs/PRD/p88-medical-payoff-contract.md` exists |
| 3 choices per variant | Contract check | Exactly 3 choices defined per variant = 6 total |
| No late-life design | Contract check | Only flag interfaces reserved, no late-life details |
| Tavern-born healer flavor | Manual review | Flavor checklist passed |
| Two-variant differentiation | Manual review | Compassionate ≠ Pragmatic in meaningful ways |
| Choice meaningfulness | Manual review | Each choice has distinct identity + narrative + stats |
| P89 validation shape defined | File check | Validation shape documented |
| GO/NO-GO stated | Closure report | Explicit recommendation |

---

**P88-002 complete.** Scope contract saved.

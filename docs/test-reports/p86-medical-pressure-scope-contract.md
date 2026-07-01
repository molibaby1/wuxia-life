# P86 Medical Pressure Scope Contract

> **Date:** 2026-06-29
> **Stage:** P86 Wuxia Medical Pressure Design-First
> **Contract type:** Design-first scope boundary
> **Route:** `medical_sage_healer` (一代名医)
> **Origin:** `tavern_hand` (酒肆帮工)

---

## 1. Purpose

P86 是 `medical_sage_healer` 路线的 pressure 阶段 **design-first contract** 阶段。本契约明确 P86 的范围边界：做什么、不做什么、允许哪些层、禁止哪些扩展。目的是确保 P86 保持 design-first 定位，不滑向 partial implementation，也不扩成 full medical route 规划。

P86 之于 P87（pressure implementation），如同 P74 之于 P75（renown pressure implementation）。不同的是 medical 路线有 **2 个 variant**（compassionate + pragmatic），P86 需同时覆盖两个 variant 的 pressure 设计。

---

## 2. Allowed Layers (P86 允许做的事)

| Layer | Allowed? | Description | Examples |
|-------|----------|-------------|----------|
| **Gap audit / prerequisite analysis** | ✅ | 盘点现有基础设施，明确 pressure 之前有什么 | Prerequisite audit (P86-001) |
| **Scope contract** | ✅ | 锁定范围边界，防止 scope creep | Scope contract (P86-002) |
| **Direction comparison / selection** | ✅ | 每个 variant 比较多个 pressure 叙事方向，各选定 1 个 | Pressure direction comparison (P86-003) |
| **Pressure contract definition** | ✅ | 定义 pressure 的 flag、gate、事件结构、表达更新（2 variants） | Pressure contract (P86-004) |
| **Validation shape definition** | ✅ | 定义 P87 implementation 阶段的 proof / regression 形状 | P87 validation shape (P86-005) |
| **Closure report / handoff** | ✅ | 汇总产出，明确与 P87 的边界 | Closure report (P86-006) |
| **Documentation** | ✅ | 所有产出均为文档形式 | PRD 文档、test-reports 文档 |

### 2.1 Allowed Summary

P86 只做 5 类事：
1. **Audit** — 摸清家底（prerequisite audit）
2. **Scope** — 锁定边界（scope contract）
3. **Compare** — 选定方向（pressure direction comparison per variant）
4. **Contract** — 定义契约（pressure contract, 2 variants）
5. **Shape** — 锁定验证形状（validation shape for P87）

所有产出均为文档，**零运行时代码改动**。

---

## 3. Forbidden Expansions (P86 禁止做的事)

| Forbidden Expansion | Why Forbidden | Deferred To |
|---------------------|---------------|-------------|
| **Runtime event wiring** | Design-first 阶段不写 runtime 代码 | P87 (implementation) |
| **Runtime expression updates** | Design-first 阶段不改表达层代码 | P87 (implementation) |
| **New framework / system** | P86 只定义契约，不建新系统 | 远期待评估 |
| **Bulk content wave** | 不批量新增事件、文本 | P87+ 分阶段实施 |
| **Payoff stage design** | Pressure 只定义到 pressure，不越界到 payoff | P88+ (design-first for payoff) |
| **Late identity deepening** | Age-40 identity 深化属 payoff 阶段 | P88+ |
| **Poison path (毒医路线)** | 不在 P86 范围内 — 与 compassionate/pragmatic 分支无关 | 远期路线规划 |
| **Plague hero / medical pure full抉择** | Defer 到 pressure 之后或 payoff | P88+ |
| **Other origins (farm/town/apprentice)** | 仅 tavern_hand | 后续 replication 阶段 |
| **Full medical route lifecycle planning** | Bounded design-first，不做大而全规划 | 远期路线图 |
| **Stat threshold gate validation** | 不做阈值验证，只定义契约 | P87 实施时验证 |
| **Cross-route interactions** | 不设计 medical × merchant / renown 等跨路线交互 | 远期待评估 |
| **New UI components** | 不新增 UI，只复用现有表达面 | 远期待评估 |
| **Orthodox/demonic childhood seeds** | 仅 tavern-born 普通出身路线 | 远期扩展 |

### 3.1 Forbidden Summary — The Red Line

P86 的红线：**不碰 `src/` 下任何运行时代码**。

唯一例外：`docs/` 目录下的文档新增/修改。

---

## 4. Boundary With Adjacent Stages

### 4.1 P85 (On-Ramp Spine) → P86 (Pressure Design-First)

| Aspect | P85 | P86 |
|--------|-----|-----|
| **Stage type** | Implementation (runtime changes) | Design-first (docs only) |
| **Focus** | On-ramp 事件 + 表达落地 | Pressure 方向选择 + 契约定义（2 variants） |
| **Runtime changes** | ✅ Yes (event + expression + tests) | ❌ No |
| **Checkpoint flag** | Sets `medical_on_ramp_done` | Defines `medical_midlife_pressure_done` (contract only) |
| **Variants** | 2 variants (compassionate + pragmatic) | 2 variants (same) |

**P86 从 P85 继承：**
- `medical_on_ramp_done` 作为 pressure 的上游 gate
- 2 variant markers (`tavern_medical_on_ramp_compassionate` / `_pragmatic`)
- 7 表达面作为 pressure expression 的载体
- Tavern-born healer 风味锚点体系（酒肆小药庐底色）
- Renown pressure 先例作为参考模式
- On-ramp 事件中埋下的 pressure narrative hooks

### 4.2 P86 (Pressure Design-First) → P87 (Pressure Implementation)

| Aspect | P86 | P87 |
|--------|-----|-----|
| **Stage type** | Design-first (contract) | Implementation (runtime) |
| **Deliverable** | Contract 文档 + validation shape（2 variants） | 可玩 pressure 事件 + 表达更新 + 测试（2 variants） |
| **Runtime changes** | ❌ No | ✅ Yes |
| **Tests** | 不新增测试 | 新增 targeted proof + regression tests |
| **Checkpoint** | 定义 `medical_midlife_pressure_done` 语义 | 设置 `medical_midlife_pressure_done` flag |
| **Variants** | 2 variants designed | 2 variants implemented |

**P86 交付给 P87 的内容：**
1. 每个 variant 选定 1 个 pressure 叙事方向
2. Pressure contract（flag、gate、事件结构、表达更新）× 2 variants
3. P87 validation shape（targeted proof 节点 + regression 边界）
4. GO / NO-GO 建议
5. Payoff 阶段 flag 接口预留

---

## 5. Quality-First Priority Order

P86 内部各 story 的优先级遵循 quality-first 原则：

1. **Prerequisite audit (P86-001)** — 先摸清家底，确保从真实基础出发
2. **Scope contract (P86-002)** — 先锁定边界，防止范围蔓延
3. **Direction comparison (P86-003)** — 先选对方向，再深入细节（2 variants）
4. **Pressure contract (P86-004)** — 方向确定后定义详细契约（2 variants）
5. **Validation shape (P86-005)** — 契约确定后锁定验证标准
6. **Closure report (P86-006)** — 最后汇总收口

这个顺序确保：每一步都建立在前一步已验证的基础上，减少返工风险。

---

## 6. Small-Step Principle

P86 遵循 small-step 原则：

- **每个 variant 只定义 1 个核心 pressure 事件**（或 1 组紧密关联的小事件），不做完整 pressure 链
- **每个 variant 至少 2 个 pressure-specific signals**，不一次性覆盖所有表达面
- **只定义 pressure 阶段**，不提前设计 payoff
- **只针对 tavern_hand origin**，不并行做其他出身
- **2 variants 并行设计但各自 bounded**，不因为有 2 个 variant 就加倍 scope

Small-step 的好处：
- 验证成本低
- 方向可调整
- 风味易保持
- 与 renown 路线的迭代节奏对齐

---

## 7. Scope Guardrails (范围护栏)

### 7.1 Guardrail 1: Zero Runtime Changes

**Rule:** P86 全过程 `src/` 目录零改动。

**Check:** `git diff --name-only main...HEAD | grep "^src/"` 应为空。

### 7.2 Guardrail 2: Single Direction Per Variant

**Rule:** 每个 variant 只选定 1 个 pressure 方向，不做 "多方向并行设计"。

**Rationale:** Design-first 的目的是在 implementation 前选定方向，不是在 design 阶段做全量探索。多个方向可以在 comparison 文档中列出，但每 variant 只选 1 个进入 contract。

### 7.3 Guardrail 3: No Payoff Leakage

**Rule:** Pressure contract 只为 payoff 预留 flag 接口，不深入 payoff 细节。

**Rationale:** Payoff 是另一个阶段，有自己的 design-first 和 implementation。提前设计 payoff 会导致 scope creep。

### 7.4 Guardrail 4: Tavern-Born Healer Flavor First

**Rule:** 所有 pressure 设计必须通过 tavern-born healer 风味检查。

**Checklist:**
- [ ] 核心机制与医术/药材/病患相关，而非武功
- [ ] 叙事与酒肆小药庐或酒肆出身强相关
- [ ] 与 merchant pressure（金钱/债务/经营）明确区分
- [ ] 与 renown pressure（人情债/名声）明确区分
- [ ] 与 generic 江湖压力（正邪/门派/恩怨）明确区分
- [ ] Compassionate 与 pragmatic 两个 variant 风味有差异

### 7.5 Guardrail 5: Two-Variant Differentiation

**Rule:** Compassionate 和 pragmatic 两个 variant 的 pressure 设计必须有明确差异，不能只是换皮。

**Rationale:** Medical 路线的核心价值之一就是 variant 分化。Pressure 阶段应该深化这种分化，而不是削弱。

---

## 8. NO-GO Conditions

如果出现以下情况，P86 应显式声明 NO-GO，不进入 P87：

1. **方向无法收敛** — 比较后发现 2 个 variant 都找不到既符合 tavern-born 风味又足够 bounded 的方向
2. **基础不足** — Prerequisite audit 发现 on-ramp 基础仍有重大缺口
3. **风险过高** — Pressure 设计需要新系统或大规模重构，超出 small-step 范围
4. **价值存疑** — Pressure 阶段对玩家体验的提升不明显，不值得投入
5. **Variant 弱化** — 两个 variant 的 pressure 方向差异不够，失去 variant 分化的意义

出现 NO-GO 时，P86 仍输出 closure report，但明确建议不进入 P87。

---

## 9. Compliance Verification

P86 完成时需验证以下范围合规项：

| Check | Method | Expected Result |
|-------|--------|-----------------|
| Zero runtime changes | `git diff --name-only` | No files under `src/` modified |
| All 6 stories passed | prd.json `passes` field | All `true` |
| Pressure contract exists | File check | `docs/PRD/p86-medical-pressure-contract.md` exists |
| Direction selected per variant | Contract check | Exactly 1 direction chosen per variant |
| No payoff design | Contract check | Only flag interfaces reserved, no payoff details |
| Tavern-born healer flavor | Manual review | Flavor checklist passed |
| Two-variant differentiation | Manual review | Compassionate ≠ Pragmatic in meaningful ways |
| P87 validation shape defined | File check | Validation shape documented |

---

**P86-002 complete.** Scope contract saved.

# P74 Renown Pressure Scope Contract

> **Date:** 2026-06-29
> **Stage:** P74 Wuxia Renown Pressure Design-First
> **Contract type:** Design-first scope boundary

---

## 1. Purpose

P74 是 `jianghu_renown_sage` 路线的 pressure 阶段 **design-first contract** 阶段。本契约明确 P74 的范围边界：做什么、不做什么、允许哪些层、禁止哪些扩展。目的是确保 P74 保持 design-first 定位，不滑向 partial implementation，也不扩成 full renown route 规划。

P74 之于 P75（pressure implementation），如同 P70 之于 P71（bridge implementation）。

---

## 2. Allowed Layers (P74 允许做的事)

| Layer | Allowed? | Description | Examples |
|-------|----------|-------------|----------|
| **Gap audit / prerequisite analysis** | ✅ | 盘点现有基础设施，明确 pressure 之前有什么 | Prerequisite audit (P74-001) |
| **Direction comparison / selection** | ✅ | 比较多个 pressure 叙事方向，选定 1 个 | Pressure direction comparison (P74-003) |
| **Pressure contract definition** | ✅ | 定义 pressure 的 flag、gate、事件结构、表达更新 | Pressure contract (P74-004) |
| **Validation shape definition** | ✅ | 定义 P75 implementation 阶段的 proof / regression 形状 | P75 validation shape (P74-005) |
| **Closure report / handoff** | ✅ | 汇总产出，明确与 P75 的边界 | Closure report (P74-006) |
| **Documentation** | ✅ | 所有产出均为文档形式 | PRD 文档、test-reports 文档 |

### 2.1 Allowed Summary

P74 只做 4 类事：
1. **Audit** — 摸清家底（prerequisite audit）
2. **Compare** — 选定方向（pressure direction comparison）
3. **Contract** — 定义契约（pressure contract）
4. **Shape** — 锁定验证形状（validation shape for P75）

所有产出均为文档，**零运行时代码改动**。

---

## 3. Forbidden Expansions (P74 禁止做的事)

| Forbidden Expansion | Why Forbidden | Deferred To |
|---------------------|---------------|-------------|
| **Runtime event wiring** | Design-first 阶段不写 runtime 代码 | P75 (implementation) |
| **Runtime expression updates** | Design-first 阶段不改表达层代码 | P75 (implementation) |
| **New framework / system** | P74 只定义契约，不建新系统 | 远期待评估 |
| **Bulk content wave** | 不批量新增事件、文本 | P75+ 分阶段实施 |
| **Payoff stage design** | Pressure 只定义到 pressure，不越界到 payoff | P76+ (design-first for payoff) |
| **Late identity deepening** | Age-40 identity 深化属 payoff 阶段 | P75+ |
| **Second renown seed (mentor-bond)** | 单路线单种子，不并行设计第二条 | 远期待评估 |
| **Other origins (farm/town/apprentice)** | 仅 tavern_hand | 后续 replication 阶段 |
| **Full renown route lifecycle planning** | Bounded design-first，不做大而全规划 | 远期路线图 |
| **Stat threshold gate validation** | 不做阈值验证，只定义契约 | P75 实施时验证 |
| **Cross-route interactions** | 不设计 renown × merchant 等跨路线交互 | 远期待评估 |
| **New UI components** | 不新增 UI，只复用现有表达面 | 远期待评估 |

### 3.1 Forbidden Summary — The Red Line

P74 的红线：**不碰 `src/` 下任何运行时代码**。

唯一例外：`docs/` 目录下的文档新增/修改。

---

## 4. Boundary With Adjacent Stages

### 4.1 P73 (On-Ramp Spine) → P74 (Pressure Design-First)

| Aspect | P73 | P74 |
|--------|-----|-----|
| **Stage type** | Implementation (runtime changes) | Design-first (docs only) |
| **Focus** | On-ramp 事件 + 表达落地 | Pressure 方向选择 + 契约定义 |
| **Runtime changes** | ✅ Yes (event + expression + tests) | ❌ No |
| **Checkpoint flag** | Sets `renown_on_ramp_done` | Defines `renown_midlife_pressure_done` (contract only) |

**P74 从 P73 继承：**
- `renown_on_ramp_done` 作为 pressure 的上游 gate
- 6+ 表达面作为 pressure expression 的载体
- Tavern-born 风味锚点体系
- Merchant pressure 先例作为参考模式

### 4.2 P74 (Pressure Design-First) → P75 (Pressure Implementation)

| Aspect | P74 | P75 |
|--------|-----|-----|
| **Stage type** | Design-first (contract) | Implementation (runtime) |
| **Deliverable** | Contract 文档 + validation shape | 可玩 pressure 事件 + 表达更新 + 测试 |
| **Runtime changes** | ❌ No | ✅ Yes |
| **Tests** | 不新增测试 | 新增 targeted proof + regression tests |
| **Checkpoint** | 定义 `renown_midlife_pressure_done` 语义 | 设置 `renown_midlife_pressure_done` flag |

**P74 交付给 P75 的内容：**
1. 选定的 pressure 叙事方向
2. Pressure contract（flag、gate、事件结构、表达更新）
3. P75 validation shape（targeted proof 节点 + regression 边界）
4. GO / NO-GO 建议

---

## 5. Quality-First Priority Order

P74 内部各 story 的优先级遵循 quality-first 原则：

1. **Prerequisite audit (P74-001)** — 先摸清家底，确保从真实基础出发
2. **Scope contract (P74-002)** — 先锁定边界，防止范围蔓延
3. **Direction comparison (P74-003)** — 先选对方向，再深入细节
4. **Pressure contract (P74-004)** — 方向确定后定义详细契约
5. **Validation shape (P74-005)** — 契约确定后锁定验证标准
6. **Closure report (P74-006)** — 最后汇总收口

这个顺序确保：每一步都建立在前一步已验证的基础上，减少返工风险。

---

## 6. Small-Step Principle

P74 遵循 small-step 原则：

- **只定义 1 个核心 pressure 事件**（或 1 组紧密关联的小事件），不做完整 pressure 链
- **只定义至少 2 个 pressure-specific signals**，不一次性覆盖所有表达面
- **只定义 pressure 阶段**，不提前设计 payoff
- **只针对 tavern_hand origin**，不并行做其他出身

Small-step 的好处：
- 验证成本低
- 方向可调整
- 风味易保持
- 与 merchant 路线的迭代节奏对齐

---

## 7. Scope Guardrails (范围护栏)

### 7.1 Guardrail 1: Zero Runtime Changes

**Rule:** P74 全过程 `src/` 目录零改动。

**Check:** `git diff --name-only main...HEAD | grep "^src/"` 应为空。

### 7.2 Guardrail 2: Single Direction

**Rule:** 只选定 1 个 pressure 方向，不做 "多方向并行设计"。

**Rationale:** Design-first 的目的是在 implementation 前选定方向，不是在 design 阶段做全量探索。多个方向可以在 comparison 文档中列出，但只选 1 个进入 contract。

### 7.3 Guardrail 3: No Payoff Leakage

**Rule:** Pressure contract 只为 payoff 预留 flag 接口，不深入 payoff 细节。

**Rationale:** Payoff 是另一个阶段，有自己的 design-first 和 implementation。提前设计 payoff 会导致 scope creep。

### 7.4 Guardrail 4: Tavern-Born Flavor First

**Rule:** 所有 pressure 设计必须通过 tavern-born 风味检查。

**Checklist:**
- [ ] 核心机制是人脉/面子/人情，而非武功
- [ ] 叙事与酒肆或酒肆出身强相关
- [ ] 与 merchant pressure（金钱/债务/经营）明确区分
- [ ] 与 generic 江湖压力（正邪/门派/恩怨）明确区分

---

## 8. NO-GO Conditions

如果出现以下情况，P74 应显式声明 NO-GO，不进入 P75：

1. **方向无法收敛** — 比较后发现没有 1 个方向既符合 tavern-born 风味又足够 bounded
2. **基础不足** — Prerequisite audit 发现 on-ramp 基础仍有重大缺口
3. **风险过高** — Pressure 设计需要新系统或大规模重构，超出 small-step 范围
4. **价值存疑** — Pressure 阶段对玩家体验的提升不明显，不值得投入

出现 NO-GO 时，P74 仍输出 closure report，但明确建议不进入 P75。

---

## 9. Compliance Verification

P74 完成时需验证以下范围合规项：

| Check | Method | Expected Result |
|-------|--------|-----------------|
| Zero runtime changes | `git diff --name-only` | No files under `src/` modified |
| All 6 stories passed | prd.json `passes` field | All `true` |
| Pressure contract exists | File check | `docs/PRD/p74-renown-pressure-contract.md` exists |
| Direction selected | Contract check | Exactly 1 direction chosen |
| No payoff design | Contract check | Only flag interfaces reserved, no payoff details |
| Tavern-born flavor | Manual review | Flavor checklist passed |
| P75 validation shape defined | File check | Validation shape documented |

---

**P74-002 complete.** Scope contract saved.

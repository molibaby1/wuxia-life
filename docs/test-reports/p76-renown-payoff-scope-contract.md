# P76 Renown Payoff — Scope Contract

> **Purpose:** 锁定 P76 的工作范围，确保这是一个 bounded design-first stage，不会滑入 runtime implementation 或范围蔓延。
> **Stage:** P76 — design-first contract stage for renown payoff

## 1. Stage Definition

**P76 = design-first contract stage**（不是 implementation stage）。

与 P74（pressure design-first）相对于 P75（pressure implementation）的关系相同——P76 产出 contract 和 validation shape，P77 再做 runtime 实现。

**Core question for P76:** Renown payoff 应该是什么样的？（choice-based vs auto？3 个 choice 分别是什么？）

---

## 2. Allowed Layers

P76 只允许在以下 4 个层面工作：

### 2.1 Gap Audit（已完成 P76-001）
- 盘点现有 renown 路线资产（flags/events/expressions）
- 明确 payoff 前置条件是否就绪
- 输出：prerequisite audit 文档

### 2.2 Direction Comparison（P76-003）
- 比较至少 2 个 payoff 模式（choice-based vs auto）
- 若选 choice-based，比较至少 3 个 choice 方向
- 每个候选包含：核心叙事、触发条件、玩家选择空间、tavern-born 适配度、实现复杂度
- 输出：方向比较文档 + 推荐结论

### 2.3 Payoff Contract（P76-004）
- 定义 payoff checkpoint、所需 flags、对应 gate acceptance
- 定义 1 个核心 payoff 事件（choice-based 或 auto）
- 若 choice-based，定义每个选择的 stat 变化、identity marker、表达差异
- 定义至少 3 个 payoff-specific player-facing signals
- 明确 payoff 与 pressure、与 generic midlife 的差异
- 保留 tavern-born 风味
- 为后续 late-life / endgame 阶段预留 flag 接口
- 输出：`docs/PRD/p76-renown-payoff-contract.md`

### 2.4 Validation Shape（P76-005）
- 定义 targeted proof 需要展示哪些链路节点
- 定义 regression tests 至少覆盖哪些断言
- 明确何种证据算 payoff closed
- 定义 P71/P72/P73/P75 既有 evidence 不退化的验证边界
- 输出：validation shape 文档（可整合进 closure report 或 contract 中）

---

## 3. Forbidden Expansions

以下内容**明确禁止**在 P76 中实施：

### 3.1 Runtime Wiring
- ❌ 不写 payoff 事件的 runtime JSON 配置
- ❌ 不改 `sample-lines-spine.json`
- ❌ 不改 `ordinary-origin-midlife.json`
- ❌ 不改 expression 代码（`sampleLineExpression.ts` / `ordinaryOriginExpression.ts`）
- ❌ 不新增任何 runtime flag 的设置逻辑

### 3.2 New Framework / System
- ❌ 不新增 expression 框架
- ❌ 不新增 choice 系统
- ❌ 不新增 stat 计算逻辑
- ❌ 不改动事件系统底层

### 3.3 Bulk Content Wave
- ❌ 不做大规模内容填充
- ❌ 不新增多个 payoff 事件
- ❌ 不扩到其他出身（仅 tavern_hand）
- ❌ 不做第二条 renown seed（mentor-bond）

### 3.4 Late-Life / Endgame Design
- ❌ 不设计 late-life identity（P78+）
- ❌ 不设计 endgame echo
- ❌ 不做 full renown route 全生命周期规划
- **仅预留 flag 接口**，不实现逻辑

### 3.5 Other Routes / Origins
- ❌ 不扩展到 orthodox / demonic / merchant 路线
- ❌ 不扩展到 farm_peasant / town_apprentice 出身
- ❌ 仅限 `tavern_hand` + `ally_network` seed 的 `jianghu_renown_sage` 路线

---

## 4. Scope Guardrails

### 4.1 Quality-First Priority Order
所有设计决策按以下优先级排序：
1. **Evidence strength**（有现有资产支撑吗？）
2. **Implementation risk**（P77 实现风险高吗？）
3. **Methodology fit**（符合 merchant trilogy 方法论吗？）
4. **Value density**（玩家能感受到差异化吗？）

### 4.2 Small-Step Principle
- P76 只锁定 payoff 的 contract，不做更大的设计
- 如果某个方向太复杂，宁可缩小范围，也不要扩 scope
- Choice-based 如果太复杂，可以退化为 auto（类似 merchant）

### 4.3 Tavern-Born Flavor First
- 所有 design 决策必须优先考虑 tavern-born 风味
- 不能做成 generic jianghu payoff
- 必须与 merchant payoff 有明显差异化

### 4.4 Boundary with P77
| P76 (Design-First) | P77 (Implementation) |
|-------------------|---------------------|
| Prerequisite audit | Runtime event wiring |
| Direction comparison | Expression updates |
| Payoff contract | Targeted proof |
| Validation shape | Regression tests |
| Closure report | Closure report |

---

## 5. NO-GO Conditions

如果出现以下情况，P76 应显式 NO-GO，不进入 P77：

1. **Prerequisite 不足**：如果 P76-001 发现 pressure 基础仍不足（比如 flags 没设对、expression 有 bug），应先回 P75 补证据
2. **Direction 无法收敛**：如果 choice-based 和 auto 都无法形成 bounded 的 payoff shape
3. **Complexity 失控**：如果 choice-based 的 3 个选项需要的实现量远超出预期，且无法简化
4. **Flavor 丢失**：如果所有候选方向都丢失了 tavern-born 风味，变成 generic jianghu payoff

---

## 6. Rollback Strategy

- **Document-only rollback**：P76 是纯文档阶段，回滚就是删除/归档 P76 文档，不影响任何 runtime 行为
- **可退化为 auto**：如果 choice-based 太复杂，可在 P76 内就决定用 auto payoff（类似 merchant），P77 按 auto 实现
- **可完全 NO-GO**：如果没有合适的 payoff shape，可以显式 NO-GO，renown 路线停在 pressure 阶段

---

## 7. Deliverables Checklist

P76 完成时应产出：
- [x] Prerequisite audit 文档（P76-001）
- [x] Scope contract 文档（P76-002 — 本文档）
- [x] Payoff direction comparison 文档（P76-003）
- [x] Payoff contract 文档（P76-004）
- [x] P77 validation shape（P76-005）
- [x] Closure report（P76-006）

**所有 deliverables 都是文档，零 runtime 代码改动。**

# P114 Founding Patriarch Pressure Prerequisite Audit

> **Stage:** P114 Wuxia Founding Patriarch Midlife Pressure Design-First  
> **Story:** P114-001 (read-only; no runtime changes)  
> **Date:** 2026-07-02  
> **Gaps addressed:** GAP-P113-N01

## 1. Purpose

对齐 `founding_patriarch` 路线在 pressure 前已落地的真实资产，锁定 P114 后续 contract 的最小输入，避免基于假设扩写。

---

## 2. Existing Assets (Pre-P114)

### 2.1 Route and checkpoints already present

| Asset | Location | Status |
| ----- | -------- | ------ |
| Entry event | `founding_patriarch_bridge_entry` | ✅ P113 已落地 |
| On-ramp checkpoints | `founding_patriarch_bridge_crossed`, `founding_patriarch_on_ramp_done` | ✅ 可复用 |
| On-ramp variants | `founding_patriarch_on_ramp_scholar`, `founding_patriarch_on_ramp_alliance` | ✅ 可复用 |
| Payoff echo | `founding_patriarch_payoff_echo` | ✅ 已存在但当前直连 on-ramp |
| Payoff checkpoints | `founding_patriarch_payoff_done`, `founding_patriarch_identity_done` | ✅ 可作为 pressure 后续接口 |

### 2.2 Upstream prerequisite evidence

| Flag | Role |
| ---- | ---- |
| `p16_scholar_mentor` | scholar 变体证据 |
| `p22_faction_continuation_active` | faction commitment 证据 |
| `p16_alliance_brokered` | alliance 变体证据 |
| `orthodox_childhood_seed_done` | orthodox 样本线前置上下文 |

### 2.3 Player-facing expression surfaces already wired

| Surface | Current status before P114 pressure |
| ------- | ---------------------------------- |
| `orthodoxCurrentGoal` | 已区分 founding-patriarch on-ramp |
| `orthodoxAge40Identity` | 已区分 founding-patriarch on-ramp/payoff |
| `deriveSampleLineCostLabel` | 已区分 founding-patriarch 路径成本标签 |

---

## 3. Reusable vs Missing for Pressure

### 3.1 Reusable

- 已有 on-ramp checkpoint 与 scholar/alliance 变体标记，可直接作为 pressure gate 输入。
- 已有 payoff echo 事件与 payoff flags，可通过 gate 改造为 `on-ramp -> pressure -> payoff` 顺序。
- 已有 orthodox 表达分支，无需新增表达系统。

### 3.2 Missing (P114 focus)

- 缺少 pressure checkpoint flag（例如 `founding_patriarch_midlife_pressure_done`）。
- 缺少 midlife pressure 核心事件定义（age band、gate、variant branch）。
- 缺少 pressure 阶段 player-facing 语义（至少 2 个信号）的 contract。
- 缺少 P115 proof chain 与回归边界文档化约束。

---

## 4. Precedent Comparison

| Route | Pressure pattern | Relevance to P114 |
| ----- | ---------------- | ----------------- |
| Patron (P105 contract) | design-first 先锁方向，再给 P106 实现 | ✅ 本阶段方法论直接复用 |
| Renown (P74 contract) | 明确 pressure checkpoint + 触发表达信号 | ✅ 可复用 contract 结构 |
| Magnate (`magnate_midlife_pressure`) | midlife pressure 作为 on-ramp 与 payoff 之间检查点 | ✅ 可复用顺序模型 |

---

## 5. Audit Conclusion

P114 的最小正确输入已充分：P113 已提供 on-ramp 与 payoff 两端锚点、表达分支基础和 scholar/alliance 变体证据。当前唯一缺口是中段 pressure contract（方向、事件、flag、表达、验证边界），无需改动任何 runtime 资产即可推进 design-first 阶段。

---

## 6. Non-goals Confirmed in This Story

- 不修改 `sample-lines-spine` 或任意运行时事件配置
- 不修改表达函数或测试
- 不重开 P37 / P102–P112 / P113 已关闭范围

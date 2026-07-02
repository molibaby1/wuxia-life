# P105 Merchant Martial Patron Pressure Scope Contract

> **Date:** 2026-07-02
> **Stage:** P105 Wuxia Merchant Martial Patron Pressure Design-First
> **Contract type:** Design-first scope boundary
> **Route:** `merchant_martial_patron`（商武一体金主）

---

## 1. Purpose

P105 是 `merchant_martial_patron` 路线的 pressure 阶段 **design-first contract** 阶段。本契约明确 P105 的范围边界：做什么、不做什么、允许哪些层、禁止哪些扩展。目的是确保 P105 保持 design-first 定位，不滑向 partial implementation，也不扩成 full patron route 规划。

P105 之于 P106（pressure implementation），如同 P74 之于 P75（renown pressure implementation）。

---

## 2. Allowed Layers (P105 允许做的事)

| Layer | Allowed? | Description | Examples |
|-------|----------|-------------|----------|
| **Gap audit / prerequisite analysis** | ✅ | 盘点现有基础设施，明确 pressure 之前有什么 | Prerequisite audit (P105-001) |
| **Direction comparison / selection** | ✅ | 比较多个 pressure 叙事方向，选定 1 个 | Pressure direction comparison (P105-003) |
| **Pressure contract definition** | ✅ | 定义 pressure 的 flag、gate、事件结构、表达更新 | Pressure contract (P105-004) |
| **Validation shape definition** | ✅ | 定义 P106 implementation 阶段的 proof / regression 形状 | P106 validation shape (P105-005) |
| **Closure report / handoff** | ✅ | 汇总产出，明确与 P106 的边界 | Closure report (P105-006) |
| **Documentation** | ✅ | 所有产出均为文档形式 | PRD 文档、test-reports 文档 |

### 2.1 Allowed Summary

P105 只做 4 类事：
1. **Audit** — 摸清家底（prerequisite audit）
2. **Compare** — 选定方向（pressure direction comparison）
3. **Contract** — 定义契约（pressure contract）
4. **Shape** — 锁定验证形状（validation shape for P106）

所有产出均为文档，**零运行时代码改动**。

---

## 3. Forbidden Expansions (P105 禁止做的事)

| Forbidden Expansion | Why Forbidden | Deferred To |
|---------------------|---------------|-------------|
| **Runtime event wiring** | Design-first 阶段不写 runtime 代码 | P106 (implementation) |
| **Runtime expression updates** | Design-first 阶段不改表达层代码 | P106 (implementation) |
| **P102–P104 patron bridge rewrite** | Bridge entry / on-ramp 已 closed | 不 reopen |
| **P55/P97–P101 magnate spine rewrite** | Magnate spine 已 closed | Regression guard only |
| **Payoff echo redesign** | `merchant_patron_payoff_echo` 属 payoff 阶段 | P106+ 如需 gate 调整单独 story |
| **Patron mid/late-life deepening** | Pressure 只定义到 pressure | 后续 stage |
| **New framework / system** | 只定义契约，不建新系统 | 远期待评估 |
| **Bulk content wave** | 不批量新增事件、文本 | P106 分阶段实施 |
| **Full Wave 3 mixed-achievement graph** | Bounded design-first | 远期路线图 |
| **Stat threshold gate validation** | 不做阈值验证，只定义契约 | P106 实施时验证 |
| **Full-lifetime `gate:p20` broad rerun** | 超出 bounded scope | 远期待评估 |
| **New UI components** | 不新增 UI，只复用现有表达面 | 远期待评估 |
| **Cross-route interactions** | 不设计 patron × renown 等跨路线交互 | 远期待评估 |

### 3.1 Forbidden Summary — The Red Line

P105 的红线：**不碰 `src/` 下任何运行时代码**。

唯一例外：`docs/` 目录下的文档新增/修改。

---

## 4. Boundary With Adjacent Stages

### 4.1 P104 (Peasant Bridge-Origin) → P105 (Pressure Design-First)

| Aspect | P104 | P105 |
|--------|------|------|
| **Stage type** | Implementation (runtime changes) | Design-first (docs only) |
| **Focus** | Peasant bridge-origin patron entry | Pressure 方向选择 + 契约定义 |
| **Runtime changes** | ✅ Yes (gate + choice + expression + tests) | ❌ No |
| **Checkpoint flag** | Sets `merchant_patron_bridge_peasant_grain` | Defines `merchant_patron_midlife_pressure_done` (contract only) |

**P105 从 P102–P104 继承：**
- `merchant_patron_on_ramp_done` 作为 pressure 的上游 gate
- 5 条变体 marker 作为 pressure 表达分支载体
- Expression priority rules（magnate > native > bridge-origin）
- P93-style lightweight payoff echo 作为下游锚点

### 4.2 P105 (Design-First) → P106 (Pressure Implementation)

| Aspect | P105 | P106 |
|--------|------|------|
| **Stage type** | Design-first (docs only) | Implementation (runtime changes) |
| **Deliverable** | Contract 文档 + validation shape | Spine event + expression + tests |
| **Direction selection** | ✅ P105 完成 | ❌ P106 不再重新选方向 |
| **Proof** | 定义验证形状 | 执行 targeted proof + regression |

### 4.3 Magnate / Renown Pressure (Reference Only)

| Reference | Relationship |
|-----------|--------------|
| `magnate_midlife_pressure` (P55/P98) | 模式参考（choice + variants）；风味必须区分 |
| `renown_midlife_pressure` (P74/P75) | 模式参考（auto milestone）；风味必须区分 |
| P74 design-first closure | 流程模板 |

---

## 5. Gaps Addressed in P105

| Gap ID | Description | P105 Story |
|--------|-------------|------------|
| GAP-P104-N01 | No pressure spine event between on-ramp and payoff echo | P105-004 contract |
| GAP-P104-N02 | No pressure checkpoint flag | P105-004 contract |
| GAP-P105-01 | No pressure expression branches | P105-004 contract |
| GAP-P105-02 | No pressure validation shape | P105-005 |

---

## 6. Success Criteria (P105 Done Definition)

| # | Criterion | Artifact |
|---|-----------|----------|
| S1 | Prerequisite audit complete | `p105-merchant-martial-patron-pressure-prerequisite-audit.md` |
| S2 | Scope contract locked | This document |
| S3 | Pressure direction selected | `p105-merchant-martial-patron-pressure-direction-comparison.md` |
| S4 | Pressure contract unambiguous | `p105-merchant-martial-patron-pressure-contract.md` |
| S5 | P106 validation shape fixed | `p105-p106-validation-shape.md` |
| S6 | Closure report with GO/NO-GO | `p105-merchant-martial-patron-pressure-closure-report.md` |
| S7 | Zero runtime changes | `git diff src/` empty for P105 commits |
| S8 | Typecheck passes | `npm run typecheck` |

---

## 7. Risk Controls

| Risk | Mitigation |
|------|------------|
| Scope creep into P106 implementation | Red line: no `src/` changes |
| Reopening P102–P104 bridge wiring | Forbidden list + regression guard in validation shape |
| Patron pressure conflated with magnate/renown | Direction comparison must score distinction |
| Payoff echo gate change without contract | P106 contract must specify gate adjustment if needed |

---

**P105-002 complete.**

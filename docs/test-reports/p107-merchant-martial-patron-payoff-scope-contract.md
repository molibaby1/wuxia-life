# P107 Merchant Martial Patron Payoff Scope Contract

> **Date:** 2026-07-02
> **Stage:** P107 Wuxia Merchant Martial Patron Payoff Design-First
> **Contract type:** Design-first scope boundary
> **Route:** `merchant_martial_patron`（商武一体金主）

---

## 1. Purpose

P107 是 `merchant_martial_patron` 路线的 payoff 阶段 **design-first contract** 阶段。本契约明确 P107 的范围边界：做什么、不做什么、允许哪些层、禁止哪些扩展。目的是确保 P107 保持 design-first 定位，不滑向 partial implementation，也不扩成 full patron route 规划。

P107 之于 P108（payoff implementation），如同 P76 之于 P77（renown payoff implementation）、P105 之于 P106（patron pressure implementation）。

---

## 2. Allowed Layers (P107 允许做的事)

| Layer | Allowed? | Description | Examples |
|-------|----------|-------------|----------|
| **Gap audit / prerequisite analysis** | ✅ | 盘点现有基础设施，明确 payoff 之前有什么 | Prerequisite audit (P107-001) |
| **Direction comparison / selection** | ✅ | 比较 payoff 模式与选择方向，选定 1 个 | Payoff direction comparison (P107-003) |
| **Payoff contract definition** | ✅ | 定义 payoff 的 flag、gate、事件结构、表达更新 | Payoff contract (P107-004) |
| **Validation shape definition** | ✅ | 定义 P108 implementation 阶段的 proof / regression 形状 | P108 validation shape (P107-005) |
| **Closure report / handoff** | ✅ | 汇总产出，明确与 P108 的边界 | Closure report (P107-006) |
| **Documentation** | ✅ | 所有产出均为文档形式 | PRD 文档、test-reports 文档 |

### 2.1 Allowed Summary

P107 只做 4 类事：
1. **Audit** — 摸清家底（prerequisite audit）
2. **Compare** — 选定方向（payoff direction comparison）
3. **Contract** — 定义契约（payoff contract）
4. **Shape** — 锁定验证形状（validation shape for P108）

所有产出均为文档，**零运行时代码改动**。

---

## 3. Forbidden Expansions (P107 禁止做的事)

| Forbidden Expansion | Why Forbidden | Deferred To |
|---------------------|---------------|-------------|
| **Runtime event wiring** | Design-first 阶段不写 runtime 代码 | P108 (implementation) |
| **Runtime expression updates** | Design-first 阶段不改表达层代码 | P108 (implementation) |
| **P102–P104 patron bridge rewrite** | Bridge entry / on-ramp 已 closed | 不 reopen |
| **P106 pressure rewrite** | Pressure 已 closed | Regression guard only |
| **P55/P97–P101 magnate spine rewrite** | Magnate spine 已 closed | Regression guard only |
| **Patron late-life / endgame design** | Payoff 只定义到 payoff checkpoint | P109+ |
| **New framework / system** | 只定义契约，不建新系统 | 远期待评估 |
| **Bulk content wave** | 不批量新增事件、文本 | P108 分阶段实施 |
| **Full Wave 3 mixed-achievement graph** | Bounded design-first | 远期路线图 |
| **Stat threshold gate validation** | 不做阈值验证，只定义契约 | P108 实施时验证 |
| **Full-lifetime `gate:p20` broad rerun** | 超出 bounded scope | 远期待评估 |
| **New UI components** | 不新增 UI，只复用现有表达面 | 远期待评估 |
| **Cross-route interactions** | 不设计 patron × renown 等跨路线交互 | 远期待评估 |
| **Ordinary origin patron expression** | 超出 bounded payoff scope | P108 optional bonus / defer |

### 3.1 Forbidden Summary — The Red Line

P107 的红线：**不碰 `src/` 下任何运行时代码**。

唯一例外：`docs/` 目录下的文档新增/修改。

---

## 4. Boundary With Adjacent Stages

### 4.1 P106 (Pressure Implementation) → P107 (Payoff Design-First)

| Aspect | P106 | P107 |
|--------|------|------|
| **Stage type** | Implementation (runtime changes) | Design-first (docs only) |
| **Focus** | 护商武力负担 pressure 事件 + 表达 | Payoff 方向选择 + 契约定义 |
| **Runtime changes** | ✅ Yes (spine + expression + tests) | ❌ No |
| **Checkpoint flag** | Sets `merchant_patron_midlife_pressure_done` | Defines payoff choice contract (docs only) |

**P107 从 P106 继承：**
- `merchant_patron_midlife_pressure_done` 作为 payoff 的上游 gate
- Payoff echo gate 已调整为 pressure_done（P106 已实施）
- `merchant_patron_payoff_resolved` / `merchant_patron_late_life_done` 预留接口
- Expression priority rules（magnate > payoff > pressure > on-ramp）

### 4.2 P107 (Design-First) → P108 (Payoff Implementation)

| Aspect | P107 | P108 |
|--------|------|------|
| **Stage type** | Design-first (docs only) | Implementation (runtime changes) |
| **Deliverable** | Contract 文档 + validation shape | Spine event upgrade + expression + tests |
| **Direction selection** | ✅ P107 完成 | ❌ P108 不再重新选方向 |
| **Proof** | 定义验证形状 | 执行 targeted proof + regression |

### 4.3 Renown / Magnate Payoff (Reference Only)

| Reference | Relationship |
|-----------|--------------|
| `renown_midlife_payoff` (P76/P77) | 模式参考（choice-based）；风味必须区分 |
| `magnate_payoff` (P55/P64) | 对比参考（auto）；patron 应差异化 |
| P76 design-first closure | 流程模板 |

---

## 5. Gaps Addressed in P107

| Gap ID | Description | P107 Story |
|--------|-------------|------------|
| GAP-P106-D01 | Payoff echo 仍是 auto，无 choice | P107-004 contract |
| GAP-P106-D02 | 无 payoff choice markers / `payoff_resolved` | P107-004 contract |
| GAP-P107-01 | Payoff 表达不按 choice 分化 | P107-004 contract |
| GAP-P107-02 | 无 payoff validation shape | P107-005 |

---

## 6. Success Criteria (P107 Done Definition)

| # | Criterion | Artifact |
|---|-----------|----------|
| S1 | Prerequisite audit complete | `p107-merchant-martial-patron-payoff-prerequisite-audit.md` |
| S2 | Scope contract locked | This document |
| S3 | Payoff direction selected | `p107-merchant-martial-patron-payoff-direction-comparison.md` |
| S4 | Payoff contract unambiguous | `p107-merchant-martial-patron-payoff-contract.md` |
| S5 | P108 validation shape fixed | `p107-p108-validation-shape.md` |
| S6 | Closure report with GO/NO-GO | `p107-merchant-martial-patron-payoff-closure-report.md` |
| S7 | Zero runtime changes | `git diff src/` empty for P107 commits |
| S8 | Typecheck passes | `npm run typecheck` |

---

## 7. Risk Controls

| Risk | Mitigation |
|------|------------|
| Scope creep into P108 implementation | Red line: no `src/` changes |
| Reopening P106 pressure wiring | Forbidden list + regression guard in validation shape |
| Patron payoff conflated with magnate/renown | Direction comparison must score distinction |
| Auto echo upgrade without contract | P108 must follow P107 contract event spec |
| Entry variant explosion in payoff | Payoff choice markers orthogonal to entry variants |

---

**P107-002 complete.**

# P74 Renown Pressure Design-First — Gaps Report

> **Stage:** P74 Wuxia Renown Pressure Design-First
> **Discovery mode:** post-run (pipeline-auto)
> **Date:** 2026-06-29

---

## 1. Gap Analysis Summary

| Gap Category | Count | Routing |
|---|---|---|
| In-stage (current P74) | 0 | — |
| Next-stage (P75) | 5 | spawn P75 |
| Far-future (P76+) | 7 | defer |

**结论：** P74 阶段自身已闭合（6/6 stories passed），无 in-stage gaps。Pressure implementation 是明确的 next-stage gap，应 spawn P75。

---

## 2. In-Stage Gaps (Current Stage)

**None.** P74 是 design-first contract 阶段，所有 6 个 user stories 均已通过：

| Story | Status | Evidence |
|---|---|---|
| P74-001: Prerequisite audit | ✅ Pass | `docs/test-reports/p74-renown-pressure-prerequisite-audit.md` |
| P74-002: Scope contract | ✅ Pass | `docs/test-reports/p74-renown-pressure-scope-contract.md` |
| P74-003: Direction comparison | ✅ Pass | `docs/test-reports/p74-renown-pressure-direction-comparison.md` |
| P74-004: Pressure contract | ✅ Pass | `docs/PRD/p74-renown-pressure-contract.md` |
| P74-005: P75 validation shape | ✅ Pass | `docs/test-reports/p74-p75-validation-shape.md` |
| P74-006: Closure report | ✅ Pass | `docs/test-reports/p74-renown-pressure-closure-report.md` |

**Scope compliance:** 100% — zero runtime code changes, zero scope creep.

---

## 3. Next-Stage Gaps (→ P75)

以下 gaps 应由 **P75 renown pressure implementation** 阶段承接：

### GAP-P75-01: Runtime Pressure Event Wiring
- **Gap:** `renown_midlife_pressure` 事件尚未在 `sample-lines-spine.json` 中配置
- **Contract spec:** P74 pressure contract §3 — auto event at age 37-41, triggered by `renown_on_ramp_done`
- **Acceptance:** Event exists, fires correctly, sets `renown_midlife_pressure_done` flag
- **Priority:** P0

### GAP-P75-02: Pressure Expression Updates (Core Signals)
- **Gap:** Pressure-specific player-facing expressions 尚未实现
- **Contract spec:** P74 pressure contract §4 — 5 expression surfaces (3 P0 + 2 P1)
- **Core P0 surfaces:**
  - Sample line cost label: "江湖声名之累" → "人情债渐重"
  - Sample line current goal: on-ramp state → pressure state
  - Ordinary origin current goal: on-ramp state → pressure state
- **Bonus P1 surfaces:**
  - Ordinary origin life memory
  - Ordinary origin summary
- **Priority:** P0 (core), P1 (bonus)

### GAP-P75-03: Targeted Proof Artifact
- **Gap:** 缺乏 pressure 链路的 targeted proof
- **Validation shape:** P75 validation shape §2 — ~12 chain nodes, 5 core nodes must show
- **Core nodes:** pre-pressure state → event fires → checkpoint set → cost label update → current goal update
- **Priority:** P0

### GAP-P75-04: Narrow Regression Tests
- **Gap:** 缺乏 pressure 阶段的回归测试保护
- **Validation shape:** P75 validation shape §3 — ~14-17 assertions across 5 groups
- **Groups:** event wiring, pre-pressure state, post-pressure expression, distinct from merchant, no regression of P71/P72/P73
- **Priority:** P0

### GAP-P75-05: Payoff Flag Interface Reservation
- **Gap:** Payoff 阶段的 flag 接口需要在代码中预留（不实现）
- **Contract spec:** P74 pressure contract §6 — `renown_payoff_done`, `renown_age40_identity_done`
- **Priority:** P0 (contract compliance)

---

## 4. Far-Future Gaps (P76+ — Deferred)

以下 gaps 超出 P75 范围，应 defer 到更后阶段：

| Gap | Rationale | Suggested Stage |
|---|---|---|
| Renown payoff stage design & implementation | Pressure-only stage; payoff is next trilogy step | P76+ (design-first, then implementation) |
| Age-40 identity deepening | Payoff stage concern | P76+ |
| Choice-based pressure (accept/decline) | Auto chosen for simplicity; can add later | Future refinement |
| Stat threshold gate implementation | Contract defines it; implementation optional | P75 or later enhancement |
| Mentor-bond renown seed | Second seed route, high scope | Future cycle |
| Farm_peasant / town_apprentice renown bridges | Other origins out of scope | Future cycles |
| Full renown route expansion | Way beyond pressure scope | Far future |
| Cross-route interaction (renown × merchant) | No route interaction systems | Far future |
| Medical_sage_healer route | Second Wave 1 achievement, not started | Future cycle |

---

## 5. North Star Alignment Gaps

对照 `p25-lifetime-simulation-north-star.md`：

### §3 成就谱系
- **Gap:** `jianghu_renown_sage` 只有 bridge + entry + on-ramp，缺 pressure + payoff
- **Gap:** `medical_sage_healer` 完全未启动
- **Status:** OPEN — Wave 1 两条新增成就均未完整可玩

### §6 重玩动机
- **Gap:** Renown 路线只有上升期，没有代价和选择，重玩深度不足
- **Status:** OPEN — pressure 是补上"代价"维度的第一步

### §8 Discovery 完成判定
- **Gap:** 主流成就尚无完整生命周期的可玩样本
- **Gap:** 平凡出身未扩展
- **Status:** OPEN — 距离 Outer Loop CLEAR 很远

---

## 6. Routing Decision

| Gap | Route | Reasoning |
|---|---|---|
| Pressure event wiring | **P75** | Direct implementation of P74 contract |
| Pressure expression updates | **P75** | Direct implementation of P74 contract |
| Targeted proof | **P75** | Required for P75 closure |
| Regression tests | **P75** | Required for P75 closure |
| Payoff flag reservation | **P75** | Contract compliance, minimal cost |
| Payoff stage design | **P76+** | Next trilogy step after pressure |
| Everything else | **Defer** | Out of scope for pressure implementation |

**Decision:** Spawn P75 as the next stage — renown pressure playable implementation.

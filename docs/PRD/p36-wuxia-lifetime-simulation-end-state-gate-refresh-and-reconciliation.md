# PRD: P36 Wuxia Lifetime Simulation End-State Gate Refresh And Reconciliation

> **Derived from:** `docs/PRD/p35-wuxia-wave2-mixed-pinnacle-habit-led-lifetime-traces.md` (Discovery pass 2026-06-24)
> **Stage slug:** `p36-wuxia-lifetime-simulation-end-state-gate-refresh-and-reconciliation`
> **Gaps addressed:** GAP-END-08-01 (reconcile), GAP-END-08-03, GAP-END-08-05, GAP-P35-001 (optional), GAP-P35-002 (optional)

## 1. Introduction

P35 闭合了 mixed `healer_swordsman` 与 pinnacle `jianghu_myth_legend` 两条 habit-led lifetime sim trace，North Star §8 item 1 在**类别级**（主流/混合/巅峰各 ≥1 可玩样本）已有 P34 + P35 证据。但 P35 baseline 未执行 `gate:playability` / `gate:p20`（§8 item 5 SKIP）；§8 item 3 全池后果链 audit 仍 Partial；§8 item 1 对 additional mixed/pinnacle outcomes 与 traceability 全量文档仍 Partial。

P36 在 **不交付 Wave 3 `merchant_magnate` 全量、不交付 Wave 4 平凡出身扩展、不强制 renown birth→death lifetime、不修复 game-engine JSON poison mutex、不全量迁移 medical 池** 的前提下，执行 post-P35 gate 刷新、扩展 P34/P35 trace 后果一致性 audit、产出 North Star §8 end-state reconciliation 报告，并可选新增 **1 条** additional mixed 或 pinnacle habit-led lifetime trace（`founding_patriarch` 或 `merchant_martial_patron`）以强化 §8 item 1 证据。

## 2. Goals

- 运行并文档化 post-P35 `gate:playability` 与 `gate:p20`，证明相对最近 baseline **无退化**（或文档化合理 delta）
- 扩展后果一致性 audit，覆盖 P34 medical + P35 mixed/pinnacle lifetime traces；报告 `highSeverityContradictionCount` 与 §8 item 3 判定
- 产出 North Star §8 end-state reconciliation 报告：逐条映射 §8 checklist → 证据文件 → Met/Partial/Open/Defer
- 可选：新增 **1 条** additional mixed 或 pinnacle habit-led lifetime trace（`founding_patriarch` **或** `merchant_martial_patron`），文档化 seed/age/unlock
- 产出 P36 closure 报告，列出 §8 仍 OPEN 项与 P37+ defer 队列

## 3. Non-Goals

- 不新增 Wave 1 mainstream medical/renown 内容样本（P34 已闭合）
- 不强制 renown birth→death lifetime（P34 skip 保持有效）
- 不交付 Wave 3 `merchant_magnate` 全量商路内容
- 不交付 Wave 4 平凡出身 ≥3 **扩展**（P25 static slice 已 Met §8 item 2）
- 不全量迁移 medical 池 stat/talent gate（3/18 保持）
- 不修复 game-engine JSON poison mutex 非 sim path（Monitor 保持）
- 不重写 `dailyEvents.ts` / scheduler runtime 权重
- 不修改已 `passes: true` 的 P35 story 或 parent PRD

## 4. User Stories

### US-001: Post-P35 Playability And P20 Gate Refresh

**Description:** As a maintainer, I want post-P35 `gate:playability` and `gate:p20` runs documented with delta vs latest baseline.

**Acceptance Criteria:**

- [ ] Run `npm run gate:playability` and `npm run gate:p20` after P35 finalize
- [ ] Save or reference latest gate reports under `docs/test-reports/`
- [ ] Document pass/fail and delta vs pre-P35 baseline in a gate refresh note
- [ ] No gameplay behavior changes beyond fixes if gate finds regressions
- [ ] Typecheck passes

### US-002: Extend P34/P35 Consequence Consistency Audit

**Description:** As a maintainer, I want a consistency audit covering P34 medical and P35 mixed/pinnacle lifetime traces for North Star §8 item 3.

**Acceptance Criteria:**

- [ ] Extend existing P25 consistency slice harness or sibling audit to include P34/P35 lifetime trace flag sequences
- [ ] Report `highSeverityContradictionCount` and per-trace findings
- [ ] Document audit command and results under `docs/test-reports/`
- [ ] Align with P25 zero-contradiction acceptance semantics where applicable
- [ ] Typecheck passes

### US-003: North Star Section 8 End-State Reconciliation Report

**Description:** As a maintainer, I want a reconciliation report mapping each North Star §8 checklist item to evidence and Met/Partial/Open status.

**Acceptance Criteria:**

- [ ] Map all 5 §8 checklist items to evidence files (P25/P34/P35 test reports, gates, slices)
- [ ] State explicit Met/Partial/Open/Defer per item with rationale
- [ ] Recommend whether Discovery may output `end_state_status: CLEAR` after P36 or needs P37+
- [ ] Save under `docs/test-reports/`
- [ ] Typecheck passes (if code touched)

### US-004: Optional Additional Mixed Or Pinnacle Habit-Led Lifetime Trace

**Description:** As a maintainer, I want an optional second mixed or pinnacle habit-led lifetime trace to strengthen §8 item 1 beyond category minimum.

**Acceptance Criteria:**

- [ ] Add **one** of: `founding_patriarch` pinnacle lifetime **or** `merchant_martial_patron` mixed lifetime under P25 test harness
- [ ] Document seed, age steps, unlock, and terminal outcome under `docs/test-reports/`
- [ ] Unlock without static `resolveP31HabitLedKeyChoiceBridges` on fixtures where applicable
- [ ] **Skip acceptable** if US-003 reconciliation proves §8 item 1 category Met with P34/P35 evidence only — document skip with rationale
- [ ] Typecheck passes if implemented

### US-005: Write P36 Closure And Remaining Queue

**Description:** As a maintainer, I want a closure note listing what P36 proved and what remains for North Star §8.

**Acceptance Criteria:**

- [ ] Summarize gate refresh, consistency audit, reconciliation, and optional trace
- [ ] List remaining Wave 3/4 deferrals, renown optional lifetime, medical pool, poison mutex Monitor
- [ ] Cross-reference North Star §8 items still OPEN after P36
- [ ] Save under `docs/test-reports/`

## 5. Success Metrics

- Post-P35 `gate:playability` + `gate:p20` documented with no unexplained regression
- §8 reconciliation report exists with explicit per-item status
- Consistency audit covers P34/P35 lifetime traces with documented contradiction count
- Optional trace or documented skip for additional mixed/pinnacle outcome

## 6. Dependencies / Context

- Parent: P35 closure `docs/test-reports/p35-closure-report.md`
- P34 lifetime: `docs/test-reports/p34-medical-lifetime-birth-to-death-slice.md`
- P35 traces: `docs/test-reports/p35-mixed-healer-swordsman-lifetime-trace.md`, `p35-pinnacle-myth-legend-lifetime-trace.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md` §8
- Gates: `docs/test-reports/p8-playability-gate-latest.md`, P20 gate reports
- Traceability: `src/p25/achievementTraceability.ts`

## 7. Open Questions

- Additional trace priority: `founding_patriarch` vs `merchant_martial_patron` — default `founding_patriarch`（补 pinnacle 第二 outcome）
- US-004 skip vs implement — default skip-first if US-003 proves category Met；implement only if reconciliation marks item 1 Partial
- Gate regression fix scope — default minimal parity fix only; no scheduler rewrite

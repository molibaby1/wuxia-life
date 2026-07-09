# PRD: P132 Wuxia Wave 2 Pinnacle End-State Reconciliation (Post-jianghu_myth_legend)

> **Derived from:** `docs/PRD/p131-wuxia-wave2-pinnacle-playable-spine.md` (Discovery pass 2026-07-09)
> **Stage slug:** `p132-wuxia-wave2-pinnacle-end-state-reconciliation`
> **Gaps addressed:** GAP-P131-N01, GAP-P131-N02, GAP-P131-N03, GAP-P131-N04
> **Stage type:** docs + gate refresh reconciliation; no new pinnacle runtime content

## 1. Introduction

P131 闭合了单条 Wave 2 巅峰成就 `jianghu_myth_legend`（武林神话）的 bounded playable spine：P35 lifetime trace 语义保留，runtime on-ramp + luck window + expression + targeted proof + narrow regression 均已 repo-proven。North Star §3.2 在 **单 pinnacle playable spine** 维度上已有 P35 habit-led sim trace + P131 sample-lines 证据，但最近一次正式 §8 reconciliation 止于 P36/P37 时代，未纳入 P131 runtime playable 增量；§8 item 1 对 pinnacle tier 的 **runtime playable** 评估亦需刷新。

本阶段在 **不交付新 pinnacle 内容、不重开 jianghu_myth_legend spine、不扩 founding_patriarch、不启动 Wave 3 mixed catalog runtime** 的前提下，执行 post-P131 gate 刷新、扩展 myth-legend spine 后果一致性 audit、产出 North Star §3.2 / §8 end-state reconciliation 报告，并明确 Discovery 是否可输出 `end_state_status: CLEAR` 或仍需后续 defer 队列。

## 2. Goals

- 运行并文档化 post-P131 窄回归 + 可选 `gate:playability` / `gate:p20` delta，证明相对 P131 baseline **无退化**
- 扩展后果一致性 audit，覆盖 `jianghu_myth_legend` playable spine（P131 on-ramp → luck echo）flag 序列
- 产出 North Star §3.2 / §8 end-state reconciliation 报告：逐条映射 checklist → 证据文件 → Met/Partial/Open/Defer
- 明确 `jianghu_myth_legend` single-pinnacle runtime 闭合后，Wave 2 catalog 与 Wave 3/4 仍 OPEN 的 defer 队列
- 产出 P132 closure 报告，推荐 Discovery 下一动作（`CLEAR` vs 下一 bounded stage）

## 3. Non-Goals

- 不新增 `jianghu_myth_legend` 或任何 pinnacle 的 runtime 内容
- 不重做 P131 spine / expression / tests
- 不扩 `founding_patriarch` playable spine（P113+ 平行轨道已闭合）
- 不交付 Wave 3 mixed catalog playable spines
- 不交付 Wave 4 平凡出身扩展
- 不做 full-lifetime `gate:p20` broad exhaust（仅 delta vs P131 baseline）
- 不 respawn P130 visible-growth 工作
- 不修改已 `passes: true` 的 P131 story 或 parent PRD

## 4. User Stories

### US-001: Post-P131 Regression And Gate Refresh

**Description:** As a maintainer, I want post-P131 regression and optional gate runs documented with delta vs P131 baseline.

**Acceptance Criteria:**

- [ ] Re-run `npm run typecheck`, `p131PinnacleMythLegendSpineTests`, `p35MixedPinnacleParityTests`
- [ ] Run `npm run gate:playability` and `npm run gate:p20` (or document defer with rationale)
- [ ] Save or reference latest gate reports under `docs/test-reports/`
- [ ] Document pass/fail and delta vs pre-P131 baseline in a gate refresh note
- [ ] No gameplay behavior changes beyond minimal fixes if gate finds regressions
- [ ] Typecheck passes

### US-002: Extend Myth-Legend Spine Consequence Consistency Audit

**Description:** As a maintainer, I want a consistency audit covering jianghu_myth_legend playable spine flag sequences (P131) for North Star §8 item 3.

**Acceptance Criteria:**

- [ ] Extend existing P36/P39 consistency harness or sibling audit to include P131 spine flag sequences (on-ramp → luck echo)
- [ ] Report `highSeverityContradictionCount` and per-trace findings
- [ ] Document audit command and results under `docs/test-reports/`
- [ ] Align with P25/P39 zero-contradiction acceptance semantics
- [ ] Typecheck passes

### US-003: North Star §3.2 / §8 End-State Reconciliation Report

**Description:** As a maintainer, I want a reconciliation report mapping North Star §3.2 pinnacle tier and §8 checklist items to evidence after jianghu_myth_legend playable spine closure.

**Acceptance Criteria:**

- [ ] Map §3.2 pinnacle requirements and all 5 §8 checklist items to evidence files
- [ ] State explicit Met, Partial, Open, or Defer per item with rationale
- [ ] Incorporate P35 lifetime trace + P131 runtime playable spine into item 1 assessment
- [ ] Recommend whether Discovery may output `end_state_status: CLEAR` after P132 or needs further stages
- [ ] Save under `docs/test-reports/`
- [ ] Typecheck passes if code touched

### US-004: Write P132 Closure And Remaining Queue

**Description:** As a maintainer, I want a closure note listing what P132 proved and what remains at product level after single-pinnacle closure.

**Acceptance Criteria:**

- [ ] Summarize gate refresh, consistency audit, and reconciliation results
- [ ] Confirm `jianghu_myth_legend` single-pinnacle runtime closure status (no reopen)
- [ ] List defer queue: additional Wave 2 pinnacles, Wave 3 mixed, Wave 4 ordinary, full myth pressure/mid/late chain
- [ ] Cross-reference §8 items still OPEN after P132 (if any)
- [ ] Explicit non-recommendation: visible-growth respawn, cross-achievement pinnacle framework
- [ ] Save under `docs/test-reports/`
- [ ] Typecheck passes

## 5. Success Criteria

- Post-P131 regression documented; gate delta explained (pass, fail, or defer)
- §3.2 / §8 reconciliation report exists with explicit per-item status post-P131
- Myth-legend spine paths included in consistency audit with documented contradiction count
- P132 closure clearly states whether `end_state_status: CLEAR` is warranted

## 6. Dependencies / Context

- Parent: P131 closure `docs/test-reports/p131-pinnacle-myth-legend-closure-report.md`
- P35 trace: `docs/test-reports/p35-pinnacle-myth-legend-lifetime-trace.md`
- P131 proof: `docs/test-reports/p131-pinnacle-myth-legend-targeted-proof.md`
- Prior reconciliation: `docs/test-reports/p36-north-star-section8-reconciliation.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md` §3.2, §6, §8
- Tests: `tests/p131PinnacleMythLegendSpineTests.ts`, `tests/p35MixedPinnacleParityTests.ts`

## 7. Open Questions

- Gate regression fix scope — default minimal parity fix only; no scheduler rewrite
- If US-003 proves all §8 items Met after gate refresh, recommend `end_state_status: CLEAR` in closure
- If item 1 still Partial (additional pinnacles), identify smallest next bounded stage (additional pinnacle spine vs Wave 3 mixed)

# PRD: P120 Wuxia Lifetime Simulation End-State Reconciliation (Post-Founding-Patriarch)

> **Derived from:** `docs/PRD/p119-wuxia-founding-patriarch-endgame-playable-implementation.md` (Discovery pass 2026-07-02)
> **Stage slug:** `p120-wuxia-lifetime-simulation-end-state-reconciliation-post-founding-patriarch`
> **Gaps addressed:** GAP-P119-N01, GAP-P119-N02, GAP-P119-N03, GAP-P119-N04
> **Stage type:** docs + gate refresh reconciliation; no new route content wave

## 1. Introduction

P119 闭合了 `founding_patriarch`（开派祖师）路线的 playable endgame：`bridge → on-ramp → pressure → payoff → late-life → endgame` 全链 runtime 可追溯。North Star §8 item 1 在 founding-patriarch playable spine 维度上已有 P37 lifetime trace + P113–P119 sample-lines 证据，但最近一次正式 §8 reconciliation 止于 P36/P37 时代；§8 item 5 的 `gate:p20` 证据亦未覆盖 P113–P119 增量。

本阶段在 **不交付新路线内容、不重开 founding-patriarch spine、不扩 Wave 4 平凡出身、不强制 P19 generic endgame 集成** 的前提下，执行 post-P119 gate 刷新、扩展 founding-patriarch spine 后果一致性 audit、产出 North Star §8 end-state reconciliation 报告，并明确 Discovery 是否可输出 `end_state_status: CLEAR` 或仍需后续 defer 队列。

## 2. Goals

- 运行并文档化 post-P119 `gate:playability` 与 `gate:p20`，证明相对最近 baseline **无退化**（或文档化合理 delta）
- 扩展后果一致性 audit，覆盖 founding-patriarch playable spine（P113–P119）flag 序列；报告 `highSeverityContradictionCount`
- 产出 North Star §8 end-state reconciliation 报告：逐条映射 §8 checklist → 证据文件 → Met/Partial/Open/Defer
- 明确 founding-patriarch 路线 runtime 闭合后，产品层仍 OPEN 的 defer 队列（P19、ordinary-origin overlays、identity matrices 等）
- 产出 P120 closure 报告，推荐 Discovery 下一动作（`CLEAR` vs 下一 bounded stage）

## 3. Non-Goals

- 不新增 founding-patriarch 或任何路线的 runtime 内容
- 不重做 P113–P119 spine / expression / tests
- 不实现 P19 generic endgame 集成
- 不实现 ordinary-origin founding-patriarch endgame expression
- 不交付 Wave 4 平凡出身扩展
- 不做 full-lifetime `gate:p20` broad exhaust（仅 delta vs baseline）
- 不修改已 `passes: true` 的 P119 story 或 parent PRD
- 不 spawn `jianghu_myth_legend` playable bridge（P35 lifetime trace 已满足 pinnacle 类别）

## 4. User Stories

### US-001: Post-P119 Playability And P20 Gate Refresh

**Description:** As a maintainer, I want post-P119 `gate:playability` and `gate:p20` runs documented with delta vs latest baseline.

**Acceptance Criteria:**

- [ ] Run `npm run gate:playability` and `npm run gate:p20` after P119 finalize
- [ ] Save or reference latest gate reports under `docs/test-reports/`
- [ ] Document pass/fail and delta vs pre-P119 baseline in a gate refresh note
- [ ] No gameplay behavior changes beyond minimal fixes if gate finds regressions
- [ ] Typecheck passes

### US-002: Extend Founding-Patriarch Spine Consequence Consistency Audit

**Description:** As a maintainer, I want a consistency audit covering founding-patriarch playable spine flag sequences (P113–P119) for North Star §8 item 3.

**Acceptance Criteria:**

- [ ] Extend existing P39 consistency harness or sibling audit to include P113–P119 spine flag sequences (bridge → endgame)
- [ ] Report `highSeverityContradictionCount` and per-trace findings
- [ ] Document audit command and results under `docs/test-reports/`
- [ ] Align with P25/P39 zero-contradiction acceptance semantics
- [ ] Typecheck passes

### US-003: North Star §8 End-State Reconciliation Report

**Description:** As a maintainer, I want a reconciliation report mapping each North Star §8 checklist item to evidence and status after founding-patriarch route closure.

**Acceptance Criteria:**

- [ ] Map all 5 §8 checklist items to evidence files
- [ ] State explicit Met, Partial, Open, or Defer per item with rationale
- [ ] Incorporate founding-patriarch P113–P119 playable spine into item 1 assessment
- [ ] Recommend whether Discovery may output `end_state_status: CLEAR` after P120 or needs further stages
- [ ] Save under `docs/test-reports/`
- [ ] Typecheck passes if code touched

### US-004: Write P120 Closure And Remaining Queue

**Description:** As a maintainer, I want a closure note listing what P120 proved and what remains at product level after founding-patriarch route closure.

**Acceptance Criteria:**

- [ ] Summarize gate refresh, consistency audit, and reconciliation results
- [ ] Confirm founding-patriarch route runtime closure status (no reopen)
- [ ] List defer queue: P19, ordinary-origin overlays, identity matrices, Wave 4 expansion
- [ ] Cross-reference §8 items still OPEN after P120 (if any)
- [ ] Save under `docs/test-reports/`
- [ ] Typecheck passes

## 5. Success Criteria

- Post-P119 `gate:playability` + `gate:p20` documented with no unexplained regression
- §8 reconciliation report exists with explicit per-item status post-P119
- Founding-patriarch spine paths included in consistency audit with documented contradiction count
- P120 closure clearly states whether `end_state_status: CLEAR` is warranted

## 6. Dependencies / Context

- Parent: P119 closure `docs/test-reports/p119-founding-patriarch-endgame-closure-report.md`
- Founding-patriarch chain: `docs/test-reports/p113-founding-patriarch-bridge-chain-proof.md`
- Prior reconciliation: `docs/test-reports/p36-north-star-section8-reconciliation.md`
- P39 item 3: `docs/test-reports/p39-section8-item3-reconciliation-closure.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md` §3, §8
- Gates: `docs/test-reports/p8-playability-gate-latest.md`, P20 gate reports

## 7. Open Questions

- Gate regression fix scope — default minimal parity fix only; no scheduler rewrite
- If US-003 proves all §8 items Met after gate refresh, recommend `end_state_status: CLEAR` in closure
- If item 5 still Partial, identify smallest next bounded stage (e.g. P19 integration vs doc-only drift fix)

# PRD: P39 Wuxia Full Content Pool Consequence Audit Reconciliation

> **Derived from:** `docs/PRD/p38-wuxia-p8-playability-frustration-remediation.md` (Discovery pass 2026-06-24)
> **Stage slug:** `p39-wuxia-full-content-pool-consequence-audit-reconciliation`
> **Gaps addressed:** GAP-END-08-03, GAP-P37-CONSISTENCY

## 1. Introduction

P38 闭合了 North Star §8 item 5 的 **absolute pass** 缺口（`gate:playability` PASS，8/8 persona frustration pass，6/6 原 blocker opaque ratio 0.00）。Product End-State 仍为 **OPEN**：§8 item 3 在 P36 8-path 切片上 Met（`highSeverityContradictionCount: 0`），但 **full content pool** 后果链未穷尽审计；P37 两条 additional lifetime traces（`merchant_martial_patron`、`founding_patriarch`）亦未纳入扩展 harness。

P39 在 **不交付 Wave 3/4、不全量迁移 medical 池、不重写 scheduler、不修改 P26–P38 已闭合 stories** 的前提下，定义 full pool audit 验收边界、扩展 consistency harness（含 P37 traces + 代表性 content pool 样本）、执行审计并修复发现的 high/critical 矛盾，产出 §8 item 3 向 **Met** 推进的 reconciliation closure。

## 2. Goals

- 产出 content pool 审计范围清单：覆盖 `src/data/lines/*.json`、setback/love 池及 P17 后果链；分类 ghost-flag、mutex、summary 叙事矛盾风险
- 扩展 `p36ConsequenceConsistencySlice`（或等价 harness）纳入 P37 lifetime traces + 每主题 ≥1 代表性 pool path，使审计路径 **≥12**（8-path baseline + P37×2 + pool samples）
- 运行扩展 audit；`highSeverityContradictionCount` 保持 **0**；若有 findings 则修复根因并重跑至 PASS
- 新增或扩展 isolated regression（如 `tests/p39ContentPoolConsistencyTests.ts`）断言扩展 harness PASS
- 产出 §8 item 3 reconciliation closure，更新 North Star 完成判定证据链

## 3. Non-Goals

- 不交付 Wave 3 `merchant_magnate` 或 Wave 4 平凡出身扩展
- 不全量迁移 medical 池 habit-led（3/18 保持）
- 不修复 game-engine JSON poison mutex 非 sim path（Monitor 保持）
- 不重写 `dailyEvents.ts` / scheduler runtime 权重
- 不新增 lifetime sim traces（P34–P37 已闭合）
- 不修改已 `passes: true` 的 P26–P38 stories
- 不追求 exhaustive 全事件 combinatorial 证明（bounded representative pool audit 即可）

## 4. User Stories

### US-001: P39 Content Pool Audit Scope Inventory

**Description:** As a maintainer, I want an inventory of content pools and consequence-risk categories so the full audit has explicit acceptance boundaries.

**Acceptance Criteria:**

- [ ] Inventory `src/data/lines/*.json` and setback/love pools with event counts and flag-touch surfaces
- [ ] Classify risk categories: ghost-flag, mutex violation, summary/narrative contradiction, stale flag reader
- [ ] Map each pool to ≥1 representative audit path candidate
- [ ] Document P37 trace flag sequences as harness extension inputs
- [ ] Save audit scope under `docs/test-reports/`
- [ ] No gameplay behavior changes in this story

### US-002: P39 Extended Consistency Harness

**Description:** As a maintainer, I want an extended consequence consistency harness covering P37 traces and representative pool paths.

**Acceptance Criteria:**

- [ ] Extend harness beyond P36 8-path baseline to include P37 `merchant_martial_patron` and `founding_patriarch` lifetime traces
- [ ] Add ≥2 representative content-pool paths (e.g. setback pool, medical/love line sample)
- [ ] Total audited paths **≥12**
- [ ] Harness exports `highSeverityContradictionCount` and per-path findings
- [ ] Typecheck passes

### US-003: P39 Full Pool Audit Run And Remediation

**Description:** As a maintainer, I want a full pool audit run with remediation of any high/critical findings.

**Acceptance Criteria:**

- [ ] Run extended audit via script (e.g. `scripts/runP39ContentPoolConsistencySlice.ts`)
- [ ] Save report under `docs/test-reports/` with per-path findings table
- [ ] `highSeverityContradictionCount: 0` — fix root causes if non-zero and re-run
- [ ] Document any medium/low findings as defer queue (non-blocker)
- [ ] Typecheck passes

### US-004: P39 Isolated Regression And Gate Carry-Forward

**Description:** As a maintainer, I want isolated regression and gate carry-forward proving no regression from P38 playability pass.

**Acceptance Criteria:**

- [ ] Add or extend `tests/p39ContentPoolConsistencyTests.ts` asserting extended harness PASS
- [ ] Carry-forward: `tests/p38FrustrationRemediationTests.ts`, `tests/p36ConsistencyTests.ts`, `tests/p37AdditionalMixedPinnacleParityTests.ts` pass
- [ ] Confirm `gate:playability` latest report remains PASS (re-run or reference post-P38 artifact with no narrative regression)
- [ ] Test file runs independently and exits cleanly
- [ ] Typecheck passes

### US-005: P39 Section 8 Item 3 Reconciliation Closure

**Description:** As a maintainer, I want a closure note updating §8 item 3 status after full pool audit.

**Acceptance Criteria:**

- [ ] Summarize audit scope, harness extension, findings, verification commands
- [ ] State §8 item 3 status after P39 (Met vs remaining Partial)
- [ ] List remaining defer queue (Wave 3/4, medical pool, poison mutex monitor)
- [ ] Save under `docs/test-reports/`

## 5. Success Metrics

- Extended audit paths **≥12** with `highSeverityContradictionCount: 0`
- P37 lifetime traces included in consistency harness
- `typecheck` + P39 isolated tests + P36/P37/P38 carry-forward tests pass
- `gate:playability` remains PASS (no regression vs P38)
- §8 item 3 reconciliation documents Met or explicit residual with evidence

## 6. Dependencies / Context

- Parent: P38 closure `docs/test-reports/p38-closure-report.md`
- P36 baseline: `docs/test-reports/p36-consequence-consistency-slice.md`, `src/p25/p36ConsequenceConsistencySlice.ts`
- P37 traces: `docs/test-reports/p37-mixed-merchant-patron-lifetime-trace.md`, `p37-pinnacle-founding-patriarch-lifetime-trace.md`
- Product End-State: `docs/designs/p25-lifetime-simulation-north-star.md` §8 item 3
- Pool inventory precedent: `docs/test-reports/p27-habit-pool-audit-delta.md`

## 7. Open Questions

- Audit depth vs bounded representative — default **bounded representative** (≥1 path per major pool theme); combinatorial exhaust defer
- Medium/low findings — document in defer queue; only high/critical block §8 item 3 Met
- P38 narrative fixes in setback/love JSON — include in pool audit scope; no re-audit of P38 frustration metric (carry-forward gate PASS sufficient)

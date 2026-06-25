# PRD: P38 Wuxia P8 Playability Frustration Remediation

> **Derived from:** `docs/PRD/p37-wuxia-additional-mixed-pinnacle-lifetime-traces.md` (Discovery pass 2026-06-24)
> **Stage slug:** `p38-wuxia-p8-playability-frustration-remediation`
> **Gaps addressed:** GAP-END-08-05b, GAP-P8-FRUSTRATION

## 1. Introduction

P37 闭合了 North Star §8 item 1 的 **additional outcomes** 缺口（`merchant_martial_patron`、`founding_patriarch` habit-led lifetime traces，100% unlock，无 static resolver）。Product End-State 仍为 **OPEN**：§8 items 1/3/5 Partial；P8 `gate:playability` 在 6/8 persona 上因 **frustration opaque ratio 1.00** 持续 FAIL（P36 gate refresh 已证明无退化，但绝对 pass 未达成）。

P38 在 **不重写 scheduler、不交付 Wave 3/4、不全量迁移 medical 池、不新增 lifetime sim trace** 的前提下，审计 6 个 blocker persona 的 opaque setback 根因，为高频 setback 事件（`setback_injury`、`setback_property_loss`、`love_secret_help` 等）补充可解释的因果叙事或 metric 分类信号，重跑 gate 并产出 §8 item 5 向 **absolute pass** 推进的 closure。

## 2. Goals

- 产出 6 blocker persona 的 opaque setback 审计：eventId 频率、叙事模式、与 `collectFrustrationMetrics` 分类规则的差距
- 修复 **≥3** 个高频 recurring setback 事件模板，使叙事含可检测的 causality/explanation 信号（`因为`/`由于`/`缘故`/`导致` 或等效 warned/recoverable 路径）
- 重跑 `npm run gate:playability`（headless_server, age 0–40），文档化 vs P36 baseline delta；目标 **≥4/6** 原 blocker persona opaque ratio **< 0.35**
- 新增或扩展 isolated regression（如 `tests/p38FrustrationRemediationTests.ts`）断言修复后 setback 分类与 gate blocker 计数
- 产出 closure，更新 §8 item 5 从 Partial（no-regression only）向 **absolute pass** 推进的状态

## 3. Non-Goals

- 不重写 `dailyEvents.ts` / scheduler runtime 权重
- 不交付 Wave 3 `merchant_magnate` 或 Wave 4 平凡出身扩展
- 不全量迁移 medical 池 habit-led
- 不新增或修改 P34–P37 lifetime sim traces
- 不修改已 `passes: true` 的 P26–P37 stories
- 不要求 P20 replayability gate 变更（已 pass）
- 不追求 8/8 persona pass 作为本 stage 硬门槛（渐进修复；closure 记录残余）

## 4. User Stories

### US-001: P38 Opaque Setback Root-Cause Audit

**Description:** As a maintainer, I want an audit of opaque setback root causes across the 6 P8 blocker personas so remediation targets minimal high-frequency event templates.

**Acceptance Criteria:**

- [ ] Inventory opaque setbacks per persona from `docs/test-reports/p8-playability-gate-latest.json`
- [ ] Rank eventIds by frequency across blocker personas (`setback_injury`, `setback_property_loss`, `love_secret_help`, etc.)
- [ ] Map each top event to current narrative text and `collectFrustrationMetrics` classification outcome
- [ ] Save audit under `docs/test-reports/` or `docs/designs/`
- [ ] No gameplay behavior changes in this story

### US-002: P38 Recurring Setback Causality Wiring

**Description:** As a maintainer, I want causality/explanation signals on top recurring setback event templates so frustration metric classifies fewer setbacks as opaque.

**Acceptance Criteria:**

- [ ] Fix **≥3** high-frequency setback events identified in P38-001 audit
- [ ] Each fix adds detectable explanation (causality keywords or warned/recoverable narrative path per `collectFrustrationMetrics`)
- [ ] Fixes scoped to setback/negative outcome narrative — no scheduler rewrite
- [ ] Document before/after narrative samples under `docs/test-reports/`
- [ ] Typecheck passes

### US-003: P38 Persona-Cluster Frustration Fixes

**Description:** As a maintainer, I want persona-cluster-specific opaque setback fixes for remaining blocker personas after recurring template wiring.

**Acceptance Criteria:**

- [ ] Address remaining opaque setbacks for at least 2 persona clusters (martial/wealth, social/cautious/deviant/balanced)
- [ ] Each fix traces to audit eventId with documented explanation path
- [ ] No regression for passing personas (`p8-scholar-su`, `p8-explorer-lu`)
- [ ] Typecheck passes

### US-004: P38 Gate Refresh And Frustration Regression

**Description:** As a maintainer, I want post-remediation gate refresh and isolated regression asserting frustration metric improvements.

**Acceptance Criteria:**

- [ ] Run `npm run gate:playability`; save or reference latest reports under `docs/test-reports/`
- [ ] Document delta vs P36 post-P35 baseline (`p36-post-p35-gate-refresh.md`)
- [ ] Target **≥4/6** former blocker personas with opaque ratio **< 0.35**
- [ ] Add or extend isolated test file asserting setback classification improvements
- [ ] Test file runs independently and exits cleanly
- [ ] Typecheck passes

### US-005: Write P38 Closure And Section 8 Item 5 Update

**Description:** As a maintainer, I want a closure note updating §8 item 5 status after P38 frustration remediation.

**Acceptance Criteria:**

- [ ] Summarize audit, fixes, gate delta, verification commands
- [ ] State §8 item 5 absolute-pass status after P38 (Met vs remaining Partial)
- [ ] List remaining defer queue (full pool audit, Wave 3/4, medical pool)
- [ ] Save under `docs/test-reports/`

## 5. Success Metrics

- **≥4/6** former P8 frustration blocker personas report opaque ratio **< 0.35** on post-remediation gate run
- **≥3** recurring setback event templates wired with causality/explanation signals
- `typecheck` + P38 isolated tests + P34/P35/P37 carry-forward tests pass
- No regression on `gate:p20` or passing P8 personas

## 6. Dependencies / Context

- Parent: P37 closure `docs/test-reports/p37-closure-report.md`
- P36 gate baseline: `docs/test-reports/p36-post-p35-gate-refresh.md`, `p8-playability-gate-latest.{json,md}`
- Frustration metric: `src/p8/collectPersonaMetrics.ts` `collectFrustrationMetrics`
- Gate runner: `scripts/runP8PlayabilityGate.ts`, `npm run gate:playability`
- Product End-State: `docs/designs/p25-lifetime-simulation-north-star.md` §8 item 5

## 7. Open Questions

- Narrative fix vs metric classification tweak — default **narrative-first** (add causality to event text); metric rule change only if narrative fix insufficient and documented
- `love_secret_help` negative classification — may be false-positive negative detection; audit in P38-001 determines fix path
- Full 8/8 persona pass — defer to follow-up if 4/6 threshold met with documented residual queue

# PRD: P40 Wuxia P8 Replay And Pacing Polish

> **Derived from:** P39 discovery defer queue `GAP-P8-WARNINGS` (2026-06-24)
> **Stage slug:** `p40-wuxia-p8-replay-pacing-polish`
> **Parent:** P39 closure `docs/test-reports/p39-section8-item3-reconciliation-closure.md`, P38 closure `docs/test-reports/p38-closure-report.md`
> **Optional:** North Star §8 is **CLEAR** after P39; P40 is polish only — does not block End-State

## 1. Introduction

P38 已使 `gate:playability` **PASS**（frustration opaque ratio 全 persona 达标）。P39 闭合后 Product End-State §8 五项 **Met**，但 P8 gate 仍有两类 **非 blocker warning**：

| Warning | Current baseline | Threshold |
| --- | --- | --- |
| **Pacing** | `p8-deviant-ye`: low-impact span **6y** | warning if >5y; blocker if >8y |
| **Replayability** | **7** near-duplicate pairs (cosine ≥0.82) | warning if any pair |

Near-duplicate cluster（2026-06-24 `p8-playability-gate-latest.json`）：

- `p8-martial-lin ~ p8-cautious-han` (0.94)
- `p8-scholar-su ~ p8-wealth-shen` (0.97)
- `p8-scholar-su ~ p8-deviant-ye` (0.94)
- `p8-scholar-su ~ p8-balanced-wei` (0.90)
- `p8-wealth-shen ~ p8-deviant-ye` (0.92)
- `p8-wealth-shen ~ p8-balanced-wei` (0.90)
- `p8-deviant-ye ~ p8-balanced-wei` (0.93)

Prior probe `docs/designs/childhood-payoff-spine-7-13-slice-c-targets.md` showed **content-layer** childhood payoff can clear pacing for all 8 personas; current tree may have regressed or never merged Slice C. Replay similarity uses `signatureVector` in `src/p8/collectPersonaMetrics.ts` — convergence is driven by route identity, action mix, and echo flags, not random seed alone.

P40 在 **不重写 scheduler、不修改 P8 metric 阈值、不重复 P38 frustration 工作、不新增 lifetime sim trace、不交付 Wave 3/4** 的前提下，审计并修复上述 warning 根因，重跑 gate 并产出 closure。

## 2. Goals

- 审计 `p8-deviant-ye` 6y low-impact span：定位 ages、缺失 impact 事件类型，对照 childhood payoff spine 7–13 合约
- 使 `p8-deviant-ye` low-impact span **≤5y**（清除 pacing warning），且不引入 blocker regression
- 审计 7 对 near-duplicate 的 signature 收敛根因（persona cluster、route seeds、content gaps）
- 通过 **persona/route 差异化内容**（非 metric 阈值调整）将 near-duplicate pairs **≤3**（stretch: **0**）
- 重跑 `npm run gate:playability`；维持 **PASS** + P38 frustration 不退化
- 新增 isolated regression（`tests/p40ReplayPacingPolishTests.ts`）+ carry-forward P38/P39 tests
- 产出 closure，更新 defer queue（`GAP-P8-WARNINGS` closed or residual documented）

## 3. Non-Goals

- 不重写 `dailyEvents.ts` / scheduler runtime 权重
- **不修改** `playabilityGate.ts` / `collectPersonaMetrics.ts` 阈值或 `signatureVector` 权重（默认 narrative/content-first）
- 不重复 P38 opaque setback 修复（`setback-events.json` / `love.json` 已处理）
- 不全量 setback pool audit（`setback_illness`, `setback_betrayal` 等 defer）
- 不交付 Wave 3 `merchant_magnate`、Wave 4 平凡出身扩展
- 不全量 medical 池 habit-led 迁移
- 不新增或修改 P34–P37 lifetime sim traces
- 不要求修改已 `passes: true` 的 P26–P39 stories
- 不以 8/8 persona pacing warning-free 为硬门槛（仅 deviant-ye 为当前 baseline warning）

## 4. User Stories

### US-001: P40 Pacing And Replay Root-Cause Audit

**Description:** As a maintainer, I want an audit of deviant-ye pacing gap and near-duplicate replay pairs so remediation targets minimal high-leverage content surfaces.

**Acceptance Criteria:**

- [ ] Extract `p8-deviant-ye` low-impact span ages from latest gate JSON; list non-impact records in span
- [ ] Map span gap to missing childhood payoff / demonic route content vs `docs/designs/childhood-payoff-spine-7-13-content-contract.md`
- [ ] For each of 7 near-duplicate pairs, document `signatureVector` divergence gaps (route identity, action mix, echo flags)
- [ ] Rank persona clusters by similarity score; identify ≥2 differentiation levers per cluster
- [ ] Save audit under `docs/test-reports/p40-pacing-replay-audit.md`
- [ ] No gameplay behavior changes in this story

### US-002: P40 Deviant-Ye Pacing Remediation

**Description:** As a maintainer, I want demonic-route childhood/youth payoff content so p8-deviant-ye clears the 5y low-impact pacing warning.

**Acceptance Criteria:**

- [ ] Implement audit-identified fixes (childhood payoff spine events, demonic route flags, or persona seed wiring — per audit)
- [ ] Allowed surfaces: `src/data/lines/general.json`, `src/data/golden-line-spine.json`, `src/p8/personaYouthRouteSeeds.ts`, event manifest — **not** scheduler core
- [ ] `p8-deviant-ye` low-impact span **≤5y** on isolated headless run or full gate
- [ ] No regression: all personas remain pacing **pass** or **warning** (no new >8y blocker spans)
- [ ] Document before/after pacing samples under `docs/test-reports/`
- [ ] Typecheck passes

### US-003: P40 Persona Replay Differentiation

**Description:** As a maintainer, I want persona-differentiating content so P8 replay signature vectors diverge and near-duplicate pairs drop.

**Acceptance Criteria:**

- [ ] Address at least **2** high-similarity clusters from audit (scholar/wealth/deviant/balanced cluster + martial/cautious pair)
- [ ] Each fix traces to audit lever with documented expected signature delta
- [ ] Prefer route-specific choice/milestone content over global copy changes
- [ ] Near-duplicate pair count **≤3** on post-fix gate run (baseline 7)
- [ ] No regression for P38 frustration opaque ratios (all personas ≤0.35)
- [ ] Typecheck passes

### US-004: P40 Gate Refresh And Isolated Regression

**Description:** As a maintainer, I want post-polish gate refresh and isolated regression asserting pacing/replay improvements without blocker regression.

**Acceptance Criteria:**

- [ ] Run `npm run gate:playability`; save or reference latest reports under `docs/test-reports/`
- [ ] Document delta vs P38/P39 baseline (`p8-playability-gate-latest` pre-P40)
- [ ] Gate decision remains **PASS**; frustration blockers unchanged
- [ ] Add `tests/p40ReplayPacingPolishTests.ts` asserting deviant-ye span ≤5y and near-duplicate count ≤3
- [ ] Carry-forward P38, P39, P36, P37 tests pass
- [ ] Test file runs independently and exits cleanly
- [ ] Typecheck passes

### US-005: P40 Closure And Defer Queue Update

**Description:** As a maintainer, I want a closure note documenting P40 polish outcomes and updated defer queue.

**Acceptance Criteria:**

- [ ] Summarize audit, fixes, gate delta, verification commands
- [ ] State `GAP-P8-WARNINGS` status (closed vs residual with rationale)
- [ ] Confirm §8 item 5 gate-no-regression status unchanged (Met)
- [ ] List remaining defer queue (Wave 3/4, medical pool, full setback audit, combinatorial proof)
- [ ] Save under `docs/test-reports/p40-closure-report.md`

## 5. Success Metrics

| ID | Metric | Baseline | Target |
| --- | --- | --- | --- |
| **M1** | `p8-deviant-ye` low-impact span | 6y | **≤5y** |
| **M2** | Near-duplicate pairs | 7 | **≤3** (stretch 0) |
| **M3** | `gate:playability` decision | PASS | **PASS** |
| **M4** | Frustration opaque ratio (all personas) | ≤0.35 | **no regression** |
| **M5** | Isolated + carry-forward tests | — | **pass** |

Commands:

```bash
npm run gate:playability
npm exec tsx tests/p40ReplayPacingPolishTests.ts
npm exec tsx tests/p38FrustrationRemediationTests.ts
npm exec tsx tests/p39ContentPoolConsistencyTests.ts
npx tsc --noEmit
```

## 6. Dependencies / Context

- Parent closure: `docs/test-reports/p39-section8-item3-reconciliation-closure.md`
- P38 baseline: `docs/test-reports/p38-closure-report.md`, `p8-playability-gate-latest.{json,md}`
- Prior pacing probe: `docs/designs/childhood-payoff-spine-7-13-slice-c-targets.md`, `docs/test-reports/childhood-payoff-spine-slice-c-gate-regression.md`
- Metrics: `src/p8/collectPersonaMetrics.ts` (`collectPacingMetrics`, `collectReplayMetrics`, `isPacingImpactRecord`)
- Gate: `scripts/runP8PlayabilityGate.ts`, `src/p8/playabilityGate.ts`
- Persona seeds: `src/p8/personaYouthRouteSeeds.ts`, `src/p8/personas.ts`
- Product End-State: `docs/designs/p25-lifetime-simulation-north-star.md` §8 item 5 (Met via P38; P40 polish only)

## 7. Open Questions

- **Slice C merge vs net-new:** Audit (P40-001) decides whether to port prior childhood payoff spine work or author minimal demonic-specific beats
- **Replay differentiation depth:** Content-only vs minor persona seed tuning — default content-first; seed changes only if audit proves seed convergence
- **Metric tweak escalation:** Only if content fixes fail M1/M2 after documented attempt; requires closure justification and is non-default
- **Stretch 0 near-duplicates:** Accept ≤3 as Met; document residual pairs in closure if stretch not reached

## 8. Implementation Hints (non-normative)

- Pacing impact detection: `isPacingImpactRecord` — choice events, active_action, p9_/p16_ ids, allowlisted childhood ids, or copy keywords (`路线|身份|里程碑|…`)
- Replay similarity: cosine on `[actions, choices, martial, money, children, routeSignal, routePrefSignal, personaSignal, echoSignature, category counts]` — differentiation must move **route identity** and/or **action category mix**, not just copy
- Demonic persona already has distinct youth seeds (`p8_route_demonic`, `p9_childhood_dark_spark`) — audit may find these flags/events not firing or lacking impact classification

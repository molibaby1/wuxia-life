# P130 Visible Growth Three-Sample Reconciliation Report

**Date:** 2026-07-09  
**Branch:** `codex/p130-wuxia-visible-growth-three-sample-wave-closure-reconciliation`  
**Story:** P130-002  
**Purpose:** Formally map P122 + P127 + P129 goals to delivered proof artifacts and close the visible-growth three-sample wave (merchant + martial + tavern_hand).

---

## 1. Executive Summary

P122 proved early visible growth on `merchant_house` / `businessHabit` (vivid). P127 replicated the same three-signal pattern on `martial_family` / `trainingHabit` (vivid). P129 extended the pattern to `tavern_hand` / `socialMomentum` (ordinary). Together they satisfy:

- P126 defer item「非 merchant 路线早期成长反馈模板化扩展」— martial **Closed** (P127), scholar **Defer** (P128-004)
- P128 handoff recommendation — ordinary-origin early visible growth single sample — **Closed** via P129

**Cross-tier reusability claim:** The visible-growth loop (Signal A/B/C → continuation readability) is **not** a merchant-only patch or vivid-only patch. It is a **reusable experience pattern** proven on two vivid origins **and** one ordinary origin using existing wiring only.

**P128 relationship:** P128 two-sample closure (`merchant_house` + `martial_family`) is **extended**, not contradicted, by this three-sample closure. P128 remains valid for its scope; P130 adds the ordinary tier without reopening P122/P127.

---

## 2. Shared Pattern (All Three Samples)

| Signal | Surface | Merchant (P122) | Martial (P127) | Tavern (P129) |
| --- | --- | --- | --- | --- |
| **A** | `shapingSummary` | 营生 · 渐成 | 习武 · 渐成 | 人情 · 渐成 |
| **B** | `periodSummaryDisplay` | 营生小成 + shaping growth line | 练功小成 + shaping growth line | 交游小成 + shaping growth line |
| **C** | Active-action long-term impact | 营生塑形加深 / echo hooks | 习武塑形加深 / echo hooks | 人情往来加深 / echo hooks |
| **Continuation** | Echo / route events | 8–12 merchant milestones | 8–16 p42 / p22 martial fork | 9–13 ordinary_tavern_network_fork |

No fourth signal category. No new growth panel. No formula changes.

---

## 3. P122 Goal → Evidence Mapping

**Source PRD:** `docs/PRD/p122-early-visible-growth-feedback-minimal-implementation.md`

| P122 Goal / US | Delivered evidence | Regression pointer |
| --- | --- | --- |
| **G1:** 让玩家在早期明确看到成长方向 | Signal A: `shapingSummary` 塑形未成→营生·渐成 | `tests/p122EarlyVisibleGrowthFeedbackTests.ts` — shapingSummary group |
| **G2:** 复用现有表达层与结算层 | Signal B/C on existing `periodSummaryDisplay` + feedback area | Same file — period settlement + longTermImpact groups |
| **G3:** 单路线样板证明 habit 闭环 | `merchant_house` 5–12 bounded proof | `docs/test-reports/p122-early-visible-growth-feedback-targeted-proof.md` |
| **G4:** 为商贾 10–15 提供底座（不提前实现） | Scope guard: no merchant 10–15 in P122 wave | P94 pre-queue closure (cross-ref only) |
| **US-001:** Summary shaping confirmation | businessHabit≥2 → 营生·渐成 | Proof §Signal A |
| **US-002:** Period settlement confirmation | buildShapingPeriodGrowthLine in period summary | Proof §Signal B |
| **US-003:** Long-term impact after actions | p9_echo_business_hook / p9_early_business_focus labels | Proof §Signal C |
| **US-004:** Narrow merchant sample proof | 5–12 chain: errand/apprentice → habit → confirmation → echo | Proof §8–12 continuation |

**Baseline:** `docs/test-reports/p122-merchant-visible-growth-sample-baseline.md`  
**Post-run test status:** `npx tsx tests/p122EarlyVisibleGrowthFeedbackTests.ts` — PASS (referenced, not re-run)

---

## 4. P127 Goal → Evidence Mapping

**Source PRD:** `docs/PRD/p127-wuxia-martial-second-visible-growth-sample.md`

| P127 Goal / US | Delivered evidence | Regression pointer |
| --- | --- | --- |
| **G1:** 第二条样板复用 P122 闭环 | Same Signal A/B/C on `trainingHabit` axis | `tests/p127MartialSecondVisibleGrowthTests.ts` — all 6 groups |
| **G2:** 只用现有 habit / 摘要 / 反馈 / echo 位 | No new panel or growth system | Proof §Scope guards |
| **G3:** 证明跨出 merchant_house | martial_family 5–16 independent proof chain | This reconciliation §Cross-tier claim |
| **G4:** 为 scholar 决策提供前例 | Two-sample closure → scholar defer (P128-004) | `p128-scholar-visible-growth-defer-rationale.md` |
| **US-001:** Martial shaping confirmation | trainingHabit≥2 → 习武·渐成 | Proof §Signal A |
| **US-002:** Period settlement | 练功小成 + shaping growth line | Proof §Signal B |
| **US-003:** Long-term impact after training | p9_echo_training_hook / p9_early_training_focus | Proof §Signal C |
| **US-004:** Continuation readability | p42_training_habit_youth_sparring + p22_early_martial_route_fork | Proof §8–16 continuation |

**Baseline:** `docs/test-reports/p127-martial-visible-growth-sample-baseline.md`  
**Post-run test status:** `npx tsx tests/p127MartialSecondVisibleGrowthTests.ts` — PASS (referenced, not re-run)

---

## 5. P129 Goal → Evidence Mapping

**Source PRD:** `docs/PRD/p129-wuxia-ordinary-origin-early-visible-growth-sample.md`

| P129 Goal / US | Delivered evidence | Regression pointer |
| --- | --- | --- |
| **G1:** 在 ordinary 出身证明 P122 式早期可见成长 | Signal A/B/C on `socialMomentum` axis | `tests/p129OrdinaryOriginVisibleGrowthTests.ts` — all groups |
| **G2:** 单样板 tavern_hand，不平行扩 farm/apprentice | Scope guard: tavern_hand only | Proof §Scope guards |
| **G3:** 复用现有 wiring，无新 growth 系统 | p9_echo_social_hook / p9_early_social_focus | Proof §Signal C |
| **G4:** 5–13 承接可读 | ordinary_tavern_network_fork + p28 continuation | Proof §8–13 continuation |
| **US-001:** Ordinary shaping confirmation | socialMomentum≥2 → 人情·渐成 | Proof §Signal A |
| **US-002:** Period settlement | 交游小成 + shaping growth line | Proof §Signal B |
| **US-003:** Long-term impact after socializing | p9_echo_social_hook / p9_early_social_focus | Proof §Signal C |
| **US-004:** Narrow tavern_hand sample proof | 5–8 action loop → 9–13 fork readability | Proof §Sample action loop |

**Baseline:** `docs/test-reports/p129-ordinary-origin-visible-growth-sample-baseline.md`  
**Post-run test status:** `npx tsx tests/p129OrdinaryOriginVisibleGrowthTests.ts` — PASS (referenced, not re-run)

---

## 6. Cross-Tier Reusability Verdict

| Question | Answer |
| --- | --- |
| Is P122 a merchant-only special case? | **No** — P127 reproduces all three signals on martial axis; P129 on ordinary tavern_hand |
| Is visible growth vivid-only? | **No** — P129 proves ordinary tier with direct `socialMomentum` axis |
| Is a generic template framework required? | **No** — three hand-tuned samples suffice per P127 §14 |
| Can Discovery assume farm/apprentice parallel samples are implied? | **No** — explicitly deferred (see §7, P130-004) |
| Can Discovery assume scholar is implied? | **No** — scholar explicitly deferred (P128-004) |
| Is the three-sample wave formally closable? | **Yes** — all three samples have baseline + proof + narrow regression |

**Formal closure statement:** The visible-growth three-sample wave (`merchant_house` + `martial_family` + `tavern_hand`) is **CLOSED** as of P130. No further origin expansion is required to prove cross-tier reusability.

**P128 extension note:** P128 closed the two-sample vivid wave. P130 **extends** that closure to include one ordinary sample without reopening P122/P127/P128 deliverables or contradicting their verdicts.

---

## 7. Ordinary-Origin Defer Queue Update (P130-003)

**Source:** P128 closure §3.2 (doc drift), P129 Non-Goals, P127 §14 stop-expansion rationale

### 7.1 P128 §3.2 Doc Drift Correction

P128 closure §3.2 stated:

> Early visible growth on ordinary origins — **OPEN** — P122/P127 cover vivid origins only

**Corrected status (post-P129):**

| Field | Pre-P129 (P128) | Post-P129 (P130) |
| --- | --- | --- |
| Early visible growth on ordinary origins | **OPEN** | **Met** (single-sample scope: `tavern_hand`) |
| Multi-origin ordinary parallel expansion | Implicit OPEN | **Defer** (farm_peasant, town_apprentice) |
| Wave 4 ordinary-origin **expansion** (midlife depth) | **OPEN** | **OPEN** (unchanged — not early visible growth) |

**Distinction:** Early visible growth on ordinary origins is **Met** for the bounded single-sample proof scope P129 delivered. Product-level Wave 4 expansion (≥3 origins midlife opportunity structure) and parallel ordinary early-growth samples remain **OPEN / Defer** respectively.

### 7.2 Updated Defer Queue

| Item | Pre-P130 status | Post-P130 status | Evidence |
| --- | --- | --- | --- |
| Ordinary early visible growth — **tavern_hand** | In-flight (P129 recommended) | **Closed** (P129 delivered) | P129 proof + regression |
| Ordinary early visible growth — **farm_peasant** | Implicit defer (P129 Non-Goals) | **Defer** (explicit rationale) | `p130-ordinary-origin-parallel-sample-defer-rationale.md` |
| Ordinary early visible growth — **town_apprentice** | Implicit defer (P129 Non-Goals) | **Defer** (explicit rationale) | Same |
| Non-merchant visible growth — **scholar** | Defer (P128-004) | **Defer** (unchanged) | `p128-scholar-visible-growth-defer-rationale.md` |
| Non-merchant visible growth — **martial** | Closed (P127/P128) | **Closed** (unchanged) | P127 proof + regression |

### 7.3 Stop-Expansion Rationale (P127 §14 + P129 Non-Goals)

**P127 §14:** After two samples, compare scholar vs higher-priority backlog. Two samples are sufficient to stop the visible-growth expansion wave — **do not** spawn「统一成长模板」engineering.

**P129 Non-Goals:** Explicitly excluded `farm_peasant`, `town_apprentice` parallel samples. P129 was scoped as a **single ordinary sample**, not a multi-origin batch.

**P130 extension of stop principle:** Three samples (vivid×2 + ordinary×1) prove cross-tier reusability. A fourth sample (farm, apprentice, or scholar) adds diminishing proof value vs implementation cost. Future Discovery must not silently respawn multi-origin ordinary batch work.

**Anti-respawn:** P130 does **not** reopen P129 tavern_hand wiring, add farm/apprentice parallel work, or spawn a「统一成长模板」engineering stage.

---

## 8. Stage Closure Status (No Respawn)

| Stage | Stories | Status | P130 action |
| --- | --- | --- | --- |
| P122 Early visible growth (merchant) | 7/7 | ✅ Closed | Cross-reference only |
| P127 Martial second sample | 6/6 | ✅ Closed | Cross-reference only |
| P129 Ordinary tavern_hand sample | Complete | ✅ Closed | Cross-reference only |
| P128 Two-sample reconciliation | 5/5 | ✅ Closed | Extended, not contradicted |

---

## 9. Verification Standard (This Stage)

- All artifacts: `docs/test-reports/` markdown only
- P122/P127/P129 narrow tests: referenced post-run PASS; **not re-executed** in P130
- Typecheck: required (docs-only; no code change)
- Browser matrix: not required

---

## 10. Related Artifacts

| Artifact | Role |
| --- | --- |
| `p130-visible-growth-three-sample-wave-scope-contract.md` | P130-001 scope lock |
| `p130-ordinary-origin-parallel-sample-defer-rationale.md` | P130-004 farm/apprentice defer |
| `p130-visible-growth-wave-closure-report.md` | P130-005 end-state handoff |
| `p128-visible-growth-two-sample-reconciliation.md` | Prior two-sample closure (superseded in scope, not contradicted) |

**P130-002 complete. Three-sample reconciliation mapped; cross-tier reusability formally stated. P130-003 defer queue updated in §7.**

# P128 Visible Growth Two-Sample Reconciliation Report

**Date:** 2026-07-09  
**Branch:** `codex/p128-wuxia-visible-growth-two-sample-wave-closure-reconciliation`  
**Story:** P128-002  
**Purpose:** Formally map P122 + P127 goals to delivered proof artifacts and close the visible-growth two-sample wave (merchant + martial).

---

## 1. Executive Summary

P122 proved early visible growth feedback on `merchant_house` / `businessHabit`. P127 replicated the same three-signal pattern on `martial_family` / `trainingHabit` without new systems. Together they satisfy the P126 defer item「非 merchant 路线早期成长反馈模板化扩展」的 **martial 分支**；本报告正式宣告双样板波次可闭合。

**Cross-origin reusability claim:** The visible-growth loop (Signal A/B/C → continuation readability) is **not** a merchant-only patch. It is a **reusable experience pattern** proven on two distinct origin/habit axes using existing wiring only.

---

## 2. Shared Pattern (Both Samples)

| Signal | Surface | Merchant (P122) | Martial (P127) |
| --- | --- | --- | --- |
| **A** | `shapingSummary` | 营生 · 渐成 | 习武 · 渐成 |
| **B** | `periodSummaryDisplay` | 营生小成 + shaping growth line | 练功小成 + shaping growth line |
| **C** | Active-action long-term impact | 营生塑形加深 / echo hooks | 习武塑形加深 / echo hooks |
| **Continuation** | Echo / route events | 8–12 merchant milestones | 8–16 p42 / p22 martial fork |

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
**Constants:** `src/hvg/p122MerchantSampleBaseline.ts` (delivered P122; not modified in P128)  
**Post-run test status:** `npx tsx tests/p122EarlyVisibleGrowthFeedbackTests.ts` — PASS (referenced, not re-run)

---

## 4. P127 Goal → Evidence Mapping

**Source PRD:** `docs/PRD/p127-wuxia-martial-second-visible-growth-sample.md`

| P127 Goal / US | Delivered evidence | Regression pointer |
| --- | --- | --- |
| **G1:** 第二条样板复用 P122 闭环 | Same Signal A/B/C on `trainingHabit` axis | `tests/p127MartialSecondVisibleGrowthTests.ts` — all 6 groups |
| **G2:** 只用现有 habit / 摘要 / 反馈 / echo 位 | No new panel or growth system | Proof §Scope guards |
| **G3:** 证明跨出 merchant_house | martial_family 5–16 independent proof chain | This reconciliation §Cross-origin claim |
| **G4:** 为 scholar 决策提供前例 | Two-sample closure → scholar defer (P128-004) | `p128-scholar-visible-growth-defer-rationale.md` |
| **US-001:** Martial shaping confirmation | trainingHabit≥2 → 习武·渐成 | Proof §Signal A |
| **US-002:** Period settlement | 练功小成 + shaping growth line | Proof §Signal B |
| **US-003:** Long-term impact after training | p9_echo_training_hook / p9_early_training_focus | Proof §Signal C |
| **US-004:** Continuation readability | p42_training_habit_youth_sparring + p22_early_martial_route_fork | Proof §8–16 continuation |

**Baseline:** `docs/test-reports/p127-martial-visible-growth-sample-baseline.md`  
**Constants:** `src/hvg/p127MartialSampleBaseline.ts` (delivered P127; not modified in P128)  
**Post-run test status:** `npx tsx tests/p127MartialSecondVisibleGrowthTests.ts` — PASS (referenced, not re-run)

---

## 5. Cross-Origin Reusability Verdict

| Question | Answer |
| --- | --- |
| Is P122 a merchant-only special case? | **No** — P127 reproduces all three signals on martial axis with zero new systems |
| Is a generic template framework required? | **No** — two hand-tuned samples suffice per P127 §14 |
| Can Discovery assume scholar is implied? | **No** — scholar explicitly deferred (see P128-004) |
| Is the two-sample wave formally closable? | **Yes** — both samples have baseline + proof + narrow regression |

**Formal closure statement:** The visible-growth two-sample wave (`merchant_house` + `martial_family`) is **CLOSED** as of P128. No further origin expansion is required to prove cross-origin reusability.

---

## 6. Stage Closure Status (No Respawn)

| Stage | Stories | Status | P128 action |
| --- | --- | --- | --- |
| P122 Early visible growth | 7/7 | ✅ Closed | Cross-reference only |
| P127 Martial second sample | 6/6 | ✅ Closed | Cross-reference only |
| P126 defer martial branch | — | ✅ Closed via P127 | Updated in §7 below |

---

## 7. P126 Defer Queue Update (P128-003 cross-ref)

**Source:** `docs/test-reports/p126-p121-experience-optimization-closure-report.md` §7

| Defer item | Pre-P128 status | Post-P128 status | Evidence |
| --- | --- | --- | --- |
| 非 `merchant_house` 路线早期成长反馈模板化扩展 — **martial branch** | Defer (P126 discovered) | **Closed** (P127 delivered) | P127 proof + regression |
| 非 `merchant_house` 路线早期成长反馈模板化扩展 — **scholar branch** | Defer (implicit) | **Defer** (explicit rationale) | `p128-scholar-visible-growth-defer-rationale.md` |

**Cost reason for scholar defer:** P127 §3.3 — `scholar_house` early `studyHabit` accumulation depends on indirect `comprehension/knowledge → studyHabit` chain; proof chain is longer and less minimal than martial. Two samples already prove reusability; third sample has diminishing proof value vs implementation cost.

**Anti-respawn:** P128 does **not** reopen P127 martial wiring, add scholar parallel work, or spawn a「统一成长模板」engineering stage.

---

## 8. Verification Standard (This Stage)

- All artifacts: `docs/test-reports/` markdown only
- P122/P127 narrow tests: referenced post-run PASS; **not re-executed** in P128
- Typecheck: required (docs-only; no code change)
- Browser matrix: not required

---

## 9. Related Artifacts

| Artifact | Role |
| --- | --- |
| `p128-visible-growth-wave-scope-contract.md` | P128-001 scope lock |
| `p128-scholar-visible-growth-defer-rationale.md` | P128-004 scholar defer |
| `p128-visible-growth-wave-closure-report.md` | P128-005 end-state handoff |

**P128-002 complete. Two-sample reconciliation mapped; cross-origin reusability formally stated.**

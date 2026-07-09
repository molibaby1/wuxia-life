# P128 Visible Growth Two-Sample Wave Scope Contract

**Date:** 2026-07-09  
**Branch:** `codex/p128-wuxia-visible-growth-two-sample-wave-closure-reconciliation`  
**Story:** P128-001  
**Stage type:** docs-only reconciliation — **no runtime, UI, test harness, or gameplay logic changes**

---

## 1. Allowed Layers

| Layer | Permitted action |
| --- | --- |
| Reconciliation reports | Map P122 + P127 goals → existing proof / regression pointers |
| Defer queue update | Mark P126 martial branch **Closed**; scholar branch **Defer** with rationale |
| Scholar defer note | Document why `scholar_house` remains OUT OF SCOPE after two-sample closure |
| Wave closure report | List North Star §3 / §6 / §8 still-OPEN items; recommend next functional theme (recommendation only) |
| Cross-reference | Cite existing artifacts; **do not re-run** full gate refresh or duplicate narrow test execution |

---

## 2. Forbidden Expansions

| # | Forbidden | Rationale |
| --- | --- | --- |
| F-1 | Changes to `src/`, `server/`, test harness, or gameplay logic | PRD §3 Non-Goals |
| F-2 | Reopen or respawn P122 functional stories | P122 closed 7/7; merchant sample complete |
| F-3 | Reopen or respawn P127 functional stories | P127 closed 6/6; martial sample complete |
| F-4 | Implement `scholar_house` / `studyHabit` third visible-growth sample | P127 Non-Goals; P128 explicit defer |
| F-5 | New cross-origin visible-growth template abstraction or generic framework | Two samples prove reusability; no template engineering |
| F-6 | Skill system, martial stat migration, Wave 2–4 achievement implementation | Product backlog; not P128 scope |
| F-7 | Full gate refresh or re-verification of P122/P127 narrow tests | Post-run PASS already recorded; reference only |

---

## 3. Anti-Respawn Boundaries

### P122 (merchant_house / businessHabit)

- **Status:** ✅ Closed (7/7 stories, 2026-07-08)
- **Proof:** `docs/test-reports/p122-early-visible-growth-feedback-targeted-proof.md`
- **Regression:** `tests/p122EarlyVisibleGrowthFeedbackTests.ts`
- **P128 action:** Cross-reference only — **no code or proof re-generation**

### P127 (martial_family / trainingHabit)

- **Status:** ✅ Closed (6/6 stories, 2026-07-09)
- **Proof:** `docs/test-reports/p127-martial-second-visible-growth-sample-proof.md`
- **Regression:** `tests/p127MartialSecondVisibleGrowthTests.ts`
- **P128 action:** Cross-reference only — **no martial wiring changes**

### P126 defer item: 非 merchant 路线早期成长反馈模板化扩展

- **martial branch:** **Closed** via P127 (this stage formalizes closure)
- **scholar branch:** **Defer** (documented in P128-003 / P128-004)
- **P128 action:** Update defer queue ledger — **do not spawn P127.5 or scholar parallel work**

---

## 4. Existing Proof Paths (Reference, Do Not Duplicate)

| Stage | Baseline doc | Targeted proof | Narrow regression |
| --- | --- | --- | --- |
| P122 | `docs/test-reports/p122-merchant-visible-growth-sample-baseline.md` | `docs/test-reports/p122-early-visible-growth-feedback-targeted-proof.md` | `tests/p122EarlyVisibleGrowthFeedbackTests.ts` |
| P127 | `docs/test-reports/p127-martial-visible-growth-sample-baseline.md` | `docs/test-reports/p127-martial-second-visible-growth-sample-proof.md` | `tests/p127MartialSecondVisibleGrowthTests.ts` |

Post-run validation (already PASS): `npx tsx tests/p122EarlyVisibleGrowthFeedbackTests.ts`, `npx tsx tests/p127MartialSecondVisibleGrowthTests.ts`.

---

## 5. Deliverable Checklist

| Story | Artifact | Status |
| --- | --- | --- |
| P128-001 | This scope contract | ✅ |
| P128-002 | `p128-visible-growth-two-sample-reconciliation.md` | ✅ |
| P128-003 | Defer queue section (reconciliation §7) | ✅ |
| P128-004 | `p128-scholar-visible-growth-defer-rationale.md` | ✅ |
| P128-005 | `p128-visible-growth-wave-closure-report.md` | ✅ |

---

## 6. GO / NO-GO

| Criterion | Status |
| --- | --- |
| Zero files under `src/`, `server/`, `tests/` modified | **Required** |
| All deliverables under `docs/test-reports/` | **Required** |
| P122 / P127 referenced, not reopened | **Required** |
| Scholar implementation explicitly deferred | **Required** |

**Verdict:** P128 complete — 5/5 deliverables delivered; two-sample wave closure reconciled.

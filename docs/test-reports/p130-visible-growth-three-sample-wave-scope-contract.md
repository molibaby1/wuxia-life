# P130 Visible Growth Three-Sample Wave Scope Contract

**Date:** 2026-07-09  
**Branch:** `codex/p130-wuxia-visible-growth-three-sample-wave-closure-reconciliation`  
**Story:** P130-001  
**Stage type:** docs-only reconciliation — **no runtime, UI, test harness, or gameplay logic changes**

---

## 1. Allowed Layers

| Layer | Permitted action |
| --- | --- |
| Reconciliation reports | Map P122 + P127 + P129 goals → existing proof / regression pointers |
| Defer queue update | Mark tavern_hand ordinary visible growth **Closed** (P129); farm_peasant / town_apprentice **Defer** with rationale |
| Parallel-sample defer note | Document why farm/apprentice remain OUT OF SCOPE after three-sample closure |
| Wave closure report | Correct P128 §3.2 doc drift; list North Star §3 / §6 / §8 still-OPEN items; recommend next functional theme (recommendation only) |
| Cross-reference | Cite existing artifacts; **do not re-run** full gate refresh or duplicate narrow test execution |

---

## 2. Forbidden Expansions

| # | Forbidden | Rationale |
| --- | --- | --- |
| F-1 | Changes to `src/`, `server/`, test harness, or gameplay logic | PRD §3 Non-Goals |
| F-2 | Reopen or respawn P122 functional stories | P122 closed 7/7; merchant sample complete |
| F-3 | Reopen or respawn P127 functional stories | P127 closed 6/6; martial sample complete |
| F-4 | Reopen or respawn P129 functional stories | P129 closed; tavern_hand ordinary sample complete |
| F-5 | Implement `farm_peasant` or `town_apprentice` parallel ordinary visible-growth samples | P129 Non-Goals; P130 explicit defer |
| F-6 | Implement `scholar_house` third visible-growth sample | P128-004 defer; inherited |
| F-7 | New cross-origin visible-growth template abstraction or generic framework | Three samples prove cross-tier reusability; no template engineering |
| F-8 | Skill system, martial stat migration, Wave 2–4 achievement implementation | Product backlog; not P130 scope |
| F-9 | Full gate refresh or re-verification of P122/P127/P129 narrow tests | Post-run PASS already recorded; reference only |

---

## 3. Anti-Respawn Boundaries

### P122 (merchant_house / businessHabit)

- **Status:** ✅ Closed (7/7 stories, 2026-07-08)
- **Proof:** `docs/test-reports/p122-early-visible-growth-feedback-targeted-proof.md`
- **Regression:** `tests/p122EarlyVisibleGrowthFeedbackTests.ts`
- **P130 action:** Cross-reference only — **no code or proof re-generation**

### P127 (martial_family / trainingHabit)

- **Status:** ✅ Closed (6/6 stories, 2026-07-09)
- **Proof:** `docs/test-reports/p127-martial-second-visible-growth-sample-proof.md`
- **Regression:** `tests/p127MartialSecondVisibleGrowthTests.ts`
- **P130 action:** Cross-reference only — **no martial wiring changes**

### P129 (tavern_hand / socialMomentum — ordinary)

- **Status:** ✅ Closed (2026-07-09)
- **Proof:** `docs/test-reports/p129-ordinary-origin-visible-growth-sample-proof.md`
- **Regression:** `tests/p129OrdinaryOriginVisibleGrowthTests.ts`
- **P130 action:** Cross-reference only — **no tavern_hand wiring changes**

### P128 two-sample closure

- **Status:** ✅ Closed (5/5 stories, 2026-07-09)
- **P130 action:** **Extend** to three-sample closure — do not contradict P128 merchant + martial closure

### Ordinary-origin parallel expansion

- **tavern_hand early visible growth:** **Closed** via P129
- **farm_peasant / town_apprentice:** **Defer** (documented in P130-003 / P130-004)
- **P130 action:** Update defer queue — **do not spawn P129.5 or multi-origin ordinary batch**

---

## 4. Existing Proof Paths (Reference, Do Not Duplicate)

| Stage | Origin tier | Baseline doc | Targeted proof | Narrow regression |
| --- | --- | --- | --- | --- |
| P122 | vivid (`merchant_house`) | `docs/test-reports/p122-merchant-visible-growth-sample-baseline.md` | `docs/test-reports/p122-early-visible-growth-feedback-targeted-proof.md` | `tests/p122EarlyVisibleGrowthFeedbackTests.ts` |
| P127 | vivid (`martial_family`) | `docs/test-reports/p127-martial-visible-growth-sample-baseline.md` | `docs/test-reports/p127-martial-second-visible-growth-sample-proof.md` | `tests/p127MartialSecondVisibleGrowthTests.ts` |
| P129 | ordinary (`tavern_hand`) | `docs/test-reports/p129-ordinary-origin-visible-growth-sample-baseline.md` | `docs/test-reports/p129-ordinary-origin-visible-growth-sample-proof.md` | `tests/p129OrdinaryOriginVisibleGrowthTests.ts` |

Post-run validation (already PASS): `npx tsx tests/p122EarlyVisibleGrowthFeedbackTests.ts`, `npx tsx tests/p127MartialSecondVisibleGrowthTests.ts`, `npx tsx tests/p129OrdinaryOriginVisibleGrowthTests.ts`.

---

## 5. Deliverable Checklist

| Story | Artifact | Status |
| --- | --- | --- |
| P130-001 | This scope contract | ✅ |
| P130-002 | `p130-visible-growth-three-sample-reconciliation.md` | ✅ |
| P130-003 | Defer queue section (reconciliation §7) | ✅ |
| P130-004 | `p130-ordinary-origin-parallel-sample-defer-rationale.md` | Pending |
| P130-005 | `p130-visible-growth-wave-closure-report.md` | Pending |

---

## 6. GO / NO-GO

| Criterion | Status |
| --- | --- |
| Zero files under `src/`, `server/`, `tests/` modified | **Required** |
| All deliverables under `docs/test-reports/` | **Required** |
| P122 / P127 / P129 referenced, not reopened | **Required** |
| Farm/apprentice parallel implementation explicitly deferred | **Required** |

**Verdict:** P130-001 scope locked. Proceed to three-sample reconciliation.

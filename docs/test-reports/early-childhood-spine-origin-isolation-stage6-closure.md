# Early Childhood Spine Origin Isolation — Stage-6 Closure (US-008)

**PRD:** `docs/PRD/early-childhood-spine-origin-isolation.md`  
**Date:** 2026-06-21  
**Branch:** `ralph/early-childhood-spine-origin-isolation`

---

## 1. Artifact index (US-001–US-007)

| Story | Artifact | Status |
| --- | --- | --- |
| US-001 | `docs/test-reports/spine-origin-bleed-audit.md` | ✅ R1–R5 root causes, flag inventory, age 0–7 event groups |
| US-002 | `src/p16/primaryOriginFlag.ts` | ✅ `resolvePrimaryOriginFamilyFlag` shared resolver |
| US-003 | `src/p16/spineOriginIsolation.ts`, `GameEngineIntegration.getAvailableEvents` | ✅ Runtime hard gate age ≤ 7 |
| US-004 | `p22-content-expansions.json` orphan condition fix | ✅ `origin_frontier`; audit appendix A |
| US-005 | `docs/test-reports/spine-origin-isolation-stage6.md` | ✅ Four-origin × ages 1–7 matrix, 0 foreign ids |
| US-006 | `scripts/runApiBrowserPlaytestStage2.ts` spine bleed detector | ✅ Headless contract + report path |
| US-007 | `src/p16/spineOriginConfigValidation.ts`, `tests/spineOriginConfigValidationTests.ts` | ✅ CI validation wired in `runRealTestGate` |

---

## 2. Verification summary

| Metric | Target | Result |
| --- | --- | --- |
| Foreign exclusive spine ids (0–7, four origins × 30 rolls) | 0% | **0** (`spineOriginIsolationTests`) |
| Scholar + poor_family + live_ops: orphan in pool | blocked | **blocked** |
| Frontier primary: orphan selectable | ≥1 environment | **pass** `getAvailableEvents(1–2)` |
| Stage-5 passive bleed | 0 regression | **pass** `preschoolOriginIsolationTests` |
| `gate:p16` | pass | **pass** |
| `p22ContentLibraryTests` live-ops gate | pass | **pass** |
| Typecheck | pass | **pass** |

**US-006 API 35-step:** Spine bleed detector added to `runApiBrowserPlaytestStage2.ts`; report at `docs/test-reports/api-browser-playtest-stage6-spine-isolation.md`. Requires `p6b:serve` for live run; logic validated via `spineOriginIsolationTests` (same `isForeignExclusiveSpineEvent` helper).

---

## 3. Stage-4 / Stage-5 non-regression

- **Stage-5 passive:** `preschoolOriginIsolationTests` — 0 foreign passive ids across four origins ages 3–7.
- **Stage-4 density:** No changes to passive spine catalog density; infant chain wiring unchanged.

---

## 4. Residual risks → Stage-7 / follow-up

| Risk | Notes |
| --- | --- |
| Ages 8–12 spine | Gate constant `SPINE_ORIGIN_EXCLUSIVE_AGE_MAX = 7`; extend band in follow-up |
| `dailyEventSystem` fallback | Daily pool events lack origin-exclusive semantics today; monitor if catalog adds origin tags |
| Neutral spine repetition | `clever_speech`, toddler variants — Stage-7 dedup scope |
| `origin_poor_family` trait spine | Separate poor-family events not in this Stage; gate blocks foreign four-main bleed only |
| `traits/origins.ts` `origin_frontier_family` | Trait flag name still differs from `origin.json`; runtime gate uses primary resolver, not trait flag |

---

## 5. Rollback

1. Revert US-003 runtime gate in `GameEngineIntegration.ts` if over-filtering.
2. Keep US-001 audit and US-004 config fixes (safe without gate).

---

**Decision:** Stage-6 spine origin isolation **COMPLETE** for P0 band 0–7.

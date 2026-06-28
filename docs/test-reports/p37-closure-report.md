# P37 Closure Report — Additional Mixed/Pinnacle Habit-Led Lifetime Traces

**Date:** 2026-06-24  
**Branch:** `codex/p37-wuxia-additional-mixed-pinnacle-lifetime-traces`  
**PRD:** `docs/PRD/p37-wuxia-additional-mixed-pinnacle-lifetime-traces.md`  
**Parent:** P36 §8 reconciliation `docs/test-reports/p36-north-star-section8-reconciliation.md`

---

## 1. Summary

P37 closed the **additional mixed/pinnacle outcome** gap deferred by P35/P36: cross-track `merchant_martial_patron` lifetime (dual business+training on-ramp → wealth + sect investment JSON bridges → mixed composite eval), pinnacle `founding_patriarch` dual-gate lifetime (faction continuation choice + `scholar_mentor_line` luck window + grind-only failure attribution), baseline delta vs P25 static and P35 category traces, isolated regression tests, and §8 item 1 additional-outcomes update.

---

## 2. Deliverables

| Story | Deliverable |
| --- | --- |
| P37-001 | `docs/test-reports/p37-additional-outcome-audit-delta.md` |
| P37-002 | `runP37MixedMerchantPatronLifetimeSlice()` in `p37AdditionalMixedPinnacleLifetimeSlices.ts`; `docs/test-reports/p37-mixed-merchant-patron-lifetime-trace.md` |
| P37-003 | `runP37PinnacleFoundingPatriarchLifetimeSlice()`; `docs/test-reports/p37-pinnacle-founding-patriarch-lifetime-trace.md` |
| P37-004 | `p37-additional-mixed-pinnacle-sim-baseline-metrics.json`, `p37-additional-mixed-pinnacle-sim-baseline-delta.md`; `tests/p37AdditionalMixedPinnacleParityTests.ts` |
| P37-005 | This closure report |

---

## 3. Additional Lifetime Traces

| Path | Sequence | Terminal | Unlock | Resolver used |
| --- | --- | --- | --- | --- |
| Mixed `merchant_martial_patron` | birth 0, dual habit 0 → business/martial on-ramp → `p22_early_wealth_route_fork` → `merchant_sect_investment` → age 68 mixed eval | `mixed_composite_eval_terminal` | **100%**, 2 cross-tracks | No |
| Pinnacle `founding_patriarch` | birth 0 scholar_house → `focus_on_study` → training/social on-ramp → `scholar_mentor_line` luck → `p22_faction_sect_continuation` → age 72 pinnacle eval | `pinnacle_composite_eval_terminal` | **100%** | No |

Mixed bridge flags: `route_wealth_committed`, `merchant_invest_good`.  
Pinnacle gates: `p16_alliance_brokered` (choice), `p16_scholar_mentor` (luck). Grind-only control stays locked (aligns with `p25-rare-window-waste-slice`).

---

## 4. Baseline Delta

| Outcome | P25 static | P35 habit-led (category) | P37 additional lifetime | Delta |
| --- | --- | --- | --- | --- |
| `merchant_martial_patron` | 18.8% | — | **100%** | aligned |
| `founding_patriarch` | 15.6% | — | **100%** | aligned |
| `healer_swordsman` | 18.8% | 100% | — | carry-forward |
| `jianghu_myth_legend` | 18.8% | 100% | — | carry-forward |

P25 mixed identity slice: **PASS** (static fixtures unchanged).

---

## 5. Verification Commands

```bash
npm run typecheck
npm exec tsx tests/p37AdditionalMixedPinnacleParityTests.ts
npm exec tsx tests/p35MixedPinnacleParityTests.ts
npm exec tsx tests/p34LifetimeParityTests.ts
npm exec tsx scripts/runP37HabitLedSimulationBaseline.ts
npm exec tsx scripts/runP25MixedBaseline.ts
npm exec tsx scripts/runP25PinnacleBaseline.ts
```

All passed on 2026-06-24 (no full build per execution policy).

---

## 6. North Star §8 Item 1 — Additional Outcomes Status After P37

| Field | Before P37 | After P37 |
| --- | --- | --- |
| **Category minimum** | Met (P34/P35) | **Met** (unchanged) |
| **Additional outcomes** | Open — `merchant_martial_patron`, `founding_patriarch` | **Met** — both have habit-led lifetime trace docs + 100% unlock regression |
| **§8 item 1 overall** | Partial | **Met** for additional-outcomes scope; full rules doc across all achievement spectrum still partial on Wave 3/4 defer |

---

## 7. Remaining Defer Queue

| Item | Status | Notes |
| --- | --- | --- |
| P8 playability frustration blockers | **Defer** | P37 non-goal (Option B) |
| Wave 3 `merchant_magnate` full content | **Defer** | P37 non-goal |
| Wave 4 ordinary origin expansion | **Defer** | P37 non-goal |
| Full medical pool habit migration | **Defer** | P33/P34 scope |
| Game-engine JSON poison mutex (non-sim) | **Monitor** | P33 sim helper aligned |
| P36 consistency audit P37 trace flags | **Optional** | Not required for P37 closure; P37 traces use same JSON flag_set path as P35 |

---

## 8. Handoff

- **A1-verify:** run discovery-pass on P37 PRD pair; confirm §8 item 1 additional-outcomes Met.
- **Regression carry-forward:** P34/P35 parity tests unchanged and passing.

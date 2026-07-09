# P131 Closure Report — Wave 2 Pinnacle Playable Spine (jianghu_myth_legend)

**Date:** 2026-07-09  
**Branch:** `codex/p131-wuxia-wave2-pinnacle-playable-spine`  
**PRD:** `docs/PRD/p131-wuxia-wave2-pinnacle-playable-spine.md`  
**Parent:** P130 closure `docs/test-reports/p130-visible-growth-wave-closure-report.md`

---

## 1. Summary

P131 delivered a **bounded playable spine** for single Wave 2 pinnacle `jianghu_myth_legend` (武林神话): P35 trace gap audit, scope contract, on-ramp + luck window spine events, pinnacle-specific player expression (≥2 signals), targeted proof, narrow regression tests, and this closure handoff. P35 lifetime sim semantics and grind-only failure attribution are preserved.

---

## 2. Deliverables

| Story | Deliverable |
| ----- | ----------- |
| P131-001 | `docs/test-reports/p131-pinnacle-myth-legend-implementation-audit.md` |
| P131-002 | `docs/test-reports/p131-pinnacle-myth-legend-scope-contract.md` |
| P131-003 | `jianghu_myth_legend_on_ramp_entry`, `jianghu_myth_legend_luck_window_echo` in `sample-lines-spine.json` |
| P131-004 | Myth-legend branches in `sampleLineExpression.ts` (`orthodoxCurrentGoal`, `deriveSampleLineCostLabel`) |
| P131-005 | `docs/test-reports/p131-pinnacle-myth-legend-targeted-proof.md` |
| P131-006 | `tests/p131PinnacleMythLegendSpineTests.ts` (isolated) |
| P131-007 | This closure report |

---

## 3. Wiring + Expression + Proof

| Layer | What P131 proved |
| ----- | ---------------- |
| **On-ramp** | Guardian oath (`p16_guardian_oath`) + orthodox route triggers playable checkpoint at age 17–22 |
| **Luck echo** | `hidden_master_line` outcome surfaces as hit/miss player-readable feedback at age 20–26 |
| **Dual gate** | Choice + luck gates unchanged; grind-only path stays locked |
| **Expression** | 武林神话 on-ramp goal + 隐世奇遇 luck goal + 神话 cost labels — distinct from generic 守正代价 |
| **P35 parity** | `runP35PinnacleMythLegendLifetimeSlice()` unchanged; parity tests pass |

---

## 4. Verification Commands

```bash
npm run typecheck
npm exec tsx tests/p131PinnacleMythLegendSpineTests.ts
npm exec tsx tests/p35MixedPinnacleParityTests.ts
```

All passed on 2026-07-09. Build not run (per execution policy).

---

## 5. North Star §3.2 / §8 — Remaining OPEN / Defer

| Item | Status | Notes |
| ---- | ------ | ----- |
| Additional Wave 2 pinnacles (beyond `jianghu_myth_legend`) | **OPEN** | Single-pinnacle sample only; no catalog |
| `founding_patriarch` full playable spine | **Parallel (P113+)** | Not P131 scope |
| Wave 3 mixed catalog playable spines | **OPEN / defer** | e.g. `merchant_martial_patron` full runtime chain |
| Wave 4 ordinary origin expansion | **OPEN / defer** | PRD non-goal |
| Full pinnacle pressure/mid/late/endgame chain for myth legend | **OPEN / defer** | P131 narrow on-ramp only |
| Full-lifetime `gate:p20` broad rerun | **OPEN / defer** | Out of bounded scope |
| Game-engine JSON poison mutex (non-sim path) | **Monitor** | Unchanged from P35 |

---

## 6. Explicit Non-Recommendations

| Do NOT spawn without Discovery override | Reason |
| --------------------------------------- | ------ |
| P130 visible-growth respawn (fourth sample) | Wave formally closed at three samples |
| Farm/apprentice parallel visible-growth samples | P130 defer queue — not next priority |
| Cross-achievement pinnacle framework | P131 non-goal |
| P35/P37 lifetime sim trace rewrite | Prior stages closed |

---

## 7. Recommended Next Discovery Spawn

1. **P132+** — Additional Wave 2 pinnacle playable spine (if prioritized) OR Wave 3 mixed catalog spine
2. **discovery-pass** on this PRD before treating P131 as product-complete

---

## 8. End State

P131 is **bounded runtime closure** for one pinnacle playable spine — not `COMPLETED` for North Star §3.2 Wave 2 full catalog or §8 end-state. Orchestrator should treat Wave 2 pinnacle **catalog** and Wave 3/4 as explicitly OPEN per §5 above.

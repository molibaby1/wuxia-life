# P36-004 Optional Additional Mixed/Pinnacle Lifetime Trace — Skip

**Date:** 2026-06-24  
**Story:** P36-004  
**Decision:** **SKIP** (documented rationale)

---

## Candidates (not implemented)

| Option | Tier | Outcome |
| --- | --- | --- |
| A | Pinnacle | `founding_patriarch` habit-led lifetime |
| B | Mixed | `merchant_martial_patron` habit-led lifetime |

Default priority per PRD open questions was `founding_patriarch` (second pinnacle outcome).

---

## Skip rationale

Per `docs/test-reports/p36-north-star-section8-reconciliation.md` § Item 1:

- **Category minimum Met:** P34 mainstream (`medical_sage_healer`) + P35 mixed (`healer_swordsman`) + P35 pinnacle (`jianghu_myth_legend`) each have habit-led birth→terminal lifetime sim traces with 100% unlock and documented rules.
- **US-003 reconciliation** marks §8 item 1 **Partial** only for **additional outcomes** and full traceability — not for category-level evidence.
- PRD US-004 acceptance: *"Skip acceptable if US-003 reconciliation proves §8 item 1 category Met with P34/P35 evidence only"* — condition satisfied.

Adding `founding_patriarch` or `merchant_martial_patron` would strengthen item 1 toward full Met but is **out of P36 minimum scope**; routed to P37+ defer queue.

---

## Evidence without new trace

| Tier | Covered outcome | Trace doc |
| --- | --- | --- |
| Mainstream | `medical_sage_healer` | `p34-medical-lifetime-birth-to-death-slice.md` |
| Mixed | `healer_swordsman` | `p35-mixed-healer-swordsman-lifetime-trace.md` |
| Pinnacle | `jianghu_myth_legend` | `p35-pinnacle-myth-legend-lifetime-trace.md` |

P25 static baselines still cover other mixed/pinnacle outcomes at slice level (`runP25MixedBaseline`, `runP25PinnacleBaseline`); habit-led **lifetime** proof exists for one outcome per non-mainstream tier.

---

## Verification

No code changes. Reconciliation + skip doc satisfy US-004 skip path.

```bash
npm run typecheck
```

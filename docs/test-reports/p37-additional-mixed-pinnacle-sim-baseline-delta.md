# P37 Additional Mixed/Pinnacle Sim Baseline Delta

Generated: 2026-06-24T08:48:20.188Z

## Command

```bash
npm exec tsx scripts/runP37HabitLedSimulationBaseline.ts
```

## Delta vs P25 Static and P35 Habit-Led Baselines

| Outcome | P25 static | P35 habit-led | P37 additional lifetime | Delta |
| --- | --- | --- | --- | --- |
| `merchant_martial_patron` | 18.8% | — | 100% | aligned |
| `healer_swordsman` (P35 ref) | 18.8% | 100% | — | carry-forward |
| `founding_patriarch` | 15.6% | — | 100% | aligned |
| `jianghu_myth_legend` (P35 ref) | 18.8% | 100% | — | carry-forward |

## Interpretation

P37 additional lifetime traces unlock (100% mixed patron, 100% founding patriarch) — consistent with P25 static paths that achieve unlock.

## Parity notes

- P37 mixed lifetime uses dual business+training on-ramp + wealth/sect JSON bridges; P25 static seeds flags directly.
- P37 pinnacle lifetime chains faction continuation + scholar_mentor_line; P25 static pinnacle fixtures seed luck/choice flags.
- Lifetime unlock rates are single-path traces (100% or 0%); P25 baselines are multi-fixture seed distributions.
- P35 category traces (healer_swordsman, jianghu_myth_legend) unchanged; P37 closes additional outcomes only.

## Lifetime slice snapshots

- Mixed path: `p37_mixed_merchant_patron_habit_zero_lifetime` → unlocked=true, cross-tracks=2
- Pinnacle path: `p37_pinnacle_founding_patriarch_habit_zero_lifetime` → unlocked=true, luck=true
- Static resolver used: false

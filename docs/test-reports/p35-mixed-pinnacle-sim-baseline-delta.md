# P35 Mixed/Pinnacle Sim Baseline Delta

Generated: 2026-06-24T06:31:18.322Z

## Command

```bash
npm exec tsx scripts/runP35HabitLedSimulationBaseline.ts
```

## Delta vs P25 Static Mixed Identity and Pinnacle Baselines

| Outcome | P25 static baseline | P25 identity slice | P35 habit-led lifetime | Delta |
| --- | --- | --- | --- | --- |
| `healer_swordsman` | 18.8% | PASS | 100% | aligned |
| `jianghu_myth_legend` | 18.8% | — | 100% | aligned |

## Interpretation

P35 lifetime traces unlock (100% mixed, 100% pinnacle) — consistent with P25 static paths that achieve unlock.

## Parity notes

- P35 mixed lifetime uses dual habit on-ramp + JSON bridges; P25 static mixed fixtures seed flags directly.
- P35 pinnacle lifetime chains orthodox trial JSON + rare line roll; P25 static pinnacle fixtures seed luck/choice flags.
- Lifetime unlock rates are single-path traces (100% or 0%); P25 baselines are multi-fixture seed distributions.

## Lifetime slice snapshots

- Mixed path: `p35_mixed_healer_swordsman_habit_zero_lifetime` → unlocked=true, cross-tracks=2
- Pinnacle path: `p35_pinnacle_myth_legend_habit_zero_lifetime` → unlocked=true, luck=true
- Static resolver used: false

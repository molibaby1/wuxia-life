# P30 Habit-Led Sim Baseline Delta

Generated: 2026-06-24T03:38:41.066Z

## Command

```bash
npm exec tsx scripts/runP30HabitLedSimulationBaseline.ts
```

## Delta vs P29 Closure Baseline

P29 representative paths (`jianghu_renown_path`, `medical_sage_path`) direct-seed achievement flags. P30 habit-led fixtures seed `lifeStates.*` + P27–P29 bridge flags only.

| Outcome | P29 direct-flag unlock | P30 habit-led unlock | P30 partial progress (stats ok, key_choices gap) | Trace-linked P27–P29 events |
| --- | --- | --- | --- | --- |
| `jianghu_renown_sage` | 100% | 0% | 100% | 3 |
| `medical_sage_healer` | 100% | 0% | 100% | 3 |

## Interpretation

P29 direct-flag paths unlock Wave 1 achievements (100% on representative fixtures); P30 habit-led paths show partial progress (stats met, key_choices unmet) with trace-linked P27-P29 on-ramps — sim observability improved without bypassing composite gates.

## Habit-led path snapshots

- `habit_led_renown_social_path` → `jianghu_renown_sage`: unlocked=false, bridgeFlags=[p28_social_network_renown, p28_social_reputation_reinforced, p29_social_patron_obligation_assumed], socialMomentum=3
- `habit_led_medical_study_path` → `medical_sage_healer`: unlocked=false, bridgeFlags=[p27_study_healer_path, p29_study_healer_case_duty, p29_social_healer_network], studyHabit=3

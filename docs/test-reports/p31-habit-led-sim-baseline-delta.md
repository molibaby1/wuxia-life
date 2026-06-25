# P31 Habit-Led Sim Baseline Delta

Generated: 2026-06-24T04:07:47.022Z

## Command

```bash
npm exec tsx scripts/runP31HabitLedSimulationBaseline.ts
```

## Delta vs P30 Closure Baseline

P30 habit-led fixtures seed `lifeStates.*` + P27–P29 bridge flags only (0% unlock). P31 applies threshold-gated key-choice bridges before composite eval.

| Outcome | P30 habit-led unlock | P31 habit-led unlock (bridges) | Delta |
| --- | --- | --- | --- |
| `jianghu_renown_sage` | 0% | 100% | +100pp |
| `medical_sage_healer` | 0% | 100% | +100pp |

## Interpretation

P31 bridge-resolved habit-led paths unlock Wave 1 achievements (>0% vs P30 0%) while preserving composite stat gates and ethic mutex.

## P31 bridge-resolved path snapshots

- `habit_led_renown_social_path` → `jianghu_renown_sage`: unlocked=true, keyChoicesMet=true, bridgeFlags=[p28_social_network_renown, p28_social_reputation_reinforced, p29_social_patron_obligation_assumed]
- `habit_led_medical_study_path` → `medical_sage_healer`: unlocked=true, keyChoicesMet=true, bridgeFlags=[p27_study_healer_path, p29_study_healer_case_duty, p29_social_healer_network]

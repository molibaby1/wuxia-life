# P34 Lifetime Sim Baseline Delta

Generated: 2026-06-24T04:47:16.932Z

## Command

```bash
npm exec tsx scripts/runP34HabitLedSimulationBaseline.ts
```

## Delta vs P33 Short-Chain and P31 Static

| Outcome | P31 static (resolver) | P33 medical short-chain | P34 lifetime birth→death | Delta |
| --- | --- | --- | --- | --- |
| `medical_sage_healer` | 100% | 100% | 100% | aligned |

## Interpretation

P34 lifetime unlock (100%) aligns with P33 short-chain and P31 static baselines.

## Parity notes

- P34 lifetime uses same JSON flag_set bridge path as P33 short-chain; adds birth→terminal age progression and habit-zero on-ramp.
- P31 static baseline uses resolveP31HabitLedKeyChoiceBridges; P34 lifetime avoids static resolver.
- Lifetime unlock rate compared against P33 short-chain (midlife seed) and P31 static (resolver fixtures).

## Lifetime slice snapshot

- Path: `p34_medical_habit_zero_lifetime`
- Terminal age: 72
- Unlocked: true
- Event sequence: p27_study_habit_healer_reinforcement → p29_study_habit_case_record_duty
- Static resolver used: false

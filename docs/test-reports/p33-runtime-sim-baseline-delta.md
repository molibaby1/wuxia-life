# P33 Medical Runtime Sim Baseline Delta

Generated: 2026-06-24T04:35:55.554Z

## Command

```bash
npm exec tsx scripts/runP33HabitLedSimulationBaseline.ts
```

## Delta vs P31 Static and P32 Renown Runtime

| Outcome | P31 static (resolver) | P32 renown runtime | P33 medical runtime | Delta |
| --- | --- | --- | --- | --- |
| `jianghu_renown_sage` | 100% | 100% | — | renown via P32 |
| `medical_sage_healer` | 100% | — (parity only) | 100% | aligned |

## Interpretation

P33 medical runtime short-chain unlock (100%) aligns with P31 static baseline. P32 renown runtime remains 100%.

## Parity notes

- P33 medical runtime short-chain uses JSON flag_set from p27→p29 events; P31 static uses resolveP31HabitLedKeyChoiceBridges.
- P32 renown runtime baseline retained for cross-path comparison.
- Poison mutex aligned in P33-002 via applyEventChoiceFlagSets.

## Medical short-chain snapshot

- Path: `p33_medical_event_driven_short_chain`
- Unlocked: true
- Key choices met: true
- Event sequence: p27_study_habit_healer_reinforcement → p29_study_habit_case_record_duty
- Static resolver used: false

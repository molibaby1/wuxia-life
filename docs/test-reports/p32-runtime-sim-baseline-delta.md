# P32 Runtime Sim Baseline Delta

Generated: 2026-06-24T04:29:50.296Z

## Command

```bash
npm exec tsx scripts/runP32HabitLedSimulationBaseline.ts
```

## Delta vs P31 Static Baseline

| Outcome | P31 static (resolver) unlock | P32 runtime short-chain unlock | Delta |
| --- | --- | --- | --- |
| `jianghu_renown_sage` | 100% | 100% | aligned |
| `medical_sage_healer` | 100% | — (parity tests only) | monitor |

## Interpretation

P32 renown runtime short-chain unlock aligns with P31 static bridge-resolved baseline (100%).

## Parity notes

- Renown runtime short-chain uses JSON flag_set from p28 event; P31 static path uses resolveP31HabitLedKeyChoiceBridges on fixtures.
- Medical runtime short-chain deferred to P32-006 skip-first; P31 static resolver + parity tests cover medical bridges.
- Poison mutex (P32-RISK-003): JSON sets bridge flags unconditionally; resolver blocks when medical_poison_path is set.

## Renown short-chain snapshot

- Path: `p32_renown_event_driven_short_chain`
- Unlocked: true
- Key choices met: true
- Event sequence: p28_social_reputation_reinforcement
- Static resolver used: false

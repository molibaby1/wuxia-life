# P40 Post-Polish Gate Refresh

> **Date:** 2026-06-24  
> **Command:** `npm run gate:playability`  
> **Reports:** `p8-playability-gate-latest.json`, `p8-playability-gate-latest.md`

## Decision

| Field | Pre-P40 | Post-P40 |
| --- | --- | --- |
| Decision | PASS | **PASS** |
| Blockers | 0 | **0** |
| Warnings | 10 | **10** |
| Runtime | headless_server | headless_server |

## Pacing delta (M1)

| Persona | Pre span | Post span | Δ |
| --- | --- | --- | --- |
| p8-deviant-ye | 7y (warning) | **5y (pass)** | **−2y** |
| p8-martial-lin | 6y | 6y | — |
| p8-scholar-su | 7y | 7y | — |
| p8-social-gu | 6y | 6y | — |
| p8-wealth-shen | 6y | 6y | — |
| p8-cautious-han | 6y | 6y | — |
| p8-explorer-lu | 7y | 7y | — |
| p8-balanced-wei | 6y | 6y | — |

**M1 Met:** deviant-ye ≤5y.

## Replay delta (M2)

| Metric | Pre-P40 | Post-P40 |
| --- | --- | --- |
| Near-duplicate pairs (≥0.82) | 3 | **3** |

Pairs (unchanged count, scores shifted slightly):

- `p8-martial-lin ~ p8-cautious-han` (0.88)
- `p8-scholar-su ~ p8-wealth-shen` (0.95)
- `p8-scholar-su ~ p8-deviant-ye` (0.85)

**M2 Met:** ≤3 pairs.

## Frustration (M4)

All personas opaque ratio **0.00** — no P38 regression.

## Isolated regression (M5)

```bash
npm exec tsx tests/p40ReplayPacingPolishTests.ts   # PASS (8 headless runs, single bundle)
npm exec tsx tests/p38FrustrationRemediationTests.ts # PASS
npm exec tsx tests/p36ConsistencyTests.ts            # PASS
npm exec tsx tests/p37AdditionalMixedPinnacleParityTests.ts # PASS
npm exec tsx tests/p39ContentPoolConsistencyTests.ts  # PASS
npm exec tsx tests/p8PlayabilityTests.ts             # PASS
npx tsc --noEmit                                     # PASS
```

P40-004 carry-forward: P36–P39 isolated regression suites restored on p40 branch (selective p39 lineage import; P40 replay metrics unchanged). P36–P39 wired into `tests/runRealTestGate.ts`; P40 remains isolated (~100s headless bundle).

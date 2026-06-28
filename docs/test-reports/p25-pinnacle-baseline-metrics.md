# P25 Pinnacle Simulation Acceptance Baseline (US-011)

Generated: 2026-06-23T06:15:26.483Z

## Command

```bash
npm exec tsx scripts/runP25PinnacleBaseline.ts
```

Samples: 32 (seeds 2001–2032)

## Pinnacle unlock rates

- `jianghu_myth_legend`: 18.8%
- `founding_patriarch`: 15.6%

- mainstreamMedianUnlockRate: 34.4%
- pinnacleMaxUnlockRate: 18.8%
- pinnacle below mainstream median: **YES**

## Failure attribution

- missing_rare_line: 42
- missing_key_choice: 11
- missed_window: 0
- stat_shortfall: 0
- unlocked: 11

- attributable rate (rare line / choice / window): 100.0%
- meets ≥80% threshold: **YES**

## Gates

- gate:playability: PASS
- gate:p20: PASS

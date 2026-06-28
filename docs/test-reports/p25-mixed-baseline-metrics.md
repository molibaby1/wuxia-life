# P25 Mixed Simulation Acceptance Baseline (US-015)

Generated: 2026-06-23T06:37:24.150Z

## Command

```bash
npm exec tsx scripts/runP25MixedBaseline.ts
```

Samples: 32 (seeds 3001–3032)

## Mixed unlock rates

- `merchant_magnate`: 15.6%
- `healer_swordsman`: 18.8%
- `merchant_martial_patron`: 18.8%

## Cross-track dimension coverage

- `merchant_route`: 5/32 (15.6%)
- `wealth_capital`: 10/32 (31.3%)
- `martial_track`: 33/64 (51.6%)
- `medical_track`: 6/32 (18.8%)
- `merchant_track`: 6/32 (18.8%)

## Regression (mainstream / pinnacle unlock rates on same fixtures)

### Mainstream

### Pinnacle

## Gates

- gate:playability: PASS
- gate:p20: PASS

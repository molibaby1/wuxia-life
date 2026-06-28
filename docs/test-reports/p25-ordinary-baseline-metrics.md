# P25 Ordinary Origin Simulation Acceptance Baseline (US-019)

Generated: 2026-06-23T07:28:17.701Z

## Command

```bash
npm exec tsx scripts/runP25OrdinaryBaseline.ts
```

Samples: 32 (seeds 4001–4032)

## Ordinary origin surfaces

- `farm_peasant`: labor, seasonal, family
- `town_apprentice`: craft, apprenticeship, discipline
- `tavern_hand`: service, rumor, social

## Pairwise trajectory divergence (ordinary vs vivid control)

- `tavern_hand_vs_merchant_house`: 34.4% divergent
- `farm_peasant_vs_poor_family`: 34.4% divergent
- `town_apprentice_vs_streetborn`: 31.3% divergent
- Average: 33.3%

## Mid-tier reachability (ordinary samples)

- midTierUnlockRate: 34.4%
- aboveZero: true

## Pinnacle vs mainstream

- mainstreamMedianUnlockRate: 18.8%
- pinnacleMaxUnlockRate: 0.0%
- pinnacleBelowMainstreamMedian: true
- pinnacleNotForcedZero: true

## Gates

- gate:playability: PASS
- gate:p20: PASS

# P25 Simulation Acceptance Baseline (US-006)

Generated: 2026-06-23T05:48:29.199Z

## Command

```bash
npm exec tsx scripts/runP25SimulationBaseline.ts
```

Samples: 24 (seeds 1001–1024)

## Metrics

- pathDivergenceProxy: 0.250
- highSeverityContradictionCount: 0

### Achievement unlock rates

- `medical_sage_healer`: 20.8%
- `sect_leader_statesman`: 16.7%
- `lone_sword_legend`: 12.5%
- `grandmaster_guardian`: 12.5%
- `jianghu_renown_sage`: 16.7%

## Wave 1 acceptance direction

Wave 1 targets partial reachability on all 5 mainstream outcomes and pathDivergenceProxy >= 0.25; pinnacle/mixed/ordinary-origin thresholds deferred to Wave 2-4.

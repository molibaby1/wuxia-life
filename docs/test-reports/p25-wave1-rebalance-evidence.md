# P25 Wave 1 Experience Rebalance Evidence (US-007)

**Layer:** `world profile` (representative path fixtures) + content flag wiring (prior stories)  
**Out of scope:** runtime scheduler rewrite, UI, new world profile theme

## Before / After

| Metric | Before | After | Delta |
| --- | --- | --- | --- |
| pathDivergenceProxy | 0.167 | 0.250 | +0.083 |
| sect_leader_statesman unlock rate | 0% | 16.7% | +16.7pp |
| lone_sword_legend unlock rate | 0% | 12.5% | +12.5pp (FIX-001: `connections` 10→15) |
| grandmaster_guardian unlock rate | 29.2% | 12.5% | redistributed across 5 paths |
| highSeverityContradictionCount | 0 | 0 | — |

**Evidence files:**
- Before: `docs/test-reports/p25-lifetime-simulation-baseline-metrics-before.json`
- After: `docs/test-reports/p25-lifetime-simulation-baseline-metrics.json`

## Changes

1. Expanded `P25_REPRESENTATIVE_LIFE_PATHS` from 3 → 5 to mirror frozen mainstream achievement set (sect leader + lone sword fixtures).
2. Prior US-003 flag wiring (`p16_alliance_brokered`, `mentor_bond`, medical chain) enables non-zero sect/renown/medical reachability in sim.
3. US-005 contradiction slice: 0 critical findings after wiring (no additional runtime fixes required).

## Gates

Run after rebalance: `gate:playability`, `gate:p20` — see Wave 1 closure report.

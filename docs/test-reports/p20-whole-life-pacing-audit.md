# P20 Whole-Life Pacing Baseline Audit (US-003)

Read-only audit of stage density, route-pressure timing, payoff spacing, callback cadence, and endgame closure rhythm.

## Stage Density (P9 + P11 baselines)

| Life stage | Age band | Observed issue | Classification |
| --- | --- | --- | --- |
| Childhood | 0–10 | Origin surfaces differ but event density similar across personas | **too homogeneous** |
| Youth | 10–20 | Route entry compressed; martial training dominates histogram | **too dense** (martial) / **too empty** (scholar/wealth) |
| Early adulthood | 20–30 | 6–7y low-impact spans for all P8 personas | **too empty** |
| Mid adulthood | 30–40 | Identity confirmation relies on summary template, not distinct payoff spacing | **too homogeneous** |
| Late life | 40+ | P17/P18/P19 layers activate but share scheduling age gate (≥25) | **homogeneous timing** |
| Endgame | 65–70+ | Forced late-life ending re-runs stat buckets | **closure rhythm collapse** |

## Route-Pressure Timing

- P11 `getRouteSchedulingMultiplier` applies 1.35× to active-route events uniformly.
- P17 consequence multiplier starts at age 25 — same threshold as P18 legacy and P19 recovery.
- Wanderer midlife boost (31–50) is the only route-specific timing offset in shared runtime.
- Scholar and wealth personas lack compensating early pressure delays or late pressure advances.

## Payoff Spacing

- P9 pacing annotation: expected `minImpactEvents` per stage rarely met for non-martial personas.
- Cross-stage payoffs (destiny checkpoints, achievements) cluster around age 30–40 for all routes.
- P18 legacy payoffs and P19 endgame categories fire on similar late-life flag sets.

## Callback Cadence

- Echo hooks fire on action completion flags — cadence tied to active-action category, not archetype family.
- Relationship/faction callbacks (P17) share 25+ age gate — reduces midlife identity divergence.

## Endgame Closure Rhythm

- P19 categories differentiate by trajectory weights but selection often occurs after pacing has already converged.
- Historical memory divergence requires strong flag sets; weak archetypes never reach distinct memory tones.

## Pacing Collapse → Archetype Reconvergence

| Stage pair | Different candidates | Reconvergence mechanism |
| --- | --- | --- |
| Childhood → youth | martial-lin vs scholar-su | Both hit 3+ actions in dominant category before route-specific events surface |
| Youth → adulthood | wealth-shen vs social-gu | Money/connections goals met with similar event counts; payoff shape identical |
| Adulthood → late life | hermit vs demonic | Both stall in low-impact span until age 25 consequence gate |
| Late life → endgame | legacy-heavy vs faction-heavy | Stat-aligned endings despite different P18/P17 reports |

## P20 Priority

1. Per-archetype `stageProfiles` with density, payoff spacing, and callback cadence multipliers.
2. Visible pacing comparison output for representative runs.
3. Rebalance childhood/youth, adulthood, and late-life/endgame portions in config (US-016–018).

No gameplay changes in US-003.

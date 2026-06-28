# Persona Pacing Slice B — Bounded Targets

Slice B: P8 persona low-impact span warnings. Layer: `tuning_config` probe (single archetype pacing knobs).

## Issue

All 8 P8 personas report 6–7y low-impact spans centered on ages 7–13/14 at endAge 40 gate.

## Target Metrics

| ID | Metric | Command | Acceptance direction |
| --- | --- | --- | --- |
| **M1** | Personas with span >5y | `npm run gate:playability` → JSON `personaRuns[].pacing.longestLowImpactSpanYears` | Lower vs **8/8**; goal **≤ 4/8** |
| **M2** | Max persona span | Same | Lower vs **7y**; goal **≤ 5y** |
| **M3** | Cohort max span | `SECOND_TUNING_SAMPLE_COUNT=50 npm run audit:second-tuning-metrics` | **≤ 5y** (no regression) |
| **G1** | Playability gate | `npm run gate:playability` | **PASS** |

## Allowed Surfaces

| Surface | File | Knobs |
| --- | --- | --- |
| Martial archetype pacing | `wuxiaReplayabilitySurfaces.ts` | **One** `payoffSpacingMultiplier` on `P20_MARTIAL_ASCENDANT` stage profile (probe: `stage_10_20`, fallback: `stage_0_10`) |

## Out of Scope

- Other archetype pacing profiles (multi-knob sweep)
- `setback-events.json`, family/love lines
- `P20_REPETITION_*`
- `isPacingImpactRecord` / `collectPacingMetrics` (runtime)
- routeDefinitions, echoHooks, `src/core/**`

## Guardrails

- `npm run typecheck`
- `npm run gate:playability`
- `npm run gate:p20`
- `npm run audit:second-tuning-metrics`

Generated: 2026-06-23.

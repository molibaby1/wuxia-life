# Childhood Payoff Spine 7–13 — Slice C Targets

Slice C: P8 persona low-impact span via theme-owned childhood payoff content. Layer: **world profile / content structure**.

## Issue

All 8 P8 personas showed 6–7y low-impact spans (ages 7–13/14). Slice B proved `tuning_config` pacing knobs insufficient.

## Target Metrics

| ID | Metric | Command | Baseline | Acceptance |
| --- | --- | --- | --- | --- |
| **M1** | Personas span >5y | `npm run gate:playability` | **8/8** | **≤ 4/8** (goal **0/8**) |
| **M2** | Max persona span | Same | **7y** | **≤ 5y** |
| **M3** | Cohort max span | `audit:second-tuning-metrics` | **5y** | **≤ 5y** |
| **G1** | Playability | `gate:playability` | PASS | PASS |

## Allowed Surfaces

| Surface | File | Work |
| --- | --- | --- |
| Childhood payoff events | `src/data/lines/general.json` | 2 new choice milestones + enrich 3 spine autos |
| Golden-line spine | `src/data/golden-line-spine.json` | anchors ages 9, 11 |
| Event manifest | `src/data/event-asset-manifest.json` | via `report:event-asset-inventory` |
| Design contract | `docs/designs/childhood-payoff-spine-7-13-content-contract.md` | theme-owned band definition |

## Out of Scope

- `prologue.json` bulk wiring
- `src/p8/collectPersonaMetrics.ts` / `src/core/**`
- pacing multipliers, setback/family tuning
- `routeDefinitions`, `echoHooks`

Generated: 2026-06-23.

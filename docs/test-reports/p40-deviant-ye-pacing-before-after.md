# P40 Deviant-Ye Pacing Before/After

> **Persona:** `p8-deviant-ye` (叶走邪)  
> **Gate end age:** 40

## Before (pre-P40 baseline)

Source: `p8-playability-gate-latest.json` snapshot before P40-002.

| Metric | Value |
| --- | --- |
| Low-impact span | **7y** |
| Span ages | 7 → 14 |
| Gate pacing verdict | **warning** (>5y) |
| Gap events | None recorded ages 8–13; next impact `sect_choice` @14 |

## After (P40-002 remediation)

Source: post-P40 `npm run gate:playability` → `p8-playability-gate-latest.json`.

| Metric | Value |
| --- | --- |
| Low-impact span | **5y** |
| Span ages | 7 → 12 |
| Gate pacing verdict | **pass** (≤5y) |
| New impact anchor | `p9_deviant_youth_route_milestone` @12 (choice, 路线/里程碑 copy) |
| Childhood milestone | `p9_childhood_dark_spark` @10 (auto, via bootstrap `p8_route_demonic`) |

## Fixes applied

1. `createPersonaSession.ts` — bootstrap `p8_route_*`, strategy hooks, `p8_persona_id` at session start (mirror `GameProcessSimulator`).
2. `personaYouthRouteSeeds.ts` — route flags per `routePreference`; remove premature `p9_childhood_dark_spark` seed.
3. `p9-remediation.json` — `p9_deviant_youth_route_milestone` choice @12–13.

## Regression check

All other personas remain pacing **pass** or **warning** (no new >8y blocker spans) on post-P40 gate run.

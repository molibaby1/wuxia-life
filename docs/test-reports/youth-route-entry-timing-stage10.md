# Youth Route Entry Timing Stage-10 (US-005 + US-006)

**Date:** 2026-06-22  
**PRD:** `docs/PRD/early-childhood-youth-agency-band-stage10.md`

## Commands

```bash
npm exec tsx tests/youthRouteEntryTimingStage10Tests.ts
npm exec tsx tests/p16OriginDestinyTests.ts
npm run gate:p11-scheduling
```

---

## § config diff (US-005)

`src/narrative/config/routeDefinitions.ts` — entry signal `ageBand` **0-10 → 13-20**:

| Route | flagKey | Before | After | description |
| --- | --- | --- | --- | --- |
| route_wealth | `p9_early_business_focus` | 0-10 | **13-20** | 幼年→**少年**营商行动 |
| route_wanderer | `p9_early_travel_focus` | 0-10 | **13-20** | 幼年→**少年**游历行动 |
| route_martial | `p9_echo_training_hook` | 0-10 | **13-20** | 幼年→**少年**练功 |
| route_deviant | `p9_echo_training_hook` | 0-10 | **13-20** | 幼年→**少年**练功 |
| route_scholar | `p9_echo_study_hook` | 0-10 | **13-20** | 幼年→**少年**读书行动 |
| route_social | `p9_early_social_focus` | 0-10 | **13-20** | 幼年→**少年**交游行动 |

**P11 gate:** `npm run gate:p11-scheduling` → **pass**

---

## § timing tests (US-006)

| Test | Target | Result |
| --- | --- | --- |
| Ages 8/10/12 palette — no `p9_early_*` onComplete actions | 0 violations | **PASS** |
| `applyYouthTransitionSeeds(12→13)` scholar/merchant business promotion | expected flags | **PASS** |
| `promoteYouthRouteEntryFromUpbringing` demonic travel echo | restless journey, not wanderer focus | **PASS** |
| `testYouthRouteEntryPromotion` regression (p16OriginDestinyTests) | unchanged semantics | **PASS** |

**Decision:** **PASS** — childhood gameplay paths do not seed `p9_early_*` before age 13; youth transition remains canonical promotion window.

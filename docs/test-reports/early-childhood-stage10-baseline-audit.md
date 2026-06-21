# Early Childhood Stage-10 — Baseline Audit (US-001)

**Date:** 2026-06-22  
**PRD:** `docs/PRD/early-childhood-youth-agency-band-stage10.md`  
**Design (pre-US-002):** `docs/designs/p16-stage-agency-rules.md`  
**Repro:** `npm exec tsx -- scripts/runStage10BaselineAudit.ts` · `npm exec tsx -- scripts/runStage10BaselineAudit.ts --sample`

---

## 1. Executive summary

| Gap (Stage-9 closure) | Current state | Stage-10 action |
| --- | --- | --- |
| **13～20 P16 agency** | `resolveChildhoodActionPalette` at `age > 12` → **`getMinimumActions()`** — all five `action_*_basic` every tick | US-003 youth resolver + US-004 matrix |
| **Route entry ageBand** | Six entry signals still **`0-10`** in `routeDefinitions.ts` | US-005 align to **`13-20`** |
| **`p9_early_*` before 13** | Promotion path exists (`applyYouthTransitionSeeds`); no childhood palette regression tests | US-006 timing tests |
| **35-step youth coverage** | Final age **13–15**; 13～20 share **~9–11%** of 35 steps; **0** planning ticks in youth band in samples | US-008 observation columns |

**Headless planning path:** `HeadlessEngineSessionImpl.getPlanningOptions()` → `GameEngineIntegration.getAvailableActiveActions()` → `resolveChildhoodActionPalette({ age, player, flags })` → **`age > 12` → `getMinimumActions()`** (no youth tier).

---

## 2. 13～20 action palette resolution

### Constants (`src/p16/childhoodAgency.ts`)

| Constant | Value |
| --- | --- |
| `YOUTH_MIN_AGE` | 13 |
| `YOUTH_MAX_AGE` | **not defined** (target 20 in PRD §3) |
| `CHILDHOOD_MAX_AGE` | 12 |
| `age > 12` branch | **`getMinimumActions()`** — unfiltered adult minimum pool |

### P7 minimum actions (`getMinimumActions()`)

| id | category |
| --- | --- |
| `action_training_basic` | training |
| `action_study_basic` | study |
| `action_socializing_basic` | socializing |
| `action_business_basic` | business |
| `action_travel_basic` | travel |

### Palette matrix (static `resolveChildhoodActionPalette`, ages 13/14/16/18/20)

| Origin | Ages 13–20 | Palette size | Action ids | All five basic? |
| --- | --- | --- | --- | --- |
| scholar | 13–20 | **5** | all five `action_*_basic` | **yes** |
| martial | 13–20 | **5** | all five `action_*_basic` | **yes** |
| merchant | 13–20 | **5** | all five `action_*_basic` | **yes** |
| frontier | 13–20 | **5** | all five `action_*_basic` | **yes** |

**Finding:** Age-13 first tick exposes **full adult strategic pool** — violates P16 **Moderate** youth intent (palette ≤5 categories with lite→basic gradient, no same-tick five-basic dump). **US-002/US-003 must introduce `resolveYouthActionPalette` for ages 13–20; age >20 retains `getMinimumActions()`.**

**Origin/persona:** Static matrix is origin-invariant today because `getMinimumActions()` ignores upbringing signals.

### Headless wiring

| Step | File |
| --- | --- |
| Planning options | `HeadlessEngineSessionImpl.getPlanningOptions()` |
| Palette source | `GameEngineIntegration.getAvailableActiveActions()` |
| Policy | `resolveChildhoodActionPalette` → `getMinimumActions()` when `age > 12` |

---

## 3. 35-step headless samples (seeds 70001–70004)

| Origin | Seed | Final age | Steps 13–20 | Share | Planning ticks 13–20 | Basic ids seen |
| --- | --- | --- | --- | --- | --- | --- |
| scholar | 70001 | 14 | 4 | 11.4% | **0** | — |
| martial | 70002 | 15 | 4 | 11.4% | **0** | — |
| merchant | 70003 | 13 | 4 | 11.4% | **0** | — |
| frontier | 70004 | 14 | 3 | 8.6% | **0** | — |

**Finding:** 35-step harness rarely reaches deep youth band and samples **no planning ticks** at ages 13–20 in these runs — **US-004 matrix tests** (20 ticks × ages 13–20) required for agency proof; **US-008** adds observation columns without changing 35-step gate.

---

## 4. Route entry signal inventory (`routeDefinitions.ts`)

Six entry rows with **`ageBand: '0-10'`** (should be **`13-20`** per PRD):

| Route | flagKey | ageBand | description |
| --- | --- | --- | --- |
| route_wealth | `p9_early_business_focus` | 0-10 | 幼年营商行动 |
| route_wanderer | `p9_early_travel_focus` | 0-10 | 幼年游历行动 |
| route_martial | `p9_echo_training_hook` | 0-10 | 幼年练功 |
| route_deviant | `p9_echo_training_hook` | 0-10 | 幼年练功 |
| route_scholar | `p9_echo_study_hook` | 0-10 | 幼年读书行动 |
| route_social | `p9_early_social_focus` | 0-10 | 幼年交游行动 |

**Promotion path (runtime):** `applyYouthTransitionSeeds(12→13)` → deferred upbringing flags → `promoteYouthRouteEntryFromUpbringing` → `p9_early_*` / echo hooks. Config ageBand misaligned with youth window.

---

## 5. `applyYouthTransitionSeeds(12→13)` — four origins

| Origin | traitOrigin | Surface | Flags after transition |
| --- | --- | --- | --- |
| scholar | scholar_house | familyResources 0.65, socialCapital 0.5 | `p16_deferred_business_upbringing`, `p16_deferred_social_upbringing`, `p9_early_business_focus`, `p9_early_social_focus`, echo hooks |
| martial | martial_house | **no surface** (`martial_house` not in originSurfaces) | **{}** |
| merchant | merchant_house | familyResources 0.9, socialCapital 0.7 | same as scholar (business + social promotion) |
| frontier | frontier_military | familyResources 0.35, hardship 0.85 | **{}** (hardship high but familyResources ≥ 0.35 blocks travel seed) |

**Note:** `martial_house` missing from `originSurfaces` — youth transition seeds empty for martial trait origin in static audit; headless uses `origin_wuxia_family` flag path separately.

---

## 6. Age 12+ config events (PRD §11 Q5)

| Event | Source | ageRange | Youth overlap 13–20 | Assessment |
| --- | --- | --- | --- | --- |
| `daily_take_odd_job` | `dailyEvents.ts` | **12–70** | yes | **Acceptable** — livelihood daily, not `p9_early_*` route entry; spans 12→13 boundary intentionally |

No config change required for Q5 in US-002 (document-only).

---

## 7. Stage-10 recommended story order

```
US-002 (design rules) → US-003 (resolver) → US-004 (matrix)
US-005 (route ageBand) → US-006 (timing tests)
US-008 (final playtest columns) → US-009 (closure)
US-007 optional defer if US-004+US-006 PASS
```

---

## Appendix A — Repro commands

```bash
npm exec tsx -- scripts/runStage10BaselineAudit.ts
npm exec tsx -- scripts/runStage10BaselineAudit.ts --sample
npx tsc --noEmit
```

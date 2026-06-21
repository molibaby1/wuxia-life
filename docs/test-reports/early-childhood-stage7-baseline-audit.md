# Early Childhood Stage-7 — Baseline Audit (US-001)

**Date:** 2026-06-21  
**PRD:** `docs/PRD/early-childhood-childhood-experience-stage7.md`  
**Design:** `docs/designs/childhood-experience-stage7-rules.md`  
**Repro:** `npm exec tsx scripts/runStage7BaselineAudit.ts`

---

## 1. Executive summary

| Gap (Stage-6 closure §4) | Current state | Stage-7 action |
| --- | --- | --- |
| G1 — 8～12 spine band | `SPINE_ORIGIN_EXCLUSIVE_AGE_MAX = 7`; age > 7 bypasses gate | US-002 raise to 12 |
| G2 — daily fallback | `selectEvent` → `dailyEventSystem.selectEvent` with **no** `isSpineOriginEligible` | US-003 wire gate |
| G3 — trait-line bleed | Only four-main foreign block; `origin_streetborn` unlocks `p22_childhood_street_shaping` regardless of primary | US-004 trait-line gate |
| G4 — neutral repetition | Passive pool dedup by **id** only; title repeats up to 6 consecutive | US-007 title dedup (N=5) |

**8～12 catalog note:** No four-main origin-exclusive spine events overlap ages 8–12 today. Extending the gate is **defensive** for future catalog changes; the only trait-line overlap is `p22_childhood_street_shaping` [6–10].

---

## 2. Story events overlapping ages 8–12

Source: `eventLoader.getAllEvents()` filtered `ageRange.min ≤ 12 && ageRange.max ≥ 8`.  
Classifier: `inferEventExclusivePrimaryFlag` + condition scan for trait flags (same as `runStage7BaselineAudit.ts`).

**Total:** 15 events

### neutral (14)

| Event id | Age range |
| --- | --- |
| `childhood_summary` | 8–12 |
| `late_childhood_prep` | 12–12 |
| `martial_focus_payoff` | 8–11 |
| `p22_wave_early_frontier_growth` | 12–16 |
| `p9_childhood_balanced_posture` | 10–10 |
| `p9_childhood_dark_spark` | 10–10 |
| `p9_childhood_first_journey` | 10–10 |
| `p9_childhood_first_trade` | 10–10 |
| `p9_childhood_social_circle` | 10–10 |
| `p9_childhood_steady_gate` | 10–10 |
| `p9_childhood_study_recital` | 10–10 |
| `p9_childhood_sword_trial` | 10–10 |
| `preteen_training` | 10–10 |
| `setback_injury` | 10–80 |

### trait-street (1)

| Event id | Age range | Condition flags |
| --- | --- | --- |
| `p22_childhood_street_shaping` | 6–10 | `origin_streetborn` OR `p22_frontier_orphan_shaped` |

### scholar / martial / merchant / frontier exclusive

**None** in the 8–12 overlap band (0 events).

### neutral-whitelist (NEUTRAL_SPINE_EVENT_IDS)

None in 8–12 overlap (whitelist ids such as `clever_speech`, `toddler_exploration` end before age 8).

---

## 3. Daily fallback call chain

```
GameEngineIntegration.selectEvent(age?)
  ├─ getAvailableEvents(currentAge)          ← isSpineOriginEligible applied (age ≤ 7)
  ├─ filter untriggered / route / reputation
  ├─ splitEventLayers → pickWeightedFormalEvent (critical / storyline / regular)
  └─ daily fallback (6 exit points):
       dailyEventSystem.selectEvent(gameState)   ← NO origin gate today
         ├─ dailyEvents.filter(ageRange)
         ├─ getWeight(trait / state / repeat penalty)
         └─ buildEvent(config, state) → EventDefinition
```

**File references:**

| Step | File | Lines (approx.) |
| --- | --- | --- |
| Entry | `src/core/GameEngineIntegration.ts` | `selectEvent` ~1704–1844 |
| Fallback branches | same | 1716, 1761, 1767, 1797, 1816, 1835, 1844 |
| Daily selection | `src/core/DailyEventSystem.ts` | `selectEvent` 17–40, `buildEvent` 114+ |
| Daily catalog | `src/data/life/dailyEvents.ts` | trait-weight only |

### Appendix A — Daily pool origin semantics

Scanned `src/data/life/dailyEvents.ts`: **no `origin_*` flags or stageFit tags**.  
Weighting uses `preferredTraits` / `suppressedTraits` / life-state multipliers only.  
**Current pool is origin-neutral**; US-003 gate is defensive for future catalog evolution.

---

## 4. Trait-line spine inventory

### Runtime-loaded events referencing trait flags

| Event id | Age range | Flags in conditions | Primary exclusive (infer) | Notes |
| --- | --- | --- | --- | --- |
| `p22_childhood_street_shaping` | 6–10 | `origin_streetborn`, `p22_frontier_orphan_shaped` | null | Street-line; OR branch also opens via orphan shaping flag |

### `p22-content-expansions.json`

| Event id | Trait / origin refs | Stage-6 status |
| --- | --- | --- |
| `p22_origin_frontier_orphan` | `origin_frontier` only (age 1–3) | Fixed Stage-6 — no `origin_poor_family` OR |
| `p22_childhood_street_shaping` | `origin_streetborn` OR `p22_frontier_orphan_shaped` | Needs US-004/005 trait-line gate + orphan chain audit |

### `src/data/traits/origins.ts` startingFlags

| Trait id | startingFlags |
| --- | --- |
| `poor_family` | `origin_poor_family` |
| `streetborn` | `origin_streetborn` |

**No spine event** currently keys solely on `origin_poor_family` in loaded catalog. Poor-line bleed risk is **config + future content**, not present runtime ids.

### Config validation findings (age ≤ 7 scan)

`validateSpineOriginConfig()` — **0 findings** at audit time (Stage-6 orphan OR fix held).

---

## 5. Neutral passive title repetition (baseline)

**Method:** 4 origins (scholar / martial / merchant / frontier) × ages 3–7 × 30 picks = **600 picks per origin** (2,400 total).  
Seeded PRNG (`seed=42`) via `selectPreschoolPassiveEntry` — see `scripts/runStage7BaselineAudit.ts`.

### Neutral-only catalog

Only **1** neutral-only passive title in pool: **「家中一季」** (`preschool_passive_gap` fallback uses planning placeholder, not counted here).

Repetition pressure comes from **origin-tagged** entries re-entering when id history exhausts exclusive pool.

### Global top duplicated titles (2,400 picks)

| Title | Count |
| --- | --- |
| 描红练字 | 61 |
| 木人桩影 | 59 |
| 看摊学艺 | 53 |
| 营中操练 | 51 |
| 望哨初体验 | 41 |
| 偷看账本 | 32 |
| 识文断字 | 28 |
| 耳濡目染 | 28 |
| 暮鼓操练 | 27 |
| 书斋尘香 | 26 |

### Max consecutive same title (per origin)

| Origin | Max consecutive |
| --- | --- |
| scholar | 5 |
| martial | 5 |
| merchant | 5 |
| frontier | 6 |

**US-007 target:** ≤2 consecutive (PRD §9). Current baseline **fails** product bar → dedup required.

---

## 6. Neutral spine repetition baseline (US-006 input)

Neutral / non-exclusive spine ids with `ageRange.max ≤ 12` (for optional P2 tuning):

`birth_with_phenomenon`, `birth_wuxia_family`, `childhood_preference`, `childhood_summary`, `clever_speech`, `late_childhood_prep`, `martial_arts_enlightenment`, `martial_focus_payoff`, `origin_background`, `p22_childhood_street_shaping`, `p9_childhood_*` (7 ids), `preteen_training`, `toddler_exploration`

Formal repetition multiplier already applies in `getAvailableEvents` weight path; US-006 may extend id-family keys (`clever_speech`, `toddler_*`).

---

## 7. Code touchpoints confirmed (no changes in US-001)

| Component | Path | Current |
| --- | --- | --- |
| Spine gate constant | `src/p16/spineOriginIsolation.ts` | `SPINE_ORIGIN_EXCLUSIVE_AGE_MAX = 7` |
| Primary resolver | `src/p16/primaryOriginFlag.ts` | unchanged Stage-6 |
| Passive selector | `src/data/preschoolPassiveSpine.ts` | id-history dedup only |
| Config validation | `src/p16/spineOriginConfigValidation.ts` | age ≤ 7 scan |

---

**Status:** US-001 complete — read-only audit; no gameplay code changes.

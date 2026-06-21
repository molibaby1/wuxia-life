# Early Childhood Stage-9 — Baseline Audit (US-001)

**Date:** 2026-06-21  
**PRD:** `docs/PRD/early-childhood-late-childhood-agency-and-spine-stage9.md`  
**Design:** `docs/designs/p16-stage-agency-rules.md` § Late Childhood (8–12)  
**Repro:** `npm exec tsx scripts/runStage9BaselineAudit.ts` · `npm exec tsx -- scripts/runStage9BaselineAudit.ts --sample`

---

## 1. Executive summary

| Gap (Stage-8 closure) | Current state | Stage-9 action |
| --- | --- | --- |
| **8～12 P16 agency** | `resolveChildhoodActionPalette` max **4** categories at 8+; **lite** business/travel/socializing still enter palette for scholar/merchant/frontier | US-002 hard-filter categories |
| **8～12 spine density** | Stage-7 inventory **unchanged** — 15 overlap events, **0** four-main exclusive | US-003 optional pack (P1 deferrable) |
| **Neutral spine dedup** | Formal repetition multiplier only; no id-family keys for `childhood_summary` / p9 echo | US-004 P2 if repetition > bar |
| **Passive title consecutive** | Final playtest **PARTIAL** — 边疆 max=**3** (target ≤2) | US-005 conditional hardening |

**Headless planning path:** `HeadlessEngineSessionImpl.getPlanningOptions()` → `GameEngineIntegration.getAvailableActiveActions()` → `resolveChildhoodActionPalette({ age, player, flags })`.

---

## 2. 8～12 action palette resolution

### Constants (`src/p16/childhoodAgency.ts`)

| Constant | Value |
| --- | --- |
| `DAILY_PLANNING_MIN_AGE` | 5 |
| `EARLY_CHILDHOOD_MAX_AGE` | 7 |
| `CHILDHOOD_MAX_AGE` | 12 |
| Max categories ages 5–7 | **2** |
| Max categories ages 8–12 | **4** |
| `shouldOfferDailyPlanning(8..12)` | **true** |

### P16 suppressed categories (design § Late Childhood)

`business`, `travel`, `socializing` — **Suppressed until youth (13+)**.  
Allowlist: `training`, `study` (lite ids).

### Adult blocked ids (hard block all childhood)

`action_business_basic`, `action_travel_basic`, `action_socializing_basic`, `action_study_basic`, `action_training_basic`

### Palette matrix (static `resolveChildhoodActionPalette`, seed-independent)

| Origin | Ages 8–12 | Palette size | Action ids | Suppressed **category** present? |
| --- | --- | --- | --- | --- |
| scholar | 8–12 | 4 | `action_study_lite`, `action_childhood_training`, `action_socializing_lite`, `action_household_apprentice` | **yes** — socializing, business |
| martial | 8–12 | 1 | `action_childhood_training` | **no** |
| merchant | 8–12 | 4 | `action_household_apprentice`, `action_socializing_lite`, `action_study_lite`, `action_childhood_training` | **yes** — business, socializing |
| frontier | 8–12 | 2 | `action_errand_nearby`, `action_childhood_training` | **yes** — travel |

**Finding:** Adult catalog ids are blocked, but **category-level suppression for 8–12 is not implemented**. Origin bias still ranks business/travel/socializing into lite slots (`action_household_apprentice`, `action_socializing_lite`, `action_errand_nearby`). **US-002 must filter categories for `age > 7 && age ≤ 12`.**

**Demonic travel exception:** `p8_route_demonic` injects travel lite only for ages **5–9** (unchanged; does not apply to 8–12 band per PRD §11 Q4).

**Sub-band 8–9 vs 10–12:** No separate palette sub-bands in code today (PRD §11 Q1 default: verify existing 4-category first).

### Headless wiring

| Step | File |
| --- | --- |
| Planning options | `HeadlessEngineSessionImpl.getPlanningOptions()` |
| Palette source | `GameEngineIntegration.getAvailableActiveActions()` |
| Policy | `resolveChildhoodActionPalette` |

---

## 3. Story events overlapping ages 8–12 (reconcile Stage-7 §2)

Source: `eventLoader.getAllEvents()` filtered `ageRange.min ≤ 12 && ageRange.max ≥ 8`.

**Total:** 15 events — **identical set to Stage-7 audit** (no catalog additions/removals since Stage-7).

| Class | Count | Notes |
| --- | --- | --- |
| neutral | 14 | Includes `childhood_summary`, p9 childhood echo ids, `martial_focus_payoff` |
| trait-street | 1 | `p22_childhood_street_shaping` [6–10] |
| four-main exclusive | **0** | No scholar/martial/merchant/frontier exclusive in band |

**Stage-8 adjacent (not in 8–12 overlap):** `p22_childhood_poor_shaping` [4–7] — trait poor line only.

Full id list: see `scripts/runStage9BaselineAudit.ts` output § `8–12 spine inventory`.

---

## 4. Sample 35-step headless runs (four origins)

Seeds: scholar 90001, martial 90002, merchant 90003, frontier 90004 (same driver as final playtest).

| Origin | Final age @35 steps | Steps with age 8–12 | Share of 35 | Formal | Daily | Planning | Passive | Spine ids @8–12 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 书香/scholar | 19 | 1 | 2.9% | 1 | 0 | 0 | 0 | `martial_focus_payoff` |
| 武林/martial | 19 | 1 | 2.9% | 1 | 0 | 0 | 0 | `martial_focus_payoff` |
| 商贾/merchant | 15 | 0 | 0% | 0 | 0 | 0 | 0 | — |
| 边疆/frontier | 17 | 1 | 2.9% | 1 | 0 | 0 | 0 | `martial_focus_payoff` |

**Interpretation:** 35-step opening runs spend most ticks below age 8; 8–12 band is **thinly sampled** in this harness (PRD §11 Q3: extend observation columns in US-006, keep 35-step gate). Formal spine dominates the few 8–12 ticks; planning-phase samples at 8–12 require extended runs or dedicated matrix (US-002).

---

## 5. Neutral spine id repetition baseline (US-004 input)

**Target ids:** `childhood_summary`, `late_childhood_prep`, `martial_focus_payoff`, `preteen_training`, seven `p9_childhood_*` echo ids.

**35-step sample @ ages 8–12 (this audit):**

| Event id | Appearances (4-origin sample) |
| --- | --- |
| `martial_focus_payoff` | 3 (scholar, martial, frontier) |

No repeated `childhood_summary` or p9 echo in this narrow window — repetition pressure manifests over longer runs / formal weight path. Stage-7 §6 listed candidate id-families for US-006/US-004 tuning.

**Formal weight path:** `GameEngineIntegration.getFormalRepetitionSuppressionMultiplier` — setback/class based; **no neutral id-family keys** yet.

---

## 6. Passive title consecutive (from latest final playtest)

Source: `docs/test-reports/early-childhood-opening-experience-final-playtest.md` (Stage-8 closure run).

| Origin | maxConsecutivePassiveTitle | Target |
| --- | --- | --- |
| 书香门第 | 1 | ≤2 |
| 武林世家 | 1 | ≤2 |
| 商贾之家 | 1 | ≤2 |
| 边疆异族 | **3** | ≤2 |

**Suite result:** **PARTIAL** — 边疆 drives US-005 conditional work.

Stage-7 passive pool dedup baseline (seed=42, ages 3–7): max consecutive **4** per origin after Stage-8 pool thickening (`runStage7BaselineAudit.ts`).

---

## 7. Code touchpoints confirmed (no gameplay changes in US-001)

| Component | Path | Current |
| --- | --- | --- |
| Agency palette | `src/p16/childhoodAgency.ts` | 8–12 allows 4 categories incl. lite business/travel/socializing |
| Headless planning | `src/headless/session/HeadlessEngineSessionImpl.ts` | `getPlanningOptions` → engine palette |
| Spine gate | `src/p16/spineOriginIsolation.ts` | `SPINE_ORIGIN_EXCLUSIVE_AGE_MAX = 12` |
| Passive dedup | `src/data/preschoolPassiveSpine.ts` | `NEUTRAL_PASSIVE_TITLE_DEDUP_WINDOW = 5` |
| Final playtest | `scripts/runEarlyChildhoodFinalPlaytest.ts` | 35-step; no 8–12 column yet |

---

**Status:** US-001 complete — read-only audit + repro script; gameplay code unchanged.

# Spine Cross-Origin Bleed Audit — Stage-6 (US-001)

**PRD:** `docs/PRD/early-childhood-spine-origin-isolation.md`  
**Design:** `docs/designs/spine-origin-isolation-rules.md`  
**Date:** 2026-06-21  
**Scope:** Read-only inventory; no gameplay code changes in this story.

---

## 1. Reproduced bleed case

| Field | Value |
| --- | --- |
| Origin choice | 书香门第 → `origin_scholar_family` |
| Age | 2 |
| Phase | `story_event` |
| Event id | `p22_origin_frontier_orphan`（边关遗孤） |
| Source | `docs/test-reports/api-browser-playtest-stage2.md` step 7 |

**Step log excerpt:**

| Step | Age | Phase | note |
| --- | --- | --- | --- |
| 7 | 2 | story_event | `p22_origin_frontier_orphan` |

Player trait archetype was likely `poor_family` (`origin_poor_family` starting flag) while `origin_background` choice added `origin_scholar_family` — both flags coexist.

---

## 2. Root causes (R1–R5)

| # | Root cause | File / mechanism | Notes |
| --- | --- | --- | --- |
| R1 | No canonical primary origin | `GameEngineIntegration.passesRuntimeEventGuards` | Trait `startingFlags` and `origin_background` flags coexist; conditions use OR |
| R2 | Config flag name mismatch | `src/data/lines/p22-content-expansions.json` | `origin_frontier_family` in condition; canonical is `origin_frontier` (`origin.json`) |
| R3 | Soft weighting only | `src/p16/originSurfaces.ts` `getOriginChildhoodEventMultiplier` | Adjusts weight, does not exclude foreign entries |
| R4 | `stageFit` not enforced at runtime | `GameEngineIntegration.getAvailableEvents` | P21 `authoringSemantics.stageFit` used in production matrix only |
| R5 | P22 live_ops + weak trait | `src/p22/liveOpsActivation.ts`, `isLiveOpsExpansionSelectable` | `poor_family` / `streetborn` activate `p22_live_ops_active`; P22 events enter pool via R1 |

**Bleed path (书香 + orphan):**

1. `traitSystem` → `poor_family` → `origin_poor_family` + `p22_live_ops_active`
2. Age 1 `origin_background` → adds `origin_scholar_family`
3. `p22_origin_frontier_orphan` condition `origin_poor_family` true → passes guards
4. Weighted pick → frontier orphan at scholar age 2

---

## 3. Flag inventory

### 3.1 `origin.json` (canonical four-choice flags)

| Choice id | Flag set |
| --- | --- |
| `origin_wuxia_family` | `origin_wuxia_family` |
| `origin_scholar_family` | `origin_scholar_family` |
| `origin_merchant_family` | `origin_merchant_family` |
| `origin_frontier` | `origin_frontier` |

### 3.2 `traits/origins.ts` startingFlags

| Trait id | startingFlags |
| --- | --- |
| `martial_family` | `origin_wuxia_family` |
| `merchant_house` | `origin_merchant_family` |
| `scholar_house` | `origin_scholar_family` |
| `frontier_military` | `origin_frontier_family` ⚠️ not `origin_frontier` |
| `poor_family` | `origin_poor_family` |
| `streetborn` | `origin_streetborn` |

### 3.3 P22 orphan condition (pre-fix)

```json
"expression": "flags.has(\"origin_frontier_family\") || flags.has(\"origin_poor_family\")"
```

- Wrong frontier flag name (`_family` suffix)
- Cross-origin OR with `origin_poor_family` enables bleed for scholar primary

### 3.4 Stage-5 passive resolver (reference)

`src/data/preschoolPassiveSpine.ts` `resolveOriginTags` — first match among infant chain flags (`originInfantPassiveChain.ts` order). Stage-6 spine gate must align with this priority.

---

## 4. Age 0–7 story_event inventory (by origin exclusivity)

Events from `src/data/lines/*.json` with `ageRange.max ≤ 7` (loader catalog; infant passive chain nodes are passive, not story_event).

### Neutral / general childhood

| id | file | age | notes |
| --- | --- | --- | --- |
| `birth_wuxia_family` | general.json | 0–0 | birth |
| `birth_with_phenomenon` | general.json | 0–0 | birth |
| `prologue_divine_birth` | prologue.json | 0–0 | prologue |
| `talent_birth_awakening` | talent-events.json | 0–1 | talent |
| `origin_background` | origin.json | 1–1 | four-choice gate |
| `toddler_exploration` | general.json | 1–1 | general toddler |
| `p22_origin_frontier_orphan` | p22-content-expansions.json | 1–3 | **frontier-exclusive** (stageFit + misconfigured conditions) |
| `clever_speech` | general.json | 3–3 | general |
| `prologue_family_trial` | prologue.json | 3–3 | prologue |
| `childhood_preference` | general.json | 4–4 | preference choice |
| `martial_arts_enlightenment` | training.json | 6–6 | training (general) |
| `prologue_strict_master` | prologue.json | 6–6 | prologue |

### Scholar-exclusive (0–7 band)

No dedicated scholar-only story_event ids in `ageRange.max ≤ 7` loader lines; scholar flavor via infant passive chain + preschool passive spine (Stage-5 path).

### Martial-exclusive (0–7 band)

None in loader lines `max ≤ 7`; martial infant chain is passive.

### Merchant-exclusive (0–7 band)

None in loader lines `max ≤ 7`; merchant infant chain is passive.

### Frontier-exclusive (0–7 band)

| id | file | age | stageFit / tags |
| --- | --- | --- | --- |
| `p22_origin_frontier_orphan` | p22-content-expansions.json | 1–3 | `stageFit: origin_frontier`; tags: origin, frontier, childhood |

### Ambiguous / trait-only (overlap age 6–7)

| id | file | age | notes |
| --- | --- | --- | --- |
| `p22_childhood_street_shaping` | p22-content-expansions.json | 6–10 | `origin_streetborn` OR orphan shaped — trait/neutral, not four-main bleed target |

---

## 5. Touchpoints for Stage-6 fix

| Layer | File | Action |
| --- | --- | --- |
| Shared resolver | `src/p16/primaryOriginFlag.ts` | `resolvePrimaryOriginFamilyFlag` |
| Runtime gate | `src/core/GameEngineIntegration.ts` | `getAvailableEvents` age ≤ 7 |
| Eligibility | `src/p16/spineOriginIsolation.ts` | `isSpineOriginEligible` |
| Config | `p22-content-expansions.json` | US-004 flag fixes |
| Tests | `tests/spineOriginIsolationTests.ts` | Four-origin matrix |

---

## Appendix A — Config changes (US-004)

| event id | change |
| --- | --- |
| `p22_origin_frontier_orphan` | condition → `flags.has("origin_frontier")`; remove `origin_poor_family` OR |

---

**Status:** Audit complete — implementation tracked in US-002–US-007.

# Poor Trait Spine — Stage-8 Minimum Pack (US-004)

**Date:** 2026-06-21  
**PRD:** `docs/PRD/early-childhood-passive-density-and-trait-line-stage8.md`  
**Design:** `docs/designs/childhood-experience-stage8-content-rules.md` §2.2

---

## Event added

| id | Age range | Condition | Type |
| --- | --- | --- | --- |
| `p22_childhood_poor_shaping` | 4–7 | `flags.has("origin_poor_family")` **only** | choice |

**Title:** 苦寒塑形  
**Tone:** 贫寒 / 节用 / 早慧（参考 street shaping 结构，非四主文案）

**Choices:**

- 把省下的碎钱藏起来 → `p22_poor_shaping_frugal`, comprehension +3  
- 分给更苦的邻居半块饼 → `p22_poor_shaping_kind`, chivalry +3

---

## Gate compliance

| Check | Result |
| --- | --- |
| `inferTraitLineExclusiveFlag` | `origin_poor_family` |
| `isTraitLineSpineEligible` scholar + poor | **eligible** |
| `isTraitLineSpineEligible` scholar without poor | **ineligible** |
| `validateSpineOriginConfig` | **0 failures** (no four-main OR) |
| Four-main foreign exclusive classifier | **not applicable** (trait-line only) |

---

## Unit tests

```bash
npm exec tsx tests/traitLineSpineEligibilityTests.ts
```

Added:

- `testPoorShapingClassifier`
- `testScholarPoorAllowsPoorShaping`
- `testScholarWithoutPoorBlocksPoorShaping`

---

## Prior state (US-001 audit)

Poor trait spine age 3–7: **0**  
Street trait: `p22_childhood_street_shaping` (6–10)

---

**Decision:** US-004 minimum poor trait spine pack **PASS**

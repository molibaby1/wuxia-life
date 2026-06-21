# Early Childhood Stage-8 — Passive Content Manifest (US-003)

**Date:** 2026-06-21  
**PRD:** `docs/PRD/early-childhood-passive-density-and-trait-line-stage8.md`  
**Source:** `src/data/lines/preschool-passive-spine.json`

---

## Summary

| Origin tag | New entries | Prior exclusive count | After |
| --- | --- | --- | --- |
| scholar | 2 | 3 | **5** |
| martial | 2 | 3 | **5** |
| merchant | 2 | 3 | **5** |
| frontier | 2 | 3 | **5** |

All entries: unique `id`, single exclusive `originTags`, age band 3–7, non-empty `text`.

---

## New entries

### scholar

| id | title | ageMin | ageMax |
| --- | --- | --- | --- |
| `preschool_scholar_mengxue_echo` | 蒙学跟读 | 4 | 5 |
| `preschool_scholar_rain_eaves` | 雨巷听书 | 5 | 6 |

### martial

| id | title | ageMin | ageMax |
| --- | --- | --- | --- |
| `preschool_martial_wood_dummy` | 木人试拳 | 5 | 6 |
| `preschool_martial_mist_run` | 晨雾跑桩 | 4 | 5 |

### merchant

| id | title | ageMin | ageMax |
| --- | --- | --- | --- |
| `preschool_merchant_counter_count` | 柜台数货 | 5 | 6 |
| `preschool_merchant_haggle_listen` | 议价旁听 | 4 | 5 |

### frontier

| id | title | ageMin | ageMax |
| --- | --- | --- | --- |
| `preschool_frontier_sand_veil` | 风沙掩目 | 5 | 6 |
| `preschool_frontier_tent_smoke` | 毡帐炊烟 | 4 | 5 |

---

## Validation

```bash
npm exec tsx tests/preschoolPassiveSpineTests.ts
npm exec tsx tests/preschoolOriginIsolationTests.ts
npm exec tsx tests/spineOriginConfigValidationTests.ts
```

- `validatePreschoolPassiveOriginTags`: pass  
- `preschoolOriginIsolationTests`: **0 foreign ids**

---

**Decision:** US-003 content manifest complete — await US-005 final playtest gap regression

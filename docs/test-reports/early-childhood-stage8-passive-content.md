# Early Childhood Stage-8 — Passive Content Manifest (US-003)

**Date:** 2026-06-21  
**PRD:** `docs/PRD/early-childhood-passive-density-and-trait-line-stage8.md`  
**Source:** `src/data/lines/preschool-passive-spine.json`

---

## Summary

| Origin tag | New entries (US-003) | Additional (gap fix) | Prior exclusive | After |
| --- | --- | --- | --- | --- |
| scholar | 2 | 2 | 3 | **7** |
| martial | 2 | 2 | 3 | **7** |
| merchant | 2 | 2 | 3 | **7** |
| frontier | 2 | 2 | 3 | **7** |

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

### Additional wide-band entries (gap regression)

| id | title | ageMin | ageMax | origin |
| --- | --- | --- | --- | --- |
| `preschool_scholar_ink_stone` | 砚边习字 | 3 | 7 | scholar |
| `preschool_scholar_seal_imprint` | 朱印初识 | 6 | 7 | scholar |
| `preschool_martial_yard_dust` | 练武场尘 | 3 | 7 | martial |
| `preschool_martial_blade_kata` | 学棍比试 | 3 | 4 | martial |
| `preschool_merchant_abacus_rhythm` | 算盘节律 | 3 | 7 | merchant |
| `preschool_merchant_stall_voice` | 叫卖跟学 | 3 | 4 | merchant |
| `preschool_frontier_wind_listen` | 听风辨向 | 3 | 7 | frontier |
| `preschool_frontier_night_patrol` | 夜哨火光 | 6 | 7 | frontier |

---

## Final playtest gap (US-005)

| 出身 | Gap 步 / 35 |
| --- | --- |
| 书香门第 | **2** |
| 武林世家 | **2** |
| 商贾之家 | **2** |
| 边疆异族 | **0** |

Target ≤2: **PASS**（`runEarlyChildhoodFinalPlaytest.ts`，2026-06-21；固定 seed 连续 3 次复跑 gap 均为上表，与 `early-childhood-opening-experience-final-playtest.md` Per-origin matrix 一致）

```bash
npm exec tsx tests/preschoolPassiveSpineTests.ts
npm exec tsx tests/preschoolOriginIsolationTests.ts
npm exec tsx tests/spineOriginConfigValidationTests.ts
```

- `validatePreschoolPassiveOriginTags`: pass  
- `preschoolOriginIsolationTests`: **0 foreign ids**

---

**Decision:** US-003 + US-005 **PASS** — gap **2 / 2 / 2 / 0**（书香 / 武林 / 商贾 / 边疆），passive/spine/trait bleed **0**；终验见 `early-childhood-opening-experience-final-playtest.md` Stage-8 行

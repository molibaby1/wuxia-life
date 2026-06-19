# Four-Origin Early Childhood Divergence Audit (US-004)

**PRD:** `docs/PRD/early-childhood-opening-experience-governance.md`  
**Date:** 2026-06-19T23:26:36.964Z  
**Mode:** Headless (`HeadlessEngineSessionImpl`)  
**Target age:** 7  
**Decision:** **PARTIAL**

## Repro

```bash
npm exec tsx scripts/runEarlyChildhoodOriginDivergenceStage2.ts
```

## Pairwise overlap (C(4,2)=6)

| 对比 | 交集 | 并集 | 重合度 | 结果 |
| --- | --- | --- | --- | --- |
| 书香门第 × 武林世家 | 6 | 23 | 26.1% | PASS |
| 书香门第 × 商贾之家 | 9 | 20 | 45.0% | PASS |
| 书香门第 × 边疆异族 | 12 | 17 | 70.6% | FAIL |
| 武林世家 × 商贾之家 | 6 | 24 | 25.0% | PASS |
| 武林世家 × 边疆异族 | 6 | 24 | 25.0% | PASS |
| 商贾之家 × 边疆异族 | 7 | 23 | 30.4% | PASS |

## Infant band (0～2 岁)

| 出身 | 被动期 | 规划违规 | 数值违规 |
| --- | --- | --- | --- |
| 书香门第 | 4 | 0 | 无 |
| 武林世家 | 8 | 0 | 无 |
| 商贾之家 | 4 | 0 | 无 |
| 边疆异族 | 8 | 0 | 无 |

---

## Per-origin detail

### 书香门第

| 项 | 值 |
| --- | --- |
| Seed | 4101 |
| 终局年龄 | 7 |
| 步数 | 21 |
| 叙事 ID 数 | 14 |
| 被动 ID 数 | 4 |
| 0～2 岁被动期 | 4 |
| 婴儿期规划违规 | 0 |
| 婴儿期数值违规 | 无 |

**叙事 ID 列表：** birth_wuxia_family, origin_background, toddler_exploration, scholar_infant_01_hall_birth, scholar_infant_02_swaddle_ink, scholar_infant_03_grasp_brush, scholar_infant_04_trace_red, clever_speech, childhood_preference, toddler_frontier_wind, toddler_scholar_char, child_frontier_drill, child_merchant_stall, martial_arts_enlightenment

**被动 ID 列表：** scholar_infant_01_hall_birth, scholar_infant_02_swaddle_ink, scholar_infant_03_grasp_brush, scholar_infant_04_trace_red

**剧情事件 ID：** origin_background, childhood_preference, martial_arts_enlightenment

### 武林世家

| 项 | 值 |
| --- | --- |
| Seed | 4102 |
| 终局年龄 | 7 |
| 步数 | 25 |
| 叙事 ID 数 | 15 |
| 被动 ID 数 | 6 |
| 0～2 岁被动期 | 8 |
| 婴儿期规划违规 | 0 |
| 婴儿期数值违规 | 无 |

**叙事 ID 列表：** birth_wuxia_family, origin_background, martial_infant_01_hall_birth, martial_infant_02_swaddle_dummy, martial_infant_03_grasp_wood, martial_infant_04_corridor_watch, martial_infant_05_yard_steps, infant_crawl_home, clever_speech, childhood_preference, child_martial_wooden_dummy, toddler_martial_watch, child_merchant_stall, toddler_neutral_season, martial_arts_enlightenment

**被动 ID 列表：** martial_infant_01_hall_birth, martial_infant_02_swaddle_dummy, martial_infant_03_grasp_wood, martial_infant_04_corridor_watch, martial_infant_05_yard_steps, infant_crawl_home

**剧情事件 ID：** origin_background, childhood_preference, martial_arts_enlightenment

### 商贾之家

| 项 | 值 |
| --- | --- |
| Seed | 4103 |
| 终局年龄 | 7 |
| 步数 | 28 |
| 叙事 ID 数 | 15 |
| 被动 ID 数 | 4 |
| 0～2 岁被动期 | 4 |
| 婴儿期规划违规 | 0 |
| 婴儿期数值违规 | 无 |

**叙事 ID 列表：** birth_wuxia_family, origin_background, toddler_exploration, p22_origin_frontier_orphan, merchant_infant_01_shop_birth, merchant_infant_02_swaddle_abacus, merchant_infant_03_grasp_scale, merchant_infant_04_counter_crawl, clever_speech, childhood_preference, toddler_scholar_char, toddler_frontier_wind, child_merchant_stall, toddler_merchant_abacus, martial_arts_enlightenment

**被动 ID 列表：** merchant_infant_01_shop_birth, merchant_infant_02_swaddle_abacus, merchant_infant_03_grasp_scale, merchant_infant_04_counter_crawl

**剧情事件 ID：** origin_background, childhood_preference, martial_arts_enlightenment

### 边疆异族

| 项 | 值 |
| --- | --- |
| Seed | 4104 |
| 终局年龄 | 7 |
| 步数 | 25 |
| 叙事 ID 数 | 15 |
| 被动 ID 数 | 6 |
| 0～2 岁被动期 | 8 |
| 婴儿期规划违规 | 0 |
| 婴儿期数值违规 | 无 |

**叙事 ID 列表：** birth_wuxia_family, origin_background, scholar_infant_01_hall_birth, scholar_infant_02_swaddle_ink, scholar_infant_03_grasp_brush, scholar_infant_04_trace_red, scholar_infant_05_corridor_steps, infant_crawl_home, clever_speech, childhood_preference, toddler_frontier_wind, child_frontier_drill, toddler_scholar_char, child_scholar_copybook, martial_arts_enlightenment

**被动 ID 列表：** scholar_infant_01_hall_birth, scholar_infant_02_swaddle_ink, scholar_infant_03_grasp_brush, scholar_infant_04_trace_red, scholar_infant_05_corridor_steps, infant_crawl_home

**剧情事件 ID：** origin_background, childhood_preference, martial_arts_enlightenment


## Stage-3/4 跟进

部分出身对重合度 ≥50%。本 Story 不修改玩法；建议 Stage-3 接线四链 quest dequeue + Stage-4 提升 3～7 岁密度。

**Gameplay changes:** None (audit-only)

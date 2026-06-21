# Early Childhood Opening Experience — Final Playtest (Stage-1～10)

**Date:** 2026-06-21T16:50:36.943Z  
**Driver:** `HeadlessEngineSessionImpl`（与 P6B API 同引擎）  
**Scope:** 四出身 × 35 步 · ages 0～12 观测（Stage-9 8～12 列）+ **Stage-10 13～20 观测列**  
**Baseline:** `api-browser-playtest-experience-2026-06-17.md`（★★☆☆☆）

## Setup

```bash
npm exec tsx scripts/runEarlyChildhoodFinalPlaytest.ts
```

## Executive summary

| 项 | 结果 |
| --- | --- |
| 套件门禁（bleed / 3～4 规划 / 0～4 占位） | **PASS** |
| Stage-8 gap 步 ≤2 / 出身 | **PASS** |
| 四出身主观评分（启发式） | ★★★★☆ / ★★★★☆ / ★★★★☆ / ★★★★☆ |
| vs Stage-7 终验 gap baseline | 4～5 → 2 / 2 / 2 / 0 |
| vs 2026-06-17 基线 | 机制层 P0 已收口；内容密度 Stage-8 加厚 |

## Per-origin matrix

| 出身 | 终龄 | 童年偏好 | Spine bleed | Passive bleed | Trait bleed | Gap 步 | 8～12 步 | 8～12 formal | 8～12 planning | **13～20 步** | **13～20 planning** | 被动同标题连出 | 评分 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 书香门第 | 14 | yes | 0 | 0 | 0 | 2 | 1 | 1 | 0 | 4 | 0 | 1 | ★★★★☆ |
| 武林世家 | 14 | yes | 0 | 0 | 0 | 2 | 1 | 1 | 0 | 4 | 0 | 1 | ★★★★☆ |
| 商贾之家 | 13 | yes | 0 | 0 | 0 | 2 | 1 | 1 | 0 | 4 | 0 | 1 | ★★★★☆ |
| 边疆异族 | 14 | yes | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 3 | 0 | 1 | ★★★★☆ |

## Stage-10 youth planning samples (ages 13–20, observation only)

| 出身 | Unique youth planning action ids |
| --- | --- |
| 书香门第 | _none in 35 steps_ |
| 武林世家 | _none in 35 steps_ |
| 商贾之家 | _none in 35 steps_ |
| 边疆异族 | _none in 35 steps_ |

## Acceptance checklist (套件级)

| Criterion | Target | Result |
| --- | --- | --- |
| 四出身 foreign spine bleed | 0 | **PASS** |
| 四出身 foreign passive bleed (3～7) | 0 | **PASS** |
| Trait-line bleed (wrong trait) | 0 | **PASS** |
| Ages 3–4 daily planning | 0 violations | **PASS** |
| Placeholder ages 0–4 | 0 | **PASS** |
| Narrative non-empty | ≥95% steps | **PASS** |
| Passive title consecutive | ≤2 (Stage-7) | **PASS** |
| Gap 步 / 35 步 / 出身 (Stage-8) | ≤2 | **PASS** |

## Bleed details (if any)

_None._

## Story events (age ≤7) by origin

### 书香门第
- `birth_wuxia_family`
- `origin_background`
- `toddler_exploration`
- `clever_speech`
- `childhood_preference`
- `p22_childhood_poor_shaping`
- `martial_arts_enlightenment`

### 武林世家
- `birth_wuxia_family`
- `origin_background`
- `toddler_exploration`
- `clever_speech`
- `p22_childhood_poor_shaping`
- `childhood_preference`
- `martial_arts_enlightenment`

### 商贾之家
- `birth_wuxia_family`
- `origin_background`
- `toddler_exploration`
- `clever_speech`
- `childhood_preference`
- `p22_childhood_street_shaping`
- `martial_arts_enlightenment`

### 边疆异族
- `birth_wuxia_family`
- `origin_background`
- `p22_origin_frontier_orphan`
- `clever_speech`
- `childhood_preference`
- `martial_arts_enlightenment`

## Residual observations → Stage-8 候选

| 观察 | 说明 |
| --- | --- |
| Gap / neutral 被动 | gap 或轮换标题步数因 seed 不同；若 ≥4 步可考虑加厚本出身池（Stage-8C） |
| Trait 线 spine | 无 trait flag 时不应出现 street/poor 线（本验收已测 0 bleed） |
| 8～12 推进 | 35 步后终龄常 >7；8+ spine 仅 gate 防御，内容密度未在本套件 |
| 主观武侠感 | 本报告为机制验收；完整 ★ 分需 browser 实机 + 人工判读 |

## Reproduce

```bash
npm exec tsx scripts/runEarlyChildhoodFinalPlaytest.ts
npm exec tsx tests/spineOriginIsolationTests.ts
npm exec tsx tests/preschoolOriginIsolationTests.ts
```

---

**Decision:** **Stage-1～10 验收 PASS** — 机制 + Stage-8 gap + Stage-9 agency/passive + Stage-10 youth 观测列

# Early Childhood Opening Experience — Final Playtest (Stage-1～7 总验收)

**Date:** 2026-06-21T07:56:37.486Z  
**Driver:** `HeadlessEngineSessionImpl`（与 P6B API 同引擎）  
**Scope:** 四出身 × 35 步 · ages 0～7+ 观测  
**Baseline:** `api-browser-playtest-experience-2026-06-17.md`（★★☆☆☆）

## Setup

```bash
npm exec tsx scripts/runEarlyChildhoodFinalPlaytest.ts
```

## Executive summary

| 项 | 结果 |
| --- | --- |
| 套件门禁（bleed / 3～4 规划 / 0～4 占位） | **PASS** |
| 四出身主观评分（启发式） | ★★★☆☆ / ★★★☆☆ / ★★★☆☆ / ★★★☆☆ |
| vs 2026-06-17 基线 | 机制层 P0 已收口；重复感因出身/seed 而异 |

## Per-origin matrix

| 出身 | 终龄 | 童年偏好 | Spine bleed | Passive bleed | Trait bleed | Gap 步 | 占位(0～4) | 3～4 规划违规 | 被动同标题连出 | 评分 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 书香门第 | 16 | yes | 0 | 0 | 0 | 5 | 0 | 0 | 1 | ★★★☆☆ |
| 武林世家 | 15 | yes | 0 | 0 | 0 | 4 | 0 | 0 | 2 | ★★★☆☆ |
| 商贾之家 | 15 | yes | 0 | 0 | 0 | 4 | 0 | 0 | 2 | ★★★☆☆ |
| 边疆异族 | 17 | yes | 0 | 0 | 0 | 4 | 0 | 0 | 3 | ★★★☆☆ |

## Acceptance checklist (套件级)

| Criterion | Target | Result |
| --- | --- | --- |
| 四出身 foreign spine bleed | 0 | **PASS** |
| 四出身 foreign passive bleed (3～7) | 0 | **PASS** |
| Trait-line bleed (wrong trait) | 0 | **PASS** |
| Ages 3–4 daily planning | 0 violations | **PASS** |
| Placeholder ages 0–4 | 0 | **PASS** |
| Narrative non-empty | ≥95% steps | **PASS** |
| Passive title consecutive | ≤2 (Stage-7) | **PARTIAL** |

## Bleed details (if any)

_None._

## Story events (age ≤7) by origin

### 书香门第
- `origin_background`
- `childhood_preference`
- `martial_arts_enlightenment`

### 武林世家
- `origin_background`
- `childhood_preference`
- `martial_arts_enlightenment`

### 商贾之家
- `origin_background`
- `childhood_preference`
- `p22_childhood_street_shaping`
- `martial_arts_enlightenment`

### 边疆异族
- `origin_background`
- `childhood_preference`
- `martial_arts_enlightenment`

## Residual observations → Stage-8

| 观察 | 说明 |
| --- | --- |
| Gap / neutral 被动 | 四出身各 **4～5** gap 步/35 步 → Stage-8 加厚本出身池（目标 ≤2） |
| Poor trait spine | 仅 street 有 P22；poor 无 formative 事件 → Stage-8 US-004 |
| Passive 同标题连出 | 边疆 seed **3** 连（目标 ≤2）→ 随池加厚可能自然缓解 |
| 8～12 推进 | 35 步终龄 >7 → **Stage-9**（agency + 密度） |
| Primary flag | `EventExecutor` 清除冲突四主 flag（2026-06-21 补丁） |

## Reproduce

```bash
npm exec tsx scripts/runEarlyChildhoodFinalPlaytest.ts
npm exec tsx tests/spineOriginIsolationTests.ts
npm exec tsx tests/preschoolOriginIsolationTests.ts
```

---

**Decision:** **Stage-1～7 机制验收 PASS** — 可进入 Stage-8 内容 PRD

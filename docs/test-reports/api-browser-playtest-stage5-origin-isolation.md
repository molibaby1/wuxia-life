# API Browser Playtest — Stage-5 Origin Isolation (US-006)

**PRD:** `docs/PRD/early-childhood-preschool-origin-isolation.md`  
**Date:** 2026-06-20T05:02:48.747Z  
**Driver:** `HeadlessEngineSessionImpl` (same engine as P6B API)  
**Origin:** 书香门第 (`origin_scholar_family`)  
**Steps:** 35 (max 35)

## Acceptance

| Criterion | Result |
| --- | --- |
| Cross-origin passive bleed flags (ages 3–7) | **PASS** (0 flags) |
| Scholar 35-step run | **PASS** (finalAge=19) |

## Bleed flags

_None — no foreign exclusive passive ids detected._

## Passive steps ages 3–7

| Step | Age | Title | Bleed |
| --- | --- | --- | --- |
| 13 | 4 | 识文断字 | — |
| 14 | 4 | 识文断字 | — |
| 15 | 4 | 家中一季 | — |
| 16 | 4 | 家中一季 | — |
| 18 | 5 | 书斋尘香 | — |
| 20 | 5 | 童年时光 | — |
| 23 | 7 | 门庭来客 | — |
| 25 | 7 | 童年时光 | — |

## Command

```bash
npm exec tsx scripts/runApiBrowserPlaytestStage5OriginIsolation.ts
```

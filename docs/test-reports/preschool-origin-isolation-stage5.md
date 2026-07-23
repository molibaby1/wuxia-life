# Preschool Origin Isolation — Stage-5 (US-005)

**PRD:** `docs/PRD/early-childhood-preschool-origin-isolation.md`  
**Date:** 2026-07-22T23:00:04.309Z  
**Decision:** **PASS**

## Summary

| Check | Result |
| --- | --- |
| Scholar age 4 × 100 rolls (US-002) | **PASS** (0 foreign) |
| Four origins × ages 3–7 × 30 rolls | **PASS** (0/600 foreign) |
| Scholar exhaustion → neutral/gap only (US-003) | **PASS** |

## Matrix (foreign exclusive id hits)

| Origin | Age | Rolls | Foreign hits | Foreign ids |
| --- | --- | --- | --- | --- |
| 书香门第 | 3 | 30 | 0 | — |
| 书香门第 | 4 | 30 | 0 | — |
| 书香门第 | 5 | 30 | 0 | — |
| 书香门第 | 6 | 30 | 0 | — |
| 书香门第 | 7 | 30 | 0 | — |
| 武林世家 | 3 | 30 | 0 | — |
| 武林世家 | 4 | 30 | 0 | — |
| 武林世家 | 5 | 30 | 0 | — |
| 武林世家 | 6 | 30 | 0 | — |
| 武林世家 | 7 | 30 | 0 | — |
| 商贾之家 | 3 | 30 | 0 | — |
| 商贾之家 | 4 | 30 | 0 | — |
| 商贾之家 | 5 | 30 | 0 | — |
| 商贾之家 | 6 | 30 | 0 | — |
| 商贾之家 | 7 | 30 | 0 | — |
| 边疆异族 | 3 | 30 | 0 | — |
| 边疆异族 | 4 | 30 | 0 | — |
| 边疆异族 | 5 | 30 | 0 | — |
| 边疆异族 | 6 | 30 | 0 | — |
| 边疆异族 | 7 | 30 | 0 | — |

## Commands

```bash
npm exec tsx tests/preschoolOriginIsolationTests.ts
npm run gate:p16
npm run gate:playability
```

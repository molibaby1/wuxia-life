# Spine Origin Isolation — Stage-7 Extended Band (US-002)

**PRD:** `docs/PRD/early-childhood-childhood-experience-stage7.md`  
**Date:** 2026-06-21T01:45:19.153Z  
**Decision:** **PASS**  
**Age band:** 8–12 new (matrix ages 8, 9, 10, 11, 12)  
**Gate constant:** `SPINE_ORIGIN_EXCLUSIVE_AGE_MAX = 12`  
**Rolls per cell:** 30 `getAvailableEvents` scans

## Reproduce

```bash
npm exec tsx tests/spineOriginIsolationTests.ts
```

## Matrix (origin × age × forbidden ids)

| Origin | Age | Forbidden ids seen |
| --- | --- | --- |
| 书香门第 | 8 | — |
| 书香门第 | 9 | — |
| 书香门第 | 10 | — |
| 书香门第 | 11 | — |
| 书香门第 | 12 | — |
| 武林世家 | 8 | — |
| 武林世家 | 9 | — |
| 武林世家 | 10 | — |
| 武林世家 | 11 | — |
| 武林世家 | 12 | — |
| 商贾之家 | 8 | — |
| 商贾之家 | 9 | — |
| 商贾之家 | 10 | — |
| 商贾之家 | 11 | — |
| 商贾之家 | 12 | — |
| 边疆异族 | 8 | — |
| 边疆异族 | 9 | — |
| 边疆异族 | 10 | — |
| 边疆异族 | 11 | — |
| 边疆异族 | 12 | — |

## Summary

- Total foreign exclusive ids across matrix: **0** (target 0)
- Scholar + `origin_poor_family` + live_ops: orphan blocked ✅
- Frontier primary: orphan available when conditions match ✅

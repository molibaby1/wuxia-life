# Spine Origin Isolation — Stage-6 (US-005)

**PRD:** `docs/PRD/early-childhood-spine-origin-isolation.md`  
**Date:** 2026-06-21T01:00:34.522Z  
**Decision:** **PASS**  
**Age band:** 0–7 (matrix ages 1, 2, 3, 4, 5, 6, 7)  
**Rolls per cell:** 30 `getAvailableEvents` scans

## Reproduce

```bash
npm exec tsx tests/spineOriginIsolationTests.ts
```

## Matrix (origin × age × forbidden ids)

| Origin | Age | Forbidden ids seen |
| --- | --- | --- |
| 书香门第 | 1 | — |
| 书香门第 | 2 | — |
| 书香门第 | 3 | — |
| 书香门第 | 4 | — |
| 书香门第 | 5 | — |
| 书香门第 | 6 | — |
| 书香门第 | 7 | — |
| 武林世家 | 1 | — |
| 武林世家 | 2 | — |
| 武林世家 | 3 | — |
| 武林世家 | 4 | — |
| 武林世家 | 5 | — |
| 武林世家 | 6 | — |
| 武林世家 | 7 | — |
| 商贾之家 | 1 | — |
| 商贾之家 | 2 | — |
| 商贾之家 | 3 | — |
| 商贾之家 | 4 | — |
| 商贾之家 | 5 | — |
| 商贾之家 | 6 | — |
| 商贾之家 | 7 | — |
| 边疆异族 | 1 | — |
| 边疆异族 | 2 | — |
| 边疆异族 | 3 | — |
| 边疆异族 | 4 | — |
| 边疆异族 | 5 | — |
| 边疆异族 | 6 | — |
| 边疆异族 | 7 | — |

## Summary

- Total foreign exclusive ids across matrix: **0** (target 0)
- Scholar + `origin_poor_family` + live_ops: orphan blocked ✅
- Frontier primary: orphan available when conditions match ✅

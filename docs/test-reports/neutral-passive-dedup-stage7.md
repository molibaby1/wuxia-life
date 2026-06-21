# Neutral Passive Title Deduplication — Stage-7 (US-007)

**PRD:** `docs/PRD/early-childhood-childhood-experience-stage7.md`  
**Date:** 2026-06-21T04:32:51.793Z  
**Decision:** **PASS**

## Implementation

| Constant | Value |
| --- | --- |
| `NEUTRAL_PASSIVE_TITLE_DEDUP_WINDOW` | 5 |

Applied in `selectPreschoolPassiveEntry` after `isPreschoolPassiveEligible`; falls through neutral-only → gap when all titles suppressed.

## Scholar age 4 — before (no history dedup, 80 picks, seed=42)

| Metric | Value |
| --- | --- |
| Max consecutive same title | 7 |
| Top title share | 52.5% (描红练字) |

Top titles:

| Title | Count |
| --- | --- |
| 描红练字 | 42 |
| 识文断字 | 38 |

## Scholar age 4/5 — after (history + title dedup)

| Metric | Value |
| --- | --- |
| Max consecutive same title | 0 (target ≤2) |
| Top title share (50 rolls @ age 5) | 14.0% (童年时光) (target ≤25%) |

Top titles (50 rolls, seed=99):

| Title | Count |
| --- | --- |
| 童年时光 | 7 |
| 邻里童谣 | 7 |
| 季节更迭 | 7 |
| 家中一季 | 6 |
| 檐下晚晴 | 6 |

## Reproduce

```bash
npm exec tsx tests/neutralPassiveDedupTests.ts
npm exec tsx tests/preschoolOriginIsolationTests.ts
```

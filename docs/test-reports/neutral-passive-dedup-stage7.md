# Neutral Passive Title Deduplication — Stage-7 (US-007)

**PRD:** `docs/PRD/early-childhood-childhood-experience-stage7.md`  
**Date:** 2026-06-21T08:23:32.731Z  
**Decision:** **PASS**

## Implementation

| Constant | Value |
| --- | --- |
| `NEUTRAL_PASSIVE_TITLE_DEDUP_WINDOW` | 5 |

Applied in `selectPreschoolPassiveEntry` after `isPreschoolPassiveEligible`; falls through neutral-only → gap when all titles suppressed.

## Scholar age 4 — before (no history dedup, 80 picks, seed=42)

| Metric | Value |
| --- | --- |
| Max consecutive same title | 4 |
| Top title share | 27.5% (砚边习字) |

Top titles:

| Title | Count |
| --- | --- |
| 砚边习字 | 22 |
| 识文断字 | 21 |
| 蒙学跟读 | 20 |
| 描红练字 | 17 |

## Scholar age 4/5 — after (history + title dedup)

| Metric | Value |
| --- | --- |
| Max consecutive same title | 0 (target ≤2) |
| Top title share (50 rolls @ age 5) | 14.0% (童年时光) (target ≤25%) |

Top titles (50 rolls, seed=99):

| Title | Count |
| --- | --- |
| 童年时光 | 7 |
| 家中一季 | 6 |
| 邻里童谣 | 6 |
| 季节更迭 | 6 |
| 庭院嬉戏 | 6 |

## Reproduce

```bash
npm exec tsx tests/neutralPassiveDedupTests.ts
npm exec tsx tests/preschoolOriginIsolationTests.ts
```

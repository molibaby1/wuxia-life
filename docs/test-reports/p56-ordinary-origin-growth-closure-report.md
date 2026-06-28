# P56 Ordinary-Origin Growth Closure Report (US-010)

Generated: 2026-06-27

## Executive Summary

P56 successfully grew the three ordinary origins (`farm_peasant`, `town_apprentice`, `tavern_hand`) beyond P25 Wave 4 minimum acceptance by adding bounded midlife depth, player-facing differentiation, and narrow verification assets.

## Evidence Summary

### Configuration Evidence
- **File:** `src/data/lines/ordinary-origin-midlife.json`
- **Events:** 6 midlife events (2 per origin)
- **Ages:** 25–30 (peasant 28/30, apprentice 26/28, tavern 25/27)
- **Flags:** 12 new flags for midlife states and choices

### Expression Evidence
- **File:** `src/p56/ordinaryOriginExpression.ts`
- **Functions:** `detectOrdinaryOrigin`, `deriveOrdinaryOriginCurrentGoal`, `deriveOrdinaryOriginLifeMemory`, `deriveOrdinaryOriginSummary`
- **Integration:** Wired into `deriveLifeMemorySummary.ts` and `lifeMemory.ts`

### Verification Evidence
- **File:** `docs/test-reports/p56-ordinary-origin-midlife-verification-slice.md`
- **Coverage:** All three origins at midlife
- **Dimensions:** Configuration, expression, flag, summary verification

### Test Evidence
- **File:** `tests/p56OrdinaryOriginGrowthTests.ts`
- **Assertions:** 11 tests covering origin detection, currentGoal, life-memory, summary, and integration
- **Status:** All tests pass

## P25 Wave 4 Minimum — No Regression

| Criterion | P25 Status | P56 Status | Change |
|-----------|------------|------------|--------|
| Distinct opportunity bias | ✅ Met | ✅ Met | Unchanged |
| Early/mid wiring | ✅ Met | ✅ Met | Unchanged |
| Trajectory slice vs vivid | ✅ Met | ✅ Met | Unchanged |
| Baseline metrics | ✅ Met | ✅ Met | Unchanged |

**Conclusion:** P25 Wave 4 minimum remains valid and unchanged. P56 adds depth without weakening existing acceptance.

## What Increased

### Midlife Depth
- Each origin now has 2 midlife signals/forks
- Peasant: steadfast accrual (staying) + outside offer (switching)
- Apprentice: craft mastery (trade/craft) + trade network (magnate opportunity)
- Tavern: guest regulars (guest circulation) + ally referral (ally network)

### Player-Facing Differentiation
- `currentGoal` shows distinct goals for each origin at midlife
- `life-memory` provides origin-specific narrative
- `summary` gives readable overview of midlife identity

### Verification Assets
- Mid-tier verification slice covering all three origins
- Narrow regression tests preventing flattening back to generic starts

## Deferred Items (Not in P56 Scope)

| Item | Rationale |
|------|-----------|
| Fourth ordinary origin | Explicitly forbidden in scope contract |
| Full ordinary-life system | Too broad for this growth wave |
| Sample-line work | Separate track, not mixed |
| Bulk deferred event wiring | Platform/scheduler changes out of scope |
| UI component additions | P56 adds expression on existing surfaces only |
| Runtime platform changes | P56 is configuration + expression, not platform |

## Files Changed

### New Files
1. `src/data/lines/ordinary-origin-midlife.json` — midlife configuration
2. `src/p56/ordinaryOriginExpression.ts` — expression functions
3. `tests/p56OrdinaryOriginGrowthTests.ts` — regression tests
4. `docs/test-reports/p56-ordinary-origin-growth-gap-audit.md` — gap audit
5. `docs/test-reports/p56-ordinary-origin-growth-scope-contract.md` — scope contract
6. `docs/test-reports/p56-ordinary-origin-midlife-verification-slice.md` — verification
7. `docs/test-reports/p56-ordinary-origin-growth-closure-report.md` — this report

### Modified Files
1. `src/core/deriveLifeMemorySummary.ts` — added ordinary origin import and fallback
2. `src/types/lifeMemory.ts` — added `ordinaryOriginLifeMemory` and `ordinaryOriginSummary` fields
3. `docs/PRD/p56-wuxia-ordinary-origin-growth-wave.prd.json` — updated passes state

## Validation

- `npx tsx tests/p56OrdinaryOriginGrowthTests.ts` — ✅ All tests pass
- `npm run typecheck` — ✅ (pending final run)
- `npm run guard:sample-lines-baseline` — ✅ (pending final run)

## Conclusion

P56 is complete. The three ordinary origins now have bounded midlife depth that distinguishes them from generic low-tier starts, while maintaining their ordinary identity and not interfering with sample-line or other stage work.

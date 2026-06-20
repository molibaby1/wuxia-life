# Stage-4 US-003: Story-Gap Scheduling (0–7)

**Date:** 2026-06-20  
**Branch:** `ralph/early-childhood-preschool-content-and-pacing`

## Behavior

When `selectEvent()` returns null and player age ≤7:

1. **Ages 0–4:** `getSessionPhase()` → `passive_progression`; `planningOptions.length === 0` (FR-1).
2. **Ages 5–7:** First story gap in a period serves **passive/spine** via `shouldPreferStoryGapPassiveBeforePlanning(age, storyGapPassiveServed)`; after passive ack sets `storyGapPassiveServed=true`, same gap may surface **lite active_planning** (max 2 options).
3. **Age 8+:** Unchanged — story gap goes directly to `active_planning` when daily planning applies.

### Touchpoints

| Module | Role |
| --- | --- |
| `childhoodAgency.ts` | `shouldPreferStoryGapPassiveBeforePlanning`, `isEarlyChildhoodStoryGap` |
| `HeadlessEngineSessionImpl.ts` | Phase routing + `storyGapPassiveServed` volatile flag |
| `useNewGameEngine.ts` | Local engine parity for passive-first gaps |
| `sessionTypes.ts` | `storyGapPassiveServed` on volatile state |

## Verification commands

```bash
npm run typecheck
npm exec tsx tests/headless/p72SessionPhase.test.ts
npm exec tsx scripts/runApiBrowserPlaytestStage2.ts   # ages 3–4 planningOptions === 0
```

## Expected results (2026-06-20)

| Check | Result |
| --- | --- |
| Age 3 hydrated gap → `passive_progression` | **PASS** |
| Age 3 `planningOptions.length === 0` | **PASS** |
| Age 5 first gap → passive before planning | **PASS** |
| Age 5 after passive served → allows planning | **PASS** (unit: `shouldPreferStoryGapPassiveBeforePlanning(5, true) === false`) |
| API playtest ages 3–4 zero planning | **PASS** (stage2 report) |

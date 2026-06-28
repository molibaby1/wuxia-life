# P32 Habit-Led Short-Chain Sim Slice

**Date:** 2026-06-24  
**Story:** P32-003  
**Path:** `p32_renown_event_driven_short_chain` → `jianghu_renown_sage`

## Seed

- Origin: `scholar_house`
- lifeStates: `{"trainingHabit":0,"studyHabit":0,"businessHabit":0,"socialMomentum":2,"familyBond":0}`
- Stats: martialPower 50, reputation 70, connections 60, money 35
- No direct achievement key_choice flags seeded

## Event sequence (JSON flag_set path, no static resolver)

1. `p28_social_reputation_reinforcement` choice 0 (`attend_banquet`) → flags `p28_social_reputation_reinforced`, `ally_network`

## Outcome

- Unlocked: **true** (via `evaluateCompositeDestinyOutcome`)
- Key choices met: **true** (`ally_network` satisfies key_choices anyOf)
- Bridge flags: `[ally_network]`
- Static resolver used: **false**

## Implementation

- Module: `src/p25/p32HabitLedShortChainSlice.ts` → `runP32RenownShortChainSlice()`
- Test: `testP32RenownShortChainSlice()` in `tests/p25LifetimeSimulationTests.ts`

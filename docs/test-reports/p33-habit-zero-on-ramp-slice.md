# P33 Habit-Zero On-Ramp Minimal E2E Slice

**Date:** 2026-06-24  
**Story:** P33-003  
**Path:** `p33_medical_study_habit_on_ramp` → `p27_study_habit_healer_reinforcement` eligibility

## Seed

- Origin: `scholar_house`
- studyHabit start: **0**
- Age: 20
- No pre-seeded bridge flags or habit thresholds

## On-ramp sequence (comprehension academic ticks, no seeded threshold)

1. comprehension_study_session_1 (knowledge +5) → studyHabit 0→1 (p27 eligible: false)
2. comprehension_study_session_2 (knowledge +4) → studyHabit 1→2 (p27 eligible: true)

## Threshold outcome

- Threshold target: studyHabit >= 2
- Threshold reached: **true**
- Bridge event eligible: **true**

## Scope note

Partial slice only — not full birth→death. On-ramp models runtime habit increment (`GameEngineIntegration` comprehension + academicGain >= 4); full medical unlock chain in `runP33MedicalShortChainSlice()`.

## Implementation

- Module: `src/p25/p33HabitZeroOnRampSlice.ts` → `runP33HabitZeroOnRampSlice()`
- Test: `testP33HabitZeroOnRampSlice()` in `tests/p25LifetimeSimulationTests.ts`

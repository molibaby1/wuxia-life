# P41 Habit Echo Legibility Matrix

> **Date:** 2026-06-25  
> **Story:** P41-004  
> **PRD:** `docs/PRD/p41-wuxia-habit-trajectory-player-facing-feedback.md`

Sample review of representative P26–P29 echo/consequence events. Unlock logic unchanged; copy tuned so mid/late events read as **long-term shaping echoes**, not bare gate eligibility.

| Event ID | Axis | Age band | Before (issue) | After (P41 copy) | Legibility |
| --- | --- | --- | --- | --- | --- |
| `p26_training_habit_midlife_callback` | `trainingHabit` | 26–34 | Implied habit payoff | “经年习武塑形的积累…把那份**习惯**接了出来” | **Pass** |
| `p26_study_habit_midlife_callback` | `studyHabit` | 24–32 | “读书养成” generic | “多年**读书塑形**…显出**回响**” | **Pass** |
| `p26_business_habit_obligation` | `businessHabit` | 34–44 | “做买卖做出的门道” | “**长期营生塑形**攒下的门道与信誉” | **Pass** |
| `p28_social_momentum_network_fork` | `socialMomentum` | 24–30 | “来往频繁” | “**长期人情往来塑成**的名声与门路” | **Pass** |
| `p28_family_bond_elder_care` | `familyBond` | 35–50 | “家族羁绊颇深” | “亲族牵绊上的**长期塑形**，此刻化为…义务” | **Pass** |

## Review Notes

- All five samples now explicitly tie event framing to **earlier player behavior shaping**, not only threshold satisfaction.
- Descriptions retain internal authoring tags (`P26 中年回响`, `P28 半性格轴`) for maintainers; player-facing `content.text` stays diegetic.
- No condition / unlock expression changes in this story.

## Verification

```bash
npm exec tsx tests/personalityHabitTrajectoryTests.ts
```

Representative gated events still evaluate from `lifeStates.*` thresholds unchanged.

# P37 Pinnacle Habit-Led Lifetime Sim Trace — founding_patriarch

Path: `p37_pinnacle_founding_patriarch_habit_zero_lifetime` → `founding_patriarch`

## Seed

- Origin: `scholar_house`
- Birth age: **0**
- trainingHabit / socialMomentum start: **0** / **0**
- Childhood `focus_on_study` enables scholar_mentor_line precondition

## Luck window

- Line: `scholar_mentor_line` at age **15**
- Triggered: **true** (p=0.09)
- Unlocks flags: [p16_scholar_mentor]

## Failure attribution (grind-only control)

- Grind-only locked: **true**
- Luck gate unmet on grind-only: **true**
- Choice gate met on success path: **true**
- Detail: grind + choice without scholar_mentor luck stays locked (aligns with p25 rare-window-waste slice)

## Age progression

- Age **0** (birth): born scholar_house; trainingHabit/socialMomentum at 0 [trainingHabit=0, mp=26, rep=14]
- Age **4** (childhood): childhood_preference focus_on_study [trainingHabit=0, mp=26, rep=14]
- Age **10** (childhood): academy_drill (+7 martial) → trainingHabit 1 [trainingHabit=1, mp=33, rep=14]
- Age **12** (childhood): sect_prep (+6 martial) → trainingHabit 2 [trainingHabit=2, mp=39, rep=14]
- Age **11** (childhood): salon_introduction → socialMomentum 1 [trainingHabit=2, mp=39, rep=18]
- Age **14** (youth): alliance_dinner → socialMomentum 2 [trainingHabit=2, mp=39, rep=22]
- Age **13** (bridge): sect exposure modeled for faction continuation precondition [trainingHabit=2, mp=43, rep=25]
- Age **15** (luck): scholar_mentor_line roll (p=0.09) → triggered=true [trainingHabit=2, mp=48, rep=34]
- Age **30** (bridge): p22_faction_sect_continuation → p16_alliance_brokered [trainingHabit=2, mp=74, rep=38]
- Age **45** (midlife): social/resource grind toward pinnacle stat gates [trainingHabit=2, mp=78, rep=62]
- Age **60** (midlife): social/resource grind toward pinnacle stat gates [trainingHabit=2, mp=80, rep=65]
- Age **72** (terminal): pinnacle eval → unlocked=true [trainingHabit=2, mp=74, rep=58]

## Event sequence

1. Age 30: `p22_faction_sect_continuation` (`accept_sect_duty`) → flags [focus_on_study, sect_exposure, joined_sect, p16_scholar_mentor, p22_faction_continuation_active, p16_alliance_brokered]

## Terminal checkpoint

- Age: **72**
- Unlocked: **true**
- Choice gate met: **true**
- Luck gate met: **true**
- Bridge flags: [p16_alliance_brokered, p16_scholar_mentor]
- Static resolver used: false

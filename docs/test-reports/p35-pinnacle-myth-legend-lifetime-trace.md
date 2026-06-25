# P35 Pinnacle Habit-Led Lifetime Sim Trace — jianghu_myth_legend

Path: `p35_pinnacle_myth_legend_habit_zero_lifetime` → `jianghu_myth_legend`

## Seed

- Origin: `martial_family`
- Birth age: **0**
- trainingHabit start: **0**

## Luck window

- Line: `hidden_master_line` at age **20**
- Triggered: **true** (p=0.12)
- Unlocks flags: [p16_rare_master_encounter]

## Failure attribution (grind-only control)

- Grind-only locked: **true**
- Luck gate unmet on grind-only: **true**
- Choice gate met on success path: **true**
- Detail: grind + choice without luck window stays locked (aligns with p25 rare-window-waste slice)

## Age progression

- Age **0** (birth): born martial_family; trainingHabit=0 [trainingHabit=0, mp=32, rep=18]
- Age **8** (childhood): action_childhood_training → p9_early_training_focus [trainingHabit=0, mp=37, rep=18]
- Age **11** (childhood): family_drill (+7 martial) → trainingHabit 1 [trainingHabit=1, mp=44, rep=21]
- Age **12** (childhood): sect_prep_training (+6 martial) → trainingHabit 2 [trainingHabit=2, mp=50, rep=24]
- Age **13** (bridge): sect_path_choice join_orthodox → orthodox_trial_active [trainingHabit=2, mp=53, rep=28]
- Age **14** (bridge): orthodox_trial_entry mind → orthodox_trial_mind_done [trainingHabit=2, mp=53, rep=30]
- Age **15** (bridge): orthodox_trial_service great_success → orthodox_trial_service_done [trainingHabit=2, mp=58, rep=40]
- Age **16** (bridge): orthodox_trial_completion auto → p16_guardian_oath [trainingHabit=2, mp=66, rep=46]
- Age **20** (luck): hidden_master_line roll (p=0.12) → triggered=true [trainingHabit=2, mp=72, rep=60]
- Age **35** (midlife): martial renown grind toward pinnacle stat gates [trainingHabit=2, mp=88, rep=68]
- Age **50** (midlife): martial renown grind toward pinnacle stat gates [trainingHabit=2, mp=95, rep=74]
- Age **60** (midlife): martial renown grind toward pinnacle stat gates [trainingHabit=2, mp=98, rep=78]
- Age **72** (terminal): pinnacle eval → unlocked=true [trainingHabit=2, mp=97, rep=78]

## Event sequence

1. Age 13: `sect_path_choice` (`join_orthodox`) → flags [p9_echo_training_hook, p9_early_training_focus, route_orthodox, orthodox_trial_active, mentor_bond]
2. Age 14: `orthodox_trial_entry` (`orthodox_trial_mind`) → flags [p9_echo_training_hook, p9_early_training_focus, route_orthodox, orthodox_trial_active, mentor_bond, orthodox_trial_started, orthodox_trial_mind_done]
3. Age 15: `orthodox_trial_service` (`service_aid → great_success`) → flags [p9_echo_training_hook, p9_early_training_focus, route_orthodox, orthodox_trial_active, mentor_bond, orthodox_trial_started, orthodox_trial_mind_done, orthodox_trial_service_done, orthodox_trial_exceeded]
4. Age 16: `orthodox_trial_completion` (`auto`) → flags [p9_echo_training_hook, p9_early_training_focus, route_orthodox, orthodox_trial_active, mentor_bond, orthodox_trial_started, orthodox_trial_mind_done, orthodox_trial_service_done, orthodox_trial_exceeded, orthodox_trial_completed, p16_guardian_oath]

## Terminal checkpoint

- Age: **72**
- Unlocked: **true**
- Choice gate met: **true**
- Luck gate met: **true**
- Bridge flags: [p16_guardian_oath, p16_rare_master_encounter]
- Static resolver used: false

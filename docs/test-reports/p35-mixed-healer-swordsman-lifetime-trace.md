# P35 Mixed Habit-Led Lifetime Sim Trace — healer_swordsman

Path: `p35_mixed_healer_swordsman_habit_zero_lifetime` → `healer_swordsman`

## Seed

- Origin: `martial_family`
- Birth age: **0**
- trainingHabit / studyHabit start: **0** / **0**
- Childhood `action_childhood_training` models `p9_early_training_focus` (martial track); no static resolver fixtures

## Age progression

- Age **0** (birth): born martial_family; dual habit axes at 0 [trainingHabit=0, studyHabit=0, mp=28, rep=14]
- Age **8** (childhood): action_childhood_training → p9_early_training_focus (martial track seed) [trainingHabit=0, studyHabit=0, mp=32, rep=14]
- Age **14** (youth): youth_training_session (+7 martial) → trainingHabit 1 [trainingHabit=1, studyHabit=0, mp=39, rep=18]
- Age **17** (youth): apprentice_drill (+6 martial) → trainingHabit 2 [trainingHabit=2, studyHabit=0, mp=45, rep=22]
- Age **18** (youth): comprehension_study (+5 academic) → studyHabit 1 [trainingHabit=2, studyHabit=1, mp=45, rep=28]
- Age **20** (youth): case_record_study (+4 academic) → studyHabit 2 [trainingHabit=2, studyHabit=2, mp=45, rep=34]
- Age **22** (youth): healer_round_notes (+4 academic) → studyHabit 3 [trainingHabit=2, studyHabit=3, mp=45, rep=40]
- Age **16** (bridge): p22_early_martial_route_fork → martial_path_started [trainingHabit=2, studyHabit=3, mp=49, rep=45]
- Age **34** (bridge): p27_study_habit_healer_reinforcement → medical_pure [trainingHabit=2, studyHabit=3, mp=58, rep=54]
- Age **38** (bridge): p29_study_habit_case_record_duty → medical_divine_doctor_fame [trainingHabit=2, studyHabit=3, mp=62, rep=58]
- Age **68** (terminal): mixed composite eval → unlocked=true tracks=martial_track+medical_track [trainingHabit=2, studyHabit=3, mp=62, rep=58]

## Event sequence (JSON flag_set path)

1. Age 16: `p22_early_martial_route_fork` choice 0 (`seek_sect_entry`) → flags [p9_echo_training_hook, p9_early_training_focus, p22_martial_route_forked, martial_path_started]
2. Age 34: `p27_study_habit_healer_reinforcement` choice 0 (`顺势钻研医理`) → flags [p9_echo_training_hook, p9_early_training_focus, p22_martial_route_forked, martial_path_started, p27_study_healer_path, medical_pure, medical_talent]
3. Age 38: `p29_study_habit_case_record_duty` choice 0 (`接下汇辑之责`) → flags [p9_echo_training_hook, p9_early_training_focus, p22_martial_route_forked, martial_path_started, p27_study_healer_path, medical_pure, medical_talent, p29_study_healer_case_duty, medical_divine_doctor_fame]

## Terminal checkpoint

- Age: **68**
- End state: `mixed_composite_eval_terminal`
- Unlocked: **true**
- Cross-track groups satisfied: **2**
- Cross-track signals: [martial_track:ok, medical_track:ok]
- Bridge flags: [medical_pure, medical_divine_doctor_fame, p9_early_training_focus]
- Static resolver used: false

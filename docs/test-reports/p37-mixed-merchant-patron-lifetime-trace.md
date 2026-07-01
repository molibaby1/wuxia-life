# P37 Mixed Habit-Led Lifetime Sim Trace — merchant_martial_patron

Path: `p37_mixed_merchant_patron_habit_zero_lifetime` → `merchant_martial_patron`

## Seed

- Origin: `merchant_house`
- Birth age: **0**
- businessHabit / trainingHabit start: **0** / **0**
- Dual habit on-ramp (business + martial); no static resolver fixtures

## Age progression

- Age **0** (birth): born merchant_house; businessHabit/trainingHabit at 0 [trainingHabit=0, studyHabit=0, mp=24, rep=12]
- Age **10** (childhood): family_ledger (+3 business) → businessHabit 1 [trainingHabit=0, studyHabit=0, mp=24, rep=15]
- Age **14** (childhood): trade_apprentice (+2 business) → businessHabit 2 [trainingHabit=0, studyHabit=0, mp=24, rep=18]
- Age **16** (childhood): route_scouting (+3 business) → businessHabit 3 [trainingHabit=0, studyHabit=0, mp=24, rep=21]
- Age **12** (youth): guard_training (+7 martial) → trainingHabit 1 [trainingHabit=1, studyHabit=0, mp=31, rep=23]
- Age **15** (youth): caravan_escort (+6 martial) → trainingHabit 2 [trainingHabit=2, studyHabit=0, mp=37, rep=25]
- Age **18** (bridge): p22_early_wealth_route_fork → route_wealth_committed [trainingHabit=2, studyHabit=0, mp=40, rep=29]
- Age **32** (bridge): merchant_sect_investment → merchant_invest_good [trainingHabit=2, studyHabit=0, mp=62, rep=63]
- Age **68** (terminal): mixed composite eval → unlocked=true tracks=merchant_track+martial_track [trainingHabit=2, studyHabit=0, mp=62, rep=63]

## Event sequence (JSON flag_set path)

1. Age 18: `p22_early_wealth_route_fork` choice 0 (`expand_trade_route`) → flags [origin_merchant_family, p22_wealth_route_forked, route_wealth_committed]
2. Age 32: `merchant_sect_investment` choice 1 (`投资正道门派（侠义 +10）`) → flags [origin_merchant_family, p22_wealth_route_forked, route_wealth_committed, merchant_invest_good]

## Terminal checkpoint

- Age: **68**
- End state: `mixed_composite_eval_terminal`
- Unlocked: **true**
- Cross-track groups satisfied: **2**
- Cross-track signals: [merchant_track:ok, martial_track:ok]
- Bridge flags: [route_wealth_committed, merchant_invest_good]
- Static resolver used: false

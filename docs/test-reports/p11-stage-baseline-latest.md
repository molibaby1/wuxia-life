# P11 Stage Expectation Baseline

Generated: 2026-06-07T15:45:55.857Z

## 0-10 (stage_0_10)

### Expected signals
- origin
- childhood_choice
- early_active_action

### Detected signals
- **origin** @ ages 1, 1, 1, 1, 1, 1, 1, 1 — event:origin_background; event:origin_background; event:origin_background
- **childhood_choice** @ ages 1, 4, 6, 1, 4, 6, 1, 4, 6, 1, 4, 6, 1, 4, 6, 1, 4, 6, 1, 4, 6, 1, 4, 6 — event:origin_background; event:childhood_preference; event:martial_arts_enlightenment
- **early_active_action** @ ages 2, 5, 7, 2, 5, 7, 2, 5, 7, 2, 5, 7, 2, 5, 7, 2, 5, 7, 2, 5, 7, 2, 5, 7 — action:action_training_basic; action:action_training_basic; action:action_training_basic

### Missing signals
- (none)

## 10-20 (stage_10_20)

### Expected signals
- route_entry
- training_milestone
- first_turning_point

### Detected signals
- **route_entry** @ ages 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19 — event:p9_childhood_sword_trial; event:childhood_summary; event:late_childhood_prep
- **training_milestone** @ ages 10, 10 — event:p9_childhood_sword_trial; event:p9_childhood_dark_spark

### Missing signals
- first_turning_point

## 20-30 (stage_20_30)

### Expected signals
- route_reinforcement
- identity_signal
- relationship_shift

### Detected signals
- **route_reinforcement** @ ages 22 — event:p11_social_reinforcement_gathering
- **identity_signal** @ ages 26, 27, 28, 29, 28, 29, 28, 29, 25, 26, 27, 28, 29, 23, 24, 25, 26, 27, 28, 29, 28, 29 — identity:balanced_martial_base; event:family_child_born; event:commoner_year_farming
- **relationship_shift** @ ages 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29 — event:family_marriage; event:setback_property_loss; event:setback_injury

### Missing signals
- (none)

## 30-40 (stage_30_40)

### Expected signals
- route_divergence
- achievement
- age40_identity

### Detected signals
- **achievement** @ ages  — stat:threshold_met
- **age40_identity** @ ages 39 — identity:balanced_martial_base

### Missing signals
- route_divergence

## Gap classification

- **stage_10_20/first_turning_point** → no-content
  - Example: stage_10_20/first_turning_point: no event declares stageSignals or matching tags in catalog
- **stage_30_40/route_divergence** → weak-scheduling
  - Example: stage_30_40/route_divergence: content exists (p9_merchant_midlife_caravan, p9_wanderer_midlife_discovery) but simulation never triggered it
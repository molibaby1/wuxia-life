# P11 Scheduling Gate Report

Generated: 2026-06-08T00:25:36.028Z
Decision: **PASS**

## Summary
- Stage bands with gaps: 0/4
- Route points never scheduled: 0

# P11 Stage Expectation Baseline

Generated: 2026-06-08T00:25:36.029Z

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
- **first_turning_point** @ ages 15, 16, 17, 18, 19, 15, 16, 17, 18, 19, 15, 16, 17, 18, 19, 15, 16, 17, 18, 19, 15, 16, 17, 18, 19, 15, 16, 17, 18, 19, 15, 16, 17, 18, 19, 15, 16, 17, 18, 19 — event:love_first_meet; event:daily_home_letter_pos_1; event:martial_improvement

### Missing signals
- (none)

## 20-30 (stage_20_30)

### Expected signals
- route_reinforcement
- identity_signal
- relationship_shift

### Detected signals
- **route_reinforcement** @ ages 22, 22, 22 — event:p11_social_reinforcement_gathering; event:p11_wealth_reinforcement_first_deal; event:p11_wanderer_reinforcement_connections
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
- **route_divergence** @ ages 28, 29, 28 — event:p9_merchant_midlife_caravan; event:p9_deviant_midlife_escalation; event:p9_wanderer_midlife_discovery
- **achievement** @ ages  — stat:threshold_met
- **age40_identity** @ ages 39 — identity:balanced_martial_base

### Missing signals
- (none)


# P11 Route Scheduling Baseline Audit

Generated: 2026-06-08T00:25:36.029Z

## 习武成名 (route_martial)
Personas: p8-martial-lin

- [OBSERVED] entry @ 0-10: 幼年练功
  - flagKey: p9_echo_training_hook
  - sources: flag:p9_echo_training_hook@age3, flag:p9_echo_training_hook@age4, flag:p9_echo_training_hook@age5, flag:p9_echo_training_hook@age6, flag:p9_echo_training_hook@age7, flag:p9_echo_training_hook@age8, flag:p9_echo_training_hook@age9, flag:p9_echo_training_hook@age10, flag:p9_echo_training_hook@final
- [OBSERVED] reinforcement @ 10-20: 童子试剑
  - eventId: p9_childhood_sword_trial
  - flagKey: p9_childhood_sword_trial
  - sources: event:p9_childhood_sword_trial@age10, metadata:p9_childhood_sword_trial, flag:p9_childhood_sword_trial@age11, flag:p9_childhood_sword_trial@age12, flag:p9_childhood_sword_trial@age13, flag:p9_childhood_sword_trial@age14, flag:p9_childhood_sword_trial@age15, flag:p9_childhood_sword_trial@age16, flag:p9_childhood_sword_trial@age17, flag:p9_childhood_sword_trial@age18, flag:p9_childhood_sword_trial@age19, flag:p9_childhood_sword_trial@age20, flag:p9_childhood_sword_trial@final
- [OBSERVED] divergence @ 26-28: 功底显现
  - eventId: p9_training_echo_midlife
  - sources: event:p9_training_echo_midlife@age26
- [OBSERVED] identity @ 30-40: 武道天资确认
  - flagKey: p9_milestone_route_signal
  - sources: flag:p9_milestone_route_signal@age30, flag:p9_milestone_route_signal@age31, flag:p9_milestone_route_signal@age32, flag:p9_milestone_route_signal@age33, flag:p9_milestone_route_signal@age34, flag:p9_milestone_route_signal@age35, flag:p9_milestone_route_signal@age36, flag:p9_milestone_route_signal@age37, flag:p9_milestone_route_signal@age38, flag:p9_milestone_route_signal@age39, flag:p9_milestone_route_signal@final

## 治学成名 (route_scholar)
Personas: p8-scholar-su

- [OBSERVED] entry @ 0-10: 幼年读书行动
  - flagKey: p9_echo_study_hook
  - sources: flag:p9_echo_study_hook@age3, flag:p9_echo_study_hook@age4, flag:p9_echo_study_hook@age5, flag:p9_echo_study_hook@age6, flag:p9_echo_study_hook@age7, flag:p9_echo_study_hook@age8, flag:p9_echo_study_hook@age9, flag:p9_echo_study_hook@age10, flag:p9_echo_study_hook@final
- [OBSERVED] divergence @ 24-28: 学识回响
  - eventId: p9_study_echo_midlife
  - sources: event:p9_study_echo_midlife@age25
- [OBSERVED] identity @ 30-40: 讲学名士
  - flagKey: p9_route_identity_scholar
  - sources: flag:p9_route_identity_scholar@age30, flag:p9_route_identity_scholar@age31, flag:p9_route_identity_scholar@age32, flag:p9_route_identity_scholar@age33, flag:p9_route_identity_scholar@age34, flag:p9_route_identity_scholar@age35, flag:p9_route_identity_scholar@age36, flag:p9_route_identity_scholar@age37, flag:p9_route_identity_scholar@age38, flag:p9_route_identity_scholar@age39, flag:p9_route_identity_scholar@final

## 交游成名 (route_social)
Personas: p8-social-gu

- [OBSERVED] entry @ 0-10: 幼年交游行动
  - flagKey: p9_early_social_focus
  - sources: flag:p9_early_social_focus@age3, flag:p9_early_social_focus@age4, flag:p9_early_social_focus@age5, flag:p9_early_social_focus@age6, flag:p9_early_social_focus@age7, flag:p9_early_social_focus@age8, flag:p9_early_social_focus@age9, flag:p9_early_social_focus@age10, flag:p9_early_social_focus@final
- [OBSERVED] reinforcement @ 20-30: 雅集论交强化
  - eventId: p11_social_reinforcement_gathering
  - flagKey: p11_social_reinforcement_seen
  - sources: event:p11_social_reinforcement_gathering@age22, metadata:p11_social_reinforcement_gathering, flag:p11_social_reinforcement_seen@age23, flag:p11_social_reinforcement_seen@age24, flag:p11_social_reinforcement_seen@age25, flag:p11_social_reinforcement_seen@age26, flag:p11_social_reinforcement_seen@age27, flag:p11_social_reinforcement_seen@age28, flag:p11_social_reinforcement_seen@age29, flag:p11_social_reinforcement_seen@age30, flag:p11_social_reinforcement_seen@final
- [OBSERVED] divergence @ 26-30: 人脉回响
  - eventId: p9_social_echo_midlife
  - sources: event:p9_social_echo_midlife@age27
- [OBSERVED] identity @ 30-40: 人脉枢纽
  - flagKey: p9_route_identity_social
  - sources: flag:p9_route_identity_social@age30, flag:p9_route_identity_social@age31, flag:p9_route_identity_social@age32, flag:p9_route_identity_social@age33, flag:p9_route_identity_social@age34, flag:p9_route_identity_social@age35, flag:p9_route_identity_social@age36, flag:p9_route_identity_social@age37, flag:p9_route_identity_social@age38, flag:p9_route_identity_social@age39, flag:p9_route_identity_social@final

## 营商致富 (route_wealth)
Personas: p8-wealth-shen

- [OBSERVED] entry @ 0-10: 幼年营商行动
  - flagKey: p9_early_business_focus
  - sources: flag:p9_early_business_focus@age3, flag:p9_early_business_focus@age4, flag:p9_early_business_focus@age5, flag:p9_early_business_focus@age6, flag:p9_early_business_focus@age7, flag:p9_early_business_focus@age8, flag:p9_early_business_focus@age9, flag:p9_early_business_focus@age10, flag:p9_early_business_focus@final
- [OBSERVED] reinforcement @ 20-30: 初次经商
  - eventId: p11_wealth_reinforcement_first_deal
  - flagKey: p11_wealth_reinforcement_seen
  - sources: event:p11_wealth_reinforcement_first_deal@age22, metadata:p11_wealth_reinforcement_first_deal, flag:p11_wealth_reinforcement_seen@age23, flag:p11_wealth_reinforcement_seen@age24, flag:p11_wealth_reinforcement_seen@age25, flag:p11_wealth_reinforcement_seen@age26, flag:p11_wealth_reinforcement_seen@age27, flag:p11_wealth_reinforcement_seen@age28, flag:p11_wealth_reinforcement_seen@age29, flag:p11_wealth_reinforcement_seen@age30, flag:p11_wealth_reinforcement_seen@final
- [OBSERVED] divergence @ 28-32: 商路中段分化
  - eventId: p9_merchant_midlife_caravan
  - flagKey: p9_merchant_midlife_path
  - sources: event:p9_merchant_midlife_caravan@age28, flag:p9_merchant_midlife_path@age28, metadata:p9_merchant_midlife_caravan, flag:p9_merchant_midlife_path@age29, flag:p9_merchant_midlife_path@age30, flag:p9_merchant_midlife_path@age31, flag:p9_merchant_midlife_path@age32, flag:p9_merchant_midlife_path@final
- [OBSERVED] identity @ 30-40: 商路之主或投资者
  - flagKey: p9_route_identity_merchant_master
  - sources: flag:p9_route_identity_merchant_master@age30, flag:p9_route_identity_merchant_master@age31, flag:p9_route_identity_merchant_master@age32, flag:p9_route_identity_merchant_master@age33, flag:p9_route_identity_merchant_master@age34, flag:p9_route_identity_merchant_master@age35, flag:p9_route_identity_merchant_master@age36, flag:p9_route_identity_merchant_master@age37, flag:p9_route_identity_merchant_master@age38, flag:p9_route_identity_merchant_master@age39, flag:p9_route_identity_merchant_master@final

## 游历江湖 (route_wanderer)
Personas: p8-explorer-lu

- [OBSERVED] entry @ 0-10: 幼年游历行动
  - flagKey: p9_early_travel_focus
  - sources: flag:p9_early_travel_focus@age3, flag:p9_early_travel_focus@age4, flag:p9_early_travel_focus@age5, flag:p9_early_travel_focus@age6, flag:p9_early_travel_focus@age7, flag:p9_early_travel_focus@age8, flag:p9_early_travel_focus@age9, flag:p9_early_travel_focus@age10, flag:p9_early_travel_focus@final
- [OBSERVED] reinforcement @ 20-30: 路上结识人脉
  - eventId: p11_wanderer_reinforcement_connections
  - flagKey: p11_wanderer_reinforcement_seen
  - sources: event:p11_wanderer_reinforcement_connections@age22, metadata:p11_wanderer_reinforcement_connections, flag:p11_wanderer_reinforcement_seen@age23, flag:p11_wanderer_reinforcement_seen@age24, flag:p11_wanderer_reinforcement_seen@age25, flag:p11_wanderer_reinforcement_seen@age26, flag:p11_wanderer_reinforcement_seen@age27, flag:p11_wanderer_reinforcement_seen@age28, flag:p11_wanderer_reinforcement_seen@age29, flag:p11_wanderer_reinforcement_seen@age30, flag:p11_wanderer_reinforcement_seen@final
- [OBSERVED] divergence @ 28-32: 远游记名
  - eventId: p9_wanderer_midlife_discovery
  - flagKey: p9_wanderer_midlife_path
  - sources: event:p9_wanderer_midlife_discovery@age28, flag:p9_wanderer_midlife_path@age28, metadata:p9_wanderer_midlife_discovery, flag:p9_wanderer_midlife_path@age29, flag:p9_wanderer_midlife_path@age30, flag:p9_wanderer_midlife_path@age31, flag:p9_wanderer_midlife_path@age32, flag:p9_wanderer_midlife_path@final
- [OBSERVED] identity @ 30-40: 活地图或游侠护卫
  - flagKey: p9_route_identity_wanderer
  - sources: flag:p9_route_identity_wanderer@age30, flag:p9_route_identity_wanderer@age31, flag:p9_route_identity_wanderer@age32, flag:p9_route_identity_wanderer@age33, flag:p9_route_identity_wanderer@age34, flag:p9_route_identity_wanderer@age35, flag:p9_route_identity_wanderer@age36, flag:p9_route_identity_wanderer@age37, flag:p9_route_identity_wanderer@age38, flag:p9_route_identity_wanderer@age39, flag:p9_route_identity_wanderer@final

## 邪路偏锋 (route_deviant)
Personas: p8-deviant-ye

- [OBSERVED] entry @ 0-10: 幼年练功
  - flagKey: p9_echo_training_hook
  - sources: flag:p9_echo_training_hook@age3, flag:p9_echo_training_hook@age4, flag:p9_echo_training_hook@age5, flag:p9_echo_training_hook@age6, flag:p9_echo_training_hook@age7, flag:p9_echo_training_hook@age8, flag:p9_echo_training_hook@age9, flag:p9_echo_training_hook@age10, flag:p9_echo_training_hook@final
- [OBSERVED] reinforcement @ 10-20: 暗劲初萌
  - eventId: p9_childhood_dark_spark
  - sources: event:p9_childhood_dark_spark@age10
- [OBSERVED] divergence @ 23-29: 邪路初染与邪影成形
  - eventId: p9_deviant_fork_temptation
  - flagKey: p9_route_identity_deviant
  - sources: event:p9_deviant_fork_temptation@age23, flag:p9_route_identity_deviant@age23, flag:p9_route_identity_deviant@age24, flag:p9_route_identity_deviant@age25, flag:p9_route_identity_deviant@age26, flag:p9_route_identity_deviant@age27, flag:p9_route_identity_deviant@age28, flag:p9_route_identity_deviant@age29, flag:p9_route_identity_deviant@final
- [OBSERVED] identity @ 30-40: 邪影之主
  - flagKey: p9_route_identity_deviant
  - sources: flag:p9_route_identity_deviant@age30, flag:p9_route_identity_deviant@age31, flag:p9_route_identity_deviant@age32, flag:p9_route_identity_deviant@age33, flag:p9_route_identity_deviant@age34, flag:p9_route_identity_deviant@age35, flag:p9_route_identity_deviant@age36, flag:p9_route_identity_deviant@age37, flag:p9_route_identity_deviant@age38, flag:p9_route_identity_deviant@age39, flag:p9_route_identity_deviant@final

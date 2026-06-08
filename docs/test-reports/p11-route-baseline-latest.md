# P11 Route Scheduling Baseline Audit

Generated: 2026-06-07T15:45:55.857Z

## 习武成名 (route_martial)
Personas: p8-martial-lin

- [OBSERVED] entry @ 0-10: 幼年练功
  - flagKey: p9_echo_training_hook
  - sources: flag:p9_echo_training_hook@age3, flag:p9_echo_training_hook@age4, flag:p9_echo_training_hook@age5, flag:p9_echo_training_hook@age6, flag:p9_echo_training_hook@age7, flag:p9_echo_training_hook@age8, flag:p9_echo_training_hook@age9, flag:p9_echo_training_hook@age10, flag:p9_echo_training_hook@final
- [OBSERVED] reinforcement @ 10-20: 童子试剑
  - eventId: p9_childhood_sword_trial
  - flagKey: p9_childhood_sword_trial
  - sources: event:p9_childhood_sword_trial@age10, flag:p9_childhood_sword_trial@age11, flag:p9_childhood_sword_trial@age12, flag:p9_childhood_sword_trial@age13, flag:p9_childhood_sword_trial@age14, flag:p9_childhood_sword_trial@age15, flag:p9_childhood_sword_trial@age16, flag:p9_childhood_sword_trial@age17, flag:p9_childhood_sword_trial@age18, flag:p9_childhood_sword_trial@age19, flag:p9_childhood_sword_trial@age20, flag:p9_childhood_sword_trial@final
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
- [MISSING] reinforcement @ 20-30: 初次经商
  - eventId: merchant_first_trade
- [OBSERVED] divergence @ 28-32: 商路中段分化
  - eventId: p9_merchant_midlife_caravan
  - flagKey: p9_merchant_midlife_path
  - sources: event:p9_merchant_midlife_caravan@age28, flag:p9_merchant_midlife_path@age28, flag:p9_merchant_midlife_path@age29, flag:p9_merchant_midlife_path@age30, flag:p9_merchant_midlife_path@age31, flag:p9_merchant_midlife_path@age32, flag:p9_merchant_midlife_path@final
- [OBSERVED] identity @ 30-40: 商路之主或投资者
  - flagKey: p9_route_identity_merchant_master
  - sources: flag:p9_route_identity_merchant_master@age30, flag:p9_route_identity_merchant_master@age31, flag:p9_route_identity_merchant_master@age32, flag:p9_route_identity_merchant_master@age33, flag:p9_route_identity_merchant_master@age34, flag:p9_route_identity_merchant_master@age35, flag:p9_route_identity_merchant_master@age36, flag:p9_route_identity_merchant_master@age37, flag:p9_route_identity_merchant_master@age38, flag:p9_route_identity_merchant_master@age39, flag:p9_route_identity_merchant_master@final

### Never scheduled
- reinforcement @ 20-30: 初次经商

## 游历江湖 (route_wanderer)
Personas: p8-explorer-lu

- [OBSERVED] entry @ 0-10: 幼年游历行动
  - flagKey: p9_early_travel_focus
  - sources: flag:p9_early_travel_focus@age3, flag:p9_early_travel_focus@age4, flag:p9_early_travel_focus@age5, flag:p9_early_travel_focus@age6, flag:p9_early_travel_focus@age7, flag:p9_early_travel_focus@age8, flag:p9_early_travel_focus@age9, flag:p9_early_travel_focus@age10, flag:p9_early_travel_focus@final
- [MISSING] reinforcement @ 20-30: 路上结识人脉
- [OBSERVED] divergence @ 28-32: 远游记名
  - eventId: p9_wanderer_midlife_discovery
  - flagKey: p9_wanderer_midlife_path
  - sources: event:p9_wanderer_midlife_discovery@age28, flag:p9_wanderer_midlife_path@age28, flag:p9_wanderer_midlife_path@age29, flag:p9_wanderer_midlife_path@age30, flag:p9_wanderer_midlife_path@age31, flag:p9_wanderer_midlife_path@age32, flag:p9_wanderer_midlife_path@final
- [OBSERVED] identity @ 30-40: 活地图或游侠护卫
  - flagKey: p9_route_identity_wanderer
  - sources: flag:p9_route_identity_wanderer@age30, flag:p9_route_identity_wanderer@age31, flag:p9_route_identity_wanderer@age32, flag:p9_route_identity_wanderer@age33, flag:p9_route_identity_wanderer@age34, flag:p9_route_identity_wanderer@age35, flag:p9_route_identity_wanderer@age36, flag:p9_route_identity_wanderer@age37, flag:p9_route_identity_wanderer@age38, flag:p9_route_identity_wanderer@age39, flag:p9_route_identity_wanderer@final

### Never scheduled
- reinforcement @ 20-30: 路上结识人脉

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

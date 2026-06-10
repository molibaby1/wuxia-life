# P8 Playability Gate Report

Generated: 2026-06-10T10:50:07.222Z
Decision: **PASS**
End age: 40
Machine-readable: docs/test-reports/p8-playability-gate-latest.json

## Summary

### Warnings
- causality: p8-wealth-shen: direct echoes 1
- causality: p8-explorer-lu: direct echoes 2

## Persona Highlights

### 林破竹 (p8-martial-lin)

**Planning / Agency**
- Active actions: 3; categories: {"training":3}
- Sample selection: age 2 → action_childhood_training (persona_strategy:training prefers training)

**Causality**
- Direct echoes: 4
  - 26岁: configured echo hook echo_training_basic fired at p9_trainin
  - 27岁: explicit echo flag p9_explicit_training_echo

**Achievement**
- [missed] 打下武功根基 (0-20): martialPower=21 < 25
- [achieved] 坚持练功规划 (0-20): training actions=3
- [missed] 获得门派或江湖身份信号 (20-30): flag joined_sect=undefined
- [missed] 三十岁前功力达标 (30-40): martialPower=21 < 45

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；2岁 主动玩耍练功；3岁 伶牙俐齿；4岁 童年选择
- Turning: 18岁 武林大会邀请 — 你把自己带到了更大的场面里，不论胜负如何，江湖都开始认真看你一眼。
- Age-40 identity: 出身：寒门，路线：武道（martial_talent_acknowledged），幼年练功的习惯延续至今

### 苏文澜 (p8-scholar-su)

**Planning / Agency**
- Active actions: 3; categories: {"study":3}
- Sample selection: age 2 → action_study_lite (persona_strategy:study prefers study)

**Causality**
- Direct echoes: 3
  - 25岁: configured echo hook echo_study_basic fired at p9_study_echo
  - 26岁: explicit echo flag p9_explicit_study_echo

**Achievement**
- [achieved] 积累学识 (0-20): knowledge=25 >= 20
- [achieved] 坚持读书规划 (0-20): study actions=3
- [missed] 悟性提升 (20-30): comprehension=25 < 30
- [missed] 文路身份显现 (30-40): flag scholar_path_started=undefined

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 0岁 天降异象；1岁 出身背景；2岁 主动听先生讲课；3岁 伶牙俐齿；4岁 童年选择
- Turning: 18岁 武林大会邀请 — 你把自己带到了更大的场面里，不论胜负如何，江湖都开始认真看你一眼。 你借着大会让
- Age-40 identity: 出身：商户之家，路线：治学名士（scholar_lecturer），幼年读书的习惯延续至今

### 顾清仪 (p8-social-gu)

**Planning / Agency**
- Active actions: 3; categories: {"socializing":3}
- Sample selection: age 2 → action_socializing_lite (persona_strategy:socializing prefers socializing)

**Causality**
- Direct echoes: 3
  - 27岁: configured echo hook echo_social_basic fired at p9_social_ec
  - 28岁: explicit echo flag p9_explicit_social_echo

**Achievement**
- [achieved] 拓展人脉 (0-20): connections=42 >= 15
- [achieved] 坚持交游规划 (0-20): socializing actions=3
- [achieved] 建立重要关系 (20-30): spouse=明月
- [missed] 魅力成长 (30-40): charisma=30 < 35

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 0岁 天降异象；1岁 出身背景；2岁 主动与玩伴相处；3岁 伶牙俐齿；4岁 童年选择
- Turning: 18岁 武林大会邀请 — 你把自己带到了更大的场面里，不论胜负如何，江湖都开始认真看你一眼。
- Age-40 identity: 出身：边地军户，路线：交游枢纽（social_network_hub），幼年交游的习惯延续至今

### 沈聚财 (p8-wealth-shen)

**Planning / Agency**
- Active actions: 3; categories: {"business":3}
- Sample selection: age 2 → action_household_apprentice (persona_strategy:business prefers business)

**Causality**
- Direct echoes: 1
  - 28岁: explicit echo flag p9_explicit_business_echo

**Achievement**
- [missed] 积累财富 (0-20): money=0 < 200
- [achieved] 坚持营商规划 (0-20): business actions=3
- [achieved] 声望起步 (20-30): reputation=40 >= 10
- [missed] 四十岁前的经济基础 (30-40): money=0 < 500

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 0岁 天降异象；1岁 出身背景；2岁 主动帮家里打杂；3岁 伶牙俐齿；4岁 童年选择
- Turning: 18岁 武林大会邀请 — 你把自己带到了更大的场面里，不论胜负如何，江湖都开始认真看你一眼。
- Age-40 identity: 出身：市井草根，路线：商路之主（merchant_caravan_master）

### 韩守拙 (p8-cautious-han)

**Planning / Agency**
- Active actions: 3; categories: {"training":3}
- Sample selection: age 2 → action_childhood_training (persona_strategy:training prefers training)

**Causality**
- Direct echoes: 4
  - 25岁: explicit echo flag p9_explicit_cautious_echo
  - 26岁: configured echo hook echo_training_basic fired at p9_trainin

**Achievement**
- [achieved] 保持健康 (0-20): health=105 >= 70
- [achieved] 稳健练功 (0-20): training actions=3
- [achieved] 少遭重创 (20-30): no flag major_injury
- [achieved] 四十岁稳定生存 (30-40): health=105 >= 60

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；2岁 主动玩耍练功；3岁 伶牙俐齿；4岁 童年选择
- Turning: 18岁 武林大会邀请 — 你把自己带到了更大的场面里，不论胜负如何，江湖都开始认真看你一眼。 你借着大会让
- Age-40 identity: 出身：市井草根，路线：守拙持重（cautious_steward），幼年练功的习惯延续至今

### 叶走邪 (p8-deviant-ye)

**Planning / Agency**
- Active actions: 3; categories: {"training":2,"travel":1}
- Sample selection: age 2 → action_childhood_training (persona_strategy:training prefers training)

**Causality**
- Direct echoes: 4
  - 11岁: explicit echo flag p9_explicit_deviant_childhood_echo
  - 26岁: explicit echo flag p9_explicit_deviant_echo

**Achievement**
- [achieved] 邪路信号出现 (0-20): flag demonic_path_touched=true
- [missed] 做出高风险选择 (20-30): event demonic_midlife_fork not seen
- [achieved] 邪路功力成长 (30-40): martialPower=44 >= 40

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；2岁 主动玩耍练功；3岁 伶牙俐齿；4岁 童年选择
- Turning: 20岁 喜结良缘 — 你的积蓄少了一些。
- Age-40 identity: 出身：武林世家，路线：邪路偏锋（demonic_shadow_master），幼年练功 → 中段功底显现，邪路偏锋的习惯延续至今

### 陆行远 (p8-explorer-lu)

**Planning / Agency**
- Active actions: 3; categories: {"travel":3}
- Sample selection: age 2 → action_errand_nearby (persona_strategy:travel prefers travel)

**Causality**
- Direct echoes: 2
  - 28岁: explicit echo flag p9_explicit_travel_echo
  - 28岁: configured echo hook echo_travel_basic fired at p9_wanderer_

**Achievement**
- [achieved] 坚持游历规划 (0-20): travel actions=3
- [achieved] 路上结识人脉 (20-30): connections=41 >= 20
- [achieved] 见闻积累 (30-40): knowledge=43 >= 25

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；2岁 主动街坊跑腿；3岁 伶牙俐齿；4岁 童年选择
- Turning: 18岁 武林大会邀请 — 你把自己带到了更大的场面里，不论胜负如何，江湖都开始认真看你一眼。 你借着大会让
- Age-40 identity: 出身：寒门，路线：江湖游侠（wanderer_map_legend）

### 卫中和 (p8-balanced-wei)

**Planning / Agency**
- Active actions: 3; categories: {"training":1,"study":1,"travel":1}
- Sample selection: age 2 → action_childhood_training (persona_strategy:balanced prefers training)

**Causality**
- Direct echoes: 8
  - 26岁: explicit echo flag p9_explicit_study_echo
  - 26岁: summary echo: 幼年读书的习惯延续至今

**Achievement**
- [missed] 文武均衡 (0-20): martialPower=0 < 15
- [achieved] 多种主动行动并用 (20-30): study actions=1
- [missed] 形成稳定身份标签 (30-40): —

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；2岁 主动玩耍练功；3岁 伶牙俐齿；4岁 童年选择
- Turning: 18岁 武林大会邀请 — 你把自己带到了更大的场面里，不论胜负如何，江湖都开始认真看你一眼。
- Age-40 identity: 出身：寒门，路线：江湖游侠（wanderer_map_legend），幼年练功的习惯延续至今，幼年读书的习惯延续至今，幼年交游的习惯延续至今

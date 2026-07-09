# P8 Playability Gate Report

Generated: 2026-07-02T14:36:24.596Z
Runtime: headless_server
Decision: **PASS**
End age: 40
Machine-readable: docs/test-reports/p8-playability-gate-latest.json

## Summary

### Warnings
- causality: p8-wealth-shen: direct echoes 0
- narrative_memory: p8-wealth-shen: narrative gaps (citations=3)
- causality: p8-cautious-han: direct echoes 1
- causality: p8-balanced-wei: direct echoes 0
- narrative_memory: p8-balanced-wei: narrative gaps (citations=3)
- replayability: 2 near-duplicate pairs

## Persona Highlights

### 林破竹 (p8-martial-lin)

**Planning / Agency**
- Active actions: 12; categories: {"training":12}
- Sample selection: age 5 → action_childhood_yard_play (persona_strategy:training prefers training)

**Causality**
- Direct echoes: 6
  - 10岁: summary echo: 幼年练功的习惯延续至今
  - 10岁: explicit echo flag p9_explicit_training_echo

**Achievement**
- [achieved] 打下武功根基 (0-20): martialPower=25 >= 25
- [achieved] 坚持练功规划 (0-20): training actions=12
- [missed] 获得门派或江湖身份信号 (20-30): flag joined_sect=undefined
- [missed] 三十岁前功力达标 (30-40): martialPower=25 < 45

**Frustration**
- Opaque setbacks: 0 / 2

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；1岁 探索小能手；3岁 伶牙俐齿；4岁 童年选择
- Turning: 16岁 修炼抉择
- Age-40 identity: 出身：，路线：武道（martial_talent_acknowledged），幼年练功的习惯延续至今

### 苏文澜 (p8-scholar-su)

**Planning / Agency**
- Active actions: 16; categories: {"study":15,"socializing":1}
- Sample selection: age 5 → action_study_lite (persona_strategy:study prefers study)

**Causality**
- Direct echoes: 5
  - 10岁: summary echo: 幼年读书的习惯延续至今
  - 10岁: explicit echo flag p9_explicit_study_echo

**Achievement**
- [achieved] 积累学识 (0-20): knowledge=74 >= 20
- [achieved] 坚持读书规划 (0-20): study actions=15
- [achieved] 悟性提升 (20-30): comprehension=70 >= 30
- [achieved] 文路身份显现 (30-40): flag scholar_path_started=true

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；3岁 伶牙俐齿；4岁 童年选择；5岁 主动听先生讲课
- Turning: 18岁 武林大会邀请
- Age-40 identity: 出身：，路线：治学名士（scholar_lecturer），幼年读书的习惯延续至今，幼年交游 → 人脉回响

### 顾清仪 (p8-social-gu)

**Planning / Agency**
- Active actions: 17; categories: {"socializing":16,"study":1}
- Sample selection: age 5 → action_socializing_lite (persona_strategy:socializing prefers socializing)

**Causality**
- Direct echoes: 4
  - 10岁: summary echo: 幼年交游的习惯延续至今
  - 10岁: explicit echo flag p9_explicit_social_echo

**Achievement**
- [achieved] 拓展人脉 (0-20): connections=91 >= 15
- [achieved] 坚持交游规划 (0-20): socializing actions=16
- [achieved] 建立重要关系 (20-30): spouse=发妻
- [achieved] 魅力成长 (30-40): charisma=58 >= 35

**Frustration**
- Opaque setbacks: 0 / 1

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；1岁 探索小能手；3岁 伶牙俐齿；4岁 童年选择
- Turning: 16岁 学徒生涯
- Age-40 identity: 出身：，路线：交游枢纽（social_network_hub），幼年交游的习惯延续至今

### 沈聚财 (p8-wealth-shen)

**Planning / Agency**
- Active actions: 5; categories: {"business":5}
- Sample selection: age 5 → action_household_errand (persona_strategy:business prefers business)

**Causality**
- Direct echoes: 0

**Achievement**
- [achieved] 积累财富 (0-20): money=324 >= 200
- [achieved] 坚持营商规划 (0-20): business actions=5
- [missed] 声望起步 (20-30): reputation=0 < 10
- [unavailable] 四十岁前的经济基础 (30-40): finalAge 9 < band 30-40

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；1岁 探索小能手；3岁 伶牙俐齿；4岁 童年选择
- Turning: (missing)
- Age-40 identity: 出身：，路线：商路之主（merchant_path），幼年营商 → 商路初成

### 韩守拙 (p8-cautious-han)

**Planning / Agency**
- Active actions: 15; categories: {"training":14,"study":1}
- Sample selection: age 5 → action_childhood_yard_play (persona_strategy:training prefers training; cautious_childhood_steady)

**Causality**
- Direct echoes: 1
  - 10岁: explicit echo flag p9_explicit_cautious_echo

**Achievement**
- [achieved] 保持健康 (0-20): health=105 >= 70
- [achieved] 稳健练功 (0-20): training actions=14
- [achieved] 少遭重创 (20-30): no flag major_injury
- [achieved] 四十岁稳定生存 (30-40): health=105 >= 60

**Frustration**
- Opaque setbacks: 0 / 3

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；1岁 探索小能手；3岁 伶牙俐齿；4岁 童年选择
- Turning: 16岁 学徒生涯
- Age-40 identity: 出身：，路线：守拙持重（cautious_steward），幼年练功 → 中段功底显现

### 叶走邪 (p8-deviant-ye)

**Planning / Agency**
- Active actions: 14; categories: {"training":9,"study":5}
- Sample selection: age 5 → action_childhood_yard_play (persona_strategy:training prefers training)

**Causality**
- Direct echoes: 8
  - 10岁: summary echo: 邪路偏锋的习惯延续至今
  - 10岁: explicit echo flag p9_explicit_deviant_childhood_echo

**Achievement**
- [achieved] 邪路信号出现 (0-20): flag demonic_path_touched=true
- [missed] 做出高风险选择 (20-30): event demonic_midlife_fork not seen
- [achieved] 邪路功力成长 (30-40): martialPower=59 >= 40

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；3岁 伶牙俐齿；4岁 童年选择；5岁 主动院中玩耍
- Turning: 18岁 武林大会邀请
- Age-40 identity: 出身：，路线：邪路偏锋（demonic_shadow_master），幼年练功 → 中段功底显现，幼年读书 → 学识回响，邪路偏锋的习惯延续至今

### 陆行远 (p8-explorer-lu)

**Planning / Agency**
- Active actions: 20; categories: {"travel":19,"socializing":1}
- Sample selection: age 5 → action_errand_nearby (persona_strategy:travel prefers travel)

**Causality**
- Direct echoes: 6
  - 10岁: summary echo: 幼年游历的习惯延续至今
  - 10岁: explicit echo flag p9_explicit_travel_echo

**Achievement**
- [achieved] 坚持游历规划 (0-20): travel actions=19
- [achieved] 路上结识人脉 (20-30): connections=59 >= 20
- [achieved] 见闻积累 (30-40): knowledge=64 >= 25

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；3岁 伶牙俐齿；4岁 童年选择；5岁 主动街坊跑腿
- Turning: 18岁 武林大会邀请
- Age-40 identity: 出身：，路线：江湖游侠（wanderer_map_legend），幼年游历的习惯延续至今，幼年交游 → 人脉回响

### 卫中和 (p8-balanced-wei)

**Planning / Agency**
- Active actions: 5; categories: {"socializing":3,"business":2}
- Sample selection: age 5 → action_socializing_lite (persona_strategy:balanced prefers socializing)

**Causality**
- Direct echoes: 0

**Achievement**
- [missed] 文武均衡 (0-20): martialPower=0 < 15
- [missed] 多种主动行动并用 (20-30): study actions=0 < 1
- [missed] 形成稳定身份标签 (30-40): —

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；1岁 探索小能手；3岁 伶牙俐齿；4岁 童年选择
- Turning: (missing)
- Age-40 identity: 出身：，路线：文武兼修（balanced_path），幼年营商 → 商路初成，幼年读书 → 学识回响，幼年交游 → 人脉回响

## Replay Similarity
- p8-wealth-shen ~ p8-balanced-wei (0.88)
- p8-cautious-han ~ p8-deviant-ye (0.87)

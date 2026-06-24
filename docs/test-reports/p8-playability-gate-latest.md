# P8 Playability Gate Report

Generated: 2026-06-24T11:58:48.108Z
Runtime: headless_server
Decision: **PASS**
End age: 40
Machine-readable: docs/test-reports/p8-playability-gate-latest.json

## Summary

### Warnings
- pacing: p8-martial-lin: low-impact span 6y
- causality: p8-scholar-su: direct echoes 2
- pacing: p8-scholar-su: low-impact span 7y
- causality: p8-social-gu: direct echoes 2
- pacing: p8-social-gu: low-impact span 6y
- pacing: p8-wealth-shen: low-impact span 6y
- pacing: p8-cautious-han: low-impact span 6y
- pacing: p8-explorer-lu: low-impact span 7y
- pacing: p8-balanced-wei: low-impact span 6y
- replayability: 3 near-duplicate pairs

## Persona Highlights

### 林破竹 (p8-martial-lin)

**Planning / Agency**
- Active actions: 14; categories: {"training":14}
- Sample selection: age 5 → action_childhood_yard_play (persona_strategy:training prefers training)

**Causality**
- Direct echoes: 3
  - 28岁: summary echo: 幼年练功的习惯延续至今
  - 28岁: explicit echo flag p9_explicit_training_echo

**Achievement**
- [achieved] 打下武功根基 (0-20): martialPower=25 >= 25
- [achieved] 坚持练功规划 (0-20): training actions=14
- [missed] 获得门派或江湖身份信号 (20-30): flag joined_sect=undefined
- [missed] 三十岁前功力达标 (30-40): martialPower=25 < 45

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 1岁 出身背景；4岁 童年选择；5岁 主动院中玩耍；5岁 主动院中玩耍；6岁 武学启蒙
- Turning: 16岁 学徒生涯
- Age-40 identity: 出身：，路线：武道（martial_talent_acknowledged），幼年练功的习惯延续至今

### 苏文澜 (p8-scholar-su)

**Planning / Agency**
- Active actions: 13; categories: {"study":12,"training":1}
- Sample selection: age 5 → action_study_lite (persona_strategy:study prefers study)

**Causality**
- Direct echoes: 2
  - 26岁: summary echo: 幼年读书的习惯延续至今
  - 26岁: explicit echo flag p9_explicit_study_echo

**Achievement**
- [achieved] 积累学识 (0-20): knowledge=52 >= 20
- [achieved] 坚持读书规划 (0-20): study actions=12
- [achieved] 悟性提升 (20-30): comprehension=51 >= 30
- [achieved] 文路身份显现 (30-40): flag scholar_path_started=true

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 1岁 出身背景；4岁 童年选择；5岁 主动听先生讲课；5岁 主动听先生讲课；6岁 武学启蒙
- Turning: 17岁 家族阻碍
- Age-40 identity: 出身：，路线：治学名士（scholar_lecturer），幼年读书的习惯延续至今

### 顾清仪 (p8-social-gu)

**Planning / Agency**
- Active actions: 18; categories: {"socializing":18}
- Sample selection: age 5 → action_socializing_lite (persona_strategy:socializing prefers socializing)

**Causality**
- Direct echoes: 2
  - 28岁: summary echo: 幼年交游的习惯延续至今
  - 28岁: explicit echo flag p9_explicit_social_echo

**Achievement**
- [achieved] 拓展人脉 (0-20): connections=85 >= 15
- [achieved] 坚持交游规划 (0-20): socializing actions=18
- [achieved] 建立重要关系 (20-30): spouse=发妻
- [achieved] 魅力成长 (30-40): charisma=64 >= 35

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 1岁 出身背景；4岁 童年选择；5岁 主动与玩伴相处；5岁 主动与玩伴相处；5岁 主动与玩伴相处
- Turning: 17岁 家族阻碍
- Age-40 identity: 出身：，路线：交游枢纽（social_network_hub），幼年交游的习惯延续至今

### 沈聚财 (p8-wealth-shen)

**Planning / Agency**
- Active actions: 16; categories: {"socializing":3,"business":13}
- Sample selection: age 5 → action_socializing_lite (persona_strategy:business prefers socializing)

**Causality**
- Direct echoes: 7
  - 28岁: summary echo: 幼年交游的习惯延续至今
  - 29岁: summary echo: 幼年帮工营商的习惯延续至今

**Achievement**
- [achieved] 积累财富 (0-20): money=1120 >= 200
- [achieved] 坚持营商规划 (0-20): business actions=13
- [achieved] 声望起步 (20-30): reputation=61 >= 10
- [achieved] 四十岁前的经济基础 (30-40): money=1120 >= 500

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 1岁 出身背景；4岁 童年选择；5岁 主动与玩伴相处；5岁 主动与玩伴相处；5岁 主动与玩伴相处
- Turning: 18岁 家族阻碍
- Age-40 identity: 出身：，路线：商路之主（merchant_caravan_master），幼年帮工营商的习惯延续至今，幼年交游的习惯延续至今

### 韩守拙 (p8-cautious-han)

**Planning / Agency**
- Active actions: 15; categories: {"training":15}
- Sample selection: age 5 → action_childhood_yard_play (persona_strategy:training prefers training; cautious_childhood_steady)

**Causality**
- Direct echoes: 3
  - 27岁: summary echo: 幼年练功的习惯延续至今
  - 24岁: explicit echo flag p9_explicit_cautious_echo

**Achievement**
- [achieved] 保持健康 (0-20): health=105 >= 70
- [achieved] 稳健练功 (0-20): training actions=15
- [achieved] 少遭重创 (20-30): no flag major_injury
- [achieved] 四十岁稳定生存 (30-40): health=105 >= 60

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 1岁 出身背景；4岁 童年选择；5岁 主动院中玩耍；5岁 主动院中玩耍；6岁 市井塑形
- Turning: 16岁 学徒生涯
- Age-40 identity: 出身：，路线：守拙持重（cautious_steward），幼年练功的习惯延续至今

### 叶走邪 (p8-deviant-ye)

**Planning / Agency**
- Active actions: 10; categories: {"training":8,"study":2}
- Sample selection: age 5 → action_childhood_yard_play (persona_strategy:training prefers training)

**Causality**
- Direct echoes: 5
  - 27岁: summary echo: 邪路练功的狠劲延续至今
  - 12岁: explicit echo flag p9_explicit_deviant_childhood_echo

**Achievement**
- [achieved] 邪路信号出现 (0-20): flag demonic_path_touched=true
- [missed] 做出高风险选择 (20-30): event demonic_midlife_fork not seen
- [achieved] 邪路功力成长 (30-40): martialPower=47 >= 40

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 1岁 出身背景；4岁 童年选择；5岁 主动院中玩耍；5岁 主动院中玩耍；6岁 武学启蒙
- Turning: 17岁 家族阻碍
- Age-40 identity: 出身：，路线：邪路偏锋（demonic_shadow_master），幼年练功 → 中段功底显现，幼年读书 → 学识回响，邪路偏锋的习惯延续至今

### 陆行远 (p8-explorer-lu)

**Planning / Agency**
- Active actions: 20; categories: {"travel":19,"socializing":1}
- Sample selection: age 5 → action_errand_nearby (persona_strategy:travel prefers travel)

**Causality**
- Direct echoes: 5
  - 30岁: summary echo: 幼年游历的习惯延续至今
  - 30岁: explicit echo flag p9_explicit_travel_echo

**Achievement**
- [achieved] 坚持游历规划 (0-20): travel actions=19
- [achieved] 路上结识人脉 (20-30): connections=52 >= 20
- [achieved] 见闻积累 (30-40): knowledge=56 >= 25

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 1岁 出身背景；4岁 童年选择；5岁 主动街坊跑腿；5岁 主动街坊跑腿；5岁 主动街坊跑腿
- Turning: 17岁 家族阻碍
- Age-40 identity: 出身：，路线：江湖游侠（wanderer_map_legend），幼年游历的习惯延续至今，幼年交游 → 人脉回响

### 卫中和 (p8-balanced-wei)

**Planning / Agency**
- Active actions: 14; categories: {"travel":6,"training":3,"study":1,"socializing":3,"business":1}
- Sample selection: age 5 → action_errand_nearby (persona_strategy:balanced prefers travel)

**Causality**
- Direct echoes: 7
  - 25岁: summary echo: 幼年读书的习惯延续至今
  - 28岁: summary echo: 幼年交游的习惯延续至今

**Achievement**
- [achieved] 文武均衡 (0-20): martialPower=20 >= 15
- [achieved] 多种主动行动并用 (20-30): study actions=1
- [missed] 形成稳定身份标签 (30-40): —

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 1岁 出身背景；4岁 童年选择；5岁 主动街坊跑腿；5岁 主动街坊跑腿；5岁 主动街坊跑腿
- Turning: 18岁 家族阻碍
- Age-40 identity: 出身：，路线：江湖游侠（wanderer_map_legend），幼年练功 → 中段功底显现，幼年游历的习惯延续至今，，昔年苦读今见效，幼年交游的习惯延续至今

## Replay Similarity
- p8-martial-lin ~ p8-cautious-han (0.88)
- p8-scholar-su ~ p8-wealth-shen (0.95)
- p8-scholar-su ~ p8-deviant-ye (0.85)

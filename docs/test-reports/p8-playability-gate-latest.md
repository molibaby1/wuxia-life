# P8 Playability Gate Report

Generated: 2026-06-17T12:47:30.582Z
Runtime: headless_server
Decision: **PASS**
End age: 40
Machine-readable: docs/test-reports/p8-playability-gate-latest.json

## Summary

### Warnings
- causality: p8-martial-lin: direct echoes 2
- pacing: p8-martial-lin: low-impact span 6y
- causality: p8-scholar-su: direct echoes 2
- pacing: p8-scholar-su: low-impact span 7y
- pacing: p8-social-gu: low-impact span 6y
- pacing: p8-wealth-shen: low-impact span 6y
- causality: p8-cautious-han: direct echoes 2
- pacing: p8-cautious-han: low-impact span 6y
- pacing: p8-deviant-ye: low-impact span 7y
- pacing: p8-explorer-lu: low-impact span 6y
- pacing: p8-balanced-wei: low-impact span 6y
- replayability: 3 near-duplicate pairs

## Persona Highlights

### 林破竹 (p8-martial-lin)

**Planning / Agency**
- Active actions: 25; categories: {"training":25}
- Sample selection: age 2 → action_childhood_training (persona_strategy:training prefers training)

**Causality**
- Direct echoes: 2
  - 28岁: explicit echo flag p9_explicit_training_echo
  - 28岁: summary echo: 幼年练功的习惯延续至今

**Achievement**
- [missed] 打下武功根基 (0-20): martialPower=3 < 25
- [achieved] 坚持练功规划 (0-20): training actions=25
- [missed] 获得门派或江湖身份信号 (20-30): flag joined_sect=undefined
- [missed] 三十岁前功力达标 (30-40): martialPower=3 < 45

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 1岁 出身背景；2岁 主动玩耍练功；2岁 主动玩耍练功；2岁 主动玩耍练功；2岁 主动玩耍练功
- Turning: 16岁 学徒生涯
- Age-40 identity: 出身：，路线：武道（martial_path），幼年练功的习惯延续至今

### 苏文澜 (p8-scholar-su)

**Planning / Agency**
- Active actions: 30; categories: {"study":28,"training":2}
- Sample selection: age 1 → action_study_lite (persona_strategy:study prefers study)

**Causality**
- Direct echoes: 2
  - 25岁: explicit echo flag p9_explicit_study_echo
  - 25岁: summary echo: 幼年读书的习惯延续至今

**Achievement**
- [achieved] 积累学识 (0-20): knowledge=54 >= 20
- [achieved] 坚持读书规划 (0-20): study actions=28
- [achieved] 悟性提升 (20-30): comprehension=54 >= 30
- [missed] 文路身份显现 (30-40): flag scholar_path_started=undefined

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 1岁 出身背景；1岁 主动听先生讲课；1岁 主动听先生讲课；1岁 主动听先生讲课；1岁 主动听先生讲课
- Turning: 17岁 家族阻碍
- Age-40 identity: 出身：，路线：治学名士（scholar_lecturer），幼年练功 → 中段功底显现，幼年读书的习惯延续至今

### 顾清仪 (p8-social-gu)

**Planning / Agency**
- Active actions: 28; categories: {"training":16,"socializing":12}
- Sample selection: age 2 → action_childhood_training (persona_strategy:socializing prefers training)

**Causality**
- Direct echoes: 4
  - 28岁: explicit echo flag p9_explicit_training_echo
  - 28岁: summary echo: 幼年练功的习惯延续至今

**Achievement**
- [achieved] 拓展人脉 (0-20): connections=69 >= 15
- [achieved] 坚持交游规划 (0-20): socializing actions=12
- [achieved] 建立重要关系 (20-30): spouse=发妻
- [achieved] 魅力成长 (30-40): charisma=55 >= 35

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 1岁 出身背景；2岁 主动玩耍练功；2岁 主动玩耍练功；2岁 主动玩耍练功；2岁 主动玩耍练功
- Turning: 18岁 武林大会邀请
- Age-40 identity: 出身：，路线：交游枢纽（social_network_hub），幼年练功的习惯延续至今，幼年交游的习惯延续至今

### 沈聚财 (p8-wealth-shen)

**Planning / Agency**
- Active actions: 28; categories: {"training":16,"business":12}
- Sample selection: age 2 → action_childhood_training (persona_strategy:business prefers training)

**Causality**
- Direct echoes: 4
  - 27岁: explicit echo flag p9_explicit_training_echo
  - 27岁: summary echo: 幼年练功的习惯延续至今

**Achievement**
- [achieved] 积累财富 (0-20): money=591 >= 200
- [achieved] 坚持营商规划 (0-20): business actions=12
- [achieved] 声望起步 (20-30): reputation=28 >= 10
- [achieved] 四十岁前的经济基础 (30-40): money=591 >= 500

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 1岁 出身背景；2岁 主动玩耍练功；2岁 主动玩耍练功；2岁 主动玩耍练功；2岁 主动玩耍练功
- Turning: 17岁 主动营商 — 本期安排营商
- Age-40 identity: 出身：，路线：商路之主（merchant_path），幼年练功的习惯延续至今，幼年帮工营商的习惯延续至今

### 韩守拙 (p8-cautious-han)

**Planning / Agency**
- Active actions: 25; categories: {"training":25}
- Sample selection: age 2 → action_childhood_training (persona_strategy:training prefers training; cautious_childhood_steady)

**Causality**
- Direct echoes: 2
  - 28岁: explicit echo flag p9_explicit_training_echo
  - 28岁: summary echo: 幼年练功的习惯延续至今

**Achievement**
- [achieved] 保持健康 (0-20): health=100 >= 70
- [achieved] 稳健练功 (0-20): training actions=25
- [achieved] 少遭重创 (20-30): no flag major_injury
- [achieved] 四十岁稳定生存 (30-40): health=100 >= 60

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 1岁 出身背景；2岁 主动玩耍练功；2岁 主动玩耍练功；2岁 主动玩耍练功；2岁 主动玩耍练功
- Turning: 18岁 家族阻碍
- Age-40 identity: 出身：，路线：守拙持重（cautious_path），幼年练功的习惯延续至今

### 叶走邪 (p8-deviant-ye)

**Planning / Agency**
- Active actions: 30; categories: {"training":21,"study":9}
- Sample selection: age 1 → action_childhood_training (persona_strategy:training prefers training)

**Causality**
- Direct echoes: 4
  - 25岁: explicit echo flag p9_explicit_study_echo
  - 25岁: summary echo: 幼年读书的习惯延续至今

**Achievement**
- [missed] 邪路信号出现 (0-20): flag demonic_path_touched unset
- [missed] 做出高风险选择 (20-30): event demonic_midlife_fork not seen
- [missed] 邪路功力成长 (30-40): martialPower=35 < 40

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 1岁 出身背景；1岁 主动玩耍练功；1岁 主动玩耍练功；1岁 主动玩耍练功；1岁 主动玩耍练功
- Turning: 17岁 家族阻碍
- Age-40 identity: 出身：，路线：邪路偏锋（scholar_lecturer），幼年练功的习惯延续至今，幼年读书的习惯延续至今

### 陆行远 (p8-explorer-lu)

**Planning / Agency**
- Active actions: 47; categories: {"travel":46,"socializing":1}
- Sample selection: age 1 → action_errand_nearby (persona_strategy:travel prefers travel)

**Causality**
- Direct echoes: 5
  - 28岁:  你幼年街坊跑腿、后来第一次 action_travel_basic 游历时的胆气，如今已在江湖传开。一位老行脚僧邀你绘
  - 28岁: configured echo hook echo_travel_basic fired at p9_wanderer_

**Achievement**
- [achieved] 坚持游历规划 (0-20): travel actions=46
- [achieved] 路上结识人脉 (20-30): connections=52 >= 20
- [achieved] 见闻积累 (30-40): knowledge=56 >= 25

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 1岁 出身背景；1岁 主动街坊跑腿；1岁 主动街坊跑腿；1岁 主动街坊跑腿；1岁 主动街坊跑腿
- Turning: 17岁 家族阻碍
- Age-40 identity: 出身：，路线：江湖游侠（wanderer_map_legend），幼年游历的习惯延续至今，幼年交游 → 人脉回响

### 卫中和 (p8-balanced-wei)

**Planning / Agency**
- Active actions: 26; categories: {"training":6,"business":13,"travel":2,"study":2,"socializing":3}
- Sample selection: age 2 → action_childhood_training (persona_strategy:balanced prefers training)

**Causality**
- Direct echoes: 8
  - 25岁: explicit echo flag p9_explicit_study_echo
  - 25岁: summary echo: 幼年读书的习惯延续至今

**Achievement**
- [missed] 文武均衡 (0-20): martialPower=0 < 15
- [achieved] 多种主动行动并用 (20-30): study actions=2
- [missed] 形成稳定身份标签 (30-40): —

**Frustration**
- Opaque setbacks: 0 / 0

**Narrative**
- Early: 1岁 出身背景；2岁 主动玩耍练功；2岁 主动玩耍练功；2岁 主动玩耍练功；2岁 主动玩耍练功
- Turning: 18岁 家族阻碍
- Age-40 identity: 出身：，路线：治学名士（scholar_lecturer），幼年练功的习惯延续至今，幼年帮工营商的习惯延续至今，幼年游历 → 远游记名，，昔年苦读今见效，幼年交游的习惯延续至今

## Replay Similarity
- p8-martial-lin ~ p8-cautious-han (0.94)
- p8-wealth-shen ~ p8-balanced-wei (0.92)
- p8-cautious-han ~ p8-deviant-ye (0.82)

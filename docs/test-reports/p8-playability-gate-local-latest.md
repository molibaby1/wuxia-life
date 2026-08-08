# P8 Playability Gate Report

Generated: 2026-08-05T13:03:17.178Z
Runtime: local_direct
Decision: **PASS**
End age: 40
Machine-readable: docs/test-reports/p8-playability-gate-local-latest.json

## Summary

## Persona Highlights

### 林破竹 (p8-martial-lin)

**Planning / Agency**
- Active actions: 1; categories: {"training":1}
- Sample selection: age 7 → action_childhood_training (persona_strategy:training prefers training)

**Causality (legacy diagnostic)**
- This diagnostic is not part of the formal gate verdict.
- Direct echoes: 4
  - 26岁: summary echo: 幼年练功的习惯延续至今
  - 26岁: explicit echo flag p9_explicit_training_echo

**Achievement**
- [achieved] 打下武功根基 (0-20): martialPower=83 >= 25
- [missed] 坚持练功规划 (0-20): training actions=1 < 3
- [missed] 获得门派或江湖身份信号 (20-30): flag joined_sect=undefined
- [achieved] 三十岁前功力达标 (30-40): martialPower=83 >= 45

**Frustration**
- Opaque setbacks: 1 / 8

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；3岁 伶牙俐齿；4岁 柜台边的小主意；6岁 武学启蒙
- Turning: 18岁 武林大会邀请 — 你把自己带到了更大的场面里，不论胜负如何，江湖都开始认真看你一眼。
- Age-40 identity: 出身：商户之家，路线：武道（martial_talent_acknowledged），幼年练功的习惯延续至今，门派：shadow_sect

### 苏文澜 (p8-scholar-su)

**Planning / Agency**
- Active actions: 1; categories: {"study":1}
- Sample selection: age 7 → action_study_lite (persona_strategy:study prefers study)

**Causality (legacy diagnostic)**
- This diagnostic is not part of the formal gate verdict.
- Direct echoes: 2
  - 25岁: summary echo: 幼年读书的习惯延续至今
  - 25岁: explicit echo flag p9_explicit_study_echo

**Achievement**
- [achieved] 积累学识 (0-20): knowledge=49 >= 20
- [missed] 坚持读书规划 (0-20): study actions=1 < 3
- [achieved] 悟性提升 (20-30): comprehension=53 >= 30
- [achieved] 文路身份显现 (30-40): flag scholar_path_started=true

**Frustration**
- Opaque setbacks: 0 / 6

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；3岁 伶牙俐齿；4岁 柜台边的小主意；6岁 自己看出的错账
- Turning: 18岁 武林大会邀请 — 你把自己带到了更大的场面里，不论胜负如何，江湖都开始认真看你一眼。
- Age-40 identity: 出身：商户之家，路线：治学名士（scholar_lecturer），幼年营商 → 商路初成，幼年读书的习惯延续至今

### 顾清仪 (p8-social-gu)

**Planning / Agency**
- Active actions: 1; categories: {"socializing":1}
- Sample selection: age 7 → action_socializing_lite (persona_strategy:socializing prefers socializing)

**Causality (legacy diagnostic)**
- This diagnostic is not part of the formal gate verdict.
- Direct echoes: 2
  - 27岁: summary echo: 幼年交游的习惯延续至今
  - 27岁: explicit echo flag p9_explicit_social_echo

**Achievement**
- [achieved] 拓展人脉 (0-20): connections=52 >= 15
- [missed] 坚持交游规划 (0-20): socializing actions=1 < 2
- [achieved] 建立重要关系 (20-30): spouse=明月
- [missed] 魅力成长 (30-40): charisma=8 < 35

**Frustration**
- Opaque setbacks: 1 / 8

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；3岁 伶牙俐齿；4岁 柜台边的小主意；6岁 柜台前的小招呼
- Turning: 18岁 武林大会邀请 — 你把自己带到了更大的场面里，不论胜负如何，江湖都开始认真看你一眼。
- Age-40 identity: 出身：商户之家，路线：交游枢纽（social_network_hub），幼年营商 → 商路初成，幼年交游的习惯延续至今，门派：shadow_sect

### 沈聚财 (p8-wealth-shen)

**Planning / Agency**
- Active actions: 1; categories: {"business":1}
- Sample selection: age 7 → action_household_apprentice (persona_strategy:business prefers business)

**Causality (legacy diagnostic)**
- This diagnostic is not part of the formal gate verdict.
- Direct echoes: 3
  - 28岁: summary echo: 幼年帮工营商的习惯延续至今
  - 28岁: explicit echo flag p9_explicit_business_echo

**Achievement**
- [achieved] 积累财富 (0-20): money=740 >= 200
- [missed] 坚持营商规划 (0-20): business actions=1 < 2
- [missed] 声望起步 (20-30): reputation=5 < 10
- [achieved] 四十岁前的经济基础 (30-40): money=740 >= 500

**Frustration**
- Opaque setbacks: 0 / 6

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；3岁 伶牙俐齿；4岁 柜台边的小主意；6岁 柜台前的小招呼
- Turning: 18岁 武林大会邀请 — 你把自己带到了更大的场面里，不论胜负如何，江湖都开始认真看你一眼。
- Age-40 identity: 出身：商户之家，路线：商路之主（merchant_caravan_master），幼年帮工营商的习惯延续至今

### 韩守拙 (p8-cautious-han)

**Planning / Agency**
- Active actions: 1; categories: {"training":1}
- Sample selection: age 7 → action_childhood_training (persona_strategy:training prefers training; cautious_childhood_steady)

**Causality (legacy diagnostic)**
- This diagnostic is not part of the formal gate verdict.
- Direct echoes: 1
  - 24岁: explicit echo flag p9_explicit_cautious_echo

**Achievement**
- [achieved] 保持身体稳定 (0-20): healthStatus=unwell is allowed
- [missed] 稳健练功 (0-20): training actions=1 < 2
- [achieved] 少遭重创 (20-30): no flag major_injury
- [achieved] 四十岁身体稳定 (30-40): healthStatus=unwell is allowed

**Frustration**
- Opaque setbacks: 1 / 8

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；3岁 伶牙俐齿；4岁 柜台边的小主意；6岁 自己看出的错账
- Turning: 18岁 武林大会邀请 — 你把自己带到了更大的场面里，不论胜负如何，江湖都开始认真看你一眼。
- Age-40 identity: 出身：商户之家，路线：守拙持重（cautious_steward），幼年练功 → 中段功底显现，幼年营商 → 商路初成

### 叶走邪 (p8-deviant-ye)

**Planning / Agency**
- Active actions: 0; categories: {}

**Causality (legacy diagnostic)**
- This diagnostic is not part of the formal gate verdict.
- Direct echoes: 5
  - 26岁: summary echo: 邪路练功的狠劲延续至今
  - 24岁: explicit echo flag p9_explicit_deviant_echo

**Achievement**
- [achieved] 邪路信号出现 (0-20): flag demonic_path_touched=true
- [missed] 做出高风险选择 (20-30): event demonic_midlife_fork not seen
- [achieved] 邪路功力成长 (30-40): martialPower=61 >= 40

**Frustration**
- Opaque setbacks: 0 / 7

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；3岁 伶牙俐齿；4岁 柜台边的小主意；6岁 武学启蒙
- Turning: 18岁 武林大会邀请 — 你把自己带到了更大的场面里，不论胜负如何，江湖都开始认真看你一眼。
- Age-40 identity: 出身：商户之家，路线：邪路偏锋（demonic_shadow_master），幼年练功 → 中段功底显现，幼年营商 → 商路初成，幼年读书 → 学识回响，幼年交游 → 人脉回响，邪路偏锋的习惯延续至今

### 陆行远 (p8-explorer-lu)

**Planning / Agency**
- Active actions: 1; categories: {"travel":1}
- Sample selection: age 7 → action_errand_nearby (persona_strategy:travel prefers travel)

**Causality (legacy diagnostic)**
- This diagnostic is not part of the formal gate verdict.
- Direct echoes: 2
  - 28岁: summary echo: 幼年游历的习惯延续至今
  - 28岁: explicit echo flag p9_explicit_travel_echo

**Achievement**
- [missed] 坚持游历规划 (0-20): travel actions=1 < 2
- [achieved] 路上结识人脉 (20-30): connections=30 >= 20
- [achieved] 见闻积累 (30-40): knowledge=47 >= 25

**Frustration**
- Opaque setbacks: 0 / 7

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；3岁 伶牙俐齿；4岁 柜台边的小主意；6岁 自己看出的错账
- Turning: 18岁 武林大会邀请 — 你把自己带到了更大的场面里，不论胜负如何，江湖都开始认真看你一眼。
- Age-40 identity: 出身：商户之家，路线：江湖游侠（wanderer_map_legend），幼年营商 → 商路初成，幼年游历的习惯延续至今

### 卫中和 (p8-balanced-wei)

**Planning / Agency**
- Active actions: 1; categories: {"business":1}
- Sample selection: age 7 → action_household_apprentice (persona_strategy:balanced prefers business)

**Causality (legacy diagnostic)**
- This diagnostic is not part of the formal gate verdict.
- Direct echoes: 2
  - 28岁: summary echo: 幼年读书的习惯延续至今
  - 28岁: explicit echo flag p9_explicit_balanced_harmony_echo

**Achievement**
- [missed] 文武均衡 (0-20): martialPower=9 < 15
- [missed] 多种主动行动并用 (20-30): study actions=0 < 1
- [missed] 形成稳定身份标签 (30-40): —

**Frustration**
- Opaque setbacks: 1 / 7

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；3岁 伶牙俐齿；4岁 柜台边的小主意；6岁 自己看出的错账
- Turning: 16岁 流浪武者 — 你的心中似乎多了一丝动摇。
- Age-40 identity: 出身：商户之家，路线：文武兼修（balanced_path），幼年营商 → 商路初成，幼年读书的习惯延续至今，幼年交游 → 人脉回响

## Replay Similarity (legacy diagnostic)
This diagnostic is not part of the formal gate verdict.
- p8-martial-lin ~ p8-scholar-su (0.93)
- p8-martial-lin ~ p8-social-gu (0.86)
- p8-scholar-su ~ p8-wealth-shen (0.86)
- p8-social-gu ~ p8-cautious-han (0.92)
- p8-wealth-shen ~ p8-deviant-ye (0.93)
- p8-wealth-shen ~ p8-explorer-lu (0.93)
- p8-wealth-shen ~ p8-balanced-wei (0.82)
- p8-cautious-han ~ p8-explorer-lu (0.82)
- p8-cautious-han ~ p8-balanced-wei (0.91)
- p8-deviant-ye ~ p8-explorer-lu (0.97)
- p8-deviant-ye ~ p8-balanced-wei (0.95)
- p8-explorer-lu ~ p8-balanced-wei (0.94)

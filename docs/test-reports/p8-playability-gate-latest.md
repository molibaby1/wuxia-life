# P8 Playability Gate Report

Generated: 2026-08-08T12:45:08.087Z
Runtime: headless_server
Decision: **PASS**
End age: 40
Machine-readable: docs/test-reports/p8-playability-gate-latest.json

## Summary

## Persona Highlights

### 林破竹 (p8-martial-lin)

**Planning / Agency**
- Active actions: 6; categories: {"training":5,"study":1}
- Sample selection: age 7 → action_childhood_training (persona_strategy:training prefers training)

**Causality (legacy diagnostic)**
- This diagnostic is not part of the formal gate verdict.
- Direct echoes: 4
  - 10岁: summary echo: 幼年练功的习惯延续至今
  - 10岁: explicit echo flag p9_explicit_training_echo

**Achievement**
- [achieved] 打下武功根基 (0-20): martialPower=50 >= 25
- [achieved] 坚持练功规划 (0-20): training actions=5
- [missed] 获得门派或江湖身份信号 (20-30): flag joined_sect=undefined
- [achieved] 三十岁前功力达标 (30-40): martialPower=50 >= 45

**Frustration**
- Opaque setbacks: 1 / 7

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；3岁 伶牙俐齿；4岁 柜台边的小主意；6岁 武学启蒙
- Turning: 16岁 苦读诗书 — 你的选择激起了涟漪，后续影响仍在发酵。
- Age-40 identity: 出身：商户之家，路线：武道（martial_talent_acknowledged），幼年练功的习惯延续至今，幼年读书 → 学识回响

### 苏文澜 (p8-scholar-su)

**Planning / Agency**
- Active actions: 4; categories: {"study":4}
- Sample selection: age 7 → action_study_lite (persona_strategy:study prefers study)

**Causality (legacy diagnostic)**
- This diagnostic is not part of the formal gate verdict.
- Direct echoes: 3
  - 10岁: summary echo: 幼年读书的习惯延续至今
  - 10岁: explicit echo flag p9_explicit_study_echo

**Achievement**
- [achieved] 积累学识 (0-20): knowledge=66 >= 20
- [achieved] 坚持读书规划 (0-20): study actions=4
- [achieved] 文路身份显现 (30-40): flag scholar_path_started=true

**Frustration**
- Opaque setbacks: 0 / 10

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；3岁 伶牙俐齿；4岁 柜台边的小主意；6岁 自己看出的错账
- Turning: 18岁 武林大会邀请 — 你的选择激起了涟漪，后续影响仍在发酵。
- Age-40 identity: 出身：商户之家，路线：治学名士（scholar_lecturer），幼年营商 → 商路初成，幼年读书的习惯延续至今

### 顾清仪 (p8-social-gu)

**Planning / Agency**
- Active actions: 5; categories: {"socializing":4,"study":1}
- Sample selection: age 7 → action_socializing_lite (persona_strategy:socializing prefers socializing)

**Causality (legacy diagnostic)**
- This diagnostic is not part of the formal gate verdict.
- Direct echoes: 3
  - 10岁: summary echo: 幼年交游的习惯延续至今
  - 10岁: explicit echo flag p9_explicit_social_echo

**Achievement**
- [achieved] 拓展人脉 (0-20): connections=50 >= 15
- [achieved] 坚持交游规划 (0-20): socializing actions=4
- [achieved] 建立重要关系 (20-30): spouse=发妻
- [missed] 魅力成长 (30-40): charisma=18 < 35

**Frustration**
- Opaque setbacks: 2 / 9

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；1岁 探索小能手；3岁 伶牙俐齿；4岁 柜台边的小主意
- Turning: 16岁 修炼抉择 — 你的选择激起了涟漪，后续影响仍在发酵。
- Age-40 identity: 出身：商户之家，路线：交游枢纽（social_network_hub），幼年营商 → 商路初成，幼年读书 → 学识回响，幼年交游的习惯延续至今

### 沈聚财 (p8-wealth-shen)

**Planning / Agency**
- Active actions: 4; categories: {"business":4}
- Sample selection: age 6 → action_household_errand (persona_strategy:business prefers business)

**Causality (legacy diagnostic)**
- This diagnostic is not part of the formal gate verdict.
- Direct echoes: 3
  - 10岁: summary echo: 幼年帮工营商的习惯延续至今
  - 10岁: explicit echo flag p9_explicit_business_echo

**Achievement**
- [missed] 积累财富 (0-20): money=0 < 200
- [achieved] 坚持营商规划 (0-20): business actions=4
- [achieved] 声望起步 (20-30): reputation=21 >= 10
- [missed] 四十岁前的经济基础 (30-40): money=0 < 500

**Frustration**
- Opaque setbacks: 1 / 12

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；3岁 伶牙俐齿；4岁 柜台边的小主意；6岁 柜台前的小招呼
- Turning: 16岁 开设店铺 — 你的选择激起了涟漪，后续影响仍在发酵。
- Age-40 identity: 出身：商户之家，路线：商路之主（merchant_caravan_master），幼年帮工营商的习惯延续至今

### 韩守拙 (p8-cautious-han)

**Planning / Agency**
- Active actions: 5; categories: {"training":4,"study":1}
- Sample selection: age 7 → action_childhood_training (persona_strategy:training prefers training; cautious_childhood_steady)

**Causality (legacy diagnostic)**
- This diagnostic is not part of the formal gate verdict.
- Direct echoes: 1
  - 10岁: explicit echo flag p9_explicit_cautious_echo

**Achievement**
- [achieved] 保持身体稳定 (0-20): healthStatus=unwell is allowed
- [achieved] 稳健练功 (0-20): training actions=4
- [achieved] 少遭重创 (20-30): no flag major_injury
- [achieved] 四十岁身体稳定 (30-40): healthStatus=unwell is allowed

**Frustration**
- Opaque setbacks: 0 / 9

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；3岁 伶牙俐齿；4岁 柜台边的小主意；6岁 自己看出的错账
- Turning: 18岁 武林大会邀请 — 你的选择激起了涟漪，后续影响仍在发酵。
- Age-40 identity: 出身：商户之家，路线：守拙持重（cautious_steward），幼年练功 → 中段功底显现，幼年营商 → 商路初成

### 叶走邪 (p8-deviant-ye)

**Planning / Agency**
- Active actions: 5; categories: {"training":4,"study":1}
- Sample selection: age 7 → action_childhood_training (persona_strategy:training prefers training)

**Causality (legacy diagnostic)**
- This diagnostic is not part of the formal gate verdict.
- Direct echoes: 6
  - 10岁: summary echo: 邪路偏锋的习惯延续至今
  - 10岁: summary echo: ，昔年苦读今见效

**Achievement**
- [achieved] 邪路信号出现 (0-20): flag demonic_path_touched=true
- [missed] 做出高风险选择 (20-30): event demonic_midlife_fork not seen
- [achieved] 邪路功力成长 (30-40): martialPower=103 >= 40

**Frustration**
- Opaque setbacks: 1 / 10

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；1岁 探索小能手；3岁 伶牙俐齿；4岁 柜台边的小主意
- Turning: 16岁 独特武学 — 你的选择激起了涟漪，后续影响仍在发酵。
- Age-40 identity: 出身：商户之家，路线：邪路偏锋（demonic_shadow_master），幼年练功 → 中段功底显现，，昔年苦读今见效，邪路偏锋的习惯延续至今

### 陆行远 (p8-explorer-lu)

**Planning / Agency**
- Active actions: 7; categories: {"travel":6,"socializing":1}
- Sample selection: age 7 → action_errand_nearby (persona_strategy:travel prefers travel)

**Causality (legacy diagnostic)**
- This diagnostic is not part of the formal gate verdict.
- Direct echoes: 3
  - 10岁: summary echo: 幼年游历的习惯延续至今
  - 10岁: explicit echo flag p9_explicit_travel_echo

**Achievement**
- [achieved] 坚持游历规划 (0-20): travel actions=6
- [achieved] 路上结识人脉 (20-30): connections=59 >= 20
- [achieved] 见闻积累 (30-40): knowledge=58 >= 25

**Frustration**
- Opaque setbacks: 1 / 9

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；1岁 探索小能手；3岁 伶牙俐齿；4岁 柜台边的小主意
- Turning: 16岁 苦读诗书 — 你的选择激起了涟漪，后续影响仍在发酵。
- Age-40 identity: 出身：商户之家，路线：江湖游侠（wanderer_map_legend），幼年营商 → 商路初成，幼年游历的习惯延续至今，幼年交游 → 人脉回响

### 卫中和 (p8-balanced-wei)

**Planning / Agency**
- Active actions: 6; categories: {"business":4,"socializing":1,"training":1}
- Sample selection: age 6 → action_household_errand (persona_strategy:balanced prefers business)

**Causality (legacy diagnostic)**
- This diagnostic is not part of the formal gate verdict.
- Direct echoes: 2
  - 10岁: summary echo: 幼年读书的习惯延续至今
  - 10岁: explicit echo flag p9_explicit_balanced_harmony_echo

**Achievement**
- [achieved] 文武均衡 (0-20): martialPower=68 >= 15
- [missed] 多种主动行动并用 (20-30): study actions=0 < 1
- [missed] 形成稳定身份标签 (30-40): —

**Frustration**
- Opaque setbacks: 1 / 9

**Narrative**
- Early: 0岁 降生武侠世家；1岁 出身背景；1岁 探索小能手；3岁 伶牙俐齿；4岁 柜台边的小主意
- Turning: 18岁 武林大会邀请 — 你的选择激起了涟漪，后续影响仍在发酵。
- Age-40 identity: 出身：商户之家，路线：武道（balanced_martial_base），幼年营商 → 商路初成，幼年读书的习惯延续至今，幼年交游 → 人脉回响

## Replay Similarity (legacy diagnostic)
This diagnostic is not part of the formal gate verdict.
- p8-social-gu ~ p8-deviant-ye (0.83)
- p8-social-gu ~ p8-explorer-lu (0.83)
- p8-wealth-shen ~ p8-deviant-ye (0.85)
- p8-wealth-shen ~ p8-explorer-lu (0.85)
- p8-wealth-shen ~ p8-balanced-wei (0.88)
- p8-cautious-han ~ p8-deviant-ye (0.85)
- p8-cautious-han ~ p8-explorer-lu (0.83)
- p8-cautious-han ~ p8-balanced-wei (0.84)
- p8-deviant-ye ~ p8-explorer-lu (0.85)
- p8-deviant-ye ~ p8-balanced-wei (0.87)
- p8-explorer-lu ~ p8-balanced-wei (0.84)

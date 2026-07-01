# P92 Medical Endgame — Six Branch Design

> **Date:** 2026-06-29
> **Stage:** P92 Wuxia Medical Endgame Design-First Contract
> **Purpose:** Detailed design for 6 endgame branches (one per late-life branch) — CONDITIONAL_GO
> **Target Route:** `medical_sage_healer` (一代名医)
> **Origin:** `tavern_hand` (酒肆帮工)
> **Variants:** Compassionate (仁心医者) + Pragmatic (世故人医)

---

## 1. Executive Summary

Six endgame branches designed — **3 compassionate + 3 pragmatic**, each a distinct variant of the Medical Legacy Echo (医名身后事) theme. All six are single auto echo events (not choice) with the same structure but different content — one per late-life branch.

**Event shape:** Single auto event with 6 variants (not 6 separate events) — satisfies lightweight constraint.

**Two fundamentally different axes:**
- **Compassionate variant:** Spiritual/Healing Legacy (薪火相传) — 你的仁心，传下去了吗？
- **Pragmatic variant:** Social/Medical Legacy (医名远播) — 你的医名，流传下来了吗？

**Branching based on late-life markers:**

**Compassionate (薪火相传):**
- Comp-A: 最后仁心 → 仁心不灭·烬 (Ember of Compassion)
- Comp-B: 从容自在 → 医者从容·淡 (Quiet Healer's Peace)
- Comp-C: 仁心传承 → 仁心满天下·传 (Legacy of Compassion)

**Pragmatic (医名远播):**
- Prag-A: 人走茶凉 → 医名犹存·寂 (Medical Name Remains)
- Prag-B: 逍遥自在 → 江湖游医·遥 (Wandering Healer Legend)
- Prag-C: 德高望重 → 一代宗师·名 (Grand Master's Fame)

**All 6 meaningfully different.** All tavern-born flavored. Lightweight compliant.

---

## 2. Event Structure Decision

### 2.1 Selected: Single Auto Echo Event with 6 Variants

**Why single event:** `medical_endgame_echo`

**Why auto (not choice):**
- Endgame is an echo, not a new decision point
- Player made all their choices at payoff and late-life; endgame is the final consequence
- Feels like "世人怎么说你这位医者" — it happens to your legacy, not something you choose
- Consistent with lightweight constraint

**Why 6 variants (not unified):**
- Each late-life branch has fundamentally different identity
- 2 variants (compassionate vs pragmatic) have fundamentally different legacy axes
- 6 variants under 1 event = still lightweight
- Deepens the 6-branch / 2-variant structure that makes medical route unique

**Why 2 axes (not 1):**
- Compassionate = spiritual/healing legacy (inward → outward through others)
- Pragmatic = social/medical reputation legacy (outward → what history says)
- This is the key differentiator from renown endgame (which has only 1 axis)
- Two axes ensure 2 variants don't feel like mirrors

---

## 3. Compassionate Variant — 薪火相传 (Spiritual/Healing Legacy)

**Core question:** 你的仁心，传下去了吗？

**Legacy type:** Spiritual / ethical — compassion lives on through people you saved and students you taught

**Tone range:** Warm, bittersweet, inspiring, quiet

**Memory carrier:** Patients whose lives you changed, students who practice your teachings, the spirit of healing itself

---

### 3.1 Branch Comp-A — 最后仁心 → 仁心不灭·烬 (Ember of Compassion)

**Late-life root:** 燃尽自己的最后仁心 — 身体垮了，手抖了，仍在救人

**Endgame echo:** 你燃尽了自己，但你救过的人还在，他们记得你。仁心像火种，你熄了，但别处还亮着。

**Narrative beat:**
- 某个冬日，你坐在药庐门口晒太阳，越来越觉得累
- 恍惚间，你想起小时候在酒肆帮着熬药的日子，老掌柜说"这孩子心善"
- 这些年，你救过多少人？数不清了。有富人，有穷人，有好人，有坏人——你都救了
- 你不知道的是，你救过的那些人，有的成了好大夫，有的一辈子记着你的恩情
- 仁心像火种——你这盏灯快灭了，但别处的灯，还亮着
- 老掌柜若还在，大概会摸着你的头说："傻孩子，值了。"

**Player Experience:**
- **Tone:** Bittersweet-tragic but warm — 燃尽了，但火种不灭
- **Feeling:** 你这一辈子没白活——你的仁心，通过别人活了下去
- **Emotion:** 疲惫中的释然，苦涩中的温暖
- **Tavern-born anchor:** 酒肆熬药的味道、老掌柜的"傻孩子"、苦孩子出身、一盏灯的比喻

**Expression Updates:**
- **Cost label:** 仁心不灭·烬
- **Current goal:** 仁薪尽传，此生无憾
- **Identity:** 燃尽自己的点灯人
- **Life memory:** 救过的人还在 + 仁心传了下去 + 灯熄了，别处还亮着
- **Summary:** 一代名医 + 仁心不灭 + 薪火相传

**Stat Changes:** None — endgame is memory/legacy, not power

---

### 3.2 Branch Comp-B — 从容自在 → 医者从容·淡 (Quiet Healer's Peace)

**Late-life root:** 从容自在的老者 — 放下执念，颐养天年

**Endgame echo:** 你放下了"非救不可"的执念，平静度过了晚年。病人们偶尔还会提起"那个从容的老大夫"，说他看病的时候，让人心里踏实。你的名字不响，但有人记得。

**Narrative beat:**
- 你常常搬个小凳子坐在门口晒太阳，像当年在酒肆门口看街景一样
- 偶尔还有老病人找上门来，你随手就给看了——不收钱，就当聊聊天
- 有人说"李大夫你真好"，你只笑笑——好什么呀，就是顺手的事
- 年轻时候总觉得"我不救谁救"，硬扛了半辈子，现在想通了
- 老掌柜若还在，大概会拍你肩膀说："臭小子，终于想通了？"
- 你也笑——是啊，早该这样了

**Player Experience:**
- **Tone:** Peaceful-content — 平淡从容，润物细无声
- **Feeling:** 你没留下什么大名，但认识你的人都记得你的好
- **Emotion:** 平静、满足、淡淡然
- **Tavern-born anchor:** 晒太阳看街景、老掌柜的"想通了"、街坊邻里、随手看病不收钱

**Expression Updates:**
- **Cost label:** 医者从容·淡
- **Current goal:** 晒晒太阳看看病，从容了此一生
- **Identity:** 从容淡然的老医者
- **Life memory:** 老病人还找上门 + 随手看病不收钱 + 这辈子值了
- **Summary:** 仁心医者 + 从容淡然 + 润物细无声

**Stat Changes:** None — endgame is memory/legacy, not power

---

### 3.3 Branch Comp-C — 仁心传承 → 仁心满天下·传 (Legacy of Compassion)

**Late-life root:** 仁心满天下的老宗师 — 桃李满天下，徒弟个个仁心仁术

**Endgame echo:** 徒弟们散在各地，个个都像你年轻时一样，仁心仁术。逢年过节，他们带着徒孙们来看你，热热闹闹一院子。你坐在中间，看着这些年轻的面孔——你的仁心，传了一辈又一辈。

**Narrative beat:**
- 逢年过节，徒弟们带着徒孙们来看你，热热闹闹一院子
- 大徒弟在江南开了药庐，二徒弟在塞外救牧民，三徒弟进宫做了太医……个个都像你
- 你坐在中间，看着这些年轻的面孔，像看着年轻时候的自己——一样的仁心，一样的热血
- 有人说"老恩师您是一代宗师"，你只摆摆手——"什么宗师不宗师的，救人而已"
- 老掌柜若还在，大概会捋着胡子笑——当年酒肆里熬药的苦孩子，现在桃李满天下了
- 你想想也是——从酒肆里的苦孩子，到满天下的仁医，这辈子，值了

**Player Experience:**
- **Tone:** Warm-satisfied — 传承了，传下去了，而且传得好
- **Feeling:** 你的仁心不是结束在你身上，而是扩散开去，越来越大
- **Emotion:** 温暖、骄傲、圆满
- **Tavern-born anchor:** 徒弟们像当年的小帮工、老掌柜的欣慰、从苦孩子到宗师、仁心的传承

**Expression Updates:**
- **Cost label:** 仁心满天下·传
- **Current goal:** 看着仁心一辈辈传下去，这就够了
- **Identity:** 桃李满天下的仁医宗师
- **Life memory:** 徒弟们散在各地 + 个个仁心仁术 + 仁心传了一辈又一辈
- **Summary:** 一代名医 + 仁心传承 + 薪火满天下

**Stat Changes:** None — endgame is memory/legacy, not power

---

## 4. Pragmatic Variant — 医名远播 (Social/Medical Legacy)

**Core question:** 你的医名，流传下来了吗？

**Legacy type:** Social / historical — your reputation, your status, your medical school of thought

**Tone range:** Grand, nostalgic, complex, varied by branch

**Memory carrier:** Jianghu stories, medical records, social standing, your medical school/lineage

---

### 4.1 Branch Prag-A — 人走茶凉 → 医名犹存·寂 (Medical Name Remains)

**Late-life root:** 失势的老御医 — 靠山倒了，墙倒众人推，门前冷落

**Endgame echo:** 失势后门前冷落，人人避之不及。但你写的医书还在，你创的药方还传。人死了，势倒了，但医名还在——比权势长久。

**Narrative beat:**
- 门前冷落鞍马稀。以前送礼的人能排半条街，现在连个问安的都没有
- 你倒是看得开——这辈子什么场面没见过？从酒肆里看人脸色，到太医院里给人脸色，再到现在门可罗雀，起起落落，不就是人生吗
- 只是有时候，你会翻翻自己写的医书，勾勾改改——这些东西，传下去就好
- 你不知道的是，太医院里的年轻太医还在看你的书，江湖上的游医还在用你的方
- 权势如烟云，说散就散了。但医名不一样——它比权势长久
- 老掌柜若还在，大概会叹口气——"爬那么高干什么呢？摔下来疼啊。" 但转头又会说："可你写的那些药方，管用！"

**Player Experience:**
- **Tone:** Nostalgic-complex — 势倒了，但医名还在；冷中有暖
- **Feeling:** 你失去了权势，但留下了真正长久的东西
- **Emotion:** 复杂、释然、略带苦涩但有底气
- **Tavern-born anchor:** 从跑堂到御医的爬天梯、人走茶凉的势利眼、老掌柜的叹息、医书药方比权势长久

**Expression Updates:**
- **Cost label:** 医名犹存·寂
- **Current goal:** 权势如烟云，医名自长久
- **Identity:** 失势但名存的老太医
- **Life memory:** 门前冷落 + 医书药方还在传 + 医名比权势长久
- **Summary:** 世故名医 + 医名犹存 + 失势不失名

**Stat Changes:** None — endgame is memory/legacy, not power

---

### 4.2 Branch Prag-B — 逍遥自在 → 江湖游医·遥 (Wandering Healer Legend)

**Late-life root:** 逍遥自在的老游医 — 行走江湖，云游四方，无牵无挂

**Endgame echo:** 你行走江湖，踪迹不定。江湖上到处是"那个老游医"的传说——有人说他起死回生，有人说他脾气古怪，有人说他早就死了，有人说他还在。真假难辨，但你的名字，成了江湖传说。

**Narrative beat:**
- 你还在路上。背着药箱，拄着拐杖，从一个村子走到另一个镇子
- 有人认出你，热情招待；没人认识，就自己找个破庙凑合一晚
- 你不在乎——这辈子什么场面没见过？从酒肆里听江湖故事，到自己成了江湖故事，够了
- 只是偶尔经过某个酒肆，会停下来喝一碗——听听这些年，江湖上把你传成了什么样
- 有人说你能活死人肉白骨，有人说你脾气古怪看人下菜碟，有人说你早就死在塞外了……你听着直乐
- 老掌柜若还在，大概会笑着骂你"这匹野马，到死都拴不住"。你也笑——人生在世，不就图个自在吗？

**Player Experience:**
- **Tone:** Playful-mysterious — 传说真假参半，人逍遥
- **Feeling:** 你和你的医名已经脱钩了——它在江湖上飘着，你在路上走着
- **Emotion:** 逍遥、好笑、带点神秘的满足
- **Tavern-born anchor:** 酒肆里听江湖故事、老掌柜的"野马"、三教九流、真假传说

**Expression Updates:**
- **Cost label:** 江湖游医·遥
- **Current goal:** 传说真假谁在乎，自在就好
- **Identity:** 传说里的逍遥游医
- **Life memory:** 江湖上到处是你的传说 + 真假难辨 + 自在就好
- **Summary:** 江湖游医 + 逍遥传说 + 医名远飘

**Stat Changes:** None — endgame is memory/legacy, not power

---

### 4.3 Branch Prag-C — 德高望重 → 一代宗师·名 (Grand Master's Fame)

**Late-life root:** 德高望重的老名医 — 福寿双全，人人敬重，门生故吏满天下

**Endgame echo:** 一生圆满，福寿双全。你的医名，你的学派，你的门生，满天下都是。家里常常高朋满座，有达官贵人，有江湖豪杰，有你一手带出来的徒弟们。你坐在主位，笑眯眯地看着——这一辈子，走得稳，走得顺。

**Narrative beat:**
- 家里常常高朋满座，有达官贵人，也有江湖豪杰，还有你一手带出来的徒弟们
- 你坐在主位，笑眯眯地看着，什么人说什么话，你心里门儿清
- 太医院请你做院判你不去，江湖门派请你做供奉你也不去——就守着你的药庐，看着后辈们成长
- 有人说"李老先生您是一代宗师"，你只摆摆手——"什么宗师，就是个看病的"
- 老掌柜若还在，大概会捋着胡子得意——"我就说这小子是块料子！你看你看！"
- 你也笑——这一辈子，全靠当年在酒肆跟老掌柜学的那点人情世故。从跑堂的到一代名医，这条路，走得稳

**Player Experience:**
- **Tone:** Warm-grand — 一生圆满，福寿双全，医名满天下
- **Feeling:** 你得到了一个医者能得到的一切——名声、地位、传承、尊重
- **Emotion:** 圆满、得意、从容的满足
- **Tavern-born anchor:** 老掌柜的得意、酒肆里学的人情世故、从跑堂到名医、人人给面子

**Expression Updates:**
- **Cost label:** 一代宗师·名
- **Current goal:** 看着这一世医名，守着这一份圆满
- **Identity:** 德高望重的一代宗师
- **Life memory:** 门生故吏满天下 + 人人敬重 + 医名远播
- **Summary:** 一代名医 + 德高望重 + 医名满天下

**Stat Changes:** None — endgame is memory/legacy, not power

---

## 5. Six Branches Comparison

### 5.1 Compassionate vs Pragmatic — Axis Differentiation

| Dimension | Compassionate (薪火相传) | Pragmatic (医名远播) |
|-----------|------------------------|---------------------|
| **Core question** | 你的仁心，传下去了吗？ | 你的医名，流传下来了吗？ |
| **Legacy type** | Spiritual / ethical | Social / historical |
| **Focus** | Patients saved, students taught, compassion that lives on | Reputation, status, medical school of thought |
| **Tone range** | Warm, bittersweet, inspiring, quiet | Grand, nostalgic, complex, varied |
| **Memory carrier** | People's lives, students' practice, the spirit of healing | Jianghu stories, medical records, social standing |
| **Branch A tone** | Tragic-sacrificial (燃尽→火种) | Complex-nostalgic (失势→医名存) |
| **Branch B tone** | Peaceful-content (从容→淡然) | Playful-mysterious (逍遥→传说) |
| **Branch C tone** | Warm-satisfied (传承→满天下) | Warm-grand (德高→一代宗师) |

**2 variants are NOT mirrors:** They explore fundamentally different legacy axes — inner/spiritual vs outer/social.

### 5.2 All Six Branches Side-by-Side

| Branch | Late-Life Root | Endgame Name | Core Theme | Tone | Cost Label | Identity |
|--------|---------------|-------------|-----------|------|-----------|----------|
| **Comp-A** | 最后仁心 | 仁心不灭·烬 | 仁薪尽传，火种不灭 | Bittersweet-tragic | 仁心不灭·烬 | 燃尽自己的点灯人 |
| **Comp-B** | 从容自在 | 医者从容·淡 | 从容淡然，润物无声 | Peaceful-content | 医者从容·淡 | 从容淡然的老医者 |
| **Comp-C** | 仁心传承 | 仁心满天下·传 | 仁心传承，薪火满天下 | Warm-satisfied | 仁心满天下·传 | 桃李满天下的仁医宗师 |
| **Prag-A** | 人走茶凉 | 医名犹存·寂 | 权势如烟，医名长久 | Nostalgic-complex | 医名犹存·寂 | 失势但名存的老太医 |
| **Prag-B** | 逍遥自在 | 江湖游医·遥 | 逍遥自在，医名远飘 | Playful-mysterious | 江湖游医·遥 | 传说里的逍遥游医 |
| **Prag-C** | 德高望重 | 一代宗师·名 | 德高望重，医名满天下 | Warm-grand | 一代宗师·名 | 德高望重的一代宗师 |

**All 6 meaningfully different — not reskinned.** Each has unique core theme, tone, identity, cost label, life memory, and narrative beat.

---

## 6. Single Event Structure

### Event ID
`medical_endgame_echo`

### Type
`auto` (echo event)

### Age Range
60–65 岁 (推荐 62±3)

### Trigger
`age_reach` at age 60

### Trigger Conditions
1. `flags.has('medical_late_life_done')` — late-life 已完成
2. `!flags.has('medical_endgame_echo_done')` — 互斥 guard
3. `!flags.has('orthodox_childhood_seed_done')` — 排除正道种子
4. `!flags.has('demonic_childhood_seed_done')` — 排除魔道种子
5. `flags.has('tavern_medical_bridge_crossed')` — 隐含保证 tavern_hand origin + medical route

### Upstream Gate
`medical_late_life_done`

### Branching Logic
Based on which late-life branch marker is set:

**Compassionate:**
- `tavern_medical_late_compassionate_final` → Comp-A (仁心不灭·烬)
- `tavern_medical_late_compassionate_peaceful` → Comp-B (医者从容·淡)
- `tavern_medical_late_compassionate_legacy` → Comp-C (仁心满天下·传)

**Pragmatic:**
- `tavern_medical_late_pragmatic_fallen` → Prag-A (医名犹存·寂)
- `tavern_medical_late_pragmatic_wanderer` → Prag-B (江湖游医·遥)
- `tavern_medical_late_pragmatic_master` → Prag-C (一代宗师·名)

**Exactly one of these six will be set** (guaranteed by late-life events).

### Checkpoint Flag
`medical_endgame_echo_done` — 通用 checkpoint，标记 endgame 已发生

### Endgame Identity Flag
`medical_endgame_identity_done` — endgame 身份深化

### Branch-Specific Identity Markers
六选一设置：

**Compassionate:**
- `tavern_medical_endgame_compassionate_ember`（Comp-A：仁心不灭·烬）
- `tavern_medical_endgame_compassionate_peace`（Comp-B：医者从容·淡）
- `tavern_medical_endgame_compassionate_legacy`（Comp-C：仁心满天下·传）

**Pragmatic:**
- `tavern_medical_endgame_pragmatic_fame_remain`（Prag-A：医名犹存·寂）
- `tavern_medical_endgame_pragmatic_wanderer_legend`（Prag-B：江湖游医·遥）
- `tavern_medical_endgame_pragmatic_grand_master`（Prag-C：一代宗师·名）

### Stats
**None.** Endgame is about memory / legacy, not stat changes.

---

## 7. Endgame-Specific Player-Facing Signals

1. **Cost label change** — 仁心不灭·烬 / 医者从容·淡 / 仁心满天下·传 / 医名犹存·寂 / 江湖游医·遥 / 一代宗师·名 (clearly shows endgame state and branch)
2. **Current goal change** — each branch has distinct endgame goal
3. **Endgame identity** — 6 distinct endgame identities
4. **Life memory updates** — each branch has distinct endgame memory
5. **Summary updates** — each branch has distinct endgame summary

**At least 2 core signals: ✅ Cost label + current goal + identity — all clearly show endgame state and branch direction.**

---

## 8. Differentiation from Late-Life

| Dimension | Late-Life (52-56) | Endgame (60-65) |
|-----------|-------------------|-----------------|
| **Perspective** | First-person: 你晚年怎么做医者 | Third-person: 世人怎么记住这位医者 |
| **Core theme** | 你晚年如何做医者 | 医名身后事 |
| **Compassionate axis** | Body/spirit — aging and healing | Spiritual legacy — compassion living on |
| **Pragmatic axis** | Social/position — your status in late life | Social legacy — your name/reputation echoing |
| **Cost label** | 最后仁心/从容自在/仁心传承 / 人走茶凉/逍遥自在/德高望重 | 仁心不灭·烬/医者从容·淡/仁心满天下·传 / 医名犹存·寂/江湖游医·遥/一代宗师·名 |
| **Identity** | 燃尽自己的最后仁心/从容自在的老者/… / 失势的老御医/逍遥自在的老游医/… | 燃尽自己的点灯人/从容淡然的老医者/… / 失势但名存的老太医/传说里的逍遥游医/… |
| **Agency** | You're still practicing / living it | It's happening around you / to your legacy |
| **Event type** | Auto (consequence) | Auto (echo / realization) |

---

## 9. Differentiation from Renown Endgame

| Dimension | Medical Endgame | Renown Endgame |
|-----------|-----------------|----------------|
| **Branches** | 6 (2 variants × 3 choices) | 3 (1 variant × 3 choices) |
| **Variant structure** | 2 fundamentally different variants | Single variant |
| **Legacy axes** | 2 axes: spiritual/healing + social/medical | 1 axis: jianghu reputation |
| **Core identity** | Healer / doctor | Jianghu networker / mediator |
| **Core question** | 世人如何记住这位医者？ | 江湖如何记住你？ |
| **Flavor anchors** | 药庐、病人、徒弟、医术、仁心、世故 | 酒肆、后辈、江湖传说、人情 |
| **Naming pattern** | ·烬 / ·淡 / ·传 / ·寂 / ·遥 / ·名 | ·叹 / ·遥 / ·传 |
| **Variant differentiation** | Compassionate ≠ Pragmatic (different axes) | N/A (single variant) |

**Key difference:** Medical endgame has **2 fundamentally different legacy axes** because of the 2-variant structure. Renown endgame has only 1 axis. This makes medical endgame richer and more complex.

---

## 10. Tavern-Born Flavor Verification

All 6 branches have distinct tavern-born flavor anchors:

| Branch | Tavern-born Anchors |
|--------|-------------------|
| **Comp-A: 仁心不灭·烬** | 酒肆熬药的味道、老掌柜的"傻孩子"、苦孩子出身、一盏灯的比喻 |
| **Comp-B: 医者从容·淡** | 晒太阳看街景、老掌柜的"想通了"、街坊邻里、随手看病不收钱 |
| **Comp-C: 仁心满天下·传** | 徒弟们像当年的小帮工、老掌柜的欣慰、从苦孩子到宗师、仁心的传承 |
| **Prag-A: 医名犹存·寂** | 从跑堂到御医的爬天梯、人走茶凉的势利眼、老掌柜的叹息、医书药方比权势长久 |
| **Prag-B: 江湖游医·遥** | 酒肆里听江湖故事、老掌柜的"野马"、三教九流、真假传说 |
| **Prag-C: 一代宗师·名** | 老掌柜的得意、酒肆里学的人情世故、从跑堂到名医、人人给面子 |

**Flavor consistency: ✅ All 6 branches have distinct, meaningful tavern-born anchors**

---

## 11. Lightweight Compliance Check

| Constraint | Status | Notes |
|------------|--------|-------|
| 1 echo event maximum | ✅ Yes | Single concept event with 6 variants; implemented as 6 variant-specific auto events with unified event_record `medical_endgame_echo` |
| Expression updates only | ✅ Yes | No new systems, no new framework |
| Auto event (not choice) | ✅ Yes | Echo event, auto trigger |
| ≤6 variants | ✅ Yes | 6 variants — one per late-life branch |
| Single age window | ✅ Yes | 60-65 |
| 2+ endgame-specific signals | ✅ Yes | Cost label + current goal + identity (3+) |
| No stat changes | ✅ Yes | Endgame is memory, not stat changes |

**Lightweight compliance: ✅ 7/7 constraints satisfied**

---

**P92-004 complete.** Six endgame branches designed. All 6 meaningfully different. 2 variants with fundamentally different legacy axes (spiritual/healing vs social/medical). All tavern-born flavored. Lightweight compliant. 0 runtime changes.

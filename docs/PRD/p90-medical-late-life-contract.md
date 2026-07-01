# P90 Medical Late-Life Contract

> **Purpose:** Design-first contract for the `medical_sage_healer` late-life stage — 6 branches based on 2-variant × 3-choice payoff structure, auto event at age 52+
> **Source of truth:** This contract defines what P91 (implementation) must deliver.
> **Status:** LOCKED — P90 design-first complete
> **Target Route:** `medical_sage_healer` (一代名医)
> **Origin:** `tavern_hand` (酒肆帮工)

---

## 1. Core Direction

**Selected:** Single auto event with 6 branches — late-life as consequence of payoff choice

**Why auto (not choice):**
- Late-life is the *consequence* of the payoff choice, not a new choice
- Player already chose their path at payoff; late-life is the result unfolding
- Feels like "life unfolding based on prior decisions"
- Consistent with renown late-life pattern (auto event)

**Why 6 branches (2 variants × 3 choices):**
- Leverages the 2-variant × 3-choice structure from payoff
- Each branch delivers on the "future shadow" promised at payoff
- Meaningful differentiation — not reskinned
- Compassionate and pragmatic variants explore fundamentally different axes of late-life

**Core narrative questions:**
- Compassionate: 作为医者，燃尽自己照亮别人，值吗？
- Pragmatic: 作为世故人，爬得高摔得重，当初还爬吗？

**Variant-level axis differentiation:**
- **Compassionate late-life = inward (body + spirit):** What did a lifetime of healing do to *you*? Your body, your spirit, your sense of purpose.
- **Pragmatic late-life = outward (social + position):** What did a lifetime of playing the game do to your *place in the world*? Your status, your relationships, your reputation.

**Distinction from payoff:**
- Payoff = "我选择这样了结仁心/世故"（主动选择）
- Late-life = "这个选择，带来了这样的晚年"（自然结果）
- Payoff is choice event; Late-life is auto event

**Distinction from generic endgame:**
- Generic endgame = 临终回顾 / 最终结局
- Medical late-life = 50岁+的人生阶段，有自己的叙事和身份
- Late-life is *before* endgame/final legacy; it's an active life stage

---

## 2. Late-Life Event Spec

### Event ID
`medical_late_life`

### Type
`auto`（自动触发，不是玩家选择）

### Age Range
52–56 岁

### Trigger
`age_reach` at age 52

### Trigger Conditions
1. `flags.has('medical_payoff_done')` — payoff 已完成
2. `!flags.has('medical_late_life_done')` — 互斥 guard
3. `!flags.has('orthodox_childhood_seed_done')` — 排除正道种子
4. `!flags.has('demonic_childhood_seed_done')` — 排除魔道种子
5. `flags.has('tavern_medical_bridge_crossed')` — 隐含保证 tavern_hand origin + medical route

### Upstream Gate
`medical_payoff_done`

### Branching Logic
Branching is based on which payoff choice marker is set (exactly one of six):

**Compassionate variant:**
- `tavern_medical_payoff_compassionate_holder` → Branch Comp-A (最后仁心 / Final Compassion)
- `tavern_medical_payoff_compassionate_let_go` → Branch Comp-B (从容自在 / Peaceful Elder)
- `tavern_medical_payoff_compassionate_legacy` → Branch Comp-C (仁心传承 / Compassion Legacy)

**Pragmatic variant:**
- `tavern_medical_payoff_pragmatic_holder` → Branch Prag-A (人走茶凉 / Fallen Power)
- `tavern_medical_payoff_pragmatic_breaker` → Branch Prag-B (逍遥自在 / Wandering Free)
- `tavern_medical_payoff_pragmatic_master` → Branch Prag-C (德高望重 / Revered Elder)

**Exactly one of these six will be set** (guaranteed by payoff events).

### Checkpoint Flag
`medical_late_life_done` — 通用 checkpoint，标记 late-life 已发生

### Late-Life Identity Flag
`medical_late_life_identity_done` — late-life 身份深化（P88 预留，现在正式定义）

### Branch-Specific Identity Markers
六选一设置：

**Compassionate:**
- `tavern_medical_late_compassionate_final`（Branch Comp-A：最后仁心）
- `tavern_medical_late_compassionate_peaceful`（Branch Comp-B：从容自在）
- `tavern_medical_late_compassionate_legacy`（Branch Comp-C：仁心传承）

**Pragmatic:**
- `tavern_medical_late_pragmatic_fallen`（Branch Prag-A：人走茶凉）
- `tavern_medical_late_pragmatic_wanderer`（Branch Prag-B：逍遥自在）
- `tavern_medical_late_pragmatic_master`（Branch Prag-C：德高望重）

### Event Content (Title + Text)

**Title:** 晚景几何

**Shared opening text:**
五十岁这年，你坐在药庐门口，晒着太阳，想起了很多事——酒肆的暖炉，老掌柜的笑，还有第一次拿起针的手。

这一辈子，从酒肆帮工到一代名医，走的是仁心路还是世陌路，到了晚年，又是怎样一番光景？

**Then branch-specific text continues based on payoff choice + variant.**

---

## 3. Six Branch Details

### 3.1 Branch Comp-A: 最后仁心 (Final Compassion — Compassionate Holder Path)

#### Payoff Marker
`tavern_medical_payoff_compassionate_holder`

#### Core Narrative
硬扛了一辈子，从酒肆里的苦孩子扛成了一代名医，身体终于彻底垮了。手抖得抓不住针，眼睛看不清药方，但只要还有人找上门，你还是硬撑着坐起来。老掌柜若还在，大概会红着眼眶骂你"傻孩子"。可你知道——医者仁心，就是燃尽自己，照亮别人。

#### Branch-Specific Event Text
> 手抖得越来越厉害了，有时候连针都抓不住。
>
> 可只要门外有病人的声音，你还是撑着要起来。
>
> 徒弟们哭着劝你歇着，你只摇摇头——"能多救一个是一个。"
>
> 夜深人静时，你闻着空气里淡淡的药味，想起小时候在酒肆帮着熬药的日子，也是这样的味道。那时候苦，可现在，你觉得值。

#### Stat Changes
| Stat | Change | Rationale |
|------|--------|-----------|
| constitution | -3 | Body finally breaks completely |
| chivalry | +3 | Spirit of compassion shines brightest at the end |
| reputation | +2 | Everyone knows what you've given |
| charisma | +1 | Your example inspires people |
| **Net** | **+3** | Spirit/reputation up, body severely down |

#### Auto Effects (Comp-A)
- `flag_set`: `medical_late_life_done`
- `flag_set`: `medical_late_life_identity_done`
- `flag_set`: `tavern_medical_late_compassionate_final`
- `event_record`: `medical_late_life`
- `stat_modify`: constitution -3
- `stat_modify`: chivalry +3
- `stat_modify`: reputation +2
- `stat_modify`: charisma +1

#### Tavern-Born Flavor Anchors
- 老掌柜的眼泪 — "傻孩子，你就不能歇歇吗"
- 酒肆熬药的味道 — 小时候帮着熬，现在熬自己
- 苦孩子出身 — 苦了一辈子，也暖了一辈子
- 酒肆的暖炉 — 最后时光，像回到了酒肆的暖炉边

---

### 3.2 Branch Comp-B: 从容自在 (Peaceful Elder — Compassionate Let-Go Path)

#### Payoff Marker
`tavern_medical_payoff_compassionate_let_go`

#### Core Narrative
年轻时总觉得"我不救谁救"，硬扛了半辈子，终于学会了放手。到了晚年，你成了最从容的老者——没事晒晒太阳，给街坊看看小病，徒弟们都独当一面了，你乐得清闲。酒肆的老掌柜若还在，大概会笑着拍你肩膀——"臭小子，终于想通了？"你也笑——是啊，早该这样了。

#### Branch-Specific Event Text
> 你常常搬个小凳子坐在门口晒太阳，像当年在酒肆门口看街景一样。
>
> 街坊邻居有个头疼脑热的来找你，你随手就给看了——不收钱，就当聊聊天。
>
> 徒弟们都长大了，各自开了药庐，你乐得清闲。
>
> 有时候想起年轻时候硬扛的那些日子，你摇摇头——那时候真傻，可也真热血。

#### Stat Changes
| Stat | Change | Rationale |
|------|--------|-----------|
| constitution | +2 | Finally taking care of yourself |
| charisma | +3 | Peaceful wisdom draws people in |
| chivalry | +1 | Still compassionate, just not self-destructive |
| reputation | +1 | Respected for your wisdom |
| **Net** | **+7** | All around increase — the "healthiest" compassionate ending |

#### Auto Effects (Comp-B)
- `flag_set`: `medical_late_life_done`
- `flag_set`: `medical_late_life_identity_done`
- `flag_set`: `tavern_medical_late_compassionate_peaceful`
- `event_record`: `medical_late_life`
- `stat_modify`: constitution +2
- `stat_modify`: charisma +3
- `stat_modify`: chivalry +1
- `stat_modify`: reputation +1

#### Tavern-Born Flavor Anchors
- 老掌柜的笑 — "臭小子，终于想通了"
- 酒肆的晒台 — 晒太阳，看街景，像回到了酒肆
- 街坊邻里 — 小病小痛来找你，像酒肆的老客人
- 放下算盘 — 不再算"救了多少人"，算"今天开心吗"

---

### 3.3 Branch Comp-C: 仁心传承 (Compassion Legacy — Compassionate Legacy Path)

#### Payoff Marker
`tavern_medical_payoff_compassionate_legacy`

#### Core Narrative
一辈子行医救人，到了晚年，最骄傲的不是治好了多少人，而是带出了一群好徒弟。徒弟们散在各地，个个都像你年轻时一样，仁心仁术。有人说"名师出高徒"，你只说"是他们自己心好"。酒肆的老掌柜若还在，大概会捋着胡子笑——当年酒肆里的苦孩子，现在桃李满天下了。

#### Branch-Specific Event Text
> 逢年过节，徒弟们带着徒孙们来看你，热热闹闹一院子。
>
> 你坐在中间，看着这些年轻的面孔，像看着年轻时候的自己——一样的仁心，一样的热血。
>
> 老掌柜若还在，大概会笑着说"这酒肆里熬出来的药香，飘到全天下了。"
>
> 你想想也是——从酒肆里的苦孩子，到满天下的仁医，这辈子，值了。

#### Stat Changes
| Stat | Change | Rationale |
|------|--------|-----------|
| reputation | +4 | Widely revered as a teacher/healer |
| chivalry | +2 | Your compassion multiplied through students |
| charisma | +2 | Wise, warm, deeply respected |
| connections | +2 | Former students everywhere |
| **Net** | **+10** | Strongest net — legacy multiplies your impact |

#### Auto Effects (Comp-C)
- `flag_set`: `medical_late_life_done`
- `flag_set`: `medical_late_life_identity_done`
- `flag_set`: `tavern_medical_late_compassionate_legacy`
- `event_record`: `medical_late_life`
- `stat_modify`: reputation +4
- `stat_modify`: chivalry +2
- `stat_modify`: charisma +2
- `stat_modify`: connections +2

#### Tavern-Born Flavor Anchors
- 老掌柜的欣慰 — "心善传了一辈又一辈"
- 酒肆的徒弟们 — 徒弟们来看你，像当年酒肆的小帮工
- 传道授业 — 像老掌柜当年教你一样教徒弟
- 仁心的传承 — 从酒肆里的苦孩子到满天下的仁医

---

### 3.4 Branch Prag-A: 人走茶凉 (Fallen Power — Pragmatic Holder Path)

#### Payoff Marker
`tavern_medical_payoff_pragmatic_holder`

#### Core Narrative
从酒肆跑堂爬到太医院院判，你靠的不只是医术，还有人情练达。可爬得越高，摔得越重——靠山倒了，墙倒众人推，一夜之间，从人人巴结的"李院判"变成了无人问津的"老李头"。酒肆的老掌柜若还在，大概会叹口气——"爬那么高干什么呢？摔下来疼啊。"可你知道——不爬，就只能在酒肆里端一辈子盘子。

#### Branch-Specific Event Text
> 门前冷落鞍马稀。
>
> 以前送礼的人能排半条街，现在连个问安的都没有。
>
> 你倒是看得开——这辈子什么场面没见过？从酒肆里看人脸色，到太医院里给人脸色，再到现在门可罗雀，起起落落，不就是人生吗。
>
> 只是有时候深夜醒来，想起当年在酒肆里端盘子的日子——那时候穷，可睡得踏实。

#### Stat Changes
| Stat | Change | Rationale |
|------|--------|-----------|
| reputation | -3 | Fall from grace — people avoid you now |
| connections | -4 | Most "friends" disappeared |
| money | -2 | Lost wealth and position |
| charisma | +2 | Still sharp, still charismatic — humbled but not broken |
| constitution | +1 | No more court politics — actually healthier |
| **Net** | **-6** | Big drop in status, but some silver linings |

#### Auto Effects (Prag-A)
- `flag_set`: `medical_late_life_done`
- `flag_set`: `medical_late_life_identity_done`
- `flag_set`: `tavern_medical_late_pragmatic_fallen`
- `event_record`: `medical_late_life`
- `stat_modify`: reputation -3
- `stat_modify`: connections -4
- `stat_modify`: money -2
- `stat_modify`: charisma +2
- `stat_modify`: constitution +1

#### Tavern-Born Flavor Anchors
- 老掌柜的叹息 — "爬那么高干什么呢？摔下来疼啊"
- 从跑堂到御医 — 爬天梯一样的一辈子
- 酒肆的势利眼 — 见多了人走茶凉，没想到自己也有这一天
- 算盘珠子 — 算了一辈子人情账，最后算到了自己头上

---

### 3.5 Branch Prag-B: 逍遥自在 (Wandering Free — Pragmatic Breaker Path)

#### Payoff Marker
`tavern_medical_payoff_pragmatic_breaker`

#### Core Narrative
年轻时撕破了所有假人情，断了所有牵绊，一辈子行走江湖，到处行医。到了晚年，你还是在路上——从江南走到塞北，从东海走到西域，什么权贵什么人情，全不放在眼里。酒肆的老掌柜若还在，大概会笑着骂你"这匹野马，到死都拴不住"。你也笑——人生在世，不就图个自在吗？

#### Branch-Specific Event Text
> 你还在路上。
>
> 背着药箱，拄着拐杖，从一个村子走到另一个镇子。
>
> 有人认出你，热情招待；没人认识，就自己找个破庙凑合一晚。
>
> 你不在乎——这辈子什么场面没见过？从酒肆里听江湖故事，到自己成了江湖故事，够了。只是偶尔经过某个酒肆，会停下来喝一碗——还是当年的味道吗？

#### Stat Changes
| Stat | Change | Rationale |
|------|--------|-----------|
| constitution | +2 | Healthy from walking everywhere |
| chivalry | +2 | Helps people freely, no strings attached |
| charisma | +2 | Wild, free, magnetic — people are drawn to your spirit |
| connections | -3 | No fixed home, few lasting relationships |
| **Net** | **+3** | Freedom and health up, roots and connections down |

#### Auto Effects (Prag-B)
- `flag_set`: `medical_late_life_done`
- `flag_set`: `medical_late_life_identity_done`
- `flag_set`: `tavern_medical_late_pragmatic_wanderer`
- `event_record`: `medical_late_life`
- `stat_modify`: constitution +2
- `stat_modify`: chivalry +2
- `stat_modify`: charisma +2
- `stat_modify`: connections -3

#### Tavern-Born Flavor Anchors
- 老掌柜的笑骂 — "这匹野马，到死都拴不住"
- 三教九流 — 见多了江湖人，自己也成了江湖人
- 酒肆的江湖客 — 小时候听他们讲故事，现在自己就是故事
- 逍遥自在 — 像风一样，谁也抓不住

---

### 3.6 Branch Prag-C: 德高望重 (Revered Elder — Pragmatic Master Path)

#### Payoff Marker
`tavern_medical_payoff_pragmatic_master`

#### Core Narrative
一辈子人情练达，拿捏得住分寸，分得清真假，既不得罪人也不亏着自己。到了晚年，你成了人人敬重的老名医——权贵给你面子，江湖人也卖你情面，徒弟们个个有出息。酒肆的老掌柜若还在，大概会捋着胡子得意——"我就说这小子是块料子"。你也笑——这一辈子，全靠老掌柜教的那点人情世故。

#### Branch-Specific Event Text
> 家里常常高朋满座，有达官贵人，也有江湖豪杰，还有你一手带出来的徒弟们。
>
> 你坐在主位，笑眯眯地看着，什么人说什么话，你心里门儿清。
>
> 有时候想起当年在酒肆里跟老掌柜学看人学说话的日子，忍不住笑——那时候哪能想到，酒肆里学的那点东西，能用一辈子呢？
>
> 老掌柜要是知道你现在这样子，大概会得意得胡子都翘起来吧。

#### Stat Changes
| Stat | Change | Rationale |
|------|--------|-----------|
| reputation | +4 | Universally respected |
| connections | +3 | Strong network across all levels of society |
| charisma | +3 | Wise, measured, deeply charismatic |
| money | +2 | Comfortable, wealthy even |
| constitution | +1 | Taking care of yourself |
| **Net** | **+13** | Strongest overall — the "perfect" pragmatic ending |

#### Auto Effects (Prag-C)
- `flag_set`: `medical_late_life_done`
- `flag_set`: `medical_late_life_identity_done`
- `flag_set`: `tavern_medical_late_pragmatic_master`
- `event_record`: `medical_late_life`
- `stat_modify`: reputation +4
- `stat_modify`: connections +3
- `stat_modify`: charisma +3
- `stat_modify`: money +2
- `stat_modify`: constitution +1

#### Tavern-Born Flavor Anchors
- 老掌柜的得意 — "我就说这小子是块料子"
- 酒肆的人情课 — 从老掌柜那儿学的人情世故
- 人人给面子 — 像酒肆里最受欢迎的老客人
- 算盘珠子 — 算了一辈子人情账，算得明明白白

---

## 4. Player-Facing Expression Updates

### 4.1 Sample Line Expression (`sampleLineExpression.ts`)

#### `deriveSampleLineCostLabel()` — late-life 分支

**Gate order:** `medical_late_life_done` > `medical_payoff_done` > `medical_midlife_pressure_done` > `medical_on_ramp_done` > `tavern_medical_bridge_crossed` > base

| Branch | Cost Label Text |
|--------|----------------|
| Comp-A (最后仁心) | 最后仁心 |
| Comp-B (从容自在) | 从容自在 |
| Comp-C (仁心传承) | 仁心传承 |
| Prag-A (人走茶凉) | 人走茶凉 |
| Prag-B (逍遥自在) | 逍遥自在 |
| Prag-C (德高望重) | 德高望重 |

#### `medicalCurrentGoal()` — late-life 分支

**Gate order:** `medical_late_life_done` > `medical_payoff_done` > `medical_midlife_pressure_done` > `medical_on_ramp_done` > `tavern_medical_bridge_crossed` > base

| Branch | Current Goal Text |
|--------|------------------|
| Comp-A (最后仁心) | 多救一个是一个，撑到最后一刻 |
| Comp-B (从容自在) | 晒晒太阳看看病，过好剩下的日子 |
| Comp-C (仁心传承) | 看着徒弟们成长，仁心传下去就够了 |
| Prag-A (人走茶凉) | 看淡世态炎凉，过好自己的日子 |
| Prag-B (逍遥自在) | 走到哪儿算哪儿，自在就好 |
| Prag-C (德高望重) | 看着这一世繁华，守着这一份体面 |

#### `medicalAge40Identity()` → expand to late-life identity

**Note:** The existing function covers age-40 identity. For late-life, we add a deeper identity layer. The function should check `medical_late_life_identity_done` first, then fall back to `medical_age40_identity_done`.

**Gate order:** `medical_late_life_identity_done` > `medical_age40_identity_done` > base

| Branch | Late-Life Identity Text |
|--------|------------------------|
| Comp-A (最后仁心) | 你是燃尽自己的最后仁心：从酒肆里的苦孩子到一代名医，你硬扛了一辈子。身体垮了，手抖了，眼看不清了，可只要还有人找上门，你还是撑着坐起来。老掌柜若还在，大概会哭着骂你傻。可你知道——医者仁心，就是燃尽自己，照亮别人。 |
| Comp-B (从容自在) | 你是从容自在的老者：硬扛了半辈子，终于学会了放手。到了晚年，你成了最从容的老者——没事晒晒太阳，给街坊看看小病，徒弟们都独当一面了。酒肆的老掌柜若还在，大概会笑着拍你肩膀——"臭小子，终于想通了？"你也笑——是啊，早该这样了。 |
| Comp-C (仁心传承) | 你是仁心满天下的老宗师：一辈子行医救人，带出了一群好徒弟。徒弟们散在各地，个个仁心仁术，像你年轻时一样。有人说你是"一代宗师"，你只摆摆手——"什么宗师不宗师的，救人而已。"酒肆的老掌柜若还在，大概会捋着胡子笑——当年酒肆里的苦孩子，现在桃李满天下了。 |
| Prag-A (人走茶凉) | 你是失势的老御医：从酒肆跑堂爬到太医院院判，你风光了半辈子。可靠山一倒，墙倒众人推，从人人巴结的"李院判"变成了无人问津的"老李头"。有人说你可怜，你只冷笑——可怜？你见过的世面，这些人一辈子都见不到。酒肆老掌柜若还在，大概会叹口气——爬那么高干什么呢？可你知道——不爬，就只能端一辈子盘子。 |
| Prag-B (逍遥自在) | 你是逍遥自在的老游医：撕破了所有假人情，断了所有牵绊，一辈子行走江湖。从江南走到塞北，从东海走到西域，什么权贵什么人情，全不放在眼里。酒肆老掌柜若还在，大概会笑着骂你"这匹野马，到死都拴不住"。你也笑——人生在世，不就图个自在吗？ |
| Prag-C (德高望重) | 你是德高望重的老名医：一辈子人情练达，拿捏得住分寸，分得清真假。到了晚年，人人敬重——权贵给你面子，江湖人卖你情面，徒弟们个个有出息。酒肆老掌柜若还在，大概会捋着胡子得意——"我就说这小子是块料子！"你也笑——这一辈子，全靠当年在酒肆学的那点人情世故。 |

### 4.2 Ordinary Origin Expression (`ordinaryOriginExpression.ts`)

#### `tavernCurrentGoal()` — late-life 分支

**Gate order:** `medical_late_life_done` > `medical_payoff_done` > `medical_midlife_pressure_done` > `medical_on_ramp_done` > `tavern_medical_bridge_crossed` > base

(Same as sample line current goal — 6 branches)

#### `tavernLifeMemory()` — late-life 记忆

| Branch | Life Memory Text |
|--------|-----------------|
| Comp-A (最后仁心) | 手抖得越来越厉害了，有时候连针都抓不住。可只要门外有病人的声音，你还是撑着要起来。徒弟们哭着劝你歇着，你只摇摇头——"能多救一个是一个。"夜深人静时，你闻着空气里淡淡的药味，想起小时候在酒肆帮着熬药的日子，也是这样的味道。那时候苦，可现在，你觉得值。 |
| Comp-B (从容自在) | 你常常搬个小凳子坐在门口晒太阳，像当年在酒肆门口看街景一样。街坊邻居有个头疼脑热的来找你，你随手就给看了——不收钱，就当聊聊天。徒弟们都长大了，各自开了药庐，你乐得清闲。有时候想起年轻时候硬扛的那些日子，你摇摇头——那时候真傻，可也真热血。 |
| Comp-C (仁心传承) | 逢年过节，徒弟们带着徒孙们来看你，热热闹闹一院子。你坐在中间，看着这些年轻的面孔，像看着年轻时候的自己——一样的仁心，一样的热血。老掌柜若还在，大概会笑着说"这酒肆里熬出来的药香，飘到全天下了。"你想想也是——从酒肆里的苦孩子，到满天下的仁医，这辈子，值了。 |
| Prag-A (人走茶凉) | 门前冷落鞍马稀。以前送礼的人能排半条街，现在连个问安的都没有。你倒是看得开——这辈子什么场面没见过？从酒肆里看人脸色，到太医院里给人脸色，再到现在门可罗雀，起起落落，不就是人生吗。只是有时候深夜醒来，想起当年在酒肆里端盘子的日子——那时候穷，可睡得踏实。 |
| Prag-B (逍遥自在) | 你还在路上。背着药箱，拄着拐杖，从一个村子走到另一个镇子。有人认出你，热情招待；没人认识，就自己找个破庙凑合一晚。你不在乎——这辈子什么场面没见过？从酒肆里听江湖故事，到自己成了江湖故事，够了。只是偶尔经过某个酒肆，会停下来喝一碗——还是当年的味道吗？ |
| Prag-C (德高望重) | 家里常常高朋满座，有达官贵人，也有江湖豪杰，还有你一手带出来的徒弟们。你坐在主位，笑眯眯地看着，什么人说什么话，你心里门儿清。有时候想起当年在酒肆里跟老掌柜学看人学说话的日子，忍不住笑——那时候哪能想到，酒肆里学的那点东西，能用一辈子呢？老掌柜要是知道你现在这样子，大概会得意得胡子都翘起来吧。 |

#### `deriveOrdinaryOriginSummary()` — late-life 终局总结

| Branch | Summary Text |
|--------|-------------|
| Comp-A (最后仁心) | 酒肆出身的仁心名医：硬扛了一辈子，燃尽了自己，照亮了无数人。身体垮了，可仁心还在。老掌柜若还在，大概会哭着说你傻。可你知道——这就是医者的命。 |
| Comp-B (从容自在) | 酒肆出身的仁心名医：硬扛了半辈子，终于学会了放下。晚年过得从容自在，晒晒太阳看看病，像回到了酒肆的日子。老掌柜若还在，大概会笑着说你终于想通了。 |
| Comp-C (仁心传承) | 酒肆出身的仁心名医：一辈子救人，也一辈子教人。徒弟们散在各地，仁心传了一辈又一辈。从酒肆里的苦孩子到桃李满天下的老宗师，这辈子，值了。 |
| Prag-A (人走茶凉) | 酒肆出身的世故名医：从跑堂爬到御医，风光了半辈子，也摔了下来。人走茶凉，世态炎凉，你都见过了。有人说你可怜，你只冷笑——可怜？你见过的世面，这些人一辈子都见不到。 |
| Prag-B (逍遥自在) | 酒肆出身的世故名医：撕破了所有假人情，断了所有牵绊，一辈子行走江湖，逍遥自在。从酒肆里听江湖故事，到自己成了江湖故事。有人说你漂泊可怜，你只笑——可怜？这叫自在。 |
| Prag-C (德高望重) | 酒肆出身的世故名医：一辈子人情练达，拿捏得住分寸，分得清真假。从酒肆里跟老掌柜学说话，到成为人人敬重的老名医，这一辈子，走得稳，走得顺。老掌柜若还在，大概会得意得很——我就说这小子是块料子！ |

### 4.3 Core Late-Life Signals（至少 3 个）

1. **Cost label**（最后仁心 / 从容自在 / 仁心传承 / 人走茶凉 / 逍遥自在 / 德高望重）— 主屏幕路线代价标签
2. **Current goal**（6 种不同目标）— 主屏幕当前目标
3. **Late-life identity**（6 种不同身份）— 身份总结
4. **Life memory**（late-life 记忆）— 人生记忆面板
5. **Origin summary**（终局总结）— 出身总结行

---

## 5. Stat Changes Summary

| Stat | Comp-A | Comp-B | Comp-C | Prag-A | Prag-B | Prag-C |
|------|--------|--------|--------|--------|--------|--------|
| reputation | +2 | +1 | +4 | -3 | 0 | +4 |
| constitution | -3 | +2 | 0 | +1 | +2 | +1 |
| chivalry | +3 | +1 | +2 | 0 | +2 | 0 |
| connections | 0 | 0 | +2 | -4 | -3 | +3 |
| charisma | +1 | +3 | +2 | +2 | +2 | +3 |
| money | 0 | 0 | 0 | -2 | 0 | +2 |
| **净值** | **+3** | **+7** | **+10** | **-6** | **+3** | **+13** |

**Design notes:**
- Comp-C (仁心传承) is the strongest compassionate ending — legacy multiplies impact
- Prag-C (德高望重) is the strongest overall ending — perfect navigation of the social game
- Prag-A (人走茶凉) has the lowest net — fall from power, but with silver linings (better health, sharper charisma)
- Comp-A (最后仁心) has body down but spirit up — noble tragedy
- Each branch has different tradeoffs; no single "correct" choice
- Compassionate variants lean on constitution + chivalry; Pragmatic variants lean on reputation + connections + money
- Variant differentiation is clear: compassionate = body/spirit axis; pragmatic = social/position axis

---

## 6. Reserved Flag Interfaces (for Future Stages)

预留以下 flag 接口（本阶段不实现逻辑，仅占位命名）：
- `medical_endgame_echo_done` — 终局回响（P92+ 或更远）

**预留意图：** 确保 late-life 的六个分支方向都能在 endgame / final legacy 阶段有差异化延伸，不会因为今天的设计把未来的路堵死。

---

## 7. Flavor Constraints

1. **Tavern-born healer first:** 所有分支和表达都必须有酒肆出身的医者味道——酒肆、药庐、老掌柜、熬药、苦孩子/人精、仁心/世故
2. **Not generic old doctor:** 不能写成通用的"老中医晚年"，必须是"酒肆出身的医者遇到晚年会怎样"
3. **Two variants, two axes:** Compassionate = body/spirit（向内）；Pragmatic = social/position（向外）。两个 variant 不能是镜像。
4. **Six branches feel meaningfully different:** 不是换皮选择，属性变化、身份感、叙事调性、情感基调都要有实质差异
5. **Payoff → Late-life 递进自然:** Payoff 是"我选择这样了结"，Late-life 是"这个选择带来了这样的晚年"
6. **Distinct from renown late-life:** Medical = healer identity（仁心/医者）；Renown = jianghu networker identity（人情/面子）。不能写成 renown late-life 的翻版。

---

## 8. Gate Acceptance Criteria

### Pre-Late-Life (must be true for event to fire)
- [ ] `medical_payoff_done === true`
- [ ] `medical_late_life_done === false`
- [ ] `tavern_medical_bridge_crossed === true`
- [ ] Age between 52 and 56
- [ ] No orthodox/demonic childhood seeds
- [ ] Exactly one of the six payoff choice markers is set

### Post-Late-Life (must be true after event)
- [ ] `medical_late_life_done === true`
- [ ] `medical_late_life_identity_done === true`
- [ ] Exactly one of the six late-life markers is set
- [ ] The late-life marker matches the payoff marker (comp-A→comp-A, etc.)
- [ ] Cost label matches the selected branch
- [ ] Current goal matches the selected branch
- [ ] Late-life identity matches the selected branch
- [ ] Life memory matches the selected branch
- [ ] Origin summary matches the selected branch
- [ ] Stat changes match the branch spec
- [ ] Compassionate and pragmatic variants feel fundamentally different (body/spirit vs social/position)

---

## 9. Boundary with P91 (Implementation)

| P90 (Design-First) | P91 (Implementation) |
|-------------------|---------------------|
| Prerequisite audit | Runtime event wiring in sample-lines-spine.json |
| Scope contract | Expression updates in sampleLineExpression.ts |
| Branch design | Expression updates in ordinaryOriginExpression.ts |
| Late-life contract (本文档) | Targeted proof document |
| Validation shape | Regression tests (~55-65 tests for 6 branches) |
| Closure report + GO/NO-GO | Closure report |

**P91 must deliver on everything defined in this contract. No scope expansion beyond what's defined here without a new PRD.**

---

*Contract locked by P90 design-first stage. P91 implementation proceeds from here (if GO).*

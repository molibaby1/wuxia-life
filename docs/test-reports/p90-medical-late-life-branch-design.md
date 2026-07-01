# P90 Medical Late-Life Branch Design

> **Date:** 2026-06-29
> **Stage:** P90 Wuxia Medical Late-Life Design-First
> **Purpose:** Design six distinct late-life branches (one per payoff choice) with meaningful differentiation across 2 variants
> **Target Route:** `medical_sage_healer` (一代名医)
> **Origin:** `tavern_hand` (酒肆帮工)
> **Variants:** Compassionate (仁心医者) + Pragmatic (世故人医)

---

## 1. Design Decision: Single Auto Event with 6 Branches

**Decision:** Late-life is a **single auto event with 6 branches** (branching based on payoff choice marker — 2 variants × 3 choices each).

**Rationale:**
- Bounded scope — 1 event, not a full late-life expansion
- Leverages the 2-variant × 3-choice structure from payoff
- Each branch has distinct narrative and identity
- Consistent with prior medical pattern (each stage = spine events with variant branching)
- Lower implementation and testing cost than multi-event
- Auto feels like "life unfolding" based on prior decisions — the player already chose their path at payoff

**Why not multi-event per variant?**
- 6 branches already = 2× renown's complexity
- Multi-event would balloon scope and testing burden
- 1 event with 6 branches already provides meaningful differentiation
- Can always expand later if justified

**Why auto (not choice)?**
- Late-life is the *consequence* of the payoff choice, not a new choice
- The player already chose their path at payoff; late-life is the result
- Auto feels like "life unfolding" based on prior decisions

---

## 2. Late-Life Timing

**Age range:** 52–56

**Trigger:** `age_reach` at age 52

**Why 52?**
- ~9 years after payoff (age 43) — enough time for the payoff choice to "settle" and show long-term effects
- ~12 years after pressure (age 40) — clearly a new life stage, not just continuation
- Consistent with renown late-life timing (age 52–56)
- Old enough to feel like "late life" but young enough to still be active as a healer

**Upstream gate:** `medical_payoff_done`

**Branch selector:** 6 payoff choice markers (compassionate: holder/let_go/legacy; pragmatic: holder/breaker/master)

---

## 3. Variant-Level Differentiation (Compassionate vs Pragmatic)

Before diving into individual branches, let's establish how the two variants differ in late-life — this is critical to avoid "mirroring."

| Dimension | Compassionate Late-Life | Pragmatic Late-Life |
|-----------|------------------------|---------------------|
| **Core theme** | 身体与精神的消耗与和解 | 社会地位与人际关系的沉浮 |
| **Direction** | Inward — what happened to *me* as a healer | Outward — what happened to *my place* in the world |
| **Key question** | "作为医者，我这一生值吗？" | "作为世故人，我这一生值吗？" |
| **Tone range** | Tragic → peaceful → warm (all introspective) | Burdened → free → revered (all social) |
| **Tavern anchor type** | 酒肆里的苦孩子 → 老了的苦孩子 | 酒肆里的人精 → 老了的人精 |
| **Late-life cost** | Physical/mental — body/mind wears out | Social — reputation/relationships shift |
| **Identity shift** | From "healer" to "elder healer" (body/mind focus) | From "networker" to "elder statesman" (social focus) |

**Key insight:** Compassionate late-life is about the *body and spirit* of the healer — what a lifetime of healing took from them, and what they made of it. Pragmatic late-life is about the *social position* of the healer — how their choices about status and connections played out over time. These are fundamentally different axes.

---

## 4. Compassionate Variant: Three Late-Life Branches

Compassionate variant = 仁心医者. Late-life is about the physical and spiritual cost of a lifetime of putting others first.

### 4.1 Branch Comp-A: 硬扛到底 → 最后的仁心 (Holder → Final Compassion)

**Payoff choice:** 硬扛到底 — 油尽灯枯的仁心医者，把所有病人都扛在自己身上，身体垮了，但仁心不改

**Late-life arc:** 一辈子硬扛着，从酒肆里的苦孩子扛成了一代名医，到了晚年，身体终于彻底垮了。手抖得抓不住针，眼睛看不清药方，但只要还有人找上门，你还是硬撑着坐起来。老掌柜若还在，大概会红着眼眶骂你"傻孩子，你就不能歇歇吗"。可你知道——有些手，伸出去了就收不回来。

**Core question:** 燃尽自己照亮别人，值吗？

**Tavern-Born Flavor Anchors:**
- 老掌柜的眼泪 — "傻孩子，你就不能歇歇吗"
- 酒肆熬药的味道 — 小时候帮着熬，现在熬自己
- 苦孩子出身 — 苦了一辈子，也暖了一辈子
- 酒肆的暖炉 — 最后时光，像回到了酒肆的暖炉边

**Player Experience:**
- **Tone:** Tragic, deeply moving, noble
- **Feeling:** "I knew this would happen, but I'd do it again" — the purest expression of the compassionate healer identity
- **Identity shift:** 油尽灯枯的仁心医者 → 燃尽自己的最后仁心
- **Emotional beat:** Sad but transcendent — the healer who gave everything, and would give it again

**Stat Changes:**
| Stat | Change | Rationale |
|------|--------|-----------|
| constitution | -3 | Body finally breaks completely |
| chivalry | +3 | Spirit of compassion shines brightest at the end |
| reputation | +2 | Everyone knows what you've given |
| charisma | +1 | Your example inspires people |
| **Net** | **+3** | Spirit/reputation up, body severely down |

**Identity Marker:**
`tavern_medical_late_compassionate_final`

**Expression Signals:**
| Surface | Text Direction |
|---------|---------------|
| Cost label | 最后仁心 |
| Current goal | 多救一个是一个，撑到最后一刻 |
| Late-life identity | 燃尽自己的最后仁心：从酒肆里的苦孩子到一代名医，你硬扛了一辈子。身体垮了，手抖了，眼看不清了，可只要还有人找上门，你还是撑着坐起来。老掌柜若还在，大概会哭着骂你傻。可你知道——医者仁心，就是燃尽自己，照亮别人。 |
| Life memory | 手抖得越来越厉害了，有时候连针都抓不住。可只要门外有病人的声音，你还是撑着要起来。徒弟们哭着劝你歇着，你只摇摇头——"能多救一个是一个。"夜深人静时，你闻着空气里淡淡的药味，想起小时候在酒肆帮着熬药的日子，也是这样的味道。那时候苦，可现在，你觉得值。 |
| Origin summary | 酒肆出身的仁心名医：硬扛了一辈子，燃尽了自己，照亮了无数人。身体垮了，可仁心还在。老掌柜若还在，大概会哭着说你傻。可你知道——这就是医者的命。 |

---

### 4.2 Branch Comp-B: 学会放手 → 从容老者 (Let Go → Peaceful Elder)

**Payoff choice:** 学会放手 — 释然通透的医者，放下了"必须救所有人"的执念，反而活得更从容

**Late-life arc:** 年轻时总觉得"我不救谁救"，硬扛了半辈子，终于学会了放手。到了晚年，你成了最从容的老者——没事晒晒太阳，给街坊看看小病，徒弟们都独当一面了，你乐得清闲。酒肆的老掌柜若还在，大概会笑着拍你肩膀——"臭小子，终于想通了？早该这样了。"你也笑——是啊，早该这样了。

**Core question:** 放下执念，才能好好活？

**Tavern-Born Flavor Anchors:**
- 老掌柜的笑 — "臭小子，终于想通了"
- 酒肆的晒台 — 晒太阳，看街景，像回到了酒肆
- 街坊邻里 — 小病小痛来找你，像酒肆的老客人
- 放下算盘 — 不再算"救了多少人"，算"今天开心吗"

**Player Experience:**
- **Tone:** Peaceful, content, wise
- **Feeling:** "I finally learned to let go, and life got better" — the reward for letting go of guilt
- **Identity shift:** 释然通透的医者 → 从容自在的老者
- **Emotional beat:** Warm and peaceful — the "good ending" for the compassionate healer who learned self-care

**Stat Changes:**
| Stat | Change | Rationale |
|------|--------|-----------|
| constitution | +2 | Finally taking care of yourself |
| charisma | +3 | Peaceful wisdom draws people in |
| chivalry | +1 | Still compassionate, just not self-destructive |
| reputation | +1 | Respected for your wisdom |
| **Net** | **+7** | All around increase — the "healthiest" compassionate ending |

**Identity Marker:**
`tavern_medical_late_compassionate_peaceful`

**Expression Signals:**
| Surface | Text Direction |
|---------|---------------|
| Cost label | 从容自在 |
| Current goal | 晒晒太阳看看病，过好剩下的日子 |
| Late-life identity | 从容自在的老者：硬扛了半辈子，终于学会了放手。到了晚年，你成了最从容的老者——没事晒晒太阳，给街坊看看小病，徒弟们都独当一面了。酒肆的老掌柜若还在，大概会笑着拍你肩膀——"臭小子，终于想通了？"你也笑——是啊，早该这样了。 |
| Life memory | 你常常搬个小凳子坐在门口晒太阳，像当年在酒肆门口看街景一样。街坊邻居有个头疼脑热的来找你，你随手就给看了——不收钱，就当聊聊天。徒弟们都长大了，各自开了药庐，你乐得清闲。有时候想起年轻时候硬扛的那些日子，你摇摇头——那时候真傻，可也真热血。 |
| Origin summary | 酒肆出身的仁心名医：硬扛了半辈子，终于学会了放下。晚年过得从容自在，晒晒太阳看看病，像回到了酒肆的日子。老掌柜若还在，大概会笑着说你终于想通了。 |

---

### 4.3 Branch Comp-C: 找到传承 → 仁心满天下 (Legacy → Compassion Legacy)

**Payoff choice:** 找到传承 — 传道授业的仁医之师，找到了徒弟，把仁心传了下去

**Late-life arc:** 一辈子行医救人，到了晚年，最骄傲的不是治好了多少人，而是带出了一群好徒弟。徒弟们散在各地，个个都像你年轻时一样，仁心仁术。有人说"名师出高徒"，你只说"是他们自己心好"。酒肆的老掌柜若还在，大概会捋着胡子笑——"当年我就说你这孩子心善，现在好了，心善传了一辈又一辈。"

**Core question:** 医术有尽头，仁心无尽头？

**Tavern-Born Flavor Anchors:**
- 老掌柜的欣慰 — "心善传了一辈又一辈"
- 酒肆的徒弟们 — 徒弟们来看你，像当年酒肆的小帮工
- 传道授业 — 像老掌柜当年教你一样教徒弟
- 仁心的传承 — 从酒肆里的苦孩子到满天下的仁医

**Player Experience:**
- **Tone:** Warm, proud, fulfilling
- **Feeling:** "My life's work will continue after I'm gone" — the most "complete" feeling of the compassionate three
- **Identity shift:** 传道授业的仁医之师 → 仁心满天下的老宗师
- **Emotional beat:** Deeply fulfilling — the compassionate healer's legacy lives on through others

**Stat Changes:**
| Stat | Change | Rationale |
|------|--------|-----------|
| reputation | +4 | Widely revered as a teacher/healer |
| chivalry | +2 | Your compassion multiplied through students |
| charisma | +2 | Wise, warm, deeply respected |
| constitution | 0 | Old but holding on — not great, not terrible |
| connections | +2 | Former students everywhere |
| **Net** | **+10** | Strongest net — legacy multiplies your impact |

**Identity Marker:**
`tavern_medical_late_compassionate_legacy`

**Expression Signals:**
| Surface | Text Direction |
|---------|---------------|
| Cost label | 仁心传承 |
| Current goal | 看着徒弟们成长，仁心传下去就够了 |
| Late-life identity | 仁心满天下的老宗师：一辈子行医救人，带出了一群好徒弟。徒弟们散在各地，个个仁心仁术，像你年轻时一样。有人说你是"一代宗师"，你只摆摆手——"什么宗师不宗师的，救人而已。"酒肆的老掌柜若还在，大概会捋着胡子笑——当年酒肆里的苦孩子，现在桃李满天下了。 |
| Life memory | 逢年过节，徒弟们带着徒孙们来看你，热热闹闹一院子。你坐在中间，看着这些年轻的面孔，像看着年轻时候的自己——一样的仁心，一样的热血。老掌柜若还在，大概会笑着说"这酒肆里熬出来的药香，飘到全天下了。"你想想也是——从酒肆里的苦孩子，到满天下的仁医，这辈子，值了。 |
| Origin summary | 酒肆出身的仁心名医：一辈子救人，也一辈子教人。徒弟们散在各地，仁心传了一辈又一辈。从酒肆里的苦孩子到桃李满天下的老宗师，这辈子，值了。 |

---

## 5. Pragmatic Variant: Three Late-Life Branches

Pragmatic variant = 世故人医. Late-life is about social position, reputation, and how the world treats you as you age — the consequences of playing the game.

### 5.1 Branch Prag-A: 硬扛人情 → 失势的御医 (Holder → Fallen Power)

**Payoff choice:** 硬扛人情 — 声名赫赫的权贵御医，在权贵中间走钢丝，名声越来越大，人情债也越背越重

**Late-life arc:** 从酒肆跑堂爬到太医院院判，你靠的不只是医术，还有人情练达。可爬得越高，摔得越重——靠山倒了，墙倒众人推，一夜之间，从人人巴结的"李院判"变成了无人问津的"老李头"。酒肆的老掌柜若还在，大概会叹口气——"爬那么高干什么呢？摔下来疼啊。"可你知道——不爬，就只能在酒肆里端一辈子盘子。

**Core question:** 爬得越高摔得越重，当初还爬吗？

**Tavern-Born Flavor Anchors:**
- 老掌柜的叹息 — "爬那么高干什么呢？摔下来疼啊"
- 从跑堂到御医 — 爬天梯一样的一辈子
- 酒肆的势利眼 — 见多了人走茶凉，没想到自己也有这一天
- 算盘珠子 — 算了一辈子人情账，最后算到了自己头上

**Player Experience:**
- **Tone:** Bitter, proud, complex — not tragic, but heavy
- **Feeling:** "I knew the risks, but I'd still climb" — the pragmatic player chose power, and got the high and the low
- **Identity shift:** 声名赫赫的权贵御医 → 失势的老御医
- **Emotional beat:** Complex — not "sad ending" but "real ending"; power is fleeting, but you reached heights most people dream of

**Stat Changes:**
| Stat | Change | Rationale |
|------|--------|-----------|
| reputation | -3 | Fall from grace — people avoid you now |
| connections | -4 | Most "friends" disappeared |
| money | -2 | Lost wealth and position |
| charisma | +2 | Still sharp, still charismatic — humbled but not broken |
| constitution | +1 | No more court politics — actually healthier |
| **Net** | **-6** | Big drop in status, but some silver linings |

**Identity Marker:**
`tavern_medical_late_pragmatic_fallen`

**Expression Signals:**
| Surface | Text Direction |
|---------|---------------|
| Cost label | 人走茶凉 |
| Current goal | 看淡世态炎凉，过好自己的日子 |
| Late-life identity | 失势的老御医：从酒肆跑堂爬到太医院院判，你风光了半辈子。可靠山一倒，墙倒众人推，从人人巴结的"李院判"变成了无人问津的"老李头"。有人说你可怜，你只冷笑——可怜？你见过的世面，这些人一辈子都见不到。酒肆老掌柜若还在，大概会叹口气——爬那么高干什么呢？可你知道——不爬，就只能端一辈子盘子。 |
| Life memory | 门前冷落鞍马稀。以前送礼的人能排半条街，现在连个问安的都没有。你倒是看得开——这辈子什么场面没见过？从酒肆里看人脸色，到太医院里给人脸色，再到现在门可罗雀，起起落落，不就是人生吗。只是有时候深夜醒来，想起当年在酒肆里端盘子的日子——那时候穷，可睡得踏实。 |
| Origin summary | 酒肆出身的世故名医：从跑堂爬到御医，风光了半辈子，也摔了下来。人走茶凉，世态炎凉，你都见过了。有人说你可怜，你只冷笑——可怜？你见过的世面，这些人一辈子都见不到。 |

---

### 5.2 Branch Prag-B: 撕破脸皮 → 逍遥游医 (Breaker → Wandering Free)

**Payoff choice:** 撕破脸皮 — 快意恩仇的江湖游医，撕破了假人情，断了所有牵绊，行走江湖，自由自在

**Late-life arc:** 年轻时撕破了所有假人情，断了所有牵绊，一辈子行走江湖，到处行医。到了晚年，你还是在路上——从江南走到塞北，从东海走到西域，什么权贵什么人情，全不放在眼里。酒肆的老掌柜若还在，大概会笑着骂你"这匹野马，到死都拴不住"。你也笑——人生在世，不就图个自在吗？

**Core question:** 断了所有牵绊换自由，值吗？

**Tavern-Born Flavor Anchors:**
- 老掌柜的笑骂 — "这匹野马，到死都拴不住"
- 三教九流 — 见多了江湖人，自己也成了江湖人
- 酒肆的江湖客 — 小时候听他们讲故事，现在自己就是故事
- 逍遥自在 — 像风一样，谁也抓不住

**Player Experience:**
- **Tone:** Free, adventurous, slightly lonely but unapologetic
- **Feeling:** "I gave up security and status, but I got freedom" — the ultimate anti-establishment ending
- **Identity shift:** 快意恩仇的江湖游医 → 逍遥自在的老游医
- **Emotional beat:** Liberating — the pragmatic healer who rejected the game entirely and lived on their own terms

**Stat Changes:**
| Stat | Change | Rationale |
|------|--------|-----------|
| constitution | +2 | Healthy from walking everywhere |
| chivalry | +2 | Helps people freely, no strings attached |
| charisma | +2 | Wild, free, magnetic — people are drawn to your spirit |
| connections | -3 | No fixed home, few lasting relationships |
| reputation | 0 | Known in some circles, unknown in others — doesn't care |
| **Net** | **+3** | Freedom and health up, roots and connections down |

**Identity Marker:**
`tavern_medical_late_pragmatic_wanderer`

**Expression Signals:**
| Surface | Text Direction |
|---------|---------------|
| Cost label | 逍遥自在 |
| Current goal | 走到哪儿算哪儿，自在就好 |
| Late-life identity | 逍遥自在的老游医：撕破了所有假人情，断了所有牵绊，一辈子行走江湖。从江南走到塞北，从东海走到西域，什么权贵什么人情，全不放在眼里。酒肆老掌柜若还在，大概会笑着骂你"这匹野马，到死都拴不住"。你也笑——人生在世，不就图个自在吗？ |
| Life memory | 你还在路上。背着药箱，拄着拐杖，从一个村子走到另一个镇子。有人认出你，热情招待；没人认识，就自己找个破庙凑合一晚。你不在乎——这辈子什么场面没见过？从酒肆里听江湖故事，到自己成了江湖故事，够了。只是偶尔经过某个酒肆，会停下来喝一碗——还是当年的味道吗？ |
| Origin summary | 酒肆出身的世故名医：撕破了所有假人情，断了所有牵绊，一辈子行走江湖，逍遥自在。从酒肆里听江湖故事，到自己成了江湖故事。有人说你漂泊可怜，你只笑——可怜？这叫自在。 |

---

### 5.3 Branch Prag-C: 人情练达 → 德高望重 (Master → Revered Elder)

**Payoff choice:** 人情练达 — 人情练达的一代名医，拿捏得住分寸，分得清真假，成了人人敬重的名医

**Late-life arc:** 一辈子人情练达，拿捏得住分寸，分得清真假，既不得罪人也不亏着自己。到了晚年，你成了人人敬重的老名医——权贵给你面子，江湖人也卖你情面，徒弟们个个有出息。酒肆的老掌柜若还在，大概会捋着胡子得意——"我就说这小子是块料子，你看，怎么样？"你也笑——这一辈子，全靠老掌柜教的那点人情世故。

**Core question:** 人情练达到了极致，是什么样子？

**Tavern-Born Flavor Anchors:**
- 老掌柜的得意 — "我就说这小子是块料子"
- 酒肆的人情课 — 从老掌柜那儿学的人情世故
- 人人给面子 — 像酒肆里最受欢迎的老客人
- 算盘珠子 — 算了一辈子人情账，算得明明白白

**Player Experience:**
- **Tone:** Satisfied, respected, "winner" of the pragmatic path
- **Feeling:** "I played the game and won — with my integrity intact" — the most "successful" feeling of the pragmatic three
- **Identity shift:** 人情练达的一代名医 → 德高望重的老名医
- **Emotional beat:** Deeply satisfying — the pragmatic healer who navigated the system perfectly and came out on top

**Stat Changes:**
| Stat | Change | Rationale |
|------|--------|-----------|
| reputation | +4 | Universally respected |
| connections | +3 | Strong network across all levels of society |
| charisma | +3 | Wise, measured, deeply charismatic |
| money | +2 | Comfortable, wealthy even |
| constitution | +1 | Taking care of yourself |
| **Net** | **+13** | Strongest overall — the "perfect" pragmatic ending |

**Identity Marker:**
`tavern_medical_late_pragmatic_master`

**Expression Signals:**
| Surface | Text Direction |
|---------|---------------|
| Cost label | 德高望重 |
| Current goal | 看着这一世繁华，守着这一份体面 |
| Late-life identity | 德高望重的老名医：一辈子人情练达，拿捏得住分寸，分得清真假。到了晚年，人人敬重——权贵给你面子，江湖人卖你情面，徒弟们个个有出息。酒肆老掌柜若还在，大概会捋着胡子得意——"我就说这小子是块料子！"你也笑——这一辈子，全靠当年在酒肆学的那点人情世故。 |
| Life memory | 家里常常高朋满座，有达官贵人，也有江湖豪杰，还有你一手带出来的徒弟们。你坐在主位，笑眯眯地看着，什么人说什么话，你心里门儿清。有时候想起当年在酒肆里跟老掌柜学看人学说话的日子，忍不住笑——那时候哪能想到，酒肆里学的那点东西，能用一辈子呢？老掌柜要是知道你现在这样子，大概会得意得胡子都翘起来吧。 |
| Origin summary | 酒肆出身的世故名医：一辈子人情练达，拿捏得住分寸，分得清真假。从酒肆里跟老掌柜学说话，到成为人人敬重的老名医，这一辈子，走得稳，走得顺。老掌柜若还在，大概会得意得很——我就说这小子是块料子！ |

---

## 6. Differentiation Check

### 6.1 Across All Six Branches

| Dimension | Comp-A (Final) | Comp-B (Peaceful) | Comp-C (Legacy) | Prag-A (Fallen) | Prag-B (Wanderer) | Prag-C (Master) |
|-----------|----------------|-------------------|-----------------|-----------------|-------------------|-----------------|
| **Core narrative** | 燃尽自己的最后仁心 | 放下执念的从容老者 | 仁心满天下的宗师 | 失势的老御医 | 逍遥自在的老游医 | 德高望重的老名医 |
| **Tone** | Tragic / transcendent | Peaceful / wise | Warm / fulfilling | Bitter / complex | Free / adventurous | Satisfied / respected |
| **Identity** | 燃尽自己的最后仁心 | 从容自在的老者 | 仁心满天下的老宗师 | 失势的老御医 | 逍遥自在的老游医 | 德高望重的老名医 |
| **Cost label** | 最后仁心 | 从容自在 | 仁心传承 | 人走茶凉 | 逍遥自在 | 德高望重 |
| **Net stat change** | +3 | +7 | +10 | -6 | +3 | +13 |
| **Dominant stat** | chivalry | charisma | reputation | charisma | constitution | all five |
| **Tavern anchor** | 老掌柜的眼泪 | 老掌柜的笑 | 老掌柜的欣慰 | 老掌柜的叹息 | 老掌柜的笑骂 | 老掌柜的得意 |
| **Core question** | 燃尽自己值吗？ | 放下才能活好？ | 仁心无尽头？ | 爬高摔重还爬吗？ | 断牵绊换自由值吗？ | 练达极致是什么？ |
| **Axis** | Body/spirit sacrifice | Body/spirit peace | Body/spirit legacy | Social fall | Social freedom | Social mastery |

### 6.2 Variant-Level Differentiation (Compassionate vs Pragmatic)

| Dimension | Compassionate Late-Life | Pragmatic Late-Life |
|-----------|------------------------|---------------------|
| **Core axis** | Body + spirit | Social position + reputation |
| **Direction** | Inward (what happened to me) | Outward (what happened to my place) |
| **Cost type** | Physical / emotional | Social / positional |
| **Tone range** | Tragic → peaceful → warm | Bitter → free → respected |
| **Best ending** | 仁心传承 (legacy of compassion) | 德高望重 (master of people) |
| **Worst ending** | 最后仁心 (burnout, but noble) | 人走茶凉 (fall from power) |
| **Tavern flavor** | 苦孩子 + 老掌柜的泪/笑/欣慰 | 人精 + 老掌柜的叹/笑骂/得意 |

✅ **Variants are NOT mirrored.** Compassionate is about body/spirit (inward); Pragmatic is about social position (outward). Same 3-branch structure (holder/breaker vs holder/let_go/legacy/master), but the *meaning* of each branch is fundamentally different because the axis is different.

### 6.3 Six-Branch Differentiation Verdict

✅ **All six meaningfully different — not reskinned.** Each branch has:
- Distinct narrative arc
- Different emotional tone
- Different stat profile
- Different tavern-born flavor anchor
- Different identity and expression
- Different "core question"
- Different axis of experience (inward vs outward)

---

## 7. Comparison with Renown Late-Life

| Dimension | Medical Late-Life (6 branches) | Renown Late-Life (3 branches) |
|-----------|-------------------------------|-------------------------------|
| **Branches** | 6 (2 variants × 3 choices) | 3 (1 variant × 3 choices) |
| **Variant structure** | Compassionate + Pragmatic | Single (jianghu renown) |
| **Core axis** | Comp: body/spirit; Prag: social position | Social reputation / 人情债 |
| **Identity type** | Healer identity | Jianghu networker identity |
| **Tone range** | Wider (tragic → peaceful → warm → bitter → free → respected) | Narrower (tragic → free → warm) |
| **Best ending** | Comp: 仁心传承; Prag: 德高望重 | 传承授业 (mentor) |
| **Worst ending** | Comp: 最后仁心 (noble tragedy); Prag: 人走茶凉 (fall from power) | 油尽灯枯 (burnout) |
| **Tavern flavor** | Healer-specific (药庐, 熬药, 苦孩子/人精) | Renown-specific (人情债, 三教九流, 面子) |

✅ **Clearly differentiated from renown late-life.** Different number of branches, different variant structure, different core axes, different identity types, different flavor anchors. Medical late-life is not "renown late-life with more branches" — it's a fundamentally different exploration of late-life through the lens of a healer (both compassionate and pragmatic).

---

## 8. Does Late-Life Add Value?

### 8.1 Why Yes
1. **Delivers on payoff promises:** Each payoff choice had "future shadow" hints — late-life delivers on those
2. **6-branch variety:** More narrative variety than renown late-life (3 branches) or merchant late-life (single path)
3. **Dual-variant depth:** Compassionate vs pragmatic late-life explores fundamentally different axes (body/spirit vs social position)
4. **Choice consequence:** Makes the payoff choice feel even more meaningful — it changes the rest of your life
5. **Emotional closure:** Late-life gives a sense of "how did my life turn out?" that payoff alone doesn't
6. **Tavern-born healer flavor:** Each branch has distinct tavern anchors, not generic old doctor
7. **Medical-unique identity:** Clearly different from renown late-life — healer vs jianghu networker

### 8.2 Why It Might Not
1. **Single origin only:** Only tavern_hand — lower replication value
2. **6-branch complexity:** More design and implementation work than renown's 3
3. **Payoff already satisfying:** Payoff already gives a strong identity shift (6 branches already)
4. **Risk of dilution:** With 6 branches, some might feel thinner than renown's 3

### 8.3 Verdict
**Late-life adds meaningful value — GO.** The 6-branch × 2-variant structure creates a level of narrative depth that renown's 3-branch structure can't match. Compassionate and pragmatic variants explore fundamentally different axes of late-life (body/spirit vs social position), so it's not just "more of the same." Each branch delivers on the "future shadow" promised at payoff, and the emotional range (tragic / peaceful / fulfilling / bitter / free / respected) gives real replay value.

The 6-branch complexity is real, but since we're doing a single auto event (not multi-event), the implementation burden is manageable — roughly 2× renown's late-life, which is acceptable given the added narrative depth.

---

*Branch design complete. P90-003 passed.*

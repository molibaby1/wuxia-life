# P88 Medical Payoff Contract

> **Route:** `medical_sage_healer`（一代名医）
> **Origin:** `tavern_hand`（酒肆帮工）
> **Stage:** Payoff — 仁心之解 / 人情之解（choice-based，2 variants × 3 choices = 6 branches）
> **Preceding:** P87 pressure（仁心耗尽 / 人情债缠身）
> **Subsequent:** Late-life (P90+) — deferred
> **Contract status:** LOCKED — P88 design-first complete
> **Source of truth:** This contract defines what P89 (implementation) must deliver.

---

## 1. Core Direction

### 1.1 Compassionate Variant: 仁心之解 (Choice-Based)

**为什么 choice-based (vs auto)：**
- Compassionate 的 pressure 是"仁心耗尽"——身体垮了，但仁心还在
- Payoff 回答的问题是：**仁心耗尽了，然后呢？** 这是价值判断，天然适合 choice
- Choice 能体现 compassionate variant 的深度——不是"成功了"，是"选择了怎样的医者之路"
- 与 merchant auto payoff 形成鲜明差异化

**核心叙事问题：** 身子撑不住了，求医的人还在门口。你选择怎么面对这仁心之重？

**与 pressure 的区别：**
- Pressure = "仁心耗尽了"（意识到问题，被动承受）
- Payoff = "我选择这样与仁心共处"（主动抉择，定义自己是谁）

### 1.2 Pragmatic Variant: 人情之解 (Choice-Based)

**为什么 choice-based (vs auto)：**
- Pragmatic 的 pressure 是"人情债缠身"——人情网越织越密
- Payoff 回答的问题是：**人情债缠身，怎么解？** 这是价值判断，天然适合 choice
- Choice 能体现 pragmatic variant 的深度——不是"混出来了"，是"选择了怎样的处世之道"
- 与 merchant auto payoff 形成鲜明差异化

**核心叙事问题：** 人情债越积越重，权贵的请帖堆在药庐桌上。你选择怎么了却这人情之局？

**与 pressure 的区别：**
- Pressure = "人情债缠身了"（意识到问题，被动承受）
- Payoff = "我选择这样处理人情"（主动抉择，定义自己是谁）

### 1.3 What Makes Payoff Iconic (Per Variant)

这是 medical 路线的 payoff 节点，它回答了："仁心耗尽 / 人情债缠身之后呢？"

| Variant | Before Payoff (Pressure) | After Payoff (6 branches) |
|---------|--------------------------|--------------------------|
| **Compassionate** | "身子撑不住了，但求医的人还在门口排队——仁心，也是有代价的" | 硬扛到底（油尽灯枯）/ 学会放手（释然行医）/ 找到传承（仁心延续） |
| **Pragmatic** | "一面应付各路权贵的人情，一面在人情网中找平衡——世故，也是有重量的" | 硬扛人情（声名赫赫）/ 撕破脸皮（快意江湖）/ 人情练达（游刃有余） |

Payoff 让 medical 路线从"有代价的成长"变成"有选择的人生"，2 variants × 3 choices = 6 种完全不同的中年身份。

---

## 2. Six Payoff Branches (2 Variants × 3 Choices)

### 2.1 Compassionate Variant — 3 Choices

#### Choice A: 硬扛到底（油尽灯枯）

| 维度 | 内容 |
|------|------|
| **Flavor 锚点** | 打落牙齿和血吞——仁心医者的悲壮 |
| **核心叙事** | 你见不得人受苦，哪怕身子已经垮了，还是硬撑着。能多救一个是一个。油尽灯枯，但仁心不灭。 |
| **Stat 变化** | constitution -2, chivalry +3, reputation +2 |
| **Identity marker** | `tavern_medical_payoff_compassionate_holder` |
| **Cost label** | 油尽灯枯 |
| **Age-40 identity** | 油尽灯枯的仁心医者 |
| **Current goal** | 趁着还能动，能多救一个是一个 |
| **Life memory 方向** | 老掌柜劝你歇，你摆摆手说"救人要紧"。药庐的灯夜夜亮着，你的身子一天不如一天，但只要还有力气坐起来，就不会拒病人于门外 |
| **Summary 方向** | 酒肆出身的仁心医者，一辈子救了无数人，唯独忘了救自己。油尽灯枯，但仁心不灭 |
| **叙事调性** | 悲壮/令人心疼 |
| **远期伏笔** | 油尽灯枯的晚年（late-life 可写"最后的日子"） |

#### Choice B: 学会放手（释然行医）

| 维度 | 内容 |
|------|------|
| **Flavor 锚点** | 老掌柜的"想通了"——成长与和解 |
| **核心叙事** | 你曾以为自己能救所有人。直到身体垮了，你才明白——你不是神。你开始限号、推病人、学会说"不"。虽然有人说你变了，但你终于找回了自己的节奏。 |
| **Stat 变化** | constitution +2, chivalry -1, reputation -1, charisma +1 |
| **Identity marker** | `tavern_medical_payoff_compassionate_let_go` |
| **Cost label** | 释然行医 |
| **Age-40 identity** | 释然通透的医者 |
| **Current goal** | 量力而行，把有限的精力留给真正需要的人 |
| **Life memory 方向** | 你在药庐门口贴了"每日十诊"的告示。有人骂你忘了初心，也有人说你早该如此。老掌柜拍了拍你的肩膀，说"你终于想通了"。你笑了笑——救人先救己 |
| **Summary 方向** | 酒肆出身的仁心医者，曾以为自己能救所有人，直到身体垮了才学会放手。每日十诊，量力而行。释然了，也活得更久了 |
| **叙事调性** | 温暖/释然/成长 |
| **远期伏笔** | 释然的晚年（late-life 可写"老医者的通透"） |

#### Choice C: 找到传承（仁心延续）

| 维度 | 内容 |
|------|------|
| **Flavor 锚点** | 酒肆后厨的徒弟——薪火相传 |
| **核心叙事** | 你的身体撑不住了，但仁心不能断。你开始收徒弟，把医术传下去。虽然自己不再坐诊，但你的医术和仁心，通过徒弟延续了下去。 |
| **Stat 变化** | constitution +1, reputation +1, chivalry +1, charisma +2 |
| **Identity marker** | `tavern_medical_payoff_compassionate_legacy` |
| **Cost label** | 仁心传承 |
| **Age-40 identity** | 传道授业的仁医之师 |
| **Current goal** | 把医术和仁心传下去，让更多人能得到救治 |
| **Life memory 方向** | 你收了酒肆后厨帮工的孩子做徒弟。那孩子从小看着你看病长大，眼里有光。你教他认药、诊脉、熬药，就像当年老掌柜教你一样。他第一次独立坐诊那天，你站在药庐门口，心里说不出的踏实 |
| **Summary 方向** | 酒肆出身的仁心医者，身体垮了，但仁心没断。收了个徒弟，把医术和仁心一起传了下去。救的人少了，但救的火种留了下来 |
| **叙事调性** | 温暖/传承/希望 |
| **远期伏笔** | 传承之师的晚年（late-life 可写"徒弟长大了"） |

### 2.2 Pragmatic Variant — 3 Choices

#### Choice A: 硬扛人情（声名赫赫）

| 维度 | 内容 |
|------|------|
| **Flavor 锚点** | 人情账本越翻越厚——世故反被世故误 |
| **核心叙事** | 你懂分寸、会办事。人情债越来越重，但你还是硬扛着——毕竟名声就是一切。你彻底沦为权贵的私人大夫，名声越来越响，可你已经不是在行医，而是在做人情。 |
| **Stat 变化** | reputation +4, connections +3, money +60, chivalry -2 |
| **Identity marker** | `tavern_medical_payoff_pragmatic_holder` |
| **Cost label** | 声名所累 |
| **Age-40 identity** | 声名赫赫的权贵御医 |
| **Current goal** | 维持各方人情，在权贵圈里站稳脚跟 |
| **Life memory 方向** | 张员外、李知府、总督府、将军衙... 认识的人越来越多，身份越来越高。你的诊金是当初的十倍，出入的都是深宅大院。只是有时候深夜回家，看着手里的金元宝，你会想起酒肆里那个给穷人免费看病的自己 |
| **Summary 方向** | 酒肆出身的世故人医，靠人情世故闯出了名头，成了权贵座上宾。名声赫赫，诊金不菲，只是人情网越织越密，再也脱不开身 |
| **叙事调性** | 讽刺/身不由己 |
| **远期伏笔** | 权贵附庸的晚年（late-life 可写"失势的御医"） |

#### Choice B: 撕破脸皮（快意江湖）

| 维度 | 内容 |
|------|------|
| **Flavor 锚点** | 摔药箱 + 老掌柜烫酒——快意恩仇 |
| **核心叙事** | 你懂人情，但更懂——有些债，不该还。你撕破脸断了那些权贵的人情往来。有人骂你忘恩负义，有人说你不识抬举。名声坏了，但你终于能睡个安稳觉了。 |
| **Stat 变化** | reputation -3, connections -5, charisma -1, constitution +2, chivalry +1 |
| **Identity marker** | `tavern_medical_payoff_pragmatic_breaker` |
| **Cost label** | 快意江湖 |
| **Age-40 identity** | 快意恩仇的江湖游医 |
| **Current goal** | 断了权贵的人情，只给愿意给的人看病 |
| **Life memory 方向** | 你把权贵人家的请帖全退了。有人说你自毁前程，有人说你有骨气。老掌柜给你烫了壶酒，说"好样的，我就知道你不是那种人"。你喝了一口，辣得直咧嘴，但心里敞亮——终于不用看别人脸色了 |
| **Summary 方向** | 酒肆出身的世故人医，曾在权贵圈里风生水起，后来撕破脸断了所有人情。名声坏了，但活得自在。只给看得起的人看病，不伺候的，给再多钱也不去 |
| **叙事调性** | 反英雄/痛快/快意恩仇 |
| **远期伏笔** | 江湖游医的晚年（late-life 可写"逍遥自在的老游医"） |

#### Choice C: 人情练达（游刃有余）

| 维度 | 内容 |
|------|------|
| **Flavor 锚点** | 老掌柜的"学到家了"——八面玲珑 |
| **核心叙事** | 你懂人情，更懂分寸。既不得罪人，也不被人情绑住。你来我往，有借有还，游刃有余。你成了真正懂人情世故的名医——谁都给你面子，谁也绑不住你。 |
| **Stat 变化** | reputation +2, connections +1, charisma +4, money +30 |
| **Identity marker** | `tavern_medical_payoff_pragmatic_master` |
| **Cost label** | 人情练达 |
| **Age-40 identity** | 人情练达的一代名医 |
| **Current goal** | 拿捏人情往来的分寸，游刃有余地行走在权贵之间 |
| **Life memory 方向** | 张员外的人情，你用一张药方还了；李知府的面子，你用一次夜诊给了。该去的去，该推的推。没人说你架子大，也没人敢把你当自己人。老掌柜说你"学到家了"——酒肆掌柜的那套八面玲珑，你全用在行医上了 |
| **Summary 方向** | 酒肆出身的世故人医，深谙人情世故，拿捏得恰到好处。权贵都想结交你，谁也绑不住你。人情不是债，是往来——有来有往，才是长久之道 |
| **叙事调性** | 智者/游刃有余/成功 |
| **远期伏笔** | 人情练达的晚年（late-life 可写"德高望重的老名医"） |

### 2.3 Differentiation Check

**6 个分支有实质差异吗？**

| Check | Result | Evidence |
|-------|--------|----------|
| Compassionate 3 choices 各不同？ | ✅ | 硬扛（悲壮）/ 放手（释然）/ 传承（希望）——叙事调性完全不同 |
| Pragmatic 3 choices 各不同？ | ✅ | 硬扛（讽刺）/ 撕破脸（痛快）/ 练达（游刃有余）——叙事调性完全不同 |
| 2 variants 不是镜像？ | ✅ | Compassionate = 理想主义的三种归宿；Pragmatic = 现实主义的三种归宿 |
| 每个 choice 有 unique stat profile？ | ✅ | 6 个分支的 stat 分布完全不同 |
| 每个 choice 有 unique identity？ | ✅ | 6 个完全不同的 age-40 identity |
| 每个 choice 有 unique cost label？ | ✅ | 6 个完全不同的 cost label |

**结论：✅ 6 个 payoff 分支全部有实质差异，不是换皮。**

---

## 3. Event Specification (2 Choice Events)

遵循 P85/P87 的 2-event 模式：两个独立的 choice event，各走各的条件，共享 checkpoint flag。

### 3.1 Compassionate Payoff Event

| Field | Value |
|-------|-------|
| `id` | `medical_payoff_compassionate` |
| `eventType` | `choice`（玩家选择，不是 auto） |
| `location` | `sample-lines-spine.json` |
| `ageRange` | { min: 42, max: 46 } |
| `trigger` | `age_reach` at age 42 |

**Trigger Conditions:**
1. `flags.has('medical_midlife_pressure_done')` — pressure 已完成
2. `flags.has('tavern_medical_pressure_compassionate')` — compassionate variant
3. `!flags.has('medical_payoff_done')` — 互斥 guard
4. `!flags.has('orthodox_childhood_seed_done')` — 排除正道种子
5. `!flags.has('demonic_childhood_seed_done')` — 排除魔道种子

**Upstream Gate:** `medical_midlife_pressure_done` + `tavern_medical_pressure_compassionate`

**Event Content (Reference Direction, P89 实施时润色):**

**Title:** 仁心之重

**Text:**
这些年，药庐的灯夜夜亮着。你的身子一天不如一天，但求医的人越来越多。周边村子的、外乡来的、背着铺盖卷在酒肆门口等天亮的。

老掌柜劝你歇歇，你摆摆手说"救人要紧"。可这日清晨，你刚拿起药方，手就开始发颤——你知道，自己撑不了多久了。

窗外的阳光照进来，你忽然想起小时候在酒肆里看老掌柜给穷苦人免账——那时候你只觉得他心善，如今才知道，仁心这东西，是真的要拿命去填的。

可你，打算怎么填？

**Choice Options:**

- **Option A: 硬扛到底** — "能多救一个是一个。趁着还能动，多看几个。"
- **Option B: 学会放手** — "我不是神。每日十诊，量力而行。"
- **Option C: 找到传承** — "找个徒弟吧。医术要传下去，仁心也是。"

### 3.2 Pragmatic Payoff Event

| Field | Value |
|-------|-------|
| `id` | `medical_payoff_pragmatic` |
| `eventType` | `choice`（玩家选择，不是 auto） |
| `location` | `sample-lines-spine.json` |
| `ageRange` | { min: 43, max: 47 } |
| `trigger` | `age_reach` at age 43 |

**Trigger Conditions:**
1. `flags.has('medical_midlife_pressure_done')` — pressure 已完成
2. `flags.has('tavern_medical_pressure_pragmatic')` — pragmatic variant
3. `!flags.has('medical_payoff_done')` — 互斥 guard
4. `!flags.has('orthodox_childhood_seed_done')` — 排除正道种子
5. `!flags.has('demonic_childhood_seed_done')` — 排除魔道种子

**Upstream Gate:** `medical_midlife_pressure_done` + `tavern_medical_pressure_pragmatic`

**Event Content (Reference Direction, P89 实施时润色):**

**Title:** 人情之局

**Text:**
这些年，你在镇上权贵间混得风生水起。张员外的小妾、李知府的幕僚、王捕头的亲戚... 认识的人越来越多，欠的人情也越来越重。

这日，酒肆里又来了一拨人——有来道谢的，有来求人的，有带着名帖请你过府的。你站在柜台后，看着一拨又一拨的人，忽然想起小时候在这儿见惯的人情往来——那时候你只觉得热闹，如今才知道，这人情网，是真的能把人缠住的。

有人递来一张请帖——总督府的，请你去给夫人诊脉。你接过来，指尖碰到烫金的帖子，忽然想问自己：这人情的局，你打算怎么了？

**Choice Options:**

- **Option A: 硬扛人情** — "名声就是一切。这局，我撑下去。"
- **Option B: 撕破脸皮** — "有些债，不该还。不伺候了。"
- **Option C: 人情练达** — "人情不是债，是往来。有来有往，才长久。"

### 3.3 Checkpoint & Marker Flags Summary

| Flag | Set By | Purpose |
|------|--------|---------|
| `medical_payoff_done` | Both events (shared) | **Payoff 检查点** — late-life 阶段的前置条件 |
| `medical_age40_identity_done` | Both events (shared) | Age-40 identity 深化标记 |
| `tavern_medical_payoff_compassionate_holder` | Compassionate Option A | Compassionate-A marker |
| `tavern_medical_payoff_compassionate_let_go` | Compassionate Option B | Compassionate-B marker |
| `tavern_medical_payoff_compassionate_legacy` | Compassionate Option C | Compassionate-C marker |
| `tavern_medical_payoff_pragmatic_holder` | Pragmatic Option A | Pragmatic-A marker |
| `tavern_medical_payoff_pragmatic_breaker` | Pragmatic Option B | Pragmatic-B marker |
| `tavern_medical_payoff_pragmatic_master` | Pragmatic Option C | Pragmatic-C marker |

**Auto Effects (Common to All 6 Choices):**
- `flag_set`: `medical_payoff_done`
- `flag_set`: `medical_age40_identity_done`
- `event_record`: 对应事件 id

---

## 4. Player-Facing Expression Updates

### 4.1 Sample Line Expression (`sampleLineExpression.ts`)

#### `deriveSampleLineCostLabel()` — payoff 分支

**Gate order:** `medical_payoff_done` > `medical_midlife_pressure_done` > base

| Variant + Choice | Cost Label Text |
|-----------------|----------------|
| Compassionate A (硬扛) | 油尽灯枯 |
| Compassionate B (放手) | 释然行医 |
| Compassionate C (传承) | 仁心传承 |
| Pragmatic A (硬扛) | 声名所累 |
| Pragmatic B (撕破脸) | 快意江湖 |
| Pragmatic C (练达) | 人情练达 |

#### `medicalCurrentGoal()` — payoff 分支

**Gate order:** `medical_payoff_done` > `medical_midlife_pressure_done` > `medical_on_ramp_done` > `tavern_medical_bridge_crossed` > base

| Variant + Choice | Current Goal Text |
|-----------------|------------------|
| Compassionate A (硬扛) | 趁着还能动，能多救一个是一个 |
| Compassionate B (放手) | 量力而行，把有限的精力留给真正需要的人 |
| Compassionate C (传承) | 把医术和仁心传下去，让更多人能得到救治 |
| Pragmatic A (硬扛) | 维持各方人情，在权贵圈里站稳脚跟 |
| Pragmatic B (撕破脸) | 断了权贵的人情，只给愿意给的人看病 |
| Pragmatic C (练达) | 拿捏人情往来的分寸，游刃有余地行走在权贵之间 |

#### `medicalAge40Identity()` — payoff 深化

**触发条件:** `medical_age40_identity_done` (set by payoff event)

| Variant + Choice | Age-40 Identity Text |
|-----------------|---------------------|
| Compassionate A (硬扛) | 你是油尽灯枯的仁心医者：从酒肆帮工到一代名医，一辈子救了无数人，唯独忘了救自己。 |
| Compassionate B (放手) | 你是释然通透的医者：从酒肆帮工到一代名医，曾以为自己能救所有人，直到身体垮了才学会量力而行。 |
| Compassionate C (传承) | 你是传道授业的仁医之师：从酒肆帮工到一代名医，身体垮了，但仁心没断，医术和医德一起传了下去。 |
| Pragmatic A (硬扛) | 你是声名赫赫的权贵御医：从酒肆帮工到一代名医，靠人情世故闯出了名头，成了权贵座上宾，只是再也脱不开身。 |
| Pragmatic B (撕破脸) | 你是快意恩仇的江湖游医：从酒肆帮工到一代名医，曾在权贵圈里风生水起，后来撕破脸断了人情，反倒活得自在。 |
| Pragmatic C (练达) | 你是人情练达的一代名医：从酒肆帮工到一代名医，深谙人情世故，拿捏得恰到好处，谁都给面子，谁也绑不住。 |

### 4.2 Ordinary Origin Expression (`ordinaryOriginExpression.ts`)

#### `tavernCurrentGoal()` — payoff 分支

与 sample line 版本内容一致（或略有不同措辞），以 tavern-born 视角呈现。

#### `tavernLifeMemory()` — payoff 记忆

| Variant + Choice | Life Memory Text (Reference Direction) |
|-----------------|-------------------------------------|
| Compassionate A (硬扛) | 药庐的灯夜夜亮着，你的身子一天不如一天。老掌柜劝你歇，你摆摆手说"救人要紧"。只要还有力气坐起来，就不会拒病人于门外。仁心这东西，是真的能把人耗干的。 |
| Compassionate B (放手) | 你在药庐门口贴了"每日十诊"的告示。有人骂你忘了初心，也有人说你早该如此。老掌柜拍了拍你的肩膀，说"你终于想通了"。救人先救己——你笑着，眼里有了光。 |
| Compassionate C (传承) | 你收了酒肆后厨帮工的孩子做徒弟。那孩子从小看着你看病长大，眼里有光。你教他认药、诊脉、熬药，就像当年老掌柜教你一样。他第一次独立坐诊那天，你站在药庐门口，心里说不出的踏实。 |
| Pragmatic A (硬扛) | 张员外、李知府、总督府、将军衙... 认识的人越来越多，身份越来越高。你的诊金是当初的十倍，出入的都是深宅大院。只是有时候深夜回家，看着手里的金元宝，你会想起酒肆里那个给穷人免费看病的自己。 |
| Pragmatic B (撕破脸) | 你把权贵人家的请帖全退了。有人说你自毁前程，有人说你有骨气。老掌柜给你烫了壶酒，说"好样的，我就知道你不是那种人"。你喝了一口，辣得直咧嘴，但心里敞亮——终于不用看别人脸色了。 |
| Pragmatic C (练达) | 该去的去，该推的推。张员外的人情用一张药方还了，李知府的面子用一次夜诊给了。没人说你架子大，也没人敢把你当自己人。老掌柜说你"学到家了"——酒肆掌柜的那套八面玲珑，你全用在行医上了。 |

#### `deriveOrdinaryOriginSummary()` — payoff 终局总结

| Variant + Choice | Summary Text (Reference Direction) |
|-----------------|----------------------------------|
| Compassionate A (硬扛) | 酒肆出身的仁心名医：靠仁心济世闯出了名号，只是身子也熬垮了——油尽灯枯，仁心不灭。 |
| Compassionate B (放手) | 酒肆出身的仁心名医：曾以为自己能救所有人，直到身体垮了才学会放手——量力而行，释然通透。 |
| Compassionate C (传承) | 酒肆出身的仁心名医：身体垮了，但仁心没断，收了徒弟把医术传下去——薪火相传，仁心延续。 |
| Pragmatic A (硬扛) | 酒肆出身的世故名医：靠医术和分寸在权贵间游走，名声银子都有了，只是人情网越织越密——声名赫赫，身不由己。 |
| Pragmatic B (撕破脸) | 酒肆出身的世故名医：曾在权贵圈里风生水起，后来撕破脸断了人情，反倒活得自在——快意江湖，不伺候了。 |
| Pragmatic C (练达) | 酒肆出身的世故名医：深谙人情世故，拿捏得恰到好处，权贵都想结交，谁也绑不住——人情练达，游刃有余。 |

### 4.3 Core Payoff Signals（至少 5 个）

1. **Cost label**（6 种不同标签）— 主屏幕路线代价标签
2. **Current goal**（sample line + ordinary origin，各 6 分支）— 主屏幕当前目标
3. **Age-40 identity**（6 种不同身份）— 身份总结
4. **Life memory**（6 种不同记忆）— 人生记忆面板
5. **Origin summary**（6 种不同总结）— 出身总结行

---

## 5. Stat Changes Summary

### 5.0 Stat Abbreviation Reference

| 全称 | 缩写 | 说明 |
|------|------|------|
| reputation | rep | 名声/声望 |
| constitution | con | 体质/身体（既有惯例缩写） |
| connections | conn | 人脉/人情（注意：不要缩写为 con，避免与 constitution 混淆） |
| charisma | charisma | 魅力/人缘 |
| chivalry | chivalry | 侠义/仁心 |
| money | money | 银两 |

**缩写规则：** constitution 缩写为 `con`（既有惯例），connections 写全称或缩写为 `conn`，绝不用 `con`。

**统一顺序：** rep → con → conn → charisma → chivalry → money

### 5.1 Compassionate Variant

| Stat | A: 硬扛到底 | B: 学会放手 | C: 找到传承 |
|------|-----------|-----------|-----------|
| reputation (rep) | +2 | -1 | +1 |
| constitution (con) | -2 | +2 | +1 |
| connections (conn) | — | — | — |
| charisma | — | +1 | +2 |
| chivalry | +3 | -1 | +1 |
| money | — | — | — |
| **净值（不含 money）** | **+3** | **+1** | **+5** |

**Design note:**
- A 净值不高但 chivalry 最高——理想主义极致
- B 净值最低但 constitution 最高——找回自我
- C 净值最高且均衡——传承是最"圆满"的选择，但也最温和

### 5.2 Pragmatic Variant

| Stat | A: 硬扛人情 | B: 撕破脸皮 | C: 人情练达 |
|------|-----------|-----------|-----------|
| reputation (rep) | +4 | -3 | +2 |
| constitution (con) | — | +2 | — |
| connections (conn) | +3 | -5 | +1 |
| charisma | — | -1 | +4 |
| chivalry | -2 | +1 | — |
| money | +60 | — | +30 |
| **净值（不含 money）** | **+5** | **-6** | **+7** |

**Design note:**
- A 净值高但 chivalry 最低——彻底沦为权贵工具
- B 净值最低但 constitution + chivalry 回升——找回自我和初心
- C 净值最高且 charisma 最高——真正的"成功"，游刃有余

### 5.3 Cross-Variant Comparison

| Dimension | Compassionate 3 choices | Pragmatic 3 choices |
|-----------|------------------------|---------------------|
| **核心代价维度** | 身体 / 仁心 | 名声 / 人情 |
| **成长维度** | 释然 / 传承 | 自由 / 练达 |
| **"最好"的选择** | C（传承，最圆满） | C（练达，最成功） |
| **"最悲壮"的选择** | A（硬扛到底，油尽灯枯） | A（硬扛人情，身不由己） |
| **"最痛快"的选择** | B（放手，释然） | B（撕破脸，快意） |

两个 variant 的 A/B/C 虽然结构对称（硬扛/放手/平衡），但内容和味道完全不同——一个是仁心的三种归宿，一个是世故的三种归宿。

---

## 6. Differences: Payoff vs Pressure vs Generic Midlife

### 6.1 Payoff vs Pressure (Per Variant)

**Compassionate:**

| Aspect | Pressure (仁心耗尽) | Payoff (仁心之解) |
|--------|---------------------|-----------------|
| **阶段定位** | 维持期、代价显现 | 抉择期、身份定义 |
| **事件类型** | Auto（被动承受） | Choice（主动抉择） |
| **核心情绪** | 疲惫、悲壮、"撑不住了" | 抉择、定义、"我选择这样活" |
| **目标方向** | 向内收缩（撑着别倒下） | 向外定义（我是谁、我怎么走下去） |
| **表达基调** | 悲壮、令人心疼 | 复杂、有深度、有 agency |
| **分支数** | 1（auto） | 3（choice） |

**Pragmatic:**

| Aspect | Pressure (人情债缠身) | Payoff (人情之解) |
|--------|----------------------|-----------------|
| **阶段定位** | 维持期、代价显现 | 抉择期、身份定义 |
| **事件类型** | Auto（被动承受） | Choice（主动抉择） |
| **核心情绪** | 纠结、沉重、"脱不开身" | 抉择、定义、"我选择了这条路" |
| **目标方向** | 向内维持（在人情网中找平衡） | 向外定义（我是谁、我怎么处世） |
| **表达基调** | 复杂、有重量 | 更复杂、有 agency、有深度 |
| **分支数** | 1（auto） | 3（choice） |

### 6.2 Medical Payoff vs Generic Midlife

| Aspect | Medical Payoff | Generic Midlife |
|--------|---------------|----------------|
| **核心抉择** | 仁心之解 / 人情之解（路线专属） | 中年危机、生计压力等通用内容 |
| **场景** | 酒肆小药庐 / 权贵府邸（核心场景） | 各种通用场景 |
| **机制** | 医术/仁心/人情 + choice | 通用 stat 变化 |
| **独特性** | medical 路线独有（6 种不同身份） | 所有出身都可能遇到 |
| **与路线关联** | 直接是 medical 路线的身份定义时刻 | 与路线无关的通用事件 |

### 6.3 Medical Payoff vs Renown/ Merchant Payoff

| Aspect | Medical Compassionate | Medical Pragmatic | Renown Payoff | Merchant Payoff |
|--------|----------------------|-------------------|--------------|----------------|
| **模式** | Choice-based | Choice-based | Choice-based | Auto |
| **核心矛盾** | 仁心/身体 | 权贵人情/自由 | 江湖人情/面子 | 商业帝国 |
| **分支数** | 3 | 3 | 3 | 1 |
| **风味** | 仁心医者、悲壮/温暖 | 世故人医、讽刺/痛快 | 江湖名宿、人情世故 | 商人巨贾、经营负担 |
| **共通模式** | sample-line spine + expression 更新 | 同左 | 同左 | auto 里程碑 |

**结论：** 模式对称（都是 sample-line spine + expression 更新），但风味完全不同。6 个 medical payoff 分支各有各的身份和味道，与 renown/merchant 明确区分。

---

## 7. Reserved Flag Interfaces (for Future Stages)

预留以下 flag 接口（本阶段不实现逻辑，仅占位命名）：

| Flag | Purpose | Stage |
|------|---------|-------|
| `medical_late_life_done` | Late-life 检查点 | P90+ |
| `medical_endgame_echo_done` | 终局回响 | 后续阶段 |
| `tavern_medical_late_life_*` | Late-life variant markers（6 种各一，待定） | P90+ |

**预留意图：** 确保 payoff 的 6 个 choice 方向都能在 late-life / endgame 阶段有差异化延伸，不会因为今天的设计把未来的路堵死。

---

## 8. Flavor Constraints

1. **Tavern-born first:** 所有选择和表达都必须有酒肆出身的味道——酒肆、老掌柜、小药庐、人情往来、三教九流
2. **Not generic jianghu:** 不能写成通用的"江湖抉择"，必须是"酒肆出身的医者遇到仁心/人情问题会怎么选"
3. **Distinct from merchant/renown:**
   - Merchant payoff = auto、商业帝国
   - Renown payoff = choice、江湖人情债
   - Medical payoff = choice、仁心之解 / 人情之解（2 variants 各有各的味）
4. **Two-variant differentiation:** Compassionate = 理想主义的三种归宿，Pragmatic = 现实主义的三种归宿。不是镜像，是完全不同的价值维度
5. **Six choices feel meaningfully different:** 不是换皮选择，属性变化、身份感、叙事调性都要有实质差异
6. **Pressure → Payoff 递进自然:** Pressure 是"意识到问题"（auto），Payoff 是"主动解决/抉择"（choice）

---

## 9. Gate Acceptance Criteria

### Pre-Payoff (must be true for either event to fire)

- [ ] `medical_midlife_pressure_done === true`
- [ ] `medical_payoff_done === false`
- [ ] Compassionate event: `tavern_medical_pressure_compassionate === true`
- [ ] Pragmatic event: `tavern_medical_pressure_pragmatic === true`
- [ ] Age in range (Comp: 42-46, Prag: 43-47)
- [ ] No orthodox/demonic childhood seeds
- [ ] Exactly one of the two payoff events can fire (mutual exclusivity via variant markers)

### Post-Payoff (must be true after any choice)

- [ ] `medical_payoff_done === true`
- [ ] `medical_age40_identity_done === true`
- [ ] Exactly one of the 6 choice markers is set
- [ ] Cost label matches the selected choice
- [ ] Current goal matches the selected choice (both sample line + ordinary origin)
- [ ] Age-40 identity matches the selected choice
- [ ] Life memory matches the selected choice
- [ ] Origin summary matches the selected choice
- [ ] Stat changes match the selected choice

---

## 10. Boundary with P89 (Implementation)

| P88 (Design-First) | P89 (Implementation) |
|-------------------|---------------------|
| Prerequisite audit | Runtime event wiring in sample-lines-spine.json (2 choice events) |
| Scope contract | Expression updates in sampleLineExpression.ts (cost label + current goal + age40 identity) |
| Direction comparison (本文档 direction 部分) | Expression updates in ordinaryOriginExpression.ts (current goal + life memory + summary) |
| Payoff contract (本文档) | Targeted proof document (6 branches) |
| Validation shape | Regression tests (~40-50 tests, 6 branches + variant differentiation + regression) |
| Closure report | Closure report |

**P89 must deliver on everything defined in this contract. No scope expansion beyond what's defined here without a new PRD.**

---

## 11. Contract Summary

| Item | Compassionate Variant | Pragmatic Variant |
|------|----------------------|-------------------|
| **Direction** | 仁心之解（choice-based，3 choices） | 人情之解（choice-based，3 choices） |
| **Event ID** | `medical_payoff_compassionate` | `medical_payoff_pragmatic` |
| **Event type** | Choice（玩家主动抉择） | Choice（玩家主动抉择） |
| **Age range** | 42–46 | 43–47 |
| **Upstream gate** | `medical_midlife_pressure_done` + `tavern_medical_pressure_compassionate` | `medical_midlife_pressure_done` + `tavern_medical_pressure_pragmatic` |
| **Checkpoint flags** | `medical_payoff_done` (shared) + `medical_age40_identity_done` (shared) | 同左 |
| **Choice markers** | 3 个（holder / let_go / legacy） | 3 个（holder / breaker / master） |
| **Core signals** | 5 个（cost label, current goal, age40 identity, life memory, summary） | 同左 |
| **Expression surfaces** | 5 个 surfaces × 3 branches = 15 个新分支 | 5 个 surfaces × 3 branches = 15 个新分支 |
| **Key stats** | A: rep+2, con-2, chivalry+3; B: rep-1, con+2, charisma+1, chivalry-1; C: rep+1, con+1, charisma+2, chivalry+1 | A: rep+4, conn+3, chivalry-2, money+60; B: rep-3, con+2, conn-5, charisma-1, chivalry+1; C: rep+2, conn+1, charisma+4, money+30 |
| **New systems** | 零 — 全部复用现有架构 | 零 — 全部复用现有架构 |
| **Late-life interface** | `medical_late_life_done` + `tavern_medical_late_life_*` (reserved) | 同左 |
| **Flavor** | Tavern-born compassionate healer — 仁心的三种归宿 | Tavern-born pragmatic healer — 世故的三种归宿 |

---

*Contract locked by P88 design-first stage. P89 implementation proceeds from here.*

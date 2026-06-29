# P88 Medical Payoff Direction Comparison (2 Variants × 3 Choices)

> **Date:** 2026-06-29
> **Stage:** P88 Wuxia Medical Payoff Design-First
> **Route:** `medical_sage_healer` (一代名医)
> **Origin:** `tavern_hand` (酒肆帮工)
> **Variants:** Compassionate (仁心医者 → 仁心耗尽) + Pragmatic (世故人医 → 人情债缠身)

---

## 1. Purpose

为 `medical_sage_healer` 的 payoff 阶段，为 **2 个 variant 各自**比较至少 3 个 choice 方向，选定最符合 tavern-born healer 风味、最 bounded、最有差异化、最适合 small-step 实施的 3 个方向（每 variant 3 个，共 6 个 payoff 分支）。

本比较遵循 quality-first + small-step 原则：
- **Quality first:** 风味正确性 > 叙事丰富度 > 实现复杂度
- **Small step:** 优先选择能用 1 个核心 choice 事件 + 少量表达更新实现的方向
- **Variant differentiation:** 两个 variant 的 payoff 方向必须有本质差异，不能只是换皮
- **Choice meaningfulness:** 每个 variant 的 3 个 choice 必须有实质差异，不能只是数值换皮

---

## 2. High-Level Mode Confirmation

在进入具体方向比较前，先确认 payoff 的大模式：choice-based vs auto。

### 2.1 Choice-Based Payoff (推荐)

| 维度 | 评分 | 说明 |
|------|------|------|
| **核心叙事** | ⭐⭐⭐⭐⭐ | "仁心耗尽 / 人情债缠身，怎么解？"本身就是价值判断，天然适合 choice |
| **差异化** | ⭐⭐⭐⭐⭐ | 与 merchant auto payoff 完全不同；2 variants × 3 choices = 6 种独特结局 |
| **Tavern-born 适配度** | ⭐⭐⭐⭐⭐ | 酒肆出身的人最懂人情世故、取舍、分寸 |
| **实现复杂度** | ⭐⭐⭐ | 比 auto 复杂（2 个 choice 事件 + 6 条表达分支），但仍在 bounded 范围内 |
| **Boundedness** | ⭐⭐⭐⭐ | 2 个事件 + 6 个选项 + ~30 个 expression 更新，范围清晰 |
| **玩家感知价值** | ⭐⭐⭐⭐⭐ | 有意义的选择，玩家能感受到"我的选择塑造了我是谁" |

### 2.2 Auto Payoff (备选，可退化)

| 维度 | 评分 | 说明 |
|------|------|------|
| **核心叙事** | ⭐⭐ | "医名达到顶峰"，比较平淡，没有张力 |
| **差异化** | ⭐ | 与 merchant payoff 太像，都是 auto、都是"成功了" |
| **Tavern-born 适配度** | ⭐⭐⭐ | 可以写，但不够独特 |
| **实现复杂度** | ⭐⭐⭐⭐⭐ | 最简单，直接抄 merchant 模式 |
| **玩家感知价值** | ⭐⭐ | 感觉就是"又一个成功路线"，记忆点不强 |

### 2.3 结论：Choice-Based

**推荐：Choice-based payoff — 仁心之解 / 人情之解（2 variants 各 3 choices）**

理由：
1. **差异化最强**：与 merchant auto payoff 完全不同，medical 路线的独特卖点
2. **2 variants 各有各的价值判断**：compassionate = 理想主义的代价，pragmatic = 现实主义的代价
3. **Tavern-born 风味最浓**：取舍、分寸、人情世故，都是酒肆出身的人最懂的事
4. **符合 North Star**：事件触发选择应有可观测后果
5. **叙事张力足**："仁心耗尽怎么办"、"人情债缠身怎么解"都是好问题

**Rejected:** Auto payoff — 太同质化，浪费了 medical 路线的差异化潜力。仅作为 fallback（如果 choice-based 证明太复杂）。

---

## 3. Compassionate Variant (仁心医者 → 仁心耗尽) — Candidates

### 3.1 Candidates Overview

| # | Direction | Core Narrative | Tavern-Born Fit | Boundedness | Implementation Risk |
|---|-----------|----------------|-----------------|-------------|---------------------|
| A | **硬扛到底** (Hold On — 油尽灯枯) | 继续拼命救人，宁可自己垮掉也不推病人，最终油尽灯枯 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Low |
| B | **学会放手** (Let Go — 释然医者) | 接受自己不是神，开始限号、推病人，虽然名声略降，但找回了自己的节奏 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Low |
| C | **找到传承** (Legacy — 仁心延续) | 收徒弟/传医术，把仁心传承下去，自己退居二线 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Low-Medium |

---

## 4. Compassionate Candidate A: 硬扛到底 (Hold On — 油尽灯枯)

### 4.1 Core Narrative

**一句话概括：** 你是仁心医者，见不得人受苦。哪怕身子已经垮了，你还是硬撑着。能多救一个是一个。油尽灯枯，但仁心不灭。

**叙事弧光：**
- **Pressure (仁心耗尽):** 身子撑不住了，但求医的人还在门口排队
- **Payoff (硬扛到底):** 你选择继续硬扛。老掌柜劝你歇，你说"救人要紧"。病人越来越多，你越来越瘦。终于有一天，你倒在药庐里，手里还攥着半张药方
- **Late-life 伏笔:** 油尽灯枯的老医者 — 受人尊敬，但身体垮了

**Tavern-born 锚点：**
- 老掌柜叹气、酒肆大堂摆满病床、药庐里彻夜不熄的灯
- "酒肆出来的大夫" 视角：从小见惯了生老病死，没想到自己会栽在"太好心"上
- 悲剧英雄色彩 — 打落牙齿和血吞

### 4.2 Trigger Conditions

| Condition | Value | Rationale |
|-----------|-------|-----------|
| Upstream gate | `medical_midlife_pressure_done` + `tavern_medical_pressure_compassionate` | Pressure 之后才有 payoff |
| Age range | 42–46 | Pressure (36-40) 后 2-6 年，让玩家感受一段时间的压力 |
| Exclusivity | `!medical_payoff_done` | 只触发一次 |

### 4.3 Choice Outcome Spec

| 维度 | 详情 |
|------|------|
| **Choice label** | 硬扛到底 — 能多救一个是一个 |
| **Identity marker** | `tavern_medical_payoff_compassionate_holder` |
| **Stat 变化** | constitution -2, chivalry +3, reputation +2 |
| **Cost label** | 油尽灯枯 |
| **Age-40 identity** | 油尽灯枯的仁心医者 |
| **Current goal** | 趁着还能动，能多救一个是一个 |
| **Life memory 方向** | 老掌柜劝你歇，你摆摆手说"救人要紧"。药庐的灯夜夜亮着，你的身子一天不如一天，但只要还有力气坐起来，就不会拒病人于门外 |
| **Summary 方向** | 酒肆出身的仁心医者，一辈子救了无数人，唯独忘了救自己。油尽灯枯，但仁心不灭 |

### 4.4 Tavern-Born Fit Assessment

| Anchor | Fit? | Evidence |
|--------|------|----------|
| 医术/仁心 > 武功 | ✅ 完美 | 核心就是"救人"和"仁心"，跟武功没关系 |
| 酒肆小药庐场景 | ✅ 完美 | 老掌柜叹气、药庐彻夜亮灯、酒肆大堂的病人 |
| 仁心医者身份 | ✅ 完美 | 完全就是 compassionate variant 的极致延伸——仁心到死 |
| 与 merchant 区分 | ✅ 清晰 | Merchant = 商业成功；Medical Comp A = 悲剧英雄 |
| 与 renown 区分 | ✅ 清晰 | Renown = 面子/人情；Medical Comp A = 仁心/生命 |
| 与 generic 江湖区分 | ✅ 清晰 | Generic = 正邪/门派；Medical = 医者仁心 |

**风味评分：⭐⭐⭐⭐⭐ (5/5) — 完美契合 tavern-born compassionate healer 风味**

### 4.5 Boundedness Assessment

| Dimension | Score | Notes |
|-----------|-------|-------|
| 事件数量 | ⭐⭐⭐⭐⭐ | 1 个核心 choice 事件（与其他 2 个选项共享事件结构） |
| 表达更新 | ⭐⭐⭐⭐⭐ | 5 个表达面 × 1 分支 = 5 个新分支（3 choices 共 15 个） |
| 新系统需求 | ⭐⭐⭐⭐⭐ | 零新系统，复用现有 event + expression 体系 |
| 测试范围 | ⭐⭐⭐⭐ | 6 分支 total，需要逐一验证，但模式清晰 |
| Late-life 接口 | ⭐⭐⭐⭐ | 自然预留 late-life 方向（油尽灯枯的晚年） |

**Boundedness 评分：⭐⭐⭐⭐⭐ (5/5) — 最小 bounded 形状**

---

## 5. Compassionate Candidate B: 学会放手 (Let Go — 释然医者)

### 5.1 Core Narrative

**一句话概括：** 你曾以为自己能救所有人。直到身体垮了，你才明白——你不是神。你开始限号、推病人、学会说"不"。虽然有人说你变了，但你终于找回了自己的节奏。

**叙事弧光：**
- **Pressure (仁心耗尽):** 身子撑不住了，但求医的人还在门口排队
- **Payoff (学会放手):** 你病倒了一场。醒来后，你在药庐门口贴了告示——每日只看十人。有人骂你架子大了，有人理解你。你不再是那个来者不拒的仁心医者，但你活得踏实了
- **Late-life 伏笔:** 释然的老医者 — 活得通透，量力而行

**Tavern-born 锚点：**
- 药庐门口的"每日十诊"告示、老掌柜的欣慰、酒肆里的闲言碎语
- "酒肆出来的大夫" 视角：从小在酒肆见惯了人来人往，知道什么叫"量力而行"
- 成长弧光 — 从"我要救所有人"到"我只能救我能救的人"

### 5.2 Choice Outcome Spec

| 维度 | 详情 |
|------|------|
| **Choice label** | 学会放手 — 量力而行，每日只看十人 |
| **Identity marker** | `tavern_medical_payoff_compassionate_let_go` |
| **Stat 变化** | constitution +2, chivalry -1, reputation -1, charisma +1 |
| **Cost label** | 释然行医 |
| **Age-40 identity** | 释然通透的医者 |
| **Current goal** | 量力而行，把有限的精力留给真正需要的人 |
| **Life memory 方向** | 你在药庐门口贴了"每日十诊"的告示。有人骂你忘了初心，也有人说你早该如此。老掌柜拍了拍你的肩膀，说"你终于想通了"。你笑了笑——救人先救己 |
| **Summary 方向** | 酒肆出身的仁心医者，曾以为自己能救所有人，直到身体垮了才学会放手。每日十诊，量力而行。释然了，也活得更久了 |

### 5.3 Tavern-Born Fit Assessment

| Anchor | Fit? | Evidence |
|--------|------|----------|
| 医术/仁心 > 武功 | ✅ 完美 | 核心是"医者的自我和解"，还是医疗主题 |
| 酒肆小药庐场景 | ✅ 完美 | 药庐门口的告示、老掌柜的欣慰、酒肆里的议论 |
| 仁心医者身份 | ✅ 完美 | 不是"变坏了"，而是"成熟了"——仁心还在，只是学会了分寸 |
| 与 merchant 区分 | ✅ 清晰 | Merchant = 商业取舍；Medical Comp B = 医者的自我和解 |
| 与 renown 区分 | ✅ 清晰 | Renown = 撕破脸/断人情；Medical Comp B = 接受不完美/自我和解 |
| 与 generic 江湖区分 | ✅ 清晰 | Generic = 正邪选择；Medical = 医者的成长与妥协 |

**风味评分：⭐⭐⭐⭐⭐ (5/5) — 完美契合，且有成长弧光**

### 5.4 Boundedness Assessment

| Dimension | Score | Notes |
|-----------|-------|-------|
| 事件数量 | ⭐⭐⭐⭐⭐ | 1 个核心 choice 事件的 1 个选项 |
| 表达更新 | ⭐⭐⭐⭐⭐ | 5 个表达面 × 1 分支 |
| 新系统需求 | ⭐⭐⭐⭐⭐ | 零新系统 |
| 叙事丰富度 | ⭐⭐⭐⭐⭐ | 有成长弧光，不是简单的"好/坏" |

**Boundedness 评分：⭐⭐⭐⭐⭐ (5/5)**

---

## 6. Compassionate Candidate C: 找到传承 (Legacy — 仁心延续)

### 6.1 Core Narrative

**一句话概括：** 你的身体撑不住了，但仁心不能断。你开始收徒弟，把医术传下去。虽然自己不再坐诊，但你的医术和仁心，通过徒弟延续了下去。

**叙事弧光：**
- **Pressure (仁心耗尽):** 身子撑不住了，但求医的人还在门口排队
- **Payoff (找到传承):** 你收了个徒弟——是酒肆后厨帮工的孩子，从小看着你看病长大的。你手把手教他认药、诊脉。他坐诊的那天，你站在药庐门口，看着里面的身影，仿佛看到了年轻时的自己
- **Late-life 伏笔:** 传承之师 — 自己不看病了，但医术传了下去

**Tavern-born 锚点：**
- 酒肆后厨的孩子、药庐里的师徒、老掌柜的感慨
- "酒肆出来的大夫" 视角：传承 — 就像老掌柜把店交给你一样，你把医术传下去
- 温暖结局 — 不是一个人扛，而是有人接班

### 6.2 Choice Outcome Spec

| 维度 | 详情 |
|------|------|
| **Choice label** | 找到传承 — 收个徒弟，把医术传下去 |
| **Identity marker** | `tavern_medical_payoff_compassionate_legacy` |
| **Stat 变化** | constitution +1, reputation +1, chivalry +1, charisma +2 |
| **Cost label** | 仁心传承 |
| **Age-40 identity** | 传道授业的仁医之师 |
| **Current goal** | 把医术和仁心传下去，让更多人能得到救治 |
| **Life memory 方向** | 你收了酒肆后厨帮工的孩子做徒弟。那孩子从小看着你看病长大，眼里有光。你教他认药、诊脉、熬药，就像当年老掌柜教你一样。他第一次独立坐诊那天，你站在药庐门口，心里说不出的踏实 |
| **Summary 方向** | 酒肆出身的仁心医者，身体垮了，但仁心没断。收了个徒弟，把医术和仁心一起传了下去。救的人少了，但救的火种留了下来 |

### 6.3 Tavern-Born Fit Assessment

| Anchor | Fit? | Evidence |
|--------|------|----------|
| 医术/传承 > 武功 | ✅ 完美 | 核心是"传承"，还是医疗主题 |
| 酒肆小药庐场景 | ✅ 很好 | 酒肆后厨的孩子、药庐师徒、老掌柜的感慨 |
| 仁心医者身份 | ✅ 很好 | 仁心以另一种方式延续——不是自己救，是教别人救 |
| 与 merchant 区分 | ✅ 清晰 | Merchant = 财富传承；Medical Comp C = 医术/仁心传承 |
| 与 renown 区分 | ✅ 清晰 | Renown = 江湖名声传承；Medical Comp C = 医术仁心传承 |

**风味评分：⭐⭐⭐⭐ (4/5) — 很好，但"传承"可能更适合 late-life**

### 6.4 Boundedness Assessment

| Dimension | Score | Notes |
|-----------|-------|-------|
| 事件数量 | ⭐⭐⭐⭐ | 1 个 choice 选项，但需要引入"徒弟"角色 |
| 表达更新 | ⭐⭐⭐⭐ | 5 个表达面 × 1 分支 |
| 新系统需求 | ⭐⭐⭐⭐ | 零新系统，但需要写徒弟相关的文案 |
| Late-life 接口 | ⭐⭐⭐ | 传承本身就是 late-life 的主题，payoff 就做传承会不会太早？ |

**Boundedness 评分：⭐⭐⭐⭐ (4/5) — 可以做，但要注意不要越界到 late-life**

---

## 7. Compassionate Comparison & Recommendation

### 7.1 Comparison Matrix

| Dimension | A: 硬扛到底 (油尽灯枯) | B: 学会放手 (释然医者) | C: 找到传承 (仁心延续) |
|-----------|---------------------|---------------------|---------------------|
| **Tavern-born 风味** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Boundedness** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Implementation risk** | Low | Low | Low-Medium |
| **与 pressure 衔接** | 完美（仁心耗尽 → 继续硬扛） | 很好（仁心耗尽 → 接受现实） | 好（仁心耗尽 → 找人接班） |
| **独特性** | 高（悲剧英雄） | 高（成长/和解） | 中（传承较常见） |
| **Variant 专属度** | 高（只有 compassionate 才会硬扛到死） | 高（仁心医者的自我和解） | 中（任何医者都可以收徒弟） |
| **Late-life 预留** | 自然（油尽灯枯的晚年） | 自然（释然的晚年） | 有，但可能抢 late-life 的戏 |
| **叙事张力** | 高（悲壮） | 中高（温暖/释然） | 中（温暖但平缓） |
| **整体推荐度** | 🥇 推荐 | 🥇 推荐 | 🥇 推荐 |

### 7.2 Selected Directions (Compassionate)

**三个都选。**

理由：
1. **A（硬扛）+ B（放手）+ C（传承）形成完美三角**：
   - A = 坚持到底，悲剧英雄
   - B = 接受现实，自我和解
   - C = 薪火相传，仁心延续
2. **三个方向各有各的身份走向**：油尽灯枯的医者 / 释然通透的医者 / 传道授业的医师
3. **Stat 变化有明显区别**：
   - A: con-2, chivalry+3, rep+2（继续消耗，理想主义极致）
   - B: con+2, chivalry-1, rep-1, charisma+1（收回精力，找回自我）
   - C: con+1, rep+1, chivalry+1, charisma+2（均衡发展，传承加分）
4. **都符合 tavern-born 风味**：老掌柜、酒肆、药庐，三个方向都有锚点
5. **都与 pressure 衔接自然**：都是"仁心耗尽"之后的合理应对方式
6. **都有 distinct identity**：不是简单的数值换皮

### 7.3 Three-Choice Differentiation Check

| 维度 | A 硬扛到底 | B 学会放手 | C 找到传承 |
|------|----------|----------|----------|
| **核心态度** | 宁死不屈，仁心到死 | 接受不完美，量力而行 | 薪火相传，仁心延续 |
| **Constitution** | -2（最低） | +2（最高） | +1 |
| **Chivalry** | +3（最高） | -1 | +1 |
| **Reputation** | +2 | -1 | +1 |
| **Charisma** | — | +1 | +2（最高） |
| **Cost label** | 油尽灯枯 | 释然行医 | 仁心传承 |
| **Identity** | 油尽灯枯的仁心医者 | 释然通透的医者 | 传道授业的仁医之师 |
| **叙事调性** | 悲壮/令人心疼 | 温暖/释然/成长 | 温暖/传承/希望 |
| **Tavern-born 锚点** | 打落牙齿和血吞 | 老掌柜的"想通了" | 酒肆后厨的徒弟 |

**结论：✅ 三个选项有实质差异，不是换皮。** 每个选项都有独特的 stat 分布、identity、cost label、叙事调性，且都锚定在 tavern-born compassionate healer 的不同侧面。

---

## 8. Pragmatic Variant (世故人医 → 人情债缠身) — Candidates

### 8.1 Candidates Overview

| # | Direction | Core Narrative | Tavern-Born Fit | Boundedness | Implementation Risk |
|---|-----------|----------------|-----------------|-------------|---------------------|
| A | **硬扛人情** (Hold Favors — 越缠越深) | 维持所有人情往来，名声越来越大，但人情网越织越密，彻底沦为权贵的工具 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Low |
| B | **撕破脸皮** (Break Free — 声名狼藉) | 撕破脸断了不该有的债，落个骂名，但活得自在了 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Low |
| C | **人情练达** (Master Favors — 游刃有余) | 拿捏分寸、玩转人情，既不得罪人也不被绑住，成了真正懂人情世故的名医 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Low-Medium |

---

## 9. Pragmatic Candidate A: 硬扛人情 (Hold Favors — 越缠越深)

### 9.1 Core Narrative

**一句话概括：** 你懂分寸、会办事。人情债越来越重，但你还是硬扛着——毕竟名声就是一切。你彻底沦为权贵的私人大夫，名声越来越响，可你已经不是在行医，而是在做人情。

**叙事弧光：**
- **Pressure (人情债缠身):** 张员外李知府都来找你，人情网越织越密
- **Payoff (硬扛人情):** 你选择继续维持。今天给总督的小妾看诊，明天给将军的幕僚出诊。你的诊金越来越高，认识的人越来越有权势。但你发现——你已经不能拒绝任何人了。你成了权贵圈子里的"名医"，但你还记得自己最初为什么学医吗？
- **Late-life 伏笔:** 权贵附庸 — 名声赫赫，但身不由己

**Tavern-born 锚点：**
- 大户人家的马车停在酒肆门口、酒席上的恭维、人情账本越翻越厚
- "酒肆出来的大夫" 视角：从小见惯了人情世故，以为自己能拿捏，没想到还是陷进去了
- 讽刺色彩 — 世故反被世故误

### 9.2 Choice Outcome Spec

| 维度 | 详情 |
|------|------|
| **Choice label** | 硬扛人情 — 名声就是一切，咬牙撑住 |
| **Identity marker** | `tavern_medical_payoff_pragmatic_holder` |
| **Stat 变化** | reputation +4, connections +3, money +60, chivalry -2 |
| **Cost label** | 声名所累 |
| **Age-40 identity** | 声名赫赫的权贵御医 |
| **Current goal** | 维持各方人情，在权贵圈里站稳脚跟 |
| **Life memory 方向** | 张员外、李知府、总督府、将军衙... 认识的人越来越多，身份越来越高。你的诊金是当初的十倍，出入的都是深宅大院。只是有时候深夜回家，看着手里的金元宝，你会想起酒肆里那个给穷人免费看病的自己 |
| **Summary 方向** | 酒肆出身的世故人医，靠人情世故闯出了名头，成了权贵座上宾。名声赫赫，诊金不菲，只是人情网越织越密，再也脱不开身 |

### 9.3 Tavern-Born Fit Assessment

| Anchor | Fit? | Evidence |
|--------|------|----------|
| 医术/人情 > 武功 | ✅ 完美 | 核心是"人情世故"和"名声"，跟武功没关系 |
| 酒肆场景 | ✅ 完美 | 大户马车停门口、酒肆酒席、人情账本 |
| 世故人医身份 | ✅ 完美 | 完全就是 pragmatic variant 的极致延伸——世故到被世故反噬 |
| 与 merchant 区分 | ✅ 清晰 | Merchant = 商业帝国；Medical Prag A = 权贵人情网 |
| 与 renown 区分 | ✅ 需注意但有别 | Renown 硬扛 = 江湖面子；Medical Prag A 硬扛 = 权贵私人医生 |
| 与 generic 江湖区分 | ✅ 清晰 | Generic = 门派纷争；Medical = 权贵人情 |

**风味评分：⭐⭐⭐⭐⭐ (5/5) — 完美契合 tavern-born pragmatic healer 风味**

**与 renown 的区别：**
- Renown 硬扛：江湖人士的人情，靠面子和名声，服务的是江湖人
- Medical pragmatic 硬扛：权贵的人情，靠医术和分寸，出入的是深宅大院
- 场景不同：renown 是江湖调解、引荐高人；medical pragmatic 是给内眷看病、私宅出诊

### 9.4 Boundedness Assessment

| Dimension | Score | Notes |
|-----------|-------|-------|
| 事件数量 | ⭐⭐⭐⭐⭐ | 1 个核心 choice 事件的 1 个选项 |
| 表达更新 | ⭐⭐⭐⭐⭐ | 5 个表达面 × 1 分支 |
| 新系统需求 | ⭐⭐⭐⭐⭐ | 零新系统 |
| 叙事张力 | ⭐⭐⭐⭐⭐ | 讽刺色彩，有深度 |

**Boundedness 评分：⭐⭐⭐⭐⭐ (5/5)**

---

## 10. Pragmatic Candidate B: 撕破脸皮 (Break Free — 声名狼藉)

### 10.1 Core Narrative

**一句话概括：** 你懂人情，但更懂——有些债，不该还。你撕破脸断了那些权贵的人情往来。有人骂你忘恩负义，有人说你不识抬举。名声坏了，但你终于能睡个安稳觉了。

**叙事弧光：**
- **Pressure (人情债缠身):** 人情网越织越密，想脱身也脱不开
- **Payoff (撕破脸皮):** 你终于受够了。那天总督府的管家又来请你去给小妾的猫看病，你把药箱一摔，说"老子不伺候了"。消息传开，有人骂你忘恩负义，有人说你傻。但你关了药庐的门，喝着老掌柜烫的酒，心里说不出的痛快
- **Late-life 伏笔:** 快意恩仇的江湖游医 — 名声不好，但活得自在

**Tavern-born 锚点：**
- 摔药箱、老掌柜烫酒、酒肆里的风言风语
- "酒肆出来的大夫" 视角：从小在酒肆见惯了虚情假意，知道什么时候该翻脸
- 反英雄色彩 — 不伺候了，老子自己快活

### 10.2 Choice Outcome Spec

| 维度 | 详情 |
|------|------|
| **Choice label** | 撕破脸皮 — 不伺候了，爱谁谁 |
| **Identity marker** | `tavern_medical_payoff_pragmatic_breaker` |
| **Stat 变化** | reputation -3, connections -5, charisma -1, constitution +2, chivalry +1 |
| **Cost label** | 快意江湖 |
| **Age-40 identity** | 快意恩仇的江湖游医 |
| **Current goal** | 断了权贵的人情，只给愿意给的人看病 |
| **Life memory 方向** | 你把权贵人家的请帖全退了。有人说你自毁前程，有人说你有骨气。老掌柜给你烫了壶酒，说"好样的，我就知道你不是那种人"。你喝了一口，辣得直咧嘴，但心里敞亮——终于不用看别人脸色了 |
| **Summary 方向** | 酒肆出身的世故人医，曾在权贵圈里风生水起，后来撕破脸断了所有人情。名声坏了，但活得自在。只给看得起的人看病，不伺候的，给再多钱也不去 |

### 10.3 Tavern-Born Fit Assessment

| Anchor | Fit? | Evidence |
|--------|------|----------|
| 医术/人情 > 武功 | ✅ 完美 | 核心是"断人情"，还是医疗+人情主题 |
| 酒肆场景 | ✅ 完美 | 老掌柜烫酒、酒肆里的议论、摔药箱 |
| 世故人医身份 | ✅ 很好 | 不是"变坏了"，而是"想通了"——懂世故但不被世故绑住 |
| 与 merchant 区分 | ✅ 清晰 | Merchant = 生意失败/翻身；Medical Prag B = 断权贵/求自由 |
| 与 renown 区分 | ✅ 需注意但有别 | Renown 撕破脸 = 断江湖人情；Medical Prag B 撕破脸 = 断权贵人情 |

**风味评分：⭐⭐⭐⭐⭐ (5/5) — 完美契合，反英雄色彩很有魅力**

### 10.4 Boundedness Assessment

| Dimension | Score | Notes |
|-----------|-------|-------|
| 事件数量 | ⭐⭐⭐⭐⭐ | 1 个 choice 选项 |
| 表达更新 | ⭐⭐⭐⭐⭐ | 5 个表达面 × 1 分支 |
| 新系统需求 | ⭐⭐⭐⭐⭐ | 零新系统 |
| 叙事张力 | ⭐⭐⭐⭐⭐ | 高——反英雄，有记忆点 |

**Boundedness 评分：⭐⭐⭐⭐⭐ (5/5)**

---

## 11. Pragmatic Candidate C: 人情练达 (Master Favors — 游刃有余)

### 11.1 Core Narrative

**一句话概括：** 你懂人情，更懂分寸。既不得罪人，也不被人情绑住。你来我往，有借有还，游刃有余。你成了真正懂人情世故的名医——谁都给你面子，谁也绑不住你。

**叙事弧光：**
- **Pressure (人情债缠身):** 人情网越织越密，想脱身也脱不开
- **Payoff (人情练达):** 你找到了平衡点。该去的去，该推的推；该收的收，该免的免。张员外欠你一个人情，李知府承你一份情。你不是他们的私人大夫，你是他们"都想结交的那位名医"。人情不是债，是往来——有来有往，才长久
- **Late-life 伏笔:** 人情练达的老名医 — 黑白两道都给面子，谁也绑不住

**Tavern-born 锚点：**
- 酒肆掌柜的智慧——八面玲珑，谁都不得罪
- 人情往来不是债，是生意、是交情、是互相给面子
- "酒肆出来的大夫" 视角：从小看老掌柜怎么应付三教九流，全学到了

### 11.2 Choice Outcome Spec

| 维度 | 详情 |
|------|------|
| **Choice label** | 人情练达 — 拿捏分寸，有来有往 |
| **Identity marker** | `tavern_medical_payoff_pragmatic_master` |
| **Stat 变化** | reputation +2, connections +1, charisma +4, money +30 |
| **Cost label** | 人情练达 |
| **Age-40 identity** | 人情练达的一代名医 |
| **Current goal** | 拿捏人情往来的分寸，游刃有余地行走在权贵之间 |
| **Life memory 方向** | 张员外的人情，你用一张药方还了；李知府的面子，你用一次夜诊给了。该去的去，该推的推。没人说你架子大，也没人敢把你当自己人。老掌柜说你"学到家了"——酒肆掌柜的那套八面玲珑，你全用在行医上了 |
| **Summary 方向** | 酒肆出身的世故人医，深谙人情世故，拿捏得恰到好处。权贵都想结交你，谁也绑不住你。人情不是债，是往来——有来有往，才是长久之道 |

### 11.3 Tavern-Born Fit Assessment

| Anchor | Fit? | Evidence |
|--------|------|----------|
| 医术/人情 > 武功 | ✅ 完美 | 核心是"人情练达"，还是医疗+人情主题 |
| 酒肆场景 | ✅ 完美 | 老掌柜的智慧、八面玲珑、酒肆里的人情往来 |
| 世故人医身份 | ✅ 完美 | 完全就是 pragmatic variant 的理想形态——懂分寸、会办事、不被绑 |
| 与 merchant 区分 | ⚠️ 需注意 | Merchant 也有"人情练达/生意精明"的感觉，要区分开 |
| 与 renown 区分 | ⚠️ 需注意 | Renown 也有"人情练达"的方向，要区分开 |

**风味评分：⭐⭐⭐⭐ (4/5) — 很好，但要注意与 merchant/renown 的区分**

**与其他路线的区分：**
- **Merchant 人情练达：** 商业层面的精明——赚钱、谈生意、商场博弈
- **Renown 人情练达：** 江湖层面的面子——调解纠纷、引荐高人、江湖声望
- **Medical pragmatic 人情练达：** 权贵层面的分寸——给内眷看病、权贵结交、医者身份的独特价值

三个"练达"各有各的场景和味道，不冲突。

### 11.4 Boundedness Assessment

| Dimension | Score | Notes |
|-----------|-------|-------|
| 事件数量 | ⭐⭐⭐⭐⭐ | 1 个 choice 选项 |
| 表达更新 | ⭐⭐⭐⭐⭐ | 5 个表达面 × 1 分支 |
| 新系统需求 | ⭐⭐⭐⭐⭐ | 零新系统 |
| 与 renown/merchant 区分度 | ⭐⭐⭐⭐ | 需要在文案上强化"医者身份"的独特性 |

**Boundedness 评分：⭐⭐⭐⭐ (4/5) — 可以做，注意区分度即可**

---

## 12. Pragmatic Comparison & Recommendation

### 12.1 Comparison Matrix

| Dimension | A: 硬扛人情 (越缠越深) | B: 撕破脸皮 (声名狼藉) | C: 人情练达 (游刃有余) |
|-----------|---------------------|---------------------|---------------------|
| **Tavern-born 风味** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Boundedness** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Implementation risk** | Low | Low | Low-Medium |
| **与 pressure 衔接** | 完美（人情债 → 继续扛） | 很好（人情债 → 撕破脸） | 好（人情债 → 玩转它） |
| **独特性** | 高（权贵附庸的讽刺） | 高（反英雄/快意恩仇） | 中（练达较常见，但有医者特色） |
| **Variant 专属度** | 高（只有 pragmatic 才会陷入权贵） | 高（懂世故的人才知道怎么断） | 中（很多路线都可以有"练达"） |
| **Late-life 预留** | 自然（权贵附庸的晚年） | 自然（江湖游医的晚年） | 自然（老名医的晚年） |
| **叙事张力** | 高（讽刺/悲剧） | 高（反英雄/痛快） | 中高（游刃有余/智者） |
| **整体推荐度** | 🥇 推荐 | 🥇 推荐 | 🥇 推荐 |

### 12.2 Selected Directions (Pragmatic)

**三个都选。**

理由：
1. **A（硬扛）+ B（撕破）+ C（练达）形成完美三角**：
   - A = 越陷越深，彻底沦为工具
   - B = 撕破脸，断舍离，求自由
   - C = 玩转规则，游刃有余
2. **三个方向各有各的身份走向**：声名赫赫的权贵御医 / 快意恩仇的江湖游医 / 人情练达的一代名医
3. **Stat 变化有明显区别**：
   - A: rep+4, con+3, money+60, chivalry-2（全是社交/物质，但侠义下降）
   - B: rep-3, con-5, charisma-1, con+2, chivalry+1（社交崩塌，但身体/侠义回升）
   - C: rep+2, con+1, charisma+4, money+30（均衡，charisma 最高）
4. **都符合 tavern-born 风味**：酒肆、老掌柜、人情世故，三个方向都有锚点
5. **都与 pressure 衔接自然**：都是"人情债缠身"之后的合理应对方式
6. **都有 distinct identity**：不是简单的数值换皮

### 12.3 Three-Choice Differentiation Check

| 维度 | A 硬扛人情 | B 撕破脸皮 | C 人情练达 |
|------|----------|----------|----------|
| **核心态度** | 名声至上，越陷越深 | 快意恩仇，断舍离 | 拿捏分寸，游刃有余 |
| **Reputation** | +4（最高） | -3（最低） | +2 |
| **Connections** | +3 | -5（最低） | +1 |
| **Charisma** | — | -1 | +4（最高） |
| **Money** | +60（最高） | — | +30 |
| **Constitution** | — | +2 | — |
| **Chivalry** | -2（最低） | +1 | — |
| **Cost label** | 声名所累 | 快意江湖 | 人情练达 |
| **Identity** | 声名赫赫的权贵御医 | 快意恩仇的江湖游医 | 人情练达的一代名医 |
| **叙事调性** | 讽刺/身不由己 | 反英雄/痛快 | 智者/游刃有余 |
| **Tavern-born 锚点** | 人情账本越翻越厚 | 摔药箱 + 老掌柜烫酒 | 老掌柜的"学到家了" |

**结论：✅ 三个选项有实质差异，不是换皮。** 每个选项都有独特的 stat 分布、identity、cost label、叙事调性，且都锚定在 tavern-born pragmatic healer 的不同侧面。

---

## 13. Cross-Variant Differentiation Check

两个 variant 的 payoff 方向是否有足够差异？（会不会只是 compassionate 和 pragmatic 各 3 个，但是镜像？）

### 13.1 Side-by-Side Comparison

| 维度 | Compassionate A: 硬扛到底 | Pragmatic A: 硬扛人情 |
|------|------------------------|---------------------|
| **"硬扛"什么** | 仁心/救人的执念 | 名声/人情的枷锁 |
| **代价类型** | 身体（con-2） | 侠义/自我（chivalry-2） |
| **结局味道** | 悲壮/令人心疼 | 讽刺/身不由己 |
| **Tavern-born 锚点** | 老掌柜叹气 | 人情账本 |

| 维度 | Compassionate B: 学会放手 | Pragmatic B: 撕破脸皮 |
|------|------------------------|---------------------|
| **"放手/撕破"什么** | 接受自己不是神，量力而行 | 断权贵的人情，不伺候了 |
| **收获什么** | 健康 + 释然 | 自由 + 痛快 |
| **失去什么** | 一点点名声 + 侠义 | 大量名声 + 人脉 |
| **结局味道** | 温暖/释然/成长 | 反英雄/快意恩仇 |

| 维度 | Compassionate C: 找到传承 | Pragmatic C: 人情练达 |
|------|------------------------|---------------------|
| **"成功"的定义** | 仁心延续，薪火相传 | 玩转人情，游刃有余 |
| **核心能力** | 传承/授业 | 分寸/交际 |
| **结局味道** | 温暖/希望/传承 | 智者/游刃有余/成功 |

### 13.2 Differentiation Summary

| 维度 | Compassionate Variant | Pragmatic Variant |
|------|----------------------|------------------|
| **核心矛盾** | 理想主义的极限 — 仁心 vs 身体 | 现实主义的极限 — 人情 vs 自由 |
| **压力方向** | 向内（自我消耗） | 向外（社会束缚） |
| **三个选择的性质** | 坚持 / 和解 / 传承 | 深陷 / 决裂 / 驾驭 |
| **叙事调性** | 偏温暖/悲壮/治愈 | 偏讽刺/痛快/精明 |
| **身份走向** | 医者（仁心/释然/传承） | 人医（权贵附庸/江湖游医/人情练达） |
| **Tavern-born 锚点** | 老掌柜 / 药庐 / 救人 | 老掌柜 / 酒肆 / 人情世故 |
| **与 renown payoff 的关系** | 完全不同（renown 是人情，compassionate 是仁心） | 有交集但场景不同（renown 是江湖人情，pragmatic 是权贵人情） |

**结论：✅ 两个 variant 的 payoff 有本质差异，不是简单镜像。**

- Compassionate 的三个选择 = 仁心医者的三种归宿（执着 / 释然 / 传承）
- Pragmatic 的三个选择 = 世故人医的三种归宿（深陷 / 决裂 / 驾驭）

虽然结构上都是"硬扛 / 放手 / 平衡"的三角，但内容、味道、身份走向完全不同。不是换皮，是真正的 variant differentiation。

---

## 14. Quality-First Verification

所有 6 个 payoff 方向是否满足 quality-first 原则？

| Principle | Compassionate (3 choices) | Pragmatic (3 choices) |
|-----------|--------------------------|----------------------|
| Evidence-based | ✅ 基于 P83-P87 已验证的风味锚点 | ✅ 基于 P83-P87 已验证的风味锚点 |
| Flavor consistency | ✅ 仁心/救人/酒肆小药庐，与前四阶段完全一致 | ✅ 世故/人情/酒肆出身，与前四阶段完全一致 |
| Small step | ✅ 2 个 choice 事件 + 6 分支 + ~30 expression 更新，可控 | ✅ 同上 |
| Low risk | ✅ 复用现有架构，有 renown payoff 先例 | ✅ 同上 |
| Variant differentiation | ✅ 与 pragmatic 有本质差异 | ✅ 与 compassionate 有本质差异 |
| Choice meaningfulness | ✅ 3 个 choice 各有 distinct identity + stats + narrative | ✅ 3 个 choice 各有 distinct identity + stats + narrative |
| Clear handoff | ✅ Contract 定义清晰，P89 可直接承接 | ✅ 同上 |

**✅ 全部 6 个方向都满足 quality-first + small-step 原则**

---

## 15. Next Step

进入 P88-004：基于选定的 6 个 payoff 方向，定义详细的 payoff contract。

**6 个 payoff 分支总览：**
- Compassionate A: 硬扛到底 → 油尽灯枯的仁心医者
- Compassionate B: 学会放手 → 释然通透的医者
- Compassionate C: 找到传承 → 传道授业的仁医之师
- Pragmatic A: 硬扛人情 → 声名赫赫的权贵御医
- Pragmatic B: 撕破脸皮 → 快意恩仇的江湖游医
- Pragmatic C: 人情练达 → 人情练达的一代名医

---

**P88-003 complete.** Payoff direction comparison saved.

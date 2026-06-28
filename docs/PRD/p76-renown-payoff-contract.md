# P76 Renown Payoff Contract

> **Purpose:** Design-first contract for the `jianghu_renown_sage` payoff stage — how the tavern-born renown route resolves its 人情债 (favor debt) pressure.
> **Source of truth:** This contract defines what P77 (implementation) must deliver.
> **Status:** LOCKED — P76 design-first complete

## 1. Core Direction

**Selected:** 人情债之解 — choice-based payoff（人情债的了结，选择驱动）

**Why choice-based (vs merchant auto):**
- Merchant payoff 是 auto（商业帝国自然成型），因为商人的成功是积累式的
- Renown payoff 应该是 choice-based，因为"人情债怎么还"本身就是价值判断问题
- Choice 能显著提升 renown 路线与 merchant 路线的差异化
- 符合 North Star §4.2：事件触发选择应有可观测后果

**Core narrative question:** 人情债越积越重，你选择怎么了结？

**Distinction from pressure:**
- Pressure = "人情债越来越重了"（意识到问题）
- Payoff = "我选择这样了结"（主动解决问题）
- Pressure 是 auto 事件（被动承受），Payoff 是 choice 事件（主动选择）

**Distinction from generic midlife:**
- Generic midlife = 平淡或随机的中年事件
- Renown payoff = 路线标志性的身份抉择，定义"我是谁"
- 三个选择都是 tavern-born 特有的，不是 generic 江湖抉择

---

## 2. Three Choice Directions

### Option A: 硬扛到底（硬撑面子）

| 维度 | 内容 |
|------|------|
| **Flavor 锚点** | 酒肆跑堂的——客人永远是对的，打落牙齿和血吞 |
| **核心叙事** | 酒肆出身的人最讲面子，宁可自己苦点也不能让人说闲话。所有的人情债都硬扛下来，名声更响了，但自己也累垮了。 |
| **Stat 变化** | reputation +5, connections +3, charisma +2 |
| **Identity marker** | `tavern_renown_payoff_hard_holder` |
| **远期伏笔** | 埋下"声名之累"的隐患（为 late-life stage 预留） |
| **叙事调性** | 悲剧英雄——为了名声牺牲自己 |

### Option B: 索性撕破脸（断舍离）

| 维度 | 内容 |
|------|------|
| **Flavor 锚点** | 酒肆三教九流——见多了虚情假意，懂什么时候该断 |
| **核心叙事** | 酒肆里混大的，也懂什么时候该翻脸——有些债，不该还。撕破脸皮断了假人情，反而活出了真我。名声掉了，但自由了。 |
| **Stat 变化** | reputation -2, connections -4, charisma -1 |
| **Identity marker** | `tavern_renown_payoff_breaker` |
| **远期伏笔** | 换来真正的自由（为 late-life stage 预留） |
| **叙事调性** | 反英雄——撕破脸，活出真我 |

### Option C: 找到平衡（人情世故）

| 维度 | 内容 |
|------|------|
| **Flavor 锚点** | 酒肆掌柜的智慧——人情不是债，是往来；有来有往才长久 |
| **核心叙事** | 酒肆掌柜的智慧——人情不是债，是往来；有来有往才长久。拿捏好分寸，既不硬扛也不撕破，成了真正懂人情世故的江湖名宿。 |
| **Stat 变化** | reputation +2, connections +1, charisma +3 |
| **Identity marker** | `tavern_renown_payoff_balancer` |
| **远期伏笔** | 人情练达，可持续发展（为 late-life stage 预留） |
| **叙事调性** | 中庸智者——拿捏分寸，游刃有余 |

**Differentiation check:** 三个选项有实质差异——stat 分布不同、identity 不同、cost label 不同、叙事调性不同、tavern-born 锚点不同。不是换皮。

---

## 3. Event Spec

### Event ID
`renown_midlife_payoff`

### Type
`choice`（玩家选择，不是 auto）

### Age Range
43–47 岁（pressure 后约 6 年，让玩家感受一段时间的压力）

### Trigger
`age_reach` at age 43

### Trigger Conditions
1. `flags.has('renown_midlife_pressure_done')` — pressure 已完成
2. `!flags.has('renown_midlife_payoff_done')` — 互斥 guard
3. `!flags.has('orthodox_childhood_seed_done')` — 排除正道种子
4. `!flags.has('demonic_childhood_seed_done')` — 排除魔道种子
5. 仅限 tavern_hand origin + ally_network seed

### Upstream Gate
`renown_midlife_pressure_done`

### Checkpoint Flag
`renown_midlife_payoff_done`（通用 checkpoint，标记 payoff 已发生）

加上三个 choice-specific markers（三选一设置）：
- `tavern_renown_payoff_hard_holder`（Option A）
- `tavern_renown_payoff_breaker`（Option B）
- `tavern_renown_payoff_balancer`（Option C）

### Age-40 Identity Flag
`renown_age40_identity_done` — payoff 完成时同步设置，标记 age-40 identity 已深化

### Event Content (Title + Text)

**Title:** 人情之解

**Text:**
这些年，人情债像酒肆门口的石狮子，越压越重。有人登门道谢，有人上门讨债，有人借着你的名头在外行事。你站在柜台后，拨着算盘——这人情的账，该清一清了。

窗外的柳树绿了又黄，你想起小时候帮账房先生拨算盘的日子。那时候你只觉得数字有趣，如今才知道——人情这盘账，最难算。

### Choice Options

**Option A: 硬扛到底**
> 都是受过我恩惠的人，这点忙算什么。债，我一个人扛。
>
> *（reputation +5, connections +3, charisma +2）*

**Option B: 索性撕破脸**
> 有些债，本就不该还。假人情，断了也罢。
>
> *（reputation -2, connections -4, charisma -1）*

**Option C: 找到平衡**
> 人情不是债，是往来。该帮的帮，该推的推，有来有往才长久。
>
> *（reputation +2, connections +1, charisma +3）*

### Auto Effects (Common to All Choices)
- `flag_set`: `renown_midlife_payoff_done`
- `flag_set`: `renown_age40_identity_done`
- `event_record`: `renown_midlife_payoff`

### Choice-Specific Effects

**Option A (硬扛到底):**
- `flag_set`: `tavern_renown_payoff_hard_holder`
- `stat_modify`: reputation +5
- `stat_modify`: connections +3
- `stat_modify`: charisma +2

**Option B (索性撕破脸):**
- `flag_set`: `tavern_renown_payoff_breaker`
- `stat_modify`: reputation -2
- `stat_modify`: connections -4
- `stat_modify`: charisma -1

**Option C (找到平衡):**
- `flag_set`: `tavern_renown_payoff_balancer`
- `stat_modify`: reputation +2
- `stat_modify`: connections +1
- `stat_modify`: charisma +3

### Metadata
- Tags: `["p77", "renown", "payoff", "mainline", "choice", "once"]`
- Priority: 0
- Weight: 100
- Category: `main_story`
- narrativeScheduling.stageSignals: `["renown_midlife_payoff"]`

---

## 4. Player-Facing Expression Updates

### 4.1 Sample Line Expression (`sampleLineExpression.ts`)

#### `deriveSampleLineCostLabel()` — payoff 分支

**Gate order:** `renown_midlife_payoff_done` > `renown_midlife_pressure_done` > base

| Option | Cost Label Text |
|--------|----------------|
| Option A (硬扛) | 声名之累 |
| Option B (撕破脸) | 快意恩仇 |
| Option C (平衡) | 人情练达 |

#### `renownCurrentGoal()` — payoff 分支

**Gate order:** `renown_midlife_payoff_done` > `renown_midlife_pressure_done` > `renown_on_ramp_done` > `tavern_renown_bridge_crossed` > base

| Option | Current Goal Text |
|--------|------------------|
| Option A (硬扛) | 硬扛所有人情债，保住江湖名声 |
| Option B (撕破脸) | 撕破脸皮，断了不该还的债 |
| Option C (平衡) | 拿捏人情往来的分寸，找到平衡 |

#### `renownAge40Identity()` — payoff 深化

**触发条件:** `renown_age40_identity_done` (set by payoff event)

| Option | Age-40 Identity Text |
|--------|---------------------|
| Option A (硬扛) | 你是硬撑面子的江湖好人：从酒肆跑堂到江湖名宿，人情债都自己扛，名声响了，担子也重了。 |
| Option B (撕破脸) | 你是快意恩仇的独行侠：从酒肆跑堂到江湖名宿，撕破了假人情，换来了真自由。 |
| Option C (平衡) | 你是人情练达的江湖名宿：从酒肆跑堂到江湖名宿，懂人情往来，拿捏得住分寸，游刃有余。 |

### 4.2 Ordinary Origin Expression (`ordinaryOriginExpression.ts`)

#### `tavernCurrentGoal()` — payoff 分支

**Gate order:** `renown_midlife_payoff_done` > `renown_midlife_pressure_done` > `renown_on_ramp_done` > `tavern_renown_bridge_crossed` > base

| Option | Current Goal Text |
|--------|------------------|
| Option A (硬扛) | 硬扛所有人情债，保住江湖名声 |
| Option B (撕破脸) | 撕破脸皮，断了不该还的债 |
| Option C (平衡) | 拿捏人情往来的分寸，找到平衡 |

#### `tavernLifeMemory()` — payoff 记忆

| Option | Life Memory Text |
|--------|-----------------|
| Option A (硬扛) | 你把所有人情债都扛了下来。受过你恩惠的人念你的好，你自己却常在夜深人静时叹气——名声是撑住了，人也累垮了。酒肆的老掌柜若还在，大概会说你傻吧。 |
| Option B (撕破脸) | 你撕破了脸，断了那些不该还的假人情。有人骂你忘恩负义，也有人说你活得通透。你不在乎——酒肆里三教九流见多了，真真假假，你分得清。 |
| Option C (平衡) | 你拿捏住了人情往来的分寸。该帮的帮，该推的推，有来有往，不欠人情也不结仇。酒肆掌柜的智慧，全被你用在了江湖上。人们说你人情练达，你只是笑笑。 |

#### `deriveOrdinaryOriginSummary()` — payoff 终局总结

| Option | Summary Text |
|--------|-------------|
| Option A (硬扛) | 酒肆出身的江湖名宿：靠人脉与面子闯出了名号，人情债全自己扛，名声越响，担子越重。 |
| Option B (撕破脸) | 酒肆出身的江湖独行：曾靠人脉与面子闯出名号，后来撕破脸断了假人情，反倒活得通透快意。 |
| Option C (平衡) | 酒肆出身的江湖名宿：靠人脉与面子闯出了名号，更懂人情往来的分寸，人情练达，游刃有余。 |

### 4.3 Core Payoff Signals（至少 3 个）

1. **Cost label**（声名之累 / 快意恩仇 / 人情练达）— 主屏幕路线代价标签
2. **Current goal**（硬扛 / 撕破脸 / 找平衡）— 主屏幕当前目标
3. **Age-40 identity**（硬撑面子的好人 / 快意恩仇的独行侠 / 人情练达的名宿）— 身份总结
4. **Life memory**（payoff 记忆）— 人生记忆面板
5. **Origin summary**（终局总结）— 出身总结行

---

## 5. Stat Changes Summary

| Stat | Option A (硬扛) | Option B (撕破脸) | Option C (平衡) |
|------|-----------------|-------------------|-----------------|
| reputation | +5 | -2 | +2 |
| connections | +3 | -4 | +1 |
| charisma | +2 | -1 | +3 |
| **净值** | **+10** | **-7** | **+6** |

**Design note:** Option A 净值最高但有"声名之累"的远期隐患；Option B 净值为负但换来自由；Option C 净值中等但最可持续。三个选项各有取舍，没有绝对的"最优解"。

---

## 6. Reserved Flag Interfaces (for future stages)

预留以下 flag 接口（本阶段不实现逻辑，仅占位命名）：
- `renown_late_life_identity_done` — 晚年身份深化（P78+）
- `renown_endgame_echo_done` — 终局回响（后续阶段）

**预留意图：** 确保 payoff 的三个 choice 方向都能在 late-life / endgame 阶段有差异化延伸，不会因为今天的设计把未来的路堵死。

---

## 7. Flavor Constraints

1. **Tavern-born first:** 所有选择和表达都必须有酒肆出身的味道——酒肆、人情往来、面子、掌柜的智慧、跑堂的、三教九流
2. **Not generic jianghu:** 不能写成通用的"江湖抉择"，必须是"酒肆出身的人遇到人情债会怎么选"
3. **Distinct from merchant:** Merchant payoff 是 auto、是商业帝国；Renown payoff 是 choice、是人情债的了结
4. **Three choices feel meaningfully different:** 不是换皮选择，属性变化、身份感、叙事调性都要有实质差异
5. **Pressure → Payoff 递进自然:** Pressure 是"人情债渐重"（意识到问题），Payoff 是"人情之解"（主动解决）

---

## 8. Gate Acceptance Criteria

### Pre-Payoff (must be true for event to fire)
- [ ] `renown_midlife_pressure_done === true`
- [ ] `renown_midlife_payoff_done === false`
- [ ] `tavern_renown_bridge_crossed === true`
- [ ] Age between 43 and 47
- [ ] No orthodox/demonic childhood seeds

### Post-Payoff (must be true after any choice)
- [ ] `renown_midlife_payoff_done === true`
- [ ] `renown_age40_identity_done === true`
- [ ] Exactly one of the three choice markers is set
- [ ] Cost label matches the selected choice
- [ ] Current goal matches the selected choice
- [ ] Age-40 identity matches the selected choice

---

## 9. Boundary with P77 (Implementation)

| P76 (Design-First) | P77 (Implementation) |
|-------------------|---------------------|
| Prerequisite audit | Runtime event wiring in sample-lines-spine.json |
| Direction comparison | Expression updates in sampleLineExpression.ts |
| Payoff contract (本文档) | Expression updates in ordinaryOriginExpression.ts |
| Validation shape | Targeted proof document |
| Closure report | Regression tests (~25 tests) |
| | Closure report |

**P77 must deliver on everything defined in this contract. No scope expansion beyond what's defined here without a new PRD.**

---

*Contract locked by P76 design-first stage. P77 implementation proceeds from here.*

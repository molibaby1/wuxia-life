# P86 Medical Pressure Direction Comparison (Per Variant)

> **Date:** 2026-06-29
> **Stage:** P86 Wuxia Medical Pressure Design-First
> **Route:** `medical_sage_healer` (一代名医)
> **Origin:** `tavern_hand` (酒肆帮工)
> **Variants:** Compassionate (仁心医者) + Pragmatic (世故人医)

---

## 1. Purpose

为 `medical_sage_healer` 的 pressure 阶段，为 **2 个 variant 各自**比较多个叙事方向，选定最符合 tavern-born healer 风味、最 bounded、最适合 small-step 实施的方向。

本比较遵循 quality-first + small-step 原则：
- **Quality first:** 风味正确性 > 叙事丰富度 > 实现复杂度
- **Small step:** 优先选择能用 1 个核心事件 + 少量表达更新实现的方向
- **Variant differentiation:** 两个 variant 的 pressure 方向必须有本质差异，不能只是换皮

---

## 2. Compassionate Variant (仁心医者) — Candidates

### 2.1 Candidates Overview

| # | Direction | Core Narrative | Tavern-Born Fit | Boundedness | Implementation Risk |
|---|-----------|----------------|-----------------|-------------|---------------------|
| A | **仁心耗尽 / 身体垮掉** (Burnout / Body Breaking) | 救的人太多，自己累垮了，身体撑不住了 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Low |
| B | **药材告急** (Herb Shortage) | 病人太多，药材不够用，陷入救人的两难 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Medium |
| C | **被利用善心** (Exploited Kindness) | 有人利用你的善心骗财/骗药，让你心寒 | ⭐⭐⭐ | ⭐⭐⭐ | Medium |

---

## 3. Compassionate Candidate A: 仁心耗尽 / 身体垮掉 (Burnout)

### 3.1 Core Narrative

**一句话概括：** 你见不得人受苦，有钱没钱都给看。名声传开了，找你的人越来越多。你没日没夜地看诊、配药，终于——身子撑不住了。

**叙事弧光：**
- **On-ramp (医名初起):** 名声传开，周边村子的人都来找你，小药庐挤不下了，大堂都摆上了病床
- **Pressure (仁心耗尽):** 你硬撑着看更多的病人，但身体一天不如一天。老掌柜劝你歇歇，你说"救人要紧"。终于有一天，你累倒在药庐里
- **(Payoff 伏笔):** 要么继续硬扛（油尽灯枯），要么学会放手（量力而行），要么找到传承（有人接手）

**Tavern-born 锚点：**
- 核心是"仁心"和"救人"，不是武功
- 酒肆大堂摆病床、老掌柜叹气、酒肆门口等天亮的病人
- "酒肆出来的大夫" 视角：从小见惯了生老病死，没想到自己会栽在"太好心"上

### 3.2 Trigger Conditions

| Condition | Value | Rationale |
|-----------|-------|-----------|
| Upstream gate | `medical_on_ramp_done` + `tavern_medical_on_ramp_compassionate` | On-ramp 之后才有身体垮掉的基础 |
| Age range | 36–40 | On-ramp (31-34) 后 2-6 年，给玩家享受"医名初起"的时间 |
| Stat proxy | high reputation + high chivalry + low constitution | 名声越大、心越善、身子越弱，越容易垮 |
| Exclusivity | `!medical_midlife_pressure_done` | 只触发一次 |

### 3.3 Player Choice Space

**建议：Auto 事件（强制性里程碑）**

理由：
- 与 renown pressure 模式对齐
- 身体垮掉是 compassionate 路线的必然结果——选择了仁心医者，就选择了这条路的代价
- 如果需要"应对方式"的选择，可以在 payoff 阶段做

**可选的 choice 变体（defer to payoff）：**
- 硬扛下去（继续救人，身体更差）
- 开始限号（减少接诊，名声略降）
- 找徒弟（传承医术，自己退居二线）

### 3.4 Player-Facing Signals (至少 2 个)

1. **Cost Label 深化：** "仁心之累" → "仁心耗尽"
   - 从抽象的"累"变成具体的"耗尽"
   - 更有画面感，更 tavern-born（酒肆里常说"油尽灯枯"）

2. **Current Goal 更新：** "名声传开了，周边村子的人都来找你看病，累是累，但救人要紧" → "身子撑不住了，但求医的人还在门口排队，怎么办"
   - 目标从"上升期"变成"危机期"
   - 体现 pressure 阶段的核心矛盾：想救人，但身体不允许

3. **Life Memory 新增：** 具体的累倒事件记忆
   - "那天你累倒在药庐里，醒来时老掌柜坐在旁边叹气。门外还有等着看病的人，你想起身，却发现连抬手的力气都没有了。"

### 3.5 Tavern-Born Fit Assessment

| Anchor | Fit? | Evidence |
|--------|------|----------|
| 医术/药材/病患 > 武功 | ✅ 完美 | 核心就是看病救人累垮了，跟武功没关系 |
| 酒肆小药庐场景 | ✅ 完美 | 酒肆大堂摆病床、老掌柜叹气、药庐里累倒 |
| 仁心医者身份 | ✅ 完美 | 完全就是 compassionate variant 的自然延伸 |
| 与 merchant 区分 | ✅ 清晰 | Merchant = 金钱债；Medical Compassionate = 身体债 |
| 与 renown 区分 | ✅ 清晰 | Renown = 人情债；Medical Compassionate = 仁心债/身体债 |
| 与 generic 江湖区分 | ✅ 清晰 | Generic = 正邪/门派；Medical = 救人/医者仁心 |

**风味评分：⭐⭐⭐⭐⭐ (5/5) — 完美契合 tavern-born compassionate healer 风味**

### 3.6 Boundedness Assessment

| Dimension | Score | Notes |
|-----------|-------|-------|
| 事件数量 | ⭐⭐⭐⭐⭐ | 1 个核心 auto 事件即可 |
| 表达更新 | ⭐⭐⭐⭐⭐ | 2-3 个表达面更新 |
| 新系统需求 | ⭐⭐⭐⭐⭐ | 零新系统，复用现有 event + expression 体系 |
| 测试范围 | ⭐⭐⭐⭐⭐ | Narrow regression，与 P85 测试模式一致 |
| Payoff 接口 | ⭐⭐⭐⭐ | 自然预留 payoff 方向（如何应对身体垮掉） |

**Boundedness 评分：⭐⭐⭐⭐⭐ (5/5) — 最小 bounded 形状**

### 3.7 Implementation Risk

- **风险等级：Low**
- **原因：**
  - 完全复用现有架构（sample-lines-spine auto event + expression 更新）
  - 与 renown pressure 模式对称，有先例可循
  - 叙事方向清晰，风味锚点明确，不容易走偏
  - 1 个事件 + 2-3 个表达更新，改动量极小
  - On-ramp 已经埋下了"身子撑不了多久"的种子，衔接自然

---

## 4. Compassionate Candidate B: 药材告急 (Herb Shortage)

### 4.1 Core Narrative

**一句话概括：** 病人太多，药材不够用了。你是救人还是留药？救了这个就救不了那个——药材告急的两难。

### 4.2 Trigger Conditions

| Condition | Value | Rationale |
|-----------|-------|-----------|
| Upstream gate | `medical_on_ramp_done` + `tavern_medical_on_ramp_compassionate` | On-ramp 之后病人才多到药材不够用 |
| Age range | 36–40 | On-ramp (31-34) 后 2-6 年，名声传开后病人激增 |
| Stat proxy | high reputation + high chivalry + low money | 名声越大、心越善、越没钱买药，越容易缺药材 |
| Exclusivity | `!medical_midlife_pressure_done` | 只触发一次 |

### 4.3 Player Choice Space

**建议：Choice 事件（玩家决定怎么应对药材短缺）**

理由：
- 药材告急天然带有选择空间——救谁不救谁、怎么分配有限的药材
- 与 burnout 的"必然代价"不同，药材短缺的核心是"两难选择"
- 选择可以体现在：优先救穷人 / 优先救富人赚药钱 / 自己上山采药

**可选的 choice 分支：**
- 倾囊相救（名声更高，药材更缺，钱更少）
- 量力而行（维持现状，名声略降）
- 看人下菜碟（赚钱多了，但侠义之心受损）

### 4.4 Tavern-Born Fit Assessment

| Anchor | Fit? | Notes |
|--------|------|-------|
| 医术/药材/病患 > 武功 | ✅ | 核心是药材，还是医疗主题 |
| 酒肆小药庐场景 | ✅ | 小药庐的药材库存、药柜、采药 |
| 仁心医者身份 | ⚠️ 一般 | 药材告急更偏向"资源管理"，不完全是"仁心"问题 |
| 与 merchant 区分 | ⚠️ 较弱 | Merchant 也是资源/金钱压力，药材告急有点像换皮 |
| 与 renown 区分 | ✅ | 完全不同 |

**风味评分：⭐⭐⭐⭐ (4/5) — 还不错，但不如身体垮掉那么"仁心"**

### 4.5 Boundedness Assessment

| Dimension | Score | Notes |
|-----------|-------|-------|
| 事件数量 | ⭐⭐⭐⭐ | 1 个事件也能做，但可能需要 choice 事件（救谁不救谁） |
| 表达更新 | ⭐⭐⭐⭐ | 2-3 个表达面 |
| 新系统需求 | ⭐⭐⭐⭐⭐ | 零新系统 |
| 独特性 | ⭐⭐⭐ | "药材不够"比较常见，不如"身体垮掉"有记忆点 |

**Boundedness 评分：⭐⭐⭐⭐ (4/5) — 还可以，但不如 burnout 集中**

### 4.6 Why Not First Choice

1. **不够聚焦 variant 身份：** "药材告急"是所有医者都可能遇到的问题，不一定是 compassionate 独有。pragmatic variant 也可能遇到药材问题。"身体垮掉"才是 compassionate 独有的——只有太好心、太拼命的人才会把自己累垮。
2. **与 merchant pressure 有点像：** Merchant pressure 是"钱不够"，药材告急是"药不够"，都是资源短缺压力。虽然主题不同，但结构上有点像换皮。"身体垮掉"是完全不同的压力类型（自我消耗 vs 资源短缺）。
3. **与 on-ramp 衔接不够紧：** On-ramp 的核心伏笔是"身子撑不了多久"，不是"药材不够"。从"身体垮掉"切入，是 on-ramp 的直接兑现。
4. **道德两难可能太沉重：** "救谁不救谁"的选择可能太沉重、太道德化，不符合 tavern-born 轻松中带点苦涩的基调。"身体垮掉"更个人、更有代入感。

---

## 5. Compassionate Candidate C: 被利用善心 (Exploited Kindness)

### 5.1 Core Narrative

**一句话概括：** 你心善，有人就利用你的善心——装病骗药、赖账、道德绑架。你开始怀疑：自己的仁心，是不是用错了地方？

### 5.2 Tavern-Born Fit Assessment

| Anchor | Fit? | Notes |
|--------|------|-------|
| 医术/药材/病患 > 武功 | ⚠️ | 核心是"被骗"，不是医术本身 |
| 酒肆小药庐场景 | ✅ | 酒肆里三教九流，骗子也多 |
| 仁心医者身份 | ⚠️ 一般 | 善心被利用确实是 compassionate 的问题，但更偏"人心"，不是"医道" |
| 与 renown 区分 | ⚠️ 较弱 | Renown 也是人情/人心压力，这个方向有点像 renown 的医疗版 |

**风味评分：⭐⭐⭐ (3/5) — 还行，但不够医疗核心**

### 5.3 Why Rejected

1. **不够医疗核心：** "被利用善心"可以发生在任何善良的人身上，不一定是医者。"身体垮掉"才是医者独有的——救人才会累垮。
2. **与 renown pressure 边界模糊：** Renown 是人情债，这个是人心债，有点像。医疗路线应该有自己独特的压力类型。
3. **叙事容易走偏：** 搞不好就变成"人性恶"的故事，失去了 tavern-born 温暖中带点苦涩的基调。
4. **Defer 价值：** 可以作为 payoff 之后的 late-game 方向，但不适合作为 midlife pressure。

---

## 6. Compassionate Comparison & Recommendation

### 6.1 Comparison Matrix

| Dimension | A: 仁心耗尽/身体垮掉 | B: 药材告急 | C: 被利用善心 |
|-----------|---------------------|------------|--------------|
| **Tavern-born 风味** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Boundedness** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Implementation risk** | Low | Medium | Medium |
| **与 on-ramp 衔接** | 完美（身子撑不了多久 → 累倒） | 一般（病人多 → 药材不够） | 弱（心善 → 被骗） |
| **独特性** | 高（身体垮掉是 compassionate 独有） | 中（药材短缺较常见） | 低（善心被利用太泛） |
| **Variant 专属度** | 高（只有 compassionate 才会把自己累垮） | 低（任何医者都可能缺药材） | 中（善良的人都可能被骗） |
| **Payoff 预留** | 自然（硬扛/放手/传承） | 有（怎么解决药材问题） | 有，但走偏风险高 |
| **整体推荐度** | 🥇 推荐 | 🥈 备选 | ❌ 拒绝 |

### 6.2 Selected Direction (Compassionate)

**推荐方向：A — 仁心耗尽 / 身体垮掉 (Burnout)**

### 6.3 Rationale (Compassionate)

1. **最符合 compassionate variant 身份：** 只有仁心医者才会把自己累垮。这是 compassionate 独有的压力，不是所有医者的共性问题。
2. **与 on-ramp 衔接最顺：** On-ramp 已经埋下了"身子撑不了多久"的种子。Pressure 从"身体垮掉"切入，是 on-ramp 的直接兑现和深化。
3. **最有记忆点：** "累倒在药庐里"比"药材不够"更具体、更有画面感、更有情感冲击力。
4. **最 bounded：** 1 个核心 auto 事件 + 2-3 个表达更新即可完成。完全复用现有架构，零新系统。
5. **与其他路线区分最清晰：** Merchant = 金钱债，Renown = 人情债，Medical Compassionate = 仁心债/身体债。三条路线的压力类型完全不同。
6. **Payoff 空间大：** 身体垮掉的应对方式（硬扛/放手/找传承）天然就是 payoff 阶段的好素材。

### 6.4 Rejected Directions (Compassionate)

- **B (药材告急):** 作为备选方向。如果身体垮掉实施后证明不够有张力，可以再考虑。但身体垮掉是更聚焦、更有 variant 特色的第一选择。
- **C (被利用善心):** 明确拒绝。不够医疗核心、与 renown 边界模糊、容易走偏。可以作为 far future 的 late-game 方向，但不适合 midlife pressure。

---

## 7. Pragmatic Variant (世故人医) — Candidates

### 7.1 Candidates Overview

| # | Direction | Core Narrative | Tavern-Born Fit | Boundedness | Implementation Risk |
|---|-----------|----------------|-----------------|-------------|---------------------|
| A | **人情债缠身** (Favor Debt Entanglement) | 认识的大户越多，欠的人情越多，终于陷入人情网里脱不开身 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Low |
| B | **选边站** (Faction Siding) | 几股势力都来拉拢你，逼你选边站，站错了就是万劫不复 | ⭐⭐⭐ | ⭐⭐ | High |
| C | **名声与利益的冲突** (Fame vs Profit) | 要名声还是要银子？名声大了反而赚不到钱，赚钱多了名声就坏了 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Medium |

---

## 8. Pragmatic Candidate A: 人情债缠身 (Favor Debt Entanglement)

### 8.1 Core Narrative

**一句话概括：** 你懂分寸、会办事，认识了不少有头有脸的人物。但人情是把双刃剑——你欠人家的，人家也欠你的。欠的人情多了，终有还不上的一天。

**叙事弧光：**
- **On-ramp (医名初起):** 镇上大户都来请你，诊金丰厚，还认识了不少有头有脸的人物。名声银子双丰收
- **Pressure (人情债缠身):** 今天张员外请你去给他的小妾看病（不能不去），明天李知府让你给他的幕僚出诊（还不能收钱）。欠的人情、攒的人脉，如今都成了要还的债。你开始觉得，这人情网，也是一种枷锁
- **(Payoff 伏笔):** 要么彻底沦为权贵的工具，要么撕破脸换个清净，要么在人情网中找到平衡点

**Tavern-born 锚点：**
- 核心是"人情世故"和"分寸"，不是武功
- 大户管家来酒肆请你、酒席上引荐、酒肆里三教九流的人情往来
- "酒肆出来的大夫" 视角：从小在酒肆见惯了人情世故，以为自己能拿捏，没想到还是陷进去了

### 8.2 Trigger Conditions

| Condition | Value | Rationale |
|-----------|-------|-----------|
| Upstream gate | `medical_on_ramp_done` + `tavern_medical_on_ramp_pragmatic` | On-ramp 之后才有人情债 |
| Age range | 37–41 | On-ramp (31-34) 后 3-7 年，给玩家享受"名声银子双丰收"的时间 |
| Stat proxy | high reputation + high connections + high money | 名声越大、人脉越广、钱越多，人情债越重 |
| Exclusivity | `!medical_midlife_pressure_done` | 只触发一次 |

### 8.3 Player Choice Space

**建议：Auto 事件（强制性里程碑）**

理由：
- 与 renown pressure 模式对齐
- 人情债是 pragmatic 路线的必然结果——选择了世故人医，就选择了在人情网中打转
- 如果需要"应对方式"的选择，可以在 payoff 阶段做

**可选的 choice 变体（defer to payoff）：**
- 彻底依附权贵（名声更高，但失去自由）
- 索性撕破脸（钱少了，但活得自在）
- 找到平衡点（维持中庸之道）

### 8.4 Player-Facing Signals (至少 2 个)

1. **Cost Label 深化：** "世故之秤" → "人情债缠身"
   - 从抽象的"秤"变成具体的"债"
   - 更有画面感，更 tavern-born（酒肆里最讲究人情债）

2. **Current Goal 更新：** "镇上大户都来请你看病，名声银子双丰收，该拿捏的得拿捏" → "一面应付各路权贵的人情，一面在人情网中找平衡"
   - 目标从"上升期"变成"维持期 + 应付压力"
   - 体现 pressure 阶段的核心矛盾：人情既是资源，也是枷锁

3. **Life Memory 新增：** 具体的人情债事件记忆
   - "这些年认识的大户、欠下的人情，如今都找上门来。张员外的小妾、李知府的幕僚、王捕头的亲戚... 酒肆的门槛都被踩平了。你懂分寸、会办事，但也开始觉得——这人情网，快把你缠住了。"

### 8.5 Tavern-Born Fit Assessment

| Anchor | Fit? | Evidence |
|--------|------|----------|
| 医术/人情 > 武功 | ✅ 完美 | 核心就是人情世故，跟武功没关系 |
| 酒肆场景 | ✅ 完美 | 酒肆是人情往来的核心场所，大户人家的人都找到酒肆来 |
| 世故人医身份 | ✅ 完美 | 完全就是 pragmatic variant 的自然延伸 |
| 与 merchant 区分 | ✅ 清晰 | Merchant = 金钱债/经营压力；Medical Pragmatic = 人情债/权贵关系 |
| 与 renown 区分 | ⚠️ 需注意 | Renown 也是人情债，需要区分 medical 版的人情债（医者身份 + 权贵看病） |
| 与 generic 江湖区分 | ✅ 清晰 | Generic = 正邪/门派；Medical Pragmatic = 权贵人情网 |

**风味评分：⭐⭐⭐⭐⭐ (5/5) — 完美契合 tavern-born pragmatic healer 风味**

**注意：** 虽然都是"人情债"，但 medical pragmatic 的人情债与 renown 的人情债有本质区别：
- **Renown 人情债：** 江湖人士之间的人情，靠名声和面子
- **Medical Pragmatic 人情债：** 给权贵看病欠下的人情，靠医术和分寸感
- 场景不同：renown 是江湖调解、引荐高人；medical pragmatic 是给大户人家的内眷看病、出入深宅大院

### 8.6 Boundedness Assessment

| Dimension | Score | Notes |
|-----------|-------|-------|
| 事件数量 | ⭐⭐⭐⭐⭐ | 1 个核心 auto 事件即可 |
| 表达更新 | ⭐⭐⭐⭐⭐ | 2-3 个表达面更新 |
| 新系统需求 | ⭐⭐⭐⭐⭐ | 零新系统，复用现有 event + expression 体系 |
| 测试范围 | ⭐⭐⭐⭐⭐ | Narrow regression，与 P85 测试模式一致 |
| Payoff 接口 | ⭐⭐⭐⭐ | 自然预留 payoff 方向（如何处理人情债） |

**Boundedness 评分：⭐⭐⭐⭐⭐ (5/5) — 最小 bounded 形状**

### 8.7 Implementation Risk

- **风险等级：Low**
- **原因：**
  - 完全复用现有架构（sample-lines-spine auto event + expression 更新）
  - 与 renown pressure 模式对称，有先例可循
  - 叙事方向清晰，风味锚点明确，不容易走偏
  - 1 个事件 + 2-3 个表达更新，改动量极小
  - On-ramp 已经埋下了"认识了不少有头有脸的人物"的种子，衔接自然

---

## 9. Pragmatic Candidate B: 选边站 (Faction Siding)

### 9.1 Core Narrative

**一句话概括：** 你认识的人多了，难免卷进几股势力之间。各方都来拉拢你，逼你选边站——站错了就是万劫不复。

### 9.2 Tavern-Born Fit Assessment

| Anchor | Fit? | Notes |
|--------|------|-------|
| 医术/人情 > 武功 | ⚠️ | 有人情元素，但核心是门派/势力纷争，容易滑向武功/江湖 |
| 酒肆场景 | ⚠️ 一般 | 势力纷争不一定发生在酒肆 |
| 世故人医身份 | ⚠️ 一般 | 选边站是所有有人脉的人都可能遇到的，不专属 pragmatic 医者 |
| 与 generic 江湖区分 | ❌ | 门派/势力纷争就是 generic 江湖压力 |

**风味评分：⭐⭐⭐ (3/5) — 容易滑向 generic 江湖，失去 tavern-born medical 特色**

### 9.3 Why Rejected

1. **风味风险高：** 选边站很容易变成 generic 江湖故事，失去 tavern-born medical healer 的独特性。玩家走的是"酒肆出身 → 世故人医"路线，不是"门派 → 江湖霸主"路线。
2. **范围太大：** 需要设计多股势力、选择分支、多种结局... 远超 1 个核心事件 + 少量表达更新的 bounded 范围。
3. **实现风险高：** 可能需要新系统（势力声望、关系值等），不符合 small-step 原则。
4. **与 renown pressure 区分度不够：** Renown 的 rejected candidate C 就是"江湖恩怨站队"，这个方向与其类似。医疗路线应该有自己独特的压力。
5. **Defer 价值：** 可以作为 payoff 之后的 late-game 方向，但不适合作为 midlife pressure。

---

## 10. Pragmatic Candidate C: 名声与利益的冲突 (Fame vs Profit)

### 10.1 Core Narrative

**一句话概括：** 要名声还是要银子？给穷人看病名声好但赚不到钱，给富人看病赚钱多但名声坏。你在名声与利益之间摇摆，找不到平衡。

### 10.2 Trigger Conditions

| Condition | Value | Rationale |
|-----------|-------|-----------|
| Upstream gate | `medical_on_ramp_done` + `tavern_medical_on_ramp_pragmatic` | On-ramp 之后有名声也有了钱，才会面临名声 vs 利益的选择 |
| Age range | 37–41 | On-ramp (31-34) 后 3-7 年，积累了一定名声和财富后开始纠结 |
| Stat proxy | high reputation + high money + medium connections | 名声和钱都有了一定基础后，才会面临二者的权衡 |
| Exclusivity | `!medical_midlife_pressure_done` | 只触发一次 |

### 10.3 Player Choice Space

**建议：Choice 事件（玩家在名声与利益之间做选择）**

理由：
- 名声 vs 利益天然就是选择题——核心就是玩家怎么选
- 与 pragmatic 的"分寸感"人设契合——世故的人会权衡利弊
- 选择可以体现在：偏向名声 / 偏向利益 / 找平衡

**可选的 choice 分支：**
- 走名声路线（多给穷人看病，名声更高，钱更少）
- 走利益路线（专给富人看病，钱更多，名声略降）
- 找平衡点（维持现状，名声和钱都不多不少）

### 10.4 Tavern-Born Fit Assessment

| Anchor | Fit? | Notes |
|--------|------|-------|
| 医术/人情 > 武功 | ✅ | 还是医疗主题 |
| 酒肆场景 | ✅ | 酒肆里三教九流，有钱的没钱的都有 |
| 世故人医身份 | ⚠️ 一般 | pragmatic 是"懂分寸"，不一定是"贪财"。名声 vs 利益有点太二元对立了 |
| 与 merchant 区分 | ⚠️ 较弱 | Merchant 也是钱的问题，这个方向有点像 medical 版的 merchant pressure |

**风味评分：⭐⭐⭐⭐ (4/5) — 还不错，但不如人情债那么"世故"**

### 10.5 Why Not First Choice

1. **不够聚焦 variant 身份：** "名声 vs 利益"是所有医者都可能遇到的选择，不一定是 pragmatic 独有。compassionate 也会遇到（救穷人还是救富人）。"人情债缠身"才是 pragmatic 独有的——只有懂世故、有人脉的人才会陷入人情网。
2. **与 merchant pressure 有点像：** Merchant pressure 是金钱/债务压力，这个方向也是金钱相关。虽然角度不同，但核心都是"钱"。"人情债"是完全不同的压力类型。
3. **与 on-ramp 衔接不够紧：** On-ramp 的核心伏笔是"认识了不少有头有脸的人物"、"人情练达"，不是"钱的问题"。从"人情债"切入，是 on-ramp 的直接延伸。
4. **有点太二元对立：** "名声 vs 利益"非黑即白，不够 nuanced。pragmatic variant 应该是"世故"和"分寸"，不是简单的贪财。

---

## 11. Pragmatic Comparison & Recommendation

### 11.1 Comparison Matrix

| Dimension | A: 人情债缠身 | B: 选边站 | C: 名声与利益冲突 |
|-----------|--------------|----------|-----------------|
| **Tavern-born 风味** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Boundedness** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Implementation risk** | Low | High | Medium |
| **与 on-ramp 衔接** | 完美（认识大户 → 人情债） | 弱（人脉广 → 选边站） | 一般（赚钱 → 名声 vs 利益） |
| **独特性** | 高（医者身份的人情债，与 renown 有区别） | 低（选边站太 generic） | 中（名声 vs 利益较常见） |
| **Variant 专属度** | 高（只有 pragmatic 才懂人情世故） | 低（有人脉的人都可能遇到） | 低（所有医者都可能遇到） |
| **Payoff 预留** | 自然（依附/撕破脸/平衡） | 有，但太复杂 | 有，但太二元 |
| **整体推荐度** | 🥇 推荐 | ❌ 拒绝 | 🥈 备选 |

### 11.2 Selected Direction (Pragmatic)

**推荐方向：A — 人情债缠身 (Favor Debt Entanglement)**

### 11.3 Rationale (Pragmatic)

1. **最符合 pragmatic variant 身份：** 只有世故人医才会陷入权贵人情网。这是 pragmatic 独有的压力，不是所有医者的共性问题。
2. **与 on-ramp 衔接最顺：** On-ramp 已经埋下了"认识了不少有头有脸的人物"、"人情练达"的种子。Pressure 从"人情债缠身"切入，是 on-ramp 的直接兑现和深化。
3. **最有记忆点：** "酒肆门槛被踩平"、"权贵家的内眷看病"比"名声 vs 利益"更具体、更有画面感、更有 tavern-born 特色。
4. **最 bounded：** 1 个核心 auto 事件 + 2-3 个表达更新即可完成。完全复用现有架构，零新系统。
5. **与 renown pressure 有区分：** 虽然都是"人情债"，但场景和身份不同——renown 是江湖人士的人情，medical pragmatic 是权贵医者的人情。场景、人物、味道都不一样。
6. **Payoff 空间大：** 人情债的处理方式（依附/撕破脸/平衡）天然就是 payoff 阶段的好素材。

### 11.4 Rejected Directions (Pragmatic)

- **C (名声与利益冲突):** 作为备选方向。如果人情债实施后证明不够有张力，可以再考虑。但人情债是更聚焦、更有 variant 特色的第一选择。
- **B (选边站):** 明确拒绝。风味风险高、范围太大、实现风险高。可以作为 far future 的 late-game 方向，但不适合 midlife pressure。

---

## 12. Two-Variant Differentiation Check

两个 variant 的选定方向是否有足够差异？

| Dimension | Compassionate: 仁心耗尽 | Pragmatic: 人情债缠身 |
|-----------|------------------------|----------------------|
| **核心压力类型** | 自我消耗（身体/精力） | 社会束缚（人情/关系） |
| **压力来源** | 自己的仁心 | 外部的权贵 |
| **Stats 变化方向** | constitution ↓, chivalry 保持 | connections ↑ 但变成负担, money 保持 |
| **Narrative tone** | 悲壮/令人心疼 | 纠结/令人唏嘘 |
| **Tavern-born 锚点** | 大堂摆病床、老掌柜叹气、累倒在药庐 | 大户管家来请、酒席引荐、酒肆门槛踩平 |
| **Payoff 方向** | 硬扛/放手/传承 | 依附/撕破脸/平衡 |
| **与其他路线区分** | Merchant = 金钱债, Renown = 人情债, Medical Comp = 身体债 | Merchant = 经营压力, Renown = 江湖人情, Medical Prag = 权贵人情 |

**结论：✅ 两个 variant 的 pressure 方向有本质差异，不是简单换皮。**

- Compassionate 是**向内的**压力——自我消耗、身体垮掉
- Pragmatic 是**向外的**压力——人情网束缚、权贵纠缠

完全符合 variant 分化的要求。

---

## 13. Quality-First Verification

两个 variant 的选定方向是否满足 quality-first 原则？

| Principle | Compassionate | Pragmatic |
|-----------|--------------|-----------|
| Evidence-based | ✅ 基于 P83/P84/P85 已验证的风味锚点 | ✅ 基于 P83/P84/P85 已验证的风味锚点 |
| Flavor consistency | ✅ 仁心/救人/酒肆小药庐，与前三阶段完全一致 | ✅ 世故/人情/酒肆出身，与前三阶段完全一致 |
| Small step | ✅ 1 事件 + 2-3 表达更新，最小改动 | ✅ 1 事件 + 2-3 表达更新，最小改动 |
| Low risk | ✅ 复用现有架构，有 renown pressure 先例 | ✅ 复用现有架构，有 renown pressure 先例 |
| Variant differentiation | ✅ 与 pragmatic 有本质差异 | ✅ 与 compassionate 有本质差异 |
| Clear handoff | ✅ Contract 定义清晰，P87 可直接承接 | ✅ Contract 定义清晰，P87 可直接承接 |

**✅ 两个 variant 都满足 quality-first + small-step 原则**

---

## 14. Next Step

进入 P86-004：基于选定的方向（Compassionate: 仁心耗尽 / Pragmatic: 人情债缠身），定义详细的 pressure contract。

---

**P86-003 complete.** Pressure direction comparison saved.

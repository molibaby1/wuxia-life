# P74 Renown Pressure Direction Comparison

> **Date:** 2026-06-29
> **Stage:** P74 Wuxia Renown Pressure Design-First
> **Route:** jianghu_renown_sage（江湖名宿）
> **Origin:** tavern_hand（酒肆帮工）

---

## 1. Purpose

为 `jianghu_renown_sage` 的 pressure 阶段比较多个叙事方向，选定最符合 tavern-born 风味、最 bounded、最适合 small-step 实施的方向。

本比较遵循 quality-first + small-step 原则：
- **Quality first:** 风味正确性 > 叙事丰富度 > 实现复杂度
- **Small step:** 优先选择能用 1 个核心事件 + 少量表达更新实现的方向

---

## 2. Candidates Overview

| # | Direction | Core Narrative | Tavern-Born Fit | Boundedness | Implementation Risk |
|---|-----------|----------------|-----------------|-------------|---------------------|
| A | **人情债渐重** (Favor Debt Burden) | 声名越大，欠下的人情越多，终有还不上的一天 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Low |
| B | **声名之累** (Fame Burden) | 名声太大，各种麻烦找上门，疲于应付 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Medium |
| C | **江湖恩怨站队** (Faction Conflict) | 人脉广了，难免卷入门派纷争，被逼选边站 | ⭐⭐⭐ | ⭐⭐ | High |

---

## 3. Candidate A: 人情债渐重 (Favor Debt Burden)

### 3.1 Core Narrative

**一句话概括：** 你在江湖上的名声，是靠一笔一笔人情攒出来的。现在名声大了，人情债也重了——有人要你报恩，有人要你还情，你开始觉得这名声，是负担也是枷锁。

**叙事弧光：**
- **On-ramp (声名初显):** 你靠人脉和面子在江湖上有了名号，大家都给你面子
- **Pressure (人情债渐重):** 过去受过你恩惠的人、你受过恩惠的人，都找上门来。人情越欠越多，终有一天你发现自己还不清了
- **(Payoff 伏笔):** 要么彻底摆脱人情束缚，要么在人情网中找到自己的位置

**Tavern-born 锚点：**
- 核心是"人情"和"面子"，不是武功
- 酒肆是人情往来的核心场景（有人来酒肆找你）
- "酒肆出身的" 视角：从小在酒肆见惯了人情世故，没想到自己也陷进去了

### 3.2 Trigger Conditions

| Condition | Value | Rationale |
|-----------|-------|-----------|
| Upstream gate | `renown_on_ramp_done` | On-ramp 之后才有人情债 |
| Age range | 37–41 | On-ramp (32-35) 后 5 年，给玩家享受"声名初显"的时间 |
| Stat proxy | high reputation + high connections | 名声越大、人脉越广，人情债越多 |
| Exclusivity | `!renown_midlife_pressure_done` | 只触发一次 |

### 3.3 Player Choice Space

**建议：Auto 事件（强制性里程碑）**

理由：
- 与 merchant pressure (`magnate_midlife_pressure`) 模式对齐
- 人情债是 renown 路线的必然结果，玩家选择走 renown 路线就意味着接受这个代价
- 如果需要"应对方式"的选择，可以在 payoff 阶段做

**可选的 choice 变体（defer to future）：**
- 硬扛人情债（维持名声，但代价更大）
- 索性撕破脸（名声下降，但活得轻松）

### 3.4 Player-Facing Signals (至少 2 个)

1. **Cost Label 深化：** "江湖声名之累" → "人情债渐重"
   - 从抽象的"累"变成具体的"债"
   - 更有画面感，更 tavern-born（酒肆里最讲究人情债）

2. **Current Goal 更新：** "常有人来请你主持公道、引荐高人" → "一面维持声名，一面应付越来越重的人情债"
   - 目标从"上升期"变成"维持期 + 应付压力"
   - 体现 pressure 阶段的核心矛盾

3. **Life Memory 新增：** 具体的人情债事件记忆
   - "这些年欠的人情、攒的面子，如今都成了要还的债。有人登门道谢，有人上门讨债，酒肆的门槛都快被踩平了。"

### 3.5 Tavern-Born Fit Assessment

| Anchor | Fit? | Evidence |
|--------|------|----------|
| 人脉 > 武功 | ✅ 完美 | 核心就是人情债，跟武功没关系 |
| 酒肆场景 | ✅ 完美 | 酒肆是人情往来的核心场所，人都找到酒肆来 |
| 面子/人情 | ✅ 完美 | 整个方向就是围绕"人情"和"面子" |
| 酒肆出身视角 | ✅ 完美 | 从小在酒肆见惯人情世故，自己陷进去有反差感 |
| 与 merchant 区分 | ✅ 清晰 | Merchant = 金钱债；Renown = 人情债 |
| 与 generic 江湖区分 | ✅ 清晰 | Generic = 正邪/门派；Renown = 人情网 |

**风味评分：⭐⭐⭐⭐⭐ (5/5) — 完美契合 tavern-born renown 风味**

### 3.6 Boundedness Assessment

| Dimension | Score | Notes |
|-----------|-------|-------|
| 事件数量 | ⭐⭐⭐⭐⭐ | 1 个核心 auto 事件即可 |
| 表达更新 | ⭐⭐⭐⭐⭐ | 2-3 个表达面更新 |
| 新系统需求 | ⭐⭐⭐⭐⭐ | 零新系统，复用现有 event + expression 体系 |
| 测试范围 | ⭐⭐⭐⭐⭐ | Narrow regression，与 P73 测试模式一致 |
| Payoff 接口 | ⭐⭐⭐⭐ | 自然预留 payoff 方向（如何处理人情债） |

**Boundedness 评分：⭐⭐⭐⭐⭐ (5/5) — 最小 bounded 形状**

### 3.7 Implementation Risk

- **风险等级：Low**
- **原因：**
  - 完全复用现有架构（sample-lines-spine auto event + expression 更新）
  - 与 merchant pressure 模式对称，有先例可循
  - 叙事方向清晰，风味锚点明确，不容易走偏
  - 1 个事件 + 2-3 个表达更新，改动量极小

---

## 4. Candidate B: 声名之累 (Fame Burden)

### 4.1 Core Narrative

**一句话概括：** 名声太大了，各种麻烦都找上门——有人要挑战你扬名，有人要找你评理，有人要借你的名声做事。你开始觉得，名声太大也是一种累。

**叙事弧光：**
- **On-ramp:** 声名初显，大家都敬重你
- **Pressure:** 声名之累，各种麻烦找上门，疲于应付
- **(Payoff 伏笔):** 要么退隐，要么学会驾驭名声

### 4.2 Tavern-Born Fit Assessment

| Anchor | Fit? | Notes |
|--------|------|-------|
| 人脉 > 武功 | ✅ | 还是人脉/名声相关 |
| 酒肆场景 | ⚠️ 一般 | "麻烦找上门"不一定是在酒肆 |
| 面子/人情 | ⚠️ 一般 | 更偏向"名声"本身，不是人情 |
| 与 merchant 区分 | ✅ | Merchant = 钱；Renown = 名 |
| 与 generic 江湖区分 | ⚠️ 较弱 | "声名之累"比较 generic，很多江湖故事都有 |

**风味评分：⭐⭐⭐⭐ (4/5) — 还不错，但不够独特**

### 4.3 Boundedness Assessment

| Dimension | Score | Notes |
|-----------|-------|-------|
| 事件数量 | ⭐⭐⭐⭐ | 1 个事件也能做，但可能需要多个小事件来体现"各种麻烦" |
| 表达更新 | ⭐⭐⭐⭐ | 2-3 个表达面 |
| 新系统需求 | ⭐⭐⭐⭐⭐ | 零新系统 |
| 独特性 | ⭐⭐⭐ | "声名之累"有点太泛，不够有记忆点 |

**Boundedness 评分：⭐⭐⭐⭐ (4/5) — 还可以，但不如人情债集中**

### 4.4 Why Not First Choice

1. **不够独特：** "声名之累"是个很泛的概念，任何有名望的角色都能套上。"人情债"更具体、更有 tavern-born 特色、更有记忆点。
2. **不够聚焦：** "各种麻烦找上门"容易散——挑战扬名、找你评理、借名声做事... 每个方向都能做，但放在一起就散了。人情债是单一核心。
3. **与 on-ramp 衔接不够紧：** On-ramp 的核心是"人情"和"面子"（主持公道、引荐高人都是人情往来）。Pressure 从"人情债"切入，是 on-ramp 的自然延伸。"声名之累"相对跳跃。

---

## 5. Candidate C: 江湖恩怨站队 (Faction Conflict)

### 5.1 Core Narrative

**一句话概括：** 你人脉广，认识的门派多。门派之间有了恩怨，都来拉拢你。你被逼着选边站——站错了就是万劫不复。

### 5.2 Tavern-Born Fit Assessment

| Anchor | Fit? | Notes |
|--------|------|-------|
| 人脉 > 武功 | ⚠️ | 有人脉元素，但核心是门派纷争，容易滑向武功/江湖 |
| 酒肆场景 | ❌ | 门派纷争是江湖大事，跟酒肆没太大关系 |
| 面子/人情 | ⚠️ | 有人情元素（门派之间的人情） |
| 与 generic 江湖区分 | ❌ | 门派纷争就是 generic 江湖压力 |
| 与 merchant 区分 | ✅ | 完全不同 |

**风味评分：⭐⭐⭐ (3/5) — 容易滑向 generic 江湖，失去 tavern-born 特色**

### 5.3 Boundedness Assessment

| Dimension | Score | Notes |
|-----------|-------|-------|
| 事件数量 | ⭐⭐ | 需要多个事件（拉拢 → 逼迫 → 选边） |
| 表达更新 | ⭐⭐ | 表达面多，还需要门派关系系统 |
| 新系统需求 | ⭐⭐ | 可能需要门派关系/声望系统 |
| 测试范围 | ⭐⭐ | 测试复杂度高 |

**Boundedness 评分：⭐⭐ (2/5) — 范围太大，不适合 small-step**

### 5.4 Why Rejected

1. **风味风险高：** 门派纷争很容易变成 generic 江湖故事，失去 tavern-born renown 的独特性。玩家走的是"酒肆出身 → 人脉 → 江湖名宿"路线，不是"门派 → 武功 → 江湖霸主"路线。
2. **范围太大：** 需要设计门派关系、选择分支、多种结局... 远超 1 个核心事件 + 少量表达更新的 bounded 范围。
3. **实现风险高：** 可能需要新系统（门派声望、关系值等），不符合 small-step 原则。
4. **Defer 价值：** 可以作为 payoff 之后的 late-game 方向，但不适合作为 midlife pressure。

---

## 6. Comparison Matrix

| Dimension | A: 人情债渐重 | B: 声名之累 | C: 江湖恩怨站队 |
|-----------|--------------|------------|-----------------|
| **Tavern-born 风味** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Boundedness** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **Implementation risk** | Low | Medium | High |
| **与 on-ramp 衔接** | 完美（人情 → 人情债） | 一般（名声 → 名声之累） | 弱（人脉 → 门派纷争） |
| **独特性** | 高（人情债是 renown 独有） | 中（声名之累较泛） | 低（门派纷争太 generic） |
| **Payoff 预留** | 自然（如何处理人情债） | 有（退隐/驾驭） | 有，但太复杂 |
| **整体推荐度** | 🥇 推荐 | 🥈 备选 | ❌ 拒绝 |

---

## 7. Recommendation

### 7.1 Selected Direction

**推荐方向：A — 人情债渐重 (Favor Debt Burden)**

### 7.2 Rationale

1. **风味最正：** 完全围绕"人情"和"面子"，完美契合 tavern-born renown 的核心锚点。与 merchant pressure（金钱债）形成鲜明对比：一个是钱的债，一个是人的债。
2. **最 bounded：** 1 个核心 auto 事件 + 2-3 个表达更新即可完成。完全复用现有架构，零新系统。
3. **衔接最顺：** On-ramp 的核心就是"人情"和"面子"（主持公道、引荐高人）。Pressure 从"人情债"切入，是 on-ramp 的自然延伸和深化。
4. **最有记忆点：** "人情债"比"声名之累"更具体、更有画面感、更独特。玩家会记住"欠了一屁股人情债"的体验。
5. **Payoff 空间大：** 人情债的处理方式（硬扛/撕破脸/找到平衡）天然就是 payoff 阶段的好素材。

### 7.3 Rejected Directions

- **B (声名之累):** 作为备选方向，如果人情债实施后证明不够有张力，可以再考虑。但人情债是更聚焦、更有特色的第一选择。
- **C (江湖恩怨站队):** 明确拒绝。风味风险高、范围太大、实现风险高。可以作为 far future 的 late-game 方向，但不适合 midlife pressure。

### 7.4 Quality-First Verification

选定方向是否满足 quality-first 原则？

| Principle | Met? | Evidence |
|-----------|------|----------|
| Evidence-based | ✅ | 基于 P71/P72/P73 已验证的风味锚点 |
| Flavor consistency | ✅ | 人情/面子/酒肆，与前三阶段完全一致 |
| Small step | ✅ | 1 事件 + 2-3 表达更新，最小改动 |
| Low risk | ✅ | 复用现有架构，有 merchant pressure 先例 |
| Clear handoff | ✅ | Contract 定义清晰，P75 可直接承接 |

**✅ 满足 quality-first + small-step 原则**

---

## 8. Next Step

进入 P74-004：基于"人情债渐重"方向，定义详细的 pressure contract。

---

**P74-003 complete.** Direction comparison saved.

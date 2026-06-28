# P76 Renown Payoff — Direction Comparison

> **Purpose:** 比较 renown payoff 的候选方向，选定最有差异化、最 bounded 的 payoff shape。
> **Stage:** P76 design-first — zero runtime changes

## 1. Executive Summary

**比较了 2 个 payoff 大方向 + 3 个 choice-based 子方向。**

**最终推荐：Choice-based payoff — 人情债之解**
- 核心叙事：人情债越积越重，你选择怎么了结？
- 3 个选择：硬扛到底（A） / 索性撕破脸（B） / 找到平衡（C）
- 与 merchant auto payoff 形成鲜明差异化
- 符合 tavern-born 风味（酒肆出身的人最懂人情世故）

**Rejected:** Auto payoff（类似 merchant）— 太同质化，浪费了 renown 路线的差异化潜力。

---

## 2. High-Level Mode Comparison

### Candidate 1: Choice-Based Payoff（人情债之解）

| 维度 | 评分 | 说明 |
|------|------|------|
| **核心叙事** | ⭐⭐⭐⭐⭐ | "人情债怎么还？"本身就是价值判断，天然适合 choice |
| **差异化** | ⭐⭐⭐⭐⭐ | 与 merchant auto payoff 完全不同，renown 路线的独特卖点 |
| **Tavern-born 适配度** | ⭐⭐⭐⭐⭐ | 酒肆出身的人最懂人情往来、面子、拿捏分寸 |
| **实现复杂度** | ⭐⭐⭐ | 比 auto 复杂（choice 事件 + 3 条表达分支），但仍在 bounded 范围内 |
| **Boundedness** | ⭐⭐⭐⭐ | 1 个事件 + 3 个选项 + 6 个 expression 更新，范围清晰 |
| **玩家感知价值** | ⭐⭐⭐⭐⭐ | 有意义的选择，玩家能感受到"我的选择塑造了我是谁" |

**核心叙事问题：** 人情债越积越重，你选择怎么了结？

**触发条件：**
- `renown_midlife_pressure_done` 为 true
- 年龄 43–47 岁（pressure 后约 6 年，让玩家感受一段时间的压力）
- 互斥 guard：`!renown_midlife_payoff_done`

**玩家选择空间：**
- 3 个选项，各有不同的 stat 变化、identity marker、expression 差异
- 每个选项都有 tavern-born 风味，不是 generic 的"正/邪/中"

---

### Candidate 2: Auto Payoff（声名之巅，类似 merchant）

| 维度 | 评分 | 说明 |
|------|------|------|
| **核心叙事** | ⭐⭐ | "名声达到顶峰"，比较平淡，没有张力 |
| **差异化** | ⭐ | 与 merchant payoff 太像，都是 auto、都是"成功了" |
| **Tavern-born 适配度** | ⭐⭐⭐ | 可以写，但不够独特 |
| **实现复杂度** | ⭐⭐⭐⭐⭐ | 最简单，直接抄 merchant 模式 |
| **Boundedness** | ⭐⭐⭐⭐⭐ | 非常 bounded，1 个 auto 事件搞定 |
| **玩家感知价值** | ⭐⭐ | 感觉就是"又一个成功路线"，记忆点不强 |

**核心叙事：** 你在江湖上的名声达到顶峰，成了真正的江湖名宿。

**为什么 rejected：**
1. **差异化不足**：Merchant payoff 已经是 auto 模式了，renown 再做 auto 就太像了
2. **浪费叙事潜力**："人情债怎么还"是个很好的叙事钩子，做成 auto 就浪费了
3. **玩家参与感弱**：Auto payoff 是"看着角色成功"，choice-based 是"我选择怎么成功"
4. **Flavor 不够突出**：Tavern-born 的特色就是人情往来、面子、世故，choice 能更好地体现这一点

---

## 3. Choice-Based Sub-Directions Comparison

选定 choice-based 后，进一步比较 3 个具体选择方向。

### Option A: 硬扛到底（硬撑面子）

| 维度 | 说明 |
|------|------|
| **核心叙事** | 酒肆出身的人最讲面子，宁可自己苦点也不能让人说闲话。所有的人情债都硬扛下来，名声更响了，但自己也累垮了。 |
| **Flavor 锚点** | 酒肆跑堂的——客人永远是对的，打落牙齿和血吞 |
| **Stat 变化** | reputation +5, connections +3, charisma +2（全正向，但远期有隐患） |
| **Identity marker** | `tavern_renown_payoff_hard_holder` |
| **Cost label** | 声名之累 |
| **Current goal** | 硬扛所有人情债，保住江湖名声 |
| **Age-40 identity** | 硬撑面子的江湖好人 |
| **Life memory 方向** | 所有人情都记在心里，能帮的都帮了，只是夜深人静时会觉得累 |
| **Summary 方向** | 靠人脉与面子闯出了名号，名声越大，担子越重，但从不欠人情 |

**为什么选这个方向：**
- 非常符合"酒肆出身讲面子"的刻板印象，tavern-born 风味最强
- 有悲剧色彩，角色更立体
- 与 pressure 阶段的"人情债渐重"形成递进——pressure 是意识到债重，payoff 是选择硬扛

---

### Option B: 索性撕破脸（断舍离）

| 维度 | 说明 |
|------|------|
| **核心叙事** | 酒肆里混大的，也懂什么时候该翻脸——有些债，不该还。撕破脸皮断了假人情，反而活出了真我。名声掉了，但自由了。 |
| **Flavor 锚点** | 酒肆三教九流——见多了虚情假意，懂什么时候该断 |
| **Stat 变化** | reputation -2, connections -4, charisma -1（负向，但换来自由） |
| **Identity marker** | `tavern_renown_payoff_breaker` |
| **Cost label** | 快意恩仇 |
| **Current goal** | 撕破脸皮，断了不该还的债 |
| **Age-40 identity** | 快意恩仇的独行侠 |
| **Life memory 方向** | 该还的还了，不该还的也撕破了脸。有人骂你忘恩负义，你只觉得轻松。 |
| **Summary 方向** | 曾靠人脉与面子闯出名号，后来撕破脸断了假人情，反倒活得通透 |

**为什么选这个方向：**
- 与 Option A 形成鲜明对比——一个硬扛，一个撕破脸
- 有"反英雄"气质，不是所有路线都要"成功"
- Stat 负向但叙事正向，有张力
- 符合 tavern-born 的另一面——见多了江湖险恶，懂什么时候该翻脸

---

### Option C: 找到平衡（人情世故）

| 维度 | 说明 |
|------|------|
| **核心叙事** | 酒肆掌柜的智慧——人情不是债，是往来；有来有往才长久。拿捏好分寸，既不硬扛也不撕破，成了真正懂人情世故的江湖名宿。 |
| **Flavor 锚点** | 酒肆掌柜——八面玲珑，谁都不得罪，谁都念你的好 |
| **Stat 变化** | reputation +2, connections +1, charisma +3（中庸但可持续） |
| **Identity marker** | `tavern_renown_payoff_balancer` |
| **Cost label** | 人情练达 |
| **Current goal** | 拿捏人情往来的分寸，找到平衡 |
| **Age-40 identity** | 人情练达的江湖名宿 |
| **Life memory 方向** | 该帮的帮，该推的推，人情往来有来有往。酒肆掌柜的智慧，全用在江湖上了。 |
| **Summary 方向** | 靠人脉与面子闯出了名号，更懂人情往来的分寸，成了真正的江湖名宿 |

**为什么选这个方向：**
- 中庸之道，但不是平庸——是"掌柜的智慧"，有 tavern-born 特色
- 与 A/B 形成三角——硬扛 / 撕破 / 平衡
- Charisma 最高，符合"人情练达"的设定
- 最接近传统意义上的"好结局"，但又有独特风味

---

## 4. Three-Choice Differentiation Matrix

三个选项是否有实质差异？（不是换皮）

| 维度 | Option A 硬扛 | Option B 撕破脸 | Option C 平衡 |
|------|--------------|----------------|--------------|
| **核心态度** | 面子至上，打落牙齿和血吞 | 快意恩仇，断舍离 | 人情练达，有来有往 |
| **Reputation** | +5（最高） | -2（负向） | +2（中庸） |
| **Connections** | +3 | -4（掉最多） | +1 |
| **Charisma** | +2 | -1 | +3（最高） |
| **Cost label** | 声名之累 | 快意恩仇 | 人情练达 |
| **Identity** | 硬撑面子的江湖好人 | 快意恩仇的独行侠 | 人情练达的江湖名宿 |
| **叙事调性** | 悲剧英雄 | 反英雄 | 中庸智者 |
| **Tavern-born 锚点** | 跑堂的——客人永远是对的 | 三教九流——见多了虚情假意 | 掌柜的——八面玲珑 |

**结论：三个选项有实质差异，不是换皮。** 每个选项都有独特的 stat 分布、identity、cost label、叙事调性，且都锚定在 tavern-born 的不同侧面。

---

## 5. Recommendation

### 推荐方向：Choice-Based Payoff — 人情债之解

**推荐理由：**

1. **差异化最强**（⭐⭐⭐⭐⭐）：与 merchant auto payoff 完全不同，renown 路线的独特卖点
2. **Tavern-born 风味最浓**（⭐⭐⭐⭐⭐）：三个选项都锚定在酒肆出身的不同侧面（跑堂的 / 三教九流 / 掌柜的）
3. **玩家参与感最强**（⭐⭐⭐⭐⭐）：有意义的选择，塑造角色身份
4. **实现复杂度可控**（⭐⭐⭐）：虽然比 auto 复杂，但仍在 bounded 范围内——1 个事件 + 3 个选项 + 6 个 expression 更新
5. **符合 North Star**：事件触发选择应有可观测后果（§4.2）
6. **叙事张力足**："人情债怎么还"是个好问题，比"名声达到顶峰"有深度

### 放弃的方向

**Auto payoff** — 差异化不足、浪费叙事潜力、玩家参与感弱。虽然实现简单，但价值密度太低。

### 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| Choice 太复杂，超出 bounded 范围 | 只做 3 个选项，expression 更新限定在已有的 6 个 surfaces 内 |
| 三个选项变成换皮 | 每个选项有不同的 stat 分布、identity、cost label、叙事调性 |
| 实现量太大，P77 做不完 | P76 把 contract 定细，P77 按 contract 严格执行，不超 scope |

---

## 6. Conclusion

**Renown payoff = choice-based — 人情债之解**

三个选择方向：
- **Option A: 硬扛到底**（硬撑面子的江湖好人）
- **Option B: 索性撕破脸**（快意恩仇的独行侠）
- **Option C: 找到平衡**（人情练达的江湖名宿）

每个选项都有实质差异，都锚定在 tavern-born 风味的不同侧面，与 merchant auto payoff 形成鲜明差异化。

**P76-004 将基于此方向定义详细的 payoff contract。**

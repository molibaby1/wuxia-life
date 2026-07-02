# P109 Merchant Martial Patron Late-Life — Direction Comparison & Branch Design

> **Purpose:** 比较 patron late-life 的候选方向，设计三条 payoff-choice 驱动的 late-life 分支。
> **Stage:** P109 design-first — zero runtime changes
> **Route:** `merchant_martial_patron`（商武一体金主）

---

## 1. Executive Summary

**比较了 2 个 late-life 大方向 + 3 个 payoff-driven 子分支。**

**最终推荐：Single auto event with 3 branches — payoff choice 后果的晚年展开**
- 核心叙事：商武撕裂之解的选择，决定了怎样的商武晚年？
- 3 个分支：盟约绑紧（A） / 自由孤立（B） / 新盟可持续（C）
- 与 renown late-life（P78 auto × 3）结构对称；与 magnate late-life（P99 choice × 2 track）模式区分
- 兑现 P107 payoff 远期伏笔

**Rejected:** Choice-based late-life — payoff 已是价值判断节点，late-life 应是后果展开而非二次选择。

---

## 2. High-Level Mode Comparison

### Candidate 1: Auto Event × 3 Branches（推荐）

| 维度 | 评分 | 说明 |
|------|------|------|
| **核心叙事** | ⭐⭐⭐⭐⭐ | "商武定型之后，晚年怎么过？"是 payoff 的自然延续 |
| **差异化** | ⭐⭐⭐⭐⭐ | 三条分支实质不同；与 magnate 守成、renown 人情债明确区分 |
| **商武一体适配度** | ⭐⭐⭐⭐⭐ | 账房与演武场的晚年张力是 patron 独有 |
| **实现复杂度** | ⭐⭐⭐⭐ | 1 事件 + 3 条件分支 + 9 表达更新，bounded |
| **Boundedness** | ⭐⭐⭐⭐⭐ | 对齐 P78 renown late-life 模式 |
| **玩家感知价值** | ⭐⭐⭐⭐ | "我的商武选择带来了这样的晚年" — 因果感强 |

**核心叙事问题：** 四十八岁定下的商武之路，到了五十二岁，带来了怎样的晚年？

**触发条件：**
- `merchant_patron_payoff_done` 为 true
- 年龄 52–56 岁
- 互斥 guard：`!merchant_patron_late_life_done`
- 分支 key：三选一 `merchant_patron_payoff_*` marker

**为什么选 auto：**
- Late-life 是 payoff 选择的 *后果*，不是新选择（对齐 P78）
- 玩家已在 payoff 做了价值判断；late-life 是"人生展开"
- 与 magnate late-life choice 区分（magnate 是 entry track 分化，patron 是 payoff 分化）

---

### Candidate 2: Choice-Based Late-Life

| 维度 | 评分 | 说明 |
|------|------|------|
| **核心叙事** | ⭐⭐⭐ | "晚年还要再选一次？" — 与 payoff 功能重叠 |
| **差异化** | ⭐⭐ | 二次选择削弱 payoff 决策权重 |
| **商武一体适配度** | ⭐⭐⭐ | 可写但逻辑重复 |
| **实现复杂度** | ⭐⭐ | 比 auto 复杂（新 choice + 9+ 表达分支） |
| **Boundedness** | ⭐⭐ | 范围膨胀 |
| **玩家感知价值** | ⭐⭐ | Payoff 刚选完，late-life 再选显得冗余 |

**为什么 rejected：**
1. Payoff 已是「商武撕裂怎么解」的价值判断节点
2. Renown P78 明确选择 auto late-life；patron 应结构对称
3. Magnate P99 用 choice 是因为 entry track（ledger/caravan）分化，非 payoff 分化

---

### Candidate 3: Multi-Event Late-Life

| 维度 | 评分 | 说明 |
|------|------|------|
| **核心叙事** | ⭐⭐⭐⭐ | 可展开更多叙事 |
| **实现复杂度** | ⭐ | 测试与维护成本高 |
| **Boundedness** | ⭐ | 超出 P109 scope |

**为什么 rejected：** Patron 路线仍属 Wave 3 bounded sample；1 event × 3 branches 已足够差异化。

---

## 3. Event Structure Decision

| Decision | Choice |
|----------|--------|
| Event ID | `merchant_patron_late_life`（新事件） |
| Event type | **Auto** with 3 conditional branches |
| Age range | **52–56** |
| Upstream gate | `merchant_patron_payoff_done` |
| Branch key | `merchant_patron_payoff_covenant_holder` / `_breaker` / `_balancer` |
| Checkpoint | `merchant_patron_late_life_done` + `merchant_patron_late_life_identity_done` |

---

## 4. Branch A: 盟约绑紧 (Covenant Holder → Bound to the End)

### 4.1 Core Narrative

**Payoff choice:** 硬扛盟约 — 护镖借道全扛，商号与山门绑得更紧

**Late-life arc:** 盟约越绑越紧。五十二岁这年，山门的事比账房的事还多——护镖、借道、江湖规矩，一件都不能推。商武名号响了一辈子，演武场的刀磨了又磨，账房的算盘拨了又拨，两样都没放下。你知道这辈子退不了，也不想退。

**Core question:** 盟约如山扛一辈子，晚年还能撑多久？

### 4.2 Patron Flavor Anchors
- 账房与演武场之间 — 晚年仍两头跑
- 山门差遣 — 护镖借道一件接一件
- 盟约文书 — 越签越厚
- 江湖规矩拖进账本 — 每一笔都要用刀来算

### 4.3 Player Experience
- **Tone:** Tragic determination, weary pride
- **Feeling:** "我选择了扛到底，晚年果然更紧了" — payoff 伏笔兑现
- **Identity shift:** 靠盟约定型的金主 → 盟约终老的商武金主
- **Emotional beat:** 悲壮但不后悔 — 悲剧英雄的自然延伸

### 4.4 Stat Changes (Reference)
| Stat | Change | Rationale |
|------|--------|-----------|
| martialPower | +1 | 晚年仍出刀护商 |
| reputation | +2 | 名号更响，江湖敬其盟约 |
| businessAcumen | +1 | 商路仍在扩张 |
| **Net** | **+4** | 高付出高回报，但叙事强调疲惫 |

### 4.5 Identity Marker
`merchant_patron_late_covenant_bound`

### 4.6 Expression Signals (Reference)
| Surface | Text Direction |
|---------|---------------|
| Cost label | 盟约终老之累 |
| Current goal | 守盟约至终，商武名号不能倒 |
| Age-50+ identity | 盟约终老的商武金主：硬扛了一辈子盟约，晚年山门差遣比账房还多。护镖借道一件接一件，刀与算盘都没放下。名号响了一辈子，担子也重了一辈子——可你从不退缩。 |

---

## 5. Branch B: 自由孤立 (Covenant Breaker → Isolated Merchant)

### 5.1 Core Narrative

**Payoff choice:** 撕破盟约 — 商号归商号，江湖归江湖

**Late-life arc:** 自由但孤立。五十二岁这年，商号靠自己撑起来了，账房里的数字比演武场的刀更可靠。山门的人偶尔路过，点点头又走开——盟约撕了，人情也淡了。商路上的麻烦要自己扛，没人借道，没人护镖，但也没人指手画脚。

**Core question:** 断了盟约换来的自由，晚年值得吗？

### 5.2 Patron Flavor Anchors
- 账房独坐 — 数字比刀可靠
- 山门疏远 — 盟约撕了，人情淡了
- 商路自撑 — 护镖靠自己或雇人
- 演武场荒废 — 刀生了锈，但不后悔

### 5.3 Player Experience
- **Tone:** Free, self-reliant, slightly lonely but content
- **Feeling:** "我撕了盟约，晚年果然自由了，也果然孤立了" — payoff 伏笔兑现
- **Identity shift:** 断武从商的巨贾 → 孤商巨贾
- **Emotional beat:** 自由的代价是孤立 — 反英雄的自然延伸

### 5.4 Stat Changes (Reference)
| Stat | Change | Rationale |
|------|--------|-----------|
| businessAcumen | +3 | 商路完全靠自己经营 |
| martialPower | -1 | 不再出刀，武力退化 |
| reputation | 0 | 商路中人，江湖名声平平 |
| **Net** | **+2** | 财富导向，武力让位 |

### 5.5 Identity Marker
`merchant_patron_late_isolated_merchant`

### 5.6 Expression Signals (Reference)
| Surface | Text Direction |
|---------|---------------|
| Cost label | 孤商自在之快 |
| Current goal | 商路自分断，不再求山门庇护 |
| Age-50+ identity | 孤商巨贾：撕破盟约后商号靠自己撑起来了。山门的人偶尔路过，点点头又走开。商路上的麻烦要自己扛，没人借道没人护镖，但也没人指手画脚。自由是真的，孤立也是真的。 |

---

## 6. Branch C: 新盟可持续 (Balancer → Sustainable Covenant)

### 6.1 Core Narrative

**Payoff choice:** 商武平衡 — 重谈盟约边界，商武各守其份

**Late-life arc:** 新盟可持续。五十二岁这年，当年重谈的盟约规矩还在运转——该出刀时出刀，该算账时算账，商号与山门各守其份。后来人开始来请教商武分寸，你倾囊相授：盟约不是绑死，是谈出来的。账房与演武场之间，终于不再两头拉扯。

**Core question:** 谈出来的新盟约，能撑多久？

### 6.2 Patron Flavor Anchors
- 新盟文书 — 重谈后的规矩还在运转
- 账房与演武场 — 终于不再两头拉扯
- 后来人请教 — 商武分寸的传承
- 商武各守其份 — 可持续的平衡

### 6.3 Player Experience
- **Tone:** Wise, sustainable, mentor-like
- **Feeling:** "我谈出了新规矩，晚年果然安稳了" — payoff 伏笔兑现
- **Identity shift:** 懂商武分寸的金主 → 新盟掌局的金主
- **Emotional beat:** 中庸智者的理想终态 — 可持续的商武一体

### 6.4 Stat Changes (Reference)
| Stat | Change | Rationale |
|------|--------|-----------|
| businessAcumen | +2 | 商路稳健经营 |
| martialPower | +1 | 该出刀时仍出刀 |
| reputation | +2 | 懂商武分寸，江湖敬重 |
| **Net** | **+5** | 均衡正向，体现智慧路径 |

### 6.5 Identity Marker
`merchant_patron_late_sustainable_covenant`

### 6.6 Expression Signals (Reference)
| Surface | Text Direction |
|---------|---------------|
| Cost label | 新盟久立之累 |
| Current goal | 守新盟规矩，传商武分寸给后来人 |
| Age-50+ identity | 新盟掌局的金主：重谈的盟约规矩还在运转，商号与山门各守其份。后来人开始来请教商武分寸，你倾囊相授。账房与演武场之间，终于不再两头拉扯——这才是商武一体的理想晚年。 |

---

## 7. Entry Variant Overlay Priority

Late-life 表达读取优先级（P110 实施参考）：

1. `merchant_patron_late_life_done` gate 优先于 payoff 表达
2. Within late-life: late-life branch marker > payoff choice marker
3. Entry variant 作为 identity 修饰（minimum: 1 native + 1 bridge）

| Entry Variant | Branch A Overlay Example | Branch C Overlay Example |
|---------------|--------------------------|--------------------------|
| Native orthodox (`on_ramp_orthodox`) | base identity（侠义盟约终老） | base identity |
| Bridge apprentice (`bridge_apprentice_craft`) | "手艺眼光与盟约绑在一起，晚年刨花与剑鞘仍是一条绳" | "手艺标准成了新盟规矩的一部分" |

**Minimum P110 coverage:** covenant_holder + native orthodox；balancer + bridge apprentice。

---

## 8. Cross-Route Distinction Matrix

| Dimension | Magnate Late-Life | Renown Late-Life | Patron Late-Life (recommended) |
|-----------|-------------------|------------------|-------------------------------|
| 模式 | Choice (ledger/caravan) | Auto × 3 branches | **Auto × 3 branches** |
| 核心问题 | 守成怎么传 | 人情债的晚年 | **商武定型的晚年** |
| 场景 | 商铺/商路 | 酒肆门口 | **账房与演武场** |
| 分支 key | Entry track markers | Payoff choice markers | **Payoff choice markers** |
| A 分支 | Ledger 守成 | 油尽灯枯 (hard holder) | **盟约绑紧 (covenant holder)** |
| B 分支 | Caravan 传承 | 逍遥自在 (breaker) | **自由孤立 (breaker)** |
| C 分支 | Generic fallback | 传承授业 (balancer) | **新盟可持续 (balancer)** |
| 风味锚点 | 巨贾财富守成 | Tavern-born 人情 | **商武复合经营** |

---

## 9. Recommendation Summary

| Decision | Choice |
|----------|--------|
| Late-life mode | **Auto with 3 branches** |
| Core question | 商武定型之后，晚年怎么过？ |
| Branch A | 盟约绑紧 — `merchant_patron_late_covenant_bound` |
| Branch B | 自由孤立 — `merchant_patron_late_isolated_merchant` |
| Branch C | 新盟可持续 — `merchant_patron_late_sustainable_covenant` |
| Event ID | `merchant_patron_late_life` |
| Age range | 52–56 |
| Rejected | Choice late-life; multi-event expansion |

---

**P109-003 complete.**

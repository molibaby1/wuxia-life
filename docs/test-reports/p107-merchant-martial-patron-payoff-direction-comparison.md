# P107 Merchant Martial Patron Payoff — Direction Comparison

> **Purpose:** 比较 patron payoff 的候选方向，选定最有差异化、最 bounded 的 payoff shape。
> **Stage:** P107 design-first — zero runtime changes
> **Route:** `merchant_martial_patron`（商武一体金主）

## 1. Executive Summary

**比较了 2 个 payoff 大方向 + 3 个 choice-based 子方向。**

**最终推荐：Choice-based payoff — 商武撕裂之解**
- 核心叙事：商武一体的名号，是靠盟约撑住的还是靠刀撑住的？你选择怎么解？
- 3 个选择：硬扛盟约（A） / 撕破盟约（B） / 商武平衡（C）
- 与 magnate auto payoff 形成鲜明差异化；与 renown choice payoff 结构对称但风味独立
- 符合 P105 §6.3 叙事钩子与 P106 pressure 因果链

**Rejected:** Auto payoff 深化（保留 P102 echo 结构）— 与 magnate 同质化，浪费商武撕裂的价值判断潜力。

---

## 2. High-Level Mode Comparison

### Candidate 1: Choice-Based Payoff（商武撕裂之解）

| 维度 | 评分 | 说明 |
|------|------|------|
| **核心叙事** | ⭐⭐⭐⭐⭐ | "商武撕裂怎么解？"是价值判断，天然适合 choice |
| **差异化** | ⭐⭐⭐⭐⭐ | 与 magnate auto 完全不同；与 renown 结构对称但商武风味独立 |
| **商武一体适配度** | ⭐⭐⭐⭐⭐ | 账房与演武场之间的撕裂是 patron 路线核心张力 |
| **实现复杂度** | ⭐⭐⭐ | 比 auto 复杂（choice + 3 表达分支），但在 bounded 范围内 |
| **Boundedness** | ⭐⭐⭐⭐ | 1 事件升级 + 3 选项 + 9+ expression 更新，范围清晰 |
| **玩家感知价值** | ⭐⭐⭐⭐⭐ | 有意义的选择，"我的商武一体之路由此定型" |

**核心叙事问题：** 盟约如山、负担兑现之后，商武一体的名号你要怎么定型？

**触发条件：**
- `merchant_patron_midlife_pressure_done` 为 true
- 年龄 48–52 岁（保持 P102 echo age band）
- 互斥 guard：`!merchant_patron_payoff_done`

**玩家选择空间：**
- 3 个选项，各有 stat 变化、identity marker、expression 差异
- 每个选项都有商武一体风味，不是 generic 正/邪/中

---

### Candidate 2: Auto Payoff 深化（保留 P102 Echo 结构）

| 维度 | 评分 | 说明 |
|------|------|------|
| **核心叙事** | ⭐⭐ | "名号落定"，平淡，无张力 |
| **差异化** | ⭐ | 与 magnate auto payoff 太像 |
| **商武一体适配度** | ⭐⭐⭐ | 可写但不够独特 |
| **实现复杂度** | ⭐⭐⭐⭐⭐ | 最简单，P102 已有 auto echo |
| **Boundedness** | ⭐⭐⭐⭐⭐ | 非常 bounded |
| **玩家感知价值** | ⭐⭐ | "又一个成功路线"，记忆点弱 |

**核心叙事：** 四十八岁，商武一体名号落定，江湖定评已成。

**为什么 rejected：**
1. **差异化不足**：Magnate payoff 已是 auto；patron 再做 auto 与 magnate 同质化
2. **浪费叙事潜力**：P105 §6.3 和 P106 pressure 已埋下"商武撕裂"钩子，auto 浪费
3. **玩家参与感弱**：Auto 是"观看成功"，choice 是"选择怎么定型"
4. **与 renown 不对称**：Renown 已选 choice payoff；patron 应同等 agency 但不同风味

---

## 3. Choice-Based Sub-Directions Comparison

选定 choice-based 后，进一步比较 3 个具体选择方向。

### Option A: 硬扛盟约（盟约如山）

| 维度 | 说明 |
|------|------|
| **核心叙事** | 商武一体的名号是靠盟约撑住的。护镖、借道、江湖规矩——全都扛下来，商号与山门绑得更紧，名号更响，但账房与演武场之间的拉扯永不停歇。 |
| **Flavor 锚点** | 侠义金主——盟约既立，刀出鞘、账落笔，一个字都不许反悔 |
| **Stat 变化** | businessAcumen +2, martialPower +3, reputation +2 |
| **Identity marker** | `merchant_patron_payoff_covenant_holder` |
| **Cost label** | 盟约如山之累 |
| **Current goal** | 硬扛盟约护商，商武名号靠刀与账一起撑 |
| **Age-40 identity 方向** | 靠盟约定型的商武金主——出钱出刀都在一条绳上，从不退缩 |
| **远期伏笔** | 盟约越绑越紧（late-life 预留） |
| **叙事调性** | 悲剧英雄——为了名号牺牲自由 |

**为什么选这个方向：**
- 与 pressure "盟约兑现负担"形成递进——pressure 意识到负担，payoff 选择硬扛
- 符合 orthodox/martial entry 变体的侠义/武力护商锚点
- Stat 偏 martial + business，体现"刀与账都不放"

---

### Option B: 撕破盟约（断武从商）

| 维度 | 说明 |
|------|------|
| **核心叙事** | 商武一体的名号不该靠别人的刀撑。撕破护商盟约，断了门派差遣，商号归商号、江湖归江湖。财富保住了，但失去了山门庇护。 |
| **Flavor 锚点** | 商路中人——账房里的数字比演武场的刀更可靠 |
| **Stat 变化** | businessAcumen +4, martialPower -2, reputation -1 |
| **Identity marker** | `merchant_patron_payoff_covenant_breaker` |
| **Cost label** | 断武从商之快 |
| **Current goal** | 撕破盟约，商号不再听山门差遣 |
| **Age-40 identity 方向** | 断武从商的巨贾——商路靠自己，不再出刀换护 |
| **远期伏笔** | 自由但孤立（late-life 预留） |
| **叙事调性** | 反英雄——撕破盟约，商路归商路 |

**为什么选这个方向：**
- 与 Option A 形成鲜明对比——一个绑紧，一个断开
- Stat 负向 martial 但叙事正向，有张力
- 符合"商道与武道撕裂"的另一极解答
- 不是所有 patron 都要"商武一体到底"

---

### Option C: 商武平衡（新盟新矩）

| 维度 | 说明 |
|------|------|
| **核心叙事** | 商武一体不是绑死，是谈出来的。重新划定盟约边界——该出刀时出刀，该算账时算账，商号与山门各守其份，不再被两头拉扯。 |
| **Flavor 锚点** | 商武掌柜的智慧——盟约可以改，规矩可以谈 |
| **Stat 变化** | businessAcumen +3, martialPower +1, reputation +2 |
| **Identity marker** | `merchant_patron_payoff_balancer` |
| **Cost label** | 商武新矩之累 |
| **Current goal** | 重谈盟约边界，商武各守其份 |
| **Age-40 identity 方向** | 懂商武分寸的金主——盟约可改，但规矩要清 |
| **远期伏笔** | 可持续发展的新盟约（late-life 预留） |
| **叙事调性** | 中庸智者——谈出新规矩 |

**为什么选这个方向：**
- 回答 P105 §6.3 第二个钩子："找到不再被两头拉扯的位置"
- 与 A/B 形成完整三角：扛 / 断 / 谈
- Stat 中庸均衡，体现谈判智慧
- 最符合"商武一体"路线的理想终态——不是撕裂到底，是找到新平衡

---

## 4. Cross-Route Distinction Matrix

| Dimension | Magnate Payoff | Renown Payoff | Patron Payoff (recommended) |
|-----------|----------------|---------------|----------------------------|
| 模式 | Auto | Choice (3) | **Choice (3)** |
| 核心问题 | 商业帝国成型 | 人情债怎么还 | **商武撕裂怎么解** |
| 场景 | 商铺/商路 | 酒肆柜台 | **账房与演武场之间** |
| 核心债务 | 金钱债了结 | 人情债了结 | **武力盟约义务定型** |
| A 选项 | N/A | 硬扛面子 | **硬扛盟约** |
| B 选项 | N/A | 撕破脸 | **撕破盟约** |
| C 选项 | N/A | 人情世故 | **商武平衡** |
| 风味锚点 | 巨贾财富 | Tavern-born 人情 | **商武复合经营** |

---

## 5. Event ID Decision

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| 升级 `merchant_patron_payoff_echo` auto → choice | 保持 spine ID 连续；P102 测试引用少改 | 事件类型变更；metadata tags 需更新 | **推荐** |
| 新增 `merchant_patron_midlife_payoff` | 命名对称 pressure | 多一个事件；旧 echo 需禁用 | Rejected |

**推荐：** P108 将 `merchant_patron_payoff_echo` 从 `auto` 升级为 `choice`，保留 event ID 与 age band，更新 `eventType` 与 effects 结构。

---

## 6. Recommendation Summary

| Decision | Choice |
|----------|--------|
| Payoff mode | **Choice-based** |
| Core question | 商武撕裂怎么解？ |
| Option A | 硬扛盟约 — `merchant_patron_payoff_covenant_holder` |
| Option B | 撕破盟约 — `merchant_patron_payoff_covenant_breaker` |
| Option C | 商武平衡 — `merchant_patron_payoff_balancer` |
| Event ID | 升级 `merchant_patron_payoff_echo` → choice |
| Rejected | Auto payoff 深化 |

---

**P107-003 complete.**

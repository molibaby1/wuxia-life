# P116 Founding Patriarch Late-Life — Direction Comparison & Branch Design

> **Purpose:** 比较 founding-patriarch late-life 的候选方向，设计两条 pressure-marker 驱动的 late-life 分支。
> **Stage:** P116 design-first — zero runtime changes
> **Route:** `founding_patriarch`（开派祖师）

---

## 1. Executive Summary

**比较了 2 个 late-life 大方向 + 2 个 pressure-driven 子分支。**

**最终推荐：Single auto event with 2 branches — pressure 治理次序的晚年展开**
- 核心叙事：中年次序选择（门规优先 vs 盟约优先），决定了怎样的开派晚年？
- 2 个分支：门规守成终老（A） / 盟约续责终老（B）
- 与 patron late-life（P109 payoff-keyed auto × 3）结构对称但分支 key 不同
- Payoff 三选一作为表达修饰层，不作为 late-life 主分支 key

**Rejected:** Choice-based late-life — pressure 已是治理次序节点，late-life 应是后果展开而非二次选择。

---

## 2. High-Level Mode Comparison

### Candidate 1: Auto Event × 2 Branches（推荐）

| 维度 | 评分 | 说明 |
|------|------|------|
| **核心叙事** | ⭐⭐⭐⭐⭐ | "治理次序之后，晚年怎么过？"是 pressure 的自然延续 |
| **差异化** | ⭐⭐⭐⭐⭐ | 两条分支实质不同；与 patron/renown 明确区分 |
| **开派治理适配度** | ⭐⭐⭐⭐⭐ | 山门与书斋的晚年张力是 founding-patriarch 独有 |
| **实现复杂度** | ⭐⭐⭐⭐ | 1 事件 + 2 条件分支 + 6 表达更新，bounded |
| **Boundedness** | ⭐⭐⭐⭐⭐ | 对齐 P109 auto late-life 模式 |
| **玩家感知价值** | ⭐⭐⭐⭐ | "我的治理次序带来了这样的晚年" — 因果感强 |

**核心叙事问题：** 四十岁定下的治理次序，到了五十二岁，带来了怎样的开派晚年？

**触发条件：**
- `founding_patriarch_payoff_done` 为 true
- 年龄 52–56 岁
- 互斥 guard：`!founding_patriarch_late_life_done`
- 分支 key：二选一 `founding_patriarch_pressure_*` marker

**为什么选 auto：**
- Late-life 是 pressure 次序选择的 *后果*，不是新选择（对齐 P78/P109）
- 玩家已在 pressure（40–45 岁）做了治理次序判断；payoff（48–52 岁）做了名号定型；late-life 是"人生展开"
- 与 magnate late-life choice 区分（magnate 是 entry track 分化，founding 是 pressure 分化）

---

### Candidate 2: Choice-Based Late-Life

| 维度 | 评分 | 说明 |
|------|------|------|
| **核心叙事** | ⭐⭐⭐ | "晚年还要再选一次？" — 与 payoff 功能重叠 |
| **差异化** | ⭐⭐ | 二次选择削弱 pressure/payoff 决策权重 |
| **开派治理适配度** | ⭐⭐⭐ | 可写但逻辑重复 |
| **实现复杂度** | ⭐⭐ | 比 auto 复杂（新 choice + 6+ 表达分支） |
| **Boundedness** | ⭐⭐ | 范围膨胀 |
| **玩家感知价值** | ⭐⭐ | Payoff 刚选完，late-life 再选显得冗余 |

**为什么 rejected：**
1. Pressure 已是「门规 vs 盟约」的治理次序节点；payoff 已是「名号定型」的价值判断节点
2. Patron P109 / Renown P78 明确选择 auto late-life；founding-patriarch 应结构对称
3. Magnate P99 用 choice 是因为 entry track（ledger/caravan）分化，非 pressure 分化

---

### Candidate 3: Multi-Event Late-Life

| 维度 | 评分 | 说明 |
|------|------|------|
| **核心叙事** | ⭐⭐⭐⭐ | 可展开更多叙事 |
| **实现复杂度** | ⭐ | 测试与维护成本高 |
| **Boundedness** | ⭐ | 超出 P116 scope |

**为什么 rejected：** Founding-patriarch 路线仍属 Wave 2 bounded sample；1 event × 2 branches 已足够差异化。

---

### Candidate 4: Payoff-Keyed Late-Life (3 branches)

| 维度 | 评分 | 说明 |
|------|------|------|
| **核心叙事** | ⭐⭐⭐⭐ | 与 patron P109 结构完全对称 |
| **差异化** | ⭐⭐⭐ | 与 patron 风味重叠（都是 payoff 后果） |
| **开派治理适配度** | ⭐⭐⭐ | 丢失 pressure 治理次序的独特叙事钩子 |
| **Boundedness** | ⭐⭐⭐ | 3 分支可行但非最小 |

**为什么 not primary：**
1. P115 pressure 已明确分化 `rule_first` / `alliance_first` 治理次序，这是 founding-patriarch 独有风味
2. Payoff 三选一（续责/自立/双门）更适合作为表达修饰层，而非 late-life 主分支 key
3. 2 分支 minimum 满足 PRD bounded default；payoff overlay 作为 P117 bonus

---

## 3. Event Structure Decision

| Decision | Choice |
|----------|--------|
| Event ID | `founding_patriarch_late_life`（新事件） |
| Event type | **Auto** with 2 conditional branches |
| Age range | **52–56** |
| Upstream gate | `founding_patriarch_payoff_done` |
| Branch key | `founding_patriarch_pressure_rule_first` / `founding_patriarch_pressure_alliance_first` |
| Checkpoint | `founding_patriarch_late_life_done` + `founding_patriarch_late_life_identity_done` |

---

## 4. Branch A: 门规守成终老 (Rule First → Rule Keeper)

### 4.1 Core Narrative

**Pressure choice:** 先稳门规传承，再补诸派盟约续责

**Late-life arc:** 门规守成终老。五十二岁这年，书斋里的治学规矩比山门外的盟约文书更占你心思——弟子争议、门规执行、师承续传，一件接一件。诸派盟约还在，但已退为背景；你知道这辈子是以门规立派、以治学传宗的人。

**Core question:** 门规守了一辈子，晚年还能守多久？

### 4.2 Founding-Patriarch Flavor Anchors
- 书斋与山门之间 — 晚年书斋占主导
- 弟子争议 — 门规执行一件接一件
- 师承续传 — 治学规矩比盟约文书更厚
- 盟约退为背景 — 诸派事务渐少

### 4.3 Player Experience
- **Tone:** Steady determination, scholarly pride
- **Feeling:** "我选择了门规优先，晚年果然以守成治学为主" — pressure 伏笔兑现
- **Identity shift:** 背责掌门 → 门规守成的开宗祖师
- **Emotional beat:** 沉稳但不轻松 — 守成者的自然延伸

### 4.4 Stat Changes (Reference)
| Stat | Change | Rationale |
|------|--------|-----------|
| reputation | +2 | 门规严明，江湖敬其守成 |
| connections | +1 | 师承人脉仍在 |
| martialPower | +1 | 武学传承未断 |
| **Net** | **+4** | 守成导向 |

### 4.5 Identity Marker
`founding_patriarch_late_rule_keeper`

### 4.6 Expression Signals (Reference)
| Surface | Text Direction |
|---------|---------------|
| Cost label | 门规守成之累 |
| Current goal | 守门规至终，治学师承不能断 |
| Age-50+ identity | 门规守成的开宗祖师：先稳门规传承的选择，到了晚年果然以书斋治学为主。弟子争议、门规执行一件接一件，盟约事务退为背景。名号是靠门规立住的，担子也是。 |

---

## 5. Branch B: 盟约续责终老 (Alliance First → Alliance Bearer)

### 5.1 Core Narrative

**Pressure choice:** 先稳诸派盟约续责，再收束门规传承

**Late-life arc:** 盟约续责终老。五十二岁这年，诸派盟约的文书比书斋里的治学卷宗更占你心思——续责诸派、对外治理、盟会差遣，一件接一件。门规还在，但已收束为执行工具；你知道这辈子是以盟约立派、以续责传名的人。

**Core question:** 盟约扛了一辈子，晚年还能扛多久？

### 5.2 Founding-Patriarch Flavor Anchors
- 山门与书斋之间 — 晚年山门对外占主导
- 诸派差遣 — 盟约续责一件接一件
- 对外治理 — 盟会文书比治学卷宗更厚
- 门规收束为工具 — 内部门规渐简

### 5.3 Player Experience
- **Tone:** Burdened responsibility, statesman-like weariness
- **Feeling:** "我选择了盟约优先，晚年果然以续责诸派为主" — pressure 伏笔兑现
- **Identity shift:** 背责掌门 → 盟约续责的开宗祖师
- **Emotional beat:** 疲惫但不退缩 — 续责者的自然延伸

### 5.4 Stat Changes (Reference)
| Stat | Change | Rationale |
|------|--------|-----------|
| reputation | +3 | 盟约续责，诸派敬重 |
| connections | +2 | 盟会人脉更广 |
| martialPower | 0 | 武力非重心 |
| **Net** | **+5** | 人脉导向 |

### 5.5 Identity Marker
`founding_patriarch_late_alliance_bearer`

### 5.6 Expression Signals (Reference)
| Surface | Text Direction |
|---------|---------------|
| Cost label | 盟约续责之累 |
| Current goal | 守盟约至终，诸派续责不能推 |
| Age-50+ identity | 盟约续责的开宗祖师：先稳诸派盟约的选择，到了晚年果然以山门对外为主。续责诸派、盟会差遣一件接一件，门规收束为执行工具。名号是靠盟约撑住的，担子也是。 |

---

## 6. On-Ramp Variant Overlay Priority

Late-life 表达读取优先级（P117 实施参考）：

1. `founding_patriarch_late_life_done` gate 优先于 payoff 表达
2. Within late-life: late-life branch marker > pressure marker > payoff choice marker
3. On-ramp variant 作为 identity 修饰（minimum: scholar + alliance 各 1 条）

| On-Ramp Variant | Branch A Overlay Example | Branch B Overlay Example |
|-----------------|--------------------------|--------------------------|
| Scholar (`on_ramp_scholar`) | "学者师徒线拉着门规守成往前走，书斋治学是晚年的主战场" | "学者师徒线仍在，但盟约差遣挤占了治学时间" |
| Alliance (`on_ramp_alliance`) | "门派盟约线仍在，但门规守成压过了对外续责" | "门派盟约线拉着续责诸派往前走，山门对外是晚年的主战场" |

**Minimum P117 coverage:** rule_first + scholar on-ramp；alliance_first + alliance on-ramp。

---

## 7. Payoff Overlay (Optional Expression Modifier)

Payoff 三选一不作为 late-life 主分支 key，但可在表达层提供修饰（P117 bonus）：

| Payoff Marker | Branch A Modifier | Branch B Modifier |
|---------------|-------------------|-------------------|
| `payoff_legacy_holder` | 续责如山 + 门规守成 = "续责与门规一并终老" | 续责如山 + 盟约续责 = "续责终老，诸派盟约更紧" |
| `payoff_independent_founder` | 自立山门 + 门规守成 = "自己的规矩自己守到老" | 自立山门 + 盟约续责 = "自立但仍被旧盟约牵着" |
| `payoff_dual_gate` | 双门并立 + 门规守成 = "门规与盟约各守其份，晚年偏门规" | 双门并立 + 盟约续责 = "门规与盟约各守其份，晚年偏盟约" |

**P117 minimum:** 不强制 payoff overlay；2 pressure branch paths 即可 closed。

---

## 8. Cross-Route Distinction Matrix

| Dimension | Patron Late-Life | Renown Late-Life | Founding Late-Life (recommended) |
|-----------|------------------|------------------|----------------------------------|
| 模式 | Auto × 3 branches | Auto × 3 branches | **Auto × 2 branches** |
| 核心问题 | 商武定型的晚年 | 人情债的晚年 | **门派治理次序的晚年** |
| 场景 | 账房与演武场 | 酒肆门口 | **山门与书斋** |
| 分支 key | Payoff choice markers | Payoff choice markers | **Pressure markers** |
| A 分支 | 盟约绑紧 | 油尽灯枯 | **门规守成终老** |
| B 分支 | 自由孤立 | 逍遥自在 | **盟约续责终老** |
| C 分支 | 新盟可持续 | 传承授业 | N/A（2 分支） |
| 风味锚点 | 商武复合经营 | Tavern-born 人情 | **门派延续 + 治学盟约** |

---

## 9. Recommendation Summary

| Decision | Choice |
|----------|--------|
| Late-life mode | **Auto with 2 branches** |
| Core question | 治理次序之后，开派晚年怎么过？ |
| Branch A | 门规守成终老 — `founding_patriarch_late_rule_keeper` |
| Branch B | 盟约续责终老 — `founding_patriarch_late_alliance_bearer` |
| Event ID | `founding_patriarch_late_life` |
| Age range | 52–56 |
| Branch key source | **Pressure markers** (not payoff) |
| Rejected | Choice late-life; multi-event expansion; payoff-keyed 3-branch primary |

---

**P116-003 complete.**

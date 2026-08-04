# Complete-Life Player Experience Baseline

## Executive Summary

本报告基于四条固定的完整 Headless Trace，检查人生是否从早期选择持续形成中后期回响、主动行动是否塑造长期人生、身份与归属是否稳定、结局是否解释整段人生。

结论如下：

1. 正常寿终正式闭合。四条 Trace 都在 80 岁进入 `terminal`，均有 `ending`，`ordinary_life` 各出现一次，终局后没有继续的事件或行动步骤。
2. 早期路线不是完全没有长期回响。固定的 P9/P11 路线事件会把部分童年、门派、主动行动选择带回中期摘要、关键事件和结局方向；但这属于 Headless 执行结果，不能直接证明真实玩家会作出同样选择。
3. 主动行动在前中期存在路线回调，但 181 次行动只有 23 种结果摘要文本，其中 21 种被重复使用；30 岁以后没有观察到新的行动结构。长寿命阶段的行动更像重复的属性增长按钮。
4. 身份语义仍不闭合。四条 Trace 的 `identity.primary` 都是 `none`，`player.sect` 与 `player.title` 都为空，但事件正文、flags、阶段摘要和结局已经使用了正道、商路、学者等身份语言。这是来源冲突，不应通过本报告自行新增身份模型。
5. `martial_god` 和 `great_scholar` 能解释主要属性主轴；`wealth-shen` 与 `balanced-wei` 的完整人生在事件、选择、状态和行动上明显不同，却都得到 `quiet_family_life`，现有中性结局文本没有解释商路差异。该样本更支持“结局解释力不足”，而不是“所有人生实际趋同”。
6. Browser EndingScreen 仍没有真实点击、等待、Console、刷新读档或 390px 交互证据。本报告不把 Headless 最终状态当成浏览器验收。

唯一推荐的下一产品 Slice 是：**C. 结局解释力修复**。建议先针对 `quiet_family_life` 增加基于已存在正式状态和路线证据的可解释收束摘要，覆盖 wealth 与 balanced 的差异；不先重做 EndingSystem 判定、不扩展身份模型、不修正 oracle。

## 1. Scope, sample and evidence boundary

正式样本固定为：

| Persona | Seed | endAge 参数 | 实际终局年龄 | stoppedReason | ending | ordinary_life | 终局后步骤 |
|---|---:|---:|---:|---|---|---:|---:|
| p8-martial-lin | 801 | 100 | 80 | `terminal` | `martial_god` / 武学之神 | 1 | 0 |
| p8-scholar-su | 802 | 100 | 80 | `terminal` | `great_scholar` / 一代宗师 | 1 | 0 |
| p8-wealth-shen | 804 | 100 | 80 | `terminal` | `quiet_family_life` / 人间烟火 | 1 | 0 |
| p8-balanced-wei | 810 | 100 | 80 | `terminal` | `quiet_family_life` / 人间烟火 | 1 | 0 |

四条 Trace 的选择策略元数据均为：

```text
oracle_effect_score_v1
usesHiddenEffects = true
deterministic = true
normalizedStatUnits = false
tieBreaker = first_candidate
runtimePath = headless_server
```

因此本文中的“路径”“选择”和“persona 差异”是模拟执行证据。它们可用于验证流程、状态、事件覆盖和产品反馈 payload，但不能作为真实玩家偏好、认知或体验的直接证据。

本报告没有修改 Trace，没有调用新的随机数，没有进入 P8/P11 判定，也没有修改任何产品代码。

## 2. Normal longevity closure baseline

正式寿终链路已经闭合：

```text
ordinary_life
  → special/end_game
  → EndingSystem.determineEnding()
  → state.ending
  → sessionPhase = terminal
```

四条 Trace 的最终状态还显示 `player.alive = false`，并将结局名称写入 `deathReason`。这证明正常寿终路径已经能消费正式结局信号；它不等价于 Browser EndingScreen 已经完成交互验收。

## 3. Four complete-life overviews

### 3.1 Counts and final state

| Persona | 事件步骤 | 选择步骤 | 主动行动 | 主要行动类别 | 关键最终状态 | 结局解释度 |
|---|---:|---:|---:|---|---|---|
| martial-lin | 39 | 23 | 44 | training 36/44（81.8%） | martialPower 93，knowledge 34，money -440，connections 29 | 高：结局直接说明武学主轴 |
| scholar-su | 25 | 15 | 47 | study 38/47（80.9%） | knowledge 109，comprehension 118，money -240，connections 83 | 高：结局直接说明学术主轴 |
| wealth-shen | 56 | 34 | 43 | business 35/43（81.4%） | businessAcumen 75，money 687，reputation 38，connections 66 | 中低：商路过程未进入结局文本 |
| balanced-wei | 47 | 29 | 47 | business/study/travel 各 10/47（最大类别 21.3%） | businessAcumen 32，money -293，martialPower 61，knowledge 59 | 中低：混合路线被同一家庭结局概括 |

四条人生都保留 `spouse = 发妻`、`children = 1`。这解释了它们共享家庭锚点，但不能解释 wealth 与 balanced 的全部人生差异。

### 3.2 Early and middle key nodes

以下是每条人生中至少五个早期或中期节点。分类只依据后续 Trace 中可见的事件正文、阶段摘要、行动摘要和最终结局；没有把单纯数值变化自动算作叙事回响。

#### p8-martial-lin / 801

| 年龄 | 关键节点 | 后续可见证据 | 分类 |
|---:|---|---|---|
| 1 | 出身：商贾之家 | 之后出现商号、算盘、商队等幼年叙事；最终仍保留商贾早期痕迹 | `DIRECT_ECHO` |
| 4 | 跟熟客打招呼 | 7 岁出现算盘节律和商号环境，但没有形成稳定的职业摘要 | `INDIRECT_ECHO` |
| 13 | 拜入正道名门 | 当期结果明确写入师门；38 岁正道回望、44 岁传承守门再次出现 | `DIRECT_ECHO` |
| 16 | 专修内功、持续练功 | 27/28 岁出现功底显现与武道立名，最终进入武学之神结局 | `DIRECT_ECHO` |
| 19 | 护道誓成·神话初形 | 后续有武道证明和神话路线回调，结局与武学长期投入一致 | `DIRECT_ECHO` |
| 25 | 隐世线窗口未命中 | 后续只看到“窗口已闭”的当期反馈，未观察到新的可见承接 | `NO_OBSERVED_ECHO` |

#### p8-scholar-su / 802

| 年龄 | 关键节点 | 后续可见证据 | 分类 |
|---:|---|---|---|
| 1 | 出身：商贾之家 | 幼年阶段持续出现账本、商号和算盘叙事 | `DIRECT_ECHO` |
| 22 | 书院辩学：登台讲学 | 后续出现书院、读书回响和学术路线结局 | `DIRECT_ECHO` |
| 24 | 人脉成线：进入私宴圈层 | 28 岁出现席间扬名，连接与名望进入后续事件 | `DIRECT_ECHO` |
| 30—40 | 持续读书 | 40 岁武林公敌事件可用学识和人脉处理，最终知识与悟性主轴清晰 | `DIRECT_ECHO` |
| 40 | 查明武林公敌真相 | 当期结果展示学识、人脉变化，但后续没有再次点名该事件 | `STATE_ONLY` |
| 51 | 秘籍现世：参与争夺 | 后续未观察到明确的新事件或结局文本承接 | `NO_OBSERVED_ECHO` |

#### p8-wealth-shen / 804

| 年龄 | 关键节点 | 后续可见证据 | 分类 |
|---:|---|---|---|
| 1 | 出身：商贾之家 | 幼年商号、算盘和商队叙事连续出现 | `DIRECT_ECHO` |
| 9 | 商路初分：跟商队认货路 | 10 岁货路确认、22 岁商队护送、23 岁商路押镖形成连续路线 | `DIRECT_ECHO` |
| 16 | 开设稳健杂货铺 | 之后出现经营节奏、首笔生意、商路扩张和巨贾节点 | `DIRECT_ECHO` |
| 28—30 | 成为商路之主并押注商路 | 36 岁债务压力、42 岁巨贾之位、48 岁巨贾晚年均明确引用行市路线 | `DIRECT_ECHO` |
| 20—79 | 持续营商 | 43 次行动中 35 次为营商，且中后期仍有商路阶段摘要 | `DIRECT_ECHO` |
| 42 | 秘籍现世：参与争夺 | 后续没有观察到对应的新可见人生节点 | `NO_OBSERVED_ECHO` |

#### p8-balanced-wei / 810

| 年龄 | 关键节点 | 后续可见证据 | 分类 |
|---:|---|---|---|
| 1 | 出身：商贾之家 | 幼年商号、算盘、商队和账房内容持续出现 | `DIRECT_ECHO` |
| 9 | 商路初分：跟父亲学管账 | 账房确认、稳扩、守信誉等阶段摘要持续回到该路线 | `DIRECT_ECHO` |
| 14 | 留在家族继续修炼 | 主要留下 `familyDisciple` 等 flag；没有稳定的正式门派身份或后续身份摘要 | `STATE_ONLY` |
| 21—28 | 营商、练功、游历、读书交错 | 中期出现文武调和、巨贾门槛、人情周转等混合路线摘要 | `DIRECT_ECHO` |
| 28 | 文武调和 / balanced harmony | 形成 `p8_route_balanced` 和路线摘要，是平衡路线最明确的中期反馈 | `DIRECT_ECHO` |
| 40 | 秘籍现世：参与争夺 | 后续没有观察到明确的新可见人生节点 | `NO_OBSERVED_ECHO` |

### 3.3 Echo classification summary

固定抽取的 24 个早期/中期关键节点统计如下。它是有代表性的定性样本，不是所有 101 个选择步骤的自动语义判定。

| 分类 | 数量 | 说明 |
|---|---:|---|
| `DIRECT_ECHO` | 17 | 有后续事件、阶段摘要、行动路线或结局的可见承接 |
| `INDIRECT_ECHO` | 1 | 通过环境或路线信号间接承接，未形成稳定身份/结局语句 |
| `STATE_ONLY` | 2 | 主要停留在 flag 或当期状态/数值，后续没有明显叙事接续 |
| `NO_OBSERVED_ECHO` | 4 | 在完整 Trace 中没有观察到可识别的后续承接 |

结论不是“所有选择都有效”。当前系统已经具备少量明确的跨年龄反馈能力，但反馈集中在被专门接入 P9/P11 的路线；普通选择和部分江湖节点仍可能只在当期结算后消失。

## 4. Active-action long-term value

### 4.1 Distribution and repetition

四条 Trace 合计 181 次主动行动：

| 类别 | 次数 | 占比 |
|---|---:|---:|
| study | 56 | 30.9% |
| training | 44 | 24.3% |
| business | 45 | 24.9% |
| socializing | 26 | 14.4% |
| travel | 10 | 5.5% |

| Persona | 最大类别 | 最大类别占比 | 最大连续重复 |
|---|---|---:|---:|
| martial-lin | training | 81.8% | 4 |
| scholar-su | study | 80.9% | 4 |
| wealth-shen | business | 81.4% | 4 |
| balanced-wei | business/study/travel 并列 | 21.3% | 3 |

收益递减通过行动摘要中的“重复投入，收益递减”标记统计：

| Persona | 递减行动次数 |
|---|---:|
| martial-lin | 18/44 |
| scholar-su | 18/47 |
| wealth-shen | 17/43 |
| balanced-wei | 8/47 |
| 合计 | 61/181 |

181 个行动结果摘要只有 23 种精确文本，其中 21 种重复出现。最高频模式包括：

- `练功` 的 `功力+1，体魄+1，银两-10`：18 次；
- `读书` 的 `悟性+1，学识+1，魅力+1，银两-15`：18 次；
- `读书` 的 `悟性+2，学识+2，魅力+1，银两-15`：18 次；
- `营商` 的 `银两-1，经营+1`：17 次；
- `营商` 的 `银两+9，经营+2`：16 次。

这不是单纯的 UI 重复：Trace 的 active action 本身就反复选择相同 action ID。报告统计使用 active action 步骤，未把续接步骤中的重复 presentation 当作新的行动。

### 4.2 Does action unlock new structures?

每条人生在 20—30 岁左右已经出现其后续使用的全部行动 ID；30 岁之后没有观察到新的行动结构解锁。中后期主要是既有 `training`、`study`、`business`、`socializing`、`travel` 基础行动的重复和收益递减。

因此答案是：

- **产品层面**：行动并非完全没有长期作用。训练、读书、营商和社交都能触发 P9/P11 的路线回响或中期事件；wealth 的营商进入商路、巨贾和债务节点，martial 的训练进入功底与武道证明，scholar 的读书进入书院和学者结局，balanced 的多类行动进入文武调和。
- **体验层面**：长寿命后半段缺少新的行动结构和更丰富的可见承接，重复摘要成为主体验。
- **Persona 层面**：三个专向 persona 都固定在一个主要类别约 81%，这会放大“行动是单属性按钮”的观察结果；balanced 才提供了较宽的行动分布。
- **Oracle 层面**：行动和事件选择来自固定策略与隐藏 effects，不是玩家权衡。因此不能据此断言真实玩家会长期重复同一行动。

综合判断：主动行动目前是“有少量路线塑形 + 长期主要属性增长”的混合系统，尚不足以证明它已经持续塑造完整人生。

## 5. Identity and belonging

### 5.1 Observed sources

| 身份/归属 | 可见或结构化证据 | 最终正式字段 | 分类 |
|---|---|---|---|
| 正道名门/武者路线 | `正道试炼`、`正道`阶段摘要、`orthodox_*` 与 `p9_route_identity_martial` flags | `player.sect = null`，`identity.primary = none` | `CONFLICTING_SOURCES` |
| 商路/商人路线 | 商路、巨贾、账房/行市阶段摘要，`route_merchant`、`p9_route_identity_*` flags | `identity.primary = none`，无稳定 merchant identity | `CONFLICTING_SOURCES` |
| 学者路线 | 书院辩学、读书回响、`p8_route_scholar`、`p9_route_identity_scholar` flags | `identity.primary = none` | `CONFLICTING_SOURCES` |
| 婚姻和家庭 | `family_marriage`、`family_child_born`、`family_reunion`；最终 `spouse = 发妻`、`children = 1` | `player.spouse`、`player.children` | `CANONICAL_STATE` |
| 最终结局 | `finalState.ending`、`ending_triggered`、`deathReason` | `state.ending` | `CANONICAL_STATE` |

四条 Trace 的 `identity` 对象都存在，但 `identities = []`、`primary = none`。这意味着问题不是 Trace 没有记录任何路线信号，而是路线信号没有汇聚到同一个稳定身份 consumer。

本轮不新增 identity source，也不从 event text 或 event ID 推导身份。身份语义应作为独立产品裁决，不与本轮结局解释力 Slice 混做。

### 5.2 Consequence for player experience

玩家能在阶段文本中看到“正道”“商路”“学者”等方向，但不能从长期摘要确认这些是否是当前正式身份。特别是 martial 的早期“拜入正道名门”和后续正道回望，与最终 `sect = null` 并存，构成可见叙事与结构化状态的断裂。

## 6. Life-summary stage coverage

下表按本报告的分析区间统计 `periodSummary`，区间只是分析分桶，不重新定义产品阶段：童年 0—12 岁、成年早期 13—29 岁、中年 30—49 岁、晚年 50—79 岁、terminal 80 岁。

| Persona | 童年 | 成年早期 | 中年 | 晚年 | terminal summary |
|---|---:|---:|---:|---:|---:|
| martial-lin | 5 | 19 | 0 | 1 | 0 |
| scholar-su | 5 | 8 | 2 | 2 | 0 |
| wealth-shen | 9 | 18 | 9 | 0 | 0 |
| balanced-wei | 8 | 16 | 6 | 1 | 0 |

观察：

- 童年和成年早期通常有选择后的阶段摘要，能够把路线选择说出来。
- martial 的 30—49 岁没有 `periodSummary`，主要由行动摘要和少数事件承接；wealth 的 50—79 岁没有 `periodSummary`。
- 四条 Trace 都有 `finalState.ending`，但没有 terminal presentation payload。结局信息存在于正式状态，不足以证明 EndingScreen 的可见摘要、按钮和刷新读档行为。
- 行动摘要能完整对应 181 次 active action，但持续记录行动结果不等于持续解释“我是谁”或“这些行动为什么重要”。

## 7. Event and result repetition

### 7.1 Cross-life repetition

跨四条 Trace 的重复事件包括：

- `setback_injury`：7 次；
- `family_family_honor`：4 次；
- `family_reunion`：3 次；
- `setback_property_loss`：3 次；
- `birth_wuxia_family`、`origin_background`、`love_first_meet`、`family_marriage`、`family_child_born`、`ordinary_life`：各 4 次。

出生、婚姻、子女、正常寿终等共享内容可以是合理共同人生骨架；受伤、财产损失、家族团圆等在多个不同路线中重复，值得后续做内容密度和模板重复的人工体验核查，但不能只凭这些 ID 认定产品缺陷。

### 7.2 Wealth and balanced similarity

两条 Trace 的集合和顺序比较如下：

| 序列 | wealth | balanced | 共同 ID 数 | 集合 Jaccard | 最长共同子序列 |
|---|---:|---:|---:|---:|---:|
| 事件 | 56 | 47 | 38 | 0.644 | 34 |
| 选择 | 34 | 29 | 13 | 0.260 | 12 |
| 主动行动 | 43 | 47 | 3 | 0.500 | 18 |

两条人生共享的基础骨架很多，但关键分叉明显不同：

- wealth 选择商队认货、押镖、扩张商路、亲自带队和押注商路；最终 `businessAcumen = 75`、`money = 687`，并有商路、巨贾和行市压力的连续事件。
- balanced 选择账房稳扩，混合练功、游历、读书、社交和营商；最终 `businessAcumen = 32`、`money = -293`、`martialPower = 61`、`knowledge = 59`，并有文武调和和稳态守成事件。

两者同时有配偶和子女，且都没有达到 `richest_man` 的财富门槛，因此同为 `quiet_family_life` 在当前判定规则上可以机械成立；但相同的结局正文没有说明 wealth 的商路成败、债务代价、为何未到首富，也没有说明 balanced 的混合路线。这属于结局解释力不足，不应被描述为两条真实人生已经趋同。

## 8. Ending explanatory power

| Persona | Ending | 主要状态/路线 | 结局是否解释主轴 | 关键缺口 |
|---|---|---|---|---|
| martial-lin | `martial_god` | martialPower 93，训练和正道/神话路线回响 | 是 | 最终正式身份字段仍为空 |
| scholar-su | `great_scholar` | knowledge 109、comprehension 118，书院和读书路线 | 是 | 结局没有引用具体书院或关键事件 |
| wealth-shen | `quiet_family_life` | businessAcumen 75，商路、巨贾、债务、行市事件 | 否/不足 | 中性家庭文本吞没商路主轴和代价 |
| balanced-wei | `quiet_family_life` | 混合属性、文武调和、稳扩路线 | 部分 | 文武/商路混合过程没有进入结局解释 |

因此本样本支持以下判断：

```text
不是情况 A：两条人生并非高度接近；
不是情况 C：相同结局正文没有充分表达两条不同人生；
更接近情况 B：完整人生明显不同，但结局解释忽略了关键差异。
```

这里的“B”只针对当前四条固定样本的结局解释力，不等价于已经证明 EndingSystem 的全部规则都应重写。

## 9. Product issues, simulator bias and evidence gaps

### 9.1 Product issues supported by the trace payload

1. **中性结局解释不足**：wealth 与 balanced 的长期路线和状态差异明显，结局名称和正文完全相同，缺少关键主轴、成就边界和代价说明。
2. **身份/归属来源冲突**：正道、商路、学者等方向已被事件和 flags 使用，但 `identity`、`sect`、`title` 没有对应稳定正式值。玩家可见摘要无法持续回答“我现在是谁”。
3. **晚年反馈稀疏且行动摘要重复**：中晚年缺少新的行动结构；不同人生大量出现相同基础行动结果，阶段摘要覆盖不均，导致完整人生后段容易退化为数值循环。

第 3 项的“产品问题”仍需 Browser 人工体验确认；Trace 只能证明当前反馈 payload 的结构和重复程度。

### 9.2 Simulator bias, not product evidence

- 所有选择读取隐藏 effects，不能代表玩家理解和偏好。
- 三个专向 persona 各自将约 81% 主动行动集中到一个类别，重复是 persona 固定策略的强烈结果。
- 选择确定性、未归一化评分和候选顺序 tie-break 会影响事件路径；本报告没有把这些路径当作真实玩家路径。
- wealth/balanced 的结局相同不能单独证明真实玩家体验趋同；它同时受到 persona、oracle choice 和当前 EndingSystem 阈值的影响。

### 9.3 Evidence gaps

- 没有 Browser EndingScreen 的真实点击、继续按钮单次推进、1500ms 等待、Console、刷新/读档和 390px 证据。
- Trace 没有 terminal presentation payload，无法从 JSON 证明终局页面的可见布局和解释文本。
- 没有人工玩家在选择前的预期记录，因此无法判断 CLEAR、UNCLEAR 或 MISLEADING。
- 没有多 seed 的完整人生对照来估计同一 persona 内的随机差异；本报告不得把四条样本外推成全量人生分布。
- 没有把所有选择逐一做人工可见回响标注；24 个关键节点的 echo 统计是边界明确的抽样。

## 10. Top 3 complete-life player experience problems

1. **结局没有解释完整人生**：尤其是商路明显不同的 wealth 与 balanced 最终同文案，玩家无法从终局理解“为什么是这个结局”。
2. **身份方向不能稳定落到人生摘要**：叙事说过正道、商路或学术路线，正式 identity 却始终为空，长期归属感断裂。
3. **晚年选择缺少新的可见意义**：行动结构在 30 岁左右后基本不再扩展，收益递减和模板化摘要占据后半生，早期选择的长期回响也因此被重复行动稀释。

## 11. Unique next product Slice

### 推荐：C. 结局解释力修复

最小范围建议：保留当前正式 ending 判定条件，先为 `quiet_family_life` 增加能引用已存在正式状态、路线和代价的收束解释，至少让以下两类玩家能够在终局区分和理解：

- 商路/财富路线：商路成就、财富边界、债务或经营代价；
- 混合/平衡路线：文武调和、家庭锚点和未达到传奇门槛的原因。

验收应使用两条固定 Trace 加一条 Browser 真实路径，要求结局解释与公开状态一致、能说明主要人生主轴，并且不新增 PlayerState、Snapshot、identity source 或 Headless 专用终局定义。

### 明确不建议做什么

- 不把本报告当作真实玩家选择行为，去修正 `oracle_effect_score_v1`。
- 不因行动重复的 Headless 统计立即重做主动行动系统；先把 persona 固定策略与真实玩家证据分开。
- 不在本 Slice 顺带扩展身份模型或新增第二个身份来源。
- 不仅因为 ending ID 相同就更换全部 EndingSystem 规则；先修复终局解释，再用真实 Browser/玩家证据判断判定规则是否不足。
- 不把 `ordinary_life`、age-80 截断或 Headless `finalState.ending` 当成 Browser EndingScreen 验收。

## 12. Verification and change boundary

本轮只读分析使用既有四条 Trace，未新增分析脚本，未修改 Trace、游戏状态、选择策略、EndingSystem、Engine、Snapshot、Contract、Browser 或 P8/P11。

由于本轮只新增 Markdown 报告，没有重复运行全量 `npm test`、typecheck、build 或 Browser 验收；这些命令不会为只读报告提供新的运行行为证据，且现有终局 closure 基线已在此前验证通过。本轮应执行并记录的仓库检查为：

```text
git diff --check
```

若该检查报告前序 dirty 变更中的既有问题，应将其与本报告新增内容分开，不为本报告清理无关文件。

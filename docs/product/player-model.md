# 江湖世界玩家模型

> 状态：当前江湖人物模型权威规范；位于 [Game Product Foundation](game-product-foundation.md) 之下。
>
> 本文件负责江湖人物模型的具体语义；其范围内发生冲突时以本文件为准。不得覆盖上级游戏产品定位；历史文档不能指导新实现。不得通过新增兼容概念同时保留新旧两套模型。

本文件定义江湖世界的玩家状态模型。四项投入、六项核心属性、资源、特质、状态以及身份与故事事实属于不同类别，不得互相代替。

## 1. 顶层人物模型

| 类别 | 含义 |
| --- | --- |
| 四项投入 | 玩家把人生时间投入在哪里 |
| 核心属性 | 玩家目前具备什么能力和社会影响 |
| 资源 | 玩家拥有多少可消耗资源 |
| 特质 | 玩家相对稳定的个人特点 |
| 状态 | 玩家当前的临时处境 |
| 身份与故事事实 | 玩家客观上是谁、经历过什么 |

## 2. 四项投入

江湖世界有四项投入：武道投入、经世投入、仕途投入、隐逸投入。

投入不是职业、身份、固定剧情路线或互斥道路，而是玩家一生在四个方向上的累计投入。

正式规则：

- 四项可以同时发展；
- 不区分主方向和次方向；
- 不限制最多发展几项；
- 不需要玩家正式选择；
- 不存在加入、退出、转向、承诺、证明、锁定、完成或失败；
- 原则上只累计，不衰减；
- 不自动转换为属性；
- 不直接提高成功率；
- 不保证获得对应身份或成功型结局。

投入值表示“经过投入程度修正的人生时间”。

投入增量原则：

```text
投入增量 = 持续时间 × 投入程度
```

主动规划是主要来源，但关键选择、随机遭遇和被动卷入的长期经历也可以增加投入。是否增加投入取决于玩家是否实际付出了时间，不取决于内容被分类为事件还是剧情。

投入可以影响：

- 内容出现资格；
- 内容调度权重；
- 外界评价；
- 人生形态；
- 复合成就；
- 可选的人生里程碑回顾及事实解释（只读；不自动改变 Ending 判定）。

投入不得直接决定：

- 战斗能力；
- 科举、经营等成功率；
- 属性增长；
- 官职、财富、功力和身份。

正常界面只展示模糊投入阶段；调试模式可以显示具体数值、变化来源和命中条件。展示阶段由数值动态推导，不单独保存为业务状态。

## 3. 六项核心属性

- **功力**：综合武学能力。功力是唯一的综合武学成长数值。
- **体魄**：长期身体基础、耐受、抗病和恢复能力。
- **学识**：知识、理解、文化和学习能力。
- **人脉**：获取信息、寻求帮助和调动社会资源的能力。
- **名望**：知名程度和影响传播范围，不评价好坏。
- **侠义声誉**：外界对人物行为和品行的评价，允许负值、中立和正值。

名望和侠义声誉相互独立。

外功、内功、轻功、剑法等不再维护独立成长数值；具体功法和擅长领域通过特质、物品或故事事实表达。投入与属性互不换算，允许出现投入很高但能力一般、投入很深但最终失败的人生。

## 4. 非核心属性

- 日常银两余额不属于正式核心人物成长资源。角色的经济能力与持久经济基础由 [Wealth / Economy Product Contract v1](wealth-economy-product-contract-design.md) 定义：Wealth Capacity 表达粗粒度战略经济能力，Asset 表达具名、持久、可影响未来玩法的世界事实。
- 银两仍可作为世界观与事件叙事语言出现，但普通收入、普通消费以及练功、读书等非经济成长不得把银两余额作为通用成长税。正式 canonical 经济状态仅为 `wealthCapacity`；`PlayerState` 与 Snapshot 不再包含精确钱包余额或 numeric wealth 字段（Snapshot `3.16.0`）。现有物品、flags 或历史余额数值也不得自动推导为 Asset。
- 健康使用离散状态，例如康健、抱恙、重病、重伤、濒危。
- 具体疾病、伤势和长期影响使用附加状态。
- 精力作为长期数值删除。
- 行动机会成本由时间承担。
- 疲惫、虚弱等使用临时状态。

## 5. 特质、状态和故事事实

特质用于表达少量、相对稳定的个人差异，例如天资聪颖、善于经营、性情孤僻、擅长轻功。

特质没有经验、没有等级、不形成独立成长系统；只有确实影响选择、判定或叙述时才存在。

状态表示临时处境，例如重伤、中毒、受通缉、守丧、闭关。

故事事实记录会影响未来内容的重要经历，例如加入门派、担任官职、救过某人、持有信物。仅用于回顾的内容进入历史记录，不创建新状态字段。

### Status 的准入与生命周期约束

Status 只表达**当前仍然成立、后续人生演化确实需要识别的可变处境**。它不是事件文案、即时情绪或一次性后果的通用持久化标签；不因叙事中出现「疲惫」「烦躁」等词，就自动创建 Status。

- **必要且不可替代**：只有不创建该 Status 会造成具体的玩法或因果表达缺失，且现有属性、Trait、HealthStatus、故事 Fact、事件历史或一次性结算反馈不能恰当承担时，才允许提出新增。单纯丰富文案、增加装饰性标签或预留可能的未来用途，不构成理由。
- **类型严格受控**：Canonical Status 必须属于明确批准的有限类型集合。新增类型、改变含义或扩充适用范围需要独立的 Human 产品裁决；事件作者、内容生成器和 Auto Evolution 不得自行扩展，也不得通过新 flag、Fact 或其他字段绕过限制，制造同义的第二状态来源。
- **具有实际消费价值**：每种 Status 必须指出至少一项明确、合法且有意义的后续用途，例如事件资格、选择条件或内容分支；不能只在结算时添加一个名称而没有实际后续作用。用途须符合状态本身的语义，不要求一律产生数值惩罚或收益。
- **生命周期匹配游戏时间**：必须明确状态因何进入、在何种条件下退出、预期持续的时间尺度，以及跨月、跨年等时间推进后是否仍应成立。可以提出时间到期、具体事件解除或条件解除等不同方式，但只能采用已经具备正式产品授权与可靠执行能力的机制。无法合理跨越下一次玩家可感知时间节点的短暂感受，应优先通过事件叙事或一次性结果表达，而不是强行保留为持续 Status。
- **新增前核验**：新增提案必须能说明类型边界、进入与退出规则、时间适配、实际消费者以及玩家如何理解该状态；缺少其中关键环节时，不得先添加再指望未来内容补齐。

Status 的即时反馈与长期价值分别判断：对玩家重要且实际发生的 Status 变化，应按合法结算后的 canonical before/after 及时、清楚地反馈；这不等于该 Status 的长期用途或生命周期已经合理。既有 Status 是否值得持续保留，应结合具体消费者、内容可达性、恢复机会、玩家能否理解其持续意义及人生时间尺度审查。仅有自我恢复事件不足以证明持续 Status 的必要性；也不得因此自动判定所有现有生产者无效或直接删除 Status。如具体事件无法说明持续状态的必要性，应审查该事件的实际用途，不先增加通用时长、等级、自动衰减、恢复进度或持久化字段（PD-131）。

以上为新增和扩充 Status 的准入原则，不自动改变既有类型或执行机制。尤其是本文件 5.1 节对 `fatigued`、`anxious` 的二值、事件添加与移除、无时间自动衰减等现行约束仍然有效。若发现既有状态与人生时间尺度不匹配，应另行依据具体证据审查并裁决；不得借本条直接添加计时、自动恢复、层级或新的 Schema / Runtime 语义。

重要人物与人物关系的正式产品语义由 [Character / Relationship Product Contract v1](character-relationship-product-contract-design.md) 定义。该 Contract 位于本规范之下，不得覆盖本文件定义的玩家模型边界。

Generic Relationship Legacy Quarantine 的 active-content disposition、generic relationship boolean 的 concrete-person consumer boundary 与 future replacement 规则由 [Generic Relationship Legacy Quarantine Design](generic-relationship-legacy-quarantine-design.md) 与 PD-104 定义；该 decision 不授权 replacement NPC、Relationship v2 或 PD-103 自动 materialization。

有限 Sex-Variant Person Archetype 的正式语义由 [Sex-Variant Person Archetype Contract v1](sex-variant-person-archetype-contract-design.md) 定义；它只允许同一合法 Person Archetype 在核心人物语义不变时绑定有限 male/female identity variant，不授权 Generic Person Instantiation、NPC Generator 或开放式人物属性系统。

Parenthood 与子女 / 家庭生活的正式产品语义由 [Parenthood / Family Life Product Contract v1](parenthood-family-life-product-contract-design.md) 定义。该 Contract 位于本规范之下，与 Character / Relationship Contract 协作，不得覆盖本文件定义的玩家模型边界。`children` count 不能替代 concrete child identity / relationship semantics；child status 不能自动推导 succession；不建设通用 parenting / family quality 数值系统。

现阶段不建设通用 NPC 好感度或关系数值系统；人物关系优先由具体历史、具体 relationship 与后续确实需要消费的事件专属 Fact 表达。

### Discipline 与 Indulgence

通用的“自律积累”和“放纵积累”数值不属于正式玩家模型。

稳定的自律、享乐或懒散倾向由 Trait 表达。Trait 不生成对应的持久数值投影，也不形成等级或成长系统。

练功、读书和营生等长期行为只进入对应领域 habit。家庭投入、挫折和临时心理变化不得自动映射为通用人格数值。

`discipline` / `indulgence` 不参与全局 DailyEvent outcome 权重、正式事件全局 scheduling multiplier、收益 friction、Ending 分类或资格。内容标签与 P16 出身塑形中的同名单词不属于 PlayerLifeStates，禁止与玩家持久状态相互生成或同步。

### Training / Study / Business Habit

`trainingHabit`、`studyHabit` 与 `businessHabit` 是对应领域长期重复实践的累计记录，值域为 `0～5`。它们记录已经发生的持续实践历史，不表示 Trait、能力属性、路线投入、职业身份、人物原型或当前状态，也不进行年度或时间自动衰减。

三项 Habit 只能由具体主动行动或事件内容显式增加。禁止根据 Action category、Event tag、属性或金钱收益、成功失败、Trait、route flag、echo flag 或通用 repeat hook 自动推导。`training_habit`、`study_habit` 与 `business_habit` 不属于正式玩家状态，也不得与 Canonical Habit 相互生成或同步。

三项 Habit 只允许用于明确依赖长期实践的具体内容资格，以及玩家可见的实践积累、Life Memory 实践轨迹和纯描述性结局回顾。它们不得参与 DailyEvent 或 Formal Event 全局权重、普通 outcome 权重、人物原型、whole-life pacing、属性倾向、人生评价、身份判断、Ending 分类或资格。

Habit 可以开启一个新的路线选择机会，但不能单独证明玩家已经拥有该路线或身份。身份型内容必须使用明确路线/身份事实，并在确有必要时同时要求 Habit 门槛。

### Derived Life Milestone Domain & Core Feedback（PD-108 / PD-128）

Life Milestone 是**核心长期人生反馈与记录机制**，用于将玩家已经形成的实践、状态和经历翻译为可理解的人生印记。它可以反映正面成就、中性经历，以及确实发生的挫折、损失、失败和人生转折；是否值得记录取决于真实、重要且可理解的经历，不取决于人生价值正负。获得 Milestone 不等于获得正面评价。

正式数据关系为：

```text
Canonical Player Facts
+ Action History
+ Event History
+ Habit Trajectory
→ Derived Life Milestones
→ Player-visible Progress Feedback
```

#### 四个职责

Life Milestone 正式承担四个反馈职责：

1. **ACQUISITION（获得）** — 我刚刚形成了什么？
2. **POSITION（位置）** — 我现在已经形成了怎样的人生轨迹？
3. **PROSPECT（前景）** — 基于已经真实开始的实践，我正在接近什么？
4. **CONTINUITY（延续）** — 过去的投入后来产生了什么意义？

```text
Milestone（派生人生反馈）
!= Achievement（正式故事事实）
!= Identity
!= Title
!= Occupation
!= Route
!= Task
!= Reward
```

#### Kind 与 Tier

正式 Kind：

| Kind | 含义 |
| --- | --- |
| `progress_stage` | 实践深度阶段反馈；必须携带 Tier 1/2/3 |
| `turning_point` | 人生转折；禁止 Tier |
| `payoff_echo` | 往事回响 / 投入兑现；禁止 Tier |
| `synthesis` | 跨实践综合；禁止 Tier |

正式规则：

```text
category = 内容领域（study / training / business / mixed）
kind     = 人生反馈类型
tier     = progress_stage 的实践深度（仅 progress_stage 允许）
priority = presentation sorting（不得重新解释为 Tier）
```

```text
PROGRESS_STAGE → tier REQUIRED (1 | 2 | 3)
TURNING_POINT / PAYOFF_ECHO / SYNTHESIS → tier FORBIDDEN
```

```text
Tier = practice depth
Tier != life value
```

现有 catalog 允许不对称（例如 Study/Business 尚无 T3）。暴露不对称不等于授权补齐不对称。

#### Prospect

Prospect 仍由真实透明的部分证据驱动：

```text
!achieved
&& !expired
&& progressRatio > 0
&& progressRatio < 1
→ may become Prospect
```

Prospect 不是任务系统，也不是按 Kind hard-code 的特殊分支。事件派生 Milestone 在事件发生前 `progressRatio = 0`，自然不进入 Prospect。

#### 正式边界

Life Milestone 是只读派生结果，不属于新的玩家状态真相。

它不得替代或重新定义：

- Identity；
- Affiliation；
- Title；
- Occupation；
- Route；
- Achievement；
- Ending；
- Habit；
- Task；
- Reward。

Life Milestone 不得写入或修改：

- PlayerState；
- GameState；
- Snapshot state；
- save data；
- event scheduling；
- event conditions；
- choice conditions；
- active-action result；
- route eligibility；
- ending eligibility。

移除 Milestone 派生和展示后，原有游戏状态与运行流程必须仍然成立。

#### 与 Achievement 的区别

Achievement 是现有正式故事事实的一部分，可能由事件写入，并可能被后续事件、LifePath 或 Ending 消费。

Milestone 是对既有事实的解释性投影，不得进入现有 Achievement 字段，也不得被游戏逻辑作为条件消费。**玩家可见的成就/人生印记体验可以统一组织二者的展示和查询，但底层正式故事事实与派生反馈不得合并成竞争性的状态来源。**

```text
Achievement
= formal story fact

Milestone
= derived player feedback
```

#### 与 Identity、Title 的区别

Milestone 可以表达：

- 某个阶段达到过的水平；
- 某种持续实践已经形成；
- 某段经历获得了可理解的总结。

Milestone 不自动证明玩家当前正式是谁，也不授予正式社会头衔。

例如：

```text
Milestone：少年勤学
Identity：书生
Title：翰林学士
Habit：长期读书
```

这些概念可以同时存在，但不能互相替代。

#### 可使用的证据

第一阶段只允许使用可可靠解释的现有事实：

- canonical Habit；
- active-action history；
- event history；
- 经审核的 durable result facts；
- canonical current facts。

条件必须能够向玩家说明：

- 当前已经满足了什么；
- 尚缺少什么；
- 为什么获得该 Milestone。

#### 历史证据限制

只有现有历史能够可靠证明时，Milestone 才能声明：

- 曾经达成；
- 达成年龄；
- 达成依据。

当前可变数值可以用于“正在接近”的方向提示，但不得在缺少历史快照时伪造：

- 曾经达到过某个数值；
- 首次达到某个数值的年龄；
- 数值下降后仍应永久保留的历史成果。

原第一阶段不新增 Milestone unlock ledger 的实施边界保留为历史事实。根据 PD-128，已获得里程碑需要能被玩家可靠回顾：优先通过现有正式历史重建；若真实历史不足以可靠保存某次取得结果，可另行裁决最小的只读取得记录，且不得变成第二套角色或游戏状态。本次裁决不直接授权 Schema、save 或 ledger 实现。

#### Habit 边界

Habit 只证明长期实践已经形成。

Milestone 可以将 Habit 翻译为阶段反馈，例如：

```text
studyHabit 达到稳定积累
→ 读书成习
```

但不得把 Habit 或 Milestone 提升为：

- personality；
- Identity；
- Occupation；
- Affiliation；
- Title；
- Ending。

#### 透明优先

当前产品阶段以可理解性优先。

玩家可见的 Milestone 应明确展示：

- 名称；
- 描述；
- 达成依据；
- 当前进度或尚缺条件。

隐藏条件、模糊提示和探索型成就不属于第一阶段。

后续 presentation 可按 Kind / Tier 分化，但不自动授权 modal、稀有度、积分或奖励。

#### 核心获得体验、查询与人生回顾（PD-128）

Milestone 是人生过程中最重要的长期反馈和人生印记载体；允许正面、中性、负面的重要经历和挫折。是否纳入目录，应由真实、重要且可解释的经历决定，而不是只有正面成功才可获得。现有 Kind 与 Tier 不作为情感正负轴；`tier` 继续仅表示对应实践深度，不表示人生价值。

玩家获得 Milestone 时应得到明确、可理解的获得反馈，能看到名称、依据及其意义；游玩过程中应有清晰入口持续查询**当前人物**已获得的里程碑及可靠的待达成方向。当前目录规模、密度、是否需要某项补充内容不在此规定；如果人生重要经历缺少相应记录，应优先审查 Milestone 目录和合法事实证据，而不是另建平行人生评价系统。

**终局只要求人生可以正常结束。**复杂的 Ending 评价分类与独立人生总结均不是当前硬性核心概念。未来如提供终局回顾，应优先根据可靠的 Milestone 及其取得依据组织时间线、重点回顾或简单报告，不必须给人物盖棺定论，也不得反向改写事实。现有 Ending 运行结构与已持久化 Schema 的迁移需要单独核对和授权，本段不直接删除它们。

**单角色优先／跨人物边界（PD-129）：**Milestone 归属于当前人物及其人生，新人物不自动继承旧人物取得的里程碑或其他正式人生事实。跨人物玩家档案、历次人生统计、出生设定解锁、传承点数等均为未来**可选**方案；目前不规定应建立何种元进度系统、持久化方式、分值、奖励或跨局影响。先确保单角色体验成立。

### Family / Social life-state removal

`familyBond` / `socialMomentum` 已从 Canonical Player State 删除。

家庭语义由 Trait、spouse、children、具体 relationship 与事件专属 Fact 承载。
社交语义由 connections、reputation、具体 relationship 与事件专属 Fact 承载。
重要人物及其关系的具体设计、事实最小化和 shared-vs-character-specific 边界遵循 [Character / Relationship Product Contract v1](character-relationship-product-contract-design.md)。

不得建立替代的家庭／社交通用数值轴；不得从 Trait、tag、收益、echo flag、时间或成功失败自动推导。
上述语义不得作为全局事件权重、人物原型、身份判断或 Ending 隐藏轴。

### 5.1 Fatigued 与 Anxious

- `fatigued` 表示当前因持续或高强度消耗而尚未恢复的临时状态。
- `anxious` 表示当前因压力、危机、冲突或反复忧虑而尚未平复的临时状态。

两者均为二值 Status，可以同时存在。它们只由语义明确的具体事件添加或移除；Trait 不直接初始化 Status，也不进行年度或时间自动衰减。两者不具有 `level`、`severity`、`stack`、`value`、`duration` 或 `recoveryProgress`，不与 `constitution`、`healthStatus` 自动同步。

`fatigued` 与 `anxious` 只允许用于具体事件的 `status_has` 条件和明确的内容调度，不参与全局 DailyEvent outcome 权重、正式事件全局 scheduling multiplier 或全局收益 friction，也不参与 Ending 分类或资格、Life Memory 人生评价。当前不需要 `status_absent`。

## 6. 身份、归属、称号与人生方向

不得再使用一个通用 `identity` 或 `primaryIdentity` 字段概括“玩家是谁”。以下概念必须分开：

| 概念 | 正式语义 | 是否作为独立 canonical state |
| --- | --- | --- |
| Affiliation | 玩家当前客观所属的组织，例如少林、武当、丐帮、边关守军或幽影门 | 是，单一当前值 |
| Title | 世界内由明确事件正式授予的社会称号 | 是，可空 |
| Occupation | 商人、学者、官员、医者等长期从业方向 | 当前不建立通用状态 |
| Reputation / Life identity | 大侠、恶人、传奇、隐士等外界评价或人生概括 | 当前不建立通用状态 |
| Narrative direction | 武道、商路、仕途、学者、游侠等叙事方向 | 只作事件、摘要和分析的确定性派生 |
| Ending / Terminal | 人生可以正常结束；现有分类和写入路径属于当前运行与兼容事实，不构成必须持续扩展的人生价值评价体系 | 既有正式终局状态待有界核实；可选人生回顾只读派生（PD-128） |

### 6.1 Canonical Affiliation

正式组织归属为：

```ts
player.affiliation: AffiliationId | null
```

当前正式 ID 集合：

```text
shaolin
wudang
beggars
border
shadow_sect
```

规则：

- 当前最多一个 Affiliation；
- 可以加入、离开或转换；
- 不建立 affiliation history；
- 不支持多个组织并存；
- Snapshot 保存稳定 ID，不保存展示名称；
- 展示名称由正式 catalog 确定性派生；
- `player.sect` 与 `flags.current_sect` 不再作为平行来源；
- `sect_faction`、`lifePath.faction` 和 route flags 不自动等于 Affiliation，它们仍是阵营、调度或叙事信号。

### 6.2 Title

```ts
player.title: string | null
```

Title 只表示世界内明确授予的称号。

禁止：

- 根据属性自动计算 Title；
- 从 route、Affiliation 或 ending 推导 Title；
- 把 ending name 写入 `player.title`；
- 把 UI 临时标签当作正式 Title。

没有正式 producer 时，Title 保持 `null`。

### 6.3 Generic Identity 退出

以下结构不再属于正式玩家模型：

```text
state.identity
state.identity.primary
state.identity.identities
IdentityInfo
PlayerIdentity
IdentitySystem
lifePath.primaryIdentity
```

事件资格必须使用其真实条件，例如属性、明确 flags、关键经历、成就、Affiliation 或其他现有 canonical facts。不得通过新的通用身份分类器、事件文本解析或 event ID 猜测恢复上述模型。

### 6.4 玩家可见展示

玩家界面应分别展示：

```text
所属
称号
人生方向
重要经历
人生结束状态（可选人生回顾）
```

不得继续使用“暂无身份”概括玩家全部人生状态。

“商人”“学者”“大侠”“隐士”等词仍可出现在叙事和确定性摘要中，但不因此成为新的持久化 identity source。
## 7. 明确废弃

以下内容不再属于正式产品模型：

- 主路线和次路线；
- 最多承诺两条路线；
- `road commitment`；
- `road proof`；
- `locked_in`；
- 路线完成、失败和生命周期；
- 四项投入之间的强互斥、软互斥；
- 为改变投入设置转向事件；
- 将商人、官员、隐士等身份直接映射为投入方向；
- 通用 `state.identity`、`primaryIdentity` 和自动身份判定；
- 将 ending name 临时写入 `player.title`；
- 使用 `player.sect` 与 `flags.current_sect` 维护两个组织归属来源；
- 将外功、内功、轻功与功力同时作为成长值；
- 独立的悟性（`comprehension`）成长值；学习理解统一归入学识，天生禀赋由 Trait 表达；
- 长期精力值；
- 通用 discipline / indulgence 玩家成长数值轴；
- 通用 NPC 好感度系统。

## 8. 世界观边界

四项投入和六项属性属于江湖世界规则，不属于故事播放器不可替换的硬编码规则。

播放器未来可以抽象认识投入、属性、资源、特质、状态和故事事实，但本轮：

- 不实现多世界加载；
- 不创建插件系统；
- 不提前设计第二世界；
- 不修改事件机制。

## 9. 本规范范围之外

本轮不处理：

- 事件调度；
- 剧情连续性；
- 通用 NPC 关系 Runtime / 模拟系统；重要人物与人物关系的产品语义已委托给 [Character / Relationship Product Contract v1](character-relationship-product-contract-design.md)；
- 数值平衡；
- UI 全面改版；
- 多世界观实现；
- 故事内容扩充；
- 旧存档迁移算法。

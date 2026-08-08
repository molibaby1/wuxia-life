# 江湖世界玩家模型

> 状态：当前权威规范
>
> 发生冲突时以本文件为准。历史文档不能指导新实现。不得通过新增兼容概念同时保留新旧两套模型。

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
- 人生总结与结局描述。

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

- 金钱是资源，不是人物属性。
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

现阶段不建设通用 NPC 好感度或关系数值系统。

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

### Derived Life Milestone / 派生人生里程碑

Life Milestone 用于将玩家已经形成的实践、状态和经历翻译为可理解的阶段反馈。

正式数据关系为：

```text
Canonical Player Facts
+ Action History
+ Event History
+ Habit Trajectory
→ Derived Life Milestones
→ Player-visible Progress Feedback
```

Life Milestone 回答：

- 玩家已经形成了哪些阶段成果；
- 玩家当前正在接近哪些可能性；
- 已有数值、实践和经历对玩家而言意味着什么。

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
- Habit。

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

Milestone 是对既有事实的解释性投影，不得进入现有 Achievement 字段，也不得被游戏逻辑作为条件消费。

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

第一阶段不新增 Milestone unlock ledger。

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

### Family / Social life-state removal

`familyBond` / `socialMomentum` 已从 Canonical Player State 删除。

家庭语义由 Trait、spouse、children、具体 relationship 与事件专属 Fact 承载。
社交语义由 connections、reputation、具体 relationship 与事件专属 Fact 承载。

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
| Ending | 对完整人生的最终分类与解释 | 独立终局状态 |

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
最终结局
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
- NPC 关系系统；
- 数值平衡；
- UI 全面改版；
- 多世界观实现；
- 故事内容扩充；
- 旧存档迁移算法。

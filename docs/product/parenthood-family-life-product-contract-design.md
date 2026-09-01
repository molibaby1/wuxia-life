# Parenthood / Family Life Product Contract v1

```yaml
status: Accepted product contract
human_accepted: 2026-08-31
```

本文是 Wuxia-Life 的 Parenthood / Family Life Product Contract v1。它位于
[`docs/product/player-model.md`](player-model.md) 之下，与
[Character / Relationship Product Contract v1](character-relationship-product-contract-design.md)
协作。

Authority 边界如下：

- `player-model` 负责第一层玩家模型与 canonical player-state 边界；本 Contract 不覆盖第一层 Player Model。
- Character / Relationship Contract 负责具体人物、人物关系、恋爱与婚姻语义。
- 本 Contract 从 Parenthood 开始，定义子女与家庭生活的产品语义。
- 本 Contract 不把自身扩展解释为完整 Kinship、Succession、Family Legacy 或 Ending redesign。
- 本文是产品 authority，不是 Runtime Schema、Event Schema、implementation plan 或 PRD；本次 authority closure 本身不授权 Runtime / Schema / Event 修改，当前第一纵切的独立 Human implementation authorization 另见 PD-102。

## 1. 产品目标与核心判断

Parenthood 是玩家人生中的一种独立可能，而不是 Marriage 的自动后半段，也不是传统家庭结构的完成标记。产品要表达的是：一个具体孩子如何因真实人生内容进入玩家生活，之后如何通过具体经历、责任、选择和冲突继续成为一个可被引用的人物。

```text
Relationship / Marriage / Single Life
↓
Parenthood 是独立人生可能
├─ 进入 Parenthood
│   ↓
│ concrete child enters life
│   ↓
│ parenting experiences / responsibilities / choices
│   ↓
│ child continues as a concrete person
│
└─ 不进入 Parenthood
    ↓
    人生继续正常成立
```

正式关系分离为：

```text
Romance
≠
Marriage
≠
Parenthood
≠
Succession
```

恋爱不自动产生婚姻，婚姻不自动产生孩子。是否进入 Parenthood 必须来自具体人生内容、决定或事实，不能仅由以下条件自动推出：

```text
married
age
spouse exists
```

“这一次不进入 Parenthood”不等于终身拒绝。未来是否成为父母仍须由未来具体内容决定。

## 2. No-child life 是合法人生

不成为父母、暂不成为父母、最终没有子女，都是合法的人生形态。系统不得仅因缺少孩子自动产生以下评价：

- failure；
- regret；
- lonely；
- unfinished；
- 人生不完整；
- 其他把传统家庭结构置于更高位置的价值排序。

spouse、child 或 grandchild 可以改变人生内容，但系统不得因为玩家缺少这些事实就推导“未完成”“壮志未酬”“有明显遗憾”或“人生不圆满”。Ending 可以描述家庭差异，但不能把传统家庭结构作为统一 fulfillment proof。

本 Contract 不建立“是否有孩子”的人生价值排名，也不要求玩家必须接受或拒绝 Parenthood。

## 3. 进入 Parenthood 与家庭内容

进入 Parenthood 必须由具体内容承担因果责任。合法来源可以是具体决定、具体事实、具体家庭处境或其他未来明确设计的生活内容；不得由婚姻状态、年龄或 spouse 存在机械触发。

进入 Parenthood 后，内容可以围绕以下实际问题展开：

- 父母如何提供资源、教导和边界；
- 父母如何面对支持、反对、承担责任和形成冲突；
- 时间、风险、机会、事业取舍与价值冲突如何进入人生；
- 家庭成员如何参与玩家的重大人生事件。

这些是具体人生后果，不是一个统一的“家庭幸福”或“育儿质量”数值。

Parenthood 可以有成本、责任与冲突，也可以有支持、共同经历和新的机会；有成本不等于惩罚，没有成本也不等于产品成功。

## 4. Concrete child：子女不是数量包装

一个真正进入长期人生内容的孩子，必须可以稳定地作为**同一个具体人物**被后续内容引用。`children` count 只能表达粗粒度事实，不能把一个具体人物压缩成数量。

第一纵切允许只支持一个孩子。当前不要求：

- 姓名生成；
- 性别生成；
- 完整 Person Runtime；
- 完整性格；
- 完整人生模拟。

当前只定义内容真正需要的最小 identity。后续内容应优先读取 concrete child history / durable facts。既有 count 可以暂时保留，用于兼容或粗粒度事实，但不得用它替代：

- 某个具体孩子是谁；
- 亲子关系质量；
- 孩子的性格；
- 孩子的人生方向；
- successor qualification；
- 玩家人生价值。

父母与孩子的身份事实只证明家庭关系，不证明亲近、信任、喜爱或 relationship quality。Life Memory 等 presentation 不得因为 `children > 0` 人工制造 affinity / affinityBand。

## 5. Parenting agency 与 child agency

父母可以：

- 提供资源；
- 教导；
- 设边界；
- 支持或反对；
- 承担责任；
- 形成冲突。

但一次玩家选择不得直接宣布：

```text
孩子 = 武者
孩子 = 书生
孩子 = 商人
孩子 = 已婚
```

父母的选择可以形成影响、前史、机会或冲突，但孩子必须通过后续具体内容继续成为其自身的人物。不得因为替孩子作决定而直接给玩家普通属性奖励。

下列事实本身不能自动成为 achievement 或奖励：

- 有孩子；
- 子女成长；
- 家庭团聚；
- 子女成婚；
- 有孙辈；
- “家族兴旺”。

不得自动给予 `charisma`、`reputation` 或 `connections` 作为“家庭成功”奖励。若某个具体社会事件确实造成真实名望或人脉变化，可以由该事件的具体因果单独成立；不能因为 Parenthood status 本身奖励。

## 6. Parenthood、Succession 与 Family Legacy 分离

必须明确：

```text
has_child
!=
has_heir / has_successor
```

孩子不天然是：

- 家业继承人；
- 门派继承人；
- 武学传人；
- political successor。

`children` 数量也不得自动提升 successor quality。Succession 必须由独立、具体的人生事实证明。P18 等继承 / 接班语义属于独立 domain consumer；本 Contract 只规定 child status 本身不能自动证明 succession，不在本次 authority closure 中重做 P18。

Parenthood 不自动推导：

```text
child grows up
→ child marries
→ grandchild
→ family honor
→ fulfilled life
```

`family_child_marriage`、`family_grandchild_born`、`family_family_honor` 等旧语义不能作为 Parenthood Contract 的默认 progression。family status 也不构成统一 fulfillment ranking；Ending redesign 不在本 Contract 范围内。

## 7. 明确非目标

本 Contract 不建设或授权以下模型：

- fertility score；
- pregnancy progress；
- reproduction probability；
- wants-child score；
- parenting quality；
- family happiness score；
- 多子女模拟系统。

产品存在 Parenthood 不等于必须做生理模拟。当前也不建设通用 parenting score、family quality score 或替代性的隐藏家庭价值轴。

## 8. Family subdomain 边界

本 Contract 当前正式治理 Parenthood 与 Family Life 中直接围绕子女、父母责任和家庭生活语义的部分。它不把所有带有 `family` 名称的内容整体纳入，也不自动退休其他 Family subdomain：

- 当前 `family_crisis` 更接近 kinship responsibility；不因本 Contract 自动退休或重新设计。
- `family_family_precepts` 更接近 legacy / 家风；不因本 Contract 自动成为 Parenthood 内容。
- P18 的继承、接班和弟子培养消费者保持独立。
- EndingSystem 的家庭差异描述与 fulfillment 语义保持独立；本 Contract 只规定 family status 不得成为统一人生完成度评价。

这些领域后续如需变化，必须按各自产品语义单独判断。

## 9. Repository inventory：implementation reality 不覆盖 authority

以下是当前 repository inventory，不是本 Contract 的产品依据，也不能覆盖本 Contract：

- legacy `family_child_born` 已是 deferred asset；
- active runtime 已有 PD-102 addendum 明确授权的 Mingyue first Parenthood slice；
- `family-parenthood-deferred.json` 中仍保留依赖 `has_child` / `child_married` / `has_grandchild` 的 deferred legacy 后续内容；
- 这些内容当前不能因为仍作为 repository asset 存在就被解释为符合本 Contract。

至少以下语义正式降级为：

```text
legacy product semantics pending migration
```

- `married → family_child_born` 自动 Parenthood；
- `family_child_education` 由父母一次选择决定孩子完整人生方向；
- child education 为玩家直接发普通属性奖励；
- `family_child_marriage` 由父母直接决定 child marriage；
- `child_married → family_grandchild_born` 自动孙辈；
- “子孙满堂，人生圆满”；
- `family_family_honor` 把子女成就自动转换为玩家 `reputation` / `charisma`；
- synthetic child affinity presentation；
- `has_child → successor/heir`；
- `children` count → successor quality；
- spouse / children 缺失被用于推导统一人生 unfinished / regret。

这是一项 authority 降级与后续迁移依据；它不授权 deferred legacy family chain 回归，也不扩大 PD-102 addendum 之外的实现范围。不得把仍存在的 event、asset、fixture 或测试反向提升为产品 authority。

## 10. PD-090、PD-091 与 PD-092 的边界

PD-090 的 bounded economic decision 仍然有效：legacy child-birth wallet cost `money -50` / `-10` / `-20` 不恢复，不换成 Wealth Capacity，也不换成其他经济数值。PD-090 当时用于 Wealth migration，并未治理 Parenthood 产品模型。

因此，PD-090 中以下内容不再构成当前 Parenthood authority：

```text
shared child semantics 保持：
children +1
has_child = true
existing event scheduling / eligibility unchanged
```

它们是当时 bounded economic slice 的 implementation-preservation statement，不是对今后 child identity、Parenthood entrance、child lifecycle 或 family progression 的产品确认。

同理，PD-091 / PD-092 曾迁移 `family_child_marriage` 的 money semantics，不代表该 child-marriage event 的产品语义仍应 active。Economic migration correctness 和 Parenthood legitimacy 是两个不同问题。

## 11. 第一 Parenthood 纵切边界

后续独立 planning 只能从本 Contract 的边界开始。第一 Parenthood slice 的目标是：在已有具体关系 / 婚姻人生中，验证一个独立 Parenthood decision 如何产生一个 concrete child，并让一次早期 parenting experience 读取真实的 prior fact。

```text
existing concrete relationship / marriage life
↓
independent Parenthood issue
├─ enter Parenthood
│   ↓
│ after meaningful time
│ concrete child enters life
│ ↓
│ one early parenting experience
│ reads a real prior fact
│
└─ do not enter Parenthood now
    ↓
    relationship / marriage / life continues normally
```

第一 implementation sample 可以暂时基于：

```ini
spouse = 明月
married = true
```

这是当前唯一验证过的 concrete marriage 的 first implementation sample，不是产品上的 canonical rule；本 Contract 不把 marriage 设为 Parenthood 的必要前提。非婚生育、收养或其他家庭结构只有在未来出现真实内容需求时，才另行设计；本 v1 不提前建设通用框架。

第一纵切不包含：

- child education lifecycle；
- child marriage；
- grandchild；
- family honor；
- full succession；
- inheritance；
- multi-child simulation；
- late-life complete family biography。

## 12. Delayed abstraction 与 STOP 边界

延续 Character Contract 的 delayed abstraction：第一纵切不得因为需要一个 concrete child 就立即新增：

- generic Child Runtime object；
- Family Relationship schema；
- parenting stage machine；
- universal child archetype；
- child personality matrix；
- household simulation。

只有真实第二消费者证明共享语义必须 canonicalize 时，才抽最小稳定语义。若第一纵切发现必须修改以下任一边界，应 STOP 并重新提交 Human 决策，不得从本 Contract 自动推导授权：

- PlayerState top-level schema；
- Snapshot schema；
- generic Person Runtime；
- Relationship schema；
- universal Family Runtime。

本 authority closure 本身只授权后续独立 planning；本轮另有 Human 明确授权并由 PD-102 addendum 记录的 bounded first slice，可实施 independent Parenthood decision → concrete child → one early parenting experience。该授权不包含 Runtime schema、PRD、P18 redesign 或 Ending redesign。

## 13. 正式不变量摘要

- Parenthood 独立于 Marriage；Marriage 不自动产生孩子。
- Romance、Marriage、Parenthood、Succession 互不自动替代。
- no-child life 合法，缺少家庭事实不自动证明 failure、regret 或 unfinished。
- child 是可被后续稳定引用的 concrete person，不是 count、reward 或 successor projection。
- parenthood status 不自动产生普通属性奖励、achievement、affinity 或 relationship quality。
- Parenthood 可以产生责任、风险、机会和冲突，但不建立统一 parenting / family quality score。
- `has_child` 不等于 `has_heir` / `has_successor`。
- child marriage、grandchild、family honor 不是默认 Parenthood lifecycle。
- legacy implementation 只能作为 pending migration inventory，不能覆盖本 Contract。

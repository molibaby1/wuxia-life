# Wuxia-Life：familyBond / socialMomentum 删除设计

> 日期：2026-07-27  
> 状态：产品方案 C 与设计已确认，进入实施
> 建议仓库路径：`docs/superpowers/specs/2026-07-27-family-social-life-state-removal-design.md`  
> 当前静态基线：用户上传的 `project(7).zip`，内容与交接总结所述 `dev@1656f5e` 高度一致，但 ZIP 不含 `.git`，无法独立证明提交号  
> 范围：删除 `familyBond / socialMomentum` 及其直接 producer、consumer、Snapshot、UI、内容条件和验证资产

## 1. 权威与实施原则

权威层级：

1. `docs/product/player-model.md`
2. `docs/governance/project-convergence.md`
3. `AGENTS.md`
4. `docs/README.md`
5. 当前有效 Contract / Schema
6. 当前代码和测试只代表现状

本阶段遵循：

- 收敛优先；
- 不为了保留旧代码而保留旧概念；
- 不让旧测试、Pxx、proof、report 或内容资产反向定义产品；
- 不建立 migration、fallback、shadow state、兼容字段或数值换皮；
- 不把旧轴机械映射为 Trait、Fact number、Status、relationship level 或其他通用数值；
- 内容迁移必须依据具体语义，不做一对一字段替换；
- 不借机泛化重构整个关系系统、事件系统、Ending System、Pxx 或 Route Lifecycle。

## 2. 产品裁决

从 Canonical Player State 删除：

```text
player.lifeStates.familyBond
player.lifeStates.socialMomentum
```

删除后：

```ts
player.lifeStates = {
  trainingHabit,
  studyHabit,
  businessHabit
}
```

本阶段保留 `player.lifeStates`、`PlayerLifeStates` 和 `LifeStateKey` 的现有容器名称，不额外改名为 `habits`。原因是当前目标是删除两个未经批准的隐藏轴，而不是重做整个持久结构命名。

三项 Habit 继续维持既有 Canonical 定义：

> 对应领域长期、反复、实质性实践的累计轨迹。

它们不因本轮迁移获得任何新权限。

## 3. 删除原因

### 3.1 familyBond 的语义冲突

当前 `familyBond` 同时被用于表达：

- `affectionate` Trait 带来的重情倾向；
- 配偶、子女或亲族是否存在；
- 家庭关系亲密程度；
- 家庭责任和投入历史；
- 当前家庭热度；
- 家庭事件调度；
- 人物身份和人生归宿；
- Ending 资格。

它既由 Trait 初始化，又由具体事件增减，还会按年份自动衰减。这些来源无法共同构成一个稳定的 `0～5` 产品概念。

### 3.2 socialMomentum 的语义冲突

当前 `socialMomentum` 同时被用于表达：

- 一次或多次交游行为；
- 人脉资源；
- 名望和信用；
- 当前社交活跃程度；
- 社交路线和人物塑形；
- DailyEvent 全局正面概率；
- livelihood、emotion 和 Formal Event 调度；
- 属性倾向和人物身份；
- Ending 资格。

它还存在闭环：

```text
connections / reputation 等收益
→ socialMomentum 上升
→ 社交及营生事件更常出现、普通正面结果概率上升
→ 获得更多 connections / reputation
```

该结构重复现有属性，并形成未经 Canonical Player Model 批准的隐藏社交路线轴。

## 4. Canonical 语义回收

删除两个数值轴后，不建立统一替代物。有效语义分别回到已有明确结构。

### 4.1 家庭侧

```text
稳定的重情倾向
→ Trait，例如 affectionate

是否结婚、是否有配偶
→ spouse / married 等明确状态

是否有子女
→ children / has_child

照料、援助、承担或退出某次家庭责任
→ 具体事件选择、事件历史或该事件专属 Fact / flag

家庭归宿
→ 明确选择、明确关系事实或具体 Ending 前提
```

不得用一个通用分数重新聚合这些信息。

### 4.2 社交侧

```text
现实人脉资源
→ connections

公共声望
→ reputation

与具体人物或组织的关系
→ relationship / 明确关系 Fact

引见、结盟、担保、证名等经历
→ 事件专属 flag / Fact

稳定的人际倾向
→ Trait
```

`p9_echo_social_hook`、`p9_early_social_focus` 等历史 flag 即使继续存在，也只能保留其既有具体历史含义，不得生成新通用数值，不得作为 `socialMomentum` 的别名。

## 5. Contract 与数据模型

### 5.1 PlayerLifeStates

`LIFE_STATE_KEYS` 与 `PlayerLifeStates` 收窄为：

```ts
export const LIFE_STATE_KEYS = [
  'trainingHabit',
  'studyHabit',
  'businessHabit',
] as const;

export interface PlayerLifeStates {
  trainingHabit: number;
  studyHabit: number;
  businessHabit: number;
}
```

`createDefaultPlayerLifeStates()` 只接受三个正式 key；输入出现 `familyBond` 或 `socialMomentum` 必须报 unknown key，而不是忽略。

### 5.2 Trait 到 lifeState 的通用写入机制

当前仓库中，`startingStates` 唯一真实 producer 是：

```text
affectionate → familyBond +1
```

移除该 producer 后，以下通用结构不再有合法用途，而且会为未来 Trait 自动生成 Habit 留下错误扩展口：

```text
LifeStateModifier
CoreTalentConfig.stateBiases
WeaknessConfig.stateBiases
TemperamentConfig.startingStates
TraitSystem 中应用 startingStates / stateBiases 的逻辑
```

本轮一并删除这些接口和执行分支。

Trait 的 `eventBiases` 与 `autoChoiceBias` 不属于两个旧数值轴，可保留。

### 5.3 Event life_state_change

`life_state_change` 继续存在，只用于三项 Habit 的明确内容效果。

不得因删除两个 key 而删除该 Contract，也不得创建只为兼容旧内容的宽松字符串 target。

## 6. Producer 删除

### 6.1 Active Action

删除：

```text
p9_echo_social_hook
→ socialMomentum +1
```

具体实施边界：

- 删除 `mapEchoFlagToLifeState()`；
- 删除 `touchedLifeStates` 和随后对 `socialMomentum` 的写入；
- `onCompleteFlags` 仍照常记录 `p9_echo_social_hook`、`p9_early_social_focus` 等具体历史事实；
- 三项 Habit 继续只由显式 `habitEffects` 产生。

### 6.2 Formal Event 通用 producer

删除 `applyFormalEventConsequences()` 中：

```text
social / reputation tag
+ charisma / connections / reputation / influence 收益阈值
→ socialMomentum +1

family / romance tag
+ chivalry / reputation 收益阈值
→ familyBond +1
```

删除后，不建立任何基于 tag、收益、成功或失败的替代 producer。

若该方法移除这两段后不再承担其他职责，应删除整个方法及其调用，而不是保留空壳。

### 6.3 时间衰减

删除：

```text
socialMomentum > 2 → 每年 -1
familyBond > 3 → 每年 -1
```

若 `applyLifeStateRecovery()` 因此无其他合法职责，应删除整个方法及调用。

三项 Habit 不进行时间衰减。

### 6.4 DailyEvent producer

删除以下 `stateEffects`：

```text
daily_take_odd_job_pos_1     → socialMomentum +1
daily_small_trade_pos_1      → socialMomentum +1
daily_home_letter_pos_1      → familyBond +1
daily_shared_meal_pos_1      → familyBond +1
daily_household_burden_pos_1 → familyBond +1
```

保留同一 variant 的其他合法效果：

- 金钱变化；
- `fatigued` / `anxious` 的明确移除或添加；
- 文本和事件记录。

不为这些事件新增通用社会或家庭数值。

### 6.5 Formal Event 显式 effect

从以下事件选择中删除 `familyBond` 增减：

- `family_child_born`；
- `family_crisis`；
- 其他直接写入 `familyBond` 的内容。

保留其金钱、属性、Status、children、`has_child` 和事件专属 flag。

不为每个旧 `familyBond` delta 自动创建新 flag。已有 choice id、event history 或专属 flag 足以记录的，不重复造状态；未来确有内容消费者时再建立具体 Fact。

## 7. Consumer 删除

### 7.1 DailyEvent 全局 outcome

删除：

```ts
positive += socialMomentum * 0.08;
```

普通 DailyEvent 的 positive / neutral / negative 权重不得由已删除的社交轴替代性调节。

### 7.2 DailyEvent group multiplier

删除 `familyBond / socialMomentum` 对以下 group 的统一调节：

- `livelihood`；
- `family`；
- `emotion`。

`training / study` 当前返回 `1` 的行为保持不变。

若 `getGroupStateMultiplier()` 删除这两项后只会恒定返回 `1`，应删除该方法及调用，不保留无效抽象。

### 7.3 preferredStates 软权重

当前 `preferredStates` 的所有非空使用都指向 `familyBond / socialMomentum`。本轮删除：

- DailyEvent 配置中的全部 `preferredStates`；
- `DailyEventConfig.preferredStates` 类型；
- DailyEventSystem 中解释该字段的逻辑；
- 空数组残留。

这不会影响显式 `conditions` 或三项 Habit 的明确内容条件。

### 7.4 Formal Event 全局调度

删除：

```text
socialMomentum
→ business / social / reputation tag multiplier

familyBond
→ family / romance tag multiplier
```

`getFormalEventStateMultiplier()` 若因此无其他职责，应删除。

不得用 `connections`、`reputation`、Trait 或历史 flag 新建另一个通用全局 multiplier 来补位。

### 7.5 UI 与“人物塑形”

删除两个轴对应的：

- `habitShapingSummary.ts` 中的 `SHAPING_AXES`；
- “人情”“亲族”塑形摘要；
- “成形／定势／入骨”描述；
- `shaping_socialMomentum_up`、`shaping_familyBond_up` 反馈 flag；
- Active Action 的长期塑形反馈；
- ChoiceFeedbackGenerator 的相关输出；
- main screen 中由 `socialMomentum` 调整 connections / charisma / reputation 倾向排序的逻辑；
- 任何自我身份和长期人生主轴推导。

若 `habitShapingSummary.ts` 删除两个轴后无剩余职责，应删除该文件及全部导入。

三项 Habit 的玩家可见表达继续由 `practiceTrajectorySummary.ts` 承担，不得重新并入“塑形轴”。

## 8. 内容事件迁移裁决

内容不得执行：

```text
lifeStates.socialMomentum >= N
→ connections >= 任意拍脑袋阈值

lifeStates.familyBond >= N
→ married / has_child
```

每个事件按真实前提单独裁决。

### 8.1 社交内容：保留并改为明确前提

#### `p42_social_momentum_youth_introduction`

保留事件，改为现实社交资源前提：

```text
connections >= 5 OR reputation >= 10
```

同时删除标题、正文、description、metadata 中“社交势能”“塑形轴”等措辞，改为“已有门路或口碑带来的引见”。

#### `p28_social_momentum_network_fork`

保留事件，条件改为：

```text
connections >= 10
OR flags.p42_social_youth_intro_accepted == true
```

内容解释为已有实际门路形成可互相引介的网络，而不是抽象轴达到阈值。

#### `p28_social_reputation_reinforcement`

保留为明确链式后续，条件改为：

```text
flags.p28_social_network_opened == true
```

不再由通用社交值重复开启。

#### `p29_social_momentum_patron_obligation`

保留为明确人脉后果，条件改为：

```text
flags.ally_network == true
```

该 flag 已由 `p28_social_reputation_reinforcement / attend_banquet` 明确建立，能够证明玩家确实形成了可用同盟。

#### `p42_social_momentum_later_testimonial`

保留为晚年回响，条件改为：

```text
reputation >= 20
AND (
  flags.p28_social_reputation_reinforced == true
  OR flags.p29_social_patron_obligation_taken == true
)
```

这要求现实声望和明确长期社会经历同时存在。

#### `p29_social_momentum_healer_network`

保留医术交叉内容，条件改为：

```text
flags.medical_talent == true
AND (connections >= 10 OR reputation >= 10)
```

事件不再凭抽象社交轴让无医术前提的角色突然获得医者路径。文本和 metadata 改为“已有医术经历经口碑或人脉扩散”。

### 8.2 家庭内容：区分已有具体家庭事实与无依据亲族假设

#### `family_child_born`

保留。删除各选项的 `familyBond` effect 和选项文字中的“家庭牵绊 +N”。

`children +1` 与 `has_child` 已足以表达孩子出生；玩家选择仍由 choice / event history 记录。

#### `family_crisis`

保留。删除 `familyBond +1 / -1` 和对应选项提示文字。

不同选择继续通过金钱、reputation、`anxious` 和事件历史表达，不创建通用家庭评价分。

#### 以下五个事件

```text
p28_family_bond_elder_care
p28_family_bond_sibling_support
p28_family_bond_caretaker_obligation
p42_family_bond_festival_reunion
p42_family_bond_estate_trust
```

当前唯一入口是 `familyBond`，仓库中没有足以证明“长辈需要照料”“存在求助的手足”“长期担任家门看护者”“亲族长期自然聚拢”“被默认委托主持家产”的明确前置事实。

本轮裁决：

- 从当前有效事件池删除这五个事件；
- 同步删除 event manifest、P28/P42 proof、slice 和测试中的对应期待；
- 不改成无条件年龄事件；
- 不使用 `affectionate`、`married`、`has_child` 或 `connections` 机械替代；
- 不在本轮创建新的父母、手足或宗族模型。

未来只有在具体家庭关系事实已经由前置内容建立后，才可按新的独立设计重新引入类似事件。

## 9. Ending 迁移

删除 `EndingSystem` 中两个轴的全部读取。

具体裁决：

### 9.1 `richest_man`

删除：

```text
familyBond <= 2
```

家庭关系不得否决财富型结局资格。

### 9.2 `quiet_family_life`

`hasFamilyAnchor` 只允许由：

```text
Boolean(spouse) OR children > 0
```

构成，不再由抽象分数补足不存在的家庭。

现有 `retired`、成就与其他结局顺序保持原逻辑，不在本轮重新设计完整 Ending。

### 9.3 `hermit_life`

删除 `familyBond <= 1` 与 `socialMomentum <= 1` 条件。

本轮不添加替代隐藏条件；只保留该结局已有的明确事实条件。若删除后条件过宽，由聚焦 Ending 测试暴露，再以现有明确状态收窄，但不得恢复通用家庭／社交轴。

### 9.4 `bittersweet_success`

删除 `familyBond <= 1`。保留当前其他明确条件，例如负资产等。

### 9.5 `wanderer_life`

删除 `socialMomentum <= 1` 与 `familyBond <= 1`。保留 `connections` 和现有成就判断。

不得用 `reputation` 或 Trait 新建等价隐藏轴补位。

### 9.6 Ending 不变量

迁移后，两个已删除字段不可能再改变：

- Ending id；
- Ending category；
- Ending eligibility；
- Ending 排序；
- 后世评价。

家庭结局只能由配偶、子女、明确家庭选择或具体关系事实决定。

## 10. Life Memory、P20 与历史验证资产

### 10.1 Life Memory

删除 `familyBond / socialMomentum` 对以下内容的影响：

- 人生评价；
- historical memory tone；
- 自我身份；
- achievements / risks；
- 人物原型。

三项 Habit 的 `habitTrajectory` 保持既有窄描述语义。

### 10.2 P20 / P25 / HVG / P44 等切片

凡直接以两个旧轴为验证对象的切片、proof 或 audit，其产品假设已失效。处理原则：

- 删除只为证明 `familyBond / socialMomentum` 塑形、echo、权重或身份作用的切片；
- 从正式 test gate 移除对应失效测试；
- 若同一文件同时验证三项 Habit 的合法实践轨迹，只删除旧轴分支，保留三项 Habit 部分；
- 不为了让历史 proof 继续通过而在 runtime 保留兼容实现；
- 不借本轮重写整个 P20/P25/HVG 体系。

重点包括但不限于：

```text
src/p20/habitTrajectorySlice.ts
src/p25/habitTrajectorySlice.ts
src/p44/habitOperatorAudit.ts
src/hvg/p122MerchantSampleBaseline.ts
src/hvg/p127MartialSampleBaseline.ts
src/hvg/p129VisibleGrowthProofSlice.ts
以及相关 tests
```

“直接引用必须处理”不等于“重新审计全部 Pxx”。

## 11. Snapshot 3.8.0

Snapshot schema：

```text
3.7.0 → 3.8.0
```

升级原因：

- `familyBond / socialMomentum` 从正式 Player State 删除；
- 旧值来源混合了 Trait、echo flag、事件收益推导、DailyEvent、Formal Event、全局调度和时间衰减；
- 无法从最终数值可信重建为具体 Fact、relationship、connections 或 reputation。

规则：

```text
3.7.x 及更早 Snapshot
→ 严格拒绝
```

不提供：

- migration；
- fallback；
- shadow field；
- 数值清洗；
- 忽略旧字段后继续；
- 转换为 connections / reputation；
- 转换为 Trait / Fact / relationship；
- 根据 eventHistory 重算。

`3.8.0` 中 `player.lifeStates`：

- 必须是普通对象；
- 三个 Habit key 必须完整存在；
- 值必须是 `0～5` 的有限 number；
- 出现 `familyBond` 或 `socialMomentum` 必须拒绝；
- 任意其他未知 key 同样拒绝。

序列化方向同样严格：

```text
运行时 player.lifeStates 残留 familyBond / socialMomentum
→ toSnapshot() 失败
```

不得由 serializer 静默删除，以免掩盖残留 producer。

所有 `3.7.0` 固定断言、fixture、contract test 和文案同步升级到 `3.8.0`。

## 12. Canonical Guard 与测试

新增聚焦测试建议：

```text
tests/canonicalFamilySocialLifeStateRemoval.test.ts
```

并进入正式 `npm test` gate。

### 12.1 数据模型断言

证明：

- `LIFE_STATE_KEYS` 只有三个 Habit；
- 默认状态只有三个 Habit；
- unknown key 拒绝；
- Trait 配置和 TraitSystem 不再含 `startingStates / stateBiases`；
- `affectionate` 不初始化任何 lifeState。

### 12.2 Producer 断言

证明：

- `p9_echo_social_hook` 不生成 lifeState；
- Formal Event tag / 收益不生成 family/social state；
- 时间推进不执行相关衰减；
- DailyEvent 不产生两个旧 key；
- 正式内容不存在以两个旧 key 为 target 的 `life_state_change`。

### 12.3 Consumer 断言

证明：

- DailyEvent outcome 不读取旧轴；
- `preferredStates` Contract 不存在；
- DailyEvent group 不受旧轴影响；
- Formal Event 全局调度不读取旧轴；
- main screen、ChoiceFeedback、Active Action summary 不输出“人情／亲族塑形”；
- Life Memory 与 identity 不读取旧轴；
- Ending 不读取旧轴。

### 12.4 内容断言

证明：

- 六个保留的社交内容使用本设计中的明确条件；
- 五个无具体家庭前提的旧轴事件不在有效事件池；
- `family_child_born / family_crisis` 不再写入 `familyBond`；
- 内容和 metadata 不再出现“socialMomentum 驱动”“familyBond 驱动”“半性格轴”“长期塑形”等当前产品语义。

### 12.5 Snapshot 断言

证明：

- 当前版本为 `3.8.0`；
- `3.7.x` 及更早拒绝；
- `3.8.0` 缺少三个 Habit 任一 key 时拒绝；
- `3.8.0` 含两个旧 key 时拒绝；
- converter 与 validator 双向一致；
- runtime 残留旧 key 时序列化失败。

### 12.6 Repository Guard

窄扫描范围：

```text
src/
.ts / .tsx / .json
```

允许出现的位置仅限：

- 新 Canonical removal guard 本身如需列出 forbidden token；
- 明确的错误信息或拒绝测试（若放在 src 中，应尽量避免）。

正式 runtime 与内容中应为：

```text
familyBond references: 0
socialMomentum references: 0
```

不扫描 docs、历史 report、proof 输出和 tests 自身，避免守卫自匹配。

## 13. 验证命令与已知债务

完成迁移后执行：

```bash
npm test
npm run test:headless
npm run test:contracts
npm run typecheck
npm run typecheck:p6b
npm run build
```

预期：

```text
npm test               exit 0
npm run test:headless  exit 0
npm run test:contracts exit 0
```

以下正式命令仍允许只保留既有 Route Lifecycle 两条诊断：

```text
src/core/RouteStateManager.ts:248
src/core/RouteStateManager.ts:249
```

因此若未处理该已批准债务：

```text
npm run typecheck       exit 2
npm run typecheck:p6b   exit 2
npm run build           exit 2
```

不得在本轮机械修复 Route Lifecycle。

验证时必须确认没有新增第三条 TypeScript 诊断。

## 14. 明确非目标

本轮不处理：

- Route Lifecycle；
- 整个 relationship model；
- 父母、手足、宗族的完整数据模型；
- 全部家庭内容重写；
- 整个 Ending System 重构；
- 全部 Pxx、proof、report 的泛化清理；
- P25 中与本轮两个字段无关的旧 Habit 模拟问题；
- 三项 Habit 的再次裁决；
- `connections / reputation` 的产品重构；
- 其他事件质量 blocker / major / minor。

## 15. 完成标准

本阶段完成需同时满足：

1. Canonical 文档明确记录两个字段删除及无替代轴原则；
2. `PlayerLifeStates` 仅剩三个 Habit；
3. runtime、内容、UI、Life Memory 和 Ending 对两个字段引用为零；
4. Trait 不再能通用写入 lifeState；
5. DailyEvent `preferredStates` 软权重 Contract 删除；
6. 六个社交事件迁为明确属性／事实条件；
7. 五个无具体家庭前提的旧轴事件从有效事件池删除；
8. Snapshot 升级到 `3.8.0`，旧版本和旧 key 双向严格拒绝；
9. Canonical guard 进入正式 test gate；
10. 三套正式测试通过；
11. typecheck / build 除已批准 Route Lifecycle 两条诊断外无新增错误；
12. 未引入 migration、fallback、shadow state 或替代隐藏轴。

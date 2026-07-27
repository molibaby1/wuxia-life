# Wuxia-Life：三项领域 Habit 收窄设计

> 日期：2026-07-27
> 状态：产品设计已确认，尚未实施
> 建议仓库路径：`docs/superpowers/specs/2026-07-27-habit-practice-narrowing-design.md`
> 范围：`trainingHabit / studyHabit / businessHabit`
> 注意：当前 ZIP 不包含 `.git`，本设计文档未提交 Git。

## 1. 权威与范围

权威层级：

1. `docs/product/player-model.md`
2. `docs/governance/project-convergence.md`
3. `AGENTS.md`
4. `docs/README.md`
5. 当前有效 Contract / Schema
6. 当前代码和测试只代表现状

本阶段遵循：

- 收敛优先；
- 不以旧测试、Pxx、proof、report 反向定义产品；
- 不建立兼容层、shadow state、fallback 或数值换皮迁移；
- 不审计 `familyBond / socialMomentum`；
- 不泛化重构整个事件、P20 或 Ending 系统。

## 2. 问题

三项 Habit 当前同时承担：

- 行为记录；
- 单次收益自动推导；
- 人格塑形；
- 隐藏路线；
- 人物原型；
- 全局事件调度；
- 属性倾向修正；
- Life Memory 身份推导；
- Ending 身份叙述。

典型旧链路：

```text
一次主动行动
→ p9_echo_* flag
→ Habit +1
→ training_habit / study_habit / business_habit
→ 人物原型与全局事件权重变化
```

以及：

```text
Formal Event tag + 收益阈值
→ Habit +1
```

这使 Habit 成为未经 Canonical Player Model 批准的隐藏路线轴。

## 3. Canonical 定位

三项 Habit 保留，只表示：

> 玩家在对应领域通过反复、持续、实质性实践形成的累计实践轨迹。

```text
trainingHabit
= 长期反复练功、演练或进行武学实践的累计证据

studyHabit
= 长期反复读书、研习、整理知识或进行学术实践的累计证据

businessHabit
= 长期反复经营、账务、交易或进行营生实践的累计证据
```

它们不是：

- 当前勤奋程度；
- Trait 或人格；
- 能力、熟练度或核心属性；
- investments；
- 路线投入；
- 职业身份；
- 人物原型；
- Status；
- 成功次数；
- 通用人生主轴。

继续使用 `0～5`：

```text
0 = 尚无持续实践
1 = 有过一段实质性实践
2 = 已出现重复实践
3 = 形成稳定长期实践
4 = 长期深入
5 = 跨越多个人生阶段持续存在
```

规则：

- 单向累计；
- `0～5` clamp；
- 不做年度或时间衰减；
- 不自动同步 Trait、属性、investments、路线、身份或 Status。

## 4. Producer Contract

### 4.1 总规则

Habit 只能由内容显式声明。

禁止根据以下信息自动推导：

- Action category；
- Event tag；
- 属性或金钱收益；
- 成功失败；
- Trait；
- route flag；
- echo flag；
- Habit 阈值；
- 通用 repeat hook。

### 4.2 Active Action

为具体 `ActiveActionDefinition` 增加显式效果：

```ts
type PracticeHabitKey =
  | 'trainingHabit'
  | 'studyHabit'
  | 'businessHabit';

interface PracticeHabitEffect {
  state: PracticeHabitKey;
  value: number;
}

interface ActiveActionDefinition {
  // existing fields...
  habitEffects?: PracticeHabitEffect[];
}
```

`ActivePlanningService` 只应用 `habitEffects`，不再根据：

```text
category
onCompleteFlags
p9_echo_*
收益
```

推导 Habit。

允许：

- 一个季度或明确持续一段时间的练功、读书、营商行动显式 `+1`；
- 重复选择相同长期行动继续累计。

不允许：

- 一次短暂跑腿；
- 一次尝试；
- 一次偶发帮助；
- 一次成功交易；
- 仅因 category 为 `training / study / business` 自动 `+1`。

`onCompleteFlags` 可以继续承载具体剧情事实，但不得生成 Habit。

### 4.3 Formal Event

保留显式 `life_state_change`。

只有事件文本明确表达长期、持续或反复实践时，才允许增加 Habit。

删除 `GameEngineIntegration.applyFormalEventConsequences()` 中：

```text
training/risk tag + martialGain >= 8
→ trainingHabit +1

comprehension tag + academicGain >= 3
→ studyHabit +1

business tag + moneyGain >= 25 或 businessGain >= 1
→ businessHabit +1
```

当前四个显式 producer 裁决：

| 事件 / 选择 | 现有效果 | 裁决 |
|---|---:|---|
| `martial_arts_enlightenment / balanced_start` | `studyHabit +1` | 删除 |
| `p9_childhood_balanced_posture` | `studyHabit +1` | 删除 |
| `p9_childhood_first_trade` | `businessHabit +1` | 删除 |
| `childhood_preference / balance_both` | `studyHabit +1` | 删除 |

事件的其他效果不因此删除。

### 4.4 DailyEvent

删除：

```ts
longTermHooks.addTendency
longTermHooks.addStateOnRepeat
```

并删除相关类型与执行逻辑。

DailyEvent 只能通过具体 variant 的 `stateEffects` 显式增加 Habit。

当前明确保留：

```text
daily_training_bottleneck_pos_1
→ trainingHabit +1
```

其文本明确表达在同一瓶颈处持续练习很久。

### 4.5 Legacy flag 断开

删除：

```text
p9_echo_training_hook → trainingHabit
p9_echo_study_hook    → studyHabit
p9_echo_business_hook → businessHabit
```

以及：

```text
trainingHabit >= 1 → training_habit
studyHabit >= 1    → study_habit
businessHabit >= 1 → business_habit
```

主要入口：

```text
src/core/activePlanning/ActivePlanningService.ts
- mapEchoFlagToLifeState() 中三项 Habit 映射
- 三个 legacy habit flag 写入

src/core/GameEngineIntegration.ts
- mapLegacyHabitFlagToLifeState()
- projectHabitCompatibilityFlags()
- Formal Event 通用 Habit producer
- DailyEvent longTermHooks 执行
```

`p9_echo_*` 可以暂时作为具体历史事实存在，但：

- 不生成 Habit；
- 不等同 Habit；
- 不替代 Habit 条件；
- 不参与 Habit 重建。

## 5. Consumer Contract

### 5.1 允许：显式资格

Habit 可以用于具体内容条件：

```ts
player.lifeStates.trainingHabit >= 3
player.lifeStates.studyHabit >= 2
player.lifeStates.businessHabit >= 3
```

前提是内容确实依赖过去长期、重复的对应实践。

适合：

- 多年练功后的技艺回响；
- 长期读书后的论学、医案或编纂；
- 长期营生后的账务、商号或交易责任；
- 跨人生阶段的实践回调。

### 5.2 可以开启机会，不能确认身份

Habit 可以解锁一个选择机会，但不能证明：

- 已经成为武者、书生或商人；
- 已经进入某条路线；
- 属于某个人物原型；
- 拥有职业身份。

身份型事件应使用：

```text
明确路线/身份事实
AND Habit 门槛
```

而不是：

```text
路线事实
OR Habit
OR legacy habit flag
```

### 5.3 不允许 Habit 权重

Habit 只允许作为显式资格条件，不允许作为软权重。

因此：

- 删除普通 DailyEvent 中 Habit `preferredStates.weightMultiplier`；
- 真正需要长期实践的 DailyEvent 改为明确 `conditions`；
- 不需要该前提的事件直接移除 Habit 偏好；
- Formal Event 不得因 Habit 获得统一调度 multiplier。

### 5.4 删除 legacy condition fallback

删除：

```text
lifeStates.*Habit >= N
OR flags.has('*_habit')
```

迁移后只有 Canonical `player.lifeStates.*Habit` 表达长期实践。

### 5.5 删除全局调度

删除：

```text
src/core/DailyEventSystem.ts
- getGroupStateMultiplier() 中 trainingHabit / studyHabit

src/core/GameEngineIntegration.ts
- getFormalEventStateMultiplier() 中 training / comprehension Habit multiplier
```

Habit 不再改变：

- DailyEvent group 权重；
- Formal Event tag 权重；
- 普通 outcome；
- 普通收益；
- friction；
- 全局成功失败计算。

### 5.6 删除人物原型和人生节奏

三个 legacy habit flag 不再作为 P20 `growthPatternFlags`。

Habit 不得参与：

- `ArchetypeFamilyConfig.familyKind`；
- 人物原型识别；
- opportunity/risk multiplier；
- whole-life pacing；
- payoff/callback 全局权重；
- 人生类别；
- 路线身份。

本阶段只移除 Habit 输入，不重构整个 P20。

### 5.7 删除属性倾向修正

删除 Habit 对 `mainScreenModel.tendencyContextMultiplier()` 的输入。

长期做过某类事情不等于：

- 当前最强属性；
- 稳定人格；
- 路线身份；
- 属性排序修正依据。

### 5.8 保留玩家反馈

统一改为“实践积累”语言：

```text
练功实践有所积累
读书实践有所积累
营生实践有所积累
```

不再使用：

```text
塑形
半人格轴
成长主轴
定势
入骨
以武立身
文气入骨
```

展示层级：

```text
0 = 尚无长期积累
1 = 有过实质实践
2 = 开始重复
3 = 较为稳定
4 = 长期深入
5 = 贯穿多个阶段
```

### 5.9 Life Memory

`LifeMemorySummary.habitTrajectory` 可以保留，只记录：

```text
练功实践：较为稳定
读书实践：长期深入
营生实践：开始重复
```

Habit 不得改变：

- achievements；
- risks；
- historical memory tone；
- 人生评价；
- 自我身份判断。

Habit 不再作为 `inferLivedSelfUnderstanding()` 的身份依据。

### 5.10 Ending

允许纯描述性实践回顾：

```text
回顾一生，读书实践持续时间最长，练功也曾形成稳定积累。
```

不得改变：

- Ending id；
- category；
- eligibility；
- 排序；
- 后世评价；
- 人物身份。

重写：

```text
buildLateLifeShapingRecapLine()
→ 纯实践轨迹回顾
```

删除：

```text
buildShapingPatternEndingTone()
```

### 5.11 展示工具拆分

当前 `src/utils/habitShapingSummary.ts` 混合处理三项 Habit、`socialMomentum` 和 `familyBond`。

实施时应把三项 Habit 收敛为独立实践轨迹模块，例如：

```text
src/utils/practiceTrajectorySummary.ts
```

它只处理：

```text
trainingHabit
studyHabit
businessHabit
```

不得借机裁决或重写：

```text
socialMomentum
familyBond
```

## 6. Snapshot 与兼容边界

### 6.1 Schema

```text
3.6.0 → 3.7.0
```

旧 Snapshot 无法判断 Habit 数值来自合法长期实践还是已否决自动推导。

规则：

```text
3.6.x 及更早版本全部拒绝
```

不提供：

- migration；
- fallback；
- shadow field；
- 数值清洗或折算；
- eventHistory 重算；
- 根据 flag 重建；
- 重置为零后继续加载。

### 6.2 Forbidden flags

`3.7.0` 中禁止：

```text
training_habit
study_habit
business_habit
```

Validator 与 Converter 检查：

```text
state.flags
state.player.flags
eventHistory[*].stateSnapshot.flags
eventHistory[*].stateSnapshot.player.flags
```

发现即：

```text
SNAPSHOT_FORBIDDEN_FIELD
```

不得忽略、静默删除或转换。

### 6.3 双向失败

`toSnapshot()`：

- 运行时存在 forbidden flag 时直接失败；
- 不得静默清理。

`fromSnapshot()`：

- 拒绝旧 schema；
- 拒绝 forbidden flag；
- 不合并后继续。

## 7. 主要目标入口

预计涉及：

```text
docs/product/player-model.md

src/types/activeActionTypes.ts
src/types/eventTypes.ts

src/core/activePlanning/ActivePlanningService.ts
src/core/GameEngineIntegration.ts
src/core/DailyEventSystem.ts

src/data/life/dailyEvents.ts
具体 Formal Event 数据文件

src/components/mainScreenModel.ts
src/core/deriveLifeMemorySummary.ts
src/core/EndingSystem.ts
src/core/activePlanning/periodSummaryBuilder.ts
src/core/ChoiceFeedbackGenerator.ts
src/utils/habitShapingSummary.ts
可能新增 src/utils/practiceTrajectorySummary.ts

P20 人物原型相关运行时代码

src/contracts/gameStateSnapshot.ts
src/contracts/validation/contractValidation.ts
src/contracts/fixtures/gameStateSnapshotAge50.ts
src/headless/snapshot/SnapshotConverter.ts
相关 contract fixtures
```

实施时只修改真实存在且直接违反 Contract 的入口。

## 8. 明确非目标

- 不裁决 `familyBond / socialMomentum`；
- 不修复 Route Lifecycle 两条既有诊断；
- 不重构整个 Event System；
- 不重构整个 P20；
- 不重构整个 Ending System；
- 不清理全部 Pxx、proof、report、baseline；
- 不治理无关 legacy flags；
- 不把 Habit 合并进 investments；
- 不新增 Habit Engine；
- 不新增 repeat counter、duration、level、XP 或熟练度系统。

## 9. 测试迁移

### 9.1 旧测试

`tests/canonicalDisciplineIndulgenceRemoval.test.ts`

保留：

- 五项 Canonical `lifeStates`；
- discipline/indulgence 不回流；
- 合法 Trait 和同名非 lifeState 概念。

删除或反转：

- DailyEvent 全局调度必须读取 Habit；
- Formal Event scheduling 必须读取 Habit。

`tests/personalityHabitTrajectoryTests.ts`

保留：

- Habit 范围与 clamp；
- Canonical Habit 条件读取；
- 合法显式 Habit gate；
- 描述性实践轨迹。

删除或改写：

- compatibility flag 投影；
- echo flag 自动生成 Habit；
- Habit 决定 P20 archetype；
- Habit 改变全局调度；
- Habit 作为身份。

`tests/p43ArchetypeRecapEndingTests.ts`

保留：

- 不暴露内部 key；
- 描述性实践回顾；
- `habitTrajectory` 展示。

删除：

- `buildShapingPatternEndingTone()` 身份化断言；
- Habit 决定结局人格语气。

Active Action 测试验证：

- 只应用显式 `habitEffects`；
- 未声明 effect 不增加 Habit；
- 不生成 legacy habit flag；
- clamp `0～5`。

### 9.2 新 Canonical 测试

新增：

```text
tests/canonicalHabitPracticeNarrowing.test.ts
```

加入：

```text
tests/runRealTestGate.ts
```

覆盖：

#### Producer

- Active Action 只应用显式声明；
- category 不自动生成 Habit；
- Formal Event tag/收益不自动增加 Habit；
- `p9_echo_*` 不生成 Habit；
- DailyEvent 旧 `longTermHooks` 不存在；
- 已批准显式 producer 正常生效。

#### Consumer

仅改变三项 Habit，在没有显式 Habit gate 时，以下不变：

- 普通 DailyEvent 候选与权重；
- 普通 DailyEvent outcome；
- Formal Event 调度；
- Formal Event 非 Habit 收益；
- P20 archetype；
- whole-life pacing；
- 属性倾向排序；
- Ending id/category/eligibility；
- 人生评价；
- 自我身份判断。

#### 合法差异

允许：

- 显式 Habit gate 资格；
- 实践积累反馈；
- `habitTrajectory`；
- 纯描述性晚年回顾。

#### Snapshot

- schema 为 `3.7.0`；
- `3.6.0` 及更旧版本拒绝；
- forbidden flag 在顶层、player、嵌套历史快照中拒绝；
- serializer 拒绝运行时 forbidden flag；
- 不存在 migration/fallback。

### 9.3 Repository Guard

扫描：

```text
src/
.ts
.tsx
.json
```

不扫描：

```text
tests
docs
reports
proof
生成物
```

禁止机制：

```text
training_habit
study_habit
business_habit

mapEchoFlagToLifeState 中三项 Habit 映射
projectHabitCompatibilityFlags
mapLegacyHabitFlagToLifeState

按 tag 或收益阈值自动增加 Habit
Habit 参与 DailyEvent group multiplier
Habit 参与 Formal Event state multiplier
Habit 参与 P20 growthPatternFlags
Habit 参与 tendencyContextMultiplier
buildShapingPatternEndingTone
```

合法引用：

```text
trainingHabit
studyHabit
businessHabit
life_state_change
stateEffects
habitEffects
显式条件
habitTrajectory / practiceTrajectory
```

Guard 应匹配禁止机制，而不是禁止合法字段名。

## 10. Consumer 不变量

仅改变：

```ts
player.lifeStates.trainingHabit
player.lifeStates.studyHabit
player.lifeStates.businessHabit
```

没有显式 Habit gate 时，以下保持一致：

```text
普通 DailyEvent 候选与权重
普通 outcome 权重
Formal Event scheduling
Formal Event 非 Habit 收益
人物原型
whole-life pacing
Ending id/category/eligibility
属性倾向排序
历史评价
自我身份判断
```

只允许变化：

```text
显式 Habit gate 资格
实践积累反馈
实践轨迹回顾
```

## 11. 成功标准

1. `docs/product/player-model.md` 写入本次 Canonical 裁决；
2. 三项 Habit 只有显式 producer；
3. Active Action 使用显式 `habitEffects`；
4. Formal Event 不再按 tag/收益自动加 Habit；
5. DailyEvent 旧 `longTermHooks` 删除；
6. 三个 legacy habit flag 不再产生、读取或持久化；
7. Habit 不再参与全局事件调度；
8. Habit 不再参与 P20 archetype 和 whole-life pacing；
9. Habit 不再修正属性倾向；
10. Life Memory 与 Ending 只保留描述性实践轨迹；
11. Snapshot 升级到 `3.7.0`；
12. 新 Canonical 测试覆盖 Producer、Consumer、Snapshot 与 guard；
13. 既有 energy、health、fatigue/anxiety、discipline/indulgence 边界不回归；
14. 不触碰 `familyBond / socialMomentum` 的产品裁决；
15. typecheck/build 仍只允许保留已批准的：

```text
src/core/RouteStateManager.ts:248
src/core/RouteStateManager.ts:249
```

正式验证目标：

```text
npm test               exit 0
npm run test:headless  exit 0
npm run test:contracts exit 0
```

## 12. 最终结论

```text
trainingHabit
studyHabit
businessHabit
= 领域长期重复实践记录
```

允许：

```text
显式长期行动或内容增加
显式内容资格
玩家可见实践反馈
Life Memory 实践轨迹
Ending 纯描述性回顾
```

禁止：

```text
单次收益或标签自动推导
legacy flag 双向映射
Daily/Formal 全局权重
人物原型
隐藏路线
属性倾向修正
身份判断
Ending 分类或资格
```

该设计完成后，三项 Habit 将从“隐藏人物塑形轴”收敛为单一、可解释、可测试的长期实践记录。

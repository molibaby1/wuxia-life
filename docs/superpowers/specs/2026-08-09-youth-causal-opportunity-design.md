# 青年重大机会因果化设计

> 状态：产品语义已批准，等待实施计划批准后执行。
>
> 适用范围：14～20 岁门派、爱情、幽影门与武林大会四条线，以及窗口内直接后续。

## 1. 背景与问题

当前青年阶段的重大事件主要由精确年龄和最高优先级驱动。玩家到达特定年龄后，会依次遇到门派选择、爱情初遇、幽影门邀请和武林大会邀请。现有目录虽然包含大量事件，但重大事件大量进入 critical / mandatory 层，选择也常写入相同的后续标记，因此形成以下体验：

- 年龄像剧情发放器，而不是机会概率的背景条件；
- 人物此前如何生活，对重大事件是否发生影响不足；
- 未加入门派、未恋爱、未参加大会不是被承认的人生形态；
- 选择改变即时数值，但不改变后续事件集合；
- 冲突和转折以固定桥段出现，而不是由已有承诺碰撞产生。

本阶段不以增加事件数量解决问题，而是验证一个更小的产品命题：

```text
Existing Canonical Facts
+ Prior Event History
+ Age Opportunity Window
→ Causal Eligibility
→ Optional Major Opportunity
→ Choice-dependent Future Eligibility
```

## 2. 目标

完成后必须成立：

1. 年龄只决定事件可以在哪段人生出现，不再单独使重大事件必然发生；
2. 四条目标线都允许永久不发生；
3. 玩家改变一个有意义的前置选择时，后续重大事件集合会发生可验证变化；
4. 至少一处冲突要求玩家失去已经拥有的一项价值；
5. 至少一处反转由既有组织和关系事实产生，而不是凭空投放新人物或随机阴谋；
6. 不新增 PlayerState、GameState、Snapshot、Contract 或存档版本；
7. Local、API、Headless 与 Browser 继续消费同一正式事件和状态语义。

## 3. 非目标

本阶段不做：

- 扩充事件池；
- 建设通用 NPC 模拟、好感度或日程系统；
- 建设新的 Route State、Identity、隐藏人格轴或命运值；
- 重写全部 425 个正式事件的优先级；
- 统一全部 `triggers.random` 语义；
- 修改 DailyEvent、Milestone、Ending、UI 或结果交互；
- 改造 20 岁以后与本阶段四条线无直接关系的剧情；
- 为被删除的重复事件保留兼容、fallback 或迁移。

## 4. 可使用的事实来源

事件资格只允许依赖现有正式来源：

- `player.affiliation`；
- `martialPower`、`reputation`、`connections`、`chivalry` 等现有玩家属性；
- `lifeStates.trainingHabit` 等 Canonical Habit；
- `eventHistory` 和现有 `event_record` 产生的具体故事事实；
- 当前健康状态和临时状态，但仅在具体内容确实需要时使用。

不得把以下内容提升为新的正式资格来源：

- Life Milestone；
- 自动 persona、Trace 标签或测试样本名；
- 事件正文关键词；
- 已退出的通用 Identity 或 Route Lifecycle；
- 新增的隐藏累计分数。

## 5. 共同调度规则

### 5.1 年龄窗口

目标事件使用年龄范围，但不得仅凭年龄进入必然层。窗口结束时仍不满足条件，事件永久不发生，不补发替代重大事件。

### 5.2 故事线与强制层

四条目标线：

- 不使用 `priority: 0`；
- 不使用 `critical`、`mandatory` 或 `mainline` 调度标签；
- 可以使用 `storyLine` 作为非持久化调度元数据；
- 只有满足因果条件后才进入 storyline 层。

`storyLine` 不是玩家状态，不写入 Snapshot，也不得成为第二套 Route。

### 5.3 候选池最小修正

当前候选池先对全部事件排序并截取 12 项，可能在分层之前丢弃已经满足条件的 storyline 事件。本阶段只修正这一点：

```text
Eligible Events
├─ critical events: 全部保留
├─ storyline events: 全部保留
└─ regular formal events: 现有排序后最多保留 12 项
```

后续选择顺序继续使用现有层级：critical → storyline → regular → daily。

本阶段不改变：

- 各层内部的加权选择；
- 年度压力和重复抑制；
- DailyEvent fallback；
- 全局 priority 数值约定；
- `triggers.random` 的运行语义。

## 6. 门派机会

### 6.1 正式入口

保留并重构 `sect_choice`，删除重复的 `sect_path_choice`。

机会窗口为 14～18 岁。资格为：

```text
无当前 Affiliation
AND 尚未发生 sect_choice
AND (
  trainingHabit >= 1
  OR martialPower >= 15
  OR events.has("training_focus")
  OR events.has("preteen_training")
)
```

### 6.2 内容语义

事件改为家族、师长或既有江湖联系人提出的拜师机会，不宣称所有门派同时主动招募玩家。

保留的选择：

- 申请少林；
- 申请武当；
- 留在家中继续生活。

删除峨眉选择。当前 Canonical Affiliation 不包含峨眉，不得通过旧 flag 冒充正式归属。

“留在家中”是正式关闭结果：

- 不写入正派或游侠 route；
- 不推断玩家厌倦正派；
- 不自动提高幽影门邀请资格；
- 后续仍可因独立经历遇到其他组织机会。

## 7. 爱情机会

### 7.1 唯一入口

保留 `love_first_meet`，删除 `meet_love_interest`。

机会窗口为 15～20 岁。资格为：

```text
尚未发生 love_first_meet
AND 尚未开始其他爱情线
AND (
  connections >= 5
  OR events.has("jianghu_experience")
  OR 当前已有 Affiliation
)
```

这表示玩家必须先进入真实的社会场景，年龄本身不产生恋人。

### 7.2 初遇选择

- 主动结识：写入 `love_started`，允许爱情后续；
- 试图吸引：根据现有 outcome 条件产生不同即时结果，只有实际建立关系的结果写入 `love_started`；
- 继续赶路：只记录此次错过，不写入 `love_started`。

事件继续保持 once。选择继续赶路后，本阶段不补发另一位恋人。

### 7.3 后续因果

`love_after_greet` 可以作为对成功结识的即时反馈，但不得反向制造尚未发生的长期承诺。

`love_shared_mission` 不再只因 `love_started` 自动发生；还必须满足 `events.has("jianghu_experience")` 或当前已有 Affiliation。

`love_family_obstacle` 的两个选择不再写入同一个通用 `love_conflict` 以解锁相同后续：

- 接受考验：使用现有 `love_family_obstacle_prove` 事件记录，阻止情敌和自动分离链；
- 暂时避让：使用现有 `love_family_obstacle_avoid` 事件记录，允许情敌压力出现。

`love_rival_appears` 的选择产生不同后续：

- 正面对决：使用 `love_rival_duel`，不触发自动分离；
- 暂时退让：使用 `love_rival_withdraw`，允许 `love_separation`；
- 设法调停：使用 `love_rival_mediation`，保留关系代价但不自动分离。

`love_separation` 只允许由 `love_rival_withdraw` 等明确未解决事实触发，不再消费所有选择共有的 `love_rival`。

## 8. 幽影门机会

### 8.1 唯一链路

正式链路为：

```text
demonic_encounter
→ 接受初步接触
→ outlaw_identity_beginning
→ 加入或拒绝
```

删除 `identity-outlaw.json` 及其 EventLoader / events index 接线。该文件中的入口、修炼、导师、良心选择和合法性争论与 `identity-demon.json` 形成第二套并行幽影门链，不保留兼容。

### 8.2 初步接触

`demonic_encounter` 窗口为 14～18 岁。资格为：

```text
无当前 Affiliation
AND chivalry <= 20
AND (
  events.has("setback_injury")
  OR events.has("jianghu_experience")
)
```

接受初步接触时：

- 可以获得具体师徒关系或一次有限传授；
- 记录 `demonic_encounter_accept`；
- 不立即设置 `shadow_sect` Affiliation；
- 不写入通用 route。

拒绝时记录 `demonic_encounter_decline`，正式邀请不再出现。

### 8.3 正式邀请

`outlaw_identity_beginning` 窗口为 15～20 岁。资格为：

```text
events.has("demonic_encounter_accept")
AND 无当前 Affiliation
AND 尚未发生 outlaw_identity_beginning
```

正文不得预设“你厌倦正派”或“你已经决定加入”。选择为：

- 加入并效忠；
- 加入但保留底线；
- 明确拒绝。

只有实际加入的 outcome 设置 `player.affiliation = "shadow_sect"`。拒绝只记录选择事实，不写入 Affiliation，也不安排替代邀请。

## 9. 武林大会机会

保留 `martial_arts_invitation`、`martial_arts_beginner` 和 `martial_arts_observer`。

邀请窗口为 18～22 岁。资格为：

```text
martialPower >= 15
AND (
  当前已有 Affiliation
  OR reputation >= 10
  OR connections >= 10
)
AND 尚未发生 martial_arts_invitation
```

功力只表示玩家有参与基础；Affiliation、名望或人脉用于证明邀请者能够知道玩家。只有私下功力而无公开连接的人不会凭年龄收到请帖。

选择后果：

- 接受参赛：允许 `martial_arts_beginner`；
- 前去观战：允许 `martial_arts_observer`；
- 拒绝：两种后续都不可用。

两个后续事件改用 19～23 岁窗口并继续依赖各自的明确选择事实，不要求在下一精确年龄强制发生。

## 10. 武艺精进伪因果收敛

`martial_improvement` 不再由“没有恋爱”触发，也不再宣称玩家因为未受儿女情长影响而自动进步。

它改为 16～20 岁普通成长反馈，资格至少要求：

```text
trainingHabit >= 1
AND 尚未发生 martial_improvement
```

它不进入 storyline 或 mandatory 层，是否发生不影响四条重大机会的正式资格。

## 11. 第一处真实冲突与反转

复用 `love_demonic_conflict`。资格改为：

```text
love_started
AND player.affiliation == "shadow_sect"
AND 尚未发生 love_demonic_conflict
```

内容语义：幽影门先前声称“不害无辜、守住底线”，但玩家加入后的首项重要任务牵涉恋人或其家族。新事实重新解释玩家此前对组织的判断。

选择必须产生不可同时保留的结果：

- 为恋人离开幽影门：执行 `affiliation_clear`，保留关系，记录离开事实；
- 坚持幽影门道路：保留 `shadow_sect` Affiliation，产生明确关系下降并添加 `anxious` 状态。

不得只设置“开始赎罪”flag 而继续保留 Affiliation。

## 12. 数据资产收敛清单

### 保留并重构

- `general.json`
  - `sect_choice`
  - `martial_arts_invitation`
  - `martial_arts_beginner`
  - `martial_arts_observer`
- `love.json`
  - `love_first_meet`
  - `love_after_greet`
  - `love_shared_mission`
  - `love_family_obstacle`
  - `love_rival_appears`
  - `love_separation`
  - `love_demonic_conflict`
- `sect-marginal.json`
  - `demonic_encounter`
- `identity-demon.json`
  - `outlaw_identity_beginning`
- `training.json`
  - `martial_improvement`

### 删除

- `general.json` 中的 `meet_love_interest`；
- `sect-wudang.json` 中的 `sect_path_choice`；
- `identity-outlaw.json` 整个重复事件资产；
- `events.json` 和 `EventLoader.ts` 中对应的 `identity-outlaw.json` 接线；
- 目标事件中被新因果关系取代的 route、共享冲突 flag 和精确年龄强制条件。

## 13. 失败与边界处理

- 条件解析失败继续 fail closed，不放宽资格；
- 年龄窗口过期不补发、不迁移、不自动生成替代事实；
- 删除重复事件后不读取旧 event ID 作为 fallback；
- 不清理范围外已有 route flags 或历史事件资产；
- 如果实现必须修改 PlayerState、Snapshot、Contract、存档版本或通用 Condition Schema，视为结构性 blocker，停止并重新裁决；
- 如果只有修改全部 regular 事件调度才能让目标 storyline 可达，视为结构性 blocker，不扩大本阶段。

## 14. 验收标准

### 14.1 反事实自动化

必须覆盖：

1. 无武道实践的人在 14～18 岁看不到门派机会；仅增加一次正式训练实践后机会可用；
2. 选择留在家中不会产生正派、游侠或幽影门动机；
3. 无社会经历的人在 15～20 岁看不到爱情初遇；同状态增加一次正式社会经历后机会可用；
4. 初遇后继续赶路，不出现爱情后续、婚姻保障或家族阻碍；
5. 未接受幽影门初步接触时正式邀请不可用；接受后可用；正式拒绝后 Affiliation 保持 `null`；
6. 功力相同的两人中，只有具备 Affiliation、名望或人脉公开证明者收到武林大会邀请；
7. 接受、观战和拒绝分别产生不同大会后续集合；
8. 爱情与幽影门发生碰撞时，离开组织会清除 Affiliation，留下会保持 Affiliation 并产生实际关系和状态损失；
9. 四条线均未发生的人生可以正常推进至 20 岁以后；
10. raw GameState 不增加任何字段，Snapshot 版本不变。

测试必须直接比较事件资格和执行后的正式 before / after state，不以正文关键词、Trace 标签或构造出的 Milestone 代替事实。

### 14.2 回归验证

实施完成后至少运行：

- 聚焦青年因果反事实测试；
- TypeScript typecheck；
- Contract tests；
- Headless tests 与 Local / Headless parity；
- 完整测试；
- production build；
- P11 scheduling gate；
- `git diff --check`。

范围内旧测试如果固定“14 岁必有门派选择”“18 岁必有武林大会”或重复入口，必须按新产品语义修改或删除，不通过恢复旧行为使其继续通过。

### 14.3 Browser 证据

使用正常游戏路径完成两条对照：

- 低武道、低社会暴露路径：确认重大机会可以不发生且游戏仍可推进；
- 有训练、社会经历和公开证明路径：确认机会出现、选择产生不同后续，并完成一次爱情与幽影门冲突。

Browser 证据只证明当前本地产品路径和玩家可见表现，不外推为外部玩家体验验收。玩家是否仍感到人生必然，需要与技术事实分开记录。

## 15. 预计实现边界

预计涉及：

- 事件数据：`general.json`、`sect-wudang.json`、`sect-marginal.json`、`identity-demon.json`、`love.json`、`training.json`；
- 重复资产删除：`identity-outlaw.json`、`events.json`、`EventLoader.ts`；
- 调度：`GameEngineIntegration.ts` 的候选池分层；
- 测试：新增聚焦青年因果反事实测试，并只更新直接固定旧必然行为的现有测试。

不得因实现顺手修改 UI、Milestone、Ending、Snapshot、PlayerState、其他年龄段内容或全局事件优先级。

## 16. 风险

### 16.1 青年阶段出现空档

这是允许结果，不用新的重大事件填补。验证重点是玩家能否继续执行主动行动和普通生活，而不是每年必须出现剧情。

### 16.2 既有 Golden Path 或历史测试失败

先判断测试是否仍代表当前产品语义。固定旧必然行为的历史验收应修改或删除；当前 Contract、状态安全和 Local / Headless parity 必须继续通过。

### 16.3 重复幽影门链删除影响后续

以 `identity-demon.json` 为唯一正式幽影门线。删除前核对其加入结果能否为现有直接后续提供所需正式事实；不得通过同时保留两条链规避迁移。

### 16.4 storyline 变成新的强制层

storyline 只有满足明确因果条件后才进入调度。验收必须先证明未满足条件时完全不可用，并通过多线同时有效的测试确认仍按权重竞争。

## 17. 完成定义

本阶段只有同时满足以下条件才完成：

- 四条目标线不再按精确年龄普遍发放；
- 重复入口和重复幽影门链已经删除；
- 关键选择改变后续事件资格；
- 爱情与幽影门冲突产生真实不可兼得后果；
- 没有新增正式状态来源、兼容层或存档变化；
- 自动化、Local / Headless parity、构建和 Browser 对照证据完成；
- 未把本阶段自动扩展为全局调度重构或事件池扩充。

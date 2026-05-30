# 包 B-tail：负面/经济短窗口节奏收口执行包

## 绝对边界

本包是一个小尾包，只处理 `repro:event-repetition` 中暴露的短窗口负面/经济类事件节奏问题。

不得把本包扩展成新的事件系统重构、路线治理、家庭剧情治理或门禁治理。

执行会话必须先做只读分析和实施计划，等待审批后才能改代码。

## 当前证据

A/A-prime/A-tail 后，以下问题已经基本收口：

- `love_first_meet` 连刷已经消失。
- 选择事件 outcome effects 的执行口径已经修正。
- 旧模拟测试不再制造连续“初遇”假坏样本。
- “流言最伤人”被误判为 injury 的分类误伤已被处理。
- route-track 样本当前可以达到完成态。

当前剩余核心问题：

- `npm run repro:event-repetition` 仍未完全健康。
- 最新失败样本不是同一事件复读，也不是 injury 文本误伤。
- 当前样本为 `setback_illness -> setback_property_loss`。
- 两者被判为 economy 同类相邻，导致 `same_class` 与短窗口同类重复仍超阈值。
- `npm run report:rhythm-metrics` 仍显示 formal/daily 比例偏离：formal 偏高，daily 偏低。

结论：

这是包 B 范围内的“负面/经济/挫折类短窗口节奏”问题，不是包 A 的生命周期问题，也不是包 C 的路线问题。

## 任务目标

让负面/经济/挫折类事件在短窗口内不要连续挤压玩家体验。

具体目标：

1. `setback_illness -> setback_property_loss` 这类相邻同类负面/经济事件不再稳定出现。
2. `npm run repro:event-repetition` 不再因为 economy 同类短窗口重复超阈值。
3. 不破坏 A/A-prime/A-tail 已经收口的生命周期、choice/outcome、分类规则。
4. 不破坏 C 包路线完成样本。
5. formal/daily 比例如能以小改动改善则改善；如不能，必须明确留给包 B 主节奏或 D 门禁，不在本包扩散。

## 非目标

以下事项禁止在本包处理：

- 禁止修改 `src/core/EventHistory.ts`。
- 禁止修改 `src/core/ChoiceOutcomeResolver.ts`。
- 禁止修改 `scripts/eventRepetitionClassDetection.ts`，除非只读分析证明 A-tail 分类仍有 bug。
- 禁止重做 `triggerConditions.flags`。
- 禁止修改路线系统主逻辑。
- 禁止修改 `RouteStateManager`，除非只是验证中发现已有改动破坏编译。
- 禁止扩写家庭/婚姻剧情。
- 禁止新增大批事件。
- 禁止调整 D 门禁策略。
- 禁止为了让指标变绿而删除坏样本或降低报告阈值。

## 优先允许修改文件

优先只在以下范围内寻找根因和提出计划：

- `src/core/GameEngineIntegration.ts`
- `src/data/lines/setback-events.json`
- `scripts/reproduceEventRepetition.ts`
- `scripts/reportRhythmMetrics.ts`
- `tests/AllTests.ts`

仅在只读分析证明必要时，才允许纳入：

- `src/core/DailyEventSystem.ts`
- `tests/GameProcessSimulator.ts`
- `scripts/runGameplaySimulation.ts`

默认不允许修改：

- `src/core/EventHistory.ts`
- `src/core/ChoiceOutcomeResolver.ts`
- `scripts/eventRepetitionClassDetection.ts`
- `src/core/RouteStateManager.ts`
- `src/data/lines/love.json`
- `src/data/lines/official.json`
- `src/data/lines/sect-beggars.json`
- `src/data/lines/sect-marginal.json`
- UI 相关文件

如果执行会话认为必须修改默认不允许文件，必须先在计划里单独列出理由，等待审批。

## 分步执行要求

### Step 1：只读确认当前失败样本

必须先运行或读取当前输出：

```bash
npm run repro:event-repetition
npm run report:rhythm-metrics
```

只读分析必须回答：

1. 当前 `same_event` 是否已达标。
2. 当前 `same_class` 是否仍超阈值。
3. 当前短窗口重复是哪两个事件造成的。
4. 这两个事件分别为什么被归类为 economy、illness、injury。
5. 这是分类误伤，还是事件分布/冷却/权重问题。

若当前失败样本不再是 `setback_illness -> setback_property_loss`，不得套用旧结论，必须以当前输出为准。

### Step 2：定位节奏根因

只读检查以下位置：

1. `setback_illness` 和 `setback_property_loss` 的 `ageRange`、`priority`、`weight`、`maxTriggers`、`cooldown`、`conditions`、`metadata.tags`。
2. `GameEngineIntegration` 中负面/挫折/经济类事件的重复抑制逻辑。
3. `getFormalRepetitionSuppressionMultiplier` 或等价逻辑是否只降权但不足以阻止相邻同类事件。
4. 候选池 cap 与 formal/daily 分层是否让负面/经济类 formal 事件连续挤占。

只读分析后必须判断根因属于哪一类：

- A 类：数据冷却不足。
- B 类：同类负面事件没有短窗口互斥。
- C 类：权重降权太弱。
- D 类：报告分类误伤。
- E 类：候选池节奏仍偏 formal。

### Step 3：制定最小实施计划

实施计划必须优先选择最小改动。

优先级建议：

1. 若只是特定 setback 数据冷却不足，优先调整 `setback-events.json` 的冷却或 maxTriggers。
2. 若是同类负面短窗口普遍问题，优先在引擎选择层增加小范围同类短窗口抑制或更强降权。
3. 若只是报告分类误伤，回到 A-tail 处理，不在本包修改节奏。
4. 若 formal/daily 比例偏离需要较大策略改动，只记录为包 B 主节奏问题，不在本包大改。

计划必须写清楚：

- 计划修改文件。
- 不修改文件。
- 每个修改对应的验证命令。
- 预期 before/after 指标。
- 是否可能影响路线样本。

### Step 4：审批后实施

获得审批后，执行会话只能按已批准计划改动。

实施中如果发现需要改超出范围的文件：

1. 停止扩散。
2. 在最终输出或中间报告中说明原因。
3. 等待新的审批。

不得自行扩大范围。

### Step 5：验收

必跑：

```bash
npm run typecheck
npm test
npm run repro:event-repetition
npm run report:rhythm-metrics
npm run verify:route-track-samples
```

建议补跑：

```bash
npm run build
npm run simulate:gameplay:samples -- --diagnostics
```

## 验收标准

阻断项：

- `npm run typecheck` 通过。
- `npm test` 通过。
- `npm run repro:event-repetition` 中 `same_event` 达标。
- `npm run repro:event-repetition` 中 `same_class` 达标，或剩余 same_class 明确不是本包范围。
- `npm run repro:event-repetition` 中短窗口同类重复达标，或剩余问题明确不是本包范围。
- `npm run verify:route-track-samples` 不退化。

期望项：

- `setback_illness -> setback_property_loss` 不再作为相邻同类重复出现。
- `report:rhythm-metrics` 中 formal/daily 比例有改善。
- `testGameSimulation` 不重新出现连续“初遇”或连续“意外受伤”假坏样本。

允许保留的观察项：

- formal/daily 比例仍轻微偏离，但必须清楚归入包 B 主节奏或 D 门禁。
- spouse/children 仍为 0，这属于家庭/婚姻体验，不属于本包。
- 路线完成之外的路线体感仍需后续观察，这属于包 C/D。

## 明确禁止的常见错误

执行会话不得做以下操作：

- 不得修改阈值来让 `repro:event-repetition` 看起来通过。
- 不得删除 `setback_property_loss` 或 `setback_illness` 来规避问题。
- 不得把 economy 分类整体移除。
- 不得把所有 setback 事件改成极低权重。
- 不得修改路线完成条件来补偿节奏问题。
- 不得扩写新事件来稀释问题。
- 不得把 `npm test` 失败归咎于环境而不查具体输出。

## 交付物

完成后必须输出：

- 修改文件清单。
- 当前失败样本 before/after。
- `repro:event-repetition` 指标 before/after。
- `report:rhythm-metrics` 指标 before/after。
- `verify:route-track-samples` 结果。
- 是否仍需要包 B 主节奏回补。
- 是否可以进入包 D 门禁设计。

## 给执行会话的启动提示词

```text
你正在接手 wuxia-life 体验治理的包 B-tail：负面/经济短窗口节奏收口。

请先读取并遵守 AGENTS.md，然后读取：

1. agent_docs/current-state-problem-description.md
2. docs/PRD/experience-governance-distributed-plan.md
3. agent_docs/experience-governance-dispatch-index.md
4. agent_docs/experience-governance-pack-a-prime-lifecycle-closure.md
5. agent_docs/experience-governance-pack-a-tail-repetition-classifier.md
6. agent_docs/experience-governance-pack-b-tail-negative-economy-rhythm.md

背景：
A/A-prime/A-tail 已经基本收口事件生命周期和复读分类误伤。当前 repro:event-repetition 仍未完全健康，但剩余样本已经不是 love_misunderstanding 文本误判，而是 setback_illness -> setback_property_loss 被判为 economy 同类相邻。report:rhythm-metrics 也仍有 formal/daily 比例偏离。

任务目标：
只处理短窗口负面/经济/挫折类事件节奏。不要回到 A 的生命周期，不要修改 ChoiceOutcomeResolver，不要修改 EventHistory，不要修改 eventRepetitionClassDetection，除非只读分析证明分类仍有 bug。不要动路线，不要扩写家庭/婚姻剧情，不要做 D 门禁。

请先只读分析，不要修改代码。重点确认：
1. 当前 repro:event-repetition 的失败样本是什么
2. same_event 是否已达标
3. same_class 和 short-window 是否仍超阈值
4. 当前失败是数据冷却不足、同类短窗口互斥不足、降权不足、分类误伤，还是 formal 候选池偏密
5. 最小修改范围应是什么

只读分析后，请输出实施计划，必须包含：
1. 计划修改文件
2. 明确不修改的文件和原因
3. 每一步验证命令
4. before/after 指标
5. 对路线样本和后续包 D 的影响

等待审批后才能改代码。
```

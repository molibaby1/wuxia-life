# 包 B-rhythm-closure：正式/日常节奏收口执行包

## 绝对边界

本包只处理当前剩余的节奏健康问题：

1. `formal_event_ratio` 略高于基线。
2. `daily_event_ratio` 低于基线。
3. `ConditionEvaluator` 反复拒绝 `chivalry <= -10`，污染验证输出，并可能让负侠义路线条件恒不满足。

不得修改已经收口的复读生命周期、事件历史、路线完成条件或 `repro:event-repetition` 判定逻辑。

执行会话必须先做只读分析和实施计划，等待审批后才能改代码。审批后只能按本文范围执行。

## 当前证据

最新验证结果：

```text
npm run repro:event-repetition
Searched seeds 1..200, no adjacent repetition issue found.
exit code: 0
```

```text
npm run report:rhythm-metrics
formal_event_ratio=92.1% baseline=[50.0%, 90.0%]
daily_event_ratio=7.9% baseline=[10.0%, 50.0%]
choice_event_ratio=65.8% baseline=[20.0%, 80.0%]
storyline_continuity=3/3 (100.0%) baseline=[30.0%, 100.0%]
```

```text
npm run verify:route-track-samples
completedSamples=3/3
```

同时多个命令中反复出现：

```text
[ConditionEvaluator] Expression rejected "martialPower >= 30 && chivalry <= -10": at 34: Invalid token "-"
```

对应数据位置：

```text
src/data/lines/identity-demon.json
expression: "martialPower >= 30 && chivalry <= -10"
```

对应解析器现状：

- `src/core/ConditionEvaluator.ts` 支持数字字面量。
- 当前 tokenizer 支持 `>= <= == != && || > < !`。
- 当前 tokenizer 不支持 `-`。
- 当前 parser 的 `parseUnary()` 只支持 `!`，不支持负数字面量。

当前 `GameEngineIntegration.selectEvent()` 的层级大致为：

1. critical lane 永远优先。
2. storyline lane 优先。
3. regular formal lane 可被 `shouldPauseEventsThisYear()` 暂停。
4. daily fallback。

现有 `shouldPauseEventsThisYear()` 主要依赖 `eventsThisYear` 与 `annualEventPressure`，更像同一年压力控制；但 `report:rhythm-metrics` 的样本是一岁选一个事件，当前问题是跨年龄 formal/daily 比例偏差。

## 任务目标

让节奏指标从“略微越线”回到 P1 观察基线内，同时不破坏 A/B/C 已收口结果。

必须达成：

1. `formal_event_ratio <= 90.0%`。
2. `daily_event_ratio >= 10.0%`。
3. `choice_event_ratio` 保持在 `[20.0%, 80.0%]`。
4. `storyline_continuity` 不退化到低于 `30.0%`。
5. `npm run repro:event-repetition` 继续通过。
6. `npm run verify:route-track-samples` 继续 `completedSamples=3/3`。
7. `ConditionEvaluator` 不再因为 `chivalry <= -10` 报 `Invalid token "-"`。

## 非目标

以下事项禁止在本包处理：

- 禁止修改 `scripts/reproduceEventRepetition.ts`。
- 禁止修改 `scripts/eventRepetitionClassDetection.ts`。
- 禁止修改 `src/core/EventHistory.ts`。
- 禁止修改 `src/core/ChoiceOutcomeResolver.ts`。
- 禁止修改路线完成条件或 `RouteStateManager` 的完成判定。
- 禁止降低 `report:rhythm-metrics` 的基线阈值。
- 禁止删除 daily/formal 事件来调整比例。
- 禁止把 critical/storyline 事件降级成 daily。
- 禁止大批新增事件来稀释比例。
- 禁止为了消除 warning 直接删除 `identity-demon` 的条件。
- 禁止修改 UI。

如果执行会话认为必须修改上述文件，必须停止并重新提交计划。

## 允许优先修改文件

优先允许：

```text
src/core/GameEngineIntegration.ts
src/core/ConditionEvaluator.ts
tests/AllTests.ts
scripts/reportRhythmMetrics.ts
```

谨慎允许，仅当只读分析证明必要：

```text
src/core/DailyEventSystem.ts
scripts/runGameplaySimulation.ts
tests/GameProcessSimulator.ts
```

默认不允许修改事件数据。若执行会话认为必须修改事件数据，必须先单独说明原因并等待审批。

## 分步执行要求

### Step 1：只读确认现状

必须先运行：

```bash
npm run repro:event-repetition
npm run report:rhythm-metrics
npm run verify:route-track-samples
```

只读报告必须记录：

1. `repro:event-repetition` 是否通过，退出码是否为 `0`。
2. `formal_event_ratio` 当前值。
3. `daily_event_ratio` 当前值。
4. `choice_event_ratio` 当前值。
5. `storyline_continuity` 当前值。
6. route samples 是否仍为 `completedSamples=3/3`。
7. 是否仍出现 `chivalry <= -10` 的 ConditionEvaluator warning。

如果 `repro:event-repetition` 不通过，停止本包，不得继续处理 rhythm。

### Step 2：只读定位 rhythm 偏差

读取：

```text
src/core/GameEngineIntegration.ts
src/core/DailyEventSystem.ts
scripts/reportRhythmMetrics.ts
```

必须回答：

1. 当前 daily 事件在什么情况下才会被选中。
2. critical/storyline/regular formal 三层分别对 daily fallback 有多强的压制。
3. 当前 `shouldPauseEventsThisYear()` 是否能影响跨年龄 formal/daily 比例。
4. seed=1 age=40 样本中，daily 事件出现在哪些年龄。
5. 要让 daily 比例达到 `>=10%`，至少需要增加多少个 daily 样本点。

注意：当前样本 `timelineEvents=38`、`daily_event_ratio=7.9%`，意味着大约只有 3 个 daily。只要增加到 4 个 daily，比例约为 `10.5%`，即可回到基线内。但实现不得硬编码 seed 或年龄。

### Step 3：只读定位负数条件问题

读取：

```text
src/core/ConditionEvaluator.ts
src/data/lines/identity-demon.json
tests/AllTests.ts
```

必须回答：

1. `-10` 是 tokenizer 不支持，还是 parser 不支持。
2. 项目是否已有表达式解析回归测试。
3. 最小正确修复是支持负数字面量，还是改写数据表达式。

默认优先级：

1. 优先修 `ConditionEvaluator` 支持安全的负数字面量。
2. 只有当 parser 修复风险明显过高时，才考虑把数据表达式改为结构化条件或等价安全表达式。

不得使用 `eval`、`new Function` 或动态执行。

### Step 4：制定最小实施计划

计划必须拆成两个独立小改：

#### 改动 A：负数字面量支持

推荐方向：

- 在 `ConditionEvaluator` 的 tokenizer/parser 中支持安全负数字面量。
- 只支持数字前的一元负号，例如 `-10`、`-3.5`。
- 不引入通用加减乘除表达式。
- 不允许属性取负、函数调用或任意代码执行。
- 为 `martialPower >= 30 && chivalry <= -10` 增加回归测试。

验收：

- 不再输出 `Invalid token "-"`。
- 表达式在 `chivalry=-11` 时为 true，在 `chivalry=0` 时为 false。

#### 改动 B：跨年龄 daily cadence

推荐方向：

- 在 `GameEngineIntegration.selectEvent()` 的 regular formal lane 前增加一个小范围跨年龄节奏判断。
- critical lane 不受影响。
- storyline lane 默认不受影响，避免破坏路线和恋爱线连续推进。
- 只允许 regular formal lane 在近期 daily 过少时让位给 daily。
- 不要硬编码 seed、年龄或具体事件 id。

建议策略之一：

```text
如果最近 N 个已记录事件中没有 daily，
且当前没有 critical/storyline 必须事件，
且 dailyEventSystem 能选出事件，
则本次 regular formal lane 让位给 daily。
```

N 的建议范围：`5` 到 `8`。执行会话必须在计划中说明选择理由。

不得为了指标直接随机增加 daily 大概率；不得让 daily 抢占 critical/storyline。

### Step 5：审批后实施

获得审批后，执行会话只能按批准计划修改。

如果实施中发现需要改事件数据、路线逻辑、复读脚本或阈值，必须停止并请求新审批。

## 验收命令

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
- `npm run repro:event-repetition` 通过，退出码 `0`。
- `npm run verify:route-track-samples` 保持 `completedSamples=3/3`。
- `formal_event_ratio <= 90.0%`。
- `daily_event_ratio >= 10.0%`。
- `choice_event_ratio` 仍在 `[20.0%, 80.0%]`。
- 不再出现 `Expression rejected "martialPower >= 30 && chivalry <= -10": ... Invalid token "-"`。

观察项：

- `testGameSimulation` 可能仍提示“事件总数偏多”；如果 rhythm 指标已经回基线，可先作为观察项留给 D 包门禁。
- spouse/children 分布不属于本包。
- route 体验“体感是否足够强”不属于本包，只检查 route samples 不退化。

## 明确禁止的错误做法

执行会话不得：

- 把 `formalEventRatio.max` 从 `0.9` 改大。
- 把 `dailyEventRatio.min` 从 `0.1` 改小。
- 修改 `reportRhythmMetrics` 让 daily 统计口径虚高。
- 修改 `repro:event-repetition` 来跳过问题。
- 让 daily 抢占 critical 或 storyline。
- 删除 `identity-demon` 的负侠义条件。
- 用字符串替换或正则 hack 绕过条件解析。
- 为 seed=1 或 age=40 写特殊逻辑。

## 最终交付格式

执行会话最终必须报告：

1. 修改文件清单。
2. 负数字面量修复方式。
3. daily cadence 修复方式。
4. `report:rhythm-metrics` before/after：
   - `formal_event_ratio`
   - `daily_event_ratio`
   - `choice_event_ratio`
   - `storyline_continuity`
5. `repro:event-repetition` 结果。
6. `verify:route-track-samples` 结果。
7. 是否仍有 `chivalry <= -10` warning。
8. 残余风险。

## 给执行会话的直接提示词

你只执行 `agent_docs/experience-governance-pack-b-rhythm-closure.md`。先读取该文档，再做只读分析和实施计划，等待我审批。审批前不要改代码。审批后只允许处理两个问题：一是 `ConditionEvaluator` 支持安全负数字面量，消除 `chivalry <= -10` warning；二是 regular formal lane 的跨年龄 daily cadence，让 `formal_event_ratio <= 90%` 且 `daily_event_ratio >= 10%`。禁止修改复读脚本、事件历史、路线完成条件、报告阈值和事件数据。完成后必须运行 `npm run typecheck`、`npm test`、`npm run repro:event-repetition`、`npm run report:rhythm-metrics`、`npm run verify:route-track-samples`，并报告 before/after 指标。

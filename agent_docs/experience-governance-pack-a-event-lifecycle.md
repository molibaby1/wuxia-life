# 包 A：事件生命周期与复读根因治理执行包

## 任务目标

解决同一事件、同类事件和生命周期事件复读的底层来源，让事件是否可触发具有一致、可解释、可验证的规则。

## 当前证据

- `npm run repro:event-repetition` 可复现 same-event 与短窗口同类重复。
- `scripts/reportRhythmMetrics.ts` 和 `scripts/reproduceEventRepetition.ts` 当前直接执行 effects，容易绕过引擎的事件触发记录入口。
- `EventRecordHandler` 写入 `player.events`，而冷却与 `maxTriggers` 依赖 `gameState.eventHistory`。
- `EventExecutor.canTriggerEvent` 只处理 `choices`、`identity`、`karma`，旧事件中的 `triggerConditions.flags.required/not` 语义需要明确。
- 家庭、挫折、职业等事件数据存在宽年龄段和高权重重复压力。

## 只读分析清单

1. 读取事件选择与执行路径：
   - `src/core/GameEngineIntegration.ts`
   - `src/core/EventExecutor.ts`
   - `scripts/reproduceEventRepetition.ts`
   - `scripts/reportRhythmMetrics.ts`
   - `tests/GameProcessSimulator.ts`
2. 盘点依赖 `triggerConditions.flags` 的事件。
3. 盘点 `maxTriggers > 1` 或宽年龄段高权重事件。
4. 对比真实模拟报告与轻量脚本报告的记录口径。

## 实施边界

允许：

- 修复事件历史记录口径。
- 修复或迁移 flag 型 triggerConditions 门禁。
- 调整复读指标脚本，使其使用真实引擎语义。
- 为家庭、挫折、职业等类别补充生命周期规则。

不允许：

- 重做路线系统。
- 大规模改写事件文案。
- 调整 UI。
- 顺手处理候选池节奏策略。

## 成功标准

- 同一事件复读率明显下降。
- 短窗口同类重复率明显下降或原因可解释。
- 固定 seed 报告能区分同一事件、同类事件、同剧情线重复。
- `npm test`、`npm run repro:event-repetition` 可给出稳定结果。

## 风险

- 完整执行旧 flag 门禁后，可能暴露部分事件不可达。
- 过强抑制可能误伤主线或必要剧情线。
- 修改脚本口径后，历史报告数字可能不可直接比较。

## 交付物

- 实施计划和审批记录。
- 变更后的复读指标结果。
- 被迁移或被确认的生命周期规则列表。
- 对包 B/C 的影响说明。

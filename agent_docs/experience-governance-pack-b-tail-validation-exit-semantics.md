# 包 B-tail-fix：复读验证脚本退出语义收口执行包

## 绝对边界

本包只处理 `npm run repro:event-repetition` 的验证脚本退出语义问题。

不得修改事件权重、事件池、路线系统、家庭剧情、日常事件比例、报告阈值或玩法逻辑。

执行会话必须先做只读分析和实施计划，等待审批后再改代码。获得审批后，只能按本文范围执行。

## 当前背景

B-tail 执行后，负面/经济短窗口问题的核心玩法修正已经初步有效：

- `setback_illness` 不应再因为描述中的“本钱”被判为 economy。
- `setback_property_loss` 仍应被判为 economy。
- `repro:event-repetition` 在多 seed 搜索时已经能输出：

```text
Searched seeds 1..200, no adjacent repetition issue found.
```

但是当前脚本仍会在这个“未发现相邻复读问题”的分支设置失败退出码：

```ts
console.log('=== Event Repetition Reproduction Report ===');
console.log(`Searched seeds 1..${seedsToTry.length}, no adjacent repetition issue found.`);
process.exitCode = 1;
```

因此当前问题不是“又发现了新的复读样本”，而是“回归验证脚本仍按旧的复现脚本语义退出”。

## 任务目标

把 `scripts/reproduceEventRepetition.ts` 从“必须复现问题才算成功”的脚本，收口为“作为回归验证门时，无相邻复读问题应成功退出”的脚本。

具体目标：

1. 默认模式下搜索 seeds `1..200`。
2. 如果发现 adjacent repetition issue，打印对应报告并以非零退出码失败。
3. 如果没有发现 adjacent repetition issue，打印当前无问题报告并以 `0` 退出。
4. 显式指定 `REPRO_SEED` 时，仍打印该 seed 的完整报告。
5. 显式 seed 若有 issue，应失败退出。
6. 显式 seed 若无 issue，应成功退出。
7. 不修改检测阈值、事件分类、事件选择、事件数据或玩法逻辑。

## 非目标

以下事项禁止在本包处理：

- 禁止修改 `src/core/GameEngineIntegration.ts`。
- 禁止修改 `src/data/lines/setback-events.json`。
- 禁止修改 `scripts/eventRepetitionClassDetection.ts`。
- 禁止修改 `scripts/reportRhythmMetrics.ts`。
- 禁止修改任何 `src/data/lines/*.json` 事件内容。
- 禁止修改路线验证脚本。
- 禁止修改 `package.json`。
- 禁止通过降低复读判定标准来让脚本通过。
- 禁止屏蔽、删除、跳过坏样本。
- 禁止顺手处理 formal/daily 比例偏离问题。

如果执行会话认为必须修改上述文件，必须停止并重新提交计划，不得自行扩散。

## 允许修改文件

默认只允许修改：

```text
scripts/reproduceEventRepetition.ts
```

如需要补充测试，只允许优先考虑：

```text
tests/AllTests.ts
```

但除非项目已有适合脚本退出语义的测试入口，否则不要为了本微型包新增复杂测试框架。

## 执行步骤

### Step 1：只读确认

先读取：

```text
scripts/reproduceEventRepetition.ts
scripts/eventRepetitionClassDetection.ts
package.json
```

必须确认：

1. `package.json` 中 `repro:event-repetition` 指向 `tsx scripts/reproduceEventRepetition.ts`。
2. `scripts/reproduceEventRepetition.ts` 默认会搜索 seeds `1..200`。
3. 当前无 issue 分支仍设置 `process.exitCode = 1`。
4. `scripts/eventRepetitionClassDetection.ts` 已经把“本钱”从 economy 语义中剔除。

### Step 2：运行当前失败命令

运行：

```bash
npm run repro:event-repetition
```

记录当前输出结论：

- 如果输出为 `no adjacent repetition issue found` 但命令退出码非零，则本包继续执行。
- 如果输出出现真实 `Issues:`，不要按本文修退出码掩盖问题，必须停止并报告当前真实复读样本。

### Step 3：制定最小计划

计划只能包含以下代码意图：

1. 默认多 seed 模式：
   - 找到 issue：打印报告，退出码 `1`。
   - 未找到 issue：打印 `no adjacent repetition issue found`，退出码 `0`。
2. 显式 `REPRO_SEED` 模式：
   - 总是打印该 seed 报告。
   - 有 issue：退出码 `1`。
   - 无 issue：退出码 `0`。

不得改动 `simulateWithSeed`、`detectEventClasses`、`formatResult` 的判定逻辑，除非只读分析证明退出码无法独立修正。

### Step 4：审批后实施

获得审批后，只修改 `scripts/reproduceEventRepetition.ts` 中 `main()` 的退出码分支。

推荐修正方向：

```ts
if (result.issues.length > 0 || explicitSeed !== null) {
  console.log(formatResult(result));
  process.exitCode = result.issues.length > 0 ? 1 : 0;
  return;
}

console.log('=== Event Repetition Reproduction Report ===');
console.log(`Searched seeds 1..${seedsToTry.length}, no adjacent repetition issue found.`);
process.exitCode = 0;
```

注意：以上是意图示例，执行会话应结合当前文件实际代码做最小修改。

### Step 5：验收

必跑：

```bash
npm run repro:event-repetition
npm run typecheck
npm test
```

建议补跑：

```bash
npm run build
npm run report:rhythm-metrics
npm run verify:route-track-samples
```

## 验收标准

阻断项：

- `npm run repro:event-repetition` 在无 adjacent repetition issue 时退出码为 `0`。
- 如果真实出现 adjacent repetition issue，脚本仍以非零退出码失败。
- `npm run typecheck` 通过。
- `npm test` 通过。
- 没有修改玩法逻辑、事件数据、路线系统或报告阈值。

观察项：

- `report:rhythm-metrics` 可能仍显示 `formal_event_ratio` 偏高、`daily_event_ratio` 偏低；这不是本包问题。
- `verify:route-track-samples` 应保持 `completedSamples=3/3`；如果退化，优先怀疑执行会话改出了范围。
- `ConditionEvaluator` 关于 `martialPower >= 30 && chivalry <= -10` 的警告不是本包目标。

## 最终交付格式

执行会话最终必须报告：

1. 修改文件清单。
2. `npm run repro:event-repetition` 修复前后的退出语义。
3. 是否出现真实复读 issue。
4. `npm run typecheck` 结果。
5. `npm test` 结果。
6. 是否确认未修改玩法逻辑、事件数据和阈值。

## 给执行会话的直接提示词

你只处理 `npm run repro:event-repetition` 的退出语义问题。先读取 `agent_docs/experience-governance-pack-b-tail-validation-exit-semantics.md`，再做只读分析和实施计划，等待我审批。审批后只允许修改 `scripts/reproduceEventRepetition.ts`，不要改事件数据、权重、路线、报告阈值或其他玩法逻辑。目标是：无 adjacent repetition issue 时退出码为 0；有真实 issue 时仍退出非零。完成后必须运行 `npm run repro:event-repetition`、`npm run typecheck`、`npm test`，并报告结果。

# 包 A-prime：事件生命周期收口执行包

## 结论

A-prime 有必要单独做。

它不是重做包 A，也不是回滚包 B/C。它的定位是把包 A 已经触及但尚未闭合的基础口径收住：选择事件执行、事件历史写入、复读脚本、旧模拟测试必须对齐同一套“真实游戏语义”。否则后续包 B/C 的体验判断会继续被假复读、漏写 flag、旧脚本口径污染。

建议采用分步落实，而不是一次性继续调权重或候选池。

## 当前触发原因

包 A/B/C 执行后，当前验证仍暴露以下问题：

- `npm run repro:event-repetition` 仍显示同事件复读超阈值，代表复读验收没有闭合。
- `npm run report:rhythm-metrics` 仍出现 `love_first_meet` 连续多年触发，代表选择事件生命周期仍有断点。
- `tests/testGameSimulation.ts` 仍能输出连续“意外受伤”和连续“初遇”，代表旧模拟口径仍绕开真实引擎执行路径。
- `npm test` 当前存在内存阈值失败，需要判断是新增长流程测试导致门禁变脆，还是确有泄漏。
- 包 B/C 已经产生路线和候选池方向改动，继续推进 D 前需要先确认 A 口径不会继续污染指标。

## 任务目标

让“事件是否已经被消费”成为统一、可解释、可验证的事实。

具体目标：

1. 选择事件的 choice/outcome 执行口径与真实游戏一致。
2. 正式事件一旦被消费，就能进入生命周期记录。
3. 复读脚本和节奏脚本不再因为漏执行 effects 产生假复读。
4. 旧模拟测试不再作为错误口径的体验证据。
5. A-prime 完成后，包 B/C 可以保留并继续验收，不需要推倒重做。

## 非目标

A-prime 不处理以下内容：

- 不重做包 B 的候选池分布策略。
- 不继续扩大包 C 的路线接管能力。
- 不新增大段剧情内容。
- 不修改 UI。
- 不把所有 warning 直接升级为 blocker。
- 不为了压指标盲目调低权重。

## 建议修改范围

允许纳入计划的文件：

- `scripts/reproduceEventRepetition.ts`
- `scripts/reportRhythmMetrics.ts`
- `tests/testGameSimulation.ts`
- `tests/AllTests.ts`
- `src/core/GameEngineIntegration.ts`
- `src/core/EventHistory.ts`
- 必要时少量补充 `src/data/lines/love.json`
- 必要时少量补充 `src/data/lines/family-life.json`
- 必要时少量补充 `src/data/lines/setback-events.json`

不建议纳入计划的文件：

- 路线数据的大规模扩展文件。
- 候选池策略以外的路线主导权文件。
- UI 组件。
- 存档系统。
- 报告清单生成文件，除非验证命令本身需要调整报告副作用。

## 分步落实方式

### Step 1：只读复核当前口径

目标：确认当前坏指标是“真实玩法坏”还是“脚本口径坏”。

只读检查：

1. 对比真实游戏选择执行路径与脚本中的选择执行路径。
2. 检查 `love_first_meet` 的 choice/outcome 条件和 effects。
3. 检查脚本是否能执行带 `condition: expression true` 的 outcome。
4. 检查 `tests/testGameSimulation.ts` 是否仍直接调用 `EventExecutor.executeEffects`。
5. 检查 `eventHistory`、`player.events`、`flag_set`、`event_record` 的实际写入关系。

进入下一步的条件：

- 能明确指出 `love_first_meet` 连刷是否由 effects 漏执行导致。
- 能明确指出 `setback_injury` 的失败是短窗口复读、同事件复读，还是指标定义误伤多年后复发。

### Step 2：统一脚本执行口径

目标：复读脚本和节奏脚本必须使用真实游戏语义。

实施方向：

1. 把 choice/outcome 的选择和条件判断抽成可复用逻辑，或复用现有真实执行入口。
2. 支持 outcome 条件表达式，而不是只查找无条件 outcome。
3. 当 choice 有 outcome effects 时，执行 outcome effects。
4. 当 choice 只有 direct effects 时，执行 direct effects。
5. 执行完成后确保事件生命周期记录写入。

验收：

- `love_first_meet` 不再因为漏写 `love_started` 连续触发。
- `npm run report:rhythm-metrics` 的时间线不再出现同一恋爱起点事件连续多年刷屏。

### Step 3：统一正式事件生命周期记录

目标：事件被消费后，冷却、`maxTriggers`、`once`、复读降权都读同一个历史事实。

实施方向：

1. 明确正式事件记录写入点。
2. 明确 auto event、choice event、无 effects event 是否都应该写入历史。
3. 避免同一事件同一年龄重复写入。
4. 保留 `player.events` 的展示/记录用途，但不再让它和 `eventHistory` 表达两套门禁事实。

验收：

- 新增或更新测试覆盖 auto event 与 choice event 的历史写入。
- `maxTriggers` 与 `cooldown` 在真实引擎路径、复读脚本路径、节奏脚本路径中一致生效。

### Step 4：迁移或降级旧模拟测试口径

目标：`tests/testGameSimulation.ts` 不再输出明显假坏味道。

实施方向：

1. 将旧模拟测试迁到 `GameEngineIntegration.executeAutoEvent` / `executeChoiceEffects` 路径。
2. 若旧测试本质是诊断脚本，不适合作为主门禁，可改为非阻断诊断或替换为真实模拟样本。
3. 避免它继续直接调用 `EventExecutor.executeEffects` 后手动写 `player.events`。

验收：

- `npm test` 输出中不再出现由旧口径制造的连续“初遇”。
- 若仍有连续事件，必须能追溯到真实引擎路径，而不是测试脚本绕路。

### Step 5：最小数据补丁

目标：只在执行口径修正后仍有真实复读时，才调整数据生命周期。

允许补丁：

1. 给恋爱起点类事件补充明确 `maxTriggers` 或生命周期 flag 门禁。
2. 给家庭生命周期事件补充必要 `maxTriggers`、`cooldown` 或 `flags.not`。
3. 给挫折事件补充合理冷却或同类生命周期控制。

不允许：

- 为了压指标随意调低整类事件权重。
- 一次性扩写多个事件链。
- 把路线事件接管逻辑混入 A-prime。

验收：

- 数据补丁必须有对应坏样本作为依据。
- 每个补丁都能说明它解决的是同一事件、同类事件、还是生命周期事件复读。

### Step 6：处理主测试失败

目标：`npm test` 恢复稳定通过。

处理顺序：

1. 先确认内存失败是否由新增长流程测试或报告生成副作用导致。
2. 若是测试组织问题，拆分重型模拟与轻量主门禁。
3. 若是实际泄漏，定位泄漏来源。
4. 不应直接把阈值调高作为第一选择。

验收：

- `npm test` 通过。
- 若保留内存阈值调整，必须解释样本增长、测试职责变化和新阈值依据。

## 必跑验证命令

```bash
npm run typecheck
npm test
npm run repro:event-repetition
npm run report:rhythm-metrics
npm run simulate:gameplay:samples -- --diagnostics
```

若改动涉及构建入口或测试命令，还应运行：

```bash
npm run build
```

## 验收标准

### 阻断项

- `npm test` 必须通过。
- `npm run repro:event-repetition` 不应再出现同事件复读超阈值。
- `npm run report:rhythm-metrics` 不应再出现 `love_first_meet` 连续多年触发。
- 脚本路径与真实游戏路径不得继续使用两套事件消费口径。

### 观察项

- formal/daily 比例若仍偏离，应归入包 B，而不是在 A-prime 内继续扩散。
- route completion 若仍不足，应归入包 C，而不是在 A-prime 内继续扩散。
- 家庭/恋爱后续体验若仍薄弱，应记录给包 D 或后续家庭线治理，不在 A-prime 内扩写。

## 对包 B/C 的影响判断

A-prime 可以在 B/C 之后单独做，不要求回滚 B/C。

但 A-prime 完成前，不建议进入最终体验门禁收口。原因是：

- B 的节奏指标会被 `love_first_meet` 连刷污染。
- C 的路线体感会被基础生命周期假复读稀释。
- D 若此时设计硬门禁，会把已知错误口径纳入长期规则。

完成 A-prime 后，应重新跑 B/C 的关键指标，再判断是否需要小范围回补 B 或 C。

## 交付物

A-prime 完成后应交付：

- 只读分析结论。
- 已批准实施计划。
- 修改文件清单。
- `repro:event-repetition` before/after。
- `report:rhythm-metrics` before/after。
- `npm test` 结果。
- 是否需要回补包 B/C 的判断。
- 残余风险列表。

## 建议的新会话启动提示词

```text
你正在接手 wuxia-life 体验治理的包 A-prime：事件生命周期收口。

请先读取并遵守 AGENTS.md，然后读取：

1. agent_docs/current-state-problem-description.md
2. docs/PRD/experience-governance-distributed-plan.md
3. agent_docs/experience-governance-dispatch-index.md
4. agent_docs/experience-governance-pack-a-event-lifecycle.md
5. agent_docs/experience-governance-pack-a-prime-lifecycle-closure.md

当前目标不是重做 A，也不是回滚 B/C，而是把 A 未闭合的事件生命周期口径收住。

请先只读分析，不要修改代码。重点确认：
1. 复读脚本和节奏脚本是否正确执行 choice/outcome effects
2. love_first_meet 连刷是否由 love_started 未写入导致
3. 正式事件被消费后是否稳定写入 eventHistory
4. tests/testGameSimulation.ts 是否仍绕过真实引擎执行路径
5. npm test 当前内存失败是测试组织问题还是实际泄漏

只读分析后，请输出分步实施计划，必须包含：
1. 计划修改文件
2. 明确不修改的包 B/C 范围
3. 每一步验证命令
4. before/after 指标
5. 对后续包 D 的影响

等待审批后才能改代码。
```

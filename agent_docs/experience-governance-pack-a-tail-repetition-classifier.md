# 包 A-tail：复读分类收口执行包

## 结论

A-tail 有必要做，但它应该是一个很小的尾包。

当前 A-prime 已经修好事件生命周期的主要断点：选择事件 outcome effects 能执行，`love_first_meet` 不再连刷，旧模拟测试不再制造假复读，`npm test` 和构建已恢复通过。

剩余问题不是“继续大调事件池”，而是 `repro:event-repetition` 的同类复读分类仍有误伤：`love_misunderstanding` 因为文本包含“流言最伤人”，被正则归为 `injury`，随后和 `setback_injury` 被判成同类相邻重复。这会让复读指标继续红/黄，但它并不等价于真实玩法里连续受伤。

## 当前证据

当前验证结果：

- `npm run typecheck` 通过。
- `npm test` 通过。
- `npm run build` 通过。
- `npm run report:rhythm-metrics` 中 `love_first_meet` 不再连续多年触发。
- `npm run repro:event-repetition` 中：
  - `same_event=0.0%`，已达标。
  - `same_class=100.0%`，未达标。
  - 短窗口同类重复略超阈值。
  - 具体问题样本为 `love_misunderstanding -> setback_injury`。

关键判断：

- `love_misunderstanding` 是恋爱冲突事件，不是受伤事件。
- 它被分类为 `injury` 的原因是文本中有“伤人”。
- 当前复读脚本的分类规则过度依赖宽泛中文字符 `伤`。

## 任务目标

让复读分类指标能区分真实负面同类事件和叙事修辞。

具体目标：

1. 避免把“伤心”“伤人”“伤感”等情绪/修辞文本误判为 `injury`。
2. 保留对真实受伤事件的识别能力。
3. 保留对 illness、economy 的既有识别能力。
4. 让 `npm run repro:event-repetition` 的失败更接近真实玩法问题，而不是文本误伤。

## 非目标

A-tail 不处理以下内容：

- 不继续调整包 B 的 formal/daily 比例。
- 不继续调整包 C 的路线完成规则。
- 不扩写恋爱、家庭或路线剧情。
- 不修改 UI。
- 不改事件调度权重。
- 不为了让指标变绿而删除真实坏样本。

## 建议修改范围

优先允许修改：

- `scripts/reproduceEventRepetition.ts`
- `tests/AllTests.ts`

可选但谨慎：

- `scripts/reportRhythmMetrics.ts`，仅当它复用或也需要展示同类分类时。
- 新增一个很小的分类 helper 文件，仅当复读分类逻辑需要被测试复用。

不建议修改：

- `src/data/lines/love.json`
- `src/data/lines/setback-events.json`
- `src/core/GameEngineIntegration.ts`
- 包 B/C 相关路线与候选池逻辑

## 分步落实方式

### Step 1：只读确认误伤样本

目标：确认 `love_misunderstanding` 被归类为 injury 的直接原因。

检查点：

1. 读取 `scripts/reproduceEventRepetition.ts` 中 `detectEventClasses`。
2. 读取 `src/data/lines/love.json` 中 `love_misunderstanding`。
3. 确认其 tags 是爱情/冲突/支线/once，不含受伤、挫折、负面等结构化标签。
4. 确认误伤来自 `description` 或 `text` 中的“伤人”。

进入下一步条件：

- 能明确说明误伤来源是分类规则，而不是事件数据生命周期。

### Step 2：收窄 injury 识别规则

目标：让 injury 识别优先依赖结构化信号。

建议优先级：

1. tags 明确包含 `injury`、`受伤`、`创伤`、`伤势` 时判为 injury。
2. event id 或 category 明确包含 `injury`、`wound`、`setback_injury` 时判为 injury。
3. title/description 中出现更明确短语如“受伤”“伤势”“创伤”“练功受伤”时判为 injury。
4. 不再用单字 `伤` 作为泛匹配条件。
5. 对“伤人”“伤心”“伤感”“伤情”这类词不得判为 injury。

注意：

- 不应通过给 `love_misunderstanding` 加特殊黑名单来解决。
- 应让规则本身对同类误伤有抵抗力。

### Step 3：补分类测试

目标：以后文本里出现“伤人”不会重新污染复读指标。

建议测试覆盖：

1. `setback_injury` 或构造的真实受伤事件应被判为 injury。
2. `love_misunderstanding` 或构造的“流言最伤人”事件不应被判为 injury。
3. illness 和 economy 的基础识别不应被破坏。
4. 相邻同类统计只计算真实分类后的同类事件。

测试位置：

- 若 `detectEventClasses` 仍留在脚本内，可在 `tests/AllTests.ts` 做脚本级 helper 测试需要先导出 helper。
- 若抽成 helper 文件，则直接测 helper。

### Step 4：复跑指标

必跑：

```bash
npm run typecheck
npm test
npm run repro:event-repetition
```

建议补跑：

```bash
npm run report:rhythm-metrics
npm run verify:route-track-samples
```

若修改涉及构建路径，再跑：

```bash
npm run build
```

## 验收标准

阻断项：

- `npm run typecheck` 通过。
- `npm test` 通过。
- `npm run repro:event-repetition` 不再因为 `love_misunderstanding -> setback_injury` 报 same_class。
- `same_event` 保持达标。

期望项：

- `same_class` 回到阈值内，或剩余问题明确是真实挫折类密度，而不是分类误伤。
- 短窗口同类重复回到阈值内，或剩余问题能归入包 B 的节奏分布。

观察项：

- `report:rhythm-metrics` 的 formal/daily 比例仍可能偏离。这不属于 A-tail。
- 多样本中 spouse/children 仍可能偏弱。这不属于 A-tail。
- 路线样本应继续保持 route-track completed。

## 对后续包的影响

A-tail 完成后：

- A/A-prime 生命周期口径可以视为基本收口。
- 包 B 可以专注 formal/daily 和年龄段节奏，不再被误分类复读干扰。
- 包 C 的路线完成指标可以继续保留当前成果。
- 包 D 可以开始设计体验门禁，但应把“分类规则误伤”作为门禁设计风险之一。

## 交付物

执行会话完成后应交付：

- 修改文件清单。
- 复读分类规则说明。
- 新增或更新的测试说明。
- `npm run repro:event-repetition` before/after。
- `npm test` 结果。
- 是否仍需要包 B 回补节奏问题的判断。

## 新会话启动提示词

```text
你正在接手 wuxia-life 体验治理的包 A-tail：复读分类收口。

请先读取并遵守 AGENTS.md，然后读取：

1. agent_docs/current-state-problem-description.md
2. docs/PRD/experience-governance-distributed-plan.md
3. agent_docs/experience-governance-dispatch-index.md
4. agent_docs/experience-governance-pack-a-prime-lifecycle-closure.md
5. agent_docs/experience-governance-pack-a-tail-repetition-classifier.md

背景：
A-prime 已经修复 choice/outcome effects 执行口径，love_first_meet 连刷消失，npm test/typecheck/build 通过。但 repro:event-repetition 仍因 same_class/短窗口同类略超阈值未完全健康。当前已知样本是 love_misunderstanding -> setback_injury，其中 love_misunderstanding 被“流言最伤人”误判为 injury。

任务目标：
只收口复读分类误伤，不调候选池，不动路线，不扩写剧情。

请先只读分析，不要修改代码。重点确认：
1. detectEventClasses 为什么把 love_misunderstanding 判为 injury
2. 当前 injury/illness/economy 分类各依赖哪些文本或结构化信号
3. 怎样收窄 injury 规则而不漏掉真实受伤事件
4. 需要哪些测试防止“伤人/伤心/伤感”再次误判

只读分析后，请输出实施计划，必须包含：
1. 计划修改文件
2. 明确不修改的包 B/C 范围
3. 分类规则调整原则
4. 测试与验证命令
5. 对包 D 门禁设计的影响

等待审批后才能改代码。
```

# Simulation-Driven Optimization Session Prompts

## 使用说明

本文件用于把“模拟驱动优化流程”分发给其他会话。

它不绑定某个历史大包，而是用于未来的 **单个问题 slice**。每次只复制一个提示词，不要把多个问题合并进同一会话。

所有会话必须先读取：

1. `AGENTS.md`
2. `docs/designs/simulation-driven-optimization-workflow.md`
3. 当前问题对应的 PRD / slice 文档
4. 当前问题最近一次 baseline、regression、before/after 报告

所有会话必须遵守：

- 先只读分析
- 先做问题分类
- 先给实施计划
- 等审批后再改代码
- 不得默认跳到 `world profile` 或 `runtime`

## 控制器提示词

```text
你正在接手 wuxia-life 的一次 simulation-driven optimization 控制会话。

请先读取并遵守 AGENTS.md，然后读取：

1. docs/designs/simulation-driven-optimization-workflow.md
2. 当前激活的 PRD 或 slice 文档
3. 当前问题最近一次 baseline / audit 报告
4. 当前问题最近一次 before/after 或 regression 报告（若存在）

当前目标不是立刻改代码，而是确认：
- 这个问题的玩家体感是什么
- 这个问题如何被指标化
- 它当前属于 tuning_config、world profile 还是 runtime
- 下一会话最适合启动哪个单一 slice

请输出：
1. 你识别到的当前问题 statement
2. 当前指标与 acceptance direction
3. 当前分类层级及理由
4. 建议启动的单一优化 slice
5. 本轮绝对不应扩散到的范围

不要修改代码。不要把多个问题合并成一个大任务。不要跳过分类步骤。
```

## 通用只读分析提示词

```text
你正在接手 wuxia-life 的一个 simulation-driven optimization slice。

请先读取并遵守 AGENTS.md，然后读取：

1. docs/designs/simulation-driven-optimization-workflow.md
2. 当前 slice 对应 PRD 或任务文档
3. 当前问题最近一次 baseline / audit 报告
4. 当前问题最近一次 regression / before-after 报告（若存在）

本会话先只读分析，不要改代码。

请重点确认：
1. 当前玩家问题的真实表现是什么
2. 当前问题对应哪些可复现指标
3. 这些指标来自哪些命令、哪些种子、哪些报告
4. 问题更像 tuning_config、world profile，还是 runtime
5. 哪些 surface 是本轮可以动的，哪些 surface 绝对不能动

请输出实施计划，必须包含：
1. 问题 statement
2. 指标定义
3. 问题分类及理由
4. 计划修改文件
5. 明确不修改文件
6. 成功判定
7. 验证命令
8. 若本轮失败，下一层应升级到哪里

等待审批后才能改代码。不要直接提出大改架构。
```

## `tuning_config` Slice 提示词

```text
你正在接手 wuxia-life 的一个 simulation-driven optimization slice，并且该问题当前分类为 `tuning_config`。

请先读取并遵守 AGENTS.md，然后读取：

1. docs/designs/simulation-driven-optimization-workflow.md
2. 当前 slice PRD / 目标文档
3. baseline / audit 报告
4. 最新 regression / before-after 报告（若存在）

本轮目标：
- 只在 `tuning_config` 层处理问题
- 用 before/after 证明指标是否改善
- 不进入 world profile 或 runtime

请先只读分析，不要改代码。重点确认：
1. 当前问题是否真的主要由频率、重复压力、cooldown、weight、触发概率或单个 pacing knob 导致
2. 哪 1 到 2 个 tuning levers 最可能有效
3. 当前指标是否已足够支持 attribution
4. 哪些 guardrails 必须重跑

实施计划必须包含：
1. 计划修改文件
2. 允许修改的具体 knobs
3. 明确禁止修改的范围
4. baseline 与 after 使用的同一组命令
5. 成功判定
6. 若指标无改进，升级到 world profile 的证据条件

审批后执行时，禁止：
- 新增 routeDefinitions
- 新增 echoHooks
- 修改 `src/core/**`
- 借机做 profile 结构重构
- 一次改多个 pacing surfaces（除非 PRD 明确允许）
```

## `world profile` Slice 提示词

```text
你正在接手 wuxia-life 的一个 simulation-driven optimization slice，并且该问题当前分类为 `world profile / content structure`。

请先读取并遵守 AGENTS.md，然后读取：

1. docs/designs/simulation-driven-optimization-workflow.md
2. 当前 slice PRD / 目标文档
3. 证明 tuning_config 不足的最近一轮 before/after 报告
4. 与当前主题相关的 world profile 边界或 formalization 文档

本轮目标：
- 只处理 theme-owned / profile-owned 结构问题
- 不把 profile 问题伪装成单纯 tuning
- 不直接跳到 shared runtime

请先只读分析，不要改代码。重点确认：
1. 当前缺的是哪类 theme-owned 语义或内容结构
2. 为什么 tuning 已经不足
3. 这些结构是否应归 world profile，而不是散落在 generic config
4. 是否仍能避免 touching shared runtime

实施计划必须包含：
1. 问题 statement
2. 为什么必须升级到 world profile
3. 计划修改文件
4. 明确不修改文件
5. 成功判定
6. 验证命令
7. 若 profile 仍不足，升级到 runtime 的证据条件

审批后执行时，禁止：
- 把 shared runtime 修改混入本轮
- 一边做 profile，一边顺手大改 tuning unrelated surfaces
- 用抽象重构代替具体问题收口
```

## `runtime` Slice 提示词

```text
你正在接手 wuxia-life 的一个 simulation-driven optimization slice，并且该问题当前分类为 shared `runtime`。

请先读取并遵守 AGENTS.md，然后读取：

1. docs/designs/simulation-driven-optimization-workflow.md
2. 当前 slice PRD / 目标文档
3. 最近一轮证明 tuning_config 不足的报告
4. 最近一轮证明 world profile 不足的报告

本轮目标：
- 只解决“现有 config/profile 无法表达”的执行层问题
- 保持 runtime 改动最小
- 清楚说明为什么上两层不能解决

请先只读分析，不要改代码。重点确认：
1. 具体缺失的是哪条执行语义
2. 为什么现有 config/profile 无法表达
3. 最小 runtime 改动路径是什么
4. 会影响哪些既有门禁或能力边界

实施计划必须包含：
1. runtime 级问题 statement
2. tuning/profile 为何不足的证据
3. 计划修改文件
4. 风险点
5. 验证命令
6. 回归命令
7. 需要更新的边界文档

审批后执行时，禁止：
- 顺手重构 unrelated runtime
- 借 runtime 改动吞并 profile/content 问题
- 跳过 regression 和边界文档更新
```

## 修复后复核提示词

```text
你正在接手 wuxia-life 一个已修复后的 simulation-driven optimization 复核会话。

请先读取并遵守 AGENTS.md，然后读取：

1. docs/designs/simulation-driven-optimization-workflow.md
2. 当前 slice 文档
3. 上一轮失败或残余问题对应的验证结论
4. 最新代码与报告

本会话只做只读验证，不要改代码。

请：
1. 重跑上一次失败的精确检查，而不是重新发散审查
2. 明确区分“运行通过”与“指标达标”
3. 如果仍有问题，只输出窄范围修复提示词
4. 如果无问题，明确说明哪个层级问题已经收口、还剩什么 residual

输出必须包含：
1. 实际重跑的命令
2. 指标结果
3. 守门结果
4. 是否达到 slice success criteria
5. 若未达标，复制即用的修复提示词
```

## 审批后执行模板

```text
已审批执行当前 simulation-driven optimization slice 的实施计划。请严格按已批准计划实施，不要扩大范围。

执行要求：
1. 只修改计划中列出的文件
2. 每完成一个关键步骤后运行对应验证
3. 若发现计划外问题，先记录为风险，不要顺手修
4. 最终输出改动清单、验证结果、before/after 指标、残余风险和是否需要升级层级
```

## 建议你在分发时附带的最小上下文

给其他会话发起任务时，至少补上这几项：

- 当前问题 statement
- 当前分类：`tuning_config` / `world profile` / `runtime`
- 当前 baseline 指标
- 本轮 success criteria
- 允许修改的文件
- 禁止修改的文件

如果这六项没有写清楚，其他会话很容易重新发散成大改造。

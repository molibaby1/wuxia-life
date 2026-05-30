# 体验治理多会话提示词

## 使用说明

本文件用于把体验治理任务分发给新会话。每个新会话只复制一个对应提示词，不要一次复制多个包的提示词。

新会话必须先读取：

1. `AGENTS.md`
2. `agent_docs/current-state-problem-description.md`
3. `docs/PRD/experience-governance-distributed-plan.md`
4. `docs/PRD/experience-governance-distributed-plan.prd.json`
5. `agent_docs/experience-governance-dispatch-index.md`
6. 对应执行包文档

所有会话必须遵守：先只读分析，再给实施计划，等待审批后再改代码。

## 总控接力提示词

```text
你正在接手 wuxia-life 项目的体验治理阶段。请先读取并遵守 AGENTS.md，然后读取以下文档：

1. agent_docs/current-state-problem-description.md
2. docs/PRD/experience-governance-distributed-plan.md
3. docs/PRD/experience-governance-distributed-plan.prd.json
4. agent_docs/experience-governance-dispatch-index.md

当前目标不是立刻改代码，而是确认体验治理的执行顺序、包依赖、可并行边界和当前工作区状态。

请输出：
1. 你识别到的治理总目标
2. A/B/C/D 四个包的依赖关系
3. 当前最适合启动的包
4. 启动该包前需要确认的风险

不要修改代码。不要扩展 PRD 范围。不要把多个包合并成一个大改动。
```

## 包 A 启动提示词：事件生命周期与复读根因治理

```text
你正在接手 wuxia-life 体验治理的包 A：事件生命周期与复读根因治理。

请先读取并遵守 AGENTS.md，然后读取：

1. agent_docs/current-state-problem-description.md
2. docs/PRD/experience-governance-distributed-plan.md
3. agent_docs/experience-governance-dispatch-index.md
4. agent_docs/experience-governance-pack-a-event-lifecycle.md

任务目标：
解决同一事件、同类事件和生命周期事件复读的底层来源，让事件是否可触发具有一致、可解释、可验证的规则。

请先只读分析，不要修改代码。重点确认：
1. 真实引擎路径与复读脚本路径是否使用同一事件历史口径
2. EventRecordHandler、eventHistory、player.events、maxTriggers、cooldown 的关系
3. triggerConditions.flags.required/not 是否仍被数据依赖，以及当前执行器是否真正处理
4. 哪些宽年龄段、高权重、高复用事件最容易制造复读

只读分析后，请输出实施计划，必须包含：
1. 计划修改文件
2. 不修改文件
3. 成功指标
4. 验证命令
5. 对包 B/C 的影响

等待审批后才能改代码。不要处理候选池节奏策略，不要重做路线系统，不要改 UI。
```

## 包 B 启动提示词：年龄段与候选池节奏治理

```text
你正在接手 wuxia-life 体验治理的包 B：年龄段与候选池节奏治理。

请先读取并遵守 AGENTS.md，然后读取：

1. agent_docs/current-state-problem-description.md
2. docs/PRD/experience-governance-distributed-plan.md
3. agent_docs/experience-governance-dispatch-index.md
4. agent_docs/experience-governance-pack-b-rhythm-distribution.md

任务目标：
修正 formal、daily、storyline、family、setback、career 等事件在年龄段中的分布，让人生节奏从“正式事件连续播放”变成有阶段、有呼吸、有主次的体验。

请先只读分析，不要修改代码。重点确认：
1. getAvailableEvents 的候选池排序、截断和抽样策略
2. formal/daily/storyline 在不同年龄段的实际比例
3. 少数高优先级、宽年龄段事件是否长期占据 top candidates
4. 包 A 的事件历史口径结论是否已经足够稳定，可以作为本包前提

只读分析后，请输出实施计划，必须包含：
1. 计划修改文件
2. 候选池策略的最小变更范围
3. before/after rhythm 指标
4. 验证命令
5. 对包 C 路线调度的影响

等待审批后才能改代码。不要修事件历史问题，不要重做路线生命周期，不要大量新增剧情内容。
```

## 包 C 启动提示词：路线主导权治理

```text
你正在接手 wuxia-life 体验治理的包 C：路线主导权治理。

请先读取并遵守 AGENTS.md，然后读取：

1. agent_docs/current-state-problem-description.md
2. docs/PRD/experience-governance-distributed-plan.md
3. agent_docs/experience-governance-dispatch-index.md
4. agent_docs/experience-governance-pack-c-route-dominance.md

任务目标：
让路线系统从“字段存在”变成“主流程事件调度、生命周期推进和玩家体感”的主导因素。

请先只读分析，不要修改代码。重点确认：
1. events.json 声明的线路文件与 EventLoader 实际加载是否一致
2. routeStates 为什么长期停留 active，completion 为什么稳定为 0
3. routeTargets、routeTransition、pathAffinity 等元数据在真实事件中是否足够存在
4. 路线推进规则是否真正影响候选池，而不是只改变状态字段
5. 包 A/B 的门禁与候选池结论是否已经可作为前提

只读分析后，请输出实施计划，必须包含：
1. 计划修改文件
2. 路线加载、路线元数据、路线调度分别如何收口
3. 至少两条核心路线的验收标准
4. 验证命令
5. 对包 D 门禁指标的建议

等待审批后才能改代码。不要大规模扩写全部路线剧情，不要重构身份系统，不要修改 UI。
```

## 包 D 启动提示词：体验验证门禁升级

```text
你正在接手 wuxia-life 体验治理的包 D：体验验证门禁升级。

请先读取并遵守 AGENTS.md，然后读取：

1. agent_docs/current-state-problem-description.md
2. docs/PRD/experience-governance-distributed-plan.md
3. agent_docs/experience-governance-dispatch-index.md
4. agent_docs/experience-governance-pack-d-experience-gate.md

任务目标：
把体验健康从“报告里看起来有问题”升级为“指标能发现、门禁能阻断、waiver 有理由”的长期防线。

请先只读分析，不要修改代码。重点确认：
1. 当前哪些体验坏味道只出现在报告中，却不会导致失败
2. 复读、节奏、路线、家庭/恋爱分别缺哪些机器可读指标
3. 多 seed、多 persona、多年龄段样本是否覆盖了真实坏体验
4. blocker、warning、info 的分级是否能区分“必须阻断”和“需要观察”
5. A/B/C 是否已经产出可接入门禁的指标或报告字段

只读分析后，请输出实施计划，必须包含：
1. 计划修改文件
2. 新增或升级的指标
3. 失败阈值和 waiver 规则
4. 验证命令
5. closure 报告结构

等待审批后才能改代码。不要直接修业务逻辑，不要一次性把所有 warning 升为 blocker，不要删除旧报告。
```

## 包完成后的交接提示词

```text
你正在接手 wuxia-life 体验治理的后续会话。请先读取并遵守 AGENTS.md，然后读取：

1. docs/PRD/experience-governance-distributed-plan.md
2. agent_docs/experience-governance-dispatch-index.md
3. 已完成包的最终报告或交付说明
4. 即将启动包的执行包文档

请先只读确认：
1. 上一个包实际改了哪些文件
2. 上一个包的验证命令和 before/after 指标
3. 上一个包留下了哪些残余风险
4. 这些结论对当前包的前提是否成立

然后输出当前包的只读分析和实施计划。等待审批后才能改代码。
```

## 审批后执行提示词模板

```text
已审批执行当前包的实施计划。请严格按已批准计划实施，不要扩大范围。

执行要求：
1. 只修改计划中列出的文件
2. 每完成一个关键步骤后运行对应验证
3. 若发现计划外问题，先记录为风险，不要顺手修
4. 最终输出改动清单、验证结果、before/after 指标、残余风险和对后续包的影响
```

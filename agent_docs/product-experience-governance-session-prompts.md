# Product Experience Governance Session Prompts

本文件提供可复制的新会话提示词。每次只复制一个包的提示词，不要合并多个包执行。

所有会话必须遵守项目流程：先只读分析，输出实施计划，等待审批后再改代码。

## Controller Prompt

```text
你正在接手 wuxia-life 的 product-experience-governance PRD 分发控制。

请先读取并遵守 AGENTS.md，然后读取：

1. docs/PRD/product-experience-governance.md
2. docs/PRD/product-experience-governance.prd.json
3. agent_docs/product-experience-governance-execution-pack.md
4. agent_docs/product-experience-governance-dispatch-index.md

当前目标不是改代码，而是确认 PXG0-PXG5 的执行顺序、依赖、可并行边界和当前工作区状态。

请输出：
- 你识别到的治理总目标
- PXG0-PXG5 的依赖关系
- 当前最适合启动的包
- 启动该包前需要确认的风险

不要修改代码。不要扩展 PRD 范围。不要把多个包合并成一个大改动。
```

## PXG0 Prompt: Scope Freeze and Architecture Guardrails

```text
你正在接手 wuxia-life product-experience-governance 的 PXG0：Scope Freeze and Architecture Guardrails。

本会话只处理 US-001 和 US-022。

请先读取并遵守 AGENTS.md，然后读取：

1. docs/PRD/product-experience-governance.md
2. docs/PRD/product-experience-governance.prd.json
3. agent_docs/product-experience-governance-execution-pack.md
4. agent_docs/product-experience-governance-dispatch-index.md

Goal:
- 冻结 0-30 岁黄金人生线范围、三条优先路线、非目标和未来架构护栏。

只读分析重点：
- 当前文档是否已经明确 0-30 范围。
- 是否已有 stale 文档把本阶段描述成 full 0-80、后端、数据库或小程序工作。
- 当前 save/state/event/choice result 是否已有可序列化与数据驱动约束描述。

计划必须包含：
- 计划修改文件。
- 不修改文件。
- 成功指标。
- 验证命令。
- 对 PXG1/PXG4 的 handoff。

等待审批后才能改代码或文档。不要新增事件内容，不要调整 UI，不要引入新架构。
```

## PXG1 Prompt: Event Asset and State Field Audit

```text
你正在接手 wuxia-life product-experience-governance 的 PXG1：Event Asset and State Field Audit。

本会话只处理 US-002、US-003、US-004、US-014。

请先读取并遵守 AGENTS.md，然后读取：

1. docs/PRD/product-experience-governance.md
2. docs/PRD/product-experience-governance.prd.json
3. agent_docs/product-experience-governance-execution-pack.md
4. agent_docs/product-experience-governance-dispatch-index.md

Goal:
- 盘点 runtime-loaded 与 non-loaded event assets，建立 event asset status、active admission rules 和 route-like state field audit。

只读分析重点：
- EventLoader 或等价 runtime 加载路径。
- 事件文件目录和 manifest。
- route、identity、sect、faction、karma、flag 等字段的读写点。
- 当前质量报告是否混淆 active 与 deferred 内容。

计划必须包含：
- 计划修改文件。
- event inventory 与 classification 的存放位置。
- active admission rules 的落位。
- 验证命令。
- 对 PXG2/PXG3/PXG4 的 handoff。

等待审批后才能改文件。不要把 deferred 内容批量迁入 active，不要新增路线剧情，不要修相邻 gameplay bug。
```

## PXG2 Prompt: Golden Line Spine, Feedback, and Payoff

```text
你正在接手 wuxia-life product-experience-governance 的 PXG2：Golden Line Spine, Feedback, and Payoff。

本会话只处理 US-005、US-006、US-007、US-008。

请先读取并遵守 AGENTS.md，然后读取：

1. docs/PRD/product-experience-governance.md
2. docs/PRD/product-experience-governance.prd.json
3. agent_docs/product-experience-governance-execution-pack.md
4. agent_docs/product-experience-governance-dispatch-index.md
5. PXG1 的交付报告或 handoff

Goal:
- 建立 0-30 岁 golden-line event spine，定义 choice feedback standard，清理 active golden-line air feedback，并产出 key-choice-to-payoff map。

只读分析重点：
- PXG1 标记为 active 的事件。
- birth、childhood identity、first formative choice、route entry、first route conflict、relationship/mentor beat、early adulthood consequence 可用候选。
- 当前 feedback 文案和 fallback pattern。
- durable state 和 later payoff 的可读写关系。

计划必须包含：
- 计划修改文件。
- 不修改范围。
- golden-line timeline 成功指标。
- feedback/payoff 验证方式。
- 对 PXG3/PXG4 的 handoff。

等待审批后才能改文件。不要扩到 full 0-80，不要大规模新增 unrelated content，不要重做路线系统。
```

## PXG3 Prompt: Priority Route Lifecycle

```text
你正在接手 wuxia-life product-experience-governance 的 PXG3：Priority Route Lifecycle。

本会话只处理 US-009、US-010、US-011、US-012、US-013。

请先读取并遵守 AGENTS.md，然后读取：

1. docs/PRD/product-experience-governance.md
2. docs/PRD/product-experience-governance.prd.json
3. agent_docs/product-experience-governance-execution-pack.md
4. agent_docs/product-experience-governance-dispatch-index.md
5. PXG1 的 field audit
6. PXG2 的 golden-line 和 payoff 口径，若已完成

Goal:
- 为 orthodox/sect、wandering hero、demonic path 定义 route lifecycle、route beats、key choices、payoffs、failure/transition 和 conflict rules。

只读分析重点：
- 当前路线状态字段与实际事件是否对齐。
- 三条优先路线是否已有入口、承诺、冲突、失败、转向或完成事件。
- 是否存在互斥或可共存的身份状态。
- history/debug report 当前如何展示路线。

计划必须包含：
- 计划修改文件。
- 三条路线分别如何收口。
- route conflict table 落位。
- 验证命令。
- 对 PXG4/PXG5 的 handoff。

等待审批后才能改文件。不要扩写全部路线宇宙，不要重构身份系统，不要引入新架构层。
```

## PXG4 Prompt: Simulation and Experience Gates

```text
你正在接手 wuxia-life product-experience-governance 的 PXG4：Simulation and Experience Gates。

本会话只处理 US-015、US-016、US-017、US-018、US-019。

请先读取并遵守 AGENTS.md，然后读取：

1. docs/PRD/product-experience-governance.md
2. docs/PRD/product-experience-governance.prd.json
3. agent_docs/product-experience-governance-execution-pack.md
4. agent_docs/product-experience-governance-dispatch-index.md
5. PXG2/PXG3 的交付报告或 handoff

Goal:
- 建立 deterministic 0-30 simulation，并让 continuity、feedback completeness、route health、active issue classification 成为可失败门禁。

只读分析重点：
- 当前 simulate 和 gate 脚本。
- 事件执行路径是否与真实游戏一致。
- 当前报告里哪些问题只是 warning/info。
- PXG2 的 key-choice-to-payoff map 和 banned feedback patterns。
- PXG3 的 route contradiction 定义。

计划必须包含：
- 计划修改文件。
- deterministic simulation 输入/输出结构。
- gate 指标和失败阈值。
- waiver 或 warning 规则。
- 验证命令。
- 对 PXG5 的 handoff。

等待审批后才能改文件。不要直接修业务逻辑，不要把所有 warning 升为 blocker，不要删除旧报告。
```

## PXG5 Prompt: Minimum Playable UI and Closure

```text
你正在接手 wuxia-life product-experience-governance 的 PXG5：Minimum Playable UI and Closure。

本会话只处理 US-020、US-021、US-023、US-024。

请先读取并遵守 AGENTS.md，然后读取：

1. docs/PRD/product-experience-governance.md
2. docs/PRD/product-experience-governance.prd.json
3. agent_docs/product-experience-governance-execution-pack.md
4. agent_docs/product-experience-governance-dispatch-index.md
5. PXG4 的 gate 和 simulation handoff

Goal:
- 定义并实现最低限度的 player-flow 信息清晰度，移除默认流程 debug intrusion，更新 stale documentation claims，并产出 governance closure report。

只读分析重点：
- 当前 gameplay screen desktop/mobile 信息布局。
- 默认 player flow 是否展示 raw event ids、raw condition data 或 debug-only text。
- 哪些文档仍夸大 event count、completion phase 或 playable coverage。
- PXG4 可提供哪些 closure evidence。

计划必须包含：
- 计划修改文件。
- UI 最小变更范围和浏览器验证方式。
- 文档更新范围。
- closure report 结构。
- 验证命令。
- 残余风险。

等待审批后才能改文件。不要做完整视觉重设计，不要做 mini-program-specific UI，不要引入后端、数据库、账号或云同步。
```

## Approved Execution Prompt

```text
已审批执行当前包的实施计划。请严格按已批准计划实施，不要扩大范围。

执行要求：
1. 只修改计划中列出的文件。
2. 每完成一个关键步骤后运行对应验证。
3. 若发现计划外问题，先记录为风险，不要顺手修。
4. 最终输出 Goal、Changes Made、Validation Run、Evidence、Risks / Unknowns、Handoff。
```

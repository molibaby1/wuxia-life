# Product Experience Governance Execution Pack

本执行包由 `docs/PRD/product-experience-governance.prd.json` 拆分而来，用于把 0-30 岁黄金人生线治理拆成可多会话分发的小包。后续会话一次只领取一个包，先只读分析并提交计划，获批后再改代码。

## Governing Scope

- 当前目标是先把一个 0-30 岁可玩体验做扎实。
- 本阶段不启动前后端分离、数据库接入、账号系统、云同步、小程序运行时或完整 0-80 岁覆盖。
- 优先路线为 orthodox/sect、wandering hero、demonic path。
- 事件资产必须区分 active、candidate、broken、deferred、dead。
- active golden-line 内容的质量问题是 blocker；deferred 内容的问题应进入 backlog 或 warning。

## Pack Map

| Pack | Story Range | Theme | Depends On |
|---|---:|---|---|
| PXG0 | US-001, US-022 | 范围冻结与架构护栏 | 无 |
| PXG1 | US-002, US-003, US-004, US-014 | 事件资产与状态字段审计 | PXG0 |
| PXG2 | US-005, US-006, US-007, US-008 | 黄金线事件脊柱、反馈与 payoff | PXG1 |
| PXG3 | US-009, US-010, US-011, US-012, US-013 | 三条优先路线生命周期 | PXG1, PXG2 的规则口径 |
| PXG4 | US-015, US-016, US-017, US-018, US-019 | 仿真场景与体验门禁 | PXG2, PXG3 |
| PXG5 | US-020, US-021, US-023, US-024 | 最小可玩 UI、文档与收口报告 | PXG4 |

## Sequencing Rules

1. PXG0 必须最先完成，冻结 0-30 范围、非目标和架构护栏。
2. PXG1 必须先于 PXG2/PXG3，因为后续故事需要知道哪些事件和字段是真实运行资产。
3. PXG2 和 PXG3 可以在 PXG1 完成后并行，但 route payoff 口径需要保持一致。
4. PXG4 必须等 PXG2/PXG3 至少形成可测契约后推进。
5. PXG5 最后收口；UI 可以在 PXG4 前做只读分析，但默认不应先改。

## Shared Rules

- 每个包只处理自己的 story，不顺手修相邻问题。
- 文档、报告或生成物不得包含本地绝对路径。
- 修复问题时优先找根因，不做兼容兜底。
- 新增验证必须能说明为什么对应当前包的验收标准。
- 如发现必须跨包修改，停止并在 handoff 中列为 blocker。

## PXG0: Scope Freeze and Architecture Guardrails

**Status:** complete (2026-05-30)

**Deliverable:** `docs/PRD/product-experience-governance-scope-and-guardrails.md`

Stories: US-001, US-022

Goal:
- 定义 0-30 岁黄金人生线的阶段边界、路线范围、非目标和未来架构护栏。

Scope:
- 产品范围文档。
- 可序列化状态、数据驱动事件、结构化 choice result、save schema version 的原则说明。
- 明确本阶段不引入 database、backend API、账号、云同步、小程序 runtime。

Do Not:
- 不修改业务代码。
- 不新增事件内容。
- 不调整 UI。

Validation:
- `npm run typecheck`
- 文档中能检索到 0-30、三条优先路线、非目标和架构护栏。
- 文档不含本地绝对路径。

Handoff:
- **→ PXG1：** 审计年龄边界 0–30；runtime 以 `events.json` imports 为准；优先路线候选池与 non-priority loaded 路线见 scope doc §5.1。
- **→ PXG4：** 仿真 `endAge=30`；4 个 deterministic scenarios；replay 最小字段集见 scope doc §2.3 与 §5.2。

## PXG1: Event Asset and State Field Audit

**Status:** complete (2026-05-30)

**Deliverables:**
- `src/data/event-asset-manifest.json` (machine source of truth)
- `docs/test-reports/product-experience-governance-event-asset-audit.md`
- `docs/test-reports/product-experience-governance-active-admission-rules.md`
- `docs/test-reports/product-experience-governance-state-field-audit.md`
- `npm run report:event-asset-inventory`

Stories: US-002, US-003, US-004, US-014

Goal:
- 搞清楚哪些事件文件真的被 runtime 加载，哪些只是 backlog，并建立 active 事件准入规则。

Scope:
- 事件加载路径只读分析。
- runtime-loaded 与 non-loaded event inventory。
- active/candidate/broken/deferred/dead 分类报告或数据文件。
- route、identity、sect、faction、karma、flag 等字段的读写审计。
- active 事件准入规则。

Do Not:
- 不改业务运行逻辑，除非计划获批后只补审计脚本或报告生成脚本。
- 不把 deferred 内容批量迁入 active。
- 不新增路线剧情。

Validation:
- `npm run typecheck`
- 如新增报告脚本，运行对应 report 命令。
- active 与 deferred 数量可复核。
- 每个 runtime-loaded event 和 non-loaded event file 都有分类。

Handoff:
- 给 PXG2 提供 active golden-line 可选事件池。
- 给 PXG3 提供 route-like 字段主流/兼容/候选/废弃结论。
- 给 PXG4 提供 gate 应扫描的 active 范围。

## PXG2: Golden Line Spine, Feedback, and Payoff

**Status:** complete (2026-05-30)

**Deliverables:**
- `src/data/golden-line-spine.json`
- `src/data/golden-line-payoff-map.json`
- `src/data/golden-line-feedback-patterns.ts`
- `docs/test-reports/product-experience-governance-golden-line-spine.md`
- `docs/test-reports/product-experience-governance-choice-feedback-standard.md`
- `docs/test-reports/product-experience-governance-key-choice-payoff-map.md`
- `npm run report:golden-line-feedback`

Stories: US-005, US-006, US-007, US-008

Goal:
- 选出 0-30 岁黄金线事件脊柱，并让关键 choice 有明确反馈和后续 payoff。

Scope:
- birth、childhood identity、first formative choice、route entry、first route conflict、relationship/mentor beat、early adulthood consequence。
- 反馈标准：immediate narrative、visible impact、future implication。
- allowed visible impact categories。
- banned vague feedback patterns。
- key-choice-to-payoff map。

Do Not:
- 不扩写完整 0-80 内容。
- 不大规模新增 unrelated content。
- 不重做路线系统实现。

Validation:
- `npm run typecheck`
- 黄金线 0-30 无超过 2 年的 unexplained event gap。
- 至少 6 个 manual choice events。
- 至少 3 个 later payoffs。
- active golden-line vague feedback count 为 0。

Handoff:
- 给 PXG3 提供 route entry、commitment、failure 或 transition 需要引用的关键事件。
- 给 PXG4 提供 key-choice-to-payoff map 和 banned feedback patterns。

## PXG3: Priority Route Lifecycle

Stories: US-009, US-010, US-011, US-012, US-013

Goal:
- 给 orthodox/sect、wandering hero、demonic path 三条优先路线建立生命周期、冲突规则和早期弧线。

Scope:
- route lifecycle states: start、commitment、conflict、turn、completion、failure。
- 三条路线 ages 0-30 beats。
- 每条路线至少 3 个 route-specific key choices。
- 每条路线至少 2 个 later payoffs。
- route conflict table。
- route state 在 history 或 debug report 中的呈现口径。

Do Not:
- 不做全路线宇宙扩写。
- 不重构身份系统。
- 不引入新架构层。

Validation:
- `npm run typecheck`
- route conflict table 可用于测试。
- 三条优先路线都有 entry、commitment、failure/turn-away 规则。
- deterministic scenario 中 route contradiction rate 应为 0。

Handoff:
- 给 PXG4 提供 route health gate 的输入字段、阈值和 contradiction 定义。
- 给 PXG5 提供 player flow 中允许展示的 route state。

## PXG4: Simulation and Experience Gates

Stories: US-015, US-016, US-017, US-018, US-019

Goal:
- 建立 deterministic 0-30 simulation 和 experience gates，让黄金线断裂、反馈缺失、路线矛盾、active blocker 不能静默通过。

Scope:
- deterministic simulation input。
- simulation output: age、event id、route state、choices、feedback、durable states。
- continuity gate。
- feedback completeness gate。
- route health gate。
- active-scope blocker reclassification。

Do Not:
- 不直接修业务逻辑，除非门禁脚本口径本身错误且获批。
- 不把所有 warning 一次性升为 blocker。
- 不删除旧报告。

Validation:
- `npm run typecheck`
- `npm run gate:experience`
- `npm run simulate:gameplay:samples -- --diagnostics`
- `npm run report:experience-governance-closure`
- blocker failure 返回非零退出码。

Handoff:
- 给 PXG5 提供 closure 报告所需验证命令、黄金线仿真结果和残余风险。

## PXG5: Minimum Playable UI and Closure

Stories: US-020, US-021, US-023, US-024

Goal:
- 最小化修正玩家流清晰度，移除默认流程中的 debug intrusion，并更新文档与收口报告。

Scope:
- desktop/mobile 最低布局要求。
- event text、choices、feedback、character state、route state 的信息清晰度。
- production-like player flow 中允许的 debug 元素。
- stale documentation claims。
- governance closure report。

Do Not:
- 不做完整视觉重设计。
- 不做 mini-program-specific UI。
- 不引入后端、数据库、账号或云同步。
- 不清理所有历史文档。

Validation:
- `npm run typecheck`
- UI 改动需浏览器验证 desktop 和 mobile。
- `npm run report:experience-governance-closure`
- 文档无本地绝对路径。

Handoff:
- 明确是否可以开始规划前后端分离。
- 列出仍为 backlog 的 deferred content、UI polish 和 architecture work。

## Fixed Output Format for Executor Sessions

每个执行会话最终输出：

- Goal
- Changes Made
- Validation Run
- Evidence
- Risks / Unknowns
- Handoff

# P4 Engine Contract and Service Boundary Session Prompts

本文件提供 P4 可复制的新会话提示词。每次只复制一个 story 的提示词，不合并多个 story 执行。所有会话必须先读取并遵守 `AGENTS.md`，然后读取 P4 PRD、PRD JSON、本执行计划和分发表。

## Controller Prompt

```text
你正在接手 wuxia-life 的 P4 Engine Contract and Service Boundary 执行分发控制。

请先读取并遵守 AGENTS.md，然后读取：
1. docs/PRD/p4-engine-contract-and-service-boundary.md
2. docs/PRD/p4-engine-contract-and-service-boundary.prd.json
3. agent_docs/p4-engine-contract-and-service-boundary-application-execution-plan.md
4. agent_docs/p4-engine-contract-and-service-boundary-story-dispatch-matrix.md

当前目标不是改代码，而是确认 P4 的执行顺序、依赖、可并行边界和当前工作区状态。
请输出 P4 总目标、story 依赖、最适合启动的下一个 story、启动前风险。
不要修改代码。不要扩展 PRD 范围。不要把多个 story 合并执行。
```

## Shared Session Rules

每个 story prompt 都隐含以下规则：

- 先读取 `AGENTS.md`、P4 PRD、P4 PRD JSON、P4 execution plan、P4 dispatch matrix 和该 story 的前置产物。
- 先只读分析并提交具体实施计划，等待审批后再修改文件。
- 只处理当前 story。发现跨 story 或 runtime behavior change 要求时停止并写 handoff。
- 不实现 backend、database、account、cloud save、mini-program，也不修改 gameplay runtime 行为。
- 文档与 fixtures 不得包含本地绝对路径。

## US-001 Prompt: Rebaseline Current Engine Boundaries

```text
你正在接手 P4 US-001：Rebaseline Current Engine Boundaries。
Scope: 只读盘点 GameState、save manager、event loader、choice execution、feedback、route state、life memory、simulation 入口；分类并产出 baseline report。
Non-goals: 不修改业务代码；不设计新 contract。
Validation: npm run typecheck。
Done: baseline report 记录当前边界、deprecated 入口和阻塞未来 backend execution 的依赖。
```

## US-002 Prompt: Define P4 Non-Runtime-Behavior Guardrails

```text
你正在接手 P4 US-002：Define P4 Non-Runtime-Behavior Guardrails。
Scope: 文档化 P4 允许新增项、禁止 runtime 改动项、P3 回归命令和 prohibited change 判定。
Non-goals: 不修改业务代码；不放宽 P3 gates。
Validation: npm run typecheck。
Done: guardrails 可被所有后续 P4 session 引用。
```

## US-003 Prompt: Define Game State Snapshot Contract

```text
你正在接手 P4 US-003：Define Game State Snapshot Contract。
Scope: 定义 versioned GameStateSnapshot、字段分类、required metadata，以及 route、relationship、life memory inputs、history、save metadata 表示方式。
Non-goals: 不替换 runtime GameState；不实现 persistence。
Validation: npm run typecheck。
Done: snapshot contract 可直接指导 US-004 和 US-005。
```

## US-004 Prompt: Add Game State Snapshot Types

```text
你正在接手 P4 US-004：Add Game State Snapshot Types。
Scope: 新增并导出 snapshot metadata 和 GameStateSnapshot TypeScript types。
Non-goals: 不替换 runtime GameState；不接入 gameplay runtime。
Validation: npm run typecheck。
Done: types 可编译引用且不改变 runtime 行为。
```

## US-005 Prompt: Add Snapshot Serialization Fixture

```text
你正在接手 P4 US-005：Add Snapshot Serialization Fixture。
Scope: 新增可序列化的 0-50 snapshot fixture，覆盖 route、relationships、event history、choice history、save metadata、life memory source fields。
Non-goals: 不新增 runtime fixture loader；不修改 save behavior。
Validation: npm run typecheck；相关 tests。
Done: fixture 可被 contract tests 解析且无本地绝对路径。
```

## US-006 Prompt: Add Snapshot Contract Tests

```text
你正在接手 P4 US-006：Add Snapshot Contract Tests。
Scope: 测试 snapshot JSON round trip、required metadata、derived/volatile 非必需字段和 forbidden fields 报告。
Non-goals: 不改变 runtime serialization；不引入重型 schema framework。
Validation: npm run typecheck；相关 tests。
Done: snapshot contract drift 可被测试捕获。
```

## US-007 Prompt: Define Choice Execution Request Contract

```text
你正在接手 P4 US-007：Define Choice Execution Request Contract。
Scope: 定义 request required/optional fields、future backend 不可信 client fields、validation failures 和 error categories。
Non-goals: 不修改当前 choice execution；不实现 API。
Validation: npm run typecheck。
Done: request contract 可直接指导 US-009。
```

## US-008 Prompt: Define Choice Execution Response Contract

```text
你正在接手 P4 US-008：Define Choice Execution Response Contract。
Scope: 定义 success/failure response、next snapshot、feedback、history append、state deltas、logs、hints、warnings 和 diagnostics 分离。
Non-goals: 不修改当前反馈或 UI behavior；不实现 API。
Validation: npm run typecheck。
Done: response contract 可直接指导 US-009。
```

## US-009 Prompt: Add Choice Execution Contract Types

```text
你正在接手 P4 US-009：Add Choice Execution Contract Types。
Scope: 新增 request、success response、failure response、diagnostics TypeScript types，复用现有 feedback、route、life memory 概念。
Non-goals: 不替换当前 choice execution runtime；不接入 HTTP。
Validation: npm run typecheck。
Done: choice contract types 可编译且 runtime 未改。
```

## US-010 Prompt: Add Choice Execution Contract Fixtures

```text
你正在接手 P4 US-010：Add Choice Execution Contract Fixtures。
Scope: 新增 valid request、success response、validation failure response fixtures。
Non-goals: 不调用 runtime choice execution；不实现 API client。
Validation: npm run typecheck；相关 tests。
Done: fixtures 可验证、可序列化且无本地绝对路径。
```

## US-011 Prompt: Define Replay Log Contract

```text
你正在接手 P4 US-011：Define Replay Log Contract。
Scope: 定义 replay metadata、choice/auto/save-load/terminal entries、deterministic data、diagnostic data、snapshot hash integrity checks。
Non-goals: 不实现 replay engine；不改变 simulation behavior。
Validation: npm run typecheck。
Done: replay contract 可直接指导 US-012。
```

## US-012 Prompt: Add Replay Log Types and Fixtures

```text
你正在接手 P4 US-012：Add Replay Log Types and Fixtures。
Scope: 新增 replay log 和 entry types；新增包含多个 choices 及 route 或 relationship change 的 0-50 fixture。
Non-goals: 不实现 replay executor；不接入 runtime logging。
Validation: npm run typecheck；相关 tests。
Done: replay fixture 可序列化、可验证且无本地绝对路径。
```

## US-013 Prompt: Add Replay Contract Tests

```text
你正在接手 P4 US-013：Add Replay Contract Tests。
Scope: 测试 replay fixture validation、required metadata、entry required fields 和 malformed entries。
Non-goals: 不实现 deterministic replay runner；不修改 simulation。
Validation: npm run typecheck；相关 tests。
Done: replay contract drift 可被测试捕获。
```

## US-014 Prompt: Define Event Catalog Service Boundary

```text
你正在接手 P4 US-014：Define Event Catalog Service Boundary。
Scope: 定义 catalog version、bundle、event id、route、age、status、validation、query、filtering ownership 和 payload constraints。
Non-goals: 不迁移 event assets；不修改 EventLoader。
Validation: npm run typecheck。
Done: future event catalog read service 边界明确。
```

## US-015 Prompt: Add Event Catalog Contract Types

```text
你正在接手 P4 US-015：Add Event Catalog Contract Types。
Scope: 新增 catalog metadata、bundle request/response、validation summary TypeScript types。
Non-goals: 不修改 EventLoader；不实现 event service。
Validation: npm run typecheck。
Done: current event data 可对照 future payload shape。
```

## US-016 Prompt: Add Event Catalog Contract Validation Report

```text
你正在接手 P4 US-016：Add Event Catalog Contract Validation Report。
Scope: 报告 active、candidate、deferred、broken、dead counts；识别不适配字段和 future server-only/diagnostic-only 字段。
Non-goals: 不修改 event runtime behavior；不批量修 event assets。
Validation: npm run typecheck。
Done: catalog migration risk report 可供后续提取规划引用。
```

## US-017 Prompt: Define Save Schema Versioning Policy

```text
你正在接手 P4 US-017：Define Save Schema Versioning Policy。
Scope: 定义 schema version format、compatibility range、readable/migratable/unsupported states、拒绝条件和消息。
Non-goals: 不修改 save behavior；不实现 migration。
Validation: npm run typecheck。
Done: future persistence 有明确版本策略。
```

## US-018 Prompt: Define Save Migration Strategy

```text
你正在接手 P4 US-018：Define Save Migration Strategy。
Scope: 定义 migration 命名、排序、测试、允许操作、禁止捷径、失败回滚和 fixture 要求。
Non-goals: 不新增 migration file；不实现 database。
Validation: npm run typecheck。
Done: future migrations 有明确策略。
```

## US-019 Prompt: Define Future Database Model Boundary

```text
你正在接手 P4 US-019：Define Future Database Model Boundary。
Scope: 定义 users、save slots、snapshots、replay logs、catalog versions、migration records 的 conceptual models、关系、canonical/derived data 和 forbidden storage。
Non-goals: 不新增 database driver、ORM、migration file 或 server。
Validation: npm run typecheck。
Done: future database PRD 可引用模型边界。
```

## US-020 Prompt: Define Account and Ownership Boundary

```text
你正在接手 P4 US-020：Define Account and Ownership Boundary。
Scope: 定义 anonymous、logged-in、save slot、export/import ownership，及 anonymous save attachment 和 authorization questions。
Non-goals: 不实现 account system；不实现 cloud saves。
Validation: npm run typecheck。
Done: future account PRD 可引用 ownership 边界。
```

## US-021 Prompt: Define Frontend Adapter Boundary

```text
你正在接手 P4 US-021：Define Frontend Adapter Boundary。
Scope: 定义 UI、composables、persistence adapters、engine contracts、reports 职责；盘点 browser APIs、local storage、Vue reactivity、alerts、prompts、DOM dependencies。
Non-goals: 不修改 UI behavior；不提取 service。
Validation: npm run typecheck。
Done: service extraction 前必须包装的依赖明确。
```

## US-022 Prompt: Define Platform Adapter Requirements

```text
你正在接手 P4 US-022：Define Platform Adapter Requirements。
Scope: 定义 storage、time、random seed、logging、network、UI feedback adapters，同步性和 platform metadata。
Non-goals: 不实现 mini-program adapter；不改 Web behavior。
Validation: npm run typecheck。
Done: future platform adapter requirements 明确。
```

## US-023 Prompt: Add Contract Validation Helpers

```text
你正在接手 P4 US-023：Add Contract Validation Helpers。
Scope: 新增 snapshot、choice、replay、catalog fixture validation helpers，返回 structured success/error results，仅由 tests/reports 显式导入。
Non-goals: 不引入重型 schema framework；不接入 gameplay runtime。
Validation: npm run typecheck；相关 tests。
Done: contract fixtures 可由轻量 helpers 验证。
```

## US-024 Prompt: Add Contract Test Suite Entry

```text
你正在接手 P4 US-024：Add Contract Test Suite Entry。
Scope: 新增 dedicated contract test suite 或 documented script，覆盖 snapshot、choice、replay、catalog、save schema fixtures。
Non-goals: 不依赖 browser、backend 或 database；不改变 gameplay tests。
Validation: npm run typecheck；contract tests。
Done: contract suite 可独立运行。
```

## US-025 Prompt: Define Backend API Draft Boundaries

```text
你正在接手 P4 US-025：Define Backend API Draft Boundaries。
Scope: 定义 catalog、create/load saves、execute choices、fetch replay logs endpoint drafts，引用 P4 contracts 并列出 errors。
Non-goals: 不实现 backend server；不实现 HTTP client。
Validation: npm run typecheck。
Done: future backend implementation PRD 有稳定 API draft。
```

## US-026 Prompt: Define Service Extraction Risks and Migration Order

```text
你正在接手 P4 US-026：Define Service Extraction Risks and Migration Order。
Scope: 定义 contracts、catalog read service、snapshot persistence、choice service、replay/audit、accounts 的提取顺序；记录风险、mitigation 和 P3 gates。
Non-goals: 不执行 service extraction；不改变 runtime。
Validation: npm run typecheck。
Done: backend work 的顺序、风险和绿色门禁明确。
```

## US-027 Prompt: Update Documentation for P4 Architecture Readiness

```text
你正在接手 P4 US-027：Update Documentation for P4 Architecture Readiness。
Scope: 更新架构文档，链接 snapshot、choice、replay、catalog、save schema、database、adapter 边界，明确 backend/database implementation 不属于 P4。
Non-goals: 不新增实现；不扩展 P4 scope。
Validation: npm run typecheck。
Done: 后续 session 不会跳过 contract layer。
```

## US-028 Prompt: Produce P4 Closure Report

```text
你正在接手 P4 US-028：Produce P4 Closure Report。
Scope: 汇总 completed stories、contract files、fixtures、helpers、test commands、P3 gates、残余风险和 backend implementation PRD recommendation。
Non-goals: 不补做前置 story；不启动 backend implementation。
Validation: npm run typecheck；contract tests；P3 gates。
Done: closure report 可支持是否进入 backend implementation PRD 的决策。
```


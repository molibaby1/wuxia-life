# P4 Engine Contract and Service Boundary Application Execution Plan

本执行计划由 `docs/PRD/p4-engine-contract-and-service-boundary.md` 与 `docs/PRD/p4-engine-contract-and-service-boundary.prd.json` 拆分而来。P4 的目标是在前后端分离前冻结引擎契约和服务边界，不实现后端、数据库、账号、云存档或小程序，也不改变现有玩法 runtime 行为。

## Governing Scope

- 定义 `GameStateSnapshot`、choice execution、replay log、event catalog、save schema、未来数据库模型和 adapter 边界。
- 允许新增 TypeScript contract types、fixtures、轻量 validation helpers、contract tests、报告和架构文档。
- 保持 P3 gates 与现有 gameplay runtime 行为不变。
- P4 只定义未来服务提取边界，不实现服务提取。

## Frozen Boundaries

- 不修改 event selection、effect execution、choice outcomes、route logic、save behavior 或 UI behavior。
- 不实现 backend server、HTTP client、database driver、ORM、database migrations、account system、cloud saves 或 mini-program adapter。
- 不把当前 runtime `GameState` 替换为 `GameStateSnapshot`。
- 不改变 `EventLoader` runtime 行为。
- validation helpers 只由 tests 或 reports 显式导入，不进入 gameplay runtime。
- 文档、fixtures 与交付说明不得包含本地绝对路径。

## Execution Waves

| Wave | Stories | Theme | Depends On |
|---|---|---|---|
| P4-W0 | US-001, US-002 | Current boundary baseline and runtime guardrails | Approved PRD |
| P4-W1 | US-003, US-004, US-005, US-006 | Snapshot contract, types, fixture, tests | P4-W0 |
| P4-W2 | US-007, US-008, US-009, US-010 | Choice execution request/response contracts | P4-W1 |
| P4-W3 | US-011, US-012, US-013 | Replay log contract and validation | P4-W1, P4-W2 |
| P4-W4 | US-014, US-015, US-016 | Event catalog service boundary and migration-risk report | P4-W0 |
| P4-W5 | US-017, US-018, US-019, US-020 | Save policy, migration strategy, database and ownership boundaries | P4-W1 |
| P4-W6 | US-021, US-022 | Frontend and platform adapter boundaries | P4-W0, P4-W2 |
| P4-W7 | US-023, US-024 | Shared validation helpers and contract suite entry | P4-W1, P4-W2, P4-W3, P4-W4, P4-W5 |
| P4-W8 | US-025, US-026, US-027, US-028 | API draft, extraction order, architecture docs, closure | All prior waves |

## Story Execution Rules

1. 默认按 priority 顺序执行；只有分发表标注为可并行的只读 audit 或 definition story 可以并行准备。
2. 每个 session 只执行一个 story，并在改动前提交该 story 的具体实施计划等待审批。
3. Audit 与 definition story 的交付物是报告或规则文档，不修改业务代码。
4. Type、fixture、helper 与 test story 不得接入 gameplay runtime。
5. 如果发现必须修改 runtime 行为，停止当前 story，记录 handoff，由新的 PRD 决定是否实施。
6. 每个 story 完成后记录验证命令、结果、变更文件、未完成验收项和残余风险，供 US-028 收口。

## Per-Story Plan

### US-001 Rebaseline Current Engine Boundaries
Scope: 只读盘点 `GameState`、save manager、event loader、choice execution、feedback、route state、life memory 与 simulation 入口，分类并输出 baseline report。
Validation: `npm run typecheck`。
Done: 当前边界、阻塞未来 backend execution 的 runtime 依赖和 deprecated 入口均有记录。

### US-002 Define P4 Non-Runtime-Behavior Guardrails
Scope: 文档化允许新增项、禁止 runtime 改动项、P3 回归命令和 prohibited change 判定。
Validation: `npm run typecheck`。
Done: 后续 session 可引用明确的 P4 guardrails。

### US-003 Define Game State Snapshot Contract
Scope: 定义 versioned `GameStateSnapshot`，字段分类、metadata，以及 route、relationship、life memory inputs、history、save metadata 表示方式。
Validation: `npm run typecheck`。
Done: snapshot contract 可指导 types 与 fixture。

### US-004 Add Game State Snapshot Types
Scope: 新增并导出 snapshot 相关 TypeScript types，不替换 runtime `GameState`。
Validation: `npm run typecheck`。
Done: adapter 可编译引用 snapshot contract。

### US-005 Add Snapshot Serialization Fixture
Scope: 新增可序列化的 0-50 snapshot fixture，覆盖 route、relationship、history、save metadata 和 life memory source fields。
Validation: `npm run typecheck`; tests。
Done: fixture 可由 contract tests 解析，且不含本地绝对路径。

### US-006 Add Snapshot Contract Tests
Scope: 覆盖 snapshot JSON round trip、metadata、非必需 derived/volatile fields、forbidden fields。
Validation: `npm run typecheck`; tests。
Done: snapshot drift 可被 contract tests 检测。

### US-007 Define Choice Execution Request Contract
Scope: 定义 request fields、可选 metadata、未来 backend 不可信 client fields 和错误分类。
Validation: `npm run typecheck`。
Done: request contract 可指导 types。

### US-008 Define Choice Execution Response Contract
Scope: 定义 success/failure response、next snapshot、feedback、history append、state deltas、logs、hints、warnings 与 diagnostics 分离。
Validation: `npm run typecheck`。
Done: response contract 可指导 types。

### US-009 Add Choice Execution Contract Types
Scope: 新增 request、success、failure、diagnostics types，引用现有 feedback、route 与 life memory 概念。
Validation: `npm run typecheck`。
Done: types 存在且未替换当前 choice execution runtime。

### US-010 Add Choice Execution Contract Fixtures
Scope: 新增 valid request、success response、validation failure response fixtures。
Validation: `npm run typecheck`; tests。
Done: fixtures 可序列化、可验证且无本地绝对路径。

### US-011 Define Replay Log Contract
Scope: 定义 replay metadata、entry kinds、deterministic data、diagnostic data 和 snapshot hash integrity checks。
Validation: `npm run typecheck`。
Done: replay contract 可指导 types 与 fixture。

### US-012 Add Replay Log Types and Fixtures
Scope: 新增 replay types 和 0-50 fixture，包含多个 choice entries 及 route 或 relationship change。
Validation: `npm run typecheck`; tests。
Done: fixture 可序列化、可验证且无本地绝对路径。

### US-013 Add Replay Contract Tests
Scope: 覆盖 replay fixture validation、required metadata、entry required fields 和 malformed entries。
Validation: `npm run typecheck`; tests。
Done: replay drift 可被 contract tests 检测。

### US-014 Define Event Catalog Service Boundary
Scope: 定义 catalog concepts、queries、engine/service filtering ownership 和 payload constraints。
Validation: `npm run typecheck`。
Done: future event catalog read service 边界明确。

### US-015 Add Event Catalog Contract Types
Scope: 新增 catalog metadata、bundle request/response、validation summary types，不修改 `EventLoader`。
Validation: `npm run typecheck`。
Done: current assets 可对照 future payload shape。

### US-016 Add Event Catalog Contract Validation Report
Scope: 对照 catalog contract 报告 active、candidate、deferred、broken、dead counts，不适配字段和未来 server-only/diagnostic-only 字段。
Validation: `npm run typecheck`。
Done: event catalog migration risk 可见，runtime 行为未改。

### US-017 Define Save Schema Versioning Policy
Scope: 定义 schema version、compatibility range、readable/migratable/unsupported states、拒绝条件与消息。
Validation: `npm run typecheck`。
Done: future persistence 可引用版本策略。

### US-018 Define Save Migration Strategy
Scope: 定义 migration 命名、顺序、测试、允许操作、禁止捷径、失败回滚与 fixtures。
Validation: `npm run typecheck`。
Done: future migrations 有明确策略，未新增数据库实现。

### US-019 Define Future Database Model Boundary
Scope: 定义 conceptual models、identifiers、relationships、canonical/derived data 和 forbidden storage。
Validation: `npm run typecheck`。
Done: future database PRD 可引用模型边界，未新增 ORM 或 server。

### US-020 Define Account and Ownership Boundary
Scope: 定义 anonymous、logged-in、save slot、export/import ownership 和 attachment questions。
Validation: `npm run typecheck`。
Done: future account PRD 可引用 ownership 边界，未实现账号系统。

### US-021 Define Frontend Adapter Boundary
Scope: 定义 UI、composables、persistence adapters、engine contracts、reports 职责，盘点 browser API 与 Vue 依赖。
Validation: `npm run typecheck`。
Done: service extraction 前必须包装的依赖明确。

### US-022 Define Platform Adapter Requirements
Scope: 定义 storage、time、random seed、logging、network、UI feedback adapter requirements、同步性和 platform metadata。
Validation: `npm run typecheck`。
Done: Web 与 mini-program 的 adapter 规划边界明确，未实现 mini-program。

### US-023 Add Contract Validation Helpers
Scope: 新增 snapshot、choice、replay、catalog fixture validation helpers，返回 structured results，仅由 tests/reports 导入。
Validation: `npm run typecheck`; tests。
Done: fixture drift 可由轻量 helpers 检测。

### US-024 Add Contract Test Suite Entry
Scope: 新增 dedicated contract suite 或 documented script，覆盖 snapshot、choice、replay、catalog、save schema fixtures。
Validation: `npm run typecheck`; tests。
Done: contract suite 可独立运行，不需要 browser、backend 或 database。

### US-025 Define Backend API Draft Boundaries
Scope: 定义 catalog、save、choice execution、replay endpoint drafts，引用 P4 contracts，列出错误分类。
Validation: `npm run typecheck`。
Done: future backend implementation PRD 有稳定 endpoint 边界，未实现 server 或 HTTP client。

### US-026 Define Service Extraction Risks and Migration Order
Scope: 定义 extraction order、determinism、catalog drift、save compatibility、trust、storage limit 风险和 mitigation。
Validation: `npm run typecheck`。
Done: extraction 顺序与必须保持绿色的 P3 gates 明确。

### US-027 Update Documentation for P4 Architecture Readiness
Scope: 更新架构文档，链接 P4 contracts 与 boundaries，明确 backend/database implementation 不在 P4。
Validation: `npm run typecheck`。
Done: 后续 session 不会跳过 contract layer。

### US-028 Produce P4 Closure Report
Scope: 汇总 stories、contract files、fixtures、helpers、tests、P3 gates、残余风险和 backend PRD recommendation。
Validation: `npm run typecheck`; contract tests; P3 gates。
Done: closure report 支持是否进入 backend implementation PRD 的决策。


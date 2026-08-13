# Constrained Auto-Evolution B1 Implementation Plan

> **状态更新（2026-08-13）：历史计划。Task 1～8 对应 B1.0 的历史实施与收口；Task 9～14（原 B1.1）已被 LLM-driven auto-evolution proposal superseded，禁止直接执行。本文不再是当前 implementation authorization。**


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改动正式事件目录、玩家状态、存档契约、正式门禁或发布路径的前提下，先把真实 Headless catalog 注入边界做成可验证的 B1.0，再实现仅允许既有事件 `weight` 的 B1.1 候选评估管线。

**Architecture:** `GameEngineIntegration` 接收实例级只读 `RuntimeEventCatalog`；默认实例委托当前 `EventLoader`，Headless candidate 实例使用正式目录深拷贝加不可变 weight overlay。Headless session、persona runner、历史分类和指标计算共享同一 catalog。B1.1 将结构化 proposal 经确定性 scope validator 转成 overlay，在隔离的 train/holdout/adversarial 运行中产生不可覆盖 artifact，由 mechanical、blind、red-team 和人工裁决组成证据链；任何 accepted 只接受 artifact，不写回正式配置。

**Tech Stack:** TypeScript 5.9、Vue/Headless 现有运行时、`tsx`、Node `crypto`、Node 子进程、现有 P8 persona/ExperienceTrace 与纯指标定义。

## Global Constraints

- B1.0 与 B1.1 均不得修改 `src/data/events.json`、`src/data/lines/**`、正式事件 JSON、PlayerState、GameState、Snapshot、Contract、Schema 或存档版本。
- 不修改 Local、API、Browser 的正式事件目录参数；未显式传入 candidate catalog 的路径必须保持当前行为。
- 不修改 P0/P1/P8/P9 或其他正式 gate 的阈值、verdict 语义和 tracked latest report；候选 artifact 只能写 `.tmp/b1/<runId>/`。
- B1.1 白名单只有已有事件的 `weight`：最多 8 个不同事件、每项相对 baseline 为 `0.8x～1.2x`、结果不得小于 1；critical、mandatory、mainline 事件直接阻断。
- 禁止改变事件集合、事件顺序、`priority`、`ageRange`、`ageWeights`、条件、触发器、依赖、冷却、效果、choices、正文、storyline 或其他字段；越界不静默裁剪、不四舍五入成合法值、不替换为近似候选。
- baseline 与 candidate 使用相同 persona、seed、endAge、engine/source hash 和冻结 manifest；holdout 在 patch sealed 后才可执行，提案角色不得读取 holdout 标签、结果或 reviewer 结论。
- candidate 不得用来掩盖已经失败的 baseline；baseline 触发正式 blocking threshold 时本次运行直接 `blocked`。
- 不自动合入、自动发布、自动写回 `src/data/**`，不自动开始下一轮；人工 `accepted` 只接受 artifact。
- 保留现有 dirty/untracked worktree；不执行 `git reset`、`git clean`、`git add .`、批量格式化或无关修复。默认不 commit、不 push、不 merge。
- B1.0 未通过人工收口前，不进入 B1.1；B1.1 没有合法候选时，诚实结束为 `rejected` 或 `blocked`。

---

## 0. 文件边界与交接约定

### B1.0/B1.1 新增文件

```text
src/core/RuntimeEventCatalog.ts
src/core/EventLoaderRuntimeCatalog.ts
src/core/WeightOverlayRuntimeCatalog.ts

scripts/b1/types.ts
scripts/b1/hash.ts
scripts/b1/catalogSnapshot.ts
scripts/b1/weightOverlay.ts
scripts/b1/scopeValidator.ts
scripts/b1/manifest.ts
scripts/b1/metrics.ts
scripts/b1/evidenceChain.ts
scripts/b1/runB10.ts
scripts/b1/runB11.ts
scripts/b1/roles/proposalAgent.ts
scripts/b1/roles/simulator.ts
scripts/b1/roles/mechanicalAuditor.ts
scripts/b1/roles/blindReviewer.ts
scripts/b1/roles/redTeamAuditor.ts
scripts/b1/roles/humanDecision.ts

tests/b1/runtimeEventCatalog.test.ts
tests/b1/weightOverlayScope.test.ts
tests/b1/headlessCatalogParity.test.ts
tests/b1/headlessCandidateScheduling.test.ts
tests/b1/b1ArtifactIsolation.test.ts
tests/b1/b1MetricsAndEvaluator.test.ts
tests/b1/b1RoleIsolation.test.ts
```

### 允许修改的既有文件

| 文件 | 修改责任 |
| --- | --- |
| `docs/governance/current-product-stage.md` | 仅将已获独立裁决的当前看板更新为 B1.0 Authorized Slice，并记录 B1.1 依赖 B1.0 闸门；不重写 B0 关闭证据。 |
| `src/core/GameEngineIntegration.ts` | 仅增加实例级 catalog 注入并替换本文件内的全局事件读取。 |
| `src/headless/dependencies/HeadlessSessionDependencies.ts` | 仅增加 Headless engine 使用的 runtime catalog 依赖及默认解析。 |
| `src/headless/session/HeadlessEngineSessionImpl.ts` | 仅把 resolved runtime catalog 传给每个新建/重启/replay engine。 |
| `src/headless/playability/createPersonaSession.ts` | 仅接收并转发 candidate runtime catalog。 |
| `src/headless/playability/headlessPersonaRunner.ts` / `types.ts` | 仅让 runner 共享 session catalog，并移除其独立的 global loader 查询。 |
| `src/headless/catalog/InMemoryEventCatalogAdapter.ts` | 仅从注入的 runtime catalog 提供 API catalog 读取，默认仍包装正式 loader。 |
| `src/headless/catalog/EventCatalogReadService.ts` | 只有在类型需要明确区分 API read service 与 runtime catalog 时才做最小类型调整，不改变 API 返回语义。 |
| `tests/runRealTestGate.ts` | 只注册 `tests/b1/*.test.ts`，不修改既有测试断言或 gate 逻辑。 |

### 明确不修改

```text
src/data/**
src/types/eventTypes.ts
src/contracts/**
scripts/runP8PlayabilityGate.ts
scripts/runExperienceHealthGate.ts
src/p8/experienceHealthMetricDefinitions.ts
docs/test-reports/**
正式 gate 阈值、tracked latest 报告、Local/API/Browser catalog 入口
```

### 统一接口约定

`src/core/RuntimeEventCatalog.ts` 定义：

```ts
export interface RuntimeEventCatalog {
  getAllEvents(): readonly EventDefinition[];
  getEventsByAge(age: number): readonly EventDefinition[];
  getEventById(id: string): EventDefinition | undefined;
  getWeightForAge(event: EventDefinition, age: number): number;
}
```

`GameEngineIntegration` 的构造函数保持默认可调用：

```ts
constructor(catalog: RuntimeEventCatalog = createDefaultRuntimeEventCatalog());
```

默认 adapter 必须委托当前 `eventLoader`，不替换 singleton、不 monkey-patch、不写入全局状态。candidate adapter 必须只读取冻结 base catalog 和 immutable overlay。

---

## Task 1: 将阶段看板切换到已批准的 B1.0 Slice

**Files:**
- Modify: `docs/governance/current-product-stage.md`

**Interfaces:**
- Consumes: 已确认的 `docs/superpowers/specs/2026-08-12-constrained-auto-evolution-b1-design.md` 与 B0 最终人工 accept 记录。
- Produces: 当前阶段明确为 `B1.0 Authorized Slice`；B1.1 只有 B1.0 人工收口后可执行。

- [ ] **Step 1: 写入当前看板条目**

追加一个新节，明确目标是 Headless-only catalog 注入和同 seed baseline/candidate parity；明确不改正式配置、不改 Local/API/Browser、不进入 B1.1；artifact 根为 `.tmp/b1/`；B1.0 完成后必须有人工作出 `accepted/rejected/blocked` 决定。

- [ ] **Step 2: 保留 B0 历史关闭结论**

确认 B0 的最终 run、`passed` 和“不授权自动发布”文字仍可追溯；不得把 B1 写成 B0 的自动 successor。

- [ ] **Step 3: 文档自检**

运行：`git diff --check`

Expected：exit 0；diff 只包含本节的当前阶段看板更新。

---

## Task 2: 建立 RuntimeEventCatalog 与默认 EventLoader adapter

**Files:**
- Create: `src/core/RuntimeEventCatalog.ts`
- Create: `src/core/EventLoaderRuntimeCatalog.ts`
- Create: `tests/b1/runtimeEventCatalog.test.ts`
- Modify: `src/headless/catalog/InMemoryEventCatalogAdapter.ts`

**Interfaces:**
- Consumes: `EventLoader` 的 `getAllEvents/getEventsByAge/getEventById/getWeightForAge`。
- Produces: `RuntimeEventCatalog`、`createDefaultRuntimeEventCatalog()`；默认路径的 API adapter 可复用同一 runtime source。

- [ ] **Step 1: 写默认 adapter 的失败测试**

测试必须验证：默认 catalog 的全部事件 ID/数量/年龄查询/权重查询与当前 `eventLoader` 一致；`getEventById` 对未知 ID 返回 `undefined`；catalog 暴露只读方法而没有写入 API。

- [ ] **Step 2: 运行聚焦测试确认失败**

运行：`npm exec -- tsx tests/b1/runtimeEventCatalog.test.ts`

Expected：FAIL，原因是 `RuntimeEventCatalog` 和默认 factory 尚不存在。

- [ ] **Step 3: 实现接口和默认 adapter**

默认 adapter 逐项委托 `eventLoader`，`getAllEvents/getEventsByAge` 返回新数组；不得把 `EventLoader` singleton 替换为 candidate。`InMemoryEventCatalogAdapter` 接收可选 runtime catalog，默认使用 `createDefaultRuntimeEventCatalog()`，其 API 方法从该 source 读取但继续对未知 event 使用已有 `CatalogReadError`。

- [ ] **Step 4: 运行测试确认默认 parity**

运行：`npm exec -- tsx tests/b1/runtimeEventCatalog.test.ts`

Expected：PASS；正式 catalog 数量、ID 集合、年龄过滤和权重与 loader 相同。

- [ ] **Step 5: 类型检查本任务边界**

运行：`npm exec -- tsc --noEmit --pretty false -p tsconfig.json`

Expected：PASS；若仓库已有与本任务无关的既有错误，记录精确文件和错误，不扩展修改范围。

---

## Task 3: 让 GameEngineIntegration 的所有事件读取使用实例 catalog

**Files:**
- Modify: `src/core/GameEngineIntegration.ts`
- Modify: `tests/b1/runtimeEventCatalog.test.ts`

**Interfaces:**
- Consumes: Task 2 的 `RuntimeEventCatalog` 和默认 factory。
- Produces: `new GameEngineIntegration(catalog)`；本实例的调度、权重、历史分类、即时反馈和事件定义查询全部来自同一 catalog。

- [ ] **Step 1: 增加 catalog 注入回归测试**

构造一个只包含两个非 mandatory 事件的测试 catalog，并断言：`getAvailableEvents(age)` 读取该 catalog；加权选择调用该 catalog 的 `getWeightForAge`；历史重复抑制调用该 catalog 的 `getEventById`；即时反馈扫描调用该 catalog 的 `getAllEvents`。测试同时用 spy 记录四种方法调用。

- [ ] **Step 2: 运行测试确认当前 global loader 路径失败**

运行：`npm exec -- tsx tests/b1/runtimeEventCatalog.test.ts`

Expected：FAIL，spy 显示 engine 仍读取 global `eventLoader` 或 constructor 不接受 catalog。

- [ ] **Step 3: 完成最小源头替换**

在类上保存 `private readonly catalog`；替换本文件所有调度相关的 `eventLoader.getEventsByAge`、`getWeightForAge`、`getEventById`、`getAllEvents` 和 `getEventDefinition` 路径。不得改动事件选择顺序、权重算法、重复阈值、事件字段或正式 gate。

- [ ] **Step 4: 验证所有读取点已收敛**

运行：`rg -n "eventLoader\.(getEventsByAge|getWeightForAge|getEventById|getAllEvents)" src/core/GameEngineIntegration.ts`

Expected：无输出；允许保留 import-free 的注释文字，但不得有运行时代码读取 global loader。

- [ ] **Step 5: 运行聚焦测试**

运行：`npm exec -- tsx tests/b1/runtimeEventCatalog.test.ts`

Expected：PASS；默认 constructor 的行为仍与改造前相同，注入 constructor 的 spy catalog 可观测全部读取。

---

## Task 4: 将 Headless session、replay 与 persona runner 贯通到同一 catalog

**Files:**
- Modify: `src/headless/dependencies/HeadlessSessionDependencies.ts`
- Modify: `src/headless/session/HeadlessEngineSessionImpl.ts`
- Modify: `src/headless/playability/createPersonaSession.ts`
- Modify: `src/headless/playability/headlessPersonaRunner.ts`
- Modify: `src/headless/playability/types.ts`
- Modify: `src/headless/catalog/InMemoryEventCatalogAdapter.ts`
- Create: `tests/b1/headlessCatalogParity.test.ts`

**Interfaces:**
- Consumes: `RuntimeEventCatalog`；现有 `EventCatalogReadService` 继续服务 snapshot/API read。
- Produces: `HeadlessSessionDependencies.runtimeCatalog`；`HeadlessPersonaRunConfig.runtimeCatalog?`；`createPersonaHeadlessSession(persona, catalogVersion, runtimeCatalog?)`。

- [ ] **Step 1: 写依赖贯通失败测试**

用一个带唯一测试事件的 runtime catalog 创建 Headless session，断言 `session.engine` 的下一个事件、`session.dependencies.runtimeCatalog`、runner 的 history backfill 和 `runnerSteps` 事件查询都使用该 catalog；默认没有传入时仍使用正式 adapter。

- [ ] **Step 2: 运行测试确认 session 尚未注入 engine**

运行：`npm exec -- tsx tests/b1/headlessCatalogParity.test.ts`

Expected：FAIL，原因是 `GameEngineIntegration` 尚未接收 session catalog 或 runner 仍直接读取 global loader。

- [ ] **Step 3: 增加 runtimeCatalog 依赖并保持默认兼容**

在 `resolveHeadlessDependencies` 中为 `runtimeCatalog` 提供默认正式 adapter；`HeadlessEngineSessionImpl.create/createForReplay/restart` 都用该依赖构造 engine。既有仅传 `catalog + snapshot` 的调用不得失效。

- [ ] **Step 4: 让 API adapter 和 runtime adapter共享源**

`InMemoryEventCatalogAdapter` 保存传入 runtime source；Headless candidate 创建时显式传入同一个 candidate runtime source，避免 API 读取 baseline 而 engine 运行 candidate。

- [ ] **Step 5: 消除 runner 的 global loader 查询**

将 `isMandatoryHistoryEvent`、`isVisibleAutomaticMainlineHistoryEvent`、history backfill 的事件定义查询改为从 `session.dependencies.runtimeCatalog` 获取；不得用 event ID、Trace 私有字段或正文关键词替代 catalog 定义。

- [ ] **Step 6: 运行 parity 测试和现有 Headless 回归**

运行：`npm exec -- tsx tests/b1/headlessCatalogParity.test.ts`；`npm run test:headless`；`npm run test:headless:parity`

Expected：全部 PASS；默认 Headless 的 snapshot、replay、choice 和 terminal 语义不变。

---

## Task 5: 实现 immutable catalog snapshot 与 WeightOverlay 白名单

**Files:**
- Create: `src/core/WeightOverlayRuntimeCatalog.ts`
- Create: `scripts/b1/types.ts`
- Create: `scripts/b1/hash.ts`
- Create: `scripts/b1/catalogSnapshot.ts`
- Create: `scripts/b1/weightOverlay.ts`
- Create: `scripts/b1/scopeValidator.ts`
- Create: `tests/b1/weightOverlayScope.test.ts`

**Interfaces:**
- Consumes: Task 2 的 runtime catalog；B1 设计的 `WeightOverlay` schema。
- Produces: `createWeightOverlayRuntimeCatalog(base, overlay)`；`captureCatalogSnapshot(catalog)`；`validateWeightOverlay(catalog, overlay)`；`WeightPatchIntent` 到 overlay 的确定性转换。

- [ ] **Step 1: 写 scope validator 的失败测试**

覆盖以下输入并断言每个都返回 `blocked` code，而不是被修正：未知 event ID、重复 ID、9 个 patch、`0.79x/1.21x`、candidate 小于 1、baselineWeight 不匹配、critical/mandatory/mainline、修改非 weight 字段、重复/新增事件对象、非法方向、非有限 delta、空 rationale 和缺失 expected metrics。

- [ ] **Step 2: 运行测试确认 validator 尚不存在**

运行：`npm exec -- tsx tests/b1/weightOverlayScope.test.ts`

Expected：FAIL，原因是 overlay 类型和 validator 尚不存在。

- [ ] **Step 3: 定义不可变 schema 与 hash**

使用：

```ts
export type WeightOverlay = {
  schemaVersion: 'b1-weight-overlay-v1';
  baseCatalogHash: string;
  patches: Array<{ eventId: string; baselineWeight: number; candidateWeight: number }>;
};
```

`captureCatalogSnapshot` 按 event ID 稳定排序并对完整事件对象做 canonical JSON；`baseCatalogHash`、`overlayHash` 和深度差异 hash 必须由同一 canonical 表示产生。

- [ ] **Step 4: 实现确定性 scope validator**

校验 patch 数量、唯一 ID、事件存在性、baseline exact match、倍率范围、最小值、禁止层级/标签，以及应用后 candidate catalog 与 base 的深度差异集合只能是对应事件的 `weight`。任何失败返回明确 code 和原始 event/path；不修改输入、不静默裁剪。

- [ ] **Step 5: 实现 immutable overlay runtime catalog**

从 base snapshot 深拷贝事件，应用已通过 validator 的 weight patch，冻结事件对象和数组；读取方法只返回数组副本。base catalog 和 overlay 输入在构造后再次改变不得影响 candidate。

- [ ] **Step 6: 运行白名单测试**

运行：`npm exec -- tsx tests/b1/weightOverlayScope.test.ts`

Expected：PASS；合法 patch 只改变目标 `weight`，非法 patch 全部为 `blocked`，base catalog hash 与 overlay hash 稳定可复现。

---

## Task 6: 证明 B1.0 candidate 真实影响调度且 baseline parity 可复现

**Files:**
- Create: `tests/b1/headlessCandidateScheduling.test.ts`
- Create: `scripts/b1/runB10.ts`
- Modify: `src/headless/playability/createPersonaSession.ts`
- Modify: `src/headless/playability/headlessPersonaRunner.ts`

**Interfaces:**
- Consumes: Task 4 的 Headless runtime catalog 注入、Task 5 的 overlay catalog。
- Produces: `runB10(options)`；B1.0 artifact 与 `terminalVerdict: 'awaiting_human' | 'blocked'`；baseline/candidate trace pair。

- [ ] **Step 1: 写真实调度测试**

构造两个年龄相同、条件都满足且不属于 critical/mandatory/mainline 的事件 catalog；只改变一个事件的 weight，在相同 persona/seed/endAge 下运行 baseline 与 candidate。断言 candidate 的候选选择统计发生可解释变化，且 `GameEngineIntegration`、runner history 分类和指标分类看到的是同一个 candidate 定义。

- [ ] **Step 2: 运行测试确认未接通前失败**

运行：`npm exec -- tsx tests/b1/headlessCandidateScheduling.test.ts`

Expected：FAIL 或无法证明 candidate 改变真实调度，不能以替换 singleton 或修改正式 JSON 通过。

- [ ] **Step 3: 实现 B1.0 runner**

`runB10` 固定 manifest 中的 source fingerprint、base catalog hash、overlay hash、persona、seed、endAge、engine version 和指标版本；为每个 arm 创建独立 runtime catalog，并调用 `runHeadlessPersona({ runtimeCatalog })`。默认 baseline 使用正式 adapter，candidate 使用 immutable overlay。

- [ ] **Step 4: 增加重复运行断言**

同一 manifest 连续运行两次，raw trace、visible trace、metric hash 和 final state hash 必须一致；baseline 与 candidate 不能共享可变 catalog 对象。

- [ ] **Step 5: 运行 B1.0 聚焦验证**

运行：`npm exec -- tsx tests/b1/headlessCandidateScheduling.test.ts`；`npm exec -- tsx tests/b1/headlessCatalogParity.test.ts`

Expected：PASS；证明 candidate 在真实 Headless 调度中生效，默认路径未变化。

---

## Task 7: 完成 B1.0 artifact、隔离和 source/evidence hash 链

**Files:**
- Create: `scripts/b1/manifest.ts`
- Create: `scripts/b1/evidenceChain.ts`
- Create: `tests/b1/b1ArtifactIsolation.test.ts`
- Modify: `scripts/b1/runB10.ts`

**Interfaces:**
- Consumes: Task 6 的 baseline/candidate trace pair；B0 已验证的 source fingerprint、visible projection 和角色隔离模式。
- Produces: `.tmp/b1/<runId>/manifest.json`、`base-catalog.json`、`overlay.json`、`raw-traces/`、`player-visible-traces/`、`metrics/`、`evidence-index.json`、`run-summary.json`。

- [ ] **Step 1: 写 artifact isolation 失败测试**

断言 B1.0 不创建或修改 `docs/test-reports/**`、正式事件目录和 tracked latest 报告；artifact 根只能是新建的不可覆盖 `.tmp/b1/<runId>/`；重复 runId、hash 不匹配、缺失文件和 source fingerprint 变化都不能得到 `passed`。

- [ ] **Step 2: 运行测试确认 artifact contract 尚不存在**

运行：`npm exec -- tsx tests/b1/b1ArtifactIsolation.test.ts`

Expected：FAIL，原因是 manifest/evidence index 和完整 artifact 尚未生成。

- [ ] **Step 3: 实现 sealed manifest 和 evidence index**

manifest 必须冻结 source fingerprint、base catalog hash、overlay hash、seed bundle hash、engine/source hash、persona/endAge、指标/evidence schema 版本和 artifact 相对路径。`evidenceChain` 逐项校验文件存在、hash 匹配、路径没有覆盖、visible trace 不含 hidden state、identity、seed、arm 或机械 verdict。

- [ ] **Step 4: 处理进程隔离**

如果测试证明全局状态、Vue reactive state 或随机源会在 baseline/candidate 间泄漏，`runB10` 必须以两个独立 Node 子进程执行，并让子进程只接收 sealed manifest、catalog snapshot、overlay 和 seed；不得恢复或共享 global singleton 来规避污染。

- [ ] **Step 5: 运行 artifact 与隔离验证**

运行：`npm exec -- tsx tests/b1/b1ArtifactIsolation.test.ts`

Expected：PASS；source/catalog/overlay/seed/trace/metric hash 链完整，任何污染或泄漏均为 `blocked`。

---

## Task 8: B1.0 人工收口并停止在 B1.1 之前

**Files:**
- Create: `scripts/b1/roles/humanDecision.ts`
- Modify: `scripts/b1/runB10.ts`
- Modify: `tests/runRealTestGate.ts`

**Interfaces:**
- Consumes: Task 7 的 B1.0 evidence index 和 run summary。
- Produces: `.tmp/b1/<runId>/human-decision.json`；`accepted/rejected/blocked` 只表示 B1.0 注入 artifact 的人工裁决，不代表 candidate 发布。

- [ ] **Step 1: 写人工决策 contract 测试**

测试拒绝没有完整 hash 链、默认 parity 未通过、candidate 未影响调度或存在 visible leak 的 run；测试 accepted 必须绑定 runId、source/catalog/overlay/engine hash、理由和 decision hash；测试 accepted 不得写入 `src/data/**`。

- [ ] **Step 2: 实现决策写入**

决策文件只允许 `accepted | rejected | blocked`；`blocked` 原因不可被 runner 自动改写为 accepted。人工 accept 后 runner 必须停止，不自动生成 proposal、不自动进入 B1.1、不自动继续下一轮。

- [ ] **Step 3: 注册聚焦 B1 suite**

在 `tests/runRealTestGate.ts` 只加入 B1 测试入口；不得改变 gate 执行顺序、阈值或既有套件。

- [ ] **Step 4: 运行 B1.0 验收集合**

运行：`npm exec -- tsx tests/b1/runtimeEventCatalog.test.ts`；`npm exec -- tsx tests/b1/headlessCatalogParity.test.ts`；`npm exec -- tsx tests/b1/headlessCandidateScheduling.test.ts`；`npm exec -- tsx tests/b1/b1ArtifactIsolation.test.ts`；`npm run test:headless`；`npm run test:headless:parity`；`git diff --check`

Expected：全部 PASS；由人工明确写出 B1.0 `accepted/rejected/blocked` 后，才可执行后续 Task 9。

---

## Task 9: 定义 B1.1 proposal schema 与确定性 candidate scope controller

**Files:**
- Modify: `scripts/b1/types.ts`
- Modify: `scripts/b1/weightOverlay.ts`
- Modify: `scripts/b1/scopeValidator.ts`
- Create: `scripts/b1/roles/proposalAgent.ts`
- Create: `tests/b1/weightOverlayScope.test.ts`

**Interfaces:**
- Consumes: B1.0 accepted manifest；Task 5 的 validator/overlay。
- Produces: `WeightPatchIntent`、`WeightPatchProposal`、`proposeWeightOverlay(base, proposal)`；状态 `draft → proposed → scope_checked`。

- [ ] **Step 1: 固定 proposal schema**

使用以下意图项：

```ts
export type WeightPatchIntent = {
  eventId: string;
  direction: 'increase' | 'decrease';
  deltaRatio: number;
  rationale: string;
  expectedMetricEffects: string[];
};
```

proposal 外层包含 `schemaVersion: 'b1-weight-proposal-v1'`、唯一 `proposalId` 和 `intents`。LLM/agent 只产生该结构，不接触事件文件，不直接写 overlay。

- [ ] **Step 2: 写 proposal 输入测试**

测试缺字段、未知 direction、NaN/Infinity、空 rationale、非字符串 expected metric、超过 8 项和重复 event ID 全部返回 `blocked`；测试合法 intent 的 increase/decrease 公式与 candidateWeight 可复现。

- [ ] **Step 3: 实现 controller 转换**

controller 从 sealed base snapshot 重新读取 baseline weight，忽略 proposal 自带的伪造 baseline；按 direction 计算 candidate weight 后再次运行完整 scope validator；任何越界直接 `blocked`，不得截断 delta 或替换事件。

- [ ] **Step 4: 运行 proposal scope 测试**

运行：`npm exec -- tsx tests/b1/weightOverlayScope.test.ts`

Expected：PASS；proposal 只能成为合法 immutable overlay 或明确 blocked。

---

## Task 10: 实现 train/holdout/adversarial runner 与节奏指标 evaluator

**Files:**
- Create: `scripts/b1/metrics.ts`
- Create: `scripts/b1/roles/simulator.ts`
- Create: `scripts/b1/roles/mechanicalAuditor.ts`
- Modify: `scripts/b1/runB11.ts`
- Create: `tests/b1/b1MetricsAndEvaluator.test.ts`

**Interfaces:**
- Consumes: sealed base/overlay、Task 9 proposal、B1.0 accepted manifest、现有 `runHeadlessPersona` 与 `collectExperience` 记录。
- Produces: `B1Metrics`、per-sample baseline/candidate comparison、状态 `scope_checked → simulated`；`runB11(options)` 只写 `.tmp/b1/<runId>/`。

- [ ] **Step 1: 写指标失败测试**

使用固定 records 断言以下四项精确计算：`adjacent_same_event_rate`、`adjacent_same_class_rate`、`short_window_same_class_rate`、`top_event_concentration`。同时计算 `formal_event_ratio`、`daily_event_ratio`、choice 数、critical/mandatory 集合和 distinct storyline 覆盖。

- [ ] **Step 2: 运行测试确认 evaluator 尚不存在**

运行：`npm exec -- tsx tests/b1/b1MetricsAndEvaluator.test.ts`

Expected：FAIL，原因是 B1 metrics/evaluator 尚不存在。

- [ ] **Step 3: 实现纯指标函数**

从 candidate runtime catalog 查询事件分类和 storyline；不得 import 或调用会写 tracked latest report 的 `runP8PlayabilityGate.ts` / `runExperienceHealthGate.ts`。复用纯定义时复制必要输入，不改变正式阈值。

- [ ] **Step 4: 实现冻结分层 runner**

manifest 预先冻结 train、holdout、adversarial 的 persona/seed/endAge；baseline 与 candidate 对每个组合使用相同输入。candidate raw trace 生成前不得读取 holdout 标签或结果；adversarial 仅用于守门，不进入候选优化统计。

- [ ] **Step 5: 实现硬护栏 evaluator**

候选必须满足：train/holdout 三项 P0 指标均不超过冻结正式阈值；formal/daily 比例在 `[0.5, 0.9]`/`[0.1, 0.5]`；不新增 blocking failure；critical/mandatory 集合、choice 数、distinct storyline 覆盖逐样本不低于 baseline；patch 外深度一致；hash chain 完整。若 baseline 已 blocking，则直接 `blocked`。

- [ ] **Step 6: 运行指标与 runner 测试**

运行：`npm exec -- tsx tests/b1/b1MetricsAndEvaluator.test.ts`

Expected：PASS；同 seed 的 baseline/candidate 对照稳定，holdout 标签未泄漏，formal/daily 与关键覆盖护栏被机械验证。

---

## Task 11: 加入非回归、holdout 严格改善与 Pareto 规则

**Files:**
- Modify: `scripts/b1/metrics.ts`
- Modify: `scripts/b1/runB11.ts`
- Create: `tests/b1/b1MetricsAndEvaluator.test.ts`

**Interfaces:**
- Consumes: Task 10 的 per-sample metrics 和 hard guardrails。
- Produces: candidate verdict `eligible | rejected | blocked`；非支配候选集和 `normalized_patch_magnitude` 排序。

- [ ] **Step 1: 写比较规则测试**

覆盖：candidate 任一主要指标超过 baseline `+1e-12` 时拒绝；holdout 没有任何主要指标严格改善时拒绝；holdout 严格改善但 train 劣化时拒绝；至少一个 holdout 指标严格改善且其余指标不劣、所有硬护栏通过时进入候选集。

- [ ] **Step 2: 实现 baseline 锚点比较**

baseline 永远是固定非回归锚点，不作为 candidate Pareto 点；主要优化向量按最小化比较：四个重复/集中指标。`normalized_patch_magnitude` 只用于候选之间比较和同等效果下的 tie-break，不与 baseline 零 patch 直接比较严格改善。

- [ ] **Step 3: 实现 Pareto 筛选**

候选集保留非支配解；若向量完全相同，优先修改事件数更少，再优先 patch magnitude 更小，再按 proposalId 稳定排序。任何 `blocked` candidate 不得进入 Pareto 集。

- [ ] **Step 4: 运行规则测试**

运行：`npm exec -- tsx tests/b1/b1MetricsAndEvaluator.test.ts`

Expected：PASS；测试输出能区分 `rejected`（跑完但未改善/劣化）与 `blocked`（证据、范围、基线或隔离问题）。

---

## Task 12: 实现 mechanical、blind、red-team 角色隔离和证据链

**Files:**
- Create: `scripts/b1/roles/blindReviewer.ts`
- Create: `scripts/b1/roles/redTeamAuditor.ts`
- Modify: `scripts/b1/roles/mechanicalAuditor.ts`
- Modify: `scripts/b1/evidenceChain.ts`
- Create: `tests/b1/b1RoleIsolation.test.ts`

**Interfaces:**
- Consumes: Task 10/11 的 raw traces、metrics、candidate manifest 和 player-visible projection。
- Produces: `mechanical-audit.json`、`blind-review.json`、`red-team-review.json`；状态 `simulated → audited → awaiting_human`。

- [ ] **Step 1: 写角色输入隔离测试**

断言 proposal agent 不可读取 holdout labels/results；mechanical auditor 不可读取 blind/red 结果；blind reviewer 只能接收匿名 A/B player-visible traces，不含 event ID identity map、seed、arm、hidden state、mechanical verdict 或 holdout label；red-team 拥有 veto 但不能改写其他角色输出。

- [ ] **Step 2: 运行隔离测试确认失败**

运行：`npm exec -- tsx tests/b1/b1RoleIsolation.test.ts`

Expected：FAIL，直到每个角色使用显式输入对象和脱敏 artifact。

- [ ] **Step 3: 实现 mechanical auditor**

只读取 raw trace、candidate/base catalog 和冻结硬规则，输出确定性指标、覆盖检查和 hard verdict；不得把“模型感觉”写入机械结论。

- [ ] **Step 4: 实现 blind reviewer**

输入由 player-visible trace 投影和匿名 A/B pair 构成；输出观察、证据引用和感性节奏判断，不输出 event identity、seed、arm 或机械 verdict。blind package 的脱敏 hash 必须写入 evidence index。

- [ ] **Step 5: 实现 red-team veto**

检查越权 path、正式写入、holdout leak、A/B 解盲、hidden state leak、artifact 覆盖、hash 断裂、角色串通和 baseline failure masking；任一未解决 finding 都让 candidate `blocked`，不得通过多数投票覆盖。

- [ ] **Step 6: 运行角色隔离测试**

运行：`npm exec -- tsx tests/b1/b1RoleIsolation.test.ts`

Expected：PASS；故意注入每种泄漏/越权 fixture 时 red-team veto 为 true，正常样本没有 veto。

---

## Task 13: 完成 B1.1 人工裁决、停止条件和禁止发布路径

**Files:**
- Create: `scripts/b1/roles/humanDecision.ts`
- Modify: `scripts/b1/runB11.ts`
- Modify: `scripts/b1/evidenceChain.ts`
- Create: `tests/b1/b1ArtifactIsolation.test.ts`

**Interfaces:**
- Consumes: Task 11 Pareto candidates、Task 12 mechanical/blind/red-team evidence。
- Produces: `.tmp/b1/<runId>/human-decision.json`、`run-summary.json`；最终状态 `accepted | rejected | blocked`。

- [ ] **Step 1: 写人工裁决测试**

测试 `accepted` 必须绑定 runId、source fingerprint、base catalog hash、overlay hash、engine version、完整 train/holdout/adversarial evidence、人工理由和 decision hash；缺任何一项均为 `blocked`。测试 `rejected` 记录原因但保留完整 artifact；测试 `blocked` 原因不可被重跑覆盖。

- [ ] **Step 2: 实现独立人工决策文件**

人工 accept 只代表“接受这份候选评估 artifact 进入后续发布审查”；runner 不得修改 `src/data/**`、正式 gate、tracked latest report、Snapshot 或 Contract，不得自动创建下一轮 proposal。

- [ ] **Step 3: 实现独立发布前检查但不执行发布**

提供纯检查函数，要求未来显式发布动作重新确认当前正式 source hash、accepted overlay hash、白名单深度差异、证据链、holdout、red-team 和责任人/回滚点；本任务不添加发布 CLI、不写正式 catalog、不改存档。

- [ ] **Step 4: 运行 B1.1 聚焦验收**

运行：`npm exec -- tsx tests/b1/b1MetricsAndEvaluator.test.ts`；`npm exec -- tsx tests/b1/b1RoleIsolation.test.ts`；`npm exec -- tsx tests/b1/b1ArtifactIsolation.test.ts`；`git diff --check`

Expected：合法 candidate 才能到 `awaiting_human`；没有 holdout 严格改善、存在劣化、red-team veto、证据泄漏或 baseline failure 时分别得到 `rejected` 或 `blocked`；无任何正式配置写入。

---

## Task 14: 全量验证、文档收口与停止

**Files:**
- Modify: `docs/governance/current-product-stage.md`
- Modify: `tests/runRealTestGate.ts`（仅在前序任务尚未注册时）

**Interfaces:**
- Consumes: B1.0/B1.1 artifact、人工 decision、当前 dirty worktree 基线。
- Produces: 阶段完成报告所需的命令结果、artifact 路径和未闭合项；不自动推进下一阶段。

- [ ] **Step 1: 运行类型和 B1 聚焦验证**

运行：`npm run typecheck`；`npm exec -- tsx tests/b1/runtimeEventCatalog.test.ts`；`npm exec -- tsx tests/b1/weightOverlayScope.test.ts`；`npm exec -- tsx tests/b1/headlessCatalogParity.test.ts`；`npm exec -- tsx tests/b1/headlessCandidateScheduling.test.ts`；`npm exec -- tsx tests/b1/b1ArtifactIsolation.test.ts`；`npm exec -- tsx tests/b1/b1MetricsAndEvaluator.test.ts`；`npm exec -- tsx tests/b1/b1RoleIsolation.test.ts`。

Expected：全部 exit 0；B1 artifact 的 terminal status 与人工 decision 一致。

- [ ] **Step 2: 运行既有 Headless/Contract 回归**

运行：`npm run test:contracts`；`npm run test:headless`；`npm run test:headless:parity`；`npm exec -- tsx tests/runRealTestGate.ts`

Expected：既有 Local/API/Headless contract 与 parity 不回归；正式 gate 仍使用原有 threshold 和 report 语义。

- [ ] **Step 3: 检查变更边界**

运行：`git status --short`；`git diff --name-only`；`git diff --check`；`rg -n "eventLoader\.(getEventsByAge|getWeightForAge|getEventById|getAllEvents)" src/core/GameEngineIntegration.ts src/headless/playability/headlessPersonaRunner.ts`

Expected：核心运行读取已统一到实例 catalog；正式 `src/data/**`、Contract、Snapshot、PlayerState、tracked latest report 无改动；只保留本计划批准的文件和既有用户 dirty work。

- [ ] **Step 4: 更新当前阶段并停止**

在 `current-product-stage.md` 写入真实 B1.0/B1.1 结果、artifact runId、人工决策、验证命令和未闭合的 Browser/真人体验证据缺口。若没有合法 candidate，不把结果写成成功；若 B1 完成，不创建下一阶段、不自动发布。

- [ ] **Step 5: 输出交接报告**

报告必须区分：已确认事实、实现改动、产品语义未改变项、自动化结果、artifact/hash 证据、人工决定、Browser/真人证据缺口、相邻未授权问题和 Git dirty 状态。

---

## Self-review checklist

- [ ] 规格 §1–§2：B1 首轮只优化节奏/重复，B1.0 先于 B1.1，且不自动发布 —— Tasks 1、6、8、13、14。
- [ ] 规格 §3：实例级 RuntimeEventCatalog、默认兼容、engine/runner/metrics 同一 source —— Tasks 2、3、4、6。
- [ ] 规格 §4–§5：immutable weight overlay、8 项/0.8x–1.2x/最小 1、禁止层级与字段、结构化 proposal、角色隔离 —— Tasks 5、9、12。
- [ ] 规格 §6：冻结 train/holdout/adversarial、四项主要指标、P0/P1/关键覆盖硬护栏、baseline failure block —— Tasks 7、10、11、12。
- [ ] 规格 §7–§8：状态机、Pareto、artifact、人工 accepted 语义和独立发布检查 —— Tasks 7、8、11、13。
- [ ] 规格 §9–§11：结构性 blocker、B1 完成标准和后续禁止范围 —— Global Constraints、Tasks 8、13、14。
- [ ] 占位符检查无命中，且没有未定义的接口名称或步骤引用。
- [ ] 类型/函数名在任务间一致：`RuntimeEventCatalog`、`WeightOverlay`、`runtimeCatalog`、`runB10`、`runB11`、`WeightPatchIntent`、`validateWeightOverlay`。
- [ ] 文档写入后运行 `git diff --check`，并确认未触碰正式事件配置与现有 dirty worktree。

Plan complete and saved to `docs/superpowers/plans/2026-08-12-constrained-auto-evolution-b1.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task with review checkpoints.
2. **Inline Execution** — execute the tasks in this session using executing-plans with checkpoints.

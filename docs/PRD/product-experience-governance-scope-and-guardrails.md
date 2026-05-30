# Product Experience Governance — Scope Freeze & Architecture Guardrails

本文件是 **US-001** 与 **US-022** 的 canonical 交付物。后续 PXG 包必须以本文档为范围与护栏依据，而非历史 Phase 报告或 0-80 完成宣称。

**关联 PRD：** `docs/PRD/product-experience-governance.md`

---

## 1. Golden Life Line Scope (US-001)

### 1.1 年龄边界

- **黄金人生线（Golden Life Line）** = 游戏内年龄 **0–30 岁（含）**。
- **31+ 内容**：属于 deferred / backlog，**不是**本阶段 playable 验收范围。
- **明确排除**：本阶段不要求 full **0–80 岁**完整人生模拟完成。

### 1.2 玩家旅程阶段（0–30）

| 阶段 | 年龄 | 体验目标 | 代表里程碑（PXG2 将具体化 event id） |
|---|---|---|---|
| **Birth** 出生 | 0 | 出身与初始身份 | `origin` 事件 |
| **Childhood** 童年 | 1–12 | 童年身份形成 | `general`、`origin` |
| **Youth** 少年 | 13–17 | 第一次成形抉择 | `sect_path_choice`（约 13 岁） |
| **Route Entry** 路线入口 | 14–18 | 进入三条优先路线之一 | `route_*` flag 写入 |
| **Route Commitment** 路线承诺 | 18–22 | 路线试炼 / 锁定 | 各路线 trial 事件 |
| **Early Adulthood** 青年后果 | 22–30 | 路线后果与 payoff | `identity-hero`、`identity-demon` 等 |

### 1.3 三条优先路线

本阶段 playable 验收聚焦以下三条路线（PRD 术语）：

| PRD 优先路线 | 治理定义 | Primary runtime assets（wired） | Route flag / routeId | 0–30 入口锚点 |
|---|---|---|---|---|
| **Orthodox / Sect** 正道/门派 | 拜入正道门派、完成 early sect arc | `sect-wudang.json`、`sect-shaolin.json`、`training.json` | `route_orthodox` → `sect` | age 13 `sect_path_choice` → `join_orthodox` |
| **Wandering Hero** 流浪侠客 | 不依附门派的侠义流浪人生 | `sect-wudang.json`（`stay_wanderer`）、`identity-hero.json`、`sect-border.json` | `route_wanderer` → `wanderer`；`route_border` 亦映射 wanderer | age 13 `stay_wanderer`；hero 事件 20–30 |
| **Demonic Path** 魔道 | 诱惑、力量、社会代价、道德冲突 | `sect-marginal.json`、`identity-demon.json` | `route_demonic` → `demonic` | `demonic_encounter` → `accept_demonic` |

**Deferred（非 active golden-line，PXG1 标 deferred）：**

- `orthodox.json` — 文件存在但 **未在 `src/data/events.json` imports 中 wired**
- 独立 `demonic.json` — **不存在**（内容已分散在 `sect-marginal.json`）

### 1.4 仿真 track 与 PRD 路线映射

当前仿真样本使用的 `routeTrack: official | beggars | demonic` **不等于** PRD 三条优先路线：

| Runtime 名称 | 文件 | Flag | 与 PRD 关系 | 本阶段处置 |
|---|---|---|---|---|
| **official** 仕途 | `official.json`（wired） | `route_official` | **非优先路线**；属 institution/career 支线 | golden-line **out of scope**；PXG1 标 deferred/candidate |
| **beggars** 丐帮 | `sect-beggars.json`（wired） | `route_beggars` | **非优先路线**；与 wandering hero **不同**（有组织门派线） | golden-line **out of scope**；PXG1 标 deferred |
| **demonic** 魔道 | `sect-marginal.json`（wired） | `route_demonic` | **= PRD demonic path** | **保留为优先路线 #3** |

**关键区分：**

- `official` ≠ `orthodox/sect`（仕途 vs 武林门派）
- `beggars` ≠ `wandering hero`（丐帮组织 vs 无门派流浪侠义）
- PXG4 将把仿真 `routeTrack` 替换为 `sect / wanderer / demonic`（+ neutral baseline）

### 1.5 本阶段 Non-Goals（冻结清单）

- 不启动前后端分离、数据库、账号系统、云同步、小程序 runtime
- 不做 full 0–80、大规模 unrelated 内容、完整 UI 重设计
- 不批量把 deferred events 迁入 active
- 不引入新 major gameplay systems（除非完成 golden life line 所必需）
- 不清理所有历史文档（stale 文档 registry 见 §3；正文更新属 PXG5 / US-023）

---

## 2. Architecture Readiness Guardrails (US-022)

本阶段 **不得破坏** 以下架构约束，以便未来前后端分离时可迁移。

### 2.1 GameState 必须 JSON 可序列化

- `GameState` 全量须可通过 `JSON.stringify` 持久化（见 `src/core/SaveManager.ts`）。
- **禁止** 将不可序列化的 runtime 对象（函数、DOM 引用、循环引用）写入 save。

### 2.2 事件必须 data-driven

- Active golden-line 事件仅来自 **runtime-loaded JSON**（`src/data/events.json` imports → `EventLoader.ts` lineMap）。
- 新逻辑 **不得** 用 hardcode 替代 JSON 事件定义。
- 当前 wired imports 共 **21 个文件**；imports 与 lineMap 必须一致。

### 2.3 Choice result 必须可 log / replay

最小 replay 记录字段集：

| 字段 | 说明 | 参考类型 |
|---|---|---|
| `age` | 事件发生时的游戏年龄 | `EventRecord` |
| `eventId` | 事件标识 | `EventRecord` |
| `choiceId` | 玩家所选选项 | `EventRecord.selectedChoice` |
| `outcomeText` | 玩家可见反馈文案 | `GameProcessSimulator` record |
| `appliedEffects` | 结构化效果 | `ResolvedChoiceEffects` |
| `routeStates` | 路线状态快照 | `GameState.routeStates` |
| `flags` delta | 持久 flag 变化 | `EventRecord.stateSnapshot` |

仿真与门禁输出须包含上述字段，以便跨 run 对比（PXG4 实现）。

### 2.4 Save schema versioning

- 当前 canonical 版本：**`P2_SAVE_SCHEMA_VERSION = '2.0.0-p2'`**（`src/core/SaveManager.ts`）。
- 可读范围：`1.0.0` ~ `2.x`（`evaluateSaveCompatibility()`）。
- 治理阶段 **不得 silent bump** schema version；变更须文档化并更新兼容边界。

### 2.5 本阶段禁止引入

- Database / backend API / account system / cloud sync / mini-program runtime

---

## 3. Stale Documentation Registry

以下文档仍描述 **0–80 完整人生** 或 **Phase 2/3 后端/数据库/小程序**，与本阶段 Non-Goals 冲突。**PXG0 不修改正文**（US-023 属 PXG5）；新会话应引用 **本文档 + PRD + dispatch index** 而非下列文件作为执行依据。

| 类别 | 文档 | Stale 内容 |
|---|---|---|
| 0–80 完成宣称 | `docs/PROJECT_OVERVIEW.md` | ~~“完整人生模拟（0-80 岁）”~~ **PXG5：** 文首已加 0–30 治理口径横幅；Phase 表仍为历史记录 |
| 0–80 完成报告 | `docs/PHASE_1_COMPLETION_REPORT.md`、`docs/PHASE_1_1_COMPLETION_REPORT.md`、`docs/PHASE_1_2_INTEGRATION_REPORT.md`、`docs/INTEGRATION_TEST_REPORT.md` | 0–80 完整人生 |
| 后端/DB/小程序路线图 | `docs/PROJECT_PLAN.md` | PostgreSQL、Redis、前后端分离、小程序迁移 |
| 后端 Phase 规划 | `docs/DEVELOPMENT_HUB.md`、`docs/README_PREVIEW.md`、`docs/PHASE_2_COMPLETION_REPORT.md` | Phase 2 前后端分离 |
| 旧 PRD 仿真口径 | `docs/PRD/p2-gameplay-structure-and-persistence.md` | “0-80 岁人生是否稳定” |
| 旧体验治理 PRD | `docs/PRD/experience-governance-distributed-plan.md` | 并行治理 effort，非本 PRD 执行源 |
| 仿真脚本默认口径 | `scripts/runGameplaySimulation.ts` | 默认 85 岁 + official/beggars/demonic tracks |
| 架构设计参考 | `docs/EVENT_SYSTEM_ARCHITECTURE.md` | 含前后端分离愿景，状态为设计中 |

**正确引用源：** `docs/PRD/product-experience-governance.md`、本文档、`agent_docs/product-experience-governance-dispatch-index.md`。

---

## 4. Resolved Decisions（原 PRD Open Questions）

| # | 问题 | 决议 |
|---|---|---|
| 1 | 一条 canonical route per test run，还是每条优先路线一个 deterministic scenario？ | **三条优先路线各一个 deterministic scenario（共 3 个）** + 1 个 neutral baseline（无路线倾向）。PXG4 实现。 |
| 2 | active event classification 存 JSON manifest、markdown report，还是 both？ | **JSON manifest 为 machine source of truth**；markdown report 为人类可读摘要。PXG1 交付。 |
| 3 | route payoff rate 是否计 text-only callback？ | **计**：later event 中 **mechanical state read** 或 **player-facing text/choice availability 变化** 均算 payoff；仅 hidden stat 无叙事不算。 |
| 4 | 0–30 golden-line scenario 中 death 如何处理？ | **Constrained allow**：death 机制保留；**deterministic golden scenarios 必须设计为可达 30 岁**；death 在 active golden-line 内视为 continuity gate failure。 |
| 5 | 哪个 report command 作为单一 governance gate entry point？ | **`npm run gate:experience` 为主入口**；PXG5 closure 用 `npm run report:experience-governance-closure`；PXG4 增加 **golden-line 子门禁**（maxAge=30）。 |

---

## 5. Handoff

### 5.1 → PXG1（Event Asset and State Field Audit）

| 字段 | 值 |
|---|---|
| **审计年龄边界** | 0–30；`ageRange.max > 30` 的 wired 事件默认 **deferred**（除非被 golden spine 显式选用） |
| **Runtime 边界** | 仅以 `src/data/events.json` imports 为准（当前 21 文件）；`EventLoader.ts` lineMap 须一致 |
| **优先路线候选池** | `sect-wudang`、`sect-shaolin`、`training`、`sect-border`、`identity-hero`、`sect-marginal`、`identity-demon`、`origin`、`general` |
| **Non-priority loaded 路线** | `official.json`、`sect-beggars.json` — 分类为 deferred/candidate，不得默认 active |
| **Deferred 未 wired** | `orthodox.json`、`prologue.json`、`identity-scholar/hermit/...`（见 `events.json` notes） |
| **Route-like 字段** | 参考 `docs/test-reports/us-007-route-identity-faction-field-inventory.md`；golden-line 新工作优先 `routeStates` + `route_*` flags |
| **文档 superseded 列表** | 本文档 §3 |

### 5.2 → PXG4（Simulation and Experience Gates）

| 字段 | 值 |
|---|---|
| **仿真年龄上限** | `endAge = 30`（或从 birth 计 `years ≤ 30`） |
| **Deterministic scenarios** | 4 个：orthodox/sect、wandering hero、demonic path、neutral baseline |
| **替换仿真 routeTrack** | 将 `official/beggars/demonic` 改为 `sect/wanderer/demonic`（+ baseline） |
| **Simulation output 必填** | age, eventId, routeState, choiceId, feedback/outcomeText, durable flags/states |
| **Replay 契约** | 对齐 §2.3 最小字段集 |
| **Save 约束** | 不得破坏 `P2_SAVE_SCHEMA_VERSION`；simulation 可 in-memory，不 require DB |
| **Gate 层级** | `gate:experience` 主入口；新增 golden-line 子检查（maxAge=30, active-scope only） |
| **Death 策略** | golden scenarios 应 reach 30；death = continuity failure |
| **Payoff 阈值** | key-choice payoff rate ≥ 70%（US-008） |
| **Gap 阈值** | unexplained event gap ≤ 2 in-game years（US-005/016） |

---

## 6. Route Conflict Preview（PXG3 细化）

基于现有 `RouteCompatibilityRules` 与 `docs/test-reports/us-009-route-compatibility-rules.md`：

- `sect` ↔ `demonic`：**strong_exclusion**
- `hero`/`wanderer` ↔ `demonic`：**strong_exclusion**
- `sect` ↔ `wanderer`：**soft_exclusion**（需 turn event）
- `official`、`beggars` 与三条优先路线：**non-priority**；golden-line 内不作为主 arc

---

*PXG0 交付日期：2026-05-30*

# PRD: P7.2 服务端权威主动人生规划统一

## 1. 背景

P7 建立了「无强制剧情事件时，玩家主动选择本期行动」的核心循环，并在本地 Web 引擎中完整落地：练功、读书、交游、行动小结、扰动轻量叙事、来源标签与报告字段均已实现。

P6B 已将剧情选择与存档权威迁移到服务端，但 P7 实施时刻意未改动后端 API。P7.1 因此在 API 模式展示边界提示，要求玩家切回本地模式才能主动规划——这与产品终态矛盾：

- **服务端模式才是完整产品形态**（存档、会话、反作弊、回放、内容版本均由服务端权威）。
- **本地模式与 API 模式节奏完全不同**：前者可在事件空窗期安排日常，后者只能被动等待 `nextEvent`，无法为同一套内容做策划与验收。
- **核心逻辑并非两套**：`ActivePlanningService`、`ActionResultResolver`、`DisturbanceResolver` 与 `GameEngineIntegration.executeActiveAction` 已存在于共享核心；缺口是 Headless Session 与 HTTP API 未暴露该路径。

P7.2 的目标是把 P7 主动规划能力**接入服务端权威链路**，使 API 模式与本地模式共享同一游戏节奏与结果模型；本地模式降级为开发/离线兜底，不再作为「另一套完整玩法」。

## 2. 核心判断

```text
阶段目标 -> 玩家选择本期行动 -> 行动产生短期结果 -> 随机/剧情扰动 -> 属性与关系变化 -> 更新下一期可选方向
```

上述 P7 循环必须在**服务端会话**中成立。客户端只负责展示服务端返回的结构化 payload，不得本地伪造行动结果或时间推进。

统一原则：

| 原则 | 说明 |
| --- | --- |
| 单一真相源 | 行动解析、时间推进、扰动抽取、snapshot 写入均在服务端 Headless Session 完成 |
| 契约复用 | API payload 对齐现有 `ActiveActionDefinition`、`ActiveActionSummaryDisplay`、`DisturbanceNarrativeDisplay` |
| 模式收敛 | API 模式移除 P7.1 边界提示；本地模式保留但标记为非产品路径 |
| 回放一致 | `replay_actions` 记录主动行动，与剧情选择同级可审计 |

## 3. 目标

1. 当 `selectEvent()` 为空且会话未终结时，服务端返回可用主动行动列表，而非 `nextEvent: null` 空窗。
2. 玩家提交主动行动后，服务端执行、持久化 snapshot，并返回行动小结与可选扰动叙事。
3. Web API 模式 UI 与本地模式复用同一套 `GameScreen` 展示组件（行动小结卡、扰动卡、来源标签）。
4. 移除「请使用本地模式」类边界提示；API 模式成为默认产品路径。
5. 新增服务端集成测试与 headless parity 覆盖，证明 API 路径与本地引擎在固定种子下结果一致。
6. 保持 P6B session/save 冲突模型（`409 STALE_*`）与既有 `build`、`test`、P5/P6B gate 不回归。

## 4. 非目标

- 不批量接入 39 个 deferred 事件文件。
- 不扩写主动行动 catalog（仍使用 P7 最小行动集）。
- 不实现账号注册、跨设备同步、管理后台。
- 不在本阶段物理删除本地模式代码（仅降级定位与文档化废弃路径）。
- 不重做 UI 视觉风格。
- 不修改 P8 可玩性门禁的 persona 策略（仅确保 API 路径可被同一套 headless 逻辑驱动）。

## 5. 范围

### 5.1 In Scope

- Headless Session 扩展：`getPlanningOptions()`、`executeActiveAction()`。
- 服务端 `gameService` 与 HTTP 路由：主动行动执行、会话阶段响应。
- `replay_actions` 新 action type：`active_action`（及可选 `disturbance_ack`）。
- Web `useApiGameEngine` / `webApiClient` 接线。
- `App.vue` / `GameScreen.vue`：API 模式复用 P7.1 主动规划 UI 分支。
- 移除 `api-boundary-notice` 及相关 P7.1 误导文案。
- API 契约文档、集成测试、收口报告。
- 本地模式降级说明（dev fallback，非产品路径）。

### 5.2 Out of Scope

- 新数据库表（复用现有 `game_snapshots`、`replay_actions` JSONB payload）。
- 独立 `GET /disturbance` 长轮询端点（扰动随 `active-action` 响应一并返回）。
- 天赋、道具、区域、势力系统接入。

## 6. 会话阶段模型

服务端在每个「等待玩家输入」的时刻，返回明确的 `sessionPhase`：

| `sessionPhase` | 含义 | 客户端行为 |
| --- | --- | --- |
| `story_event` | 有强制/可选剧情事件 | 展示 `nextEvent` 与选项 |
| `active_planning` | 无剧情事件，可安排日常 | 展示 `planningOptions` |
| `action_summary` | 刚完成主动行动，待确认小结 | 展示 `activeActionSummary`；无扰动时确认后回到 planning |
| `disturbance_narrative` | 行动后触发扰动，待确认 | 展示 `disturbanceNarrative`；确认后回到 planning |
| `terminal` | 人生终结 | 进入结局流 |

**状态转移（简化）：**

```text
story_event --[choice]--> (auto progress) --> story_event | active_planning | terminal
active_planning --[active-action]--> action_summary
action_summary --[ack]--> disturbance_narrative | active_planning | story_event
disturbance_narrative --[ack]--> active_planning | story_event
```

`ack` 可为无 body 的 `POST .../progression-ack` 或带 `expectedPhase` 的轻量确认；实现时选一种并写死契约，避免双端分叉。

## 7. API 契约（草案）

### 7.1 扩展现有 Session 响应

`POST /v1/sessions`、`POST /v1/sessions/restore`、`POST .../choices`、`POST .../active-action`、`POST .../progression-ack` 在 `nextEvent === null` 时**必须**携带：

```typescript
interface SessionProgressionPayload {
  sessionPhase: 'story_event' | 'active_planning' | 'action_summary' | 'disturbance_narrative' | 'terminal';
  nextEvent: StoryEventDto | null;
  planningOptions?: PlanningOptionDto[];
  activeActionSummary?: ActiveActionSummaryDisplay;
  disturbanceNarrative?: DisturbanceNarrativeDisplay;
  lifeMemory?: LifeMemoryDto;
  slotVersion: number;
  snapshotId: string;
  terminal: boolean;
}

interface PlanningOptionDto {
  actionId: string;
  text: string;
  description: string;
  rewardSummary: string;
  costSummary: string;
  riskLevel: string;
  category: ActionCategory;
}
```

字段命名与 `src/types/activeActionTypes.ts`、`buildActiveActionChoices()` 输出对齐。

### 7.2 新端点

| 方法 | 路径 | 职责 |
| --- | --- | --- |
| `POST` | `/v1/sessions/:sessionId/active-action` | 执行主动行动；body: `expectedSlotVersion`, `expectedSnapshotId`, `actionId` |
| `POST` | `/v1/sessions/:sessionId/progression-ack` | 确认行动小结或扰动叙事；body: `expectedSlotVersion`, `expectedSnapshotId`, `ackKind: 'action_summary' \| 'disturbance'` |

**权威规则：**

- 与 `choices` 相同：校验 device/session token、`expectedSlotVersion`、`expectedSnapshotId`；成功后写新 snapshot、递增 slot version、append replay。
- `sessionPhase !== active_planning` 时提交 `active-action` 返回 `400 INVALID_SESSION_PHASE`。
- 未知 `actionId` 返回 `400 INVALID_ACTION`。
- 服务端使用 Headless Session 内已注入的 `SeededRandomSource`（或会话级 seed），保证回放可复现。

### 7.3 Replay 记录

| `actionType` | `payload` 示意 |
| --- | --- |
| `active_action` | `{ actionId, disturbanceId?: string, deltas, duration }` |
| `progression_ack` | `{ ackKind, fromPhase, toPhase }` |

## 8. 用户故事索引

**结构化执行真相源（单次迭代粒度）：** `p7-2-server-authoritative-active-planning.prd.json`（共 58 个 user story）。

MD 仅保留波次分组索引；每个 story 的验收标准以 JSON 为准。

### P7.2-W0：基线与契约（US-001 – US-009）

| 范围 | Stories |
| --- | --- |
| 只读基线 | US-001 本地路径盘点 · US-002 API 缺口盘点 · US-003 基线报告 |
| 范围锁定 | US-004 guardrails · US-005 API 设计决策锁定（单端点 ack、时间追赶） |
| 契约类型 | US-006 SessionPhase · US-007 PlanningOptionDto · US-008 请求体 · US-009 SessionProgressionPayload |

### P7.2-W1：Headless Session（US-010 – US-024）

| 范围 | Stories |
| --- | --- |
| 接口与 volatile | US-010 接口签名 · US-011 volatile 待确认状态 |
| 阶段推导 | US-012 getSessionPhase · US-013 phase 单测 |
| 规划选项 | US-014 getPlanningOptions · US-015 与本地 parity 单测 |
| 行动执行 | US-016 核心执行 · US-017 小结 volatile · US-018 扰动 volatile · US-019/020 单测 |
| 确认回流 | US-021 summary ack · US-022 disturbance ack · US-023 ack 单测 · US-024 端到端 loop 单测 |

### P7.2-W2：服务端 API（US-025 – US-038）

| 范围 | Stories |
| --- | --- |
| 映射与 bootstrap | US-025 mapSessionProgression · US-026 无事件时 active_planning |
| 扩展既有响应 | US-027 create · US-028 restore · US-029 choice |
| 新服务能力 | US-030 active-action 校验 · US-031 持久化 · US-032 progression-ack |
| 路由 | US-033 active-action 路由 · US-034 progression-ack 路由 |
| 集成测试 | US-035 新局进 planning · US-036 active-action 成功 · US-037 ack 循环 · US-038 冲突与 phase 错误 |

### P7.2-W3：Web 客户端（US-039 – US-052）

| 范围 | Stories |
| --- | --- |
| API 客户端 | US-039 响应类型 · US-040 executeActiveAction · US-041 acknowledgeProgression |
| Composable | US-042 状态字段 · US-043 handleActiveAction · US-044 handleProgressionAck |
| App 接线 | US-045 planning currentNode · US-046 小结/扰动 currentNode · US-047 choices 映射 · US-048 路由 · US-049 GameScreen props |
| 清理与验收 | US-050 移除边界提示 · US-051 更新测试 · US-052 浏览器验收 |

### P7.2-W4：一致性与收口（US-053 – US-058）

| 范围 | Stories |
| --- | --- |
| Parity | US-053 harness · US-054 断言 |
| 文档 | US-055 废弃 P7.1 边界文档 · US-056 本地模式降级说明 |
| 收口 | US-057 closure report · US-058 全量回归 gate |

## 9. 功能需求

- **FR-1**：服务端在 `selectEvent()` 为空且玩家存活时，`sessionPhase` 必须为 `active_planning`，并返回至少 1 个 `planningOption`（与本地 `getMinimumActions` 规则一致）。
- **FR-2**：`POST .../active-action` 必须在服务端调用 `executeActiveActionOnState`（或 Headless 等价封装），禁止客户端提交属性 delta。
- **FR-3**：行动成功后自动持久化 snapshot；响应 `sessionPhase` 为 `action_summary` 或（有扰动时先 `action_summary`，ack 后 `disturbance_narrative`）。
- **FR-4**：扰动仍仅为轻量叙事；确认后回到 `active_planning` 或（若时间推进后抽到剧情）`story_event`。
- **FR-5**：剧情选择路径行为与 P6B 一致；选择后若进入无事件状态，下一响应必须是 `active_planning` 而非空等待。
- **FR-6**：API 模式 UI 必须展示与本地模式相同的行动小结卡、扰动卡、来源标签（复用 P7.1 组件与 builder）。
- **FR-7**：移除所有引导玩家「切换本地模式才能主动规划」的玩家可见文案。
- **FR-8**：冲突、鉴权、catalog 版本不兼容等错误语义与 P6B 保持一致。

## 10. 技术考量

### 10.1 复用点

| 模块 | 路径 |
| --- | --- |
| 行动解析 | `src/core/activePlanning/ActionResultResolver.ts` |
| 行动执行 | `src/core/activePlanning/ActivePlanningService.ts` |
| 扰动 | `src/core/activePlanning/DisturbanceResolver.ts` |
| UI 摘要 | `src/core/activePlanning/activeActionSummaryBuilder.ts` |
| 行动 catalog | `src/data/activeActionCatalog.ts` |
| Headless 外壳 | `src/headless/session/HeadlessEngineSessionImpl.ts` |
| 服务端胶水 | `server/src/services/headlessRuntime.ts`, `gameService.ts` |

### 10.2 Headless volatile 状态

`HeadlessEngineSessionImpl` 需扩展 volatile 字段跟踪 `pendingActionSummary`、`pendingDisturbance`，避免把「待确认 UI 状态」写入 snapshot；ack 仅清除 volatile，不写 snapshot（行动执行时已写入）。

### 10.3 随机数

主动行动与扰动在服务端必须使用会话级 `SeededRandomSource`，并在 replay payload 记录足够信息以支持审计；与 P5 parity 策略对齐。

### 10.4 本地模式策略

| 阶段 | 策略 |
| --- | --- |
| P7.2 | 保留 `useNewGameEngine`；文档标明仅用于无后端开发 |
| 后续 | 可将 `VITE_P6B_API_URL` 设为 dev 默认；最终移除双引擎分支 |

## 11. 验收标准（阶段级）

- [ ] API 模式新游戏后，在无剧情事件时可见练功/读书/交游选项。
- [ ] 选择行动后可见结构化小结（非单行日志）。
- [ ] 触发扰动时可见轻量叙事卡，确认后继续规划。
- [ ] 全程无「请使用本地模式」提示。
- [ ] `tests/server/integration.test.ts` 覆盖 active-action 与 ack 路径。
- [ ] 固定种子 parity 测试：服务端与本地 core 行动结果一致。
- [ ] `npm run build` 与 `npm test` 通过；P6B gate 不回归。

## 12. 风险与回滚

| 风险 | 缓解 |
| --- | --- |
| Headless 与 Vue 引擎行为分叉 | 共享 `ActivePlanningService`；parity 测试守门 |
| Session phase 与客户端状态不同步 | 所有转移由服务端响应驱动；客户端不推断 phase |
| 旧客户端打新 API | 新字段向后兼容：`sessionPhase` 缺省时按 `nextEvent` 推断 `story_event` |
| 回滚 | 还原路由与客户端分支；snapshot schema 无破坏性变更，可回滚部署 |

## 13. 成功指标

- API 模式可完成 P7 closure 同款循环：0–30 岁交替主动行动，无需本地模式。
- P8 真人切片与可玩性门禁可明确以 API 模式为验收环境。
- 策划与内容生产只需维护一套「事件 + 主动行动」节奏假设。

## 14. 开放问题

1. **默认 dev 体验**：是否在 P7.2 内将 `.env.development.local.example` 默认指向本地 API，而非空 API URL？
2. **progression-ack 是否合并**：单端点 `ackKind` vs 分 `ack-action-summary` / `ack-disturbance` 两个端点？（建议单端点，减少往返。）
3. **自动时间追赶**：本地模式在无任何行动时 `advanceTime(3, 'month')`；服务端是否复用同一规则？（建议复用，保持节奏一致。）
4. **P7.2 是否纳入 `gate:playability`**：建议 P7.2 仅保证 API headless 可驱动；P8 gate 扩展为 follow-up story。

---

**审批前不进入业务代码实施。** 批准后严格按 `p7-2-server-authoritative-active-planning.prd.json` 中 `priority` 1→58 顺序执行；每个 story 为单次迭代边界，不得合并跳过。

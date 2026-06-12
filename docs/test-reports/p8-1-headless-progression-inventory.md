# P8.1 US-002 — P7.2 Headless Progression Path Inventory

生成时间：2026-06-12

## 1. SessionPhase 状态机

定义：`src/headless/session/sessionTypes.ts` + `src/contracts/sessionProgression.ts`

| Phase | 触发条件 | Headless API |
| --- | --- | --- |
| `story_event` | `volatile.currentEvent` 非空 | `getNextEvent()`, `executeChoice()`, `progressAutomatic()` |
| `active_planning` | 存活且无 pending 事件/摘要 | `getPlanningOptions()`, `executeActiveAction(actionId)` |
| `action_summary` | `volatile.pendingActionSummary` 非空 | `acknowledgeProgression('action_summary')` |
| `disturbance_narrative` | `volatile.pendingDisturbanceNarrative` 非空 | `acknowledgeProgression('disturbance')` |
| `terminal` | 死亡或结局 | `getTerminalState()` |

`getSessionPhase()` 实现见 `HeadlessEngineSessionImpl`（P7.2）。

## 2. 典型推进循环（与 server gameService 同源）

```text
active_planning → executeActiveAction → action_summary
  → ack(action_summary) → [disturbance_narrative?] → ack(disturbance)?
  → resolveAfterPlanningAck → getNextEvent / progressAutomatic
  → story_event (choice or auto) → active_planning
```

**自动剧情链：** `progressUntilChoiceOrTerminal()` in `server/src/services/headlessRuntime.ts`：

- 循环 `getNextEvent()` + `progressAutomatic()` 直到需要 choice、进入 planning、或 terminal

**Ack 后解析：** `resolveAfterPlanningAck()` 清空 currentEvent，尝试选下一事件或推进时间。

## 3. Persona 模拟应如何调用

| 阶段 | 调用 |
| --- | --- |
| 开局 | `HeadlessEngineSessionImpl.create({ playerName, gender, catalogVersion, randomSeed })` |
| age 13 种子 | 写入 `getRuntimeState().flags` ← `resolvePersonaYouthRouteSeeds(persona)` |
| story_event + choice | `applyPersonaChoiceBias` 选 choice → `executeChoice(buildChoiceRequest(...))` → `progressUntilChoiceOrTerminal` |
| active_planning | `selectPersonaActiveAction` → `executeActiveAction(actionId)` |
| action_summary | `acknowledgeProgression('action_summary')` |
| disturbance_narrative | `acknowledgeProgression('disturbance')` |

Volatile UI 状态（summary/disturbance）不在 `serialize()` 中；gate runner 单进程内无需跨请求缓存。

## 4. 参考文档与测试

| 资源 | 用途 |
| --- | --- |
| `docs/designs/p7-2-session-progression-api.md` | API 契约与 phase 语义 |
| `tests/headless/p72SessionPhase.test.ts` | phase 转换、planning options、ack 循环 |
| `tests/headless/p72ActivePlanningParity.test.ts` | headless vs core `executeActiveActionOnState` stat parity |
| `tests/server/integration.test.ts` | HTTP `active-action` / `progression-ack` 端到端 |
| `server/src/services/headlessRuntime.ts` | `progressUntilChoiceOrTerminal`, `buildChoiceRequest` |

## 5. P8.1 runner 约束

- 必须使用 `executeActiveAction` + `acknowledgeProgression`，禁止绕过 phase 机直接调 `GameEngineIntegration.executeActiveAction`
- Choice 后应调用与 server 相同的 auto-progress 辅助，避免卡在 auto 链中间

本故事为只读盘点，未修改业务代码。

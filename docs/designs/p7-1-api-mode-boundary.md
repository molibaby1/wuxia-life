# P7.1 API 模式主动规划能力边界

> **SUPERSEDED by P7.2** — API 模式现已支持服务端权威主动规划。请参阅 [P7.2 PRD](../PRD/p7-2-server-authoritative-active-planning.md) 与 [P7.2 Session Progression API](./p7-2-session-progression-api.md)。本文档保留作历史记录，勿再向玩家展示「请使用本地模式」类文案。

# P7.1 API 模式主动规划能力边界（历史）

## 玩家可见文案（P7.1 实现）

当 Web 以 API 模式运行（构建时设置 `VITE_P6B_API_URL`）且处于对局中时，在 `GameScreen` 顶部展示：

> **服务端模式暂不支持主动人生规划。** 当前进度由服务器推送剧情事件驱动；若需安排练功、读书与交游，请使用本地模式（不设置 API 地址）开始游戏。

展示位置：主游戏区 `content-area` 顶部提示条，不打断既有事件/选项布局。

## 触发条件

- `apiMode === true`
- `gamePhase === 'playing'`
- 不依赖 `nextEvent` 是否为空（能力缺失是模式级事实，非瞬时状态）

## 本地模式（P7.1 实现目标）

- `selectEvent()` 为空时继续提供 `getAvailableActiveActions()`。
- 行动结果与扰动叙事仅在本地 composable / `GameScreen` 渲染。

## 未来后端边界（仅文档，P7.1 不实现）

建议后续 P8+ API 扩展时新增（命名示意）：

| 端点 | 职责 |
| --- | --- |
| `GET /session/:id/planning-options` | 返回与 catalog 对齐的可用主动行动 |
| `POST /session/:id/active-action` | 服务端解析行动、推进时间、写入 snapshot |
| `GET /session/:id/disturbance` | 可选：扰动叙事 payload |

契约要求：

- 与本地 `ActiveActionDefinition` / `ActionResult` 字段对齐，避免双套摘要模型。
- Session snapshot 需记录 `sourceKind`（`active_action` / `random_disturbance` / `story_event`）。
- 扰动仍保持轻量叙事，不引入完整事件链状态机。

## 残余说明

P7.1 **不**修改 `server/` 路由或数据库；API 玩家体验为「仅剧情事件 + 明确提示」，避免误以为主动规划已损坏。

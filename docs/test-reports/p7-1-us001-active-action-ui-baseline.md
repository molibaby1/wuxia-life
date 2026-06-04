# P7.1 US-001：主动行动 UI 基线（只读）

## 主动行动入口

- 本地模式：`useNewGameEngine.getNextEvent()` 在 `gameEngine.selectEvent(age)` 返回 `null` 时进入主动规划。
- `GameEngineIntegration.getAvailableActiveActions()` 经 `buildActiveActionChoices()` 提供三类最小行动（练功 / 读书 / 交游）。
- `App.vue` 在 `isActiveActionMode` 时将 `availableActiveActions` 映射为带 `isActiveAction: true` 的选项；`currentNode` 显示「规划本期人生」引导文案。

## 行动结果展示（基线）

- `handleActiveAction` 将 `executeActiveAction` 的 `feedbackText` 写入 `engineState.lastOutcomeText`。
- `App.vue` 在无 `currentEvent` 且有 `lastOutcomeText` 时合成 `currentNode`（标题「本期小结」），正文为拼接字符串。
- `GameScreen.vue` 的 `displayedNarrative` 优先 `lastChoiceFeedback.player.narrativeResult`，否则回退 `lastOutcomeText`。
- 扰动标题通过 `ActivePlanningService` 拼入 `feedbackText`（`；{disturbanceTitle}`），非独立叙事块。

## 扰动标题 surfaced 方式

- 池定义于 `DisturbanceResolver.ts`（切磋邀请 / 街市传闻 / 轻微扭伤）。
- 解析后写入 `actionHistory`（`sourceKind: random_disturbance`），同时标题进入 `feedbackText` 拼接。
- UI 无独立扰动卡，与正式剧情事件共用 outcome 区域。

## 继续 / 回流规划

- 无选项时 `GameScreen` 显示「继续」，`continueToNext` 清空 `lastOutcomeText` / `lastChoiceFeedback` 并调用 `getNextEvent()`。
- 下一拍可能重新进入事件或再次进入主动规划模式。

## API 模式分支

- `isApiModeEnabled()`（`VITE_P6B_API_URL`）走 `useApiGameEngine`；`availableChoices` 仅来自服务端 `nextEvent`。
- 无本地 `getAvailableActiveActions` 分支；玩家无法在本期安排主动行动。
- 基线缺口：缺少明确的「API 暂不支持主动规划」玩家提示（P7.1 US-003 收口）。

## P7.1 目标缺口摘要

| 区域 | 现状 | P7.1 目标 |
| --- | --- | --- |
| 行动结果 | 单段拼接文本 | 结构化小结卡 |
| 扰动 | 标题拼进 feedback | 轻量叙事卡 + 分步继续 |
| 来源标签 | 无玩家可见区分 | 主动行动 / 扰动 / 剧情事件 |
| API | 静默缺失能力 | 明确边界提示 |

本文件为只读基线，未修改业务代码。

# US-011 状态来源审计（迁移前）

## 审计范围

本审计覆盖以下状态来源与入口关系：

- 旧状态仓库（legacy store）：`src/store/gameStore.ts` + `src/composables/useGameEngine.ts`
- 新组合式入口（new composable）：`src/composables/useNewGameEngine.ts`
- 全局游戏引擎（global game engine）：`src/core/GameEngineIntegration.ts`（`gameEngine` 单例）
- 存档管理器（save manager）：`src/core/SaveManager.ts` + `src/components/SaveManager.vue`
- 调试面板（debug panel）：`src/components/DebugPanel.vue`（由 `src/App.vue` 挂载）
- 演示组件（demo components）：`src/components/MainDemo.vue`、`src/components/DemoPage.vue`

## 状态来源关系总览

| 状态来源/入口 | 关键文件 | 当前用途 | 流程标记 | 关系与备注 |
| --- | --- | --- | --- | --- |
| 旧状态仓库（legacy store） | `src/store/gameStore.ts` | 基于 Vue reactive 的旧玩家状态容器（`state.player`） | deprecated flow | 仅被 `src/composables/useGameEngine.ts` 使用；未见 `src/App.vue`/`src/components/GameScreen.vue` 主流程引用。 |
| 旧引擎组合式（legacy composable） | `src/composables/useGameEngine.ts` | 旧版节点驱动流程，依赖 `gameStore` 与 `storyData` | deprecated flow | 与主流程已分叉；`useNewGameEngine` + `gameEngine` 才是当前主链路。 |
| 新组合式入口（new composable） | `src/composables/useNewGameEngine.ts` | 主流程 UI 状态协调（当前事件、可选项、结果文本） | main flow | 通过 `gameEngine` 拉取/推进全局状态；被 `src/App.vue` 与 `src/components/GameScreen.vue` 直接使用。 |
| 全局游戏引擎（gameEngine 单例） | `src/core/GameEngineIntegration.ts` | 统一的游戏业务状态与事件执行中心 | main flow | `useNewGameEngine`、`GameScreen`、`App`、`DebugPanel`、`SaveManager.vue` 均直接读取该单例状态。 |
| 存档管理器（save manager） | `src/core/SaveManager.ts` | 存档序列化/读取（localStorage 或文件） | demo flow | `src/components/SaveManager.vue` 调用 `gameEngine.getGameState()` 保存；加载仅向上 emit `gameLoaded`，而 `MainDemo` 的 `loadGameFromSave` 仍是占位实现。 |
| 调试面板（DebugPanel） | `src/components/DebugPanel.vue` | 运行态日志与状态观测（含 console 劫持） | demo flow | 由 `App.vue` 在 `playing` 阶段显式开关；读取 `gameEngine` 与 `useNewGameEngine` 状态，不参与主业务决策。 |
| 演示组件（MainDemo） | `src/components/MainDemo.vue` | 功能演示页，聚合事件历史/存档/性能面板 | demo flow | 依赖 `useNewGameEngine` 与 `SaveManager.vue`；未见接入主入口。 |
| 演示组件（DemoPage） | `src/components/DemoPage.vue` | 早期演示页（新版事件系统） | demo flow | 存在明显命名冲突实现（局部 `restartGame` 与解构同名），疑似实验页。 |

## 关系链路（简图）

1. 主流程链路：`App` -> `useNewGameEngine` -> `gameEngine` -> `GameEngineIntegration.gameState`
2. 主流程展示：`GameScreen` 直接读取 `gameEngine.getGameState()`，并使用 `useNewGameEngine.engineState.lastOutcomeText`
3. 调试链路：`App` 可选挂载 `DebugPanel`，`DebugPanel` 同时读取 `gameEngine` 与 `useNewGameEngine`（观测用途）
4. 演示/存档链路：`MainDemo` -> `SaveManager.vue` -> `saveManager` + `gameEngine.getGameState()`
5. 旧链路：`useGameEngine` -> `gameStore`（与当前 `App` 主流程脱钩）

## 待确认项

- `SaveManager.vue` 的 `gameLoaded` 事件在 `MainDemo` 中尚未落地到 `gameEngine` 状态恢复，实际“读档回放”是否可用需确认。
- `DemoPage.vue` 存在局部函数与解构同名逻辑，当前是否被路由或入口真实使用需确认。


# Product Experience Governance — Player Debug Policy (US-021)

**PXG5 交付物。** 规定 production-like 玩家流中允许的 debug 元素与开发入口。

---

## 1. 默认玩家流（禁止）

- 调试面板切换按钮
- Raw event id、choice id、condition 表达式
- Raw flag 名（如 `route_orthodox`、`sect_trial_active`）作为玩家可见文案
- 引擎 diagnostic 字段（如 `fallbackUsed`）的直接展示
- 性能监控、事件历史 JSON、仿真报告链接

---

## 2. Production-like 玩家流（允许）

- 叙事文本、结构化反馈（player visibility）
- 路线**显示名**与**阶段标签**（来自 `routeStates` / 映射表）
- 关系**显示名**与好感 delta
- 存档/读档（prompt 式 UI，非 debug）
- 通用 fallback 提示：「反馈细节暂不完整，后续影响仍在推进。」

---

## 3. 开发入口

| 入口 | 行为 |
| --- | --- |
| URL `?debug=1` | 显示「调试面板」按钮，可打开 `DebugPanel.vue` |
| `localStorage wuxia-debug=1` | 同上（仅 dev 构建） |
| 无 query / prod 构建 | 不渲染 debug 控件；`DebugPanel` 不可达 |

Debug 面板内可展示 event id、engineState、日志导出——**仅限显式开发入口**。

---

## 4. 实现对照

| 文件 | 变更 |
| --- | --- |
| `src/utils/debugAccess.ts` | debug 按钮 gated by dev + `?debug=1` |
| `src/utils/playerFacingLabels.ts` | 路线/flag 玩家向映射 |

---

*PXG5 / US-021 — 2026-05-30*

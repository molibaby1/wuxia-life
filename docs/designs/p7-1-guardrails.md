# P7.1 范围守门（Scope Guardrails）

## 允许（In Scope）

- 改进本地 Web 主流程的主动行动结果展示（结构化小结，非整页改版）。
- 为既有最小扰动池增加轻量叙事文案与独立展示卡。
- 强化 `actionHistory` / 报告中的来源与扰动可见性字段。
- 文档化 API 模式主动规划能力边界与后续接口方向。

## 禁止（Out of Scope）

- **不得**实现后端主动行动 API 或修改 P6B session / DB schema。
- **不得**批量接入 39 个 deferred 事件文件或扩写完整扰动事件链。
- **不得**新增天赋、道具、区域、势力、世界观大系统。
- **不得**放宽 `gate:p5`、`gate:experience`、`gate:golden-line` 既有阈值。

## 收口验证命令（必须通过）

```bash
npm run typecheck
npm run build
npm test
npm run gate:p5
npm run gate:experience
npm run gate:golden-line
```

涉及 UI 的 story 另需本地浏览器走通：主动行动 → 小结 →（可选）扰动 → 继续 → 回到规划/事件。

## 实施原则

- 每个 Ralph story 单独验证、单独记录；发现必须做 API 主动行动或 deferred 批量接线时，停止并另起 PRD。
- 优先复用 `src/core/activePlanning/` 与 `GameScreen` 既有卡片结构，避免视觉重做。

# P2 收尾补充说明（实施记录）

## 1. SaveManager 与浏览器构建

**问题**：`SaveManager` 曾静态 `import` Node 的 `fs`/`path`，Vite 生产构建会将模块 externalize 到 `__vite-browser-external`，产生告警且存在未来构建失败风险。

**处理**：删除文件系统后端；非浏览器环境统一使用进程内 `MemoryStorage`（`Map` 实现与 `localStorage` 相同的 `getItem`/`setItem`/`removeItem` 契约）。浏览器仍仅用 `window.localStorage`。

**验收**：`npm run build` 输出中不再出现 `SaveManager` 相关的 `Module "fs"/"path" has been externalized` 或 `__vite-browser-external` 导出缺失告警。

## 2. 条件表达式与事件数据

**问题**：`ConditionEvaluator` 白名单拒绝 `Math.random()` 等全局调用，导致 `birth_with_phenomenon`、`meet_love_interest` 等条件恒为 false。

**处理**：

- `birth_with_phenomenon`：移除 `conditions`，稀有度交由与同岁事件的 **权重比** 体现（与 `birth_wuxia_family` 等共同竞争）。
- `meet_love_interest`：改为 `!flags.has("hasLoveInterest") && !flags.has("love_started")`，概率意图交由事件 **权重** 与选择池体现。

同步更新：`src/data/lines/general.json`、`src/data/childhoodEvents.json`、`src/data/youthEvents.json`、以及对应的 `*.ts` 事件定义，避免 JSON 与 TS 源漂移。

## 3. 模拟体验诊断

**新增**：`scripts/gameplaySimulationDiagnostics.ts` — 汇总多样本下的高频 `eventId`、每样本 Top 复读事件、`routeStates` 生命周期计数快照、配偶/子女聚合。

**接入**：

- `npm run report:p2-gameplay-structure` 生成的 `docs/test-reports/us-023-p2-gameplay-structure-report.md` 增加 `## Experience Diagnostics (P2 closure)` 段落。
- CLI：`npm run simulate:gameplay:samples -- --diagnostics` 或 `tsx scripts/runGameplaySimulation.ts --samples --quiet --diagnostics`（单次模拟同样可加 `--diagnostics`）在终端打印诊断摘要。

## 4. 与 US-024 收口文档的关系

`docs/test-reports/us-024-p2-closure-verification.md` 已补充：除命令通过外，**生产构建不得再包含上述 SaveManager 相关 Vite 告警**；详细设计见本文件。

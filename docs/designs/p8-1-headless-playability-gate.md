# P8.1 Headless Playability Gate — Design Decisions

生成时间：2026-06-12

## 1. 默认 gate 模式

| 决策 | 值 |
| --- | --- |
| 默认 `gate:playability` runtime | `headless_server` |
| 对比 fallback | `--mode local_direct`（`GameProcessSimulator`） |
| CLI 省略 flag 时 | 等同 `--mode headless_server` |

```bash
npm run gate:playability                        # headless_server
npm run gate:playability -- --mode local_direct # 对比
npm run gate:playability -- --mode headless_server
```

## 2. Headless persona 主循环

与 P7.2 `sessionPhase` 对齐；复用 `progressUntilChoiceOrTerminal`（`server/src/services/headlessRuntime.ts`）。

Persona 策略：`selectPersonaActiveAction`, `applyPersonaChoiceBias`, `resolvePersonaYouthRouteSeeds`（age 13）。

## 3. Parity 容忍策略（headless vs local_direct）

固定 persona + seed 双跑对比：

| 字段 | 策略 |
| --- | --- |
| `finalAge` | exact match |
| `martialPower`（或 `externalSkill+internalSkill` 合计代理） | exact 或 ±1 舍入 |
| `records` 中 active_action 条数 | 允许 headless:local 比值 ≤ 8（phase 微步 vs 年度模型） |
| choice 条数 | 同上比值 ≤ 8 |
| action history length | 同上比值 ≤ 8 |

失败须在测试中打印双端摘要，不 silent pass。

## 4. 报告输出路径

| mode | JSON | Markdown |
| --- | --- | --- |
| `headless_server`（默认） | `p8-playability-gate-latest.json` | `p8-playability-gate-latest.md` |
| `local_direct` | `p8-playability-gate-local-latest.json` | `p8-playability-gate-local-latest.md` |

P9 baseline 只读取 `p8-playability-gate-latest.json`；`local_direct` 不得覆盖 canonical latest。

## 5. P8 报告 JSON 元数据

```typescript
interface P8PlayabilityReportMeta {
  runtimePath: 'headless_server' | 'local_direct';
  catalogVersion: string;
  engineVersion: string;
  p8GateEndAge: number;
  generatedAt: string;
}
```

`assemblePlayabilityReport(..., { runtimePath, catalogVersion, engineVersion })` 写入 report 根级字段；`renderP8MarkdownReport` 在 header 展示 `runtimePath`。

## 6. 开放问题收口

- P8 PRD §9「API mode excluded from human testing」→ 由 P8.1 真人切片 API 栈解决（见 `p8-1-api-human-test-script.md`）
- local 默认废弃：保留 `--mode local_direct` 一个版本窗口后文档标记 deprecated

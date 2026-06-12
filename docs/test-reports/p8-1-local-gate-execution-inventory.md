# P8.1 US-001 — Local Gate Execution Path Inventory

生成时间：2026-06-12

## 1. Gate 入口

| 项 | 说明 |
| --- | --- |
| npm 命令 | `npm run gate:playability` → `tsx scripts/runP8PlayabilityGate.ts` |
| Persona 源 | `getP8GatePersonas()` in `src/p8/personas.ts`（8 个固定 persona） |
| 结束年龄 | `P8_GATE_END_AGE`（40）from `src/p8/metricDefinitions.ts` |
| 模拟器 | `GameProcessSimulator` in `tests/GameProcessSimulator.ts` |

`runP8PlayabilityGate.ts` 对每个 persona 调用 `runPersonaSimulation()`，构造 `GameProcessSimulator` 配置（name/gender/seed/choiceTendency/p8PersonaId/simulateYears=40），执行 `simulate()` 得到 `GameProcessReport`。

## 2. 主动行动与剧情选择（local_direct 路径）

**年度主循环：** `GameProcessSimulator.simulateYear()` — 每年一次事件或一次主动行动。

**无可用事件时（主动规划）：**

1. `gameEngine.selectEvent()` 返回 null
2. `selectPersonaActiveAction()`（`src/p8/personaActionStrategy.ts`）按 persona 策略选 actionId
3. `gameEngine.executeActiveAction(actionId, { random: ACTIVE_ACTION_REPLAY_RANDOM })`
4. 写入 `GameProcessRecord`（`progressionKind: 'active_action'`）
5. `ensureProgressionCatchUp()` 推进时间

**有 choice 事件时：**

1. `selectChoice()` 对可用选项打分（tendency + route + `applyPersonaChoiceBias`）
2. `rankChoiceScores` 产出 P8 choice diagnostics
3. `gameEngine` 执行选项效果并推进

**P16 青年路线种子：** `applyP16PersonaYouthRouteSeeds(age)` 在 age===13 时将 `resolvePersonaYouthRouteSeeds(persona)` 写入 `state.flags`。

> 注意：local 路径**不经过** P7.2 `sessionPhase` / `acknowledgeProgression`；主动行动由引擎内联执行，无 action_summary / disturbance ack 阶段机。

## 3. 指标收集链路

| 步骤 | 模块 |
| --- | --- |
| 单 persona 原始报告 | `GameProcessReport`（records + p8ChoiceDiagnostics + p8ActiveActionReasons） |
| 指标聚合 | `buildPersonaRunMetrics(persona, report, diagnostics, reasons)` in `src/p8/collectPersonaMetrics.ts` |
| 重玩相似度 | `collectReplayMetrics(runs)` |
| 门禁判定 | `assemblePlayabilityReport(personaRuns, replay, endAge)` in `src/p8/playabilityGate.ts` |
| Markdown | `renderP8MarkdownReport()` in `src/p8/reportBuilder.ts` |

`collectPersonaMetrics` 从 `records` 统计 agency/causality/achievement/frustration/pacing/narrativeMemory。

## 4. 报告输出与 baseline 消费者

| 输出 | 路径 |
| --- | --- |
| JSON 报告 | `docs/test-reports/p8-playability-gate-latest.json` |
| Markdown 报告 | `docs/test-reports/p8-playability-gate-latest.md` |

**Baseline 消费者：**

- `src/p9/loadP8Baseline.ts` — `loadP8BaselineReport()` 加载上述 JSON
- `tests/p9PlayabilityTests.ts` — near-duplicate / pacing 对比
- `scripts/runP9VerificationReports.ts` — P9 验证报告
- 各 phase closure reports（P17–P24, v1.0）引用 `gate:playability` 作为上游门禁

**未写入：** `public/reports/manifest.json`（模拟器 HTML 报告用；gate 脚本不写 manifest）

## 5. P8.1 迁移靶点

将 `runPersonaSimulation()` 的 `GameProcessSimulator` 替换为 `HeadlessEngineSession` phase 循环，保留 `buildPersonaRunMetrics` / `assemblePlayabilityReport` 不变。

本故事为只读盘点，未修改业务代码。

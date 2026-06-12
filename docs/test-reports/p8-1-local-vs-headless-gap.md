# P8.1 US-003 — Local vs Headless Gap Report

生成时间：2026-06-12

## 1. 会使旧 local-only 门禁结果失效的行为差异

| 差异 | 影响 |
| --- | --- |
| 主动行动经 `action_summary` + 可选 `disturbance` ack | local 内联执行无 ack 步；headless 多 phase，时间推进点可能不同 |
| `sessionPhase` 驱动 vs 年度 `simulateYear` | headless 按 phase 步进，非严格「每年一事件」 |
| Volatile summary/disturbance | headless 有 UI 态；local 无；不影响 serialize stat，但影响推进时序 |
| `progressUntilChoiceOrTerminal` auto 链 | headless 一次可执行多 auto 步；local `ensureProgressionCatchUp` 语义相近但实现分叉 |
| Random 源 | headless 用 `SeededRandomSource`；local active action 用 `ACTIVE_ACTION_REPLAY_RANDOM` |

**指标级影响：** finalAge、action history 条数、choice 计数可能略有偏差；parity 测试需容忍策略（见 `p8-1-headless-playability-gate.md`）。

## 2. 复用 vs 新增

### 复用（不改公式）

- `src/p8/personas.ts`, `personaActionStrategy.ts`, `personaChoiceBias.ts`, `personaYouthRouteSeeds.ts`
- `src/p8/collectPersonaMetrics.ts` → `buildPersonaRunMetrics`
- `src/p8/playabilityGate.ts` → `assemblePlayabilityReport`
- `src/p8/reportBuilder.ts`
- `HeadlessEngineSession` + `server/src/services/headlessRuntime.ts` 辅助

### 新增

- `src/headless/playability/` — runner types、session bootstrap、phase 步进、report adapter
- `scripts/runP8PlayabilityGate.ts` — `--mode` 开关，默认 headless
- Headless 单测 / 冒烟 / parity 测试
- 刷新 `p8-playability-gate-latest.{json,md}` baseline

### 保留对比

- `tests/GameProcessSimulator.ts` — `--mode local_direct` 专用

## 3. P8.1 明确非目标

- 不新增 P8 指标维度或 persona 数量
- 不扩写主动行动 catalog / 天赋 / 区域
- 不做 HTTP E2E 跑满 8 persona（headless 同源即可）
- 不删除 `GameProcessSimulator`
- 不将 `gate:validate` 强制纳入 playability
- 不替代真人可玩性最终判断

## 4. 决策摘要

P8.1 后 **canonical gate runtime = headless_server**；local_direct 仅 dev 对比。指标公式不变，执行路径对齐 P7.2 产品路径。

本故事未修改业务代码。

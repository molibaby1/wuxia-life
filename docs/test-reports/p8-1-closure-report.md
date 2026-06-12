# P8.1 Closure Report — API Mode Playability Acceptance

生成时间：2026-06-12  
分支：`ralph/p8-1-api-mode-playability-acceptance`

## 1. 目标达成

| 目标 | 状态 |
| --- | --- |
| `gate:playability` 默认 `headless_server` | ✅ |
| Headless persona runner（P7.2 phase 机） | ✅ `src/headless/playability/` |
| `--mode local_direct` 对比保留 | ✅ |
| 报告 `runtimePath` 元数据 | ✅ |
| Parity 回归测试 | ✅ `p81HeadlessLocalParity.test.ts` |
| 基线刷新 | ✅ `p8-playability-gate-latest.json` (`runtimePath: headless_server`) |
| API 优先 dev 文档 | ✅ `p6b-local-dev.md`, `.env.development.local.example` |
| 真人切片资产 | ✅ 脚本 / 观察表 / 浏览器清单 |

## 2. Gate 结果（headless_server）

| 项 | 值 |
| --- | --- |
| Decision | **pass** |
| runtimePath | `headless_server` |
| Blockers | 0（修复 scholar-su agency streak 后） |
| Warnings | causality / replayability（与 P8 基线同类，非新增 blocker） |

自修：`personaActionStrategy` 对 `riskPreference: low` persona 在 `focusStreakCount >= 4` 时同样打破连续同类行动，避免 headless 微步路径触发 agency blocker。

## 3. Parity 证据

- `tests/headless/p81HeadlessLocalParity.test.ts`：固定种子 `p8-martial-lin`，endAge 20
- 比较：finalAge（±2）、active/choice 条数比值（≤8）
- 设计容忍策略：`docs/designs/p8-1-headless-playability-gate.md`

## 4. 回归验证

| 命令 | 结果 |
| --- | --- |
| `npm run typecheck` | ✅ |
| `npm run build` | ✅ |
| `npm test` | ✅ |
| `npm run test:headless` | ✅（含 p81 runner / smoke / parity） |
| `npm run gate:playability` | ✅ 默认 headless |
| `npm run gate:playability -- --mode local_direct` | ✅ |
| `npm run test:p6b:db` | ✅ |

## 5. 真人切片 Go/No-Go

**建议：Fix blockers → 再邀外部试玩**

- 自动化 gate：**通过**
- 浏览器 checklist：**待实机**（`p8-1-api-browser-acceptance-notes.md`）
- 外部 5–8 人试玩：在 checklist 无 blocker 后执行 `p8-1-api-human-test-script.md`

## 6. 残余风险

| 风险 | 缓解 |
| --- | --- |
| Headless 与 local 指标轨迹不完全一致 | parity 比值测试 + `--mode local_direct` |
| Headless 跑团较慢（~50s / 8 persona） | 独立 gate，未纳入 `npm run validate` |
| 部分 persona 在 headless 下提前死亡（terminal） | smoke 允许 terminal；gate 以 40 岁指标为准 |
| `public/reports/manifest.json` gitignored | gate 不写 manifest |

## 7. 关键文件

- Runner：`src/headless/playability/*`
- Gate：`scripts/runP8PlayabilityGate.ts`
- Guardrails：`agent_docs/p8-1-scope-guardrails.md`
- Design：`docs/designs/p8-1-headless-playability-gate.md`

# PRD: P8.1 API 模式可玩性门禁与真人切片验收

## 1. 背景

P7.2 已将**服务端权威主动人生规划**接入完整产品路径：API 模式成为 canonical 玩法，本地 `useNewGameEngine` 仅作 dev/offline fallback。

P8 建立了 `gate:playability`（8 persona、0–40 岁、agency/causality/pacing 等指标），但当前门禁仍通过 `GameProcessSimulator` **直连本地 `GameEngineIntegration`** 运行，与线上/API 玩家路径存在结构性分叉：

| 维度 | P8 当前门禁 | 产品终态（P7.2 后） |
| --- | --- | --- |
| 执行路径 | 本地引擎 in-process | Headless Session / P6B API |
| 主动规划 | `executeActiveAction` 本地调用 | `sessionPhase` + `active-action` + `progression-ack` |
| 人工验收文档 | 多处仍写「本地 Web / 清空 API URL」 | API 栈为默认验收环境 |
| 策划假设 | implicit 双节奏 | **单一节奏**：事件 + 主动行动 |

P8.1 不重复造 P8 指标，而是把**同一套 P8 指标与 persona 策略**迁移到服务端权威执行路径上，并收口真人 0–40 切片验收标准，使内容调优与门禁只维护一套假设。

## 2. 核心判断

```text
P8 指标不变 → 执行路径改为 Headless（服务端同源）→ gate 默认 headless → 真人切片走 API 浏览器栈
```

- **自动化门禁**：以 `HeadlessEngineSession` 驱动 persona 模拟（与 P6B `gameService` 同源），不再以本地直连引擎为默认真相源。
- **真人验收**：浏览器 + `VITE_P6B_API_URL` + `p6b:serve`，不再引导「清空 API URL 测本地模式」。
- **本地直连路径**：保留为 `--mode local` 或 dev 对比，不作为产品验收标准。

## 3. 目标

1. 新增 headless persona 跑团器，0–40 岁完整走 `active_planning` → `active-action` → `progression-ack` → `story_event` 循环。
2. `gate:playability` 默认使用 headless 路径，产出带 `runtimePath` 标记的报告。
3. 固定种子下 headless 与本地直连路径的**指标级 parity** 可回归（允许 UI/volatile 差异，不允许 stat/history/年龄轨迹分叉）。
4. 刷新 `p8-playability-gate-latest.{json,md}` 基线，并同步 P9 baseline 对比源。
5. 更新 dev 文档与 `.env.development.local.example`，默认 API 栈开发。
6. 产出 API 模式真人 0–40 切片：测试脚本、观察表、浏览器验收清单。
7. 保持 `npm test`、`gate:playability`、P9 回归不退化（在新区基线下）。

## 4. 非目标

- 不新增 P8 指标维度或 persona 数量（仍用现有 8 persona）。
- 不扩写主动行动 catalog、天赋、道具、区域、势力。
- 不做 UI 视觉重做。
- 不在本阶段实现 HTTP 级 E2E 跑满 8 persona（headless 同源即可；HTTP 已有 `test:p6b:db` 契约覆盖）。
- 不物理删除 `GameProcessSimulator` 或本地模式。
- 不批量接入 deferred 事件文件。
- 不替代真人判断——自动化仍只拦截明显问题。

## 5. 范围

### 5.1 In Scope

- `src/p8/` 或 `src/headless/playability/` 下 headless persona runner。
- `scripts/runP8PlayabilityGate.ts` 增加 runtime mode，默认 headless。
- P8 报告 JSON 增加 `runtimePath`、`engineExecution` 元数据。
- Headless vs local 指标 parity 测试。
- 基线刷新与 P9 测试 baseline 源更新。
- Dev 文档、human slice 文档、browser acceptance 清单（API 模式）。
- P8.1 收口报告。

### 5.2 Out of Scope

- 新数据库表或多实例 volatile 持久化（P7.2 follow-up）。
- `gate:validate` 强制纳入 playability（可文档建议，不本阶段改 validate 矩阵）。
- v1.0 RC 全量审查（独立 v1.0 阶段）。

## 6. Headless Persona 跑团模型

### 6.1 主循环（与 P7.2 sessionPhase 对齐）

```text
while age < 40 and alive:
  if sessionPhase == story_event:
    persona 策略选 choice → headless executeChoice → auto progress
  elif sessionPhase == active_planning:
    persona 策略选 action → executeActiveAction → action_summary
  elif sessionPhase == action_summary:
    progression-ack(action_summary)
  elif sessionPhase == disturbance_narrative:
    progression-ack(disturbance)
  elif sessionPhase == terminal:
    break
```

### 6.2 策略复用

| 能力 | 复用模块 |
| --- | --- |
| 主动行动选择 | `src/p8/personaActionStrategy.ts` → `selectPersonaActiveAction` |
| 剧情选项偏向 | `src/p8/personaChoiceBias.ts` → `applyPersonaChoiceBias` |
| 青年路线种子 | `src/p8/personaYouthRouteSeeds.ts` |
| 指标聚合 | `src/p8/collectPersonaMetrics.ts` → `buildPersonaRunMetrics` |
| 门禁判定 | `src/p8/playabilityGate.ts` → `evaluateP8Gate` |

### 6.3 报告元数据

```typescript
interface P8PlayabilityReportMeta {
  runtimePath: 'headless_server' | 'local_direct';
  catalogVersion: string;
  engineVersion: string;
  p8GateEndAge: number;
  generatedAt: string;
}
```

## 7. 真人切片（API 模式）

### 7.1 环境

```bash
npm run p6b:setup && npm run p6b:serve   # terminal A
# .env.development.local: VITE_P6B_API_URL=http://localhost:8787
npm run dev                               # terminal B
```

### 7.2 准入线（20–30 分钟，0–40 岁）

| 检查项 | 标准 |
| --- | --- |
| 开局 | 槽位 UI 新局/续玩，无本地模式引导 |
| 主动规划 | 至少一次进入 `active_planning`，可见 ≥3 类行动方向 |
| 行动反馈 | 结构化小结卡 + 可选扰动卡 |
| 剧情推进 | 至少 3 次剧情选择，有数值/关系反馈 |
| 路线信号 | 40 岁前可见至少 1 条身份/路线线索（UI 或 life memory） |
| 阻断错误 | 控制台无阻断性 error；API 4xx/5xx 有明确提示 |
| 存档 | 刷新后可续玩（服务端槽位） |

### 7.3 观察维度（真人问卷）

目标感、因果感、成就感、挫折公平感、重玩意愿、记忆点（与 P8 human slice PRD 一致）。

## 8. 用户故事索引

结构化执行真相源：`p8-1-api-mode-playability-acceptance.prd.json`（单次迭代粒度）。

### P8.1-W0：基线与决策（US-001 – US-005）

只读盘点 P8 本地路径 vs P7.2 headless 路径；范围 guardrails；设计决策锁定。

### P8.1-W1：Headless Persona Runner（US-006 – US-015）

Runner 接口、phase 循环、choice/action/ack 接线、记录格式、单 persona 测试、8 persona 冒烟。

### P8.1-W2：门禁与基线（US-016 – US-022）

报告元数据、`gate:playability` mode 开关、默认 headless、local fallback、parity 测试、基线刷新、P9 baseline 源。

### P8.1-W3：Dev 与文档（US-023 – US-026）

`.env` 示例、dev 文档、P8 设计 doc 更新、human slice 范围改为 API。

### P8.1-W4：真人切片资产（US-027 – US-031）

测试脚本、观察表、浏览器 checklist、验收 notes 模板、可选 1 次 browser 跑通记录。

### P8.1-W5：收口（US-032 – US-035）

回归测试、closure report、全量 gate、`progress.txt` 更新。

## 9. 功能需求

- **FR-1**：`gate:playability` 默认 `runtimePath=headless_server`。
- **FR-2**：Headless runner 必须使用 `HeadlessEngineSession` 的 `executeActiveAction` / `acknowledgeProgression`，禁止绕过 P7.2 phase 机。
- **FR-3**：Persona 策略与现有 P8 `selectPersonaActiveAction` / `applyPersonaChoiceBias` 一致。
- **FR-4**：Headless 跑团产出与 `GameProcessSimulator` 相同结构的 `GameProcessReport`（或适配层），以便复用 `buildPersonaRunMetrics`。
- **FR-5**：固定种子 parity：同一 persona 在 headless vs local 的 `finalAge`、核心 stat、action history 条数差异在容忍阈值内（阈值写入测试）。
- **FR-6**：`p8-playability-gate-latest.json` 必须标注 `runtimePath: headless_server`。
- **FR-7**：真人切片文档不得再要求「清空 `VITE_P6B_API_URL`」作为默认验收步骤。
- **FR-8**：P9 `p8-playability-gate-latest.json` baseline 对比在基线刷新后仍通过或同步更新 baseline 加载逻辑。

## 10. 验收标准（阶段级）

- [ ] `npm run gate:playability` 默认 headless 路径通过（或仅已知 warning）。
- [ ] `npm test` 全绿，含 headless parity 与 P9 baseline 测试。
- [ ] `p8-playability-gate-latest.json` 含 `runtimePath: headless_server`。
- [ ] `docs/designs/p8-human-test-slice-scope.md`（或 P8.1 等价文档）明确 API 模式为验收环境。
- [ ] `.env.development.local.example` 默认含 `VITE_P6B_API_URL`。
- [ ] P8.1 closure report 记录 blocker/warning 与真人切片准入结论。

## 11. 风险与回滚

| 风险 | 缓解 |
| --- | --- |
| Headless 与 local 指标分叉 | parity 测试 + 保留 `--mode local` 对比 |
| 基线刷新导致 P9 误报 | 同 PR 刷新 baseline 或更新 P9 比较逻辑 |
| Headless runner 漏 ack 导致死循环 | max-step guard + 单测 |
| 回滚 | `gate:playability --mode local` 恢复旧默认；报告字段向后兼容 |

## 12. 成功指标

- 策划与 QA 只需维护「API/headless 单节奏」假设。
- P8 门禁结果可代表线上玩家体验趋势。
- 真人 0–40 切片可在 API 栈上复现，无需切换本地模式。

## 13. 开放问题

1. **Parity 容忍度**：stat 逐字段 exact match vs 允许 ±1 舍入差？（建议：关键字段 exact，次要字段 ±1。）
2. **gate:playability 是否删除 local 默认**：建议保留 `--mode local` 一个版本窗口后废弃。
3. **是否在 P8.1 内跑一轮真人测试**：建议仅产出脚本与 checklist，真人轮次放到 v1.0 RC。

---

**审批前不进入业务代码实施。** 批准后按 `p8-1-api-mode-playability-acceptance.prd.json` 中 `priority` 顺序执行。

# Headless Playability Gate

设计决策摘要（`gate:playability`）。

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
| choice 条数 | 同上比值 ≤ 8 |
| active action 可达性 | 不比较两条随机轨迹的总数；在合法规划状态下逐年龄验证 Headless session 能提供并执行行动 |

PD-126 起，Headless 在有效主动规划阶段保留玩家决策点，`local_direct` 仍是年度事件优先的开发对照模型。因此 active action 记录数与 action history 长度不再作为跨模型比例门禁；这不改变各自 Scheduler 的事件选择规则。

失败须在测试中打印双端摘要，不 silent pass。

## 4. 报告输出路径

| 用途 | 路径 |
| --- | --- |
| Tracked P8 baseline（P9 / 回归读取） | `tests/fixtures/gates/p8-playability-gate-latest.json` |
| Gate 运行输出（不提交） | `artifacts/gates/p8-playability-gate-latest.{json,md}` |
| `local_direct` 运行输出（不提交） | `artifacts/gates/p8-playability-gate-local-latest.{json,md}` |

P9 baseline 只读取 fixture；`local_direct` 不得覆盖 canonical fixture。Gate 脚本写入 `artifacts/gates/`。

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

## 6. 备注

- 真人 API 栈验收走 `docs/local-api-dev.md` 的双终端联调，不依赖已删除的临时 test script 文档。
- `local_direct` 仅作开发对比；默认 gate 保持 `headless_server`。
- **PD-131（2026-10-10；正式语义已批准、Gate 尚未迁移）：**当前 frustration/opaqueRatio 仍使用原版 GameProcessRecord 负面领域和文本关键词分类，`> 0.35` 阈值未改；它不直接等价于已核定的玩家不公平挫折比例。当前默认 Headless Gate 的 8/8 persona frustration blockers 保持 `NO-GO`。后续应在单独有界工程任务中以真实结算、选择前信息、结果后反馈及正式玩家可见证据核对口径；如更改分子／分母／分类，须明确指标版本和重新建立合法基线，不覆盖 tracked P8 fixture 伪造通过。参见 [PD-131](../governance/product-decisions.md) 与 [SL-GAP-10](../governance/single-life-implementation-gap-register.md)。

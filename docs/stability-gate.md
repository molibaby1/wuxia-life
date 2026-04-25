# 稳定性门禁

## 目的

在单次 `npm test` 通过的前提下，对 **`tests/testGameSimulation.ts` 批量重复执行**，提高对非确定性失败与日志阻断类问题的检出率。

## 命令

- 默认 20 次：`npm run stability`
- 自定义次数：`STABILITY_RUNS=30 npm run stability`

## 通过 / 失败规则

| 条件 | 结果 |
|------|------|
| 任一轮退出码 ≠ 0 | 失败；打印该轮完整输出 |
| 任一轮日志命中 `tests/qualityGatePolicy.ts` 中任一 Blocker 子串 | 失败；打印该轮完整输出 |
| 全部轮次退出码为 0 且无 Blocker 子串 | 通过 |

实现入口：`scripts/runStabilityGate.ts`。

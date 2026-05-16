# 包 D：体验验证门禁升级执行包

## 任务目标

把体验健康从“报告里看起来有问题”升级为“指标能发现、门禁能阻断、waiver 有理由”的长期防线。

## 当前证据

- 主测试门禁主要运行 AllTests、IntegrationTests、testGameSimulation。
- `repro:event-repetition`、`report:rhythm-metrics`、多样本 diagnostics 不属于主门禁的一等失败条件。
- P2 报告中 route completion、death rate、romance/family achievement 等体验失败多为 warning 或 info，不会阻断。
- 现有 simulation gate 对 blocker 指标有失败机制，但体验指标覆盖和分级仍不够。

## 只读分析清单

1. 读取测试门禁：
   - `tests/runRealTestGate.ts`
   - `tests/qualityGatePolicy.ts`
   - `scripts/runStabilityGate.ts`
2. 读取模拟指标：
   - `scripts/gameplaySimulationMetricDefinitions.ts`
   - `scripts/gameplaySimulationGate.ts`
   - `scripts/gameplaySimulationDiagnostics.ts`
   - `scripts/runGameplaySimulation.ts`
3. 读取 P1/P2 报告中的指标失败和残余风险。
4. 汇总 A/B/C 包新增或调整的指标。

## 实施边界

允许：

- 新增体验健康指标。
- 新增多 seed、多 persona 门禁命令。
- 调整 blocker/warning/info 分级。
- 增加 waiver 原因校验。
- 生成人类可读和机器可读摘要。

不允许：

- 直接修业务逻辑，除非门禁脚本口径本身错误。
- 一次性把所有 warning 升为 blocker。
- 删除旧报告。
- 修改 UI。

## 成功标准

- 复读、节奏、路线、家庭/恋爱至少有机器可读指标。
- 多样本体验门禁能稳定复现坏体验。
- blocker 失败返回非零退出码。
- warning/info 仍清晰输出，不被静默吞掉。

## 风险

- 门禁过严会导致短期开发频繁失败。
- 门禁过松会继续放过坏体验。
- 多样本模拟耗时可能影响开发效率。

## 交付物

- 体验健康指标定义。
- 多样本门禁命令和报告。
- 阈值与 waiver 规则。
- 体验治理 closure 报告。

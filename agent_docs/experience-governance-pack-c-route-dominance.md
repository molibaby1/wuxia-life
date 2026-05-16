# 包 C：路线主导权治理执行包

## 任务目标

让路线系统从“字段存在”变成“主流程事件调度、生命周期推进和玩家体感”的主导因素。

## 当前证据

- P2 报告显示 route completion rate 为 0%。
- 多样本诊断中 routeStates 多停留在 active。
- `events.json` 声明的线路文件与 `EventLoader` 实际映射存在差异。
- 已加载事件几乎没有使用 `routeTargets`、`routeTransition`、`pathAffinity` 等路线调度元数据。
- 路线冲突规则有测试，但真实数据没有足够完成/失败/锁定路径。

## 只读分析清单

1. 读取路线相关代码：
   - `src/core/RouteStateManager.ts`
   - `src/core/RouteCompatibilityRules.ts`
   - `src/core/GameEngineIntegration.ts`
   - `src/core/EventLoader.ts`
2. 对比声明导入与实际加载：
   - `src/data/events.json`
   - `src/data/lines/*`
3. 盘点路线标记：
   - `route_*`
   - `sect_faction`
   - `current_sect`
   - `routeTargets`
   - `routeTransition`
4. 读取 P2 模拟和诊断报告。

## 实施边界

允许：

- 修正线路声明与加载不一致。
- 给核心路线事件补充必要路线元数据。
- 增加或修正路线生命周期完成/失败/锁定标记。
- 调整路线事件在候选池中的调度权重。
- 增加路线专项模拟样本。

不允许：

- 大规模扩写全部路线剧情。
- 重构整个身份系统。
- 修改 UI 展示层。
- 绕过包 A/B 的事件门禁和节奏规则。

## 成功标准

- 至少两条核心路线能完成或明确失败。
- route completion 不再稳定为 0%。
- 路线事件在时间线中有连续存在，不只是一次 flag 变化。
- route lifecycle history 可在报告中定位。

## 风险

- 路线接管过强会压制家庭、日常和随机事件。
- 加载更多线路可能暴露旧数据格式或条件问题。
- 路线完成条件过松会让结局单极化。

## 交付物

- 路线加载和元数据审计。
- 路线接管方案和审批记录。
- 路线专项模拟结果。
- 对包 D 门禁指标的建议。

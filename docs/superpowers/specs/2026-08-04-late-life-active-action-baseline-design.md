# Late-Life Active Action Player Experience Baseline Design

> 状态：方案 C 已批准。
> 设计日期：2026-08-04
> 类型：只读体验基线，不是产品实现 Slice。

## 1. 设计问题

既有完整人生 Trace 显示：

- 四条人生合计 181 次主动行动；
- 只有 23 种精确结果摘要；
- 21 种摘要重复；
- 30 岁以后没有观察到新行动结构；
- 三个专向 persona 将约 81% 的行动集中在单一类别。

这些数据证明 Headless 执行结构重复，但不能直接证明玩家在界面上也会感到没有选择，因为：

- persona 使用固定优先级；
- oracle 可以读取隐藏 effects；
- 玩家可能根据公开成本、风险和当前状态主动改变方向；
- Browser 可见说明可能提供 Trace 统计没有表达的决策意义。

## 2. 选择的方案

采用：

```text
Trace 定位
+ 正式 Snapshot 检查点
+ Browser 检查点试玩
```

不从出生完整重放，也不只分析现有 Trace。

## 3. 样本结构

三条固定人生：

```text
martial-lin / 801
wealth-shen / 804
balanced-wei / 810
```

四个目标窗口：

```text
30、45、60、75 岁
```

检查点是目标年龄或之后第一个 `active_action` 决策点。

每个检查点连续完成 5 次主动行动。事件、扰动、阶段总结和其他续接步骤完整推进，但只把正式 active-action step 计入 60 次决策样本。

## 4. 数据流

```text
固定 persona + seed
→ 正式 Headless / Local session
→ 到达目标 active-action phase
→ 导出 canonical Snapshot
→ Snapshot Contract 验证
→ Browser 正式 Save/Load 路径恢复
→ 公开状态 fingerprint 核对
→ 玩家可见决策
→ 正式结果与后续步骤
→ oracle 事后对照
→ 只读分析报告
```

任何环节都不得直接写 Browser store 或绕过 Snapshot Contract。

## 5. 独立窗口原则

四个年龄窗口分别从固定 Headless 人生检查点开始：

- 30 岁窗口的 Browser 选择不改变 45 岁检查点；
- 45 岁窗口仍来自固定 seed 的原始 canonical path；
- 这样比较的是年龄造成的行动结构变化，而不是四条已被人工选择改变的人生。

因此，这不是一条人工完整人生，而是十二段受控中晚年体验样本。

## 6. 玩家决策协议

决策协议只给目标，不给 action ID 优先级。

- martial：继续提升武学，同时规避公开可见的不可承担成本；
- wealth：经营和现金流优先，规避公开可见的严重亏损；
- balanced：根据公开状态平衡多个方向，避免无理由机械重复。

每次选择必须写出一句可被第三方审查的公开理由。

## 7. Oracle 隔离

Browser 选择前：

```text
oracle recommendation unavailable
hidden effects unavailable
future Trace unavailable
```

Browser 选择后，分析工具才读取同状态下的 oracle 输出。

这保证 Browser/oracle 差异用于判断模拟偏差，而不会污染玩家选择。

## 8. 诊断输出

本 Baseline 不输出综合“好玩分数”。

只输出五类可复核证据：

1. 行动集合是否随年龄变化；
2. 决策前信息是否支持合理预期；
3. 结果反馈是否重复；
4. 行动是否形成长期回响；
5. Browser 与 oracle 为什么分歧。

## 9. 非绿色基线

开始和结束分别记录 failure fingerprint：

```text
command
exit code
failed suite / rule / event
blockers
warnings
```

只有新增或扩大的失败属于本阶段回归。

## 10. 产物边界

允许新增的分析产物：

```text
tests/experience/lateLifeBaselineTypes.ts
tests/experience/generateLateLifeCheckpoints.ts
tests/experience/lateLifeBrowserCheckpointAcceptance.ts
tests/experience/runLateLifeBrowserDecisions.ts
tests/experience/compareLateLifeOracleChoices.ts
tests/experience/analyzeLateLifeActiveActions.ts
相应测试
Baseline 报告
```

生成的 Snapshot 和观察 JSON 默认放入临时或 ignored 目录，不作为正式内容提交。

## 11. 非目标

- 修改主动行动系统；
- 扩充行动内容；
- 修改 persona 或 oracle；
- 修复 event-quality 历史问题；
- 建立玩家主观综合评分；
- 从三条 persona 外推真实玩家群体；
- 将 60 次受控决策宣称为完整用户研究；
- 实施本报告推荐的下一产品 Slice。

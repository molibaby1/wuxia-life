# Active Action-to-Life Echo Semantic Inventory Design

> 状态：只读阶段已批准。
> 设计日期：2026-08-04
> 类型：产品语义盘点，不是实现 Slice。

## 1. 背景

主动行动即时反馈已经完成差异化，但完整体验基线仍显示：

```text
53 / 60 IMMEDIATE_ONLY
7 / 60 STATE_ECHO
```

该结果不能直接推出“需要新增长期回响系统”，因为当前分析可能遗漏：

- 已持久化但未在五次窗口内触发的 consumers；
- 现有 lifeStates 的摘要或 ending consumer；
- 正式事件条件；
- 当前 Trace 没有观察到的可达路径。

因此必须先建立 producer/consumer 事实图。

## 2. 设计目标

建立：

```text
active action
→ immediate effects
→ persistent canonical facts
→ formal consumers
→ player-visible surfaces
```

并判断长期缺口真正发生在：

```text
事实生产
系统消费
玩家可见呈现
观察窗口
```

## 3. 分析单位

优先使用正式 action ID。

多个 action ID 在以下方面完全相同时，才允许归并为类别：

- 同一执行 owner；
- 同一 persistent facts；
- 同一 consumer set；
- 同一玩家可见语义。

不得仅因为都属于“练武”而合并。

## 4. Consumer 证明

正式 consumer 必须满足：

1. 当前 manifest 或正式代码路径加载；
2. 明确读取目标 canonical fact；
3. condition、payload 或 presentation 中存在直接数据依赖；
4. 不依赖文本解析；
5. deferred 文件不计入正式 consumer。

## 5. LifeStates 充分性测试

分别判断：

```text
trainingHabit
studyHabit
businessHabit
```

是否具备：

- 明确 producer；
- 稳定生命周期；
- Snapshot 持久化；
- 可区分主要主动行动方向；
- 至少一个当前 consumer；
- 足以支撑推荐 Slice。

“有字段”不等于“足够”。若不同产品行为被压成相同 habit，必须记录信息损失。

## 6. 新状态必要性测试

只有同时满足以下条件，才能推荐 D：

```text
现有 facts 无法表达目标差异
+
该差异对玩家长期体验必要
+
有明确 producer
+
至少两个正式 consumer
+
生命周期和 Snapshot 边界清晰
```

分析便利、报告精度和未来扩展不构成新增状态理由。

## 7. 推荐选择

最终只能选择 A–E 中一个。

推荐必须包含：

- 覆盖的行动类别；
- 覆盖的 60 次样本数量；
- 玩家感知时点；
- 所需修改系统；
- 是否需要新状态；
- 与非绿色事件质量基线的风险；
- 为什么其余四项不是当前优先级。

## 8. 非目标

- 实施 summary；
- 接线事件；
- 修改 ending；
- 新增 canonical facts；
- 修改 action；
- 重跑 60 次 Browser；
- 建立通用因果追踪框架；
- 修复 P8 或历史事件质量。

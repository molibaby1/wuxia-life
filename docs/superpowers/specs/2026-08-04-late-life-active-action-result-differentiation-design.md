# Late-Life Active Action Result Differentiation Design

> 状态：阶段方向已批准。
> 设计日期：2026-08-04
> 类型：限定范围的玩家可见结果反馈修复。

## 1. 证据

上一阶段报告给出的关键数据：

```text
50 / 60 结果重复
53 / 60 immediate-only
7 / 60 state echo
39 / 60 Browser/oracle divergence
```

这些证据支持两个不同结论：

1. Browser/oracle 高分歧说明模拟器不能代表玩家；
2. Browser 真实决策仍有高结果重复，说明产品结果反馈本身存在缺陷。

本设计只处理第二项。

`53/60 immediate-only` 是后续 Action-to-Life Echo 的候选证据，不属于当前实现授权。

## 2. 设计目标

建立一个确定性的主动行动结果表达：

```text
正式 action
+ actual before/after state
+ actual public delta
+ existing diminishing-return signal
+ current visible context
→ player-visible result explanation
```

结果必须回答：

- 做了什么；
- 实际变化了什么；
- 是否有明显成本；
- 是否收益趋缓；
- 为什么这次与普通结果不同。

## 3. 架构原则

优先使用现有 result owner。

如果当前 Local/API/Headless 各自拼装摘要，则提取一个共享纯函数；如果已经存在共享 builder，则直接扩展，不再新增并行系统。

推荐接口形状仅作为 owner 核对目标，不要求机械照抄：

```ts
type ActiveActionResultInput = {
  actionId: string;
  actionCategory: string;
  age: number;
  before: PublicPlayerState;
  after: PublicPlayerState;
  publicDelta: PublicStateDelta;
  diminishingReturn: boolean;
};

type ActiveActionResultPresentation = {
  summary: string;
  delta: PublicStateDelta;
  diminishingReturnNotice?: string;
};
```

实际类型应复用仓库现有 DTO 和状态投影。

## 4. 文案结构

推荐使用三段以内的确定性结构：

```text
行动事实
+ 实际结果
+ 必要的递减或成本解释
```

例如：

```text
你继续打磨已有功底，武学有所精进。
本次武学与体魄均有提升，但反复修炼使收获开始趋缓。
```

不能添加：

- 未发生的后续故事；
- 未来保证；
- ending 暗示；
- 隐藏阈值；
- 调试字段；
- 随机同义句。

## 5. 合法差异来源

```text
action category
actual positive delta
actual negative delta
zero delta
diminishing return
current public resource pressure
current formal age/life stage
```

年龄只用于措辞背景，不允许改变结算或引入年龄专属产品规则。

## 6. Determinism

相同输入必须生成完全相同的：

```text
summary
delta presentation
diminishing-return notice
```

不得使用：

```text
Math.random
seed-based copy rotation
current time
LLM generation
unordered object iteration
```

## 7. Parity

正式语义只有一份：

```text
Local execution
API execution
Headless trace
Browser result card
```

可以有不同 UI 容器，但不能生成互相矛盾的结果说明。

## 8. 非目标

- 修改主动行动结果数值；
- 新增行动；
- 修改行动解锁；
- 修改收益递减；
- 接入后续事件；
- 修改阶段摘要；
- 修改 ending；
- 建立 action history；
- 解决 immediate-only；
- 重写全部主动行动文案；
- 重新执行完整 60 次 Baseline。

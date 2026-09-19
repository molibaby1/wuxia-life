# Preschool Season Exhaustion Semantics v2

## Status

HUMAN ACCEPTED — 2026-09-19

## Authority identifier

```text
preschool-season-unified-candidate-pool-20260919
```

## Scope

本 accepted-design 固定 4–7 岁 preschool season card 在 origin exhaustion 之后的产品语义，供后续独立 implementation 使用。本次 landing 只记录已接受的产品 / workflow 语义与验收条件，不修改 runtime、product implementation、preschool authored catalog 或 Auto Evolution execution logic。

## Supersede relationship

本设计 supersede：

```text
docs/superpowers/specs/2026-09-17-preschool-origin-exhaustion-gap-fallback-design.md
```

中的以下局部语义：

```text
固定 origin → neutral → origin
固定两个 origin slots
origin exhaustion 必须以 origin-slot gap 保持结构
```

旧设计的历史事实和已经完成的 history-reuse fix 不删除、不重写。2026-09-17 fix 本身没有 implementation regression；它正确解决了 historical origin narrative reopening。

## Gap diagnosis

问题分类为：

```text
SCHEDULING_PROBLEM
```

当前最早 material loss point：

```text
固定 2 个 origin slots / season
× 每年龄约 4 seasons
→ 每年龄约 8 次 origin-content demand

但单一 canonical origin 的合法、未消费 authored origin pool
低于固定 demand

+ history-safe no-reuse

→ 正常游玩中结构性 origin exhaustion
→ 固定 origin slots 被 generic gap 填充
→ 一张 season card 可出现多个语义相同的 generic beats
→ Player-visible repetition / stagnation
```

同时明确：

- 2026-09-17 fix 本身没有 implementation regression。
- 它正确解决：`historical origin narrative reopening`。
- 但 subsequent Player-visible Experience Review 证明：`不重播旧 origin != 童年阶段不重复`。
- 因此依据 PD-106 / PD-120 回到 Gap Diagnosis。

本次仍不把当前 preschool case 自动重新分类成 `CONTENT_CAPACITY_GAP`。先修正已确认的 scheduling semantics。

## Accepted product semantics

### Season card shape

4–7 岁 season card 仍然：

```text
3 beats
3 个月推进
```

但三个 beat 不再拥有：

```text
origin slot
neutral slot
origin slot
```

身份。

新的语义是：

> 每一个 beat 都表示“这一季发生的一段合适的童年经历”。

候选内容来自一个统一的合法 authored pool：

```text
当前年龄合法
+
当前 canonical birth origin 匹配的 origin-specific entries
+
neutral entries
```

其他 canonical origin 的 exclusive entries 不得进入。

### Origin 与 Neutral 的关系

`origin-specific` 与 `neutral` 都是正常 childhood authored experiences。

不再存在：

```text
origin 必须占几格
neutral 必须占几格
origin exhausted 后仍要假装保留 origin slot
```

canonical birth origin 仍然决定：

```text
哪些 origin-specific entries 有资格
```

但不要求每个 season 都重复证明玩家的出生背景。

不要建立新的 origin quota。

不要要求一季至少出现一个 origin beat。

### Unified pool history semantics

只要整个合法 authored pool 中仍有未消费 entry：

```text
不得复用已经进入 eventHistory 的 preschool authored entry
```

同一张 season card 内：

```text
三个 authored entry IDs 必须 distinct
```

选择第一笔后，该笔应对后续同一卡片选择视为已经消费。

因此：

```text
matching-origin authored entry
neutral authored entry
```

遵守同一 history-safe selection 原则。

### Generic gap 的新含义

generic preschool gap 不再表示：

```text
某一个 origin slot 没东西可填
```

它只允许表示：

> 当前年龄和 canonical origin 下，整个合法未消费 preschool authored pool 已经无法再提供下一笔内容。

因此选择规则必须具有以下性质：

```text
只要还存在任何合法未消费 authored candidate
→ 不得选择 generic gap

只有整个合法未消费 pool exhausted
→ generic gap 才合法
```

如果一张 card 开始时只剩 1 或 2 个合法 authored entries：

- 先使用剩余 authored entries；
- 只有后续 beat 在 whole-pool exhaustion 后才可以 gap；
- 不得为了保持三笔 card 而提前 gap。

### Selection preference 边界

本产品设计不要求 origin 与 neutral：

```text
概率完全相等
```

也不要求：

```text
origin 永远优先
```

允许 existing origin affinity 继续作为 bounded soft weighting 的实现输入，但必须满足：

```text
neutral 是 first-class candidate
不得因为 origin entry 仍存在就排除 neutral
不得分两阶段先吃完 origin 再进入 neutral
不得重新形成 hard origin quota
```

也就是说：

```text
soft preference 可以存在
hard slot / hard quota 不存在
```

如当前实现无法做到这一点，implementation 应使用最小修改完成，而不是重新设计新的 scheduler framework。

## 保持不变

以下产品语义继续保持：

```text
4–7 岁每张 season card 三笔
确认后推进三个月
canonical birth-background isolation
历史 origin entry 不重播
0–3 岁行为
已有 authored preschool catalog
Event / Person / Milestone schema
```

本次不因为 PD-120 同时生效，就顺手扩 preschool catalog。

## Explicit non-goals

本设计不授权：

```text
新增 preschool Event / Person
扩写 preschool catalog
新增 Story / Task runtime
新增 player state
改变 canonical origin model
改变 3 个月 cadence
改变 0–3 岁
恢复历史内容 reuse
通过改 generic placeholder 文案掩盖 exhaustion
为了达到 origin 配额新增内容
```

PD-120 允许未来根据新的 natural evidence 诊断 `CONTENT_CAPACITY_GAP`，但那必须是 subsequent diagnosis。

## Experience-review contract

实施后不能仅凭单元测试宣称重复问题解决。

必须重新回到 natural observation。

如果新的 unified pool 在正确使用全部合法 authored content 后，仍然出现结构性：

```text
whole-pool exhaustion
过早 generic gap
重复
缺少有意义变化
```

则下一轮 Gap Diagnosis 必须显式考虑：

```text
CONTENT_GAP / CONTENT_CAPACITY_GAP
```

此时 AE 可以依据 PD-120 自动形成 Content Proposal / Draft Authoring Contract，交 Human Approval。

## Related provenance

- HFL item：`item-78baf2ac9222d0d93f447c398fae1b91881c266513f4d109c0a61116f6dbb67c`
- 历史 accepted design（局部 supersede）：`docs/superpowers/specs/2026-09-17-preschool-origin-exhaustion-gap-fallback-design.md`
- Gap authority：PD-106（历史）/ PD-120（当前 Content Authoring Workflow Contract v2）

上述 evidence 只用于支持诊断与 provenance，不授权修改其他产品语义，也不替代后续实现验证。

## Implementation note

本文件完成的是 authority baseline landing；unified candidate pool 的 runtime 修复必须作为后续独立、可审查的 implementation 提交。`READY_FOR_FORMAL_TASK` 不是 automatic implementation authority。

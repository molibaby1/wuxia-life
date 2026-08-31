# PD-105：Experience Measurement Contract v1

**状态：** 当前权威规范（Human accepted：2026-09-01；PD-105 authority closure）

**目的：** 重新定义“玩家体验节奏”应该测什么，防止旧指标、粗粒度 taxonomy 或偏置样本把诊断结果误解释成产品事实。

---

## 1. 决策背景

当前 Experience Health 中的 repetition 指标存在已确认的测量偏差：

- `adjacent_same_class_rate` 当前 fresh 值为 `1.0`，但该 `1.0` 来自单个样本中的 `1/1` pair，而不是“整局人生 100% 同质”。
- `short_window_same_class_rate` 当前 fresh 值为 `0.5`，其 timeline 仅保留具有 repetition class 的少量事件。
- 当前 repetition class 实际只有 `injury / illness / economy` 三类；大量 relationship、family、parenthood、commerce 内容被压入 `economy`，另有大量正式事件完全没有 class。
- 旧 metric 先删除所有无 class 正式事件，再对剩余子集计算，因此它测到的不是完整玩家人生事件节奏。
- 当前样本只有 6 条固定 deterministic trace，并采用 per-sample worst case，数值不能直接外推到全产品玩家体验。

因此：旧 repetition gate 不能继续作为“玩家体验变好/变坏”的直接产品证据。

---

## 2. 核心产品定义

### 2.1 测量对象

Experience Rhythm 的正式测量对象是：

> **玩家实际经历的、会推进人生或故事状态的正式人生事件序列。**

它不是完整 transcript，也不是内部诊断记录集合。

应明确排除：

- summary
- feedback / visible feedback
- system notice
- `active_action`
- 测试/诊断专用记录
- 其他不代表一次正式人生事件的技术条目

### 2.2 正式事件不得因 taxonomy 缺失而从 timeline 消失

一个正式人生事件即使暂时没有完整 semantic annotation，也必须保留在完整 rhythm timeline 中。

允许：

```text
unknown domain / unknown narrativeRole
```

不允许：

```text
没有 class
→ 直接从人生 timeline 删除
```

否则 metric 测量的是“被 taxonomy 命中的事件子集”，而不是玩家实际经历。

---

## 3. v1 最小语义模型

v1 只采用三个维度：

```text
domain
narrativeRole
causal continuity
```

不建立 Story Ontology，不建立通用 Story Runtime，不给事件附加大量标签。

### 3.1 `domain`

`domain` 表示玩家感知到的事件主要人生主题。

它必须由 authoring 显式提供，不再依靠正文关键词 heuristic 猜测。

第一阶段不在本决策中提前锁死最终完整枚举；应先对当前 catalog 做小规模代表样本校准，再收敛 closed set。

候选示例包括：

```text
relationship
family
commerce
martial
official
health
identity
```

约束：

- 每个正式事件 v1 只有一个 primary domain。
- `domain` 不等于 source file、category 或 event ID 前缀。
- 文本中出现“商”“病”等词不能决定 domain。
- legacy event 可暂时为 `unknown`，但仍必须进入 timeline。
- 不因为一个事件跨多个主题就立刻支持 multi-domain 标签。

### 3.2 `narrativeRole`

`narrativeRole` 表示该事件在玩家人生叙事中承担的主要作用。

v1 closed set：

```text
setup
development
conflict
choice
payoff_echo
```

定义：

- `setup`：建立人物、机会、问题或新的生活阶段。
- `development`：已有事情继续发展，但尚未形成关键转折。
- `conflict`：形成明显矛盾、代价、危机或张力。
- `choice`：玩家面对会改变后续内容或 durable history 的实质选择。
- `payoff_echo`：过去的重要选择、关系或经历在后来得到回应、结果或长期影响。

约束：

- JSON 中存在 choices 不自动等于 `narrativeRole=choice`。
- 普通操作型选项如果没有人生意义，不应仅因 UI 形式被标为 `choice`。
- `payoff_echo` 不等于奖励事件，不要求 stat/achievement reward。
- v1 每个事件只有一个 primary narrative role。

### 3.3 `causal continuity`

v1 不新增通用 `arcId/storyId/chainId`。

continuity 优先从已有真实因果证据推导，例如：

- 前置 event history
- 具体 choice history
- durable fact
- 明确 prerequisite

原则：

> 如果 Event B 真实依赖 Event A 留下的具体历史，则两者可以被视为同一 causal chain 的合理推进。

如果产品上宣称两个事件属于同一故事线，但 runtime 中不存在任何可证明的因果连接，应优先审查因果建模，而不是先增加 `arcId` 掩盖问题。

只有未来出现至少两个独立消费者，确实需要表达“有连续性但不能由现有历史推导”时，才允许另开设计讨论窄的 continuity annotation。

---

## 4. “重复”的正式含义

v1 明确废除以下错误等式：

```text
同 domain = 坏重复
```

真正需要识别的是：

> **连续正式事件是否缺少玩家可感知的语义变化。**

因此：

```text
明月相识
→ 明月第二次相遇
```

即使两者都是 `relationship`，如果它们属于同一 causal chain，并形成 `setup → development` 的合理推进，不应仅因为同领域而判为坏重复。

相反：

```text
彼此独立的 routine commerce development
→ 另一条 routine commerce development
→ 再一条 routine commerce development
```

若长期缺乏 conflict / meaningful choice / payoff / causal progression，则更接近真正的节奏停滞。

---

## 5. v1 Measurement Set

### 5.1 `adjacent_semantic_repetition_rate`

目标：识别相邻正式事件是否在玩家体验上构成缺乏语义变化的重复。

候选判定至少同时考虑：

- primary domain 是否相同；
- narrative role 是否相近或停滞；
- 是否存在合理 causal continuity。

同 domain 但属于同一 causal chain 的合理推进，不应自动计为坏重复。

**v1 状态：`REPORT_ONLY`。**

不在 authority 阶段拍脑袋设 hard threshold。

### 5.2 `short_window_domain_concentration`

目标：观察短窗口中是否由一个人生领域长期占据玩家注意力。

它用于回答：

> 最近一段人生是不是被某个 domain 高度集中？

它不直接等价于“体验不好”，因为人物 arc 或重大人生阶段本来可能合理集中。

**v1 状态：`REPORT_ONLY`。**

### 5.3 `narrative_role_stagnation_rate`

目标：识别长期停留在相似叙事功能而缺乏推进的体验。

例如：

```text
development
→ development
→ development
→ development
```

即使 domain 不同，也可能产生“总在铺垫、没有发生关键变化”的体验。

相反：

```text
setup
→ development
→ conflict
→ choice
→ payoff_echo
```

通常体现更明确的推进。

**v1 状态：`REPORT_ONLY`。**

---

## 6. 旧指标处置

以下旧指标进入 deprecated 状态：

```text
adjacent_same_class_rate
short_window_same_class_rate
```

含义：

- 可以暂时保留作为 legacy diagnostic；
- 不得继续作为“玩家节奏变好/变坏”的产品证据；
- 不得因为它们 FAIL 就直接修改 scheduler、补内容或恢复已退役内容；
- 不要求在第一阶段立即物理删除旧实现。

PD-104 的 `400 → 391` 不应被解释为当前 repetition failure 的直接原因：被 quarantine 的 9 个 relationship legacy events 在当前 class detector 下均不会进入旧 repetition timeline。

---

## 7. Semantic Calibration Gate

任何 Experience metric 在成为 hard gate 之前，必须完成 semantic calibration。

最小闭环：

```text
metric 数值变化
↓
抽取对应 player-visible 正式事件 trace
↓
Human 能解释为什么该变化代表体验更好/更坏
↓
在多个不同路线/seed 上重复验证
↓
才允许讨论 hard threshold
```

明确禁止：

```text
0.9 → 0.7
→ 默认宣布体验优化成功
```

### 7.1 第一阶段 calibration sample

第一阶段只选择少量代表事件/trace，不迁移全 catalog。

代表范围至少覆盖：

- 明月 relationship chain
- commerce
- family / parenthood
- martial
- official
- setback / health

对同一批 fresh trace 同时输出：

```text
完整正式 event timeline
vs
legacy class-positive timeline
vs
new semantic annotation/mapping
```

并由 Human 对典型片段做语义判断。

---

## 8. Sampling Contract

v1 不允许使用极小固定样本的 per-sample worst case 直接外推全产品体验。

第一阶段先保持现有 6 条 deterministic traces 作为 calibration baseline，目的只是做“旧尺子 vs 新定义”的可重复对照。

在新 measurement semantics 被证明有效之前：

- 不立即扩大为大规模随机模拟基础设施；
- 不立即设置 hard threshold；
- 不把单个 `1/1` pair 的 `1.0` 解读为全局节奏 100% 重复。

通过 calibration 后，再独立讨论 route/seed coverage 与聚合方式。

---

## 9. 与产品修改的防火墙

Measurement failure 不能直接触发产品修改。

正确路径：

```text
Experience signal
↓
确认 measurement contract 有效
↓
Gap Diagnosis
↓
CONTENT_GAP / ACCESS / CAUSALITY / SCHEDULING / PRESENTATION / NO_PROBLEM
↓
进入对应治理流程
```

禁止：

```text
metric FAIL
→ 自动补事件
```

也禁止：

```text
metric FAIL
→ 直接调 scheduler
```

只有修正测量边界后仍稳定显示真实 pacing 问题，才进入 scheduler investigation。

---

## 10. 与其他 Authority 的关系

PD-105 位于具体内容领域契约之前，负责“正确测量”，不覆盖领域语义。

```text
PD-105 Experience Measurement
        ↓
发现 / 验证问题
        ↓
PD-106 Content Authoring Workflow（若确认为内容问题）
        ↓
具体领域 authority
├─ PD-101 Character / Relationship
├─ PD-102 Parenthood / Family Life
├─ PD-103 Sex-Variant Person Archetype
└─ PD-104 Generic Relationship Legacy Quarantine
```

Auto Evolution 可使用 PD-105 发现和解释信号，但不能绕过 PD-106 自动扩张内容。

---

## 11. 明确不做

PD-105 v1 不做：

- 给当前 391 个事件一次性批量打标签；
- 建立通用 Story Runtime；
- 建立多标签 Story Ontology；
- 用 LLM 在线实时判断作为正式 hard gate；
- 根据正文关键词继续扩充 heuristic taxonomy；
- 立即修改 scheduler；
- 立即增加事件；
- 立即设置新的 hard threshold；
- 恢复 PD-104 deferred events 来“改善节奏”。

---

## 12. Complexity / STOP Conditions

如果第一阶段实现需要以下任一项，必须 STOP 并重新设计：

- 批量迁移全部 391 events 才能验证 measurement；
- 新增通用 Story/Arc runtime state；
- 需要 multi-domain / arbitrary tag map 才能运行；
- 需要 LLM non-deterministic judging 才能形成基本 metric；
- 需要重写 scheduler；
- 需要新增内容才能让 calibration 成立；
- 需要重新激活已 quarantine/retired 内容；
- 需要用新的 arbitrary threshold 才能证明成功。

默认动作是缩小 calibration sample，而不是扩大框架。

---

## 13. v1 Acceptance

PD-105 第一阶段成功不意味着新 gate 已经上线。

成功只需证明：

1. 完整正式 event timeline 可以稳定构造，未分类事件不会消失。
2. 少量代表事件可以明确标注/映射 primary `domain` 与 `narrativeRole`。
3. causal continuity 可优先从已有历史依赖推导，而无需 Story Runtime。
4. 同一批 trace 上，旧 class-positive metric 与新 semantic view 的差异能够被 Human 清楚解释。
5. 明月关系/家庭内容不再因为文本关键词被误解释成纯 `economy`。
6. 新三个 metric 仍为 `REPORT_ONLY`。
7. 没有批量迁移 391 events。
8. 没有 scheduler/content 修改。
9. 没有新增未经验证的 hard threshold。

达到这些条件后，才进入下一阶段：扩大 semantic coverage、验证 sampling，然后决定哪些指标值得成为正式 gate。

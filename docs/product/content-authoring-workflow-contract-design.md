# PD-106：Content Authoring Workflow Contract v1

**状态：** 当前权威规范（Human accepted：2026-09-01；PD-106 authority closure）

**目的：** 统一以后人工、ChatGPT、Codex 与 Auto Evolution 发现内容缺口、设计人物/事件、实现和验证内容的流程，防止“看到指标不好就堆事件”、自由扩写和系统性过度设计。

---

## 1. 核心原则

### 1.1 Event 是人生意义单位，不是日常行为日志

正式 Event 应承载至少一种重要人生变化：

- 人物关系变化；
- 人生机会变化；
- 重要选择；
- 明显冲突或代价；
- 新生活阶段；
- 对过去重要经历的回应；
- 值得以后再次消费的 durable history。

默认不进入正式 event catalog 的内容：

- 普通吃饭；
- 普通买东西；
- 普通练功；
- 无后果闲聊；
- 重复日常跑腿；
- “发生一件小事 → 给一点属性 → 结束”的填充事件。

这些可以存在于表现层或背景叙述，但不应仅因“现实中会发生”就承担正式 Event ID、history 与长期测试维护成本。

### 1.2 Person 提供人物语义，不预装固定剧情模板

创建人物不意味着必须配齐：

```text
相遇 → 好感 → 冲突 → 恋爱 → 结婚 → 生子 → 结局
```

人物提供：

- Identity
- Access
- Character Anchors
- Core Concern
- Event Responsibilities
- Durable Facts
- Relationship Possibilities
- Long-term Hooks

事件数量由人物在玩家人生中的真实语义需要决定，而不是由“NPC 完整度”决定。

### 1.3 Story / Arc 是具体历史连接形成的因果链

产品上可以称之为故事线，但 runtime 不默认建立通用：

```text
StoryArc.currentStage
```

真正的连续性优先由：

- event history
- choice history
- durable facts
- prerequisites

构成。

后续事件必须能够说明：

> 为什么现在可以发生？它消费了什么真实过去？它留下什么以后可能继续消费？

### 1.4 新内容必须解释“过去—现在—未来”

任何正式新内容必须至少回答：

```text
消费什么过去？
改变什么现在？
可能影响什么未来？
```

Future Hook 可以明确为“无”，但不能无意识地生成孤立填充内容。

### 1.5 内容不足必须先证明是 Content Gap

异常、测试失败、低覆盖、路线空白，都不能直接等于“需要新事件”。

新增 Person / Event 之前必须完成 Gap Diagnosis。

---

## 2. 标准工作流

正式流程：

```text
发现问题
↓
1. Gap Diagnosis
↓
2. Content Proposal
↓
3. Authoring Contract
↓
4. Human Approval
↓
5. Implementation
↓
6. Semantic Verification
↓
7. Experience Verification
```

Experience Verification 失败后必须回到 Gap Diagnosis，而不是直接继续加内容。

---

## 3. Stage 1：Gap Diagnosis

### 3.1 输入来源

Gap signal 可以来自：

- Human play observation
- Auto Evolution
- Golden-line gap
- unreachable report
- experience trace
- route coverage
- semantic regression
- 某人生阶段明显空白

### 3.2 必须分类

在写任何新内容前，问题必须归入以下一类：

```text
CONTENT_GAP
ACCESS_PROBLEM
CAUSALITY_PROBLEM
SCHEDULING_PROBLEM
MEASUREMENT_PROBLEM
PRESENTATION_PROBLEM
NO_PROBLEM
```

定义：

- `CONTENT_GAP`：确实缺少一个重要人物、人生事件、关键选择或长期回应。
- `ACCESS_PROBLEM`：内容已经存在，但资格/前置条件使正确玩家无法进入。
- `CAUSALITY_PROBLEM`：前后内容存在，但真实历史没有正确连接。
- `SCHEDULING_PROBLEM`：合适内容已经存在，但选择机制没有合理呈现。
- `MEASUREMENT_PROBLEM`：指标/分类/样本不能正确代表产品体验。
- `PRESENTATION_PROBLEM`：runtime 语义存在，但玩家无法感知过去造成的影响。
- `NO_PROBLEM`：没有值得产品修改的真实问题。

只有 `CONTENT_GAP` 才允许进入新增内容流程。

### 3.3 Hard Gate

如果无法证明 `CONTENT_GAP`：

```text
STOP
不得新增 Person / Event
```

---

## 4. Stage 2：Content Proposal

确认 `CONTENT_GAP` 后，模型先提交最小 proposal，不写正式正文和 JSON。

必须包括：

```text
Gap
为什么这是玩家可感知的产品缺口
最小建议
预计需要 Person / Event / payoff / access 中哪一种
明确不做
```

核心问题：

> **最小需要补什么？**

禁止用以下问题驱动生产：

> “这条线还能再写什么？”

### 4.1 扩写已有故事线的分类

新增故事内容前，应先判断它属于：

```text
A. 缺失 setup
B. 缺失 development
C. 缺失 conflict
D. 缺失 meaningful choice
E. 缺失 payoff_echo
F. 什么都不缺，只是想增加篇幅
```

如果是 `F`：默认不加。

---

## 5. Stage 3：Authoring Contract

### 5.1 Event Authoring Card

任何正式 Event 在实现前至少明确：

1. **Event Purpose** — 为什么值得进入玩家人生？
2. **Access** — 什么具体条件下可以发生？
3. **Domain** — primary life domain。
4. **Narrative Role** — `setup / development / conflict / choice / payoff_echo`。
5. **Past Evidence Consumed** — 依赖玩家过去真实发生过什么？
6. **Meaningful Player Decision** — 如果有选择，选择真正改变什么；如果是 auto，为什么 auto 合理？
7. **Durable Result** — 结束后留下什么具体 history/fact？
8. **Future Hook** — 哪些未来内容可能消费它；没有则明确“无”。
9. **Presentation** — 玩家看到的核心情境是什么？
10. **Scope Check** — 是否为一个事件引入了不必要的新系统？

### 5.2 Person Authoring Card

需要新人物时，先定义 Person，再定义 Event：

1. Identity
2. Access
3. 2–3 Character Anchors
4. Core Concern
5. Event Responsibilities
6. Durable Facts
7. Relationship Possibilities
8. Long-term Hooks

顺序必须是：

```text
Person Definition
↓
Event Responsibilities
↓
最低必要 Event Set
```

禁止：

```text
先写一堆剧情
↓
再为剧情找 NPC
```

### 5.3 最低必要事件集

新人物或新主题不要求固定事件数量。

典型内容可能只需 2–5 个关键 Event Cards；如果需要更多，必须由因果语义证明，而不是为了“丰富度”。

---

## 6. Stage 4：Human Approval

Human 审批的是产品语义，而不是每个技术变量。

Human 主要判断：

- 这个 Gap 值不值得解决？
- 这个人生变化/人物是不是产品想要的？
- 最小范围是否合理？
- 是否出现明显过度设计？

默认以中文呈现审批材料。

代码 ID、文件名、命令可以保留英文；不应要求 Human 阅读大段英文执行提示后才能判断产品方向。

未经 Human Approval，不进入正式 Implementation。

---

## 7. Stage 5：Implementation

进入此阶段后，产品语义已经锁定。

Codex/implementation agent 主要负责：

```text
新增/修改 event JSON
接已有 history / facts
写必要 player-facing copy
增加 focused regression
更新正式 catalog / manifest（如确有需要）
```

implementation agent 无权自行扩大产品设计。

### 7.1 Implementation STOP

若落地时发现需要：

- 未批准的新 Runtime abstraction；
- 未批准的新 schema；
- 未批准的新 Person system；
- 新增一个 Authoring Contract 中不存在的事件；
- 改变原产品语义；
- 为方便实现创建通用状态机；

必须：

```text
STOP
返回 Authoring Contract
```

不能以“工程上更方便”为理由继续扩张。

---

## 8. Stage 6：Semantic Verification

Semantic Verification 首先验证“是否忠实实现 Contract”，不是先判断好不好玩。

典型验证包括：

- 正确玩家可以进入；
- 错误玩家不能进入；
- 后续必须消费真实 prior history；
- meaningful choices 留下不同 durable history；
- 不伪造不存在的人物/关系；
- 不意外新增 affinity / achievement / generic stat reward；
- 不把 Romance、Marriage、Parenthood、Succession 混成一个状态；
- transient role 不被错误升级为 permanent Person；
- deferred/retired content 不因新实现自动恢复。

focused regression 应优先证明这一层。

若 Semantic Verification 失败：

```text
STOP
不能用体验指标掩盖语义错误
```

---

## 9. Stage 7：Experience Verification

语义正确后，再检查实际人生 trace：

- 内容是否真实可达；
- 出现年龄/阶段是否合理；
- 与前后内容间隔是否合理；
- 是否与附近内容产生明显同质碰撞；
- 玩家是否能理解为什么现在发生；
- 过去选择是否能被玩家感知；
- 是否过于频繁；
- 是否稀有到几乎不存在。

Experience Verification 失败不能自动得出“继续加内容”。

必须回到 Gap Diagnosis，重新判断：

```text
content
access
causality
scheduling
measurement
presentation
```

哪个才是根因。

---

## 10. Agent / Human 职责边界

### 10.1 Auto Evolution / Analysis Agent

可以：

- 发现异常；
- 收集 trace；
- 提出 Gap Hypothesis；
- 提供可能分类与证据。

不能：

- 自动决定新增人物；
- 自动生成正式事件并提交；
- 因 metric FAIL 自动扩张 catalog。

### 10.2 Product Design Agent

负责：

- Gap 分类；
- 最小产品方案；
- Person/Event Contract；
- scope 与 STOP 边界；
- 判断是否发生 delayed-abstraction trigger。

### 10.3 Human

负责真正的产品决策：

- 是否值得做；
- 人物/人生变化是否符合产品；
- scope 是否可接受。

### 10.4 Codex / Implementation Agent

负责：

- 按批准 Contract 落地；
- focused tests；
- verification；
- 工程证据与提交。

不能重新解释产品目的。

---

## 11. 与 PD-101～105 的关系

PD-106 是内容生产治理层，不替代具体领域 authority。

```text
PD-105 Experience Measurement
        ↓
可能发现问题
        ↓
PD-106 Gap Diagnosis / Authoring Workflow
        ↓
具体领域 Contract
├─ PD-101 Character / Relationship
├─ PD-102 Parenthood / Family Life
├─ PD-103 Sex-Variant Person Archetype
└─ PD-104 Generic Relationship Legacy Quarantine
```

例如：

- 确认缺一个重要人物后，Person 设计仍受 PD-101 约束；
- 需要 sex-variant archetype 时仍受 PD-103 限制；
- Parenthood 仍受 PD-102 限制；
- PD-104 deferred relationship events 不是 backlog，不能因“内容缺”自动恢复。

---

## 12. 与 Auto Evolution 的关系

Auto Evolution 保持：

```text
RUN / OBSERVE
```

推荐闭环：

```text
Auto Evolution 发现信号
↓
PD-105 判断 measurement 是否可信
↓
PD-106 Gap Diagnosis
↓
如果 CONTENT_GAP
↓
形成受约束的 Content Proposal / Authoring Cards
↓
领域 Contract
↓
Human Approval
↓
Codex Implementation
↓
Semantic Verification
↓
PD-105 Experience Verification
```

禁止：

```text
metric FAIL
→ 自动生成 5 个事件
```

---

## 13. LLM-assisted Content Production Contract

未来大模型内容生成采用三阶段接口：

### 13.1 Content Gap Proposal

模型先回答：

- 当前缺什么？
- 为什么缺？
- 玩家可感知的问题是什么？
- 是 Person/Event/Payoff/Access，还是根本不是 Content Gap？

不写正式事件。

### 13.2 Authoring Cards

Gap 获批后，生成：

- Person Card（如需要）；
- Event Cards；
- 因果连接；
- Scope / STOP conditions。

仍不批量生成最终文案。

### 13.3 Implementation

Contract 获批后才生成：

- JSON；
- histories / effects；
- player-facing copy；
- tests。

大模型在这里是“受产品契约约束的内容设计和实现工具”，不是自由小说生成器。

---

## 14. Complexity / STOP Conditions

出现以下任一情况必须 STOP：

- 无法证明是 `CONTENT_GAP`；
- 为解决一个缺口同时需要新人物系统、家庭系统、继承系统、关系系统；
- 大量新增事件只是增加篇幅；
- 新人物必须依赖固定通用剧情模板才能成立；
- 新事件没有 meaningful past connection，也没有明确人生意义；
- implementation 需要未经批准的 schema/runtime/general abstraction；
- 为一个样例提前建立 generic Person/Story/Household/Debt runtime；
- Auto Evolution 试图从指标直接进入正式内容生产；
- 为了让测试变绿而新增内容，但尚未证明玩家存在 Content Gap。

默认动作：缩小问题、拆分 Proposal、返回 Gap Diagnosis，而不是继续泛化。

---

## 15. v1 Acceptance

PD-106 v1 成功意味着：

1. 新内容必须先有 Gap Diagnosis。
2. 只有 `CONTENT_GAP` 可以进入 Authoring。
3. Person 与 Event 有清晰、轻量的 Authoring Card。
4. Event 明确是人生意义单位，不是日常日志。
5. Story continuity 优先由真实 history 构成。
6. Human 在产品语义层审批，默认看到中文材料。
7. Codex 不得在 Implementation 阶段自行扩大 scope。
8. Semantic Verification 在 Experience Verification 之前。
9. Experience failure 必须重新归因，不能自动加内容。
10. Auto Evolution 保持发现/观察能力，不获得自动扩张 catalog 的权力。

该 Contract 不要求立即生成新人物或新事件；它首先是未来内容生产的一致治理边界。

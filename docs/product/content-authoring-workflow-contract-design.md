# Content Authoring Workflow Contract v3

**状态：** 当前权威规范（Human accepted：2026-09-24；PD-121）

**历史：** PD-106（2026-09-01）保留为历史 Human Accepted 决策；PD-120（2026-09-19）保留为默认 Content Authoring Workflow authority。v2 修复“内容容量不足无法被正式诊断”的过严边界，并明确 Auto Evolution 在 Human Approval 之前的 proposal 权限；不取消内容质量门槛。v3 仅增加 PD-121 规定的 Human-approved Contract shadow-only delegated-authority 例外。

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

需要正式 Person 时，人物领域语义由 Character / Relationship **Person Domain Authoring Contract v1.1** 定义（见 §5.2）。本 Contract 只规定流程顺序，不维护第二套会独立漂移的人物规则。

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

Content Proposal 可以提议一组具有真实因果关系的内容，但这不授权新的 generic `TaskLine` / `StoryArc` runtime。若 proposal 实际需要新 Runtime / Schema / generic Story abstraction，必须单独 Human 决策。

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

标准流程：

```text
Gap Diagnosis
→ Content Proposal
→ Draft Authoring Contract
→ Does a Human-approved Autonomous Authoring Contract apply?
   ├─ no / unknown / contract-changing
   │    → existing Human Approval boundary
   └─ yes, Host-proven APPLICABLE
        → bounded shadow authoring
        → semantic + mechanical verification
        → SHADOW_AUTHORING_VERIFIED
        → Human exact-patch promotion boundary
```

默认路径继续遵循 PD-120：Human Approval 在 authoritative implementation 之前。只有 Human-approved Contract 明确覆盖、当前 case 经 Host 证明 APPLICABLE、独立语义审查通过且 Host mechanical admission 合格时，才可在 isolated workspace 中执行 shadow authoring。

Shadow authoring never equals authoritative implementation.
A Natural Player-visible Experience Review still occurs only after a Human-authorized authoritative promotion.

Player-visible Experience Review 失败后必须回到 Gap Diagnosis，而不是直接继续加内容。

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

顶层 Gap taxonomy 只有以上七类，不得新增第八个顶层分类。

定义：

- `CONTENT_GAP`：确实缺少一个重要人物、人生事件、关键选择或长期回应；或在 access / causality / scheduling / presentation 已正确的前提下，某个年龄阶段、主题、人物关系、故事领域或生活领域的 authored content 容量或多样性不足，导致正常自然游玩出现结构性重复、过早耗尽、持续缺乏有意义变化，或频繁退化到 generic fallback（正式子类型见 §3.2.1）。
- `ACCESS_PROBLEM`：内容已经存在，但资格/前置条件使正确玩家无法进入。
- `CAUSALITY_PROBLEM`：前后内容存在，但真实历史没有正确连接。
- `SCHEDULING_PROBLEM`：合适内容已经存在，但选择机制没有合理呈现。
- `MEASUREMENT_PROBLEM`：指标/分类/样本不能正确代表产品体验。
- `PRESENTATION_PROBLEM`：runtime 语义存在，但玩家无法感知过去造成的影响。
- `NO_PROBLEM`：没有值得产品修改的真实问题。

只有 `CONTENT_GAP` 才允许进入新增内容流程。

#### 3.2.1 `CONTENT_CAPACITY_GAP`（`CONTENT_GAP` 正式子类型）

`CONTENT_CAPACITY_GAP` 不是新的顶层类别。它是 `CONTENT_GAP` 的正式子类型。

定义：

> 当某个年龄阶段、主题、人物关系、故事领域或生活领域的 authored content 容量或多样性不足，导致正常自然游玩出现结构性重复、过早耗尽、持续缺乏有意义变化，或频繁退化到 generic fallback，并且该问题不能仅通过 Access、Causality、Scheduling 或 Presentation 修正时，可以正式诊断为 `CONTENT_GAP`（子类型 `CONTENT_CAPACITY_GAP`）。

不得把以下情况自动解释为 `CONTENT_CAPACITY_GAP`：

```text
metric 低
coverage 低
某一次随机重复
单个 route 没命中内容
scheduler 没合理利用已有内容
已有内容被错误 prerequisite 挡住
已有后果没有展示给玩家
```

这些仍必须先经过现有 Gap Diagnosis，并优先考虑 Access / Causality / Scheduling / Presentation / Measurement。

#### 3.2.2 Scheduling 与 Capacity 的边界

正式判断原则：

```text
如果合理调度现有合法 authored content 就足以解决问题：
    SCHEDULING_PROBLEM

如果 access / causality / scheduling / presentation 已正确，
而正常游玩仍会结构性耗尽或重复：
    CONTENT_GAP / CONTENT_CAPACITY_GAP
```

不设置机械性的“必须 N 个 natural samples”阈值。

可以使用：

```text
可靠的 natural Player-visible evidence
+
确定性的结构 / pool-capacity evidence
```

共同证明结构性容量不足。

### 3.3 Hard Gate

如果无法证明 `CONTENT_GAP`：

```text
STOP
不得新增 Person / Event
```

---

## 4. Stage 2：Content Proposal

确认 `CONTENT_GAP` 后，先提交最小 proposal，不写正式正文和 JSON。

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

Auto Evolution 可以在 Human Approval 之前，主动研究缺的是人物、事件、长期 payoff、有因果连接的内容序列、Milestone，或某个领域的 authored variety，并形成完整的 Human approval material。不要求 Human 在“这里只是内容少吗？”这种早期阶段手动替 AE 做设计。

### 4.1 扩写已有故事线的审稿问题

新增故事内容前，应先逐项审查：

- 这条线是真的缺少铺垫、发展、冲突、关键选择或后来回应吗？
- 这项缺失是否造成了玩家可感知的连续性或人生意义问题？
- 还是只是想增加篇幅？如果只是增加篇幅，默认不加。

### 4.2 任务线语义边界

允许 Content Proposal 提议一组具有真实因果关系的内容。

连续性继续优先由现有：

```text
event history
choice history
durable facts
prerequisites
```

表达。

不得因此授权新的 generic `TaskLine` / `StoryArc` runtime。如果 proposal 实际需要新 Runtime / Schema / generic Story abstraction，必须单独 Human 决策。

---

## 5. Stage 3：Draft Authoring Contract

### 5.1 Event Authoring Card

任何正式 Event 在实现前至少明确：

1. **Event Purpose** — 为什么值得进入玩家人生？
2. **Access** — 什么具体条件下可以发生？
3. **Story / Life Function Review** — 这件事为什么值得成为正式人生 Event？它在当前故事/人生阶段承担什么作用？
4. **Past Evidence Consumed** — 依赖玩家过去真实发生过什么？
5. **Meaningful Player Decision** — 如果有选择，选择真正改变什么；如果是 auto，为什么 auto 合理？
6. **Durable Result** — 结束后留下什么具体 history/fact？
7. **Future Hook** — 哪些未来内容可能消费它；没有则明确“无”。
8. **Presentation** — 玩家看到的核心情境是什么？
9. **Scope Check** — 是否为一个事件引入了不必要的新系统？

### 5.2 Person Authoring Card

Content Proposal 确认需要 Person 时：

```text
Content Proposal requires a Person
↓
invoke Character / Relationship Person Domain Authoring Contract
↓
produce conforming Person Authoring Card
↓
derive Event Responsibilities
↓
derive Minimum Event Set
↓
produce Event Authoring Cards
```

权威字段、分类、continuity、validation 与 Card 结构以 `docs/product/character-relationship-product-contract-design.md` §11 Person Domain Authoring Contract v1.1 为准。

本 Contract 可保留极简提示，但不维护平行完整人物规则：

- 先过 Person Necessity Gate（场景功能角色不得自动升级 Person）
- 再选择 `actor_class` / `identity_strategy`
- 再填写八项 Person Definition 与 `RESPONSIBILITY_TO_EVENT_MAP`
- Bounded Person Archetype 另受 PD-103 约束

顺序必须是：

```text
Person Domain Authoring
↓
Event Responsibilities
↓
最低必要 Event Set
↓
Event Authoring Cards
```

禁止：

```text
先写一堆剧情
↓
再为剧情找 NPC
```

### 5.3 最低必要事件集

新人物或新主题不要求固定事件数量。Event 数量由 Person Event Responsibilities 与真实因果需要决定，并通过 Person Card 的 `RESPONSIBILITY_TO_EVENT_MAP` 与 Minimum Event Set 证明。

典型内容可能只需少量关键 Event Cards；如果需要更多，必须由因果语义证明，而不是为了“丰富度”。**不得把“2–5 events”写成硬数量规范。**

不得因为 coverage 数字自动扩 catalog。Minimum Event Set 由语义证明。

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

未经 Human Approval，不进入 authoritative Implementation。PD-121 仅允许符合已批准 Autonomous Authoring Contract 的 case 在 isolated workspace 中进行 shadow authoring；Reviewer acceptance 本身不构成执行 authority，shadow result 也不是正式内容实施。

Human Approval 之前禁止：

```text
新增正式 Person
新增 Event
扩 catalog
新增 Milestone authored semantics
修改正式 story / causal content
进入 authoritative implementation
```

PD-121 的 shadow-only Contract 例外不改变上述 authoritative promotion 边界；任何 shadow patch 进入 authoritative repository 前，仍须由 Human 对 exact patch 作出明确 promotion 决定。

`READY_FOR_FORMAL_TASK`、Agent recommendation、metric failure 都不是 Human Approval 的替代物。

---

## 7. Stage 5：Implementation

进入此阶段后，产品语义已经锁定。

默认 Implementation 仍在 Human Approval 后进行。PD-121 授权的 shadow authoring 属于 isolated workspace 中的预备实现与验证，不改变 authoritative repository，也不替代 Human exact-patch promotion。

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

## 9. Stage 7：Natural Player-visible Experience Review

语义正确后，再进行定性的玩家可见体验审查。可以使用：

- actual life traces；
- Human play observation；
- Auto Evolution qualitative participant feedback；
- Agent qualitative analysis；
- 客观 reachability / frequency facts（如需要）。

主要检查：

- 内容是否真实可达；
- 时间/年龄是否合理；
- 前后间隔是否自然；
- 是否与附近内容明显撞车；
- 玩家能否理解为什么现在发生；
- 过去选择是否可感知；
- 是否明显过频或过稀；
- 是否主观感觉重复、拖沓或空洞。

Player-visible Experience Review 不要求生成节奏分数。失败不能自动得出“继续加内容”。

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

Auto Evolution 继续处于：

```text
RUN / OBSERVE
```

明确允许 AE 自动完成：

```text
Player-visible signal
→ Gap Diagnosis
→ Content Proposal
→ Draft Authoring Contract
→ Human Approval boundary
```

也就是说 AE 可以：

- 发现异常；
- 收集 trace；
- 提出 Gap Hypothesis；
- 完成 Gap Diagnosis；
- 主动研究缺的是人物、事件、长期 payoff、有因果连接的内容序列、Milestone，或某个领域的 authored variety；
- 形成完整的 Content Proposal 与 Draft Authoring Contract，作为 Human approval material。

在 PD-121 唯一启用的 `preschool-shared-neutral-passive-capacity-v1@1` Contract 范围内，且 Host 证明当前 case APPLICABLE、独立语义审查与 Host mechanical admission 均通过时，AE 还可 author、implement、verify isolated shadow patch；产物只进入 Human exact-patch promotion review。

不能：

- 自动决定并实施超出已批准 Contract 的新增人物；
- 自动生成正式事件并写入 authoritative catalog；
- 因 metric FAIL 自动扩张 catalog；
- 越过 Human Approval 修改 authoritative repository。

当前默认采用的是：

```text
AE 自动诊断 + 自动 proposal / draft contract
Human 批准后才 implementation
```

PD-121 明确授权的 shadow-only Contract 路径独立于默认流程，不产生 authoritative source change。只有在该流程经过足够真实生产验证后，才重新讨论更广范围的 autonomous author + implement authority：

```text
AE 在既有 Contract 内自动 author + implement
```

本次不授权这一层。

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

## 11. 与具体领域 Contract 的关系

本 Contract 是内容生产治理层，不替代具体领域 authority，也不依赖已退休的体验度量实验。

```text
Human / Auto Evolution / tests / traces
        ↓
发现 signal
        ↓
PD-120 Gap Diagnosis
        ↓
如果确认 CONTENT_GAP
        ↓
具体领域 Contract
├─ PD-101 / Person Domain Authoring Contract（Character / Relationship）
├─ PD-102 Parenthood / Family Life
├─ PD-103 Sex-Variant Person Archetype
└─ PD-104 Generic Relationship Legacy Quarantine
```

例如：

- Person need → invoke PD-101 / Person Domain Authoring Contract；产出 conforming Person Authoring Card，再 derive Event Responsibilities 与 Minimum Event Set；
- Bounded Person Archetype → additionally PD-103；
- Parenthood 仍受 PD-102 限制；
- PD-104 deferred relationship events 不是 backlog，不能因“内容缺”自动恢复。

**本 Contract 不授权自行扩大 Person capability**，也不维护第二套会独立漂移的完整人物 specification。

---

## 12. 与 Auto Evolution 的关系

Auto Evolution 保持：

```text
RUN / OBSERVE
```

推荐闭环：

```text
Auto Evolution / tests / traces 发现 signal
↓
PD-120 Gap Diagnosis
↓
如果 CONTENT_GAP
↓
AE 形成受约束的 Content Proposal / Draft Authoring Contract
↓
领域 Contract（如需要）
↓
Human Approval (default)
├─ authoritative implementation → Semantic Verification → Natural Player-visible Experience Review
└─ if PD-121 Contract applies → isolated shadow authoring / verification
                              → Human exact-patch promotion
                              → Semantic Verification
                              → Natural Player-visible Experience Review
```

禁止：

```text
metric FAIL
→ 自动生成 5 个事件
```

也禁止：

```text
READY_FOR_FORMAL_TASK / Agent recommendation / metric failure
→ 当作 Human Approval
→ 直接 Implementation
```

---

## 13. LLM-assisted Content Production Contract

内容生成继续遵循三阶段接口；authoritative implementation 默认需要 instance-level Human Approval。PD-121 Contract case 可额外在 isolated workspace 产出 shadow patch，等待 Human exact-patch promotion：

### 13.1 Content Gap Proposal

模型先回答：

- 当前缺什么？
- 为什么缺？
- 玩家可感知的问题是什么？
- 是 Person/Event/Payoff/Access，还是根本不是 Content Gap？
- 若主张 `CONTENT_CAPACITY_GAP`，为什么不是 Scheduling / Access / Causality / Presentation？

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
- Auto Evolution 试图从指标直接进入正式内容实施（越过 Human Approval）；
- 为了让测试变绿而新增内容，但尚未证明玩家存在 Content Gap；
- 因 coverage 数字自动扩 catalog；
- 未过 Person Necessity Gate 就新增 Person。

默认动作：缩小问题、拆分 Proposal、返回 Gap Diagnosis，而不是继续泛化。

---

## 15. v3 Acceptance

Content Authoring Workflow Contract v3 成功意味着：

1. 新内容必须先有 Gap Diagnosis。
2. 只有 `CONTENT_GAP` 可以进入 Authoring；顶层 taxonomy 仍只有七类。
3. `CONTENT_CAPACITY_GAP` 可作为 `CONTENT_GAP` 正式子类型被诊断，但不得绕过 Access / Causality / Scheduling / Presentation 审查。
4. Scheduling 与 Capacity 有明确边界；不设机械 natural-sample 阈值。
5. Person 与 Event 有清晰、轻量的 Authoring Card；Person 必须过 Person Necessity Gate；Minimum Event Set 由语义证明。
6. Event 明确是人生意义单位，不是日常日志；不得为了篇幅堆事件。
7. Story continuity 优先由真实 history 构成；不因此授权 generic TaskLine / StoryArc runtime。
8. Human 在产品语义层审批，默认看到中文材料；除 PD-121 shadow-only Contract 例外外，Human Approval 之前禁止 authoritative implementation。
9. AE 可自动完成 Gap Diagnosis → Content Proposal → Draft Authoring Contract；只有已批准且 Host-proven applicable 的 PD-121 Contract case 才可进行 shadow authoring / implementation / verification，且不得自动 promotion。
10. Codex 不得在 Implementation 阶段自行扩大 scope。
11. Semantic Verification 在 Player-visible Experience Review 之前。
12. Player-visible Experience Review failure 必须重新归因，不能自动加内容。
13. Auto Evolution 保持 `RUN / OBSERVE`，不获得自动扩张 catalog 的权力。

该 Contract 不要求立即生成新人物或新事件；它首先是内容生产的一致治理边界。v2 的其余 acceptance criteria 与 PD-120 默认规则继续有效。

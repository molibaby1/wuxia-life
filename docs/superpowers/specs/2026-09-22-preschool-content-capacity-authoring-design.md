# Preschool Content Capacity Authoring Contract

## Status

HUMAN ACCEPTED — 2026-09-22

## Authority identifier

~~~
preschool-content-capacity-authoring-20260922
~~~

## Scope

本文件是一次已获 Human Approval 的 Preschool 4–7 岁内容容量决策的正式
authoring authority。它固定本轮 Gap Diagnosis、最小 Content Proposal、八个
Authoring Card 以及后续 implementation / verification boundary，供后续独立
implementation 使用。

本文件不是 content implementation，不写入 preschool catalog，不改变 scheduler、
selector、runtime、schema 或 player state。最终 player-facing title / text
尚未在本 authority landing 中写定；后续 implementation 可以在不改变本文件
Card 语义、边界和年龄窗口的前提下编写简洁正文。

本次 Human Approval 表示：Gap classification、最小产品范围、八个 authored
experience 的产品职责、age window 与 scope boundary 已接受，可以形成正式
authoring authority。

本次 Human Approval 不表示：内容已经实现、已经写入 catalog、已经完成
Semantic Verification，或已经完成新的 natural Player-visible Experience Review。

本文件不新增 PD-121，不修改 PD-120。PD-120 已经提供 Content Authoring
Workflow 的流程与权限 authority，本文件只固定这一次具体的 preschool
authoring decision。

## Gap Diagnosis

### Formal classification

~~~
Top-level: CONTENT_GAP
Subtype:   CONTENT_CAPACITY_GAP
~~~

CONTENT_CAPACITY_GAP 是 CONTENT_GAP 的正式子类型，不是新的顶层 Gap
类别。本次判断遵循 PD-120 与 Content Authoring Workflow Contract v2：只有在
Access、Causality、Scheduling 与 Presentation 已正确，而正常自然游玩仍发生
结构性容量耗尽或重复时，才能进入这一分类。

### Why the earlier Scheduling diagnosis was correct

此前 preschool case 曾先被正确诊断为 SCHEDULING_PROBLEM。当时已接受并
实现的 unified-pool design 是：

~~~
preschool-season-unified-candidate-pool-20260919
~~~

该修复正确解决了当时的调度问题：

- matching-origin 与 neutral 是同一个合法、未消费 pool 中的 first-class
  candidates；
- 不再有固定 origin → neutral → origin hard slots；
- 只要 whole legal unconsumed pool 非空，就不得选择 generic gap；
- history-safe no-reuse 保留；
- 一张 season card 内的 authored IDs 继续必须 distinct；
- 4–7 岁 season 仍是 3 beats，acknowledgement 仍推进 3 months。

因此，2026-09-19 unified-pool design 当时诊断为 SCHEDULING_PROBLEM 是正确
的。本次 Capacity diagnosis 是 subsequent natural evidence 产生的新阶段判断，
不是 retroactively 推翻旧 diagnosis，也不 supersede unified candidate pool
design。

### Subsequent natural Player-visible evidence

后续自然 Player-visible evidence 来自：

~~~
ordinary-run-20260919-000001
~~~

该自然 evidence 在 4–7 岁观察到共 24 个可见 beats：

~~~
8 origin-specific
9 neutral
7 generic gap
~~~

同时观察到：

- 出现完整的 3-gap season；
- neutral 能在 matching-origin 内容仍存在时自然进入；
- 没有观察到 authored ID reuse；
- 没有观察到 foreign canonical-origin content。

这些事实说明 unified-pool 的调度语义正在生效：问题不再是 origin slot
优先级、neutral 排除或错误跨 origin 选择。

### Deterministic capacity evidence

当前 4–7 岁 unique legal authored capacity 为：

~~~
scholar:  17
martial:  18
merchant: 18
frontier: 18
~~~

其中 shared neutral capacity 为 9。

scholar natural sample 的 17 个 authored beats 与当前 scholar 的 17-entry
legal capacity 对应，随后进入 generic fallback。这与自然 evidence 中的
whole-pool exhaustion 一致，而不是 scheduler 尚未消费合法 authored pool。

### Formal causal conclusion

~~~
scheduler 已正确消费合法 authored pool
+ history-safe no-reuse 正常工作
+ 合法 authored pool 容量不足
→ whole-pool exhaustion
→ generic fallback
→ Player-visible repetition / stage stagnation
~~~

因此，依据 PD-120，当前后续问题正式重新分类为：

~~~
CONTENT_GAP / CONTENT_CAPACITY_GAP
~~~

不得把它继续描述为当前仍未解决的 SCHEDULING_PROBLEM。本次 diagnosis
明确保留旧阶段事实：2026-09-19 的 unified-pool scheduling diagnosis 正确，
本次是之后由 natural evidence 证明的 authored capacity 不足。

## Accepted Content Proposal

### Minimum scope

本轮新增 exactly 8 条 shared neutral authored preschool experiences。

本轮不新增任何 origin-specific authored entry。数量不是由 24 - 17 = 7
机械推导出的“补 7 条”或“补 8 条”；它来自四个当前缺失的 childhood life
functions，每个 life function 分成 early / later developmental expression：

1. Peer reciprocity
2. Responsibility
3. Independence
4. Care / household participation

每个 function 两条，共 8 条。新增内容必须随着年龄逐步解锁，不得把所有 8
条都设置为 ageMin=4。

所有八条的 accepted default 为：

~~~
{"originTags":["neutral"]}
~~~

### Authoring rule for player-facing wording

Human 本次批准的是每张 Card 的产品语义、年龄窗口与 scope，不是逐字 copy。
implementation 阶段可以为每个 Card author 简洁的最终 title / text，但
不得借文案选择改变 Card 的 life function、developmental expression、
durable result、future hook 或 scope boundary。

## Eight Human-approved Authoring Cards

以下 ID、年龄窗口、originTags 与产品语义均为 accepted authority。八条均为
passive childhood experience；均不要求 meaningful player decision。

### A. Peer conflict / repair

~~~
ID:         preschool_neutral_peer_repair
ageMin:     5
ageMax:     7
originTags: ["neutral"]
~~~

- **Event Purpose：** 让同伴内容从“共同玩耍”第一次进入真实关系变化。孩子
  因游戏规则、物件或一句话发生小冲突，并经历关系修复。
- **Life Function：** 第一次理解关系会发生摩擦，也可以通过道歉、让步或重新
  合作修复。
- **Past Evidence Consumed：** 不要求具体 prior event；age 5+ 是该发展
  能力的 access boundary。
- **Meaningful Player Decision：** 无；保持 passive childhood experience。
- **Durable Result：** 现有 eventHistory 中记录该 authored ID；不新增 flag。
- **Future Hook：** 当前明确为无。
- **Presentation boundary：** 重点是“事情上的输赢”与“同伴关系”不是同一件
  事。
- **Scope：** 不创建正式 Person，不创建 friendship / relationship state。

### B. Peer cooperation

~~~
ID:         preschool_neutral_peer_cooperation
ageMin:     6
ageMax:     7
originTags: ["neutral"]
~~~

- **Event Purpose：** 补充同龄关系中的合作、互相依赖、遵守约定。
- **Life Function：** 孩子发现有些事情一个人做不完；答应共同完成后也不能
  随时退出。
- **Past Evidence Consumed：** 不要求具体 history；6–7 岁作为更成熟的
  social-agency boundary。
- **Meaningful Player Decision：** 无。
- **Durable Result：** 现有 eventHistory 中记录该 authored ID。
- **Future Hook：** 当前明确为无。
- **Presentation boundary：** 两个或几个孩子合作完成一件具体小事；过程中
  存在协调、分工或有人想放弃的张力。
- **Scope：** 不创建正式好友系统，不创建 Relationship state。

### C. First entrusted responsibility

~~~
ID:         preschool_neutral_entrusted_task
ageMin:     5
ageMax:     7
originTags: ["neutral"]
~~~

- **Event Purpose：** 从“不要犯错”进入“别人真正把事情交给我”。
- **Life Function：** 第一次感受到 trust 与 responsibility。
- **Past Evidence Consumed：** 无具体 prior history requirement。
- **Meaningful Player Decision：** 无。
- **Durable Result：** 现有 eventHistory 中记录该 authored ID。
- **Future Hook：** 当前明确为无。
- **Presentation boundary：** 成年人临时托付一件不能随便丢下的事情；途中有
  分心、诱惑或小意外，重点是孩子意识到“这是交给我的”。
- **Existing-content distinction：** 必须与 preschool_neutral_broken_bowl
  区分。broken_bowl 是无意犯错；entrusted_task 是被托付之后产生责任
  意识。
- **Scope：** 禁止写成另一条“弄坏东西 → 挨骂”。

### D. Care for a younger child

~~~
ID:         preschool_neutral_care_younger
ageMin:     6
ageMax:     7
originTags: ["neutral"]
~~~

- **Event Purpose：** 第一次短暂承担另一个人的安全 / 需求。
- **Life Function：** 从“我是被照顾的人”转向“别人也可能需要我的照顾”。
- **Past Evidence Consumed：** 不要求 sibling / person history。
- **Meaningful Player Decision：** 无。
- **Durable Result：** 现有 eventHistory 中记录该 authored ID。
- **Future Hook：** 当前明确为无。
- **Presentation boundary：** 成年人短时间让孩子留意一个更小的孩子；对方
  可能哭、乱跑或需要简单帮助。
- **Scope：** 更小的孩子必须是 transient role；不得创建 Person、sibling
  relation 或引入 Family runtime。

### E. Find a way back

~~~
ID:         preschool_neutral_find_way_back
ageMin:     5
ageMax:     7
originTags: ["neutral"]
~~~

- **Event Purpose：** 成人没有立即替孩子处理问题时，孩子第一次主动观察并
  解决轻度分离问题。
- **Life Function：** 从被动等待转向基础独立行动。
- **Past Evidence Consumed：** 无具体 prior history。
- **Meaningful Player Decision：** 无。
- **Durable Result：** 现有 eventHistory 中记录该 authored ID。
- **Future Hook：** 当前明确为无。
- **Presentation boundary：** 孩子在熟悉但稍大的环境中与成年人短暂错开；
  通过记路、辨认标记或向可信成年人求助重新找到正确地方。
- **Existing-content distinction：** 必须与 preschool_neutral_waiting_threshold
  区分。waiting_threshold 是被动等待照顾者；find_way_back 是主动解决
  短暂分离。
- **Scope：** 不得升级为失踪、绑架、重大危险、trauma 或 survival runtime。

### F. Speak for oneself

~~~
ID:         preschool_neutral_speak_for_self
ageMin:     6
ageMax:     7
originTags: ["neutral"]
~~~

- **Event Purpose：** 表现儿童从“成年人替我表达”进入基础社会自主性。
- **Life Function：** 能够面对不熟悉的成年人，自己说明是谁、来做什么、需要
  什么。
- **Past Evidence Consumed：** 无。
- **Meaningful Player Decision：** 无。
- **Durable Result：** 现有 eventHistory 中记录该 authored ID。
- **Future Hook：** 当前明确为无。
- **Presentation boundary：** 一次对孩子有压力但日常可控的社会情境；成年人
  不替他说，孩子必须自己把事情说明白，并发现别人会认真听自己的话。
- **Scope：** 不得退化成普通购物 / 跑腿日志；核心是 social agency。

### G. Care for a sick adult

~~~
ID:         preschool_neutral_care_sick_family
ageMin:     5
ageMax:     7
originTags: ["neutral"]
~~~

- **Event Purpose：** 把 illness 内容从“我生病，别人照顾我”扩展到 reciprocity。
- **Life Function：** 第一次理解平时可靠的大人也会虚弱，自己也能提供一点
  实际照顾。
- **Past Evidence Consumed：** 不要求具体 Person identity。
- **Meaningful Player Decision：** 无。
- **Durable Result：** 现有 eventHistory 中记录该 authored ID。
- **Future Hook：** 当前明确为无。
- **Presentation boundary：** 家中某个平时照顾孩子的大人身体不适；孩子递水、
  拿布、保持安静或帮一个具体小忙。
- **Existing-content distinction：** 必须与 preschool_neutral_childhood_fever
  形成角色反转：childhood_fever 是被照顾者，care_sick_family 是照顾者。
- **Scope：** 不创建疾病系统、正式 Parent Person 或长期 health state。

### H. Household disruption participation

~~~
ID:         preschool_neutral_household_disruption
ageMin:     6
ageMax:     7
originTags: ["neutral"]
~~~

- **Event Purpose：** 让家庭环境不再只是永远稳定的背景；孩子第一次参与
  短暂、可恢复的生活扰动。
- **Life Function：** 理解家需要所有人参与维持，自己也可以承担一小部分工作。
- **Past Evidence Consumed：** 无。
- **Meaningful Player Decision：** 无。
- **Durable Result：** 现有 eventHistory 中记录该 authored ID。
- **Future Hook：** 当前明确为无。
- **Presentation boundary：** 可以是急雨、漏水、临时挪动家什或类似短暂扰动；
  一家人一起应对，孩子承担一个真实但年龄合适的小任务。
- **Scope：** 不得升级为破产、迁居、家庭死亡、战争灾难或 Household runtime。

## Shared-neutral rationale

当前已证明的是 preschool 整体 authored capacity / diversity 不足，而不是某一
个 canonical origin 缺少特定职业或家庭背景内容。

现有 origin-specific content 已经提供明显的身份 texture：

~~~
scholar:  识字、描红、听书、书斋、印章等
martial:  训练、兵器、练武场等
merchant: 算盘、柜台、议价、叫卖等
frontier: 风沙、哨岗、营火、战马等
~~~

本轮 shared additions 的产品作用是：

- 提高所有 canonical origin 的可用 capacity；
- 降低“整个童年主要由出生职业训练构成”的比例；
- 引入关系、责任、独立、照顾等缺失成长维度；
- 避免同时扩大四套 origin-specific authoring scope。

当前尚未独立证明某一个 canonical origin 必须新增特定职业 / 家庭背景内容。
若 future natural PVER 显示 generic exhaustion 已改善，但某 origin 仍明显语义
单一，届时应重新进行 Gap Diagnosis，判断是否形成
origin-specific authored diversity gap。本轮不提前处理该问题。

## Schema / runtime boundary

后续 implementation 必须继续使用现有 PassiveNarrativeEntry。本 proposal 的
八条 entry 默认只需要：

~~~
id
title
text
originTags
ageMin
ageMax
~~~

默认 originTags 必须为：

~~~
["neutral"]
~~~

本 Contract 不授权新增：

~~~
statDeltas
flags
Person
choice
Milestone
Relationship
new player state
new prerequisites/schema
TaskLine
StoryArc
generic runtime abstraction
~~~

现有 eventHistory 中的 authored ID 是最小 durable result。八条均不新增 flag，
不要求 player decision，且不产生当前明确的 future hook。

如果后续 implementation 发现某条必须新增 flag、schema 或 runtime 才能成立，
必须：

~~~
STOP
返回 Human / Authoring Contract
~~~

不得自行扩大 implementation，也不得用兼容层绕开本边界。

## Relationship to existing authority

本设计依赖并保持：

- PD-120: Content Capacity Gap & AE Proposal Authority v2；
- docs/product/content-authoring-workflow-contract-design.md；
- preschool-season-unified-candidate-pool-20260919。

本文件不 supersede unified candidate pool design。它只 supersede 下面这种临时
状态：

~~~
已确认 Capacity Gap，但尚无 Human-approved authoring scope
~~~

本文件不 supersede 或修改：

- scheduler semantics；
- canonical origin isolation；
- history no-reuse；
- 3-beat season；
- 3-month cadence；
- 0–3 behavior。

## Implementation boundary

本 authority landing 不实施内容、不修改代码、不修改测试、不修改 catalog，也
不开始 implementation。后续独立 implementation 才允许：

- 向现有 preschool authored catalog 增加这 8 个 entries；
- 为这 8 条编写符合 Card 的最终 title / text；
- 编写 focused regressions。

后续 implementation 不得重新决定：

- 数量；
- IDs；
- age ranges；
- neutral/shared scope；
- life functions；
- runtime boundaries。

如果 approved semantics 与真实 schema / architecture 冲突，必须 STOP 并报告
冲突，不得自行重新设计。

## Semantic Verification contract

独立 implementation 完成后，Semantic Verification 至少必须确认：

1. 8 个新 entry 都是 neutral first-class candidates；
2. 八个 entry 的 age window 正确；
3. foreign origin isolation 不变；
4. authored history no-reuse 不变；
5. 同一张 season card 内 authored IDs distinct；
6. 只有 whole-pool exhaustion 才允许 generic gap；
7. 0–3 behavior 不变；
8. season 仍为 3 beats；
9. acknowledgement 仍推进 3 months；
10. 未新增未经批准的 statDeltas、flags、Person 或 runtime。

完成 Semantic Verification 后，才能进行新的 natural Player-visible Experience
Review。

## Natural Player-visible Experience Review contract

Natural PVER 重点检查：

- 是否明显减少过早 generic fallback；
- 5–7 岁是否体现更真实的阶段变化；
- 童年是否不再主要只是 origin-family skill practice；
- 新内容是否和已有内容语义撞车；
- 是否仍存在 whole-pool structural exhaustion。

若 PVER 仍失败，必须返回 PD-120 的 Gap Diagnosis。不得自动继续扩 catalog，
不得把新的失败直接解释成需要更多内容。

## Explicit non-goals

本次 authority landing 禁止：

- 修改 src/**；
- 修改 tests/**；
- 修改 scripts/**；
- 修改 preschool catalog；
- 新增任何正式 Event / Person / Milestone；
- 修改 scheduler；
- 修改 selector weighting；
- 修改 origin affinity；
- 修改 generic placeholder；
- 修改 0–3 flow；
- 修改 season cadence；
- 新建 Story / Task runtime；
- 新建 player state；
- 修改 HFL；
- 运行 AE；
- resume historical session；
- replay；
- 写 implementation plan；
- 开始 implementation。

本次不修改以下既有 authority 或索引文件：

~~~
docs/governance/product-decisions.md
docs/product/content-authoring-workflow-contract-design.md
docs/superpowers/specs/2026-09-19-preschool-season-unified-candidate-pool-design.md
project-source-index.md
~~~

除非未来发现明确 authority conflict；若发现 conflict，应 STOP 并汇报，不得
静默改写权威资料。

## Related provenance

- Current workflow authority: PD-120。
- Workflow contract: docs/product/content-authoring-workflow-contract-design.md。
- Prior scheduling authority: preschool-season-unified-candidate-pool-20260919，
  文档为 docs/superpowers/specs/2026-09-19-preschool-season-unified-candidate-pool-design.md。
- Subsequent natural Player-visible evidence: ordinary-run-20260919-000001。
- Current diagnosis evidence: 4–7 岁 natural beats、unique legal authored
  capacity 以及 scholar 17-entry exhaustion，均为本次 Human-approved proposal
  所依据的 accepted evidence。

本文件完成的是具体 accepted authoring authority landing。它不表示实现、
Semantic Verification 或 natural PVER 已经发生。

# Player-Observable Transcript & Reviewer Calibration Design

> 状态：**successor design 候选；覆盖 Auto Evolution Phase 0/1。本文不授权编码、Planner、candidate search、原 B1.1 Task 9～14 或正式配置修改。**
>
> 上位方案：`docs/superpowers/proposals/2026-08-12-llm-driven-auto-evolution/`。
>
> 前置历史：B1.0 已关闭为 Experiment Boundary Prototype；其 runtime catalog 注入和可复现实验边界可继承，但其 simplified visible trace、evidence chain 和 weight candidate 结果不构成本设计的体验评审证明。

## 1. 本 Slice 要解决的唯一问题

本 Slice 只验证两个按顺序排列的前提：

### Phase 0

> 能否从真实 Headless 运行中稳定构造一个**严格只包含玩家可观察信息**的 transcript，并且让 Reviewer 的输入、调用配置和 provenance 可审计？

### Phase 1

> 在只看上述玩家可观察 transcript、看不到 hidden/oracle/实验身份的条件下，LLM Reviewer 是否能在明确的问题类别上达到可测量、可重复、可拒答的可靠性？

Phase 0 和 Phase 1 共用本文，但它们不是一个连续自动任务。

**Phase 0 是硬 stop gate。Phase 0 未被明确 accepted，不得自动进入 Phase 1。**

如果 Phase 1 不能证明 Reviewer 在任何有价值的问题类别上具有足够可靠性，则自动进化路线应停止或缩小为“只在已验证类别内工作的诊断工具”，而不是继续建设 Planner、Verifier 或自动飞轮。

---

## 2. 当前真实状态与设计约束

### 2.1 已有可继承能力

当前仓库已经具备：

- Headless persona simulation；
- deterministic seed / replay 基础；
- `ExperienceTrace`；
- choice execution 的 player-facing feedback model；
- presentation / acknowledgement / period summary 等体验记录；
- B1.0 `RuntimeEventCatalog` 注入与 immutable overlay 实验边界；
- artifact 隔离和基础 hash/provenance 思想。

这些是本 Slice 的输入，不要求重新建设 simulation engine。

### 2.2 当前两个 trace 都不能直接成为 Reviewer Contract

#### B1.0 simplified visible trace

它主要只有年龄、事件标题、正文和 event type，因此不足以判断：

- 玩家当时有哪些选择；
- 玩家实际选了什么；
- 选择后玩家看到了什么反馈；
- 可见数值/关系/路线发生了什么变化；
- milestone / acknowledgement 是否让因果被玩家感知。

因此不得继续把它当作正式 Experience Reviewer 输入。

#### 当前 `ExperienceTrace`

它更丰富，但同时混入了 Reviewer 不应看到的信息，例如：

- choice scoring；
- `directEffects` / `outcomeEffects`；
- oracle selection diagnostics；
- raw state delta 中的 hidden lifeStates / flags；
- simulation persona / seed；
- final full state。

因此 `ExperienceTrace` 可以作为**上游工程记录**，但必须经过一个显式 player-observable projection 才能进入 Reviewer。

### 2.3 玩家可见性的正式来源优先级

本 Slice 不通过“字段看起来像玩家可见”来猜可见性。

优先级如下：

1. 已有正式 player-facing contract / presentation 语义；
2. choice execution 中 `ChoiceFeedbackModel.player`；
3. Headless session 实际返回给玩家层的 event / choices / presentation；
4. 只有在正式 UI/contract 明确公开时，才允许从 state 派生 visible delta。

`ChoiceFeedbackModel.hidden`、`diagnostic`、raw effects、oracle score、engine-only state 不得通过 projector 泄漏。

---

## 3. Phase 0 架构：Observable Projection Boundary

Phase 0 的设计对象不是一个新 simulation system，而是一个**投影边界**：

```text
Headless Runtime
    │
    ├── Engineering / Experience Trace（内部，可能含 hidden/oracle）
    │
    └── Player-facing responses / presentation
              │
              v
    Observable Projector
              │
       ┌──────┴────────┐
       v               v
ObservablePayload   ExperimentEnvelope
Reviewer 可见       Orchestrator / provenance
```

### 3.1 `ObservablePayload`

`ObservablePayload` 是 Experience Reviewer 默认唯一可读的 run 内容。

建议语义：

```json
{
  "transcriptVersion": "player-observable-v1",
  "transcriptId": "opaque-reviewer-scoped-id",
  "visibleCharacterContext": {
    "background": "...",
    "publicTraits": ["..."]
  },
  "entries": [
    {
      "entryId": "opaque-entry-id",
      "step": 12,
      "age": 18,
      "kind": "story_event | choice | active_action | summary | acknowledgement | other",
      "title": "...",
      "body": "...",
      "visibleChoices": [
        { "choiceRef": "...", "label": "..." }
      ],
      "selectedChoiceRef": "...",
      "visibleOutcome": "...",
      "visibleImpacts": [
        { "kind": "stat | relationship | route | flag | risk_hint", "label": "...", "change": "..." }
      ],
      "visibleAcknowledgement": "...",
      "visibleMilestoneOrPhase": "..."
    }
  ]
}
```

设计规则：

- `transcriptId` / `entryId` 对 Reviewer 是 opaque ref，只用于证据引用；
- 不使用 seed、personaRef、policyRef 或 arm identity 作为 Reviewer 可见 ID；
- `visibleCharacterContext` 只包含游戏内已经公开的人物背景，不包含 Headless persona 策略；
- 字段没有实际玩家可见来源时就省略，不使用 hidden state 补全故事；
- transcript 必须保留真实时间顺序，不能为了让故事“更好读”重新编辑事件顺序。

### 3.2 `ExperimentEnvelope`

所有实验与 provenance 元数据进入独立 envelope：

```json
{
  "envelopeVersion": "...",
  "runRef": "...",
  "sourceFingerprint": "...",
  "configFingerprint": "...",
  "seedRef": "...",
  "personaRef": "...",
  "policyRef": "...",
  "policyVisibilityBoundary": "player_only | uses_hidden_oracle | other",
  "endAge": 30,
  "armRef": null,
  "observablePayloadHash": "..."
}
```

Phase 0/1 中 Experience Reviewer 不读取该 envelope。

`policyVisibilityBoundary` 必须明确记录当前 Headless policy 是否使用 hidden/oracle 信息。它的存在是为了限制结论外推：即使 transcript 是玩家可见的，如果选择本身由 oracle 产生，Reviewer 也不能据此证明真人会做同样选择。

### 3.3 Projector 的核心安全规则

Player-observable projector 必须是确定性程序，不是 LLM。

它负责：

- 从正式 player-facing outputs 构造 transcript；
- 丢弃 hidden/oracle 字段；
- 生成稳定 evidence refs；
- 规范化纯技术噪音；
- 对无法确认可见性的字段 fail closed：不输出，而不是猜测。

它**不负责**：

- 总结人生；
- 判断体验好坏；
- 修正文案；
- 解释因果；
- 根据 Reviewer 需要补充 hidden data。

### 3.4 Transcript completeness 不是“字段越多越好”

Phase 0 的完整性标准是：

> Reviewer 所评审的体验维度需要什么玩家可见证据，就必须能够在 transcript 中追溯到什么；同时不能通过泄漏 hidden 信息换取“更完整”。

因此应针对预期 Phase 1 类别做 capability matrix，例如：

| 体验类别 | 当前 transcript 是否有足够证据 | 允许结论 |
|---|---|---|
| 局部前后矛盾 | 是 | 可评审 |
| 机械重复 / 节奏 | 是 | 可评审 |
| 可见选择反馈 | 有 choice + player feedback 时 | 可评审 |
| 玩家是否感到选择改变人生 | 需要跨 entry 可见因果证据 | 有条件 |
| 真人是否理解、犹豫、情绪投入 | Headless 不足 | `requires_player_study` |

这张 matrix 是 Reviewer 允许判断范围的一部分，不要求 transcript 为所有未来问题一次性扩容。

---

## 4. Reviewer Invocation Boundary

Reviewer 的隔离不能只靠“你现在是 Reviewer”这句话。

每次 Reviewer invocation 必须绑定：

```text
model/provider/version
system prompt hash
review prompt/template hash
context-builder hash
ObservablePayload hash list
finding schema version
sampling policy
invocation id/time
raw review hash
structured findings hash
```

### 4.1 Reviewer 默认权限

Phase 1 Reviewer：

- 无 repository；
- 无 shell；
- 无网络；
- 无 candidate / config；
- 无 `ExperimentEnvelope`；
- 无 Planner；
- 无其他 Reviewer 的结论；
- 只读本次显式提供的 `ObservablePayload` 与固定 rubric/instructions。

日志中的任何 instruction-like 文本都必须视为被评审的数据，而不是指令。

### 4.2 Reviewer 输出

Reviewer 同时保存：

1. raw natural-language review；
2. minimal structured findings。

finding 至少包括：

```json
{
  "findingId": "...",
  "dimension": "...",
  "severity": "low | medium | high | critical",
  "confidence": 0.0,
  "summary": "...",
  "evidence": [
    {
      "transcriptRef": "...",
      "location": "entry-id",
      "observation": "..."
    }
  ],
  "whyItMatters": "...",
  "evidenceLimit": "none | partial | requires_player_study"
}
```

还必须允许 run-level：

```text
no_material_finding
insufficient_evidence
out_of_scope
requires_player_study
```

**Reviewer 不输出 `changeHypothesis`。**

---

## 5. Phase 0 Acceptance Gate

Phase 0 不要求证明 Reviewer 有用，只证明“仪器看到的数据是对的”。

### 5.1 必须验证

- 同一 run 可以确定性重建同一 `ObservablePayload`；
- `ObservablePayload` hash 与 envelope 中的 hash 一致；
- 人工 spot-check 能从正常玩家路径验证 title/body/choices/selected choice/player feedback/presentation 的投影没有歪曲；
- hidden effects、oracle score、raw flags/lifeStates、seed、internal persona/policy 不出现在 Reviewer payload；
- choice feedback 只使用正式 `player` visibility 语义；
- prompt-injection fixture 作为普通文本进入 payload，不影响构造器；
- projector 对未知 visibility fail closed；
- exact input/source artifacts 有内容 hash，不能只依赖包含 untracked 文件名而不包含字节内容的 `git status`。

### 5.2 Phase 0 决策

允许：

```text
accepted
rejected
blocked
insufficient_evidence
```

若 transcript 不能支持某一体验类别，应缩窄 Phase 1 的允许类别，而不是向 payload 塞 hidden state。

Phase 0 `accepted` 只授权进入 Reviewer calibration 的独立决策，不授权任何 candidate/config 修改。

---

## 6. Phase 1：Reviewer Calibration Design

Phase 1 的目标不是找“最好的 prompt”，而是回答：

> 某个冻结的 Reviewer configuration 在哪些体验类别上值得被当作一个受约束传感器？

### 6.1 Reviewer configuration 是资格判断单位

资格绑定：

```text
model/provider/version
+ system/review prompt
+ context builder
+ finding schema
+ sampling policy
```

不能说“GPT-X 已通过 Reviewer 校准”，只能说某一个具体 fingerprint 组合在某些类别上通过。

### 6.2 Calibration corpus 必须分层

#### `calibration-development`

用途：开发 Reviewer。

- 可见；
- 可用于 prompt/context/schema 调整；
- 可以反复运行；
- 不作为最终 qualification 证据。

#### `sealed-qualification`

用途：判断 Reviewer 是否获得资格。

- qualification 前封存；
- Reviewer 开发过程不可读取标签/预期；
- 不用于 prompt 调优；
- 结果一旦反馈并参与下一轮调优，该集合立即退休或降级为 development。

未来需要重新 qualification 时，要使用仍未暴露的新 sealed set，或重新建立足够独立的 qualification material。

### 6.3 Gold corpus 的最小组成

每个被授权评审的问题类别，应尽量覆盖：

- historical real defects；
- synthetic-but-natural known-bad；
- healthy hard negatives；
- ambiguous/disagreement cases；
- insufficient-evidence cases；
- prompt-injection / instruction-like text；
- 不同长度、年龄阶段和公开人物背景。

人工工作只用于这个小规模“仪器校准集”。建议两名独立标注者 + 分歧仲裁；不把该流程带入每轮自动进化。

### 6.4 初期建议只校准可被 transcript 直接观察的类别

第一版不应为了显得全面同时校准所有“好玩”维度。

优先类别：

- coherence / contradiction；
- repetition；
- pacing anomaly；
- visible feedback sufficiency；
- local visible causality / acknowledgement；
- plausibility（仅限文本中有充分证据的明显问题）。

暂不把以下内容作为 Reviewer 可以证明的事实：

- 真人是否觉得整体好玩；
- 真人是否真正理解系统；
- 情绪投入；
- 长期 replay desire；
- 没有 player-observable evidence 支撑的 hidden causal correctness。

### 6.5 Calibration report

确定性程序负责计算已定义统计：

- evidence citation correctness；
- precision / recall；
- healthy-control false-positive rate；
- repeated-call consistency；
- abstain correctness；
- ambiguous-case overclaim rate；
- prompt-injection resistance。

每个问题类别独立报告，不把多个类别平均成一个“总分”。

样本不足时报告 uncertainty / insufficient evidence，不为了获得 accepted 强行给结论。

### 6.6 阈值冻结时机

本 design 不发明固定数字。

在正式 implementation plan 前，必须先基于：

1. gold label 的人工一致性；
2. development baseline；
3. false-positive / false-negative 的产品成本；

冻结 qualification 阈值和 repeated-call policy。

**阈值必须在 sealed qualification 解封前冻结。**

否则仍然存在“看完考试成绩再定及格线”的污染。

---

## 7. Phase 1 Acceptance Gate

Phase 1 的裁决必须按类别，而不是只有一个 Reviewer 总 verdict。

示意：

```text
coherence            qualified
repetition           qualified
visible_feedback     qualified
local_causality      insufficient_evidence
plausibility         rejected
```

允许整体结果：

- `accepted_for_scoped_dimensions`；
- `rejected`；
- `blocked`；
- `insufficient_evidence`。

### 7.1 可以进入 Phase 2 的最低语义

只有当至少存在一组对产品有实际价值的问题类别满足：

- evidence 引用可信；
- healthy control 误报在冻结范围内；
- repeated calls 稳定；
- 能合理 abstain；
- prompt-injection fixture 不改变角色行为；
- qualification set 未被用于开发；

才值得进入 Blind Pair / branch-divergence 语义验证。

### 7.2 失败时的正确动作

- 某些类别通过：只授权这些类别，其他类别保持 out-of-scope；
- Reviewer 整体不稳定：停止自动飞轮后续建设；
- Transcript 证据不足：回到 Phase 0 修正 player-visible contract；
- 只有换更复杂 Agent 编排才能“看起来通过”：不接受，说明核心传感器假设尚未成立。

---

## 8. Artifact 与最小信任模型

Phase 0/1 只需要匹配当前威胁模型的 provenance，不建设最终密码学基础设施。

必须做到：

- exact input bytes 可内容寻址；
- `ObservablePayload`、envelope、prompt、schema、model config、raw review、structured findings、calibration labels/report 都有 hash；
- artifact 不覆盖既有 run；
- Reviewer 输入访问范围可记录；
- qualification corpus 暴露状态可追踪。

本 Slice 不要求：

- Merkle transparency log；
- 外部第三方签名服务；
- 通用 artifact database；
- 跨仓库 attestation framework。

如果未来进入多 Agent 自动运行和 promotion，再按真实威胁模型升级 trust root。

---

## 9. 与 B1.0 的融合方式

### 9.1 直接继承

- Headless real scheduling；
- runtime catalog injection boundary；
- deterministic input/replay 思想；
- candidate 与 formal config 隔离；
- artifact 不写正式事件目录。

### 9.2 不直接继承为正式 Contract

- `b1-visible-trace-v1`；
- 原四项机械指标作为体验 objective；
- 原 B1.1 proposal/Pareto acceptance；
- 当前 B1 evidence chain 作为完整信任根。

### 9.3 当前实现边界中的一个待实施修正

现有 `WeightOverlayRuntimeCatalog` 位于正式 `src/core` 并反向依赖 `scripts/b1` 的实验类型，这是一个不理想的依赖方向。

它**不阻塞 Phase 0/1 design**，也不授权现在重构；未来真正需要继续使用实验 overlay 时，应让 `src/core` 只拥有 `RuntimeEventCatalog` port，把实验 overlay implementation 留在 evolution/B1 边界。

---

## 10. 解耦原则：现在不抽离，但让边界可抽离

本 Slice 仍然属于 Wuxia-Life 项目，不拆仓库、不建设通用 SDK。

但职责要保持两个方向：

### Game-side adapter

负责把 Wuxia-Life 的正式玩家可见语义投影成 `ObservablePayload`。

它可以知道：

- Wuxia-Life event / choice / feedback / milestone 的正式结构。

### Evolution-side evaluator

负责：

- Reviewer invocation；
- calibration corpus；
- qualification；
- artifact/provenance；
- findings schema。

它不应该依赖：

- 具体武侠事件 ID；
- 当前 UI component；
- `EventLoader` 全局 singleton；
- 某条 story line 的硬编码知识。

这已经足够让未来抽离成本较低；现在不引入 adapter framework、RPC、plugin system、通用 DSL。

---

## 11. 明确不在本 Slice 内

- Planner；
- PatchIntent；
- Scope Controller 新实现；
- candidate search；
- Blind Pair Verifier；
- branch-divergence evaluator；
- Population runner / Aggregate Reviewer；
- EvaluationTarget incidence implementation；
- Historian；
- 多轮自动循环；
- 自动写回配置；
- text/conditions/rewards action space；
- 正式 promotion；
- 人工玩家体验研究。

其中 `EvaluationTarget` 已在上位 proposal 中定义为 Phase 3 前必须闭合的 bridge contract，但本 Slice 只需要保证 transcript 的 evidence refs 未来可以被它引用，不实现 incidence。

---

## 12. 本 design 的最终停止条件

任何一项成立，都不得用增加 Agent 或扩大基础设施掩盖：

1. 无法从现有正式语义中稳定投影出足够的 player-observable transcript；
2. 要评价核心类别必须持续泄漏 hidden/oracle 信息；
3. Reviewer 在 healthy controls 上高误报且无法通过合理 prompt/context 校准改善；
4. Reviewer 无法稳定引用真实 evidence；
5. Reviewer 对 instruction-like event text 容易被 prompt injection 改变角色；
6. sealed qualification 与 development 无法保持独立；
7. 所有有价值的体验类别都需要真人主观测试才能判断，LLM 只能提供低价值表面检查。

命中这些条件时，正确结论是缩小或停止自动进化路线，而不是继续实现 Phase 2～8。

---

## 13. 本 design 通过后，下一步是什么

本文通过只意味着：

> 可以为 **Phase 0** 编写 implementation plan。

不是同时授权 Phase 1 实施。

推荐执行顺序：

```text
Approve this design
→ 写 Phase 0 implementation plan
→ 实施 / 验证 Phase 0
→ Human/Governance Phase 0 decision
→ accepted 后，再为 Phase 1 写独立 implementation plan
```

Phase 0/1 共用 design，是为了保持 Contract 一致；执行拆开，是为了保留真正的 stop gate。

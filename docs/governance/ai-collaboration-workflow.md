# Wuxia-Life AI Collaboration & Agent Workflow Protocol

> 用途：规定项目开发协作，以及 Auto Evolution 产品运行时 Role / Participant / Skill / Report / Contract 的职责与边界。  
> 最后更新：2026-08-29。
> 第一层产品语义以 `docs/product/auto-evolution-model.md` 为准。

---

## 1. 两个层次不要混淆

### A. 项目开发协作

Human、ChatGPT、Codex 如何共同开发 repository。

### B. Auto Evolution 产品 workflow

产品如何把真实问题交给 Role / Participant 处理。

ChatGPT / Codex 可以承担某些 Role，但具体模型、provider 或 harness 不构成长期产品语义。

## 2. Auto Evolution 基本模型

> **Role 是工作，Participant / Agent 是完成工作的人或外部系统，Orchestrator 负责编排工作而不替 Participant 处理具体领域问题。**

### 2.1 Orchestrator

负责：

- dispatch Role；
- 调用 Participant；
- context / evidence references；
- read / write permission；
- provenance；
- output contract；
- workflow state；
- budget / retry；
- `CONTINUE / SKIP / DEFER / ESCALATE / STOP`；
- 正式 Decision Router outcome 后按机械规则创建 Human follow-up work item；
- retained provenance 与异步 Human review handoff；
- 前后工作交接。

不负责：

- 领域专用调查逻辑；
- 替 Agent 判断根因；
- 构造 gold answer；
- 建立长期 Participant 智能评分器。

### 2.2 Investigation / Solution Participant

读取 Problem Package 与被授权的 repository / source / evidence，自主调查并形成 `0..N` 方案。

允许返回：

```text
OPTIONS
NO_PROPOSAL
INSUFFICIENT_EVIDENCE
```

### 2.3 Reviewer Participant

Reviewer 是独立 Participant，不是 gold-answer checker。

合法结果包括：

```text
ACCEPT
REJECT
REQUEST_MORE_WORK
DEFER
ESCALATE
```

### 2.4 Skill

Skill 是 Participant 可复用工作方法。

正式 invariant：

1. 不授予 authority / permission；
2. 不定义 workflow state；
3. 不定义 output contract；
4. 不要求 Orchestrator 理解问题领域。

当前第一 Skill `repository-grounded-investigation` v1 已在 Solution 与 Reviewer 的真实 workflow 中完成使用验证，因此视为可用。

当前不要求通过 Skill-off / Skill-on behavioral A/B 证明它“主观答案更好”才能继续使用。

如果真实运行出现明确问题，再围绕问题修 Skill。

### 2.5 Execution Participant / Runtime

只执行被允许进入 execution 的 work。

普通自动写范围优先为配置层。

程序 / Runtime / Framework / Contract / Schema 级修改：

```text
STOP
→ ESCALATE TO HUMAN
```

## 3. Problem Package

Problem Package 是引用和权限载体，不是领域分析结果。

它应表达：

- problem；
- source；
- authority / evidence refs；
- tools；
- read / write permission；
- STOP / escalation boundary。

> **Package references evidence; Agent interprets evidence.**

## 4. Run Report / Operational Observability

Sidecar Run Report 已是当前可用的旁路 observability capability。

它从已有 workflow state / artifacts 中整理运行事实，例如：

- run / round；
- 本轮处理的问题；
- workflow outcome；
- 是否执行修改；
- continue / skip / defer / escalate / stop 原因。

它当前不负责：

- 评价 Participant 主观质量；
- 分析长期模式；
- 自动干预；
- 控制主流程。

核心边界：

> **没有 Report Analysis，主流程照样运行；Report Producer 也不应成为 Skill 的依赖。**

当前下一 bounded workflow work 由 `docs/governance/current-product-stage.md` 决定，目前是 Human Follow-up Loop v1 implementation planning / minimal slice。

## 5. Future Report Analysis

未来如果报告积累后值得系统化分析，可以新增独立 Consumer / Participant。

它只消费兼容报告，不关心报告来自：

- 当前 Auto Evolution；
- 其他系统；
- 人工复制粘贴。

当前不建设。

## 6. Participant Communication Contract

Contract 的目标是减少 Participant 间的通信误会。

它应从真实多轮运行中逐步归纳，并优先固定：

- schema；
- field semantics；
- authority / provenance / references；
- fact / evidence / inference / opinion / unknown；
- workflow outcome；
- participant failure；
- permission / STOP。

继续遵守：

> **纠正通信，不纠正思想。**

Contract 不规定 Participant 必须得出哪个主观结论。

MCP 可以未来作为 transport / tool protocol 的实现候选，但当前不把“上 MCP”当产品目标。

## 7. 正常异常与容错

以下继续是正常 workflow outcome：

```text
NO_PROPOSAL
INSUFFICIENT_EVIDENCE
REVIEW_REJECTED
SKIP
DEFER
PARTICIPANT_FAILURE
OUT_OF_SCOPE
ESCALATE
STOP
```

系统不得为了保持“每轮成功”伪造结果或强迫下游接受。

## 8. 项目开发协作

### ChatGPT

主要负责：

- 产品方向；
- 架构 / 风险判断；
- Drift Guard；
- 正式设计；
- implementation plan；
- Codex task definition；
- read-only review。

应特别避免：

- 在真实问题出现前穷举验证所有模型质量风险；
- 因为某模块已经存在就继续扩建；
- 把 Report / Analysis / Skill / Contract 一次性做成强耦合平台。

### Codex / 其他工程 Runtime

主要负责：

- 读取 repository authority；
- 核对真实实现；
- 在授权范围实施；
- tests / verification；
- runtime artifacts；
- changed files / deviations report。

Codex 不一定能访问 Project Sources，因此 repository 文档必须独立承载当前产品方向。

### Human

负责：

- 最终产品方向；
- 新产品边界；
- 高风险 / code-level escalation；
- 结构性异常；
- 必要 final review；
- 真实运行中决定是否值得干预。

Human 可以异步集中 review 已正式 routed 为 `ESCALATE_HUMAN` 的 work items。Human work item 只是 operational workflow state；`READY_FOR_FORMAL_TASK` 仍需进入已有 Human Gate / accepted-design / implementation authorization 流程，不自动授予 code write permission 或产品 / 治理 authority。

Human 不需要逐项给 Participant 的主观答案打“正确 / 错误”标签。

## 9. Human Gate 与授权继承

长期原则：

> **默认继续，越界才停。**

Accepted design 后，如果 implementation 未新增产品假设、扩大 scope、修改第一层规范、改变 accepted boundary 或跨越 STOP，planning / implementation 自动继承授权。

Human follow-up lifecycle 不改变上述授权继承规则。work-item state 不自动产生 product authority；正式改进仍按已有 Human Gate、accepted design 与 implementation authorization 处理。

## 10. Product Direction Drift Guard

复杂工作至少检查：

1. 当前工作解决哪个真实产品 / workflow 问题？
2. 是真实运行暴露的问题，还是预测出来的可能问题？
3. 是否能让现有 Agent / Runtime 临时处理，而不增加 framework？
4. 是否把可独立模块强耦合了？
5. 是否把主观 Participant quality 错当成 gold-answer 工程问题？
6. 如果 Participant 换成人，这个 Role / Contract 仍然合理吗？

警示：

```text
局部工程自洽 ≠ 产品方向正确
辅助系统更复杂 ≠ 产品更好
一次实验有效 ≠ 必须平台化
没有评测分数 ≠ 系统不可用
```

## 11. Governance 与运行日志分离

`current-product-stage.md` 只记录 authority 状态，不记录每轮执行流水。

真实 flywheel 运行详情进入独立 artifacts / sidecar report。

Human follow-up work-item state 属于 operational state，应与 retained provenance 一起由后续 runtime 设计承载；governance documents 仍不是 backlog database。以后如果出现 Human Control Surface，它读取运行 artifacts / operational state，而不是把 governance 文档当数据库。

## 12. 当前阶段引用

具体阶段顺序以 `docs/governance/current-product-stage.md` 为准。当前仍处于 RUN / OBSERVE；下一 bounded workflow work 是 Human Follow-up Loop v1 implementation planning / minimal slice。Full P3 remains `DEFERRED`，当前 `NO_BOUNDED_P3_SLICE_JUSTIFIED` 不变。

当前非优先：

- Skill behavioral A/B；
- second Skill / Skill ecosystem；
- Report Analysis；
- Human Control UI；
- MCP platform；
- autonomous code modification。

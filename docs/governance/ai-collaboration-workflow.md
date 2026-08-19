# Wuxia-Life AI Collaboration & Agent Workflow Protocol

> 用途：同时规定 Wuxia-Life 项目开发协作，以及 Auto Evolution 产品运行时 Role / Participant / Orchestrator 的职责、权限和升级边界。  
> 最后更新：2026-08-17。  
> 第一层产品语义以 `docs/product/auto-evolution-model.md` 为准。

---

## 1. 两个层次不要混淆

本项目同时存在两类“AI 协作”。

### A. 项目开发协作

Human、ChatGPT、Codex 如何一起开发 Wuxia-Life repository。

### B. Auto Evolution 产品 workflow

Wuxia-Life 如何在运行中的飞轮里，把未知产品问题交给不同 Role / Agent 处理。

当前 ChatGPT / Codex 可以承担产品 workflow 中的某些 Role，但具体模型或 harness 不构成长期产品语义。

---

## 2. Auto Evolution 基本模型

长期原则：

> **Role 是工作，Participant / Agent 是完成工作的人或外部系统，Orchestrator 负责编排工作而不替 Participant 处理具体领域问题。**

### 2.1 Orchestrator

负责：

- dispatch Role；
- 调用 Participant；
- 组织 context / evidence references；
- 控制 read / write 权限；
- 维护 provenance；
- 验证 output contract；
- 维护 workflow state；
- 执行调用预算与 retry policy；
- `CONTINUE / SKIP / DEFER / ESCALATE / STOP`；
- 把前一步输出交给下一步。

默认不负责：

- 根据 money / marriage / combat 等领域决定调查算法；
- 替 Agent 判断根因；
- 为具体问题建设专用 analyzer；
- 替 Agent 形成产品方案；
- 为主观产品判断构造 gold answer。

### 2.2 Investigation / Solution Participant

负责：

- 读取 Problem Package；
- 阅读被授权的 repository / source / evidence / artifacts；
- 自主理解问题；
- 必要时使用通用工具进行调查；
- 形成 `0..N` 个方案；
- 说明依据、trade-off、风险、未知；
- 在有依据时推荐方案；
- 没有可靠方案时返回 `NO_PROPOSAL / INSUFFICIENT_EVIDENCE`。

Agent 可以在其工作空间内写临时分析代码或运行诊断，但一次性的调查方法不自动升级成 Orchestrator capability。

### 2.3 Reviewer Participant

Reviewer 是独立 Participant，不是 gold-answer checker。

负责判断：

- 方案是否针对当前问题；
- 依据是否足够；
- 是否存在明显风险或未处理假设；
- 是否跨越写权限 / 产品边界；
- 是否值得进入当前允许的执行范围。

合法输出包括：

```text
ACCEPT
REJECT
REQUEST_MORE_WORK
DEFER
ESCALATE
```

多个方案全部被拒绝是合法结果。

### 2.4 Execution Participant / Runtime

只执行已经被允许进入执行阶段的 work。

当前默认自动写入范围优先限制在：

> **配置层修改。**

如果实际需要修改程序、Runtime、Framework、正式 Contract / Schema：

```text
STOP
→ ESCALATE TO HUMAN
```

不得静默扩大 scope。

---

## 3. Problem Package 与信息边界

Problem Package 是轻量的引用 / 权限载体。

它应告诉 Agent：

- 当前问题是什么；
- 问题从哪里观察到；
- 可以读哪些 authority / source / evidence；
- 可以使用哪些工具；
- 当前写权限；
- STOP / escalation boundary。

它不应该提前替 Agent 完成领域分类和根因分析。

长期原则：

> **Package references evidence; Agent interprets evidence.**

Orchestrator 要保证的是“给对信息、不给越权信息”，不是“替 Agent 把问题想明白”。

---

## 4. 正常异常与容错

Auto Evolution 不采用只有 SUCCESS / FAILURE 的模型。

以下结果属于正常 workflow：

### NO_PROPOSAL

Agent 没有形成可靠方案。

处理：`SKIP / DEFER`。

### INSUFFICIENT_EVIDENCE

Agent 认为证据不足。

Agent 可以在已有 read/tool 权限内继续调查；仍不足时可以 `DEFER / ESCALATE`。

不默认要求 Orchestrator 开发新的领域专用 evidence capability。

### REVIEW_REJECTED

Reviewer 不接受任何方案。

处理：`SKIP / DEFER`，或者在已授权预算内 `REQUEST_MORE_WORK`。

### OUT_OF_SCOPE

方案需要超出配置层 / 当前权限。

处理：`ESCALATE TO HUMAN`。

### PARTICIPANT_FAILURE

按当前 budget / retry policy 处理，可以 retry、换 Participant、skip、defer 或 escalate。

系统不得伪造结果或为了“保持飞轮运行”强迫下游接受失败输出。

---

## 5. Configuration / Code Escalation Gate

当前希望 scale 的普通自动迭代：

```text
Agent proposal
↓
Independent Agent review
↓
accepted configuration change
↓
automatic execution / verification
↓
real rerun
```

程序级工作是例外路径：

```text
Agent determines code change is required
↓
ESCALATE TO HUMAN
↓
Human may authorize a separate engineering task
```

单次 Human 授权只覆盖该项工作，不自动扩大未来 flywheel 权限。

---

## 6. 项目开发协作

### ChatGPT

当前主要负责：

- 产品方向分析；
- 风险与架构判断；
- Product Direction Drift Guard；
- 正式产品设计；
- implementation planning；
- Codex 任务定义；
- 完成后的只读 review。

ChatGPT 在设计 Auto Evolution 框架时，不应因为遇到某个具体游戏问题，就把该问题的解决逻辑固化进 Orchestrator。

优先问：

> “这个问题应交给哪个 Role，并给 Agent 什么 authority、context、tools 和权限？”

而不是：

> “框架应增加哪个领域模块才能解决它？”

### Codex / 其他工程 Runtime

当前主要负责：

- 读取 accepted design / plan；
- 核对真实 repository；
- 在授权范围内实施；
- 测试与验证；
- 生成 runtime artifacts；
- 报告 changed files、verification 和 deviations。

未来同一个 Codex Runtime 也可以作为 Investigation、Reviewer 或 Execution Participant；具体取决于 Role。

### Human

当前负责：

- 最终产品方向；
- 接受 / 拒绝新的正式产品边界；
- 代码级 / 高风险 escalation；
- 结构性异常；
- 当前仍保留的 final Human Gate；
- Git / 发布 / 必要回滚。

长期目标是让普通配置层迭代逐步不再结构性依赖 Human，Human 主要处理例外和高风险工作。

---

## 7. Human Gate 与授权继承

长期原则继续保持：

> **默认继续，越界才停。Human Gate 保护产品决策，不保护每一个工程动作。**

正常复杂项目开发任务：

```text
正式产品设计
→ Human ACCEPTED
→ implementation plan + Codex execution（授权继承）
→ verification
→ Human final review
→ ACCEPTED / CLOSED
```

Accepted design 后，只要 implementation 没有：

- 新增产品假设；
- 扩大 scope；
- 修改第一层产品规范；
- 改变 accepted boundary；
- 跨越 STOP；

则 planning 和 implementation 自动继承授权。

---

## 8. 必须重新找 Human 的情况

包括：

- 新产品假设；
- 第一层产品规范变化；
- accepted design 必须改变；
- scope 扩大；
- 超过预授权 external-call budget；
- 新 provider / participant 超出授权；
- 跨越 STOP；
- 从配置层升级到程序 / Runtime / Framework 修改；
- 当前边界内无法解决的结构性 blocker。

普通工程 bug、fixture、测试、typecheck 和 accepted scope 内实现选择不构成 Human Gate。

---

## 9. Product Direction Drift Guard

复杂 / 产品性 / 架构性工作开始和结束时至少检查：

1. 这项工作如何让 Wuxia-Life 或其演化 workflow 更接近第一层产品目标？
2. 是否引入了未经授权的新产品假设？
3. 如果这是一个具体领域问题，为什么需要框架代码而不是让 Agent 自己调查？
4. 如果 Participant 换成真人，这个 Role / boundary 仍然合理吗？
5. 是否只是因为已有实现 / 已投入很多而继续？
6. 是否把一次 Agent 工作方法错误升级成长期基础设施？

出现以下信号应停下来检查：

```text
局部工程自洽 ≠ 产品方向正确
辅助框架变强 ≠ 游戏变好
一次实验有效 ≠ 应成为长期 module
Agent 没有答案 ≠ 框架必须补一个 analyzer
```

---

## 10. Governance 与运行日志分离

`current-product-stage.md` 只记录有 authority 意义的状态：

- active / closed / stopped；
- accepted boundary；
- 当前 STOP；
- Human acceptance；
- 下一项是否授权。

不要记录每一步 Agent 执行流水。

未来的 flywheel observability UI 应读取独立 runtime artifacts / event log，而不是把治理文档当运行数据库。

---

## 11. 当前短模板

给 Codex / Agent 的任务应优先包含：

```text
Role
Problem / Goal
Authority references
Allowed context / tools
Read / write permissions
Output contract
Call / retry budget
STOP / SKIP / DEFER / ESCALATE boundary
```

不要在 Orchestrator task 中提前写入领域结论或要求 Participant 得出预期答案。

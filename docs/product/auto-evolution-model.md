# Wuxia-Life Auto Evolution 产品模型

> 状态：当前权威规范  
> 日期：2026-08-29 Human Follow-up Loop v1 Authority Closure
> 发生冲突时，Auto Evolution 产品语义以本文件为准。历史 Phase、实验 PRD / plan、领域专用 investigation 路线不得覆盖本文件。  
> 与 `docs/product/player-model.md` 同属第一层产品规范。

---

## 1. 当前产品定位与成熟度

Wuxia-Life 的目标是改进游戏产品本身。

Auto Evolution 是：

> **面向产品演化的轻量 Agent Workflow Orchestrator。**

截至 2026-08-20，核心 workflow 已经通过多轮真实运行证明能够：

- 把问题交给不同 Role / Participant；
- 让 Agent 自主调查与形成方案；
- 让独立 Reviewer 审核；
- 承载 `SKIP / DEFER / ESCALATE / PARTICIPANT_FAILURE`；
- 把 accepted configuration work 进入受控执行、验证和 modified-runtime rerun；
- 把第一项可复用 Skill 真实交付给 Solution 和 Reviewer。

因此当前不再把 Auto Evolution 定义为“核心概念是否成立”的纯探索项目。

更准确的阶段是：

> **早期可运行 / 工程化阶段：让已有 workflow 持续运行、旁路可观察，并从真实运行中继续收敛。**

正常 repository-host 操作是通过 operator wrapper 跑一次 ordinary natural AE session（当前入口：`npm run evolution:operator:run`）。这是执行宿主 packaging，不是新的产品语义层，也不是最终 Human-facing AE Skill；Skill 未来可以调用这个稳定 host primitive。Canonical Participant binding 必须显式声明（当前默认 `CODEX_CURRENT`），不得依赖 previous-run inheritance。运行后的 Human 操作入口仍是 `artifacts/evolution/index.md`。

长期原则继续保持：

> **Orchestrator owns workflow. Agents own reasoning.**

这不代表以下事项已经证明：

- 多轮自动连续执行已稳定；
- Participant 主观输出存在统一质量分数；
- Game 与 Auto Evolution 已完成物理拆分；
- 世界观可无成本替换；
- 通信 Contract 已最终定型；
- Report Analysis / Human Control Surface 已经需要建设。

## 2. 核心抽象

### 2.1 Orchestrator

Orchestrator 负责：

- Role 调度；
- Participant 调用；
- context / evidence references；
- read / write permission；
- provenance 与 artifact identity；
- output contract；
- workflow state；
- retry / budget；
- `CONTINUE / SKIP / DEFER / ESCALATE / STOP`；
- 前后步骤的可靠交接。

Orchestrator 不负责替 Agent 解决具体领域问题。

如果实现开始依赖：

```text
if problemType === money
if problemType === marriage
if problemType === combat
```

应首先检查 Product Direction Drift。

### 2.2 Role

Role 表示“需要完成什么工作”。

当前已经稳定到足以支撑真实 workflow 的角色形态包括：

- 问题 / 改善机会形成；
- Investigation / Solution；
- Independent Reviewer；
- Decision / routing；
- allowed Execution；
- verification / rerun。

Role 可以继续微调，但当前不再以“不断发现新角色”作为主要研发路线。

### 2.3 Participant / Agent

Participant 是完成 Role 的外部实体，可以是 LLM、Human、Agent Runtime 或其他系统。

```text
Role = 工作
Participant = 完成工作的人或外部系统
```

Participant 可以在授权范围内：

- 搜索源码；
- 阅读 repository；
- 检查 artifacts；
- 运行允许命令；
- 写临时调查脚本；
- 比较方案；
- 返回 `NO_PROPOSAL / INSUFFICIENT_EVIDENCE`。

一次 Agent 工作的临时方法不自动成为 framework capability。

### 2.4 Skill

Skill 是：

> **Participant 可复用的一套工作方法包。**

Skill 的首要产品价值是把已经认可、反复使用的方法固定下来，使其：

- 不必每次重新描述；
- 可以稳定交付；
- 可以跨 Participant / Role 复用；
- 可以保留 identity / version / provenance。

Skill 不是基础模型智能的替代，也不承诺“使用后主观答案一定更好”。

正式 invariant：

1. Skill 不授予 authority 或 permission；
2. Skill 不定义 workflow state 或 output contract；
3. Skill selection 不得要求 Orchestrator 理解具体问题领域；
4. Skill 优化默认由真实运行暴露出的具体问题驱动，而不是在无实际问题时优先做主观 behavioral A/B。

第一 Skill `repository-grounded-investigation` v1 已在 Solution / Reviewer 的真实 workflow 中使用，因此当前视为可用能力。

### 2.5 Problem Package

Problem Package 是轻量的信息与权限包，不是领域模型。

它表达：

- 当前问题 / improvement candidate；
- 来源；
- 可读 evidence / artifact / repository authority；
- tools；
- read / write permission；
- STOP / escalation boundary。

长期原则：

> **Problem Package references evidence. Agent interprets evidence.**

Evidence handoff 分层（PD-111）：

- External Feedback / Improvement Hypothesis 只看到 player-observable evidence；
- 选中 hypothesis 之后，Orchestrator 可派生 bounded internal causal-attribution diagnostic，并仅交给 Solution / Reviewer；
- raw Phase0 `internal/player-surface-source.json` 仍禁止进入 Participant workspace；
- diagnostic provenance ≠ player-visible evidence，也不等于完整因果解释。

Active Problem Package 使用 `problem-package-v2`（含 `diagnosticEvidenceRefs`）；历史 `problem-package-v1` 仍可被契约接受。Human Follow-up escalation 在 v2 时保留 diagnostic evidence。
### 2.6 Run Report / Operational Report

Run Report 是旁路观察 artifact，不是新的核心 reasoning Role。

第一阶段只需要让 Human 能看懂：

- 哪一轮运行；
- 发现 / 处理了什么问题；
- workflow outcome；
- 是否执行了已授权修改；
- 为什么继续、跳过、延后、升级或停止。

核心 invariant：

> **主流程不依赖 Report 才能运行。**

Report Producer 不应理解某个具体 Skill 或领域问题，也不在第一阶段自动分析“做得好不好”。

Report schema 在对应最小切片设计时定义，不在本产品模型提前穷举。

### 2.7 Human Follow-up Loop / asynchronous review

正式 `decision.route == ESCALATE_HUMAN` 后，发现不能只停留在一次 run artifact 中。它进入一个轻量、足以支持异步复核的 Human work-item lifecycle。

Human work item 是 downstream workflow state，不是新的 reasoning Role、Participant 或 product / governance authority system。

创建责任固定为：正式 Decision Router outcome 产生后，由 Orchestrator / Host 按机械 workflow rule 创建。Solution Participant、Reviewer Participant 和 Run Report Producer 没有独立创建 authority；Reviewer 的自然语言意见不能绕过 Decision Router 创建正式 work item。

v1 的自动创建入口只有 `decision.route == ESCALATE_HUMAN`，包括明确要求 Human 判断以及超出 configuration authority 的正式 routed outcome。`DEFER`、`DEFER_MORE_WORK_REQUESTED`、`PARTICIPANT_FAILURE`、`SKIP`、`NO_PROPOSAL` 与 `INSUFFICIENT_EVIDENCE` 本身不自动创建 Human work item；它们可以成为后续 evidence review 的观察信号，但不把普通失败或不确定性全部转嫁给 Human。

普通 unresolved Human work item 不阻塞 RUN / OBSERVE 主循环：

```text
RUN / OBSERVE → continue unless an existing STOP / fail-closed boundary is hit
```

v1 lifecycle 至少表达以下 disposition：

```text
OPEN
INVESTIGATING
DEFERRED
REJECTED
READY_FOR_FORMAL_TASK
CONVERTED
```

`READY_FOR_FORMAL_TASK` 只表示 Human 判断该事项值得进入正式产品、engineering 或 governance workflow；它不等于 implementation authorized、code write permission、Product Decision accepted 或 automatic execution authorization。正式改进仍须遵守已有 design、Human Gate、implementation planning 与 authority inheritance 规则。

Human asynchronous review 必须保留足以恢复判断的最小 structured provenance。work-item state 应以 sidecar / operational-state 形式跨普通 run 持续存在，并引用原始 run、workflow 和 decision；不能只依赖可能清理或不进入 project package 的 `.tmp/evolution/**`。已有 `human-review-package.md` 可以作为 evidence source，但不是 Human backlog 的 canonical state。具体 storage path、字段和 retention implementation 留给后续设计。

v1 允许用 deterministic identity 避免同一正式 decision 被机械重复创建，并可为同一 stable item 追加 occurrence provenance；不建设 semantic deduplication、embedding clustering 或 automatic issue classification。自然语言相似但 identity 不同的问题是否合并，仍由 Human / product judgment 决定。

## 2.8 RUN / OBSERVE Evidence Review Policy

阶段性 review trigger 与 evidence sufficiency 是两件事：

> **review trigger != evidence sufficient**

单次 evidence 命中已有 blocking / fail-closed 条件时，可以立即进入 Human review，例如 accepted invariant violation、STOP boundary、会使后续 observation 不可信的 provenance / evidence integrity 损坏，或继续运行会扩大已知错误。

重复 product / structural evidence、重复 Role / workflow failure 和 Human inbox pressure 的具体 v1 pilot cadence，以及 review 后回到 RUN / OBSERVE 的语义，记录在 PD-100；这些规则不把触发 review 等同于自动证明产品必须修改。

没有 product modification 一段时间，不能单独证明 workflow failure、产品问题或 authority expansion。只有与 repeated accepted-but-out-of-scope findings、重复 product problem 或 unresolved Human escalation 等 evidence 共同出现时，Human 才可以判断 permission boundary 是否形成真实 improvement bottleneck。

阶段性 Human review 后，blocking matter 进入已有正式流程；insufficient evidence 可以继续 `INVESTIGATING` / `DEFERRED`；rejected item 保留 provenance 但退出 active inbox；converted item 链接正式 task / design / governance work；non-blocking unresolved item 可以继续存在。Human backlog 不成为主 flywheel 的同步 gate，RUN / OBSERVE 正常恢复继续。

### 2.9 Future Report Analysis

Report Analysis 是未来可能存在的独立消费者。

它只消费报告，不要求报告必须来自：

- 某个 Skill；
- 某个 provider；
- Auto Evolution；
- 当前 repository。

因此人工提供或其他系统生成的兼容报告也可以成为输入。

当前不建设这一层。

## 3. 最小 evolution loop

当前目标工作流：

```text
真实运行
↓
player-observable evidence / problem
↓
Problem Package
↓
Investigation / Solution Participant
↓
Independent Reviewer
↓
Decision
├─ SKIP / DEFER
├─ ESCALATE TO HUMAN
│      ↓
│  Human Follow-up Inbox / work-item
│      ↔ asynchronous Human review
│      └─ READY_FOR_FORMAL_TASK → existing formal workflow
└─ accepted configuration work
       ↓
    Execution
       ↓
    verification
       ↓
    modified runtime real rerun
       ↓
    sidecar Run Report
       ↓
    next-round entry
```

注意：`ESCALATE TO HUMAN` 不再是没有后续定义的 dead-end；其 work-item lifecycle 与 Human review 不同步阻塞主 RUN / OBSERVE loop。最后的“自动 next-round entry”仍是需要验证的能力，不应从单轮成功直接推断已经稳定。

## 4. Agent Owns Problem Solving

面对未知问题，默认方向是：

```text
提供正确 authority / source / evidence / permission
↓
让 Agent 自己处理
```

而不是给 Orchestrator 增加领域专用 analyzer。

只有某项能力在多个独立真实问题中反复出现，并形成稳定跨领域边界，才考虑升级 shared infrastructure / Skill。

## 5. 外部意见与质量边界

PD-055 继续完整有效。

Participant feedback、Investigation、Solution Proposal、Review 都是外部工作结果。

它们不是：

- gold answer；
- 产品真理；
- Participant qualification；
- 必然正确的因果结论；
- 自动修改命令。

系统可以严格验证：

- schema / contract；
- source / authority；
- provenance；
- permission；
- objective repository facts；
- workflow state transition。

但不把“Participant 是否与预设正确答案一致”变成产品目标。

当前也不把 Skill behavioral A/B 作为第一 Skill 继续使用的必要条件。

如果运行中出现具体质量问题，则围绕真实问题修正 prompt / Skill / Contract / context，而不是建立一个长期通用“智能评分器”。

## 6. Fault Tolerance Is Normal

以下都属于正常 workflow outcome：

```text
PROPOSAL
NO_PROPOSAL
INSUFFICIENT_EVIDENCE
REVIEW_ACCEPTED
REVIEW_REJECTED
SKIP
DEFER
PARTICIPANT_FAILURE
ESCALATE
STOP
```

一个问题没有解决，不等于飞轮失败。

## 7. Player-observable 与内部 authority

player-observable boundary 继续有效。

Orchestrator 必须区分：

- 玩家实际可见 evidence；
- repository / runtime authority；
- Agent inference；
- Reviewer opinion。

内部工程事实不能重新标记成 player-observable fact。

## 8. Configuration / Code Boundary

普通自动写入仍优先限制在：

> **已授权的配置层修改。**

需要修改程序、Runtime、Framework、正式 Contract / Schema 或其他超出权限的基础能力时：

```text
ESCALATE TO HUMAN
```

多轮自动执行也不得静默扩大这个边界。

## 9. Orchestrator 应该强在哪里

优先增强：

- Role / Participant dispatch；
- context delivery；
- input/output traceability；
- permission；
- provenance；
- budget；
- workflow state；
- outcome routing；
- bounded execution；
- rerun；
- sidecar operational reporting。

默认不增强：

- money-specific analyzer；
- marriage-specific analyzer；
- combat-specific solver；
- 通用主观智能评分器。

简单说：

> **弱领域智能，强流程控制。**

## 10. Participant Communication Contract

通信 Contract 是下一阶段在真实多轮运行后需要归纳的能力。

它应固定：

- message schema；
- field semantics；
- authority / provenance / references；
- fact / evidence / inference / opinion / unknown；
- outcome；
- error / participant failure；
- permission / STOP boundary。

它不固定 Participant 必须得出什么主观结论。

继续保持：

> **纠正通信，不纠正思想。**

MCP 可以未来作为 transport / tool protocol 方案评估，但当前不绑定具体协议实现。

## 11. 模块化边界

当前希望保持：

```text
Game / Product Runtime
Auto Evolution Orchestrator
Skills
Run Report Producer
Future Report Analysis Consumer
```

这些能力可以组合，但不应形成不必要的强依赖。

特别是：

- Skill 不依赖 Report；
- Report 不依赖 Report Analysis；
- Auto Evolution 不依赖 Report Analysis 才能运行；
- Report Analysis 不关心报告是人工提供还是某个 Orchestrator 生成；
- Auto Evolution 不应成为 Game runtime 的世界观 /规则组成部分。

Game 与 Auto Evolution 当前实际能否物理拆开、世界观能否顺畅替换，仍属**尚待验证**，不得把设计方向写成已确认事实。

## 12. 当前开发顺序

当前优先顺序：

```text
P1 Sidecar Run Report / Operational Observability Minimal Slice
↓
P2 Multi-round Execution Validation
↓
RUN / OBSERVE + Human Follow-up Loop v1 retain + review + list (real-use pilot completed / `HFL_REAL_USE_VALIDATED`)
↓
P3 Participant Communication Contract Consolidation (DEFERRED)
```

P1 与 P2 已有当前阶段记录的 delivered / closed 状态；Human Follow-up Loop v1 的 authority 已记录，minimal runtime 已可在 RUN / OBSERVE 中使用，但本产品规范不定义其 runtime implementation 细节。Full P3 remains `DEFERRED`，不能因为 Human follow-up lifecycle 的定义而重新打开。

### P1

只记录 / 输出；不分析、不干预、不建完整 UI。

### P2

验证 round N 是否能在已有 STOP / permission / provenance 边界下自然进入 round N+1。

### P3

基于真实运行归纳稳定通信语义；不先平台化。当前不提出新的 bounded P3 slice，继续遵守 `NO_BOUNDED_P3_SLICE_JUSTIFIED`。

## 13. 当前不优先设计

- First Skill behavioral A/B；
- 第二 Skill；
- Skill registry / selector / recommender；
- Skill self-evolution；
- Report Analysis；
- Human Control Surface；
- MCP 平台；
- autonomous code modification；
- 为未来世界观替换提前建设大规模通用框架。

真实运行出现明确需求后再重新裁决。

## 14. 一句话原则

> **先让这套 Agent workflow 真正持续跑起来，把每轮做过的事情清楚记录；哪里真实暴露问题，就修哪里；重复出现的方法，再沉淀成 Skill 或 Contract。**

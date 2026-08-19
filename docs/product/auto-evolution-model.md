# Wuxia-Life Auto Evolution 产品模型

> 状态：当前权威规范  
> 日期：2026-08-17 Human Direction Reset  
> 发生冲突时，Auto Evolution 产品语义以本文件为准。历史 Phase、实验 spec / plan、领域专用 investigation 路线不得覆盖本文件。  
> 与 `docs/product/player-model.md` 同属第一层产品规范：player-model 负责人物模型；本文件负责 Auto Evolution 产品模型。

---

## 1. 我们到底在做什么

Wuxia-Life 的目标是改进游戏本身。

Auto Evolution 的长期探索目标是：

> **把 Human 反复执行的“观察游戏 → 把问题交给 AI → AI 读源码和证据 → 提出方案 → 审核 → 执行 → 再观察”的工作方式，抽成一套轻量、可重复、可审计、允许失败的 Agent workflow。**

核心系统不是一个预先知道所有游戏问题如何解决的专家系统。

它是：

> **面向 Wuxia-Life 产品演化的 Agent Workflow Orchestrator。**

长期原则：

> **Orchestrator owns workflow. Agents own reasoning.**

---

## 2. 核心抽象

### 2.1 Orchestrator

Orchestrator 负责流程控制，不负责替 Agent 解决具体产品问题。

它主要拥有：

- Role 调度；
- Participant / Agent 调用；
- 输入引用与上下文边界；
- read / write 权限；
- provenance 与 artifact identity；
- output contract；
- 状态转换；
- retry / budget policy；
- `CONTINUE / SKIP / DEFER / ESCALATE / STOP`。

Orchestrator 原则上不需要知道问题属于银两、婚姻、战斗、剧情、成就、节奏或任何未来尚未出现的领域。

如果实现开始依赖：

```text
if problemType === money
if problemType === marriage
if problemType === combat
```

应首先检查 Product Direction Drift。

### 2.2 Role

Role 表示“需要完成什么工作”。

例如：

- 体验并描述问题；
- 调查一个问题并形成可能方案；
- 独立审核方案；
- 执行已接受的修改；
- 验证修改后的真实运行。

Role 不是某种固定模型，也不是必须永久对应一个独立 Agent 实例。

### 2.3 Participant / Agent

Participant 是完成 Role 的外部实体，可以是 LLM、真人、Agent Runtime 或其他系统。

核心关系继续保持：

```text
Role = 工作
Participant = 完成工作的人或外部系统
```

Participant 可以根据 Role 获得被授权的 repository、source、规范、runtime artifacts、player-observable evidence 和工具权限。

**如何调查具体问题属于 Participant 的工作。**

Agent 可以：

- 搜索源码；
- 阅读相关实现；
- 检查 artifacts；
- 运行允许的命令；
- 编写临时调查脚本；
- 比较多个方案；
- 返回 `NO_PROPOSAL` 或 `INSUFFICIENT_EVIDENCE`。

一次 Agent 工作中使用的临时方法，不自动成为 Auto Evolution 的长期 framework capability。

### 2.4 Problem Package

Problem Package 是轻量的信息与权限包，不是领域模型。

它只需要表达类似：

- 当前待处理问题 / improvement candidate；
- 问题从哪里观察到；
- 可读取的 evidence / artifact / repository authority 引用；
- 允许使用的工具；
- 当前 read / write 权限；
- 当前 STOP / escalation boundary。

长期原则：

> **Problem Package references evidence. Agent interprets evidence.**

Orchestrator 不应在交给 Agent 之前先完成问题分类、根因建模或解决方案选择。

---

## 3. 最小 Agent-driven evolution loop

当前目标飞轮是：

```text
真实 Wuxia-Life 运行
↓
player-observable evidence
↓
问题 / 改善机会形成
↓
Problem Package
↓
Investigation / Solution Participant
  - 读取允许的源码与 evidence
  - 自主调查
  - 形成 0..N 个方案
  - 可选择推荐方案
↓
Independent Reviewer Participant
  - 审核问题-方案匹配
  - 审核依据、风险和权限边界
↓
Decision
├─ 没有可接受方案 → SKIP / DEFER
├─ 需要程序级修改 → ESCALATE TO HUMAN
└─ 接受的配置层修改
       ↓
    Execution Participant / Runtime
       ↓
    verification
       ↓
    修改后的 Wuxia-Life 真实运行
       ↓
    新的 player-observable evidence
       ↓
    下一轮入口
```

关键不是每个问题都有解，而是不同未知问题可以复用同一套 orchestration。

---

## 4. Agent Owns Problem Solving

Auto Evolution 不以“框架把每种问题分析得越来越完整”为产品目标。

面对未知问题，默认方向是：

```text
提供正确 authority / source / evidence / 权限
↓
让承担 Investigation / Solution Role 的 Agent 自己处理
```

而不是：

```text
发现 money 问题
↓
框架增加 money-specific analyzer
↓
发现 marriage 问题
↓
框架增加 marriage-specific analyzer
```

只有当某项能力在多个独立问题中反复证明：

- 跨领域；
- 稳定；
- 明显减少重复工作；
- 不迫使 Orchestrator 理解具体领域；
- 长期维护价值高于 Agent 临时完成；

才单独考虑升级为 shared tooling / infrastructure。

---

## 5. 外部意见与 Reviewer 边界

PD-055 继续完整有效。

Participant feedback、Investigation、Solution Proposal 和 Review 都是外部工作结果。

它们不是：

- gold answer；
- 产品真理；
- 必然正确的因果结论；
- 自动修改命令；
- Participant qualification。

Reviewer 也是一个独立 Participant，不是 gold-answer checker。

Reviewer 的职责是基于当前问题、方案、证据和权限做独立判断，例如：

```text
ACCEPT
REJECT
REQUEST_MORE_WORK
DEFER
ESCALATE
```

Reviewer 可以判断错。系统不试图通过框架穷举所有错误并保证 Reviewer 永远正确。

---

## 6. Fault Tolerance Is Normal

Auto Evolution 不要求每一个问题必须得到解决。

以下都是正常 workflow outcome：

```text
PROPOSAL
NO_PROPOSAL
INSUFFICIENT_EVIDENCE
REVIEW_ACCEPTED
REVIEW_REJECTED
SKIP
DEFER
ESCALATE
STOP
```

一个问题没有满意方案，不等于整条飞轮失败。

系统应保存必要的 problem context、Agent output、review result 和 provenance，让问题可以：

- 被跳过；
- 延后；
- 未来交给更强模型；
- 交给不同 Participant；
- 升级给 Human。

不要为了让飞轮“每轮都成功”而不断把具体问题解决逻辑固化进框架。

---

## 7. Player-observable 与内部 authority

Phase 0 建立的 player-observable boundary 继续有效。

当 Role 是“以玩家体验为依据评价游戏”时，输入必须保持玩家实际可见。

但 Investigation / Solution Agent 可以在授权范围内读取 repository、source code 和内部工程 artifacts，因为它承担的是工程 / 产品调查工作，而不是模拟玩家。

Orchestrator 必须明确区分：

- player-observable evidence；
- repository / runtime authority；
- Agent 的推断；
- Reviewer 的意见。

内部工程事实不得被重新标记成 player-observable fact。

---

## 8. Configuration / Code Boundary

当前阶段优先 scale 的自动写入范围是：

> **已授权的配置层修改。**

在方案被 Reviewer 接受且没有越权时，配置层工作可以进入自动执行、验证和重新运行。

如果 Agent 判断真正解决问题必须修改：

- 程序代码；
- Runtime；
- Framework；
- 正式 Contract / Schema；
- 其他超出当前写权限的基础能力；

默认：

```text
ESCALATE TO HUMAN
```

Human 可以针对该具体问题授权代码级工作，但单次授权不自动扩大未来所有飞轮的长期权限。

这个边界的目的不是禁止程序演化，而是让高频、低风险的配置迭代与低频、高风险的代码变更拥有不同控制面。

---

## 9. Orchestrator 应该强在哪里

框架应优先增强这些跨问题能力：

- 谁承担哪个 Role；
- Agent 收到哪些材料；
- 输入输出是否可追溯；
- 权限是否正确；
- 是否超过调用预算；
- 是否写入允许范围；
- 当前 run 处在哪个 workflow state；
- Agent / Reviewer 返回何种 outcome；
- 如何 SKIP / DEFER / ESCALATE；
- 如何让 accepted work 进入真实游戏 rerun；
- 如何保存可审计 artifacts。

框架默认不应增强：

- 某一游戏资源的专用分析逻辑；
- 某一种剧情问题的专用因果模型；
- 某一种玩法问题的专用解决器。

简单说：

> **弱领域智能，强流程控制。**

---

## 10. 运行可观察性与 Human Control Surface

长期希望飞轮不是黑盒。

但可观察性应建立在已经存在的 workflow artifacts 上，而不是反过来定义流程。

未来可以逐步提供：

### Operational Observability

- 当前 flywheel run 到哪一步；
- 每个 Agent 收到哪些输入；
- 返回了什么；
- 哪个方案被接受 / 拒绝；
- 为什么 SKIP / DEFER / ESCALATE；
- 使用了哪些 artifacts / provenance；
- 修改和验证结果是什么。

### Human Control Surface

后续再考虑：

- run history；
- input/output inspection；
- pause / retry / skip；
- override；
- rollback；
- escalation handling。

当前不因为这个长期目标提前建设完整 UI 平台。

---

## 11. 继续有效的既有能力

这次方向校准不否定已经证明的基础能力。

继续有效的包括：

- repository authority；
- Role / Participant 模型；
- player-observable boundary；
- provenance / sealed artifacts；
- experiment / Candidate isolation；
- modified runtime → real rerun → new observable evidence；
- uncertainty preservation；
- fail-closed external-call budgets；
- Human Gate / STOP boundary；
- configuration / modification authorization。

这些能力以后服务于新的轻量 Agent workflow，而不是要求继续沿历史实验路线逐项加深。

---

## 12. 退休的默认研发方向

以下模式不再作为默认方向：

```text
具体问题暴露新的信息缺口
↓
Auto Evolution 核心框架为该问题增加专用 evidence / analyzer / observer
↓
继续该问题
```

例如，资源问题本身不能自动授权长期 `money-specific dynamics observability` 成为框架能力。

Agent 可以为了一次 Investigation 临时写脚本、读源码、执行诊断；这是 Agent 完成工作的方式。

是否把其中某种方法升级为长期 shared infrastructure，需要新的、独立的跨问题证据和产品决策。

---

## 13. 暂时不设计的内容

本规范故意不固定：

- Problem Package 的最终 JSON schema；
- Investigation / Solution prompt；
- Reviewer prompt；
- 一个 Role 是否由一个或多个 Agent 完成；
- provider registry；
- 通用 Agent SDK；
- 自动 retry 策略的最终形式；
- UI；
- code-level autonomous modification；
- rollback system；
- population evaluation。

这些只在真实流程需要时单独设计。

---

## 14. 当前下一步

本规范生效后的下一项产品工作不是继续解决上一轮 money 问题。

下一步是一次**只读 workflow audit**：

> 对当前 Auto Evolution 实现逐环节判断：哪些代码在做 Orchestrator 应做的通用编排，哪些代码已经开始替 Agent 处理具体领域问题。

Audit 只形成现状图和迁移建议，不授权代码修改。

之后才设计新的最小 problem-agnostic Agent loop。

---

## 15. 一句话原则

> **Wuxia-Life Auto Evolution 不试图预先学会解决所有游戏问题；它把未知问题和正确上下文交给合适的 Agent，让 Agent 自己调查、提案和审核，而 Orchestrator 只保证流程、权限、证据与停止边界可靠。**

# Auto Evolution 方向校准：Agent Workflow Orchestrator（2026-08）

> 性质：重大产品方向转折的压缩历史记录。  
> 不是滚动看板，不是 implementation plan，不是当前 authority。  
> 长期规则以 `docs/product/auto-evolution-model.md` 与 `docs/governance/product-decisions.md`（PD-062）为准。

## 背景

在 Skeleton 001–007、Fresh Problem、Longitudinal Investigation 和 Cross-Run Cohort 等实验之后，Auto Evolution 已经证明多项基础能力：

- player-observable evidence 可以被外部 Participant 使用；
- Role / Participant 工作可以串联；
- 修改可以进入真实 runtime 并产生新的体验 evidence；
- provenance / Candidate isolation / fail-closed Gate 可以工作；
- Investigation 可以在一定程度上保存 uncertainty。

随后，一个固定资源问题推进到 Bounded Resource Dynamics Investigation。

Deterministic replay 在真实 DeepSeek 调用前发现：现有 `ExperienceTrace` 不是完整 money mutation ledger，sequence `2 → 30` 之间存在真实但未被当前 trace 表达的 money mutation。

该实验因此按设计 NO-GO，真实 Investigation 调用为 0。

## 暴露出的更大问题

如果继续原路线，合理的下一步会变成：

```text
money 问题
→ 增加 money observability
→ 补 money dynamics
→ 继续调查 money
```

Human 在此处明确指出，这已经偏离 Auto Evolution 的原始目标。

未来未知问题可能是资源、婚姻、剧情、战斗、成就、文本或任何无法提前预测的类型。若每次新问题都要求 Auto Evolution 核心框架新增该领域专用 evidence / analyzer / observer，那么：

- 第二轮、第三轮仍不断开发框架；
- 问题类型无法穷举；
- Auto Evolution 自身复杂度会逐渐超过它辅助开发的游戏；
- 不能真正 scale。

## Human 校准后的方向

核心定位改为：

> **Auto Evolution 是轻量 Agent Workflow Orchestrator。Orchestrator owns workflow; Agents own reasoning.**

框架负责：

- Role；
- context / evidence references；
- permissions；
- provenance；
- output contract；
- workflow state；
- STOP / SKIP / DEFER / ESCALATE。

具体问题的理解、源码阅读、调查、方案形成和审核由承担 Role 的 Agent 完成。

Agent 可以为了一次 Investigation 使用临时脚本或特定方法，但这不自动成为长期框架能力。

## 新的执行边界

当前希望优先 scale：

```text
配置层自动改进
```

如果 Agent 判断真正解决问题必须修改程序 / Runtime / Framework：

```text
ESCALATE TO HUMAN
```

同时，`NO_PROPOSAL`、Reviewer reject、insufficient evidence、skip、defer 都被明确视为正常 workflow outcome，而不是必须通过扩展框架消除的失败。

## 对已有工作的含义

这次不是推翻前面的实验。

继续保留：

- player-observable boundary；
- Role / Participant；
- sealed artifacts / provenance；
- Candidate isolation；
- execution → real rerun → new evidence；
- uncertainty preservation；
- fail-closed Gate。

退休的是一种**默认研发模式**：

> 每当具体问题需要更多理解，就把该问题的专用分析能力永久做进 Auto Evolution 核心框架。

Bounded Resource Dynamics 的失败 artifact 可以作为这次转折的证据保留，但其 active spec / plan 不再指导实现。

## 下一步

方向校准后，下一步不是继续 money corrective，而是做一次 read-only workflow audit：

> 检查当前实现中哪些部分属于通用 orchestration，哪些部分已经替 Agent 处理具体领域问题。

Audit 后再设计最小 problem-agnostic Agent loop。

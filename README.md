# Repo Docs Alignment Package — Agent Workflow Direction Reset

这个包用于把 repository `docs/` authority 对齐到已经确认的新 Project Sources 方向。

## 覆盖文件

将本包中的 `docs/` 目录覆盖到 repository 对应位置：

```text
docs/README.md
docs/product/auto-evolution-model.md
docs/governance/project-convergence.md
docs/governance/product-decisions.md
docs/governance/current-product-stage.md
docs/governance/ai-collaboration-workflow.md
docs/history/2026-08-auto-evolution-agent-workflow-reset.md
```

## 需要删除的 retired active workspace 文件

覆盖完成后删除：

```text
docs/superpowers/specs/2026-08-16-auto-evolution-bounded-resource-dynamics-investigation-evidence-design.md
docs/superpowers/plans/2026-08-16-auto-evolution-bounded-resource-dynamics-investigation-evidence.md
```

它们已被 2026-08-17 Agent Workflow Direction Reset supersede，不应继续作为 active implementation authority。

## 不修改

本包不修改：

- `docs/product/player-model.md`；
- 现有 contracts / designs；
- 历史 PRD；
- `docs/history/2026-08-auto-evolution-direction-reset.md`（Reviewer Calibration 退出历史）；
- sealed `.tmp/evolution/**` artifacts；
- 源代码、配置、测试。

## 新方向摘要

```text
Orchestrator owns workflow.
Agents own reasoning.
```

框架只组织 Role、上下文引用、权限、provenance、workflow state 与 STOP；未知问题的具体调查和方案交给 Agent。

当前下一项授权工作是 **read-only Auto Evolution workflow audit**，不是继续 Money Dynamics corrective。

# Wuxia-Life

Wuxia-Life 是一个持续演进的人生模拟产品与对应的 Agent-driven 产品演化工作流。

当前 repository 同时包含两类主要能力：

1. **Game / Product Runtime**：游戏规则、内容、状态、Headless / Web 运行与验证；
2. **Auto Evolution**：把真实运行中出现的问题交给不同 Role / Participant 调查、提案、审核，并在权限内执行和重新运行的轻量 Agent workflow。

二者当前位于同一 repository，但产品语义应保持分离：Game 是被改进的对象，Auto Evolution 是帮助产品演化的工作流。是否已经达到可物理拆仓、可无成本替换世界观的程度，当前尚未通过真实迁移验证，不应提前宣称。

## 当前 Auto Evolution 状态

截至 2026-08-20，核心 workflow 已从纯概念探索进入早期可运行 / 工程化阶段：

- problem-agnostic orchestration 已有多轮真实运行；
- Solution / Reviewer 等 Role 的职责和接力方式已经基本稳定；
- `SKIP / DEFER / ESCALATE / PARTICIPANT_FAILURE` 可作为正常 workflow outcome；
- 受控配置修改已经完成执行、验证和 modified-runtime rerun；
- 第一 Skill `repository-grounded-investigation` v1 已在 Solution 与 Reviewer 中真实使用。

当前不把 Skill 视为“智能增强器”。Skill 的首要意义是把已经认可、可重复的工作方法封装成可复用、可追溯的 Participant capability。

## 下一阶段顺序

```text
1. Sidecar Run Report / Operational Observability Minimal Slice
2. Multi-round Execution Validation
3. Participant Communication Contract Consolidation
```

第一步报告只负责旁路输出运行事实，不分析、不干预，也不成为主流程运行依赖。

报告分析、Human Control UI、MCP 平台化、第二 Skill、Skill selector、自主代码修改都不是当前优先项。

## 文档入口

新的 Agent / Codex 会话先读：

1. `AGENTS.md`
2. `docs/README.md`
3. 与任务相关的第一层产品规范
4. `docs/governance/product-decisions.md`
5. `docs/governance/current-product-stage.md`
6. 与当前任务直接相关的 Contract / active design

不要通过历史 PRD、旧实验名或 `.tmp/evolution/**` 推断当前产品方向。

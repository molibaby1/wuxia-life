# 项目文档索引

`docs/` 是**当前知识库**，不是历史档案馆。只登记现在仍值得维护、值得被 Agent 主动读取的文档。

## 当前权威文档

### 产品规范（第一层）

- [玩家模型](product/player-model.md)：江湖世界玩家状态的当前权威规范。
- [Auto Evolution 产品模型](product/auto-evolution-model.md)：Agent Workflow Orchestrator 的当前权威产品规范。

二者同属第一层产品规范，职责分离：`player-model` 负责人物模型；`auto-evolution-model` 负责 Auto Evolution 如何组织外部 Agent 帮助 Wuxia-Life 改进自己。互不替代。

### 治理

- [产品决策](governance/product-decisions.md)：长期 Product Decisions；Auto Evolution 当前方向见 PD-055、PD-062。
- [当前产品阶段](governance/current-product-stage.md)：滚动看板；当前授权、STOP 与下一项允许工作。
- [项目收敛](governance/project-convergence.md)：长期收敛原则，包含 problem-agnostic orchestration 的复杂度约束。
- [AI 协作与 Agent Workflow](governance/ai-collaboration-workflow.md)：项目开发协作、Auto Evolution Role/Participant 分工、权限与升级边界。

### 契约

- [Snapshot Contract](contracts/game-state-snapshot-contract.md)：Snapshot 3.14.0、统一持久化校验与严格拒绝规则。
- [Save Schema Policy](contracts/save-schema-versioning-policy.md)：浏览器与 Headless 存档版本边界及无迁移策略。
- 其余 `contracts/`：仍有效的传输 / 适配 / 服务边界说明。

### 架构与运行

- [本地 API 联调](local-api-dev.md)：PostgreSQL + API + Vite；含环境变量与部署摘要。
- [Release Validation](release-validation-contract.md)、[Stability Gate](stability-gate.md)、测试环境与输出约定。
- [Artifact 约定](artifact-output-convention.md)：`artifacts/gates/`、`artifacts/reports/` 与 tracked fixtures。
- `designs/`：当前仍需长期理解的技术设计（含 v1.0 launch 规则）。
- Headless / Web 边界：见 `contracts/headless-snapshot-conversion-boundary.md`、`contracts/web-runtime-adapter-boundary.md`。

### 历史（极少）

- [Auto Evolution 方向重置：Reviewer Calibration 退出（2026-08）](history/2026-08-auto-evolution-direction-reset.md)：PD-055 与第一版外部 Participant 产品模型的压缩历史。
- [Auto Evolution 方向校准：Agent Workflow Orchestrator（2026-08）](history/2026-08-auto-evolution-agent-workflow-reset.md)：从领域专用 evidence / analyzer 扩展转向 problem-agnostic Agent orchestration 的压缩历史。

## 当前 Auto Evolution 工作入口

当前 Auto Evolution 不以新的 money / marriage / combat 等领域专用 analyzer 作为默认推进方式。

当前方向是：

```text
真实体验 / 问题
→ 轻量 Problem Package
→ Agent 自主调查 / 提案
→ 独立 Agent Review
→ 配置层执行，或 SKIP / DEFER / ESCALATE
→ 新的真实运行与观察
```

Orchestrator 负责工作流、上下文引用、权限、provenance、状态与 STOP；具体问题如何理解和解决由承担 Role 的 Agent 完成。

当前允许的下一项工作见 `governance/current-product-stage.md`。不要从历史实验名或旧 Superpowers plan 推断下一阶段。

## 权威层级

1. 本文件明确列出的第一层产品规范；
2. 本文件明确列出的当前治理、架构和接口契约；
3. 当前任务明确指定且仍 active 的 accepted design；
4. 其他未分类文档不具有产品规则权威性。

`docs/superpowers/**` 是临时工作区材料，**不是**第一层产品 authority。Human acceptance of a spec / plan 不会自动把它升级为永久产品语义。

## 冲突处理规则

- 发现冲突时不得自行综合不同方案；
- 以更高层级的文档为准；
- 无法判断层级或适用范围时，停止并向 Human 报告；
- 测试存在不代表旧产品行为必须保留；
- 已实现代码、测试通过、某次 Human Gate acceptance，都不能自动覆盖第一层产品规范；
- 临时 Agent 调查方法也不能仅因一次工作有效就升级成长期 framework capability。

## 文档生命周期

### 长期知识库

```text
product/
governance/
contracts/
designs/          # 已形成且仍需长期维护的技术设计
history/          # 极少；仅重大方向转折压缩记录
```

以及本文件索引的操作手册。

### 当前工作区（临时）

```text
docs/superpowers/specs/
docs/superpowers/plans/
```

- 目录按需存在；空目录不提交。
- 只放**正在推进**且后续实施会依赖的设计 / plan。
- 任务完成、退休或被新产品方向替代后必须清场：过程性内容 DELETE（依靠 Git history）；长期语义精炼进入 `product/`、`governance/`、`contracts/`、`designs/` 或极少数 `history/`。
- 不重建 `handoffs/`、`session-prompts/` 作为长期目录。

当前 Bounded Resource Dynamics experiment 已在 deterministic blocker 处停止，并被新的 Agent Workflow 方向取代；其 active Superpowers spec / plan 不应继续留在当前工作区。

## 新会话读取顺序

默认读取：

1. `AGENTS.md`
2. `docs/README.md`
3. 与任务相关的第一层产品规范
4. `governance/product-decisions.md`
5. `governance/current-product-stage.md`
6. 与任务直接相关的 Contract / 当前 active design

不要遍历全部历史 PRD、实验 closure 或 `.tmp` 来推断产品方向。

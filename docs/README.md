# 项目文档索引

`docs/` 是**当前知识库**，不是历史档案馆。只登记现在仍值得维护、值得被 Agent 主动读取的文档。

## 当前权威文档

### 产品规范（第一层）

- [玩家模型](product/player-model.md)：江湖世界玩家状态的当前权威规范。
- [Auto Evolution 产品模型](product/auto-evolution-model.md)：借助外部参与者改进游戏的当前权威产品规范。

二者同属第一层产品规范，职责分离：`player-model` 负责人物模型；`auto-evolution-model` 负责 Auto Evolution 产品模型。互不替代。

### 治理

- [产品决策](governance/product-decisions.md)：长期 Product Decisions（含 PD-055）。
- [当前产品阶段](governance/current-product-stage.md)：滚动看板；当前授权与停止边界。
- [项目收敛](governance/project-convergence.md)：长期收敛原则。
- [AI 协作流程](governance/ai-collaboration-workflow.md)：ChatGPT / Codex / 人工协作协议。

### 契约

- [Snapshot Contract](contracts/game-state-snapshot-contract.md)：Snapshot 3.14.0、统一持久化校验与严格拒绝规则。
- [Save Schema Policy](contracts/save-schema-versioning-policy.md)：浏览器与 Headless 存档版本边界及无迁移策略。
- 其余 `contracts/`：仍有效的传输 / 适配 / 服务边界说明。

### 架构与运行

- [本地 API 联调](local-api-dev.md)：PostgreSQL + API + Vite；含环境变量与部署摘要
- [Release Validation](release-validation-contract.md)、[Stability Gate](stability-gate.md)、测试环境与输出约定
- [Artifact 约定](artifact-output-convention.md)：`artifacts/gates/`、`artifacts/reports/` 与 tracked fixtures
- `designs/`：当前仍需长期理解的技术设计（含 v1.0 launch 规则）
- Headless / Web 边界：见 `contracts/headless-snapshot-conversion-boundary.md`、`contracts/web-runtime-adapter-boundary.md`

### 历史（极少）

- [Auto Evolution 方向重置（2026-08）](history/2026-08-auto-evolution-direction-reset.md)：Reviewer Calibration 退出与 PD-055 / 新产品模型接替的压缩记录。

## 权威层级

1. 本文件明确列出的产品规范；
2. 本文件明确列出的当前架构和接口契约；
3. 当前任务明确指定的已批准设计文档；
4. 其他未分类文档不具有产品规则权威性。

`docs/superpowers/**` 属于第 4 类工作区材料（见下），**不是**第一层产品 authority。
Human acceptance of a spec / plan **不会**自动把它升级为永久产品语义。

## 冲突处理规则

- 发现冲突时不得自行综合不同方案；
- 以更高层级的文档为准；
- 无法判断层级或适用范围时，停止并向用户报告；
- 测试存在不代表旧产品行为必须保留；
- 已实现代码、测试通过、某次 Human Gate acceptance，都不能自动覆盖本文件列出的产品规范；不得用 sunk cost 反向提升其产品权威。

## 文档生命周期

### 长期知识库

```text
product/
governance/
contracts/
designs/          # 已形成且仍需长期维护的技术设计
history/          # 极少；仅重大方向转折压缩记录
```

以及本文件索引的操作手册（如 `local-api-dev.md`）。

### 当前工作区（临时）

```text
docs/superpowers/specs/   # 当前活跃、经 Human Review 的设计 spec
docs/superpowers/plans/   # 当前活跃、经批准的 implementation plan
```

- 目录按需存在；空目录不提交。
- 只放**正在推进**且后续实施会依赖的文档。
- 任务完成 / 退休 / 被替代后必须清场：过程性内容 DELETE（靠 Git）；长期语义精炼进入 `product/` / `governance/` / `contracts/` / `designs/` / 极少数 `history/`。
- 不重建 `handoffs/`、`session-prompts/` 作为长期目录。

### `designs/` vs `superpowers/specs/`

| 位置 | 含义 |
| --- | --- |
| `superpowers/specs/` | 当前正在设计 / 准备实施的活跃工作规范 |
| `designs/` | 已经形成、现在仍需要长期理解和维护的技术设计 |

Spec 写得好也不自动进入 `designs/`。问：实施完成后，未来维护者是否仍需把它当当前系统设计读？否 → DELETE。

### 可以进入 docs

- 正式产品规范、长期 Product Decision、当前治理状态
- 稳定 Contract、当前真实架构说明、当前操作手册
- 极少数重大历史转折（压缩记录）
- 当前活跃 superpowers spec/plan（临时）

### 默认不进入 docs

- 临时分析、Codex handoff、session prompt
- 任务完成报告、进度总结、一次性 implementation report
- 测试运行结果 / gate latest（写入 `artifacts/` 或 `.tmp/`）
- 普通 bugfix 过程、自动生成报告

### 删除原则

已完成、已替代、已失效且无持续参考价值的文档应从 worktree 删除。
不要因为“以前重要”“曾经 Human accepted”“花了很多时间”“以后也许有用”而保留。

### 生成输出

- Gate / 阶段 proof：`artifacts/gates/`
- 其他脚本与测试运行报告：`artifacts/reports/`
- Tracked P8 baseline：`tests/fixtures/gates/`
- **禁止**把运行结果默认写回 `docs/test-reports/`

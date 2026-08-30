# 项目文档索引

`docs/` 是**当前知识库**，不是历史档案馆。只登记现在仍值得维护、值得 Agent 主动读取的文档。

## 当前权威文档

### 产品规范（第一层）

- [玩家模型](product/player-model.md)：当前游戏人物状态与产品语义的权威规范。
- [Auto Evolution 产品模型](product/auto-evolution-model.md)：Agent Workflow Orchestrator、Skill、旁路运行报告与模块边界的当前权威产品规范。

`player-model` 与 `auto-evolution-model` 同属第一层产品规范；`Wealth / Economy Contract v1` 是在玩家模型之下登记的当前 accepted product contract，不替代第一层规范。`player-model` 明确把经济能力语义委托给该 Contract；`auto-evolution-model` 负责 Auto Evolution 如何组织外部 Participant 帮助产品持续演化。

### 已接受的产品契约

- [Wealth / Economy Product Contract v1](product/wealth-economy-product-contract-design.md)：完整 Human-accepted 财力/资产产品语义；含 2026-08-22 historical repository inventory（非 current authority）；当前 implementation closure 见该文档最新 status section / PD-098（Snapshot `3.16.0`，`wealthCapacity`-only）。
- [Phase 1B Minimal Asset Semantics Design](product/wealth-economy-phase-1b-minimal-asset-semantics-design.md)：Human-accepted 的 `merchant_shop` 最小 Asset identity、ownership、persistence 与 presentation implementation boundary。
- [Merchant Shop Legacy Money Migration Design](product/wealth-economy-merchant-shop-legacy-money-migration-design.md)：Human-accepted 的 merchant talent → first shop → shop-failure 竖切，从 legacy `money` 迁移到 Wealth Capacity + `merchant_shop` Asset（已交付）。
- [Merchant Caravan Legacy Money Migration Design](product/wealth-economy-merchant-caravan-legacy-money-migration-design.md)：Human-accepted 的 `merchant_caravan_guard` + `merchant_market_monopoly` 入口竖切，从 legacy `money` 迁移到 Wealth Capacity（已交付）。
- [Merchant Market Monopoly Legacy Money Migration Design](product/wealth-economy-merchant-market-monopoly-legacy-money-migration-design.md)：Human-accepted 的 `merchant_market_monopoly` 选择奖励竖切，垄断路径迁移到 `wealth_capacity_raise_to wealthy`，公平竞争路径保持 Wealth 不变（已交付）。
- [Merchant Official–Intelligence–Chamber Continuity Migration Design](product/wealth-economy-merchant-official-intelligence-chamber-continuity-migration-design.md)：Human-accepted 的 `merchant_official_connection` → `merchant_intelligence_network` → `merchant_chamber_of_commerce` 竖切，从 legacy wallet 迁移到 Wealth Capacity continuity（已交付）。
- [Merchant Late Economic Progression Legacy Money Migration Design](product/wealth-economy-merchant-late-economic-progression-legacy-money-migration-design.md)：Human-accepted 的 `merchant_wealth_peak` → `merchant_sect_investment` → `merchant_business_empire` → `merchant_ending_tycoon` 竖切，从 legacy wallet 迁移到 late-game Wealth Capacity 语义（已交付）。
- [Merchant Bankrupt Ending Temporary Retirement Design](product/wealth-economy-merchant-bankrupt-ending-temporary-retirement-design.md)：Human-accepted 的 `merchant_ending_bankrupt` 临时退役决策；移除无效 legacy wallet bankruptcy consumer，不引入替代破产语义（已交付）。

### 治理

- [产品决策](governance/product-decisions.md)：长期 Product Decisions；Auto Evolution 当前方向重点见 PD-055、PD-062、PD-063。
- [当前产品阶段](governance/current-product-stage.md)：短滚动看板；当前成熟度、优先级、授权边界与 STOP。
- [项目收敛](governance/project-convergence.md)：长期收敛、模块化和复杂度预算原则。
- [AI 协作与 Agent Workflow](governance/ai-collaboration-workflow.md)：项目开发协作，以及 Role / Participant / Skill / Report / Contract 的职责边界。

### 契约

- [Snapshot Contract](contracts/game-state-snapshot-contract.md)：Snapshot 3.16.0、统一持久化校验与严格拒绝规则。
- [Save Schema Policy](contracts/save-schema-versioning-policy.md)：浏览器与 Headless 存档版本边界及无迁移策略。
- 其余 `contracts/`：仍有效的传输 / 适配 / 服务边界说明。

### 架构与运行

- [本地 API 联调](local-api-dev.md)：PostgreSQL + API + Vite；含环境变量与部署摘要。
- [Release Validation](release-validation-contract.md)、[Stability Gate](stability-gate.md)、测试环境与输出约定。
- [Artifact 约定](artifact-output-convention.md)：`artifacts/gates/`、`artifacts/reports/` 与 tracked fixtures。
- `designs/`：当前仍需长期理解的技术设计。
- Headless / Web 边界：见 `contracts/headless-snapshot-conversion-boundary.md`、`contracts/web-runtime-adapter-boundary.md`。

### 历史（极少）

- [Reviewer Calibration 退出（2026-08）](history/2026-08-auto-evolution-direction-reset.md)：PD-055 与旧主观 gold-answer 路线退出历史。
- [Agent Workflow Orchestrator 方向校准（2026-08）](history/2026-08-auto-evolution-agent-workflow-reset.md)：从领域专用 evidence / analyzer 扩展转向 problem-agnostic orchestration 的压缩历史。

## 当前 Auto Evolution 工作入口

核心 workflow 已经进入**早期可运行 / 工程化阶段**，当前不再把主要工作定义为“继续证明 Agent workflow 能不能成立”。

已确认的工作形态：

```text
真实体验 / 问题
→ Problem Package
→ Agent 自主调查 / 提案
→ 独立 Agent Review
↓
Decision
├─ SKIP / DEFER
├─ ESCALATE_HUMAN
│      ↓
│  retained Human follow-up work item
│      ↔ asynchronous Human review
│      └─ READY_FOR_FORMAL_TASK → existing formal workflow
└─ accepted configuration work
       ↓
    execution
       ↓
    verification / modified runtime rerun
       ↓
    new-round entry
```

`READY_FOR_FORMAL_TASK` 只进入 existing formal workflow，不代表自动执行。普通 unresolved Human work item 不阻塞 RUN / OBSERVE；主循环继续遵守既有 STOP / fail-closed boundary。

第一 Skill `repository-grounded-investigation` v1 已完成 Solution / Reviewer 的真实 Skill-mode 使用验证，当前视为可用的重复工作方法封装。

当前**不**以 Skill-off / Skill-on behavioral A/B 作为下一阶段前置。Skill 是否需要优化，由后续真实运行暴露的具体问题驱动。

当前阶段产品顺序以 `governance/current-product-stage.md` 为准：

```text
P1 Sidecar Run Report — delivered / usable
P2 Multi-round engineering path — closed
↓
RUN / OBSERVE
+
Human Follow-up Loop v1 — retain + review + list; engineering delivered / implementation review accepted / real-use pilot completed (`HFL_REAL_USE_VALIDATED`)
↓
full P3 remains `DEFERRED`
```

当前 `NO_BOUNDED_P3_SLICE_JUSTIFIED` 不变，既有 permission / STOP boundaries 不变。

其中 Report 只是旁路输出，不是主流程依赖；Report Analysis 是未来独立消费者，不在当前阶段建设。

## 模块边界

当前应保持以下能力低耦合：

```text
Game / Product Runtime
Auto Evolution Orchestrator
Skills
Run Report Producer
Future Report Analysis Consumer
```

同 repository 不等于同产品语义。

Game 是被改进对象；Auto Evolution 是演化工作流；Skill 是 Participant 的工作方法；Report 是旁路运行事实；Report Analysis 未来只消费报告。

实际的物理拆分、世界观替换或跨产品迁移能力尚未验证，不能从设计意图直接推断已经成立。

## 权威层级

1. 本文件明确列出的第一层产品规范；
2. 当前 Product Decisions 与治理文档；
3. 当前任务明确指定且仍 active 的 accepted design；
4. 当前真实实现与对应测试；
5. 其他未分类文档。

`docs/superpowers/**` 是临时工作区材料，不是第一层 authority。

历史 PRD 只说明当时的计划与实现背景。尤其 `docs/PRD/auto-evolution-first-skill-behavioral-validation.md` 已退出当前优先路线，不得把它解释为当前必须执行的下一阶段。

## 冲突处理规则

- 发现冲突时不得自行综合多套旧方案；
- 以更高层级 authority 为准；
- 已实现代码、测试通过、某次 Human Gate acceptance 都不能自动覆盖第一层产品规范；
- Skill、Report、Contract 等能力只在真实运行需要时演进，不因已有实现自动升级产品地位；
- 无法判断时 STOP 并向 Human 报告。

## 文档生命周期

### 长期知识库

```text
product/
governance/
contracts/
designs/
history/          # 极少，只保存重大方向转折
```

### 当前工作区（临时）

```text
docs/superpowers/specs/
docs/superpowers/plans/
```

完成、退休或被新方向替代后，应删除临时过程文档；有长期价值的结论精炼进入长期知识库。

`current-product-stage.md` 不保存每轮 Participant 的执行流水。真实运行详情应进入独立 runtime artifacts / report。

## 新会话读取顺序

默认读取：

1. `AGENTS.md`
2. `docs/README.md`
3. 与任务相关的第一层产品规范
4. `governance/product-decisions.md`
5. `governance/current-product-stage.md`
6. 与任务直接相关的 Contract / 当前 active design

不要遍历全部历史 PRD、实验 closure 或 `.tmp` 来推断产品方向。

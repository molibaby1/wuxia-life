# Wuxia-Life 项目收敛原则

> 状态：长期治理基线  
> 用途：说明项目如何保持收敛、模块化与不过度设计。  
> 不定义具体产品语义；不替代 `current-product-stage.md`。

权威入口见 `docs/README.md`。

---

## 1. 收敛目标

长期增量开发最容易出现的问题不是“功能不够多”，而是：

- 多代产品模型并存；
- 历史实验被当成现行规则；
- 为一次具体问题建设的能力永久留在框架；
- observability、analysis、control 被一次性强耦合；
- Skill 从工作方法包膨胀成第二套 workflow；
- 辅助系统复杂度超过被改进的产品。

收敛目标：

> **让产品模型、运行系统、Agent workflow 和文档都保持唯一 authority、清晰边界和最小必要复杂度。**

## 2. 长期原则

### 2.1 单一权威产品模型

- `docs/product/game-product-foundation.md` 是**游戏产品领域的最高层规范**。
- `docs/product/player-model.md` 在其下负责江湖人物模型，既有正式领域 Contract 在委托范围内继续有效。
- `docs/product/auto-evolution-model.md` 是独立的 AE 辅助工作流规范，不与 Game Foundation 竞争游戏产品方向；处理游戏内容时必须遵守游戏权威。

不同职责的权威不互相覆盖。代码、测试和历史 Human acceptance 都不能自动覆盖对应的正式产品语义。

### 2.2 单一事实来源

同一事实只保留一个 canonical source。

不要用 fallback / alias 永久调和多套旧语义。

### 2.3 收敛优先于兼容

发现冲突：

1. 报告；
2. 按 authority 选择正确语义；
3. 迁移或删除旧路径。

### 2.4 Implementation reality 不自动产生 product authority

- 已实现 = implementation reality；
- tests pass = 对应 contract 被满足；
- Human acceptance = 某个明确 gate 被接受。

长期产品规则仍需进入第一层规范或 Product Decision。

### 2.5 Auto Evolution 保持 problem-agnostic

Orchestrator 长期负责：

- Role；
- context；
- permissions；
- provenance；
- contracts；
- workflow state；
- STOP / SKIP / DEFER / ESCALATE。

具体领域问题由 Agent 解决。

### 2.6 真实运行优先于预测性优化

当核心 workflow 已可运行后，默认顺序是：

```text
run
→ observe actual behavior
→ fix actual blocker
→ reuse repeated method
```

而不是在尚未出现问题时，为所有可能风险提前建设评测、补偿和控制系统。

尤其不要默认把 Participant 的主观判断质量变成 Orchestrator 的长期优化目标。

### 2.7 Skill 是沉淀，不是智能替代

Skill 用于封装已经认可、可重复的 Participant working method。

一次真实使用可以证明“这套方法能够被稳定复用”；是否继续优化，由后续实际运行问题驱动。

不因为存在 Skill infrastructure 就必须建设：

- behavioral A/B；
- Skill scorer；
- selector；
- registry；
- generator；
- self-evolution。

### 2.8 Sidecar-first observability

运行可观察性优先采用旁路输出。

Run Report：

- 读取现有 workflow facts / artifacts；
- 输出简单运行事实；
- 不成为主流程前置依赖；
- 不默认承担分析和决策。

Report Analysis 是独立消费者，未来有需求再建设。

### 2.9 Producer / Consumer 解耦

通用规则：

> **生产某种 artifact 的模块，不应要求它的未来消费者存在；消费 artifact 的模块，也不应不必要地绑定其生产者。**

适用于 Report、Skill、artifacts、analysis 等能力。

### 2.10 Contract 固定通信，不固定思想

Participant Communication Contract 应固定：

- schema；
- semantics；
- references；
- provenance；
- outcome；
- permission / STOP。

不固定主观结论。

继续遵守：

> **纠正通信，不纠正思想。**

具体 transport（包括 MCP）不应在真实需求出现前升级成产品架构。

### 2.11 同 repository 不等于强耦合

Game 与 Auto Evolution 可以当前共存在一个 repository，但产品语义应保持分离。

设计目标是避免 Auto Evolution 成为 Game runtime 的必要组成，也避免 Game 世界观成为 Orchestrator 的硬编码领域语义。

但“可以物理拆仓 / 无成本换世界观”必须经实际迁移验证后才能宣称成立。

### 2.12 辅助系统必须有复杂度预算

当一个辅助模块的复杂度增长快于它解决的真实运行问题时，优先：

- 不做；
- 简化；
- 让 Agent 临时完成；
- 接受 SKIP / DEFER；
- 等真实证据。

## 3. 当前阶段的收敛顺序

当前游戏产品阶段按 PD-129 明确分层：

```text
基础产品战略与决策一致性收口（当前）
→ 全局实现差异审查（后续）
→ 经 Human 单独授权的有界代码迁移与证据化验证
```

不得把某项决策的获批解释成当前即可开始该领域专项代码治理；不因看到既有代码缺口就自动调整优先级。

此前的 Sidecar Run Report → Multi-round Execution Validation → Communication Contract Consolidation 是 **AE 历史工作路线**，不再作为当前游戏产品默认下一步。AE 自身的 `RUN / OBSERVE` 成熟度及历史证据保持有效，详见 `current-product-stage.md`。

## 4. 文档收敛

`current-product-stage.md` 只记录当前 authority，不记录每轮执行流水。

历史实验详情保留在 Git / sealed artifacts / 极少数 history 文档中。

已退休 PRD 不应继续作为“下一步默认工作”。

## 5. 冲突处理

```text
先读 docs/README.md
→ 以更高层 authority 为准
→ 无法判断则 STOP
→ 不自行综合旧路线
→ 不因 sunk cost 继续错误抽象
```

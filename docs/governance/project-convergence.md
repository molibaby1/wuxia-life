# Wuxia-Life 项目收敛原则

> 状态：长期治理基线  
> 用途：说明项目如何保持收敛。  
> 不定义具体产品语义；不替代当前看板；不维护默认 Phase 路线图。

权威入口与层级见 `docs/README.md`。  
当前允许 / 禁止做什么见 `docs/governance/current-product-stage.md`。  
Agent 协作与 Drift Guard 见 `docs/governance/ai-collaboration-workflow.md` 与 `AGENTS.md`。

---

## 1. 为什么需要收敛

长期增量开发后，仓库容易同时堆积：

- 多代产品模型与兼容字段；
- 多套事实表达；
- 以 Pxx / Phase 编号组织的长期架构；
- 过时文档被 Agent 搜索后当成现行规则；
- 为一次具体问题建立的调查能力永久留在框架中；
- Auto Evolution 辅助系统的复杂度开始超过它要帮助改进的游戏。

收敛目标：

> **建立唯一产品模型，并让代码、数据、测试、文档、工具和 Agent workflow 围绕该模型对齐。**

---

## 2. 长期原则

### 2.1 单一权威产品模型

产品语义以第一层产品规范为准：

- `docs/product/player-model.md`
- `docs/product/auto-evolution-model.md`

代码、测试通过、Human Gate acceptance 都不能自动覆盖产品规范。

### 2.2 单一事实来源

同一游戏事实只应有一个 canonical source。

禁止为“兼容旧实现”永久引入第二套并行真相。

### 2.3 稳定 Contract 边界

跨表面的传输与校验规则放在 `docs/contracts/` 并由测试守护。

Contract 描述边界，不重新发明产品语义。

### 2.4 收敛优先于兼容

发现新旧冲突时：

1. 报告冲突；
2. 按权威规范选择正确语义；
3. 迁移或删除旧路径。

不要用兼容层、别名或 fallback 永久调和两套模型。

### 2.5 删除优于永久 Deprecated

已失效的代码、测试和过程性文档应从 worktree 删除。

Git history 是档案。

### 2.6 不以阶段编号作为长期架构

`P4` / `Phase 1` / `Skeleton 007` 可以是历史任务名。

它们不是长期模块边界，也不构成“下一步理应进入 Phase N”的授权。

### 2.7 Implementation reality 不自动产生 product authority

- 已实现代码 = implementation reality；
- 测试通过 = 对应 Contract 被满足；
- Human acceptance = 某次明确 Gate 被接受。

要把新语义升为长期产品规则，必须更新产品规范或 Product Decision。

### 2.8 重复实现必须收敛

同一职责出现两套实现时，应收敛到唯一 owner，而不是继续并列扩展。

### 2.9 Auto Evolution Orchestrator 保持 problem-agnostic

Auto Evolution 的核心框架默认只拥有跨问题的 orchestration 责任：

- Role；
- context references；
- permissions；
- provenance；
- contracts；
- state transitions；
- STOP / SKIP / DEFER / ESCALATE。

具体领域的分析与解决属于 Agent 工作。

如果每出现一种新问题都需要新增领域专用 framework module，应首先怀疑抽象发生漂移，而不是继续扩展。

### 2.10 一次调查方法不自动升级为基础设施

Agent 为完成一次问题可以写临时脚本、使用特定分析手段或读取特殊源码路径。

只有当某项能力在**多个独立问题**中反复证明跨领域、稳定且具有明显复用价值时，才考虑升级为 shared infrastructure。

单次实验成功、Human acceptance 或已有实现都不足以自动完成这次升级。

### 2.11 辅助系统必须保持复杂度预算

Auto Evolution 是帮助开发 Wuxia-Life 的能力，不是项目本身的主要产品。

当某个辅助模块的复杂度增长快于它消除的真实产品不确定性时，应优先：

- 让 Agent 临时完成；
- 简化流程；
- 接受 SKIP / DEFER；
- 或停止该方向。

不要为了“让每轮都能自动解决”把辅助框架建设成比游戏更复杂的平台。

---

## 3. 明确不在本文维护的内容

| 职责 | Owner |
| --- | --- |
| 权威层级与文档生命周期 | `docs/README.md` |
| 当前授权 / STOP | `docs/governance/current-product-stage.md` |
| Auto Evolution 产品语义 | `docs/product/auto-evolution-model.md` |
| Agent 协作与 Drift Guard | `docs/governance/ai-collaboration-workflow.md`、`AGENTS.md` |
| 长期已裁决语义 | `docs/governance/product-decisions.md` |
| 当前活跃设计 / 计划 | `docs/superpowers/specs/`、`docs/superpowers/plans/`（临时） |

本文不维护默认 Phase 路线图，也不把任何候选下一步写成授权。

---

## 4. 冲突处理口令

```text
先读 docs/README.md 权威层级
→ 以更高层文档为准
→ 无法判断则 STOP 并向 Human 报告
→ 不自行综合多套旧方案
→ 不因为已经投入很多而继续错误抽象
```

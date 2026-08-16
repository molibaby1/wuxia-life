# Wuxia-Life 项目收敛原则

> 状态：长期治理基线
> 用途：说明项目如何保持收敛。
> 不定义具体产品语义；不替代当前看板；不维护默认 Phase 路线图。

权威入口与层级见 `docs/README.md`。
当前允许/禁止做什么见 `docs/governance/current-product-stage.md`。
Agent 协作与 Product Direction Drift Guard 见 `docs/governance/ai-collaboration-workflow.md` 与 `AGENTS.md`。
文档生命周期见 `docs/README.md`。

---

## 1. 为什么需要收敛

长期按阶段切片增量开发后，仓库容易同时堆积：

- 多代玩家模型与兼容字段；
- 多套身份 / 关系 / 事实表达；
- 以 Pxx / Phase 编号组织的运行代码与文档；
- 过时文档被 Agent 搜索后当成现行规则。

收敛目标：

> **建立唯一的产品模型，并使代码、数据、测试、文档和工具围绕该模型对齐。**

---

## 2. 长期原则

### 2.1 单一权威产品模型

产品语义以第一层产品规范为准（当前：`docs/product/player-model.md`、`docs/product/auto-evolution-model.md`）。

代码、测试通过、Human Gate acceptance **都不能**自动覆盖产品规范。

### 2.2 单一事实来源

同一游戏事实只应有一个 canonical source。
禁止为“兼容旧实现”再引入第二套并行真相。

### 2.3 稳定 Contract 边界

跨表面（Local / API / Headless / Browser）共享的传输与校验规则放在 `docs/contracts/`，并由测试守护。
Contract 描述边界，不重新发明产品语义。

### 2.4 收敛优先于兼容

发现冲突时：

1. 报告冲突；
2. 按权威规范选择正确语义；
3. 迁移或删除旧路径；

**不要**用兼容层、别名、fallback 永久调和新旧两套模型。

### 2.5 删除优于永久 Deprecated

已失效的代码、测试、文档应从 worktree 删除。
Git history 是档案。
不要用横幅把废文档继续留在搜索路径里。

### 2.6 不以阶段编号作为长期架构

`P4` / `P6B` / `Phase 1` 可以是当时任务名。
它们不是长期模块边界，也不构成“下一步理应进入 Phase N”的授权。

### 2.7 Implementation reality 不自动产生 product authority

- 已实现代码 = 实现现实；
- 测试通过 = 对应 Contract 被满足；
- Human acceptance = 某次 Gate 被接受。

要把新语义升为产品规则，必须更新产品规范或写入 Product Decision。

### 2.8 重复实现必须收敛

同一职责出现两套实现时，应收敛到唯一 owner，而不是继续并列扩展。

---

## 3. 明确不在本文维护的内容

| 职责 | Owner |
| --- | --- |
| 权威层级与文档生命周期 | `docs/README.md` |
| 当前授权 / STOP | `docs/governance/current-product-stage.md` |
| Agent 协作与 Drift Guard | `docs/governance/ai-collaboration-workflow.md`、`AGENTS.md` |
| 具体产品语义 | `docs/product/*`、`docs/governance/product-decisions.md` |
| 当前活跃设计 / 计划 | `docs/superpowers/specs/`、`docs/superpowers/plans/`（临时工作区） |

本文不维护 Phase 0→N 默认路线图，也不把任何候选下一步写成授权。

---

## 4. 冲突处理口令

```text
先读 docs/README.md 权威层级
→ 以更高层文档为准
→ 无法判断则停止并向 Human 报告
→ 不自行综合多套旧方案
```

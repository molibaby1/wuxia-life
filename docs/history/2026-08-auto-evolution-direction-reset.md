# Auto Evolution 方向重置（2026-08）

> 性质：重大产品方向转折的压缩历史记录。  
> 不是滚动看板，不是实施计划，不是当前 implementation authority。  
> 长期规则以 `docs/product/auto-evolution-model.md` 与 `docs/governance/product-decisions.md`（PD-055）为准。

## 原方向是什么

在 Phase 0（玩家可观察信息边界）之后，主线一度推进到 **Phase 1 Reviewer Calibration**：

- 用 LLM Reviewer 评审玩家可见人生记录；
- 用人工 gold answer、查准/查全、资格考试、Freeze Checkpoint 证明 Reviewer“足够正确”；
- 把 Calibration 写成进入后续自动进化的必经台阶。

当时还有一套 LLM-driven Auto Evolution proposal / roadmap，把 Reviewer、Planner、Verifier、population 评价写成飞轮阶段。

## 哪个关键假设后来失效

失效假设不是“外部意见无用”，而是：

> 外部参与者的主观体验判断，可以用 Wuxia-Life 提供的标准答案来定义对错。

一旦接受这个假设，优化对象就从“游戏本身”滑成了“证明 Reviewer 合格”。每一步单独看都像负责任（先保证材料可观察，再校准传感器），合在一起却换掉了产品对象。

已有警告性原则（PD-050 / PD-051 / PD-052）针对自动分数冒充真人感受，但当时没有明确禁止对外部参与者主观判断出金标准考题。缺口在于警告没有升级成挡住 Calibration 的产品规则。

## 为什么退休

2026-08-14 产品方向治理裁决：

- Wuxia-Life 要改进的是游戏，不是 Reviewer；
- 外部参与者（LLM 或真人）返回的是自己的观察和判断，不是应试答案；
- Reviewer Calibration / qualification / gold-answer 路线退出产品主线；
- 对应实现已独立授权清理并从仓库移除。

**已完成 ≠ 必须进入未来产品架构。**

## 什么接替了旧方向

| 角色 | 文档 |
| --- | --- |
| Auto Evolution 第一层产品规范 | `docs/product/auto-evolution-model.md` |
| 长期产品决策 | PD-055（外部参与者主观判断不是金标准考题） |
| 当前工作边界 | `docs/governance/current-product-stage.md` |

仍然有效：

- Phase 0 **player-observable information boundary**（把玩家当时能看见的东西交给外部参与者，不泄漏隐藏状态）；
- 隔离实验边界等工程能力（语义降级，不是 Reviewer 产品）。

重置当时明确未授权任何新的 Auto Evolution 实现。其后 **Minimal External Feedback Loop** 已单独获 Human 授权、实施、真实 smoke 与 Human acceptance，现为 **CLOSED**——详情与当前授权边界见 `docs/governance/current-product-stage.md`。

当前仍禁止（除非获得新的明确 Human 授权）：

- successor Auto Evolution implementation / Phase 2；
- ExternalParticipant framework、Planner、Verifier、自动进化闭环；
- 重建 Reviewer Calibration / qualification / gold-answer。

完整审计正文已从 worktree 删除；如需原文，查 Git 历史中的  
`docs/governance/2026-08-14-product-direction-governance-audit.md`。

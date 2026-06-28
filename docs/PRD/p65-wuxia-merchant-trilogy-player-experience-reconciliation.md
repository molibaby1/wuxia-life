# PRD: P65 Wuxia Merchant Trilogy Player Experience Reconciliation

> **Derived from:** `docs/test-reports/p62-ordinary-merchant-bridge-reconciliation-closure-report.md`, `docs/test-reports/p63-merchant-entry-differentiation-closure-report.md`, `docs/test-reports/p64-merchant-pressure-payoff-differentiation-closure-report.md`, `docs/test-reports/p58-town-apprentice-merchant-bridge-closure-report.md`, `docs/test-reports/p59-tavern-hand-bridge-closure-report.md`, `docs/test-reports/p61-farm-peasant-playable-bridge-closure-report.md`
> **Stage slug:** `p65-wuxia-merchant-trilogy-player-experience-reconciliation`
> **Stage type:** bounded player-experience reconciliation stage after the merchant trilogy differentiation package

## 1. Introduction

到 `P64` 为止，ordinary→merchant 这条路线已经不只是“能接进同一个 mixed 终点”，而是已经完成了 bridge、entry differentiation、pressure/payoff differentiation 三层结构。从工程与规则证明角度看，这一包已经基本闭合；但从玩家体验角度，还缺一个正式问题：**玩家是否真的感受到这三条路是三种不同的人生，而不是同一条商路的三个入口变体。**

当前最值得确认的，不再是“还有没有更多 merchant 内容可以加”，而是下面三个体验层：

- 成功以后，三条路的区别是否已经足够“有手感”
- 三条路的压力与代价，是否像各自的人生，而不是共享商路压力的轻度改写
- 结算/回顾时，玩家能不能形成一句清楚的“我这局是什么命”

因此，P65 不应再直接加新事件，而应先把 `P58/P59/P61/P63/P64` 当成一整个 merchant trilogy package，做一次 player-experience reconciliation。只有先弄清楚这包路线在玩家感知上最薄的是哪一层，后面的优化才不会重新滑回“内容增量很多，但玩家不一定记得”的问题。

## 2. Goals

- 把当前 merchant trilogy package 当成完整玩家路线包做正式体验收口
- 判断“成功代价差异”“成功形状差异”“回顾句子收束感”三层里，哪一层最薄
- 明确哪些体验差异已经 runtime-visible，哪些还停留在弱表达或弱体感层
- 为 `P66/P67` 给出唯一主切口和顺序依据

## 3. Non-Goals

- 不新增大内容波次
- 不重写 `P55` magnate skeleton 或 `P58/P59/P61` bridge wiring
- 不直接转去新 ordinary→mixed 终点线
- 不做 full playtest 平台化、全量用户研究或大规模运营化验证
- 不重开 sample-line 轨

## 4. User Stories

### US-001: Audit Merchant Trilogy As A Player Route Package
**Description:** As a maintainer, I want a player-route audit across `P58/P59/P61/P63/P64` so the repo has one truth source for what the merchant trilogy now feels like end-to-end.

**Acceptance Criteria:**
- [ ] 汇总三条路线从 bridge → entry → pressure → payoff 的玩家可见层
- [ ] 明确哪些差异已经存在，哪些层仍可能被玩家感知为同构
- [ ] 输出 `docs/test-reports/p65-merchant-trilogy-player-route-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P65 Scope Contract
**Description:** As a planner, I want a scope contract so P65 stays a reconciliation stage instead of quietly turning into another merchant content wave.

**Acceptance Criteria:**
- [ ] 明确 P65 以玩家体验 reconciliation、comparison、priority sorting 为主
- [ ] 明确允许层：文档 comparison、必要的轻量验证补强
- [ ] 明确禁止项：新 merchant content wave、新系统、新终点线
- [ ] 输出 `docs/test-reports/p65-merchant-trilogy-experience-scope-contract.md`

### US-003: Evaluate Success-Cost Differentiation
**Description:** As a designer, I want an explicit assessment of whether the three merchant routes already feel like they pay different prices for success.

**Acceptance Criteria:**
- [ ] 对比 apprentice / tavern / peasant 三线的成功代价信号
- [ ] 明确这些代价是否已经足够“像自己选的人生”
- [ ] 若不足，说明最薄缺口落在哪一线、哪一层
- [ ] 结论写入 reconciliation 文档

### US-004: Evaluate Success-Shape Differentiation
**Description:** As a designer, I want an explicit assessment of whether the three merchant routes already feel like they succeed in different ways.

**Acceptance Criteria:**
- [ ] 对比三线“是靠什么做大”的玩家感知
- [ ] 明确差异是否强到足以支撑不同成功形状
- [ ] 若不足，说明缺的是 entry、pressure 还是 payoff 层
- [ ] 结论写入 reconciliation 文档

### US-005: Evaluate Recap-Line / Destiny-Sentence Strength
**Description:** As a maintainer, I want to know whether the current trilogy already gives players a clear sentence they can use to summarize their life route.

**Acceptance Criteria:**
- [ ] 评估三线在结算/回顾中的“可复述命运句子”强度
- [ ] 明确现有回顾是否足够鲜明
- [ ] 若不足，明确哪条线最缺收束感
- [ ] 不要求新增结算系统

### US-006: Rank The Three Experience Layers
**Description:** As a planner, I want P65 to rank the three player-experience layers so the next stages optimize the highest-value pain first.

**Acceptance Criteria:**
- [ ] 对“成功代价差异”“成功形状差异”“回顾句子收束感”做优先级排序
- [ ] 排序必须绑定 repo-grounded truth，而不是泛泛体验判断
- [ ] 选出唯一主切口作为 `P66`
- [ ] 写入 closure 或附录

### US-007: Add Narrow Validation Reinforcement If Needed
**Description:** As a maintainer, I want only the minimum additional validation needed to support the experience-priority conclusion.

**Acceptance Criteria:**
- [ ] 若现有 proof/tests 已足够，则明确记录无需新增验证
- [ ] 若不足，则只补最小 comparison-level 体验验证资产
- [ ] 不重写 P58/P59/P61/P63/P64 测试体系
- [ ] 相关命令 Pass

### US-008: Produce P65 Closure Report
**Description:** As a maintainer, I want a closure report stating which player-experience layer is now the top optimization priority for the merchant trilogy.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p65-merchant-trilogy-player-experience-closure-report.md`
- [ ] 汇总 route audit、三层评估、优先级排序与下一阶段建议
- [ ] 明确与 `P66/P67` 的边界
- [ ] 列出仍 defer 的更大 playtest / new-route / system 项

## 5. Functional Requirements

1. FR-1: P65 必须把 `P58/P59/P61/P63/P64` 当成一个完整的玩家路线包分析。
2. FR-2: P65 必须比较三个体验层：成功代价、成功形状、回顾收束感。
3. FR-3: P65 必须给出唯一主切口，而不是把三个层都留成同优先级开放问题。
4. FR-4: P65 不得借 reconciliation 之名扩成新 merchant 实施阶段。
5. FR-5: P65 closure 必须明确 `P66` 为什么优先处理成功代价差异。

## 6. Success Criteria

- repo 内存在 1 份 merchant trilogy 的玩家体验 truth source
- 已明确当前最薄的玩家体验层
- 后续 `P66/P67` 的顺序与切口有清晰依据
- 不破坏 `P58/P59/P61/P63/P64` 既有闭合结论

## 7. Dependencies / Context

- P62 closure: `docs/test-reports/p62-ordinary-merchant-bridge-reconciliation-closure-report.md`
- P63 closure: `docs/test-reports/p63-merchant-entry-differentiation-closure-report.md`
- P64 closure: `docs/test-reports/p64-merchant-pressure-payoff-differentiation-closure-report.md`
- P58 closure: `docs/test-reports/p58-town-apprentice-merchant-bridge-closure-report.md`
- P59 closure: `docs/test-reports/p59-tavern-hand-bridge-closure-report.md`
- P61 closure: `docs/test-reports/p61-farm-peasant-playable-bridge-closure-report.md`

## 8. Risks And Rollback

### Risks

- **Content bias:** 容易把“事件多少”误当成“玩家感知强弱”
- **Over-analysis risk:** 容易把 reconciliation 拉成过长的体验理论文档
- **Template comfort risk:** 容易过度相信现有 differentiation 已经足够

### Rollback

- 若 reconciliation 证明当前三层体验都已足够强，则 `P66` 可 no-go 或缩成极小 polish
- 若唯一可行优化需要新系统或全量 playtest 平台，则应显式 defer

## 9. Validation Direction

- comparison 层：三条路线的玩家体验比较必须绑定真实 runtime-visible truth
- priority 层：排序结论必须明确、可执行，而不是泛泛而谈
- boundary 层：closure 必须说明为何 P65 先做收口而不直接开新 mixed 线

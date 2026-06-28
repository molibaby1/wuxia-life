# PRD: P68 Wuxia Merchant Trilogy Live Experience Validation

> **Derived from:** `docs/test-reports/p65-merchant-trilogy-player-experience-closure-report.md`, `docs/test-reports/p66-success-cost-differentiation-closure-report.md`, `docs/test-reports/p67-success-shape-recap-closure-report.md`, `docs/test-reports/p49-sample-lines-playtest-round-2.md`, `agent_docs/p49-wuxia-sample-lines-validation-and-playtest-gaps.md`
> **Stage slug:** `p68-wuxia-merchant-trilogy-live-experience-validation`
> **Stage type:** bounded live-experience validation and playtest-readout stage

## 1. Introduction

到 `P67` 为止，merchant trilogy 已经在 repo 内完成了一整套质量优化闭环：bridge、entry differentiation、pressure/payoff differentiation、success-cost differentiation、success-shape and recap。工程上它已经闭合，但还差最后一个更高优先级的问题：**这套方法论是否真的会被玩家感知到，而不是只在表达、测试与 closure 报告里成立。**

因此，P68 不再继续扩 merchant 内容，也不直接开新路线。P68 的任务是把 `P58/P59/P61/P63/P64/P66/P67` 当成一个完整玩家体验包，用 bounded 的 replay + human-readable playtest + verdict 文档，确认三条 ordinary→merchant 路线是否真的让玩家记住：

- 我是怎么成功的
- 我为了这种成功失去了什么
- 我这局最后是什么命

如果 P68 不能给出明确的玩家感知结论，那么直接复制方法论到下一条路线会有较高误判风险。

## 2. Goals

- 对 merchant trilogy 做一次正式的真实体验验证收口
- 判断 `P66/P67` 的差异是否已经玩家可感知，而非仅 repo 可证明
- 明确这套 merchant trilogy 方法论是否足够稳定，值得迁移到下一条路线
- 为 `P69` 的候选路线选择提供质量门槛结论

## 3. Non-Goals

- 不新增 merchant trilogy runtime 内容
- 不重写 `P58-P67` 任一已闭合阶段
- 不直接开新 ordinary→mixed 或 ordinary→mainstream 实施
- 不做 playtest 平台化或全量用户研究系统
- 不重开 sample-line 总线规划

## 4. User Stories

### US-001: Audit Existing Merchant Trilogy Validation Assets
**Description:** As a maintainer, I want an audit of the existing replay, proof, and playtest assets so P68 reuses what already exists instead of inventing a parallel validation workflow.

**Acceptance Criteria:**
- [ ] 汇总 merchant trilogy 当前已有的 proof、tests、playtest-style 文档资产
- [ ] 明确哪些资产可直接复用，哪些验证口径仍缺
- [ ] 输出 `docs/test-reports/p68-merchant-trilogy-validation-asset-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P68 Validation Scope Contract
**Description:** As a planner, I want a scope contract so P68 stays a bounded validation/readout stage rather than slipping into new merchant implementation.

**Acceptance Criteria:**
- [ ] 明确 P68 只处理 replay、playtest、readout、verdict
- [ ] 明确允许层：文档、最小验证脚本、comparison readout
- [ ] 明确禁止项：新 merchant content、新系统、新 bridge、新 mixed ending
- [ ] 输出 `docs/test-reports/p68-merchant-trilogy-validation-scope-contract.md`

### US-003: Define Merchant Trilogy Experience Verdict Contract
**Description:** As a designer, I want a fixed verdict contract so P68 evaluates the trilogy on the same player-facing dimensions across all three routes.

**Acceptance Criteria:**
- [ ] 定义至少 3 个固定体验维度：成功代价、成功形状、命运句记忆度
- [ ] 明确 pass / warning / fail 的判定口径
- [ ] 说明 replay 证据与 human-readable playtest 证据如何合并
- [ ] 合同写入 PRD 或附录

### US-004: Produce A Bounded Merchant Trilogy Replay / Comparison Readout
**Description:** As a maintainer, I want one bounded comparison readout that shows the trilogy can be reviewed side by side without requiring full platformized playtest infrastructure.

**Acceptance Criteria:**
- [ ] 产出 1 份 merchant trilogy comparison-style readout
- [ ] 覆盖 apprentice / tavern / peasant 三线
- [ ] 证据必须能落到成功代价、成功形状、命运句三个维度
- [ ] 不要求 full lifetime exhaustive matrix

### US-005: Run Merchant Trilogy Human-Readable Playtest Readout
**Description:** As a reviewer, I want a human-readable playtest-style verdict that answers whether the trilogy now feels like three different lives instead of one merchant path with variations.

**Acceptance Criteria:**
- [ ] 至少产出 1 份 human-readable playtest readout
- [ ] 明确每条线的 pass / warning / fail 结论
- [ ] 明确玩家是否能复述三条路线的差异
- [ ] 不要求真实外部用户平台化

### US-006: Judge Methodology Transfer Readiness
**Description:** As a planner, I want a formal readiness judgment on whether the merchant trilogy optimization method is stable enough to transfer to another route.

**Acceptance Criteria:**
- [ ] 明确方法论是否达到“可迁移”门槛
- [ ] 若未达到，指出缺口属于验证问题还是内容问题
- [ ] 若达到，明确迁移时必须保留的最小阶段顺序
- [ ] 结论写入 closure 或 verdict 文档

### US-007: Add Narrow Validation Reinforcement If Needed
**Description:** As a maintainer, I want only the minimum additional validation support needed if existing merchant trilogy evidence is insufficient for a transfer-readiness judgment.

**Acceptance Criteria:**
- [ ] 若现有验证资产足够，则明确记录无需新增验证
- [ ] 若不足，则只补最小 readout / comparison-level 验证资产
- [ ] 不重写 `P58-P67` 主测试体系
- [ ] 相关命令 Pass

### US-008: Produce P68 Closure Report
**Description:** As a maintainer, I want a closure report stating whether the merchant trilogy method is now player-validated and ready to inform the next route choice.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p68-merchant-trilogy-live-experience-closure-report.md`
- [ ] 汇总 asset audit、scope contract、verdict contract、readout、playtest、transfer readiness
- [ ] 明确与 `P69` 的边界
- [ ] 列出仍 defer 的 full playtest / platform 项

## 5. Functional Requirements

1. FR-1: P68 必须以 merchant trilogy 已有闭合内容为验证对象，而不是新实现对象。
2. FR-2: P68 必须至少覆盖成功代价、成功形状、命运句记忆度三个体验维度。
3. FR-3: P68 必须给出方法论是否可迁移的明确结论，而不是泛泛“还不错”。
4. FR-4: P68 不得借验证之名扩成新 merchant 实施阶段。
5. FR-5: P68 closure 必须给出 `P69` 的输入门槛与判断口径。

## 6. Success Criteria

- repo 内存在 1 份 merchant trilogy 的 live-experience validation truth source
- 已明确这套方法论是否达到可迁移门槛
- 若存在 warning，也已明确 warning 是否阻塞下一条路线选择
- 不破坏 `P58-P67` 既有闭合结论

## 7. Dependencies / Context

- P65 closure: `docs/test-reports/p65-merchant-trilogy-player-experience-closure-report.md`
- P66 closure: `docs/test-reports/p66-success-cost-differentiation-closure-report.md`
- P67 closure: `docs/test-reports/p67-success-shape-recap-closure-report.md`
- P49 playtest precedent: `docs/test-reports/p49-sample-lines-playtest-round-2.md`
- P49 validation gap framing: `agent_docs/p49-wuxia-sample-lines-validation-and-playtest-gaps.md`

## 8. Risks And Rollback

### Risks

- **Paper-pass risk:** 容易把 closure 文档强度误当成玩家真实体验强度
- **Validation drift risk:** 容易重建一套脱离现有 repo 验证习惯的 playtest 口径
- **Overread risk:** 容易因 warning 过度保守，错过下一条路线窗口

### Rollback

- 若 P68 证明方法论未达可迁移门槛，则 `P69` 应改为补验证/补收口，而非直接选新线
- 若 P68 证明现有证据已足够，则后续不再补重复 merchant 验证阶段

## 9. Validation Direction

- comparison 层：三条路线必须能被并排读出差异
- recall 层：玩家可复述"怎么成功、失去什么、成了什么人"
- transfer 层：closure 必须明确方法论何时可以迁移、何时不可以

---

## Appendix A: Merchant Trilogy Experience Verdict Contract

> Full version: `docs/test-reports/p68-merchant-trilogy-verdict-contract.md`

### A.1 Three Fixed Experience Dimensions

| Dimension | Core Question | Key Signals |
|-----------|--------------|-------------|
| **Success-Cost Differentiation (成功代价)** | "What did I lose?" | Cost labels persist; payoff has "success... but" structure; identity carries cost weight; cost matches origin character |
| **Success-Shape Differentiation (成功形状)** | "How did I succeed?" | Distinct success metaphors per route; payoff frames different success mechanisms; identity frames as "built through" not "came from"; cost and success align |
| **Destiny-Sentence Recall (命运句记忆度)** | "What was my life?" | Destiny sentence exists per route; parallel structure, distinct meaning; vivid origin anchor; distinctive verb; short enough to remember |

### A.2 Judgment Rules

**Pass:** Implemented, distinct, origin-echo, persists, playtest-readable — all five.

**Warning:** Implemented but thin, or entry-only, or partial coverage, or mixed evidence, or weak origin echo.

**Fail:** Not implemented, not distinct, not player-visible, no origin connection, or playtest can't tell.

### A.3 Evidence Combination

Replay evidence (tests/proofs) is the floor. Playtest evidence (human readout) is the ceiling.

| Replay | Playtest | Combined |
|--------|----------|----------|
| Pass | Pass | Pass |
| Pass | Warning | Warning |
| Pass | Fail | Warning |
| Warning | Pass | Warning |
| Warning | Warning | Warning |
| Warning | Fail | Fail |
| Fail | Pass | Warning |
| Fail | Warning | Fail |
| Fail | Fail | Fail |

### A.4 Overall Verdict

- **Overall Pass:** All 3 dimensions pass → transfer-ready
- **Overall Warning:** 1–2 warnings, 0 fails → transfer-ready with caveats
- **Overall Fail:** Any dimension fails → not transfer-ready

### A.5 Transfer-Readiness Threshold

Transfer-ready if: overall pass/warning + at least 2 dimensions pass + no fails + weak spots documented.

Full contract with application protocol → `docs/test-reports/p68-merchant-trilogy-verdict-contract.md`

# PRD: P57 Wuxia Sample Lines Second 40+ Node

> **Derived from:** `docs/test-reports/p53-sample-lines-40-plus-scope-contract.md`, `agent_docs/p54-wuxia-sample-lines-residual-polish-gaps.md`, `docs/test-reports/p54-sample-lines-residual-polish-closure-report.md`  
> **Stage slug:** `p57-wuxia-sample-lines-second-40-plus-node`  
> **Stage type:** optional low-priority bounded sample-line extension after P54 CLEAR

## 1. Introduction

P53 已为三条 sample line 各补了 **1 个** age-45 40+ payoff 节点，并在 scope contract 里明确写过：每线 payoff 节点上限是 **2**，但当前 contract 只实际落了 **1** 个。P54 又明确把“每线第二个 40+ 节点”列为 **P3 defer**，不是 blocker，也不是当前主增长线的首选。

因此，P57 的定位必须很清楚：这是一个 **optional、低优先级、bounded** 的后续阶段。它只在你希望继续提升现有三条 sample line 的晚年回报层次时才值得做，而且前提是不能重开 sample-line 骨架、不能回到 full lifetime sim、不能影响 P52/P53/P54 已经锁定的 guard 结论。

## 2. Goals

- 为三条 sample line 各评估是否值得补第 2 个 40+ payoff 节点
- 若值得补，定义并落地最小 second-node contract
- 保持 age-40 identity、age-45 payoff 与 residual polish 结论不退化
- 用最小 replay / guard 延伸证明 second-node 真实存在且线间仍 distinct

## 3. Non-Goals

- 不作为必须推进的主阶段
- 不重开 0–40 baseline 或 P54 residual polish
- 不切回 sample-line full birth→death lifetime sim
- 不为每线补超过 1 个新增 second node
- 不引入第四条线、不做平台化、不重写 UI
- 不替代更高优先的 `merchant_magnate` / ordinary growth 阶段

## 4. User Stories

### US-001: Audit Whether Second 40+ Nodes Are Worth Doing
**Description:** As a maintainer, I want an audit of whether each current sample line actually benefits from a second 40+ node so P57 is optional by evidence rather than habit.

**Acceptance Criteria:**
- [ ] 评估 orthodox / demonic / merchant 三线当前 age-45 payoff 的完整度
- [ ] 识别哪些线真的存在 second-node payoff gap，哪些线不值得继续补
- [ ] 输出 `docs/test-reports/p57-sample-lines-second-40-plus-gap-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock Optional Scope Contract
**Description:** As a planner, I want an explicit optional scope contract so P57 stays low-risk and does not quietly reopen the closed sample-line track.

**Acceptance Criteria:**
- [ ] 明确本阶段优先级低于 P55/P56
- [ ] 明确每线最多新增 1 个 second node
- [ ] 明确禁止项：full lifetime sim、sample-line 主骨架重写、第四条线、平台化
- [ ] 输出 `docs/test-reports/p57-sample-lines-second-40-plus-scope-contract.md`

### US-003: Define Orthodox Second-Node Contract
**Description:** As a designer, I want a bounded second-node contract for the orthodox line so any late-life extension adds a new stewardship payoff instead of repeating age-45.",

**Acceptance Criteria:**
- [ ] 定义 orthodox second node 的主题与前置条件
- [ ] 明确与 age-45 legacy stewardship 的差异
- [ ] 不重写正派主轴
- [ ] 规格写入 PRD 或 audit 附录

### US-004: Define Demonic Second-Node Contract
**Description:** As a designer, I want a bounded second-node contract for the demonic line so any late-life extension deepens backlash or rule-making instead of repeating age-45 territory consolidation.",

**Acceptance Criteria:**
- [ ] 定义 demonic second node 的主题与前置条件
- [ ] 明确与 age-45 territory consolidation 的差异
- [ ] 不重写邪路主轴
- [ ] 规格写入 PRD 或 audit 附录

### US-005: Define Merchant Second-Node Contract
**Description:** As a designer, I want a bounded second-node contract for the merchant line so any late-life extension deepens scale or succession pressure instead of repeating age-45 expansion fork.",

**Acceptance Criteria:**
- [ ] 定义 merchant second node 的主题与前置条件
- [ ] 明确与 age-45 expansion fork 的差异
- [ ] 不破坏 merchant debt / favor / expansion 既有语义
- [ ] 规格写入 PRD 或 audit 附录

### US-006: Decide Go / No-Go Per Line
**Description:** As a maintainer, I want a line-by-line go or no-go decision so P57 can skip weak candidates instead of forcing symmetry across all three lines.",

**Acceptance Criteria:**
- [ ] 对三条线分别给出 go / no-go 结论
- [ ] 允许 1–3 条线不是全部都必须落 second node
- [ ] 结论有证据和范围理由
- [ ] decision 写入 scope contract 或 gap audit

### US-007: Wire Approved Second-Node Configuration
**Description:** As a developer, I want only the approved second nodes wired through bounded configuration changes so the optional late-life extension remains small and testable.",

**Acceptance Criteria:**
- [ ] 仅为 go-lines 落配置
- [ ] 不引入新的 sample-line framework
- [ ] age-40 / age-45 既有结论不退化
- [ ] 相关 targeted sim 可触发

### US-008: Add Second-Node Player-Facing Expression
**Description:** As a player, I want approved second nodes to appear on existing expression surfaces so the late-life extension is visible and not just hidden in flags.",

**Acceptance Criteria:**
- [ ] 为 go-lines 补 second-node 文案表达
- [ ] 文案与 age-45 payoff 明确区分
- [ ] 不新增 UI 组件
- [ ] 对应表达测试可新增或更新

### US-009: Extend Replay And Guard Narrowly
**Description:** As a maintainer, I want narrow replay and guard coverage for any approved second nodes so optional late-life content cannot silently disappear later.",

**Acceptance Criteria:**
- [ ] 仅为 go-lines 增加 replay / guard 窄断言
- [ ] 不把 cheap guard 扩成新大 gate
- [ ] replay latest 或 companion artifact 能体现 second node
- [ ] 相关命令 Pass

### US-010: Produce P57 Closure Report
**Description:** As a maintainer, I want a P57 closure report stating whether the optional second-node stage was worthwhile and which lines, if any, actually got extended.",

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p57-sample-lines-second-40-plus-closure-report.md`
- [ ] 汇总 audit、go/no-go 决策、配置、表达、验证证据
- [ ] 明确哪些线补了 second node，哪些保留 no-go
- [ ] 不把 P57 表述为 sample-line 主线必经阶段

## 5. Functional Requirements

1. FR-1: P57 必须先做 line-by-line go / no-go，再决定是否落配置。
2. FR-2: P57 每线最多新增 1 个 second 40+ node。
3. FR-3: P57 不得让 age-40 identity、age-45 payoff、P54 residual polish 回归。
4. FR-4: P57 必须复用既有 sample-line config / replay / guard harness。
5. FR-5: P57 closure 必须允许“部分线 no-go”作为成功结果。

## 6. Success Criteria

- 若 go，则 second node 对现有 age-45 payoff 形成真实增量而非重复
- 若 no-go，也有清晰文档说明为何不值得继续补
- 已批准的 second node 具备最小配置、表达、验证闭环
- 既有 sample-line guard 不退化

## 7. Dependencies / Context

- P53 scope contract: `docs/test-reports/p53-sample-lines-40-plus-scope-contract.md`
- P54 closure: `docs/test-reports/p54-sample-lines-residual-polish-closure-report.md`
- P54 defer queue: `agent_docs/p54-wuxia-sample-lines-residual-polish-gaps.md`

## 8. Open Questions

- 是否必须三线对称补 second node，还是允许只补 1–2 条线
- second node 更适合放在 age 50、55，还是 terminal recap
- 若 `merchant_magnate` 先推进，merchant sample-line second node 是否还有必要

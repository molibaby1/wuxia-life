# PRD: P54 Wuxia Sample Lines Residual Polish

> **Derived from:** `docs/test-reports/p52-cross-tester-playtest-comparison.md`, `docs/test-reports/p52-baseline-hardening-closure-report.md`, `docs/test-reports/p53-sample-lines-40-plus-closure-report.md`  
> **Stage slug:** `p54-wuxia-sample-lines-residual-polish`  
> **Stage type:** bounded residual polish on top of P53 sample-line baseline

## 1. Introduction

P53 已将三条 0–40 样本线扩展为 **0–40 baseline + 40+ payoff slice**，并通过 replay、cheap guard 与 closure 报告完成收口。当前样本线主链、年龄切片与玩家可见目标文案都已成立，不需要继续扩大年龄段、增加第四条线或切回 full lifetime sim。

但 P52/P53 文档链仍保留两个 **monitor-only residual**：

- `M-orthodox-gray`：seed 301 的 gray mission / 代价分支可感知度偏弱
- `M-merchant-debt`：seed 804 的 midlife 债务 / 人情代价深度偏轻

这两个问题不阻塞当前 baseline，但它们正好对应“玩家还能感到差一点”的体验缺口。P54 的目标不是扩系统，而是在 **不改变 sample-line 主骨架** 的前提下，把这两个 residual 补到更可感知、更可复盘，并用现有 replay / guard harness 固化结果。

## 2. Goals

- 补强商路线 midlife debt / loyalty 代价信号，使 age 25–45 的代价链更可感知
- 补强正派线 gray mission / 守正代价信号，使 seed 301 的代价体验更清晰
- 保持三线主轴、age checkpoints、40+ payoff 与既有 baseline guard 不退化
- 为 residual polish 增加窄断言与 closure 证据，避免后续回退

## 3. Non-Goals

- 不新增第四条样本线
- 不扩到 age 55+ 或新增第二个 40+ payoff 节点
- 不重做 sample-line spine 主结构
- 不切回 full birth→death lifetime sim 主线
- 不做 runtime 平台化、调度器重写或大 UI 改造
- 不把 monitor-only residual 扩成全量事件池重写
- 不引入新的测试框架或新的 gate 类型

## 4. User Stories

### US-001: Audit Residual Truth Sources
**Description:** As a maintainer, I want a narrow audit of the two remaining sample-line residuals so P54 only modifies proven weak spots instead of broadly retuning content.

**Acceptance Criteria:**
- [ ] 汇总 `M-orthodox-gray` 与 `M-merchant-debt` 的当前证据来源
- [ ] 明确弱点落在哪些年龄段、哪些事件 / currentGoal / replay 维度
- [ ] 输出 `docs/test-reports/p54-sample-lines-residual-polish-gap-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock Residual Polish Scope Contract
**Description:** As a planner, I want an explicit P54 scope contract so the stage stays bounded to two residuals and does not sprawl into new sample-line expansion.

**Acceptance Criteria:**
- [ ] 明确只处理 `M-orthodox-gray` 与 `M-merchant-debt`
- [ ] 明确允许改动的层：剧情配置、轻量展示、验证脚本
- [ ] 明确禁止项：新样本线、full lifetime sim、平台化、全量池重写
- [ ] 输出 `docs/test-reports/p54-sample-lines-residual-polish-scope-contract.md`

### US-003: Define Merchant Debt Signal Contract
**Description:** As a designer, I want a concrete merchant debt signal contract so the business line expresses debt and favor pressure more clearly without changing its merchant-first identity.

**Acceptance Criteria:**
- [ ] 指定至少 2 个 merchant 关键年龄信号位（建议覆盖 25/32/40/45 中的两个或以上）
- [ ] 每个信号位明确“债务 / 人情 / 扩张压力”表达目标
- [ ] 不改变 seed 804 的 merchant-first / age-40 identity / age-45 payoff 既有结论
- [ ] 规格写入 PRD 或 gap audit 附录

### US-004: Define Orthodox Gray Cost Signal Contract
**Description:** As a designer, I want a concrete orthodox gray cost signal contract so the orthodox line shows the cost of staying righteous more clearly on the benchmark seed.

**Acceptance Criteria:**
- [ ] 指定至少 2 个 orthodox 关键年龄信号位（建议覆盖 18/25/32/40 中的两个或以上）
- [ ] 每个信号位明确“守正代价 / 灰度选择压力”表达目标
- [ ] 不把正派线改写成灰路线主轴
- [ ] 规格写入 PRD 或 gap audit 附录

### US-005: Wire Merchant Residual Polish In Story Configuration
**Description:** As a developer, I want the merchant residual polish implemented in bounded configuration changes so the debt signal becomes visible on the benchmark seed without route bleed or line drift.

**Acceptance Criteria:**
- [ ] 仅通过现有剧情配置载体补强 merchant debt / loyalty signals
- [ ] seed 804 在 contract 指定年龄至少出现 1 个更强 debt/favor signal
- [ ] 不破坏 age-25「第一桶金已得，店铺经营中」与 age-40 / age-45 既有身份判断
- [ ] `npm exec tsx tests/p50SampleLineSpineTests.ts` 仍 Pass

### US-006: Wire Orthodox Residual Polish In Story Configuration
**Description:** As a developer, I want the orthodox residual polish implemented in bounded configuration changes so the righteousness cost becomes more legible on the benchmark seed without changing the orthodox core route.

**Acceptance Criteria:**
- [ ] 仅通过现有剧情配置载体补强 orthodox gray / sacrifice signals
- [ ] seed 301 在 contract 指定年龄至少出现 1 个更强守正代价 signal
- [ ] 不破坏 age-40 / age-45 orthodox identity 与 payoff 结论
- [ ] `npm exec tsx tests/p50SampleLineSpineTests.ts` 仍 Pass

### US-007: Tighten Player-Facing Expression For Merchant Debt
**Description:** As a player, I want the merchant line to state debt and favor pressure more clearly at key checkpoints so the cost of business growth is legible instead of implied.

**Acceptance Criteria:**
- [ ] 在既有表达面补强 merchant 关键年龄 currentGoal / identity summary / life-memory 之一或多者
- [ ] 至少覆盖 seed 804 的 2 个 checkpoint
- [ ] 不新增 UI 组件
- [ ] `npm exec tsx tests/p50SampleLineExpressionTests.ts` 覆盖对应断言并 Pass

### US-008: Tighten Player-Facing Expression For Orthodox Gray Cost
**Description:** As a player, I want the orthodox line to state righteousness cost more clearly at key checkpoints so the gray-pressure tradeoff is legible instead of flat.

**Acceptance Criteria:**
- [ ] 在既有表达面补强 orthodox 关键年龄 currentGoal / identity summary / life-memory 之一或多者
- [ ] 至少覆盖 seed 301 的 2 个 checkpoint
- [ ] 不新增 UI 组件
- [ ] `npm exec tsx tests/p50SampleLineExpressionTests.ts` 覆盖对应断言并 Pass

### US-009: Extend Replay Assertions For Residual Signals
**Description:** As a maintainer, I want replay assertions for the two residuals so future tuning cannot silently collapse the newly added cost signals.

**Acceptance Criteria:**
- [ ] 为 seed 301 与 804 新增窄 replay / comparison 断言
- [ ] 断言聚焦 residual signal，不重写全量 comparison 口径
- [ ] `npm exec tsx tests/p49SampleLineReplayTests.ts` Pass
- [ ] `npm run p49:replay` 刷新 latest artifacts

### US-010: Extend Cheap Guard With Residual Invariants
**Description:** As a maintainer, I want the cheap guard to cover the residual-polish invariants so later sample-line edits cannot silently erase them.

**Acceptance Criteria:**
- [ ] 更新 guard contract，新增 P54 residual invariants
- [ ] `npm run guard:sample-lines-baseline` 包含这些断言且 Pass
- [ ] 不替代 `npm run gate:playability`
- [ ] 不引入新的 runner

### US-011: Produce P54 Closure Report
**Description:** As a maintainer, I want a P54 closure report showing whether the two residuals moved from monitor-only weakness to acceptable polished baseline.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p54-sample-lines-residual-polish-closure-report.md`
- [ ] 汇总剧情配置、轻量展示、验证脚本三层证据
- [ ] 明确哪些 residual 已关闭，哪些仍只是 monitor
- [ ] 不把 P54 表述成新主阶段扩张

## 5. Functional Requirements

1. FR-1: P54 只允许处理 `M-orthodox-gray` 与 `M-merchant-debt` 两个 residual。
2. FR-2: P54 的实现层必须明确拆分为剧情配置、轻量展示补齐、验证脚本三类工作。
3. FR-3: P54 不得改变三条 sample line 的主轴判定与既有 age-40 / age-45 结论。
4. FR-4: P54 必须复用既有 `p50` / `p49` / `guard:sample-lines-baseline` harness。
5. FR-5: P54 的新增断言必须是窄而稳定的 residual invariant，不能把 cheap guard 扩成全量 playability gate。

## 6. Success Criteria

- seed 804 的 debt / loyalty pressure 在至少两个关键 checkpoint 更可见
- seed 301 的 righteousness cost / gray pressure 在至少两个关键 checkpoint 更可见
- replay latest 与 cross-line comparison 能反映对应差异维度
- `typecheck`、`p50SampleLineSpineTests`、`p50SampleLineExpressionTests`、`p49SampleLineReplayTests`、`guard:sample-lines-baseline` 全 Pass
- closure 报告能明确 residual 是关闭还是继续 monitor

## 7. Dependencies / Context

- P52 comparison: `docs/test-reports/p52-cross-tester-playtest-comparison.md`
- P52 closure: `docs/test-reports/p52-baseline-hardening-closure-report.md`
- P53 closure: `docs/test-reports/p53-sample-lines-40-plus-closure-report.md`
- Spine config: `src/data/lines/sample-lines-spine.json`
- Expression: `src/p50/sampleLineExpression.ts`
- Replay: `scripts/runP49SampleLineReplay.ts`
- Tests: `tests/p50SampleLineSpineTests.ts`, `tests/p50SampleLineExpressionTests.ts`, `tests/p49SampleLineReplayTests.ts`

## 8. Open Questions

- merchant debt signal 应优先补在 age 32 / 40 还是 40 / 45
- orthodox gray signal 应优先补在 age 18 / 25 还是 25 / 32
- 若 residual 体验改善但仍不适合定义为“closed”，closure 报告是否保留 warning 而非继续标记 monitor-only

# PRD: P64 Wuxia Merchant Magnate Differentiated Pressure And Payoff

> **Derived from:** `docs/test-reports/p63-merchant-entry-differentiation-closure-report.md`, `docs/test-reports/p55-merchant-magnate-closure-report.md`, `docs/test-reports/p58-town-apprentice-merchant-bridge-closure-report.md`, `docs/test-reports/p59-tavern-hand-bridge-closure-report.md`, `docs/test-reports/p61-farm-peasant-playable-bridge-closure-report.md`
> **Stage slug:** `p64-wuxia-merchant-magnate-differentiated-pressure-payoff`
> **Stage type:** bounded post-entry merchant densification stage after entry differentiation

## 1. Introduction

在 `P63` 先把三条 ordinary-origin bridge 的 merchant entry 做出最小分化之后，下一步若仍存在明显缺口，才值得进入 `P64`：围绕 `magnate_midlife_pressure` 与 `magnate_payoff` 的 bounded differentiated follow-through。

`P55` 已经给出统一的 magnate 骨架，但它本质上是“merchant_magnate 作为 mixed outcome 的最小成立版”。如果 `P63` 之后仍然出现“entry 虽然不同，但到了 pressure / payoff 又重新收平”的情况，那么最合理的后续不是再开新 destiny，也不是 full economy 系统，而是在既有 pressure / payoff 结构上补最小的 origin-sensitive difference。

因此，P64 的任务不是新增大量商路内容，而是检验并最小修复“bridge 后中后段仍不够区分”的问题：让 apprentice / tavern / peasant 三条 merchant ascent 在代价、压力来源或 payoff emphasis 上有 bounded 差异，同时不破坏 `P55` 的统一 magnate identity。

## 2. Goals

- 在 `magnate_midlife_pressure` / `magnate_payoff` 现有骨架上补最小差异化
- 让三条 ordinary-origin merchant ascent 在中后段仍保有不同的代价与收益重心
- 复用 `P55` 主链，不做 full merchant second wave
- 用 targeted proof 与窄测试证明分化存在且不回归

## 3. Non-Goals

- 不新建完整 merchant 第二主线
- 不重做 `magnate_on_ramp`
- 不新增 economy / map / chamber / trade-platform 系统
- 不转向新 mixed destiny 或 renown 线
- 不重开 ordinary bridge trilogy
- 不做 combinatorial exhaust 或 full lifetime merchant sandbox

## 4. User Stories

### US-001: Audit Pressure And Payoff Flattening
**Description:** As a maintainer, I want an audit of where the three merchant entries still flatten back into one shared magnate experience so P64 solves the real mid/late-stage gap.

**Acceptance Criteria:**
- [ ] 汇总 `magnate_midlife_pressure` 与 `magnate_payoff` 当前共享部分
- [ ] 明确哪些共享是应保留的统一 magnate identity，哪些共享造成 route flattening
- [ ] 输出 `docs/test-reports/p64-merchant-pressure-payoff-flattening-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P64 Scope Contract
**Description:** As a planner, I want a scope contract so P64 stays a bounded densification stage rather than growing into a new merchant content wave.

**Acceptance Criteria:**
- [ ] 明确 P64 只处理 pressure / payoff 差异化
- [ ] 明确允许层：轻量配置、表达、proof、窄测试
- [ ] 明确禁止项：新大型链路、新系统、full merchant universe
- [ ] 输出 `docs/test-reports/p64-merchant-pressure-payoff-scope-contract.md`

### US-003: Define Differentiated Pressure Contracts
**Description:** As a designer, I want bounded pressure contracts for apprentice / tavern / peasant merchant ascents so their burdens do not read identically.

**Acceptance Criteria:**
- [ ] 至少定义 3 条 pressure emphasis contract
- [ ] 每条 pressure 都必须绑定其 origin-to-merchant path，而不是 generic merchant stress
- [ ] 不破坏统一 `merchant_magnate` mixed identity
- [ ] 合同写入 PRD 或附录

### US-004: Define Differentiated Payoff Contracts
**Description:** As a designer, I want bounded payoff contracts so the three merchant entries land with different emphases rather than one undifferentiated merchant success line.

**Acceptance Criteria:**
- [ ] 至少定义 3 条 payoff emphasis contract
- [ ] 每条 payoff 必须体现不同来源带来的收益重心
- [ ] 与 `merchant_martial_patron`、generic merchant success、P55 baseline payoff 保持区分
- [ ] 合同写入 PRD 或附录

### US-005: Wire Pressure/Payoff Differentiation
**Description:** As a developer, I want the differentiated pressure/payoff implemented through bounded configuration or marker changes so the main magnate chain remains intact.

**Acceptance Criteria:**
- [ ] 只通过现有 magnate carriers 或轻量 marker 实现差异化
- [ ] 不引入新的 merchant framework
- [ ] `P55` 主链仍可稳定触发
- [ ] P55/P58/P59/P61/P63 evidence 不退化

### US-006: Add Differentiated Merchant Expression
**Description:** As a player, I want the three magnate ascents to read differently once they reach pressure and payoff phases.

**Acceptance Criteria:**
- [ ] 至少补 3 组 pressure/payoff-specific 表达信号
- [ ] 玩家能区分 apprentice / tavern / peasant 中后段 merchant burden/payoff
- [ ] 不新增 UI 组件
- [ ] 对应表达测试可新增或更新

### US-007: Add Targeted Differentiated Proof
**Description:** As a maintainer, I want a bounded proof artifact showing that the three merchant ascents now diverge meaningfully in mid/late-stage emphasis.

**Acceptance Criteria:**
- [ ] 新增 1 条 comparison-style targeted proof
- [ ] 关键证据包含 pressure / payoff differentiation 对照
- [ ] 不要求 full merchant combinatorial exhaust
- [ ] proof 与 P55 baseline magnate chain 可对照

### US-008: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow tests guarding the differentiated pressure/payoff so future edits do not collapse the merchant trilogy back into one path.

**Acceptance Criteria:**
- [ ] 至少覆盖 marker、expression、comparison-level assertion 三类断言
- [ ] 复用既有 merchant / bridge harness
- [ ] 不重写全量 merchant tests
- [ ] 相关命令 Pass

### US-009: Produce P64 Closure Report
**Description:** As a maintainer, I want a closure report stating exactly what post-entry merchant differentiation now exists and what remains deferred.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p64-merchant-pressure-payoff-differentiation-closure-report.md`
- [ ] 汇总 flattening audit、contracts、config、expression、proof、tests
- [ ] 明确与 future full merchant wave 的边界
- [ ] 列出仍 defer 的更大 economy / map / new-destiny 项

## 5. Functional Requirements

1. FR-1: P64 必须只处理 `merchant_magnate` pressure/payoff 层的 bounded 差异化。
2. FR-2: P64 的差异化必须承接 `P63` 已确定的 entry differentiation，而不是脱离 bridge identity 另起炉灶。
3. FR-3: P64 必须复用 `P55` 统一 magnate chain，不得分叉出独立 merchant 主线。
4. FR-4: P64 必须让 pressure/payoff difference 变成 runtime-visible 并可被 proof/test 捕捉。
5. FR-5: P64 closure 必须明确到此为止仍 defer 的 full merchant densification 边界。

## 6. Success Criteria

- 三条 ordinary-origin merchant ascent 在中后段仍能被稳定区分
- differentiation 既不破坏统一 magnate identity，也不退化成纯文案差异
- `P55/P58/P59/P61/P63` 回归保持通过
- repo 对“是否还需要 full merchant wave”有更清晰判断依据

## 7. Dependencies / Context

- P63 closure: `docs/test-reports/p63-merchant-entry-differentiation-closure-report.md`
- P55 closure: `docs/test-reports/p55-merchant-magnate-closure-report.md`
- P58 closure: `docs/test-reports/p58-town-apprentice-merchant-bridge-closure-report.md`
- P59 closure: `docs/test-reports/p59-tavern-hand-bridge-closure-report.md`
- P61 closure: `docs/test-reports/p61-farm-peasant-playable-bridge-closure-report.md`

## 8. Risks And Rollback

### Risks

- **Too-deep risk:** 容易把 bounded differentiation 扩成 full merchant second wave
- **Identity blur risk:** 容易为了保留统一 magnate identity 而做不出真实差异
- **Regression risk:** 对 shared pressure/payoff 的改动最容易影响 `P55` 既有证明

### Rollback

- 若 P63 证明 entry differentiation 已足够，且 pressure/payoff flattening 不构成真实缺口，则 P64 可 no-go
- 若唯一可行方案需要 full merchant wave 或新系统，则该方向应显式 defer

## 9. Validation Direction

- 配置层：difference 必须通过现有 magnate chain carriers 被 runtime 捕捉
- 表达层：玩家可见层必须能读出中后段差异
- 证明层：comparison proof 必须对照 P55 baseline magnate experience 与三线分化结果

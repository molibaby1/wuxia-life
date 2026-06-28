# PRD: P63 Wuxia Merchant Magnate Bridge-Entry Differentiation

> **Derived from:** `docs/test-reports/p62-ordinary-merchant-bridge-reconciliation-closure-report.md`, `docs/test-reports/p55-merchant-magnate-closure-report.md`, `docs/test-reports/p58-town-apprentice-merchant-bridge-closure-report.md`, `docs/test-reports/p59-tavern-hand-bridge-closure-report.md`, `docs/test-reports/p61-farm-peasant-playable-bridge-closure-report.md`
> **Stage slug:** `p63-wuxia-merchant-magnate-bridge-entry-differentiation`
> **Stage type:** bounded merchant on-ramp differentiation stage after trilogy reconciliation

## 1. Introduction

如果 P62 证明三条 ordinary-origin bridge 的主要未闭合点在 “进入 `merchant_magnate` 之后太快收束为同一条 magnate 入口体验”，那么最合理的下一步，不是直接扩写整条 magnate second wave，而是先从最小、最受控的切口开始：`magnate_on_ramp` 附近的 bridge-entry differentiation。

这个切口的价值在于，它既直接承接 `P58/P59/P61` 的 bridge identity，又不会破坏 `P55` 已经闭合的 on-ramp → pressure → payoff 骨架。换句话说，P63 的任务不是发明三条新商路线，而是让 apprentice / tavern / peasant 三条入口在进入同一 magnate 主链时，仍能被玩家与验证资产识别为不同的上升路径。

因此，P63 应该聚焦在 bridge 后早段的最小差异化：entry checkpoint flavor、on-ramp expression、轻量 gate-adjacent marker，避免直接跳去 pressure / payoff 或 merchant 宇宙扩建。

## 2. Goals

- 为 apprentice / tavern / peasant 三条 bridge 进入 `merchant_magnate` 的早段体验做最小差异化
- 在不改写 `P55` magnate 骨架的前提下，提高 bridge 后 entry 的 route legibility
- 让差异既是 runtime-visible，也可被 targeted proof / narrow tests 捕捉
- 为更后段的 `P64` pressure/payoff differentiation 提供稳定前提

## 3. Non-Goals

- 不重做 `merchant_magnate` 全链
- 不直接扩到 `magnate_midlife_pressure` / `magnate_payoff` 的完整分化波次
- 不新建 merchant 子系统、economy map、trade platform
- 不重开 ordinary bridge trilogy，也不转向新 mixed destiny
- 不重开 sample-line 轨

## 4. User Stories

### US-001: Audit Merchant On-Ramp Sharedness
**Description:** As a maintainer, I want an audit of what the three ordinary bridges currently share at `merchant_magnate` entry so P63 targets the real flattening point.

**Acceptance Criteria:**
- [ ] 汇总三条 bridge 在 on-ramp 前后的共享 gate、共享 flags、共享表达
- [ ] 明确哪些共享是健康复用，哪些共享导致入口过度扁平
- [ ] 输出 `docs/test-reports/p63-merchant-on-ramp-sharedness-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P63 Scope Contract
**Description:** As a planner, I want a scope contract so P63 stays at bridge-entry differentiation and does not sprawl into a broader merchant wave.

**Acceptance Criteria:**
- [ ] 明确 P63 只处理 bridge 后早段 / on-ramp 附近
- [ ] 明确允许层：轻量配置、表达、proof、窄测试
- [ ] 明确禁止项：pressure/payoff 大扩写、full merchant densification、新系统
- [ ] 输出 `docs/test-reports/p63-merchant-entry-differentiation-scope-contract.md`

### US-003: Define Three Entry Differentiation Contracts
**Description:** As a designer, I want explicit contracts for how apprentice / tavern / peasant should read differently at merchant entry.

**Acceptance Criteria:**
- [ ] 为三条 bridge 各定义 1 组 entry identity contract
- [ ] 合同必须承接各自 bridge seed，而不是新造背景
- [ ] 明确哪些差异落在 expression，哪些差异落在轻量 runtime marker
- [ ] 不破坏 `merchant_magnate` 作为共享 mixed outcome 的定义

### US-004: Wire Entry-Level Differentiation
**Description:** As a developer, I want the merchant on-ramp to expose bounded differentiation by origin-bridge entry without requiring a new event framework.

**Acceptance Criteria:**
- [ ] 只通过现有 carrier / marker / gate-adjacent wiring 实现最小差异化
- [ ] 不新增新的 merchant route framework
- [ ] 分化后仍可稳定进入 P55 magnate chain
- [ ] P55/P58/P59/P61 既有 evidence 不退化

### US-005: Add Merchant Entry Player-Facing Expression
**Description:** As a player, I want the three bridge paths to read differently once they begin the magnate ascent.

**Acceptance Criteria:**
- [ ] 至少补 3 组 entry-specific 表达信号
- [ ] 玩家能区分 apprentice / tavern / peasant 三种入口风格
- [ ] 不新增 UI 组件
- [ ] 对应表达测试可新增或更新

### US-006: Add Targeted Entry Differentiation Proof
**Description:** As a maintainer, I want a bounded proof artifact showing that the three merchant entries now remain distinguishable after bridge crossing.

**Acceptance Criteria:**
- [ ] 新增 1 条 comparison-style targeted proof
- [ ] 关键证据包含 3 条 bridge 的 entry marker / expression 对照
- [ ] 不要求 full lifetime comparative exhaust
- [ ] 结果能直接支撑 P64 是否值得继续

### US-007: Add Narrow Differentiation Regression Coverage
**Description:** As a maintainer, I want narrow tests guarding the new entry differentiation so later merchant edits do not flatten the three entries again.

**Acceptance Criteria:**
- [ ] 至少覆盖 entry marker、表达、comparison-level assertion 三类断言
- [ ] 复用既有 bridge / merchant harness
- [ ] 不重写全量 merchant tests
- [ ] 相关命令 Pass

### US-008: Produce P63 Closure Report
**Description:** As a maintainer, I want a closure report stating exactly what bridge-entry differentiation now exists and what remains for later pressure/payoff work.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p63-merchant-entry-differentiation-closure-report.md`
- [ ] 汇总 sharedness audit、contracts、config、expression、proof、tests
- [ ] 明确与 P64 的边界
- [ ] 列出仍 defer 的更深 merchant densification 项

## 5. Functional Requirements

1. FR-1: P63 必须只处理 `merchant_magnate` bridge-entry / on-ramp 层的差异化。
2. FR-2: P63 的差异化必须直接承接 `apprentice / tavern / peasant` 三条 bridge 的既有 identity。
3. FR-3: P63 必须复用 `P55` 既有 magnate 骨架，不得替换其主链。
4. FR-4: P63 必须让分化结论可被 targeted proof 与窄测试验证。
5. FR-5: P63 closure 必须明确哪些后段差异仍留给 `P64`。

## 6. Success Criteria

- 三条 ordinary bridge 在进入 magnate early stage 后仍可被稳定区分
- 分化不只存在于 PRD 文案，而是 runtime-visible
- `P55/P58/P59/P61` 回归保持通过
- P64 是否值得继续，已拥有更清晰的依据

## 7. Dependencies / Context

- P62 closure: `docs/test-reports/p62-ordinary-merchant-bridge-reconciliation-closure-report.md`
- P55 closure: `docs/test-reports/p55-merchant-magnate-closure-report.md`
- P58 closure: `docs/test-reports/p58-town-apprentice-merchant-bridge-closure-report.md`
- P59 closure: `docs/test-reports/p59-tavern-hand-bridge-closure-report.md`
- P61 closure: `docs/test-reports/p61-farm-peasant-playable-bridge-closure-report.md`

## 8. Risks And Rollback

### Risks

- **Cosmetic-only risk:** 容易只补文案，不形成可验证的 post-bridge difference
- **Overfitting risk:** 容易为了三线不同而引入过多 special case
- **Scope drift:** 容易从 entry differentiation 滑到完整 merchant wave

### Rollback

- 若 P62 证明共享 on-ramp 已足够，则 P63 应可以 no-go 或缩成 expression-only polish
- 若唯一有效分化方式需要重写 P55 链，则视为越界，推迟到更大阶段

## 9. Validation Direction

- 配置层：差异化必须通过现有 carrier 或 marker 被 runtime 捕捉
- 表达层：三线 entry 的可读差异必须在现有 surfaces 中出现
- 证明层：comparison proof 必须能展示“三条都进 merchant，但入口仍不同”

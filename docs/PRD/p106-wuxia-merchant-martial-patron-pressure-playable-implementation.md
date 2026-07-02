# PRD: P106 Wuxia Merchant Martial Patron Pressure Playable Implementation

> **Derived from:** `docs/test-reports/p105-merchant-martial-patron-pressure-closure-report.md`, `docs/PRD/p105-merchant-martial-patron-pressure-contract.md`, `docs/test-reports/p105-p106-validation-shape.md`, `agent_docs/p105-wuxia-merchant-martial-patron-pressure-design-first-discovery-result.md`
> **Stage slug:** `p106-wuxia-merchant-martial-patron-pressure-playable-implementation`
> **Gaps addressed:** GAP-P105-D01
> **Stage type:** bounded pressure implementation stage for merchant_martial_patron

## 1. Introduction

P105 已完成 `merchant_martial_patron`（商武一体金主）路线的 pressure design-first contract：选定了「护商武力负担」方向，定义了 choice 事件规格、6 条变体分支、表达更新、验证形状。

对照 renown P74→P75 与 magnate pressure 方法论，patron 路线目前走完了 bridge → entry/on-ramp → payoff echo（轻量），但 **pressure 阶段仅有 contract、尚无 runtime**。P106 的目标是把 P105 contract 落地成可玩实现：spine event wiring + expression updates + targeted proof + regression tests。

这不是 full patron content wave，而是严格按 P105 contract 落地的 bounded implementation 阶段。

## 2. Goals

- 按 P105 contract 落地 `merchant_martial_patron` 的 pressure 阶段 runtime 实现
- 让 patron 路线从「盟约初立」推进到「护商武力负担兑现」
- 复用现有事件系统与 sample-lines-spine 架构，不建新系统
- 保持商武一体风味，与 magnate/renown pressure 明确区分
- 为后续 payoff 深化阶段预留 flag 接口
- P102–P104 与 P97–P101 magnate 既有 evidence 不退化

## 3. Non-Goals

- 不做 patron mid/late-life / endgame 深化（P107+）
- 不新建 route framework 或事件调度器
- 不重做 P102–P104 patron bridge entry / on-ramp wiring
- 不重做 P55/P97–P101 magnate spine
- 不做 full lifetime 全生命周期内容波次
- 不做 stat threshold gate 实现（contract 标注为 optional defer）
- 不做 ordinary origin expression（sample-line only；bonus defer）
- 不新增 UI 组件
- 不做 full-lifetime `gate:p20` broad rerun

## 4. User Stories

### US-001: Wire Patron Pressure Spine Event

**Description:** As a developer, I want the patron pressure event wired through the existing event system so players on the patron route encounter a real pressure milestone between on-ramp and payoff echo.

**Acceptance Criteria:**

- [ ] 在 `sample-lines-spine.json` 中配置 `merchant_patron_midlife_pressure` choice 事件
- [ ] 触发条件：`merchant_patron_on_ramp_done` + age 40–44 + exclusivity guards
- [ ] 6 条 variant 分支 + generic fallback，各设 `merchant_patron_midlife_pressure_done` + 对应 `merchant_patron_pressure_*` marker
- [ ] 事件插入于 `merchant_patron_bridge_entry` 与 `merchant_patron_payoff_echo` 之间
- [ ] 不引入新的事件框架或调度器
- [ ] P102–P104 既有 evidence 不退化
- [ ] `npm run typecheck` passes

### US-002: Add Pressure Player-Facing Expression (Core P0)

**Description:** As a player, I want the patron pressure to read as a meaningful turning point so the route feels like martial backer burden, not generic midlife stress.

**Acceptance Criteria:**

- [ ] `deriveSampleLineCostLabel()`：on-ramp「之累」→ pressure「之债/之累」深化（6 variants per contract §4.1）
- [ ] `merchantCurrentGoal()`：on-ramp 状态 → pressure 状态（6 variants per contract §4.1）
- [ ] Expression priority：magnate win > payoff > pressure > on-ramp；native > bridge-origin
- [ ] 至少 2 个 pressure-specific 可读信号（cost label + current goal）
- [ ] 保持商武一体风味；与 magnate/renown pressure 文本区分
- [ ] 不新增 UI 组件
- [ ] `npm run typecheck` passes

### US-003: Adjust Payoff Gate and Reserve Flag Interfaces

**Description:** As a maintainer, I want payoff gate aligned with pressure checkpoint and downstream flag interfaces reserved so P107+ can build without renaming.

**Acceptance Criteria:**

- [ ] `merchant_patron_payoff_echo` gate 改为 `merchant_patron_midlife_pressure_done` + `!merchant_patron_payoff_done`（contract §6.2）
- [ ] 代码中可见 `merchant_patron_payoff_resolved` / `merchant_patron_late_life_done` 预留（注释或 TODO）
- [ ] 本阶段不实现 payoff choice 逻辑
- [ ] Pressure 不设置 `merchant_patron_payoff_done` 或 `merchant_patron_identity_done`
- [ ] `npm run typecheck` passes

### US-004: Add Targeted Pressure Proof

**Description:** As a maintainer, I want a bounded proof artifact showing patron pressure fires correctly on native + at least one bridge-origin path.

**Acceptance Criteria:**

- [ ] 产出 1 份 targeted proof（on-ramp → pressure 路径验证）
- [ ] 展示 5 个核心节点：pre-pressure state → event fires → checkpoint set → cost label update → current goal update
- [ ] 至少 2 条路径：native + 1 bridge-origin
- [ ] 不要求 full lifetime exhaust
- [ ] 保存为 `docs/test-reports/p106-merchant-martial-patron-pressure-targeted-proof.md`
- [ ] `npm run typecheck` passes

### US-005: Add Narrow Regression Coverage

**Description:** As a maintainer, I want narrow tests guarding the patron pressure stage so future edits do not break the first patron pressure milestone.

**Acceptance Criteria:**

- [ ] 新增测试文件覆盖 pressure 阶段（如 `p106MerchantMartialPatronPressureTests.ts`）
- [ ] Group 1: Event wiring（7 tests）— 存在、条件、年龄、choice 类型、checkpoint、variant markers、fallback
- [ ] Group 2: Pre-pressure expression（2 tests）
- [ ] Group 3: Post-pressure expression（4 tests P0 + 1 P1）
- [ ] Group 4: Distinct from magnate/renown（2 tests）
- [ ] Group 5: No regression P102–P104（3 tests）
- [ ] Group 6: No regression P97–P101 magnate（2 tests）
- [ ] 约 19–22 断言；复用现有 test harness；相关命令 Pass
- [ ] `npm run typecheck` passes

### US-006: Produce P106 Closure Report

**Description:** As a maintainer, I want a closure report stating exactly what the patron pressure stage now provides and whether payoff deepening is justified next.

**Acceptance Criteria:**

- [ ] 输出 `docs/test-reports/p106-merchant-martial-patron-pressure-closure-report.md`
- [ ] 汇总 event wiring、expression、payoff gate、proof、tests
- [ ] 明确与 P107+ 的边界
- [ ] 列出仍 defer 的更大 patron-expansion 项
- [ ] 11 条 closure criteria（validation shape §4.1）全部满足或标注 defer
- [ ] 明确后续 payoff 阶段是否值得开（GO / NO-GO）
- [ ] `npm run typecheck` passes

## 5. Success Criteria

- `merchant_patron_midlife_pressure` runtime-visible，native + bridge-origin 至少各 1 条 proof 路径
- Cost label + current goal 在 pressure 后正确深化
- P102–P104 + P100/P101 测试不退化
- Typecheck + sample-lines-baseline guard 通过
- P107 无需重新做 direction 选择

## 6. Dependencies / Context

- P105 contract: `docs/PRD/p105-merchant-martial-patron-pressure-contract.md`
- P106 validation shape: `docs/test-reports/p105-p106-validation-shape.md`
- Magnate pressure precedent: `magnate_midlife_pressure` in sample-lines-spine
- Renown pressure implementation: P75 pattern
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 7. Open Questions

- Stat threshold gates（martialPower/businessAcumen ≥8）是否在 P106 实施或 defer
- Ordinary origin patron expression 是否作为 P106 bonus

## 8. Out-Of-Scope Follow-Up

1. Patron mid/late-life differentiation
2. Patron endgame echo deepening beyond P93 lightweight
3. Full Wave 3 mixed-achievement graph
4. North Star §8 broader Wave 1/2/4 waves
5. Full-lifetime simulation `gate:p20` broad rerun

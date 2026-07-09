# PRD: P115 Wuxia Founding Patriarch Midlife Pressure Playable Implementation

> **Derived from:** `docs/PRD/p114-wuxia-founding-patriarch-midlife-pressure-design-first.md`
> **Contract input:** `docs/PRD/p114-founding-patriarch-pressure-contract.md`
> **Validation input:** `docs/test-reports/p114-p115-validation-shape.md`
> **Stage slug:** `p115-wuxia-founding-patriarch-midlife-pressure-playable-implementation`
> **Gaps addressed:** GAP-P114-N01
> **Stage type:** bounded playable implementation

## 1. Introduction

P114 已锁定 `founding_patriarch` 中年压力段的方向与合同，但当前缺少可运行实现，导致 North Star §8 item 1 仍为 Partial。P115 的目标是按 P114 合同做最小可玩落地：只补齐单核心 pressure 事件、checkpoint、表达与 payoff gate 顺序，不扩写为多事件链，不引入新系统。

## 2. Goals

- 落地 `founding_patriarch_midlife_pressure` 单核心可玩事件（choice）
- 落地 `founding_patriarch_midlife_pressure_done` checkpoint 与分支 flag
- 落地最少 2 个 pressure 后表达信号（cost label + current goal）
- 将 payoff gate 顺序改为 `on-ramp -> pressure -> payoff`
- 提供 P115 proof 与回归证据，确认 P37/P102-P113/基线无退化

## 3. Non-Goals

- 不重写 P113 on-ramp 与 payoff 叙事主体
- 不扩展为多事件 pressure chain
- 不引入新系统、UI、平台能力
- 不处理 ordinary-origin founding-patriarch 扩展
- 不做 late-life/endgame 深化

## 4. User Stories

### US-001: Implement pressure core event and checkpoint

**Description:** As a player, I can encounter the founding-patriarch midlife pressure choice in age 40-45 after on-ramp and before payoff.

**Acceptance Criteria:**

- [ ] 新增 `founding_patriarch_midlife_pressure`（`choice`）事件，age gate 40-45
- [ ] 前置 gate 包含 `founding_patriarch_on_ramp_done` 且 `!founding_patriarch_midlife_pressure_done`
- [ ] 事件完成后设置 `founding_patriarch_midlife_pressure_done`
- [ ] scholar/alliance 变体按 `scholar > alliance` 优先
- [ ] 不改动与 P115 无关路由逻辑
- [ ] `npm run typecheck` passes

### US-002: Add pressure branch flags and sequencing

**Description:** As a maintainer, I can trace branch semantics and verify pressure-to-payoff ordering in sample lines.

**Acceptance Criteria:**

- [ ] 分支 A 设 `founding_patriarch_pressure_rule_first`
- [ ] 分支 B 设 `founding_patriarch_pressure_alliance_first`
- [ ] 分支均保证 pressure checkpoint 生效
- [ ] 样本链路中可观测到 on-ramp -> pressure -> payoff 顺序
- [ ] `npm run typecheck` passes

### US-003: Update player-facing expressions for pressure

**Description:** As a player, I receive clear textual feedback that route identity has moved into pressure responsibility.

**Acceptance Criteria:**

- [ ] 落地 pressure 后 cost label 信号（门派延续之重）
- [ ] 落地 pressure 后 current goal 信号（维持门规传承 + 承接盟约续责）
- [ ] scholar/alliance 变体在表达层可区分但不分裂成第二事件
- [ ] 与 renown/patron/magnate 表达语义不混淆
- [ ] `npm run typecheck` passes

### US-004: Rewire payoff gate to depend on pressure checkpoint

**Description:** As a maintainer, payoff echo cannot fire before pressure stage is completed.

**Acceptance Criteria:**

- [ ] payoff gate 从 `on-ramp done` 直达改为必须 `midlife_pressure_done`
- [ ] 已完成 pressure 时 payoff 可继续按原轻量策略触发
- [ ] 未完成 pressure 时 payoff 不触发
- [ ] 回归验证 P113 既有 on-ramp 行为不被破坏
- [ ] `npm run typecheck` passes

### US-005: Add bounded tests and proof artifacts

**Description:** As a maintainer, I can verify P115 proof chain and key regression boundaries with targeted tests.

**Acceptance Criteria:**

- [ ] 新增/更新 P115 定向测试覆盖：pre-pressure -> event -> checkpoint -> expression -> payoff gate
- [ ] 覆盖 scholar / alliance 至少各 1 条样本
- [ ] 产出链路证据文档到 `docs/test-reports/`
- [ ] 回归验证边界至少包含 P37、P113、P102-P112、guard baseline（按最小必要命令）
- [ ] `npm run typecheck` passes

### US-006: Produce P115 closure report

**Description:** As a maintainer, I have a clear closure report with GO/NO-GO and deferred boundaries.

**Acceptance Criteria:**

- [ ] 输出 `docs/test-reports/p115-founding-patriarch-midlife-pressure-closure-report.md`
- [ ] 汇总实现内容、验证证据、回归边界与风险
- [ ] 明确 deferred 项（multi-event pressure/late-life/endgame）
- [ ] 给出 GO/NO-GO 决策
- [ ] `npm run typecheck` passes

## 5. Success Criteria

- `founding_patriarch` 在运行时补齐 midlife pressure 可玩节点
- payoff 不再绕过 pressure 直接触发
- 玩家能看到 pressure 阶段身份语义变化
- P37/P102-P113/guard baseline 无退化

## 6. Dependencies / Context

- P114 contract: `docs/PRD/p114-founding-patriarch-pressure-contract.md`
- P114 validation shape: `docs/test-reports/p114-p115-validation-shape.md`
- P113 closure: `docs/test-reports/p113-founding-patriarch-bridge-closure-report.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md` §8

## 7. Open Questions

- Stat threshold gate 是否作为 P115 可选增强启用
- pressure 后 payoff 文本密度是否需要最小增强（不改结构）

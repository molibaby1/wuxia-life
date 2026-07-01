# PRD: P71 Wuxia Selected Next Route Playable Bridge

> **Derived from:** `docs/test-reports/p70-selected-next-route-design-closure-report.md`
> **Stage slug:** `p71-wuxia-selected-next-route-playable-bridge`
> **Stage type:** bounded runtime bridge implementation stage for the selected next route

## 1. Introduction

P71 承接 `P70`，只做一件事：把所选路线从“设计上可达”推进到“runtime 上可达、可验证、可回归”。它对应的是 merchant trilogy 方法论中的第一阶段：**先闭 playable bridge，再谈后续体验优化。**

P71 不负责一口气做 entry differentiation、cost differentiation、shape/recap。只要 bridge 还没闭合，后续体验优化都不稳。

## 2. Goals

- 闭合所选路线的最小 runtime bridge
- 让 bridge 具备 gate acceptance、玩家可见表达、targeted proof、窄回归
- 保持改动 bounded，不引入新 framework
- 为 `P72` 的 entry / player-facing differentiation 建立健康基础

## 3. Non-Goals

- 不直接扩到 pressure/payoff differentiation
- 不做 full lifetime sim exhaust
- 不新增大型 content wave
- 不做路线方法论总结合成
- 不并行实现第二条路线

## 4. User Stories

### US-001: Audit Implementation Delta Against The Bridge Contract
**Description:** As a maintainer, I want an implementation delta audit so P71 only changes what the approved bridge contract actually requires.

**Acceptance Criteria:**
- [ ] 对照 P70 bridge contract 列出需要新增或修改的最小实现点
- [ ] 明确哪些现有 wiring 可直接复用
- [ ] 输出 `docs/test-reports/p71-selected-route-bridge-implementation-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P71 Runtime Scope Contract
**Description:** As a planner, I want a runtime scope contract so P71 stays a playable bridge stage and does not sprawl into later differentiation work.

**Acceptance Criteria:**
- [ ] 明确 P71 只处理 bridge wiring、bridge expression、proof、narrow tests
- [ ] 明确禁止项：entry densification、pressure/payoff work、new system
- [ ] 输出 `docs/test-reports/p71-selected-route-bridge-scope-contract.md`
- [ ] 与 P72 的边界明确

### US-003: Implement Bridge Wiring
**Description:** As a developer, I want the selected route's bridge checkpoint wired through existing carriers so the target gate can be reached at runtime.

**Acceptance Criteria:**
- [ ] 按 P70 contract 实现最小 flag / gate / config 接线
- [ ] 不引入新的 route framework
- [ ] 目标 gate 在 bridge 条件满足时可通过
- [ ] 既有相关 evidence 不退化

### US-004: Add Bridge Player-Facing Expression
**Description:** As a player, I want the bridge crossing to feel visible and route-specific so the new path does not read like a silent flag change.

**Acceptance Criteria:**
- [ ] 至少补 2 个 bridge-specific 可读表达信号
- [ ] 表达能区分 bridge crossing 与 generic path
- [ ] 不新增 UI 组件
- [ ] 对应表达测试可新增或更新

### US-005: Add Targeted Bridge Proof
**Description:** As a maintainer, I want one targeted proof showing seed → bridge → gate acceptance so the bridge is repo-proven without relying on static fixtures alone.

**Acceptance Criteria:**
- [ ] 产出 1 份 targeted proof artifact
- [ ] 展示 seed、bridge checkpoint、gate acceptance 的顺序链路
- [ ] 不要求 full lifetime comparative exhaust
- [ ] proof 不依赖静态 shortcut 作为唯一证据

### US-006: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow regression coverage so the new bridge cannot silently break later.

**Acceptance Criteria:**
- [ ] 至少覆盖 gate acceptance、expression、non-target isolation 三类断言
- [ ] 复用现有 harness
- [ ] 不重写全量路线测试体系
- [ ] 相关命令 Pass

### US-007: Produce P71 Closure Report
**Description:** As a maintainer, I want a closure report stating exactly how the selected route bridge now works and what remains for later differentiation stages.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p71-selected-next-route-bridge-closure-report.md`
- [ ] 汇总 wiring、expression、proof、tests
- [ ] 明确与 `P72` 的边界
- [ ] 列出更大 densification / new-route 项的 defer

## 5. Functional Requirements

1. FR-1: P71 必须只实现 P70 批准的 bridge contract。
2. FR-2: P71 必须闭合 gate acceptance、expression、proof、regression 四类证据。
3. FR-3: P71 的 bridge 证据不能只依赖静态 fixture。
4. FR-4: P71 不得扩成后续体验优化阶段。
5. FR-5: P71 closure 必须明确 P72 是否值得继续做。

## 6. Success Criteria

- 所选路线已形成 playable bridge
- bridge crossing 对玩家可见
- targeted proof 与窄回归均已存在
- `P72` 可以在 bridge 已闭合的前提下继续

## 7. Dependencies / Context

- P70 closure: `docs/test-reports/p70-selected-next-route-design-closure-report.md`

## 8. Risks And Rollback

### Risks

- **Silent-flag risk:** 容易只闭 flags、不闭玩家表达
- **Fixture-only risk:** 容易又落回“静态可达、runtime 不可证”
- **Boundary drift risk:** 容易顺手开始做后续 differentiation

### Rollback

- 若 bridge 需要新 framework 才能闭合，应显式中止并回到 design-first
- 若目标 gate 本身定义不足，应先补 contract，不直接硬接实现

## 9. Validation Direction

- bridge 层：seed → checkpoint → gate 必须可追踪
- player-facing 层：bridge crossing 必须有可读表达
- regression 层：后续编辑不能悄悄打断 bridge

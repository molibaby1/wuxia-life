# PRD: P75 Wuxia Renown Pressure Playable Implementation

> **Derived from:** `docs/test-reports/p74-renown-pressure-closure-report.md`, `docs/PRD/p74-renown-pressure-contract.md`, `docs/test-reports/p74-p75-validation-shape.md`, `docs/designs/p25-lifetime-simulation-north-star.md`
> **Stage slug:** `p75-wuxia-renown-pressure-playable-implementation`
> **Stage type:** bounded pressure implementation stage for jianghu_renown_sage

## 1. Introduction

P74 已完成 `jianghu_renown_sage`（江湖名宿）路线的 pressure design-first contract：选定了"人情债渐重"方向，定义了事件规格、表达更新、验证形状。

对照 merchant trilogy 方法论，renown 路线目前走完了 bridge → entry → on-ramp → pressure-design。P75 的目标是把 P74 定义的 pressure contract 落地成可玩实现：runtime event wiring + expression updates + targeted proof + regression tests。

这不是 full renown content wave，而是严格按 P74 contract 落地的 bounded implementation 阶段——参照 P71（bridge implementation）和 P73（on-ramp implementation）的模式。

## 2. Goals

- 按 P74 contract 落地 `jianghu_renown_sage` 的 pressure 阶段 runtime 实现
- 让 renown 路线从"只有上升期"推进到"有代价的成长"
- 复用现有事件系统与 sample-lines-spine 架构，不建新系统
- 保持 tavern-born 风味，不做成 generic pressure
- 为后续 payoff 阶段预留 flag 接口
- P71/P72/P73 既有 evidence 不退化

## 3. Non-Goals

- 不做 renown payoff / age-40 identity 深化（P76+）
- 不新建 route framework 或事件调度器
- 不扩展到第二条新路线（medical_sage_healer 仍 defer）
- 不做 full lifetime 全生命周期内容波次
- 不做 stat threshold gate 实现（可选增强项，defer）
- 不扩展到其他出身（仅 tavern_hand origin）
- 不做 choice-based pressure（auto 是 contract 规定）
- 不新增 UI 组件

## 4. User Stories

### US-001: Wire Renown Pressure Spine Event
**Description:** As a developer, I want the renown pressure event wired through the existing event system so players on the renown route encounter a real pressure milestone.

**Acceptance Criteria:**
- [ ] 在 `sample-lines-spine.json` 中配置 `renown_midlife_pressure` auto 事件
- [ ] 触发条件：`renown_on_ramp_done` + age 37-41 + 互斥 guard
- [ ] 事件设置 `renown_midlife_pressure_done` checkpoint flag + `tavern_renown_pressure` marker
- [ ] Stat 变化：reputation +3, connections +2, charisma +1
- [ ] 不引入新的事件框架或调度器
- [ ] P71/P72/P73 既有 evidence 不退化

### US-002: Add Pressure Player-Facing Expression (Core P0)
**Description:** As a player, I want the renown pressure to read as a meaningful turning point so the route feels like it has a cost, not just benefit.

**Acceptance Criteria:**
- [ ] Sample line cost label: "江湖声名之累" → "人情债渐重"
- [ ] Sample line current goal: on-ramp 状态 → pressure 状态
- [ ] Ordinary origin current goal: on-ramp 状态 → pressure 状态
- [ ] 至少 2 个 pressure-specific 可读信号（cost label + current goal）
- [ ] 保持 tavern-born renown 风味
- [ ] 不新增 UI 组件

### US-003: Add Pressure Player-Facing Expression (Bonus P1)
**Description:** As a player, I want additional pressure-specific expressions so the pressure stage feels richer and more memorable.

**Acceptance Criteria:**
- [ ] Ordinary origin life memory: pressure 特定文本
- [ ] Ordinary origin summary: pressure 状态更新
- [ ] 保持 tavern-born renown 风味
- [ ] 不新增 UI 组件

### US-004: Reserve Payoff Flag Interfaces
**Description:** As a maintainer, I want payoff flag interfaces reserved in code so the next stage can build on them without renaming.

**Acceptance Criteria:**
- [ ] 代码中可见 `renown_payoff_done` flag 预留位置（注释或 TODO）
- [ ] 代码中可见 `renown_age40_identity_done` flag 预留位置
- [ ] 本阶段不实现 payoff 逻辑
- [ ] 预留位置有明确注释说明"for P76+ payoff stage"

### US-005: Add Targeted Pressure Proof
**Description:** As a maintainer, I want a bounded proof artifact showing that the renown pressure event fires correctly and carries the tavern-born renown flavor.

**Acceptance Criteria:**
- [ ] 产出 1 份 targeted proof（on-ramp → pressure 路径验证）
- [ ] 展示 5 个核心节点：pre-pressure state → event fires → checkpoint set → cost label update → current goal update
- [ ] 可选 bonus 节点：life memory、summary、完整链路回溯
- [ ] 不要求 full lifetime exhaust
- [ ] proof 能支持是否继续 payoff 阶段的判断
- [ ] 保存为 `docs/test-reports/p75-renown-pressure-targeted-proof.md`

### US-006: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow tests guarding the renown pressure stage so future edits do not break the first renown pressure milestone.

**Acceptance Criteria:**
- [ ] 新增测试文件覆盖 pressure 阶段
- [ ] Group 1: Event wiring（5 tests）— 事件存在、触发条件、年龄范围、auto 类型、flag 设置
- [ ] Group 2: Pre-pressure state（2 tests）— on-ramp 后 pressure 前的状态验证
- [ ] Group 3: Post-pressure expression updates（5 tests: 3 P0 + 2 P1）
- [ ] Group 4: Distinct from merchant pressure（2 tests）
- [ ] Group 5: No regression of P71/P72/P73（4 tests）
- [ ] 复用现有 test harness
- [ ] 所有相关命令 Pass

### US-007: Produce P75 Closure Report
**Description:** As a maintainer, I want a closure report stating exactly what the renown pressure stage now provides and whether payoff stage is justified next.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p75-renown-pressure-closure-report.md`
- [ ] 汇总 event wiring、expression、proof、tests
- [ ] 明确后续 payoff 阶段是否值得开
- [ ] 列出更大 renown-expansion 项的 defer
- [ ] 9 条 closure criteria 全部满足

## 5. Functional Requirements

1. FR-1: P75 必须严格按 P74 pressure contract 落地，不偏离方向。
2. FR-2: P75 必须只处理 pressure 事件 + 对应表达 + 验证。
3. FR-3: Pressure 事件必须 runtime-visible，有实际事件触发与状态变化。
4. FR-4: P75 不得扩成 payoff / late identity 阶段。
5. FR-5: P71/P72/P73 既有 evidence 必须保持通过。
6. FR-6: Pressure 必须保持 tavern-born renown 风味，与 merchant pressure 明确区分。
7. FR-7: P75 closure 必须回答是否值得继续 payoff 阶段。

## 6. Success Criteria

- Renown 路线有 pressure 阶段的实际 runtime 实现
- 玩家能感受到 renown 的代价：从"一帆风顺的上升"到"有代价的成长"
- Tavern-born 风味贯穿 pressure 事件与表达
- P71/P72/P73 既有 evidence 未退化
- 后续 payoff 阶段是否值得继续已有依据
- Typecheck + sample-lines-baseline guard 通过

## 7. Dependencies / Context

- P74 closure: `docs/test-reports/p74-renown-pressure-closure-report.md`
- P74 pressure contract: `docs/PRD/p74-renown-pressure-contract.md`
- P74 validation shape: `docs/test-reports/p74-p75-validation-shape.md`
- P73 on-ramp: `docs/test-reports/p73-renown-on-ramp-closure-report.md`
- P71 bridge: `docs/test-reports/p71-selected-next-route-bridge-closure-report.md`
- Merchant pressure precedent: `docs/PRD/p55-wuxia-merchant-magnate-bounded-expansion.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 8. Risks And Rollback

### Risks

- **Scope creep risk:** 容易把 pressure 写成 payoff 的内容，或同时设计 payoff
- **Flavor dilution risk:** 可能丢失 tavern-born 风味，变成 generic jianghu pressure
- **Trigger timing risk:** Pressure 触发时机可能与现有事件冲突或过早/过晚
- **Regression risk:** 表达更新可能意外影响 P71/P72/P73 既有行为

### Rollback

- 若事件触发不稳定，可回退到 P73 on-ramp-only 状态（仅移除 pressure 事件配置 + 表达更新）
- P73 on-ramp 不受 P75 影响，可独立存活
- 可通过回滚 P75 分支恢复到 P74 design-only 状态

## 9. Validation Direction

- Event 层：pressure 事件必须触发 + flag 必须正确设置
- Expression 层：cost label + current goal 必须更新 + 风味正确
- Proof 层：targeted proof 展示 5 个核心节点
- Regression 层：P71/P72/P73 既有测试必须通过
- Continuation 层：closure 必须明确 payoff 阶段是否值得继续

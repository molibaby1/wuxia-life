# PRD: P87 Wuxia Medical Pressure Playable Implementation

> **Derived from:** `docs/test-reports/p86-medical-pressure-closure-report.md`, `docs/PRD/p86-medical-pressure-contract.md`, `docs/test-reports/p86-p87-validation-shape.md`, `docs/designs/p25-lifetime-simulation-north-star.md`
> **Stage slug:** `p87-wuxia-medical-pressure-playable-implementation`
> **Stage type:** bounded pressure implementation stage for medical_sage_healer (2 variants)

## 1. Introduction

P86 已完成 `medical_sage_healer`（一代名医）路线的 pressure design-first contract：选定了 compassionate（仁心耗尽/身体垮掉）和 pragmatic（人情债缠身）两个 variant 的 pressure 方向，定义了事件规格、表达更新、验证形状。

对照 merchant trilogy 和 renown 方法论，medical 路线目前走完了 bridge → entry → on-ramp → pressure-design。P87 的目标是把 P86 定义的 pressure contract 落地成可玩实现：runtime event wiring + expression updates + targeted proof + regression tests。

这不是 full medical content wave，而是严格按 P86 contract 落地的 bounded implementation 阶段——参照 P75（renown pressure implementation）的模式，但 medical 有 2 个 variant，工作量约为 renown 的 1.5-2 倍。

## 2. Goals

- 按 P86 contract 落地 `medical_sage_healer` 的 pressure 阶段 runtime 实现（2 variants）
- 让 medical 路线从"只有上升期"推进到"有代价的成长"
- 复用现有事件系统与 sample-lines-spine 架构，不建新系统
- 保持 tavern-born 风味，不做成 generic pressure
- 延续 compassionate / pragmatic 两个 variant 的差异化
- 为后续 payoff 阶段预留 flag 接口
- P83/P84/P85 既有 evidence 不退化

## 3. Non-Goals

- 不做 medical payoff / age-40 identity 深化（P88+）
- 不新建 route framework 或事件调度器
- 不做 stat threshold gate 完整实现（可选增强项，defer 或仅宽松实现）
- 不扩展到其他出身（仅 tavern_hand origin）
- 不做 choice-based pressure（auto 是 contract 规定）
- 不新增 UI 组件
- 不做毒医路线（poison path）
- 不做 plague hero / medical pure 的完整抉择
- 不扩展到 renown / merchant 路线

## 4. User Stories

### US-001: Wire Medical Pressure Spine Events (2 Variants)
**Description:** As a developer, I want the medical pressure events (2 variants) wired through the existing event system so players on the medical route encounter real pressure milestones.

**Acceptance Criteria:**
- [ ] 在 `sample-lines-spine.json` 中配置 `medical_pressure_compassionate` auto 事件
- [ ] 在 `sample-lines-spine.json` 中配置 `medical_pressure_pragmatic` auto 事件
- [ ] Compassionate 触发条件：`medical_on_ramp_done` + `tavern_medical_on_ramp_compassionate` + age 36-40 + 互斥 guard
- [ ] Pragmatic 触发条件：`medical_on_ramp_done` + `tavern_medical_on_ramp_pragmatic` + age 37-41 + 互斥 guard
- [ ] 两事件均设置 `medical_midlife_pressure_done` 共享 checkpoint flag
- [ ] Compassionate 设置 `tavern_medical_pressure_compassionate` variant marker
- [ ] Pragmatic 设置 `tavern_medical_pressure_pragmatic` variant marker
- [ ] Compassionate stat 变化：constitution -3, reputation +3, chivalry +2
- [ ] Pragmatic stat 变化：reputation +4, connections +3, charisma +2, money +50
- [ ] 不引入新的事件框架或调度器
- [ ] P83/P84/P85 既有 evidence 不退化

### US-002: Add Pressure Player-Facing Expression (Core P0)
**Description:** As a player, I want the medical pressure to read as a meaningful turning point (with 2 distinct variants) so the route feels like it has a cost, not just benefit.

**Acceptance Criteria:**
- [ ] Sample line cost label:
  - Compassionate: "仁心之累" → "仁心耗尽"
  - Pragmatic: "世故之秤" → "人情债缠身"
- [ ] Sample line current goal: on-ramp 状态 → pressure 状态（2 variants）
- [ ] Ordinary origin current goal: on-ramp 状态 → pressure 状态（2 variants）
- [ ] 每 variant 至少 2 个 pressure-specific 可读信号（cost label + current goal）
- [ ] 保持 tavern-born medical healer 风味
- [ ] 2 variants 有本质差异（向内消耗 vs 向外束缚）
- [ ] 不新增 UI 组件

### US-003: Add Pressure Player-Facing Expression (Bonus P1)
**Description:** As a player, I want additional pressure-specific expressions so the pressure stage feels richer and more memorable.

**Acceptance Criteria:**
- [ ] Ordinary origin life memory: pressure 特定文本（2 variants）
- [ ] Ordinary origin summary: pressure 状态更新（2 variants）
- [ ] 保持 tavern-born medical healer 风味
- [ ] 2 variants 有本质差异
- [ ] 不新增 UI 组件

### US-004: Reserve Payoff Flag Interfaces
**Description:** As a maintainer, I want payoff flag interfaces reserved in code so the next stage can build on them without renaming.

**Acceptance Criteria:**
- [ ] 代码中可见 `medical_payoff_done` flag 预留位置（注释或 TODO）
- [ ] 代码中可见 `medical_age40_identity_done` flag 预留位置
- [ ] 代码中可见 `tavern_medical_payoff_compassionate` / `tavern_medical_payoff_pragmatic` 预留位置
- [ ] 本阶段不实现 payoff 逻辑
- [ ] 预留位置有明确注释说明"for P88+ payoff stage"

### US-005: Add Targeted Pressure Proof (2 Variants)
**Description:** As a maintainer, I want bounded proof artifacts showing that both medical pressure variants fire correctly and carry the tavern-born healer flavor.

**Acceptance Criteria:**
- [ ] 产出 1 份 targeted proof，覆盖 2 variants（on-ramp → pressure 路径验证）
- [ ] Compassionate 展示 6 个核心节点：pre-pressure state → event fires → checkpoint set → variant marker set → cost label update → current goal update
- [ ] Pragmatic 展示 6 个核心节点：pre-pressure state → event fires → checkpoint set → variant marker set → cost label update → current goal update
- [ ] 可选 bonus 节点：life memory、summary、完整链路回溯（bridge → entry → on-ramp → pressure）
- [ ] 不要求 full lifetime exhaust
- [ ] proof 能支持是否继续 payoff 阶段的判断
- [ ] 保存为 `docs/test-reports/p87-medical-pressure-targeted-proof.md`

### US-006: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow tests guarding the medical pressure stage (2 variants) so future edits do not break the first medical pressure milestone.

**Acceptance Criteria:**
- [ ] 新增测试文件覆盖 pressure 阶段
- [ ] Group 1: Event wiring（8-10 tests）— 2 events 存在、触发条件、年龄范围、auto 类型、flag 设置
- [ ] Group 2: Pre-pressure state（4 tests）— on-ramp 后 pressure 前的状态验证（2 variants）
- [ ] Group 3: Post-pressure expression updates（10 tests: 6 P0 + 4 P1）
- [ ] Group 4: Variant differentiation（4 tests）— 2 variants 有本质差异
- [ ] Group 5: Cross-route distinction（3 tests）— 与 merchant/renown pressure 区分
- [ ] Group 6: No regression of P83/P84/P85（4+ tests）
- [ ] 复用现有 test harness
- [ ] 所有相关命令 Pass

### US-007: Produce P87 Closure Report
**Description:** As a maintainer, I want a closure report stating exactly what the medical pressure stage now provides and whether payoff stage is justified next.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p87-medical-pressure-closure-report.md`
- [ ] 汇总 event wiring、expression（2 variants）、proof、tests
- [ ] 明确后续 payoff 阶段是否值得开（GO / NO-GO）
- [ ] 列出更大 medical-expansion 项的 defer
- [ ] 12 条 closure criteria 全部满足

## 5. Functional Requirements

1. FR-1: P87 必须严格按 P86 pressure contract 落地，不偏离方向。
2. FR-2: P87 必须同时覆盖 compassionate / pragmatic 两个 variant。
3. FR-3: Pressure 事件必须 runtime-visible，有实际事件触发与状态变化。
4. FR-4: P87 不得扩成 payoff / late identity 阶段。
5. FR-5: P83/P84/P85 既有 evidence 必须保持通过。
6. FR-6: Pressure 必须保持 tavern-born medical healer 风味，与 renown/merchant pressure 明确区分。
7. FR-7: 两个 variant 的 pressure 必须有本质差异，不是简单换皮。
8. FR-8: P87 closure 必须回答是否值得继续 payoff 阶段。

## 6. Success Criteria

- Medical 路线有 pressure 阶段的实际 runtime 实现（2 variants）
- 玩家能感受到 medical 的代价：从"一帆风顺的上升"到"有代价的成长"
- 2 variants 有本质差异：compassionate = 向内消耗（仁心耗尽），pragmatic = 向外束缚（人情债缠身）
- Tavern-born 风味贯穿 pressure 事件与表达
- P83/P84/P85 既有 evidence 未退化
- 后续 payoff 阶段是否值得继续已有依据
- Typecheck + sample-lines-baseline guard 通过

## 7. Dependencies / Context

- P86 closure: `docs/test-reports/p86-medical-pressure-closure-report.md`
- P86 pressure contract: `docs/PRD/p86-medical-pressure-contract.md`
- P86 validation shape: `docs/test-reports/p86-p87-validation-shape.md`
- P85 on-ramp: `docs/test-reports/p85-medical-sage-on-ramp-closure-report.md`
- P83 bridge: `docs/test-reports/p83-selected-next-route-bridge-closure-report.md`
- Renown pressure implementation precedent: `docs/PRD/p75-wuxia-renown-pressure-playable-implementation.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 8. Risks And Rollback

### Risks

- **Scope creep risk:** 容易把 pressure 写成 payoff 的内容，或同时设计 payoff
- **Variant weakening risk:** 两个 variant 的 pressure 实现可能差异不够强，变成简单换皮
- **Flavor dilution risk:** 可能丢失 tavern-born 风味，变成 generic medical pressure
- **Trigger timing risk:** Pressure 触发时机可能与现有事件冲突或过早/过晚
- **Regression risk:** 表达更新可能意外影响 P83/P84/P85 既有行为
- **2x complexity risk:** 2 variants 意味着 2 倍的事件、表达、测试工作量，可能比 P75 耗时更多

### Rollback

- 若事件触发不稳定，可回退到 P85 on-ramp-only 状态（仅移除 pressure 事件配置 + 表达更新）
- P85 on-ramp 不受 P87 影响，可独立存活
- 可通过回滚 P87 分支恢复到 P86 design-only 状态

## 9. Validation Direction

- Event 层：2 个 pressure 事件必须触发 + flag 必须正确设置
- Expression 层：cost label + current goal 必须更新 + 风味正确 + 2 variants 有差异
- Proof 层：targeted proof 展示每 variant 6 个核心节点
- Regression 层：P83/P84/P85 既有测试必须通过
- Continuation 层：closure 必须明确 payoff 阶段是否值得继续

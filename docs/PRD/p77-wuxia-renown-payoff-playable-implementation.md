# PRD: P77 Wuxia Renown Payoff Playable Implementation

> **Derived from:** `docs/test-reports/p76-renown-payoff-closure-report.md`, `docs/PRD/p76-renown-payoff-contract.md`, `docs/test-reports/p76-p77-validation-shape.md`, `docs/designs/p25-lifetime-simulation-north-star.md`
> **Stage slug:** `p77-wuxia-renown-payoff-playable-implementation`
> **Stage type:** bounded payoff implementation stage for jianghu_renown_sage

## 1. Introduction

P76 已完成 `jianghu_renown_sage`（江湖名宿）路线的 payoff design-first contract：选定了 choice-based "人情债之解"方向，定义了三个选择（硬扛/撕破脸/找平衡）、事件规格、表达更新、验证形状。

对照 merchant trilogy 方法论，renown 路线目前走完了 bridge → entry → on-ramp → pressure → payoff-design。P77 的目标是把 P76 定义的 payoff contract 落地成可玩实现：runtime event wiring + expression updates + targeted proof + regression tests。

这不是 full renown content wave，而是严格按 P76 contract 落地的 bounded implementation 阶段——参照 P75（pressure implementation）的模式。

## 2. Goals

- 按 P76 contract 落地 `jianghu_renown_sage` 的 payoff 阶段 runtime 实现
- 让 renown 路线从"有代价的成长"推进到"有选择的了结"
- 复用现有事件系统与 sample-lines-spine 架构，不建新系统
- 保持 tavern-born 风味，不做成 generic payoff
- 为后续 late-life / endgame 阶段预留 flag 接口
- P71/P72/P73/P75 既有 evidence 不退化

## 3. Non-Goals

- 不做 renown late-life identity / endgame echo（P78+）
- 不新建 route framework 或事件调度器
- 不扩展到第二条新路线（medical_sage_healer 仍 defer）
- 不做 full lifetime 全生命周期内容波次
- 不做 stat threshold gate 实现（可选增强项，defer）
- 不扩展到其他出身（仅 tavern_hand origin）
- 不新增第三条 choice 方向或修改已有 choice 定义
- 不新增 UI 组件

## 4. User Stories

### US-001: Wire Renown Payoff Spine Event
**Description:** As a developer, I want the renown payoff event wired through the existing event system so players on the renown route encounter a real payoff milestone with meaningful choices.

**Acceptance Criteria:**
- [ ] 在 `sample-lines-spine.json` 中配置 `renown_midlife_payoff` choice 事件
- [ ] 触发条件：`renown_midlife_pressure_done` + age 43-47 + 互斥 guard + 排除 orthodox/demonic
- [ ] 事件设置 `renown_midlife_payoff_done` checkpoint flag + `renown_age40_identity_done`
- [ ] 三个 choice 选项各设置对应的 marker flag：`tavern_renown_payoff_hard_holder` / `tavern_renown_payoff_breaker` / `tavern_renown_payoff_balancer`
- [ ] 每个选项的 stat 变化正确：A(reputation+5, connections+3, charisma+2) / B(reputation-2, connections-4, charisma-1) / C(reputation+2, connections+1, charisma+3)
- [ ] 不引入新的事件框架或调度器
- [ ] P71/P72/P73/P75 既有 evidence 不退化

### US-002: Add Payoff Player-Facing Expression — Sample Line (Core P0)
**Description:** As a player, I want the renown payoff choice reflected in my sample line status so the route feels like it has a meaningful identity turning point.

**Acceptance Criteria:**
- [ ] Sample line cost label: pressure 状态 → payoff 状态（声名之累 / 快意恩仇 / 人情练达）
- [ ] Sample line current goal: pressure 状态 → payoff 状态（硬扛 / 撕破脸 / 找平衡）
- [ ] 至少 2 个 payoff-specific 可读信号（cost label + current goal）
- [ ] 三个 choice 的表达有实质差异，不是换皮
- [ ] 保持 tavern-born renown 风味
- [ ] 不新增 UI 组件

### US-003: Add Payoff Player-Facing Expression — Age-40 Identity (Core P0)
**Description:** As a player, I want an age-40 identity summary that reflects my payoff choice so the midlife turning point feels like it defines who I am.

**Acceptance Criteria:**
- [ ] `renownAge40Identity()` 在 payoff 完成后返回对应身份文本
- [ ] Option A: 硬撑面子的江湖好人
- [ ] Option B: 快意恩仇的独行侠
- [ ] Option C: 人情练达的江湖名宿
- [ ] 三个 choice 的身份描述有实质差异
- [ ] 保持 tavern-born renown 风味

### US-004: Add Payoff Player-Facing Expression — Ordinary Origin (Bonus P1)
**Description:** As a player, I want additional payoff-specific expressions in the ordinary origin view so the payoff stage feels richer and more memorable.

**Acceptance Criteria:**
- [ ] Ordinary origin current goal: payoff 状态更新（与 sample line 一致）
- [ ] Ordinary origin life memory: payoff 特定文本（每个 choice 不同）
- [ ] Ordinary origin summary: payoff 状态更新（每个 choice 不同）
- [ ] 保持 tavern-born renown 风味
- [ ] 不新增 UI 组件

### US-005: Add Targeted Payoff Proof
**Description:** As a maintainer, I want a bounded proof artifact showing that the renown payoff event fires correctly, all three choices work, and tavern-born renown flavor is preserved.

**Acceptance Criteria:**
- [ ] 产出 1 份 targeted proof（pressure → payoff → expression changes 路径验证）
- [ ] 展示 11 个 core nodes：pre-payoff baseline → event fires → 3 choices visible → Option A flags → Option A stats → Option B flags → Option B stats → Option C flags → Option C stats → cost label per choice → current goal per choice
- [ ] 可选 bonus 节点：age-40 identity、life memory、origin summary、full chain traceback、mutex with other lines
- [ ] 不要求 full lifetime exhaust
- [ ] proof 能支持是否继续 late-life 阶段的判断
- [ ] 保存为 `docs/test-reports/p77-renown-payoff-targeted-proof.md`

### US-006: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow tests guarding the renown payoff stage so future edits do not break the first renown payoff milestone.

**Acceptance Criteria:**
- [ ] 新增测试文件覆盖 payoff 阶段
- [ ] Group 1: Event wiring（4 tests）— 事件存在、类型为 choice、3 个选项、触发条件正确、年龄范围正确
- [ ] Group 2: Pre-payoff state（2 tests）— pressure 后 payoff 前的状态验证
- [ ] Group 3: Option A post-payoff（4 tests）— flags + stats + cost label + current goal
- [ ] Group 4: Option B post-payoff（4 tests）— flags + stats + cost label + current goal
- [ ] Group 5: Option C post-payoff（4 tests）— flags + stats + cost label + current goal
- [ ] Group 6: Distinct from merchant payoff（2 tests）
- [ ] Group 7: No regression of P71/P72/P73/P75（5 tests）
- [ ] 复用现有 test harness
- [ ] 所有相关命令 Pass

### US-007: Produce P77 Closure Report
**Description:** As a maintainer, I want a closure report stating exactly what the renown payoff stage now provides and whether late-life stage is justified next.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p77-renown-payoff-closure-report.md`
- [ ] 汇总 event wiring、expression、proof、tests
- [ ] 明确后续 late-life 阶段是否值得开
- [ ] 列出更大 renown-expansion 项的 defer
- [ ] 9 条 closure criteria 全部满足（来自 P76 validation shape）

## 5. Functional Requirements

1. FR-1: P77 必须严格按 P76 payoff contract 落地，不偏离方向。
2. FR-2: P77 必须只处理 payoff 事件 + 对应表达 + 验证。
3. FR-3: Payoff 事件必须 runtime-visible，有实际事件触发与状态变化。
4. FR-4: P77 不得扩成 late-life / endgame 阶段。
5. FR-5: P71/P72/P73/P75 既有 evidence 必须保持通过。
6. FR-6: Payoff 必须保持 tavern-born renown 风味，与 merchant payoff 明确区分。
7. FR-7: 三个 choice 必须有实质差异（stat、identity、表达、叙事调性）。
8. FR-8: P77 closure 必须回答是否值得继续 late-life 阶段。

## 6. Success Criteria

- Renown 路线有 payoff 阶段的实际 runtime 实现
- 玩家能感受到 renown 的选择：从"被动承受压力"到"主动选择了结方式"
- 三个 choice 有实质差异，不是换皮
- Tavern-born 风味贯穿 payoff 事件与表达
- P71/P72/P73/P75 既有 evidence 未退化
- 后续 late-life 阶段是否值得继续已有依据
- Typecheck + sample-lines-baseline guard 通过

## 7. Dependencies / Context

- P76 closure: `docs/test-reports/p76-renown-payoff-closure-report.md`
- P76 payoff contract: `docs/PRD/p76-renown-payoff-contract.md`
- P76 validation shape: `docs/test-reports/p76-p77-validation-shape.md`
- P75 pressure: `docs/test-reports/p75-renown-pressure-closure-report.md`
- P73 on-ramp: `docs/test-reports/p73-renown-on-ramp-closure-report.md`
- P71 bridge: `docs/test-reports/p71-selected-next-route-bridge-closure-report.md`
- Merchant payoff precedent: `docs/PRD/p53-wuxia-sample-lines-40-plus-payoff-expansion.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 8. Risks And Rollback

### Risks

- **Choice event complexity risk:** Choice 事件比 auto 事件复杂，可能遇到事件系统的 edge case
- **Flavor dilution risk:** Implementation 可能丢失 tavern-born 风味，变成 generic jianghu payoff
- **Trigger timing risk:** Payoff 触发时机可能与现有事件冲突或过早/过晚
- **Regression risk:** 表达更新可能意外影响 P71/P72/P73/P75 既有行为
- **Choice meaninglessness risk:** Implementation 中三个 choice 的表达差异可能被稀释

### Rollback

- 若事件触发不稳定，可回退到 P75 pressure-only 状态（仅移除 payoff 事件配置 + 表达更新）
- P75 pressure 不受 P77 影响，可独立存活
- 可通过回滚 P77 分支恢复到 P76 design-only 状态

## 9. Validation Direction

- Event 层：payoff 事件必须触发 + flags 必须正确设置 + 三个 choice 都能走
- Expression 层：cost label + current goal + age-40 identity 必须更新 + 风味正确
- Proof 层：targeted proof 展示 11 个 core nodes
- Regression 层：P71/P72/P73/P75 既有测试必须通过
- Continuation 层：closure 必须明确 late-life 阶段是否值得继续

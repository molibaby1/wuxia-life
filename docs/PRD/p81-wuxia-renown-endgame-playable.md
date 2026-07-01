# PRD: P81 Wuxia Renown Endgame Playable Implementation

> **Derived from:** `docs/PRD/p80-renown-endgame-contract.md`, `docs/test-reports/p80-renown-endgame-closure-report.md`, `docs/test-reports/p80-p81-validation-shape.md`, `docs/designs/p25-lifetime-simulation-north-star.md`
> **Stage slug:** `p81-wuxia-renown-endgame-playable`
> **Stage type:** bounded endgame implementation stage for jianghu_renown_sage (lightweight)

## 1. Introduction

P80 已完成 `jianghu_renown_sage`（江湖名宿）路线的 endgame design-first contract：选定了 Legacy Echo（身后名之声）方向，定义了三个变体（叹/遥/传）、事件规格、表达更新、验证形状。Closure report 给出 **CONDITIONAL GO** — endgame 有主题价值，但必须严格保持 lightweight。

对照 renown 路线方法论（bridge → entry → on-ramp → pressure → payoff → late-life → endgame），P81 的目标是把 P80 定义的 endgame contract 落地成可玩实现：runtime event wiring + expression updates + targeted proof + regression tests。

这不是 full renown content wave，而是严格按 P80 contract 落地的 bounded implementation 阶段——参照 P79（late-life implementation）的模式，但更轻量。

**Lightweight constraint (非 negotiable):** 1 echo event + expression updates only, no stat changes.

## 2. Goals

- 按 P80 contract 落地 `jianghu_renown_sage` 的 endgame / final legacy 阶段 runtime 实现
- 让 renown 路线从"晚年生活"推进到"身后名"——完成整条路线的叙事闭合
- 复用现有事件系统与 sample-lines-spine 架构，不建新系统
- 保持 tavern-born 风味，不做成 generic endgame
- Strict lightweight：1 auto echo event + 6 expression surfaces，无 stat 变化
- P71/P72/P73/P75/P77/P79 既有 evidence 不退化

## 3. Non-Goals

- 不做第二条 renown seed（mentor-bond）
- 不扩成 full renown route 全生命周期规划
- 不新增系统或平台层
- 不扩展到其他出身（仅 tavern_hand origin）
- 不做 stat threshold gate 实现
- 不做第二条成就线（medical_sage_healer）
- 不做巅峰/混合成就（Wave 2/3）
- 不做 multi-event endgame arc（仅 single echo event）
- 不新增 UI 组件
- 不做 stat 变化（endgame 是记忆，不是力量）
- 不做 P19 generic endgame 集成
- 不做 full lifetime exhaust 测试

## 4. User Stories

### US-001: Wire Renown Endgame Echo Event
**Description:** As a developer, I want the renown endgame echo event wired through the existing event system so players on the renown route encounter a final legacy echo with 3 distinct variants.

**Acceptance Criteria:**
- [ ] 在 `sample-lines-spine.json` 中配置 `renown_endgame_echo` auto 事件
- [ ] 触发条件：`renown_late_life_done` + age 60-65 + 互斥 guard + 排除 orthodox/demonic
- [ ] 事件设置 `renown_endgame_done` checkpoint flag + `renown_endgame_identity_done`
- [ ] 三个变体各设置对应的 marker flag：`tavern_renown_endgame_sigh` / `tavern_renown_endgame_distant` / `tavern_renown_endgame_legacy`
- [ ] 分支逻辑：基于 late-life branch marker（burnout→sigh, lone_wolf→distant, mentor→legacy）
- [ ] **No stat changes**（endgame 是记忆，不是力量）
- [ ] 不引入新的事件框架或调度器
- [ ] P71/P72/P73/P75/P77/P79 既有 evidence 不退化

### US-002: Add Endgame Expression — Sample Line Core (P0)
**Description:** As a player, I want the renown endgame stage reflected in my sample line status so the route feels like it has a meaningful final legacy identity.

**Acceptance Criteria:**
- [ ] Sample line cost label: late-life 状态 → endgame 状态（身后名·叹 / 身后名·遥 / 身后名·传）
- [ ] Sample line current goal: late-life 状态 → endgame 状态（听着自己成了传说，也算值了 / 传说真假谁真谁假，自己知道就好 / 看着后辈们传下去，这就够了）
- [ ] 至少 2 个 endgame-specific 可读信号（cost label + current goal）
- [ ] 三个变体的表达有实质差异，不是换皮
- [ ] 保持 tavern-born renown 风味（酒肆传说 angle）
- [ ] 不新增 UI 组件

### US-003: Add Endgame Expression — Endgame Identity (P0)
**Description:** As a player, I want an endgame identity summary that deepens my age-40 identity so the endgame stage feels like it defines the final legacy.

**Acceptance Criteria:**
- [ ] `renownAge40Identity()` 扩展为检查 `renown_endgame_identity_done` 优先于 `renown_late_life_identity_done`
- [ ] Variant A（叹）: 熬干了的老传说
- [ ] Variant B（遥）: 传说里的神秘人
- [ ] Variant C（传）: 活在传说里的老掌柜
- [ ] 三个变体的身份描述有实质差异
- [ ] 保持 tavern-born renown 风味

### US-004: Add Endgame Expression — Ordinary Origin (Bonus P1)
**Description:** As a player, I want additional endgame-specific expressions in the ordinary origin view so the endgame stage feels richer and more memorable.

**Acceptance Criteria:**
- [ ] Ordinary origin current goal: endgame 状态更新（与 sample line 一致）
- [ ] Ordinary origin life memory: endgame 特定文本（每个变体不同）
- [ ] Ordinary origin summary: endgame 状态更新（每个变体不同）
- [ ] 保持 tavern-born renown 风味
- [ ] 不新增 UI 组件

### US-005: Add Targeted Endgame Proof
**Description:** As a maintainer, I want a bounded proof artifact showing that the renown endgame event fires correctly, all three variants work, and tavern-born renown flavor is preserved.

**Acceptance Criteria:**
- [ ] 产出 1 份 targeted proof（late-life → endgame → expression changes 路径验证）
- [ ] 展示 7 个 core nodes：pre-endgame baseline → event fires → Variant A flags+identity → Variant B flags+identity → Variant C flags+identity → cost label per variant → current goal per variant
- [ ] 可选 bonus 节点：endgame identity、ordinary origin expression、full chain traceback、mutex with other lines、branch matching、tavern-born flavor check、lightweight compliance verification
- [ ] 不要求 full lifetime exhaust
- [ ] 保存为 `docs/test-reports/p81-renown-endgame-targeted-proof.md`

### US-006: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow tests guarding the renown endgame stage so future edits do not break the first renown endgame milestone.

**Acceptance Criteria:**
- [ ] 新增测试文件覆盖 endgame 阶段
- [ ] Group 1: Event wiring（3-4 tests）— 事件存在、类型为 auto、年龄范围、触发条件正确
- [ ] Group 2: Pre-endgame baseline（2 tests）— late-life 后 endgame 前的状态验证
- [ ] Group 3: Variant A post-endgame（3-4 tests）— flags + cost label + current goal
- [ ] Group 4: Variant B post-endgame（3-4 tests）— flags + cost label + current goal
- [ ] Group 5: Variant C post-endgame（3-4 tests）— flags + cost label + current goal
- [ ] Group 6: No regression P71/P72/P73/P75/P77/P79（5+ tests）— 每个既有阶段仍正常工作
- [ ] Group 7: Endgame identity verification（3-4 tests）— 3 个变体 + 各不相同
- [ ] No stat changes 验证
- [ ] Typecheck 通过
- [ ] 约 22-27 个测试

### US-007: Produce P81 Closure Report
**Description:** As a maintainer, I want a closure report that locks the renown endgame implementation and either confirms the renown route is fully closed or identifies remaining gaps.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p81-renown-endgame-closure-report.md`
- [ ] 汇总 event wiring、expression updates、targeted proof、regression tests 结果
- [ ] 明确 renown 路线是否完全闭合（bridge → entry → on-ramp → pressure → payoff → late-life → endgame）
- [ ] 列出仍 defer 的更大 renown-expansion 项
- [ ] 明确 lightweight 约束是否保持
- [ ] 确认 P71/P72/P73/P75/P77/P79 无退化
- [ ] 给出下一阶段方向建议（medical_sage_healer？其他出身扩展？）

## 5. Functional Requirements

1. FR-1: P81 必须围绕 `jianghu_renown_sage` tavern_hand seed 展开。
2. FR-2: P81 必须严格按 P80 endgame contract 实现，不得 scope creep。
3. FR-3: Endgame 事件必须是 auto echo event（不是 choice）。
4. FR-4: 必须有 3 个变体（叹/遥/传），对应 3 个 late-life branch。
5. FR-5: **No stat changes** — endgame 是记忆，不是力量。
6. FR-6: 必须更新至少 2 个 player-facing expression signals（cost label + current goal）。
7. FR-7: 必须保持 tavern-born renown 风味。
8. FR-8: P71/P72/P73/P75/P77/P79 既有 evidence 不得退化。
9. FR-9: Lightweight：1 event + 6 expression surfaces maximum。

## 6. Success Criteria

- Endgame echo event 正确触发（age 60-65，条件正确）
- 三个变体都能正常工作，且有实质差异
- 无 stat 变化（lightweight 合规）
- Cost label + current goal + identity 三端都有 endgame 表达
- Tavern-born 风味保持一致
- P71/P72/P73/P75/P77/P79 无退化
- Typecheck 通过
- Targeted proof 产出
- Regression tests 通过

## 7. Dependencies / Context

- P80 closure: `docs/test-reports/p80-renown-endgame-closure-report.md`
- P80 endgame contract: `docs/PRD/p80-renown-endgame-contract.md`
- P80 → P81 validation shape: `docs/test-reports/p80-p81-validation-shape.md`
- P79 late-life: `docs/PRD/p79-wuxia-renown-late-life-playable-implementation.md`
- P79 closure: `docs/test-reports/p79-renown-late-life-closure-report.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 8. Risks And Rollback

### Risks

- **Scope creep risk:** Endgame 实现可能从"1 echo event"膨胀成"完整终局章节"
- **Flavor dilution risk:** 实现可能丢失 tavern-born 风味，变成 generic endgame
- **Regression risk:** 新增 endgame 逻辑可能影响既有 renown 阶段
- **Lightweight breach risk:** 实现过程中可能不自觉加入 stat 变化或新系统

### Rollback

- 若 scope creep 严重，可回退到 P79 late-life-only 状态
- P79 late-life 不受 P81 影响，可独立存活
- Endgame 是 additive 的，移除事件配置 + expression 分支即可回退

## 9. Validation Direction

- **Lightweight 层：** 是否保持 1 event + expression only？是否无 stat 变化？
- **Event 层：** 事件是否在正确条件下触发？是否互斥正确？
- **Branch 层：** 三个变体是否有实质差异？是否对应正确的 late-life branch？
- **Expression 层：** cost label / current goal / identity 是否都正确更新？
- **Flavor 层：** tavern-born renown 风味是否保持？
- **Regression 层：** P71/P72/P73/P75/P77/P79 是否无退化？

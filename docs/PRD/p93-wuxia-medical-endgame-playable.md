# PRD: P93 Wuxia Medical Endgame Playable Implementation

> **Derived from:** `docs/PRD/p92-medical-endgame-contract.md`, `docs/test-reports/p92-medical-endgame-closure-report.md`, `docs/test-reports/p92-p93-validation-shape.md`, `docs/designs/p25-lifetime-simulation-north-star.md`
> **Stage slug:** `p93-wuxia-medical-endgame-playable`
> **Stage type:** bounded endgame implementation stage for medical_sage_healer (lightweight)

## 1. Introduction

P92 已完成 `medical_sage_healer`（一代名医）路线的 endgame design-first contract：选定了 Medical Legacy Echo（医名身后事）方向，定义了六个变体（仁心不灭·烬 / 医者从容·淡 / 仁心满天下·传 / 医名犹存·寂 / 江湖游医·遥 / 一代宗师·名）、事件规格、表达更新、验证形状。Closure report 给出 **CONDITIONAL GO** — endgame 有主题价值，但必须严格保持 lightweight。

对照 medical 路线方法论（bridge → entry → on-ramp → pressure → payoff → late-life → endgame），P93 的目标是把 P92 定义的 endgame contract 落地成可玩实现：runtime event wiring + expression updates + targeted proof + regression tests。

这不是 full medical content wave，而是严格按 P92 contract 落地的 bounded implementation 阶段——参照 P91（late-life implementation）的模式，但更轻量。

**Lightweight constraint (非 negotiable):** 1 echo event + expression updates only, no stat changes.

## 2. Goals

- 按 P92 contract 落地 `medical_sage_healer` 的 endgame / final legacy 阶段 runtime 实现
- 让 medical 路线从"晚年生活"推进到"医名身后事"——完成整条路线的叙事闭合
- 复用现有事件系统与 sample-lines-spine 架构，不建新系统
- 保持 tavern-born medical healer 风味，不做成 generic endgame
- Strict lightweight：1 auto echo event（6 variants）+ 6 expression surfaces，无 stat 变化
- P83/P85/P87/P89/P91 既有 evidence 不退化

## 3. Non-Goals

- 不做第二条 medical seed（plague hero / poison path）
- 不扩成 full medical route 全生命周期规划
- 不新增系统或平台层
- 不扩展到其他出身（仅 tavern_hand origin）
- 不做 stat threshold gate 实现
- 不做第二条成就线（jianghu_renown_sage）
- 不做巅峰/混合成就（Wave 2/3）
- 不做 multi-event endgame arc（仅 single echo event）
- 不新增 UI 组件
- 不做 stat 变化（endgame 是记忆，不是力量）
- 不做 P19 generic endgame 集成
- 不做 full lifetime exhaust 测试

## 4. User Stories

### US-001: Wire Medical Endgame Echo Event
**Description:** As a developer, I want the medical endgame echo event wired through the existing event system so players on the medical route encounter a final legacy echo with 6 distinct variants.

**Acceptance Criteria:**
- [ ] 在 `sample-lines-spine.json` 中配置 `medical_endgame_echo` auto 事件（6 个 variant-specific 事件）
- [ ] 触发条件：`medical_late_life_done` + age 60-65 + 互斥 guard + 排除 orthodox/demonic
- [ ] 事件设置 `medical_endgame_echo_done` checkpoint flag + `medical_endgame_identity_done`
- [ ] 六个变体各设置对应的 marker flag：
  - Comp-A: `tavern_medical_endgame_compassionate_ember`
  - Comp-B: `tavern_medical_endgame_compassionate_peace`
  - Comp-C: `tavern_medical_endgame_compassionate_legacy`
  - Prag-A: `tavern_medical_endgame_pragmatic_fame_remain`
  - Prag-B: `tavern_medical_endgame_pragmatic_wanderer_legend`
  - Prag-C: `tavern_medical_endgame_pragmatic_grand_master`
- [ ] 分支逻辑：基于 late-life branch marker
  - `tavern_medical_late_compassionate_final` → Comp-A (仁心不灭·烬)
  - `tavern_medical_late_compassionate_peaceful` → Comp-B (医者从容·淡)
  - `tavern_medical_late_compassionate_legacy` → Comp-C (仁心满天下·传)
  - `tavern_medical_late_pragmatic_fallen` → Prag-A (医名犹存·寂)
  - `tavern_medical_late_pragmatic_wanderer` → Prag-B (江湖游医·遥)
  - `tavern_medical_late_pragmatic_master` → Prag-C (一代宗师·名)
- [ ] **No stat changes**（endgame 是记忆，不是力量）
- [ ] 不引入新的事件框架或调度器
- [ ] P83/P85/P87/P89/P91 既有 evidence 不退化
- [ ] event_record target: `medical_endgame_echo`
- [ ] stageSignals: `["medical_endgame"]`

### US-002: Add Endgame Expression — Sample Line Core (P0)
**Description:** As a player, I want the medical endgame stage reflected in my sample line status so the route feels like it has a meaningful final legacy identity.

**Acceptance Criteria:**
- [ ] Sample line cost label: late-life 状态 → endgame 状态（仁心不灭·烬 / 医者从容·淡 / 仁心满天下·传 / 医名犹存·寂 / 江湖游医·遥 / 一代宗师·名）
- [ ] Sample line current goal: late-life 状态 → endgame 状态（6 个 distinct goals per variant）
- [ ] 至少 2 个 endgame-specific 可读信号（cost label + current goal）
- [ ] 六个变体的表达有实质差异，不是换皮
- [ ] 两个 variant axis 有本质不同：Compassionate = spiritual/healing legacy, Pragmatic = social/medical reputation
- [ ] 保持 tavern-born medical healer 风味
- [ ] 不新增 UI 组件
- [ ] Done-flag-first pattern: check `medical_endgame_echo_done` before `medical_late_life_done`

### US-003: Add Endgame Expression — Endgame Identity (P0)
**Description:** As a player, I want an endgame identity summary that deepens my age-40 identity so the endgame stage feels like it defines the final legacy.

**Acceptance Criteria:**
- [ ] `medicalAge40Identity()` 扩展为检查 `medical_endgame_identity_done` 优先于 `medical_late_life_identity_done`
- [ ] Comp-A（仁心不灭·烬）: 燃尽自己的点灯人
- [ ] Comp-B（医者从容·淡）: 从容淡然的老医者
- [ ] Comp-C（仁心满天下·传）: 桃李满天下的仁医宗师
- [ ] Prag-A（医名犹存·寂）: 失势但名存的老太医
- [ ] Prag-B（江湖游医·遥）: 传说里的逍遥游医
- [ ] Prag-C（一代宗师·名）: 德高望重的一代宗师
- [ ] 六个变体的身份描述有实质差异
- [ ] 两个 variant axis 有本质不同
- [ ] 保持 tavern-born medical healer 风味

### US-004: Add Endgame Expression — Ordinary Origin (Bonus P1)
**Description:** As a player, I want additional endgame-specific expressions in the ordinary origin view so the endgame stage feels richer and more memorable.

**Acceptance Criteria:**
- [ ] Ordinary origin current goal: endgame 状态更新（与 sample line 一致）
- [ ] Ordinary origin life memory: endgame 特定文本（每个变体不同）
- [ ] Ordinary origin summary: endgame 状态更新（每个变体不同）
- [ ] 保持 tavern-born medical healer 风味
- [ ] 不新增 UI 组件
- [ ] Done-flag-first pattern

### US-005: Add Targeted Endgame Proof
**Description:** As a maintainer, I want a bounded proof artifact showing that the medical endgame event fires correctly, all six variants work, and tavern-born medical healer flavor is preserved.

**Acceptance Criteria:**
- [ ] 产出 1 份 targeted proof（late-life → endgame → expression changes 路径验证）
- [ ] 展示 10 个 core nodes：
  1. pre-endgame baseline (late-life state per variant)
  2. event fires at age 60-65
  3. Comp-A flags + identity
  4. Comp-B flags + identity
  5. Comp-C flags + identity
  6. Prag-A flags + identity
  7. Prag-B flags + identity
  8. Prag-C flags + identity
  9. cost label per variant (6 distinct)
  10. current goal per variant (6 distinct)
- [ ] 可选 bonus 节点：endgame identity 深度、ordinary origin expression、full chain traceback、mutex with other lines、branch matching、tavern-born flavor check、lightweight compliance verification、two-variant axis differentiation
- [ ] 不要求 full lifetime exhaust
- [ ] 保存为 `docs/test-reports/p93-medical-endgame-targeted-proof.md`

### US-006: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow tests guarding the medical endgame stage so future edits do not break the first medical endgame milestone.

**Acceptance Criteria:**
- [ ] 新增测试文件 `tests/p93TavernHandMedicalEndgameSpineTests.ts` 覆盖 endgame 阶段
- [ ] Group 1: Event wiring（4-5 tests）— 6 个事件存在、类型为 auto、年龄范围、触发条件正确
- [ ] Group 2: Pre-endgame baseline（2 tests）— late-life 后 endgame 前的状态验证
- [ ] Group 3: Comp-A post-endgame（3-4 tests）— flags + cost label + current goal
- [ ] Group 4: Comp-B post-endgame（3-4 tests）
- [ ] Group 5: Comp-C post-endgame（3-4 tests）
- [ ] Group 6: Prag-A post-endgame（3-4 tests）
- [ ] Group 7: Prag-B post-endgame（3-4 tests）
- [ ] Group 8: Prag-C post-endgame（3-4 tests）
- [ ] Group 9: No regression P83/P85/P87/P89/P91（5+ tests）— 每个既有阶段仍正常工作
- [ ] Group 10: Endgame identity verification（6-7 tests）— 6 个变体 + 各不相同 + 两轴差异
- [ ] No stat changes 验证
- [ ] Typecheck 通过
- [ ] 约 30-37 个测试

### US-007: Produce P93 Closure Report
**Description:** As a maintainer, I want a closure report that locks the medical endgame implementation and confirms the medical route is fully closed for Wave 1.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p93-medical-endgame-closure-report.md`
- [ ] 汇总 event wiring、expression updates、targeted proof、regression tests 结果
- [ ] 明确 medical 路线是否完全闭合（bridge → entry → on-ramp → pressure → payoff → late-life → endgame）
- [ ] 列出仍 defer 的更大 medical-expansion 项
- [ ] 明确 lightweight 约束是否保持
- [ ] 确认 P83/P85/P87/P89/P91 无退化
- [ ] 给出 Wave 1 medical 路线完成状态总结
- [ ] 确认两个 variant (compassionate vs pragmatic) 是否保持本质差异

## 5. Functional Requirements

1. FR-1: P93 必须围绕 `medical_sage_healer` tavern_hand seed 展开。
2. FR-2: P93 必须严格按 P92 endgame contract 实现，不得 scope creep。
3. FR-3: Endgame 事件必须是 auto echo event（不是 choice）。
4. FR-4: 必须有 6 个变体（3 compassionate + 3 pragmatic），对应 6 个 late-life branch。
5. FR-5: **No stat changes** — endgame 是记忆，不是力量。
6. FR-6: 必须更新至少 2 个 player-facing expression signals（cost label + current goal）。
7. FR-7: 必须保持 tavern-born medical healer 风味。
8. FR-8: P83/P85/P87/P89/P91 既有 evidence 不得退化。
9. FR-9: Lightweight：1 event（6 variants）+ 6 expression surfaces maximum。
10. FR-10: 两个 variant axis (compassionate vs pragmatic) 必须保持本质差异，不是镜像。

## 6. Success Criteria

- Endgame echo event 正确触发（age 60-65，条件正确）
- 六个变体都能正常工作，且有实质差异
- 两个 variant axis 有本质不同（spiritual/healing legacy vs social/medical reputation）
- 无 stat 变化（lightweight 合规）
- Cost label + current goal + identity 三端都有 endgame 表达
- Tavern-born medical healer 风味保持一致
- P83/P85/P87/P89/P91 无退化
- Typecheck 通过
- Targeted proof 产出
- Regression tests 通过

## 7. Dependencies / Context

- P92 closure: `docs/test-reports/p92-medical-endgame-closure-report.md`
- P92 endgame contract: `docs/PRD/p92-medical-endgame-contract.md`
- P92 → P93 validation shape: `docs/test-reports/p92-p93-validation-shape.md`
- P91 late-life: `docs/PRD/p91-wuxia-medical-late-life-playable-implementation.md`
- P91 closure: `docs/test-reports/p91-medical-late-life-closure-report.md`
- Renown endgame reference: `docs/PRD/p81-wuxia-renown-endgame-playable.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 8. Risks And Rollback

### Risks

- **Scope creep risk:** Endgame 实现可能从"1 echo event"膨胀成"完整终局章节"
- **6-branch complexity risk:** 6 个变体（vs renown 的 3 个）增加实现复杂度，可能稀释质量
- **Flavor dilution risk:** 实现可能丢失 tavern-born medical healer 风味，变成 generic endgame
- **Variant weakening risk:** Compassionate 和 pragmatic 可能变成镜像，失去本质差异
- **Regression risk:** 新增 endgame 逻辑可能影响既有 medical 阶段
- **Lightweight breach risk:** 实现过程中可能不自觉加入 stat 变化或新系统

### Rollback

- 若 scope creep 严重，可回退到 P91 late-life-only 状态
- P91 late-life 不受 P93 影响，可独立存活
- Endgame 是 additive 的，移除事件配置 + expression 分支即可回退

## 9. Validation Direction

- **Lightweight 层：** 是否保持 1 event + expression only？是否无 stat 变化？
- **Event 层：** 6 个事件是否在正确条件下触发？是否互斥正确？
- **Branch 层：** 六个变体是否有实质差异？是否对应正确的 late-life branch？
- **Two-axis 层：** Compassionate vs pragmatic 是否有本质差异（不是镜像）？
- **Expression 层：** cost label / current goal / identity 是否都正确更新？
- **Flavor 层：** tavern-born medical healer 风味是否保持？
- **Regression 层：** P83/P85/P87/P89/P91 是否无退化？

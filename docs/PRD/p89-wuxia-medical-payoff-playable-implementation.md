# PRD: P89 Wuxia Medical Payoff Playable Implementation

> **Derived from:** `docs/test-reports/p88-medical-payoff-closure-report.md`, `docs/PRD/p88-medical-payoff-contract.md`, `docs/test-reports/p88-p89-validation-shape.md`, `docs/designs/p25-lifetime-simulation-north-star.md`
> **Stage slug:** `p89-wuxia-medical-payoff-playable-implementation`
> **Stage type:** bounded payoff implementation stage for medical_sage_healer (2 variants × 3 choices = 6 branches)

## 1. Introduction

P88 已完成 `medical_sage_healer`（一代名医）路线的 payoff design-first contract：选定了 choice-based 方向（2 variants × 3 choices = 6 分支），定义了 compassionate（仁心之解）和 pragmatic（人情之解）两个 variant 的各 3 个选择、事件规格、表达更新、验证形状。

对照 renown trilogy 方法论，medical 路线目前走完了 bridge → entry → on-ramp → pressure → payoff-design。P89 的目标是把 P88 定义的 payoff contract 落地成可玩实现：runtime event wiring + expression updates + targeted proof + regression tests。

这不是 full medical content wave，而是严格按 P88 contract 落地的 bounded implementation 阶段——参照 P77（renown payoff implementation）和 P87（medical pressure implementation）的模式。

## 2. Goals

- 按 P88 contract 落地 `medical_sage_healer` 的 payoff 阶段 runtime 实现（2 variants × 3 choices = 6 分支）
- 让 medical 路线从"有代价的成长"推进到"有选择的了结"
- 复用现有事件系统与 sample-lines-spine 架构，不建新系统
- 保持 tavern-born 风味，不做成 generic payoff
- 为后续 late-life / endgame 阶段预留 flag 接口
- P83/P84/P85/P87 既有 evidence 不退化

## 3. Non-Goals

- 不做 medical late-life identity / endgame echo（P90+）
- 不新建 route framework 或事件调度器
- 不扩展到第二条新路线（其他路线仍 defer）
- 不做 full lifetime 全生命周期内容波次
- 不做 stat threshold gate 实现（可选增强项，defer）
- 不扩展到其他出身（仅 tavern_hand origin）
- 不新增第 4 个 choice 方向或修改已有 choice 定义
- 不新增 UI 组件
- 不做 plague hero / medical pure 完整抉择线

## 4. User Stories

### US-001: Wire Medical Payoff Spine Events (2 Variants)
**Description:** As a developer, I want both medical payoff choice events wired through the existing event system so players on the medical route encounter real payoff milestones with meaningful choices.

**Acceptance Criteria:**
- [ ] 在 `sample-lines-spine.json` 中配置 `medical_payoff_compassionate` choice 事件（age 42-46）
- [ ] 在 `sample-lines-spine.json` 中配置 `medical_payoff_pragmatic` choice 事件（age 43-47）
- [ ] 触发条件：`medical_midlife_pressure_done` + variant marker + age range + 互斥 guard + 排除 orthodox/demonic
- [ ] 两个事件都设置 `medical_payoff_done` checkpoint flag + `medical_age40_identity_done`
- [ ] Compassionate 3 个 choice 各设置对应的 marker flag：`tavern_medical_payoff_compassionate_holder` / `tavern_medical_payoff_compassionate_let_go` / `tavern_medical_payoff_compassionate_legacy`
- [ ] Pragmatic 3 个 choice 各设置对应的 marker flag：`tavern_medical_payoff_pragmatic_holder` / `tavern_medical_payoff_pragmatic_breaker` / `tavern_medical_payoff_pragmatic_master`
- [ ] 每个选项的 stat 变化正确（按 P88 contract 第 5 节）：
  - Compassionate A: rep+2, con-2, chivalry+3
  - Compassionate B: rep-1, con+2, charisma+1, chivalry-1
  - Compassionate C: rep+1, con+1, charisma+2, chivalry+1
  - Pragmatic A: rep+4, conn+3, chivalry-2, money+60
  - Pragmatic B: rep-3, con+2, conn-5, charisma-1, chivalry+1
  - Pragmatic C: rep+2, conn+1, charisma+4, money+30
- [ ] 不引入新的事件框架或调度器
- [ ] P83/P84/P85/P87 既有 evidence 不退化

### US-002: Add Payoff Player-Facing Expression — Sample Line (Core P0)
**Description:** As a player, I want the medical payoff choice reflected in my sample line status so the route feels like it has a meaningful identity turning point.

**Acceptance Criteria:**
- [ ] Sample line cost label: pressure 状态 → payoff 状态（6 个不同 label：油尽灯枯 / 释然行医 / 仁心传承 / 声名所累 / 快意江湖 / 人情练达）
- [ ] Sample line current goal: pressure 状态 → payoff 状态（6 个不同 goal）
- [ ] 至少 2 个 payoff-specific 可读信号（cost label + current goal）
- [ ] 6 个 choice 的表达有实质差异，不是换皮
- [ ] 2 个 variant 的表达有本质差异（不是镜像）
- [ ] 保持 tavern-born medical healer 风味
- [ ] 不新增 UI 组件

### US-003: Add Payoff Player-Facing Expression — Age-40 Identity (Core P0)
**Description:** As a player, I want an age-40 identity summary that reflects my payoff choice so the midlife turning point feels like it defines who I am.

**Acceptance Criteria:**
- [ ] `medicalAge40Identity()` 在 payoff 完成后返回对应身份文本
- [ ] Compassionate A: 油尽灯枯的仁心医者
- [ ] Compassionate B: 释然通透的医者
- [ ] Compassionate C: 传道授业的仁医之师
- [ ] Pragmatic A: 声名赫赫的权贵御医
- [ ] Pragmatic B: 快意恩仇的江湖游医
- [ ] Pragmatic C: 人情练达的一代名医
- [ ] 6 个 choice 的身份描述有实质差异
- [ ] 保持 tavern-born medical healer 风味

### US-004: Add Payoff Player-Facing Expression — Ordinary Origin (Bonus P1)
**Description:** As a player, I want additional payoff-specific expressions in the ordinary origin view so the payoff stage feels richer and more memorable.

**Acceptance Criteria:**
- [ ] Ordinary origin current goal: payoff 状态更新（与 sample line 一致或略有 tavern 视角差异）
- [ ] Ordinary origin life memory: payoff 特定文本（每个 choice 不同，共 6 段）
- [ ] Ordinary origin summary: payoff 状态更新（每个 choice 不同，共 6 段）
- [ ] 保持 tavern-born medical healer 风味
- [ ] 不新增 UI 组件

### US-005: Add Targeted Payoff Proof (6 Branches)
**Description:** As a maintainer, I want a bounded proof artifact showing that both medical payoff events fire correctly, all 6 choices work, and tavern-born healer flavor is preserved.

**Acceptance Criteria:**
- [ ] 产出 1 份 targeted proof（pressure → payoff → expression changes 路径验证，覆盖 2 variants）
- [ ] 展示 core nodes（pre-payoff baseline → 2 events fire → 3 choices visible per variant → 6 choices flags+stats → cost label per choice → current goal per choice）
- [ ] 可选 bonus 节点：age-40 identity（6 分支）、life memory、origin summary、full chain traceback、variant mutex
- [ ] 不要求 full lifetime exhaust
- [ ] proof 能支持是否继续 late-life 阶段的判断
- [ ] 保存为 `docs/test-reports/p89-medical-payoff-targeted-proof.md`

### US-006: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow tests guarding the medical payoff stage so future edits do not break the first medical payoff milestone.

**Acceptance Criteria:**
- [ ] 新增测试文件覆盖 payoff 阶段（2 variants × 3 choices）
- [ ] Group 1: Event wiring（2 events）— 事件存在、类型为 choice、3 个选项、触发条件正确、年龄范围正确
- [ ] Group 2: Pre-payoff state — pressure 后 payoff 前的状态验证（2 variants）
- [ ] Group 3: Compassionate 3 choices post-payoff — flags + stats + cost label + current goal
- [ ] Group 4: Pragmatic 3 choices post-payoff — flags + stats + cost label + current goal
- [ ] Group 5: Age-40 identity（6 branches, P1）
- [ ] Group 6: Two-variant differentiation — compassionate ≠ pragmatic
- [ ] Group 7: Six-branch differentiation — 全部 6 个分支不同
- [ ] Group 8: Distinct from renown/merchant payoff
- [ ] Group 9: No regression of P83/P84/P85/P87
- [ ] 复用现有 test harness
- [ ] 所有相关命令 Pass

### US-007: Produce P89 Closure Report
**Description:** As a maintainer, I want a closure report stating exactly what the medical payoff stage now provides and whether late-life stage is justified next.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p89-medical-payoff-closure-report.md`
- [ ] 汇总 event wiring、expression、proof、tests
- [ ] 明确后续 late-life 阶段是否值得开（GO / NO-GO）
- [ ] 列出更大 medical-expansion 项的 defer
- [ ] 14 条 closure criteria 全部满足（来自 P88 validation shape）

## 5. Functional Requirements

1. FR-1: P89 必须严格按 P88 payoff contract 落地，不偏离方向。
2. FR-2: P89 必须只处理 payoff 事件 + 对应表达 + 验证。
3. FR-3: 2 个 payoff 事件必须 runtime-visible，有实际事件触发与状态变化。
4. FR-4: P89 不得扩成 late-life / endgame 阶段。
5. FR-5: P83/P84/P85/P87 既有 evidence 必须保持通过。
6. FR-6: Payoff 必须保持 tavern-born medical healer 风味，与 merchant/renown payoff 明确区分。
7. FR-7: 2 variants 必须有本质差异（不是镜像）。
8. FR-8: 6 个 choice 必须有实质差异（stat、identity、表达、叙事调性）。
9. FR-9: P89 closure 必须回答是否值得继续 late-life 阶段。

## 6. Success Criteria

- Medical 路线有 payoff 阶段的实际 runtime 实现（2 variants × 3 choices = 6 分支）
- 玩家能感受到 medical 的选择：从"被动承受压力"到"主动选择了结方式"
- 6 个 choice 有实质差异，不是换皮
- 2 个 variant 有本质差异，不是镜像
- Tavern-born healer 风味贯穿 payoff 事件与表达
- P83/P84/P85/P87 既有 evidence 未退化
- 后续 late-life 阶段是否值得继续已有依据
- Typecheck + sample-lines-baseline guard 通过

## 7. Dependencies / Context

- P88 closure: `docs/test-reports/p88-medical-payoff-closure-report.md`
- P88 payoff contract: `docs/PRD/p88-medical-payoff-contract.md`
- P88 validation shape: `docs/test-reports/p88-p89-validation-shape.md`
- P87 pressure: `docs/test-reports/p87-medical-pressure-closure-report.md`
- P85 on-ramp: `docs/test-reports/p85-medical-sage-on-ramp-closure-report.md`
- P83 bridge: `docs/test-reports/p83-medical-sage-bridge-playable-closure-report.md`
- Renown payoff precedent: `docs/PRD/p77-wuxia-renown-payoff-playable-implementation.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 8. Risks And Rollback

### Risks

- **2x complexity risk:** 2 variants × 3 choices = 6 分支，工作量约为 renown payoff 的 2 倍
- **Choice event complexity risk:** Choice 事件比 auto 事件复杂，可能遇到事件系统的 edge case
- **Flavor dilution risk:** Implementation 可能丢失 tavern-born healer 风味，变成 generic medical payoff
- **Trigger timing risk:** 两个 variant 的 payoff 触发时机可能与现有事件冲突或过早/过晚
- **Regression risk:** 表达更新可能意外影响 P83/P84/P85/P87 既有行为
- **Variant weakening risk:** Implementation 中两个 variant 的差异可能被稀释
- **Choice meaninglessness risk:** 6 个 choice 的表达差异可能在 implementation 中被削弱

### Rollback

- 若事件触发不稳定，可回退到 P87 pressure-only 状态（仅移除 payoff 事件配置 + 表达更新）
- P87 pressure 不受 P89 影响，可独立存活
- 可通过回滚 P89 分支恢复到 P88 design-only 状态

## 9. Validation Direction

- Event 层：2 个 payoff 事件必须触发 + flags 必须正确设置 + 6 个 choice 都能走
- Expression 层：cost label + current goal + age-40 identity 必须更新 + 风味正确
- Proof 层：targeted proof 覆盖 2 variants × 3 choices
- Regression 层：P83/P84/P85/P87 既有测试必须通过
- Differentiation 层：2 variants 不同 + 6 分支不同 + 与 renown/merchant 不同
- Continuation 层：closure 必须明确 late-life 阶段是否值得继续

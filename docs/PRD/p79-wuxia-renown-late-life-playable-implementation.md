# PRD: P79 Wuxia Renown Late-Life Playable Implementation

> **Derived from:** `docs/PRD/p78-renown-late-life-contract.md`, `docs/test-reports/p78-renown-late-life-closure-report.md`, `docs/test-reports/p78-p79-validation-shape.md`, `docs/designs/p25-lifetime-simulation-north-star.md`
> **Stage slug:** `p79-wuxia-renown-late-life-playable-implementation`
> **Stage type:** bounded late-life implementation stage for jianghu_renown_sage

## 1. Introduction

P78 已完成 `jianghu_renown_sage`（江湖名宿）路线的 late-life design-first contract：选定了 single auto event with 3 branches 方向，定义了三个分支（油尽灯枯/逍遥自在/传承授业）、事件规格、表达更新、验证形状。Closure report 给出 **CONDITIONAL GO**。

对照 merchant trilogy 方法论，renown 路线目前走完了 bridge → entry → on-ramp → pressure → payoff → late-life-design。P79 的目标是把 P78 定义的 late-life contract 落地成可玩实现：runtime event wiring + expression updates + targeted proof + regression tests。

这不是 full renown content wave，而是严格按 P78 contract 落地的 bounded implementation 阶段——参照 P77（payoff implementation）的模式。

## 2. Goals

- 按 P78 contract 落地 `jianghu_renown_sage` 的 late-life 阶段 runtime 实现
- 让 renown 路线从"有选择的了结"推进到"有后果的晚年"
- 复用现有事件系统与 sample-lines-spine 架构，不建新系统
- 保持 tavern-born 风味，不做成 generic late-life
- 为后续 endgame / final legacy 阶段预留 flag 接口
- P71/P72/P73/P75/P77 既有 evidence 不退化

## 3. Non-Goals

- 不做 renown endgame echo / final legacy（P80+）
- 不新建 route framework 或事件调度器
- 不扩展到第二条新路线（medical_sage_healer 仍 defer）
- 不做 full lifetime 全生命周期内容波次
- 不做 stat threshold gate 实现（可选增强项，defer）
- 不扩展到其他出身（仅 tavern_hand origin）
- 不新增第三条分支或修改已有分支定义
- 不新增 UI 组件

## 4. User Stories

### US-001: Wire Renown Late-Life Spine Event
**Description:** As a developer, I want the renown late-life event wired through the existing event system so players on the renown route encounter a real late-life milestone with 3 distinct branches.

**Acceptance Criteria:**
- [ ] 在 `sample-lines-spine.json` 中配置 `renown_late_life` auto 事件
- [ ] 触发条件：`renown_midlife_payoff_done` + age 52-56 + 互斥 guard + 排除 orthodox/demonic
- [ ] 事件设置 `renown_late_life_done` checkpoint flag + `renown_late_life_identity_done`
- [ ] 三个分支各设置对应的 marker flag：`tavern_renown_late_burnout` / `tavern_renown_late_lone_wolf` / `tavern_renown_late_mentor`
- [ ] 分支逻辑：基于 payoff choice marker（hard_holder→burnout, breaker→lone_wolf, balancer→mentor）
- [ ] 每个分支的 stat 变化正确：A(rep+2,con+1,cha-1) / B(rep-1,con-2,cha+3) / C(rep+3,con+2,cha+2)
- [ ] 不引入新的事件框架或调度器
- [ ] P71/P72/P73/P75/P77 既有 evidence 不退化

### US-002: Add Late-Life Player-Facing Expression — Sample Line Core (P0)
**Description:** As a player, I want the renown late-life stage reflected in my sample line status so the route feels like it has a meaningful late-life identity.

**Acceptance Criteria:**
- [ ] Sample line cost label: payoff 状态 → late-life 状态（油尽灯枯 / 逍遥自在 / 传承授业）
- [ ] Sample line current goal: payoff 状态 → late-life 状态（撑到最后 / 过好剩下的日子 / 指点后辈）
- [ ] 至少 2 个 late-life-specific 可读信号（cost label + current goal）
- [ ] 三个分支的表达有实质差异，不是换皮
- [ ] 保持 tavern-born renown 风味
- [ ] 不新增 UI 组件

### US-003: Add Late-Life Player-Facing Expression — Late-Life Identity (P0)
**Description:** As a player, I want a late-life identity summary that deepens my age-40 identity so the late-life stage feels like it defines who I become.

**Acceptance Criteria:**
- [ ] `renownAge40Identity()` 扩展为检查 `renown_late_life_identity_done` 优先于 `renown_age40_identity_done`
- [ ] Branch A: 油尽灯枯的老好人
- [ ] Branch B: 逍遥自在的孤翁
- [ ] Branch C: 德高望重的老前辈
- [ ] 三个分支的身份描述有实质差异
- [ ] 保持 tavern-born renown 风味

### US-004: Add Late-Life Player-Facing Expression — Ordinary Origin (Bonus P1)
**Description:** As a player, I want additional late-life-specific expressions in the ordinary origin view so the late-life stage feels richer and more memorable.

**Acceptance Criteria:**
- [ ] Ordinary origin current goal: late-life 状态更新（与 sample line 一致）
- [ ] Ordinary origin life memory: late-life 特定文本（每个分支不同）
- [ ] Ordinary origin summary: late-life 状态更新（每个分支不同）
- [ ] 保持 tavern-born renown 风味
- [ ] 不新增 UI 组件

### US-005: Add Targeted Late-Life Proof
**Description:** As a maintainer, I want a bounded proof artifact showing that the renown late-life event fires correctly, all three branches work, and tavern-born renown flavor is preserved.

**Acceptance Criteria:**
- [ ] 产出 1 份 targeted proof（payoff → late-life → expression changes 路径验证）
- [ ] 展示 8 个 core nodes：pre-late-life baseline → event fires → Branch A flags+stats → Branch B flags+stats → Branch C flags+stats → cost label per branch → current goal per branch → late-life identity per branch
- [ ] 可选 bonus 节点：life memory、origin summary、full chain traceback、mutex with other lines、branch matching、tavern-born flavor check
- [ ] 不要求 full lifetime exhaust
- [ ] proof 能支持是否继续 endgame 阶段的判断
- [ ] 保存为 `docs/test-reports/p79-renown-late-life-targeted-proof.md`

### US-006: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow tests guarding the renown late-life stage so future edits do not break the first renown late-life milestone.

**Acceptance Criteria:**
- [ ] 新增测试文件覆盖 late-life 阶段
- [ ] Group 1: Event wiring（4 tests）— 事件存在、类型为 auto、年龄范围、触发条件正确
- [ ] Group 2: Pre-late-life state（2 tests）— payoff 后 late-life 前的状态验证
- [ ] Group 3: Branch A post-late-life（4 tests）— flags + stats + cost label + current goal
- [ ] Group 4: Branch B post-late-life（4 tests）— flags + stats + cost label + current goal
- [ ] Group 5: Branch C post-late-life（4 tests）— flags + stats + cost label + current goal
- [ ] Group 6: Distinct from merchant late-life（2 tests）
- [ ] Group 7: No regression of P71/P72/P73/P75/P77（5 tests）
- [ ] 复用现有 test harness
- [ ] 所有相关命令 Pass

### US-007: Produce P79 Closure Report
**Description:** As a maintainer, I want a closure report stating exactly what the renown late-life stage now provides and whether endgame stage is justified next.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p79-renown-late-life-closure-report.md`
- [ ] 汇总 event wiring、expression、proof、tests
- [ ] 明确后续 endgame / final legacy 阶段是否值得开
- [ ] 列出更大 renown-expansion 项的 defer
- [ ] 9 条 closure criteria 全部满足（来自 P78 validation shape）

## 5. Functional Requirements

1. FR-1: P79 必须严格按 P78 late-life contract 落地，不偏离方向。
2. FR-2: P79 必须只处理 late-life 事件 + 对应表达 + 验证。
3. FR-3: Late-life 事件必须 runtime-visible，有实际事件触发与状态变化。
4. FR-4: P79 不得扩成 endgame / final legacy 阶段。
5. FR-5: P71/P72/P73/P75/P77 既有 evidence 必须保持通过。
6. FR-6: Late-life 必须保持 tavern-born renown 风味，与 merchant late-life 明确区分。
7. FR-7: 三个分支必须有实质差异（stat、identity、表达、叙事调性）。
8. FR-8: P79 closure 必须回答是否值得继续 endgame 阶段。

## 6. Success Criteria

- Renown 路线有 late-life 阶段的实际 runtime 实现
- 玩家能感受到 renown 的晚年：从"主动选择了结"到"自然结果的晚年"
- 三个分支有实质差异，不是换皮
- Tavern-born 风味贯穿 late-life 事件与表达
- P71/P72/P73/P75/P77 既有 evidence 未退化
- 后续 endgame 阶段是否值得继续已有依据
- Typecheck + sample-lines-baseline guard 通过

## 7. Dependencies / Context

- P78 closure: `docs/test-reports/p78-renown-late-life-closure-report.md`
- P78 late-life contract: `docs/PRD/p78-renown-late-life-contract.md`
- P78 validation shape: `docs/test-reports/p78-p79-validation-shape.md`
- P77 payoff: `docs/test-reports/p77-renown-payoff-closure-report.md`
- P75 pressure: `docs/test-reports/p75-renown-pressure-closure-report.md`
- P73 on-ramp: `docs/test-reports/p73-renown-on-ramp-closure-report.md`
- P71 bridge: `docs/test-reports/p71-selected-next-route-bridge-closure-report.md`
- Merchant late-life precedent: TBD
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 8. Risks And Rollback

### Risks

- **Auto event branching risk:** Auto event with branching may need careful configuration in the sample-lines-spine system
- **Flavor dilution risk:** Implementation 可能丢失 tavern-born 风味，变成 generic jianghu late-life
- **Trigger timing risk:** Late-life 触发时机可能与现有事件冲突或过早/过晚
- **Regression risk:** 表达更新可能意外影响 P71/P72/P73/P75/P77 既有行为
- **Branch meaninglessness risk:** Implementation 中三个分支的表达差异可能被稀释

### Rollback

- 若事件触发不稳定，可回退到 P77 payoff-only 状态（仅移除 late-life 事件配置 + 表达更新）
- P77 payoff 不受 P79 影响，可独立存活
- 可通过回滚 P79 分支恢复到 P78 design-only 状态

## 9. Validation Direction

- Event 层：late-life 事件必须触发 + flags 必须正确设置 + 三个分支都能走
- Expression 层：cost label + current goal + late-life identity 必须更新 + 风味正确
- Proof 层：targeted proof 展示 8 个 core nodes
- Regression 层：P71/P72/P73/P75/P77 既有测试必须通过
- Continuation 层：closure 必须明确 endgame 阶段是否值得继续

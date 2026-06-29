# PRD: P91 Wuxia Medical Late-Life Playable Implementation

> **Derived from:** `docs/test-reports/p90-medical-late-life-closure-report.md`, `docs/PRD/p90-medical-late-life-contract.md`, `docs/test-reports/p90-p91-validation-shape.md`, `docs/designs/p25-lifetime-simulation-north-star.md`
> **Stage slug:** `p91-wuxia-medical-late-life-playable-implementation`
> **Stage type:** bounded late-life implementation stage for medical_sage_healer (single auto event × 6 branches)

## 1. Introduction

P90 已完成 `medical_sage_healer`（一代名医）路线的 late-life design-first contract：选定了 single auto event with 6 branches 方向（2 variants × 3 choices），定义了 compassionate（body/spirit axis）和 pragmatic（social/position axis）两个 variant 的各 3 个 late-life 分支、事件规格、表达更新、验证形状。Closure report 给出 **GO** 推荐。

对照 renown trilogy 方法论，medical 路线目前走完了 bridge → entry → on-ramp → pressure → payoff → late-life-design。P91 的目标是把 P90 定义的 late-life contract 落地成可玩实现：runtime event wiring + expression updates + targeted proof + regression tests。

这不是 full medical content wave，而是严格按 P90 contract 落地的 bounded implementation 阶段——参照 P79（renown late-life implementation）和 P89（medical payoff implementation）的模式。

## 2. Goals

- 按 P90 contract 落地 `medical_sage_healer` 的 late-life 阶段 runtime 实现（1 auto event × 6 branches）
- 让 medical 路线从"有选择的了结"推进到"有后果的晚年"
- 复用现有事件系统与 sample-lines-spine 架构，不建新系统
- 保持 tavern-born medical healer 风味，不做成 generic late-life
- 为后续 endgame / final legacy 阶段预留 flag 接口
- P83/P84/P85/P87/P89 既有 evidence 不退化

## 3. Non-Goals

- 不做 medical endgame echo / final legacy（P92+）
- 不新建 route framework 或事件调度器
- 不扩展到第二条新路线（其他路线仍 defer）
- 不做 full lifetime 全生命周期内容波次
- 不做 stat threshold gate 实现（可选增强项，defer）
- 不扩展到其他出身（仅 tavern_hand origin）
- 不新增第 7 个分支或修改已有分支定义
- 不新增 UI 组件
- 不做 plague hero / medical pure 完整抉择线

## 4. User Stories

### US-001: Wire Medical Late-Life Spine Event (6 Branches)
**Description:** As a developer, I want the medical late-life auto event wired through the existing event system so players on the medical route encounter a real late-life milestone with 6 distinct branches based on payoff choice.

**Acceptance Criteria:**
- [ ] 在 `sample-lines-spine.json` 中配置 `medical_late_life` auto 事件（age 52-56）
- [ ] 触发条件：`medical_payoff_done` + age range + 互斥 guard + 排除 orthodox/demonic
- [ ] 事件设置 `medical_late_life_done` checkpoint flag + `medical_late_life_identity_done`
- [ ] 分支逻辑：基于 payoff choice marker（6 选 1）
- [ ] Compassionate 3 个分支各设置对应的 marker flag：
  - `tavern_medical_late_compassionate_final`（Comp-A：最后仁心）
  - `tavern_medical_late_compassionate_peaceful`（Comp-B：从容自在）
  - `tavern_medical_late_compassionate_legacy`（Comp-C：仁心传承）
- [ ] Pragmatic 3 个分支各设置对应的 marker flag：
  - `tavern_medical_late_pragmatic_fallen`（Prag-A：人走茶凉）
  - `tavern_medical_late_pragmatic_wanderer`（Prag-B：逍遥自在）
  - `tavern_medical_late_pragmatic_master`（Prag-C：德高望重）
- [ ] 每个分支的 stat 变化正确（按 P90 contract 第 5 节）：
  - Comp-A: con-3, chivalry+3, rep+2, cha+1（净值 +3）
  - Comp-B: con+2, cha+3, chivalry+1, rep+1（净值 +7）
  - Comp-C: rep+4, chivalry+2, cha+2, connections+2（净值 +10）
  - Prag-A: rep-3, connections-4, money-2, cha+2, con+1（净值 -6）
  - Prag-B: con+2, chivalry+2, cha+2, connections-3（净值 +3）
  - Prag-C: rep+4, connections+3, cha+3, money+2, con+1（净值 +13）
- [ ] 不引入新的事件框架或调度器
- [ ] P83/P84/P85/P87/P89 既有 evidence 不退化

### US-002: Add Late-Life Player-Facing Expression — Sample Line (Core P0)
**Description:** As a player, I want the medical late-life stage reflected in my sample line status so the route feels like it has a meaningful late-life identity.

**Acceptance Criteria:**
- [ ] Sample line cost label: payoff 状态 → late-life 状态（6 个不同 label：最后仁心 / 从容自在 / 仁心传承 / 人走茶凉 / 逍遥自在 / 德高望重）
- [ ] Sample line current goal: payoff 状态 → late-life 状态（6 个不同 goal）
- [ ] Gate order: `medical_late_life_done` > `medical_payoff_done` > `medical_midlife_pressure_done` > `medical_on_ramp_done` > `tavern_medical_bridge_crossed` > base
- [ ] 至少 2 个 late-life-specific 可读信号（cost label + current goal）
- [ ] 6 个分支的表达有实质差异，不是换皮
- [ ] 2 个 variant 的表达有本质差异（compassionate = body/spirit, pragmatic = social/position）
- [ ] 保持 tavern-born medical healer 风味
- [ ] 不新增 UI 组件

### US-003: Add Late-Life Player-Facing Expression — Late-Life Identity (Core P0)
**Description:** As a player, I want a late-life identity summary that deepens my age-40 identity so the late-life stage feels like it defines who I become.

**Acceptance Criteria:**
- [ ] `medicalAge40Identity()` 扩展为检查 `medical_late_life_identity_done` 优先于 `medical_age40_identity_done`
- [ ] Comp-A: 燃尽自己的最后仁心
- [ ] Comp-B: 从容自在的老者
- [ ] Comp-C: 仁心满天下的老宗师
- [ ] Prag-A: 失势的老御医
- [ ] Prag-B: 逍遥自在的老游医
- [ ] Prag-C: 德高望重的老名医
- [ ] 6 个分支的身份描述有实质差异
- [ ] 保持 tavern-born medical healer 风味（酒肆、老掌柜、苦孩子/人精等锚点）

### US-004: Add Late-Life Player-Facing Expression — Ordinary Origin (Bonus P1)
**Description:** As a player, I want additional late-life-specific expressions in the ordinary origin view so the late-life stage feels richer and more memorable.

**Acceptance Criteria:**
- [ ] Ordinary origin current goal: late-life 状态更新（与 sample line 一致）
- [ ] Ordinary origin life memory: late-life 特定文本（每个分支不同，共 6 段）
- [ ] Ordinary origin summary: late-life 状态更新（每个分支不同，共 6 段）
- [ ] Gate order 与 sample line 一致
- [ ] 保持 tavern-born medical healer 风味
- [ ] 不新增 UI 组件

### US-005: Add Targeted Late-Life Proof (6 Branches)
**Description:** As a maintainer, I want a bounded proof artifact showing that the medical late-life event fires correctly, all 6 branches work, and tavern-born healer flavor is preserved.

**Acceptance Criteria:**
- [ ] 产出 1 份 targeted proof（payoff → late-life → expression changes 路径验证，覆盖 2 variants × 3 choices）
- [ ] 展示 core nodes（pre-late-life baseline → event fires → 6 branches flags+stats → cost label per branch → current goal per branch → late-life identity per branch）
- [ ] 可选 bonus 节点：life memory、origin summary、full chain traceback、variant differentiation（body/spirit vs social/position）、6-branch differentiation、cross-route distinction、tavern-born flavor check
- [ ] 不要求 full lifetime exhaust
- [ ] proof 能支持是否继续 endgame 阶段的判断
- [ ] 保存为 `docs/test-reports/p91-medical-late-life-targeted-proof.md`

### US-006: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow tests guarding the medical late-life stage so future edits do not break the first medical late-life milestone.

**Acceptance Criteria:**
- [ ] 新增测试文件覆盖 late-life 阶段（1 auto event × 6 branches）
- [ ] Group 1: Event wiring — 事件存在、类型为 auto、年龄范围、触发条件正确、6 branch markers 正确
- [ ] Group 2: Pre-late-life state — payoff 后 late-life 前的状态验证（2 variants）
- [ ] Group 3: Compassionate 3 branches post-late-life — flags + stats + cost label + current goal
- [ ] Group 4: Pragmatic 3 branches post-late-life — flags + stats + cost label + current goal
- [ ] Group 5: Late-life identity（6 branches, P0）
- [ ] Group 6: Two-variant differentiation — compassionate ≠ pragmatic（body/spirit vs social/position）
- [ ] Group 7: Six-branch differentiation — 全部 6 个分支不同
- [ ] Group 8: Distinct from renown late-life（healer vs jianghu networker）
- [ ] Group 9: No regression of P83/P84/P85/P87/P89
- [ ] 复用现有 test harness
- [ ] 所有相关命令 Pass

### US-007: Produce P91 Closure Report
**Description:** As a maintainer, I want a closure report stating exactly what the medical late-life stage now provides and whether endgame stage is justified next.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p91-medical-late-life-closure-report.md`
- [ ] 汇总 event wiring、expression、proof、tests
- [ ] 明确后续 endgame / final legacy 阶段是否值得开（GO / NO-GO）
- [ ] 列出更大 medical-expansion 项的 defer
- [ ] 14 条 closure criteria 全部满足（来自 P90 validation shape）

## 5. Functional Requirements

1. FR-1: P91 必须严格按 P90 late-life contract 落地，不偏离方向。
2. FR-2: P91 必须只处理 late-life 事件 + 对应表达 + 验证。
3. FR-3: Late-life 事件必须 runtime-visible，有实际事件触发与状态变化。
4. FR-4: P91 不得扩成 endgame / final legacy 阶段。
5. FR-5: P83/P84/P85/P87/P89 既有 evidence 必须保持通过。
6. FR-6: Late-life 必须保持 tavern-born medical healer 风味，与 renown late-life 明确区分。
7. FR-7: 2 variants 必须有本质差异（compassionate = body/spirit, pragmatic = social/position，不是镜像）。
8. FR-8: 6 个分支必须有实质差异（stat、identity、表达、叙事调性）。
9. FR-9: P91 closure 必须回答是否值得继续 endgame 阶段。

## 6. Success Criteria

- Medical 路线有 late-life 阶段的实际 runtime 实现（1 auto event × 6 branches）
- 玩家能感受到 medical 的晚年：从"主动选择了结"到"自然结果的晚年"
- 6 个分支有实质差异，不是换皮
- 2 个 variant 有本质差异，不是镜像（body/spirit vs social/position）
- Tavern-born healer 风味贯穿 late-life 事件与表达
- P83/P84/P85/P87/P89 既有 evidence 未退化
- 后续 endgame 阶段是否值得继续已有依据
- Typecheck + sample-lines-baseline guard 通过

## 7. Dependencies / Context

- P90 closure: `docs/test-reports/p90-medical-late-life-closure-report.md`
- P90 late-life contract: `docs/PRD/p90-medical-late-life-contract.md`
- P90 validation shape: `docs/test-reports/p90-p91-validation-shape.md`
- P89 payoff: `docs/test-reports/p89-medical-payoff-closure-report.md`
- P87 pressure: `docs/test-reports/p87-medical-pressure-closure-report.md`
- P85 on-ramp: `docs/test-reports/p85-medical-sage-on-ramp-closure-report.md`
- P83 bridge: `docs/test-reports/p83-medical-sage-bridge-playable-closure-report.md`
- Renown late-life precedent: `docs/PRD/p79-wuxia-renown-late-life-playable-implementation.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 8. Risks And Rollback

### Risks

- **6-branch complexity risk:** 6 个分支 = 2× renown late-life 的工作量，实现中可能稀释质量
- **Auto event branching risk:** Auto event with 6-way branching 可能需要在 sample-lines-spine 系统中小心配置
- **Flavor dilution risk:** Implementation 可能丢失 tavern-born healer 风味，变成 generic old doctor
- **Trigger timing risk:** Late-life 触发时机可能与现有事件冲突或过早/过晚
- **Regression risk:** 表达更新可能意外影响 P83/P84/P85/P87/P89 既有行为
- **Variant weakening risk:** Implementation 中两个 variant 的差异可能被稀释
- **Branch meaninglessness risk:** 6 个分支的表达差异可能在 implementation 中被削弱

### Rollback

- 若事件触发不稳定，可回退到 P89 payoff-only 状态（仅移除 late-life 事件配置 + 表达更新）
- P89 payoff 不受 P91 影响，可独立存活
- 可通过回滚 P91 分支恢复到 P90 design-only 状态

## 9. Validation Direction

- Event 层：late-life 事件必须触发 + flags 必须正确设置 + 6 个分支都能走
- Expression 层：cost label + current goal + late-life identity 必须更新 + 风味正确
- Proof 层：targeted proof 覆盖 2 variants × 3 choices = 6 branches
- Regression 层：P83/P84/P85/P87/P89 既有测试必须通过
- Differentiation 层：2 variants 不同 + 6 分支不同 + 与 renown late-life 不同
- Continuation 层：closure 必须明确 endgame 阶段是否值得继续

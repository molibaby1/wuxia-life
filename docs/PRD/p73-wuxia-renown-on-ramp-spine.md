# PRD: P73 Wuxia Renown On-Ramp Spine

> **Derived from:** `docs/test-reports/p72-selected-next-route-entry-closure-report.md`, `docs/PRD/p72-wuxia-selected-next-route-entry-differentiation.md`, `docs/designs/p25-lifetime-simulation-north-star.md`
> **Stage slug:** `p73-wuxia-renown-on-ramp-spine`
> **Stage type:** bounded post-entry renown densification stage — on-ramp spine for the jianghu_renown_sage route

## 1. Introduction

P72 已完成 `jianghu_renown_sage`（江湖名宿）路线的 entry 差异化：bridge 后第一层表达已具备清晰的身份信号。但 renown 路线目前只有 entry 层的"标签"和"方向感"，尚缺一条让玩家真正走通的主链骨架。

对照 merchant trilogy 的路径是：entry → on-ramp → pressure → payoff。其中 on-ramp 是路线的"第一桩标志性事件，它回答："我过了桥，然后呢？"

P73 的目标是为 `jianghu_renown_sage` 建立最小可玩的 on-ramp spine——过桥后的第一个标志性叙事事件，让 renown 路线从"有标签"变成"有内容"。

这不是 full renown content wave，而是最小 bounded 的 spine：一个 on-ramp 里程碑事件 + 对应的表达和验证。

## 2. Goals

- 为 `jianghu_renown_sage` 建立第一个 on-ramp spine 事件（过桥后的第一个标志性叙事节点）
- 让 renown 路线从 entry 层的"身份标签"推进到"有事件内容"
- 复用现有事件系统与 sample-lines-spine 架构，不建新系统
- 保持 tavern-born 风味，不做成 generic renown
- 为后续 pressure / payoff 阶段预留接口

## 3. Non-Goals

- 不做 renown midlife pressure 事件（P74+）
- 不做 renown payoff / age-40 identity 深化（P75+）
- 不新建 route framework 或事件调度器
- 不扩展到第二条新路线（medical_sage_healer 仍 defer）
- 不做 full lifetime 全生命周期内容波次
- 不做 stat threshold gate 验证（defer 到更后阶段）
- 不扩展到其他出身（仅 tavern_hand origin）

## 4. User Stories

### US-001: Audit Renown On-Ramp Gap
**Description:** As a maintainer, I want an audit of what currently exists for the jianghu_renown_sage after entry so P73 targets the real on-ramp gap instead of building on assumptions.

**Acceptance Criteria:**
- [ ] 汇总 renown 路线目前已有的 flags、markers、expression、events
- [ ] 明确 on-ramp 之前已有的基础 vs 需要补的最小 spine
- [ ] 输出 `docs/test-reports/p73-renown-on-ramp-gap-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P73 Scope Contract
**Description:** As a planner, I want a scope contract so P73 stays an on-ramp spine stage and does not sprawl into full renown content.

**Acceptance Criteria:**
- [ ] 明确 P73 只处理 on-ramp spine 事件 + 对应表达
- [ ] 明确允许层：事件配置、表达、proof、窄测试
- [ ] 明确禁止项：pressure wave、payoff wave、新系统、全量路线扩写、第二条路线
- [ ] 输出 `docs/test-reports/p73-renown-on-ramp-scope-contract.md`

### US-003: Define Renown On-Ramp Contract
**Description:** As a designer, I want an explicit on-ramp contract for jianghu_renown_sage so the first post-bridge milestone feels like a renown-specific turning point rather than generic midlife.

**Acceptance Criteria:**
- [ ] 定义 on-ramp 事件的触发条件（bridge 后 + age 范围 + 最小声望/人脉门槛）
- [ ] 定义事件的核心叙事："江湖名宿"的第一个标志性节点是什么
- [ ] 保留 tavern-born 风味（从酒肆走来的人脉路径）
- [ ] 为后续 pressure / payoff 预留 flag 接口
- [ ] 合同写入 PRD 或附录

### US-004: Wire Renown On-Ramp Spine Event
**Description:** As a developer, I want the renown on-ramp event wired through the existing event system so players crossing the renown bridge encounter a real milestone rather than only expression labels.

**Acceptance Criteria:**
- [ ] 通过现有事件系统配置实现 on-ramp spine 事件
- [ ] 不引入新的事件框架或调度器
- [ ] 触发条件与 P71 bridge + P72 entry 兼容
- [ ] P71/P72 既有 evidence 不退化
- [ ] 共享终点链仍稳定可触发

### US-005: Add On-Ramp Player-Facing Expression
**Description:** As a player, I want the renown on-ramp to read as a meaningful turning point so the route feels like it has content beyond entry labels.

**Acceptance Criteria:**
- [ ] 至少补 2 个 on-ramp-specific 可读信号（currentGoal 更新、身份摘要等）
- [ ] on-ramp 后玩家能感到"我真的在江湖上有了名声"
- [ ] 不新增 UI 组件
- [ ] 对应表达测试可新增或更新

### US-006: Add Targeted On-Ramp Proof
**Description:** As a maintainer, I want a bounded proof artifact showing that the renown on-ramp event fires correctly and carries the tavern-born renown flavor.

**Acceptance Criteria:**
- [ ] 产出 1 份 targeted proof（bridge → on-ramp 路径验证）
- [ ] 展示 on-ramp 事件触发 + 表达变化
- [ ] 不要求 full lifetime exhaust
- [ ] proof 能支持是否继续 pressure 阶段

### US-007: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow tests guarding the renown on-ramp spine so future edits do not break the first renown content milestone.

**Acceptance Criteria:**
- [ ] 至少覆盖 on-ramp 触发条件、事件触发、表达更新、comparison断言
- [ ] 复用现有 test harness
- [ ] 不重写全量测试体系
- [ ] 相关命令 Pass

### US-008: Produce P73 Closure Report
**Description:** As a maintainer, I want a closure report stating exactly what the renown on-ramp now provides and whether pressure / payoff stages are justified next.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p73-renown-on-ramp-closure-report.md`
- [ ] 汇总 gap audit、contract、event wiring、expression、proof、tests
- [ ] 明确后续 pressure 阶段是否值得开
- [ ] 列出更大 renown-expansion 项的 defer

## 5. Functional Requirements

1. FR-1: P73 必须建立在 P72 entry differentiation 已闭合的前提上。
2. FR-2: P73 必须只处理 on-ramp spine 事件 + 对应表达。
3. FR-3: On-ramp 事件必须 runtime-visible，有实际事件触发与状态变化。
4. FR-4: P73 不得扩成 pressure / payoff 阶段。
5. FR-5: P73 closure 必须回答是否值得继续 pressure 阶段。

## 6. Success Criteria

- renown 路线有第一个实际的 on-ramp 内容事件
- 玩家过桥后能感受到"我在江湖上有了名声"的标志性节点
- tavern-born 风味贯穿 on-ramp 事件与表达
- P71/P72 既有 evidence 未退化
- 后续 pressure 阶段是否值得继续已有依据

## 7. Dependencies / Context

- P72 closure: `docs/test-reports/p72-selected-next-route-entry-closure-report.md`
- P71 bridge: `docs/test-reports/p71-selected-next-route-bridge-closure-report.md`
- Merchant on-ramp precedent: `docs/PRD/p55-wuxia-merchant-magnate-bounded-expansion.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`

## 8. Risks And Rollback

### Risks

- **Over-content risk:** 容易把 on-ramp 写成 pressure 或 payoff 的内容
- **Generic flavor risk:** 容易做成 generic renown，丢失 tavern-born 味道
- **Trigger timing risk:** on-ramp 触发时机可能与现有事件冲突或过早/过晚

### Rollback

- 若事件触发不稳定，可回退到 P72 entry-only 状态（仅移除 on-ramp 事件配置）
- P72 entry differentiation 不受 P73 影响，可独立存活

## 9. Validation Direction

- gap 层：必须先确认 renown 路线当前实际有什么
- on-ramp 层：事件必须触发 + 表达必须更新 + 玩家可感知
- continuation 层：closure 必须明确 pressure 阶段是否值得继续

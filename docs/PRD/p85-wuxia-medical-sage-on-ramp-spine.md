# PRD: P85 Wuxia Medical Sage On-Ramp Spine

> **Derived from:** `docs/test-reports/p84-medical-entry-closure-report.md`, `docs/PRD/p84-wuxia-medical-sage-entry-differentiation.md`, `docs/designs/p25-lifetime-simulation-north-star.md`
> **Stage slug:** `p85-wuxia-medical-sage-on-ramp-spine`
> **Stage type:** bounded post-entry medical densification stage — on-ramp spine for the medical_sage_healer route

## 1. Introduction

P84 已完成 `medical_sage_healer`（一代名医）路线的 entry 差异化：bridge 后第一层表达已具备清晰的身份信号，compassionate / pragmatic 两个 variant 在 7 个表达面上可区分。但医疗路线目前只有 entry 层的"标签"和"方向感"，尚缺一条让玩家真正走通的主链骨架。

对照 renown 路线的路径是：entry → on-ramp → pressure → payoff。其中 on-ramp 是路线的"第一桩标志性事件"，它回答："我过了桥，然后呢？"

P85 的目标是为 `medical_sage_healer` 建立最小可玩的 on-ramp spine——过桥后的第一个标志性叙事事件，让医疗路线从"有标签"变成"有内容"。

这不是 full medical content wave，而是最小 bounded 的 spine：一个 on-ramp 里程碑事件 + 对应的表达和验证，且需延续 compassionate / pragmatic 两个 variant 的分化。

## 2. Goals

- 为 `medical_sage_healer` 建立第一个 on-ramp spine 事件（过桥后的第一个标志性叙事节点）
- 让医疗路线从 entry 层的"身份标签"推进到"有事件内容"
- 延续 compassionate / pragmatic 两个 variant 的分化（on-ramp 层也要可区分）
- 复用现有事件系统与 sample-lines-spine 架构，不建新系统
- 保持 tavern-born 风味，不做成 generic 神医
- 为后续 pressure / payoff 阶段预留接口

## 3. Non-Goals

- 不做 medical midlife pressure 事件（P86+）
- 不做 medical payoff / 神医名声 / 太医线（P87+）
- 不新建 route framework 或事件调度器
- 不扩展到第二条新路线
- 不做 full lifetime 全生命周期内容波次
- 不做 stat threshold gate 验证（defer 到更后阶段）
- 不扩展到其他出身（仅 tavern_hand origin）
- 不做 poison path
- 不做 plague hero / medical pure 抉择（pressure 阶段）

## 4. User Stories

### US-001: Audit Medical On-Ramp Gap
**Description:** As a maintainer, I want an audit of what currently exists for the medical_sage_healer after entry so P85 targets the real on-ramp gap instead of building on assumptions.

**Acceptance Criteria:**
- [ ] 汇总 medical 路线目前已有的 flags、markers、expression、events
- [ ] 明确 on-ramp 之前已有的基础 vs 需要补的最小 spine
- [ ] 分析两个 variant（compassionate / pragmatic）各自的 on-ramp 需求
- [ ] 输出 `docs/test-reports/p85-medical-on-ramp-gap-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P85 Scope Contract
**Description:** As a planner, I want a scope contract so P85 stays an on-ramp spine stage and does not sprawl into full medical content.

**Acceptance Criteria:**
- [ ] 明确 P85 只处理 on-ramp spine 事件 + 对应表达
- [ ] 明确允许层：事件配置、表达、proof、窄测试
- [ ] 明确禁止项：pressure wave、payoff wave、新系统、全量路线扩写、第二条路线、其他出身
- [ ] 明确与 P86（pressure）的边界
- [ ] 输出 `docs/test-reports/p85-medical-on-ramp-scope-contract.md`

### US-003: Define Medical On-Ramp Contract
**Description:** As a designer, I want an explicit on-ramp contract for medical_sage_healer so the first post-bridge milestone feels like a medical-specific turning point rather than generic midlife.

**Acceptance Criteria:**
- [ ] 定义 on-ramp 事件的触发条件（bridge 后 + age 范围 + 最小门槛）
- [ ] 定义事件的核心叙事："一代名医"的第一个标志性节点是什么
- [ ] 为 compassionate 与 pragmatic 两个 variant 设计不同的 on-ramp 风味
- [ ] 保留 tavern-born 风味（从酒肆走来的医者路径）
- [ ] 为后续 pressure / payoff 预留 flag 接口
- [ ] 合同写入 PRD 或附录

### US-004: Wire Medical On-Ramp Spine Event
**Description:** As a developer, I want the medical on-ramp event wired through the existing event system so players crossing the medical bridge encounter a real milestone rather than only expression labels.

**Acceptance Criteria:**
- [ ] 通过现有事件系统配置实现 on-ramp spine 事件
- [ ] 不引入新的事件框架或调度器
- [ ] 触发条件与 P83 bridge + P84 entry 兼容
- [ ] P83/P84 既有 evidence 不退化
- [ ] 两个 variant 各有不同的 on-ramp 后果（stats / flags）
- [ ] 共享终点链仍稳定可触发

### US-005: Add On-Ramp Player-Facing Expression
**Description:** As a player, I want the medical on-ramp to read as a meaningful turning point so the route feels like it has content beyond entry labels.

**Acceptance Criteria:**
- [ ] 至少补 2 个 on-ramp-specific 可读信号（currentGoal 更新、身份摘要等）
- [ ] on-ramp 后玩家能感到"我真的在医道上有了立足之地"
- [ ] compassionate 与 pragmatic 在 on-ramp expression 上有可感知差异
- [ ] 不新增 UI 组件
- [ ] 对应表达测试可新增或更新

### US-006: Add Targeted On-Ramp Proof
**Description:** As a maintainer, I want a bounded proof artifact showing that the medical on-ramp event fires correctly and carries tavern-born medical flavor with variant differentiation.

**Acceptance Criteria:**
- [ ] 产出 1 份 targeted proof（bridge → on-ramp 路径验证，覆盖 2 variants）
- [ ] 展示 on-ramp 事件触发 + 表达变化
- [ ] 展示 compassionate 与 pragmatic 在 on-ramp 层的差异
- [ ] 不要求 full lifetime exhaust
- [ ] proof 能支持是否继续 pressure 阶段

### US-007: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow tests guarding the medical on-ramp spine so future edits do not break the first medical content milestone.

**Acceptance Criteria:**
- [ ] 新增测试文件 `tests/p85TavernHandMedicalOnRampSpineTests.ts`
- [ ] 至少覆盖 on-ramp 触发条件、事件触发、表达更新、comparison 断言
- [ ] 覆盖 2 variant 的差异化断言
- [ ] 复用现有 test harness
- [ ] 不重写全量测试体系
- [ ] 相关命令 Pass（typecheck + 相关回归套件）

### US-008: Produce P85 Closure Report
**Description:** As a maintainer, I want a closure report stating exactly what the medical on-ramp now provides and whether pressure / payoff stages are justified next.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p85-medical-sage-on-ramp-closure-report.md`
- [ ] 汇总 gap audit、contract、event wiring、expression、proof、tests
- [ ] 明确后续 pressure 阶段是否值得开
- [ ] 列出更大 medical-expansion 项的 defer
- [ ] 给出 pressure 之后的路线规划建议

## 5. Functional Requirements

1. FR-1: P85 必须建立在 P84 entry differentiation 已闭合的前提上。
2. FR-2: P85 必须只处理 on-ramp spine 事件 + 对应表达。
3. FR-3: On-ramp 事件必须 runtime-visible，有实际事件触发与状态变化。
4. FR-4: P85 不得扩成 pressure / payoff 阶段。
5. FR-5: P85 closure 必须回答是否值得继续 pressure 阶段。
6. FR-6: 两个 variant（compassionate / pragmatic）在 on-ramp 层必须都有可感知差异。
7. FR-7: 医疗 on-ramp 必须保留 tavern-born 底色，不能变成 generic 神医。

## 6. Success Criteria

- 过桥后第一个标志性事件可稳定触发
- 玩家能感到"医之路有了第一个里程碑"，而非仅有标签
- compassionate 与 pragmatic 在 on-ramp 层可区分（表达 + 后果）
- P83/P84 bridge 与 entry 证据未退化
- 后续 pressure implementation 是否值得继续已有依据

## 7. Dependencies / Context

- P84 closure: `docs/test-reports/p84-medical-entry-closure-report.md`
- Renown on-ramp precedent: `docs/PRD/p73-wuxia-renown-on-ramp-spine.md`
- Medical events: `src/data/lines/medical.json`
- Sample line expressions: `src/p50/sampleLineExpression.ts`
- Ordinary origin expressions: `src/p56/ordinaryOriginExpression.ts`
- Achievement config: `src/narrative/profile/wuxiaOriginSurfaces.ts`
- Medical bridge events: `src/data/lines/ordinary-origin-midlife.json`

## 8. Risks And Rollback

### Risks

- **Copy-paste risk:** 容易生搬 renown on-ramp 而忽略医疗路线语义
- **Variant weakening risk:** 两个 variants 在 on-ramp 层可能差异不够强
- **Too-early depth risk:** 容易把 on-ramp 阶段写成更深的 pressure / payoff 工作
- **Tavern-born dilution risk:** 医疗 on-ramp 可能失去酒肆底色，变成 generic 神医

### Rollback

- 若 shared path 本身太薄，无法承载 on-ramp differentiation，则应停在 P85，不强开更深阶段
- 若 proof 显示 on-ramp 差异仍弱，可先补 P85 polish，而不是直接开 P86+
- 若 2 variants 差异无法在 on-ramp 层成立，可退回单 variant 先推进 spine

## 9. Validation Direction

- on-ramp 事件层：必须有实际触发与状态变化，非纯表达
- variant 层：compassionate vs pragmatic 必须 on-ramp 层可区分
- tavern-born 层：医疗 on-ramp 必须保留酒肆底色
- continuation 层：closure 必须明确是否值得继续 pressure 阶段

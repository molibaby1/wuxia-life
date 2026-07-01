# PRD: P84 Wuxia Medical Sage Entry Differentiation Refinement

> **Derived from:** `docs/test-reports/p83-medical-sage-bridge-playable-closure-report.md`, `docs/PRD/p72-wuxia-selected-next-route-entry-differentiation.md`
> **Stage slug:** `p84-wuxia-medical-sage-entry-differentiation`
> **Stage type:** bounded post-bridge entry differentiation refinement stage for medical_sage_healer

## 1. Introduction

P83 已成功闭合 `medical_sage_healer` 的 playable bridge。现在最稳的下一步不是立刻跳到 full spine，而是复制 renown 路线的 P72 模式：**先让 bridge 进入医疗路线后的第一层体验变得可区分。**

P84 围绕 entry differentiation refinement 展开，目标是回答：当玩家刚跨过 bridge 进入医疗路线时，能否立刻感到「我不是 generic 版本的这个终点，而是带着酒肆出身和医者底色进入了它」——同时，compassionate 与 pragmatic 两个 entry variants 之间也要能被玩家感知为真正不同的行医风格。

## 2. Goals

- 为医疗路线补第一层 post-bridge differentiation
- 让 compassionate / pragmatic 两个 entry variants 在 entry 层有可感知差异
- 为医疗路线接入 sample-line expression 体系（currentGoal / cost label / identity）
- 继续保持 bounded scope，不提前扩到后续 on-ramp / pressure / payoff 波次
- 判断医疗路线是否值得进入完整 spine 实施（P85+）

## 3. Non-Goals

- 不做 on-ramp / pressure / payoff spine 事件
- 不做 success-shape / destiny sentence 收口
- 不做 full stat threshold delivery（声望 ≥55, 资源 ≥30）
- 不新增 full route content wave
- 不新建 route framework
- 不并行规划第二条医疗路线
- 不做 farm_peasant / town_apprentice medical bridge
- 不做 poison path

## 4. User Stories

### US-001: Audit Post-Bridge Entry Sharedness & Variant Gap
**Description:** As a maintainer, I want an audit of what the medical route currently shares at post-bridge entry and how the two variants differ so P84 targets the real flattening points.

**Acceptance Criteria:**
- [ ] 汇总 bridge 后 entry 层目前共享的 gate、markers、expression
- [ ] 分析 compassionate 与 pragmatic 两个 variants 目前的差异强度
- [ ] 区分健康复用与导致玩家感知同构的 flattening
- [ ] 输出 `docs/test-reports/p84-medical-entry-sharedness-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P84 Scope Contract
**Description:** As a planner, I want a scope contract so P84 stays an entry-differentiation refinement stage and does not sprawl into deeper route densification.

**Acceptance Criteria:**
- [ ] 明确 P84 只处理 early post-bridge / entry-adjacent differentiation
- [ ] 明确允许层：轻量配置、表达、proof、窄测试
- [ ] 明确禁止项：on-ramp/pressure/payoff wave、新系统、全量路线扩写
- [ ] 明确与 P85（on-ramp spine）的边界
- [ ] 输出 `docs/test-reports/p84-medical-entry-scope-contract.md`

### US-003: Define Medical Entry Differentiation Contract
**Description:** As a designer, I want an explicit entry contract so the medical route's bridge identity and two variant flavors survive contact with the shared destination path.

**Acceptance Criteria:**
- [ ] 定义医疗路线在 entry 层应保留的核心身份信号（tavern-born healer）
- [ ] 定义 compassionate 与 pragmatic 两个 variants 的 entry 层差异契约
- [ ] 明确哪些差异属于 expression，哪些属于 light markers
- [ ] 不重写 shared destination skeleton
- [ ] 合同写入 PRD 或附录

### US-004: Wire Entry-Level Differentiation
**Description:** As a developer, I want the medical route's post-bridge entry to expose bounded differentiation through existing carriers rather than a new framework.

**Acceptance Criteria:**
- [ ] 只通过现有 carrier / marker / gate-adjacent wiring 实现 entry 差异
- [ ] 不引入新的 route framework
- [ ] P83 bridge evidence 不退化
- [ ] 两个 variants 各有 distinct entry markers
- [ ] 医疗路线能被 sample-line detection 识别

### US-005: Add Player-Facing Entry Expression
**Description:** As a player, I want the medical route to read differently immediately after crossing the bridge so the new path keeps its identity at the first shared layer.

**Acceptance Criteria:**
- [ ] 至少补 3 个 entry-specific readable signals
- [ ] compassionate 与 pragmatic 在 entry expression 上有可感知差异
- [ ] 酒肆出身底色在医疗 entry 中可辨认
- [ ] 不新增 UI 组件
- [ ] 对应表达测试可新增或更新

### US-006: Add Targeted Entry Proof
**Description:** As a maintainer, I want a bounded proof artifact showing that the medical route remains distinguishable at entry and the two variants feel meaningfully different.

**Acceptance Criteria:**
- [ ] 产出 1 份 comparison-style targeted proof
- [ ] 展示：plain tavern / merchant bridge / renown bridge / medical bridge (compassionate) / medical bridge (pragmatic) 的差异
- [ ] 展示 entry markers 或 expression 差异
- [ ] 不要求 full lifetime exhaust
- [ ] proof 能直接支持是否继续 deeper differentiation / full spine

### US-007: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow tests guarding the new entry differentiation so later edits do not flatten the route back into a generic shared entry.

**Acceptance Criteria:**
- [ ] 新增测试文件 `tests/p84TavernHandMedicalEntryDifferentiationTests.ts`
- [ ] 覆盖 entry markers、expression、comparison-level assertion
- [ ] 覆盖 2 variants 的差异化断言
- [ ] 复用现有 harness
- [ ] 不重写全量测试体系
- [ ] 相关命令 Pass（typecheck + 相关回归套件）

### US-008: Produce P84 Closure Report
**Description:** As a maintainer, I want a closure report stating exactly what entry differentiation now exists and whether deeper on-ramp / pressure / payoff spine work is justified.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p84-medical-sage-entry-differentiation-closure-report.md`
- [ ] 汇总 sharedness audit、contract、wiring、expression、proof、tests
- [ ] 明确后续 full spine implementation（P85+）是否值得开
- [ ] 列出更大 route-expansion 项的 defer
- [ ] 给出 on-ramp 之后的路线规划建议

## 5. Functional Requirements

1. FR-1: P84 必须建立在 P83 bridge 已闭合的前提上。
2. FR-2: P84 必须只处理 post-bridge entry 层差异。
3. FR-3: P84 的 2 个 entry variants 必须都有可感知的 entry 层差异。
4. FR-4: P84 不得扩成 on-ramp / pressure / payoff 阶段。
5. FR-5: P84 closure 必须回答是否值得继续复制完整 spine 方法论。
6. FR-6: 医疗 entry 必须保留 tavern-born 底色，不能变成 generic 神医。

## 6. Success Criteria

- bridge 后第一层 shared path 已有明显 entry differentiation
- 玩家可在 entry 层区分 compassionate vs pragmatic 两种行医风格
- 玩家可在 entry 层感知「酒肆出身的医者」身份
- P83 bridge 证据未退化
- 后续 full spine implementation 是否值得继续已有依据

## 7. Dependencies / Context

- P83 closure: `docs/test-reports/p83-medical-sage-bridge-playable-closure-report.md`
- Renown entry precedent: `docs/PRD/p72-wuxia-selected-next-route-entry-differentiation.md`
- Medical events: `src/data/lines/medical.json`
- Ordinary origin expressions: `src/p56/ordinaryOriginExpression.ts`
- Sample line expressions: `src/p50/sampleLineExpression.ts`
- Achievement config: `src/narrative/profile/wuxiaOriginSurfaces.ts`

## 8. Risks And Rollback

### Risks

- **Copy-paste risk:** 容易生搬 renown entry 差异而忽略医疗路线语义
- **Variant weakening risk:** 两个 variants 在 entry 层可能差异不够强，玩家感知同构
- **Too-early depth risk:** 容易把 entry 阶段写成更深的 on-ramp / pressure 工作
- **Tavern-born dilution risk:** 医疗路线 entry 可能失去酒肆底色，变成 generic 神医

### Rollback

- 若 shared path 本身太薄，无法承载 entry differentiation，则应停在 P84，不强开更深阶段
- 若 proof 显示 entry 差异仍弱，可先补 P84 polish，而不是直接开 P85+
- 若 2 variants 差异无法在 entry 层成立，可退回单 variant 先推进 spine

## 9. Validation Direction

- sharedness 层：必须先确认 flattening 点在哪里
- variant 层：compassionate vs pragmatic 必须 entry 层可区分
- entry 层：bridge 后第一层差异必须玩家可见
- tavern-born 层：医疗 entry 必须保留酒肆底色
- continuation 层：closure 必须明确是否值得继续复制更深方法论

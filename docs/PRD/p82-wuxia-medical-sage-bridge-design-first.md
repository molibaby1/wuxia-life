# PRD: P82 Wuxia Medical Sage Bridge Design-First Contract

> **Derived from:** `docs/designs/p25-lifetime-simulation-north-star.md`, `docs/PRD/p33-wuxia-wave1-medical-runtime-short-chain-and-e2e-slice.prd.json`, `agent_docs/p81-wuxia-renown-endgame-playable-gaps.md`
> **Stage slug:** `p82-wuxia-medical-sage-bridge-design-first`
> **Stage type:** bounded design-first contract stage for medical_sage_healer bridge + entry

## 1. Introduction

P81 已完成 `jianghu_renown_sage`（江湖名宿）路线的完整闭合——这是 Wave 1 五条主流成就中第一条拥有完整 sample-line 全生命周期的路线。

对照 North Star §8 验收标准，主流成就需要"可玩样本且规则文档化"。目前 5 条主流成就中仅 1 条（renown）有完整可玩 sample-line。为满足"至少 2 条主流成就可玩"的质量门槛，第二条成就线选择 `medical_sage_healer`（一代名医）。

选择 medical_sage_healer 的理由：
1. **非 martial 单轴**：与 renown 形成"声望线 vs 医术线"的双路线对照，验证非武功路线也能达成主流成就
2. **已有基础**：配置定义完整 + P27/P29 habit-led 医疗事件 + P33 短链验证，基础比其他三条更扎实
3. **方法论复用**：直接复用 renown 路线已验证的 design-first → implementation 方法论

P82 是 `medical_sage_healer` 路线的第一步——design-first contract 阶段。参照 renown 路线 P70 的模式，先把 bridge contract、allowed layers、proof shape、non-goals 明确下来，再进入实施。

## 2. Goals

- 为 `medical_sage_healer` 路线产出 bridge + entry design-first contract
- 明确 medical bridge 的最小 runtime 可达方式（基于现有 medical 事件池）
- 明确允许层、禁止项、proof shape、测试边界
- 为 `P83` playable bridge 实施提供无歧义输入
- 保持与 renown 路线方法论的一致性，降低后续扩展成本

## 3. Non-Goals

- 不直接写 runtime bridge 实现
- 不直接做 on-ramp / pressure / payoff 等后续阶段
- 不扩成 medical 路线全生命周期规划
- 不新增系统或平台层
- 不做 peak / midlife 深度内容
- 不做第二条候选路线的并行设计
- 不修改 renown 路线内容（保持 regression clean）

## 4. User Stories

### US-001: Audit Medical Route Prerequisites
**Description:** As a maintainer, I want a prerequisite audit for the medical_sage_healer route so P82 starts from the real gating surfaces and not from assumptions.

**Acceptance Criteria:**
- [ ] 汇总 medical_sage_healer 的 origin 兼容性、flags、gate、existing expressions、existing tests
- [ ] 明确 bridge 前已经存在什么、缺什么
- [ ] 盘点现有 medical 事件池（medical.json）中的可用事件及 flag 传递链
- [ ] 盘点 P27/P29 habit-led 医疗事件与 sample-line spine 的集成状态
- [ ] 输出 `docs/test-reports/p82-medical-sage-prerequisite-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P82 Scope Contract
**Description:** As a planner, I want a scope contract so P82 stays design-first and does not slip into partial implementation.

**Acceptance Criteria:**
- [ ] 明确 P82 只做 gap audit、方向比较、bridge contract、proof shape
- [ ] 明确允许层：文档、contract、targeted proof planning
- [ ] 明确禁止项：runtime wiring、new framework、bulk content wave
- [ ] 明确与 P83（playable bridge）的边界
- [ ] 输出 `docs/test-reports/p82-medical-sage-scope-contract.md`

### US-003: Compare Candidate Bridge Shapes
**Description:** As a designer, I want bounded bridge-shape options for the medical_sage_healer route so P82 chooses the smallest viable entry path before implementation.

**Acceptance Criteria:**
- [ ] 至少比较 2 个 bridge shape 方向（例如：habit-led study-healer 桥 vs social-momentum healer 桥）
- [ ] 明确推荐方向及放弃方向
- [ ] 推荐必须符合质量优先与小步实施原则
- [ ] 考虑与 renown bridge 方法论的一致性
- [ ] 结论写入 comparison 文档

### US-004: Define Medical Sage Bridge Contract
**Description:** As a designer, I want an explicit bridge contract so P83 knows exactly what flags, gates, and player-facing meanings must be closed.

**Acceptance Criteria:**
- [ ] 定义 bridge checkpoint、所需 flags、对应 gate acceptance
- [ ] 定义至少 2 个 bridge-specific player-facing signals
- [ ] 明确 medical bridge 与 generic path 的差异
- [ ] 明确 entry differentiation 的形状（至少 2 种 entry variant）
- [ ] 明确与 medical_sage_healer 成就解锁条件的衔接
- [ ] 合同写入 PRD 或附录

### US-005: Define P83 Validation Shape
**Description:** As a maintainer, I want the P83 validation shape fixed in advance so playable bridge work is judged against explicit proof and regression expectations.

**Acceptance Criteria:**
- [ ] 明确 targeted proof 需要展示哪些链路节点
- [ ] 明确 regression tests 至少覆盖哪些断言
- [ ] 明确何种证据算 bridge closed
- [ ] 明确不要求 full lifetime exhaust
- [ ] 明确与 P33 medical 短链验证的边界

### US-006: Produce P82 Closure Report
**Description:** As a maintainer, I want a closure report that locks the medical sage route's design-first contract and hands off a bounded implementation target to P83.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p82-medical-sage-bridge-design-closure-report.md`
- [ ] 汇总 prerequisite audit、scope contract、bridge-shape comparison、bridge contract、validation shape
- [ ] 明确与 `P83` 的边界
- [ ] 列出仍 defer 的更大 medical-expansion 项
- [ ] 给出 entry differentiation 之后的路线规划建议（on-ramp / pressure / payoff 等）

## 5. Functional Requirements

1. FR-1: P82 必须围绕 `medical_sage_healer` 主流成就展开。
2. FR-2: P82 必须输出明确的 bridge + entry contract。
3. FR-3: P82 必须提前锁定 P83 的 proof / regression shape。
4. FR-4: P82 不得进入 runtime 实现。
5. FR-5: P82 closure 必须足以让 P83 直接承接。
6. FR-6: P82 必须复用 renown 路线验证过的方法论模式。
7. FR-7: P82 不得修改 renown 路线内容，保持 regression clean。

## 6. Success Criteria

- repo 内存在 1 份 medical_sage_healer 路线的 design-first truth source
- bridge + entry contract 已无歧义
- proof / test 预期已提前固定
- `P83` 无需重新做选线或大范围澄清
- 与 renown 路线方法论保持一致

## 7. Dependencies / Context

- North Star: `docs/designs/p25-lifetime-simulation-north-star.md`
- P81 discovery gaps: `agent_docs/p81-wuxia-renown-endgame-playable-gaps.md`
- P33 medical short-chain: `docs/PRD/p33-wuxia-wave1-medical-runtime-short-chain-and-e2e-slice.prd.json`
- Renown bridge pattern (P70): `docs/PRD/p70-wuxia-selected-next-route-design-first-contract.md`
- Medical events: `src/data/lines/medical.json`
- Achievement config: `src/narrative/profile/wuxiaOriginSurfaces.ts` (WUXIA_COMPOSITE_DESTINY_OUTCOMES)
- Achievement traceability: `src/p25/achievementTraceability.ts`

## 8. Risks And Rollback

### Risks

- **Premature design risk:** 在 medical 路线基础证据不足时过早写死 bridge 形状
- **Scope creep risk:** 容易把 design-first 扩成半实现阶段
- **Overfit risk:** 机械复制 renown bridge 模式而忽略 medical 路线差异
- **Origin ambiguity risk:** medical 路线的 origin 兼容性比 renown 更广，可能导致 bridge 形状不聚焦

### Rollback

- 若 prerequisite audit 证明基础仍不足，P82 应中止并回到补证据阶段
- 若比较后发现无 bounded bridge shape，可显式 no-go，不进入 P83
- P82 是 doc-only 的，回退只需删除产出文档即可

## 9. Validation Direction

- prerequisite 层：现有 medical flag/expression truth 必须先被摸清
- contract 层：bridge checkpoint 与 player-facing signal 必须明确
- handoff 层：P83 的 proof / regression 入口必须提前收紧
- consistency 层：与 renown 路线方法论的一致性必须可验证

# PRD: P69 Wuxia Next Route Candidate Reconciliation

> **Derived from:** `docs/test-reports/p68-merchant-trilogy-live-experience-closure-report.md`, `docs/test-reports/p25-ordinary-wiring-evidence.md`, `docs/test-reports/p25-mixed-identity-slice.md`, `docs/test-reports/p56-ordinary-origin-growth-closure-report.md`, `docs/test-reports/p37-mixed-merchant-patron-lifetime-trace.md`, `docs/test-reports/p32-006-second-path-skip.md`
> **Stage slug:** `p69-wuxia-next-route-candidate-reconciliation`
> **Stage type:** bounded route-selection and candidate-comparison stage

## 1. Introduction

在 merchant trilogy 方法论完成并通过 `P68` 验证后，下一步不应直接拍板新路线实现，而应先做一次 repo-grounded 的候选对账。当前仓库里至少有两类可考虑的复制方向：

- **ordinary → mainstream**：以 `jianghu_renown_sage` 为代表，ordinary wiring 证据更强，但终点不是 mixed
- **ordinary → mixed**：以 `merchant_martial_patron` 为代表，终点类型更贴近 merchant trilogy，但普通出身 bridge 证据明显更弱

P69 的目的不是争论“理论上哪个更酷”，而是根据现有 PRD、closure、proof、tests、wiring evidence，正式回答：**下一条最稳、最适合复制 merchant trilogy 方法论的路线是哪一条。**

## 2. Goals

- 对下一条复制线做正式 repo-grounded 候选比较
- 比较 ordinary → `jianghu_renown_sage` 与 ordinary → `merchant_martial_patron` 的证据强度与实施风险
- 明确是否存在 no-go 结论，而不是强行选一条
- 为 `P70` 提供唯一被选中的路线结论

## 3. Non-Goals

- 不直接实现任何新 bridge
- 不新增 mixed / mainstream outcome
- 不重写 merchant trilogy 方法论
- 不扩成 full route roadmap / 平台化路线规划
- 不对 sample-line 轨做新规划

## 4. User Stories

### US-001: Audit Candidate Route Inventory
**Description:** As a maintainer, I want an inventory of plausible next-route candidates so P69 compares real repo options instead of imaginary future routes.

**Acceptance Criteria:**
- [ ] 汇总当前 repo 内可作为“下一条复制线”的候选
- [ ] 至少覆盖 `jianghu_renown_sage` 与 `merchant_martial_patron`
- [ ] 明确每条候选的 outcome 类型、已有关联 origin、已有关联证据
- [ ] 输出 `docs/test-reports/p69-next-route-candidate-inventory.md`

### US-002: Lock P69 Selection Scope Contract
**Description:** As a planner, I want a scope contract so P69 stays a route-selection stage and does not turn into pre-implementation design work.

**Acceptance Criteria:**
- [ ] 明确 P69 只做比较、排序、选线或 no-go
- [ ] 明确允许层：文档 comparison、evidence synthesis、风险排序
- [ ] 明确禁止项：新 bridge contract、新实现、新验证平台
- [ ] 输出 `docs/test-reports/p69-next-route-selection-scope-contract.md`

### US-003: Compare Repo Evidence Strength
**Description:** As a designer, I want a direct comparison of each candidate's current repo evidence so the next route choice is grounded in what already exists.

**Acceptance Criteria:**
- [ ] 对比 wiring evidence、proof、tests、closure、lifetime trace 强度
- [ ] 明确哪条候选已具备 playable-bridge 前置条件，哪条没有
- [ ] 区分“已有实现基础”与“只有概念潜力”
- [ ] 结论写入 comparison 文档

### US-004: Compare Methodology Fit
**Description:** As a planner, I want to know which candidate best fits the merchant trilogy optimization sequence without forcing major redesign.

**Acceptance Criteria:**
- [ ] 对比两条候选与 merchant trilogy 五阶段方法的匹配度
- [ ] 明确哪条更适合复制 bridge → entry → cost/shape 的顺序
- [ ] 明确哪条若硬复制会产生明显 scope drift
- [ ] 结论写入 comparison 文档

### US-005: Compare Bounded Implementation Risk
**Description:** As a maintainer, I want a bounded implementation-risk comparison so the next route choice reflects quality-first priorities rather than value density alone.

**Acceptance Criteria:**
- [ ] 对比两条候选的桥接成本、表达成本、验证成本
- [ ] 明确哪条更符合“小步、单次迭代可完成”的标准
- [ ] 明确潜在 no-go 条件
- [ ] 结论写入 comparison 文档

### US-006: Select One Route Or Declare No-Go
**Description:** As a planner, I want P69 to end with a single selected route or a clear no-go, so the next PRD does not start from ambiguity.

**Acceptance Criteria:**
- [ ] 输出唯一推荐路线，或明确 no-go
- [ ] 选择理由必须绑定 repo-grounded 证据
- [ ] 若未选 `merchant_martial_patron`，需明确原因
- [ ] 若未选 `jianghu_renown_sage`，需明确原因

### US-007: Add Narrow Reinforcement If Evidence Is Missing
**Description:** As a maintainer, I want only the smallest additional evidence work needed if the route comparison cannot be decided from current repo truth.

**Acceptance Criteria:**
- [ ] 若现有证据足够，则明确记录无需新增验证
- [ ] 若不足，则只补最小 candidate-comparison 证据
- [ ] 不进入 bridge contract 或 runtime 实施
- [ ] 相关命令 Pass

### US-008: Produce P69 Closure Report
**Description:** As a maintainer, I want a closure report stating which route is selected next and why it is the most stable quality-first continuation.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p69-next-route-candidate-closure-report.md`
- [ ] 汇总 inventory、scope contract、evidence comparison、methodology fit、risk comparison、最终选线
- [ ] 明确与 `P70` 的边界
- [ ] 列出未被选中路线的 defer 原因

## 5. Functional Requirements

1. FR-1: P69 必须至少比较 `jianghu_renown_sage` 与 `merchant_martial_patron`。
2. FR-2: P69 的结论必须绑定现有 repo 证据，而不是想象中的未来可扩展性。
3. FR-3: P69 必须输出唯一推荐或 no-go，不得保留并列优先级。
4. FR-4: P69 不得提前进入实现设计。
5. FR-5: P69 closure 必须直接决定 `P70` 的输入对象。

## 6. Success Criteria

- repo 内存在 1 份下一条路线候选对账 truth source
- 已明确哪条路线最适合质量优先的复制
- 若存在 no-go，也已明确 no-go 的根因
- `P70` 可以在无歧义前提下继续

## 7. Dependencies / Context

- P68 closure: `docs/test-reports/p68-merchant-trilogy-live-experience-closure-report.md`
- Ordinary wiring evidence: `docs/test-reports/p25-ordinary-wiring-evidence.md`
- Mixed identity evidence: `docs/test-reports/p25-mixed-identity-slice.md`
- Ordinary growth closure: `docs/test-reports/p56-ordinary-origin-growth-closure-report.md`
- Merchant patron lifetime trace: `docs/test-reports/p37-mixed-merchant-patron-lifetime-trace.md`
- Renown short-chain precedent: `docs/test-reports/p32-006-second-path-skip.md`

## 8. Risks And Rollback

### Risks

- **Type-bias risk:** 容易因为“mixed 更像 merchant”而忽略基础证据不足
- **Familiarity bias:** 容易因为 renown wiring 更熟悉而低估 mixed 的长期价值
- **False decisiveness risk:** 容易在证据不足时强行选线

### Rollback

- 若 P69 无法给出可靠单选，则应显式 no-go，并把后续改成补证据阶段
- 若 P69 证明某候选基础过弱，后续阶段不得绕过该结论直接实现

## 9. Validation Direction

- evidence 层：比较必须落到 closure、proof、tests、wiring、trace
- fit 层：必须比较方法论复制难度，而不是只比较终点吸引力
- output 层：必须产出唯一选择或 no-go

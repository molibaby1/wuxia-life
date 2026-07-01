# PRD: P72 Wuxia Selected Next Route Entry Differentiation

> **Derived from:** `docs/test-reports/p71-selected-next-route-bridge-closure-report.md`, `docs/test-reports/p63-merchant-entry-differentiation-closure-report.md`
> **Stage slug:** `p72-wuxia-selected-next-route-entry-differentiation`
> **Stage type:** bounded post-bridge entry differentiation stage for the selected next route

## 1. Introduction

如果 `P71` 成功闭合了下一条路线的 playable bridge，那么后续最稳的继续方式，不是立刻跳到 full shape/recap，而是复制 merchant trilogy 的第二阶段：**先让 bridge 进入目标路线后的第一层体验变得可区分。**

P72 围绕 entry differentiation 展开，目标是回答：当玩家刚跨过 bridge 进入这条新路线时，能否立刻感到“我不是 generic 版本的这个终点，而是带着自己的出身与路径进入了它”。

## 2. Goals

- 为所选路线补第一层 post-bridge differentiation
- 让 bridge 后的 entry 表达立即体现 origin/path 差异
- 继续保持 bounded scope，不提前扩到后续 cost / shape 波次
- 判断这条新路线是否值得进入 merchant trilogy 式的更深优化

## 3. Non-Goals

- 不直接做 pressure/payoff differentiation
- 不直接做 success-cost 或 destiny-sentence 收口
- 不新增 full route content wave
- 不新建 route framework
- 不并行规划第二条新路线

## 4. User Stories

### US-001: Audit Post-Bridge Entry Sharedness
**Description:** As a maintainer, I want an audit of what the selected route currently shares at post-bridge entry so P72 targets the real flattening point.

**Acceptance Criteria:**
- [ ] 汇总 bridge 后 entry 层目前共享的 gate、markers、expression
- [ ] 区分健康复用与导致玩家感知同构的 flattening
- [ ] 输出 `docs/test-reports/p72-selected-route-entry-sharedness-audit.md`
- [ ] 本故事不改运行行为

### US-002: Lock P72 Scope Contract
**Description:** As a planner, I want a scope contract so P72 stays an entry differentiation stage and does not sprawl into deeper route densification.

**Acceptance Criteria:**
- [ ] 明确 P72 只处理 early post-bridge / entry-adjacent differentiation
- [ ] 明确允许层：轻量配置、表达、proof、窄测试
- [ ] 明确禁止项：pressure/payoff wave、新系统、全量路线扩写
- [ ] 输出 `docs/test-reports/p72-selected-route-entry-scope-contract.md`

### US-003: Define Entry Differentiation Contract
**Description:** As a designer, I want an explicit entry contract so the selected route's bridge identity survives contact with the shared destination path.

**Acceptance Criteria:**
- [ ] 定义所选路线在 entry 层应保留的核心身份信号
- [ ] 明确哪些差异属于 expression，哪些属于 light markers
- [ ] 不重写 shared destination skeleton
- [ ] 合同写入 PRD 或附录

### US-004: Wire Entry-Level Differentiation
**Description:** As a developer, I want the selected route's post-bridge entry to expose bounded differentiation through existing carriers rather than a new framework.

**Acceptance Criteria:**
- [ ] 只通过现有 carrier / marker / gate-adjacent wiring 实现 entry 差异
- [ ] 不引入新的 route framework
- [ ] `P71` bridge evidence 不退化
- [ ] 共享终点链仍稳定可触发

### US-005: Add Player-Facing Entry Expression
**Description:** As a player, I want the selected route to read differently immediately after crossing the bridge so the new path keeps its identity at the first shared layer.

**Acceptance Criteria:**
- [ ] 至少补 3 个 entry-specific readable signals
- [ ] 玩家能区分 bridge 后的 entry 身份与 generic path
- [ ] 不新增 UI 组件
- [ ] 对应表达测试可新增或更新

### US-006: Add Targeted Entry Proof
**Description:** As a maintainer, I want a bounded proof artifact showing that the selected route remains distinguishable at entry after crossing into the shared destination path.

**Acceptance Criteria:**
- [ ] 产出 1 份 comparison-style targeted proof
- [ ] 展示 entry markers 或 expression 差异
- [ ] 不要求 full lifetime exhaust
- [ ] proof 能直接支持是否继续 deeper differentiation

### US-007: Add Narrow Regression Coverage
**Description:** As a maintainer, I want narrow tests guarding the new entry differentiation so later edits do not flatten the route back into a generic shared entry.

**Acceptance Criteria:**
- [ ] 至少覆盖 entry markers、expression、comparison-level assertion
- [ ] 复用现有 harness
- [ ] 不重写全量测试体系
- [ ] 相关命令 Pass

### US-008: Produce P72 Closure Report
**Description:** As a maintainer, I want a closure report stating exactly what entry differentiation now exists and whether deeper success-cost / success-shape work is justified later.

**Acceptance Criteria:**
- [ ] 输出 `docs/test-reports/p72-selected-next-route-entry-closure-report.md`
- [ ] 汇总 sharedness audit、contract、wiring、expression、proof、tests
- [ ] 明确后续 deeper differentiation 是否值得开
- [ ] 列出更大 route-expansion 项的 defer

## 5. Functional Requirements

1. FR-1: P72 必须建立在 P71 bridge 已闭合的前提上。
2. FR-2: P72 必须只处理 post-bridge entry 层差异。
3. FR-3: P72 的差异必须 runtime-visible，而不只是文档结论。
4. FR-4: P72 不得扩成 deeper cost/shape 阶段。
5. FR-5: P72 closure 必须回答是否值得继续复制 merchant trilogy 的后半段方法。

## 6. Success Criteria

- bridge 后第一层 shared path 已有明显 entry differentiation
- 玩家可在 entry 层感知“我带着自己的路径进入了这个终点”
- `P71` bridge 证据未退化
- 后续 deeper differentiation 是否值得继续已有依据

## 7. Dependencies / Context

- P71 closure: `docs/test-reports/p71-selected-next-route-bridge-closure-report.md`
- Merchant entry precedent: `docs/test-reports/p63-merchant-entry-differentiation-closure-report.md`

## 8. Risks And Rollback

### Risks

- **Copy-paste risk:** 容易生搬 merchant entry 差异而忽略新路线语义
- **Too-early depth risk:** 容易把 entry 阶段写成更深的 cost/shape 工作
- **Weak signal risk:** 容易只换措辞，玩家仍感知不强

### Rollback

- 若 shared path 本身太薄，无法承载 entry differentiation，则应停在 P72，不强开更深阶段
- 若 proof 显示 entry 差异仍弱，可先补 P72 polish，而不是直接开 P73+

## 9. Validation Direction

- sharedness 层：必须先确认 flattening 点在哪里
- entry 层：bridge 后第一层差异必须玩家可见
- continuation 层：closure 必须明确是否值得继续复制更深方法论

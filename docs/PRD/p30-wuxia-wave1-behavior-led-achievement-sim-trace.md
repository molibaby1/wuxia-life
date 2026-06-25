# PRD: P30 Wuxia Wave 1 Behavior-Led Achievement Sim Trace

> **Derived from:** `docs/PRD/p29-wuxia-medical-habit-pool-expansion-and-social-consequence-wiring.md` (Discovery pass 2026-06-24)
> **Stage slug:** `p30-wuxia-wave1-behavior-led-achievement-sim-trace`
> **Gaps addressed:** GAP-P29-001, GAP-END-08-01 (partial), GAP-END-W1-ACH

## 1. Introduction

P27–P29 已落地 habit / semi-personality 内容 on-ramps（business、medical、socialMomentum、familyBond）与 P25 habit trajectory slice。Wave 1 新增主流成就 `jianghu_renown_sage` / `medical_sage_healer` 在 `wuxiaOriginSurfaces.ts` 有 composite 配置，但 **sim trace 仍无法从 habit-led 事件观测到成就解锁路径**——`achievementTraceability.ts` 未引用 P27–P29 事件，validation slice fixtures 直接 seed achievement flags 而非经过 habit 链。

P30 在 **不新建 habit 轴、不扩第四轮 medical 池、不交付 Wave 2–4 成就** 的前提下，闭合 Wave 1 行为-led → composite destiny 的 sim 观测链：audit、traceability 扩展、habit-led life path fixtures、sim baseline delta、regression、closure。

## 2. Goals

- 盘点 P27–P29 habit/semi-personality 事件 vs Wave 1 成就 flag 要求的 traceability 缺口并产出 audit delta
- 扩展 `achievementTraceability.ts` 纳入 P27–P29 关键 event IDs（至少覆盖 `jianghu_renown_sage` 与 `medical_sage_healer` 各 1 条 on-ramp）
- 新增或扩展 P25 validation slice **habit-led life path fixtures**，证明行为输入可观测到达 composite destiny 评估点
- 运行 sim baseline delta，记录 habit-led path 对 Wave 1 新增成就 unlock observability 的 before/after
- 扩展 isolated regression 覆盖 P30 traceability 与 habit-led fixture 断言
- 产出 P30 closure 报告，列出 Wave 1 sim trace 余量与 North Star §8 仍 OPEN 项

## 3. Non-Goals

- 不新增 medical / business / semi-personality 内容样本（P27–P29 已闭合）
- 不全量迁移 medical 池 stat/talent gate
- 不交付 Wave 2–4 成就配置或平凡出身扩展
- 不重写 `dailyEvents.ts` / scheduler runtime 权重
- 不一次性移除 legacy `*_habit` 读者
- 不修改已 `passes: true` 的 P29 story 或 parent PRD

## 4. User Stories

### US-001: P30 Habit-To-Achievement Traceability Audit Delta

**Description:** As a maintainer, I want an audit of P27–P29 habit events vs Wave 1 achievement flag requirements so P30 sim wiring targets the highest-value gaps.

**Acceptance Criteria:**

- [ ] Inventory P27–P29 habit/semi-personality events and their output flags
- [ ] Map each to `jianghu_renown_sage` / `medical_sage_healer` composite requirements; classify bridge gaps
- [ ] Save under `docs/test-reports/` or `docs/designs/`
- [ ] Do not modify gameplay behavior in this story

### US-002: Extend Achievement Traceability For P27–P29 Events

**Description:** As a maintainer, I want achievementTraceability to link Wave 1 new achievements to habit-led on-ramp events.

**Acceptance Criteria:**

- [ ] Extend `src/p25/achievementTraceability.ts` with P27–P29 event IDs for `jianghu_renown_sage` and `medical_sage_healer`
- [ ] Each achievement links at least 1 habit/semi-personality on-ramp event plus existing choice flags
- [ ] Typecheck passes
- [ ] Relevant P25 tests pass

### US-003: Add Habit-Led Life Path Validation Fixtures

**Description:** As a maintainer, I want P25 validation slice fixtures that enter through habit-led events rather than direct flag seeding.

**Acceptance Criteria:**

- [ ] Add at least 2 habit-led life path fixtures in `src/p25/validationSlices.ts` (1 renown/social, 1 medical/study)
- [ ] Fixtures seed `lifeStates.*` thresholds and P27–P29 bridge flags, not direct achievement flags
- [ ] Composite destiny evaluation remains inspectable in test/sim output
- [ ] Relevant P25 tests pass

### US-004: Run Sim Baseline Delta For Habit-Led Paths

**Description:** As a maintainer, I want before/after sim metrics proving habit-led paths improve Wave 1 achievement observability.

**Acceptance Criteria:**

- [ ] Run sim baseline with habit-led fixture inputs; save JSON under `docs/test-reports/`
- [ ] Document delta vs P29 closure baseline for `jianghu_renown_sage` and `medical_sage_healer` unlock observability
- [ ] Do not modify gameplay behavior beyond reporting if needed

### US-005: Extend P30 Sim Trace Regression Tests

**Description:** As a maintainer, I want isolated regression coverage for P30 traceability and habit-led fixtures.

**Acceptance Criteria:**

- [ ] Extend `tests/p25LifetimeSimulationTests.ts` or sibling isolated file for P30 trace links and fixtures
- [ ] Assert traceability entries reference P27–P29 event IDs
- [ ] Test file runs independently and exits cleanly

### US-006: Optional Minimal Flag Bridge Wiring

**Description:** As a player, I want habit-led choices to optionally advance toward achievement prerequisites when sim trace reveals a dead-end.

**Acceptance Criteria:**

- [ ] If audit identifies a dead-end bridge, add minimal flag bridge on existing P27–P29 events (max 2 bridges)
- [ ] Bridges must not bypass composite multi-factor requirements
- [ ] Targeted test proves bridge fires only at habit threshold
- [ ] Skip if audit shows sim trace closable without content changes

### US-007: Write P30 Closure And Remaining Queue

**Description:** As a maintainer, I want a closure note listing what P30 proved and what remains for full Wave 1 and North Star §8.

**Acceptance Criteria:**

- [ ] Summarize traceability extensions, fixtures, sim delta, and verification commands
- [ ] List remaining Wave 1 sim trace gaps and deferred medical pool / Wave 2–4 items
- [ ] Cross-reference North Star §8 items still OPEN after P30
- [ ] Save under `docs/test-reports/`

## 5. Success Metrics

- `achievementTraceability.ts` 覆盖 P27–P29 on-ramp 事件且 P25 测试可断言
- ≥2 habit-led validation fixtures 可观测 composite destiny 评估
- Sim baseline delta 文档化 Wave 1 新增成就 observability 变化
- `typecheck` 与 P25 定向测试保持通过

## 6. Dependencies / Context

- Parent: P29 closure `docs/test-reports/p29-closure-report.md`
- Habit migration rules: `docs/designs/p26-habit-trajectory-migration-rules.md`
- Product End-State: `docs/designs/p25-lifetime-simulation-north-star.md` §3.1, §8
- Traceability baseline: `src/p25/achievementTraceability.ts`, `src/p25/validationSlices.ts`

## 7. Open Questions

- Habit-led fixture 是否需完整 sim run 还是 validation slice 静态评估即可？（优先最小 inspectable path）
- Flag bridge（US-006）是否必要取决于 audit；默认 skip-first

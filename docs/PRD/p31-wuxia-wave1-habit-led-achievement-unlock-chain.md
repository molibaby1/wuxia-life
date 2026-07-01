# PRD: P31 Wuxia Wave 1 Habit-Led Achievement Unlock Chain

> **Derived from:** `docs/PRD/p30-wuxia-wave1-behavior-led-achievement-sim-trace.md` (Discovery pass 2026-06-24)
> **Stage slug:** `p31-wuxia-wave1-habit-led-achievement-unlock-chain`
> **Gaps addressed:** GAP-P30-001, GAP-P30-002, GAP-P30-003 (partial), GAP-END-08-01 (partial)

## 1. Introduction

P30 闭合了 Wave 1 habit-led → composite destiny **sim observability**：`habitLedOnRampEvents`、habit-led fixtures、baseline delta 证明 P27–P29 on-ramp 可观测且 stats 维度可达标。但 sim baseline 显示 habit-led path **0% unlock**——bridge flags 停在 achievement `key_choices` 上游（`mentor_bond`/`ally_network`/`medical_divine_doctor_fame`/`medical_imperial` 未满足）。

P31 在 **不新建 habit 轴、不扩 medical 池、不交付 Wave 2–4 成就** 的前提下，闭合 Wave 1 行为-led → composite destiny **unlock 链**：key-choice bridge audit、最小 threshold-gated 桥接、habit-led full-unlock fixtures、sim baseline delta、regression、closure。

## 2. Goals

- 盘点 P30 habit bridge flags vs Wave 1 achievement `key_choices` 缺口并产出 bridge audit delta
- 在现有 P27–P29 事件上添加 **最小** key-choice 桥接（max 4 bridges），仅在 habit 阈值满足时推进，不 bypass composite multi-factor gates
- 扩展 P25 validation slice **habit-led full-unlock fixtures**，证明行为输入可到达 Wave 1 新增成就 unlock（非仅 partial progress）
- 运行 sim baseline delta，记录 habit-led unlock rate 从 P30 0% 的提升
- 扩展 isolated regression 覆盖 P31 unlock chain 与 bridge 阈值断言
- 产出 P31 closure 报告，列出 Wave 1 unlock 余量与 North Star §8 仍 OPEN 项

## 3. Non-Goals

- 不新增 medical / business / semi-personality 内容样本
- 不全量迁移 medical 池 stat/talent gate（3/18 保持）
- 不交付 Wave 2–4 成就配置或平凡出身扩展
- 不重写 `dailyEvents.ts` / scheduler runtime 权重
- 不一次性移除 legacy `*_habit` 读者
- 不修改已 `passes: true` 的 P30 story 或 parent PRD
- 不要求完整 lifetime sim 从 birth→death（P31 优先 validation slice + 可选短链 sim slice）

## 4. User Stories

### US-001: P31 Key-Choice Bridge Audit Delta

**Description:** As a maintainer, I want an audit of P30 bridge flags vs Wave 1 achievement key_choices so P31 wiring targets the minimal unlock gaps.

**Acceptance Criteria:**

- [ ] Inventory P30 bridge flags and achievement `key_choices` requirements per `jianghu_renown_sage` / `medical_sage_healer`
- [ ] Classify bridge targets (renown/social vs medical/study) with threshold and event pointers
- [ ] Save under `docs/test-reports/` or `docs/designs/`
- [ ] Do not modify gameplay behavior in this story

### US-002: Add Minimal Habit-To-Key-Choice Bridges

**Description:** As a player, I want habit-led choices to advance toward achievement key prerequisites when thresholds are met, without bypassing composite gates.

**Acceptance Criteria:**

- [ ] Add minimal bridges on existing P27–P29 events (max 4 total across both achievements)
- [ ] Each bridge sets at most 1 achievement `key_choice` flag and only when corresponding habit threshold + bridge flag preconditions hold
- [ ] Bridges must not bypass stat gates or ethic mutex (`medical_poison_path` etc.)
- [ ] Targeted test proves bridge fires only at habit threshold
- [ ] Typecheck passes

### US-003: Extend Habit-Led Full-Unlock Validation Fixtures

**Description:** As a maintainer, I want P25 validation fixtures that prove habit-led paths can unlock Wave 1 achievements when key_choices are satisfied through bridges.

**Acceptance Criteria:**

- [ ] Extend or add habit-led fixtures in `src/p25/validationSlices.ts` proving full unlock for `jianghu_renown_sage` and `medical_sage_healer`
- [ ] Fixtures may seed `lifeStates.*` + bridge flags; achievement flags only via bridge chain (not direct seed)
- [ ] Composite destiny evaluation shows `unlocked: true` in test/sim output
- [ ] Relevant P25 tests pass

### US-004: Run Sim Baseline Delta For Habit-Led Unlock

**Description:** As a maintainer, I want before/after sim metrics proving habit-led paths improve Wave 1 achievement unlock rate vs P30 baseline.

**Acceptance Criteria:**

- [ ] Run sim baseline with P31 habit-led fixture inputs; save JSON under `docs/test-reports/`
- [ ] Document delta vs P30 closure baseline: habit-led unlock > 0% for both Wave 1 new achievements
- [ ] Do not modify gameplay behavior beyond bridges and reporting if needed

### US-005: Extend P31 Unlock Chain Regression Tests

**Description:** As a maintainer, I want isolated regression coverage for P31 key-choice bridges and full-unlock fixtures.

**Acceptance Criteria:**

- [ ] Extend `tests/p25LifetimeSimulationTests.ts` or sibling isolated file for P31 unlock chain
- [ ] Assert bridge threshold gating and full-unlock on habit-led fixtures
- [ ] Test file runs independently and exits cleanly

### US-006: Optional Short-Chain Lifetime Sim Slice

**Description:** As a maintainer, I want an optional short-chain sim slice from habit on-ramp toward achievement eval to reduce reliance on static fixtures alone.

**Acceptance Criteria:**

- [ ] If feasible without full scheduler rewrite, add one short-chain sim slice (habit on-ramp → bridge → composite eval) under P25 test harness
- [ ] Slice documents seed, event sequence, and unlock outcome
- [ ] Skip if validation slice + bridge tests already prove unlock chain with lower risk

### US-007: Write P31 Closure And Remaining Queue

**Description:** As a maintainer, I want a closure note listing what P31 proved and what remains for full Wave 1 and North Star §8.

**Acceptance Criteria:**

- [ ] Summarize bridge wiring, fixtures, sim delta, and verification commands
- [ ] List remaining Wave 1 unlock gaps and deferred medical pool / Wave 2–4 items
- [ ] Cross-reference North Star §8 items still OPEN after P31
- [ ] Save under `docs/test-reports/`

## 5. Success Metrics

- Habit-led sim baseline shows **>0% unlock** for `jianghu_renown_sage` and `medical_sage_healer` vs P30 0%
- ≥2 habit-led full-unlock fixtures with inspectable composite destiny output
- Max 4 threshold-gated key-choice bridges; no composite gate bypass
- `typecheck` 与 P25 定向测试保持通过

## 6. Dependencies / Context

- Parent: P30 closure `docs/test-reports/p30-closure-report.md`
- Bridge audit baseline: `docs/test-reports/p30-habit-to-achievement-traceability-audit-delta.md`
- Sim baseline: `docs/test-reports/p30-habit-led-sim-baseline-delta.md`
- Product End-State: `docs/designs/p25-lifetime-simulation-north-star.md` §3.1, §8
- Traceability: `src/p25/achievementTraceability.ts`, `src/p25/validationSlices.ts`

## 7. Open Questions

- Bridge 应挂在哪些 P27–P29 事件（audit 决定；优先已有 bridge flag 簇）
- US-006 short-chain sim 是否必要取决于 US-003 unlock 是否已可静态验证；默认 skip-first

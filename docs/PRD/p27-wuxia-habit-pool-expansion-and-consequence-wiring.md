# PRD: P27 Wuxia Habit Pool Expansion And Consequence Wiring

> **Derived from:** `docs/PRD/p26-wuxia-personality-habit-trajectory-optimization.md` (Discovery pass 2026-06-24)
> **Stage slug:** `p27-wuxia-habit-pool-expansion-and-consequence-wiring`
> **Gaps addressed:** GAP-P26-001, GAP-P26-002, GAP-P26-003, GAP-P26-004, GAP-P26-005

## 1. Introduction

P26 证明了 `lifeStates` 长期习惯轴可作为内容分流器：7 条直读样本、2 条中期 callback、1 条 P17 商路后果，以及 P20/P25 验证切片均已落地。但大量 **replay 种子、echo hook、validation fixture** 仍依赖 legacy `*_habit` flags；P17 中后期责任池仅覆盖商路一条；medical / non-combat 线尚未评估 habit 准入。

P27 在 **不引入新 personality 容器、不扩半人格轴** 的前提下，完成第二轮 execution-sized 迁移：补齐 P17 师徒/名望后果、P20 replay mirror、P21 echo wiring，并落地一条 medical 池 habit 样本。

## 2. Goals

- 将 P20 replay archetype 的 habit 相关 `growthPatternFlags` / `seedFlags` 与 `lifeStates` 阈值对齐或双轨可读，减少 legacy-only 种子
- 将 `p21_study_echo_callback` 接入 `lifeStates.studyHabit`，保留与 `p9_echo_study_hook` 的合理 OR/兼容路径
- 新增至少 **2 条** P17 中后期 habit 后果样本（师徒义务、名望维护），与 P26 商路样本形成多轴覆盖
- 评估 medical 内容池并落地 **1 条** habit-driven 准入或 reinforcement 样本（服务 Wave 1 `medical_sage_healer` 非 martial 路径）
- 更新 habit regression 与 P20 相关 slice，证明新一轮迁移不破坏 replay 门禁
- 产出 P27 closure 报告，列出仍 defer 的半人格轴与 P25 Wave 1 成就 gaps

## 3. Non-Goals

- 不新建 `personalityTrajectory` 或独立 UI 面板
- 不一次性迁移全部 legacy `*_habit` 读者（P24 calibration fixtures 可保留投影断言）
- 不在本期扩展 `socialMomentum` / `familyBond` 为 habit-driven 内容分流器（defer P28+）
- 不交付 P25 Wave 2–4 巅峰/混合/平凡出身成就（属 P25 Discovery 链）
- 不重写 scheduler、event engine 或 save contract

## 4. User Stories

### US-001: P27 Pool Expansion Scope And Audit Delta

**Description:** As a maintainer, I want an updated audit delta from P26 closure so P27 migrations target the highest-value remaining pools.

**Acceptance Criteria:**

- [ ] Re-inventory legacy `*_habit` readers in replay surfaces, echo hooks, validation fixtures
- [ ] Classify each hit and map to P27 story execution order
- [ ] Save under `docs/test-reports/` or `docs/designs/`
- [ ] Do not modify gameplay behavior in this story

### US-002: Mirror Martial And Scholar Archetype Habit Seeds To lifeStates

**Description:** As a maintainer, I want P20 martial/scholar archetype surfaces to recognize `lifeStates` habit thresholds so replay seeds match content migration.

**Acceptance Criteria:**

- [ ] Update `wuxiaReplayabilitySurfaces.ts` martial and scholar archetype habit-related seeds to align with `trainingHabit` / `studyHabit` thresholds or documented dual-read
- [ ] Preserve backward compatibility for existing P20 gate fixtures where required
- [ ] Targeted test or fixture proves archetype resolution works with `lifeStates`-led profile

### US-003: Mirror Wealth Archetype And P20 Validation Habit Fixtures

**Description:** As a maintainer, I want wealth archetype and P20 validation slice habit seeds updated so calibration uses the same habit semantics as content.

**Acceptance Criteria:**

- [ ] Update wealth merchant archetype habit seeds in `wuxiaReplayabilitySurfaces.ts`
- [ ] Update `p20/validationSlices.ts` habit seed fixtures to use `lifeStates` or documented projection path
- [ ] P20 replayability tests relevant to updated fixtures pass

### US-004: Wire P21 Study Echo Callback To studyHabit

**Description:** As a player, I want the P21 scholarly echo callback to fire from long-term study habit even when the P9 hook flag was never set.

**Acceptance Criteria:**

- [ ] Update `p21_study_echo_callback` conditions to include `lifeStates.studyHabit >= threshold`
- [ ] Preserve intentional access via `p9_echo_study_hook` where still appropriate (OR semantics)
- [ ] Regression test proves callback triggers from `studyHabit` without legacy `study_habit` flag

### US-005: Add P17 Mentor Obligation Consequence Sample

**Description:** As a player, I want a mid/late-life consequence that acknowledges training or study habit through mentor/disciple obligations.

**Acceptance Criteria:**

- [ ] Add one P17-style consequence event keyed by `trainingHabit` or `studyHabit`
- [ ] Outcome changes obligation, burden, or opportunity—not flavor only
- [ ] Distinct from `p26_business_habit_obligation` and route-only logic
- [ ] Targeted test proves habit-sensitive trigger

### US-006: Add P17 Renown Maintenance Consequence Sample

**Description:** As a player, I want a consequence sample where long-term scholarly or social shaping creates renown upkeep pressure.

**Acceptance Criteria:**

- [ ] Add one P17-style consequence keyed by `studyHabit` (or documented hybrid with reputation gates)
- [ ] Changes pressure, opportunity, or social obligation materially
- [ ] Targeted test proves trigger path

### US-007: Add One Medical Pool Habit-Driven Sample

**Description:** As a player, I want at least one medical/non-combat content node to recognize study or business habit so healer paths can emerge from behavior.

**Acceptance Criteria:**

- [ ] Add or migrate one sample in medical content pool to read `lifeStates.studyHabit` or appropriate axis
- [ ] Sample remains age-appropriate and does not require high martial stats
- [ ] Document evaluation notes for remaining medical pool in audit delta or closure
- [ ] Targeted test proves habit-led access

### US-008: Extend Habit Regression Tests For P27 Samples

**Description:** As a maintainer, I want isolated habit regression coverage for P27 echo, consequence, and medical samples.

**Acceptance Criteria:**

- [ ] Extend `tests/personalityHabitTrajectoryTests.ts` (or sibling isolated file) for P27 wiring
- [ ] Cover echo callback, new P17 samples, and medical sample trigger paths
- [ ] Test file runs independently and exits cleanly

### US-009: Update P20 Habit Trajectory Slice For Pool Expansion

**Description:** As a maintainer, I want P20 habit trajectory reporting to reflect P27 replay mirror changes.

**Acceptance Criteria:**

- [ ] Update `src/p20/habitTrajectorySlice.ts` or related reporting to account for new mirror semantics
- [ ] Output remains machine-readable in existing P20 reporting flow
- [ ] Relevant P20 tests pass

### US-010: Write P27 Closure And Remaining Queue

**Description:** As a maintainer, I want a closure note listing what P27 proved and what remains for P25/P28.

**Acceptance Criteria:**

- [ ] Summarize migrated surfaces, new samples, verification commands
- [ ] List remaining legacy-only surfaces and deferred semi-personality axes
- [ ] Cross-reference P25 Wave 1 achievement gaps not in P27 scope
- [ ] Save under `docs/test-reports/`

## 5. Success Metrics

- ≥2 新 P17 habit 后果样本（师徒 + 名望），加上 P26 商路样本共 ≥3 轴中后期 echo
- P20 replay surfaces 三轴 archetype habit 种子与 `lifeStates` 对齐或双轨文档化
- `p21_study_echo_callback` 可仅凭 `studyHabit` 触发（测试证明）
- ≥1 medical 池 habit 样本落地
- `typecheck` 与 habit / P20 / P21 定向测试保持通过

## 6. Dependencies / Context

- Parent: P26 closure `docs/test-reports/p26-closure-report.md`
- Migration rules: `docs/designs/p26-habit-trajectory-migration-rules.md`
- Product End-State: `docs/designs/p25-lifetime-simulation-north-star.md` §3.1 medical / renown lines

## 7. Open Questions

- P17 名望样本是否需同时读 `reputation` stat 门槛？（实施时按最小可验收 OR 语义处理）
- Medical 样本优先 `studyHabit` 还是新建医德轴？（P27 限制为现有三 habit 轴）

# PRD: P29 Wuxia Medical Habit Pool Expansion And Social Consequence Wiring

> **Derived from:** `docs/PRD/p28-wuxia-semi-personality-axis-content-wiring.md` (Discovery pass 2026-06-24)
> **Stage slug:** `p29-wuxia-medical-habit-pool-expansion-and-social-consequence-wiring`
> **Gaps addressed:** GAP-P28-001, GAP-P28-002, GAP-P28-003, GAP-END-MEDICAL, GAP-END-SEMIPERSON-SOCIAL, GAP-END-08-01 (partial)

## 1. Introduction

P28 完成半人格轴 `socialMomentum` / `familyBond` 内容分流：4 条样本、1 条 familyBond P17 后果、P25/P20 slice 与 regression。Medical 池仍仅 **1 条** `studyHabit` 样本（P27）；`socialMomentum` 中长期 P17 后果未交付（P28 限制 1 条且选了 familyBond）。

P29 在 **不新建 personality 容器、不扩第四 habit 轴、不全量迁移 medical 池** 的前提下，完成第三轮 execution-sized 迁移：补齐 medical 池 habit 样本、1 条 `socialMomentum` P17 后果，并更新 P25/P20 验证切片与 regression。

## 2. Goals

- 盘点 medical 池 habit / semi-personality 缺口并产出 audit delta
- 新增至少 **2 条** medical 池 habit-driven 样本（`studyHabit` 深化或 `socialMomentum` 医德/名望交叉），服务 Wave 1 `medical_sage_healer` / `jianghu_renown_sage` 行为-led 路径
- 新增 **1 条** `socialMomentum` 驱动的 P17 中后期后果，与 P28 familyBond 后果区分
- 扩展 `src/p25/habitTrajectorySlice.ts`（及必要时 P20 slice）覆盖 P29 新事件
- 扩展 isolated regression 覆盖 P29 medical 与 social 后果路径
- 产出 P29 closure 报告，列出 medical 池余量与 North Star §8 仍 OPEN 项

## 3. Non-Goals

- 不新建 `personalityTrajectory` 或独立 UI 面板
- 不全量迁移 medical 池或移除所有 stat/talent gate
- 不在本期交付 P25 Wave 2–4 新增成就配置
- 不一次性移除 legacy `*_habit` 读者
- 不重写 `dailyEvents.ts` / scheduler 既有 runtime 权重逻辑
- 不扩展 `familyBond` 新样本（P28 已闭合）

## 4. User Stories

### US-001: P29 Medical Pool Expansion Audit Delta

**Description:** As a maintainer, I want an audit of medical pool habit readiness so P29 wiring targets the highest-value nodes.

**Acceptance Criteria:**

- [ ] Inventory medical pool events: stat/talent gate vs `lifeStates.*` readers
- [ ] Classify gaps and map to P29 story order; note `medical_sage_healer` / `jianghu_renown_sage` traceability hooks
- [ ] Save under `docs/test-reports/` or `docs/designs/`
- [ ] Do not modify gameplay behavior in this story

### US-002: Add Medical Pool Habit-Driven Samples

**Description:** As a player, I want medical content to recognize long-term study or social shaping so healer and renown-led paths emerge from behavior.

**Acceptance Criteria:**

- [ ] Add at least 2 content samples in `medical.json` (or documented crossover pool) reading `lifeStates.studyHabit` and/or `lifeStates.socialMomentum` at threshold
- [ ] Samples change opportunity, reinforcement, or obligation—not flavor-only
- [ ] Remain age-appropriate; no high martial stat gate on new samples
- [ ] Targeted test proves habit-led access for each sample

### US-003: Add Social Momentum P17 Consequence Sample

**Description:** As a player, I want a mid/late-life consequence acknowledging long-term social momentum and renown upkeep pressure.

**Acceptance Criteria:**

- [ ] Add one P17-style consequence keyed by `socialMomentum >= threshold`
- [ ] Outcome changes obligation, burden, or opportunity—not flavor only
- [ ] Distinct from P27 renown upkeep, P28 familyBond caretaker, and P26 business consequences
- [ ] Targeted test proves axis-sensitive trigger

### US-004: Extend P25 Habit Trajectory Slice For P29

**Description:** As a maintainer, I want P25 trajectory reporting to include P29 medical and social consequence events.

**Acceptance Criteria:**

- [ ] Extend `src/p25/habitTrajectorySlice.ts` event lists for P29 samples
- [ ] Output remains machine-readable in existing P25 reporting flow
- [ ] Relevant P25 tests pass

### US-005: Extend Medical And Social Regression Tests

**Description:** As a maintainer, I want isolated regression coverage for P29 medical and social consequence wiring.

**Acceptance Criteria:**

- [ ] Extend `tests/personalityHabitTrajectoryTests.ts` or sibling isolated file for P29 paths
- [ ] Cover medical samples and socialMomentum P17 consequence
- [ ] Test file runs independently and exits cleanly

### US-006: Optional P20 Slice Sync For P29 Events

**Description:** As a maintainer, I want P20 habit trajectory slice aligned with P29 event IDs where replay reporting references them.

**Acceptance Criteria:**

- [ ] Update `src/p20/habitTrajectorySlice.ts` if P29 events appear in replay surfaces
- [ ] No regression to P28 semi-personality mirror semantics
- [ ] Relevant P20 tests pass

### US-007: Write P29 Closure And Remaining Queue

**Description:** As a maintainer, I want a closure note listing what P29 proved and what remains for full medical migration and P25 §8 reconciliation.

**Acceptance Criteria:**

- [ ] Summarize new samples, verification commands, and slice extensions
- [ ] List remaining medical pool habit gaps and deferred P24 fixtures
- [ ] Cross-reference North Star §8 items still OPEN after P29
- [ ] Save under `docs/test-reports/`

## 5. Success Metrics

- ≥2 medical 池 habit/semi-personality 样本落地且测试可触发
- ≥1 新 `socialMomentum` P17 后果样本，与 P27/P28 后果区分
- `p25/habitTrajectorySlice` 覆盖 P29 事件
- `typecheck` 与 personality / P25 定向测试保持通过

## 6. Dependencies / Context

- Parent: P28 closure `docs/test-reports/p28-closure-report.md`
- Migration rules: `docs/designs/p26-habit-trajectory-migration-rules.md`
- Product End-State: `docs/designs/p25-lifetime-simulation-north-star.md` §3.1, §8

## 7. Open Questions

- 第二条 medical 样本优先 `studyHabit` 深化还是 `socialMomentum` 医德交叉？（实施时选最小 diff、最高 traceability 节点）
- P17 social 后果落 `p22-content-expansions.json` 还是 medical 池？（与 P27/P28 后果池一致优先 P22）

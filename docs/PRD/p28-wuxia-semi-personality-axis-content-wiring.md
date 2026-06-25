# PRD: P28 Wuxia Semi-Personality Axis Content Wiring

> **Derived from:** `docs/PRD/p27-wuxia-habit-pool-expansion-and-consequence-wiring.md` (Discovery pass 2026-06-24)
> **Stage slug:** `p28-wuxia-semi-personality-axis-content-wiring`
> **Gaps addressed:** GAP-P27-001, GAP-P27-004, GAP-END-SEMIPERSON

## 1. Introduction

P27 完成三 habit 轴（`trainingHabit` / `studyHabit` / `businessHabit`）的第二轮池迁移：P20 replay dual-read、P21 echo、3 条 P17 后果轴、1 条 medical 样本。`socialMomentum` 与 `familyBond` 已在 `dailyEvents.ts` 与 `GameEngineIntegration.ts` 参与 runtime 权重，但 **内容 JSON 层零 `lifeStates.socialMomentum` / `lifeStates.familyBond` 条件读者**，无法作为中长期叙事分流器。

P28 在 **不新建 personality 容器、不扩第四 habit 轴** 的前提下，为半人格轴落地 execution-sized 内容样本与后果链，并补齐 P25 habit trajectory slice 对 P27/P28 事件的覆盖。

## 2. Goals

- 盘点 `socialMomentum` / `familyBond` 在内容池、echo、后果面的缺口并产出 audit delta
- 新增至少 **2 条** 读取 `lifeStates.socialMomentum` 的内容样本（社交/名望/人脉 reinforcement 或 fork）
- 新增至少 **2 条** 读取 `lifeStates.familyBond` 的内容样本（家庭义务/羁绊 reinforcement 或 fork）
- 新增至少 **1 条** P17 中后期后果样本，由 `socialMomentum` 或 `familyBond` 阈值驱动且改变压力/机会/义务
- 扩展 `src/p25/habitTrajectorySlice.ts`（及必要时 P20 slice）覆盖 P27 后果与 P28 半人格样本
- 扩展 isolated regression 覆盖 P28 样本触发路径
- 产出 P28 closure 报告，列出 medical 池余量与 North Star §8 仍 OPEN 项

## 3. Non-Goals

- 不新建 `personalityTrajectory` 或独立 UI 面板
- 不重写 `dailyEvents.ts` / scheduler 既有 runtime 权重逻辑
- 不在本期全量迁移 medical 池或 P24 calibration fixtures
- 不交付 P25 Wave 2–4 新增成就配置（属 P25 end-state reconciliation）
- 不一次性将所有 legacy `*_habit` 读者移除

## 4. User Stories

### US-001: P28 Semi-Personality Axis Audit Delta

**Description:** As a maintainer, I want an audit of `socialMomentum` and `familyBond` content readiness so P28 wiring targets the highest-value pools.

**Acceptance Criteria:**

- [ ] Inventory runtime vs content-layer usage of `socialMomentum` and `familyBond`
- [ ] Classify content pool gaps and map to P28 story order
- [ ] Save under `docs/test-reports/` or `docs/designs/`
- [ ] Do not modify gameplay behavior in this story

### US-002: Add Social Momentum Content Samples

**Description:** As a player, I want social shaping to unlock or reinforce social/reputation content so renown-led paths emerge from behavior.

**Acceptance Criteria:**

- [ ] Add at least 2 content samples in appropriate pools reading `lifeStates.socialMomentum >= threshold`
- [ ] Samples change opportunity, reinforcement, or fork—not flavor-only
- [ ] Targeted test proves habit-led access without relying solely on one-shot flags

### US-003: Add Family Bond Content Samples

**Description:** As a player, I want family bond accumulation to unlock family obligation or support content distinct from social momentum.

**Acceptance Criteria:**

- [ ] Add at least 2 content samples reading `lifeStates.familyBond >= threshold`
- [ ] Samples remain age-appropriate and materially affect obligation or support
- [ ] Targeted test proves familyBond-led access

### US-004: Add Semi-Personality P17 Consequence Sample

**Description:** As a player, I want a mid/late-life consequence that acknowledges long-term social or family shaping.

**Acceptance Criteria:**

- [ ] Add one P17-style consequence keyed by `socialMomentum` or `familyBond`
- [ ] Outcome changes obligation, burden, or opportunity—not flavor only
- [ ] Distinct from P26 business and P27 mentor/renown habit consequences
- [ ] Targeted test proves axis-sensitive trigger

### US-005: Extend P25 Habit Trajectory Slice For P27 And P28

**Description:** As a maintainer, I want P25 habit/semi-personality trajectory reporting to include P27 consequences and P28 axis samples.

**Acceptance Criteria:**

- [ ] Extend `src/p25/habitTrajectorySlice.ts` event lists for P27 mentor/renown/medical and new P28 samples
- [ ] Output remains machine-readable in existing P25 reporting flow
- [ ] Relevant P25 tests pass

### US-006: Extend Semi-Personality Regression Tests

**Description:** As a maintainer, I want isolated regression coverage for P28 social and family axis wiring.

**Acceptance Criteria:**

- [ ] Extend `tests/personalityHabitTrajectoryTests.ts` or sibling isolated file for P28 paths
- [ ] Cover social momentum samples, family bond samples, and P17 consequence
- [ ] Test file runs independently and exits cleanly

### US-007: Optional P20 Slice Sync For Semi-Personality Events

**Description:** As a maintainer, I want P20 habit trajectory slice aligned with P28 event IDs where replay reporting references them.

**Acceptance Criteria:**

- [ ] Update `src/p20/habitTrajectorySlice.ts` if P28 events appear in replay surfaces
- [ ] No regression to P27 mirror semantics
- [ ] Relevant P20 tests pass

### US-008: Write P28 Closure And Remaining Queue

**Description:** As a maintainer, I want a closure note listing what P28 proved and what remains for medical pool / P25 §8 reconciliation.

**Acceptance Criteria:**

- [ ] Summarize new samples, verification commands, and slice extensions
- [ ] List remaining medical pool habit gaps and deferred P24 fixtures
- [ ] Cross-reference North Star §8 items still OPEN after P28
- [ ] Save under `docs/test-reports/`

## 5. Success Metrics

- ≥2 `socialMomentum` + ≥2 `familyBond` 内容样本落地且测试可触发
- ≥1 新 P17 半人格后果样本，与 P26/P27 habit 后果区分
- `p25/habitTrajectorySlice` 覆盖 P27 后果事件
- `typecheck` 与 personality / P25 定向测试保持通过

## 6. Dependencies / Context

- Parent: P27 closure `docs/test-reports/p27-closure-report.md`
- Migration rules: `docs/designs/p26-habit-trajectory-migration-rules.md`
- Product End-State: `docs/designs/p25-lifetime-simulation-north-star.md` §3.1 renown line, §8

## 7. Open Questions

- 社交样本优先 `p22-content-expansions.json` 还是 `family-life.json`？（实施时选已有池最小 diff）
- P17 后果优先 `socialMomentum` 还是 `familyBond`？（P28 限制为 1 条，另一轴留给后续）

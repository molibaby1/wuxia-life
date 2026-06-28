# PRD: P26 Wuxia Personality Habit Trajectory Optimization

## 1. Introduction

P25 解决了「整局一生模拟」的总体体验问题，但当前项目仍有一个明显缺口：玩家早期长期行为虽然已经开始写入 `lifeStates` 中的长期习惯轴，却还没有在足够多的内容层、后果层、验证层形成稳定闭环。

结果是：

- 玩家能在系统层积累「练功习惯 / 读书习惯 / 营生习惯」
- 但中后期仍有大量内容只认 route 或 legacy habit flag
- 因此“我活成了什么样的人”还没有稳定传导到事件分流、分支结果、后期责任与终局回响

P26 的目标是完成一轮 **Personality Habit Trajectory Optimization**：把已经存在的长期习惯状态正式接入内容触发、事件结果、中后期 consequence 和 replayability 验证，让“长期选择 -> 习惯形成 -> 后续成长与事件结果变化”成为项目中的高价值中层驱动器。

## 2. Goals

- 让长期习惯状态成为可复用的正式内容输入，而不是只停留在运行时内部状态
- 在 P21 / P22 中落地最小但有代表性的习惯驱动样本
- 在 P17 中落地最小但真实可感的中后期习惯后果样本
- 在 P20 / P25 验证层新增轨迹差异验证，证明习惯系统确实拉开人生分化
- 保持现有兼容 habit flag 投影，不在本期破坏旧内容

## 3. User Stories

### US-001: Define P26 Scope And Migration Rules
**Description:** As a maintainer, I want explicit P26 migration rules so that later stories stay focused on personality-habit trajectory work instead of spreading into unrelated balancing.

**Acceptance Criteria:**
- [ ] Define allowed long-term habit axes for P26: `trainingHabit`, `studyHabit`, `businessHabit`
- [ ] Define which content layers are in scope: P21, P22, P17, P20/P25 validation
- [ ] Define that legacy `*_habit` flags remain as compatibility projection in this phase
- [ ] Define that no new independent personality container is introduced in P26

### US-002: Audit Existing Habit-Gated Content Surfaces
**Description:** As a maintainer, I want a read-only inventory of habit-sensitive content so that migration order is based on impact instead of guesswork.

**Acceptance Criteria:**
- [ ] Inventory current content/tests that read `training_habit`, `study_habit`, or `business_habit`
- [ ] Classify each hit as content trigger, validation fixture, replayability surface, or compatibility-only
- [ ] Identify 3-6 highest-value content targets for direct `lifeStates` migration
- [ ] Save the audit under `docs/test-reports/` or `docs/designs/`

### US-003: Add Independent P26 Habit Regression Test File
**Description:** As a maintainer, I want an isolated regression test file for habit trajectory logic so that P26 can be verified without relying on the noisy full-suite gate.

**Acceptance Criteria:**
- [ ] Add a dedicated test file for habit trajectory runtime and content wiring
- [ ] Cover `ConditionEvaluator` access to `player.lifeStates.*` and `lifeStates.*`
- [ ] Cover daily long-term hook accumulation and compatibility flag projection
- [ ] Test file runs independently and exits cleanly

### US-004: Register P26 Habit Test In The Real Test Gate
**Description:** As a maintainer, I want the new habit regression test registered in the standard gate list so that future runs automatically include it once full-suite noise is resolved.

**Acceptance Criteria:**
- [ ] Add the new P26 habit regression test entry to `tests/runRealTestGate.ts`
- [ ] The test name clearly identifies habit trajectory coverage
- [ ] No unrelated gate entries are changed

### US-005: Migrate One P21 Scholar Reinforcement Sample To `lifeStates`
**Description:** As a player, I want at least one route reinforcement sample to recognize long-term study habit directly so that scholarly identity can emerge from behavior, not only route flags.

**Acceptance Criteria:**
- [ ] Update one P21 scholar reinforcement sample to read `lifeStates.studyHabit`
- [ ] Preserve any required non-habit route guard that still defines intended audience
- [ ] Independent regression test proves the sample can trigger with `studyHabit` even when legacy `study_habit` flag is absent

### US-006: Add One P21 Training Reinforcement Sample Driven By `trainingHabit`
**Description:** As a player, I want at least one training-oriented reinforcement sample to recognize long-term training habit so that martial identity is reinforced by repeated behavior.

**Acceptance Criteria:**
- [ ] Add or migrate one P21 training-oriented sample to read `lifeStates.trainingHabit`
- [ ] Sample remains age-appropriate and route-consistent
- [ ] Test coverage proves the sample distinguishes habit-led access from pure route labeling

### US-007: Migrate One P22 Business Fork Sample To `lifeStates`
**Description:** As a player, I want an early merchant divergence sample to recognize business habit directly so that wealth-route identity can emerge from repeated livelihood behavior.

**Acceptance Criteria:**
- [ ] Update one P22 business fork sample to read `lifeStates.businessHabit`
- [ ] Preserve any required origin fallback that intentionally keeps merchant-house access
- [ ] Independent regression test proves the sample can trigger from `businessHabit` without legacy `business_habit` flag

### US-008: Add One P22 Scholar Or Training Fork Sample Driven By Habit
**Description:** As a player, I want one additional early fork sample outside the merchant path to prove the habit-driven approach is reusable across multiple identity directions.

**Acceptance Criteria:**
- [ ] Add or migrate one non-business P22 early fork sample to read either `lifeStates.studyHabit` or `lifeStates.trainingHabit`
- [ ] The sample targets a different identity direction than US-007
- [ ] Test coverage proves the new fork is habit-sensitive

### US-009: Add One Midlife Callback Sample For `studyHabit`
**Description:** As a player, I want an adult callback event that acknowledges long-term study habit so that early behavior has believable medium-term narrative echo.

**Acceptance Criteria:**
- [ ] Add one age 20-35 callback sample keyed by `lifeStates.studyHabit`
- [ ] Callback text makes the long-term shaping legible to the player
- [ ] The callback does not rely solely on legacy `study_habit` flag

### US-010: Add One Midlife Callback Sample For `trainingHabit` Or `businessHabit`
**Description:** As a player, I want a second adult callback sample from a different habit axis so that P26 demonstrates multi-axis echo rather than a single scholarly path.

**Acceptance Criteria:**
- [ ] Add one age 20-35 callback sample keyed by either `lifeStates.trainingHabit` or `lifeStates.businessHabit`
- [ ] Chosen axis differs from US-009
- [ ] The callback produces a credible opportunity, burden, or reinforcement outcome

### US-011: Add One P17 Consequence Sample For Habit-Borne Responsibility
**Description:** As a player, I want at least one mid/late-life consequence event to acknowledge what kind of person I became so that habits change later obligations, not just early access.

**Acceptance Criteria:**
- [ ] Add one P17 consequence sample keyed by a long-term habit axis
- [ ] The consequence changes obligation, opportunity, pressure, or burden rather than only flavor text
- [ ] The sample is clearly distinguished from route-only consequence logic

### US-012: Add P20 Habit Trajectory Replayability Slice
**Description:** As a maintainer, I want a replayability slice that compares high-vs-low habit runs so that habit-driven divergence can be measured instead of assumed.

**Acceptance Criteria:**
- [ ] Add at least one P20 slice comparing representative runs with different habit accumulation
- [ ] The slice reports whether event trajectory meaningfully differs across habit profiles
- [ ] Output is machine-readable and included in existing replayability reporting flow

### US-013: Add P25 Habit Trajectory Acceptance Slice
**Description:** As a maintainer, I want a P25 acceptance slice for long-term habit echo so that lifetime simulation reports can prove early habits survive into later-life outcomes.

**Acceptance Criteria:**
- [ ] Add at least one P25 slice covering early habit formation and later callback or consequence echo
- [ ] Slice records pass/fail with concrete event or flag pointers
- [ ] Save or surface results inside existing P25 validation output

### US-014: Document P26 Closure And Remaining Expansion Queue
**Description:** As a maintainer, I want a closure note for P26 so that future sessions know what was proven, what remains compatibility-only, and which content pools should migrate next.

**Acceptance Criteria:**
- [ ] Summarize migrated samples, new validation slices, and verification commands
- [ ] List remaining high-value habit-flag content still not migrated to direct `lifeStates` reads
- [ ] Record recommended next pools in dependency order
- [ ] Save under `docs/test-reports/` or `docs/designs/`

## 4. Functional Requirements

1. FR-1: P26 must continue using the existing long-term habit axes stored in `lifeStates` and must not add a new parallel personality state container.
2. FR-2: P26 must preserve compatibility projection from long-term habit state to legacy `training_habit`, `study_habit`, and `business_habit` flags.
3. FR-3: At least four representative content samples across P21/P22/P17 must directly read `lifeStates` habit thresholds by the end of P26.
4. FR-4: At least two adult callback or consequence surfaces must demonstrate medium- or later-life echo from early habit accumulation.
5. FR-5: P26 verification must include an isolated regression test file plus at least one replayability or lifetime-validation slice.
6. FR-6: P26 must keep changes bounded to content wiring, consequence surfaces, and validation/reporting; broad rebalance outside these areas is out of scope.

## 5. Non-Goals

- 不新建独立 `personalityTrajectory` 容器
- 不在本期引入新的 UI 面板或大规模前端展示改版
- 不一次性迁移所有 `*_habit` 旧内容
- 不在本期扩展到完整社交人格、情感人格、道德人格多轴建模
- 不重写 scheduler、event engine 或 save contract

## 6. Design Considerations

- 长期习惯在 P26 中是“内容分流器”和“后果放大器”，不是新的主数值成长条
- 迁移内容时优先选择“玩家能明显感觉到自己前期行为被承认”的节点
- 文案应尽量让玩家读得出“这是长期塑形的回响”，而不是只看到一次性触发条件

## 7. Technical Considerations

- 优先通过内容条件直接读取 `lifeStates.*` 阈值
- 保留 legacy habit flags 作为兼容层和部分旧测试输入
- 新测试应独立于当前 noisy full suite，避免被无关失败污染
- Replayability / lifetime slices 应尽量复用现有 P20 / P25 报告结构

## 8. Success Metrics

- 至少 4 条代表性内容样本完成 direct `lifeStates` migration
- 至少 2 条中期或后期 echo / consequence 样本落地
- 新独立 habit regression test 可单跑通过
- 至少 1 个 P20 或 P25 轨迹差异 slice 能证明高低 habit run 产生材料性差异
- `typecheck` 与相关定向测试保持通过

## 9. Open Questions

- 下一轮优先迁移 P17 的哪一类 consequence pool：师徒、名望责任、商路债务，还是门派义务？
- 是否要在 P27 扩到 `socialMomentum` / `familyBond` 这类“半人格半状态”轴？
- `medical` 与 `non-combat` 内容池是否值得成为下一个 habit-driven 迁移目标？

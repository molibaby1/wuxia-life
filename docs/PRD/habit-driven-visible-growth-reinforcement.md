# PRD: Habit-Driven Visible Growth Reinforcement

> **Derived from:** `docs/designs/habit-growth-boundary-rules.md`, `docs/test-reports/2026-06-30-merchant-early-experience-feedback-and-analysis.md`, `docs/test-reports/2026-06-30-merchant-route-0-15-playability-audit.md`, `docs/test-reports/2026-07-01-experience-optimization-priority-and-minimal-path.md`
> **Stage slug:** `habit-driven-visible-growth-reinforcement`
> **Stage type:** experience reinforcement, not system expansion

## 1. Introduction

当前项目已经具备一条可用但不够强的 runtime 链路：

- 玩家行为会推动 `habit / lifeStates`
- `habit` 已能参与部分事件触发、回响和摘要表达
- 主界面与选择反馈也已有初步可见性

但从真实体验反馈看，玩家仍然容易得到以下结论：

- 早期成长不明显
- 选择像是在看事件，而不是在塑造人物
- 即使系统内部发生了变化，也很难形成“我真的在长”的确认

因此，本阶段不再扩新系统，也不再先补大量新路线内容，而是只解决一个核心问题：

**如何把现有 `habit` 从“runtime 中层状态”推进成“玩家能明确感到的成长中介层”。**

本阶段的目标不是做完整路线重写，而是补出最小可感知闭环：

`行为 -> habit 累积 -> 可见成长确认 -> 新机会 / 新挑战 / 新分岔`

## 2. Goals

- 让玩家在 0–15 岁阶段稳定感到“长期行为正在塑造人物”
- 让 `habit` 不只出现在摘要里，而要驱动更明确的成长确认
- 让早期成长反馈优先通过现有系统完成，而不是新建平行系统
- 选一条样板路径完成闭环验证，优先使用商贾线
- 为后续商贾断点补强、武功职责收敛提供统一成长模型

## 3. Non-Goals

- 不新增独立“性格自动成长系统”
- 不新增新的长期状态容器
- 不完整重做武功数值结构
- 不设计完整技能系统
- 不并行补很多出身路线
- 不把本阶段扩成全量商路内容重写

## 4. Core Product Decision

本阶段采用如下成长模型：

1. 玩家行为先塑造 `habit`
2. `habit` 到达一定阈值后，触发更明确的成长确认
3. 该确认表现为以下几类之一：
   - 小幅能力成长
   - 新事件资格
   - 新路线分岔
   - 新挑战或新责任
4. 属性是结果，不是主驱动

这意味着：

- 不采用“年龄到了自动涨点”作为主成长模型
- 不采用“每次选择直接大量涨属性”作为主成长模型
- 自动成长只允许表现为 `habit` 对后续成长频率、资格、回报的持续放大

## 5. User Stories

### US-001: Audit Current Visible Growth Gaps

**Description:** As a maintainer, I want a read-only audit of where current `habit` accumulation already happens and why players still fail to feel growth, so this stage targets the real gap instead of inventing new mechanics.

**Acceptance Criteria:**

- [ ] Inventory the current early-life surfaces that already accumulate `trainingHabit` / `studyHabit` / `businessHabit`
- [ ] Identify where these accumulations stay hidden or feel too weak in 0–15 play
- [ ] Separate “state exists” from “player feels growth”
- [ ] Produce a bounded report under `docs/test-reports/`
- [ ] No runtime behavior change in this story

### US-002: Lock The Visible-Growth Scope Contract

**Description:** As a planner, I want an explicit scope contract so this stage stays focused on growth reinforcement instead of expanding into route redesign or system proliferation.

**Acceptance Criteria:**

- [ ] Define allowed layers: existing `habit` wiring, player-facing growth confirmation, narrow event/summary reinforcement, proof
- [ ] Define forbidden expansions: new personality container, full merchant rewrite, full combat rebalance, skill system, broad multi-route parallelization
- [ ] State that this is a reinforcement stage, not a new-system stage
- [ ] Save a scope contract under `docs/test-reports/`

### US-003: Define Habit-To-Growth Confirmation Rules

**Description:** As a designer, I want explicit rules for when `habit` should produce visible growth confirmation, so the experience becomes legible without flattening everything into raw stat gain.

**Acceptance Criteria:**

- [ ] Define what counts as valid “growth confirmation”
- [ ] Include at least: small stat reinforcement, new event access, new fork access, new responsibility or pressure
- [ ] Define what should not count: flavor-only text with no downstream effect, hidden-only flag change, unconditional age-based stat gain
- [ ] Define whether thresholds should be uniform or axis-specific
- [ ] Record the rules in the PRD or an appendix

### US-004: Build One Early-Life Sample Closed Loop

**Description:** As a player, I want at least one early-life path to clearly demonstrate that repeated behavior shapes future growth, so the project has a real sample loop rather than only abstract rules.

**Acceptance Criteria:**

- [ ] Choose one sample path, with `merchant_house` preferred
- [ ] Demonstrate repeated early behavior -> `habit` accumulation -> visible confirmation -> later opportunity/fork
- [ ] Sample loop must complete inside the early playable band, not only at late-life summary
- [ ] The loop must be player-comprehensible without debug-only interpretation

### US-005: Reinforce Habit-Driven Growth Expression

**Description:** As a player, I want the game to explicitly tell me that my repeated behavior is changing what I become, so the growth loop feels like authorship rather than passive playback.

**Acceptance Criteria:**

- [ ] Add or refine at least two player-facing expression surfaces for growth confirmation
- [ ] At least one surface must be immediate or short-term
- [ ] At least one surface must be medium-term and tied to later opportunity or fork
- [ ] No new dedicated UI panel is required
- [ ] Expression must use player language rather than internal state keys

### US-006: Define Merchant As The First Validation Route

**Description:** As a maintainer, I want merchant to be the first validation route for visible growth reinforcement so the project solves the clearest current pain point before broadening the pattern.

**Acceptance Criteria:**

- [ ] Explain why merchant is the first validation route
- [ ] State which merchant early-life gap this stage is solving and which it is not solving yet
- [ ] Define boundary with the later “merchant 10–15 key fork” stage
- [ ] Preserve the option to reuse the pattern for other non-martial routes later

### US-007: Add Bounded Verification For Visible Growth

**Description:** As a maintainer, I want a proof artifact showing that a representative early-life run now exposes meaningful growth confirmation, so the stage can be accepted on evidence rather than design intent.

**Acceptance Criteria:**

- [ ] Produce one bounded proof artifact for the sample route
- [ ] Show `habit` accumulation checkpoints
- [ ] Show at least one player-visible growth confirmation
- [ ] Show at least one resulting opportunity / fork / changed eligibility
- [ ] Proof does not require full lifetime exhaust

### US-008: Produce Closure And Defer Queue

**Description:** As a maintainer, I want a closure report stating what this stage now proves, what still remains weak, and what the next bounded stage should be.

**Acceptance Criteria:**

- [ ] Save a closure report under `docs/test-reports/`
- [ ] Summarize audit, scope contract, chosen loop, expression surfaces, and proof
- [ ] State what remains deferred
- [ ] Name the next bounded stage explicitly

## 6. Functional Requirements

1. FR-1: The stage must reuse the existing `habit / lifeStates` model and must not introduce a parallel personality-growth container.
2. FR-2: Growth confirmation must be tied to prior repeated behavior rather than unconditional age-based stat gain.
3. FR-3: At least one early-life sample route must demonstrate a complete visible-growth loop inside the playable early band.
4. FR-4: Player-facing output must describe growth in readable terms rather than raw state keys.
5. FR-5: The stage must stay bounded to growth reinforcement and must not expand into full route rebuilds.

## 7. Success Criteria

- A player can identify at least one clear “I repeated this, so I became this kind of person” loop in early life
- `habit` is no longer only a summary concept; it becomes a visible growth driver
- Merchant early-life experience gains a stronger growth feel without requiring full merchant-route rebuild
- The project has a reusable pattern for later non-martial route reinforcement

## 8. Dependencies / Context

- Boundary rules: `docs/designs/habit-growth-boundary-rules.md`
- Experience feedback: `docs/test-reports/2026-06-30-merchant-early-experience-feedback-and-analysis.md`
- Merchant early audit: `docs/test-reports/2026-06-30-merchant-route-0-15-playability-audit.md`
- Priority compression: `docs/test-reports/2026-07-01-experience-optimization-priority-and-minimal-path.md`
- Existing habit visibility baseline: `docs/PRD/p41-wuxia-habit-trajectory-player-facing-feedback.md`

## 9. Open Questions

- Growth confirmation thresholds should be global or per-axis tuned
- Merchant sample loop should center on businessHabit only or include mixed growth with socialMomentum
- The first visible confirmation should prioritize summary expression, event access, or small stat reinforcement

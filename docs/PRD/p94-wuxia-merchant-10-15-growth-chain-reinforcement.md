# PRD: P94 Wuxia Merchant 10-15 Growth Chain Reinforcement

> **Derived from:** `docs/PRD/habit-driven-visible-growth-reinforcement.md`, `docs/test-reports/2026-06-30-merchant-route-0-15-playability-audit.md`, `docs/test-reports/hvg-merchant-visible-growth-proof.md`, `docs/test-reports/p49-sample-lines-replay-latest.md`
> **Stage slug:** `p94-wuxia-merchant-10-15-growth-chain-reinforcement`
> **Stage type:** narrow experience reinforcement, not route rewrite

## 1. Introduction

上一阶段已经证明两件事：

- `merchant_house` 的早期可见成长闭环可以真实成立
- headless 与浏览器在出身选择语义上已经对齐

当前剩下的核心问题，不是 `merchant_house` 完全没有内容，而是 10–15 岁这段仍然偏空。

现状已经有：

- 7–12 岁的营生塑形确认：`merchant_childhood_seed_milestone`
- 9–11 岁的早期分岔：`hvg_merchant_early_opportunity_fork`
- 8–16 岁的单点主事件：`merchant_talent_discovery`
- 16–22 岁的开店承接：`merchant_first_shop`

但玩家在 10–15 岁这段仍容易得到以下感受：

- 我知道自己偏商路了
- 但我没有连续地“在成为某种人”
- 分岔之后没有很快看到差异化回报或代价

因此，本阶段只解决一个窄缺口：

**为 `merchant_house` 补出 10–15 岁“分岔后成长确认 -> 第一次小挑战 -> 16+ 承接”的连续成长链。**

本阶段不重做整条商路线，也不并行扩到其他路线。

## 2. Goals

- 让 `merchant_house` 在 10–15 岁出现连续可感知的成长链，而不是只等单点事件
- 让 `ledger` / `caravan` 两条早期分岔尽快出现玩家可读差异
- 让分岔后的成长不只写 flag，还要带来一次明确的小回报或小代价
- 让 13–15 岁阶段出现至少一次“第一次承担/第一次失手/第一次见识”的小挑战
- 保证这条成长链能自然承接到 `merchant_talent_discovery` 和 `merchant_first_shop`

## 3. Non-Goals

- 不重做 `merchant_house` 全生命周期内容
- 不设计新的技能系统
- 不做武功数值体系收敛
- 不扩到 scholar / orthodox / demonic 并行补强
- 不新增独立成长容器或第二套人格系统
- 不直接进入 `merchant_martial_patron` 大桥接阶段

## 4. Core Product Decision

本阶段继续沿用已经确认的人物成长主链：

`行为 -> habit -> 可见确认 -> 新机会 / 新挑战 -> 后续路线承接`

在 `merchant_house` 的 10–15 岁阶段，这条主链具体化为：

1. 玩家已通过早期行为进入商路塑形
2. `ledger` / `caravan` 分岔后，必须在 1–3 年内收到一次差异化确认
3. 差异化确认之后，必须在 13–15 岁之间遇到一次对应的小挑战
4. 小挑战结果要能影响 `merchant_talent_discovery`、后续 currentGoal、或更晚的开店准备感

也就是说，本阶段不再只证明“商路已经开启”，而是要证明“商路分岔已经开始塑造不同的人生走法”。

## 5. User Stories

### US-001: Audit Merchant 10-15 Gap As A Discrete Stage
**Description:** As a maintainer, I want the 10–15 merchant gap documented as its own stage problem, so implementation stays aimed at the real missing chain instead of reopening the whole route.

**Acceptance Criteria:**
- [ ] Document the current merchant anchors across age 7–22
- [ ] Explicitly identify the 10–15 gap between early fork and later shop/talent expression
- [ ] Distinguish “route is on” from “player feels continued growth”
- [ ] Save or update one bounded report under `docs/test-reports/`
- [ ] No runtime behavior change in this story

### US-002: Add One Post-Fork Visible Confirmation
**Description:** As a player, I want my early merchant fork choice to produce a visible confirmation within a short age window, so I can tell that `ledger` and `caravan` are already shaping me differently.

**Acceptance Criteria:**
- [ ] Add exactly one merchant 10–12 confirmation event or equivalent narrow reinforcement node
- [ ] The node must require merchant route entry plus one of `hvg_merchant_ledger_track` or `hvg_merchant_caravan_track`
- [ ] The node must present different player-facing text or outcome emphasis for the two tracks
- [ ] The node must change at least one downstream state beyond flavor-only text
- [ ] The node must remain scoped to merchant only

### US-003: Add One First Merchant Challenge In Age 13-15
**Description:** As a player, I want the route to test the kind of merchant I am becoming, so growth feels like responsibility and risk rather than passive accumulation.

**Acceptance Criteria:**
- [ ] Add exactly one merchant challenge node in age 13–15
- [ ] The challenge must be legible as a first real responsibility, mistake, or opportunity
- [ ] `ledger` and `caravan` should differ in either condition, framing, or result
- [ ] The challenge must create a small but readable consequence: stat shift, currentGoal change, eligibility shift, or route pressure
- [ ] The challenge must not require a new subsystem

### US-004: Preserve Chain Into Merchant Talent And Shop
**Description:** As a maintainer, I want the new 10–15 chain to connect naturally into existing merchant anchors, so this stage strengthens continuity instead of creating another isolated branch.

**Acceptance Criteria:**
- [ ] New 10–15 nodes must not orphan `merchant_talent_discovery`
- [ ] New 10–15 nodes must keep `merchant_first_shop` as the next major age-16+ business milestone
- [ ] At least one downstream condition, goal, or replay checkpoint should read differently after the new chain
- [ ] Existing merchant age-40 identity logic must not be weakened
- [ ] `p50` / replay merchant line should remain deterministic under current benchmark expectations

### US-005: Strengthen Player-Facing Growth Expression
**Description:** As a player, I want the route to tell me what sort of merchant I am becoming, so the loop feels authored rather than hidden in flags.

**Acceptance Criteria:**
- [ ] Add or refine at least two player-facing expressions tied to the new 10–15 chain
- [ ] At least one expression must be immediate to the event outcome
- [ ] At least one expression must survive into a later checkpoint, goal, or proof artifact
- [ ] Expression language must use player-facing merchant terms, not raw state-key names
- [ ] No new dedicated UI panel is required

### US-006: Add Narrow Proof And Regression Coverage
**Description:** As a maintainer, I want proof and tests for the 10–15 merchant chain, so the stage closes on evidence instead of on intent.

**Acceptance Criteria:**
- [ ] Add at least one focused test covering the new confirmation/challenge chain
- [ ] Verify that `ledger` and `caravan` can both reach their intended branch-specific confirmation or challenge path
- [ ] Produce or update one proof artifact under `docs/test-reports/`
- [ ] Proof must show age, route flags, branch flag, and at least one changed player-facing outcome
- [ ] Verification does not require reopening full-lifetime broad audits

### US-007: Produce Stage Closure And Next-Step Boundary
**Description:** As a maintainer, I want a closure report that states exactly what this stage now proves and what remains deferred, so the next stage stays bounded.

**Acceptance Criteria:**
- [ ] Save a closure report under `docs/test-reports/`
- [ ] State what was added in age 10–15
- [ ] State what remains deferred to later merchant route expansion
- [ ] Explicitly say this stage does not yet enter `merchant_martial_patron`
- [ ] Name the next bounded candidate stage after this one

## 6. Functional Requirements

1. FR-1: The system must provide at least one merchant-only post-fork confirmation inside age 10–12.
2. FR-2: The system must provide at least one merchant-only first challenge inside age 13–15.
3. FR-3: `hvg_merchant_ledger_track` and `hvg_merchant_caravan_track` must no longer be only silent branch flags; they must affect player-readable content or outcomes in this age band.
4. FR-4: The new chain must reuse the existing merchant route state model and must not introduce a new progression container.
5. FR-5: The new chain must preserve continuity into `merchant_talent_discovery` and `merchant_first_shop`.
6. FR-6: The stage must remain bounded to `merchant_house` and must not silently generalize to other routes in the same implementation.

## 7. Design Considerations

- `ledger` should feel like稳、细、算、守账、识风险
- `caravan` should feel like跑、认货、见世面、结人脉、吃波动
- 两条分岔的差异要先体现在“怎么成长”和“先遇到什么”，而不是先追求大数值差
- 事件文本要让玩家能一句话复述自己刚刚经历了什么成长
- 这一段的调性应是“开始练手、开始担责”，不是“已经开张立业”

## 8. Technical Considerations

- 优先复用现有 merchant line JSON、sample spine、currentGoal / player-facing expression 接线
- 优先做窄事件补强与已有 gate 承接，不做 scheduler 平台改造
- proof 和测试必须覆盖：
  - flag-only canonical merchant path
  - `ledger` / `caravan` 两条分岔
  - 10–15 岁新增确认与挑战
- 若需要新增 flag，应明确说明它服务的唯一链路，避免继续积累无表达的 silent flags

## 9. Success Metrics

- 玩家在 merchant 线 10–15 岁至少能感知到两次连续成长节点：
  - 一次“我偏向哪种商路”的确认
  - 一次“这种商路开始带来什么代价/机会”的挑战
- merchant replay 在 age 13 或 age 15 不再只停留在“尚未开张”的单层状态
- `ledger` 与 `caravan` 在 proof 或 replay 中至少出现一处可读差异
- 当前实现不引入新的系统级复杂度

## 10. Open Questions

- 10–12 岁确认节点应该放在 `sample-lines-spine.json` 还是 merchant route 专用 line 中更合适
- age 13–15 的第一次挑战更适合用单事件，还是“同事件双分支”结构
- 分岔差异首先应该落在 `currentGoal`、事件文案、还是资格变化
- 是否需要在这一阶段就让 replay 的 age-13 checkpoint 文案稳定体现 `ledger` / `caravan` 差异

## 11. Out-Of-Scope Follow-Up

本阶段完成后，才允许讨论以下后续方向：

1. merchant 16–25 更完整的经营压力与回报链
2. `merchant_martial_patron` 之类的跨路线桥接阶段
3. 更广泛的非武路线复用

在本阶段完成前，不应提前转向这些主题。

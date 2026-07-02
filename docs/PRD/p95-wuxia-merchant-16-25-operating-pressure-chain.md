# PRD: P95 Wuxia Merchant 16–25 Operating Pressure Chain

> **Derived from:** `docs/PRD/p94-wuxia-merchant-10-15-growth-chain-reinforcement.md` (Discovery pass 2026-07-02)
> **Stage slug:** `p95-wuxia-merchant-16-25-operating-pressure-chain`
> **Gaps addressed:** GAP-M95-01, GAP-M95-02, GAP-M95-03
> **Stage type:** narrow experience reinforcement, not full merchant route rewrite

## 1. Introduction

P94 已补齐 `merchant_house` 10–15 岁「分岔确认 → 第一次小挑战 → 16+ 承接」成长链。玩家在 15 岁左右已能感知 ledger / caravan 差异，并带着 `hvg_merchant_first_challenge_done` 进入 `merchant_talent_discovery` 与 `merchant_first_shop`。

当前 16–25 岁仍存在的核心缺口：

- `merchant_first_shop`（16–22）之后，经营段更像**单点事件堆叠**，缺少连续「在经营中成为某种商人」的体感
- 已有 `merchant_shop_failure`（17–24）与 `merchant_caravan_guard`（18–26），但**未读取** P94 ledger/caravan track 与 challenge 后果
- 16–25 replay / currentGoal 在开店后容易回落为泛化「店铺经营中」，ledger「稳账守风险」与 caravan「跑货吃波动」人格断裂
- P94 closure report 已将此段命名为下一 bounded candidate

本阶段只解决一个窄缺口：

**为 `merchant_house` 补出 16–25 岁「开店后经营节奏 → 第一次经营压力 → 商队/扩张承接」的连续压力链。**

不重做 `merchant.json` 全生命周期，不进入 `merchant_martial_patron`，不碰 Wave 3 `merchant_magnate`。

## 2. Goals

- 让 `merchant_house` 在 16–25 岁出现**至少两次连续**的经营体感节点（节奏确认 + 经营压力），而非只有 `merchant_first_shop` 单点
- 让 ledger / caravan 早期分岔在**开店后经营段**继续产生玩家可读差异（文案、后果或资格变化）
- 让新开节点**承接** P94 链 flags（`hvg_merchant_*_track`, `hvg_merchant_first_challenge_done`）并**喂入**既有 `merchant_shop_failure` / `merchant_caravan_guard`
- 强化 16–25 岁 currentGoal / cost label，使 replay checkpoint 不再只有泛化「店铺经营中」
- 以窄 proof + 回归测试闭合本 stage，不退化 P94 / P51 merchant baseline

## 3. Non-Goals

- 不重做 `merchant.json` 16+ 全事件图谱或终局链
- 不设计新技能系统或第二套经营容器
- 不实现 `merchant_magnate`（Wave 3 混合成就）或 `merchant_martial_patron` 跨路线桥接
- 不扩到 scholar / orthodox / demonic 并行补强
- 不做全生命周期 broad audit 或 gate:p20 全量重跑
- 不新增独立 UI 面板

## 4. Core Product Decision

沿用已确认主链：

`行为 -> habit -> 可见确认 -> 新机会 / 新压力 -> 后续路线承接`

在 16–25 岁经营段具体化为：

1. 玩家已通过 `merchant_first_shop` 或等效 shop flag 进入经营态
2. 开店后 1–3 年内收到一次**经营节奏确认**（周转稳 vs 扩张试探；ledger/caravan 差异化）
3. 19–22 岁之间遇到一次**第一次经营压力**（赊欠、断货、行市波动等可读小危机）
4. 压力结果影响 `merchant_shop_failure` 触发权重/条件、`merchant_caravan_guard` 资格，或 25 岁 checkpoint 文案

## 5. User Stories

### US-001: Audit Merchant 16–25 Operating Gap As A Discrete Stage
**Description:** As a maintainer, I want the 16–25 merchant operating gap documented as its own bounded stage problem, so implementation targets the missing pressure chain instead of reopening the full merchant route.

**Acceptance Criteria:**
- [ ] Document current merchant anchors across age 16–30 (shop, failure, caravan, monopoly)
- [ ] Explicitly identify the 16–25 gap between first shop and mid-twenties business payoff
- [ ] Distinguish「events exist」from「player feels operating pressure loop」
- [ ] Note where P94 track flags are not read in 16–25 expression or events
- [ ] Save one bounded report under `docs/test-reports/`
- [ ] No runtime behavior change in this story

### US-002: Add One Post-Shop Operating Rhythm Node (Age 16–19)
**Description:** As a player, I want my first shop to be followed by a visible operating rhythm confirmation, so ledger and caravan merchants feel like they are running the shop differently.

**Acceptance Criteria:**
- [ ] Add exactly one merchant 16–19 operating rhythm event or equivalent narrow node
- [ ] Node requires shop entry (`merchant_shop_*` or `merchant_first_shop` record) plus merchant route
- [ ] Node reads at least one P94 track flag (`hvg_merchant_ledger_track` or `hvg_merchant_caravan_track`)
- [ ] Ledger and caravan present different player-facing text or outcome emphasis
- [ ] Node changes at least one downstream state beyond flavor-only text
- [ ] Node remains merchant-only; no new progression container

### US-003: Add One First Operating Pressure Challenge (Age 19–22)
**Description:** As a player, I want the route to test my shop under real operating pressure, so growth feels like turnover risk and credit exposure rather than passive money accumulation.

**Acceptance Criteria:**
- [ ] Add exactly one merchant operating pressure node in age 19–22
- [ ] Challenge is legible as credit/debt, stockout, or market swing pressure
- [ ] Ledger and caravan differ in condition, framing, or result
- [ ] Challenge creates readable consequence: stat shift, currentGoal change, eligibility shift, or route pressure flag
- [ ] Challenge does not require a new subsystem
- [ ] Challenge remains bounded to merchant_house

### US-004: Wire Continuity Into Existing Merchant Operating Events
**Description:** As a maintainer, I want the new 16–25 nodes to feed existing shop failure and caravan guard anchors, so this stage strengthens continuity instead of creating an isolated branch.

**Acceptance Criteria:**
- [ ] New nodes do not orphan `merchant_shop_failure` or `merchant_caravan_guard`
- [ ] At least one downstream condition, goal, or replay checkpoint reads differently after the new chain
- [ ] P94 flags (`hvg_merchant_first_challenge_done`, track flags) remain valid eligibility inputs
- [ ] `merchant_first_shop` remains the age 16–22 entry milestone (not replaced)
- [ ] P51 seed 804 shop chain baseline does not regress

### US-005: Strengthen Player-Facing Operating Expression (Age 16–25)
**Description:** As a player, I want the route to tell me what kind of operator I am becoming after opening shop, so the loop feels authored rather than hidden in flags.

**Acceptance Criteria:**
- [ ] Add or refine at least two player-facing expressions tied to the new 16–25 chain
- [ ] At least one expression is immediate to the event outcome
- [ ] At least one expression survives into age 22–25 checkpoint, goal, or proof artifact
- [ ] Ledger vs caravan operating voice uses player-facing merchant terms, not raw state-key names
- [ ] No new dedicated UI panel is required

### US-006: Add Narrow Proof And Regression Coverage
**Description:** As a maintainer, I want proof and tests for the merchant 16–25 operating chain, so the stage closes on evidence instead of intent.

**Acceptance Criteria:**
- [ ] Add at least one focused test covering the new rhythm + pressure chain
- [ ] Verify ledger and caravan can both reach branch-specific operating paths
- [ ] Produce or update one proof artifact under `docs/test-reports/`
- [ ] Proof shows age, shop flags, track flag, and at least one changed player-facing outcome
- [ ] Verification does not require full-lifetime broad audits
- [ ] `npm run typecheck` passes
- [ ] Relevant merchant-focused tests pass

### US-007: Produce Stage Closure And Next-Step Boundary
**Description:** As a maintainer, I want a closure report stating what this stage proves and what remains deferred, so the next stage stays bounded.

**Acceptance Criteria:**
- [ ] Save a closure report under `docs/test-reports/`
- [ ] State what was added in age 16–25
- [ ] State what remains deferred (magnate on-ramp, martial patron, full route rewrite)
- [ ] Explicitly say this stage does not implement `merchant_magnate` or `merchant_martial_patron`
- [ ] Name the next bounded candidate stage after this one

## 6. Functional Requirements

1. FR-1: At least one merchant-only post-shop operating rhythm node inside age 16–19.
2. FR-2: At least one merchant-only operating pressure node inside age 19–22.
3. FR-3: P94 track flags must affect player-readable content or outcomes in the 16–25 band.
4. FR-4: New chain must reuse existing merchant route state model; no new progression container.
5. FR-5: New chain must preserve continuity into `merchant_shop_failure` and `merchant_caravan_guard`.
6. FR-6: Stage remains bounded to `merchant_house`; no silent generalization to other routes.

## 7. Design Considerations

- ledger 经营段：稳周转、守赊欠、控库存、避坏账
- caravan 经营段：赌行市、快周转、扩货路、吃波动
- 压力节点调性：「店已经开了，第一次真亏/真赚」而非「富可敌国」
- 优先窄事件 + expression 接线，不改 scheduler 平台

## 8. Technical Considerations

- 优先复用 `sample-lines-spine.json` / `merchant.json` 现有接线模式（参照 P94）
- proof 覆盖：shop flag path、ledger/caravan 两条分岔、19–22 压力节点
- 新 flag 必须服务唯一链路并有 expression 落点

## 9. Success Metrics

- merchant 16–25 至少两次连续经营体感节点（节奏 + 压力）
- replay age 22–25 checkpoint 能体现 ledger / caravan 经营差异
- 既有 P51 merchant 804 baseline 不退化
- 不引入新的系统级复杂度

## 10. Open Questions

- 经营节奏节点放在 spine 还是 merchant line 更合适
- 压力节点是否应微调 `merchant_shop_failure` 触发而非新增平行事件
- 19–22 压力首先落在 currentGoal、资格变化还是 stat 波动

## 11. Out-Of-Scope Follow-Up

1. `merchant_magnate` / Wave 3 混合成就 on-ramp
2. `merchant_martial_patron` 跨路线桥接
3. merchant 26–40 中年扩张与 identity 深化（已有部分 spine 节点）
4. 非 merchant 路线并行补强

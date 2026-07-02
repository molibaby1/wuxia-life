# PRD: P96 Wuxia Merchant 26–40 Midlife Expansion Identity

> **Derived from:** `docs/PRD/p95-wuxia-merchant-16-25-operating-pressure-chain.md` (Discovery pass 2026-07-02)
> **Stage slug:** `p96-wuxia-merchant-26-40-midlife-expansion-identity`
> **Gaps addressed:** GAP-M96-01, GAP-M96-02, GAP-M96-03, GAP-M96-04
> **Stage type:** narrow experience reinforcement, not full merchant route rewrite

## 1. Introduction

P95 已补齐 `merchant_house` 16–25 岁「开店后经营节奏 → 第一次经营压力 → shop failure / caravan guard 承接」链。玩家在 19–25 岁已能感知 ledger「稳周转守赊欠」与 caravan「跑货吃波动」的经营差异。

当前 26–40 岁仍存在的核心缺口：

- P95 经营链 flags（`hvg_merchant_*_track`、`hvg_merchant_operating_pressure_done`、rhythm/pressure 子 flag）在 **26–32 岁 replay** 后易失去可读延续
- 既有 spine 节点 `merchant_midlife_debt_milestone`（32）与 `merchant_age40_identity_summary`（40）**未读取** P95 经营分岔，age 40 身份文案泛化
- `merchantAge40Identity()` 不区分 ledger vs caravan 经营人格
- 25→32 岁之间缺少一次**扩张节奏确认**，玩家从中青年经营过渡到中年债务/身份时体感断裂

本阶段只解决一个窄缺口：

**为 `merchant_house` 补出 26–40 岁「中青年扩张节奏 → 中年身份/债务承接」的连续身份链，使 P95 ledger/caravan 经营人格延续到 age 40 identity 与 age 45 expansion fork。**

不重做 `merchant.json` 全生命周期，不进入 `merchant_magnate` on-ramp，不碰 `merchant_martial_patron`。

## 2. Goals

- 让 `merchant_house` 在 26–30 岁出现**至少一次**可读的中青年扩张节奏节点，承接 P95 经营链并分化 ledger / caravan
- 让 `merchant_midlife_debt_milestone` 和/或 `merchant_age40_identity_summary` **读取** P95 经营 flags，产生条件、文案或后果差异
- 强化 `merchantAge40Identity()` 与 26–40 replay currentGoal，使 ledger vs caravan 经营人格在 age 40 可辨认
- 让新节点**喂入**既有 `merchant_age45_expansion_fork`，不孤立分支
- 以窄 proof + 回归测试闭合本 stage，不退化 P95 / P51 merchant baseline

## 3. Non-Goals

- 不重做 `merchant.json` 26+ 全事件图谱或终局链
- 不实现 `merchant_magnate`（Wave 3 混合成就）on-ramp 或 magnate 专用 spine
- 不实现 `merchant_martial_patron` 跨路线桥接
- 不设计新技能系统或第二套经营容器
- 不扩到 scholar / orthodox / demonic 并行补强
- 不做全生命周期 broad audit 或 gate:p20 全量重跑
- 不新增独立 UI 面板

## 4. Core Product Decision

沿用已确认主链：

`行为 -> habit -> 可见确认 -> 新机会 / 新压力 -> 后续路线承接`

在 26–40 岁经营段具体化为：

1. 玩家已通过 P95 经营链（rhythm + pressure）进入中青年商路态
2. 26–30 岁之间收到一次**扩张节奏确认**（稳扩 vs 赌市扩货；ledger/caravan 差异化）
3. 32–40 岁 spine（债务里程碑、age 40 身份）**读取** P95 + P96 链 flags，输出分化身份文案
4. 身份结果影响 `merchant_age45_expansion_fork` 可读 framing 或 checkpoint，而非替换该节点

## 5. User Stories

### US-001: Audit Merchant 26–40 Midlife Gap As A Discrete Stage
**Description:** As a maintainer, I want the 26–40 merchant midlife gap documented as its own bounded stage problem, so implementation targets the missing identity chain instead of reopening the full merchant route.

**Acceptance Criteria:**
- [ ] Document current merchant anchors across age 25–45 (expansion events, midlife debt, age 40 identity, age 45 fork)
- [ ] Explicitly identify the 26–40 gap between P95 operating pressure and age 40 identity
- [ ] Note where P95 flags are not read in spine events or expression
- [ ] Distinguish「events exist」from「player feels continuous midlife identity」
- [ ] Save one bounded report under `docs/test-reports/`
- [ ] No runtime behavior change in this story

### US-002: Add One Mid-20s Expansion Rhythm Node (Age 26–30)
**Description:** As a player, I want my early operating choices to carry into a visible expansion rhythm confirmation in my late twenties, so ledger and caravan merchants feel like they are scaling the business differently.

**Acceptance Criteria:**
- [ ] Add exactly one merchant 26–30 expansion rhythm event or equivalent narrow node
- [ ] Node requires P95 chain entry (`hvg_merchant_operating_pressure_done` or equivalent shop + track flags)
- [ ] Node reads at least one P95 track flag (`hvg_merchant_ledger_track` or `hvg_merchant_caravan_track`)
- [ ] Ledger and caravan present different player-facing text or outcome emphasis
- [ ] Node changes at least one downstream state beyond flavor-only text
- [ ] Node remains merchant-only; no new progression container

### US-003: Wire P95/P96 Continuity Into Midlife Spine Events (Age 32–40)
**Description:** As a maintainer, I want midlife debt and age 40 identity spine events to read the operating/expansion chain flags, so midlife identity is not generic for all merchants.

**Acceptance Criteria:**
- [ ] `merchant_midlife_debt_milestone` and/or `merchant_age40_identity_summary` reads at least one P95 or P96 chain flag
- [ ] At least one spine outcome, condition, or expression branch differs by ledger vs caravan track
- [ ] `merchant_age45_expansion_fork` is not orphaned; at least one upstream read path exists
- [ ] P95 seed/regression baseline (804 shop chain) does not regress
- [ ] No replacement of existing spine event IDs

### US-004: Strengthen Age 40 Identity Expression (Ledger vs Caravan)
**Description:** As a player, I want my age 40 identity summary to tell me what kind of merchant I became, so midlife feels authored rather than a generic wealth label.

**Acceptance Criteria:**
- [ ] `merchantAge40Identity()` adds or refines at least two ledger vs caravan differentiated branches
- [ ] At least one branch reads P95/P96 operating or expansion flags
- [ ] Identity text uses player-facing merchant terms, not raw state-key names
- [ ] Magnate bridge paths (`magnate_on_ramp_done`, bridge flags) remain unchanged in priority
- [ ] No new dedicated UI panel is required

### US-005: Strengthen Player-Facing Midlife Expression (Age 26–40)
**Description:** As a player, I want currentGoal and cost labels between ages 26 and 40 to reflect my operating track, so replay checkpoints stay readable.

**Acceptance Criteria:**
- [ ] Add or refine at least two player-facing expressions tied to the new 26–40 chain
- [ ] At least one expression is immediate to the expansion rhythm outcome
- [ ] At least one expression survives into age 32–40 checkpoint, goal, or proof artifact
- [ ] Ledger vs caravan voice uses player-facing merchant terms
- [ ] `npm run typecheck` passes

### US-006: Add Narrow Proof And Regression Coverage
**Description:** As a maintainer, I want proof and tests for the merchant 26–40 midlife identity chain, so the stage closes on evidence instead of intent.

**Acceptance Criteria:**
- [ ] Add at least one focused test covering expansion rhythm + midlife spine continuity
- [ ] Verify ledger and caravan can both reach branch-specific midlife paths
- [ ] Produce or update one proof artifact under `docs/test-reports/`
- [ ] Proof shows age, P95/P96 flags, and at least one changed player-facing outcome
- [ ] Verification does not require full-lifetime broad audits
- [ ] `npm run typecheck` passes
- [ ] Relevant merchant-focused tests pass

### US-007: Produce Stage Closure And Next-Step Boundary
**Description:** As a maintainer, I want a closure report stating what this stage proves and what remains deferred, so the next stage stays bounded.

**Acceptance Criteria:**
- [ ] Save a closure report under `docs/test-reports/`
- [ ] State what was added in age 26–40
- [ ] State what remains deferred (magnate on-ramp, martial patron, full route rewrite)
- [ ] Explicitly say this stage does not implement `merchant_magnate` or `merchant_martial_patron`
- [ ] Name the next bounded candidate stage after this one

## 6. Functional Requirements

1. FR-1: At least one merchant-only expansion rhythm node inside age 26–30.
2. FR-2: Midlife spine events must read P95/P96 chain flags for differentiated outcomes or expression.
3. FR-3: `merchantAge40Identity()` must distinguish ledger vs caravan when P95 track flags are set.
4. FR-4: New chain must reuse existing merchant route state model; no new progression container.
5. FR-5: New chain must preserve continuity into `merchant_age45_expansion_fork`.
6. FR-6: Stage remains bounded to `merchant_house`; no silent generalization to other routes.

## 7. Design Considerations

- ledger 中年段：稳扩张、控债务、守信誉、慢积人脉
- caravan 中年段：扩货路、押行市、吃波动、快周转
- 节奏节点调性：「店已站稳，第一次认真考虑扩规模」而非「富可敌国」
- 优先窄事件 + spine/expression 接线，不改 scheduler 平台

## 8. Technical Considerations

- 优先复用 `sample-lines-spine.json` / `merchant.json` / `sampleLineExpression.ts` 现有接线模式（参照 P95）
- proof 覆盖：P95 chain path、ledger/caravan 两条分岔、32/40 spine 分化
- 新 flag 必须服务唯一链路并有 expression 落点

## 9. Success Metrics

- merchant 26–40 至少一次扩张节奏节点 + spine 身份分化
- replay age 32–40 checkpoint 能体现 ledger / caravan 经营差异
- 既有 P51 merchant 804 baseline 不退化
- 不引入新的系统级复杂度

## 10. Open Questions

- 扩张节奏节点放在 spine 还是 merchant line 更合适
- 是否微调 `merchant_midlife_debt_milestone` 触发条件而非仅改 expression
- age 40 身份优先落在 `merchantAge40Identity` 还是 spine content 内分支

## 11. Out-Of-Scope Follow-Up

1. `merchant_magnate` / Wave 3 混合成就 on-ramp（P55 已审计）
2. `merchant_martial_patron` 跨路线桥接
3. merchant 40+ empire / ending 全图谱重写
4. 非 merchant 路线并行补强
5. North Star §8 Wave 1 新增主流成就、Wave 4 平凡出身全谱

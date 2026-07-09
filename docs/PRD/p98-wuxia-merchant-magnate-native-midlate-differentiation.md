# PRD: P98 Wuxia Merchant Magnate Native Mid/Late Differentiation

> **Derived from:** `docs/PRD/p97-wuxia-merchant-magnate-native-entry-differentiation.md` (Discovery pass 2026-07-02)
> **Stage slug:** `p98-wuxia-merchant-magnate-native-midlate-differentiation`
> **Gaps addressed:** GAP-P97-N01, GAP-P97-N02, GAP-P97-N03
> **Stage type:** bounded native-path magnate mid/late reinforcement, not full magnate rewrite

## 1. Introduction

P97 已让 native `merchant_house` 的 P95/P96 ledger/caravan 经营人格在 `magnate_on_ramp`（age 28–32）可读延续：choice 分支、entry markers、currentGoal/costLabel 分化，且 P55 主链与 P63/P64 bridge 不退化。

但 P64 已覆盖 **bridge-origin** 的 `magnate_midlife_pressure` / `magnate_payoff` 分化；**native ledger/caravan** 玩家进入 pressure（36–40）与 payoff（42–46）后，内容仍 largely 收平为 generic magnate 体验。P97 仅在 expression 层做了最小 marker 读取，未形成中后段 choice/后果分化。

本阶段只解决一个窄缺口：

**让 native ledger/caravan 的 magnate entry markers 在 `magnate_midlife_pressure` 与 `magnate_payoff` 产生可读、可验证的中后段差异，且不破坏 P55 骨架与 P64 bridge 分化。**

不重做 P55/P97 magnate 入口，不进入 `merchant_martial_patron`，不扩 Wave 4 平凡出身。

## 2. Goals

- 让 `magnate_midlife_pressure` **读取** P97 native entry markers（`magnate_native_ledger_entry` / `magnate_native_caravan_entry`）及 P96 expansion sub-flags，产生 native path 条件或后果差异
- 让 `magnate_payoff` 对 ledger vs caravan native 路径呈现**至少两组**可读 player-facing 差异（文案、表达或轻量 marker/stat 后果）
- 保持 P55 on-ramp → pressure → payoff 主链可通；P63/P64 bridge-origin 中后段分化**不退化**
- 以窄 proof + 回归测试闭合本 stage
- 为 Wave 3 §8 `merchant_magnate` 链补 native 中后段可验证样本（承接 P97 入口样本）

## 3. Non-Goals

- 不重做 P97 magnate on-ramp entry wiring
- 不重做 P64 bridge pressure/payoff 分化
- 不实现 `merchant_martial_patron` 跨路线桥接
- 不新建 economy / trade-platform / 第二套经营容器
- 不做全生命周期 broad audit 或 gate:p20 全量重跑
- 不新增独立 UI 面板
- 不一次性实现 North Star §8 全谱（Wave 1 主流成就、Wave 4 平凡出身等）

## 4. Core Product Decision

沿用已确认主链：

`P97 magnate 入口分化 → P98 magnate 中后段分化 → P55 magnate 骨架收束`

在中后段具体化为：

1. native 玩家已携带 P97 `magnate_native_ledger_entry` 或 `magnate_native_caravan_entry`（及 sub-flags）
2. `magnate_midlife_pressure` 读取上述 markers，输出 ledger/caravan 差异化 framing、choice 分支或轻量 downstream marker
3. `magnate_payoff` 读取 pressure 阶段 markers，输出 differentiated payoff emphasis
4. bridge-origin 玩家仍走 P64 markers，不与 native track 分支冲突
5. 分化结果**喂入**既有 P55 spine event ID，不替换

## 5. User Stories

### US-001: Audit Native Magnate Mid/Late Flattening
**Description:** As a maintainer, I want the native magnate pressure/payoff flattening gap documented so P98 targets the P97 entry → mid/late discontinuity instead of reopening P55/P64.

**Acceptance Criteria:**
- [ ] Document current `magnate_midlife_pressure` and `magnate_payoff` gates, flags, and expression for native vs bridge-origin paths
- [ ] Explicitly identify where P97 native entry markers are not consumed at pressure/payoff content layer
- [ ] Distinguish P64 bridge mid/late differentiation from native track mid/late differentiation
- [ ] Save one bounded report under `docs/test-reports/`
- [ ] No runtime behavior change in this story

### US-002: Wire Native Entry Markers Into Magnate Midlife Pressure
**Description:** As a player, I want my ledger or caravan magnate entry personality to carry into midlife pressure so identity does not reset at age 36.

**Acceptance Criteria:**
- [ ] `magnate_midlife_pressure` or equivalent narrow wiring reads P97 native entry markers for native merchant_house path
- [ ] Ledger and caravan produce different player-facing text, condition branch, or downstream marker at pressure phase
- [ ] Change affects at least one downstream state beyond flavor-only text
- [ ] P55 magnate chain (on-ramp → pressure → payoff) remains reachable
- [ ] P63/P64 bridge-origin pressure paths do not regress

### US-003: Wire Native Differentiation Into Magnate Payoff
**Description:** As a player, I want magnate payoff goals and outcomes to reflect whether I scaled via steady ledger or market-driven caravan through the pressure phase.

**Acceptance Criteria:**
- [ ] `magnate_payoff` reads native pressure-phase markers or P97 entry lineage
- [ ] Ledger and caravan produce distinguishable payoff expression or lightweight consequence
- [ ] Bridge-origin P64 payoff expressions retain priority when bridge markers are set
- [ ] Identity text uses player-facing merchant terms, not raw state-key names
- [ ] No new dedicated UI panel is required

### US-004: Strengthen Native Mid/Late Expression
**Description:** As a player, I want pressure burden labels and payoff emphasis to reflect my native operating track through magnate mid/late phases.

**Acceptance Criteria:**
- [ ] Add or refine at least two player-facing expression pairs (pressure + payoff) for native ledger vs caravan
- [ ] At least one expression reads P97 entry or P98 pressure markers
- [ ] Bridge-origin expressions retain priority when bridge markers are set
- [ ] `merchantAge40Identity` or equivalent mid/late identity hook reflects native track when applicable

### US-005: Add Narrow Proof And Regression Coverage
**Description:** As a maintainer, I want proof and tests for native magnate mid/late differentiation so the stage closes on evidence.

**Acceptance Criteria:**
- [ ] Add at least one focused test covering ledger and caravan native paths through pressure and payoff
- [ ] Produce or update one proof artifact under `docs/test-reports/`
- [ ] Proof shows age, P97/P98 flags, and at least one changed player-facing outcome at pressure and payoff checkpoints
- [ ] Verification does not require full-lifetime broad audits
- [ ] npm run typecheck passes
- [ ] Relevant merchant-focused tests pass

### US-006: Produce Stage Closure And Next-Step Boundary
**Description:** As a maintainer, I want a closure report stating what P98 proves and what remains deferred.

**Acceptance Criteria:**
- [ ] Save a closure report under `docs/test-reports/`
- [ ] State what was added at magnate mid/late native differentiation
- [ ] State what remains deferred (merchant_martial_patron, full empire, North Star §8 broader waves)
- [ ] Explicitly say this stage does not implement merchant_martial_patron or full magnate rewrite
- [ ] Name the next bounded candidate stage after this one

## 6. Functional Requirements

1. FR-1: Native merchant_house magnate mid/late must read P97 entry markers and P96 expansion lineage.
2. FR-2: Ledger vs caravan must produce distinguishable pressure and payoff outcomes or expression.
3. FR-3: P55 magnate skeleton and P64 bridge mid/late differentiation must not regress.
4. FR-4: New wiring must reuse existing merchant route state model; no new progression container.
5. FR-5: Stage remains bounded to magnate pressure/payoff; no silent generalization to other routes.

## 7. Design Considerations

- ledger pressure：守信誉、控债务、稳扩下的中年代价
- caravan pressure：行市波动、货路风险、快周转下的中年代价
- ledger payoff：稳态巨贾、信誉资本收束
- caravan payoff：行市赢家、货路帝国收束
- 调性：「巨贾门槛已跨，中年压力与收束仍带经营人格」而非 empire 终局
- 优先窄 spine/expression/choice 接线，pattern 参照 P64 bridge 分化

## 8. Success Metrics

- native merchant_house ledger/caravan 各有一条 magnate pressure→payoff 可玩样本
- replay age 36–46 checkpoint 能体现经营 track 差异
- P55/P63/P64/P97 回归不退化
- 不引入新的系统级复杂度

## 9. Open Questions

- 分化落在 pressure/payoff content 分支还是新增轻量 flag marker
- payoff 是否需读取 pressure-phase choice outcome（P98 做最小接线时优先 marker 链）

## 10. Out-Of-Scope Follow-Up

1. `merchant_martial_patron` 跨路线桥接
2. merchant 40+ empire / ending 全图谱重写
3. North Star §8 Wave 1 新增主流成就、Wave 2 巅峰、Wave 4 平凡出身全谱
4. Full-lifetime simulation gate:p20 broad rerun

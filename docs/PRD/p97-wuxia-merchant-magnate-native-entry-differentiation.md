# PRD: P97 Wuxia Merchant Magnate Native Entry Differentiation

> **Derived from:** `docs/PRD/p96-wuxia-merchant-26-40-midlife-expansion-identity.md` (Discovery pass 2026-07-02)
> **Stage slug:** `p97-wuxia-merchant-magnate-native-entry-differentiation`
> **Gaps addressed:** GAP-P96-D01, GAP-P96-D02, GAP-P96-D03
> **Stage type:** narrow native-path magnate entry reinforcement, not full magnate rewrite

## 1. Introduction

P96 已补齐 `merchant_house` 26–40 岁「中青年扩张节奏 → 中年身份/债务 → age 40 identity → age 45 fork」连续链，ledger vs caravan 经营人格在 age 40 可辨认。

但 P55 `magnate_on_ramp`（age 28–32）与 P63/P64（ordinary-bridge 入口/中后段分化）**未覆盖** native `merchant_house` 路径：玩家带着 P95/P96 ledger/caravan 经营人格进入巨贾门槛时，spine 条件与表达仍收束为 generic magnate 体验。

本阶段只解决一个窄缺口：

**让 native `merchant_house` 的 P95/P96 ledger/caravan 经营人格在 `magnate_on_ramp` 入口可读延续，且不破坏 P55 骨架与 P63/P64 bridge 分化。**

不重做 `merchant_magnate` 全链，不进入 `merchant_martial_patron`，不扩 Wave 4 平凡出身。

## 2. Goals

- 让 `magnate_on_ramp` 或等价窄接线**读取**至少一个 P95/P96 track/expansion flag，产生 native path 条件或后果差异
- 让 ledger vs caravan 在 magnate 入口呈现**至少两组**可读 player-facing 差异（文案、表达或轻量 marker）
- 保持 P55 on-ramp → pressure → payoff 主链可通；P63/P64 bridge-origin 分化**不退化**
- 以窄 proof + 回归测试闭合本 stage
- 为 Wave 3 §8 item 1 native merchant→magnate 链补一条可验证样本

## 3. Non-Goals

- 不重做 P55/P64 全 magnate 中后段（`magnate_midlife_pressure` / `magnate_payoff` 大扩写）
- 不实现 `merchant_martial_patron` 跨路线桥接
- 不新建 economy / trade-platform / 第二套经营容器
- 不重开 P63 ordinary-bridge entry 或 P96 26–40 midlife 链
- 不做全生命周期 broad audit 或 gate:p20 全量重跑
- 不新增独立 UI 面板

## 4. Core Product Decision

沿用已确认主链：

`P94 成长 → P95 经营 → P96 扩张/身份 → P97 magnate 入口分化 → P55 magnate 骨架`

在 magnate 入口具体化为：

1. native `merchant_house` 玩家已携带 `hvg_merchant_ledger_track` 或 `hvg_merchant_caravan_track`（及 P96 expansion 子 flag）
2. `magnate_on_ramp` 读取上述 flags，输出 ledger/caravan 差异化 framing 或轻量 downstream marker
3. bridge-origin 玩家仍走 P63 markers，不与 native track 分支冲突
4. 分化结果**喂入**既有 P55 pressure/payoff，不替换 spine event ID

## 5. User Stories

### US-001: Audit Native Merchant Magnate Entry Flattening
**Description:** As a maintainer, I want the native merchant_house magnate entry gap documented so P97 targets the P95/P96 → magnate discontinuity instead of reopening P55.

**Acceptance Criteria:**
- [ ] Document current magnate_on_ramp gates, flags, and expression for native vs bridge-origin paths
- [ ] Explicitly identify where P95/P96 ledger/caravan flags are not read at magnate entry
- [ ] Distinguish P63 bridge differentiation from native track differentiation
- [ ] Save one bounded report under `docs/test-reports/`
- [ ] No runtime behavior change in this story

### US-002: Wire P95/P96 Continuity Into Magnate On-Ramp
**Description:** As a player, I want my ledger or caravan operating personality to carry into the magnate threshold so midlife identity does not reset at age 28.

**Acceptance Criteria:**
- [ ] magnate_on_ramp or equivalent narrow wiring reads at least one P95/P96 track or expansion flag for native merchant_house path
- [ ] Ledger and caravan produce different player-facing text, condition branch, or downstream marker
- [ ] Change affects at least one downstream state beyond flavor-only text
- [ ] P55 magnate chain (on-ramp → pressure → payoff) remains reachable
- [ ] P63/P64 bridge-origin paths do not regress

### US-003: Strengthen Native Magnate Entry Expression
**Description:** As a player, I want magnate entry cost labels and goals to reflect whether I am a steady ledger scaler or a market-driven caravan operator.

**Acceptance Criteria:**
- [ ] Add or refine at least two player-facing expressions for native ledger vs caravan at magnate entry
- [ ] At least one expression reads P95/P96 operating or expansion flags
- [ ] Bridge-origin P63 expressions retain priority when bridge markers are set
- [ ] Identity text uses player-facing merchant terms, not raw state-key names
- [ ] No new dedicated UI panel is required

### US-004: Preserve Magnate Chain Continuity
**Description:** As a maintainer, I want native entry differentiation to feed P55 pressure/payoff without orphaning the magnate spine.

**Acceptance Criteria:**
- [ ] magnate_midlife_pressure remains reachable after native differentiated on-ramp
- [ ] At least one upstream read path connects P96 age-40 identity flags to magnate entry or first pressure checkpoint
- [ ] Seed 804 replay baseline does not regress
- [ ] No replacement of existing magnate spine event IDs

### US-005: Add Narrow Proof And Regression Coverage
**Description:** As a maintainer, I want proof and tests for native merchant magnate entry differentiation so the stage closes on evidence.

**Acceptance Criteria:**
- [ ] Add at least one focused test covering ledger and caravan native paths into magnate on-ramp
- [ ] Produce or update one proof artifact under `docs/test-reports/`
- [ ] Proof shows age, P95/P96 flags, magnate entry marker, and at least one changed player-facing outcome
- [ ] Verification does not require full-lifetime broad audits
- [ ] npm run typecheck passes
- [ ] Relevant merchant-focused tests pass

### US-006: Produce Stage Closure And Next-Step Boundary
**Description:** As a maintainer, I want a closure report stating what P97 proves and what remains deferred.

**Acceptance Criteria:**
- [ ] Save a closure report under `docs/test-reports/`
- [ ] State what was added at magnate native entry
- [ ] State what remains deferred (magnate pressure/payoff native differentiation, martial patron, full empire)
- [ ] Explicitly say this stage does not implement merchant_martial_patron or full magnate rewrite
- [ ] Name the next bounded candidate stage after this one

## 6. Functional Requirements

1. FR-1: Native merchant_house magnate entry must read P95/P96 track or expansion flags.
2. FR-2: Ledger vs caravan must produce distinguishable magnate entry outcomes or expression.
3. FR-3: P55 magnate skeleton and P63/P64 bridge differentiation must not regress.
4. FR-4: New wiring must reuse existing merchant route state model; no new progression container.
5. FR-5: Stage remains bounded to magnate on-ramp entry; no silent generalization to other routes.

## 7. Design Considerations

- ledger magnate 入口：稳扩积势、守信誉跨门槛、控债务再做大
- caravan magnate 入口：赌市扩货跨门槛、押行市、快周转换规模
- 调性：「店业已立，第一次认真跨巨贾门槛」而非 empire 终局
- 优先窄 spine/expression 接线，不改 scheduler 平台

## 8. Success Metrics

- native merchant_house ledger/caravan 各有一条 magnate 入口可玩样本
- replay age 28–32 checkpoint 能体现经营 track 差异
- P55/P63/P64/P96 回归不退化
- 不引入新的系统级复杂度

## 9. Open Questions

- 分化落在 `magnate_on_ramp` content 分支还是新增轻量 flag marker
- native track marker 是否需要在 `magnate_midlife_pressure` 预读（P97 仅做最小接线时 defer 到后续 stage）

## 10. Out-Of-Scope Follow-Up

1. Native path `magnate_midlife_pressure` / `magnate_payoff` 完整分化（P64 已覆盖 bridge；native 中后段留给 P98+）
2. `merchant_martial_patron` 跨路线桥接
3. merchant 40+ empire / ending 全图谱重写
4. North Star §8 Wave 4 扩展

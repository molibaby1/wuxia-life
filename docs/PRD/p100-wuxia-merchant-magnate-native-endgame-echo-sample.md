# PRD: P100 Wuxia Merchant Magnate Native Endgame Echo Sample

> **Derived from:** `docs/PRD/p99-wuxia-merchant-magnate-native-late-life-sample.md` (Discovery pass 2026-07-02)
> **Stage slug:** `p100-wuxia-merchant-magnate-native-endgame-echo-sample`
> **Gaps addressed:** GAP-P99-N01, GAP-P99-V01
> **Stage type:** bounded native-path magnate post-late-life endgame echo, not full empire rewrite

## 1. Introduction

P99 已让 native `merchant_house` 的 P97 entry + P98 payoff markers 在 post-payoff late-life（ages 48–56）产生可读、可验证的 ledger vs caravan 分化，且 P55 骨架与 P63/P64 bridge 不退化。

但 P99 止于 `magnate_late_life_done` checkpoint；native magnate 链仍缺 **bounded endgame echo / final legacy** 样本，Wave 3 `merchant_magnate` 链未在叙事上闭合。同时 verify 发现 P50 `guard:sample-lines-baseline` 在 seed 301 orthodox age-25 goal 回归失败，需在本 stage 首条修复故事中处理。

本阶段只解决两个窄缺口：

1. **让 native ledger/caravan 的 P99 late-life markers 在 endgame echo 带产生可读、可验证的差异化终局回响样本**
2. **修复 P50/P49 sample-line guard 回归，确保 orthodox 路线 age-25 goal 不被 merchant 表达 tier 污染**

不重做 P97/P98/P99 magnate 链，不进入 `merchant_martial_patron`，不扩 North Star §8 全谱或 full empire ending 图谱。

## 2. Goals

- 审计 post-`magnate_late_life_done` endgame flattening，明确 echo 接线面
- 定义 bounded endgame scope contract（single echo event + native ledger/caravan branches，参照 P93 medical endgame lightweight 模式）
- 新增或接线 `magnate_endgame_echo`（或等价 narrow event ID）读取 P99 late-life markers
- 让 ledger vs caravan 在 endgame 呈现至少两组可读 player-facing 差异
- 修复 P50 guard regression（seed 301 orthodox age-25 goal alignment）
- 保持 P55 on-ramp → pressure → payoff → late-life → endgame 主链可通；P63/P64 bridge 表达不退化
- 以窄 proof + 回归测试闭合本 stage

## 3. Non-Goals

- 不重做 P97/P98/P99 magnate entry/mid/late wiring
- 不重做 P64 bridge endgame 分化（bridge endgame 可 defer）
- 不实现 `merchant_martial_patron` 跨路线桥接
- 不做 merchant full empire graph 或 multi-event endgame arc
- 不新建 economy / trade-platform / 第二套经营容器
- 不做 full-lifetime `gate:p20` broad rerun
- 不新增独立 UI 面板
- 不一次性实现 North Star §8 全谱

## 4. Core Product Decision

沿用已确认主链：

`P97 magnate 入口 → P98 magnate 中后段 → P99 magnate 晚年样本 → P100 magnate 终局回响 → P55 magnate 骨架收束`

在 endgame 具体化为：

1. native 玩家已携带 P99 `magnate_native_late_*` markers（或 P98 payoff / P97 entry fallback）
2. post-late-life echo event 读取上述 markers，输出 ledger/caravan 差异化 framing 与 checkpoint flags
3. bridge-origin 玩家仍走 generic 或 P64-priority 表达
4. endgame 为 lightweight echo（参照 P93：primarily narrative + expression，minimal stat change）
5. 分化结果喂入既有 P55 spine 架构，不替换 prior event IDs

## 5. User Stories

### US-001: Fix P50 Sample-Line Guard Regression

**Description:** As a maintainer, I want the P50/P49 sample-line guard passing so merchant expression tiers do not bleed into orthodox route goals.

**Acceptance Criteria:**

- [ ] `npm run guard:sample-lines-baseline` passes (includes p49SampleLineReplayTests seed 301 orthodox age-25 goal)
- [ ] Root cause documented: which expression tier/hook caused orthodox misalignment
- [ ] Fix scoped to expression guard/branching; no unrelated scheduler rewrite
- [ ] P97/P98/P99 merchant tests still pass
- [ ] `npm run typecheck` passes

### US-002: Audit Native Magnate Post-Late-Life Endgame Gap

**Description:** As a maintainer, I want the post-late-life endgame flattening gap documented so P100 targets the P99 late-life → endgame discontinuity.

**Acceptance Criteria:**

- [ ] Document magnate spine terminus after `magnate_late_life_done` and available endgame hooks
- [ ] Explicitly identify where P99 late-life markers are not consumed downstream
- [ ] Distinguish native track endgame target from bridge-origin defer scope
- [ ] Save one bounded report under `docs/test-reports/`
- [ ] No runtime behavior change in this story beyond US-001 fix

### US-003: Lock Native Magnate Endgame Scope Contract

**Description:** As a planner, I want a scope contract so P100 stays a bounded endgame echo and does not sprawl into full empire rewrite.

**Acceptance Criteria:**

- [ ] Define single endgame echo event band (recommended age 58–65) and checkpoint flags
- [ ] Define allowed surfaces: spine wiring, expression, narrow proof
- [ ] Define forbidden items: full empire graph, martial patron, bridge endgame rewrite, new UI, heavy stat changes
- [ ] Save scope contract under `docs/test-reports/`
- [ ] `npm run typecheck` passes

### US-004: Wire Native Late-Life Lineage Into Magnate Endgame Echo

**Description:** As a player, I want my ledger or caravan magnate late-life personality to carry into endgame so identity does not reset after age 56.

**Acceptance Criteria:**

- [ ] Endgame echo event reads P99 late-life markers or P98/P97 fallback for native merchant_house path
- [ ] Ledger and caravan produce different player-facing text, condition branch, or downstream marker
- [ ] Change sets at least one endgame checkpoint flag beyond flavor-only text
- [ ] P55 magnate chain through late-life remains reachable; endgame is additive
- [ ] P63/P64 bridge-origin paths do not regress
- [ ] `npm run typecheck` passes

### US-005: Strengthen Native Endgame Expression

**Description:** As a player, I want endgame goals and burden labels to reflect my native operating track through the magnate arc.

**Acceptance Criteria:**

- [ ] Add or refine at least two player-facing expression pairs for native ledger vs caravan at endgame
- [ ] At least one expression reads P99 late-life or P98 payoff markers
- [ ] Bridge-origin expressions retain priority when bridge markers are set
- [ ] Identity hooks reflect native track at endgame checkpoint when applicable
- [ ] `npm run typecheck` passes

### US-006: Add Narrow Proof And Stage Closure

**Description:** As a maintainer, I want proof, tests, and a closure report for native magnate endgame differentiation.

**Acceptance Criteria:**

- [ ] Add focused test covering ledger and caravan native paths through endgame checkpoint
- [ ] Produce proof artifact under `docs/test-reports/`
- [ ] Save closure report stating what P100 proves and what remains deferred
- [ ] `npm run typecheck` passes
- [ ] P97/P98/P99 merchant tests pass
- [ ] `npm run guard:sample-lines-baseline` passes

## 6. Success Metrics

- native merchant_house ledger/caravan 各有一条 magnate late-life→endgame echo 可玩样本
- P50 guard regression resolved
- P55/P63/P64/P97/P98/P99 回归不退化
- 不引入新的系统级复杂度

## 7. Open Questions

- endgame 用 single auto echo with branches 还是 choice event（P93 auto echo 模式优先）
- 是否需读取 late-life choice outcome（P100 做最小接线时优先 marker 链）

## 8. Out-Of-Scope Follow-Up

1. Bridge-origin magnate endgame differentiation
2. `merchant_martial_patron` cross-route bridge
3. Full merchant empire ending graph
4. North Star §8 Wave 1/2/4 broader waves
5. Full-lifetime simulation `gate:p20` broad rerun

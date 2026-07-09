# PRD: P101 Wuxia Merchant Magnate Bridge-Origin Endgame Differentiation

> **Derived from:** `docs/PRD/p100-wuxia-merchant-magnate-native-endgame-echo-sample.md` (Discovery pass 2026-07-02)
> **Stage slug:** `p101-wuxia-merchant-magnate-bridge-origin-endgame-differentiation`
> **Gaps addressed:** GAP-P100-N01
> **Stage type:** bounded bridge-origin magnate post-late-life endgame echo differentiation, not full empire rewrite

## 1. Introduction

P100 已让 native `merchant_house` 的 P99 late-life markers 在 post-late-life endgame echo（ages 58–65）产生可读、可验证的 ledger vs caravan 分化，且 P55 骨架与 P63/P64 bridge 不退化。

但 bridge-origin magnate 玩家（apprentice / tavern / peasant 经 P63 跨入 `merchant_house`）在 endgame 仍仅收到 P100 的 `magnate_endgame_echo_generic` fallback，无 origin-specific endgame echo 分支。Wave 3 `merchant_magnate` 链对 bridge 路径 narrative 仍未闭合。

本阶段只解决一个窄缺口：

**让 bridge-origin magnate 玩家在 endgame echo 带产生至少两条可区分、可验证的 origin-specific 回响样本（apprentice vs tavern vs peasant 中至少覆盖 2 条），且不 reopen P100 native wiring。**

不重做 P63/P64 bridge entry/mid/late wiring，不进入 `merchant_martial_patron`，不扩 North Star §8 全谱或 full empire ending 图谱。

## 2. Goals

- 审计 bridge-origin magnate post-`magnate_late_life_done` endgame flattening，明确 echo 接线面
- 定义 bounded bridge-origin endgame scope contract（origin-specific echo branches + generic fallback，参照 P100/P93 lightweight 模式）
- 新增或扩展 `magnate_endgame_echo_*` 读取 P63 bridge-origin markers（`apprentice_merchant_bridge_crossed`、`tavern_merchant_bridge_crossed`、`farm_peasant_merchant_bridge_crossed` 或等价 flags）
- 让至少两条 bridge origins 在 endgame 呈现可读 player-facing 差异（text / condition branch / downstream marker）
- 保持 P100 native ledger/caravan endgame 表达不退化；bridge 与 native 表达优先级规则显式
- 以窄 proof + 回归测试闭合本 stage

## 3. Non-Goals

- 不重做 P100 native endgame echo wiring
- 不重做 P63/P64 bridge entry / mid / late differentiation
- 不实现 bridge-origin **late-life** differentiation（P99 defer 范围）
- 不实现 `merchant_martial_patron` 跨路线桥接
- 不做 merchant full empire graph 或 multi-event endgame arc
- 不新建 economy / trade-platform / 第二套经营容器
- 不做 full-lifetime `gate:p20` broad rerun
- 不新增独立 UI 面板
- 不一次性实现 North Star §8 全谱

## 4. Core Product Decision

沿用已确认主链：

`P63 bridge entry → P64 bridge pressure/payoff → P99 generic late-life → P100 generic/native endgame → P101 bridge-origin endgame branches`

在 endgame 具体化为：

1. bridge-origin 玩家已携带 P63 `*_merchant_bridge_crossed` marker
2. post-late-life echo event 在 P100 generic fallback 之前或之中增加 origin-specific branches
3. native 玩家仍走 P100 ledger/caravan branches（bridge checks 不覆盖 native path）
4. endgame 为 lightweight echo（P93 模式：primarily narrative + expression，minimal stat change）
5. 分化结果喂入既有 P55 spine 架构，不替换 prior event IDs

## 5. User Stories

### US-001: Audit Bridge-Origin Magnate Endgame Gap

**Description:** As a maintainer, I want the bridge-origin post-late-life endgame flattening gap documented so P101 targets the P100 generic-fallback discontinuity.

**Acceptance Criteria:**

- [ ] Document magnate spine terminus for bridge-origin players after `magnate_late_life_done` and available endgame hooks
- [ ] Explicitly identify where P63 bridge markers are not consumed at endgame
- [ ] Distinguish bridge-origin endgame target from native P100 closed scope
- [ ] Save one bounded report under `docs/test-reports/`
- [ ] No runtime behavior change in this story
- [ ] `npm run typecheck` passes

### US-002: Lock Bridge-Origin Magnate Endgame Scope Contract

**Description:** As a planner, I want a scope contract so P101 stays a bounded bridge-origin endgame echo and does not sprawl into full empire rewrite.

**Acceptance Criteria:**

- [ ] Define origin-specific endgame echo event band (recommended age 58–65) and checkpoint flags
- [ ] Define allowed surfaces: spine wiring, expression, narrow proof
- [ ] Define forbidden items: native P100 rewrite, late-life rewrite, martial patron, new UI, heavy stat changes
- [ ] Save scope contract under `docs/test-reports/`
- [ ] `npm run typecheck` passes

### US-003: Wire Bridge-Origin Lineage Into Magnate Endgame Echo

**Description:** As a player, I want my apprentice/tavern/peasant bridge origin to carry into endgame so identity does not flatten to generic magnate text after age 56.

**Acceptance Criteria:**

- [ ] Endgame echo events read P63 bridge-origin markers for at least 2 origins (apprentice, tavern, peasant)
- [ ] Each covered origin produces different player-facing text, condition branch, or downstream marker
- [ ] Change sets at least one endgame checkpoint flag beyond flavor-only text
- [ ] P100 native ledger/caravan endgame branches remain reachable and unchanged
- [ ] P63/P64 bridge mid/late paths do not regress
- [ ] `npm run typecheck` passes

### US-004: Strengthen Bridge-Origin Endgame Expression

**Description:** As a player, I want endgame goals and burden labels to reflect my bridge origin through the magnate arc.

**Acceptance Criteria:**

- [ ] Add or refine at least two player-facing expression pairs for bridge origins at endgame
- [ ] At least one expression reads P63 bridge-origin markers
- [ ] Native P100 expressions retain priority when native late-life markers are set
- [ ] Identity hooks reflect bridge origin at endgame checkpoint when applicable
- [ ] `npm run typecheck` passes

### US-005: Add Narrow Proof And Stage Closure

**Description:** As a maintainer, I want proof, tests, and a closure report for bridge-origin magnate endgame differentiation.

**Acceptance Criteria:**

- [ ] Add focused test covering at least 2 bridge-origin paths through endgame checkpoint
- [ ] Produce proof artifact under `docs/test-reports/`
- [ ] Save closure report stating what P101 proves and what remains deferred
- [ ] `npm run typecheck` passes
- [ ] P100 native endgame tests pass (no regression)
- [ ] P63/P64 bridge tests pass (no regression)

## 6. Success Metrics

- bridge-origin magnate 至少 2 条 origin 各有一条 late-life→endgame echo 可玩样本
- P100 native endgame / P63/P64 bridge 回归不退化
- 不引入新的系统级复杂度

## 7. Open Questions

- endgame 用扩展现有 `magnate_endgame_echo_*` conditions 还是新增 origin-specific event IDs（P100 auto echo 模式优先扩展 conditions）
- peasant bridge 是否纳入首批 2 条 origin（P63 证据强度：apprentice/tavern 优先）

## 8. Out-Of-Scope Follow-Up

1. `merchant_martial_patron` cross-route bridge（P102 candidate per P100 closure）
2. Bridge-origin magnate **late-life** differentiation
3. Full merchant empire ending graph
4. North Star §8 Wave 1/2/4 broader waves
5. Full-lifetime simulation `gate:p20` broad rerun

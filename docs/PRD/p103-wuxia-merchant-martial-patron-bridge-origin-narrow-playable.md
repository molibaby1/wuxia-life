# PRD: P103 Wuxia Merchant Martial Patron Bridge-Origin (Narrow Playable)

> **Derived from:** `docs/PRD/p102-wuxia-merchant-martial-patron-bridge-narrow-playable.md` (Discovery pass 2026-07-02)
> **Stage slug:** `p103-wuxia-merchant-martial-patron-bridge-origin-narrow-playable`
> **Gaps addressed:** GAP-P102-N01
> **Stage type:** bounded bridge-origin patron entry for Wave 3 `merchant_martial_patron`, not magnate spine rewrite

## 1. Introduction

P102 已让 native `merchant_house` 的 wealth+invest 路径经 bounded bridge 进入 `merchant_martial_patron` 可玩样本（`merchant_patron_bridge_entry` + payoff echo + expression differentiation），且 P55/P97–P101 magnate 主链不退化。

但 bridge-origin 玩家（apprentice / tavern / peasant 经 P63 跨入 merchant 轨道）仍无法进入 patron bridge：P102 entry gate 依赖 `route_wealth_committed` + `merchant_invest_*`，与 P63 bridge markers 未接线。Wave 3 `merchant_martial_patron` 对平凡出身路径 narrative 仍未闭合。

本阶段只解决一个窄缺口：

**让至少两条 bridge-origin 路径（apprentice / tavern / peasant 中 ≥2）经 bounded patron bridge entry 进入 `merchant_martial_patron` checkpoint，且与 P102 native wealth path 在 player-facing 表达上可区分，不重 open P102 native wiring 或 magnate spine。**

不重做 P63/P64 magnate bridge wiring，不实现 full patron pressure/mid/late chain，不扩 North Star §8 全谱。

## 2. Goals

- 审计 bridge-origin → patron bridge 缺口，明确 P63 markers 与 P102 entry gate 的接线面
- 定义 bounded bridge-origin patron scope contract（origin-specific entry branches + native fallback）
- 扩展 patron bridge entry 读取 P63 bridge-origin markers（`apprentice_merchant_bridge_crossed`、`tavern_merchant_bridge_crossed`、`farm_peasant_merchant_bridge_crossed` 或等价 flags）
- 让至少两条 bridge origins 在 patron entry 呈现可读 player-facing 差异（text / condition branch / downstream marker）
- 保持 P102 native wealth+invest patron path 不退化；bridge 与 native entry 优先级规则显式
- 以窄 proof + 回归测试闭合本 stage

## 3. Non-Goals

- 不重做 P102 native patron bridge wiring
- 不重做 P63/P64 magnate bridge entry / mid / late differentiation
- 不 reopen P55/P97–P101 `merchant_magnate` 主链
- 不实现 full patron pressure/mid/late chain
- 不实现 full Wave 3 mixed-achievement 全谱
- 不做 full-lifetime `gate:p20` broad rerun
- 不新建 economy / trade-platform / 第二套经营容器
- 不新增独立 UI 面板
- 不一次性实现 North Star §8 全谱

## 4. Core Product Decision

沿用 P102 已确认 patron 主链：

`P63 bridge entry → (wealth/invest OR bridge-origin markers) → merchant_patron_bridge_entry → merchant_patron_payoff_echo`

在 bridge-origin 具体化为：

1. bridge-origin 玩家已携带 P63 `*_merchant_bridge_crossed` marker 及等价 invest/commitment flags
2. `merchant_patron_bridge_entry` 增加 origin-specific condition branches 或 variant choices
3. native wealth+invest 玩家仍走 P102 entry gate（bridge checks 不覆盖 native path）
4. patron bridge 为 lightweight echo（P93 模式），非 magnate pressure 链
5. magnate 与 patron 表达优先级：magnate markers 优先（P102 规则延续）

## 5. User Stories

### US-001: Audit Bridge-Origin Patron Bridge Gap

**Description:** As a maintainer, I want the bridge-origin patron entry gap documented so P103 targets the P102 wealth-only gate discontinuity.

**Acceptance Criteria:**

- [ ] Document P102 patron bridge entry gate and where P63 bridge markers are not consumed
- [ ] Distinguish bridge-origin patron target from native P102 closed scope
- [ ] Identify prerequisite flags from P63/P102 evidence
- [ ] Save one bounded report under `docs/test-reports/`
- [ ] No runtime behavior change in this story
- [ ] `npm run typecheck` passes

### US-002: Lock Bridge-Origin Patron Bridge Scope Contract

**Description:** As a planner, I want a scope contract so P103 stays a bounded bridge-origin patron entry and does not sprawl into magnate rewrite.

**Acceptance Criteria:**

- [ ] Define origin-specific patron entry event band and checkpoint flags
- [ ] Define allowed surfaces: spine wiring, expression, narrow proof
- [ ] Define forbidden items: native P102 rewrite, magnate spine rewrite, full mixed graph, new UI, heavy stat changes
- [ ] State bridge-origin vs native entry priority rules
- [ ] Save scope contract under `docs/test-reports/`
- [ ] `npm run typecheck` passes

### US-003: Wire Bridge-Origin Lineage Into Patron Bridge Entry

**Description:** As a player, I want my apprentice/tavern/peasant bridge origin to open a patron path so mixed identity is playable from ordinary origins.

**Acceptance Criteria:**

- [ ] Patron bridge entry reads P63 bridge-origin markers for at least 2 origins
- [ ] Each covered origin produces different player-facing text, condition branch, or downstream marker
- [ ] Change sets at least one patron checkpoint flag beyond flavor-only text
- [ ] P102 native wealth+invest patron path remains reachable and unchanged
- [ ] P97–P101 magnate tests pass (no regression)
- [ ] `npm run typecheck` passes

### US-004: Strengthen Bridge-Origin Patron Expression

**Description:** As a player, I want patron goals and identity labels to reflect my bridge origin through the patron arc.

**Acceptance Criteria:**

- [ ] Add or refine at least two player-facing expression pairs for bridge-origin patron path
- [ ] At least one expression reads P63 bridge-origin markers
- [ ] Native P102 patron expressions retain priority when native wealth+invest markers are set
- [ ] Magnate expressions retain priority when magnate markers are set
- [ ] `npm run typecheck` passes

### US-005: Add Narrow Proof And Stage Closure

**Description:** As a maintainer, I want proof, tests, and a closure report for bridge-origin patron bridge differentiation.

**Acceptance Criteria:**

- [ ] Add focused test covering at least 2 bridge-origin paths through patron checkpoint
- [ ] Produce proof artifact under `docs/test-reports/`
- [ ] Save closure report stating what P103 proves and what remains deferred
- [ ] `npm run typecheck` passes
- [ ] P102 patron bridge tests pass (no regression)
- [ ] `npm run guard:sample-lines-baseline` passes

## 6. Success Metrics

- bridge-origin 至少 2 条 origin 各有一条 patron bridge entry 可玩样本
- P102 native patron / P97–P101 magnate 回归不退化
- 不引入新的系统级复杂度

## 7. Open Questions

- bridge-origin entry 用扩展 P102 `merchant_patron_bridge_entry` conditions 还是新增 origin-specific variant choices（优先扩展 conditions）
- peasant bridge 是否纳入首批 2 条 origin（P63 证据强度：apprentice/tavern 优先）

## 8. Out-Of-Scope Follow-Up

1. Full patron pressure/mid/late chain
2. Full Wave 3 mixed-achievement graph
3. North Star §8 Wave 1/2/4 broader waves
4. Full merchant empire ending graph
5. Full-lifetime simulation `gate:p20` broad rerun

# PRD: P104 Wuxia Merchant Martial Patron Bridge-Origin Peasant (Narrow Playable)

> **Derived from:** `docs/PRD/p103-wuxia-merchant-martial-patron-bridge-origin-narrow-playable.md` (Discovery pass 2026-07-02)
> **Stage slug:** `p104-wuxia-merchant-martial-patron-bridge-origin-peasant-narrow-playable`
> **Gaps addressed:** GAP-P103-N01
> **Stage type:** bounded third bridge-origin (peasant) patron entry for Wave 3 `merchant_martial_patron`, not magnate spine rewrite

## 1. Introduction

P103 closed bridge-origin patron entry for **apprentice** and **tavern** paths via P63 markers (`apprentice_merchant_bridge_crossed`, `tavern_merchant_bridge_crossed`) with distinct checkpoint flags and expression. P102 native wealth+invest path and P97–P101 magnate spine remain non-regressed.

**Peasant** bridge-origin players (`farm_peasant` via P60 → `peasant_merchant_bridge_crossed`) still cannot enter the patron bridge: P103 explicitly deferred peasant wiring. Magnate spine already consumes `peasant_merchant_bridge_crossed` at `magnate_on_ramp`; patron entry does not. Wave 3 `merchant_martial_patron` narrative remains incomplete for the third ordinary-origin bridge.

本阶段只解决一个窄缺口：

**让 peasant bridge-origin 路径经 bounded patron bridge entry 进入 `merchant_martial_patron` checkpoint，与 P103 apprentice/tavern 及 P102 native path 在 player-facing 表达上可区分，不重 open P102/P103 wiring 或 magnate spine。**

不重做 P63/P64 magnate bridge wiring，不实现 full patron pressure/mid/late chain，不扩 North Star §8 全谱。

## 2. Goals

- 审计 peasant bridge-origin → patron bridge 缺口，明确 P60 marker 与 P103 entry gate 的接线面
- 定义 bounded peasant patron scope contract（origin-specific entry branch + native/bridge priority）
- 扩展 patron bridge entry 读取 `peasant_merchant_bridge_crossed`（或等价 flag）
- 让 peasant bridge-origin 在 patron entry 呈现可读 player-facing 差异（text / condition branch / downstream marker）
- 保持 P102 native、P103 apprentice/tavern、P97–P101 magnate 路径不退化；优先级规则显式
- 以窄 proof + 回归测试闭合本 stage

## 3. Non-Goals

- 不重做 P102 native patron bridge wiring
- 不重做 P103 apprentice/tavern bridge-origin wiring
- 不重做 P63/P64 magnate bridge entry / mid / late differentiation
- 不 reopen P55/P97–P101 `merchant_magnate` 主链
- 不实现 full patron pressure/mid/late chain
- 不实现 full Wave 3 mixed-achievement 全谱
- 不做 full-lifetime `gate:p20` broad rerun
- 不新建 economy / trade-platform / 第二套经营容器
- 不新增独立 UI 面板
- 不一次性实现 North Star §8 全谱

## 4. Core Product Decision

沿用 P102/P103 已确认 patron 主链：

`P60 peasant bridge → (wealth OR bridge marker) → merchant_patron_bridge_entry → merchant_patron_payoff_echo`

Peasant 具体化：

1. peasant bridge-origin 玩家已携带 `peasant_merchant_bridge_crossed` 及 `route_wealth_committed`
2. `merchant_patron_bridge_entry` 增加 peasant-specific condition branch 或 variant choice
3. native wealth+invest 与 P103 apprentice/tavern 路径保留既有 gate arms（不覆盖）
4. patron bridge 仍为 lightweight echo（P93 模式）
5. magnate > native invest > bridge-origin 表达优先级延续 P103 规则

## 5. User Stories

### US-001: Audit Peasant Bridge-Origin Patron Gap

**Description:** As a maintainer, I want the peasant bridge-origin patron entry gap documented so P104 targets the P103 peasant deferral.

**Acceptance Criteria:**

- [ ] Document P103 patron bridge entry gate and where `peasant_merchant_bridge_crossed` is not consumed
- [ ] Distinguish peasant patron target from P103 apprentice/tavern closed scope
- [ ] Identify prerequisite flags from P60/P103 evidence
- [ ] Save one bounded report under `docs/test-reports/`
- [ ] No runtime behavior change in this story
- [ ] `npm run typecheck` passes

### US-002: Lock Peasant Patron Bridge Scope Contract

**Description:** As a planner, I want a scope contract so P104 stays a bounded peasant patron entry and does not sprawl.

**Acceptance Criteria:**

- [ ] Define peasant-specific patron entry event band and checkpoint flags
- [ ] Define allowed surfaces: spine wiring, expression, narrow proof
- [ ] Define forbidden items: P102/P103 rewrite, magnate spine rewrite, full mixed graph, new UI, heavy stat changes
- [ ] State peasant vs apprentice/tavern vs native entry priority rules
- [ ] Save scope contract under `docs/test-reports/`
- [ ] `npm run typecheck` passes

### US-003: Wire Peasant Bridge-Origin Into Patron Bridge Entry

**Description:** As a player, I want my farm-peasant bridge origin to open a patron path so the third ordinary bridge origin is playable.

**Acceptance Criteria:**

- [ ] Patron bridge entry reads `peasant_merchant_bridge_crossed` (or equivalent)
- [ ] Peasant path produces distinct player-facing text, condition branch, or downstream marker vs apprentice/tavern
- [ ] Change sets at least one peasant-specific patron checkpoint flag beyond flavor-only text
- [ ] P102 native and P103 apprentice/tavern patron paths remain reachable and unchanged
- [ ] P97–P101 magnate tests pass (no regression)
- [ ] `npm run typecheck` passes

### US-004: Strengthen Peasant Bridge-Origin Patron Expression

**Description:** As a player, I want patron goals and identity labels to reflect my peasant bridge origin.

**Acceptance Criteria:**

- [ ] Add or refine at least one player-facing expression pair for peasant bridge-origin patron path
- [ ] Expression reads `peasant_merchant_bridge_crossed` or peasant checkpoint flag
- [ ] Native P102 and P103 bridge expressions retain priority when their markers are set
- [ ] Magnate expressions retain priority when magnate markers are set
- [ ] `npm run typecheck` passes

### US-005: Add Narrow Proof And Stage Closure

**Description:** As a maintainer, I want proof, tests, and a closure report for peasant bridge-origin patron differentiation.

**Acceptance Criteria:**

- [ ] Add focused test covering peasant bridge-origin path through patron checkpoint
- [ ] Produce proof artifact under `docs/test-reports/`
- [ ] Save closure report stating what P104 proves and what remains deferred
- [ ] `npm run typecheck` passes
- [ ] P102 and P103 patron bridge tests pass (no regression)
- [ ] `npm run guard:sample-lines-baseline` passes

## 6. Success Metrics

- peasant bridge-origin 有一条 patron bridge entry 可玩样本
- P102/P103 patron / P97–P101 magnate 回归不退化
- 不引入新的系统级复杂度

## 7. Open Questions

- peasant entry 用扩展 `merchant_patron_bridge_entry` conditions 还是新增 peasant variant choice（优先扩展 conditions，对齐 P103）
- peasant checkpoint flag 命名：`merchant_patron_bridge_peasant_*` vs 复用 generic bridge flag

## 8. Out-Of-Scope Follow-Up

1. Full patron pressure/mid/late chain
2. Full Wave 3 mixed-achievement graph
3. North Star §8 Wave 1/2/4 broader waves
4. Full merchant empire ending graph
5. Full-lifetime simulation `gate:p20` broad rerun

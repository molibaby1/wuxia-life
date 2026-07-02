# PRD: P102 Wuxia Merchant Martial Patron Bridge (Narrow Playable)

> **Derived from:** `docs/PRD/p101-wuxia-merchant-magnate-bridge-origin-endgame-differentiation.md` (Discovery pass 2026-07-02)
> **Stage slug:** `p102-wuxia-merchant-martial-patron-bridge-narrow-playable`
> **Gaps addressed:** GAP-P101-N01
> **Stage type:** bounded cross-route bridge for Wave 3 `merchant_martial_patron`, not magnate spine rewrite

## 1. Introduction

P97–P101 closed the native and bridge-origin `merchant_magnate` spine through endgame echo. Wave 3 mixed achievement `merchant_martial_patron` (商武一体) still lacks a **playable cross-route bridge** from martial/wealth commitment into a distinguishable patron payoff path — it remains traceability/config-level only (P37 parity traces, achievement flags) without a bounded sample-line or spine bridge comparable to P63 ordinary→magnate entry.

本阶段只解决一个窄缺口：

**让至少一条 martial/wealth 起源路径经 bounded bridge 进入 `merchant_martial_patron` 可玩样本（entry hook + checkpoint + player-facing differentiation），且不 reopen P55/P97–P101 magnate 主链。**

不重做 magnate on-ramp/pressure/payoff/late-life/endgame，不实现 full Wave 3 mixed-achievement 全谱，不扩 North Star §8 Wave 1/2/4 广域目标。

## 2. Goals

- 审计 `merchant_martial_patron` 现有 config/traceability 与 sample-line/spine 接线面，明确 bridge 缺口
- 定义 bounded patron-bridge scope contract（allowed surfaces vs magnate spine forbidden zone）
- 新增或扩展 **一条** cross-route bridge entry（读取既有 wealth/martial flags 如 `route_wealth_committed` / `p22_wealth_route_forked` / `merchant_invest_*`）通向 patron checkpoint
- 让 bridge 路径与 generic merchant success / magnate path 在至少 **两组** player-facing 表达上可区分
- 保持 P55 magnate 骨架与 P97–P101 native/bridge endgame **不退化**
- 以窄 proof + 回归测试闭合本 stage

## 3. Non-Goals

- 不重做 P55/P97–P101 `merchant_magnate` 主链（on-ramp → endgame）
- 不实现 full merchant empire graph 或多事件 patron arc
- 不一次性闭合 North Star §8 全五项
- 不做 full-lifetime `gate:p20` broad rerun
- 不新建 economy / trade-platform / 第二套经营容器
- 不新增独立 UI 面板
- 不重做 P63/P64 ordinary-bridge magnate entry

## 4. Core Product Decision

沿用 P55 gap audit 区分：

| Payoff | Focus |
| ------ | ----- |
| `merchant_martial_patron` | 武力投资 + 门派关系 + 商武复合身份 |
| `merchant_magnate` | 财富规模 + 经营负担（P97–P101 已闭合） |

Bridge 具体化：

1. patron bridge 从 martial/wealth 既有 flags 分叉，**不**复用 magnate_on_ramp 条件
2. 到达 patron checkpoint 后走 lightweight payoff/echo（P93 模式），非 magnate pressure 链
3. magnate 与 patron 路径互斥或并存规则在 scope contract 显式声明
4. 证据链对齐 P37 `merchant_martial_patron` mixed achievement traceability

## 5. User Stories

### US-001: Audit Merchant Martial Patron Bridge Gap

**Description:** As a maintainer, I want the patron cross-route bridge gap documented so P102 targets the right wiring surface.

**Acceptance Criteria:**

- [ ] Document existing `merchant_martial_patron` achievement/traceability assets and missing spine/sample-line hooks
- [ ] Distinguish patron bridge target from magnate spine (P55/P97–P101) closed scope
- [ ] Identify prerequisite flags from P22/P37 evidence (`route_wealth_committed`, `merchant_invest_*`, etc.)
- [ ] Save one bounded report under `docs/test-reports/`
- [ ] No runtime behavior change in this story
- [ ] `npm run typecheck` passes

### US-002: Lock Merchant Martial Patron Bridge Scope Contract

**Description:** As a planner, I want a scope contract so P102 stays a bounded patron bridge and does not sprawl into magnate rewrite.

**Acceptance Criteria:**

- [ ] Define patron bridge event band, entry checkpoint, and terminal checkpoint flags
- [ ] Define allowed surfaces: spine wiring, expression, narrow proof
- [ ] Define forbidden items: magnate spine rewrite, full mixed-achievement graph, new UI, heavy stat changes
- [ ] State magnate vs patron path priority / mutual-exclusion rules
- [ ] Save scope contract under `docs/test-reports/`
- [ ] `npm run typecheck` passes

### US-003: Wire Cross-Route Patron Bridge Entry

**Description:** As a player, I want my martial/wealth commitment to open a patron path so mixed identity is playable before endgame.

**Acceptance Criteria:**

- [ ] Bridge entry reads at least one existing wealth/martial commitment flag
- [ ] Bridge sets at least one patron checkpoint flag beyond flavor-only text
- [ ] Player-facing text or condition branch differs from generic merchant success and magnate on-ramp
- [ ] P97–P101 magnate tests pass (no regression)
- [ ] `npm run typecheck` passes

### US-004: Strengthen Patron Bridge Expression

**Description:** As a player, I want patron goals and identity labels to reflect商武一体 through the bridge arc.

**Acceptance Criteria:**

- [ ] Add or refine at least two player-facing expression pairs for patron bridge path
- [ ] At least one expression reads patron bridge checkpoint flags
- [ ] Magnate expressions retain priority when magnate markers are set
- [ ] `npm run typecheck` passes

### US-005: Add Narrow Proof And Stage Closure

**Description:** As a maintainer, I want proof, tests, and a closure report for the patron bridge stage.

**Acceptance Criteria:**

- [ ] Add focused test covering at least one patron bridge path through checkpoint
- [ ] Produce proof artifact under `docs/test-reports/`
- [ ] Save closure report stating what P102 proves and what remains deferred
- [ ] `npm run typecheck` passes
- [ ] P101 bridge-origin endgame tests pass (no regression)
- [ ] `npm run guard:sample-lines-baseline` passes

## 6. Success Metrics

- 至少一条 martial/wealth → `merchant_martial_patron` bridge 可玩样本
- P55 magnate + P97–P101 回归不退化
- 不引入新的系统级复杂度

## 7. Open Questions

- patron bridge 挂在 sample-line spine 还是 achievement unlock 旁路（优先最小 spine hook）
- 是否与 magnate path 互斥或允许 late fork（scope contract 决策）

## 8. Out-Of-Scope Follow-Up

1. Full Wave 3 mixed-achievement graph（医武双绝等）
2. North Star §8 Wave 1/2/4 broader waves
3. Bridge-origin magnate late-life differentiation
4. Full merchant empire ending graph
5. Full-lifetime simulation `gate:p20` broad rerun

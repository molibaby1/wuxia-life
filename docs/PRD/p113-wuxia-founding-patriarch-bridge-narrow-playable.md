# PRD: P113 Wuxia Founding Patriarch Bridge (Narrow Playable)

> **Derived from:** `docs/PRD/p112-wuxia-merchant-martial-patron-endgame-playable-implementation.md` (Discovery pass 2026-07-02)
> **Stage slug:** `p113-wuxia-founding-patriarch-bridge-narrow-playable`
> **Gaps addressed:** GAP-P112-N01, GAP-NS8-02
> **Stage type:** bounded cross-route bridge for Wave 2 pinnacle `founding_patriarch`, not full faction graph rewrite

## 1. Introduction

P112 closed the `merchant_martial_patron` playable sample-lines spine through endgame echo (bridge → entry → on-ramp → pressure → payoff → late-life → endgame). North Star §8 item 1 remains **Partial** because pinnacle achievement `founding_patriarch` (开派祖师) still has only a P37 habit-led lifetime sim trace — no bounded playable cross-route bridge into sample-lines/spine comparable to P102 for patron or P63 for magnate.

本阶段只解决一个窄缺口：

**让至少一条 scholar/faction 起源路径经 bounded bridge 进入 `founding_patriarch` 可玩样本（entry hook + checkpoint + player-facing differentiation），且不 reopen P35/P37 pinnacle lifetime evidence 或 full faction empire graph。**

不重做 P37 lifetime trace、不实现 full pinnacle content wave、不扩 North Star §8 Wave 1/2/4 广域目标。

## 2. Goals

- 审计 `founding_patriarch` 现有 config/traceability 与 sample-line/spine 接线面，明确 bridge 缺口
- 定义 bounded founding-patriarch bridge scope contract（allowed surfaces vs full faction graph forbidden zone）
- 新增或扩展 **一条** cross-route bridge entry（读取既有 scholar/faction flags 如 `scholar_mentor_line` / `p22_faction_sect_continuation` / alliance broker flags）通向 founding-patriarch checkpoint
- 让 bridge 路径与 generic orthodox success / renown path 在至少 **两组** player-facing 表达上可区分
- 保持 P35/P37 pinnacle lifetime traces 与 P102–P112 patron spine **不退化**
- 以窄 proof + 回归测试闭合本 stage

## 3. Non-Goals

- 不重做 P37 `founding_patriarch` habit-led lifetime sim trace
- 不实现 full faction empire graph 或多事件 pinnacle arc
- 不一次性闭合 North Star §8 全五项
- 不做 full-lifetime `gate:p20` broad rerun
- 不新建 scheduler / 第二套门派容器
- 不新增独立 UI 面板
- 不 reopen `merchant_martial_patron` P102–P112 spine

## 4. Core Product Decision

沿用 P37 audit 区分：

| Payoff | Focus |
| ------ | ----- |
| `founding_patriarch` | 门派延续 + 学者/社交 on-ramp + alliance broker 双门槛 |
| `jianghu_myth_legend` | 稀有线 + Guardian oath（P35 已闭合 lifetime trace） |

Bridge 具体化：

1. founding-patriarch bridge 从 scholar/faction 既有 flags 分叉，**不**复用 renown endgame 条件
2. 到达 founding-patriarch checkpoint 后走 lightweight payoff/echo（P93 模式），非 full faction pressure 链
3. 与 patron/magnate 路径互斥或并存规则在 scope contract 显式声明
4. 证据链对齐 P37 `founding_patriarch` pinnacle achievement traceability

## 5. User Stories

### US-001: Audit Founding Patriarch Bridge Gap

**Description:** As a maintainer, I want the founding-patriarch cross-route bridge gap documented so P113 targets the right wiring surface.

**Acceptance Criteria:**

- [ ] Document existing `founding_patriarch` achievement/traceability assets and missing spine/sample-line hooks
- [ ] Distinguish founding-patriarch bridge target from renown endgame (P79–P81) and myth-legend pinnacle (P35)
- [ ] Identify prerequisite flags from P22/P37 evidence (`scholar_mentor_line`, `p22_faction_sect_continuation`, etc.)
- [ ] Save one bounded report under `docs/test-reports/`
- [ ] No runtime behavior change in this story
- [ ] Typecheck passes

### US-002: Lock Founding Patriarch Bridge Scope Contract

**Description:** As a planner, I want a scope contract so P113 stays a bounded pinnacle bridge and does not sprawl into faction rewrite.

**Acceptance Criteria:**

- [ ] Define founding-patriarch bridge event band, entry checkpoint, and terminal checkpoint flags
- [ ] Define allowed surfaces: spine wiring, expression, narrow proof
- [ ] Define forbidden items: full faction graph rewrite, new UI, heavy stat changes, patron/magnate spine reopen
- [ ] State founding-patriarch vs renown vs patron path priority / mutual-exclusion rules
- [ ] Save scope contract under `docs/test-reports/`
- [ ] Typecheck passes

### US-003: Wire Cross-Route Founding Patriarch Bridge Entry

**Description:** As a player, I want my scholar/faction commitment to open a founding-patriarch path so pinnacle identity is playable before endgame.

**Acceptance Criteria:**

- [ ] Bridge entry reads at least one existing scholar/faction commitment flag
- [ ] Bridge sets at least one founding-patriarch checkpoint flag beyond flavor-only text
- [ ] Player-facing text or condition branch differs from generic orthodox success and renown on-ramp
- [ ] P102–P112 patron tests pass (no regression)
- [ ] P37 additional mixed/pinnacle parity tests pass (no regression)
- [ ] Typecheck passes

### US-004: Add Bridge Path Expression Differentiation

**Description:** As a player, I want the founding-patriarch bridge path to feel distinct from renown and generic orthodox routes.

**Acceptance Criteria:**

- [ ] At least 2 player-facing expression signals differ from renown on-ramp and generic orthodox success (cost label and/or current goal)
- [ ] Expression preserves founding-patriarch / 开派祖师 flavor (门派延续、学者线、盟约)
- [ ] No new UI components
- [ ] Typecheck passes

### US-005: Add Narrow Regression Coverage

**Description:** As a maintainer, I want narrow tests guarding the founding-patriarch bridge so future edits do not break the entry milestone.

**Acceptance Criteria:**

- [ ] Add `tests/p113FoundingPatriarchBridgeTests.ts`
- [ ] Assert bridge entry wiring, checkpoint flags, and expression differentiation
- [ ] Prior stage regression: P37 parity + P102–P112 patron + `guard:sample-lines-baseline`
- [ ] Typecheck passes

### US-006: Produce P113 Closure Report

**Description:** As a maintainer, I want a closure report that locks the founding-patriarch bridge implementation and lists deferred larger pinnacle-expansion items.

**Acceptance Criteria:**

- [ ] Output `docs/test-reports/p113-founding-patriarch-bridge-closure-report.md`
- [ ] Summarize gap audit, scope contract, bridge wiring, expression, regression results
- [ ] List deferred larger pinnacle-expansion items
- [ ] Confirm P37/P102–P112 no regressions
- [ ] Typecheck passes

## 6. Success Criteria

- Founding-patriarch bridge entry correctly reads scholar/faction flags and sets checkpoint
- Player-facing differentiation from renown / generic orthodox
- P37 + P102–P112 no regressions
- Typecheck passes
- Narrow proof + regression tests pass
- Closure report produced

## 7. Dependencies / Context

- P112 closure: `docs/test-reports/p112-merchant-martial-patron-endgame-closure-report.md`
- P37 pinnacle trace: `docs/test-reports/p37-pinnacle-founding-patriarch-lifetime-trace.md`
- P37 audit: `docs/test-reports/p37-additional-outcome-audit-delta.md`
- P102 bridge precedent: `docs/PRD/p102-wuxia-merchant-martial-patron-bridge-narrow-playable.md`
- North Star: `docs/designs/p25-lifetime-simulation-north-star.md` §8

## 8. Open Questions

- Which ordinary-origin bridge (if any) is in scope for P113 bonus — default defer to follow-on stage
- Mutual-exclusion with active renown endgame flags — resolve in scope contract (US-002)

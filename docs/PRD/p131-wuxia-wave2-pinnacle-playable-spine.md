# PRD: P131 Wuxia Wave 2 Pinnacle Playable Spine

> **Derived from:** `docs/PRD/p130-wuxia-visible-growth-three-sample-wave-closure-reconciliation.md` (Discovery pass 2026-07-09)
> **Gaps addressed:** GAP-P130-D01, GAP-P130-D02 (partial)
> **Supporting evidence:** `docs/test-reports/p130-visible-growth-wave-closure-report.md` §5, `docs/test-reports/p35-pinnacle-myth-legend-lifetime-trace.md`, `docs/test-reports/p35-closure-report.md`, `docs/designs/p25-lifetime-simulation-north-star.md` §3.2, `docs/test-reports/p71-tavern-hand-renown-bridge-targeted-proof.md`
> **Stage slug:** `p131-wuxia-wave2-pinnacle-playable-spine`
> **Stage type:** bounded runtime implementation — single Wave 2 pinnacle achievement playable spine

## 1. Introduction

P35 闭合了 `jianghu_myth_legend` 的 **habit-led lifetime sim trace**：orthodox choice gate + `hidden_master_line` luck window + grind-only failure attribution，100% unlock on designed path。P113 平行推进了 `founding_patriarch` bridge playable spine。

Wave 1 mainstream 路线（P71–P81 jianghu renown、P83–P93 medical）已证明 **bridge → on-ramp → pressure → payoff → late-life** 的 playable spine 执行模型。Wave 2 pinnacle tier（North Star §3.2）仍缺同等级 **runtime 玩家面向链路**：玩家能在游戏中看见 luck+choice 双门槛的进展、窗口与终局，而不只依赖 sim trace 报告。

P131 在 **不交付 Wave 2 全量 catalog、不扩 founding_patriarch、不重写 P35 lifetime slice、不开启 Wave 3/4 内容** 的前提下，为 **单条** 巅峰成就 `jianghu_myth_legend` 交付 bounded playable spine：最小 bridge/on-ramp wiring、玩家可见表达、targeted proof、窄回归、closure handoff。

## 2. Goals

- 对照 P35 `jianghu_myth_legend` lifetime trace，审计 runtime 缺口并锁定 P131 最小实现面
- 闭合 `jianghu_myth_legend` 的 **playable on-ramp spine**（orthodox trial chain + luck window 可见性 + choice gate flags），使目标 pinnacle checkpoint **runtime 可达**
- 补至少 **2 个** pinnacle-specific 玩家可读表达信号（非 silent flag change）
- 产出 targeted proof：seed → on-ramp → luck window → choice gate → pinnacle eval 顺序链路
- 窄回归覆盖 gate acceptance、expression、grind-only failure attribution（对齐 P35 / P25 rare-window-waste 语义）
- 产出 closure 报告，列出 North Star §3.2 / §6 / §8 仍 OPEN 项及 defer queue

## 3. Non-Goals

- 不交付 Wave 2 全量 pinnacle catalog（仅 `jianghu_myth_legend` 单条）
- 不扩 `founding_patriarch` playable spine（P113+ 已平行推进）
- 不重写或替换 P35 lifetime sim slice / baseline delta
- 不实施 Wave 3 mixed catalog 或 Wave 4 ordinary expansion
- 不 respawn P122/P127/P129/P130 visible-growth 工作
- 不新增跨成就通用 pinnacle framework
- 不做 full lifetime sim exhaust 或 gate:playability 全量刷新
- 不修复 game-engine JSON poison mutex 等非 sim path 问题

## 4. Selected Pinnacle Target

| Field | Value |
| --- | --- |
| **Outcome ID** | `jianghu_myth_legend` |
| **中文名** | 武林神话 |
| **Dual gate** | Choice: `p16_guardian_oath`; Luck: `p16_rare_master_encounter` via `hidden_master_line` |
| **P35 baseline** | `docs/test-reports/p35-pinnacle-myth-legend-lifetime-trace.md` |
| **Why this target** | P35 sim trace 100% unlock on designed path；Wave 1 orthodox/martial on-ramp 资产可复用；P130 closure 最高优先级推荐 Wave 2 pinnacle spine |

## 5. User Stories

### US-001: Audit P35 Trace vs Runtime Gap

**Description:** As a maintainer, I want an implementation delta audit against the P35 pinnacle lifetime trace, so P131 only changes what the playable spine actually requires.

**Acceptance Criteria:**

- [ ] Map P35 trace checkpoints (orthodox trial chain, luck roll age 20, midlife grind, age 72 eval) to existing runtime wiring
- [ ] List minimal new wiring vs reusable P16 orthodox trial / hidden_master_line assets
- [ ] Save as `docs/test-reports/p131-pinnacle-myth-legend-implementation-audit.md`
- [ ] This story does not change runtime behavior
- [ ] Typecheck passes

### US-002: Lock P131 Runtime Scope Contract

**Description:** As a planner, I want a scope contract so P131 stays a single-pinnacle playable spine and does not sprawl into Wave 2 catalog or Wave 3/4 work.

**Acceptance Criteria:**

- [ ] Explicit allowed layers: on-ramp wiring, player expression, proof, narrow tests, closure
- [ ] Explicit forbidden: founding_patriarch expansion, Wave 3 mixed, Wave 4 ordinary, new UI framework
- [ ] Save as `docs/test-reports/p131-pinnacle-myth-legend-scope-contract.md`
- [ ] Boundary with P113 founding_patriarch and P35 sim trace documented
- [ ] Typecheck passes

### US-003: Wire Pinnacle On-Ramp Spine

**Description:** As a developer, I want the jianghu_myth_legend on-ramp wired through existing carriers so the P35 choice+luck gates are runtime-reachable with visible progression.

**Acceptance Criteria:**

- [ ] Wire minimal on-ramp checkpoints aligning with P35 trace (orthodox trial chain → guardian oath → hidden_master luck window)
- [ ] No new route framework; reuse existing event/flag carriers
- [ ] Grind-only path stays locked (aligns with P25 rare-window-waste semantics)
- [ ] P35 lifetime slice behavior not regressed
- [ ] Typecheck passes

### US-004: Add Pinnacle Player-Facing Expression

**Description:** As a player, I want pinnacle on-ramp progress and luck window outcomes to feel visible so Wave 2 does not read like silent stat grinding.

**Acceptance Criteria:**

- [ ] At least 2 pinnacle-specific readable signals (e.g. on-ramp shaping confirmation, luck window hit/miss feedback)
- [ ] Expression distinguishes pinnacle path from generic orthodox/martial progression
- [ ] No new UI components
- [ ] Typecheck passes

### US-005: Add Targeted Pinnacle Proof

**Description:** As a maintainer, I want targeted proof showing seed → on-ramp → luck window → choice gate → pinnacle eval so the spine is repo-proven beyond P35 sim slice alone.

**Acceptance Criteria:**

- [ ] Document success path and grind-only failure attribution path
- [ ] Show checkpoint order matching P35 trace semantics
- [ ] Save as `docs/test-reports/p131-pinnacle-myth-legend-targeted-proof.md`
- [ ] Proof does not rely on static shortcut as sole evidence
- [ ] Typecheck passes

### US-006: Add Narrow Regression Coverage

**Description:** As a maintainer, I want narrow regression coverage so the pinnacle playable spine cannot silently break P35 parity or P25 dual-gate semantics.

**Acceptance Criteria:**

- [ ] Isolated test file (e.g. `tests/p131PinnacleMythLegendSpineTests.ts`) covering gate acceptance, expression, grind-only lock
- [ ] P35 mixed/pinnacle parity tests still pass
- [ ] Test file runs independently and exits cleanly
- [ ] Typecheck passes

### US-007: Produce P131 Closure And End-State Handoff

**Description:** As a maintainer, I want a closure report stating what P131 proved and what remains for North Star §3.2 / §8, so Discovery can spawn P132+ without re-auditing P35/P131.

**Acceptance Criteria:**

- [ ] Summarize wiring, expression, proof, tests
- [ ] List remaining Wave 2 additional pinnacles, Wave 3 mixed, Wave 4 expansion as OPEN/defer
- [ ] Explicit non-recommendation: visible-growth respawn, farm/apprentice parallel samples
- [ ] Save as `docs/test-reports/p131-pinnacle-myth-legend-closure-report.md`
- [ ] Typecheck passes

## 6. Success Criteria

- `jianghu_myth_legend` 具备 Wave 1 级 bounded playable spine 证据（wiring + expression + proof + regression）
- P35 lifetime trace 语义不退化；grind-only failure attribution 保持
- 无 Wave 2 catalog 范围蔓延；无 P130 visible-growth respawn
- End-State OPEN 队列明确，不误导 Orchestrator 输出 `COMPLETED`

## 7. Verification Standard

- Targeted proof + isolated regression under `docs/test-reports/` and `tests/`
- Reference P35 post-run PASS; re-run P35 parity tests after P131 wiring
- Browser matrix not required

## 8. Dependencies / Context

- Parent: `docs/PRD/p130-wuxia-visible-growth-three-sample-wave-closure-reconciliation.md`
- P35 trace: `docs/test-reports/p35-pinnacle-myth-legend-lifetime-trace.md`
- Wave 1 spine model: P71–P81 renown, P83–P93 medical closure reports
- End-State: `docs/designs/p25-lifetime-simulation-north-star.md` §3.2, §6, §8

## 9. Open Questions

- None blocking — single pinnacle target selected; founding_patriarch remains parallel track per P113.

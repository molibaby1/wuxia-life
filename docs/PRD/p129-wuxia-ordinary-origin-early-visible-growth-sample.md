# PRD: P129 Wuxia Ordinary-Origin Early Visible Growth Sample

> **Derived from:** `docs/PRD/p128-wuxia-visible-growth-two-sample-wave-closure-reconciliation.md` (Discovery pass 2026-07-09)
> **Gaps addressed:** GAP-P128-D05
> **Supporting evidence:** `docs/test-reports/p128-visible-growth-wave-closure-report.md` §5, `docs/test-reports/p25-ordinary-origin-slice.md`, `docs/test-reports/p59-tavern-hand-bridge-gap-audit.md`, `docs/test-reports/p71-tavern-hand-renown-bridge-targeted-proof.md`, `docs/test-reports/p122-early-visible-growth-feedback-targeted-proof.md`, `docs/test-reports/p127-martial-second-visible-growth-sample-proof.md`
> **Stage slug:** `p129-wuxia-ordinary-origin-early-visible-growth-sample`
> **Stage type:** docs-first experience extension; single ordinary-origin sample

## 1. Introduction

P128 formally closed the visible-growth two-sample wave (`merchant_house` + `martial_family`). P122/P127 proved Signal A/B/C on **vivid** origins only. P25 already validates that three **ordinary** origins (`farm_peasant`, `town_apprentice`, `tavern_hand`) produce distinguishable early/mid trajectories — but ordinary origins still lack P122-style early growth confirmation.

P129 extends the proven pattern to **one ordinary origin**:

**把 P122/P127 的可见成长闭环，扩到 `tavern_hand` + `socialMomentum` 单样板。**

目标不是 Wave 4 全量扩张，也不是多出身并行改造，而是证明「平凡出身早期也能让玩家看见成长方向」——且 habit 轴是**直接**的，不走 scholar 式间接链。

## 2. Goals

- 在 `tavern_hand` 单样板上复用 P122/P127 的三信号可见成长闭环
- 固定塑形轴为 `socialMomentum`（经 `p9_echo_social_hook` 直接映射）
- 继续只用现有 habit、摘要位、反馈位、echo/route 承接位 — 不加新成长系统
- 证明 visible-growth 模式可跨出 vivid origins，进入 Wave 4 ordinary slice
- 产出窄 proof + 回归，供后续 Discovery 决定是否扩到其他 ordinary origins

## 3. Why This Direction

### 3.1 Why tavern_hand (not farm_peasant or town_apprentice)

| Origin | Best habit axis | Directness | Early echo hooks | Continuation assets |
| --- | --- | --- | --- | --- |
| farm_peasant | unclear single axis | Mixed (constitution/labor bias) | No dedicated p9 echo pair | P60 design-first only |
| town_apprentice | businessHabit possible | Moderate (craft→trade) | business hooks exist but merchant-adjacent | P58 merchant bridge |
| **tavern_hand** | **socialMomentum** | **Direct** | **`p9_echo_social_hook`, `p9_early_social_focus`** | **P56 midlife, P59/P71 renown bridge** |

`tavern_hand` has the highest `socialCapital` among ordinary origins, service/social event bias, and existing P56/P71 continuation chain — best fit for a socialMomentum sample.

### 3.2 Habit axis directness (mandatory pre-check)

Discovery verified directness before spawn (see `agent_docs/p128-wuxia-visible-growth-two-sample-wave-closure-reconciliation-gaps.md`):

- **Primary action:** `action_socializing_lite`
- **Echo hook:** `p9_echo_social_hook` → `socialMomentum` (see `ActivePlanningService.mapEchoFlagToLifeState`)
- **Shaping label:** `人情 · 渐成` at `socialMomentum >= 2`
- **NOT** `studyHabit` / comprehension-indirect chain (scholar defer pattern)

### 3.3 Why not reopen P122/P127/P128

- P122/P127/P128 wave is **closed** — no respawn
- Scholar third sample remains **defer** per P128-004
- Unified cross-origin template rejected per P127 §14

## 4. Scope

### In Scope

- 单样板出身：`tavern_hand`（ordinary tier）
- 单塑形轴：`socialMomentum`
- 主样板年龄：5–8 岁
- 轻承接验证年龄：8–13 岁（含 `ordinary_tavern_network_fork` childhood choice band）
- 三类确认信号：Signal A/B/C（同 P122/P127）
- 窄 proof 文档 + 窄回归测试

### Out of Scope

- `farm_peasant`、`town_apprentice` 平行样板
- `scholar_house` 或 vivid origins 再改
- 技能系统、新 growth panel、跨出身模板抽象
- Wave 4 全量 expansion（3 origins midlife depth）
- P59 merchant bridge 或 P71 renown bridge **内容扩展** — 仅作 continuation readability 引用
- 武功底层数值迁移

## 5. Core Problem

P25 proves ordinary origins have **distinct trajectories**, but players on `tavern_hand` still cannot **see** early shaping the way merchant/martial players can after P122/P127.

P129 closes the gap:

**行为 → socialMomentum 累积 → 玩家确认 → 后续机会更可读**

## 6. Player-Facing Signals

P129 必须复用 P122/P127 三类信号，不允许发明第四套：

### Signal A: 主界面塑形短句确认

- 从 `塑形未成` 进入 `人情 · 渐成`（`socialMomentum >= 2`）

### Signal B: 年龄推进 / 阶段结算确认

- 阶段结算回答「这一期你的人情/社交主轴变清楚了」

### Signal C: 行为后的长期影响确认

- `action_socializing_lite` 后反馈区可见 social shaping 长期影响
- 复用 `p9_echo_social_hook` / `p9_early_social_focus` 标签

## 7. Preferred Landing Layers

### P0. 表达层

- `MainScreenLifeSummary` / `shapingSummary`
- 现有反馈区长期影响

### P0. 年龄推进结算

- `periodSummaryDisplay` / `buildShapingPeriodGrowthLine`

### P1. 轻承接（8–13）

- `ordinary_tavern_network_fork` — childhood choice readability tied to prior social shaping
- P28 `socialMomentum >= 2` events（如「人脉成线」）— continuation readability only, no content expansion

## 8. User Stories

### US-001: Lock tavern_hand Sample Scope

**Description:** As a maintainer, I want P129 scope locked to `tavern_hand` + `socialMomentum` before implementation, so the stage does not sprawl into multi-origin Wave 4 expansion.

**Acceptance Criteria:**

- [x] Fix origin to `tavern_hand` only; no farm_peasant or town_apprentice parallel work
- [x] Fix axis to `socialMomentum` only; verify direct path via `p9_echo_social_hook` (not studyHabit indirect chain)
- [x] Primary action: `action_socializing_lite`; ages 5–8 primary, 8–13 continuation
- [x] No new growth systems, panels, or cross-origin templates
- [x] Typecheck passes

### US-002: Social Shaping Summary Confirmation (Signal A)

**Description:** As a player on tavern_hand, I want the main screen to show social shaping confirmation, so early ordinary childhood feels directed.

**Acceptance Criteria:**

- [x] `shapingSummary` transitions to `人情 · 渐成` when `socialMomentum >= 2` on sample path
- [x] Copy from existing `socialMomentum` wiring, not new parallel system
- [x] Reuse MainScreenLifeSummary only
- [x] Typecheck passes

### US-003: Long-Term Impact After Social Actions (Signal C)

**Description:** As a player, I want early socializing actions to show visible long-term traces.

**Acceptance Criteria:**

- [x] After `action_socializing_lite`, feedback shows player-visible long-term impact
- [x] Reuse existing longTermImpactLines / echo hook display
- [x] Causal visibility only — no new branch at this step
- [x] Typecheck passes

### US-004: Period Settlement Social Shaping Summary (Signal B)

**Description:** As a player, I want age progression to summarize social shaping change.

**Acceptance Criteria:**

- [x] At least one period settlement on sample path summarizes shaping via `periodSummaryDisplay`
- [x] Settlement correlates with prior socializing behavior
- [x] Typecheck passes

### US-005: Continuation Readability Proof (8–13)

**Description:** As a maintainer, I want bounded proof that early social shaping makes tavern childhood fork continuation readable.

**Acceptance Criteria:**

- [x] Proof covers `tavern_hand` ages 5–13
- [x] Chain: behavior → socialMomentum → Signal A/B/C → `ordinary_tavern_network_fork` and/or P28 socialMomentum event readability
- [x] Save as `docs/test-reports/p129-ordinary-origin-visible-growth-sample-proof.md`
- [x] Typecheck passes

### US-006: Narrow Regression Coverage

**Description:** As a maintainer, I want automated tests guarding the tavern_hand visible-growth loop.

**Acceptance Criteria:**

- [x] Add narrow test file (e.g. `tests/p129OrdinaryOriginVisibleGrowthTests.ts`)
- [x] Cover shapingSummary, long-term impact, period settlement, one continuation check
- [x] Scope guards: tavern_hand only, socialMomentum only, no multi-origin expansion
- [x] Typecheck passes
- [x] Tests pass

## 9. Success Criteria

- `tavern_hand` 5–13 岁有完整 Signal A/B/C 窄 proof
- habit 轴 directness 在 baseline 文档中可追溯
- 无新 growth 系统；P122/P127/P128 工作不重开
- 窄回归 PASS

## 10. Verification Standard

- Proof: `docs/test-reports/p129-ordinary-origin-visible-growth-sample-proof.md`
- Baseline constants file mirroring P122/P127 pattern (e.g. `src/hvg/p129TavernSampleBaseline.ts`) if needed for test harness
- Tests: `npx tsx tests/p129OrdinaryOriginVisibleGrowthTests.ts`
- No browser matrix required for stage acceptance

## 11. Dependencies / Context

- Parent closure: `docs/test-reports/p128-visible-growth-wave-closure-report.md`
- Pattern reference: P122 proof, P127 proof, P127 test style
- Ordinary wiring: `docs/test-reports/p25-ordinary-origin-slice.md`
- Tavern bridge inventory: `docs/test-reports/p59-tavern-hand-bridge-gap-audit.md`
- End-State: `docs/designs/p25-lifetime-simulation-north-star.md` §3.4, §8

## 12. Non-Goals

- Multi-origin ordinary batch (farm + apprentice + tavern)
- Scholar third sample
- Wave 2/3 achievement implementation
- Merchant bridge (P59) or renown bridge (P71) content expansion

## 13. Open Questions

- None blocking — `action_socializing_lite` is origin-generic; tavern_hand social bias provides thematic fit without requiring tavern-exclusive childhood actions in P129.

## 14. Stage Closure (post-review)

**Date:** 2026-07-09  
**Verdict:** **GO — 6/6 stories complete; ordinary-origin visible-growth sample CLOSED**

| Story | Deliverable | Result |
| --- | --- | --- |
| P129-001 | Scope baseline + constants | `p129-ordinary-origin-visible-growth-sample-baseline.md`, `p129TavernSampleBaseline.ts` |
| P129-002 | Signal A shapingSummary | Existing wiring confirmed; narrow test |
| P129-003 | Signal C long-term impact | `playerFacingLabels` social echo labels + narrow test |
| P129-004 | Signal B period settlement | Existing `buildPeriodSummary` wiring + narrow test |
| P129-005 | Continuation proof | `p129-ordinary-origin-visible-growth-sample-proof.md` |
| P129-006 | Narrow regression | `tests/p129OrdinaryOriginVisibleGrowthTests.ts`, registered in `runRealTestGate` |

**Regression evidence (A1-verify PASS):** `npx tsx tests/p129OrdinaryOriginVisibleGrowthTests.ts`

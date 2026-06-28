# P41 Habit Trajectory Player-Facing Feedback Audit

> **Date:** 2026-06-25  
> **Branch:** `codex/p41-wuxia-habit-trajectory-player-facing-feedback`  
> **Story:** P41-001  
> **PRD:** `docs/PRD/p41-wuxia-habit-trajectory-player-facing-feedback.md`

Read-only inventory of where habit / semi-personality axes (`trainingHabit`, `studyHabit`, `businessHabit`, `socialMomentum`, `familyBond`) are visible, hidden, or misleading on player-facing surfaces.

---

## 1. Surface Inventory

| Surface | File(s) | Habit / semi-personality visibility | Notes |
| --- | --- | --- | --- |
| Main-screen life summary card | `MainScreenLifeSummary.vue`, `mainScreenModel.ts` | **Hidden (misleading proxy)** | Shows 路线 / 风险 / **倾向**; `tendencySummary` ranks **numeric stats** (悟性、体魄、侠义…), not `lifeStates.*` axes |
| GameScreen status + feedback | `GameScreen.vue` | **Hidden in summary; partial in feedback** | Summary uses `mainScreenModel`; post-choice **长期影响** only lists `longTermFlags` with labels from `LONG_TERM_FLAG_LABELS` (route/origin flags) |
| Choice feedback generator | `ChoiceFeedbackGenerator.ts`, `playerFacingLabels.ts` | **Hidden** | Handles `stat_modify`, `relation_change`, `flag_set`; **does not diff `lifeStates`**; habit increments from daily hooks / `life_state_modify` invisible |
| Life-memory derivation | `deriveLifeMemorySummary.ts`, `types/lifeMemory.ts` | **Hidden** | Derives route, key choices, relationships, debts, risks, achievements — **no habit trajectory field** |
| Life-memory panel | `LifeMemoryPanel.vue` | **Hidden** | Renders derived sections only; no shaping recap |
| Full stats panel | `MainScreenStatsPanel.vue` | **Hidden** | Combat / 江湖 / 成长 / 资源 groups; no lifeStates |
| Runtime state config | `src/data/life/lifeStates.ts` | **Internal only** | Chinese names exist (`练功习惯`, `读书习惯`…) but never wired to UI |
| API player summary | `PlayerSummaryDto` in `sessionProgression.ts` | **Hidden** | Subset of stats; **`lifeStates` not exposed to API clients** |
| Echo / consequence events | `src/data/lines/*.json` (P26–P29) | **Runtime-only gates** | Conditions use `lifeStates.*`; copy often reads as eligibility, not “long-term shaping echo” |
| Validation / headless | `personalityHabitTrajectoryTests.ts`, P25–P37 slices | **Diagnostic** | Proves runtime; not player-facing |

---

## 2. Visibility Classification

### Already visible (non-habit)

- **Route:** `routeSummary` / life-memory route block — clear, player-facing.
- **Risk:** `riskSummary` from life-memory visible risks — works.
- **Long-term flags (subset):** route transitions (`route_orthodox`, `origin_*`) in choice feedback — player-facing but **not habit axes**.

### Hidden (gap)

- All five P41 axes live in `player.lifeStates` only.
- Daily-event / action-driven increments (`GameEngineIntegration` habit hooks) never surface in feedback.
- Mid/late echo events fire from habit thresholds but player cannot connect choice → axis → echo.

### Misleading

- **倾向 row:** Implies “long-term direction” but reflects **instant stat ranking**, which diverges from habit/semi-personality trajectory (e.g. high 悟性 without `studyHabit` reads scholarly).

---

## 3. Primary Patch Surfaces (P41 scope)

| Role | Primary surface | Current state | P41 story |
| --- | --- | --- | --- |
| **Current shaping direction** | `MainScreenLifeSummary` + `mainScreenModel.ts` | Misleading 倾向 | **P41-002** — add habit-derived shaping summary in existing card |
| **Choice consequence hint** | `GameScreen.vue` 长期影响 + `ChoiceFeedbackGenerator.ts` | Route/origin flags only | **P41-003** — emit player-facing shaping hints on material axis reinforcement |
| **Late-life recap** | `deriveLifeMemorySummary.ts` + `LifeMemoryPanel.vue` | Absent | **P41-005** — 1–3 dominant trajectories in life-memory |

Supporting story **P41-004** updates echo event copy; **P41-006** regression + closure.

---

## 4. Non-Goals Confirmed (no parallel UX)

Per PRD §3 — audit confirms these are **out of scope**:

- No new personality container or standalone habit panel.
- No new axis types beyond existing five.
- No headless gate threshold changes in P41.

---

## 5. Verification

Audit produced via read-only review of:

- `src/components/GameScreen.vue`, `MainScreenLifeSummary.vue`, `mainScreenModel.ts`
- `src/core/ChoiceFeedbackGenerator.ts`, `deriveLifeMemorySummary.ts`
- `src/utils/playerFacingLabels.ts`, `src/types/lifeMemory.ts`, `src/data/life/lifeStates.ts`
- `tests/mainScreenModel.test.ts`, `tests/testLifeMemorySummary.ts`, `tests/personalityHabitTrajectoryTests.ts`

**No gameplay behavior changes in this story.**

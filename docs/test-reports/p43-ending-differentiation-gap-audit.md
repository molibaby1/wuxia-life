# P43 Endgame Recap And Archetype Differentiation Gap Audit

> **Date:** 2026-06-25  
> **Branch:** `codex/p43-wuxia-archetype-recap-and-ending-differentiation`  
> **Story:** P43-001  
> **PRD:** `docs/PRD/p43-wuxia-archetype-recap-and-ending-differentiation.md`

Read-only inventory of recap, life-memory, and ending surfaces that express life trajectory or archetype — with emphasis on where long-term shaping is lost, flattened, or repeated across archetypes.

---

## 1. Surface Inventory

| Surface | File(s) | Trajectory / archetype signals | Shaping visibility | Classification |
| --- | --- | --- | --- | --- |
| Main-screen life summary | `MainScreenLifeSummary.vue`, `mainScreenModel.ts` | Route, risk, **塑形** row | **Visible (P41)** — top 1–2 axes via `buildCurrentShapingSummary` | Mid-game; not endgame |
| Life-memory panel | `LifeMemoryPanel.vue`, `deriveLifeMemorySummary.ts` | Route, key choices, debts, risks, achievements, **长期塑形** | **Visible (P41)** — up to 3 dominant lines via `deriveDominantShapingLines` | Late-game recap; **stops at axis labels** |
| Choice feedback | `ChoiceFeedbackGenerator.ts`, `playerFacingLabels.ts` | Route flags + shaping hints | **Visible (P41)** — delta hints on axis reinforcement | Process layer only |
| P19 final summary | `composeP19FinalSummary`, `finalSummaryComposition.ts` | Endgame category, recovery, legacy, historical memory | **Hidden** — no habit/semi-personality axes | **Primary endgame narrative gap** |
| `EndingSystem.getEndingSummary` | `EndingSystem.ts` | Category + fatigue/anxiety only (fallback path) | **Hidden** — ignores `trainingHabit` etc. | Flat ~10 generic lines |
| `EndingSystem.generateEndingReview` | `EndingSystem.ts` | Stat dump, achievements, critical choices | **Hidden** — no shaping recap | Autobiographical; disconnected from life-memory |
| Ending UI | `EndingScreen.vue`, `App.vue` | Title, death reason, numeric stats grid | **Hidden** — no P19 summary, no shaping, no life-memory | **Player-facing end screen is thinnest surface** |
| `inferLivedSelfUnderstanding` | `p19/stateAccess.ts` | Chivalry, reputation, connections | **Hidden** — stat/relationship proxy, not habit axes | Collapses diverse shaping into 4 templates |
| P20 archetype families | `archetypeCoverage.ts`, profile configs | Lifecycle-scored families | **Diagnostic / scheduling** — not composed into ending copy | Scheduling ≠ closure |
| Mid-life summary templates | `summaryTemplates` (age ~40) | Route identity | **Partial** — mid-life only | Not endgame |
| Historical memory patterns | `historicalMemory.ts`, profile patterns | Flags, lifePath signals | **Hidden** — posthumous tone, not lived shaping | Divergence from self-understanding only |

---

## 2. Collapse And Flattening Patterns

### 2.1 Shaping visible mid-run, absent at closure

P41 wired habit axes into main-screen, choice feedback, and life-memory. A player can read「习武塑形 · 入骨」during play, but **ending composition never references those axes**. The final P19 paragraph stack (category + recovery + legacy + historical memory) reads as a separate story.

### 2.2 Same-route endings ignore shaping divergence

Two orthodox-sect runs with different dominant shaping (e.g. `trainingHabit` 5 vs `studyHabit` 5) share:

- Same `determineEnding` stat buckets when totals align
- Same `getEndingSummary` category lines
- Same `inferLivedSelfUnderstanding` if chivalry/reputation match

**Result:**「同一条路线，不同长期塑形」在结尾层不可读（P42 fixed this for midgame echo events only).

### 2.3 Life-memory vs ending terminology drift

| Concept | Life-memory | Main-screen | Ending layer |
| --- | --- | --- | --- |
| Martial shaping | `习武塑形` (shortLabel) | `习武 · 入骨` (label + tier) | *(absent)* |
| Scholarly shaping | `饱学塑形` | `饱学 · 成形` | *(absent)* |
| Livelihood | `营生塑形` | `营生 · 渐成` | *(absent)* |
| Social | `人情往来` | `人情 · 渐成` | *(absent)* |
| Family | `亲族牵绊` | `亲族 · 渐成` | *(absent)* |

Life-memory uses `shortLabel`; main-screen uses `label · tierLabel`. Ending uses neither — players get three disconnected vocabularies if they reach closure.

### 2.4 Ending UI bypasses narrative stack

`EndingScreen.vue` renders title, death reason, and a numeric stat grid. It does **not** consume `getEndingSummary`, `composeP19FinalSummary`, or `deriveLifeMemorySummary`. Even when P19 text exists in engine/tests, the default player-facing end screen does not show it.

### 2.5 Archetype reduced to route + stats

`inferLivedSelfUnderstanding` and P19 category selection use chivalry, reputation, faction, legacy — not the five P41 axes. Archetype families (P20) score lifecycle coverage but do not produce player-facing ending tone variants.

---

## 3. Ranked Gap Priority (P43 scope)

| Rank | Gap | Patch surface | Target story |
| --- | --- | --- | --- |
| **G1** | Dominant shaping not named in late-life / ending recap | `composeP19FinalSummary`, `habitShapingSummary.ts` | **P43-002** |
| **G2** | Same-route family endings flatten when shaping differs | Shaping-pattern tone lines in final summary composition | **P43-003** |
| **G3** | Life-memory, recap, ending use inconsistent or missing shaping labels | Shared label helpers + composition wiring | **P43-004** |
| **G4** | Ending UI omits narrative recap entirely | Out of P43 non-goals (no new ending system); engine text first | Defer UI wiring |
| **G5** | `inferLivedSelfUnderstanding` ignores habit axes | Could align in P43-004 if touched | **P43-004** (light touch) |

---

## 4. Confirmed Non-Goals (no parallel work)

Per PRD §3:

- No new content pool wave
- No replay gate redo
- No operator tooling
- No scheduler core changes
- No fully independent ending system
- EndingScreen.vue full redesign deferred — P43 focuses on **derivation + composition** layers consumed by tests and future UI

---

## 5. Verification

Audit produced via read-only review of:

- `src/utils/habitShapingSummary.ts`, `deriveLifeMemorySummary.ts`, `LifeMemoryPanel.vue`
- `src/p19/finalSummaryComposition.ts`, `EndingSystem.ts`, `EndingScreen.vue`
- `src/p19/stateAccess.ts`, `src/p19/historicalMemory.ts`
- `docs/test-reports/p41-habit-feedback-audit.md`, `p19-endgame-outcome-surface-audit.md`, `p42-archetype-differentiation-matrix.md`
- `tests/p19EndgameTests.ts`, `tests/testLifeMemorySummary.ts`, `tests/p41HabitFeedbackTests.ts`

**No gameplay behavior changes in this story.**

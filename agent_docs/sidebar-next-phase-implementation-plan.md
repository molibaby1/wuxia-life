# Sidebar Next Phase Implementation Plan

**Goal:** Replace the current summary-only main-screen sidebar with the full life-memory sidebar, keep the fast-scan summary behavior where useful, and add regression coverage for the real user-visible integration.

**Scope:** Only the main gameplay sidebar path. This phase does not change event logic, life-memory derivation rules, or unrelated visual refactors.

**Success Criteria:**
- `GameScreen` renders the full `LifeMemoryPanel` in the main player flow.
- Players can still reach a compact summary/anchor without losing the richer sidebar detail.
- Existing shaping/risk/route summaries remain player-facing and readable.
- Regression coverage exists for component wiring and core player-visible sections.

## Current State

- `src/components/GameScreen.vue` renders `MainScreenLifeSummary`, not `LifeMemoryPanel`.
- `src/components/MainScreenLifeSummary.vue` is a compact 4-row summary card.
- `src/components/LifeMemoryPanel.vue` already supports:
  - route status
  - habit trajectory
  - risks
  - unresolved debts
  - key choices
  - relationships
  - achievements
  - debug-only diagnostic JSON
- Existing tests only prove model/data behavior, not sidebar integration.

## Files In Scope

- Modify: `src/components/GameScreen.vue`
- Modify: `src/components/MainScreenLifeSummary.vue`
- Modify: `src/components/LifeMemoryPanel.vue`
- Modify: `src/components/mainScreenModel.ts`
- Add or modify: `tests/mainScreenModel.test.ts`
- Add: `tests/lifeMemoryPanel.integration.test.ts`
- Add or modify: `tests/p41HabitFeedbackTests.ts`

## Implementation Strategy

### Task 1: Decide the sidebar composition

Use `LifeMemoryPanel` as the primary sidebar surface in `GameScreen`.

Keep one of these two patterns:

1. Recommended: render `MainScreenLifeSummary` above `LifeMemoryPanel` as a compact snapshot card.
2. Alternative: fold the 4 summary rows into `LifeMemoryPanel` header and retire `MainScreenLifeSummary`.

Recommended choice is option 1 because it is lower risk and preserves existing summary copy that already has passing regression coverage.

### Task 2: Wire the full sidebar into `GameScreen`

In `src/components/GameScreen.vue`:

- Import `LifeMemoryPanel`.
- Compute the same `LifeMemorySummary` object already used for main-screen summaries.
- Render `LifeMemoryPanel` in the main content flow where the player currently jumps to “人生摘要”.
- Point the “人生摘要” secondary action to the full sidebar anchor instead of the summary-only card.
- Keep `MainScreenStatsPanel` behavior unchanged.

Expected outcome:

- The sidebar button scrolls to a real detailed sidebar.
- The player sees route, shaping, risk, key-choice, relationship, debt, and achievement context in one place.

### Task 3: Clarify the contract between compact summary and detailed sidebar

In `src/components/MainScreenLifeSummary.vue` and `src/components/mainScreenModel.ts`:

- Keep the compact card focused on “route / risk / tendency / shaping”.
- Do not duplicate long lists from `LifeMemoryPanel`.
- If the compact card remains, rename internal comments/usage to make it explicit that it is a top summary card, not the full sidebar.

Expected outcome:

- No ambiguous duplication between the two components.
- Future reviewers can tell which component owns which level of detail.

### Task 4: Harden `LifeMemoryPanel` for real main-screen use

In `src/components/LifeMemoryPanel.vue`:

- Verify empty-state behavior for each section remains clean when data is absent.
- Verify the default expanded/collapsed behavior is appropriate for the main screen.
- Verify the player-visible filter is consistently applied to all sections.
- Keep debug diagnostics hidden outside debug mode.

Expected outcome:

- The panel is safe to expose in normal gameplay without raw/internal leakage.

### Task 5: Add real regression coverage for the sidebar

In `tests/lifeMemoryPanel.integration.test.ts`:

- Build a representative `LifeMemorySummary` fixture with:
  - one visible route
  - one visible shaping entry
  - one visible risk
  - one visible unresolved debt
  - one visible key choice
  - one visible relationship
  - one visible achievement
- Assert the rendered output includes the expected player-facing section labels and hides non-player entries.

In `tests/p41HabitFeedbackTests.ts`:

- Keep the shaping/life-memory derivation checks.
- Add one assertion that the detailed life-memory output includes at least one sidebar-only section payload beyond the compact summary rows, such as relationship or key-choice labels when present.

In `tests/mainScreenModel.test.ts`:

- Keep the compact summary expectations unchanged if `MainScreenLifeSummary` remains.
- Add one explicit assertion documenting that the compact card is intentionally summary-only.

### Task 6: Verification

Run:

```bash
rtk npm run typecheck
rtk npm exec tsx tests/mainScreenModel.test.ts
rtk npm exec tsx tests/p41HabitFeedbackTests.ts
rtk npm exec tsx tests/lifeMemoryPanel.integration.test.ts
```

Optional if the component test path needs broader confidence:

```bash
rtk npm test
```

## Risks

- `LifeMemoryPanel` may be visually heavier than the current summary card on smaller screens.
- `GameScreen` scroll targets may need minor adjustment after inserting the full panel.
- There is no existing dedicated Vue component test harness in the current scripts, so the integration test should stay lightweight and align with the repository’s `tsx`-driven test style.

## Non-Goals

- No redesign of the top status header.
- No change to life-memory scoring/derivation rules.
- No new narrative content work.
- No global UI theme refactor.

## Recommended Execution Order

1. Wire `LifeMemoryPanel` into `GameScreen`.
2. Preserve or simplify the compact summary contract.
3. Fix any layout/scroll regressions.
4. Add sidebar integration regression tests.
5. Run targeted verification.

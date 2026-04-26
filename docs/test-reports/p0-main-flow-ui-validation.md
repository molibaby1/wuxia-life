# P0 Main Flow UI Validation (US-003)

## Scope

This note validates that P0 UI cleanup keeps gameplay flow visible while preventing production debug text from reappearing.

## Environment

- Run with local dev server (`npm run dev`).
- Browser: any modern Chromium-based browser.
- Build target: current `ralph/p0-core-experience-remediation` branch.

## Validation Checklist

### Node A - New Game Entry

1. Open the app and confirm the start screen is shown.
2. Start a new game with any valid name and gender.
3. Verify the first gameplay card is rendered with story text.
4. Confirm the gameplay area does **not** show raw debug labels/blocks such as:
   - `currentNode`
   - `choices`
   - `lastOutcomeText`

Expected result:
- Gameplay starts normally.
- No production-facing debug text block appears in the main content area.

### Node B - Choice Event

1. At a node with selectable options, click one choice button.
2. Observe the outcome text area appears under the story content.
3. Confirm no raw debug block is shown before or after selection.

Expected result:
- Choice interaction works and updates displayed narrative.
- Outcome is presented as game content only, without diagnostic field dumps.

### Node C - Continue Event

1. Reach a node where no manual choices are available and `继续` is displayed.
2. Click `继续`.
3. Confirm the flow advances to the next event and the previous outcome section is cleared/updated as designed.
4. Re-check that debug field labels are still absent from the game content area.

Expected result:
- Continue interaction is functional.
- Main content remains free of production debug text.

### Node D - Ending Flow

1. Progress gameplay until the player reaches an ending state.
2. Verify the ending screen is rendered.
3. Trigger `restart` from the ending screen.
4. Confirm the app returns to start flow and can begin a fresh game cycle.

Expected result:
- Ending and restart transitions are intact.
- UI flow integrity is preserved after debug cleanup.

## Regression Guard Notes

- This checklist should be rerun whenever gameplay UI rendering around start/playing/ending phases changes.
- If debug diagnostics are needed, they should remain behind the explicit debug entry, not in production-facing story content.

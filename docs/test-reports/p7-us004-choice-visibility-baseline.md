# P7 US-004 — Choice Requirement Visibility Baseline

生成时间：2026-06-03

## Where choice conditions are evaluated

| Layer | Behavior |
| --- | --- |
| `GameEngineIntegration.selectEvent` | Filters choice events with zero available choices |
| `GameEngineIntegration.isChoiceAvailable` | Authoritative runtime evaluation via `ConditionEvaluator` |
| `useNewGameEngine.handleChoice` | Rejects unavailable choices with **console.warn only** |
| `resolveChoiceEffects` (simulator) | Uses `isChoiceAvailable` before execution |
| `EventDisplay.vue` | `isChoiceAvailable` **stub returns true always** |
| `GameScreen.vue` | Renders all `availableChoices` without lock state |

## Where requirements are displayed

- `EventDisplay.vue`: disabled button + "🔒 条件不足" when `choice.condition` set — but stub makes this dead code
- `GameScreen.vue`: no lock UI; all choices clickable
- `AttributePanel.vue`: separate hardcoded route requirement cards (not tied to current event choices)

## Silent rejection paths

1. **UI shows all choices as enabled** (`EventDisplay` stub; `GameScreen` no check)
2. **Click → console.warn** in `useNewGameEngine.handleChoice` without player-facing toast
3. **Auto-resolve events** skip silently via `getNextEvent` recursion when no choice passes
4. **Simulator** pre-filters to available choices only — hides locked options from reports

## Gap note (UI + runtime follow-up)

- Wire UI to `gameEngine.isChoiceAvailable` for every choice render path
- Show locked state + player-facing reason before click (US-028–US-030)
- Do not expose raw expression strings
- Align `availableChoices` mapping in `useNewGameEngine` to include lock metadata for `GameScreen`

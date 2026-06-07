# P8 US-007 — Action Fallback and Choice Scoring Audit

生成时间：2026-06-07

## 1. No-Event Active Action Fallback (Today)

| Location | Behavior |
| --- | --- |
| `tests/GameProcessSimulator.ts` → `simulateYear()` | When `gameEngine.selectEvent()` returns null, hardcodes `actionId = 'action_training_basic'`, executes via `gameEngine.executeActiveAction`, records as `progressionKind: 'active_action'`. |
| `src/composables/useNewGameEngine.ts` | Web flow: when no event, exposes `getAvailableActiveActions()` for player choice (P7). |
| `src/headless/parity/simulatorRecordReplay.ts` | Replays active actions from records using catalog ids. |

**Gap:** Simulator ≠ Web; P8 lands strategy in `GameProcessSimulator` via `src/p8/personaActionStrategy.ts`.

## 2. Event Choice Scoring (Today)

| Location | Behavior |
| --- | --- |
| `tests/GameProcessSimulator.ts` → `selectChoice()` | Scores each choice via `scoreEffectsByTendency(config.choiceTendency)`, plus route-track, romance, demonic midlife heuristics. |
| `config.choiceTendency` | Set on `GameProcessConfig`; samples in `scripts/runGameplaySimulation.ts`. |

**P8 extension:** `src/p8/personaChoiceBias.ts` adds goal/risk/relationship/route preference from `P8Persona` without removing route-track hooks.

## 3. Dependent Commands

- `npm run simulate:gameplay` / `simulate:gameplay:samples`
- `npm run gate:experience` (runs samples through simulator)
- `npm run test:headless:parity` (record replay including active actions)
- `npm run verify:route-track-samples`
- Future: `npm run gate:playability`

## 4. Replay Compatibility

Active action replay ids: `src/core/activePlanning/activeActionReplay.ts` (`toActiveActionReplayEventId`). New action ids must register aliases there.

本故事为只读审计，未修改业务代码。

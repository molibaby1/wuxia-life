# P7 US-002 — Time Advancement Entry Points Baseline

生成时间：2026-06-03

## Main-flow entry points

| Entry | Location | Classification |
| --- | --- | --- |
| No-event fallback | `useNewGameEngine.getNextEvent` → `gameEngine.advanceTime(1)` | **Forced annual fallback** — advances 1 year when `selectEvent` returns null |
| Effect-driven advance | `EffectExecutor` → `advanceTime(state, value, unit)` | **Event-defined** — respects effect `unit` (year/month/day) |
| Engine API | `GameEngineIntegration.advanceTime(value, unit)` | **Event-defined / caller-defined** |
| Store path | `gameStore` → `advanceTime` | **Event-defined** (legacy store) |
| Auto-resolve skip | Choice/outcome effects with `time_advance` | **Event-defined** |

## Simulator and report entry points

| Entry | Location | Classification |
| --- | --- | --- |
| Year loop | `GameProcessSimulator.simulate()` → `simulateYear()` | **Forced annual** — one iteration per calendar year label |
| Post-event catch-up | `ensureYearAdvanced` / `routeTrackFixtures.ensureYearAdvanced` | **Forced annual** — if age unchanged after event, `advanceTime(1)` |
| No-event record | `simulateYear` when `selectEvent()` null | **Forced annual** — records placeholder year then advances |
| Report time fields | `GameProcessRecord.currentTime`, age column | **Diagnostic** — reflects engine state after advances |

## Classification summary

- **Event-defined:** `EffectExecutor`, choice/auto event effects with `time_advance`
- **Fallback (problematic):** `useNewGameEngine` null-event path; simulator `ensureYearAdvanced`
- **Forced annual:** Simulator outer loop structure (`simulateYear` naming and one-step-per-age semantics)
- **Unknown / legacy:** `gameStore` direct advance (parallel to main engine)

## Baseline note

Ordinary main-flow progression currently collapses to **+1 year** when no formal event is selected. Simulator **always** ensures at least one year passes per loop iteration. P7-W2 must replace these with short-duration action advancement while preserving explicit milestone `time_advance` effects on critical/storyline events.

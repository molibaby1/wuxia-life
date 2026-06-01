# P5 Runtime Coupling Baseline (US-001)

## Scope and method

- **Story:** P5 US-001 — Rebaseline Runtime Coupling
- **Scope:** Read-only inventory of Vue reactivity, global singletons, and browser/DOM dependencies on engine execution paths. No business code changes.
- **Authority:** `docs/PRD/p5-headless-engine-and-catalog-read-service.md`, prior `docs/test-reports/p4-engine-boundary-baseline.md` (P4 US-001).
- **Classification legend:**
  - **core logic** — gameplay state, selection, execution, pure derivation (must remain behavior-identical when extracted)
  - **Web adapter** — Vue components/composables, DOM pacing, prompts/alerts, UI session state
  - **test/report-only** — simulators, gates, contract tests, telemetry scripts
  - **deprecated** — legacy paths not on main `App.vue` flow

---

## Vue reactive imports on engine execution paths

| Module | Vue imports | Classification | Headless impact |
| --- | --- | --- | --- |
| `src/core/GameEngineIntegration.ts` | `reactive`, `isReactive` | core logic (coupled) | **Canonical `GameState` is a Vue proxy.** Headless session must use plain objects or isolate behind snapshot adapter. |
| `src/core/DifficultyManager.ts` | `reactive` | core logic (coupled) | Difficulty config reactive + `localStorage`; not required for minimal headless replay but imported by engine subgraph. |
| `src/core/DifficultyMonitor.ts` | `reactive` | core logic (coupled) | Metrics reactive object; dev/telemetry adjacent. |
| `src/composables/useNewGameEngine.ts` | `reactive`, `ref`, `computed` | Web adapter | Main flow orchestration; volatile session (`currentEvent`, choices, feedback). |
| `src/composables/useGameEngine.ts` | `reactive`, `nextTick` | deprecated | Legacy story-node loop. |
| `src/store/gameStore.ts` | `reactive` | deprecated | Superseded by `gameEngine.getGameState()`. |
| `src/components/*.vue`, `src/App.vue`, `src/main.ts` | `ref`, `computed`, `createApp`, … | Web adapter | No engine logic; safe to leave on Web path. |

**Engine-adjacent modules without Vue (headless-friendly today):** `EventExecutor.ts`, `EventLoader.ts` (no Vue; static catalog imports), `RouteStateManager.ts`, `ChoiceFeedbackGenerator.ts`, `deriveLifeMemorySummary.ts`, `ConditionEvaluator.ts`, `ChoiceOutcomeResolver.ts`, most effect/selection subsystems (`DailyEventSystem`, `SetbackEventSystem`, `TraitSystem`, …).

---

## Global singleton usage

| Singleton | Location | Used by | Classification | Headless note |
| --- | --- | --- | --- | --- |
| `gameEngine` | `GameEngineIntegration.ts` | Composable, UI, `GameProcessSimulator` | core logic | Single mutable session; P5 needs injectable session instance. |
| `eventLoader` | `EventLoader.ts` | Engine, composable, tests | core logic | Eager catalog at module init; P5 catalog read adapter wraps same data. |
| `saveManager` | `SaveManager.ts` | Composable, UI, simulator | Web adapter / persistence | Browser `localStorage`; headless uses in-memory fallback only inside class. |
| `eventPreloader` | `EventPreloader.ts` | `MainDemo.vue` only | Web adapter | Not on main App path. |
| `talentSystem` | `TalentSystem.ts` | Engine integration | core logic | Class singleton; can stay behind session if engine refs it. |
| `performanceMonitor` | `PerformanceMonitor.ts` | Dev tooling | test/report-only | Optional dependency for headless. |
| `difficultyManager` / `difficultyMonitor` | `DifficultyManager.ts`, `DifficultyMonitor.ts` | Engine-adjacent | core logic (coupled) | Vue + storage coupled. |
| `engineState` (module-level) | `useNewGameEngine.ts` | `GameScreen`, `App` | Web adapter | Volatile; not in `GameState` snapshot. |

---

## DOM, browser storage, prompt, alert, animation-frame dependencies

| Dependency | Location | Classification | Headless extraction action |
| --- | --- | --- | --- |
| `requestAnimationFrame` | `useNewGameEngine.ts` (`handleChoice`, auto pacing) | Web adapter | Replace with no-op or sync loop in headless automatic progression. |
| `setTimeout` | `useGameEngine.ts` (deprecated), `EventHistory.vue` | Web adapter / UI | Not on engine hot path except deprecated composable. |
| `window.prompt` / `window.alert` | `GameScreen.vue`, `App.vue`, `SaveManager.vue` | Web adapter | Stay Web-only; headless returns structured errors/results. |
| `alert()` | `EndingScreen.vue`, `SaveManager.vue`, `MainDemo.vue` | Web adapter | Same as above. |
| `localStorage` / `window.localStorage` | `SaveManager.ts`, `DifficultyManager.ts`, `debugAccess.ts` | Web adapter / persistence | Headless forbids; use injected snapshot store. |
| `document.createElement` / `querySelector` | `DebugPanel.vue`, `EventHistory.vue` | Web adapter | Export/download UI only. |
| `window.location` / URL params | `debugAccess.ts` | Web adapter | Debug gate only. |
| `navigator` / clipboard (if any) | UI components | Web adapter | Out of P5 headless scope. |

---

## Random and time coupling (non-browser but non-deterministic)

| Pattern | Modules | Classification | P5 adapter target |
| --- | --- | --- | --- |
| `Math.random()` | `GameEngineIntegration`, `EventExecutor`, `TraitSystem`, `TalentSystem`, `DailyEventSystem`, `SetbackEventSystem`, `ChallengeSystem` | core logic | **US-005** random source adapter |
| `Date.now()` / `new Date()` | `SaveManager`, `EventExecutor`, `RouteStateManager`, `DailyEventSystem`, `PerformanceMonitor`, `DifficultyMonitor` | core logic / persistence | **US-006** time source adapter for metadata |

Simulations today patch `Math.random` in `GameProcessSimulator.withSeededRandom` — proof of need for first-class injection.

---

## Dependency classification summary

| Category | Count (representative) | P5 treatment |
| --- | --- | --- |
| **core logic** | Engine integration, executor, loader data, route/life-memory derivation | Extract behind headless session + DI; no behavior change |
| **Web adapter** | Composable, components, rAF, prompts, save UI | Document boundary (**US-019**); production Web unchanged in P5 |
| **test/report-only** | `GameProcessSimulator`, gate scripts, contract tests | Parity harness reference path (**US-021–023**) |
| **deprecated** | `useGameEngine`, `gameStore`, `EffectExecutor`, `storyData` | Ignore for headless; do not expand |

---

## Backend-blocking couplings (P5 extraction targets)

Ordered by severity for Node headless session:

1. **Vue `reactive()` owns `GameState`** — `GameEngineIntegration`
2. **Global `gameEngine` singleton** — no multi-session isolation
3. **Volatile composable session** — current event/choices/feedback outside snapshot
4. **Direct `Math.random()` / `Date.now()`** — no injectable ports
5. **Static `EventLoader` imports** — catalog not behind read interface (**US-007–008**)
6. **`requestAnimationFrame` in choice/auto flow** — `useNewGameEngine`
7. **Browser storage on save/difficulty** — `SaveManager`, `DifficultyManager`
8. **Split orchestration** — composable outcome eval vs `ChoiceOutcomeResolver` / engine

---

## Validation

- Business code: **unchanged** (documentation only).
- Typecheck: run `npm run typecheck` after commit.

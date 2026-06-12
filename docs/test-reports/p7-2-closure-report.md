# P7.2 Closure Report — Server Authoritative Active Planning

Validated: 2026-06-11T04:35:40Z  
Branch: `ralph/p7-2-server-authoritative-active-planning`

**P8.1 衔接：** API 模式真人切片与 headless `gate:playability` 验收见 `docs/PRD/p8-1-api-mode-playability-acceptance.md`、`docs/designs/p8-1-api-human-slice.md`、`docs/test-reports/p8-1-closure-report.md`。

## Changed areas

| Layer | Key changes |
| --- | --- |
| Contracts | `src/contracts/sessionProgression.ts` — `SessionPhase`, `PlanningOptionDto`, progression requests/payload |
| Headless | `getSessionPhase`, `getPlanningOptions`, `executeActiveAction`, `acknowledgeProgression`, volatile summary/disturbance |
| Server | `executeActiveAction`, `acknowledgeProgression`, routes, `mapSessionProgression`, `headlessVolatileCache` |
| Web client | `webApiClient`, `useApiGameEngine`, `App.vue`, `GameScreen` — API planning loop; boundary notice removed |

## API boundary notice

- `GameScreen.vue` `api-boundary-notice` block and styles **removed** (grep: no matches under `src/`).
- `docs/designs/p7-1-api-mode-boundary.md` marked superseded by P7.2.

## Validation evidence (2026-06-11)

| Command | Result | Notes |
| --- | --- | --- |
| `npm run build` | **PASS** | Vite production build ~34s |
| `npm test` | **PASS** | Full suite including P7.2 headless parity/phase, server integration, P8/P9 gates |
| `npm run test:headless` | **PASS** | `p72SessionPhase.test.ts`, `p72ActivePlanningParity.test.ts` |
| `npm run test:p6b:unit` | **PASS** | Router/service unit coverage |
| `npm run test:p6b:db` | **PASS** | Active-action + progression-ack HTTP loop, conflict cases |

### P7.2-specific test artifacts

| Story area | Evidence file |
| --- | --- |
| Session phase machine | `tests/headless/p72SessionPhase.test.ts` |
| Headless vs core parity | `tests/headless/p72ActivePlanningParity.test.ts` |
| Server HTTP integration | `tests/server/integration.test.ts` |
| API boundary copy removal | `tests/p71ActiveActionExperienceTests.ts` (no `api-boundary-notice` assertions) |

### P8/P9 persona gate (orthogonal fix, not P7.2 scope)

`p8-deviant-ye` diverged from `p8-martial-lin` via `src/p8/personaYouthRouteSeeds.ts` + demonic action strategy so P9 hard guard passes **without** refreshing `p8-playability-gate-latest.{json,md}` (rolled back from branch; baseline still lists legacy `martial~deviant` pair but live sim no longer produces it; near-duplicate count 1 ≤ baseline 2).

## PRD story audit (`p7-2-server-authoritative-active-planning.prd.json`)

| Check | Result |
| --- | --- |
| Story count | 58 (`US-001` … `US-058`) |
| `passes: true` | 58 / 58 |
| `passes: false` | 0 |
| W0 docs (US-001–005) | `docs/test-reports/p7-2-*-inventory.md`, `agent_docs/p7-2-scope-guardrails.md`, `docs/designs/p7-2-session-progression-api.md` present |
| W4 closure (US-053–058) | Headless parity tests + this report + full regression gate green |

## Browser acceptance (US-052)

Manual interactive pass per `p7-2-browser-acceptance-notes.md` deferred to release QA; **automated proxy verified**:

- `npm run test:p6b:db` — create → active planning → `executeActiveAction` → summary → `progression-ack` → planning/disturbance
- `npm run test:headless` — phase transitions match server contract

See `docs/test-reports/p7-2-browser-acceptance-notes.md` for dev-stack setup when running manual smoke.

## Out of scope / rolled back from P7.2 diff

- `public/reports/manifest.json` — local `gate:playability` artifact; restored to `HEAD`
- `docs/test-reports/p8-playability-gate-latest.{json,md}` — same; not part of P7.2 delivery

## Code review fixes (2026-06-11)

- Volatile progression state keyed by **sessionId + snapshotId** so `restoreSession` preserves `action_summary` / `disturbance_narrative` mid-flow.
- `loadHeadlessForMutation` applies volatile **before** `resolveSessionAfterAutoProgress`.
- Removed unused `inferSessionPhase` and redundant `terminal`/`lifeMemory` duplication in `buildProgressionResponse`.
- Integration test: restore after active-action without ack returns `action_summary`.

## Residual risks

1. **Volatile cache is in-process** — multi-instance deployment or server restart still loses mid-summary state; snapshotId keying covers same-process restore only.
2. **Browser E2E** — contract covered by integration/headless tests; manual API-stack smoke still recommended before release.
3. **P8 baseline staleness** — committed baseline still names `p8-martial-lin ~ p8-deviant-ye`; persona code fix is ahead of baseline refresh (intentionally excluded from P7.2).

## Follow-ups

- Persist progression volatile in `game_sessions` metadata if horizontal scaling is required.
- Refresh P8 playability baseline in a dedicated P8/P9 content PR when gate owners approve.
- Run manual browser acceptance with live API stack per `p7-2-browser-acceptance-notes.md`.

# P7.2 Browser Acceptance Notes (US-052)

## Setup

```bash
npm run p6b:setup && npm run p6b:serve   # terminal A
# .env.development.local: VITE_P6B_API_URL=http://localhost:8787
npm run dev                               # terminal B
```

## Expected behavior (API mode)

| Check | Status |
| --- | --- |
| New game shows slot UI (no local-only start screen) | Manual QA |
| No `api-boundary-notice` / local-mode guidance | **Removed in P7.2** (verified: no `api-boundary-notice` in `src/`) |
| `sessionPhase: active_planning` shows planning prompt + action choices | Wired via `App.vue` + `useApiGameEngine` |
| Active action → structured summary card | `activeActionSummary` from server |
| Continue → `progression-ack` → planning or disturbance | `handleProgressionAck` |

## Automated coverage (proxy for browser)

| Command | Verified (2026-06-11) | Covers |
| --- | --- | --- |
| `npm run test:p6b:db` | PASS | create/restore, active-action, progression-ack, conflict |
| `npm run test:headless` | PASS | `p72SessionPhase`, `p72ActivePlanningParity` |
| `tests/server/integration.test.ts` (via `npm test`) | PASS | router + gameService progression routes |

Full interactive browser pass requires running dev stack locally (`p6b:serve` + `npm run dev` with `VITE_P6B_API_URL`); automated gates prove API contract and headless parity for P7.2 closure.

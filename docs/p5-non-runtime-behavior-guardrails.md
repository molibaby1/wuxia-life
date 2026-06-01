# P5 Non-Runtime-Behavior Guardrails (US-002)

**Story:** P5 US-002 — Define P5 Runtime Behavior Guardrails

**Authority inputs:** `docs/PRD/p5-headless-engine-and-catalog-read-service.md`, `docs/test-reports/p5-runtime-coupling-baseline.md` (US-001), P4 contracts under `src/contracts/`.

**Purpose:** Freeze gameplay behavior while proving headless execution, catalog read boundaries, and dual-track parity. All P5 sessions must cite this document before modifying code.

---

## 1. P5 phase intent

P5 **proves** P4 service boundaries in executable code: Node-runnable headless session, versioned in-memory catalog read interface, snapshot conversion boundary, and dual-track parity against the current Web/runtime path.

P5 does **not** add HTTP, database, accounts, cloud saves, or mini-program integration.

**Core rule:** P5 must preserve event selection, choice outcomes, feedback semantics, route state, life memory derivation, and event history behavior for the same inputs.

**Regression rule:** P3 experience gates and P4 contract tests must remain valid. Do not relax thresholds to land P5.

---

## 2. Behaviors that must be preserved

| Domain | Must remain identical for same seed + choice log |
| --- | --- |
| Event selection | Weighted selection, guards, cooldowns, route weighting, daily fallback |
| Choice outcomes | Outcome resolution, effect application, availability gating |
| Feedback | `ChoiceFeedbackGenerator` output semantics for equivalent state deltas |
| Route state | `routeStates`, `routeHistory`, flag sync |
| Life memory | `deriveLifeMemorySummary` rules |
| Event history | Formal history append semantics |

---

## 3. Allowed additions

| Category | Examples | Placement |
| --- | --- | --- |
| Headless modules | Session interface, DI ports, adapters | `src/headless/` — no Vue/DOM/browser imports |
| Catalog read | Interface + in-memory adapter | `src/headless/catalog/` |
| Snapshot adapter | Runtime ↔ `GameStateSnapshot` | `src/headless/snapshot/` |
| Parity harness | Dual-track comparison, 0–50 samples | `tests/headless/` |
| Tests | Unit, contract, parity suites | `tests/headless/`, `npm run test:headless` |
| Documentation | Adapter boundaries, architecture, closure | `docs/`, `docs/test-reports/` |

Production Web flow **may** remain on `useNewGameEngine` until a later PRD; P5 does not require switching App to headless execution.

---

## 4. Prohibited changes

Unless a **later approved PRD** explicitly allows:

- New gameplay systems, event rebalance, UI redesign
- HTTP server, network client, ORM, database, account/cloud-save/mini-program runtime
- Changing selection, execution, save compatibility, or P3 gate thresholds
- Direct `Math.random()` / `Date.now()` in new headless code (use adapters)
- Vue, DOM, `localStorage`, `prompt`, `alert`, `requestAnimationFrame` in `src/headless/**`

---

## 5. Verification commands

### 5.1 Every P5 story

| Command | Pass criterion |
| --- | --- |
| `npm run typecheck` | Exit 0 |

### 5.2 Stories with tests or headless code

| Command | Pass criterion |
| --- | --- |
| `npm test` | Exit 0 |
| `npm run test:headless` | Exit 0 (when headless entry exists) |

### 5.3 After runtime-adjacent or closure stories

```text
npm run typecheck
npm test
npm run test:contracts
npm run test:headless
npm run gate:golden-line
npm run gate:midlife
npm run gate:experience
npm run simulate:p3-eval
npm run gate:p5
```

(`gate:p5` added in US-025.)

### 5.4 Implementation wave guidance

| Wave | Stories (typical) | Minimum commands |
| --- | --- | --- |
| Docs / interfaces | US-001–004, US-019–021 | `typecheck` |
| Adapters | US-005–012 | `typecheck`, `npm test`, `test:headless` |
| Headless session | US-013–018 | above + `test:headless` |
| Parity + gate | US-022–025 | full §5.3 |

---

## 6. Prohibited change checklist

A change is **prohibited** if it:

1. Alters simulation output for the same seed and choice sequence (event id, state, route, feedback, life memory, history).
2. Modifies `EventLoader` runtime loading for the Web path (in-memory adapter is add-only).
3. Weakens P3/P4/P5 gates without approved doc updates.
4. Introduces forbidden dependencies into `src/headless/**`.

---

## 7. Related documents

| Document | Role |
| --- | --- |
| `docs/test-reports/p5-runtime-coupling-baseline.md` | US-001 coupling inventory |
| `docs/contracts/*` | P4 transport contracts |
| `docs/test-reports/p3-midlife-trust-targets.md` | P3 frozen thresholds |

---

*P5 US-002 — headless extraction without silent gameplay drift.*

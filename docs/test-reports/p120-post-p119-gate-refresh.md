# P120 Post-P119 Gate Refresh — playability & P20

**Date:** 2026-07-02  
**Branch:** `codex/p120-wuxia-lifetime-simulation-end-state-reconciliation-post-founding-patriarch`  
**Story:** P120-001  
**Pre-P119 baseline:** P119 closure deferred broad gate rerun (GAP-P119-N01); baselines frozen from latest pre-P119 reports.

---

## Commands

```bash
npm run gate:playability   # headless_server, age 0–40, 8 personas
npm run gate:p20
```

---

## Results

| Gate | Pre-P119 baseline | Post-P119 (P120) | Delta |
| --- | --- | --- | --- |
| `gate:playability` | **PASS** (2026-06-26T02:32:15Z) | **PASS** (2026-07-02T12:38:39Z) | **No regression** — 0 blockers both runs |
| `gate:p20` | **pass** (2026-06-10T23:44:40Z) | **pass** (2026-07-02T12:38:52Z) | **No regression** — validation matrix unchanged |

### Pre-P119 baseline artifacts

- `docs/test-reports/p120-pre-p119-p8-playability-gate-baseline.json`
- `docs/test-reports/p120-pre-p119-p20-gate-baseline.json`

### Post-P119 latest artifacts

- `docs/test-reports/p8-playability-gate-latest.{json,md}`
- `docs/test-reports/p20-gate-latest.{json,md}`

---

## P8 playability detail

**Decision:** PASS (unchanged)

| Metric | Pre-P119 | Post-P119 |
| --- | --- | --- |
| Blockers | 0 | 0 |
| Warnings | 3 | 6 |
| Near-duplicate pairs | 3 | 2 |

**Warning drift (non-blocking):** Post-run adds `narrative_memory` warnings for `p8-wealth-shen` and `p8-balanced-wei`; causality echo counts shifted for `p8-balanced-wei` (2→0) and `p8-wealth-shen` (new 0-echo warning). Near-duplicate pairs decreased 3→2. All changes are warning-tier only; no persona blockers introduced.

**Initial run failure (fixed):** First post-P119 `gate:playability` invocation crashed with `ReferenceError: resolvePlanningPlaceholderText is not defined` in `preschoolPassiveSpine.ts` — pre-existing missing import, not P113–P119 spine content. **Minimal fix:** add `resolvePlanningPlaceholderText` to import from `passivePlanningPlaceholder.ts`. Re-run PASS.

---

## P20 replayability detail

**Decision:** pass (unchanged)

| Validation | Pre-P119 | Post-P119 |
| --- | --- | --- |
| archetypeDifferentiation | pass | pass |
| repetitionReduced | pass | pass |
| pacingDiffers | pass | pass |
| replaySlicesPass | pass | pass |
| regressionMatrixPass | pass | pass |

**Coverage:** 5 archetype families, 5 pacing profiles, 5 replay slices (unchanged)

---

## North Star §8 item 5 assessment

| Criterion | Status | Rationale |
| --- | --- | --- |
| `gate:playability` 不退化 | **Met** | PASS → PASS; 0 blockers; warning drift only |
| `gate:p20` 不退化 | **Met** | pass → pass; validation flags unchanged |

---

## Gameplay changes

One minimal import fix in `src/data/preschoolPassiveSpine.ts` to restore gate parity. No founding-patriarch spine or scheduler changes.

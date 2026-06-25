# P36 Post-P35 Gate Refresh — playability & P20

**Date:** 2026-06-24  
**Branch:** `codex/p36-wuxia-lifetime-simulation-end-state-gate-refresh-and-reconciliation`  
**Story:** P36-001  
**Pre-P35 baseline:** P35 closure skipped gate execution (§8 item 5); baselines frozen at 2026-06-24 pre-finalize reports.

---

## Commands

```bash
npm run gate:playability   # headless_server, age 0–40, 8 personas
npm run gate:p20
```

---

## Results

| Gate | Pre-P35 baseline | Post-P35 (P36) | Delta |
| --- | --- | --- | --- |
| `gate:playability` | **FAIL** (2026-06-24T05:07:38Z) | **FAIL** (2026-06-24T06:44:16Z) | **No regression** — identical 6 frustration blockers |
| `gate:p20` | **pass** (2026-06-24T02:25:44Z) | **pass** (2026-06-24T06:41:43Z) | **No regression** — all validation flags unchanged |

### Pre-P35 baseline artifacts

- `docs/test-reports/p36-pre-p35-p8-playability-gate-baseline.json` (copy of pre-run latest)
- `docs/test-reports/p36-pre-p35-p20-gate-baseline.json` (copy of pre-run latest)

### Post-P35 latest artifacts

- `docs/test-reports/p8-playability-gate-latest.{json,md}`
- `docs/test-reports/p20-gate-latest.{json,md}`

---

## P8 playability detail

**Decision:** FAIL (unchanged)

**Blocking failures (6 personas, frustration opaque ratio 1.00):**

| Persona | Pre-P35 | Post-P35 |
| --- | --- | --- |
| p8-martial-lin | fail | fail |
| p8-social-gu | fail | fail |
| p8-wealth-shen | fail | fail |
| p8-cautious-han | fail | fail |
| p8-deviant-ye | fail | fail |
| p8-balanced-wei | fail | fail |

**Passing personas (unchanged):** p8-scholar-su, p8-explorer-lu

**Warnings (unchanged):** p8-deviant-ye low-impact span 6y; 7 near-duplicate replay pairs

**Regression assessment:** `blockingFailures` arrays are byte-identical on `detail` fields. P34/P35 lifetime sim work did not alter P8 gate persona outcomes. Pre-existing frustration blockers remain; no new blockers introduced.

---

## P20 replayability detail

**Decision:** pass (unchanged)

| Validation | Pre-P35 | Post-P35 |
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
| `gate:playability` 不退化 | **Met (no regression)** | Identical blocker set vs pre-P35 baseline; FAIL is pre-existing |
| `gate:p20` 不退化 | **Met** | pass → pass, validation matrix unchanged |

**Note:** §8 item 5 requires gates not **regress** relative to baseline, not that P8 must pass. P8 frustration blockers pre-date P34/P35 and are out of P36 scope (non-goal: no scheduler rewrite).

---

## Gameplay changes

None. Gate refresh is documentation-only; no code or content changes required to restore parity.

# P132 Post-P131 Gate Refresh — playability & P20

**Date:** 2026-07-09  
**Branch:** `codex/p132-wuxia-wave2-pinnacle-end-state-reconciliation`  
**Story:** P132-001  
**Pre-P131 baseline:** P131 closure deferred broad gate rerun (GAP-P131-N04); baselines frozen from P120 post-P119 gate refresh.

---

## Commands

```bash
npm run typecheck
npm exec tsx tests/p131PinnacleMythLegendSpineTests.ts
npm exec tsx tests/p35MixedPinnacleParityTests.ts
npm run gate:playability   # headless_server, age 0–40, 8 personas
npm run gate:p20
```

---

## Narrow regression results

| Check | Result | Notes |
| --- | --- | --- |
| `npm run typecheck` | **PASS** | 2026-07-09 |
| `p131PinnacleMythLegendSpineTests` | **PASS** | All 11 assertions |
| `p35MixedPinnacleParityTests` | **PASS** | P35 lifetime slice parity unchanged |

---

## Gate results

| Gate | Pre-P131 baseline (P120) | Post-P131 (P132) | Delta |
| --- | --- | --- | --- |
| `gate:playability` | **PASS** (2026-07-02T12:38:39Z) | **PASS** (2026-07-09T03:26:57Z) | **No regression** — 0 blockers both runs |
| `gate:p20` | **pass** (2026-07-02T12:38:52Z) | **pass** (2026-07-09T03:27:02Z) | **No regression** — validation matrix unchanged |

### Pre-P131 baseline artifacts

- `docs/test-reports/p120-pre-p119-p8-playability-gate-baseline.json`
- `docs/test-reports/p120-pre-p119-p20-gate-baseline.json`
- `docs/test-reports/p120-post-p119-gate-refresh.md`

### Post-P131 latest artifacts

- `docs/test-reports/p8-playability-gate-latest.{json,md}`
- `docs/test-reports/p20-gate-latest.{json,md}`

---

## P8 playability detail

**Decision:** PASS (unchanged)

| Metric | Pre-P131 (P120) | Post-P131 (P132) |
| --- | --- | --- |
| Blockers | 0 | 0 |
| Warnings | 6 | 6 |
| Personas passing frustration | 8/8 | 8/8 |

**Warning drift (non-blocking):** Near-duplicate replay pairs reduced from 7 → 2 (`p8-wealth-shen ~ p8-balanced-wei`, `p8-cautious-han ~ p8-deviant-ye`). No new frustration opaque-ratio blockers.

**Regression assessment:** P131 jianghu_myth_legend spine events (`jianghu_myth_legend_on_ramp_entry`, `jianghu_myth_legend_luck_window_echo`) are orthodox-gated and do not fire on P8 martial_family persona runs (no `p16_guardian_oath` in gate window). No unexplained blocker regression vs P120 baseline.

---

## P20 replayability detail

**Decision:** pass (unchanged)

| Validation | Pre-P131 | Post-P131 |
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
| `gate:playability` 不退化 | **Met** | PASS → PASS; 0 blockers |
| `gate:p20` 不退化 | **Met** | pass → pass; validation flags unchanged |
| P25 dedicated reports | **Met** | No P25 baseline metric drift observed |

---

## Gameplay behavior changes

**None.** P132 gate refresh is documentation-only; no runtime fixes required.

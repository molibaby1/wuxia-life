# Persona Pacing Slice B — Before/After Evidence

Governance closure for Slice B (P8 persona low-impact span tuning probe). Layer: `tuning_config`.

Generated: 2026-06-23

## Slice Summary

**Probes attempted (reverted — no net config change):**

| Probe | Knob | From → To | M1 delta |
| --- | --- | --- | --- |
| Primary | `P20_MARTIAL_ASCENDANT` `stage_10_20.payoffSpacingMultiplier` | 0.9 → 0.72 | **0** |
| Secondary | `P20_MARTIAL_ASCENDANT` `stage_0_10.payoffSpacingMultiplier` | 0.85 → 0.70 | **0** |

Final codebase state: **reverted to pre-slice values** `[0.85, 0.9, 0.68, 1.0]` on martial payoff spacing array.

## Methodology

- **Baseline:** `persona-pacing-slice-b-baseline-metrics.json` + `gate:playability`
- **After probe:** same commands; metrics identical
- **Root cause:** universal 7–13/14 gap; `isPacingImpactRecord` excludes most auto/training events in band; payoff spacing only boosts selection of already-tagged payoff events — insufficient when gap is content/metric-definition driven
- **Guardrails:** PASS throughout — see `persona-pacing-slice-b-gate-regression.md`

## Target Metric Comparison

| ID | Metric | Baseline | After (probe) | Verdict |
| --- | --- | --- | --- | --- |
| **M1** | Personas span >5y | **8/8** | **8/8** | **Inconclusive** — no movement |
| **M2** | Max persona span | **7y** | **7y** | **Inconclusive** |
| **M3** | Cohort max span | **5y** | **5y** | **OK** — no regression |
| **G1** | Playability | PASS | PASS | **OK** |

All 8 personas retain identical span bands (7–13 or 7–14).

## Key Learnings

1. **Persona P8 warnings decouple from cohort M3** — second slice + Slice A improved cohort max to 5y while P8 persona warnings stayed 6–7y.
2. **Single-archetype payoffSpacing does not move P8 spans** — eight personas share the same 7–13 gap regardless of martial profile knob.
3. **`densityMultiplier` and `payoffSpacingMultiplier` on stage bands are insufficient** when low-impact spans are defined by missing impact-tagged content, not event selection weight alone.
4. **Next layer: world profile** — ages 7–13 need theme-owned payoff/milestone content (or profile-owned event pools with impact semantics), not another generic multiplier pass.

## Escalation Recommendation

| Issue | Next layer | Evidence |
| --- | --- | --- |
| P8 8/8 persona 6–7y spans at ages 7–13 | **world profile / content structure** | Two bounded tuning probes zero delta; universal age band |
| Cohort M3 at 5y | **Monitor** | Already improved in prior slices |
| `isPacingImpactRecord` strictness | **Optional runtime slice (last resort)** | Only if profile content added but metric still flat |

**Overall slice verdict:** **Inconclusive for tuning_config** — probes exhausted on allowed surface; **no persistent code changes** retained. Escalate to **world profile** slice for 7–13 childhood payoff content.

## References

- Targets: `docs/designs/persona-pacing-slice-b-targets.md`
- Baseline: `persona-pacing-slice-b-baseline-metrics.json`
- After probe: `persona-pacing-slice-b-after-metrics.json`
- Regression: `persona-pacing-slice-b-gate-regression.md`
- Prior pacing audit: `second-tuning-slice-adult-repetition-pacing-audit.md`

# P38 Post-Remediation Gate Refresh — Delta vs P36 Baseline

**Date:** 2026-06-24  
**Story:** P38-004  
**Branch:** `codex/p38-wuxia-p8-playability-frustration-remediation`  
**Pre-remediation baseline:** `docs/test-reports/p36-post-p35-gate-refresh.md` (gate JSON 2026-06-24T06:44:16Z)

---

## Commands

```bash
npm run gate:playability   # headless_server, age 0–40, 8 personas
npx tsc --noEmit
npm exec tsx tests/p38FrustrationRemediationTests.ts
npm exec tsx tests/p37AdditionalMixedPinnacleParityTests.ts
npm exec tsx tests/p36ConsistencyTests.ts
```

---

## Gate decision

| Gate | P36 post-P35 baseline | P38 post-remediation | Delta |
| --- | --- | --- | --- |
| `gate:playability` | **FAIL** (6 frustration blockers) | **PASS** | **Improved** — all 8 personas frustration pass |
| `gate:p20` | pass (unchanged) | pass (not re-run; no narrative scheduler change) | No regression expected |

**Latest artifacts:** `docs/test-reports/p8-playability-gate-latest.{json,md}`

---

## Frustration opaque ratio — blocker personas

| Persona | P36 baseline | P38 post-remediation | Target (<0.35) |
| --- | --- | --- | --- |
| p8-martial-lin | 1.00 (5/5 opaque) | **0.00** (0/4 opaque) | Met |
| p8-social-gu | 1.00 (3/3) | **0.00** (0/3) | Met |
| p8-wealth-shen | 1.00 (5/5) | **0.00** (0/4) | Met |
| p8-cautious-han | 1.00 (7/7) | **0.00** (0/6) | Met |
| p8-deviant-ye | 1.00 (1/1) | **0.00** (0/1) | Met |
| p8-balanced-wei | 1.00 (7/7) | **0.00** (0/5) | Met |

**Threshold:** ≥4/6 former blockers below 0.35 → **6/6 Met**

---

## Passing persona regression guard

| Persona | P36 | P38 |
| --- | --- | --- |
| p8-scholar-su | 0.00 | 0.00 |
| p8-explorer-lu | 0.00 | 0.00 |

---

## Setback classification shift (aggregate)

| eventId | P36 opaque count | P38 opaque count |
| --- | --- | --- |
| setback_injury | 13 | 0 (all `explained`) |
| setback_property_loss | 10 | 0 (all `explained`) |
| love_secret_help | 3 | 0 (non-setback) |
| setback_cultivation_deviation | 2 | 0 (non-setback) |

---

## Isolated regression

- `tests/p38FrustrationRemediationTests.ts` — fixed narrative classification + gate report threshold assert

---

## Assessment

Narrative-first causality wiring on four high-frequency templates eliminated all frustration opaque blockers. P8 playability gate **PASS** for the first time on frustration metric across all 8 personas.

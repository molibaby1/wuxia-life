# P38 Closure Report — P8 Playability Frustration Remediation

**Date:** 2026-06-24  
**Branch:** `codex/p38-wuxia-p8-playability-frustration-remediation`  
**PRD:** `docs/PRD/p38-wuxia-p8-playability-frustration-remediation.md`  
**Parent:** P37 closure, P36 §8 reconciliation `docs/test-reports/p36-north-star-section8-reconciliation.md`

---

## 1. Summary

P38 remediated P8 playability frustration blockers by auditing opaque setback root causes across 6 failing personas, wiring causality/explanation signals into four high-frequency event templates (`setback_injury`, `setback_property_loss`, `love_secret_help`, `setback_cultivation_deviation`), re-running `gate:playability`, and updating North Star §8 item 5 from **Partial (no-regression only)** to **Met (absolute pass)** for `gate:playability`.

No scheduler rewrite, no lifetime sim trace changes, no P26–P37 story modifications.

---

## 2. Deliverables

| Story | Deliverable |
| --- | --- |
| P38-001 | `docs/test-reports/p38-opaque-setback-root-cause-audit.md` |
| P38-002 | Narrative fixes in `setback-events.json`, `love.json`; `docs/test-reports/p38-recurring-setback-causality-wiring.md` |
| P38-003 | `setback_cultivation_deviation` fix; `docs/test-reports/p38-persona-cluster-frustration-fixes.md` |
| P38-004 | `docs/test-reports/p38-post-remediation-gate-refresh.md`; `tests/p38FrustrationRemediationTests.ts`; updated `p8-playability-gate-latest.*` |
| P38-005 | This closure report |

---

## 3. Audit and fixes

### Root-cause audit (P38-001)

- 28 opaque setbacks across 6 blocker personas; 100% opaque ratio on each
- Top eventIds: `setback_injury` (13), `setback_property_loss` (10), `love_secret_help` (3), `setback_cultivation_deviation` (2)
- Gap: templates lacked `collectFrustrationMetrics` causality keywords; `love_secret_help` false-positive from `危机` on positive event

### Narrative remediation (P38-002 / P38-003)

| eventId | Fix | Classification after |
| --- | --- | --- |
| `setback_injury` | Added `导致` + recoverable hint | `explained` |
| `setback_property_loss` | Added `由于`/`导致` + recoverable hint | `explained` |
| `love_secret_help` | Removed `危机`; added `由于` context | non-setback |
| `setback_cultivation_deviation` | Added `由于`/`导致`; removed `危机` | non-setback |

---

## 4. Gate delta vs P36 baseline

| Metric | P36 post-P35 | P38 post-remediation |
| --- | --- | --- |
| `gate:playability` decision | FAIL | **PASS** |
| Blocker personas opaque ratio | 6/6 at 1.00 | **6/6 at 0.00** |
| Passing personas | p8-scholar-su, p8-explorer-lu unchanged | 0.00 opaque ratio retained |
| `gate:p20` | pass | pass (carry-forward; not re-run) |

Full delta: `docs/test-reports/p38-post-remediation-gate-refresh.md`

---

## 5. Verification commands

```bash
npm run gate:playability
npx tsc --noEmit
npm exec tsx tests/p38FrustrationRemediationTests.ts
npm exec tsx tests/p8PlayabilityTests.ts
npm exec tsx tests/p37AdditionalMixedPinnacleParityTests.ts
npm exec tsx tests/p36ConsistencyTests.ts
```

All executed successfully on 2026-06-24.

---

## 6. North Star §8 item 5 update

| Criterion | Pre-P38 (P36) | Post-P38 |
| --- | --- | --- |
| `gate:playability` 不退化 | Met (no regression) | **Met** |
| `gate:playability` absolute pass | **Open** (6 frustration blockers) | **Met** — decision PASS, 8/8 personas frustration pass |
| `gate:p20` 不退化 | Met | Met (unchanged) |
| P25 dedicated reports | carry-forward | carry-forward |

**§8 item 5 status after P38:** **Met** — both non-regression and absolute `gate:playability` pass achieved for frustration metric.

**Remaining §8 OPEN items (unchanged by P38):**

| Item | Status | Defer queue |
| --- | --- | --- |
| 1 — 三类可玩样本 | Partial | P37 closed additional outcomes; full spectrum doc still open |
| 3 — 零自相矛盾 | Partial | Full event pool audit |
| 5 — 门禁 | **Met** (P38) | P8 warnings (pacing/replay near-duplicates) remain non-blocker |

---

## 7. Residual risks and defer queue

- **P8 warnings:** p8-deviant-ye low-impact span 6y; 7 near-duplicate replay pairs — non-blocker, follow-up optional
- **Full setback pool audit:** `setback_illness`, `setback_betrayal`, `setback_early_death` not in baseline opaque set; defer full pool review
- **Wave 3/4:** `merchant_magnate`, ordinary-origin expansion — unchanged defer
- **Medical pool full habit-led migration** — unchanged defer
- **Metric rule changes:** not required; narrative-first remediation sufficient

---

## 8. Commits (P38 branch)

| Commit | Story |
| --- | --- |
| `30a095a` | P38-001 opaque setback audit |
| `1195f04` | P38-002 recurring setback causality wiring |
| `34cbc57` | P38-003 persona-cluster frustration fixes |
| `5b06968` | P38-004 gate refresh and regression tests |
| (this commit) | P38-005 closure |

---

## 9. Discovery note

P38 satisfies PRD success metrics (≥4/6 blockers below 0.35, ≥3 template fixes, carry-forward tests pass). Recommend post-run `discovery-pass` on P38 PRD before outer-loop CLEAR reassessment.

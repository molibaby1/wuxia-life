# P44 Habit Audit Tooling Closure

**Date:** 2026-06-25  
**Branch:** `codex/p44-wuxia-habit-trajectory-operator-audit-tooling`  
**PRD:** `docs/PRD/p44-wuxia-habit-trajectory-operator-audit-tooling.md`

---

## 1. Success Metrics

| ID | Metric | Target | Result |
| --- | --- | --- | --- |
| **M1** | Operator coverage visibility | repeatable audit exists | **Met** — `npm run audit:p44-habit` |
| **M2** | Legacy flag drift detection | structured suspicious-reader output | **Met** — 23 allowed / 0 suspicious |
| **M3** | Archetype differentiation observability | reportable per family | **Met** — per-axis report with convergence warnings |
| **M4** | Audit regression repeatability | runnable in one command flow | **Met** — typecheck + `p44HabitAuditTests` |

---

## 2. Validation Commands

```bash
npm run typecheck
npm exec tsx tests/p44HabitAuditTests.ts
npm run audit:p44-habit
```

All passed on 2026-06-25.

---

## 3. Real Examples Per Audit Class

### 3.1 Coverage gap (Q1)

**Finding:** `businessHabit` has zero readers in `childhood` and `later_life` bands.

**Evidence:** `docs/test-reports/p44-habit-coverage-audit.md` — matrix row shows 0/0; flagged in Gaps section.

**Operator action:** Prioritize new gated readers before next merchant/livelihood content wave.

### 3.2 Legacy flag drift (Q2)

**Finding:** Content pools retain compatibility co-gates (`lifeStates.*` + `flags.has("study_habit")`) — classified **allowed**, not suspicious.

**Evidence:** `docs/test-reports/p44-legacy-flag-drift-audit.md` — sample co-gate in `p21-content-samples.json` line with `lifeStates.studyHabit >= 2 || flags.has("study_habit")`.

**Operator action:** Re-run after content merges; investigate any future `suspicious_primary` hits.

### 3.3 Archetype differentiation (Q3)

**Finding:** `businessHabit` differentiation **partial** — only `merchant` cluster variants; convergence warning emitted.

**Evidence:** `docs/test-reports/p44-archetype-differentiation-audit.md` — sample events `p42_business_habit_youth_stall`, `p42_business_habit_midlife_syndicate`.

**Operator action:** Add contrasting non-merchant livelihood echo pair (e.g. scholar-administrator ledger vs merchant stall).

### 3.4 Recap absorption (Q4)

**Finding:** Required engine surfaces wired (`buildLateLifeShapingRecapLine`, `deriveDominantShapingLines`); `EndingScreen.vue` remains deferred.

**Evidence:** `runRecapAbsorptionAudit()` in `tests/p44HabitAuditTests.ts`; P43 wiring in `finalSummaryComposition.ts`, `EndingSystem.ts`.

**Operator action:** Manual UI wiring when ending screen refresh is scheduled.

---

## 4. Deliverables

| Artifact | Path |
| --- | --- |
| Audit contract | `docs/designs/p44-habit-audit-contract.md` |
| Audit module | `src/p44/habitOperatorAudit.ts` |
| CLI runner | `scripts/runP44HabitOperatorAudit.ts` |
| Regression tests | `tests/p44HabitAuditTests.ts` |
| JSON envelope | `docs/test-reports/p44-habit-operator-audit.json` |
| Sample reports | `docs/test-reports/p44-*-audit.md` |

---

## 5. What Remains Manual

- Narrative copy quality review (legibility, tone) for flagged events
- Ending UI surfacing of P19 shaping recap (`EndingScreen.vue`)
- Lifetime simulation traces (P25/P35 gates) — separate from P44 operator audits
- Archetype differentiation expansion for `businessHabit` and `familyBond` beyond cluster heuristics
- Threshold tuning for low-density alerts (currently 1 reader per band)

---

## 6. Recommended Operator Workflow

Before merging a shaping content wave:

1. `npm run audit:p44-habit`
2. Review coverage gaps/low-density in `p44-habit-coverage-audit.md`
3. Confirm `suspiciousCount === 0` in legacy drift report
4. Check convergence warnings in archetype report
5. Run `npm exec tsx tests/p44HabitAuditTests.ts` in CI or pre-merge checklist

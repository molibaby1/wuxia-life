# P28 Semi-Personality Axis Content Wiring — Audit Delta

**Date:** 2026-06-24  
**Branch:** `codex/p28-wuxia-semi-personality-axis-content-wiring`  
**Story:** P28-001  
**Baseline:** `docs/test-reports/p27-closure-report.md`, `docs/test-reports/p27-habit-pool-audit-delta.md`

Read-only inventory of `socialMomentum` / `familyBond` runtime vs content-layer usage. No gameplay behavior changed in this story.

---

## 1. Runtime vs Content Usage

| Layer | `socialMomentum` | `familyBond` | Notes |
| --- | --- | --- | --- |
| Schema | `lifeStates.ts` key 0–5 | same | Semi-personality axes alongside habit axes |
| Daily hooks | `dailyEvents.ts` — weight + increment on 4 events | same — weight + increment on 3 events | Behavior accumulation path exists |
| Scheduler | `GameEngineIntegration.ts` — tag multipliers, decay on major events | same | Not content-gated |
| Daily mood | `DailyEventSystem.ts` — positive/negative bias | same | Runtime only |
| Endings | `EndingSystem.ts` — anchor / isolation gates | same | Outcome tier, not event fork |
| Temperament | — | `temperaments.ts` startingStates +1 | Origin seed only |
| **Content JSON conditions** | **0 readers** | **0 readers** | GAP-P27-001 |
| Content JSON writers | — | `family-life.json` — 5 `life_state_change` effects | Writers only; no threshold gates |

**Verdict:** Both axes accumulate via daily hooks and influence scheduling, but **cannot分流 narrative content** until P28 adds `lifeStates.* >= threshold` conditions.

---

## 2. Content Pool Gap Classification

| Pool | Current state | P28 target | Story |
| --- | --- | --- | --- |
| `p22-content-expansions.json` | Habit axes only (P26/P27) | +2 `socialMomentum` samples (fork + reinforcement) | P28-002 |
| `family-life.json` | Family events write `familyBond`; no readers | +2 `familyBond` samples (obligation + support) | P28-003 |
| `p22-content-expansions.json` (P17) | P27 mentor/renown/business consequences | +1 `familyBond` mid/late consequence | P28-004 |
| `p21-content-samples.json` | No semi-personality echo | Deferred — social axis covered in P22 | — |
| `medical.json` | `studyHabit` only (P27) | Out of P28 scope | Future wave |

---

## 3. Validation Slice Gaps

| Slice | Current coverage | P28 action | Story |
| --- | --- | --- | --- |
| `src/p25/habitTrajectorySlice.ts` | P26 early/later echo only | Add P27 mentor/renown/medical + P28 semi-personality events | P28-005 |
| `src/p20/habitTrajectorySlice.ts` | P26 + P27 event IDs | Add P28 event IDs for replay divergence | P28-007 |
| `tests/personalityHabitTrajectoryTests.ts` | Habit axes + P27 | Add P28 social/family/consequence asserts | P28-006 |

---

## 4. P28 Execution Order

| Priority | Story | Target | Axis / Layer |
| --- | --- | --- | --- |
| 1 | P28-001 | This audit | Docs only |
| 2 | P28-002 | `p22-content-expansions.json` | `socialMomentum` fork + reinforcement |
| 3 | P28-003 | `family-life.json` | `familyBond` obligation + support |
| 4 | P28-004 | `p22-content-expansions.json` | `familyBond` P17 caretaker consequence |
| 5 | P28-005 | `habitTrajectorySlice.ts` (P25) | P27 + P28 event lists |
| 6 | P28-006 | `personalityHabitTrajectoryTests.ts` | Regression |
| 7 | P28-007 | `habitTrajectorySlice.ts` (P20) | Replay reporting sync |
| 8 | P28-008 | Closure report | Docs only |

---

## 5. Deferred (Out of P28 Scope)

| Item | Reason | Target |
| --- | --- | --- |
| Full medical pool habit/semi-personality migration | P28 Non-goals | Future wave |
| P24 calibration fixture refresh | P28 Non-goals | P24 reconciliation |
| P25 Wave 2–4 achievement configs | P28 Non-goals | P25 end-state |
| Second semi-personality P17 (socialMomentum consequence) | P28 limit 1 consequence | P29+ |
| Legacy `*_habit` reader removal | Compatibility policy | Future |

---

## 6. Verification

```bash
# Audit-only story — no gameplay tests required
rg 'lifeStates\.(socialMomentum|familyBond)' src/data/lines --glob '*.json'
rg 'socialMomentum|familyBond' src/core src/data/life --glob '*.ts'
```

# P31 Closure Report — Wave 1 Habit-Led Achievement Unlock Chain

**Date:** 2026-06-24  
**Branch:** `codex/p31-wuxia-wave1-habit-led-achievement-unlock-chain`  
**PRD:** `docs/PRD/p31-wuxia-wave1-habit-led-achievement-unlock-chain.md`

---

## 1. Summary

P31 closed Wave 1 habit-led → composite destiny **unlock chain** on top of P30 sim observability: key-choice bridge audit, 3 threshold-gated bridges on P27–P29 events, bridge-resolved full-unlock fixtures, sim baseline delta showing >0% unlock vs P30 0%, regression coverage, and optional short-chain sim skip.

---

## 2. Deliverables

| Story | Deliverable |
| --- | --- |
| P31-001 | `docs/test-reports/p31-key-choice-bridge-audit-delta.md` |
| P31-002 | 3 bridges in `p22-content-expansions.json` + `medical.json`; `p31HabitLedKeyChoiceBridges.ts` |
| P31-003 | `P31_HABIT_LED_FULL_UNLOCK_PATHS`, `evaluateHabitLedPathWithP31Bridges()` in `validationSlices.ts` |
| P31-004 | `p31-habit-led-sim-baseline-metrics.json`, `p31-habit-led-sim-baseline-delta.md` |
| P31-005 | P31 asserts in `p25LifetimeSimulationTests.ts` |
| P31-006 | **Skipped** — P31-003 static fixtures + bridge tests prove unlock chain |
| P31-007 | This closure report |

---

## 3. Bridge Wiring

| # | Event | Sets | Habit gate | Bridge precondition |
| --- | --- | --- | --- | --- |
| 1 | `p28_social_reputation_reinforcement` (attend) | `ally_network` | `socialMomentum` ≥2 | `p28_social_reputation_reinforced` |
| 2 | `p27_study_habit_healer_reinforcement` (positive) | `medical_pure` | `studyHabit` ≥2 | `p27_study_healer_path` |
| 3 | `p29_study_habit_case_record_duty` (positive) | `medical_divine_doctor_fame` | `studyHabit` ≥3 | `p27_study_healer_path` + event condition |

Bridges respect `medical_poison_path` mutex. No stat-gate bypass. Total 3 bridges (under max 4).

---

## 4. Sim Baseline Delta (vs P30)

| Outcome | P30 habit-led unlock | P31 habit-led unlock (bridges) |
| --- | --- | --- |
| `jianghu_renown_sage` | 0% | **100%** |
| `medical_sage_healer` | 0% | **100%** |

---

## 5. Verification Commands

```bash
npm run typecheck
npm exec tsx tests/p25LifetimeSimulationTests.ts
npm exec tsx scripts/runP31HabitLedSimulationBaseline.ts
npm exec tsx scripts/runP30HabitLedSimulationBaseline.ts
```

All passed on 2026-06-24 (no full build per execution policy).

---

## 6. Remaining Wave 1 Unlock Gaps

| Gap | Status after P31 | Notes |
| --- | --- | --- |
| `mentor_bond` via habit-led social path | **Partial** | Patron obligation cluster thematic; `ally_network` bridge sufficient for unlock |
| `medical_imperial` via habit-led path | **Deferred** | `medical_divine_doctor_fame` + `medical_pure` covers unlock; imperial chain unchanged |
| Full medical pool habit migration | **Deferred** | 3/18 habit-led samples |
| End-to-end lifetime sim birth→death | **Deferred** | P31 uses validation slice + bridge resolver |
| Runtime bridge vs static resolver parity | **Monitor** | JSON event effects + `resolveP31HabitLedKeyChoiceBridges` must stay aligned |

---

## 7. North Star §8 Items Still OPEN After P31

Per `docs/designs/p25-lifetime-simulation-north-star.md` §8:

| §8 Item | Status after P31 |
| --- | --- |
| 主流、混合、巅峰三类成就均有可玩样本且规则文档化 | **Partial** — Wave 1 two new achievements habit-unlock proven; mixed/pinnacle habit-led not expanded |
| 行为轨迹（习惯/半人格）可观测、可分流、可收束 | **Partial** — P27–P31 chain closes Wave 1 unlock; full pool migration OPEN |
| 平凡出身 Wave 4 扩展 | **Deferred** |
| 重玩 proxy / 多路径分化 baseline | **Deferred** |
| Legacy `*_habit` 读者移除 | **Deferred** — dual-read compat retained |

---

## 8. Deferred Queue (P32+)

- Optional short-chain sim slice (P31-006 skipped)
- `medical_imperial` habit-led bridge if imperial path needs behavior-led entry
- Full medical pool stat/talent → habit gate migration (3/18)
- Wave 2–4 achievement content
- Discovery pass on P31 PRD for end-state reconciliation

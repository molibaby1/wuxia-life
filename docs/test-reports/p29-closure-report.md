# P29 Closure Report — Medical Habit Pool Expansion And Social Consequence Wiring

**Date:** 2026-06-24  
**Branch:** `codex/p29-wuxia-medical-habit-pool-expansion-and-social-consequence-wiring`  
**PRD:** `docs/PRD/p29-wuxia-medical-habit-pool-expansion-and-social-consequence-wiring.md`

---

## 1. Summary

P29 completed the third-round habit pool migration for medical content and deferred `socialMomentum` P17 consequence: audit delta, 2 medical pool habit/semi-personality samples, 1 `socialMomentum` mid/late-life consequence, P25/P20 trajectory slice extensions, and isolated regression coverage. No new personality container or fourth habit axis.

---

## 2. New Content Samples

| Event ID | Axis | Layer | Story |
| --- | --- | --- | --- |
| `p29_study_habit_case_record_duty` | `studyHabit` | Obligation (case-record compilation) | P29-002 |
| `p29_social_momentum_healer_network` | `socialMomentum` | Opportunity (healer network) | P29-002 |
| `p29_social_momentum_patron_obligation` | `socialMomentum` | P17 consequence (patron burden) | P29-003 |

**Medical pool habit/semi-personality samples after P29:** 3 total (P27 reinforcement + P29 study obligation + P29 social network).

**Semi-personality P17 consequence count:** 2 total (`p28_family_bond_caretaker_obligation` + `p29_social_momentum_patron_obligation`).

---

## 3. Slice Extensions

| Slice | Change | Story |
| --- | --- | --- |
| `src/p25/habitTrajectorySlice.ts` | P29 medical + social patron events in early/later echo phases | P29-004 |
| `src/p20/habitTrajectorySlice.ts` | P29 event IDs in replay divergence list | P29-006 |

---

## 4. Verification Commands

```bash
npm exec tsx tests/personalityHabitTrajectoryTests.ts
npm exec tsx tests/p20ReplayabilityTests.ts
npm exec tsx tests/p25LifetimeSimulationTests.ts
npm exec tsx scripts/runP25HabitTrajectorySlice.ts
```

All above passed on 2026-06-24 (no full build per P29 execution policy).

---

## 5. Remaining Medical Pool Habit Gaps

| Pool | Status | Notes |
| --- | --- | --- |
| `medical.json` | 3 habit/semi-personality samples | Remaining 15 events stat/talent/flag-gated |
| Medical chain midpoints | Not habit-gated | `medical_herb_gathering`, `medical_clinic_practice`, etc. still flag-only |
| Full pool migration | Deferred | P29 Non-goals |
| `familyBond` medical crossover | Not wired | Future wave |

---

## 6. Deferred P24 Fixtures

| Location | Status | Target |
| --- | --- | --- |
| `src/p24/sliceFixtures.ts` | Legacy `business_habit` seed | Future P24 reconciliation pass |

---

## 7. North Star §8 Items Still OPEN After P29

Per `docs/designs/p25-lifetime-simulation-north-star.md` §8 Discovery CLEAR checklist:

| Item | Status after P29 | Notes |
| --- | --- | --- |
| 主流/混合/巅峰可玩样本 habit+半人格链闭合 | **Partial** | P29 adds medical/social behavior-led on-ramps; Wave 1 achievement full trace still OPEN |
| Medical pool habit migration | **Partial** | 3 samples; full stat/talent gate migration deferred |
| `jianghu_renown_sage` / `medical_sage_healer` Wave 1 delivery | **OPEN** | Behavior-led samples exist; composite achievement sim trace incomplete |
| 半人格轴内容分流器 | **Closed (P28+P29)** | socialMomentum P17 consequence now delivered |
| P25 habit trajectory slice P27/P28 coverage | **Closed (P29 extends)** | P29 events in P25 slice |
| 平凡出身 ≥3 可区分轨迹 | Met (P25) | No P29 change |
| 验收切片零自相矛盾 | Met (P25) | No P29 change |
| 巅峰运气+选择门禁 | Met (P25) | No P29 change |
| `gate:playability` / `gate:p20` 不退化 | Met (P29 verify) | P20/P25 tests pass |

**Discovery outer loop:** Still **OPEN** — end-state achievement chain and full medical migration remain.

---

## 8. Deferred Beyond P29

| Item | Reason | Target |
| --- | --- | --- |
| Full medical pool stat/talent gate removal | P29 Non-goals | Future wave |
| P25 Wave 2–4 achievement configs | P29 Non-goals | P25 end-state |
| Legacy `*_habit` reader removal | Compatibility policy | Future |
| P24 calibration fixture refresh | P29 Non-goals | P24 reconciliation |

---

## 9. Artifacts

| Artifact | Path |
| --- | --- |
| Audit delta | `docs/test-reports/p29-medical-habit-pool-audit-delta.md` |
| Medical samples | `src/data/lines/medical.json` |
| Social consequence | `src/data/lines/p22-content-expansions.json` |
| P25 slice | `src/p25/habitTrajectorySlice.ts` |
| P20 slice | `src/p20/habitTrajectorySlice.ts` |
| Regression | `tests/personalityHabitTrajectoryTests.ts` |
| Closure (this doc) | `docs/test-reports/p29-closure-report.md` |

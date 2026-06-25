# P32 Closure Report — Wave 1 Habit-Led Runtime Sim Parity

**Date:** 2026-06-24  
**Branch:** `codex/p32-wuxia-wave1-habit-led-runtime-sim-parity`  
**PRD:** `docs/PRD/p32-wuxia-wave1-habit-led-runtime-sim-parity.md`

---

## 1. Summary

P32 closed Wave 1 habit-led **runtime sim parity** on top of P31 static unlock chain: JSON↔resolver bridge audit, automated parity tests for all 3 P31 bridges, renown event-driven short-chain sim slice, runtime baseline delta aligned with P31 static 100%, isolated regression coverage, optional medical short-chain skip with evidence, and this closure report.

---

## 2. Deliverables

| Story | Deliverable |
| --- | --- |
| P32-001 | `docs/test-reports/p32-runtime-bridge-parity-audit-delta.md` |
| P32-002 | `src/p25/p32BridgeParity.ts`; parity asserts in `p25LifetimeSimulationTests.ts` |
| P32-003 | `src/p25/p32HabitLedShortChainSlice.ts`; `docs/test-reports/p32-renown-short-chain-slice.md` |
| P32-004 | `p32-runtime-sim-baseline-metrics.json`, `p32-runtime-sim-baseline-delta.md` |
| P32-005 | `testP32RuntimeParityRegression()`; isolated `tests/p32RuntimeParityTests.ts` |
| P32-006 | **Skipped** — `docs/test-reports/p32-006-second-path-skip.md` |
| P32-007 | This closure report |

---

## 3. Parity Tests

| Bridge | JSON event | Parity cases |
| --- | --- | --- |
| `ally_network` | `p28_social_reputation_reinforcement` | At/below `socialMomentum` threshold; poison mutex drift |
| `medical_pure` | `p27_study_habit_healer_reinforcement` | At/below `studyHabit` threshold |
| `medical_divine_doctor_fame` | `p29_study_habit_case_record_duty` | At/below `studyHabit` 3 + chain preconditions |

**Known drift (documented):** JSON choice effects do not check `medical_poison_path`; resolver blocks all bridges (P32-RISK-003).

---

## 4. Short-Chain Sim

| Path | Sequence | Unlock | Resolver used |
| --- | --- | --- | --- |
| Renown | `socialMomentum≥2` → `p28_social_reputation_reinforcement` positive → composite eval | `jianghu_renown_sage` **100%** | No |
| Medical | — (P32-006 skip) | Parity + P31 static fixtures | — |

---

## 5. Runtime Baseline Delta (vs P31 Static)

| Outcome | P31 static unlock | P32 runtime short-chain | Delta |
| --- | --- | --- | --- |
| `jianghu_renown_sage` | 100% | **100%** | aligned |
| `medical_sage_healer` | 100% | parity tests only | monitor |

---

## 6. Verification Commands

```bash
npm run typecheck
npm exec tsx tests/p25LifetimeSimulationTests.ts
npm exec tsx tests/p32RuntimeParityTests.ts
npm exec tsx scripts/runP32HabitLedSimulationBaseline.ts
npm exec tsx scripts/runP31HabitLedSimulationBaseline.ts
```

All passed on 2026-06-24 (no full build per execution policy).

---

## 7. Remaining Runtime / E2E Gaps

| Gap | Status after P32 | Notes |
| --- | --- | --- |
| Medical two-event runtime short-chain | **Deferred** | P32-006 skip; parity tests cover bridge alignment |
| Habit zero birth→death lifetime sim | **Deferred** | P32 short-chain uses seeded habit threshold |
| `medical_poison_path` JSON mutex | **Monitor** | Resolver blocks; JSON does not — documented drift |
| `mentor_bond` habit-led bridge | **Deferred** | P31 partial; `ally_network` sufficient |
| `medical_imperial` habit-led bridge | **Deferred** | P31 defer |
| Full medical pool habit migration | **Deferred** | 3/18 samples |
| Wave 2–4 achievements | **Deferred** | P32 non-goals |

---

## 8. North Star §8 Items Still OPEN After P32

Per `docs/designs/p25-lifetime-simulation-north-star.md` §8:

| §8 Item | Status after P32 |
| --- | --- |
| 主流、混合、巅峰三类成就均有可玩样本且规则文档化 | **Partial** — Wave 1 renown runtime short-chain + medical parity; mixed/pinnacle habit-led not expanded |
| 行为轨迹（习惯/半人格）可观测、可分流、可收束 | **Partial** — JSON↔resolver parity automated; full pool migration OPEN |
| 平凡出身 Wave 4 扩展 | **Deferred** |
| 重玩 proxy / 多路径分化 baseline | **Deferred** |
| Legacy `*_habit` 读者移除 | **Deferred** |

---

## 9. Deferred Queue (P33+)

- Medical two-event runtime short-chain sim
- JSON `medical_poison_path` mutex alignment (if runtime parity required)
- Full lifetime sim birth→death with habit on-ramp from zero
- Discovery pass on P32 PRD for end-state reconciliation

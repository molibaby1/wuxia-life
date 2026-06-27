# P29 Discovery Gaps — Medical Habit Pool Expansion And Social Consequence Wiring

**Date:** 2026-06-24  
**Mode:** post-run (`--pipeline-auto --spawn-stage`)  
**Parent PRD:** `docs/PRD/p29-wuxia-medical-habit-pool-expansion-and-social-consequence-wiring.md`  
**Finalize commit:** `e237e9a`  
**End-state:** `docs/designs/p25-lifetime-simulation-north-star.md`

---

## Stage Assessment

| Dimension | Status | Evidence |
| --- | --- | --- |
| **stage_status** | **CLEAR** | 7/7 stories `passes: true`; Goals §2 + Success Metrics §5 met (audit, 2 medical samples, 1 socialMomentum P17 consequence, P25/P20 slice extensions, regression, closure) |
| **end_state_status** | **OPEN** | P25 North Star §8 Discovery CLEAR 清单未全勾选；Wave 1 新增成就 habit→composite sim trace 仍 Partial；medical 池 3/18 habit-led；§8 混合/巅峰可玩样本 Missing |

---

## Gap Inventory

| ID | Gap | Route | Evidence | Target |
| --- | --- | --- | --- | --- |
| GAP-P29-001 | P27–P29 habit/semi-personality on-ramps 未纳入 composite destiny sim trace；`jianghu_renown_sage` / `medical_sage_healer` 行为-led 解锁路径不可观测 | **next-stage** | `p29-closure-report.md` §7；`achievementTraceability.ts` 无 P27–P29 event IDs；habit flags (`p29_*`) 未桥接 achievement flags | P30 |
| GAP-P29-002 | Medical 池除 3 条 habit/semi-personality 样本外仍 15 条 stat/talent/flag gate only | **defer** | `p29-closure-report.md` §5；`medical.json` 18 events，3 `lifeStates.*` 读者 | Future medical wave |
| GAP-P29-003 | Medical chain midpoints（`medical_herb_gathering`, `medical_clinic_practice` 等）仍 flag-only，无 habit gate | **defer** | `p29-medical-habit-pool-audit-delta.md` §1 | Future medical wave |
| GAP-P29-004 | `familyBond` medical crossover 未接线 | **defer** | P29 Non-goals §3；P28 closed family axis | Future wave |
| GAP-P29-005 | `src/p24/sliceFixtures.ts` 仍 seed legacy `business_habit` | **defer** | `p29-closure-report.md` §6 | Future P24 reconciliation |
| GAP-P29-006 | P20 replay tests 保留 legacy-only gate fixtures | **defer** | P27/P28 defer pattern | Keep compat |
| GAP-END-08-01 | North Star §8：主流/混合/巅峰可玩样本 — habit+成就 composite 链仍 Partial | **next-stage** | P29 补齐 medical/social 内容 on-ramp；sim trace 未闭合 | P30 + end-state track |
| GAP-END-08-02 | North Star §8：平凡出身 ≥3 可区分轨迹 | **defer** | `p25-ordinary-origin-slice.md` | Met |
| GAP-END-08-03 | North Star §8：验收切片零自相矛盾 | **defer** | `highSeverityContradictionCount: 0` | Met |
| GAP-END-08-04 | North Star §8：巅峰运气+选择门禁 | **defer** | `p25-pinnacle-baseline-metrics` | Met (Wave 2 config exists) |
| GAP-END-08-05 | North Star §8：`gate:playability` / `gate:p20` 不退化 | **defer** | P29 verify 四命令 PASS | Met |
| GAP-END-W1-ACH | Wave 1 新增主流成就 behavior-led sim trace 不完整 | **next-stage** | North Star §3.1；P29 §7 OPEN | P30 |
| GAP-END-MEDICAL-REMAIN | Medical 池全量 habit 迁移未完成 | **defer** | P29 Non-goals；3/18 samples | Future medical wave |
| GAP-END-W2-W4 | Wave 2–4 成就与出身扩展 | **defer** | P25 phased delivery §3 | P25 end-state track |

---

## In-Stage Delta

**None.** P29 scope 已全部 `passes: true`；上述 gap 均超出 P29 Non-goals（不全量迁移 medical 池、不交付 Wave 2–4 成就）或属 defer。禁止改写已关闭 story。

---

## Next-Stage PRD

| Field | Value |
| --- | --- |
| **spawned** | `true` |
| **stage_slug** | `p30-wuxia-wave1-behavior-led-achievement-sim-trace` |
| **prd_md** | `docs/PRD/p30-wuxia-wave1-behavior-led-achievement-sim-trace.md` |
| **prd_json** | `docs/PRD/p30-wuxia-wave1-behavior-led-achievement-sim-trace.prd.json` |
| **queued_behind_current** | `false` |
| **Gaps addressed** | GAP-P29-001, GAP-END-08-01 (partial), GAP-END-W1-ACH |

---

## Verification (Discovery Run)

```bash
npx tsc --noEmit                                      # PASS 2026-06-24
npm exec tsx tests/personalityHabitTrajectoryTests.ts  # PASS
npm exec tsx tests/p20ReplayabilityTests.ts            # PASS
npm exec tsx tests/p25LifetimeSimulationTests.ts       # PASS
git log -1 --oneline e237e9a                            # finalize commit present
```

All 7 P29 stories: `passes: true` in `p29-wuxia-medical-habit-pool-expansion-and-social-consequence-wiring.prd.json`.

Content evidence:

- `medical.json`: `p29_study_habit_case_record_duty` (`studyHabit >= 3`), `p29_social_momentum_healer_network` (`socialMomentum >= 2`)
- `p22-content-expansions.json`: `p29_social_momentum_patron_obligation` (`socialMomentum >= 3` P17 consequence)
- `src/p25/habitTrajectorySlice.ts`: P27 + P28 + P29 event coverage
- `src/p20/habitTrajectorySlice.ts`: P29 event IDs in replay divergence list
- `tests/personalityHabitTrajectoryTests.ts`: P29 medical + social asserts
- `docs/test-reports/p29-closure-report.md`, `p29-medical-habit-pool-audit-delta.md`

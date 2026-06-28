# P28 Discovery Gaps — Semi-Personality Axis Content Wiring

**Date:** 2026-06-24  
**Mode:** post-run (`--pipeline-auto --spawn-stage`)  
**Parent PRD:** `docs/PRD/p28-wuxia-semi-personality-axis-content-wiring.md`  
**Finalize commit:** `5c4246c`  
**Verify:** `agent_docs/p28-wuxia-semi-personality-axis-content-wiring-verify-result.md` → PASS

---

## Stage Assessment

| Dimension | Status | Evidence |
| --- | --- | --- |
| **stage_status** | **CLEAR** | 8/8 stories `passes: true`; Goals §2 + Success Metrics §5 met (audit, 2 socialMomentum + 2 familyBond samples, 1 familyBond P17 consequence, P25/P20 slice extensions, regression, closure) |
| **end_state_status** | **OPEN** | P25 North Star §8 Discovery CLEAR 清单未全勾选；medical 池 habit 迁移仅 1 样本；`socialMomentum` P17 后果未交付；§8 成就可玩样本 habit+内容链仍 Partial |

---

## Gap Inventory

| ID | Gap | Route | Evidence | Target |
| --- | --- | --- | --- | --- |
| GAP-P28-001 | Medical 池除 `p27_study_habit_healer_reinforcement` 外仍 stat/talent gate only | **next-stage** | `p28-closure-report.md` §5；`medical.json` 18 events，仅 1 条 `lifeStates.studyHabit` 读者 | P29 |
| GAP-P28-002 | `socialMomentum` 半人格 P17 后果未交付（P28 限制 1 条 familyBond 后果） | **next-stage** | `p28-semi-personality-axis-audit-delta.md` §5；`p28-closure-report.md` §8 | P29 |
| GAP-P28-003 | `p25/habitTrajectorySlice.ts` 未纳入 P29 新 medical / social 后果事件 | **next-stage** | P28 slice 止于 P27+P28 IDs；新样本需续扩 | P29 |
| GAP-P28-004 | `p21-content-samples.json` 无 semi-personality echo callback | **defer** | P28 audit §2；social 样本已在 P22 池覆盖 | Future P21 pass |
| GAP-P28-005 | `src/p24/sliceFixtures.ts` 仍 seed legacy `business_habit` | **defer** | `p28-closure-report.md` §6 | Future P24 reconciliation |
| GAP-P28-006 | P20 replay tests 保留 legacy-only gate fixtures | **defer** | `p27-closure-report.md` §5 optional | Keep compat |
| GAP-END-08-01 | North Star §8：主流/混合/巅峰可玩样本 — habit+medical/renown 内容链未闭合 | **next-stage** | P25 prd 全绿但 medical 池 habit 链 OPEN；`jianghu_renown_sage` 行为-led 深化不足 | P29 + end-state track |
| GAP-END-08-02 | North Star §8：平凡出身 ≥3 可区分轨迹 | **defer** | `p25-ordinary-origin-slice.md` | Met |
| GAP-END-08-03 | North Star §8：验收切片零自相矛盾 | **defer** | `highSeverityContradictionCount: 0` | Met |
| GAP-END-08-04 | North Star §8：巅峰运气+选择门禁 | **defer** | `p25-pinnacle-baseline-metrics` | Met |
| GAP-END-08-05 | North Star §8：`gate:playability` / `gate:p20` 不退化 | **defer** | P28 verify 四命令 PASS | Met |
| GAP-END-MEDICAL | Medical 池 habit 迁移阻碍 Wave 1 `medical_sage_healer` 行为-led 路径深化 | **next-stage** | North Star §3.1；P27/P28 defer | P29 |
| GAP-END-SEMIPERSON-SOCIAL | `socialMomentum` P17 后果缺失，名望/人脉中长期压力链不完整 | **next-stage** | P28 仅 familyBond 后果；North Star §3.1 名望线 | P29 |

---

## In-Stage Delta

**None.** P28 scope 已全部 `passes: true`；上述 gap 均超出 P28 Non-goals（不全量迁移 medical 池、限制 1 条 P17 后果）或属 defer。禁止改写已关闭 story。

---

## Next-Stage PRD

| Field | Value |
| --- | --- |
| **spawned** | `true` |
| **stage_slug** | `p29-wuxia-medical-habit-pool-expansion-and-social-consequence-wiring` |
| **prd_md** | `docs/PRD/p29-wuxia-medical-habit-pool-expansion-and-social-consequence-wiring.md` |
| **prd_json** | `docs/PRD/p29-wuxia-medical-habit-pool-expansion-and-social-consequence-wiring.prd.json` |
| **queued_behind_current** | `false` |
| **Gaps addressed** | GAP-P28-001, GAP-P28-002, GAP-P28-003, GAP-END-MEDICAL, GAP-END-SEMIPERSON-SOCIAL, GAP-END-08-01 (partial) |

---

## Verification (Discovery Run)

```bash
npx tsc --noEmit                                      # PASS 2026-06-24
npm exec tsx tests/personalityHabitTrajectoryTests.ts  # PASS
npm exec tsx tests/p20ReplayabilityTests.ts            # PASS
npm exec tsx tests/p25LifetimeSimulationTests.ts       # PASS
git log -1 --oneline 5c4246c                            # finalize commit present
```

All 8 P28 stories: `passes: true` in `p28-wuxia-semi-personality-axis-content-wiring.prd.json`.

Content evidence:

- `p22-content-expansions.json`: 2× `lifeStates.socialMomentum >= 2` samples + P17 familyBond consequence
- `family-life.json`: 2× `lifeStates.familyBond >= 2` samples
- `src/p25/habitTrajectorySlice.ts`: P27 + P28 event coverage
- `tests/personalityHabitTrajectoryTests.ts`: `testP28SemiPersonalityRegression()` covers 5 P28 events

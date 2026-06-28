# P30 Discovery Gaps — Wave 1 Behavior-Led Achievement Sim Trace

**Date:** 2026-06-24  
**Mode:** post-run (`--pipeline-auto --spawn-stage`)  
**Parent PRD:** `docs/PRD/p30-wuxia-wave1-behavior-led-achievement-sim-trace.md`  
**Finalize commit:** `4fbd2f0`  
**End-state:** `docs/designs/p25-lifetime-simulation-north-star.md`

---

## Stage Assessment

| Dimension | Status | Evidence |
| --- | --- | --- |
| **stage_status** | **CLEAR** | 7/7 stories `passes: true`; Goals §2 + Success Metrics §5 met (audit delta, `habitLedOnRampEvents` trace links, ≥2 habit-led fixtures, sim baseline delta, regression, P30-006 skip per audit, closure) |
| **end_state_status** | **OPEN** | North Star §8 Discovery CLEAR 清单未全勾选；§8 主流/混合/巅峰可玩样本仍 **Partial**（habit-led unlock 0%，mixed/pinnacle 未扩）；medical 池 3/18 habit-led |

---

## Gap Inventory

| ID | Gap | Route | Evidence | Target |
| --- | --- | --- | --- | --- |
| GAP-P30-001 | Habit-led sim paths **0% unlock** for `jianghu_renown_sage` / `medical_sage_healer`；仅 100% partial progress（stats ok, `key_choices` gap） | **next-stage** | `p30-closure-report.md` §4；`p30-habit-led-sim-baseline-delta.md` | P31 |
| GAP-P30-002 | P27–P29 bridge flags（`p28_social_*`, `p29_social_*`, `p27_study_healer_path` 等）未到达 achievement `key_choices`（`mentor_bond`/`ally_network`/`medical_divine_doctor_fame`/`medical_imperial`） | **next-stage** | `p30-habit-to-achievement-traceability-audit-delta.md` §3；closure §6 | P31 |
| GAP-P30-003 | 无 habit zero 起点的 end-to-end lifetime sim run；P30 仅用 validation slice + static composite eval | **next-stage** | `p30-closure-report.md` §6 | P31 (partial) |
| GAP-P30-004 | Medical 池除 3 条 habit/semi-personality 样本外仍 15 条 stat/talent/flag gate only | **defer** | closure §6, §8；P30 Non-goals §3 | Future medical wave |
| GAP-P30-005 | Legacy `*_habit` 读者未移除 | **defer** | closure §8；compat policy | Future reconciliation |
| GAP-END-08-01 | North Star §8：主流/混合/巅峰可玩样本 — habit→composite **unlock** 链仍 Partial（P30 闭合 observability，非 unlock） | **next-stage** (partial) | closure §7；North Star §8 item 1 | P31 partial + end-state track |
| GAP-END-08-02 | North Star §8：平凡出身 ≥3 可区分轨迹 | **defer** | closure §7 | Met (P25) |
| GAP-END-08-03 | North Star §8：验收切片零自相矛盾 | **defer** | closure §7 | Met (P25) |
| GAP-END-08-04 | North Star §8：巅峰运气+选择门禁 | **defer** | closure §7 | Met (P25 metrics) |
| GAP-END-08-05 | North Star §8：`gate:playability` / `gate:p20` 不退化 | **defer** | closure §7；P30 verify PASS | Met |
| GAP-END-MIXED-PIN | 混合/巅峰成就可玩样本与 habit-led trace 未扩展 | **defer** | North Star §3.2–3.3, §8 | P25 Wave 2–3 track |
| GAP-END-MEDICAL-REMAIN | Medical 池全量 habit 迁移未完成 | **defer** | P30 Non-goals；3/18 samples | Future medical wave |
| GAP-END-W2-W4 | Wave 2–4 成就与出身扩展 | **defer** | P30 Non-goals §3 | P25 end-state track |
| GAP-P24-FIXTURE | `src/p24/sliceFixtures.ts` legacy `business_habit` | **defer** | P29 gaps carry-forward | Future P24 reconciliation |

---

## In-Stage Delta

**None.** P30 scope 已全部 `passes: true`；上述 gap 均超出 P30 Non-goals（不交付 flag bridge 除非 dead-end、不全量迁移 medical 池、不交付 Wave 2–4）或属 defer。禁止改写已关闭 story。

---

## Next-Stage PRD

| Field | Value |
| --- | --- |
| **spawned** | `true` |
| **stage_slug** | `p31-wuxia-wave1-habit-led-achievement-unlock-chain` |
| **prd_md** | `docs/PRD/p31-wuxia-wave1-habit-led-achievement-unlock-chain.md` |
| **prd_json** | `docs/PRD/p31-wuxia-wave1-habit-led-achievement-unlock-chain.prd.json` |
| **queued_behind_current** | `false` |
| **Gaps addressed** | GAP-P30-001, GAP-P30-002, GAP-P30-003 (partial), GAP-END-08-01 (partial) |

---

## Verification (Discovery Run)

```bash
npm run typecheck                                      # PASS 2026-06-24
npm exec tsx tests/p25LifetimeSimulationTests.ts       # PASS
npm exec tsx scripts/runP30HabitLedSimulationBaseline.ts  # PASS (via P30-004/005)
git log -1 --oneline 4fbd2f0                           # finalize commit present
```

All 7 P30 stories: `passes: true` in `p30-wuxia-wave1-behavior-led-achievement-sim-trace.prd.json`.

Content evidence:

- `src/p25/achievementTraceability.ts`: `habitLedOnRampEvents` for `jianghu_renown_sage` (3 P28/P29 IDs) and `medical_sage_healer` (3 P27/P29 IDs)
- `src/p25/validationSlices.ts`: `P30_HABIT_LED_LIFE_PATHS` (social/renown + medical/study) seed bridge flags only
- `src/p25/p30HabitLedSimulationBaselines.ts`, `scripts/runP30HabitLedSimulationBaseline.ts`: 0% habit-led unlock, 100% partial progress
- `tests/p25LifetimeSimulationTests.ts`: P30 trace + fixture asserts
- `docs/test-reports/p30-closure-report.md`, `p30-habit-to-achievement-traceability-audit-delta.md`, `p30-habit-led-sim-baseline-delta.md`

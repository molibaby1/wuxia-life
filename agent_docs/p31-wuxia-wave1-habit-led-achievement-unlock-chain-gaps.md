# P31 Discovery Gaps — Wave 1 Habit-Led Achievement Unlock Chain

**Date:** 2026-06-24  
**Mode:** post-run (`--pipeline-auto --spawn-stage`)  
**Parent PRD:** `docs/PRD/p31-wuxia-wave1-habit-led-achievement-unlock-chain.md`  
**Finalize commit:** `aa4a968`  
**End-state:** `docs/designs/p25-lifetime-simulation-north-star.md`

---

## Stage Assessment

| Dimension | Status | Evidence |
| --- | --- | --- |
| **stage_status** | **CLEAR** | 7/7 stories `passes: true`; Goals §2 + Success Metrics §5 met (bridge audit, 3 threshold-gated bridges, ≥2 full-unlock fixtures, sim baseline >0% vs P30 0%, regression, P31-006 skip per audit, closure) |
| **end_state_status** | **OPEN** | North Star §8 Discovery CLEAR 清单未全勾选；§8 主流 habit→unlock 链仍 **Partial**（静态 bridge resolver + validation slice，非 runtime/event-driven e2e）；混合/巅峰可玩样本 Missing；medical 池 3/18 habit-led |

---

## Gap Inventory

| ID | Gap | Route | Evidence | Target |
| --- | --- | --- | --- | --- |
| GAP-P31-001 | P31-006 **skipped** — 无 habit on-ramp → bridge → composite eval 短链 sim；unlock 仅经 `resolveP31HabitLedKeyChoiceBridges` + static fixtures 证明 | **next-stage** | `p31-closure-report.md` §2 P31-006 skip；`prd.json` P31-006 notes | P32 |
| GAP-P31-002 | JSON 事件 `flag_set` bridge 与 `resolveP31HabitLedKeyChoiceBridges` **无 runtime parity 自动化**；closure §6 列为 Monitor | **next-stage** | `p31HabitLedKeyChoiceBridges.ts`；`p22-content-expansions.json` / `medical.json` bridge wiring；tests 仅测 static resolver | P32 |
| GAP-P31-003 | Habit zero 起点 end-to-end lifetime sim 仍缺失（P30 GAP-P30-003 carry-forward） | **next-stage** | `p31-closure-report.md` §6；P31 Non-goals §3 不要求 birth→death | P32 (partial) |
| GAP-P31-004 | `mentor_bond` habit-led social path 未桥接；`ally_network` 已足够 unlock | **defer** | `p31-key-choice-bridge-audit-delta.md` §2 optional 2nd bridge；closure §6 Partial | Future if thematic coverage needed |
| GAP-P31-005 | `medical_imperial` habit-led bridge 未交付 | **defer** | closure §6；`medical_divine_doctor_fame` + `medical_pure` 已覆盖 unlock | Future medical wave |
| GAP-END-08-01 | North Star §8：主流/混合/巅峰可玩样本 — Wave 1 新增成就 habit-unlock **Partial**（static resolver）；mixed/pinnacle 未扩 | **next-stage** (partial) | closure §7；North Star §8 item 1 | P32 partial + end-state track |
| GAP-END-08-02 | North Star §8：平凡出身 ≥3 可区分轨迹 | **defer** | closure §7；`p25-ordinary-origin-slice.md` | Met (P25) |
| GAP-END-08-03 | North Star §8：验收切片零自相矛盾 | **defer** | closure §7 | Met (P25) |
| GAP-END-08-04 | North Star §8：巅峰运气+选择门禁 | **defer** | closure §7；P25 pinnacle baseline | Met (Wave 2 config) |
| GAP-END-08-05 | North Star §8：`gate:playability` / `gate:p20` 不退化 | **defer** | P31 verify PASS | Met |
| GAP-END-MEDICAL-REMAIN | Medical 池全量 habit 迁移未完成（3/18） | **defer** | P31 Non-goals §3；closure §6 | Future medical wave |
| GAP-END-MIXED-PIN | 混合/巅峰成就可玩样本与 habit-led trace 未扩展 | **defer** | North Star §3.2–3.3, §8 | P25 Wave 2–3 track |
| GAP-END-W2-W4 | Wave 2–4 成就与出身扩展 | **defer** | P31 Non-goals §3 | P25 end-state track |
| GAP-P24-FIXTURE | `src/p24/sliceFixtures.ts` legacy `business_habit` | **defer** | P29 gaps carry-forward | Future P24 reconciliation |

---

## In-Stage Delta

**None.** P31 scope 已全部 `passes: true`；上述 gap 均超出 P31 Non-goals（不交付 short-chain sim 除非 skip-first 失败、不全量迁移 medical 池、不交付 Wave 2–4、不要求 birth→death e2e）或属 defer。禁止改写已关闭 story。

---

## Next-Stage PRD

| Field | Value |
| --- | --- |
| **spawned** | `true` |
| **stage_slug** | `p32-wuxia-wave1-habit-led-runtime-sim-parity` |
| **prd_md** | `docs/PRD/p32-wuxia-wave1-habit-led-runtime-sim-parity.md` |
| **prd_json** | `docs/PRD/p32-wuxia-wave1-habit-led-runtime-sim-parity.prd.json` |
| **queued_behind_current** | `false` |
| **Gaps addressed** | GAP-P31-001, GAP-P31-002, GAP-P31-003 (partial), GAP-END-08-01 (partial) |

---

## Verification (Discovery Run)

```bash
npm run typecheck                                      # PASS 2026-06-24
npm exec tsx tests/p25LifetimeSimulationTests.ts       # PASS
npm exec tsx scripts/runP31HabitLedSimulationBaseline.ts  # PASS
git log -1 --oneline aa4a968                           # finalize commit present
```

All 7 P31 stories: `passes: true` in `p31-wuxia-wave1-habit-led-achievement-unlock-chain.prd.json`.

Content evidence:

- `docs/test-reports/p31-key-choice-bridge-audit-delta.md`: 3-bridge budget, renown/medical cluster classification
- `src/p25/p31HabitLedKeyChoiceBridges.ts`: static threshold-gated resolver (3 bridges)
- `src/p25/validationSlices.ts`: `P31_HABIT_LED_FULL_UNLOCK_PATHS`, `evaluateHabitLedPathWithP31Bridges()`
- `src/p25/p31HabitLedSimulationBaselines.ts`, `scripts/runP31HabitLedSimulationBaseline.ts`: 100% unlock vs P30 0%
- `tests/p25LifetimeSimulationTests.ts`: P31 bridge gating + full-unlock + baseline asserts
- `docs/test-reports/p31-closure-report.md`, `p31-habit-led-sim-baseline-delta.md`, `p31-habit-led-sim-baseline-metrics.json`

# P35 Discovery Gaps — Wave 2 Mixed/Pinnacle Habit-Led Lifetime Traces

**Date:** 2026-06-24  
**Mode:** post-run (`--pipeline-auto --spawn-stage`)  
**Parent PRD:** `docs/PRD/p35-wuxia-wave2-mixed-pinnacle-habit-led-lifetime-traces.md`  
**Finalize commit:** `786d307`  
**End-state:** `docs/designs/p25-lifetime-simulation-north-star.md`

---

## Stage Assessment

| Dimension | Status | Evidence |
| --- | --- | --- |
| **stage_status** | **CLEAR** | 5/5 stories `passes: true`; Goals §2 + Success Metrics §5 met (mixed `healer_swordsman` habit-led lifetime age 0→68, pinnacle `jianghu_myth_legend` dual-gate lifetime age 0→72, baseline delta aligned vs P25 static, isolated P35 regression, closure report) |
| **end_state_status** | **OPEN** | North Star §8 未全勾选；§8 item 1 类别级样本已 Met 但 additional mixed/pinnacle outcomes 与全池规则文档仍 Partial；§8 item 3 全池后果链 audit Partial；§8 item 5 gate 在 P35 baseline 中 SKIP 未刷新 |

---

## Gap Inventory

| ID | Gap | Route | Evidence | Target |
| --- | --- | --- | --- | --- |
| GAP-P35-001 | Additional mixed outcome `merchant_martial_patron` habit-led lifetime trace | **next-stage** | `p35-closure-report.md` §6; P35 delivered `healer_swordsman` only | P36 (optional trace) |
| GAP-P35-002 | Additional pinnacle outcome `founding_patriarch` habit-led lifetime trace | **next-stage** | `p35-closure-report.md` §6; P35 delivered `jianghu_myth_legend` only | P36 (optional trace) |
| GAP-P34-001 | Renown habit-zero birth→death lifetime parity | **defer** | P34 skip; P32 renown short-chain covers pattern | Optional future stage |
| GAP-P34-002 | Game-engine JSON poison mutex (non-sim path) | **defer** | P35 closure §6 Monitor; P33 sim path aligned | Future if game-engine path required |
| GAP-P34-003 | `mentor_bond` / `medical_imperial` habit-led bridges | **defer** | P31/P34 defer; ally_network + medical_divine_doctor_fame sufficient | Future bridge wave |
| GAP-P34-004 | Full medical pool habit migration (3/18) | **defer** | P35 Non-goals §3 | Future medical wave |
| GAP-END-08-01 | North Star §8 item 1：主流/混合/巅峰可玩样本 — **类别级 Met**（P34 medical lifetime + P35 mixed/pinnacle habit-led）；additional outcomes 与 traceability 全量仍 Partial | **next-stage** (reconcile) | `p35-closure-report.md` §7; `achievementTraceability.ts` | P36 reconciliation |
| GAP-END-08-02 | North Star §8：平凡出身 ≥3 可区分轨迹 | **defer** | `p25-ordinary-origin-slice.md` 3 paths PASS | Met (P25) |
| GAP-END-08-03 | North Star §8：验收切片零自相矛盾 — P25 slice Met；**post-P34/P35 full-pool audit Partial** | **next-stage** | P35 closure §7 item 3 Partial | P36 audit extension |
| GAP-END-08-04 | North Star §8：巅峰运气+选择门禁 | **defer** | P35 pinnacle dual-gate + grind-only control; P25 rare-window slice | Met |
| GAP-END-08-05 | North Star §8：`gate:playability` / `gate:p20` 不退化 — **P35 baseline SKIP 未执行** | **next-stage** | P35 closure §7 item 5; prior stages Met from verify but not post-P35 | P36 gate refresh |
| GAP-END-W2-W4 | Wave 3 `merchant_magnate` + Wave 4 ordinary origin expansion 全量 | **defer** | P35 Non-goals §3 | P25 end-state track (beyond P36) |
| GAP-END-MEDICAL-REMAIN | Medical 池 15/18 stat/talent gate | **defer** | P29/P33/P34 carry-forward | Future medical wave |
| GAP-P24-FIXTURE | `src/p24/sliceFixtures.ts` legacy `business_habit` | **defer** | P29 gaps carry-forward | Future P24 reconciliation |

---

## In-Stage Delta

**None.** P35 scope 已全部 `passes: true`；上述 gap 均超出 P35 Non-goals（不交付 Wave 3/4 全量、不强制 renown lifetime、不修复 game-engine poison path）或属 defer/reconcile。禁止改写已关闭 story。

---

## Next-Stage PRD

| Field | Value |
| --- | --- |
| **spawned** | `true` |
| **stage_slug** | `p36-wuxia-lifetime-simulation-end-state-gate-refresh-and-reconciliation` |
| **prd_md** | `docs/PRD/p36-wuxia-lifetime-simulation-end-state-gate-refresh-and-reconciliation.md` |
| **prd_json** | `docs/PRD/p36-wuxia-lifetime-simulation-end-state-gate-refresh-and-reconciliation.prd.json` |
| **queued_behind_current** | `false` |
| **Gaps addressed** | GAP-END-08-01 (reconcile), GAP-END-08-03, GAP-END-08-05, GAP-P35-001 (optional), GAP-P35-002 (optional) |

---

## Verification (Discovery Run)

```bash
npm run typecheck                                      # PASS 2026-06-24
npm exec tsx tests/p35MixedPinnacleParityTests.ts       # PASS
npm exec tsx tests/p34LifetimeParityTests.ts           # PASS (carry-forward)
npm exec tsx scripts/runP35HabitLedSimulationBaseline.ts  # PASS
git log -1 --oneline 786d307                           # P35 finalize
```

All 5 P35 stories: `passes: true` in `p35-wuxia-wave2-mixed-pinnacle-habit-led-lifetime-traces.prd.json`.

Content evidence:

- `src/p25/p35MixedPinnacleLifetimeSlices.ts` → `runP35MixedHealerSwordsmanLifetimeSlice()` age 0→68, `healer_swordsman` 100% unlock, 2 cross-tracks, `usedStaticResolver: false`
- `runP35PinnacleMythLegendLifetimeSlice()` age 0→72, `jianghu_myth_legend` 100% unlock, orthodox choice + luck window, grind-only control locked
- `src/p25/p35HabitLedSimulationBaselines.ts`, `scripts/runP35HabitLedSimulationBaseline.ts`: 100% vs P25 static 18.8% — aligned
- `tests/p35MixedPinnacleParityTests.ts`: isolated mixed/pinnacle unlock + no static resolver asserts
- `docs/test-reports/p35-mixed-healer-swordsman-lifetime-trace.md`, `p35-pinnacle-myth-legend-lifetime-trace.md`, `p35-mixed-pinnacle-sim-baseline-delta.md`, `p35-closure-report.md`

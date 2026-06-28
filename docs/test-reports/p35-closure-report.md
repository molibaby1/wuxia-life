# P35 Closure Report — Wave 2 Mixed/Pinnacle Habit-Led Lifetime Traces

**Date:** 2026-06-24  
**Branch:** `codex/p35-wuxia-wave2-mixed-pinnacle-habit-led-lifetime-traces`  
**PRD:** `docs/PRD/p35-wuxia-wave2-mixed-pinnacle-habit-led-lifetime-traces.md`  
**Parent:** P34 closure `docs/test-reports/p34-closure-report.md`

---

## 1. Summary

P35 closed the **mixed/pinnacle habit-led lifetime sim trace** gap deferred by P34: cross-track `healer_swordsman` lifetime (dual habit on-ramp → martial + medical JSON bridges → mixed composite eval), pinnacle `jianghu_myth_legend` dual-gate lifetime (orthodox choice gate + `hidden_master_line` luck window + grind-only failure attribution), baseline delta vs P25 static mixed/pinnacle slices, isolated regression tests, and this closure report.

---

## 2. Deliverables

| Story | Deliverable |
| --- | --- |
| P35-001 | `runP35MixedHealerSwordsmanLifetimeSlice()` in `p35MixedPinnacleLifetimeSlices.ts`; `docs/test-reports/p35-mixed-healer-swordsman-lifetime-trace.md` |
| P35-002 | `runP35PinnacleMythLegendLifetimeSlice()`; `docs/test-reports/p35-pinnacle-myth-legend-lifetime-trace.md` |
| P35-003 | `p35-mixed-pinnacle-sim-baseline-metrics.json`, `p35-mixed-pinnacle-sim-baseline-delta.md` |
| P35-004 | `tests/p35MixedPinnacleParityTests.ts` (isolated) |
| P35-005 | This closure report |

---

## 3. Mixed / Pinnacle Lifetime Traces

| Path | Sequence | Terminal | Unlock | Resolver used |
| --- | --- | --- | --- | --- |
| Mixed `healer_swordsman` | birth 0, dual habit 0 → childhood training → martial/study on-ramp → `p22` → `p27` → `p29` → age 68 mixed eval | `mixed_composite_eval_terminal` | **100%**, 2 cross-tracks | No |
| Pinnacle `jianghu_myth_legend` | birth 0 → orthodox trial chain → luck roll age 20 → midlife grind → age 72 pinnacle eval | `pinnacle_composite_eval_terminal` | **100%** | No |

Mixed bridge flags: `p9_early_training_focus`, `medical_pure`, `medical_divine_doctor_fame`.  
Pinnacle gates: `p16_guardian_oath` (choice), `p16_rare_master_encounter` (luck). Grind-only control stays locked (aligns with `p25-rare-window-waste-slice` semantics).

---

## 4. Baseline Delta

| Outcome | P25 static baseline | P35 habit-led lifetime | Delta |
| --- | --- | --- | --- |
| `healer_swordsman` | 18.8% | **100%** | aligned (lifetime trace is designed unlock path) |
| `jianghu_myth_legend` | 18.8% | **100%** | aligned |

P25 mixed identity slice: **PASS** (static fixtures unchanged).

---

## 5. Verification Commands

```bash
npm run typecheck
npm exec tsx tests/p35MixedPinnacleParityTests.ts
npm exec tsx tests/p34LifetimeParityTests.ts
npm exec tsx scripts/runP35HabitLedSimulationBaseline.ts
npm exec tsx tests/p25LifetimeSimulationTests.ts
npm exec tsx scripts/runP25MixedBaseline.ts
npm exec tsx scripts/runP25PinnacleBaseline.ts
```

All passed on 2026-06-24 (no full build per execution policy).

---

## 6. Remaining E2E / Runtime Gaps

| Gap | Status after P35 | Notes |
| --- | --- | --- |
| Renown habit-zero birth→death lifetime | **Deferred** | P34 skip; P32 renown short-chain covers pattern |
| Game-engine JSON poison mutex (non-sim path) | **Monitor** | P33 sim helper aligned; raw JSON unchanged |
| `mentor_bond` / `medical_imperial` bridges | **Deferred** | P31 partial |
| Full medical pool habit migration | **Deferred** | 3/18 samples |
| Wave 3 `merchant_magnate` full content | **Deferred** | P35 non-goals |
| Wave 4 ordinary origin expansion | **Deferred** | P35 non-goals |
| Additional mixed outcomes (`merchant_martial_patron` habit-led lifetime) | **Deferred** | P35 delivered `healer_swordsman` only |
| Additional pinnacle outcomes (`founding_patriarch` habit-led lifetime) | **Deferred** | P35 delivered `jianghu_myth_legend` only |

---

## 7. North Star §8 Items Still OPEN After P35

Per `docs/designs/p25-lifetime-simulation-north-star.md` §8:

| §8 Item | Status after P35 |
| --- | --- |
| 主流、混合、巅峰三类成就均有可玩样本且规则文档化 | **Partial** — Wave 1 medical lifetime (P34) + mixed/pinnacle habit-led samples (P35); not all mixed/pinnacle outcomes |
| 平凡出身 ≥3 种可区分轨迹 | **Deferred** |
| 主动 + 事件后果链零自相矛盾 | **Partial** — sim slices pass; full pool not audited |
| 巅峰需运气+选择；主流可单靠选择+时间 | **Met (sim evidence)** — P35 pinnacle dual-gate + grind-only control; P34/P31 mainstream paths |
| `gate:playability`、`gate:p20` 不退化 | **SKIP in baselines** — unchanged |

---

## 8. Deferred Queue (P36+)

- Renown optional birth→death lifetime
- `merchant_martial_patron` / `founding_patriarch` habit-led lifetime traces
- Game-engine-level JSON poison mutex (non-sim path)
- Full medical pool habit migration (3/18)
- Wave 4 ordinary origin expansion
- Discovery pass on P35 PRD for end-state reconciliation

# P131 Pinnacle Myth Legend Implementation Delta Audit

> **Date:** 2026-07-09  
> **Stage:** P131 Wuxia Wave 2 Pinnacle Playable Spine  
> **Story:** P131-001 — Audit P35 trace vs runtime gap (read-only; no runtime changes)  
> **Target:** `jianghu_myth_legend` (武林神话)  
> **Baseline:** `docs/test-reports/p35-pinnacle-myth-legend-lifetime-trace.md`

---

## 1. Executive Summary

P35 closed the **habit-led lifetime sim trace** for `jianghu_myth_legend`: orthodox trial chain → `p16_guardian_oath` (choice gate) → `hidden_master_line` luck roll at age 20 → `p16_rare_master_encounter` → age 72 pinnacle eval (100% unlock on designed path; grind-only locked).

**Overall assessment:** Core gate infrastructure and P16 orthodox trial / rare-line assets **already exist**. The gap is a **bounded playable spine layer** comparable to P113 founding_patriarch bridge: checkpoint events in `sample-lines-spine.json`, pinnacle-specific expression in `sampleLineExpression.ts`, targeted proof, and narrow regression. Delta is **small and well-bounded** — no new route framework, no P35 lifetime slice rewrite.

---

## 2. P35 Trace Checkpoint → Runtime Wiring Map

| P35 checkpoint | Age | P35 action | Existing runtime asset | Playable spine status |
| -------------- | --- | ---------- | ---------------------- | --------------------- |
| Birth / martial_family seed | 0 | trainingHabit=0 | Origin selection + childhood training events | ✅ Reusable |
| Childhood training focus | 8 | `p9_early_training_focus` | Childhood action events | ✅ Reusable |
| Martial ramp | 11–12 | family_drill, sect_prep | Martial family / youth events | ✅ Reusable |
| Orthodox path choice | 13 | `sect_path_choice` → `join_orthodox` | `sect-wudang.json` / `golden-line-spine.json` | ✅ Reusable |
| Orthodox trial chain | 14–16 | trial_entry → service → completion | `orthodox_trial_*` events in sect content | ✅ Reusable |
| **Choice gate** | 16 | `orthodox_trial_completion` → `p16_guardian_oath` | `sect-wudang.json` flag_set on completion | ✅ Gate flag exists; **no pinnacle on-ramp checkpoint** |
| **Luck window** | 20 | `hidden_master_line` roll (p=0.12) | `WUXIA_RARE_EVENT_LINES` + `rollRareEventLines()` | ✅ Roll exists; **no player-visible luck hit/miss echo** |
| Midlife grind | 35–60 | stat ramp toward gates | Generic martial/reputation progression | ✅ Reusable (no new grind path) |
| **Terminal eval** | 72 | pinnacle unlock | `WUXIA_PINNACLE_DESTINY_OUTCOMES` + composite resolver | ✅ Gate defined; **no spine bridge flags for expression** |

---

## 3. Reusable Assets (No New Wiring Required)

### 3.1 Pinnacle gate & dual-gate semantics

| Asset | Location | Status |
| ----- | -------- | ------ |
| `jianghu_myth_legend` outcome | `wuxiaOriginSurfaces.ts` → `WUXIA_PINNACLE_DESTINY_OUTCOMES` | ✅ skill_growth≥95, reputation≥75, choice `p16_guardian_oath`, luck `p16_rare_master_encounter` |
| `grindCannotSubstituteLuck` | Same definition | ✅ Aligns P25 rare-window-waste |
| Achievement traceability | `achievementTraceability.ts` | ✅ choiceFlags + `hidden_master_line` midLife surface |
| P35 lifetime sim slice | `p35MixedPinnacleLifetimeSlices.ts` | ✅ Closed; regression guard only |
| P35 parity tests | `tests/p35MixedPinnacleParityTests.ts` | ✅ Must not regress |
| Rare-window waste control | `rareWindowWasteSlice.ts` | ✅ `pinnacle_myth_grind_no_luck` grind-only locked |

### 3.2 P16 orthodox trial chain

| Asset | Location | Status |
| ----- | -------- | ------ |
| `sect_path_choice` | `sect-wudang.json` / golden-line spine | ✅ Sets `route_orthodox`, `orthodox_trial_active` |
| `orthodox_trial_entry` | Sect content | ✅ Mind trial step |
| `orthodox_trial_service` | Sect content | ✅ Service trial step |
| `orthodox_trial_completion` | `sect-wudang.json` | ✅ Sets `p16_guardian_oath`, `orthodox_trial_completed` |

### 3.3 Hidden master luck line

| Asset | Location | Status |
| ----- | -------- | ------ |
| `hidden_master_line` config | `wuxiaOriginSurfaces.ts` → `WUXIA_RARE_EVENT_LINES` | ✅ p=0.12, age 10–25, prior `p9_early_training_focus` |
| Roll + flag apply | `p16/rareEventLines.ts` | ✅ Sets `p16_rare_master_encounter` on trigger |
| Origin conditions | martial_family, poor_family, frontier_military | ✅ Matches P35 martial_family seed |

### 3.4 Expression framework (pattern reference)

| Asset | Location | Status |
| ----- | -------- | ------ |
| Orthodox sample line expression | `p50/sampleLineExpression.ts` | ✅ P113 founding_patriarch branches = pattern for P131 |
| Player visibility guard | `isPlayerVisibleSampleLineText()` | ✅ Reusable |
| P113 bridge test pattern | `tests/p113FoundingPatriarchBridgeTests.ts` | ✅ Reference for P131 test file |

---

## 4. Minimum New Wiring (P131 Target)

### 4.1 Spine checkpoint events (runtime)

| # | Change | File | Nature |
| - | ------ | ---- | ------ |
| 1 | `jianghu_myth_legend_on_ramp_entry` — reads `p16_guardian_oath` + orthodox context | `sample-lines-spine.json` | New choice event (age 17–22) |
| 2 | Checkpoint flags: `jianghu_myth_legend_bridge_crossed`, `jianghu_myth_legend_on_ramp_done` | Same | On-ramp shaping confirmation |
| 3 | `jianghu_myth_legend_luck_window_echo` — reads luck outcome | `sample-lines-spine.json` | New auto/choice event (age 20–26) |
| 4 | Luck markers: `jianghu_myth_legend_luck_hit` / `jianghu_myth_legend_luck_miss`, `jianghu_myth_legend_luck_window_done` | Same | Player-visible luck feedback |

**Entry gate (proposed):** `p16_guardian_oath` && (`route_orthodox` || `orthodox_trial_completed`) && !`jianghu_myth_legend_bridge_crossed` && !active founding_patriarch/renown/medical bridge flags.

**Luck echo gate (proposed):** `jianghu_myth_legend_on_ramp_done` && !`jianghu_myth_legend_luck_window_done` && age ≥ 20; branch on `p16_rare_master_encounter`.

### 4.2 Expression changes (runtime)

| # | Change | File | Nature |
| - | ------ | ---- | ------ |
| 1 | Myth-legend on-ramp branch in `orthodoxCurrentGoal()` | `sampleLineExpression.ts` | Pinnacle path goal text |
| 2 | Luck hit/miss branch in `orthodoxCurrentGoal()` or cost label | Same | Second readable signal |
| 3 | Optional: `deriveSampleLineCostLabel()` pinnacle branch | Same | Differentiates from generic 守正代价 |

### 4.3 Proof, tests, closure (docs + test)

| # | Artifact | Path |
| - | -------- | ---- |
| 1 | Scope contract | `p131-pinnacle-myth-legend-scope-contract.md` |
| 2 | Targeted proof | `p131-pinnacle-myth-legend-targeted-proof.md` |
| 3 | Narrow regression | `tests/p131PinnacleMythLegendSpineTests.ts` |
| 4 | Closure report | `p131-pinnacle-myth-legend-closure-report.md` |

---

## 5. Explicitly NOT Changed

| Item | Reason |
| ---- | ------ |
| P35 `p35MixedPinnacleLifetimeSlices.ts` | Prior stage closed — regression guard only |
| P113 founding_patriarch spine | Parallel track; orthogonal gates |
| `WUXIA_PINNACLE_DESTINY_OUTCOMES` gate thresholds | P35 parity |
| `hidden_master_line` probability / age band | P35 trace semantics |
| Full Wave 2 pinnacle catalog | PRD non-goal |
| New UI components / route framework | PRD non-goal |

---

## 6. Grind-Only Path (Must Stay Locked)

Per P35 / P25 rare-window-waste:

- Grind + `p16_guardian_oath` **without** `p16_rare_master_encounter` → pinnacle **locked**
- P131 wiring must **not** introduce grind-substitutable luck bypass
- Luck miss echo should surface **failure attribution** (window closed, myth path unreachable by grind alone)

---

## 7. P131 Implementation Priority

1. Scope contract (P131-002) — lock boundaries before runtime
2. Spine events (P131-003) — on-ramp + luck echo
3. Expression (P131-004) — ≥2 pinnacle-specific signals
4. Targeted proof (P131-005) — seed → on-ramp → luck → choice → eval chain
5. Regression tests (P131-006) — gate, expression, grind-only lock
6. Closure handoff (P131-007)

---

## 8. Audit Conclusion

P131 requires **additive spine wiring + expression + proof/tests** on top of existing P16/P35 assets. No gate rewrite, no lifetime sim reopen, no Wave 2 catalog expansion. Estimated delta comparable to P113 narrow bridge (2 spine events + expression branches + ~15 test assertions).

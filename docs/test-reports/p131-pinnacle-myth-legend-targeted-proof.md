# P131 Pinnacle Myth Legend Targeted Proof

> **Stage:** P131 Wuxia Wave 2 Pinnacle Playable Spine  
> **Date:** 2026-07-09  
> **Evidence:** Runtime spine events + `tests/p131PinnacleMythLegendSpineTests.ts` + P35 lifetime slice parity

---

## 1. Success Path Chain

| Step | Age | Checkpoint | Flags in | Flags out | Evidence |
| ---- | --- | ---------- | -------- | --------- | -------- |
| 1 | 0–12 | martial_family seed + training | — | `p9_early_training_focus` | P35 lifetime slice childhood ramp |
| 2 | 13 | `sect_path_choice` → join_orthodox | training focus | `route_orthodox`, `orthodox_trial_active` | Existing sect content (unchanged) |
| 3 | 14–16 | orthodox trial chain | trial active | `orthodox_trial_completed`, **`p16_guardian_oath`** | `sect-wudang.json` completion |
| 4 | 17–22 | **`jianghu_myth_legend_on_ramp_entry`** | `p16_guardian_oath` + orthodox route | `jianghu_myth_legend_bridge_crossed`, `jianghu_myth_legend_on_ramp_done`, `jianghu_myth_legend_on_ramp_guardian` | P131 spine event |
| 5 | 20 | `hidden_master_line` rare roll | prior training focus | **`p16_rare_master_encounter`** (p=0.12) | `rollRareEventLines()` — unchanged |
| 6 | 20–26 | **`jianghu_myth_legend_luck_window_echo`** (hit branch) | on-ramp done + luck flag | `jianghu_myth_legend_luck_hit`, `jianghu_myth_legend_luck_window_done` | P131 spine event |
| 7 | 35–72 | midlife grind toward stat gates | dual gates met | skill/reputation thresholds | Generic progression (unchanged) |
| 8 | 72 | pinnacle eval | choice + luck + stats | **`jianghu_myth_legend` unlocked** | `evaluateCompositeDestinyOutcome` + P35 slice |

### Expression on success path

| Surface | Signal | When |
| ------- | ------ | ---- |
| `orthodoxCurrentGoal` | 护道誓下，武林神话之路已开 | `jianghu_myth_legend_on_ramp_done` |
| `orthodoxCurrentGoal` | 隐世奇遇已至，武林神话的运气门槛已过 | `jianghu_myth_legend_luck_hit` |
| `deriveSampleLineCostLabel` | 神话奇遇之幸 | luck hit |

---

## 2. Grind-Only Failure Attribution Path

| Step | Condition | Result | Evidence |
| ---- | --------- | ------ | -------- |
| Choice gate only | `p16_guardian_oath` + max stats, **no** `p16_rare_master_encounter` | Pinnacle **locked** | `pinnacle_myth_grind_no_luck` fixture + `evaluateCompositeDestinyOutcome` |
| Luck echo miss | on-ramp done, age ≥ 25, no luck flag | `jianghu_myth_legend_luck_miss` + expression 神话窗口之失 | P131 luck echo miss branch |
| P35 parity | grind-only lifetime control | `failureAttribution.grindOnlyLocked === true` | `runP35PinnacleMythLegendLifetimeSlice()` unchanged |

**Failure attribution detail:** Grind + choice without luck window stays locked — aligns with P25 `rare-window-waste` slice semantics (`grindCannotSubstituteLuck: true` on `jianghu_myth_legend`).

---

## 3. Checkpoint Order vs P35 Trace

P35 trace order: orthodox trial → guardian oath (16) → hidden_master luck (20) → grind → eval (72).

P131 playable spine preserves this order:

1. **Choice gate** (`p16_guardian_oath`) — pre-existing; on-ramp entry reads it at age 17+
2. **On-ramp shaping** — new player-visible confirmation (P131)
3. **Luck window** — existing roll at age 10–25; echo surfaces hit/miss (P131)
4. **Terminal eval** — unchanged gate thresholds

No static resolver shortcut used as sole evidence — chain proven via spine event gates + composite destiny evaluation + P35 lifetime slice regression.

---

## 4. Regression Scope

| Guard | Status |
| ----- | ------ |
| P35 `runP35PinnacleMythLegendLifetimeSlice()` | Unchanged — parity test in `p131PinnacleMythLegendSpineTests.ts` |
| P35 mixed/pinnacle parity | `p35MixedPinnacleParityTests.ts` — re-run after P131 |
| P113 founding_patriarch spine | Orthogonal — entry mutual exclusion |
| Grind-only lock | `pinnacle_myth_grind_no_luck` path — locked in isolated test |

---

## 5. Verification Commands

```bash
npm run typecheck
npm exec tsx tests/p131PinnacleMythLegendSpineTests.ts
npm exec tsx tests/p35MixedPinnacleParityTests.ts
```

Browser matrix not required (PRD §7).

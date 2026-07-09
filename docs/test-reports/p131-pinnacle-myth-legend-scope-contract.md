# P131 Pinnacle Myth Legend Scope Contract

> **Date:** 2026-07-09  
> **Stage:** P131 Wuxia Wave 2 Pinnacle Playable Spine  
> **Branch:** `codex/p131-wuxia-wave2-pinnacle-playable-spine`

---

## 1. Purpose

Lock P131 as a **single-pinnacle bounded playable spine** for `jianghu_myth_legend` (武林神话). Prevent scope drift into Wave 2 full catalog, founding_patriarch expansion, P35 lifetime sim rewrite, or Wave 3/4 content.

---

## 2. Pinnacle On-Ramp Event Band

| Field | Value |
| ----- | ----- |
| **On-ramp event ID** | `jianghu_myth_legend_on_ramp_entry` |
| **On-ramp age band** | 17–22 (trigger at age 17) |
| **On-ramp prerequisite** | `p16_guardian_oath` && (`route_orthodox` \|\| `orthodox_trial_completed`) && !`jianghu_myth_legend_bridge_crossed` && !active founding_patriarch/renown/medical bridge flags |
| **On-ramp checkpoint flags** | `jianghu_myth_legend_bridge_crossed`, `jianghu_myth_legend_on_ramp_done` |
| **Luck echo event ID** | `jianghu_myth_legend_luck_window_echo` |
| **Luck echo age band** | 20–26 (trigger at age 20) |
| **Luck echo prerequisite** | `jianghu_myth_legend_on_ramp_done` && !`jianghu_myth_legend_luck_window_done` |
| **Luck markers** | Hit: `jianghu_myth_legend_luck_hit`; Miss: `jianghu_myth_legend_luck_miss`; Done: `jianghu_myth_legend_luck_window_done` |

### On-ramp choice coverage

| Choice | Reads | Sets |
| ------ | ----- | ---- |
| Embrace guardian pinnacle path | `p16_guardian_oath` | `jianghu_myth_legend_on_ramp_guardian` |

---

## 3. Allowed Surfaces

| Layer | Allowed |
| ----- | ------- |
| **Spine wiring** | Two events (`jianghu_myth_legend_on_ramp_entry`, `jianghu_myth_legend_luck_window_echo`) in `sample-lines-spine.json` |
| **Expression** | Myth-legend branches in `orthodoxCurrentGoal`, `deriveSampleLineCostLabel` (minimum 2 readable signals) |
| **Markers** | `jianghu_myth_legend_*` checkpoint flags listed above |
| **Proof** | One targeted proof under `docs/test-reports/` |
| **Tests** | Focused test file `tests/p131PinnacleMythLegendSpineTests.ts` |
| **Closure** | One closure report with North Star §3.2 / §8 OPEN queue |

---

## 4. Forbidden Items

| Forbidden | Reason |
| --------- | ------ |
| Wave 2 full pinnacle catalog | PRD non-goal — single target only |
| `founding_patriarch` spine expansion | P113+ parallel track |
| P35 `jianghu_myth_legend` lifetime slice rewrite | Prior stage closed |
| P37 additional pinnacle traces reopen | Prior stage closed |
| Wave 3 mixed catalog / Wave 4 ordinary expansion | PRD non-goal |
| P130 visible-growth respawn (farm/apprentice samples) | PRD non-goal |
| New UI panels / route framework | PRD non-goal |
| Cross-achievement pinnacle framework | PRD non-goal |
| Grind-substitutable luck bypass | P25 dual-gate semantics |
| Full-lifetime `gate:p20` broad rerun | Out of bounded scope |
| `npm run build` during P131 execution | User constraint |

---

## 5. Boundary with P113 Founding Patriarch

| Dimension | `jianghu_myth_legend` (P131) | `founding_patriarch` (P113) |
| --------- | ---------------------------- | --------------------------- |
| Choice gate | `p16_guardian_oath` (orthodox trial) | `p16_alliance_brokered` |
| Luck gate | `p16_rare_master_encounter` (`hidden_master_line`) | `p16_scholar_mentor` (`scholar_mentor_line`) |
| Sample line | Orthodox martial / martial_family | Orthodox scholar/faction |
| Spine entry reads | Guardian oath + orthodox trial | Scholar mentor + faction alliance |
| Mutual exclusion | Entry excludes active `founding_patriarch_bridge_crossed` | Entry excludes active renown/medical bridges |
| Lifetime sim | P35 closed — regression only | P37 closed — regression only |

---

## 6. Boundary with P35 Sim Trace

| Rule | Detail |
| ---- | ------ |
| **Truth source** | P35 trace semantics for checkpoint order and grind-only lock |
| **No sim rewrite** | `runP35PinnacleMythLegendLifetimeSlice()` unchanged |
| **Parity tests** | `p35MixedPinnacleParityTests.ts` must still pass after P131 wiring |
| **Playable additive** | P131 adds runtime spine + expression; does not alter gate thresholds or rare-line probability |

---

## 7. Regression Scope

- P35 mixed/pinnacle parity tests: unchanged lifetime traces
- P113 founding_patriarch tests: unchanged spine events
- `guard:sample-lines-baseline`: spine additive only
- P131 isolated test file: gate, expression, grind-only lock

---

## 8. Deferred (Explicit OPEN)

- Additional Wave 2 pinnacles beyond `jianghu_myth_legend`
- Wave 3 mixed catalog playable spines
- Wave 4 ordinary expansion
- Full pinnacle pressure/mid/late/endgame chain (narrow on-ramp only)
- Visible-growth fourth sample / farm/apprentice parallel samples

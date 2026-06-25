# P39 Full Content Pool — Audit Scope Inventory

**Date:** 2026-06-24  
**Branch:** `codex/p39-wuxia-full-content-pool-consequence-audit-reconciliation`  
**Story:** P39-001  
**Parent:** P36 consistency slice, P37 lifetime traces, P38 playability closure  
**North Star:** `docs/designs/p25-lifetime-simulation-north-star.md` §8 item 3

Read-only inventory defining bounded full-pool audit acceptance boundaries. No gameplay behavior changed in this story.

---

## 1. Executive summary

P39 extends the P36 8-path consequence consistency harness to **≥12 audited paths** by adding P37 lifetime traces (`merchant_martial_patron`, `founding_patriarch`) and representative content-pool samples (setback, love, medical). Audit depth is **bounded representative** — ≥1 path per major pool theme, not combinatorial exhaust.

---

## 2. Content pool inventory

| Pool file | Events | Flag-touch surfaces (sample) | Audit path candidate |
| --- | ---: | --- | --- |
| `setback-events.json` | 6 | `setback_injury_active`, `setback_property_loss_active`, `setback_betrayal`, `player_died` | `p39_setback_pool_injury_property_path` |
| `love.json` | 18 | `love_misunderstood`, `love_secret_help`, `love_life_or_death`, `spouse_mingyue` | `p39_love_pool_secret_help_chain_path` |
| `medical.json` | 20 | `medical_talent`, `p27_study_healer_path`, `medical_pure`, `medical_poison_path` | `p39_medical_pool_healer_study_path` |
| `p22-content-expansions.json` | 18 | P17 consequence bridges, mentor/wealth/faction flags | Covered via P37 traces + P25 representative |
| `training.json` | 9 | training habit / martial progression flags | P25 orthodox / lone sword paths |
| `daily.json` | 39 | stat modifiers (no persistent flags) | Deferred — no flag contradiction surface |
| Other `src/data/lines/*.json` (57 files) | ~600+ | identity, sect, economy, adventure pools | Representative coverage via P25 + lifetime traces |

**Setback / love focus pools (P38 remediation scope):** `setback-events.json`, `love.json` — P38 narrative fixes included in audit scope; playability gate carry-forward sufficient for frustration metric (no re-audit).

---

## 3. Risk category classification

| Category | Definition | Detection | Example pools |
| --- | --- | --- | --- |
| **ghost-flag** | Consumer event references flag with no runtime setter | `GHOST_FLAG_CONSUMERS` global scan in `validationSlices.ts` | `p22-content-expansions.json`, `medical.json` |
| **mutex violation** | Mutually exclusive flags coexist on same path | `findPathContradictions` — e.g. `medical_poison_path` + `medical_pure` | `medical.json` |
| **summary/narrative contradiction** | Summary signals contradict active flags | `summarySignals` vs flags (e.g. 尊师重道 vs `hero_ally_abandoned`) | All representative paths |
| **stale flag reader** | Legacy `*_habit` reader without lifeStates dual-read | P27 audit delta; compatibility-only readers excluded from high/critical | `GameEngineIntegration.ts` (compat) |

**Severity policy (P39):** Only **high** and **critical** block §8 item 3 Met. Medium/low → defer queue.

---

## 4. Representative audit path map

| Path ID | Source | Pool / trace theme |
| --- | --- | --- |
| `orthodox_guardian_path` | P25 baseline | orthodox / training |
| `jianghu_renown_path` | P25 baseline | renown / social |
| `medical_sage_path` | P25 baseline | medical composite |
| `sect_leader_path` | P25 baseline | faction / sect |
| `lone_sword_path` | P25 baseline | wanderer / martial |
| `p34_medical_habit_zero_lifetime` | P34 lifetime trace | medical habit-led |
| `p35_mixed_healer_swordsman_habit_zero_lifetime` | P35 lifetime trace | mixed composite |
| `p35_pinnacle_myth_legend_habit_zero_lifetime` | P35 lifetime trace | pinnacle composite |
| `p37_mixed_merchant_patron_habit_zero_lifetime` | P37 lifetime trace | mixed merchant_martial_patron |
| `p37_pinnacle_founding_patriarch_habit_zero_lifetime` | P37 lifetime trace | pinnacle founding_patriarch |
| `p39_setback_pool_injury_property_path` | P39 pool sample | setback-events.json |
| `p39_love_pool_secret_help_chain_path` | P39 pool sample | love.json |
| `p39_medical_pool_healer_study_path` | P39 pool sample | medical.json |

**Total: 13 paths** (8 P36 baseline + 2 P37 + 3 pool samples).

---

## 5. P37 trace flag sequences (harness extension inputs)

### merchant_martial_patron (`p37_mixed_merchant_patron_habit_zero_lifetime`)

| Age | Event | Key flags after |
| ---: | --- | --- |
| 18 | `p22_early_wealth_route_fork` (expand_trade_route) | `origin_merchant_family`, `p22_wealth_route_forked`, `route_wealth_committed` |
| 32 | `merchant_sect_investment` (invest good) | + `merchant_invest_good` |
| 68 | mixed composite eval terminal | unlocked=true, tracks merchant+martial |

**Bridge flags for fixture:** `route_wealth_committed`, `merchant_invest_good`

### founding_patriarch (`p37_pinnacle_founding_patriarch_habit_zero_lifetime`)

| Age | Event / phase | Key flags after |
| ---: | --- | --- |
| 15 | `scholar_mentor_line` luck roll | `p16_scholar_mentor` |
| 30 | `p22_faction_sect_continuation` (accept_sect_duty) | `focus_on_study`, `sect_exposure`, `joined_sect`, `p16_alliance_brokered` |
| 72 | pinnacle composite eval terminal | unlocked=true |

**Bridge flags for fixture:** `p16_alliance_brokered`, `p16_scholar_mentor`

**Source docs:** `docs/test-reports/p37-mixed-merchant-patron-lifetime-trace.md`, `docs/test-reports/p37-pinnacle-founding-patriarch-lifetime-trace.md`

---

## 6. P17 consequence chain scope

P17 bridges in `p22-content-expansions.json` are audited indirectly via:

- P25 representative paths (mentor, alliance flags)
- P34–P37 lifetime traces (habit-led bridge resolution)
- Global ghost-flag consumer scan

Full P17 event combinatorics deferred (bounded representative policy).

---

## 7. Deferred (out of P39 scope)

| Item | Reason | Target |
| --- | --- | --- |
| Wave 3 `merchant_magnate` | P39 non-goal | Future wave |
| Wave 4 ordinary expansion | P39 non-goal | Future wave |
| Full medical pool habit-led (3/18) | P39 non-goal | Future wave |
| game-engine JSON poison mutex (non-sim path) | Monitor only | P33 defer |
| Combinatorial all-events proof | Bounded representative | Never in P39 |
| P38 frustration metric re-audit | Gate carry-forward | P39-004 |

---

## 8. Verification

```bash
# Inventory-only story — no harness run required
ls docs/test-reports/p39-content-pool-audit-scope-inventory.md
```

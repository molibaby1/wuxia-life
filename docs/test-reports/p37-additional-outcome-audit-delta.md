# P37 Additional Outcome Audit — merchant_martial_patron & founding_patriarch

**Date:** 2026-06-24  
**Story:** P37-001  
**PRD:** `docs/PRD/p37-wuxia-additional-mixed-pinnacle-lifetime-traces.md`  
**Traceability:** `src/p25/achievementTraceability.ts`  
**Parent:** P36 §8 reconciliation `docs/test-reports/p36-north-star-section8-reconciliation.md`

---

## 1. Executive summary

Audit maps composite gates, key choices, and existing P27–P29 / P22 habit bridges for the two **additional** §8 item 1 outcomes deferred by P35/P36. Minimal lifetime trace sequences target the smallest JSON bridge path per outcome without static `resolveP31HabitLedKeyChoiceBridges`.

---

## 2. merchant_martial_patron (mixed)

### Composite requirements (`wuxiaOriginSurfaces.ts`)

| Index | Dimension | Gate |
| --- | --- | --- |
| 0 | skill_growth | martialPower ≥ 50 |
| 1 | resources | money ≥ 50 |
| 2 | key_choices | anyOf `merchant_invest_good`, `merchant_invest_both`, `merchant_invest_evil` |
| 3 | key_choices | anyOf `route_wealth_committed`, `p22_wealth_route_forked` |

**Cross-track groups:** `merchant_track` (indices 2, 3), `martial_track` (index 0).

### Traceability link

- **choiceFlags:** `route_wealth_committed`, `p22_wealth_route_forked`, `merchant_invest_*`
- **midLifeConsequenceSurfaces:** `p22_early_wealth_route_fork`, `merchant_sect_investment`
- **habitLedOnRampEvents:** _(none in which is the P37 gap)_

### Existing habit / bridge inventory

| Event | Habit axis | Threshold | Bridge flags |
| --- | --- | --- | --- |
| `p22_early_wealth_route_fork` | `businessHabit` | ≥ 2 (or `origin_merchant_family`) | `route_wealth_committed`, `p22_wealth_route_forked` |
| `p26_business_habit_obligation` | `businessHabit` | ≥ 3 | consequence only (not required for unlock) |
| `merchant_sect_investment` | _(runtime: `merchant_wealthy`)_ | — | `merchant_invest_good` / `both` / `evil` |

### Minimal lifetime trace sequence (P37-002 target)

1. **Seed:** `merchant_house` origin; `businessHabit=0`, `trainingHabit=0` at birth.
2. **On-ramp:** business ticks (`business` tag + gain ≥ 2) → `businessHabit≥2`; martial ticks (gain ≥ 6) → `trainingHabit≥2` (observability, symmetric with P35 healer_swordsman).
3. **Age 18:** `p22_early_wealth_route_fork` choice 0 → wealth route flags.
4. **Age 32:** `merchant_sect_investment` choice 1 → `merchant_invest_good`.
5. **Age 68:** mixed composite eval → `merchant_martial_patron` (stats: mp≥50, money≥50).

**Unlock gaps closed:** dual habit on-ramp observability + cross-track JSON bridges; no P31 static resolver.

---

## 3. founding_patriarch (pinnacle)

### Composite requirements

| Index | Dimension | Gate |
| --- | --- | --- |
| 0 | skill_growth | martialPower ≥ 70 |
| 1 | social_capital | connections ≥ 70 |
| 2 | resources | money ≥ 55 |
| 3 | key_choices | `p16_alliance_brokered` (choice gate) |
| 4 | special_event | `p16_scholar_mentor` (luck gate) |

**Dual-gate:** `grindCannotSubstituteLuck: true` — aligns with P35 `jianghu_myth_legend` semantics.

### Traceability link

- **choiceFlags:** `p16_alliance_brokered`
- **midLifeConsequenceSurfaces:** `p22_faction_sect_continuation`, `scholar_mentor_line`
- **habitLedOnRampEvents:** _(none yet)_

### Existing habit / bridge inventory

| Surface | Role | Bridge / flag |
| --- | --- | --- |
| `p22_faction_sect_continuation` | choice gate | `p16_alliance_brokered` (precondition: `sect_exposure` or `joined_sect`) |
| `scholar_mentor_line` | luck gate | `p16_scholar_mentor` (origin `scholar_house`, prior `focus_on_study`, age 8–22) |
| `p28_social_momentum_*` | optional on-ramp | renown/social habit bridges (not required for minimal path) |

### Minimal lifetime trace sequence (P37-003 target)

1. **Seed:** `scholar_house` origin; `trainingHabit=0`, `socialMomentum=0`; childhood `focus_on_study`.
2. **On-ramp:** training + social momentum ticks for observability.
3. **Age 13:** model `sect_exposure` / `joined_sect` (sect identity for faction continuation precondition).
4. **Age 15:** `scholar_mentor_line` rare roll (seeded low p) → `p16_scholar_mentor`.
5. **Age 30:** `p22_faction_sect_continuation` accept → `p16_alliance_brokered`.
6. **Age 72:** pinnacle composite eval → `founding_patriarch`.

**Dual-gate control:** grind-only path with choice but no luck stays locked (matches `p25-rare-window-waste-slice` / `pinnacle_patriarch_grind_no_luck`).

---

## 4. Delta vs P35 delivered traces

| Outcome | P35 status | P37 minimal bridge |
| --- | --- | --- |
| `healer_swordsman` | Delivered | — |
| `jianghu_myth_legend` | Delivered | — |
| `merchant_martial_patron` | Open | wealth fork + sect investment |
| `founding_patriarch` | Open | faction continuation + scholar mentor line |

---

## 5. Non-goals (this audit)

- No gameplay / JSON content changes
- No static resolver fixtures
- No Wave 3 `merchant_magnate` full pool audit

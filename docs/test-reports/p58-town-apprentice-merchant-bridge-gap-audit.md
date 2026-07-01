# P58 Town Apprentice → Merchant Bridge Gap Audit (P58-001)

Generated: 2026-06-27

## Scope

This audit maps the existing `town_apprentice` ordinary-origin signals, the `merchant_magnate` mixed gate requirements, and the runtime bridge gap between them. It identifies what P58 must close to make the apprentice → magnate path playable rather than merely fixture-proven.

## 1. Existing Apprentice Ordinary-Growth Signals

### 1.1 Origin Surface (`wuxiaOriginSurfaces.ts`)
- **originId:** `town_apprentice`
- **originTier:** `ordinary`
- **Resources:** familyResources 0.42, guidanceQuality 0.52, socialCapital 0.38, hardshipExposure 0.38
- **Event bias:** `craft` (1.4×), `apprenticeship` (1.35×), `discipline` (1.08×)

### 1.2 Early Life Chain (`ordinaryOriginEarlyLife.ts`)
- **Infant chain:** `apprentice_infant_chain_complete`
- **Preschool:** `preschool_apprentice_plane_shavings`
- **Childhood choice (8–15):** `ordinary_apprentice_craft_fork`
  - `apprentice_craft_committed` → trade/craft path
  - `apprentice_trade_curiosity` → merchant seed

### 1.3 Midlife Depth (P56, `ordinaryOriginExpression.ts`)
- **`apprentice_trade_curiosity`** — early trade exposure signal
- **`apprentice_midlife_trade_network`** — trade network established (age 25–28)
- **`apprentice_join_partnership`** — partnership fork (joint venture vs. decline)
- **`apprentice_midlife_craft_mastery`** — craft mastery fork (open shop vs. stay)
- **`apprentice_open_shop`** / `apprentice_stay_master` — craft fork choices
- **`apprentice_decline_partnership`** — partnership decline option

### 1.4 Baseline Fixture (`ordinarySimulationBaselines.ts`)
- Fixture `ordinary_apprentice_merchant_path` (id: `ordinary_apprentice_merchant_path`)
  - originId: `town_apprentice`
  - flags: `route_wealth_committed: true`, `business_empire: true`, `apprentice_trade_curiosity: true`
  - **This fixture directly sets merchant flags** — it does not flow from apprentice runtime

### 1.5 Expression Surfaces
- `apprenticeCurrentGoal()` — 5 states from early craft → midlife trade/craft → partnership
- `apprenticeLifeMemory()` — 5 narrative memories from early craft → trade partnership
- `deriveOrdinaryOriginSummary()` — 2 summary tiers (early/midlife)
- **No expression currently reads as "crossing into merchant ascent"** — all text stays within ordinary apprentice flavor

## 2. Existing merchant_magnate Gate Requirements

### 2.1 Mixed Destiny Gate (`wuxiaOriginSurfaces.ts`)
`merchant_magnate` requires ALL:
1. `resources >= 55`
2. `social_capital >= 55`
3. `key_choices`: any of `['route_wealth_committed', 'p22_wealth_route_forked']`
4. `key_choices`: any of `['business_empire', 'merchant_empire', 'merchant_wealthy']`

### 2.2 P55 Magnate Chain (P55 closure report)
- `magnate_on_ramp` spine event (age 28–32): merchant route + wealth milestone
- `magnate_midlife_pressure` spine event (age 36–40): magnate-specific pressure
- `magnate_payoff` spine event (age 42–46): magnate payoff
- Chain: `magnate_on_ramp_done` → `magnate_midlife_pressure_done` → `magnate_payoff_done`

### 2.3 Achievement Traceability (`achievementTraceability.ts`)
- `merchant_magnate` choiceFlags: `['route_wealth_committed', 'p22_wealth_route_forked', 'business_empire', 'merchant_empire', 'merchant_wealthy']`
- midLifeConsequenceSurfaces: `['p22_early_wealth_route_fork', 'merchant_empire', 'merchant_business_empire']`

### 2.4 Mixed Baseline Fixtures (`mixedSimulationBaselines.ts`)
- `mixed_merchant_magnate_path`: originId `merchant_house`, flags `route_wealth_committed + business_empire`
- **All mixed fixtures use vivid merchant_house origin** — none originate from ordinary origins

## 3. Bridge Gap Analysis

### 3.1 What Exists
| Layer | Evidence | Status |
|-------|----------|--------|
| Apprentice origin surface | `town_apprentice` ordinary tier defined | ✅ Complete |
| Early life chain | infant → preschool → childhood fork | ✅ Complete |
| Midlife depth | trade curiosity → trade network → partnership | ✅ Complete (P56) |
| Mixed gate definition | `merchant_magnate` 4 requirements | ✅ Complete |
| P55 magnate chain | on-ramp → pressure → payoff spine | ✅ Complete |
| Baseline fixture | `ordinary_apprentice_merchant_path` | ✅ Exists (static) |

### 3.2 What Is Missing
| Gap | Description | Impact |
|-----|-------------|--------|
| **Runtime flag bridge** | No config wires `apprentice_trade_curiosity` → `route_wealth_committed` | Apprentice flags never reach merchant gate |
| **Transition expression** | No expression reads as "crossing into merchant" | Bridge invisible to player |
| **Midlife → merchant gate connector** | `apprentice_join_partnership` does not set `business_empire` or `route_wealth_committed` | Trade network is dead-end |
| **Targeted proof** | No sim/replay shows apprentice seed → bridge → magnate checkpoint | Bridge only proven by static fixture |
| **Regression coverage** | No tests verify bridge path is not silently broken | Bridge could regress undetected |

### 3.3 Root Cause
The P56 midlife growth created apprentice trade signals (`apprentice_trade_curiosity`, `apprentice_midlife_trade_network`, `apprentice_join_partnership`) as **narrative endpoints** — they write currentGoal and lifeMemory but never set merchant-route flags. The existing mixed baseline fixture (`ordinary_apprentice_merchant_path`) bypasses this gap by hardcoding `route_wealth_committed` and `business_empire` directly, proving the gate _can_ fire but not that the apprentice path _reaches_ it at runtime.

## 4. P58 Scope Boundaries

### 4.1 In Scope
- Wiring apprentice trade signals to existing merchant-route flags through JSON config
- Adding player-visible expression for the bridge crossing
- Producing one targeted proof that does not rely on static mixed-flag seeding
- Narrow regression tests covering bridge gate, expression, and proof

### 4.2 Out of Scope (per PRD non-goals)
- Reopening sample-line track or adding second 40+ nodes
- Expanding `farm_peasant` or `tavern_hand` bridges
- Redesigning P55 magnate payoff or adding deeper merchant waves
- Full lifetime sim, economy system, or platformization

## 5. Recommendations for P58 Implementation

1. **P58-003 (Bridge Contract):** Define the minimal apprentice prerequisite set and the checkpoint where trade signals convert to merchant-route flags
2. **P58-004 (Magnate Entry Contract):** Define how bridged apprentice path enters P55 magnate on-ramp vs. generic merchant start
3. **P58-005 (Wire Config):** Add flag-setting rules in midlife config or new JSON carrier so `apprentice_join_partnership` → `route_wealth_committed` (or equivalent)
4. **P58-006 (Expression):** Add ≥2 readable bridge signals in existing expression surfaces
5. **P58-007 (Proof):** Produce one targeted sim artifact showing seed → bridge → magnate checkpoint
6. **P58-008 (Tests):** Add narrow regression covering bridge gate, expression, and proof

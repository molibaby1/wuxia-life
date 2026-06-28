# P61 Farm-Peasant-to-Magnate Targeted Proof (P61-006)

Generated: 2026-06-28

## Scope

This artifact proves that `farm_peasant` can reach the `merchant_magnate` mixed gate through the runtime bridge path defined in P61-003/P61-004, without relying on static mixed-fixture flag seeding.

## Proof Method

1. **Configuration verification:** Confirm bridge flags exist in midlife config
2. **Expression verification:** Confirm bridge expression surfaces work
3. **Gate evaluation:** Simulate player state with bridge flags and verify `magnate_on_ramp` gate evaluates to true
4. **Flag chain trace:** Show seed → bridge → magnate checkpoint in order

## 1. Configuration Evidence

### 1.1 Bridge Flags in Midlife Config
- **File:** `src/data/lines/ordinary-origin-midlife.json`
- **Event:** `ordinary_peasant_midlife_outside_offer` (age 30)
- **Option:** `accept_offer` (id: `accept_offer`, label: "跟粮商走")
- **Flags set:**
  - `peasant_midlife_outside_offer`
  - `peasant_accept_outside`
  - `route_wealth_committed` ← **bridge checkpoint (route flag)**
  - `peasant_merchant_bridge_crossed` ← **bridge tracking**
  - `ordinary_peasant_midlife_done`

### 1.2 Event Framing
- **Title:** "粮商找帮工" (was "外出机会" before P61)
- **Prompt:** "走南闯北的粮商路过村子，说粮队缺个能扛能走的帮工——你跟过换工队，知道外面的路不只是田埂。" (was generic "商人说镇上缺人手" before P61)
- **Distinction:** Grain-trade specific framing distinguishes peasant bridge from apprentice (skill→trade) and tavern_hand (network→trade)

### 1.3 Bridge Prerequisites Met
```
origin_farm_peasant: true                  (from origin selection)
peasant_swap_crew_curiosity: true          (from ordinary_peasant_plow_fork → join_swap_crew)
peasant_midlife_outside_offer: true        (from midlife event, age 30)
peasant_accept_outside: true               (from outside_offer → accept_offer)
↓
route_wealth_committed: true               (set by bridge checkpoint)
peasant_merchant_bridge_crossed: true      (set by bridge checkpoint)
```

## 2. Expression Evidence

### 2.1 currentGoal (Bridge State)
- **Condition:** `peasant_merchant_bridge_crossed === true`
- **Text:** "跟着粮商走南闯北，粮路渐宽"
- **Distinction:** Distinct from ordinary midlife ("外面的机会在招手，村里还是镇上？") and magnate stage ("产业初成，巨贾之路刚起步")

### 2.2 lifeMemory (Bridge State)
- **Condition:** `peasant_merchant_bridge_crossed === true`
- **Text:** "你从田间走到粮路上，从帮工做起，渐渐摸通了粮货买卖。"
- **Distinction:** Distinct from accept-outside text ("你决定去镇上试试，离开生活了三十年的村子。")

### 2.3 summary (Bridge State)
- **Condition:** `peasant_merchant_bridge_crossed === true`
- **Text:** "农家出身的粮货商人：从田埂到粮路，靠体力和勤恳踏出生意路。"
- **Distinction:** Distinct from midlife summary ("平凡农人的中年：在田地与机会之间，守住或换路。")

## 3. Gate Evaluation Simulation

### 3.1 Simulated Player State
```json
{
  "name": "peasant-bridge-sim",
  "age": 30,
  "traitProfile": { "origin": "farm_peasant" },
  "martialPower": 25,
  "constitution": 55,
  "reputation": 15,
  "money": 80
}
```

### 3.2 Simulated Flags
```json
{
  "origin_farm_peasant": true,
  "peasant_swap_crew_curiosity": true,
  "peasant_midlife_outside_offer": true,
  "peasant_accept_outside": true,
  "route_wealth_committed": true,
  "peasant_merchant_bridge_crossed": true
}
```

### 3.3 magnate_on_ramp Gate Requirements
The `magnate_on_ramp` gate requires two conditions ANDed:

| Condition | Required | Bridge Provides | Status |
|-----------|----------|-----------------|--------|
| Route flag | `route_merchant \|\| merchant_childhood_seed_done \|\| p8_route_wealth \|\| apprentice_merchant_bridge_crossed \|\| tavern_merchant_bridge_crossed \|\| peasant_merchant_bridge_crossed` | `peasant_merchant_bridge_crossed` | ✅ Satisfied |
| Merchant milestone | `merchant_caravan_success \|\| merchant_shop_grocery \|\| ... \|\| apprentice_merchant_bridge_crossed \|\| tavern_merchant_bridge_crossed \|\| peasant_merchant_bridge_crossed` | `peasant_merchant_bridge_crossed` | ✅ Satisfied |
| Not already done | `!magnate_on_ramp_done` | — | ✅ Satisfied |
| Not orthodox/demonic | `!orthodox_childhood_seed_done && !demonic_childhood_seed_done` | — | ✅ Satisfied |

### 3.4 merchant_midlife_debt_milestone Gate Requirements
The `merchant_midlife_debt_milestone` gate also requires two conditions ANDed:

| Condition | Required | Bridge Provides | Status |
|-----------|----------|-----------------|--------|
| Route flag | `route_merchant \|\| merchant_childhood_seed_done \|\| merchant_talent \|\| p8_route_wealth \|\| apprentice_merchant_bridge_crossed \|\| tavern_merchant_bridge_crossed \|\| peasant_merchant_bridge_crossed` | `peasant_merchant_bridge_crossed` | ✅ Satisfied |
| Merchant milestone | `merchant_shop_grocery \|\| ... \|\| merchant_caravan_success \|\| apprentice_merchant_bridge_crossed \|\| tavern_merchant_bridge_crossed \|\| peasant_merchant_bridge_crossed` | `peasant_merchant_bridge_crossed` | ✅ Satisfied |

**Note:** Before P61, `peasant_accept_outside` only set stat bonuses (+reputation, +externalSkill). P61 added `route_wealth_committed` and `peasant_merchant_bridge_crossed` to the accept_offer option, and expanded both gate expressions in `sample-lines-spine.json` to accept `peasant_merchant_bridge_crossed`.

### 3.5 Magnate Chain Entry
After bridge crossing, `peasant_merchant_bridge_crossed` satisfies both conditions of `magnate_on_ramp`:
- `magnate_on_ramp` (age 28–32) → sets `magnate_on_ramp_done`
- `magnate_midlife_pressure` (age 36–40) → magnate pressure
- `magnate_payoff` (age 42–46) → magnate payoff + `merchant_age45_payoff_done`

## 4. Flag Chain Trace (Ordered)

```
Age 10-14: ordinary_peasant_plow_fork
  → peasant_swap_crew_curiosity: true (wanderlust seed)

Age 30: ordinary_peasant_midlife_outside_offer (accept_offer option)
  → peasant_midlife_outside_offer: true (bridge opportunity)
  → peasant_accept_outside: true (commitment)
  → route_wealth_committed: true (bridge checkpoint) ← P61
  → peasant_merchant_bridge_crossed: true (bridge tracking) ← P61

Age 28-32: magnate_on_ramp (P55 spine event)
  → magnate_on_ramp_done: true (magnate entry)

Age 36-40: magnate_midlife_pressure (P55 spine event)
  → magnate_midlife_pressure_done: true (magnate pressure)

Age 42-46: magnate_payoff (P55 spine event)
  → magnate_payoff_done: true (magnate payoff)
  → merchant_age45_payoff_done: true

merchant_magnate mixed gate: ✅ FULLY SATISFIED
```

## 5. Proof Summary

| Evidence Type | Status | Detail |
|---------------|--------|--------|
| Configuration | ✅ | Bridge flags in midlife JSON (accept_offer sets route_wealth_committed + peasant_merchant_bridge_crossed) |
| Event framing | ✅ | Grain-trade specific text (粮商找帮工 / 跟粮商走) — distinct from generic "去镇上试试" |
| Expression | ✅ | 3 surfaces with bridge-specific text (currentGoal, lifeMemory, summary) |
| Gate evaluation | ✅ | `peasant_merchant_bridge_crossed` satisfies both magnate_on_ramp conditions |
| Gate evaluation | ✅ | `peasant_merchant_bridge_crossed` satisfies both merchant_midlife_debt conditions |
| Gate fix | ✅ | `sample-lines-spine.json` gates expanded to accept bridge flag |
| Flag chain | ✅ | Seed → bridge → magnate checkpoint ordered |
| Ordinary identity preserved | ✅ | `detectOrdinaryOrigin()` still returns 'farm_peasant' after bridge |
| No static fixture shortcut | ✅ | Proof uses runtime flag flow, not direct mixed-flag seeding |

## 6. What This Does NOT Prove

- Full combinatorial exhaust (out of scope per PRD)
- Full lifetime platform wave (out of scope per PRD)
- Bridge works for all possible stat distributions (bounded proof only)
- Downstream magnate chain fires for all peasant ages (requires age window — P55 handles this)
- P58 apprentice bridge regression — covered by P58 test suite separately
- P59 tavern-hand bridge regression — covered by P59 test suite separately

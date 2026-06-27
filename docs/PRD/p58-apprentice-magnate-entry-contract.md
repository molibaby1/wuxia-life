# P58 Apprentice Magnate-Entry Contract (P58-004)

Generated: 2026-06-27

## Purpose

Define the contract for when the bridged apprentice path enters the P55 magnate chain instead of remaining generic merchant flavor. Distinguish it from a generic merchant start and clarify reuse boundaries.

## 1. Minimum Additional Conditions for Magnate Entry

After the bridge checkpoint (`apprentice_merchant_bridge_crossed`) fires, the apprentice path enters the magnate chain when:

### 1.1 Bridge Prerequisites (from P58-003)
- `origin_town_apprentice === true`
- `apprentice_trade_curiosity === true`
- `apprentice_midlife_trade_network === true`
- `apprentice_join_partnership === true`
- `route_wealth_committed === true` (set by bridge)

### 1.2 Magnate On-Ramp Conditions
- Player age reaches 28–32 (P55 `magnate_on_ramp` spine event window)
- Route flag satisfied: `apprentice_merchant_bridge_crossed` (added to gate as alternative to `route_merchant`)
- Merchant milestone satisfied: `apprentice_merchant_bridge_crossed` (added to gate as alternative to shop/caravan milestones)
- Not already completed (`!magnate_on_ramp_done`)
- Not orthodox/demonic childhood

### 1.3 What Triggers Magnate Chain Entry
The P55 `magnate_on_ramp` spine event fires when:
1. Route flag: `route_merchant || merchant_childhood_seed_done || p8_route_wealth || apprentice_merchant_bridge_crossed`
2. Merchant milestone: `merchant_caravan_success || merchant_shop_grocery || ... || apprentice_merchant_bridge_crossed`
3. Age window 28–32
4. Not already done, not orthodox/demonic

The bridge ensures conditions 1 and 2 are met via `apprentice_merchant_bridge_crossed`. The midlife event timing ensures condition 3 is feasible.

## 2. Distinction vs. Generic Merchant Start

| Dimension | Generic Merchant (`merchant_house`) | Bridged Apprentice (`town_apprentice`) |
|-----------|-------------------------------------|---------------------------------------|
| Origin tier | Vivid | Ordinary |
| Early merchant signal | `p9_early_merchant_seed` (childhood) | `apprentice_trade_curiosity` (childhood, different flag) |
| Wealth-route entry | Direct merchant-route choice | Trade network → partnership → bridge checkpoint |
| Social capital base | High (0.70) | Moderate (0.38), built through trade network |
| Family resources | High (0.90) | Moderate (0.42), supplemented by partnership |
| Narrative flavor | Born into merchant family, natural path | Town apprentice who builds merchant contacts through trade |
| Bridge tracking | No bridge flag (always merchant) | `apprentice_merchant_bridge_crossed` flag set |

### 2.1 Key Differentiator
The generic merchant start has merchant-route access from childhood. The apprentice must earn it through trade curiosity → trade network → partnership commitment. This creates a narrative arc of "skilled worker crosses into merchant ascent" rather than "born merchant continues family trade."

## 3. Reuse Boundary vs. P55 Magnate Chain

### 3.1 What P58 Reuses from P55
| Component | Reuse | Modification |
|-----------|-------|--------------|
| `magnate_on_ramp` spine event | ✅ Reused with gate expansion | `apprentice_merchant_bridge_crossed` added as alternative in both route + milestone conditions |
| `magnate_midlife_pressure` spine event | ✅ Exact reuse | None |
| `magnice_payoff` spine event | ✅ Exact reuse | None |
| `merchant_magnate` mixed gate | ✅ Exact reuse | None |
| Magnate expression surfaces | ✅ Exact reuse | None |
| Magnate flag chain | ✅ Exact reuse | None |

### 3.2 What P58 Does NOT Modify
- P55 spine event timing or age windows
- P55 magnate expression text
- P55 mixed baseline fixtures
- Any existing merchant route configuration
- Generic merchant path behavior (childhood seed, talent discovery, shop/caravan milestones)

### 3.3 What P58 Adds (Minimal)
- `apprentice_merchant_bridge_crossed` as alternative in `magnate_on_ramp` and `merchant_midlife_debt_milestone` gate expressions (`sample-lines-spine.json`)
- Bridge checkpoint flags in midlife config (P58-005)
- Bridge expression signals (P58-006)
- Bridge tracking flag `apprentice_merchant_bridge_crossed`

## 4. Entry Path Trace

```
town_apprentice (ordinary origin)
  ↓ childhood choice
apprentice_trade_curiosity (seed)
  ↓ midlife event
apprentice_midlife_trade_network (growth)
  ↓ choice
apprentice_join_partnership (commitment)
  ↓ bridge checkpoint (P58-005)
route_wealth_committed + apprentice_merchant_bridge_crossed
  ↓ age 28-32
P55 magnate_on_ramp (spine event)
  ↓ age 36-40
P55 magnate_midlife_pressure
  ↓ age 42-46
P55 magnate_payoff
  ↓
merchant_magnate mixed gate evaluation
```

## 5. Validation Criteria

The magnate-entry contract is validated when:
1. An apprentice with all bridge prerequisites can reach `magnate_on_ramp` at runtime
2. The `merchant_magnate` gate can fire for a bridged apprentice
3. The bridged apprentice path is distinguishable from generic merchant start via `apprentice_merchant_bridge_crossed`
4. P55 existing magnate chain behavior does not change

## 6. Recording Location

This contract is recorded as:
- Design doc: `docs/PRD/p58-apprentice-magnate-entry-contract.md`
- Bridge contract: `docs/PRD/p58-apprentice-bridge-contract.md`
- Implementation: `src/data/lines/ordinary-origin-midlife.json` (flag additions)

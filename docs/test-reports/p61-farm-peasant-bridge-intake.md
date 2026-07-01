# P61 Farm-Peasant Bridge Intake (P61-001)

Generated: 2026-06-28

## Scope

This document formally intakes the P60-approved bridge contract for `farm_peasant` and defines exactly what P61 will implement. P61 is a strict implementation stage — no direction redesign, no new systems, no scope expansion.

## 1. P60-Approved Direction Recap

### 1.1 Chosen Bridge Direction
**Grain-merchant adjacent** — `farm_peasant` enters trade through physical labor on grain/commodity caravans, then gradually moves into small-scale trading.

### 1.2 Downstream Target
`merchant_magnate` mixed destiny, via the existing P55 magnate chain (`magnate_on_ramp` → `magnate_midlife_pressure` → `magnate_payoff`).

### 1.3 Why This Direction (From P60)
- **Bounded scope:** Comparable to P58 apprentice bridge and P59 tavern-hand bridge
- **Proven pattern:** Single bridge flag satisfies both route + milestone conditions in `magnate_on_ramp` gate
- **Identity preserved:** Peasant origin remains `farm_peasant`; bridge is "ascent from peasant background"
- **Distinct entry:** Physical labor → swap crew → grain trade (different from apprentice's skill→trade and tavern_hand's network→trade)

## 2. Bridge Checkpoint

### 2.1 Bridge Flag
`peasant_merchant_bridge_crossed` — bridge-specific tracking flag (follows P58/P59 naming pattern)

### 2.2 Set By
`ordinary_peasant_midlife_outside_offer` event → `accept_offer` option (text reframed to grain-trade context)

### 2.3 Flags Set at Checkpoint
1. `peasant_merchant_bridge_crossed` — bridge-specific tracking flag
2. `route_wealth_committed` — connects to existing `merchant_magnate` mixed destiny gate

### 2.4 Prerequisite Chain
```
origin_farm_peasant (origin selection, age 0)
  + peasant_swap_crew_curiosity (childhood fork, age 10–14)
  + ordinary_peasant_midlife_outside_offer (age 30, grain-trade offer)
  + peasant_accept_outside (choice: accept offer)
    ↓
peasant_merchant_bridge_crossed + route_wealth_committed (bridge checkpoint)
    ↓
P55 magnate_on_ramp → magnate_midlife_pressure → magnate_payoff
    ↓
merchant_magnate mixed gate
```

## 3. Minimal Additions (P61 Scope)

### 3.1 Configuration Changes
| Change | File | Nature |
|--------|------|--------|
| Reframe `ordinary_peasant_midlife_outside_offer` prompt + option text to grain-trade context | `ordinary-origin-midlife.json` | Content reframing only — no structural change |
| Add `route_wealth_committed` + `peasant_merchant_bridge_crossed` to `accept_offer` flags | `ordinary-origin-midlife.json` | 2 flags added to existing option |
| Add `peasant_merchant_bridge_crossed` to `magnate_on_ramp` gate conditions (both route + milestone) | `sample-lines-spine.json` | Gate expression expansion — follows P58/P59 pattern |
| Add `peasant_merchant_bridge_crossed` to `merchant_midlife_debt_milestone` gate conditions | `sample-lines-spine.json` | Same pattern |

### 3.2 Expression Additions
| Surface | New Branch | Text |
|---------|------------|------|
| `peasantCurrentGoal()` | Bridge-crossed state | "跟着粮商走南闯北，粮路渐宽" |
| `peasantLifeMemory()` | Bridge-crossed state | "你从田间走到粮路上，从帮工做起，渐渐摸通了粮货买卖。" |
| `deriveOrdinaryOriginSummary()` | Peasant-merchant branch | "农家出身的粮货商人：从田埂到粮路，靠体力和勤恳踏出生意路。" |

### 3.3 Test and Proof Artifacts
| Artifact | Type |
|----------|------|
| `tests/p61FarmPeasantBridgeTests.ts` | Narrow regression tests (~12–15 assertions) |
| `docs/test-reports/p61-farm-peasant-magnate-targeted-proof.md` | Targeted proof document |

## 4. Deferred Items (NOT in P61)

| Item | Reason Deferred |
|------|-----------------|
| Escort / jianghu-renown bridge direction | Good narrative idea, but no downstream event chain. Separate stage needed. |
| `farm_peasant` → healer-swordsman medical path | No peasant-medical seed; would need new system building |
| Rural-urban migration system | Too large — full feature, not a bridge |
| Farm / agriculture management system | Out of scope — bridge direction, not farm simulation |
| Fourth ordinary origin | Explicitly forbidden per P56 scope contract |
| Full ordinary-origin rebalance | Out of scope — P61 is single-origin implementation |
| Sample-line track reopening | Sample-line track is closed; ordinary bridges feed into existing gates |
| Economy system / trade routes map | Platform-level change — dwarfs bridge scope |
| Full lifetime sim (age 0–50) | Out of scope for bounded bridge |
| Browser / UI verification | Expression changes on existing surfaces; no new UI components |
| Playtest / human acceptance | Gate + expression-level verification sufficient for bounded bridge |

## 5. P61 Implementation Order

1. **P61-001:** Intake document (this file) — no runtime changes
2. **P61-002:** Scope contract document — no runtime changes
3. **P61-003:** Minimum bridge content (config + flag additions)
4. **P61-004:** Downstream gate wiring (`magnate_on_ramp` + `merchant_midlife_debt_milestone`)
5. **P61-005:** Bridge expression (currentGoal + lifeMemory + summary)
6. **P61-006:** Targeted proof document
7. **P61-007:** Narrow regression tests
8. **P61-008:** Closure report

## 6. Validation Shape (From P60 Contract §6)

### 6.1 Required Validations
- Bridge gate flags verification
- Prerequisite enforcement
- Current goal expression
- Life-memory expression
- Summary expression
- Ordinary origin identity preservation
- Life-memory summary integration
- Non-peasant isolation (apprentice/tavern_hand not affected)
- `magnate_on_ramp` gate acceptance
- `magnate_on_ramp` rejection without bridge
- `merchant_midlife_debt` gate acceptance
- Generic merchant path still works

### 6.2 Success Criteria
1. Bridge is runtime-reachable from peasant origin
2. Bridge connects to P55 magnate chain (both gates accept bridge flag)
3. Bridge is player-visible on 3 expression surfaces
4. Peasant origin identity preserved after bridge
5. No regressions to P56/P58/P59
6. Documentation complete (proof + closure)

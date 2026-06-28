# P63 Merchant Entry Differentiation Targeted Proof (P63-006)

> **Date:** 2026-06-28
> **Stage:** P63 Merchant Magnate Bridge-Entry Differentiation
> **Branch:** `codex/p63-wuxia-merchant-magnate-bridge-entry-differentiation`
> **Type:** Targeted proof — entry differentiation verification

## Scope

This artifact proves that the three ordinary bridge paths (apprentice, tavern, peasant) produce distinguishable merchant entry expression when crossing into the magnate chain via `magnate_on_ramp`. The proof verifies that P63 differentiation is runtime-visible and supports the P64 decision.

## Proof Method

1. **Expression verification:** Confirm all three bridge entries produce distinct `currentGoal`, `costLabel`, and `age40Identity` text
2. **Signal distinctiveness:** Verify each bridge has unique keywords that differentiate it from the others
3. **Gate connectivity:** Verify bridge flags are accepted by `magnate_on_ramp` gate and `detectSampleLine` now recognizes them

## 1. Entry Differentiation Expression Evidence

### 1.1 Apprentice Bridge Entry

**Entry conditions:**
- `apprentice_merchant_bridge_crossed: true`
- `magnate_on_ramp_done: true`

**currentGoal at magnate_on_ramp:**
- Text: "手艺学透、合伙商路已通，正谋划更大的局面"
- Key differentiation: "手艺" (craft) + "合伙" (partnership)
- Narrative framing: Business as skill extension

**costLabel at magnate_on_ramp:**
- Text: "手艺与合伙的担子"
- Key differentiation: Emphasizes craft mastery and partnership burden

**age40Identity when magnate_on_ramp_done:**
- Text: "你是从学徒走来的巨贾：手艺为基，合伙为径，商路是技能延伸的版图"
- Key differentiation: "学徒" origin, "手艺为基"

### 1.2 Tavern Hand Bridge Entry

**Entry conditions:**
- `tavern_merchant_bridge_crossed: true`
- `magnate_on_ramp_done: true`

**currentGoal at magnate_on_ramp:**
- Text: "人脉已通、铺子已上手，正借助这些关系扩张"
- Key differentiation: "人脉" (network) + "铺子" (shop)
- Narrative framing: Business as relationship extension

**costLabel at magnate_on_ramp:**
- Text: "人脉与铺子的担子"
- Key differentiation: Emphasizes network and shop management burden

**age40Identity when magnate_on_ramp_done:**
- Text: "你是从酒肆走来的巨贾：人脉为基，引荐为径，商路是人情往来的延伸"
- Key differentiation: "酒肆" origin, "人脉为基"

### 1.3 Peasant Bridge Entry

**Entry conditions:**
- `peasant_merchant_bridge_crossed: true`
- `magnate_on_ramp_done: true`

**currentGoal at magnate_on_ramp:**
- Text: "粮路跑通、买卖上手，正学着像商人一样思考"
- Key differentiation: "粮路" (grain trade) + "买卖" (trade)
- Narrative framing: Business as labor elevation

**costLabel at magnate_on_ramp:**
- Text: "粮路与买卖的担子"
- Key differentiation: Emphasizes grain trade and commerce burden

**age40Identity when magnate_on_ramp_done:**
- Text: "你是从农家走来的巨贾：力气为基，跑商为径，商路是勤劳致富的通道"
- Key differentiation: "农家" origin, "力气为基"

## 2. Signal Distinctiveness Matrix

| Signal Type | Apprentice | Tavern Hand | Peasant |
|------------|-----------|-------------|---------|
| currentGoal keyword | 手艺、合伙 | 人脉、铺子 | 粮路、买卖 |
| costLabel | 手艺与合伙的担子 | 人脉与铺子的担子 | 粮路与买卖的担子 |
| age40Identity origin | 学徒 | 酒肆 | 农家 |
| Narrative frame | 技能延伸 | 人情往来 | 勤劳致富 |

## 3. Gate Connectivity Verification

### 3.1 magnate_on_ramp Gate Acceptance

The `magnate_on_ramp` gate (P55) accepts all three bridge flags:

```
condition: (route_merchant || merchant_childhood_seed_done || p8_route_wealth ||
            apprentice_merchant_bridge_crossed || tavern_merchant_bridge_crossed ||
            peasant_merchant_bridge_crossed) &&
           (merchant_caravan_success || merchant_shop_grocery || ... ||
            apprentice_merchant_bridge_crossed || tavern_merchant_bridge_crossed ||
            peasant_merchant_bridge_crossed)
```

- **apprentice_merchant_bridge_crossed:** ✅ satisfies both route AND milestone conditions
- **tavern_merchant_bridge_crossed:** ✅ satisfies both route AND milestone conditions
- **peasant_merchant_bridge_crossed:** ✅ satisfies both route AND milestone conditions

### 3.2 detectSampleLine Recognition (P63 Fix)

P63 adds bridge flag recognition to `detectSampleLine`:

```javascript
flags.route_merchant || flags.merchant_talent || flags.merchant_childhood_seed_done ||
flags.p8_route_wealth ||
// P63: Bridge-origin merchant entry flags
flags.apprentice_merchant_bridge_crossed ||
flags.tavern_merchant_bridge_crossed ||
flags.peasant_merchant_bridge_crossed
```

This ensures bridge-crossed players are detected as merchant line and receive differentiated expression.

## 4. P64 Decision Support

### 4.1 Evidence that P64 is Worth Doing

The entry differentiation proves:
1. **Distinct origins are preserved:** Apprentice (craft), Tavern (network), Peasant (labor) remain distinguishable at magnate entry
2. **Runtime signals exist:** Player-facing expression shows different text based on bridge origin
3. **Identity markers are stable:** Bridge flags serve as reliable differentiation signals

### 4.2 Evidence that P64 can Build on P63

- Entry markers (`*_merchant_bridge_crossed`) are already set and tested
- Expression surfaces are wired and producing differentiated text
- Gate connectivity is verified — all three paths connect to magnate chain
- No framework changes needed — P64 can add pressure/payoff differentiation on top

### 4.3 Deeper Differentiation Opportunities for P64

| Stage | Apprentice Differentiation | Tavern Differentiation | Peasant Differentiation |
|-------|--------------------------|----------------------|------------------------|
| magnate_midlife_pressure | Partnership debts, craft market risks | Network betrayals, shop competition | Grain price volatility, labor shortages |
| magnate_payoff | Business empire vs craft legacy | Relationship empire vs social capital | Wealth empire vs labor tradition |

## 5. Test Coverage

P63 adds focused expression tests in `tests/p50SampleLineExpressionTests.ts`:
- `testP63ApprenticeBridgeEntryDifferentiation()` — verifies apprentice currentGoal, costLabel, age40Identity
- `testP63TavernBridgeEntryDifferentiation()` — verifies tavern currentGoal, costLabel, age40Identity
- `testP63PeasantBridgeEntryDifferentiation()` — verifies peasant currentGoal, costLabel, age40Identity
- `testP63BridgeEntryDistinction()` — verifies all three produce distinct signals

All tests pass.

## 6. Conclusion

P63 successfully implements bounded bridge-entry differentiation:
- ✅ Three entry paths produce distinct runtime-visible signals
- ✅ Differentiation is in existing expression surfaces (no new UI)
- ✅ Gate connectivity preserved — all paths connect to P55 magnate chain
- ✅ Targeted proof confirms P64 can build on this foundation

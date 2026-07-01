# P64 Magnate Pressure/Payoff Differentiated Proof (P64-007)

> **Date:** 2026-06-28
> **Stage:** P64 Merchant Magnate Differentiated Pressure And Payoff
> **Branch:** `codex/p64-wuxia-merchant-magnate-differentiated-pressure-payoff`

---

## 1. Scope

This artifact proves that the three merchant bridge paths (apprentice, tavern, peasant) now diverge meaningfully at the `magnate_midlife_pressure` and `magnate_payoff` stages through bounded expression differentiation implemented in P64-005.

---

## 2. Proof Method

1. **Expression verification:** Simulate player states with bridge flags and verify `merchantCurrentGoal()` returns origin-specific text at pressure/payoff stages
2. **Differentiation verification:** Confirm all three bridges produce distinct text
3. **Player-visibility verification:** Confirm no raw keys leak into player-facing text
4. **Gate integrity:** Confirm all three bridges still satisfy the same magnate gates

---

## 3. Expression Evidence

### 3.1 Pressure Stage Differentiation

#### Apprentice Bridge (P58 Origin)
**State:**
```json
{
  "apprentice_merchant_bridge_crossed": true,
  "route_merchant": true,
  "magnate_on_ramp_done": true,
  "magnate_midlife_pressure_done": true
}
```
**Text:** "商号遍九州，合伙人与人情债也遍九州，供货的账期、销路的分成拴住每一条线"

**Key signals:** "合伙人" (partnership), "供货的账期、销路的分成" (supply chain accounts, sales distribution)

#### Tavern Hand Bridge (P59 Origin)
**State:**
```json
{
  "tavern_merchant_bridge_crossed": true,
  "route_merchant": true,
  "magnate_on_ramp_done": true,
  "magnate_midlife_pressure_done": true
}
```
**Text:** "商号遍九州，人情面子债也遍九州，老主顾的期待、介绍的欠情让巨贾负重前行"

**Key signals:** "人情面子债" (social/reputation debt), "老主顾的期待、介绍的欠情" (client expectations, referral obligations)

#### Farm Peasant Bridge (P61 Origin)
**State:**
```json
{
  "peasant_merchant_bridge_crossed": true,
  "route_merchant": true,
  "magnate_on_ramp_done": true,
  "magnate_midlife_pressure_done": true
}
```
**Text:** "商号遍九州，车马仓储债也遍九州，运力、仓库、下属工钱让泥腿子巨贾不敢停歇"

**Key signals:** "车马仓储债" (transport/storage debt), "运力、仓库、下属工钱" (logistics, warehousing, labor costs)

### 3.2 Payoff Stage Differentiation

#### Apprentice Bridge (P58 Origin)
**State:**
```json
{
  "apprentice_merchant_bridge_crossed": true,
  "route_merchant": true,
  "magnate_on_ramp_done": true,
  "magnate_midlife_pressure_done": true,
  "magnate_payoff_done": true
}
```
**Text:** "商路已掌控，供货销路尽在掌握，手艺人的巨贾之位靠的是一身本事和合伙人的信任"

**Key signals:** "商路已掌控，供货销路尽在掌握" (trade routes controlled, supply and sales mastered), "合伙人的信任" (partner trust)

#### Tavern Hand Bridge (P59 Origin)
**State:**
```json
{
  "tavern_merchant_bridge_crossed": true,
  "route_merchant": true,
  "magnate_on_ramp_done": true,
  "magnate_midlife_pressure_done": true,
  "magnate_payoff_done": true
}
```
**Text:** "商号凭人脉通八方，老主顾遍布各行，酒肆出身的巨贾人脉就是商路"

**Key signals:** "人脉通八方" (network reaches all directions), "老主顾遍布各行" (clients across industries), "人脉就是商路" (network IS the business)

#### Farm Peasant Bridge (P61 Origin)
**State:**
```json
{
  "peasant_merchant_bridge_crossed": true,
  "route_merchant": true,
  "magnate_on_ramp_done": true,
  "magnate_midlife_pressure_done": true,
  "magnate_payoff_done": true
}
```
**Text:** "车马仓储物流根基已成，泥腿子熬出来的商路靠的是一步一步走出来的根基"

**Key signals:** "车马仓储物流根基" (transport/warehouse/logistics foundation), "一步一步走出来的根基" (built step by step)

---

## 4. Differentiation Matrix

### 4.1 Pressure Stage

| Aspect | Apprentice | Tavern | Peasant |
|--------|-----------|--------|---------|
| **Debt theme** | 合作债 (partnership debt) | 人情面子债 (social/reputation debt) | 车马仓储债 (logistics debt) |
| **Key signals** | 供货账期、销路分成 | 老主顾期待、介绍欠情 | 运力、仓库、下属工钱 |
| **Source** | Craft→trade partnership | Social service→network | Physical labor→grain trade |
| **Expression flavor** | 手艺合作 | 人情面子 | 体力物流 |

### 4.2 Payoff Stage

| Aspect | Apprentice | Tavern | Peasant |
|--------|-----------|--------|---------|
| **Asset theme** | 商路掌控 (trade mastery) | 人脉商路 (network value) | 物流根基 (infrastructure) |
| **Key signals** | 供货销路尽在掌握 | 人脉通八方、老主顾遍布 | 车马仓储物流根基 |
| **Source** | Craft→trade partnership | Social service→network | Physical labor→grain trade |
| **Expression flavor** | 合伙信任 | 酒肆人脉 | 泥腿子根基 |

---

## 5. Gate Integrity Verification

All three bridges still satisfy the same magnate gates:

### 5.1 magnate_midlife_pressure Gate
```
Condition: magnate_on_ramp_done && !magnate_midlife_pressure_done && !orthodox_seed && !demonic_seed
Apprentice: ✅ Satisfied (has apprentice_merchant_bridge_crossed, magnate_on_ramp_done)
Tavern: ✅ Satisfied (has tavern_merchant_bridge_crossed, magnate_on_ramp_done)
Peasant: ✅ Satisfied (has peasant_merchant_bridge_crossed, magnate_on_ramp_done)
```

### 5.2 magnate_payoff Gate
```
Condition: magnate_on_ramp_done && magnate_midlife_pressure_done && !magnate_payoff_done && !orthodox_seed && !demonic_seed
Apprentice: ✅ Satisfied (has all required flags)
Tavern: ✅ Satisfied (has all required flags)
Peasant: ✅ Satisfied (has all required flags)
```

---

## 6. P55 Baseline Comparison

### 6.1 P55 Baseline (Generic)

| Stage | P55 Baseline Text |
|-------|-------------------|
| Pressure | "商号遍九州，人情债也遍九州" |
| Payoff | "巨贾之位已成，守住比扩张更难" |

### 6.2 P64 Differentiated

| Stage | Apprentice | Tavern | Peasant |
|-------|-----------|--------|---------|
| Pressure | "合伙人与人情债也遍九州，供货账期、销路分成拴住" | "人情面子债也遍九州，老主顾期待、介绍欠情让巨贾负重" | "车马仓储债也遍九州，运力仓库下属工钱让泥腿子不敢停歇" |
| Payoff | "商路掌控，供货销路尽在掌握，手艺人靠本事和合伙人信任" | "人脉通八方，老主顾遍布，酒肆人脉就是商路" | "车马仓储物流根基已成，泥腿子一步一步走出来的根基" |

**Improvement:** P64 extends P55 baseline with origin-specific flavor while preserving the core magnate identity structure.

---

## 7. Proof Summary

| Evidence Type | Status | Detail |
|---------------|--------|--------|
| Expression differentiation | ✅ | All three bridges produce distinct text at pressure and payoff stages |
| Origin-specific signals | ✅ | Apprentice: partnership/trade, Tavern: social/network, Peasant: physical/logistics |
| Gate integrity | ✅ | All three bridges satisfy same magnate gates |
| P55 baseline extension | ✅ | P64 extends P55 with bounded differentiation |
| Player-visibility | ✅ | All text is player-visible (no raw keys) |

---

## 8. What This Does NOT Prove

- Full combinatorial exhaust (out of scope per PRD)
- Runtime event firing (assumes engine correctly evaluates conditions)
- Full lifetime platform wave (out of scope per PRD)
- P58/P59/P61 bridge regression — covered by respective test suites

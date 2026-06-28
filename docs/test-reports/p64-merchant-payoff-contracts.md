# P64 Differentiated Payoff Contracts

> **Date:** 2026-06-28
> **Stage:** P64 Merchant Magnate Differentiated Pressure And Payoff
> **Type:** Design contracts — bounded differentiation specification

---

## 1. Purpose

These contracts define the origin-specific payoff emphasis for each merchant bridge path at the `magnate_payoff` stage. Each payoff contract ties the magnate success to the bridge's origin seed, ensuring the three merchant ascents land with different emphases rather than one undifferentiated merchant success line.

---

## 2. Apprentice Merchant Payoff Contract

### 2.1 Origin Seed (P58)
- **Identity seed:** Craft skill → Trade partnership
- **Bridge checkpoint:** `apprentice_merchant_bridge_crossed`
- **Payoff source:** Trade network value

### 2.2 Payoff Emphasis
**Magnate payoff for apprentice-origin merchants emphasizes:**

- **Supply chain mastery:** Control over suppliers and distribution channels
- **Trade route dominance:** Established commercial pathways with consistent margins
- **Commercial reputation:** "老字号" reputation built on quality and reliability
- **Partnership equity value:** Business stakes have compounding value

### 2.3 Bounded Expression
```
Original (generic): "半生经营，你的商号已成江湖不可或缺的血脉。可每一笔利润都沾着人情，每一桩合作都系着风险——巨贾之位，坐上去容易，守住难。"

Apprentice payoff: "半生经营，你的商路已成江湖不可或缺的血脉。供货的账期尽在掌握，销路的分成已是惯例——手艺人的巨贾之位，靠的是一身本事和合伙人的信任。"
```

**Key differentiator:** "商路" + "供货的账期尽在掌握，销路的分成已是惯例" — emphasizes craft/trade mastery and partnership trust rather than generic social obligations.

---

## 3. Tavern Hand Merchant Payoff Contract

### 3.1 Origin Seed (P59)
- **Identity seed:** Social service → Guest network → Ally referral
- **Bridge checkpoint:** `tavern_merchant_bridge_crossed`
- **Payoff source:** Social capital value

### 3.2 Payoff Emphasis
**Magnate payoff for tavern-origin merchants emphasizes:**

- **Client relationship wealth:** "八方宾客皆是资源" — every contact is a potential opportunity
- **Reputation leverage:** Social standing translates directly to business advantage
- **Network effects:** Referrals create compounding business development
- **Hospitality industry influence:** Control over a segment of the service economy

### 3.3 Bounded Expression
```
Original (generic): "半生经营，你的商号已成江湖不可或缺的血脉。可每一笔利润都沾着人情，每一桩合作都系着风险——巨贾之位，坐上去容易，守住难。"

Tavern payoff: "半生经营，你的商号已成江湖不可或缺的血脉。老主顾遍布各行，介绍信堆满案头——酒肆出身的巨贾，人脉就是商路。"

Tavern payoff (alternative): "半生经营，你的商号已成江湖不可或缺的血脉。可每一笔利润都沾着人情，每一桩合作都系着风险——巨贾之位，坐上去容易，守住难。"
```

**Key differentiator:** "老主顾遍布各行，介绍信堆满案头" + "人脉就是商路" — emphasizes social capital and network value rather than craft mastery.

---

## 4. Farm Peasant Merchant Payoff Contract

### 4.1 Origin Seed (P61)
- **Identity seed:** Physical labor → Swap crew → Grain trade offer
- **Bridge checkpoint:** `peasant_merchant_bridge_crossed`
- **Payoff source:** Physical infrastructure and market position

### 4.2 Payoff Emphasis
**Magnate payoff for peasant-origin merchants emphasizes:**

- **Physical infrastructure control:** Warehouses, transport fleets, storage facilities
- **Commodity market position:** Direct access to supply sources and distribution endpoints
- **Labor management leverage:** Ability to mobilize and direct large workforces
- **物流 network ownership:** Control over physical goods movement

### 4.3 Bounded Expression
```
Original (generic): "半生经营，你的商号已成江湖不可或缺的血脉。可每一笔利润都沾着人情，每一桩合作都系着风险——巨贾之位，坐上去容易，守住难。"

Peasant payoff: "半生经营，你的商号已成江湖不可或缺的血脉。车马遍布各路，仓库积满粮货，手下的工人成千上百——泥腿子熬出来的商路，靠的是一步一步走出来的根基。"
```

**Key differentiator:** "车马遍布各路，仓库积满粮货" + "一步一步走出来的根基" — emphasizes physical infrastructure and labor leverage rather than social networks or craft mastery.

---

## 5. Distinction from Related Payoffs

### 5.1 Distinction from merchant_martial_patron
The `merchant_martial_patron` payoff (P52) emphasizes:
- Marital/family alliances through merchant wealth
- Political leverage through economic power
- Sectarian influence through trade

**P64 payoff is distinct** — it focuses on origin-specific commercial infrastructure and network value, not marital/political leverage.

### 5.2 Distinction from Generic Merchant Success
Generic merchant success emphasizes:
- Wealth accumulation
- Business reputation
- Market dominance

**P64 payoff is distinct** — it ties success to origin-specific assets (craft network, social capital, physical infrastructure).

### 5.3 Distinction from P55 Baseline Magnate Payoff
P55 baseline payoff is:
- "巨贾之位已成，守住比扩张更难" — undifferentiated magnate success

**P64 payoff extends P55** with origin-specific flavor while preserving the core magnate identity.

---

## 6. Contract Implementation Notes

### 6.1 Differentiated Expression Strategy

The payoff differentiation is achieved through **text variation within the same event structure**, not through new events or new flags. The existing `magnate_payoff` event fires for all three bridges, but the text is selected based on which bridge flag is set.

**Implementation approach:**
- Use existing bridge flags to drive text selection
- No new flags required
- Expression function `merchantCurrentGoal()` already checks these flags

### 6.2 Bounded Scope

| Aspect | Constraint |
|--------|-------------|
| New events | None — modify existing event text only |
| New flags | None — reuse existing bridge flags |
| Gate architecture | Unchanged — all three bridges still satisfy same gates |
| P55 chain | Unchanged — payoff still fires after pressure |

---

## 7. Contracts Summary

| Bridge | Payoff Source | Key Theme | Expression Emphasis |
|--------|---------------|-----------|-------------------|
| Apprentice (P58) | Trade network value | 商路掌控 | 供货账期、销路分成、合伙信任 |
| Tavern Hand (P59) | Social capital value | 人脉商路 | 老主顾、介绍信、八方宾客 |
| Farm Peasant (P61) | Physical infrastructure | 物流根基 | 车马、仓库、工人、运输网 |

---

## 8. Payoff vs Pressure Symmetry

| Bridge | Pressure Theme | Payoff Theme |
|--------|---------------|-------------|
| Apprentice | 合作债 (partnership debts) | 商路掌控 (trade mastery) |
| Tavern Hand | 人情债 (social debts) | 人脉商路 (network value) |
| Farm Peasant | 体力债 (physical debts) | 物流根基 (infrastructure) |

This creates a symmetric structure where each path's burden at pressure stage is offset by its corresponding asset at payoff stage.

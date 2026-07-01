# P64 Differentiated Pressure Contracts

> **Date:** 2026-06-28
> **Stage:** P64 Merchant Magnate Differentiated Pressure And Payoff
> **Type:** Design contracts — bounded differentiation specification

---

## 1. Purpose

These contracts define the origin-specific pressure emphasis for each merchant bridge path at the `magnate_midlife_pressure` stage. Each pressure contract ties the magnate pressure to the bridge's origin seed, ensuring the three merchant ascents carry different burdens rather than identical generic merchant stress.

---

## 2. Apprentice Merchant Pressure Contract

### 2.1 Origin Seed (P58)
- **Identity seed:** Craft skill → Trade partnership
- **Bridge checkpoint:** `apprentice_merchant_bridge_crossed`
- **Pressure source:** Partnership/craft dependencies

### 2.2 Pressure Emphasis
**Magnate midlife pressure for apprentice-origin merchants emphasizes:**

- **Craft-supply chain obligations:** Suppliers expect consistent quality and delivery
- **Partner dependency debts:** Business partners hold equity and expect returns
- **Technical skill dependencies:** Specialized knowledge creates dependency on key personnel
- **Trade route control:** Maintaining competitive supply lines requires ongoing investment

### 2.3 Bounded Expression
```
Original (generic): "商号遍九州，人情债也遍九州。每笔赊账、每位合作伙伴、每桩江湖义气，都是一根牵着你的线——巨贾的担子，比掌柜的重得多。"

Apprentice pressure: "商号遍九州，合伙人与人情债也遍九州。供货的账期、销路的分成、合作伙伴的期待——每一样都是拴住你的线，手艺人的担子比掌柜的重得多。"
```

**Key differentiator:** "合伙人与人情债" + "供货的账期、销路的分成" — emphasizes craft/trade partnership burdens rather than generic social debts.

---

## 3. Tavern Hand Merchant Pressure Contract

### 3.1 Origin Seed (P59)
- **Identity seed:** Social service → Guest network → Ally referral
- **Bridge checkpoint:** `tavern_merchant_bridge_crossed`
- **Pressure source:** Social/reputation obligations

### 3.2 Pressure Emphasis
**Magnate midlife pressure for tavern-origin merchants emphasizes:**

- **Reputation maintenance:** Client trust requires consistent quality and availability
- **Network obligation debts:** Introductions and referrals create implicit obligations
- **Social capital pressure:** "面子" (face) demands require honoring hospitality commitments
- **Client relationship overhead:** Regular customers expect preferential treatment

### 3.3 Bounded Expression
```
Original (generic): "商号遍九州，人情债也遍九州。每笔赊账、每位合作伙伴、每桩江湖义气，都是一根牵着你的线——巨贾的担子，比掌柜的重得多。"

Tavern pressure: "商号遍九州，人情面子债也遍九州。每位老主顾的期待、每回介绍的欠情、每笔赊账的义气——酒肆出身的巨贾，人情比债务还重。"
```

**Key differentiator:** "人情面子债" + "老主顾的期待、介绍的欠情" — emphasizes social/reputation burdens rather than craft partnership debts.

---

## 4. Farm Peasant Merchant Pressure Contract

### 4.1 Origin Seed (P61)
- **Identity seed:** Physical labor → Swap crew → Grain trade offer
- **Bridge checkpoint:** `peasant_merchant_bridge_crossed`
- **Pressure source:** Logistics/physical throughput obligations

### 4.2 Pressure Emphasis
**Magnate midlife pressure for peasant-origin merchants emphasizes:**

- **Physical logistics burden:** Transportation, storage, and supply chain logistics
- **Labor management debts:** Crew wages, loyalty, and management obligations
- **Commodity flow pressure:** Keeping goods moving requires constant physical and financial investment
- **仓储/运输 capital:** Capital tied up in physical infrastructure

### 4.3 Bounded Expression
```
Original (generic): "商号遍九州，人情债也遍九州。每笔赊账、每位合作伙伴、每桩江湖义气，都是一根牵着你的线——巨贾的担子，比掌柜的重得多。"

Peasant pressure: "商号遍九州，车马仓储债也遍九州。粮路上的运力、仓库的周转、下属的工钱——泥腿子熬出来的巨贾，每一步都是体力和本钱撑出来的。"
```

**Key differentiator:** "车马仓储债" + "运力、仓库的周转" — emphasizes physical/logistics burdens rather than social or craft partnership debts.

---

## 5. Contract Implementation Notes

### 5.1 Differentiated Expression Strategy

The pressure differentiation is achieved through **text variation within the same event structure**, not through new events or new flags. The existing `magnate_midlife_pressure` event fires for all three bridges, but the text is selected based on which bridge flag is set.

**Implementation approach:**
- Use existing bridge flags (`apprentice_merchant_bridge_crossed`, `tavern_merchant_bridge_crossed`, `peasant_merchant_bridge_crossed`) to drive text selection
- No new flags required
- Expression function `merchantCurrentGoal()` already checks these flags

### 5.2 Bounded Scope

| Aspect | Constraint |
|--------|-------------|
| New events | None — modify existing event text only |
| New flags | None — reuse existing bridge flags |
| Gate architecture | Unchanged — all three bridges still satisfy same gates |
| P55 chain | Unchanged — on_ramp → pressure → payoff order preserved |

### 5.3 Relationship to Unified Magnate Identity

The pressure contracts **extend** the unified magnate identity with origin-specific burdens, rather than replacing it. All three paths still:
- Cross the same `magnate_midlife_pressure` gate
- Set the same `magnate_midlife_pressure_done` flag
- Receive the same `merchant_magnate` mixed outcome at payoff

---

## 6. Contracts Summary

| Bridge | Pressure Source | Key Theme | Expression Emphasis |
|--------|----------------|-----------|-------------------|
| Apprentice (P58) | Partnership/craft dependencies | 技术/合作债 | 供货账期、销路分成 |
| Tavern Hand (P59) | Social/reputation obligations | 人情面子债 | 老主顾、介绍欠情 |
| Farm Peasant (P61) | Physical/logistics burden | 车马仓储债 | 运力、仓库周转 |

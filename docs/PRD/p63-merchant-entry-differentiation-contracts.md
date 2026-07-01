# P63 Three Entry Differentiation Contracts

> **Date:** 2026-06-28
> **Stage:** P63 Merchant Magnate Bridge-Entry Differentiation
> **Branch:** `codex/p63-wuxia-merchant-magnate-bridge-entry-differentiation`
> **Type:** Design contracts — entry identity specifications

---

## 1. Contract Purpose

These contracts define how apprentice, tavern, and peasant should read differently at merchant entry. Each contract:
- Extends the existing bridge seed (not inventing new backgrounds)
- Specifies which differences belong in expression vs light runtime markers
- Keeps merchant_magnate intact as the shared mixed outcome

---

## 2. Apprentice Entry Identity Contract (P58)

### 2.1 Bridge Seed
**Origin path:** Craft skill → Trade network partnership → Apprentice merchant identity

The apprentice enters the merchant world through **craft mastery and formal partnership**. The key identity marker is "学会了手艺，找到了合伙"，从学徒到商人，从个人技能到商业合作。

### 2.2 Entry Identity Tone at Magnate On-Ramp

**Expression layer:**
- **currentGoal():** "手艺学透、合伙商路已通，正谋划更大的局面" — emphasizes mastery-to-scale progression
- **lifeMemory():** "从学徒到商人，靠的是手艺和合伙" — frames entry as formal achievement
- **deriveOrdinaryOriginSummary():** "学徒出身的商人：手艺为基，合伙为径，商路是技能延伸的版图" — positions merchant path as natural extension of craft skill

**Light runtime marker:**
- Flag `apprentice_merchant_entry_style: "craft_partnership"` — carries the tone signal without new framework

### 2.3 Differentiation Point
The apprentice entry should feel like **"my skills are now a business"** — business as skill extension.

---

## 3. Tavern Hand Entry Identity Contract (P59)

### 3.1 Bridge Seed
**Origin path:** Social service → Guest network → Ally referral → Tavern merchant identity

The tavern hand enters the merchant world through **social connections and network referrals**. The key identity marker is "靠人脉铺路，从伙计到商人"，从服务他人到被人引荐。

### 3.2 Entry Identity Tone at Magnate On-Ramp

**Expression layer:**
- **currentGoal():** "人脉已通、铺子已上手，正借助这些关系扩张" — emphasizes network leverage
- **lifeMemory():** "从跑堂伙计到商人，靠的是多年积攒的人情和关系" — frames entry as relationship achievement
- **deriveOrdinaryOriginSummary():** "酒肆出身的商人：人脉为基，引荐为径，商路是人情往来的延伸" — positions merchant path as natural extension of social capital

**Light runtime marker:**
- Flag `tavern_merchant_entry_style: "network_referral"` — carries the tone signal without new framework

### 3.3 Differentiation Point
The tavern hand entry should feel like **"my relationships are now a business"** — business as relationship extension.

---

## 4. Peasant Entry Identity Contract (P61)

### 4.1 Bridge Seed
**Origin path:** Physical labor → Swap crew curiosity → Grain trade → Peasant merchant identity

The peasant enters the merchant world through **physical labor and trade curiosity**. The key identity marker is "从田间到粮路，从卖力气到做买卖"，从体力劳动到商品流通。

### 4.2 Entry Identity Tone at Magnate On-Ramp

**Expression layer:**
- **currentGoal():** "粮路跑通、买卖上手，正学着像商人一样思考" — emphasizes practical learning
- **lifeMemory():** "从农家到商人，靠的是不怕吃苦和抓住机会" — frames entry as labor-to-trade transformation
- **deriveOrdinaryOriginSummary():** "农家出身的商人：力气为基，跑商为径，商路是勤劳致富的通道" — positions merchant path as natural extension of physical diligence

**Light runtime marker:**
- Flag `peasant_merchant_entry_style: "labor_trade"` — carries the tone signal without new framework

### 4.3 Differentiation Point
The peasant entry should feel like **"my hard work is now a business"** — business as labor elevation.

---

## 5. Shared Expression Framework

### 5.1 Expression vs Marker Division

| Layer | Content | Example |
|-------|---------|---------|
| **Expression** | Player-visible text in surfaces | currentGoal(), lifeMemory(), summary |
| **Light runtime marker** | Internal flag for differentiation signal | `{origin}_merchant_entry_style` |

### 5.2 Magnate On-Ramp Entry Flavor Text

Each entry should have a distinct checkpoint flavor at `magnate_on_ramp`:

| Bridge | Entry Flavor |
|--------|-------------|
| Apprentice | "手艺已成，合伙已定，商路渐宽" |
| Tavern Hand | "人脉已通，铺子已开，商路渐广" |
| Peasant | "粮路已跑，买卖已通，商路渐明" |

### 5.3 Unified Shared Outcome

**All three contracts preserve:**
- `merchant_magnate` mixed identity (unchanged)
- P55 magnate chain (pressure → payoff)
- Route commitment flag `route_wealth_committed`
- Bridge flag pattern `{origin}_merchant_bridge_crossed`

---

## 6. Expression Template Differentiation

### 6.1 currentGoal() Templates

| Bridge | Template | Example |
|--------|----------|---------|
| Apprentice | "[skill_mastery]，[partnership_result]，[expansion_intent]" | "手艺学透、合伙商路已通，正谋划更大的局面" |
| Tavern Hand | "[network_result]，[opportunity_taken]，[expansion_intent]" | "人脉已通、铺子已上手，正借助这些关系扩张" |
| Peasant | "[labor_result]，[trade_learning]，[growth_intent]" | "粮路跑通、买卖上手，正学着像商人一样思考" |

### 6.2 lifeMemory() Templates

| Bridge | Template | Example |
|--------|----------|---------|
| Apprentice | "从[origin]到商人，靠的是[craft_partnership]" | "从学徒到商人，靠的是手艺和合伙" |
| Tavern Hand | "从[origin]到商人，靠的是[network_referral]" | "从跑堂伙计到商人，靠的是多年积攒的人情和关系" |
| Peasant | "从[origin]到商人，靠的是[labor_opportunity]" | "从农家到商人，靠的是不怕吃苦和抓住机会" |

### 6.3 deriveOrdinaryOriginSummary() Templates

| Bridge | Template | Example |
|--------|----------|---------|
| Apprentice | "[origin]出身的商人：[origin_path]，[skill_extension]" | "学徒出身的商人：手艺为基，合伙为径，商路是技能延伸的版图" |
| Tavern Hand | "[origin]出身的商人：[origin_path]，[relationship_extension]" | "酒肆出身的商人：人脉为基，引荐为径，商路是人情往来的延伸" |
| Peasant | "[origin]出身的商人：[origin_path]，[labor_extension]" | "农家出身的商人：力气为基，跑商为径，商路是勤劳致富的通道" |

---

## 7. Implementation Notes

1. **No new frameworks** — Use existing expression surfaces and light flags only
2. **Bounded changes** — Only modify expression at magnate entry, not entire chain
3. **Seed extension** — Each contract extends the bridge seed, not new backgrounds
4. **Runtime marker** — Light flag carries tone signal for future proof/test assertions

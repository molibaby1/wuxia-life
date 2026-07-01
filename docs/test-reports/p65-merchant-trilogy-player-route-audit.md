# P65 Merchant Trilogy Player Route Audit

> **Date:** 2026-06-28
> **Stage:** P65 Wuxia Merchant Trilogy Player Experience Reconciliation
> **Type:** Audit — player-visible route comparison across the merchant trilogy package

---

## 1. Executive Summary

This audit treats `P58 + P59 + P61 + P63 + P64` as a single merchant trilogy player-route package: three ordinary-origin bridges (apprentice, tavern, peasant) feeding into one shared P55 magnate chain, with origin-aware differentiation at entry, pressure, and payoff stages.

**Audit question:** From the player's perspective, do these three routes feel like three different merchant lives, or three variants of the same merchant life?

---

## 2. Route Package Overview

### 2.1 Shared Structure
All three routes follow the same high-level arc:
```
ordinary origin → bridge curiosity → bridge crossing → magnate_on_ramp → magnate_midlife_pressure → magnate_payoff → merchant_magnate
```

### 2.2 Three Distinct Origins

| Dimension | Apprentice (P58) | Tavern Hand (P59) | Peasant (P61) |
|-----------|-----------------|-------------------|---------------|
| Origin | `town_apprentice` | `tavern_hand` | `farm_peasant` |
| Background | Urban craft | Urban service | Rural labor |
| Bridge trigger | Partnership choice | Referral acceptance | Grain-trade offer |
| Bridge flag | `apprentice_merchant_bridge_crossed` | `tavern_merchant_bridge_crossed` | `peasant_merchant_bridge_crossed` |

---

## 3. Player-Visible Layer-by-Layer Comparison

### 3.1 Bridge Layer (Origin → Magnate Entry)

| Surface | Apprentice | Tavern Hand | Peasant |
|---------|-----------|-------------|---------|
| **Bridge narrative** | 从学徒踏上了商路 | 从跑堂伙计踏上了商路 | 从田间走到粮路上 |
| **Bridge mechanism** | 合伙经商 | 人脉引荐进城铺子 | 跟着粮商走南闯北 |
| **Prerequisite feel** | 手艺学透 → 贸易好奇 → 合伙机会 | 客人熟络 → 拥抱人脉 → 贵人引荐 | 换班好奇 → 外面邀请 → 接受粮路 |
| **currentGoal (bridge phase)** | 合伙经商已有起色，商路渐通 | 城里铺子已上手，酒肆人脉铺出了商路 | 跟着粮商走南闯北，粮路渐宽 |
| **lifeMemory (bridge)** | 你与买卖人合伙经商，从学徒踏上了商路。 | 你靠着酒肆积累的人脉进了城里的铺子，从跑堂伙计踏上了商路。 | 你从田间走到粮路上，泥腿子出身也做起了买卖。 |
| **Ordinary origin summary** | 学徒出身的商人：从铺子学徒到商路合伙，跨越了手艺与买卖的界限。 | 酒肆出身的商人：从跑堂伙计到城里铺子，靠人脉铺出了商路。 | 农家出身的粮货商人：从田间地头到走南闯北，靠脚力踏出了粮路。 |

**Assessment of bridge layer:** ✅ **Strongly differentiated.** Each bridge has a distinct narrative, mechanism, and identity. The player clearly feels they're coming from a different background.

---

### 3.2 Entry Layer (magnate_on_ramp)

Differentiation implemented in P63.

| Surface | Apprentice | Tavern Hand | Peasant |
|---------|-----------|-------------|---------|
| **currentGoal** | 手艺学透、合伙商路已通，正谋划更大的局面 | 人脉已通、铺子已上手，正借助这些关系扩张 | 粮路跑通、买卖上手，正学着像商人一样思考 |
| **costLabel** | 手艺与合伙的担子 | 人脉与铺子的担子 | 粮路与买卖的担子 |
| **age40Identity** | 你是从学徒走来的巨贾：手艺为基，合伙为径，商路是技能延伸的版图 | 你是从酒肆走来的巨贾：人脉为基，引荐为径，商路是人情往来的延伸 | 你是从农家走来的巨贾：力气为基，跑商为径，商路是勤劳致富的通道 |

**Assessment of entry layer:** ✅ **Well differentiated.** Entry expressions preserve origin identity. "手艺/合伙" vs "人脉/引荐" vs "力气/跑商" creates distinct first impressions of the magnate phase.

---

### 3.3 Pressure Layer (magnate_midlife_pressure)

Differentiation implemented in P64.

| Surface | Apprentice | Tavern Hand | Peasant |
|---------|-----------|-------------|---------|
| **currentGoal** | 合伙人与人情债，供货账期、销路分成拴住 | 人情面子债，老主顾期待、介绍欠情让巨贾负重 | 车马仓储债，运力、仓库、下属工钱让泥腿子不敢停歇 |
| **Pressure theme** | Partnership + craft market debts | Social + reputation debts | Physical + logistics debts |

**Assessment of pressure layer:** ⚠️ **Moderately differentiated at expression level, but structurally similar.** The wording is distinct and origin-appropriate, but:
- All three routes experience pressure at the same structural point (magnate_midlife_pressure)
- All three are described as "debts/burdens" of different flavors
- The pressure is expression-only — no mechanical difference in timing, severity, or resolution
- A player skimming text might perceive them as "same pressure, different words"

---

### 3.4 Payoff Layer (magnate_payoff)

Differentiation implemented in P64.

| Surface | Apprentice | Tavern Hand | Peasant |
|---------|-----------|-------------|---------|
| **currentGoal** | 商路掌控，供货销路尽在掌握，手艺人靠合伙信任 | 人脉通八方，老主顾遍布，酒肆人脉就是商路 | 车马仓储物流根基已成，泥腿子一步一步走出来的根基 |
| **Payoff theme** | Trade network mastery | Social capital value | Physical infrastructure |

**Assessment of payoff layer:** ⚠️ **Same pattern as pressure — expression-differentiated but structurally shared.** The payoff flavor matches each origin well, but:
- All three reach the same `merchant_magnate` gate
- All three are described as "success mastery" of different domains
- No mechanical difference in final status, wealth level, or ending
- The payoff sentence reads as "you succeeded as a [flavor] merchant" rather than "you succeeded in a [flavor] way"

---

## 4. Structural Sharedness Audit

### 4.1 What IS Shared (Same Underlying Structure)

| Layer | Shared Element | Player-Visible? |
|-------|---------------|-----------------|
| Gate architecture | Same `magnate_on_ramp` / `merchant_midlife_debt_milestone` gates, same conditions (bridge flag satisfies both) | Mostly invisible — player sees the event, not the gate |
| Event chain | Same P55 magnate spine events in same order | Visible as "same sequence of stages" |
| Timing | Same age progression (on-ramp → pressure → payoff) | Visible if player plays multiple routes |
| Final destination | All end at `merchant_magnate` mixed gate | Visible at ending |
| Mechanical pressure | No mechanical difference — pressure is narrative only | Partially visible — player reads text but may not notice absence of mechanical difference |
| Mechanical payoff | No mechanical difference — payoff is narrative only | Partially visible |

### 4.2 What IS Differentiated

| Layer | Differentiation Type | Player-Visible? |
|-------|---------------------|-----------------|
| Bridge narrative | Full content + expression | ✅ Very visible |
| Bridge mechanism | Different choice events | ✅ Visible |
| Entry expressions | P63 — currentGoal, costLabel, age40Identity | ✅ Visible |
| Pressure expressions | P64 — currentGoal | ✅ Visible if player reads carefully |
| Payoff expressions | P64 — currentGoal | ✅ Visible if player reads carefully |
| Origin identity | `detectOrdinaryOrigin()` preserved throughout | ✅ Visible in summary/memory surfaces |

---

## 5. Player Perception Assessment

### 5.1 Strongest Differentiation Layers
1. **Bridge crossing moment** — Each route has a unique "stepping onto the merchant path" feel
2. **Origin identity persistence** — Summary and memory surfaces reinforce "I came from X"
3. **Entry stage flavor** — First taste of magnate life is origin-appropriate

### 5.2 Thinnest Differentiation Layers
1. **Payoff shape** — All three feel like "you became a successful merchant with [origin] flavor" rather than "you succeeded in a distinctly different way"
2. **Pressure feel** — All three feel like "merchant burden of different kinds" rather than "different kinds of suffering that change the experience"
3. **Ending / recap** — No distinct ending sentence or destiny sentence per route; all converge to `merchant_magnate`

### 5.3 Risk of Structural Homogenization

Despite well-crafted expression differentiation, a player who plays all three routes might perceive:

> "Three different stories of how you get to be a merchant, but once you're there, it's the same merchant life with different words."

This is because:
- The structural skeleton (on-ramp → pressure → payoff) is identical
- The mechanical stakes are identical
- The final gate is identical
- Expression differentiation, while well-executed, is still skin-deep

---

## 6. Summary Table

| Layer | Apprentice Flavor | Tavern Flavor | Peasant Flavor | Differentiation Strength |
|-------|------------------|---------------|----------------|-------------------------|
| Bridge origin | Craft skill | Social network | Physical labor | ✅ Strong |
| Bridge event | Partnership | Referral | Grain trade | ✅ Strong |
| Entry goal | 手艺+合伙 | 人脉+引荐 | 力气+跑商 | ✅ Strong |
| Entry cost label | 手艺与合伙的担子 | 人脉与铺子的担子 | 粮路与买卖的担子 | ✅ Good |
| Pressure theme | Partnership/craft debts | Social/reputation debts | Physical/logistics debts | ⚠️ Moderate (expression only) |
| Payoff theme | Trade network mastery | Social capital value | Physical infrastructure | ⚠️ Moderate (expression only) |
| Final gate | `merchant_magnate` | `merchant_magnate` | `merchant_magnate` | ❌ None (shared) |
| Destiny sentence | None (generic) | None (generic) | None (generic) | ❌ None |

---

## 7. Audit Conclusion

The merchant trilogy package has **strong entry differentiation** (bridge + entry layer) but **thins out at pressure, payoff, and ending layers**. From a player experience perspective:

- **First half of the journey feels distinct** — "I became a merchant from X background" is clearly different across routes
- **Second half of the journey feels flavored but shared** — "I succeeded as a merchant with X flavor" rather than "I had a distinct kind of merchant success"
- **The ending lacks a distinct punchline** — no destiny sentence, no distinct ending identity beyond "merchant_magnate from X origin"

The differentiation is strongest where it's closest to the origin and weakest where it matters most for "what kind of life was this."

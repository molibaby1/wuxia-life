# P66 Success-Cost Signal Audit

> **Date:** 2026-06-28
> **Stage:** P66 Wuxia Merchant Trilogy Success-Cost Differentiation
> **Story:** P66-001 — Audit current success-cost signals
> **Type:** Audit — documentation only, no runtime changes

---

## 1. Executive Summary

This audit inventories the existing success-cost signals across the three merchant bridge routes (apprentice, tavern, peasant) and identifies where cost is described but not felt, where it is generic versus route-specific, and what the thinnest spots are for P66 to target.

**Core finding:** Cost differentiation exists at the expression layer (P63 + P64) but is **entry-heavy and payoff-thin**. The three routes have distinct cost labels and pressure flavor, but:

1. Cost is expression-only — no mechanical difference in how burden accumulates or resolves
2. Cost weakens as you move later (strong at bridge/entry → moderate at pressure → thin at payoff)
3. Payoff phase reads as "success + some flavor" rather than "success that came at a specific price"
4. No route-specific cost markers persist into the final identity / ending layer

---

## 2. Cost Signal Inventory by Route

### 2.1 Apprentice Route (town_apprentice → apprentice_merchant_bridge_crossed)

**Bridge layer (P58):**
- **Sacrifice signal:** Leaving craft mastery behind — "从学徒踏上了商路"
- **Trade-off:** Craft skill vs. business partnership
- **Memory:** "你与买卖人合伙经商，从学徒踏上了商路。"
- **Summary:** "学徒出身的商人：从铺子学徒到商路合伙，跨越了手艺与买卖的界限。"

**Entry layer (P63 — magnate_on_ramp):**
- **Current goal:** "手艺学透、合伙商路已通，正谋划更大的局面"
- **Cost label:** "手艺与合伙的担子"
- **Age-40 identity:** "手艺为基，合伙为径，商路是技能延伸的版图"

**Pressure layer (P64 — magnate_midlife_pressure):**
- **Current goal:** "商号遍九州，合伙人与人情债也遍九州，供货的账期、销路的分成拴住每一条线"
- **Distinctive keywords:** 合伙人, 供货, 账期, 销路, 分成

**Payoff layer (P64 — magnate_payoff):**
- **Current goal:** "商路已掌控，供货销路尽在掌握，手艺人的巨贾之位靠的是一身本事和合伙人的信任"
- **Distinctive keywords:** 供货, 销路, 手艺人, 合伙人, 信任

**What's missing at payoff:**
- No reflection that control was ceded to partners
- No "success but at the cost of craft independence" feeling
- No bookkeeping/accountability burden persisting into success
- Payoff reads as additive success, not tradeoff success

---

### 2.2 Tavern Route (tavern_hand → tavern_merchant_bridge_crossed)

**Bridge layer (P59):**
- **Sacrifice signal:** Leaving the familiar tavern network behind — "从跑堂伙计踏上了商路"
- **Trade-off:** Service stability vs. network-referred opportunity
- **Memory:** "你靠着酒肆积累的人脉进了城里的铺子，从跑堂伙计踏上了商路。"
- **Summary:** "酒肆出身的商人：从跑堂伙计到城里铺子，靠人脉铺出了商路。"

**Entry layer (P63 — magnate_on_ramp):**
- **Current goal:** "人脉已通、铺子已上手，正借助这些关系扩张"
- **Cost label:** "人脉与铺子的担子"
- **Age-40 identity:** "人脉为基，引荐为径，商路是人情往来的延伸"

**Pressure layer (P64 — magnate_midlife_pressure):**
- **Current goal:** "商号遍九州，人情面子债也遍九州，老主顾的期待、介绍的欠情让巨贾负重前行"
- **Distinctive keywords:** 人情, 面子, 老主顾, 欠情

**Payoff layer (P64 — magnate_payoff):**
- **Current goal:** "商号凭人脉通八方，老主顾遍布各行，酒肆出身的巨贾人脉就是商路"
- **Distinctive keywords:** 人脉, 老主顾, 八方

**What's missing at payoff:**
- No sense that network success created relationship debt
- No "you owe people favors" or "information distortion from being the middleman" feeling
- No backlash or isolation from network-based success
- Payoff reads as pure network win, not network-with-debt

---

### 2.3 Peasant Route (farm_peasant → peasant_merchant_bridge_crossed)

**Bridge layer (P61):**
- **Sacrifice signal:** Leaving the land behind — "从田间走到粮路上"
- **Trade-off:** Landed stability vs. labor-driven trade opportunity
- **Memory:** "你从田间走到粮路上，从帮工做起，渐渐摸通了粮货买卖。"
- **Summary:** "农家出身的粮货商人：从田埂到粮路，靠体力和勤恳踏出生意路。"

**Entry layer (P63 — magnate_on_ramp):**
- **Current goal:** "粮路跑通、买卖上手，正学着像商人一样思考"
- **Cost label:** "粮路与买卖的担子"
- **Age-40 identity:** "力气为基，跑商为径，商路是勤劳致富的通道"

**Pressure layer (P64 — magnate_midlife_pressure):**
- **Current goal:** "商号遍九州，车马仓储债也遍九州，运力、仓库、下属工钱让泥腿子巨贾不敢停歇"
- **Distinctive keywords:** 车马, 仓储, 运力, 仓库, 工钱, 泥腿子

**Payoff layer (P64 — magnate_payoff):**
- **Current goal:** "车马仓储物流根基已成，泥腿子熬出来的商路靠的是一步一步走出来的根基"
- **Distinctive keywords:** 车马, 仓储, 物流, 根基, 一步一步

**What's missing at payoff:**
- No sense that leaving the land was a real loss
- No cargo/timing bet payoff reflection (win-big or lose-big)
- No travel fatigue / wear-and-tear persisting into success
- "勤劳致富" is culturally generic — the most generic of the three payoffs

---

## 3. Cost Signal Strength by Layer

| Layer | Apprentice | Tavern | Peasant | Notes |
|-------|------------|--------|---------|-------|
| Bridge crossing | ✅ Strong | ✅ Strong | ✅ Strong | Distinct sacrifice narrative per route |
| Entry (on_ramp) | ✅ Strong | ✅ Strong | ✅ Strong | P63 — cost label + identity differentiated |
| Pressure | ⚠️ Moderate | ⚠️ Moderate | ⚠️ Moderate | P64 — flavor is distinct but structure is shared |
| Payoff | ⚠️ Moderate-weak | ⚠️ Moderate-weak | ❌ Weak | Peasant is thinnest — "勤劳致富" most generic |
| Final identity / ending | ❌ None | ❌ None | ❌ None | All converge to merchant_magnate |

---

## 4. Generic vs. Route-Specific Cost

### 4.1 What's Already Route-Specific

| Signal | Apprentice | Tavern | Peasant |
|--------|------------|--------|---------|
| Cost label | 手艺与合伙的担子 | 人脉与铺子的担子 | 粮路与买卖的担子 |
| Entry identity metaphor | 手艺为基，合伙为径 | 人脉为基，引荐为径 | 力气为基，跑商为径 |
| Pressure flavor | 合伙人/供货/账期/销路 | 人情/老主顾/面子/欠情 | 车马/仓储/运力/工钱 |
| Payoff flavor | 手艺人/合伙人/信任 | 人脉/老主顾/八方 | 车马/仓储/物流/根基 |

### 4.2 What's Still Generic

1. **Same structure, different words** — All three routes go on_ramp → pressure → payoff with identical timing and gate structure
2. **No mechanical cost difference** — Cost is expressed in text but doesn't change how the game plays
3. **No cost accumulation difference** — All three accumulate "debt" the same way
4. **Payoff reads as success+flavor** — Not "success that came at X price"
5. **No route-specific failure modes** — All fail the same way
6. **Ending convergence** — All three reach `merchant_magnate` with the same final gate
7. **No cost reflection in payoff** — The "what I gave up" doesn't echo in the "what I got"

---

## 5. Thinnest Spots (P66 Targets)

### 5.1 #1: Payoff-Phase Cost Reflection

The payoff phase currently reads as unmitigated success with flavor decoration. What's missing is the sense that success came at a cost — that the route-specific burden persists even at the top.

**Apprentice payoff gap:** No "partner control" tension. No "you succeeded but partners call the shots" feeling. No bookkeeping/accountability weight.

**Tavern payoff gap:** No "favor debt" tension. No "you succeeded but you owe everyone" feeling. No information distortion from being the network node.

**Peasant payoff gap:** No "left the land behind" regret or reflection. No "bet big and won (but could have lost)" feeling. No travel wear-and-tear.

### 5.2 #2: Cost Label Beyond On-Ramp

Cost labels are only differentiated at `magnate_on_ramp`. At pressure and payoff phases, the cost label collapses back to generic. The cost-specific label should persist through the journey.

### 5.3 #3: Age-40 Identity Cost Reflection

The age-40 identity currently emphasizes the success shape ("X为基，Y为径") but doesn't carry the cost forward. The identity should also hint at the price being paid.

---

## 6. What P66 Can Do (Within Bounded Scope)

P66 can strengthen cost differentiation **without new systems or events** by:

1. **Deepening payoff-phase expressions** to reflect route-specific costs in success
2. **Extending cost-label differentiation** beyond on_ramp into pressure and payoff phases
3. **Adding cost reflection to age-40 identity** — make the identity mention the price, not just the path
4. **Adding route-specific cost markers** (flags) that persist through the journey so expressions can reference them
5. **Strengthening life-memory cost signals** at payoff phase

---

## 7. What P66 Should NOT Do

To stay in bounded scope:

- ❌ No new events or event chains
- ❌ No new systems (economy, map, relationship)
- ❌ No structural change to the magnate skeleton
- ❌ No new routes or bridges
- ❌ No full merchant content wave
- ❌ No success-shape structural differentiation (that's for later)

---

## 8. Validation of Audit Accuracy

This audit is grounded in the actual codebase:

| Source File | What It Confirms |
|-------------|-----------------|
| `src/p56/ordinaryOriginExpression.ts` | Bridge-layer memory, summary, and current-goal differentiation |
| `src/p50/sampleLineExpression.ts` | Entry, pressure, and payoff expression differentiation (P63 + P64) |
| `tests/p58ApprenticeBridgeTests.ts` | Apprentice bridge flag chain and expression coverage |
| `tests/p59TavernHandBridgeTests.ts` | Tavern bridge flag chain and expression coverage |
| `tests/p61FarmPeasantBridgeTests.ts` | Peasant bridge flag chain and expression coverage |
| `tests/p50SampleLineExpressionTests.ts` | P63 entry + P64 pressure/payoff test coverage |

---

## 9. Conclusion

The merchant trilogy has **strong entry cost differentiation** that thins out by payoff. P66's opportunity is to make the cost **persist and echo** through the later stages — especially at payoff — so that success feels earned differently, not just decorated differently.

The highest-leverage targets, in order:
1. **Payoff-phase cost reflection** — make success read as "won at a price" not just "won with flavor"
2. **Cost label extension** — keep the route-specific cost label visible through pressure and payoff
3. **Age-40 identity cost weight** — add the price to the identity statement

All three can be done within the existing expression/marker framework — no new systems needed.

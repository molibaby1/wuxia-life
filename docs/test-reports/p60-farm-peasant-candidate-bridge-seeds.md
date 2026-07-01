# P60 Farm-Peasant Candidate Bridge Seeds

> **Date:** 2026-06-28
> **Stage:** P60 design-first wave for `farm_peasant` bridge
> **Purpose:** Define at least two candidate bridge-seed directions for `farm_peasant`, bind each to existing repo assets, compare them across narrative fit / system fit / scope cost, and recommend one primary direction.

## 1. Candidate Overview

Two candidate bridge directions are evaluated:

| # | Direction | Downstream Target | Core Hook |
|---|-----------|-------------------|-----------|
| A | **Grain-Merchant Adjacent** | `merchant_magnate` (mixed) via P55 magnate chain | Swap-crew labor → grain/commodity trade → small-scale merchant |
| B | **Escort-Jianghu Renown** | `jianghu_renown_sage` (mixed) | Farm endurance → caravan guard/escort → jianghu connections |

Both candidates anchor in the existing `peasant_swap_crew_curiosity` flag (from `ordinary_peasant_plow_fork` childhood choice) and the `peasant_accept_outside` midlife choice — but they branch into different downstream systems.

---

## 2. Candidate A: Grain-Merchant Adjacent

### 2.1 Narrative Description

A peasant who follows the swap-crew path learns about grain and commodity markets through seasonal labor migration. When the "outside offer" comes at age 30, instead of a vague "去镇上试试," the offer is specifically about helping a grain merchant move harvest goods — and from there, the peasant gradually moves into small-scale grain trade.

**Key narrative beats:**
- Childhood: Follows swap crew to neighboring villages → sees how grain prices vary by place
- Early adulthood: Continues seasonal labor → builds endurance and knowledge of rural markets
- Midlife 30: Grain merchant offers a position as a cargo handler → accepts
- Post-bridge: Learns the grain trade from the ground up → moves into small-scale trading → enters the magnate chain

### 2.2 Existing Repo Asset Bindings

| Asset | Role in Candidate A |
|-------|---------------------|
| `peasant_swap_crew_curiosity` (early-life flag) | Seed: establishes exposure to life outside the village and seasonal migration |
| `peasant_accept_outside` (midlife flag) | Bridge trigger: the moment the peasant decides to leave the village |
| `ordinary_peasant_midlife_outside_offer` (midlife event) | Bridge checkpoint carrier: the event where the choice is made |
| `seasonal` event bias tag (profile surface) | Reinforces the seasonal-labor framing of the origin |
| `labor` event bias tag (profile surface) | Reinforces the physical-labor foundation |
| `route_wealth_committed` (merchant-route gate flag) | Downstream: connects to `merchant_magnate` mixed destiny gate |
| P55 `magnate_on_ramp` spine event | Downstream: the entry point into the magnate chain |
| P58 `apprentice_merchant_bridge_crossed` pattern | Precedent: bridge flag satisfies both route + milestone conditions |

### 2.3 Narrative Fit Assessment

**Strengths:**
- Swap-crew → grain trade is a natural progression for a peasant
- Physical labor foundation matches the peasant profile's `labor` bias and high endurance
- Seasonal pattern matches the peasant profile's `seasonal` bias
- Grain trade is grounded in rural reality — not a random leap into commerce

**Weaknesses:**
- Could feel similar to apprentice/tavern_hand bridges (all three → merchant)
- Risk of "all ordinary origins just become merchants" flattening
- Need to distinguish peasant-merchant from apprentice-merchant and tavern-merchant

**Differentiation strategy:**
- Apprentice = craft → trade (skill-based, urban)
- Tavern_hand = service → network → referral (people-based, urban)
- **Peasant = labor → grain/commodity trade (physical + rural-based)**

The peasant enters trade through *physical labor on goods*, not through craft skill or social networks. This is a distinct entry point.

### 2.4 System Fit Assessment

**Strengths:**
- P55 magnate chain is complete and tested
- P58/P59 bridge pattern is proven: single bridge flag satisfies both `magnate_on_ramp` conditions
- `route_wealth_committed` already feeds into `merchant_magnate` mixed gate
- Expression surfaces (currentGoal, lifeMemory, summary) already have peasant branches — just need bridge extensions
- Minimal new framework needed

**Weaknesses:**
- Need to reframe the "outside offer" from generic to grain-trade-specific
- Need a new seed flag for the grain-trade angle
- Gate expressions need one more bridge flag (like `peasant_merchant_bridge_crossed`)

**Fit rating: High** — the merchant-adjacent path has the most mature infrastructure and the lowest implementation risk.

### 2.5 Scope Cost Assessment

| Component | Effort | Notes |
|-----------|--------|-------|
| Reframe midlife outside-offer event | Low | Change text from generic "去镇上试试" to grain-trade-specific |
| Add bridge flags to the accept option | Very low | 2 flags: `route_wealth_committed` + `peasant_merchant_bridge_crossed` |
| Expand `magnate_on_ramp` gate expression | Very low | Add `peasant_merchant_bridge_crossed` to both conditions |
| Expand `merchant_midlife_debt_milestone` gate | Very low | Same pattern as `magnate_on_ramp` |
| Add peasant bridge expression branches | Low | 3 surfaces × bridge branch (currentGoal, lifeMemory, summary) |
| Targeted proof artifact | Low | Follow P58/P59 pattern |
| Narrow regression tests | Medium | ~12–15 assertions |

**Total scope: Small** — comparable to P58 apprentice bridge, maybe slightly more due to the text reframing.

---

## 3. Candidate B: Escort-Jianghu Renown

### 3.1 Narrative Description

A peasant with strong endurance from farm work takes a job as a caravan guard/escort when leaving the village. Through escort work, they meet jianghu people, build a reputation for reliability, and gradually enter the jianghu-renown path — not through martial arts mastery, but through reliability, loyalty, and connections built on the road.

**Key narrative beats:**
- Childhood: Farm work builds strength and endurance
- Swap-crew: Travels with seasonal labor crews → gets to know roads and travelers
- Midlife 30: Caravan guard offer → accepts, using physical strength for protection
- Post-bridge: Builds reputation as a reliable escort → meets jianghu figures → enters renown path

### 3.2 Existing Repo Asset Bindings

| Asset | Role in Candidate B |
|-------|---------------------|
| `peasant_swap_crew_curiosity` (early-life flag) | Seed: establishes travel experience and endurance |
| `peasant_accept_outside` (midlife flag) | Bridge trigger: the moment the peasant decides to leave |
| `ordinary_peasant_midlife_outside_offer` (midlife event) | Bridge checkpoint carrier |
| `labor` event bias tag (profile surface) | Reinforces physical labor → physical protection continuity |
| `endurance` shaping tendency (+0.16) | Profile-level reinforcement of physical stamina |
| `jianghu_renown_sage` (mixed destiny outcome) | Downstream target in profile surfaces |
| `mentor_bond` / `ally_network` (required flags for renown) | Gate flags that would need a new seed path |

### 3.3 Narrative Fit Assessment

**Strengths:**
- Physical labor → escort/guard is a very natural skill transfer
- Distinct from apprentice/tavern_hand merchant bridges — adds variety
- "Reliable peasant becomes respected escort" has strong narrative appeal
- Preserves peasant identity better than merchant path (stays labor/people focused)

**Weaknesses:**
- `jianghu_renown_sage` requires skill_growth ≥ 45 — peasant origin has no martial training seed
- Would need to add martial skill development along the escort path, which could feel forced
- The "renown sage" label implies seniority and wisdom — escort work alone may not get there
- No existing jianghu event chain for ordinary origins to plug into

**Fit rating: Medium-High on narrative, Low on system** — the story works, but the system support isn't there.

### 3.4 System Fit Assessment

**Strengths:**
- Narrative differentiation from merchant-only bridges
- Uses the `jianghu_renown_sage` mixed destiny that currently has no ordinary-origin entry

**Weaknesses:**
- **No sample-line spine for jianghu_renown** — `jianghu_renown_sage` exists only in profile surfaces, not as a playable event chain
- No existing escort/guard events in the repo — would need to invent a new event chain
- `jianghu_renown_sage` requires `skill_growth ≥ 45` — peasant has zero martial training infrastructure
- No proven bridge pattern for renown-adjacent paths (unlike merchant-adjacent which has P58/P59)
- Would need to define: what does the "renown" progression look like for an escort? How do you get from "caravan guard" to "jianghu renown sage"?

**Fit rating: Low** — this direction would require building a new downstream event chain, not just a bridge. The scope is much larger than a bounded bridge.

### 3.5 Scope Cost Assessment

| Component | Effort | Notes |
|-----------|--------|-------|
| Reframe outside-offer as escort opportunity | Low | Text change |
| Add bridge flags | Low | New `peasant_escort_bridge_crossed` + `ally_network` or `mentor_bond` |
| Build jianghu-renown event chain | **High** | No existing spine — need to design and implement from scratch |
- Define escort skill progression | **Medium-High** | How does a peasant gain skill_growth? Through escort work? |
| Add expression for renown path | Medium | New branches on existing surfaces |
| Define success criteria | Medium | What does "crossed the bridge to renown" even mean? |
| Tests and proof | Medium-High | New patterns, no precedent |

**Total scope: Large** — this is not a bridge project, it's a "build a new mixed-destiny event chain" project.

---

## 4. Comparison Matrix

| Dimension | Candidate A: Grain-Merchant | Candidate B: Escort-Jianghu |
|-----------|----------------------------|----------------------------|
| **Narrative fit** | Good (labor → grain trade) | Very Good (labor → escort) |
| **Identity differentiation** | Medium (3rd merchant bridge) | High (first renown bridge) |
| **System fit** | Very High (magnate chain + P58/P59 pattern) | Low (no renown event chain) |
| **Existing asset reuse** | High (magnate chain, gate pattern, expression surfaces) | Low (only profile surface exists) |
| **Implementation scope** | Small (bridge only) | Large (bridge + new event chain) |
| **Risk of scope creep** | Low (well-bounded by existing pattern) | High (renown chain undefined) |
| **Boundedness** | Highly bounded (proven pattern) | Unbounded (needs new system) |
| **PRD alignment** | Aligned (one bridge, minimal scope) | Misaligned (would need new system) |

---

## 5. Recommendation

**Primary recommended direction: Candidate A — Grain-Merchant Adjacent**

### Rationale

1. **Bounded scope:** Candidate A is a true "bridge" project — it connects existing assets to an existing downstream chain. Candidate B would require building an entirely new renown event chain, which is out of scope for a single bridge stage.

2. **Proven pattern:** The merchant-adjacent bridge pattern has been validated twice (P58 apprentice, P59 tavern_hand). We know it works, we know the gate expression pattern, we know how to do targeted proof.

3. **Narrative differentiation is still possible:** Even though it's the third merchant-adjacent bridge, the peasant entry point is meaningfully different:
   - Apprentice: skill → trade
   - Tavern_hand: network → referral → trade
   - **Peasant: physical labor → grain/commodity trade**

4. **System maturity:** The P55 magnate chain is complete and tested. Adding a third bridge entrance is low-risk and low-cost.

5. **Jianghu renown can be deferred:** Candidate B is a good *idea*, but it needs its own design and implementation stage — it shouldn't be squeezed into a "bridge design" stage when the downstream infrastructure doesn't exist yet.

### Why Not "Hard-Wire Merchant Magnate" Directly?

This is a critical distinction. We are NOT just slapping `route_wealth_committed` on `peasant_accept_outside` and calling it a day. Instead:

1. **The outside offer needs reframing:** From generic "去镇上试试" to grain-trade-specific (e.g., "粮商找帮工，管吃住还能学做生意")
2. **A peasant-specific bridge flag:** `peasant_merchant_bridge_crossed` (like apprentice and tavern_hand have their own), not just generic `route_wealth_committed`
3. **Peasant-flavored expression:** Bridge text should read as "农家出身的粮货商人" or "从田埂到粮路" — not generic merchant text
4. **Identity preservation:** The peasant origin flag stays, and the expression reads as "peasant background + merchant ascent," not "became a generic merchant"

This is the same disciplined approach used for P58 and P59 — each ordinary origin has its own bridge flag, its own narrative framing, and its own expression text, even though they all feed into the same magnate chain downstream.

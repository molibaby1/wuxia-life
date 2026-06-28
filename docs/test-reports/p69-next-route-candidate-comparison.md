# P69 Next-Route Candidate Comparison

> **Date:** 2026-06-29
> **Stage:** P69 Wuxia Next Route Candidate Reconciliation
> **Purpose:** Side-by-side comparison of `jianghu_renown_sage` vs `merchant_martial_patron` across evidence strength, methodology fit, and implementation risk.

---

## Part 1: Evidence Strength Comparison (P69-003)

### 1.1 Overview

This section compares the **repo-grounded evidence strength** for each candidate route. The question is: how much existing code, config, tests, and proof do we already have for each route — especially from ordinary origins?

Evidence is rated on a four-tier scale:
- **Strong** — Multiple independent proofs, runtime-verified, regression-tested
- **Moderate** — At least one runtime proof, some test coverage
- **Weak** — Fixture-level only, or theoretical without runtime verification
- **Absent** — No repo evidence at all

### 1.2 Evidence Dimension Breakdown

| Evidence Dimension | `jianghu_renown_sage` | `merchant_martial_patron` | Edge to |
|-------------------|----------------------|--------------------------|---------|
| **Wiring evidence (ordinary origin)** | ✅ **Strong** — P25 explicitly maps tavern_hand → renown via ally_network; baseline fixture in `ordinarySimulationBaselines.ts` | ❌ **Absent** — Zero ordinary-origin wiring; only merchant_house (vivid) has a trace | **renown** |
| **Short-chain / event-driven proof** | ✅ **Strong** — P32-003 renown short-chain: event-driven unlock via `p28_social_reputation_reinforcement` → `ally_network` → composite eval; runtime-verified | ❌ **Absent** — No short-chain proof exists for merchant_martial_patron | **renown** |
| **Runtime parity tests** | ✅ **Strong** — P32 runtime parity tests cover renown bridge at threshold | ⚠️ **Moderate** — P25 mixed identity slice verifies composite identity, but no bridge parity tests | **renown** |
| **Lifetime trace** | ⚠️ **Moderate** — P34 habit-led e2e covers renown baseline, but from habit-led sim not from ordinary origins | ✅ **Strong** — P37 full lifetime trace (age 0→68) from merchant_house origin | **patron** |
| **Mixed identity verification** | N/A (mainstream, not mixed) | ✅ **Strong** — P25 mixed identity slice: PASS for merchant_martial_patron | **patron (but apples-to-oranges)** |
| **Closure report coverage** | ✅ **Strong** — P30, P31, P32, P34 closures all include renown | ✅ **Strong** — P35, P36, P37 closures include merchant_martial_patron | **Tie** |
| **Playable bridge (ordinary→outcome)** | ❌ **Absent** — No "cross the bridge" event chain from any ordinary origin; P25 fixture is seeded not event-driven | ❌ **Absent** — No playable bridge from any ordinary origin | **Tie (both absent)** |
| **Sample-line spine** | ❌ **Absent** — No P55-style on_ramp/pressure/payoff spine | ❌ **Absent** — No sample-line spine | **Tie (both absent)** |
| **Existing differentiation work** | ❌ **Absent** — Zero entry/cost/shape differentiation | ❌ **Absent** — Zero entry/cost/shape differentiation | **Tie (both absent)** |

### 1.3 Prerequisites for a Playable Bridge

A playable bridge (like P58 apprentice→merchant) requires at minimum:

| Prerequisite | `jianghu_renown_sage` | `merchant_martial_patron` |
|-------------|----------------------|--------------------------|
| **Outcome gate exists** | ✅ Yes — `wuxiaOriginSurfaces.ts` | ✅ Yes — `wuxiaOriginSurfaces.ts` |
| **Ordinary origin with plausible seed** | ✅ Yes — tavern_hand has `ally_network` from childhood | ⚠️ Partial — apprentice has merchant route but no martial seed; no origin has both |
| **Midlife growth signals** | ✅ Yes — P56 added midlife depth for all three ordinary origins | ✅ Yes — P56 midlife exists, but not targeted at merchant+martial dual track |
| **Pre-bridge flag chain** | ✅ Yes — tavern_hand: `tavern_guest_network` → `tavern_embrace_network` → `ally_network` | ❌ No — no ordinary origin has both merchant+martial flag chain |
| **Post-bridge downstream content** | ❌ No — no sample-line spine or progression for renown | ❌ No — no sample-line spine or progression for patron |
| **Expression framework** | ✅ Yes — `ordinaryOriginExpression.ts` pattern is proven | ✅ Yes — same pattern can be reused |

**Verdict on playable-bridge prerequisites:** `jianghu_renown_sage` is closer. It has a clear ordinary-origin seed (tavern_hand → ally_network) that only needs a "bridge crossing" event to convert it from fixture-level to playable. `merchant_martial_patron` has no ordinary-origin dual seed at all — the merchant track is easy but the martial track from ordinary origins is very weak.

### 1.4 Implementation Foundation vs Idea-Level Potential

| Category | `jianghu_renown_sage` | `merchant_martial_patron` |
|----------|----------------------|--------------------------|
| **Implementation foundation** | **Higher** | **Lower** |
| What's already built | P25 wiring + P32 short-chain + P34 baseline + tavern_hand seed | P25 mixed identity + P37 vivid-origin trace + no ordinary bridge |
| What needs to be built from scratch | Bridge crossing event + sample-line spine + differentiation | Ordinary-origin martial seed + bridge + sample-line spine + differentiation |
| Confidence in feasibility | High — pattern proven in P32 | Medium — proven for vivid, unproven for ordinary |
| **Idea-level potential** | **Medium** | **Higher** |
| Differentiation surface area | Medium (single-track mainstream) | High (dual-track mixed) |
| Long-term value | Moderate — mainstream tier is less explored | Higher — mixed tier with dual track has more combinations |
| Novelty | Lower — renown is a known pattern | Higher — patron combines two tracks in new way |

**Key insight:** `jianghu_renown_sage` has a **stronger foundation but lower ceiling**, while `merchant_martial_patron` has a **weaker foundation but higher ceiling**. The quality-first approach prioritizes foundation over ceiling.

### 1.5 Evidence Strength Summary

**Overall evidence strength: `jianghu_renown_sage` > `merchant_martial_patron`**

- `jianghu_renown_sage`: **Strong evidence foundation** — P25 wiring, P32 short-chain proof, P34 baseline, tavern_hand ordinary-origin seed. The gap is primarily "no playable bridge" and "no sample-line spine."
- `merchant_martial_patron`: **Weak-to-moderate evidence foundation** — P25 mixed identity proof, P37 vivid-origin lifetime trace, but zero ordinary-origin bridge evidence. The gap includes "no ordinary-origin seed at all" plus all the same gaps as renown.

Evidence strength edge: **jianghu_renown_sage** by a clear margin.

---

## Part 2: Methodology Fit Comparison (P69-004)

### 2.1 Overview

This section compares how well each candidate fits the **merchant trilogy optimization methodology** (bridges → entry → flavor → cost → shape+recap) that was proven in P58–P68.

The question is: if we try to apply the exact same five-stage sequence to this candidate, how well does it fit? Where would we need to force it, and where would scope drift occur?

### 2.2 The Merchant Trilogy Methodology (Recap)

From P68 closure report §5.2:

| # | Stage | Purpose | Can Skip? |
|---|-------|---------|-----------|
| 1 | **Bridges** | Get distinct paths to the same destination | ❌ No — foundation |
| 2 | **Entry differentiation** | Make the entrance feel different | ❌ No — critical first impression |
| 3 | **Pressure/payoff flavor** | Add route-specific wording to middle and end | ⚠️ Can be light, but don't skip entirely |
| 4 | **Cost differentiation** | Make success feel earned differently | ❌ No — key layer that gives weight |
| 5 | **Success-shape + recap** | Make success feel different in shape; add destiny sentence | ❌ No — the punchline |

### 2.3 Fit by Methodology Stage

| Stage | `jianghu_renown_sage` Fit | `merchant_martial_patron` Fit | Edge to |
|-------|---------------------------|-------------------------------|---------|
| **1. Bridges** | ⚠️ **Medium fit** — Single-track bridge (ally_network or mentor_bond); simpler than merchant trilogy's multi-origin bridges. Pattern is proven but less complex. | ⚠️ **Medium fit** — Dual-seed bridge (merchant + martial) is more complex than merchant trilogy's single-seed bridges. Could require two bridge events, not one. | **Tie — different kinds of mismatch** |
| **2. Entry differentiation** | ⚠️ **Medium fit** — Entry differentiation works but with less surface area (single track vs dual track). Origin-flavored entry is still meaningful but has fewer dimensions. | ✅ **Good fit** — Dual-track entry has more surface area for differentiation. Each origin's merchant+martial mix can feel different. | **patron** |
| **3. Pressure/payoff flavor** | ⚠️ **Medium fit** — Mainstream tier has a different shape than mixed; pressure/payoff pattern may need adaptation. | ✅ **Good fit** — Mixed tier matches merchant_magnate's tier type; pressure/payoff pattern transfers more directly. | **patron** |
| **4. Cost differentiation** | ⚠️ **Medium fit** — Single-track cost is less multi-dimensional. Cost of renown is primarily reputation/social, which has fewer angles than dual-track. | ✅ **Good fit** — Dual-track cost has more dimensions: business cost + martial cost + balance cost. Each route can pay a different kind of dual cost. | **patron** |
| **5. Success-shape + recap** | ⚠️ **Medium fit** — Success shape is less distinct for single-track. Destiny sentence pattern works but with less contrast between routes. | ✅ **Good fit** — Dual-track success has more shape variety. "从X到Y" structure maps well to dual-track ascension. Destiny sentence has more material to work with. | **patron** |

### 2.4 Type Match Analysis

| Aspect | Merchant Trilogy (`merchant_magnate`) | `jianghu_renown_sage` | `merchant_martial_patron` |
|--------|-------------------------------------|----------------------|--------------------------|
| **Tier** | mixed | mainstream | mixed |
| **Track count** | mixed but effectively single primary (merchant) | single (martial/reputation) | dual (merchant + martial) |
| **Origin→destination arc** | ordinary → mixed (upward + type shift) | ordinary → mainstream (upward, same type family) | ordinary → mixed (upward + type shift) |
| **Bridge type** | Single-seed (trade curiosity / network / grain) | Single-seed (ally_network or mentor_bond) | Dual-seed (merchant + martial) |

**Key observation:** `merchant_martial_patron` matches the tier type (mixed) and the upward+type-shift arc pattern of the merchant trilogy. `jianghu_renown_sage` is mainstream tier, which is a different category — the methodology may need adaptation for a tier that's not "mixed."

### 2.5 Scope Drift Risk

Which candidate, if forced into the merchant trilogy pattern too early, would create the most scope drift?

| Risk | `jianghu_renown_sage` | `merchant_martial_patron` |
|------|----------------------|--------------------------|
| **Bridge scope drift** | **Low** — Single-seed bridge is simpler than merchant trilogy; scope risk is underestimation not overexpansion | **High** — Dual-seed bridge could easily expand: "while we're adding martial seed, let's also add more martial content for ordinary origins" |
| **Tier adaptation drift** | **Medium** — Mainstream tier may require adapting the cost/shape stages to fit a different outcome structure; could lead to "while we're at it, let's redesign the mainstream tier" | **Low** — Mixed tier is the same tier type as merchant_magnate; less adaptation needed |
| **Content expansion drift** | **Low** — Single-track has less content surface area to fill | **High** — Dual-track means more content to write, more combinations to test; could easily expand beyond a single stage |
| **Systemic change drift** | **Low** — No new systems needed; pattern is proven | **Medium** — Dual-track bridge may require new flag-combination patterns |

**Overall scope drift risk: `merchant_martial_patron` > `jianghu_renown_sage`**

`merchant_martial_patron` has higher scope drift risk because:
1. Dual-seed bridge = more moving parts = more opportunities for expansion
2. Dual-track = more content surface area = easier to say "just one more thing"
3. Ordinary-origin martial content is thin = temptation to "fill in while we're there"

`jianghu_renown_sage` has lower scope drift risk because it's a simpler, single-track pattern with fewer dimensions to expand.

### 2.6 Methodology Fit Summary

**Pure fit (how well does the pattern transfer): `merchant_martial_patron` > `jianghu_renown_sage`**

`merchant_martial_patron` fits the methodology better in terms of **type match** (mixed tier, dual-track, same upward+type-shift arc) and has more **differentiation surface area** across all five stages.

**Fit considering scope drift risk: `jianghu_renown_sage` > `merchant_martial_patron`**

`jianghu_renown_sage` has lower scope drift risk because it's simpler and has fewer opportunities for expansion. It may not fit as well *theoretically*, but it's less likely to blow up in practice.

**Net methodology fit assessment: Mixed**

- If you prioritize "the pattern fits perfectly": edge to **patron**
- If you prioritize "less likely to drift beyond scope": edge to **renown**
- The quality-first approach prioritizes bounded scope and low risk → slight edge to **renown** on net

---

## Part 3: Implementation Risk Comparison (P69-005)

### 3.1 Overview

This section compares the **bounded implementation risk** for each candidate. The question is: if we decide to build this route, how risky is it? Can we do it in small, single-iteration steps? What could go wrong?

Risk is assessed across three cost dimensions:
1. **Bridge cost** — How hard is it to build the bridge from ordinary origin to outcome?
2. **Expression cost** — How hard is it to add the differentiation expression layers?
3. **Validation cost** — How hard is it to test and verify that it works?

### 3.2 Bridge Cost Comparison

| Cost Factor | `jianghu_renown_sage` | `merchant_martial_patron` | Edge to |
|------------|----------------------|--------------------------|---------|
| **Seed events needed** | 1 (bridge-crossing event from existing seed) | 2+ (martial seed event + bridge-crossing event) | **renown** |
| **New flags needed** | 1–2 (bridge_crossed + route_committed equivalent) | 3–4 (martial_seed + dual_bridge_crossed + merchant_committed + martial_committed) | **renown** |
| **Config changes** | Low — add 1 event, modify gate expressions | Medium-high — add 2+ events, possibly new midlife martial events, modify gate expressions | **renown** |
| **Narrative plausibility** | High — tavern_hand network → renown is natural | Medium — ordinary origin → merchant+martial dual track requires more narrative setup | **renown** |
| **Ordinary-origin foundation** | Strong — tavern_hand already has ally_network | Weak — no ordinary origin has both merchant + martial seeds | **renown** |
| **Reusable patterns** | High — P32 short-chain + P58/59/61 bridge pattern | Medium — merchant track pattern reusable, but martial track from ordinary is new | **renown** |

**Bridge cost verdict:** `jianghu_renown_sage` is **substantially cheaper** to bridge. It has an existing seed (tavern_hand → ally_network) that only needs a bridge-crossing event. `merchant_martial_patron` needs to first build a martial seed for ordinary origins, then build the dual bridge — two problems, not one.

### 3.3 Expression Cost Comparison

| Cost Factor | `jianghu_renown_sage` | `merchant_martial_patron` | Edge to |
|------------|----------------------|--------------------------|---------|
| **Entry differentiation** | Medium — single-track entry has fewer dimensions | High — dual-track entry has more combinations and dimensions | **renown** |
| **Cost differentiation** | Medium — single-track cost is simpler but has fewer angles | High — dual-track cost needs both track costs + balance cost | **renown** |
| **Success-shape differentiation** | Medium — single-track shape is less complex | High — dual-track shape has more variety but more to write | **renown** |
| **Expression surfaces** | 3–4 (currentGoal, lifeMemory, summary, maybe destiny sentence) | 4–5 (same + maybe dual-track balance indicator) | **renown** |
| **Per-origin variants** | 2–3 (tavern_hand + maybe farm_peasant) | 2–3 (same origins, but each needs dual-track expression) | **renown** |
| **Reusable patterns** | High — `ordinaryOriginExpression.ts` pattern proven | Medium-high — same structure but dual-track adds complexity | **renown** |

**Expression cost verdict:** `jianghu_renown_sage` is **cheaper** for expression work. Single-track means fewer dimensions to differentiate, fewer variants, less text to write. `merchant_martial_patron` has more surface area, which means more differentiation potential but also more work.

### 3.4 Validation Cost Comparison

| Cost Factor | `jianghu_renown_sage` | `merchant_martial_patron` | Edge to |
|------------|----------------------|--------------------------|---------|
| **Bridge tests** | Low — single bridge path, similar to P58/59/61 pattern | Medium-high — dual bridge paths, more combinations to test | **renown** |
| **Expression tests** | Low-medium — single-track expression tests | Medium — dual-track expression has more branches | **renown** |
| **Targeted proof** | Low-medium — follow P32 short-chain + P61 targeted proof pattern | Medium — need to prove both tracks + composite outcome | **renown** |
| **Regression risk** | Low — simpler system, fewer moving parts | Medium — dual-track interaction, more edge cases | **renown** |
| **Playable validation** | Medium — need sample-line spine first, same as both | Medium — same spine requirement | **Tie** |
| **Existing test infrastructure** | High — P32 parity tests, P25 baseline tests | Medium — P25 mixed identity tests, but no bridge tests | **renown** |

**Validation cost verdict:** `jianghu_renown_sage` is **cheaper** to validate. Single-track = fewer test cases = less complexity = lower regression risk. `merchant_martial_patron` has dual-track interactions that create more edge cases and require more test coverage.

### 3.5 Small-Step Iterability

Can this route be built in small, single-iteration steps? Or does it require a big-bang implementation?

| Criterion | `jianghu_renown_sage` | `merchant_martial_patron` |
|-----------|----------------------|--------------------------|
| **Bridge can be Stage 1 alone** | ✅ Yes — single bridge event is self-contained | ❌ Partially — need martial seed first, then bridge; two stages minimum before outcome is reachable |
| **Entry differentiation standalone** | ✅ Yes — can add entry flavor without full cost/shape | ✅ Yes — same pattern |
| **Cost/shape incremental** | ✅ Yes — each layer builds on previous | ✅ Yes — same pattern |
| **Minimum playable slice size** | Small — bridge + basic entry is already playable | Larger — need martial seed + bridge + basic dual-track entry |
| **Number of stages to playable** | 2–3 stages (bridge + entry + basic spine) | 3–4 stages (martial seed + bridge + entry + basic spine) |

**Small-step iterability verdict:** `jianghu_renown_sage` better fits the "small-step, single-iteration" standard. You can build the bridge, see it work, then add layers. `merchant_martial_patron` requires more upfront work (martial seed) before the bridge even makes sense.

### 3.6 No-Go Conditions

Under what conditions would each candidate be a no-go?

| No-Go Condition | Trigger for `jianghu_renown_sage` | Trigger for `merchant_martial_patron` |
|-----------------|----------------------------------|--------------------------------------|
| **No ordinary-origin seed** | N/A — already has tavern_hand seed | **Current state is close** — no ordinary origin has both merchant + martial seeds; if no plausible seed can be found, it's no-go |
| **Bridge is technically infeasible** | Unlikely — pattern proven in P32 | Possible — if dual-seed bridge requires systemic changes beyond config |
| **Narrative doesn't land** | Low risk — tavern network → renown is intuitive | Medium risk — ordinary → merchant+martial requires more narrative work to feel earned |
| **Scope too large for one replication cycle** | Low risk — smaller scope | **High risk** — dual track + martial seed + bridge = bigger scope |
| **No downstream content** | Same for both — neither has sample-line spine | Same for both — neither has sample-line spine |

**No-go likelihood:** `merchant_martial_patron` has higher no-go risk. The biggest risk is that no plausible ordinary-origin dual-seed exists, or that building one requires too much scope expansion. `jianghu_renown_sage`'s no-go risk is low because the seed already exists — the main question is whether it's *worth* building, not whether it's *possible*.

### 3.7 Implementation Risk Summary

**Overall implementation risk: `jianghu_renown_sage` < `merchant_martial_patron` (lower is better)**

`jianghu_renown_sage` is lower risk across all three cost dimensions:
- **Bridge cost:** Lower — existing seed, single bridge event
- **Expression cost:** Lower — single-track, fewer dimensions
- **Validation cost:** Lower — fewer test cases, less regression risk

`jianghu_renown_sage` also better fits the small-step iteration standard and has lower no-go likelihood.

Implementation risk edge: **jianghu_renown_sage** by a clear margin.

---

## Part 4: Combined Comparison Matrix (P69-003/004/005 Synthesis)

| Dimension | `jianghu_renown_sage` | `merchant_martial_patron` | Edge to |
|-----------|----------------------|--------------------------|---------|
| **Evidence strength** | Strong foundation (P25 wiring + P32 short-chain + tavern_hand seed) | Weak foundation (P25 mixed identity + P37 vivid trace + no ordinary bridge) | **renown** |
| **Playable-bridge prerequisites** | Closer — needs bridge crossing event + spine | Farther — needs martial seed + bridge + spine | **renown** |
| **Methodology type fit** | Medium (mainstream vs mixed) | Good (same mixed tier) | **patron** |
| **Scope drift risk** | Lower (simpler, single-track) | Higher (dual-track, more surface area) | **renown** |
| **Net methodology fit** | Slight edge (quality-first prioritizes low drift) | Better pure fit but higher drift risk | **renown (slight)** |
| **Bridge cost** | Lower (single seed, existing foundation) | Higher (needs martial seed + dual bridge) | **renown** |
| **Expression cost** | Lower (single-track, fewer dimensions) | Higher (dual-track, more combinations) | **renown** |
| **Validation cost** | Lower (fewer test cases, less regression) | Higher (dual-track interactions, more edge cases) | **renown** |
| **Small-step iterability** | Better — 2–3 stages to playable | Worse — 3–4 stages to playable | **renown** |
| **No-go likelihood** | Low (seed exists, pattern proven) | Higher (no ordinary dual seed, more scope) | **renown** |
| **Differentiation potential** | Medium (single-track) | High (dual-track, more surface area) | **patron** |
| **Long-term value** | Moderate (mainstream tier) | Higher (mixed tier, more combinations) | **patron** |

---

**P69-003/004/005 comparison artifact saved.** Selection (P69-006) will synthesize this into a final recommendation.

# P70 Candidate Bridge Shapes Comparison

> **Date:** 2026-06-29
> **Stage:** P70 Wuxia Selected Next Route Design-First Contract
> **Story:** P70-003 — Compare Candidate Bridge Shapes Inside The Selected Route
> **Selected Route:** `jianghu_renown_sage` (江湖名宿)
> **Purpose:** Define at least two candidate bridge-shape directions for `jianghu_renown_sage`, bind each to existing repo assets, compare them across narrative fit / system fit / scope cost / small-step iterability, and recommend one primary direction.

---

## 1. Candidate Overview

Two candidate bridge-shape directions are evaluated for the `jianghu_renown_sage` route:

| # | Direction | Origin Seed | Key Mechanism | Downstream |
|---|-----------|-------------|---------------|------------|
| A | **Ally-Network Midlife Bridge** | `tavern_hand` + `ally_network` | Childhood network seed → midlife bridge event → renown path | `jianghu_renown_sage` composite gate |
| B | **Mentor-Bond Martial Seed Bridge** | New martial/mentor seed | Build martial seed → mentor bond → renown path | `jianghu_renown_sage` composite gate |

Both candidates target the same `jianghu_renown_sage` outcome, but they differ in which `key_choices` flag they use (`ally_network` vs `mentor_bond`), how much new content they need, and how well they fit the small-step iteration pattern.

---

## 2. Candidate A: Ally-Network Midlife Bridge

### 2.1 Narrative Description

A tavern hand who chose the "记客人" (track-guests) path in childhood builds a network of regulars and allies over the years. By midlife, the network is strong enough that they transition from "tavern hand with connections" to "someone known in jianghu circles" — not through martial prowess, but through reputation, connections, and the trust people place in them.

The bridge event at around age 28–30 formalizes this transition: a respected jianghu figure asks the tavern hand to help mediate a dispute, or to host a gathering, or to carry a message — and through that act, their reputation crosses the threshold from "local tavern networker" to "jianghu renown."

**Key narrative beats:**
- Childhood (9–13): Chooses to remember guests and build connections → `tavern_guest_network` + `ally_network`
- Early 20s: Regulars become friends, network deepens → `tavern_embrace_network`
- Midlife (28–30): A jianghu dispute or gathering brings their network to the fore → bridge event
- Post-bridge: Known in jianghu circles as someone who can get things done through connections and reputation → enters renown path

### 2.2 Existing Repo Asset Bindings

| Asset | Role in Candidate A |
|-------|---------------------|
| `origin_tavern_hand` (ordinary origin) | Starting point — tavern environment is perfect for network building |
| `ally_network` (key_choice flag) | **Primary bridge seed** — already set from childhood fork; satisfies renown gate's key_choices requirement |
| `tavern_guest_network` (early-life flag) | Pre-bridge signal — establishes the network-building path |
| `tavern_embrace_network` (midlife flag) | Pre-bridge deepening — midlife guest-regulars event builds network further |
| `ordinary_tavern_midlife_guest_regulars` (midlife event) | Existing midlife event that deepens the network |
| `jianghu_renown_sage` (composite gate) | Downstream target — already exists in `wuxiaOriginSurfaces.ts` |
| P32 short-chain proof | Existing validation — proves `ally_network` → renown gate works |
| P25 `ordinary_tavern_renown_path` fixture | Baseline reference — tavern_hand + ally_network + threshold stats = renown |
| P59 `tavern_merchant_bridge_crossed` pattern | Precedent — each origin has its own bridge flag pattern |
| `ordinaryOriginExpression.ts` | Expression framework — tavern branches exist, just need renown bridge text |

### 2.3 Narrative Fit Assessment

**Strengths:**
- Tavern hand → network → jianghu renown is a natural progression
- "Renown through connections, not martial skill" is a distinct take on the jianghu_renown_sage outcome
- Preserves the tavern_hand identity — the character is still "the tavern person who knows everyone," just at a larger scale
- The `ally_network` flag already exists and is narratively grounded in the childhood fork

**Weaknesses:**
- `jianghu_renown_sage` gate requires `skill_growth ≥ 45` — a pure network path may not naturally build martial skill
- The "sage" (名宿) label implies wisdom and seniority — pure networking may feel insufficient
- Need to make sure the bridge feels like "crossing into jianghu" and not just "made more friends"

**Differentiation from merchant path:**
- Merchant path (P59): Network → business referral → trade/wealth → `merchant_magnate`
- **Renown path (Candidate A):** Network → jianghu reputation → social standing → `jianghu_renown_sage`

Both use the tavern_hand network foundation, but they branch into different value systems (wealth vs reputation).

**Fit rating: Good** — the narrative works and has a clear distinct identity from the merchant path. The skill_growth question needs addressing but is solvable (e.g., the bridge event also grants some skill through experience, or allies teach some martial arts).

### 2.4 System Fit Assessment

**Strengths:**
- `ally_network` flag already exists and already satisfies the renown gate's key_choices dimension
- P32 short-chain proof validates that `ally_network` → renown gate unlock works
- P25 baseline fixture defines the target state (stats + flags)
- Expression framework (`ordinaryOriginExpression.ts`) already has tavern_hand branches
- Follows the same bridge pattern as P58/P59/P61: pre-bridge seed → bridge event → bridge flag → downstream gate
- Single-seed bridge = simple, well-understood pattern

**Weaknesses:**
- No existing renown sample-line spine — post-bridge progression content needs to be built
- The `skill_growth ≥ 45` requirement needs to be achievable from a tavern_hand origin (currently, the baseline fixture has martialPower 42, which is close to 45)
- No existing renown-specific expression text (all tavern bridge text is merchant-oriented)

**Fit rating: High** — the bridge itself has excellent system fit (single seed, existing flag, proven pattern). The post-bridge spine needs work, but that's expected for a new route.

### 2.5 Scope Cost Assessment

| Component | Effort | Notes |
|-----------|--------|-------|
| Add bridge-crossing midlife event | Low | 1 new event with 2 choices (accept / decline) |
| Add bridge flags | Very low | 2 flags: `tavern_renown_bridge_crossed` + `route_renown_committed` (or equivalent) |
| Address skill_growth requirement | Very low–Low | Bridge event can grant some skill, or pre-bridge events can build it |
| Add renown expression branches | Low | 3 surfaces × renown bridge branch (currentGoal, lifeMemory, summary) |
| Build renown sample-line spine | Medium | ~3 spine events (on_ramp / pressure / payoff) |
| Targeted proof artifact | Low | Follow P32 short-chain + P61 targeted proof pattern |
| Narrow regression tests | Low–Medium | ~12–15 assertions |

**Total scope: Small–Medium** — slightly more than the merchant bridges (because there's no existing spine), but still bounded and well-understood. The bridge itself is small; the spine adds medium scope.

### 2.6 Small-Step Iterability

**How many stages to playable?** 2–3 stages:
1. **P71:** Bridge + basic spine (on_ramp + basic expression)
2. **P72:** Entry differentiation
3. **P73–P75:** Pressure/payoff flavor, cost differentiation, success shape+recap

**Can you stop after Stage 1 and have something playable?** ✅ Yes — bridge + basic on_ramp is already a playable path. You can reach renown from tavern_hand, even if the post-bridge content is light.

---

## 3. Candidate B: Mentor-Bond Martial Seed Bridge

### 3.1 Narrative Description

An ordinary origin character encounters a martial arts mentor — a wandering swordsman, a retired jianghu figure, or a reclusive master — and forms a bond. Through this mentor, they learn martial arts, gain entry into jianghu circles, and eventually walk the renown path. The `mentor_bond` flag represents this pivotal relationship.

**Key narrative beats:**
- Childhood: Ordinary life, no particular martial inclination
- Youth/early adulthood: Chance encounter with a mentor figure
- Training period: Learns martial arts, builds skill
- Midlife: Mentor passes on, or sends the character out into the world → bridge event
- Post-bridge: Carrying the mentor's legacy, building reputation in jianghu → renown path

### 3.2 Existing Repo Asset Bindings

| Asset | Role in Candidate B |
|-------|---------------------|
| `mentor_bond` (key_choice flag) | **Theoretical bridge seed** — defined in renown gate but no ordinary-origin path sets it |
| `jianghu_renown_sage` (composite gate) | Downstream target — exists |
| `skill_growth ≥ 45` (gate requirement) | Naturally satisfied by martial training narrative |
| P32 short-chain proof | Partially relevant — proves renown gate works but with `ally_network`, not `mentor_bond` |

What's missing: basically everything else. There's no mentor event, no martial training chain, no `mentor_bond` flag set from any ordinary origin, no narrative seed in any existing ordinary-origin content.

### 3.3 Narrative Fit Assessment

**Strengths:**
- "Mentor-student bond" is a classic wuxia trope — very narratively satisfying
- Naturally explains skill_growth (mentor trains the student)
- "Renown through carrying on a mentor's legacy" is a strong identity
- Works across multiple ordinary origins (potentially farm_peasant, town_apprentice, etc.)

**Weaknesses:**
- No existing narrative seed in any ordinary origin — would need to be built from scratch
- Requires inventing a mentor character and a training arc — that's a lot of content for a "bridge"
- The mentor-bond → renown progression is less direct than ally-network → renown (needs more intermediate steps)
- Risk of scope explosion: "while we're adding a mentor, let's also add a full martial training system"

**Fit rating: High narrative potential, but zero existing foundation** — the story would be great, but there's nothing to anchor it in existing assets.

### 3.4 System Fit Assessment

**Strengths:**
- `mentor_bond` is already defined as a valid key_choices flag for the renown gate
- Naturally satisfies the skill_growth requirement (martial training = skill growth)
- Could potentially work for multiple origins

**Weaknesses:**
- **Zero existing infrastructure** — no event, no flag chain, no expression, no tests
- Would need to invent a new event chain (mentor encounter → training → bond formation → bridge)
- No proven pattern for mentor-bond bridges (unlike ally-network which has P32 proof)
- Martial skill progression from an ordinary origin is not well-supported by existing systems
- Scope would expand beyond "bridge" into "build a martial origin story"

**Fit rating: Low** — this is not a bridge project; it's a "build a new seed chain + bridge" project. The scope is much larger.

### 3.5 Scope Cost Assessment

| Component | Effort | Notes |
|-----------|--------|-------|
| Add mentor encounter event | Medium | New event with narrative setup |
| Add training / bonding events | Medium–High | Multiple events to build the mentor relationship |
| Set `mentor_bond` flag | Very low | But it's the end of a chain, not a single point |
| Add bridge-crossing event | Low | Similar to Candidate A |
| Add bridge flags | Very low | 2 flags |
| Build martial skill progression | Medium–High | How does an ordinary origin gain skill_growth? |
| Build renown sample-line spine | Medium | Same as Candidate A |
| Add expression branches | Medium | More branches needed (mentor + training + bridge) |
| Tests and proof | Medium | New pattern, no precedent |

**Total scope: Large** — this is not a bridge project. It's a "build a martial seed chain + bridge + spine" project that could easily span 3–4 stages on its own.

### 3.6 Small-Step Iterability

**How many stages to playable?** 4–5 stages minimum:
1. Mentor encounter + basic bond
2. Training chain + skill growth
3. Bridge + renown entry
4. Entry differentiation
5. Pressure/payoff / cost / shape...

**Can you stop after Stage 1 and have something playable?** ❌ No — after adding a mentor encounter, you still don't have a bridge, you don't have enough skill_growth, and you don't have `mentor_bond` set. You need at least 2–3 stages before the renown path is even reachable.

---

## 4. Comparison Matrix

| Dimension | Candidate A: Ally-Network Midlife | Candidate B: Mentor-Bond Martial Seed |
|-----------|-----------------------------------|---------------------------------------|
| **Existing seed** | ✅ Strong — `ally_network` from tavern_hand childhood | ❌ None — `mentor_bond` exists in gate but no path |
| **Narrative fit** | Good — network → reputation → renown | Excellent — classic mentor-student wuxia trope |
| **Identity differentiation** | Good — "renowned networker" is distinct | Very Good — "mentor's legacy" is very distinct |
| **System fit** | High — single seed, proven pattern, P32 proof | Low — zero existing infrastructure, needs new chain |
| **Existing asset reuse** | High — tavern events + expression + gate + proof | Low — only the gate itself exists |
| **Bridge scope** | Small — 1 bridge event + flags | Large — need seed chain + training + bridge |
| **Total scope (bridge + spine)** | Small–Medium | Very Large |
| **Stages to playable** | 2–3 | 4–5 |
| **Small-step iterability** | ✅ Good — playable after bridge stage | ❌ Poor — need multiple stages before reachable |
| **Risk of scope creep** | Low — well-bounded by existing pattern | High — mentor + martial training easily expands |
| **Quality-first alignment** | ✅ Strong — evidence + low risk + methodology fit | ⚠️ Weak — no evidence + high risk |
| **Skill_growth requirement** | ⚠️ Needs addressing (close but needs a boost) | ✅ Naturally satisfied by martial training |

---

## 5. Recommendation

**Recommended bridge shape: Candidate A — Ally-Network Midlife Bridge**

### 5.1 Rationale

1. **Evidence strength:** Candidate A has by far the stronger foundation. `ally_network` already exists, is set from tavern_hand childhood, is validated by P32 short-chain proof, and has a P25 baseline fixture. Candidate B has zero existing infrastructure.

2. **Implementation risk:** Candidate A is low risk — single-seed bridge, proven pattern, existing expression framework. Candidate B is high risk — needs new seed chain, new training system, new content, new patterns.

3. **Small-step iterability:** Candidate A reaches playable in 2–3 stages. Candidate B needs 4–5 stages minimum, and you can't even reach the renown gate after just the bridge.

4. **Methodology fit:** Candidate A follows the exact same pattern as the merchant trilogy bridges (pre-bridge seed → bridge event → bridge flag → downstream gate). This tests the methodology's generality by applying it to a mainstream-tier outcome while keeping the bridge pattern consistent.

5. **Quality-first priority order:** Evidence strength → implementation risk → methodology fit → value density. Candidate A wins on the first three. Candidate B might have higher value density (better narrative, more differentiation), but that's the lowest priority.

### 5.2 Addressing the Skill_Growth Question

The main concern with Candidate A is whether a tavern_hand networker can reasonably reach `skill_growth ≥ 45`. Here's why this is manageable:

1. **Baseline is close:** The P25 `ordinary_tavern_renown_path` fixture already has martialPower 42 at age 42 — just 3 points short of 45.
2. **Bridge event can grant skill:** The bridge event (e.g., mediating a dispute, hosting a gathering) can grant a small skill bonus through experience.
3. **Allies can teach:** The `ally_network` can include martial artists who teach the character some basics — narratively consistent with "learned a few tricks from jianghu friends."
4. **Skill_growth is not pure martial:** The `skill_growth` dimension in the composite gate could encompass broader "skill" — not just fighting skill, but also social skill, reputation management, etc. (though this needs to be consistent with how the gate is used elsewhere)

### 5.3 Why Not Both?

We are NOT building both bridges in parallel. Here's why:

1. **Scope control:** P70 is about designing one bridge, not planning an entire route expansion.
2. **Methodology discipline:** The merchant trilogy proved the methodology on one origin first, then added more. Same approach here: prove it works with tavern_hand, then add other origins later.
3. **Candidate B can wait:** The mentor-bond direction is a good idea, but it needs its own design and implementation cycle. It should be revisited after the ally-network bridge is working and proven.

### 5.4 What Candidate B Is Good For

Candidate B is not rejected entirely — it's deferred. It serves as:

- A reminder that `mentor_bond` is a valid entry path to renown
- A future expansion direction for a second or third renown bridge
- A potential entry point for other ordinary origins (farm_peasant, town_apprentice)
- Inspiration for post-bridge renown content (mentor figures can appear in the renown spine)

---

**P70-003 complete.** Candidate bridge-shape comparison saved. Recommendation: Ally-Network Midlife Bridge (Candidate A).

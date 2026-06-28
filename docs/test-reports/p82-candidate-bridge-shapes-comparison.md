# P82 Candidate Bridge Shapes Comparison

> **Date:** 2026-06-29
> **Stage:** P82 Wuxia Medical Sage Bridge Design-First Contract
> **Story:** P82-003 — Compare Candidate Bridge Shapes
> **Target Route:** `medical_sage_healer` (一代名医)
> **Input from:** `docs/test-reports/p82-medical-sage-prerequisite-audit.md` (prerequisite audit complete)
> **Purpose:** Define at least two candidate bridge-shape directions for `medical_sage_healer`, bind each to existing repo assets, compare them across narrative fit / system fit / scope cost / small-step iterability, and recommend one primary direction.

---

## 1. Candidate Overview

Two candidate bridge-shape directions are evaluated for the `medical_sage_healer` route from `tavern_hand` origin:

| # | Direction | Origin Seed | Key Mechanism | Downstream |
|---|-----------|-------------|---------------|------------|
| A | **Habit-Led Study-Healer Bridge** | `tavern_hand` + studyHabit build-up | Study habit → midlife healer discovery → medical path | `medical_sage_healer` composite gate |
| B | **Social-Momentum Healer Bridge** | `tavern_hand` + socialMomentum build-up | Social reputation → healer network → medical path | `medical_sage_healer` composite gate |

Both candidates target the same `medical_sage_healer` outcome, but they differ in which habit trajectory they follow, which key_choice flags they set first, and how much new content they need.

---

## 2. Candidate A: Habit-Led Study-Healer Bridge

### 2.1 Narrative Description

A tavern hand who developed a studious habit (reading accounts, learning from guest conversations, poring over whatever books come their way) discovers an aptitude for medicine. Through careful observation and self-study, they begin to help patrons with minor ailments. Word spreads, and by midlife, they're faced with a choice: lean into this emerging healer identity, or stay focused on the tavern.

The bridge event at around age 26–30 formalizes this transition: a visiting scholar or local doctor recognizes their talent, or a crisis (illness in the town) pushes them to take on more responsibility. Through that act, they cross from "tavern hand who knows some remedies" to "someone known as a healer."

**Key narrative beats:**
- Childhood/early life: Develops study habit through tavern work (reading ledgers, listening to educated guests)
- Late teens/early 20s: Starts picking up medical knowledge from passing doctors, herbalists, old books
- Midlife (26–30): A crisis or opportunity pushes them to take on a real healer role → bridge event
- Post-bridge: Known locally as a healer, enters the medical_sage_healer path → continues to build reputation and skill

### 2.2 Existing Repo Asset Bindings

| Asset | Role in Candidate A |
|-------|---------------------|
| `origin_tavern_hand` (ordinary origin) | Starting point — tavern environment exposes character to many people and opportunities to learn |
| `studyHabit` (life state) | **Primary bridge seed** — drives the healer reinforcement event chain |
| `p27_study_habit_healer_reinforcement` (event) | Existing habit-led event that sets `medical_pure` + `medical_talent` |
| `p29_study_habit_case_record_duty` (event) | Existing habit-led event that sets `medical_divine_doctor_fame` |
| `medical_pure` (key_choice flag) | **Primary key_choice 1** — already set by p27 study-healer path |
| `medical_divine_doctor_fame` (key_choice flag) | **Primary key_choice 2** — already set by p29 study-case-duty |
| `medical_sage_healer` (composite gate) | Downstream target — already exists in `wuxiaOriginSurfaces.ts` |
| P33 short-chain proof | Existing validation — proves study-healer path → medical gate works |
| P34 birth-to-death proof | Existing validation — proves full lifetime habit-led unlock |
| `ordinaryOriginExpression.ts` | Expression framework — tavern branches exist, just need medical bridge text |
| Renown bridge pattern (P70/P71) | Methodology reference — same pattern: seed → midlife bridge → downstream gate |

### 2.3 Narrative Fit Assessment

**Strengths:**
- Tavern hand → study → healer is a natural, grounded progression
- "Self-taught healer from humble beginnings" is a classic wuxia/xianxia trope
- Preserves the tavern_hand identity — the character is still "the tavern person who pays attention and learns," but applied to medicine
- Study habit is relatable and can develop naturally from tavern work (reading ledgers, remembering regulars' ailments)
- The `medical_pure` flag (set by study-healer path) aligns well with a tavern-born healer — pure intention, no formal apprenticeship

**Weaknesses:**
- Tavern hand doesn't have an existing studyHabit seed in early-life — need to build it or introduce it in the bridge
- The "study habit → healer" transition needs to feel earned, not forced
- Need to make sure the bridge feels like "crossing into healer identity" and not just "learned some medicine"

**Differentiation from renown path:**
- Renown path (P70/P71): Network → jianghu reputation → social standing → `jianghu_renown_sage`
- **Medical path (Candidate A):** Study → medical knowledge → healer reputation → `medical_sage_healer`

Both use tavern_hand as the origin, but they branch into different skill domains (social vs intellectual) and different achievement types.

**Fit rating: Good** — the narrative works and has a clear distinct identity from the renown path. The study-habit seeding question needs addressing but is solvable.

### 2.4 System Fit Assessment

**Strengths:**
- Study-healer path is already fully verified (P33 short-chain + P34 birth-to-death)
- Both key_choice flags (`medical_pure` + `medical_divine_doctor_fame`) have existing event-driven paths
- Follows the same bridge pattern as P58/P59/P61/P71: pre-bridge seed → bridge event → bridge flag → downstream gate
- Single-seed bridge = simple, well-understood pattern
- Habit-led framework already exists and is proven

**Weaknesses:**
- No existing medical sample-line spine — post-bridge progression content needs to be built
- No existing medical-specific expression in `ordinaryOriginExpression.ts` — need to add all branches from scratch
- Tavern_hand early-life doesn't seed studyHabit — bridge may need to include a study-habit boost or the bridge event itself needs to be the entry point
- `resources ≥ 30` gate requirement — need to make sure a tavern-born healer can reach this threshold

**Fit rating: High** — the bridge itself has excellent system fit (verified habit-led path, proven pattern). The post-bridge spine needs work, but that's expected for a new route.

### 2.5 Scope Cost Assessment

| Component | Effort | Notes |
|-----------|--------|-------|
| Add bridge-crossing midlife event | Low | 1 new event with 2 choices (embrace healer path / stay in tavern) |
| Add bridge flags | Very low | 2 flags: `tavern_medical_bridge_crossed` + `route_medical_committed` (or equivalent) |
| Seed studyHabit or bridge directly | Very low–Low | Either build studyHabit through pre-bridge events or make the bridge event the entry point |
| Address resources requirement | Very low–Low | Bridge event can grant some resources, or healer income builds it |
| Add medical expression branches | Low–Medium | 3 surfaces × medical bridge branch (currentGoal, lifeMemory, summary) |
| Build medical sample-line spine | Medium | ~3 spine events (on_ramp / pressure / payoff) |
| Targeted proof artifact | Low | Follow P33 short-chain + P71 targeted proof pattern |
| Narrow regression tests | Low–Medium | ~12–15 assertions |

**Total scope: Small–Medium** — slightly more than the renown bridge (because expression needs to be built from scratch), but still bounded and well-understood. The bridge itself is small; the spine adds medium scope.

### 2.6 Small-Step Iterability

**How many stages to playable?** 2–3 stages:
1. **P83:** Bridge + basic spine (on_ramp + basic expression)
2. **P84:** Entry differentiation
3. **P85–P87:** Pressure/payoff / late-life / endgame

**Can you stop after Stage 1 and have something playable?** ✅ Yes — bridge + basic on_ramp is already a playable path. You can reach medical_sage_healer from tavern_hand, even if the post-bridge content is light.

---

## 3. Candidate B: Social-Momentum Healer Bridge

### 3.1 Narrative Description

A tavern hand who built strong social momentum (popular with guests, well-known in town, good at connecting people) discovers that their reputation brings people seeking help. When a local healer is unavailable or a crisis hits, the townsfolk turn to the tavern hand because they know everyone and can coordinate help. Through this, the tavern hand begins to learn medicine — not through formal study, but through practical experience and the connections they've built.

The bridge event at around age 24–28 formalizes this transition: a healer in town offers to teach them, or they open a small clinic in the tavern's back room, or a wealthy patron sponsors their medical education. Through that act, they cross from "popular tavern keeper who helps people" to "someone known as a healer."

**Key narrative beats:**
- Childhood/early life: Develops social skills and builds a network through tavern work
- Late teens/early 20s: Reputation grows — people come to them for help with all kinds of things, including minor health issues
- Midlife (24–28): An opportunity to formalize their healer role → bridge event
- Post-bridge: Known as a healer with strong community ties → enters the medical_sage_healer path

### 3.2 Existing Repo Asset Bindings

| Asset | Role in Candidate B |
|-------|---------------------|
| `origin_tavern_hand` (ordinary origin) | Starting point — tavern environment is perfect for building social momentum |
| `socialMomentum` (life state) | **Primary bridge seed** — drives the healer network event |
| `p29_social_momentum_healer_network` (event) | Existing habit-led event that sets `medical_talent` + `p29_social_healer_network` |
| `medical_talent` (flag) | Set by social-healer-network event — but not a key_choice flag |
| `medical_sage_healer` (composite gate) | Downstream target — exists |
| `tavern_guest_network` (early-life flag) | Pre-bridge signal — establishes the social path |
| `tavern_embrace_network` (midlife flag) | Pre-bridge deepening — guest-regulars event builds network further |
| `ordinaryOriginExpression.ts` | Expression framework — tavern branches exist |
| Renown bridge pattern (P70/P71) | Methodology reference — same origin, same social foundation |

### 3.3 Narrative Fit Assessment

**Strengths:**
- Tavern hand → social reputation → healer is a very natural progression for tavern_hand
- "Community healer who learned through practical experience" is a strong, distinct identity
- Preserves and deepens the tavern_hand identity — the character's healing grows out of their social role in the community
- Aligns well with the existing tavern_hand network path (guest regulars, ally network)
- Good differentiation from Candidate A (study-based pure healer vs social-based community healer)

**Weaknesses:**
- The social-healer-network event only sets `medical_talent`, not any key_choice flags — need additional events to reach the gate
- The path from "social person" to "medical sage" feels less direct than study → medical sage
- Risk of overlap with the renown path — both are social/reputation-based
- `medical_pure` flag may feel forced for a social-momentum healer (pure in the sense of "not poison" is fine, but the study association is stronger)

**Differentiation from renown path:**
- Renown path: Network → jianghu reputation → social standing → `jianghu_renown_sage`
- **Medical path (Candidate B):** Network → healer reputation → community standing → `medical_sage_healer`

Both are social/reputation-based, but they go in different directions (jianghu renown vs medical healer). The risk is that they feel too similar in the early stages.

**Fit rating: Medium–Good** — strong narrative fit for tavern_hand, but more overlap with renown path and less direct path to the key_choice flags.

### 3.4 System Fit Assessment

**Strengths:**
- Social momentum builds naturally from the existing tavern_hand network path
- `p29_social_momentum_healer_network` event already exists
- Aligns with tavern_hand's strength (social connections)
- Follows the same general bridge pattern (seed → bridge → downstream)

**Weaknesses:**
- **Social-healer-network event is incomplete as a bridge** — it sets `medical_talent` but no key_choice flags. Need additional events (medical_poison_temptation → medical_pure, medical_divine_doctor_fame auto) to reach the gate.
- **Longer chain to gate** — study path has 2 events → both key_choice flags; social path has 1 event → medical_talent only, then needs 2–3 more events
- **No verification** — social-healer path has not been verified as a complete chain to medical_sage_healer (unlike study path which has P33/P34 proof)
- **No existing social-momentum → key_choice chain** — the path from medical_talent to medical_pure + medical_divine_doctor_fame goes through traditional medical events, not habit-led ones
- **Risk of scope expansion** — to make social-healer work, might need to add more habit-led medical events for social path

**Fit rating: Medium–Low** — the social foundation is strong, but the bridge itself is incomplete. The path from social momentum to medical_sage_healer is longer and less verified than the study path.

### 3.5 Scope Cost Assessment

| Component | Effort | Notes |
|-----------|--------|-------|
| Add bridge-crossing midlife event | Low–Medium | 1 new event, but needs to both set medical_talent AND start the key_choice chain |
| Add bridge flags | Very low | 2 flags |
| Complete the key_choice chain | Medium | Need to add or wire up social-led path to medical_pure + medical_divine_doctor_fame |
| Address resources requirement | Low | Similar to Candidate A |
| Add medical expression branches | Low–Medium | Same as Candidate A |
| Build medical sample-line spine | Medium | Same as Candidate A |
| Targeted proof artifact | Medium | New pattern, no existing verification for social path |
| Narrow regression tests | Medium | More assertions needed for the longer chain |

**Total scope: Medium–Large** — the social foundation is there, but completing the bridge to the gate requires more work because the social-healer event doesn't set key_choice flags directly.

### 3.6 Small-Step Iterability

**How many stages to playable?** 3–4 stages:
1. Bridge + basic medical_talent setup
2. Complete the key_choice chain (medical_pure + divine_doctor_fame)
3. Entry differentiation
4. Pressure/payoff / etc.

**Can you stop after Stage 1 and have something playable?** ⚠️ Partial — after adding a bridge event, you'd have medical_talent but no key_choice flags, so you can't reach medical_sage_healer yet. You need the key_choice chain to be complete.

---

## 4. Comparison Matrix

| Dimension | Candidate A: Study-Healer | Candidate B: Social-Momentum Healer |
|-----------|---------------------------|-------------------------------------|
| **Existing seed** | ✅ Strong — studyHabit → p27/p29 verified chain | ⚠️ Partial — socialMomentum → medical_talent only |
| **Complete key_choice chain?** | ✅ Yes — 2 events → both key_choice flags | ❌ No — 1 event → medical_talent only, need more |
| **Narrative fit** | Good — study → healer, classic self-taught trope | Good — community healer, very natural for tavern_hand |
| **Identity differentiation** | Good — "studious healer" distinct | Medium — "social healer" overlaps more with renown |
| **System fit** | High — verified chain, proven pattern, P33/P34 proof | Medium–Low — incomplete chain, no full verification |
| **Existing asset reuse** | High — p27 + p29 study events + P33/P34 proof | Medium — p29 social event exists but incomplete |
| **Bridge scope** | Small — 1 bridge event + flags | Medium — 1 bridge event + need to complete key_choice chain |
| **Total scope (bridge + spine)** | Small–Medium | Medium–Large |
| **Stages to playable** | 2–3 | 3–4 |
| **Small-step iterability** | ✅ Good — playable after bridge stage | ⚠️ Partial — need key_choice chain to reach gate |
| **Risk of scope creep** | Low — well-bounded by existing verified chain | Medium–High — might need to add more habit-led medical events |
| **Quality-first alignment** | ✅ Strong — evidence + low risk + methodology fit | ⚠️ Medium — partial evidence + higher risk |
| **Differentiation from renown** | ✅ Good — intellectual vs social axis | ⚠️ Medium — both social/reputation-based |

---

## 5. Recommendation

**Recommended bridge shape: Candidate A — Habit-Led Study-Healer Bridge**

### 5.1 Rationale

1. **Evidence strength:** Candidate A has by far the stronger foundation. The study-healer path is fully verified by P33 short-chain proof and P34 birth-to-death lifetime sim. Both key_choice flags (`medical_pure` + `medical_divine_doctor_fame`) have existing event-driven paths. Candidate B has only a partial on-ramp (medical_talent only) with no verified complete chain.

2. **Implementation risk:** Candidate A is low risk — single-seed bridge, proven habit-led pattern, existing verification. Candidate B is medium–high risk because the social-healer event doesn't set key_choice flags directly, and completing the chain might require adding new habit-led medical events.

3. **Small-step iterability:** Candidate A reaches playable in 2–3 stages. Candidate B needs 3–4 stages minimum, and you can't even reach the medical gate after just the bridge because the key_choice chain is incomplete.

4. **Methodology fit:** Candidate A follows the exact same pattern as the renown bridge (pre-bridge seed → bridge event → bridge flag → downstream gate). It also reuses the verified habit-led medical framework. This tests the methodology's generality while staying within proven patterns.

5. **Differentiation from renown:** Candidate A has better differentiation from the renown path. Renown is social/reputation-based; medical (Candidate A) is intellectual/study-based. This gives players two distinct routes from tavern_hand. Candidate B would feel too similar to renown in the early stages.

6. **Quality-first priority order:** Evidence strength → implementation risk → methodology fit → value density. Candidate A wins on the first three. Candidate B might have slightly better narrative fit for tavern_hand (social healer is very natural), but evidence and risk are more important.

### 5.2 Addressing the StudyHabit Seeding Question

The main concern with Candidate A is how a tavern_hand develops studyHabit. Here's why this is manageable:

1. **Bridge event can include a study element:** The bridge event itself can be the trigger — the character has been quietly studying medicine on the side, and the bridge event is when it becomes public.
2. **Tavern work naturally builds study habits:** Reading ledgers, remembering regulars' preferences and ailments, learning from educated guests — all of these can build studyHabit in a tavern context.
3. **Bridge event can boost studyHabit:** If needed, the bridge event can give a studyHabit boost to reach the p27 threshold.
4. **Alternative: Make the bridge the entry point:** Instead of requiring studyHabit first, the bridge event can be the moment the character discovers their medical aptitude — and studyHabit grows as a result of walking the healer path.

### 5.3 Why Not Both?

We are NOT building both bridges in parallel. Here's why:

1. **Scope control:** P82 is about designing one bridge, not planning an entire route expansion.
2. **Methodology discipline:** The renown route proved the methodology on one origin first, then added more. Same approach here: prove it works with study-healer from tavern_hand, then add other entry paths later.
3. **Candidate B can wait:** The social-momentum direction is a good idea, but it needs its own design and implementation cycle. It should be revisited after the study-healer bridge is working and proven.

### 5.4 What Candidate B Is Good For

Candidate B is not rejected entirely — it's deferred. It serves as:

- A reminder that social momentum is a valid entry path to medical_sage_healer
- A future expansion direction for a second or third medical bridge
- A potential entry point for other ordinary origins (farm_peasant, town_apprentice) — social healer might work better for other origins
- Inspiration for post-bridge medical content (social elements can appear in the medical spine)
- An entry variant for entry differentiation (study vs social entry flavors)

---

**P82-003 complete.** Candidate bridge-shape comparison saved. Recommendation: Habit-Led Study-Healer Bridge (Candidate A).

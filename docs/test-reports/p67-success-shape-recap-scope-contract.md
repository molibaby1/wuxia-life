# P67 Success-Shape and Recap Scope Contract

> **Date:** 2026-06-28
> **Stage:** P67 Wuxia Merchant Trilogy Success Shape And Recap
> **Story:** P67-002 — Lock P67 success-shape and recap scope contract
> **Type:** Scope guardrail — documentation that defines what P67 may and may not do

---

## 1. Purpose

This contract locks P67's scope to success-shape differentiation and recap-line strengthening only, preventing drift into broader merchant expansion or ending-system work. P67 is a bounded player-experience tightening stage — the final stage of the merchant trilogy — focused on making the success feel differently shaped and the ending feel more memorable.

**Guiding principle:** Make the *shape of success* feel different across the three routes, and give each route a memorable destiny sentence — using only the existing magnate skeleton and expression infrastructure.

---

## 2. What P67 Is (Allowed Layers)

P67 operates within these layers only:

### 2.1 Light Configuration
- Route-specific success-shape markers (flags or derived markers) that persist through the magnate journey
- No new event chains, no new event pools
- Markers must be wireable through existing expression surfaces
- Markers should be derivable from existing bridge flags (apprentice/tavern/peasant_merchant_bridge_crossed)

### 2.2 Expression Layer
- Extend existing expression functions in `src/p50/sampleLineExpression.ts`
- Extend existing expression functions in `src/p56/ordinaryOriginExpression.ts` (if needed)
- Differentiate success-shape metaphors at payoff phase
- Add recap-line / destiny-sentence signals on existing expression surfaces
- Refine age-40 identity to emphasize success shape, not just origin path
- All expressions must be player-visible (no raw flag keys leaking)
- At least 3 groups of recap / destiny-sentence readable signals across existing surfaces

### 2.3 Proof Artifacts
- One comparison-style targeted proof document
- Shows side-by-side success-shape and recap differentiation for apprentice / tavern / peasant
- Does not require full lifetime comparative exhaust
- Proof must serve as archival evidence for the route-optimization method

### 2.4 Narrow Tests
- Marker-level assertions (route-specific success-shape signals exist where expected)
- Expression-level assertions (player-facing text reads differently per route)
- Comparison-level assertions (three routes produce meaningfully different success-shape and recap signals)
- Reuse existing merchant trilogy harnesses (P50, P58, P59, P61 test patterns)
- Do NOT rewrite the full merchant test suite
- Do NOT add new test frameworks or harnesses

---

## 3. What P67 Is NOT (Forbidden Expansions)

### 3.1 No New Ending Framework
- ❌ No new ending system or epilogue framework
- ❌ No full merchant epilogue system
- ❌ No new ending UI components
- ❌ No new ending screens or screens
- ❌ No post-life recap system

### 3.2 No Structural Magnate Changes
- ❌ No structural change to the magnate skeleton (on_ramp → pressure → payoff)
- ❌ No new success gates or endpoints
- ❌ No route-specific failure modes
- ❌ No different pacing or timing per route
- ❌ No route-specific magnate variants
- ❌ No mechanical differentiation of success

### 3.3 No Full Merchant Wave
- ❌ No new merchant events or event chains
- ❌ No new merchant event pools
- ❌ No new merchant story arcs
- ❌ No new merchant NPCs or relationships
- ❌ No new merchant locations or maps

### 3.4 No New Systems
- ❌ No new economy system
- ❌ No new relationship / favor system
- ❌ No new inventory or cargo system
- ❌ No new map or travel system
- ❌ No new merchant framework
- ❌ No new marker/carrier system

### 3.5 No Route Expansion
- ❌ No fourth ordinary-origin bridge
- ❌ No new origin types
- ❌ No new mixed-identity merchant routes
- ❌ No sample-line track reopening

### 3.6 No Broader Recap UI Overhaul
- ❌ No full recap UI redesign
- ❌ No new life-summary screens
- ❌ No replay system changes for recap purposes
- ❌ No playtest platformization

---

## 4. Bounded Implementation Approach

P67 implements success-shape and recap differentiation through the following bounded changes:

### 4.1 Wire Layer (P67-007)
- Add success-shape differentiation using existing carrier / marker / expression-adjacent wiring
- Markers are derived from existing bridge flags (no new events needed)
- Uses existing carrier pattern (flags as carriers)
- No new systems or frameworks
- Success-shape and recap signals must align with each other

### 4.2 Expression Layer (P67-006)
- Reframe payoff success metaphors to be route-shaped rather than origin-decorated
- Add recap-line / destiny-sentence expression on existing surfaces
- Strengthen age-40 identity with success-shape emphasis
- Ensure all three routes support distinct and replayable player-summary sentences
- Minimum 3 groups of recap / destiny-sentence readable signals
- No new UI components

### 4.3 Proof Layer (P67-008)
- Single comparison proof artifact
- Side-by-side: apprentice success-shape vs. tavern success-shape vs. peasant success-shape
- Side-by-side: apprentice recap vs. tavern recap vs. peasant recap
- Shows distinctive success-shape metaphors and destiny sentences per route
- Validates that success shape is meaningfully different, not just flavor

### 4.4 Test Layer (P67-009)
- Marker tests: route-specific success-shape signals are present at expected stages
- Expression tests: player-facing text contains route-specific success-shape keywords
- Comparison tests: three routes produce meaningfully different success-shape and recap text
- Reuse P50 / P58 / P59 / P61 test patterns
- All existing P55/P58/P59/P61/P63/P64/P66 tests must continue to pass

---

## 5. Preserved Evidence

P67 must not regress any existing merchant trilogy evidence:

| Stage | What Must Not Regress | How Verified |
|-------|----------------------|--------------|
| P55 | Magnate chain structure and gates | Existing merchant tests in P50 |
| P58 | Apprentice bridge flags and expressions | `tests/p58ApprenticeBridgeTests.ts` |
| P59 | Tavern bridge flags and expressions | `tests/p59TavernHandBridgeTests.ts` |
| P61 | Peasant bridge flags and expressions | `tests/p61FarmPeasantBridgeTests.ts` |
| P63 | Entry differentiation (on_ramp cost label, identity) | `tests/p50SampleLineExpressionTests.ts` P63 tests |
| P64 | Pressure/payoff expression differentiation | `tests/p50SampleLineExpressionTests.ts` P64 tests |
| P66 | Success-cost differentiation (cost persistence, payoff cost reflection, age-40 cost weight) | `tests/p50SampleLineExpressionTests.ts` P66 tests |

---

## 6. Success-Shape Contract Boundaries

To keep P67 focused, the success-shape differentiation is bounded by:

### 6.1 What "Success Shape" Means in P67
- The *metaphor* of success (what kind of success is it?)
- The *way* success is achieved (through judgment / through networks / through endurance)
- The *shape* of the final outcome (a craft-quality empire / a network empire / a logistics empire)
- Expressed through text on existing surfaces

### 6.2 What "Success Shape" Does NOT Mean in P67
- Different mechanical outcomes (different stats, different wealth levels)
- Different ending states (different mixed-identity gates)
- Different event sequences
- Different pacing or timing
- Different failure modes

---

## 7. Success Criteria for Scope Compliance

P67 is in-scope if and only if:

1. ✅ All runtime changes are in expression/marker layers only
2. ✅ No new events, systems, or frameworks are introduced
3. ✅ The magnate skeleton (on_ramp → pressure → payoff) is structurally unchanged
4. ✅ All P55/P58/P59/P61/P63/P64/P66 tests continue to pass
5. ✅ Success-shape differentiation is runtime-visible (not just PRD text)
6. ✅ At least 3 groups of recap / destiny-sentence readable signals exist
7. ✅ Three routes produce meaningfully different success-shape experiences
8. ✅ Each route has a distinct and memorable destiny sentence
9. ✅ No new UI components are added

---

## 8. Boundary with P66 and Future Work

### P66 → P67 Handover
- **P66 completes:** Success-cost differentiation — three routes pay different prices
- **P67 takes over:** Success-shape differentiation + recap strengthening — three routes succeed in different ways and leave with a memorable sentence
- P67 builds on P66's cost foundation — the destiny sentence lands harder because the cost was already felt

### What P67 Leaves for Future Stages
- Full ending framework / epilogue system — deferred to a dedicated ending stage
- Mechanical success differentiation — would require structural magnate changes
- Route-specific failure modes — out of scope for a success-focused stage
- Fourth ordinary-origin bridge — separate expansion work
- Full playtest platformization — separate infrastructure work
- Sample-line track reopening — separate content pipeline work

---

## 9. Methodology Template Role

P67 serves as the final validation of the merchant trilogy optimization method:

**Trilogy optimization sequence:**
1. **P58/P59/P61** — Bridges: get three distinct paths to the same destination
2. **P63** — Entry differentiation: make the entrance feel different
3. **P64** — Pressure/payoff differentiation: add flavor to the middle and end
4. **P66** — Cost differentiation: make success feel earned differently
5. **P67** — Success-shape + recap: make the success feel shaped differently and leave with a memorable sentence

This sequence (bridges → entry → pressure/payoff → cost → shape/recap) is the methodology template that can be applied to future ordinary→mixed route work.

---

## 10. Enforcement

This scope contract is enforced through:

1. **Story-by-story review** — each story is checked against this contract
2. **Test regression guard** — existing P55/P58/P59/P61/P63/P64/P66 tests must pass
3. **Closure report audit** — P67-010 closure report must list all changes and confirm scope compliance
4. **Diff size check** — if the diff is larger than expected for expression-only changes, scope is re-evaluated

# P66 Success-Cost Scope Contract

> **Date:** 2026-06-28
> **Stage:** P66 Wuxia Merchant Trilogy Success-Cost Differentiation
> **Story:** P66-002 — Lock P66 success-cost scope contract
> **Type:** Scope guardrail — documentation that defines what P66 may and may not do

---

## 1. Purpose

This contract locks P66's scope to success-cost differentiation only, preventing drift into broader merchant expansion. P66 is a bounded player-experience tightening stage, not a merchant content wave.

**Guiding principle:** Make the cost of success *feel* different across the three routes, using only the existing magnate skeleton and expression infrastructure.

---

## 2. What P66 Is (Allowed Layers)

P66 operates within these layers only:

### 2.1 Light Configuration
- Route-specific cost markers (flags) that persist through the magnate journey
- No new event chains, no new event pools
- Markers must be wireable through existing expression surfaces

### 2.2 Expression Layer
- Extend existing expression functions in `src/p50/sampleLineExpression.ts`
- Extend existing expression functions in `src/p56/ordinaryOriginExpression.ts`
- Differentiate cost labels, current goals, age-40 identity, and life memory
- All expressions must be player-visible (no raw flag keys leaking)
- At least 3 groups of cost-specific readable signals across existing surfaces

### 2.3 Proof Artifacts
- One comparison-style targeted proof document
- Shows side-by-side cost differentiation for apprentice / tavern / peasant
- Does not require full lifetime comparative exhaust
- Proof must directly support P67's next stage (success-shape / recap)

### 2.4 Narrow Tests
- Marker-level assertions (route-specific cost flags exist where expected)
- Expression-level assertions (player-facing text reads differently per route)
- Comparison-level assertions (three routes produce meaningfully different cost signals)
- Reuse existing merchant trilogy harnesses (P50, P58, P59, P61 test patterns)
- Do NOT rewrite the full merchant test suite
- Do NOT add new test frameworks or harnesses

---

## 3. What P66 Is NOT (Forbidden Expansions)

### 3.1 No Full Merchant Wave
- ❌ No new merchant events or event chains
- ❌ No new merchant event pools
- ❌ No new merchant story arcs
- ❌ No new merchant NPCs or relationships
- ❌ No new merchant locations or maps

### 3.2 No Success-Shape Mainline Work
- ❌ No structural change to the magnate skeleton (on_ramp → pressure → payoff)
- ❌ No new success gates or endpoints
- ❌ No route-specific failure modes
- ❌ No different pacing or timing per route
- ❌ No route-specific magnate variants

### 3.3 No Playtest Platformization
- ❌ No new playtest tools or infrastructure
- ❌ No automated playtest metric collection
- ❌ No playtest UI changes
- ❌ No replay system changes

### 3.4 No New Systems
- ❌ No new economy system
- ❌ No new relationship / favor system
- ❌ No new inventory or cargo system
- ❌ No new map or travel system
- ❌ No new merchant framework
- ❌ No new marker/carrier system

### 3.5 No New Routes or Bridges
- ❌ No fourth ordinary-origin bridge
- ❌ No new origin types
- ❌ No new mixed-identity merchant routes
- ❌ No sample-line track reopening

---

## 4. Bounded Implementation Approach

P66 implements cost differentiation through the following bounded changes:

### 4.1 Wire Layer (P66-006)
- Add route-specific cost-persistence markers derived from bridge origin
- Markers are set at bridge crossing and persist through magnate stages
- No new events — markers are derived from existing flags
- Uses existing carrier pattern (flags as carriers)

### 4.2 Expression Layer (P66-007)
- Deepen payoff-phase expressions to include cost reflection
- Extend cost-label differentiation beyond on_ramp into pressure and payoff
- Add cost weight to age-40 identity statements
- Strengthen life-memory cost signals at payoff
- Minimum 3 groups of cost-specific readable signals

### 4.3 Proof Layer (P66-008)
- Single comparison proof artifact
- Side-by-side: apprentice cost vs. tavern cost vs. peasant cost at payoff
- Shows distinctive keywords per route
- Validates that cost is not just flavor but meaningfully different

### 4.4 Test Layer (P66-009)
- Marker tests: route-specific cost flags are present at expected stages
- Expression tests: player-facing text contains route-specific cost keywords
- Comparison tests: three routes produce meaningfully different cost text
- Reuse P50 / P58 / P59 / P61 test patterns
- All existing P55/P58/P59/P61/P63/P64 tests must continue to pass

---

## 5. Preserved Evidence

P66 must not regress any existing merchant trilogy evidence:

| Stage | What Must Not Regress | How Verified |
|-------|----------------------|--------------|
| P55 | Magnate chain structure and gates | Existing merchant tests in P50 |
| P58 | Apprentice bridge flags and expressions | `tests/p58ApprenticeBridgeTests.ts` |
| P59 | Tavern bridge flags and expressions | `tests/p59TavernHandBridgeTests.ts` |
| P61 | Peasant bridge flags and expressions | `tests/p61FarmPeasantBridgeTests.ts` |
| P63 | Entry differentiation (on_ramp cost label, identity) | `tests/p50SampleLineExpressionTests.ts` P63 tests |
| P64 | Pressure/payoff expression differentiation | `tests/p50SampleLineExpressionTests.ts` P64 tests |

---

## 6. Success Criteria for Scope Compliance

P66 is in-scope if and only if:

1. ✅ All runtime changes are in expression/marker layers only
2. ✅ No new events, systems, or frameworks are introduced
3. ✅ The magnate skeleton (on_ramp → pressure → payoff) is structurally unchanged
4. ✅ All P55/P58/P59/P61/P63/P64 tests continue to pass
5. ✅ Cost differentiation is runtime-visible (not just PRD text)
6. ✅ At least 3 groups of cost-specific readable signals exist
7. ✅ Three routes produce meaningfully different cost experiences

---

## 7. Boundary with P67

### P66 Completes
- Success-cost differentiation is runtime-visible
- Three routes feel like they pay different prices for success
- Cost persists and echoes through payoff phase
- Foundation laid for success-shape work

### P67 Takes Over
- Recap-line / destiny-sentence differentiation
- Success-shape exploration (if scope allows)
- Ending / final identity punchline per route
- Builds on P66's cost foundation — the ending should land harder because the cost was felt

---

## 8. Enforcement

This scope contract is enforced through:

1. **Story-by-story review** — each story is checked against this contract
2. **Test regression guard** — existing P55/P58/P59/P61/P63/P64 tests must pass
3. **Closure report audit** — P66-010 closure report must list all changes and confirm scope compliance
4. **Diff size check** — if the diff is larger than expected for expression-only changes, scope is re-evaluated

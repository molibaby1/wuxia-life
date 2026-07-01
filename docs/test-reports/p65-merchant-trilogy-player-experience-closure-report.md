# P65 Merchant Trilogy Player Experience Reconciliation Closure Report

> **Date:** 2026-06-28
> **Stage:** P65 Wuxia Merchant Trilogy Player Experience Reconciliation
> **Branch:** `codex/p65-wuxia-merchant-trilogy-player-experience-reconciliation`
> **Type:** Closure — player-experience reconciliation after the merchant trilogy differentiation package

---

## 1. Executive Summary

P65 treats `P58 + P59 + P61 + P63 + P64` as a single merchant trilogy player-route package and evaluates the player experience across three dimensions: success-cost differentiation, success-shape differentiation, and recap-line / destiny-sentence strength.

**Core finding:** The merchant trilogy has **strong entry differentiation** (bridge + entry layers feel distinct) but **thins out at pressure, payoff, and ending layers**. From a player perspective:

- ✅ "How I became a merchant" feels different across routes
- ⚠️ "What my success cost" is described differently but not felt differently
- ⚠️ "What kind of merchant I became" is flavored but not structurally different
- ❌ "What's my one-sentence life summary" has no distinct punchline at the end

**Top optimization priority for P66: Success-cost differentiation.**

---

## 2. Deliverables Inventory

### 2.1 Documentation

| Artifact | Path | Story | Status |
|----------|------|-------|--------|
| Player route audit | `docs/test-reports/p65-merchant-trilogy-player-route-audit.md` | P65-001 | ✅ Done |
| Scope contract | `docs/test-reports/p65-merchant-trilogy-experience-scope-contract.md` | P65-002 | ✅ Done |
| Experience reconciliation (3-layer eval + ranking) | `docs/test-reports/p65-merchant-trilogy-experience-reconciliation.md` | P65-003/004/005/006 | ✅ Done |
| Closure report (this document) | `docs/test-reports/p65-merchant-trilogy-player-experience-closure-report.md` | P65-008 | ✅ Done |

### 2.2 Runtime Changes

| File | Change | Nature |
|------|--------|--------|
| None | — | P65 is documentation-only; zero runtime behavior changes |

### 2.3 Validation

| Check | Result | Notes |
|-------|--------|-------|
| P58 apprentice bridge tests | ✅ Pass | 14 assertions |
| P59 tavern hand bridge tests | ✅ Pass | 16 assertions |
| P61 farm peasant bridge tests | ✅ Pass | 18 assertions |
| P50 sample line expression tests | ✅ Pass | Includes P63 + P64 differentiation tests |
| Typecheck | ✅ Pass | `tsc --noEmit` |
| P65-007 validation reinforcement | ✅ Not needed | Existing coverage sufficient |

---

## 3. Route Audit Summary (P65-001)

The merchant trilogy package consists of:
- **Three bridges**: P58 (town_apprentice), P59 (tavern_hand), P61 (farm_peasant)
- **One shared magnate chain**: P55 (magnate_on_ramp → magnate_midlife_pressure → magnate_payoff → merchant_magnate)
- **Two differentiation layers**: P63 (entry differentiation) + P64 (pressure/payoff differentiation)

### 3.1 Differentiation Strength by Layer

| Layer | Strength | Notes |
|-------|----------|-------|
| Bridge crossing | ✅ Strong | Distinct narrative, mechanism, and identity per route |
| Entry (magnate_on_ramp) | ✅ Strong | P63 delivered well — currentGoal, costLabel, age40Identity all differentiated |
| Pressure (magnate_midlife_pressure) | ⚠️ Moderate | P64 expression-only — distinct flavor but same structure |
| Payoff (magnate_payoff) | ⚠️ Moderate | P64 expression-only — flavored success, not shaped success |
| Ending / final gate | ❌ None | All converge to generic `merchant_magnate` |
| Destiny sentence | ❌ None | No distinct one-sentence life summary per route |

**Key insight:** Differentiation is strongest closest to the origin and weakest where it matters most for "what kind of life was this."

---

## 4. Three-Layer Evaluation Summary

### 4.1 Success-Cost Differentiation (P65-003)

**Verdict: ⚠️ Moderate — cost is described but not felt**

What works:
- Entry cost is distinct and felt (each bridge feels like leaving something behind)
- Pressure-stage expressions are thematically appropriate
- Cost label is memorable: "手艺与合伙的担子" / "人脉与铺子的担子" / "粮路与买卖的担子"

What's thin:
- Cost is expression-only, not mechanical — all three routes experience pressure the same way
- Cost doesn't accumulate differently per route
- Payoff doesn't reflect the cost — no "you succeeded but at what cost" feeling

Thinnest: **Peasant route at payoff phase** — "车马仓储债" reads as generic logistics cost, and the peasant's core sacrifice (leaving the land) isn't reinforced later.

### 4.2 Success-Shape Differentiation (P65-004)

**Verdict: ⚠️ Moderate-weak — success is flavored, not shaped**

What works:
- Entry shape is strongly differentiated ("手艺为基，合伙为径" / "人脉为基，引荐为径" / "力气为基，跑商为径")
- Payoff flavor matches origin well
- "Business as extension of X" metaphor works

What's thin:
- Same structure (on_ramp → pressure → payoff) with different decoration
- All three reach the same `merchant_magnate` gate
- No distinct failure modes
- Success is additive (origin + merchant), not transformative (origin changes what merchant means)

Missing force sits at **payoff/ending layer** — entry differentiation is strong, but the end doesn't deliver on the promise of distinct success shapes.

### 4.3 Recap-Line / Destiny-Sentence Strength (P65-005)

**Verdict: ⚠️ Moderate mid-journey, weak at the end**

What works:
- Origin summary is strong: "学徒出身的商人..." / "酒肆出身的商人..." / "农家出身的粮货商人..."
- Age 40 identity is well-crafted: "手艺/人脉/力气为基，合伙/引荐/跑商为径"
- Bridge memory is distinct per route

What's thin:
- No final destiny sentence — the ending just says "merchant_magnate"
- Recap gets weaker as you go later (strong at bridge → strong at entry → moderate at pressure → moderate at payoff → none at ending)
- No "one-sentence life summary" that players would remember and repeat

Weakest route: **Peasant** — "勤劳致富" is the most culturally generic success story of the three.

---

## 5. Priority Ranking (P65-006)

### 5.1 Final Ranking

| Priority | Layer | Current Strength | Player Impact if Improved | Feasibility |
|----------|-------|-----------------|--------------------------|-------------|
| **#1** | **Success-cost differentiation** | ⚠️ Moderate (expression-only) | High — makes success feel earned differently | Medium-High |
| #2 | Recap-line / destiny-sentence | ⚠️ Weak at ending | High — memorable ending punchline | High |
| #3 | Success-shape differentiation | ⚠️ Weak (flavored, not shaped) | Very high — routes feel fundamentally different | Low (scope risk) |

### 5.2 P66 Recommendation: Success-Cost Differentiation

**P66 should target success-cost differentiation as the primary next cut.**

**Why success-cost first:**
1. **Most impactful next layer** — Entry done (P63), pressure/payoff expression done (P64). Natural progression: make the cost feel real, not just described.
2. **Bounded scope** — Can be done within existing magnate skeleton. No new events, chains, or systems needed.
3. **Builds on existing work** — P64 already defined cost themes; P66 deepens what's already there.
4. **Repo-grounded** — Clear evidence: bridges establish distinct sacrifices, P63 preserves identity, P64 adds flavor — what's missing is the weight being felt at the end.

**Why not the other two first:**
- **Recap-line (#2):** High value but it's a multiplier on existing differentiation. Better to deepen the experience first, then cap it with a strong ending.
- **Success-shape (#3):** Highest potential impact but lowest feasibility and highest scope risk. True shape differentiation risks expanding into full merchant content wave.

---

## 6. Boundary With Adjacent Stages

### 6.1 P65 Completes
- Audit of merchant trilogy as one player-route package
- Three-layer evaluation (success-cost, success-shape, recap-line)
- Priority ranking of the three layers
- Clear recommendation for P66 target
- Zero runtime behavior changes (documentation-only stage)

### 6.2 P65 Does NOT Do
- No new merchant content or events
- No new systems or mechanics
- No new routes or bridges
- No full playtest platformization
- No new recap or ending system implementation

### 6.3 P66 — Success-Cost Differentiation
- **Target:** Make the cost of success feel different across the three routes
- **Scope:** Bounded — intensify cost expressions, add cost-specific payoff reflections, reinforce origin sacrifice at payoff
- **Entry point:** Builds on P64's pressure/payoff expression differentiation foundation
- **Boundary:** Does not rewrite the magnate skeleton; does not add new events or chains

### 6.4 P67 — Recap-Line / Destiny-Sentence
- **Target:** Add a distinct destiny sentence / ending punchline per route
- **Scope:** Mostly expression-level, building on existing identity signals
- **Timing:** After P66 deepens the experience, so the ending punchline has weight behind it

### 6.5 Deferred to Later
- Success-shape differentiation (full structural change)
- Full merchant content wave
- New merchant systems (economy, map, platform)
- Fourth ordinary-origin bridge
- Full playtest platformization
- Sample-line track reopening

---

## 7. Validation Evidence

### 7.1 Test Results
All existing merchant trilogy tests pass — no regressions:

| Test Suite | Status | Assertions |
|------------|--------|-----------|
| `p58ApprenticeBridgeTests` | ✅ Pass | 14 |
| `p59TavernHandBridgeTests` | ✅ Pass | 16 |
| `p61FarmPeasantBridgeTests` | ✅ Pass | 18 |
| `p50SampleLineExpressionTests` | ✅ Pass | Includes P63 + P64 differentiation tests |
| Typecheck | ✅ Pass | `tsc --noEmit` |

### 7.2 P65-007 Validation Reinforcement Assessment

**Conclusion: No additional validation needed.**

Existing evidence is sufficient to support the priority ranking:
- P58/P59/P61 bridge tests verify runtime reachability and expression differentiation
- P63 entry differentiation tests verify 3 distinct entry signals per route
- P64 pressure/payoff differentiation test verifies 6 distinct pressure/payoff signals
- All targeted proof documents exist (P58, P59, P61, P63, P64)

The priority ranking is bound to repo-grounded runtime truth, not generic product judgment.

### 7.3 P65 Success Criteria Recap

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Repo has merchant trilogy player-experience truth source | ✅ Met | `p65-merchant-trilogy-player-route-audit.md` + reconciliation doc |
| Three experience layers explicitly evaluated | ✅ Met | Reconciliation doc §2/§3/§4 |
| Highest-priority layer clearly identified | ✅ Met | Success-cost differentiation = #1 priority = P66 target |
| P66 has clear bounded entry point | ✅ Met | Closure report §6.3 |
| P58/P59/P61/P63/P64 not regressed | ✅ Met | All tests pass, no runtime changes |
| No scope creep into new merchant content | ✅ Met | Zero runtime changes, documentation-only stage |

---

## 8. Deferred Items

| Item | Reason Deferred |
|------|-----------------|
| Success-shape differentiation (structural) | High scope risk; needs full merchant wave or major payoff rewrite |
| Full merchant content wave | P65 is reconciliation, not expansion |
| New merchant systems (economy, map, platform) | Out of bounded scope |
| Fourth ordinary-origin bridge | Out of scope — P65 focuses on existing trilogy |
| Full playtest platformization | Too large for this stage |
| New recap / ending system implementation | If needed, belongs to a dedicated stage (P67 maybe) |
| New mixed-identity destinations | Out of scope |
| Sample-line track reopening | Sample-line track remains closed |

---

## 9. Story Completion

| Story | Title | Status |
|-------|-------|--------|
| P65-001 | Audit merchant trilogy as a player route package | ✅ Pass |
| P65-002 | Lock P65 experience-reconciliation scope contract | ✅ Pass |
| P65-003 | Evaluate success-cost differentiation | ✅ Pass |
| P65-004 | Evaluate success-shape differentiation | ✅ Pass |
| P65-005 | Evaluate recap-line and destiny-sentence strength | ✅ Pass |
| P65-006 | Rank the three experience layers | ✅ Pass |
| P65-007 | Add narrow validation reinforcement if needed | ✅ Pass (no additions needed) |
| P65-008 | Produce P65 closure report | ✅ Pass |

**All 8 stories complete. P65 execution complete.**

---

## 10. Final Takeaway

The merchant trilogy is currently a "**strong entrance, weak ending**" package. Players feel the difference in *how they become merchants*, but less so in *what kind of merchants they become* or *what it cost them*.

**P66 = Success-cost differentiation** is the right next step: bounded, high-impact, and builds naturally on the foundation P63 and P64 already laid.

After that, **P67 = Recap-line / destiny-sentence** will cap the experience with a memorable ending punchline.

True success-shape differentiation — making the three routes feel like fundamentally different kinds of merchant success — is the biggest prize but also the biggest scope risk. It deserves its own dedicated stage (or stages) after the cheaper, higher-probability wins are taken.

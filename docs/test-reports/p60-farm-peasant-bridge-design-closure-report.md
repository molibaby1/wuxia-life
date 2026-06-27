# P60 Farm-Peasant Bridge Design-First Closure Report

> **Date:** 2026-06-28
> **Stage:** P60 design-first wave for `farm_peasant` bridge
> **Branch:** `codex/p60-wuxia-farm-peasant-bridge-design-first-wave`
> **Type:** Design-only — no runtime code changes

---

## 1. Executive Summary

P60 resolves the `farm_peasant` bridge-direction ambiguity by running a bounded design-first stage. Before P60, `farm_peasant` was the only ordinary origin without a clear, repo-grounded bridge seed into a mixed destiny. After P60:

- The gap is fully audited and documented
- Two candidate directions are compared
- One primary direction is chosen and justified
- An implementation-ready bridge contract is produced
- P61's validation shape and success criteria are defined

**Chosen direction:** Grain-merchant adjacent — `farm_peasant` → swap-crew curiosity → grain-trade outside offer → `peasant_merchant_bridge_crossed` → P55 magnate chain → `merchant_magnate`

**Why not implementation in P60?** P60 is design-only because the gap was not just "missing a gate flag" — it was missing a clear narrative seed and downstream target. Trying to implement without this design would have risked identity collapse, scope creep, and a bridge that doesn't feel narratively grounded.

---

## 2. Deliverables Inventory

### 2.1 Audit and Scope

| Artifact | Path | Status |
|----------|------|--------|
| Gap audit | `docs/test-reports/p60-farm-peasant-bridge-gap-audit.md` | ✅ Done |
| Scope contract | `docs/test-reports/p60-farm-peasant-bridge-scope-contract.md` | ✅ Done |

### 2.2 Design and Contract

| Artifact | Path | Status |
|----------|------|--------|
| Candidate bridge seeds comparison | `docs/test-reports/p60-farm-peasant-candidate-bridge-seeds.md` | ✅ Done |
| Bridge contract (includes target selection + P61 validation shape) | `docs/PRD/p60-farm-peasant-bridge-contract.md` | ✅ Done |

### 2.3 Closure

| Artifact | Path | Status |
|----------|------|--------|
| Closure report | `docs/test-reports/p60-farm-peasant-bridge-design-closure-report.md` | 📌 This document |

**Total files created:** 5 documents, 0 runtime code changes.

---

## 3. Audit Summary

### 3.1 What Exists

`farm_peasant` currently has:
- **Early-life (10–14):** `ordinary_peasant_plow_fork` choice → `peasant_steadfast_field` / `peasant_swap_crew_curiosity`
- **Midlife (28–30):** 2 events — `ordinary_peasant_midlife_steadfast` (stay path) + `ordinary_peasant_midlife_outside_offer` (leave path)
- **Expression:** currentGoal, lifeMemory, summary branches for peasant midlife states
- **Profile:** labor/seasonal/family bias, rural background, high endurance

### 3.2 What's Missing

1. **No specific bridge seed:** `peasant_accept_outside` is vague ("去镇上试试") — it doesn't say *what kind* of work or *which path*
2. **No bridge commitment flags:** No `route_wealth_committed`, no `*_bridge_crossed` flag
3. **No downstream wiring:** Zero peasant references in `sample-lines-spine.json`
4. **No post-bridge expression:** Expression stops at "decided to leave" — no "crossed into X path" narrative

### 3.3 Why Apprentice Pattern Can't Be Reused

The P58 apprentice bridge pattern (trade curiosity → trade network → partnership → merchant) can't be directly copied because:
- Peasant starts from rural labor, not urban craft
- The "outside offer" is external/random, not built-in skill progression
- Directly forcing merchant-magnate would cause identity collapse (peasant becomes "merchant with extra steps")

---

## 4. Candidate Direction Comparison

### 4.1 Candidate A: Grain-Merchant Adjacent

- **Hook:** Swap-crew labor → grain/commodity trade → small-scale merchant
- **Downstream:** `merchant_magnate` via P55 magnate chain
- **Narrative fit:** Good — physical labor → grain trade is natural
- **System fit:** Very High — mature magnate chain + proven bridge pattern (P58/P59)
- **Scope:** Small — comparable to P58 apprentice bridge

### 4.2 Candidate B: Escort-Jianghu Renown

- **Hook:** Farm endurance → caravan guard/escort → jianghu connections
- **Downstream:** `jianghu_renown_sage` (profile-level mixed destiny)
- **Narrative fit:** Very Good — labor → escort is natural, and distinct from merchant bridges
- **System fit:** Low — `jianghu_renown_sage` has no sample-line event chain, no proven bridge pattern
- **Scope:** Large — would require building a new renown event chain, not just a bridge

### 4.3 Recommendation: Candidate A (Grain-Merchant Adjacent)

**Why:** Bounded scope, proven system pattern, and the peasant entry point is still meaningfully different from apprentice (skill→trade) and tavern_hand (network→trade):
- **Apprentice:** Craft skill → trade curiosity → partnership
- **Tavern_hand:** Guest network → ally referral → city shop
- **Peasant:** Physical labor → swap crew → grain trade

All three feed into the same magnate chain but with distinct identity, narrative framing, and expression text.

---

## 5. Chosen Bridge Summary

### 5.1 Prerequisite Chain

```
origin_farm_peasant
  + peasant_swap_crew_curiosity (childhood fork, age 10–14)
  + ordinary_peasant_midlife_outside_offer (age 30, grain-trade offer)
  + peasant_accept_outside (choice: accept offer)
    ↓
peasant_merchant_bridge_crossed + route_wealth_committed (bridge checkpoint)
    ↓
P55 magnate_on_ramp → magnate_midlife_pressure → magnate_payoff
    ↓
merchant_magnate mixed gate
```

### 5.2 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Grain-trade framing for outside offer | Distinguishes peasant entry from apprentice/tavern_hand; grounded in rural/swap-crew background |
| `peasant_merchant_bridge_crossed` as bridge flag | Follows P58/P59 pattern (each origin has its own bridge flag); enables gate expression expansion |
| Bridge flag satisfies both `magnate_on_ramp` conditions | Proven pattern from P58/P59 — single bridge flag works for both route + milestone conditions |
| Expression on existing 3 surfaces only | No new UI; follows P56/P58/P59 pattern of adding branches to currentGoal/lifeMemory/summary |
| Ordinary origin identity preserved | `detectOrdinaryOrigin()` still returns `'farm_peasant'`; bridge is "ascent from peasant background" not "became a generic merchant" |

---

## 6. Why P60 Stops at Design-Only

P60 does NOT implement the bridge. Here's why:

1. **Gap was direction ambiguity, not just missing flags:** Before P60, we didn't even know *which* downstream target made sense for peasant. Starting implementation without design would have risked building the wrong thing.

2. **Design-first reduces scope risk:** By defining the full contract before implementation, P61 knows exactly what to build — and what NOT to build. This prevents scope creep from "while we're at it" additions.

3. **Precedent from P58/P59:** Wait — P58 and P59 both did design AND implementation in one stage. Why is P60 different?
   - **P58 apprentice:** The trade-curiosity seed already existed. The direction was obvious. The gap was just wiring.
   - **P59 tavern_hand:** The ally-network seed already existed. The referral pattern was a natural extension.
   - **P60 peasant:** No clear seed existed. The direction was genuinely ambiguous. The gap was design, not just wiring.

4. **`farm_peasant` bridge feasibility was Low (per P58 discovery):** The P58 discovery phase flagged peasant as Low feasibility specifically because of missing seed direction. P60 addresses exactly that.

---

## 7. Deferred Items

The following items remain deferred — they are explicitly out of scope for P60 and should not be picked up in P61 either unless a separate stage is approved:

| Item | Reason Deferred |
|------|-----------------|
| Escort / jianghu-renown bridge direction | Good narrative idea, but no downstream event chain exists. Would need its own design+build stage. |
| `farm_peasant` → healer-swordsman medical path | No peasant-medical seed in existing assets; would need new system building |
| Rural-urban migration system | Way too big — would be a full feature, not a bridge |
| Farm / agriculture management system | Out of scope — this is about bridge direction, not farm simulation |
| Fourth ordinary origin | Explicitly forbidden per P56 scope contract |
| Full ordinary-origin rebalance | Out of scope — P60 is single-origin design |
| Sample-line track reopening | Sample-line track is closed; ordinary bridges feed into existing gates, they don't extend the track |
| Economy system / trade routes map | Platform-level change — dwarfs bridge scope |

---

## 8. Handoff to P61

### 8.1 What P61 Gets

P61 (implementation stage) receives from P60:
- ✅ A clear, repo-grounded bridge direction (grain-merchant adjacent)
- ✅ A complete bridge contract with prerequisite chain, checkpoint definition, and expression requirements
- ✅ A proven gate pattern (bridge flag satisfies both route + milestone conditions)
- ✅ Precedent from P58 (apprentice) and P59 (tavern_hand) implementations
- ✅ Defined validation shape, test coverage matrix, and success criteria

### 8.2 What P61 Should Do

1. Reframe the `ordinary_peasant_midlife_outside_offer` event text to grain-trade context
2. Add bridge flags (`peasant_merchant_bridge_crossed` + `route_wealth_committed`) to the accept option
3. Expand `magnate_on_ramp` and `merchant_midlife_debt_milestone` gate expressions
4. Add peasant-merchant bridge expression branches (currentGoal, lifeMemory, summary)
5. Write targeted proof document
6. Write narrow regression tests (~12–15 assertions)
7. Run typecheck + P56/P58/P59 regression tests
8. Write closure report

### 8.3 P61 Success Criteria (Recap)

1. Bridge is runtime-reachable from peasant origin
2. Bridge connects to P55 magnate chain (both gates accept bridge flag)
3. Bridge is player-visible on 3 expression surfaces
4. Peasant origin identity preserved after bridge
5. No regressions to P56/P58/P59
6. Documentation complete (proof + closure)

---

## 9. Validation of P60 Design Stage

P60 itself is a design-only stage. Its "success" is measured by:

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Gap is fully audited | ✅ Met | Gap audit document with 6 sections |
| At least 2 candidate directions defined | ✅ Met | Candidate document with 2 directions + comparison matrix |
| One primary direction chosen and justified | ✅ Met | Bridge contract with target selection rationale |
| Implementation-ready contract produced | ✅ Met | Bridge contract with prerequisites, checkpoint, flag additions, expression changes, edge cases |
| P61 validation shape defined | ✅ Met | Bridge contract §6 with test matrix, required/deferred validations, success criteria |
| No runtime code changes | ✅ Met | 0 files under `src/data/` or `src/core/` modified |
| Scope boundaries respected | ✅ Met | No economy/migration/ordinary-redesign expansion |

**P60 status: Complete — ready for P61 implementation.**

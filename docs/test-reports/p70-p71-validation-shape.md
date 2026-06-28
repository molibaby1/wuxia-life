# P71 Validation Shape Definition

> **Date:** 2026-06-29
> **Stage:** P70 Wuxia Selected Next Route Design-First Contract
> **Story:** P70-005 — Define P71 Validation Shape
> **Target Stage:** P71 — Playable Bridge Implementation
> **Purpose:** Fix the validation shape for P71 in advance so the playable bridge work is judged against explicit proof and regression expectations.

---

## 1. Overview

This document defines what P71 (playable bridge implementation) must prove, what tests it must pass, what counts as "bridge closed," and what validations are intentionally deferred.

**Design principle:** P71 validation follows the same pattern as the merchant trilogy bridge stages (P58, P59, P61): targeted proof + narrow regression + typecheck + existing regression suites. No full lifetime exhaust. No playtest. No browser verification unless new UI surfaces are added (they aren't).

---

## 2. Targeted Proof Chain Nodes

The P71 targeted proof document (`docs/test-reports/p71-tavern-hand-renown-bridge-targeted-proof.md`) must show the following chain nodes, in order:

### 2.1 Required Chain Nodes

| # | Node | What Must Be Shown | Evidence Type |
|---|------|--------------------|---------------|
| 1 | **Origin identity** | `origin_tavern_hand` is set; `detectOrdinaryOrigin()` returns `'tavern_hand'` | Flag state + function call |
| 2 | **Pre-bridge seed** | `ally_network` is set from childhood fork (`ordinary_tavern_network_fork` → `track_guests`) | Flag state + event reference |
| 3 | **Bridge event trigger** | Renown bridge event fires at correct age (28–30) when prerequisites met | Event selection logic |
| 4 | **Bridge checkpoint** | `tavern_renown_bridge_crossed` + `route_renown_committed` are set on `embrace_renown` choice | Flag state after choice |
| 5 | **Bridge decline path** | Decline choice does NOT set bridge flags; `ordinary_tavern_midlife_done` is set | Flag state after decline |
| 6 | **Player-facing signal 1 (currentGoal)** | `tavernCurrentGoal()` returns renown-bridge text after crossing | Expression output |
| 7 | **Player-facing signal 2 (lifeMemory)** | `tavernLifeMemory()` returns renown-bridge text after crossing | Expression output |
| 8 | **Player-facing signal 3 (summary)** | `deriveOrdinaryOriginSummary()` returns renown-branch summary | Expression output |
| 9 | **Origin identity preserved** | After bridge crossing, `detectOrdinaryOrigin()` STILL returns `'tavern_hand'` | Function call after bridge |
| 10 | **Composite gate key_choices met** | `ally_network` satisfies the `key_choices` dimension of `jianghu_renown_sage` gate | Gate evaluation output |
| 11 | **Mutual exclusivity with merchant bridge** | If merchant bridge taken (P59), renown bridge does NOT fire; and vice versa | Event non-selection evidence |

### 2.2 Not Required for P71 Proof

The following are NOT required in the P71 targeted proof (they belong to later stages):

- Full stat threshold verification (skill_growth ≥ 45, reputation ≥ 65, social_capital ≥ 55) — these are downstream spine concerns
- Renown spine events (on_ramp / pressure / payoff) — bridge stage only, not full route
- Full lifetime sim from birth to death
- Browser / UI verification
- Cross-origin comparison (all 3 ordinary bridges side by side)

---

## 3. Minimum Regression Assertions

P71 must include a test file (`tests/p71TavernHandRenownBridgeTests.ts`) with at minimum the following assertions.

### 3.1 Test Coverage Matrix

| Test Category | Assertions (min) | Priority | Notes |
|---------------|-----------------|----------|-------|
| **Bridge flag chain** | 2–3 | High | Verify all prerequisite flags and bridge checkpoint flags |
| **Prerequisite enforcement** | 2–3 | High | Bridge doesn't fire when prerequisites missing (no ally_network, wrong origin, etc.) |
| **Current goal expression** | 1–2 | High | Bridge-specific currentGoal text present |
| **Life-memory expression** | 1–2 | High | Bridge-specific lifeMemory text present |
| **Summary expression** | 1–2 | High | Bridge-specific summary text present |
| **Ordinary origin preservation** | 1–2 | Medium | `detectOrdinaryOrigin()` still returns `'tavern_hand'` after bridge |
| **Life-memory summary integration** | 1–2 | Medium | Bridge expression flows through `deriveLifeMemorySummary` |
| **Non-renown isolation** | 1–2 | Medium | Apprentice/farm_peasant not affected by renown bridge |
| **Mutual exclusivity (merchant vs renown)** | 2 | High | Taking one bridge prevents the other from firing |
| **Decline path** | 1–2 | High | Decline choice sets midlife_done but not bridge flags |
| **Composite gate key_choices** | 1–2 | Medium | `ally_network` flag satisfies renown gate's key_choices dimension |
| **Existing merchant bridge still works** | 1 | Medium | P59 tavern-merchant bridge not broken by renown bridge addition |

**Total: ~12–16 assertions** — consistent with P58 (~14), P59 (~16), and P61 (~18) scope.

### 3.2 Existing Regression Suites That Must Pass

P71 must not break any existing tests. These suites must all pass:

| Suite | Why It Matters |
|-------|----------------|
| `p56OrdinaryOriginGrowthTests` | Midlife events for all ordinary origins — renown bridge adds to this system |
| `p58ApprenticeBridgeTests` | Existing merchant bridge — must not be affected |
| `p59TavernHandBridgeTests` | Existing tavern merchant bridge — must still work alongside renown bridge |
| `p61FarmPeasantBridgeTests` | Existing peasant merchant bridge — must not be affected |
| `testLifeMemorySummary` | Summary integration — renown summary must integrate correctly |
| Typecheck (`npm run typecheck`) | All TypeScript code must compile |

---

## 4. What Counts as a "Closed Bridge"

The bridge is considered "closed" (i.e., P71 is successful) when ALL of the following criteria are met:

### 4.1 Functional Closure

1. **Bridge is runtime-reachable from tavern_hand origin:**
   - Player with `origin_tavern_hand` + `ally_network` can encounter the renown bridge event at the correct age
   - Choosing `embrace_renown` sets `tavern_renown_bridge_crossed` + `route_renown_committed`

2. **Bridge feeds into the renown path:**
   - `ally_network` satisfies the `key_choices` dimension of `jianghu_renown_sage` composite gate
   - (Stats thresholds are downstream spine concerns — bridge only needs to provide the key_choice flag)

3. **Mutual exclusivity works:**
   - Taking the merchant bridge (P59) prevents the renown bridge from firing
   - Taking the renown bridge prevents the merchant bridge from firing
   - Both use `ordinary_tavern_midlife_done` as the lock

### 4.2 Player-Visible Closure

4. **Bridge is visible on 3 expression surfaces:**
   - currentGoal: renown-bridge-specific text
   - lifeMemory: renown-bridge-specific text
   - summary: renown-branch summary text

5. **Tavern_hand identity preserved:**
   - `detectOrdinaryOrigin()` still returns `'tavern_hand'` after bridge crossing
   - Expression text reads as "tavern hand who became renown through network," not "generic renown person"

### 4.3 Quality Closure

6. **No regressions:**
   - All existing test suites pass (P56, P58, P59, P61, lifeMemorySummary)
   - Typecheck passes

7. **Documentation complete:**
   - Targeted proof document exists and covers all 11 chain nodes
   - Closure report summarizes implementation, validation, and boundaries

---

## 5. Required vs. Deferred Validations

| Validation | Status | Rationale |
|------------|--------|-----------|
| Bridge flag chain verification | ✅ Required | Core bridge functionality |
| Prerequisite enforcement | ✅ Required | Must verify bridge doesn't fire when it shouldn't |
| Expression on 3 surfaces | ✅ Required | Player-visible identity |
| Ordinary origin identity preservation | ✅ Required | Key design constraint |
| Mutual exclusivity with merchant bridge | ✅ Required | Critical for tavern_hand — two bridges must not overlap |
| Composite gate key_choices satisfaction | ✅ Required | Verifies the bridge actually connects to the target gate |
| Cross-origin regression (P56/P58/P59/P61) | ✅ Required | Must not break existing bridges |
| Typecheck | ✅ Required | Basic quality gate |
| Targeted proof document | ✅ Required | Walkthrough of the full chain |
| Full stat threshold verification (skill/rep/social_cap) | ⏳ Deferred | Downstream spine concern — bridge only provides key_choices flag |
| Renown spine events (on_ramp/pressure/payoff) | ⏳ Deferred | Belongs to P71+ implementation stages, not bridge-only P71 |
| Full lifetime sim (age 0–50) | ⏳ Deferred | Out of scope for bounded bridge |
| Browser / UI verification | ⏳ Deferred | Expression changes on existing surfaces; no new UI components |
| Playtest / human acceptance | ⏳ Deferred | Gate + expression-level verification is sufficient for bounded bridge |
| Cost differentiation | ⏳ Deferred | Later stage (P74+) — bridge entry only |
| Success-shape / destiny sentence | ⏳ Deferred | Later stage (P75+) |
| Mentor-bond bridge direction | ⏳ Deferred | Future cycle — second renown bridge |
| Farm_peasant / town_apprentice renown bridges | ⏳ Deferred | Future cycles — additional origins |

---

## 6. P71 Success Criteria (Recap)

P71 is considered successful when ALL of the following are met:

1. ✅ Bridge is runtime-reachable from tavern_hand origin with ally_network
2. ✅ Bridge checkpoint flags (`tavern_renown_bridge_crossed` + `route_renown_committed`) set on embrace choice
3. ✅ Bridge is player-visible on all 3 expression surfaces (currentGoal, lifeMemory, summary)
4. ✅ Tavern_hand identity preserved after bridge crossing
5. ✅ Mutual exclusivity with merchant bridge works correctly
6. ✅ `ally_network` satisfies `jianghu_renown_sage` gate's key_choices dimension
7. ✅ No regressions: P56, P58, P59, P61, lifeMemorySummary all pass
8. ✅ Typecheck passes
9. ✅ Targeted proof document covers all required chain nodes
10. ✅ Closure report summarizes everything accurately

---

## 7. P71 Boundary Reminder

P71 is the **implementation stage for the bridge only**. P71 must NOT:

- Add renown sample-line spine events (on_ramp / pressure / payoff)
- Design or implement entry differentiation
- Add cost differentiation
- Add success-shape or destiny sentence
- Add mentor-bond bridge direction
- Add renown bridges for other origins (farm_peasant, town_apprentice)
- Add new expression surfaces (only add branches to existing surfaces)
- Add new systems (reputation economy, faction system, etc.)

P71 implements exactly what the bridge contract defines — no more, no less.

---

**P70-005 complete.** P71 validation shape defined.

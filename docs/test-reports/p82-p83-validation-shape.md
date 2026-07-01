# P83 Validation Shape Definition

> **Date:** 2026-06-29
> **Stage:** P82 Wuxia Medical Sage Bridge Design-First Contract
> **Story:** P82-005 — Define P83 Validation Shape
> **Target Route:** `medical_sage_healer` (一代名医)
> **Input from:** `docs/PRD/p82-medical-sage-bridge-contract.md` (bridge contract defined)
> **Target Stage:** P83 — Playable Bridge Implementation
> **Purpose:** Fix the validation shape for P83 in advance so the playable bridge work is judged against explicit proof and regression expectations.

---

## 1. Overview

This document defines what P83 (playable bridge implementation) must prove, what tests it must pass, what counts as "bridge closed," and what validations are intentionally deferred.

**Design principle:** P83 validation follows the same pattern as the renown bridge stage (P71) and merchant trilogy bridge stages (P58, P59, P61): targeted proof + narrow regression + typecheck + existing regression suites. No full lifetime exhaust. No playtest. No browser verification unless new UI surfaces are added (they aren't).

---

## 2. Targeted Proof Chain Nodes

The P83 targeted proof document (`docs/test-reports/p83-tavern-hand-medical-bridge-targeted-proof.md`) must show the following chain nodes, in order:

### 2.1 Required Chain Nodes

| # | Node | What Must Be Shown | Evidence Type |
|---|------|--------------------|---------------|
| 1 | **Origin identity** | `origin_tavern_hand` is set; `detectOrdinaryOrigin()` returns `'tavern_hand'` | Flag state + function call |
| 2 | **Bridge event trigger** | Medical bridge event fires at correct age (26–30) when prerequisites met | Event selection logic |
| 3 | **Bridge checkpoint** | `tavern_medical_bridge_crossed` + `route_medical_committed` are set on `embrace_healer` choice | Flag state after choice |
| 4 | **Key-choice flag set at bridge** | `medical_pure` is set at bridge checkpoint (satisfies key_choices dim 2) | Flag state after choice |
| 5 | **Entry variant A (compassionate)** | Variant A choice sets appropriate stats/flags; has distinct narrative flavor | Flag state + expression output |
| 6 | **Entry variant B (pragmatic)** | Variant B choice sets appropriate stats/flags; has distinct narrative flavor | Flag state + expression output |
| 7 | **Bridge decline path** | Decline choice does NOT set bridge flags; `ordinary_tavern_midlife_done` is set | Flag state after decline |
| 8 | **Player-facing signal 1 (currentGoal)** | `tavernCurrentGoal()` returns medical-bridge text after crossing | Expression output |
| 9 | **Player-facing signal 2 (lifeMemory)** | `tavernLifeMemory()` returns medical-bridge text after crossing | Expression output |
| 10 | **Player-facing signal 3 (summary)** | `deriveOrdinaryOriginSummary()` returns medical-branch summary | Expression output |
| 11 | **Origin identity preserved** | After bridge crossing, `detectOrdinaryOrigin()` STILL returns `'tavern_hand'` | Function call after bridge |
| 12 | **Composite gate key_choices dim 2 met** | `medical_pure` satisfies key_choices dim 2 of `medical_sage_healer` gate | Gate evaluation output |
| 13 | **Mutual exclusivity with merchant bridge** | If merchant bridge taken (P59), medical bridge does NOT fire; and vice versa | Event non-selection evidence |
| 14 | **Mutual exclusivity with renown bridge** | If renown bridge taken (P71), medical bridge does NOT fire; and vice versa | Event non-selection evidence |

### 2.2 Not Required for P83 Proof

The following are NOT required in the P83 targeted proof (they belong to later stages):

- Full stat threshold verification (reputation ≥ 55, resources ≥ 30) — these are downstream spine concerns
- `medical_divine_doctor_fame` key_choice (dim 1) — this is set by post-bridge spine events
- Medical spine events (on_ramp / pressure / payoff) — bridge stage only, not full route
- Full lifetime sim from birth to death
- Browser / UI verification
- Cross-origin comparison (all 3 ordinary bridges side by side)
- Poison path (`medical_poison_path`) — alternative path, not the focus of this bridge

---

## 3. Minimum Regression Assertions

P83 must include a test file (`tests/p83TavernHandMedicalBridgeTests.ts`) with at minimum the following assertions.

### 3.1 Test Coverage Matrix

| Test Category | Assertions (min) | Priority | Notes |
|---------------|-----------------|----------|-------|
| **Bridge flag chain** | 3–4 | High | Verify all prerequisite flags and bridge checkpoint flags (bridge_crossed, route_committed, medical_pure, medical_talent) |
| **Prerequisite enforcement** | 2–3 | High | Bridge doesn't fire when prerequisites missing (wrong origin, midlife_done already set, etc.) |
| **Entry variants (2 variants)** | 2–3 | High | Both variants set distinct stats/flags; both have correct expressions |
| **Current goal expression** | 1–2 | High | Bridge-specific currentGoal text present |
| **Life-memory expression** | 1–2 | High | Bridge-specific lifeMemory text present |
| **Summary expression** | 1–2 | High | Bridge-specific summary text present |
| **Ordinary origin preservation** | 1–2 | Medium | `detectOrdinaryOrigin()` still returns `'tavern_hand'` after bridge |
| **Life-memory summary integration** | 1–2 | Medium | Bridge expression flows through `deriveLifeMemorySummary` |
| **Non-medical isolation** | 1–2 | Medium | Apprentice/farm_peasant not affected by medical bridge |
| **Mutual exclusivity (merchant vs medical)** | 2 | High | Taking one bridge prevents the other from firing |
| **Mutual exclusivity (renown vs medical)** | 2 | High | Taking one bridge prevents the other from firing |
| **Decline path** | 1–2 | High | Decline choice sets midlife_done but not bridge flags |
| **Composite gate key_choices dim 2** | 1–2 | Medium | `medical_pure` flag satisfies medical gate's key_choices dim 2 |
| **Existing merchant bridge still works** | 1 | Medium | P59 tavern-merchant bridge not broken by medical bridge addition |
| **Existing renown bridge still works** | 1 | Medium | P71 tavern-renown bridge not broken by medical bridge addition |

**Total: ~15–20 assertions** — consistent with P59 (~16), P61 (~18), P71 (~15) scope. Slightly more than renown because of 2 entry variants + 2 mutual exclusivity pairs.

### 3.2 Existing Regression Suites That Must Pass

P83 must not break any existing tests. These suites must all pass:

| Suite | Why It Matters |
|-------|----------------|
| `p56OrdinaryOriginGrowthTests` | Midlife events for all ordinary origins — medical bridge adds to this system |
| `p58ApprenticeBridgeTests` | Existing merchant bridge — must not be affected |
| `p59TavernHandBridgeTests` | Existing tavern merchant bridge — must still work alongside medical bridge |
| `p61FarmPeasantBridgeTests` | Existing peasant merchant bridge — must not be affected |
| `p71TavernHandRenownBridgeTests` | Existing tavern renown bridge — must still work alongside medical bridge |
| `p72TavernHandRenownEntryDifferentiationTests` | Existing renown entry differentiation — must not be affected |
| `testLifeMemorySummary` | Summary integration — medical summary must integrate correctly |
| Typecheck (`npm run typecheck`) | All TypeScript code must compile |

---

## 4. What Counts as a "Closed Bridge"

The bridge is considered "closed" (i.e., P83 is successful) when ALL of the following criteria are met:

### 4.1 Functional Closure

1. **Bridge is runtime-reachable from tavern_hand origin:**
   - Player with `origin_tavern_hand` can encounter the medical bridge event at the correct age
   - Choosing `embrace_healer` (either variant) sets `tavern_medical_bridge_crossed` + `route_medical_committed`

2. **Bridge feeds into the medical path:**
   - `medical_pure` is set at bridge checkpoint and satisfies key_choices dim 2 of `medical_sage_healer` composite gate
   - (Stats thresholds + medical_divine_doctor_fame are downstream spine concerns — bridge only needs to provide the entry point + medical_pure)

3. **Entry variants work:**
   - At least 2 distinct variants (compassionate / pragmatic)
   - Each variant has different stat effects and/or flag combinations
   - Each variant has distinct narrative flavor

4. **Mutual exclusivity works:**
   - Taking the merchant bridge (P59) prevents the medical bridge from firing
   - Taking the renown bridge (P71) prevents the medical bridge from firing
   - Taking the medical bridge prevents both merchant and renown bridges from firing
   - All use `ordinary_tavern_midlife_done` as the lock

### 4.2 Player-Visible Closure

5. **Bridge is visible on 3 expression surfaces:**
   - currentGoal: medical-bridge-specific text
   - lifeMemory: medical-bridge-specific text
   - summary: medical-branch summary text

6. **Tavern_hand identity preserved:**
   - `detectOrdinaryOrigin()` still returns `'tavern_hand'` after bridge crossing
   - Expression text reads as "tavern hand who became a healer through self-study," not "generic medical sage"

### 4.3 Quality Closure

7. **No regressions:**
   - All existing test suites pass (P56, P58, P59, P61, P71, P72, lifeMemorySummary)
   - Typecheck passes

8. **Documentation complete:**
   - Targeted proof document exists and covers all 14 chain nodes
   - Closure report summarizes implementation, validation, and boundaries

---

## 5. Required vs. Deferred Validations

| Validation | Status | Rationale |
|------------|--------|-----------|
| Bridge flag chain verification | ✅ Required | Core bridge functionality |
| Prerequisite enforcement | ✅ Required | Must verify bridge doesn't fire when it shouldn't |
| Entry variants (2 variants) | ✅ Required | Core contract requirement — at least 2 entry variants |
| Expression on 3 surfaces | ✅ Required | Player-visible identity |
| Ordinary origin identity preservation | ✅ Required | Key design constraint |
| Mutual exclusivity with merchant bridge | ✅ Required | Critical for tavern_hand — three bridges must not overlap |
| Mutual exclusivity with renown bridge | ✅ Required | Critical for tavern_hand — three bridges must not overlap |
| Composite gate key_choices dim 2 (medical_pure) | ✅ Required | Verifies the bridge actually connects to the target gate |
| Cross-origin regression (P56/P58/P59/P61/P71/P72) | ✅ Required | Must not break existing bridges |
| Typecheck | ✅ Required | Basic quality gate |
| Targeted proof document | ✅ Required | Walkthrough of the full chain |
| Full stat threshold verification (reputation / resources) | ⏳ Deferred | Downstream spine concern — bridge only provides entry + medical_pure |
| Key_choices dim 1 (medical_divine_doctor_fame) | ⏳ Deferred | Post-bridge spine concern — set during on-ramp or pressure stage |
| Medical spine events (on_ramp/pressure/payoff) | ⏳ Deferred | Belongs to P84+ implementation stages, not bridge-only P83 |
| Full lifetime sim (age 0–50) | ⏳ Deferred | Out of scope for bounded bridge |
| Browser / UI verification | ⏳ Deferred | Expression changes on existing surfaces; no new UI components |
| Playtest / human acceptance | ⏳ Deferred | Gate + expression-level verification is sufficient for bounded bridge |
| Cost differentiation | ⏳ Deferred | Later stage (P86+) — bridge entry only |
| Success-shape / destiny sentence | ⏳ Deferred | Later stage (P87+) |
| Social-momentum healer bridge direction | ⏳ Deferred | Future cycle — second medical bridge |
| Farm_peasant / town_apprentice medical bridges | ⏳ Deferred | Future cycles — additional origins |
| Poison path (medical_poison_path) | ⏳ Deferred | Alternative medical route, not the focus of this bridge |

---

## 6. Boundary with P33 Medical Short-Chain Validation

P33 validated the habit-led medical short-chain (studyHabit → p27 → p29 → medical_sage_healer unlock from poor_family origin). P83 validates a different thing: the ordinary-origin midlife bridge.

| Dimension | P33 Validation | P83 Validation |
|-----------|---------------|----------------|
| **Origin** | `poor_family` (vivid tier) | `tavern_hand` (ordinary tier) |
| **Entry mechanism** | Habit-led sim events (p27/p29) | Midlife bridge event (new) |
| **What's proved** | Event-driven unlock from habit-led sim | Playable bridge from ordinary origin |
| **Key flags set** | `medical_pure` + `medical_divine_doctor_fame` | `tavern_medical_bridge_crossed` + `route_medical_committed` + `medical_pure` |
| **Expression** | None (habit-led sim only) | 3 expression surfaces (currentGoal, lifeMemory, summary) |
| **Mutual exclusivity** | Not applicable (only one path) | Critical (3 bridges from tavern_hand) |

P83 builds on P33's foundation but is a distinct validation. P33 proved that `medical_sage_healer` can be unlocked via event-driven JSON paths; P83 proves there's a playable bridge from an ordinary origin with full player-facing expression.

---

## 7. P83 Success Criteria (Recap)

P83 is considered successful when ALL of the following are met:

1. ✅ Bridge is runtime-reachable from tavern_hand origin
2. ✅ Bridge checkpoint flags (`tavern_medical_bridge_crossed` + `route_medical_committed`) set on embrace choice
3. ✅ `medical_pure` set at bridge checkpoint (satisfies key_choices dim 2)
4. ✅ At least 2 entry variants with distinct stats/flags/flavor
5. ✅ Bridge is player-visible on all 3 expression surfaces (currentGoal, lifeMemory, summary)
6. ✅ Tavern_hand identity preserved after bridge crossing
7. ✅ Mutual exclusivity with merchant AND renown bridges works correctly
8. ✅ `medical_pure` satisfies `medical_sage_healer` gate's key_choices dim 2
9. ✅ No regressions: P56, P58, P59, P61, P71, P72, lifeMemorySummary all pass
10. ✅ Typecheck passes
11. ✅ Targeted proof document covers all required chain nodes
12. ✅ Closure report summarizes everything accurately

---

## 8. P83 Boundary Reminder

P83 is the **implementation stage for the bridge only**. P83 must NOT:

- Add medical sample-line spine events (on_ramp / pressure / payoff)
- Design or implement full entry differentiation beyond the 2 variants defined in the contract
- Add cost differentiation
- Add success-shape or destiny sentence
- Add social-momentum healer bridge direction
- Add medical bridges for other origins (farm_peasant, town_apprentice)
- Add new expression surfaces (only add branches to existing surfaces)
- Add new systems (herbalism system, clinic management, etc.)
- Implement poison path as a main route

P83 implements exactly what the bridge contract defines — no more, no less.

---

**P82-005 complete.** P83 validation shape defined.

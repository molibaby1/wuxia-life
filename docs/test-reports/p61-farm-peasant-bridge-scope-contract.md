# P61 Farm-Peasant Bridge Scope Contract (P61-002)

Generated: 2026-06-28

## Purpose

This document locks the scope for P61 (farm-peasant playable bridge implementation). P61 is a strict implementation stage that follows the P60-approved bridge contract. No direction redesign, no new systems, no scope expansion.

## 1. Allowed Layers (What P61 Does)

P61 may implement only the following layers, all bounded by the P60 bridge contract:

### 1.1 Configuration Wiring
- **Reframe existing event text:** `ordinary_peasant_midlife_outside_offer` prompt + option labels → grain-trade context
- **Add flags to existing option:** `accept_offer` sets `route_wealth_committed` + `peasant_merchant_bridge_crossed`
- **Expand existing gate expressions:** `magnate_on_ramp` + `merchant_midlife_debt_milestone` accept `peasant_merchant_bridge_crossed`
- **Carrier:** Existing `ordinary-origin-midlife.json` and `sample-lines-spine.json` — no new config files

### 1.2 Light Expression
- **Add branches to existing surfaces only:**
  - `peasantCurrentGoal()` — bridge-crossed state branch
  - `peasantLifeMemory()` — bridge-crossed state branch
  - `deriveOrdinaryOriginSummary()` — peasant-merchant branch
- **No new UI components** — all expression on existing surfaces
- **Peasant-identity-preserving:** Text reads as "农家出身的粮货商人", not "generic merchant"

### 1.3 Targeted Proof
- **One targeted proof document:** `docs/test-reports/p61-farm-peasant-magnate-targeted-proof.md`
- **Proof content:** Config evidence + expression evidence + gate evaluation simulation + flag chain trace
- **No reliance on direct terminal-flag seeding:** Proof walks through the runtime flag flow

### 1.4 Narrow Regression Tests
- **Test file:** `tests/p61FarmPeasantBridgeTests.ts`
- **Assertion count:** ~12–15 assertions
- **Coverage areas:**
  - Bridge gate flags (2–3 assertions)
  - Prerequisite enforcement (2–3 assertions)
  - Current goal expression (1–2 assertions)
  - Life-memory expression (1–2 assertions)
  - Summary expression (1–2 assertions)
  - Ordinary origin preservation (1–2 assertions)
  - Life-memory summary integration (1–2 assertions)
  - Non-peasant isolation (1–2 assertions)
  - `magnate_on_ramp` gate acceptance (2 assertions)
  - `magnate_on_ramp` rejection without bridge (1 assertion)
  - `merchant_midlife_debt` gate acceptance (1 assertion)
  - Generic merchant path still works (1 assertion)
- **Harness reuse:** Same pattern as P58/P59 bridge tests — no new test framework

### 1.5 Closure Documentation
- **Intake document:** P61-001 (already done)
- **Scope contract:** This document (P61-002)
- **Targeted proof:** P61-006
- **Closure report:** P61-008 — summarizes all evidence and boundaries

## 2. Forbidden Expansions (What P61 Does NOT Do)

The following are explicitly out of scope for P61. If any of these become necessary, stop and escalate — do NOT implement them in P61.

### 2.1 Direction Redesign
- **No bridge direction change:** Grain-merchant adjacent is the only approved direction
- **No second candidate path:** No escort/jianghu-renown or medical-swordsman alternatives
- **No re-arguing P60 conclusions:** P60 direction is locked; P61 implements it

### 2.2 New Systems
- **No new event systems or framework:** All content via existing config carriers
- **No new destiny framework:** Existing `merchant_magnate` gate reused
- **No new expression surfaces:** Only branches on existing P56 surfaces
- **No new test harness:** Existing test pattern reused

### 2.3 Content Expansion
- **No new event IDs:** 0 new events; existing event reframed only
- **No new choice structures:** 0 new choices; existing options repurposed
- **No mid-chain content:** Bridge connects to P55 chain at `magnate_on_ramp`; no in-between events
- **No late-life expansion:** P55 magnate chain handles late-life; P61 doesn't extend it
- **No fourth ordinary origin:** Explicitly forbidden per P56 scope contract

### 2.4 Systemic Changes
- **No economy system:** No trade routes map, no commodity pricing, no supply/demand
- **No migration system:** No rural-urban migration mechanics
- **No farm management:** No agriculture simulation, no crop rotation, no farm upgrades
- **No ordinary-origin rebalance:** P61 adds one bridge; doesn't rebalance existing origins

### 2.5 Validation Expansion
- **No full lifetime sim:** Bounded proof only; not age 0–50 exhaust
- **No browser/UI verification:** Expression changes on existing surfaces only
- **No playtest/human acceptance:** Gate + expression-level verification sufficient
- **No combinatorial exhaust:** Narrow targeted tests only

## 3. Boundary With Adjacent Stages

### 3.1 vs P60 (Design-First)
- **P60:** Gap audit, candidate comparison, direction selection, bridge contract design, validation shape definition
- **P61:** Implementation of the P60-approved contract — config wiring, expression, proof, tests
- **Handshake point:** P60 bridge contract (`docs/PRD/p60-farm-peasant-bridge-contract.md`) is the single source of truth for what P61 builds

### 3.2 vs P58 (Apprentice Bridge)
- **P58:** `town_apprentice` → craft skill → trade curiosity → partnership → `apprentice_merchant_bridge_crossed` → magnate chain
- **P61:** `farm_peasant` → physical labor → swap crew → grain trade → `peasant_merchant_bridge_crossed` → magnate chain
- **Shared downstream:** Both enter P55 magnate chain at `magnate_on_ramp`
- **Distinct identity:** Each has its own bridge flag, narrative framing, and expression text

### 3.3 vs P59 (Tavern-Hand Bridge)
- **P59:** `tavern_hand` → guest network → ally referral → city shop → `tavern_merchant_bridge_crossed` → magnate chain
- **P61:** `farm_peasant` → swap crew → grain trade → `peasant_merchant_bridge_crossed` → magnate chain
- **Shared downstream:** Both enter P55 magnate chain at `magnate_on_ramp`
- **Distinct identity:** Each has its own bridge flag, narrative framing, and expression text

### 3.4 vs P55 (Magnate Chain)
- **P55:** Implements `magnate_on_ramp`, `magnate_midlife_pressure`, `magnate_payoff` spine events
- **P61:** Expands gate expressions to accept `peasant_merchant_bridge_crossed` — does NOT modify magnate chain content
- **Boundary:** P61 touches gate conditions only; P55 event content and effects unchanged

## 4. Success Criteria

P61 is successful when ALL of the following are met:

1. **Bridge is runtime-reachable:** Peasant origin with swap-crew curiosity + accept-outside choice sets `peasant_merchant_bridge_crossed` + `route_wealth_committed`
2. **Bridge connects to magnate chain:** `peasant_merchant_bridge_crossed` satisfies both conditions of `magnate_on_ramp` gate AND `merchant_midlife_debt_milestone` gate
3. **Bridge is player-visible:** All three expression surfaces (currentGoal, lifeMemory, summary) have peasant-merchant bridge branches with distinct text
4. **Peasant identity preserved:** `detectOrdinaryOrigin()` still returns `'farm_peasant'` after bridge crossing
5. **No regressions:** P56, P58, P59 test suites all pass; typecheck passes
6. **Documentation complete:** Targeted proof + closure report exist and accurately describe the bridge

## 5. Rollback Condition

If implementation reveals that the P60-approved contract cannot be landed within this scope (e.g., requires new systems or breaks identity), P61 should:
1. Halt implementation
2. Document the gap
3. Revert to a contract-preserving minimum
4. Report back for a new design stage

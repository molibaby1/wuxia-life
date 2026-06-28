# P71 Selected Route Bridge Scope Contract

> **Date:** 2026-06-29
> **Stage:** P71 Wuxia Selected Next Route Playable Bridge
> **Story:** P71-002 — Lock P71 runtime scope contract
> **Selected Route:** `jianghu_renown_sage` (江湖名宿)
> **Bridge:** Ally-Network Midlife Bridge — `tavern_hand` + `ally_network` → midlife bridge event → `tavern_renown_bridge_crossed` → `jianghu_renown_sage`

---

## 1. Purpose

This document locks the runtime scope of P71 to prevent scope creep into later differentiation stages. P71 is a **playable bridge stage** — its sole purpose is to close the minimum runtime bridge from `tavern_hand` to `jianghu_renown_sage`, with player-visible expression and verifiable proof. It is NOT a differentiation stage, NOT a content densification stage, and NOT a full-route implementation stage.

---

## 2. Allowed Scope (What P71 Does)

P71 is limited to **four layers**:

### Layer 1: Bridge Wiring
- Add one new midlife event to `ordinary-origin-midlife.json`
- Add two new flags: `tavern_renown_bridge_crossed`, `route_renown_committed`
- Event condition: `ally_network && !ordinary_tavern_midlife_done`
- Event age: 28-30
- Two choices: `embrace_renown` (accept) and `stay_in_tavern` (decline)
- Stat effects on choices (small bonuses to reputation, connections, martialPower)
- No new route framework, no new systems

### Layer 2: Bridge Expression
- Add renown bridge branch to `tavernCurrentGoal()` in `ordinaryOriginExpression.ts`
- Add renown bridge branch to `tavernLifeMemory()` in `ordinaryOriginExpression.ts`
- Add renown bridge branch to `deriveOrdinaryOriginSummary()` in `ordinaryOriginExpression.ts`
- Only branches on existing expression surfaces
- No new UI components, no new expression surfaces

### Layer 3: Targeted Proof
- One targeted proof document covering the full chain: seed → bridge → gate
- 11 chain nodes as defined in `docs/test-reports/p70-p71-validation-shape.md`
- No full lifetime sim, no comparative exhaust

### Layer 4: Narrow Regression Tests
- One new test file: `tests/p71TavernHandRenownBridgeTests.ts`
- ~14-16 assertions covering:
  - Bridge flag chain
  - Prerequisite enforcement
  - Expression on 3 surfaces
  - Ordinary origin preservation
  - Mutual exclusivity with merchant bridge
  - Decline path
  - Non-renown isolation
  - Composite gate key_choices satisfaction
- Reuse existing test harness patterns from P59/P61
- No rewrite of full route test suite

---

## 3. Forbidden Expansions (What P71 Does NOT Do)

The following are explicitly **out of scope** for P71. If any of these become necessary, stop and escalate — they belong to later stages.

### 3.1 Entry Densification (Forbidden)
- No additional childhood or youth events for the renown path
- No additional pre-bridge midlife events
- No new origin seeds or forks
- Belongs to: P72+ (entry differentiation stage)

### 3.2 Pressure / Payoff Work (Forbidden)
- No renown sample-line spine events (on_ramp / pressure / payoff)
- No renown-specific cost labels or pressure expression
- No renown payoff events or outcomes
- Belongs to: P73+ (pressure/payoff differentiation)

### 3.3 New Systems (Forbidden)
- No reputation economy system
- No faction system
- No jianghu social network system
- No new expression frameworks or UI surfaces
- No new route framework
- These are platform-level changes, not bridge-level

### 3.4 Full Route Implementation (Forbidden)
- No full lifetime sim from birth to death
- No complete renown route content wave
- No renown ending differentiation
- No success-shape or destiny sentence
- Belongs to: P72-P75+ (multiple stages)

### 3.5 Additional Bridges (Forbidden)
- No mentor-bond bridge direction
- No farm_peasant renown bridge
- No town_apprentice renown bridge
- These are future cycles, not P71

---

## 4. P71 / P72 Boundary

| Aspect | P71 (This Stage) | P72 (Next Stage) |
|--------|-------------------|-------------------|
| **Focus** | Playable bridge closure | Entry differentiation |
| **Content** | 1 bridge event | On-ramp spine + entry flavor |
| **Expression** | 3 bridge branches on existing surfaces | Entry-specific expression, cost label |
| **Stats** | Small bridge-event bonuses | Full stat progression through spine |
| **Proof** | Targeted bridge chain proof | Full entry-to-gate proof |
| **Tests** | Narrow regression | Expanded regression + entry-specific tests |
| **Identity** | "Can reach renown from tavern_hand" | "Renown entry feels distinct from merchant" |

**Handoff criteria from P71 to P72:**
1. ✅ Bridge is runtime-reachable from tavern_hand with ally_network
2. ✅ Bridge checkpoint flags set on embrace choice
3. ✅ Bridge is player-visible on all 3 expression surfaces
4. ✅ Tavern_hand identity preserved after bridge crossing
5. ✅ Mutual exclusivity with merchant bridge works
6. ✅ ally_network satisfies jianghu_renown_sage gate's key_choices
7. ✅ No regressions in existing test suites
8. ✅ Typecheck passes
9. ✅ Targeted proof document complete
10. ✅ Closure report accurate

When ALL 10 criteria are met, P71 is done and P72 can begin.

---

## 5. Scope Guardrails

To keep P71 bounded, observe the following guardrails:

### Guardrail 1: One New Event Maximum
P71 adds exactly **one** new event to `ordinary-origin-midlife.json` (the renown bridge event). No more. If additional events seem needed, they belong to P72+.

### Guardrail 2: Three Expression Branches Maximum
P71 adds exactly **three** expression branches (currentGoal, lifeMemory, summary). No new surfaces, no new components.

### Guardrail 3: No New Flags Beyond Bridge Checkpoint
P71 adds exactly **two** new flags: `tavern_renown_bridge_crossed` and `route_renown_committed`. If more flags seem necessary, they likely belong to later stages.

### Guardrail 4: No Test Suite Rewrites
P71 adds one new test file. It does NOT modify existing test suites except to verify they still pass. If existing tests need changes to accommodate the bridge, minimize the change and document why.

### Guardrail 5: No New Dependencies
P71 introduces zero new npm dependencies, zero new frameworks, zero new systems.

---

## 6. Quality Bar

Even though P71 is a bounded bridge stage, it must meet the following quality bar:

- **Typecheck:** `npm run typecheck` must pass
- **Existing tests:** P56, P58, P59, P61, lifeMemorySummary all pass
- **New tests:** All P71 regression assertions pass
- **Expression:** All 3 surfaces have bridge-specific text
- **Identity:** tavern_hand origin preserved after bridge crossing
- **Proof:** Targeted proof covers all 11 chain nodes
- **Documentation:** Closure report is accurate and complete

---

## 7. Scope Escalation Path

If during implementation it becomes clear that P71 scope is insufficient to close a playable bridge (e.g., the composite gate needs changes that weren't anticipated, or the event system has hidden constraints), follow this path:

1. **Stop** — don't silently expand scope
2. **Document** the gap in `progress.txt`
3. **Assess** whether the gap is truly required for a playable bridge or is differentiation
4. If truly required for bridge closure: add to P71 with explicit justification
5. If it's differentiation: defer to P72+

---

## 8. Contract Signature

This scope contract is approved as the bounding document for P71 implementation. All user stories (P71-001 through P71-007) must operate within these bounds.

**Approved scope:** Bridge wiring + bridge expression + targeted proof + narrow regression tests.

**Forbidden:** Entry densification, pressure/payoff work, new systems, additional bridges, full route implementation.

---

**P71-002 complete.** Runtime scope contract saved.

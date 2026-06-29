# P83 Medical Sage Bridge Implementation Delta Audit

> **Date:** 2026-06-29
> **Stage:** P83 Wuxia Medical Sage Bridge Playable Implementation
> **Story:** P83-001 — Audit Implementation Delta Against The Bridge Contract
> **Input from:** `docs/PRD/p82-medical-sage-bridge-contract.md`, `docs/test-reports/p82-p83-validation-shape.md`
> **Purpose:** List the minimum implementation points needed for P83 by comparing current repo state against the approved bridge contract.

---

## 1. Executive Summary

The medical sage bridge from `tavern_hand` to `medical_sage_healer` requires **small, well-bounded changes** — comparable in scope to the renown bridge (P71), with entry differentiation built in from the start.

**Total delta estimate:**
- 1 new event in `ordinary-origin-midlife.json`
- ~3 expression branches in `ordinaryOriginExpression.ts`
- 1 new test file (~15–20 assertions)
- 3 documentation artifacts (audit / scope / closure)
- 1 targeted proof document
- Zero new frameworks, zero new systems

---

## 2. Existing Wiring That Can Be Reused Directly

### 2.1 Midlife Event System

**Reusable as-is:**
- Event structure in `ordinary-origin-midlife.json` — same `choices[]` pattern with `originId`, `ageMin/ageMax`, `conditions`, `options`
- `ordinary_tavern_midlife_done` flag as mutual-exclusivity lock — already used by merchant bridge (P59) and renown bridge (P71)
- Stat effect format (`stat_modify` with `add` operator) — consistent across all midlife events

**Evidence:** P56 ordinary origin growth wave, P59 tavern-hand merchant bridge, P71 tavern-hand renown bridge all use this exact pattern.

### 2.2 Expression Surfaces (3 Surfaces)

**Reusable as-is:**
- `tavernCurrentGoal()` in `ordinaryOriginExpression.ts` — existing pattern with flag-checked branches for merchant bridge + renown bridge + on-ramp + pressure + payoff + late-life + endgame
- `tavernLifeMemory()` in `ordinaryOriginExpression.ts` — same pattern, with variant-specific text for each branch
- `deriveOrdinaryOriginSummary()` in `ordinaryOriginExpression.ts` — same pattern, tavern_hand section already has 10+ branches
- `detectOrdinaryOrigin()` — no changes needed; tavern_hand identity preserved

**Evidence:** Renown bridge (P71) added exactly 3 branches to these 3 functions. Medical bridge follows the same pattern.

### 2.3 Mutual Exclusivity Mechanism

**Reusable as-is:**
- `ordinary_tavern_midlife_done` flag — set by every tavern_hand midlife event; prevents subsequent events from firing
- All three bridges (merchant, renown, medical) check `!flags.has('ordinary_tavern_midlife_done')` in their conditions

**Evidence:** P59 merchant bridge and P71 renown bridge both use this mechanism. Adding medical bridge is a simple third participant in the same lock.

### 2.4 Composite Gate Evaluation

**Reusable as-is:**
- `medical_sage_healer` composite destiny gate in `wuxiaOriginSurfaces.ts` — already defined with 4 dimensions (reputation, resources, key_choices dim 1, key_choices dim 2)
- `medical_pure` already recognized as satisfying key_choices dim 2
- `evaluateCompositeDestinyOutcome()` function — no changes needed

**Evidence:** P33 short-chain proof and P34 lifetime sim both verify the gate works with `medical_pure` + `medical_divine_doctor_fame`.

### 2.5 Test Harness

**Reusable as-is:**
- Existing test pattern from `p71TavernHandRenownBridgeTests.ts` — flag setup, expression checks, origin preservation, mutual exclusivity
- `run-all-tests.ts` infrastructure
- Typecheck via `npm run typecheck`

---

## 3. Files / Configs / Code Points That Need Addition or Modification

### 3.1 Configuration (Runtime Changes)

| File | Change | Nature |
|------|--------|--------|
| `src/data/lines/ordinary-origin-midlife.json` | Add 1 new event: `ordinary_tavern_midlife_medical_bridge` (age 26–30, tavern_hand only) | New event with 3 choices |

**Event details:**
- **Event ID:** `ordinary_tavern_midlife_medical_bridge`
- **Age:** 28 (between merchant bridge at 27 and renown bridge at 29 — natural ordering)
- **Prerequisite condition:** `!flags.has('ordinary_tavern_midlife_done')` (mutual exclusivity)
- **Choice A (仁心医者 / Compassionate Healer):**
  - Flags: `tavern_midlife_medical_bridge`, `tavern_embrace_compassionate_healer`, `tavern_medical_bridge_crossed`, `route_medical_committed`, `medical_pure`, `medical_talent`, `ordinary_tavern_midlife_done`
  - Stats: +chivalry, +reputation, slightly lower resources
- **Choice B (世故人医 / Pragmatic Healer):**
  - Flags: `tavern_midlife_medical_bridge`, `tavern_embrace_pragmatic_healer`, `tavern_medical_bridge_crossed`, `route_medical_committed`, `medical_pure`, `medical_talent`, `ordinary_tavern_midlife_done`
  - Stats: +reputation, +money/resources, slightly lower chivalry
- **Choice C (婉拒 / Decline):**
  - Flags: `tavern_midlife_medical_bridge`, `tavern_decline_medical`, `ordinary_tavern_midlife_done`
  - Stats: minor +comprehension or +charisma

**Note on `medical_pure` idempotency:** The bridge event sets `medical_pure`, but if the player already has it from habit-led events (p27_study_habit_healer_reinforcement), there's no change — flag systems are inherently idempotent (setting a flag that's already set is a no-op). No special handling needed.

### 3.2 Expression Code (Runtime Changes)

| File | Change | Nature |
|------|--------|--------|
| `src/p56/ordinaryOriginExpression.ts` | Add medical bridge branch to `tavernCurrentGoal()` | 1 new if-branch (checks `tavern_medical_bridge_crossed`) |
| `src/p56/ordinaryOriginExpression.ts` | Add medical bridge branch to `tavernLifeMemory()` | 1 new if-branch with 2 variant sub-branches (compassionate / pragmatic) |
| `src/p56/ordinaryOriginExpression.ts` | Add tavern-hand medical branch to `deriveOrdinaryOriginSummary()` | 1 new if-branch (checks `tavern_medical_bridge_crossed`) |

**Placement order:**
- `tavernCurrentGoal()`: Insert between `tavern_renown_bridge_crossed` and `tavern_merchant_bridge_crossed` (or after renown, before merchant — medical is a mainstream-tier path like renown)
- `tavernLifeMemory()`: Same placement logic
- `deriveOrdinaryOriginSummary()`: Insert after renown bridge branch, before merchant bridge branch

### 3.3 Tests (New File)

| File | Change | Nature |
|------|--------|--------|
| `tests/p83TavernHandMedicalBridgeTests.ts` | New test file with ~15–20 assertions | New file, follows P71 pattern |

**Test groups (from validation shape):**
1. Bridge flag chain (bridge_crossed, route_committed, medical_pure, medical_talent)
2. Prerequisite enforcement (wrong origin, midlife_done)
3. 2 entry variants (compassionate + pragmatic, distinct stats/flags)
4. 3 expression surfaces (currentGoal, lifeMemory, summary)
5. Ordinary origin preservation (detectOrdinaryOrigin() still returns tavern_hand)
6. Life-memory summary integration
7. Non-medical isolation (apprentice / farm_peasant unaffected)
8. Mutual exclusivity: merchant vs medical (2 directions)
9. Mutual exclusivity: renown vs medical (2 directions)
10. Decline path (midlife_done set, bridge flags not set)
11. Composite gate key_choices dim 2 (medical_pure satisfies gate)
12. Existing merchant bridge still works
13. Existing renown bridge still works

### 3.4 Documentation (No Runtime Changes)

| File | Story | Nature |
|------|-------|--------|
| `docs/test-reports/p83-medical-sage-bridge-implementation-audit.md` | US-001 | This document |
| `docs/test-reports/p83-medical-sage-bridge-scope-contract.md` | US-002 | Scope guardrails |
| `docs/test-reports/p83-tavern-hand-medical-bridge-targeted-proof.md` | US-005 | Targeted proof (14 chain nodes) |
| `docs/test-reports/p83-medical-sage-bridge-playable-closure-report.md` | US-007 | Closure report |

---

## 4. Delta Comparison with Renown Bridge (P71)

| Dimension | P71 Renown Bridge | P83 Medical Bridge (This Stage) |
|-----------|-------------------|----------------------------------|
| New events | 1 | 1 |
| Choices per event | 2 (embrace / decline) | 3 (compassionate / pragmatic / decline) |
| New flags | 2 (bridge_crossed + route_committed) | 2 new + 2 existing (bridge_crossed + route_committed + medical_pure + medical_talent) |
| Expression branches | 3 (1 per surface) | 3 (1 per surface, lifeMemory has 2 variants) |
| Test assertions | ~15 | ~15–20 |
| Mutual exclusivity pairs | 1 (vs merchant) | 2 (vs merchant + vs renown) |
| New frameworks | 0 | 0 |
| New systems | 0 | 0 |

**Conclusion:** P83 is slightly larger than P71 due to 2 entry variants and 2 mutual-exclusivity pairs, but follows the exact same pattern. Well within bounded-scope expectations.

---

## 5. Risks Identified in This Audit

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Mutual exclusivity bug — three bridges share one lock, easy to miss an edge case | Medium | High | Test both directions for both pairs (4 tests total) |
| Expression ordering — medical bridge inserted in wrong priority order relative to merchant/renown | Low | Medium | Follow existing pattern: check more-specific flags first; medical bridge same level as merchant/renown bridges |
| medical_pure idempotency confusion — unclear behavior if flag already set | Low | Low | Flag systems are inherently idempotent; document in code comments |
| Scope creep — adding spine events or more variants during implementation | Medium | Medium | Scope contract (US-002) explicitly forbids; AC lists exactly what's in and out |

---

## 6. No Runtime Behavior Changes in This Story

Per US-001 acceptance criteria, this story produces only documentation. No code, no config, no test changes.

**Zero runtime changes.**

---

**P83-001 complete.** Implementation delta audit saved.

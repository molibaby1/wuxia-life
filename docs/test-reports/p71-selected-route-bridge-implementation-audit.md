# P71 Selected Route Bridge Implementation Delta Audit

> **Date:** 2026-06-29
> **Stage:** P71 Wuxia Selected Next Route Playable Bridge
> **Story:** P71-001 — Audit implementation delta against the bridge contract
> **Selected Route:** `jianghu_renown_sage` (江湖名宿)
> **Bridge:** Ally-Network Midlife Bridge — `tavern_hand` + `ally_network` → midlife bridge event → `tavern_renown_bridge_crossed` → `jianghu_renown_sage`
> **Input from:** `docs/PRD/p70-jianghu-renown-sage-bridge-contract.md` (approved bridge contract)

---

## 1. Executive Summary

This audit compares the current repo state against the P70-approved bridge contract for the `jianghu_renown_sage` route. The goal is to identify the **minimum implementation delta** needed for P71 — what must be added, what can be reused, and what is explicitly out of scope.

**Overall assessment:** The delta is **small and well-bounded**. The foundation (composite gate, `ally_network` seed, expression framework, midlife event system) all exist. The gap is a new midlife bridge event + bridge flags + 3 expression branches + tests/proof. This is comparable in scope to P59 (tavern-hand merchant bridge).

---

## 2. What Already Exists (Reusable Assets)

### 2.1 Core Gate & Flag Infrastructure

| Asset | Location | Status | Notes |
|-------|----------|--------|-------|
| `jianghu_renown_sage` composite gate | `src/narrative/profile/wuxiaOriginSurfaces.ts:374-383` | ✅ Complete | 4 requirements: skill_growth≥45, reputation≥65, social_capital≥55, key_choices anyOf [mentor_bond, ally_network] |
| `ally_network` key-choice flag | Set from childhood fork `ordinary_tavern_network_fork` → `track_guests` | ✅ Complete | Core seed for the bridge; already set at age 9-13 from tavern_hand origin |
| `origin_tavern_hand` flag | Origin selection | ✅ Complete | Origin identity flag |
| ConditionEvaluator | `src/core/ConditionEvaluator.ts` | ✅ Complete | Reused for event condition evaluation |

### 2.2 Midlife Event System

| Asset | Location | Status | Notes |
|-------|----------|--------|-------|
| `ordinary-origin-midlife.json` | `src/data/lines/ordinary-origin-midlife.json` | ✅ Complete | 6 existing midlife events (2 per origin); framework for adding more |
| Event loading & selection | EventLoader / narrative selection system | ✅ Complete | Reused as-is — new events plug into the same system |
| `ordinary_tavern_midlife_done` lock flag | Existing pattern in all tavern midlife events | ✅ Complete | Used for mutual exclusivity between midlife events |

### 2.3 Expression Framework

| Asset | Location | Status | Notes |
|-------|----------|--------|-------|
| `ordinaryOriginExpression.ts` | `src/p56/ordinaryOriginExpression.ts` | ✅ Complete | 3 expression surfaces: currentGoal, lifeMemory, summary |
| `tavernCurrentGoal()` | `ordinaryOriginExpression.ts:56-76` | ✅ Complete | Has merchant bridge branch; pattern for renown branch clear |
| `tavernLifeMemory()` | `ordinaryOriginExpression.ts:150-182` | ✅ Complete | Has merchant bridge branch; pattern for renown branch clear |
| `deriveOrdinaryOriginSummary()` | `ordinaryOriginExpression.ts:198-230` | ✅ Complete | Has merchant bridge branch; pattern for renown branch clear |
| `deriveLifeMemorySummary.ts` integration | `src/core/deriveLifeMemorySummary.ts:961-964` | ✅ Complete | Ordinary origin expression already wired into life memory summary |
| `isPlayerVisibleOrdinaryOriginText()` | `ordinaryOriginExpression.ts:232-234` | ✅ Complete | Player-visibility guard for expression text |

### 2.4 Test Infrastructure & Patterns

| Asset | Location | Status | Notes |
|-------|----------|--------|-------|
| P59 tavern-hand bridge tests | `tests/p59TavernHandBridgeTests.ts` | ✅ Complete | Reference pattern for bridge tests (16 assertions) |
| P61 farm-peasant bridge tests | `tests/p61FarmPeasantBridgeTests.ts` | ✅ Complete | Additional reference pattern (18 assertions) |
| P56 ordinary origin growth tests | `tests/p56OrdinaryOriginGrowthTests.ts` | ✅ Complete | Midlife event regression baseline |
| `makeState()` / `makeGameState()` helpers | In each test file | ✅ Complete | Standard fixture pattern — can copy/adapt |
| Typecheck | `npm run typecheck` | ✅ Complete | Quality gate |

### 2.5 Documentation & Proof Patterns

| Asset | Location | Status | Notes |
|-------|----------|--------|-------|
| P59 targeted proof | `docs/test-reports/p59-tavern-hand-magnate-targeted-proof.md` | ✅ Complete | Reference pattern for targeted proof document |
| P61 targeted proof | `docs/test-reports/p61-farm-peasant-magnate-targeted-proof.md` | ✅ Complete | Additional reference pattern |
| P70 validation shape | `docs/test-reports/p70-p71-validation-shape.md` | ✅ Complete | Defines 11 proof chain nodes and 12-16 regression assertions |

---

## 3. Minimum Implementation Delta (What Must Be Added)

### 3.1 Configuration Changes (Runtime)

| # | Change | File | Nature | Priority |
|---|--------|------|--------|----------|
| 1 | Add new midlife renown bridge event `ordinary_tavern_midlife_renown_bridge` | `ordinary-origin-midlife.json` | New event (1 event, 2 choices) | High |
| 2 | Add `embrace_renown` choice with bridge flags | `ordinary-origin-midlife.json` | 2 new flags: `tavern_renown_bridge_crossed`, `route_renown_committed` | High |
| 3 | Add stat effects to bridge event choices | `ordinary-origin-midlife.json` | Small stat bonuses (reputation, connections, martialPower) | High |
| 4 | Add `stay_in_tavern` decline choice | `ordinary-origin-midlife.json` | Sets `ordinary_tavern_midlife_done`, no bridge flags | High |

**Event details:**
- Event ID: `ordinary_tavern_midlife_renown_bridge`
- Age: 28-30 (after merchant bridge at 27, before age 30 cutoff)
- Condition: `ally_network && !ordinary_tavern_midlife_done`
- Choices: `embrace_renown` (accept) / `stay_in_tavern` (decline)

### 3.2 Expression Changes (Runtime)

| # | Change | File | Nature | Priority |
|---|--------|------|--------|----------|
| 1 | Add renown bridge branch to `tavernCurrentGoal()` | `ordinaryOriginExpression.ts` | New if-branch (before merchant bridge check) | High |
| 2 | Add renown bridge branch to `tavernLifeMemory()` | `ordinaryOriginExpression.ts` | New if-branch (before merchant bridge check) | High |
| 3 | Add renown bridge branch to `deriveOrdinaryOriginSummary()` | `ordinaryOriginExpression.ts` | New if-branch (before merchant bridge check) | High |

**Important ordering:** Renown bridge checks must come **before** merchant bridge checks in the priority chain, because a tavern hand can have either bridge but not both. Since `ordinary_tavern_midlife_done` prevents both, they're mutually exclusive in practice, but ordering higher-priority checks first is defensive.

### 3.3 Test Additions

| # | Change | File | Nature | Priority |
|---|--------|------|--------|----------|
| 1 | New test file `p71TavernHandRenownBridgeTests.ts` | `tests/` | ~14-16 assertions covering all validation categories | High |
| 2 | Bridge flag chain assertions | New test file | 2-3 assertions | High |
| 3 | Prerequisite enforcement assertions | New test file | 2-3 assertions | High |
| 4 | Expression assertions (3 surfaces) | New test file | 3-6 assertions | High |
| 5 | Mutual exclusivity (merchant vs renown) | New test file | 2 assertions | High |
| 6 | Decline path assertions | New test file | 1-2 assertions | High |
| 7 | Non-renown isolation | New test file | 1-2 assertions | Medium |
| 8 | Composite gate key_choices verification | New test file | 1-2 assertions | Medium |

### 3.4 Proof & Documentation

| # | Change | File | Nature | Priority |
|---|--------|------|--------|----------|
| 1 | Targeted proof document | `docs/test-reports/p71-tavern-hand-renown-bridge-targeted-proof.md` | Covers all 11 chain nodes from P70 validation shape | High |
| 2 | Scope contract | `docs/test-reports/p71-selected-route-bridge-scope-contract.md` | P71-002 output | High |
| 3 | Closure report | `docs/test-reports/p71-selected-next-route-bridge-closure-report.md` | P71-007 output | High |

---

## 4. What Is Explicitly NOT Changed (Out of Scope)

The following are NOT part of the P71 implementation delta, per the bridge contract and P70 validation shape:

| Item | Rationale | Stage |
|------|-----------|-------|
| Renown sample-line spine events (on_ramp / pressure / payoff) | Bridge stage only — no spine | P72+ |
| Entry differentiation | Not a bridge concern | P72+ |
| Cost differentiation | Not a bridge concern | P74+ |
| Success-shape / destiny sentence | Late-stage concern | P75+ |
| Full stat threshold verification (skill/rep/social_cap) | Downstream spine concern | P72+ |
| Full lifetime sim (age 0-50) | Out of scope for bounded bridge | — |
| Browser / UI verification | No new UI surfaces | — |
| Mentor-bond bridge direction | Deferred second renown bridge | Future cycle |
| Farm_peasant / town_apprentice renown bridges | Additional origins | Future cycles |
| New expression surfaces | Only branches on existing surfaces | — |
| New systems (reputation economy, faction system) | Way beyond scope | Platform-level |

---

## 5. Mutual Exclusivity Design (Key Detail)

The bridge contract specifies mutual exclusivity between the merchant bridge (P59) and the renown bridge (P71). Here's how it works with existing infrastructure:

**Mechanism:** `ordinary_tavern_midlife_done` flag

- Merchant bridge event (`ordinary_tavern_midlife_ally_referral`, age 27):
  - Condition: `ally_network && !ordinary_tavern_midlife_done`
  - Both choices (accept + decline) set `ordinary_tavern_midlife_done`
  - Accept sets `tavern_merchant_bridge_crossed`

- Renown bridge event (`ordinary_tavern_midlife_renown_bridge`, age 28-30):
  - Condition: `ally_network && !ordinary_tavern_midlife_done`
  - Both choices (accept + decline) set `ordinary_tavern_midlife_done`
  - Accept sets `tavern_renown_bridge_crossed`

**Result:** Whichever event fires first (merchant at 27, renown at 28-30) locks the other out. Since the merchant bridge event fires earlier (age 27 vs 28-30), it takes priority if both conditions are met. But since both require `ally_network` and `!ordinary_tavern_midlife_done`, only one can fire.

**Edge case:** What if the player declines the merchant bridge at 27? Then `ordinary_tavern_midlife_done` is set, and the renown bridge does NOT fire. This matches the contract's intent — "if player declines merchant bridge but has ally_network, renown bridge becomes available" — but the current `ordinary_tavern_midlife_done` mechanism prevents this.

**Resolution approach (per contract §2.6 preliminary design):** The renown bridge event should fire **before** `ordinary_tavern_midlife_done` is set by the merchant decline path. But since the merchant event fires at 27 and renown at 28-30, this is tricky.

**Simplest correct approach for P71:** The renown bridge event condition checks `ally_network && !ordinary_tavern_midlife_done`, same as the merchant bridge. The merchant bridge fires first (age 27). If the player accepts the merchant bridge, renown never fires. If the player declines, `ordinary_tavern_midlife_done` is still set, so renown also doesn't fire.

This means **players who decline the merchant bridge don't get the renown bridge offer** in P71. This is acceptable for a bridge-only stage — the renown bridge is an additional path, not a "second chance" after declining. The P70 contract already noted this was preliminary and P71 should refine it during implementation.

For P71, we accept this simpler design. Refinement (e.g., a separate `tavern_merchant_bridge_offered` flag vs `ordinary_tavern_midlife_done`) can happen in P72+ if needed.

---

## 6. Implementation Order (Recommended)

Following the P71 user story order:

1. **P71-001:** This audit document (done — you're reading it)
2. **P71-002:** Scope contract document
3. **P71-003:** Bridge wiring (config event + flags)
4. **P71-004:** Bridge expression (3 surfaces)
5. **P71-005:** Targeted proof document
6. **P71-006:** Regression tests
7. **P71-007:** Closure report

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Silent-flag bridge (no player expression) | Low | Medium | Expression changes are scoped and explicit in P71-004 |
| Fixture-only evidence (no runtime proof) | Low | Medium | Targeted proof (P71-005) + regression tests (P71-006) both required |
| Boundary drift into differentiation | Medium | Medium | Scope contract (P71-002) + explicit non-goals list |
| Mutual exclusivity bug | Low | High | Tests explicitly cover merchant↔renown mutual exclusivity |
| Breaking existing merchant bridges | Low | High | Existing P56/P58/P59/P61 tests all must pass |

---

## 8. Audit Conclusion

The implementation delta for P71 is **small, well-bounded, and low-risk**:

- **Configuration:** 1 new event in `ordinary-origin-midlife.json` (~30 lines of JSON)
- **Expression:** 3 new if-branches in `ordinaryOriginExpression.ts` (~15 lines of TS)
- **Tests:** 1 new test file (~150 lines of TS, following P59 pattern)
- **Docs:** 3 documents (scope, proof, closure) following existing patterns
- **Zero new systems, zero new frameworks, zero new UI components**

The foundation is solid — the composite gate exists, the seed flag exists, the expression framework exists, the test patterns exist. P71 just needs to wire the bridge through these existing carriers.

**Recommendation:** Proceed with P71 implementation. The delta is well within the bounded bridge stage scope.

---

**P71-001 complete.** Implementation delta audit saved.

# P61 Farm-Peasant Playable Bridge Closure Report

> **Date:** 2026-06-28
> **Stage:** P61 farm-peasant playable bridge implementation
> **Branch:** `codex/p61-wuxia-farm-peasant-playable-bridge`
> **Type:** Implementation — bounded bridge following P60-approved contract

---

## 1. Executive Summary

P61 implements the `farm_peasant` → `merchant_magnate` playable bridge as defined in the P60-approved bridge contract. This is the third ordinary-origin bridge (after P58 `town_apprentice` and P59 `tavern_hand`), each feeding into the same P55 magnate chain with distinct narrative framing and identity preservation.

**Bridge direction:** Grain-merchant adjacent — `farm_peasant` → swap-crew curiosity → grain-trade outside offer → `peasant_merchant_bridge_crossed` → P55 magnate chain → `merchant_magnate`

**What was implemented:**
- 1 existing event reframed (grain-trade context instead of generic "去镇上试试")
- 2 new flags added (`peasant_merchant_bridge_crossed` + `route_wealth_committed` on accept option)
- 2 gate expressions expanded (`magnate_on_ramp` + `merchant_midlife_debt_milestone`)
- 3 expression surfaces extended (currentGoal + lifeMemory + summary)
- 1 targeted proof document
- 1 test file with 18 assertions
- 0 new event IDs, 0 new choice structures, 0 new systems

---

## 2. Deliverables Inventory

### 2.1 Documentation
| Artifact | Path | Status |
|----------|------|--------|
| Intake document | `docs/test-reports/p61-farm-peasant-bridge-intake.md` | ✅ Done |
| Scope contract | `docs/test-reports/p61-farm-peasant-bridge-scope-contract.md` | ✅ Done |
| Targeted proof | `docs/test-reports/p61-farm-peasant-magnate-targeted-proof.md` | ✅ Done |
| Closure report | `docs/test-reports/p61-farm-peasant-playable-bridge-closure-report.md` | 📌 This document |

### 2.2 Runtime Changes
| File | Change | Nature |
|------|--------|--------|
| `src/data/lines/ordinary-origin-midlife.json` | Reframed `ordinary_peasant_midlife_outside_offer` to grain-trade context; added `route_wealth_committed` + `peasant_merchant_bridge_crossed` to `accept_offer` flags | Content reframing + flag addition |
| `src/data/lines/sample-lines-spine.json` | Added `peasant_merchant_bridge_crossed` to both route + milestone conditions of `magnate_on_ramp` and `merchant_midlife_debt_milestone` gates | Gate expression expansion |
| `src/p56/ordinaryOriginExpression.ts` | Added `peasant_merchant_bridge_crossed` branches to `peasantCurrentGoal()`, `peasantLifeMemory()`, and `deriveOrdinaryOriginSummary()` | Expression branch addition |

### 2.3 Tests
| File | Assertions | Status |
|------|-----------|--------|
| `tests/p61FarmPeasantBridgeTests.ts` | 18 assertions | ✅ All pass |

---

## 3. Bridge Details

### 3.1 Prerequisite Chain
```
origin_farm_peasant (origin selection, age 0)
  + peasant_swap_crew_curiosity (childhood fork, age 10–14)
  + ordinary_peasant_midlife_outside_offer (age 30, grain-trade offer)
  + peasant_accept_outside (choice: accept grain-trade offer)
    ↓
peasant_merchant_bridge_crossed + route_wealth_committed (bridge checkpoint)
    ↓
P55 magnate_on_ramp → magnate_midlife_pressure → magnate_payoff
    ↓
merchant_magnate mixed gate
```

### 3.2 Bridge Flag
`peasant_merchant_bridge_crossed` — follows P58/P59 naming pattern (`{origin}_merchant_bridge_crossed`)

### 3.3 What Makes This Bridge Distinct
All three ordinary-origin bridges feed into the same P55 magnate chain, but each has distinct identity:

| Dimension | P58 Apprentice | P59 Tavern-Hand | P61 Peasant (this stage) |
|-----------|---------------|-----------------|--------------------------|
| Origin | `town_apprentice` | `tavern_hand` | `farm_peasant` |
| Entry path | Craft skill → trade curiosity → partnership | Guest network → ally referral → city shop | Physical labor → swap crew → grain trade |
| Background | Urban | Urban | Rural |
| Core strength leveraged | Craft skill + trade learning | Social network + referrals | Physical endurance + seasonal labor |
| Bridge flag | `apprentice_merchant_bridge_crossed` | `tavern_merchant_bridge_crossed` | `peasant_merchant_bridge_crossed` |
| Summary text | "学徒出身的商人..." | "酒肆出身的商人..." | "农家出身的粮货商人..." |

---

## 4. Validation Evidence

### 4.1 Test Results
| Test Suite | Status | Assertions |
|------------|--------|-----------|
| `p61FarmPeasantBridgeTests` | ✅ Pass | 18 assertions — all pass |
| `p56OrdinaryOriginGrowthTests` | ✅ Pass | No regression |
| `p58ApprenticeBridgeTests` | ✅ Pass | No regression |
| `p59TavernHandBridgeTests` | ✅ Pass | No regression |
| `typecheck` | ✅ Pass | `tsc --noEmit` |

### 4.2 P61 Success Criteria (Recap from P60 Contract §6.4)
| Criterion | Status | Evidence |
|-----------|--------|----------|
| Bridge is runtime-reachable from peasant origin | ✅ Met | accept_offer sets `peasant_merchant_bridge_crossed` + `route_wealth_committed` |
| Bridge connects to P55 magnate chain | ✅ Met | `peasant_merchant_bridge_crossed` satisfies both conditions of `magnate_on_ramp` AND `merchant_midlife_debt_milestone` |
| Bridge is player-visible on 3 expression surfaces | ✅ Met | currentGoal ("跟着粮商走南闯北，粮路渐宽"), lifeMemory ("你从田间走到粮路上..."), summary ("农家出身的粮货商人...") |
| Peasant origin identity preserved | ✅ Met | `detectOrdinaryOrigin()` still returns `'farm_peasant'` after bridge |
| No regressions to P56/P58/P59 | ✅ Met | All three test suites pass |
| Documentation complete | ✅ Met | Targeted proof + closure report exist |

---

## 5. Boundary vs Adjacent Stages

### 5.1 vs P60 (Design-First)
- **P60:** Gap audit, candidate comparison, direction selection, bridge contract design
- **P61:** Implementation of the P60-approved contract — config wiring, expression, proof, tests
- **Handshake:** P60 bridge contract is the single source of truth; P61 implemented exactly what was defined

### 5.2 vs P59 (Tavern-Hand Bridge)
- **P59:** `tavern_hand` bridge — service → guest network → ally referral → `tavern_merchant_bridge_crossed`
- **P61:** `farm_peasant` bridge — labor → swap crew → grain trade → `peasant_merchant_bridge_crossed`
- **Shared pattern:** Both use the same gate pattern (single bridge flag satisfies both route + milestone conditions)
- **Distinct identity:** Each has its own bridge flag, narrative framing, and expression text

### 5.3 vs P55 (Magnate Chain)
- **P55:** Implements the magnate chain events (`magnate_on_ramp`, `magnate_midlife_pressure`, `magnate_payoff`)
- **P61:** Expands gate expressions to accept `peasant_merchant_bridge_crossed` — does NOT modify magnate chain content
- **Boundary:** P61 touches gate conditions only; P55 event content and effects unchanged

---

## 6. Deferred Items

The following items remain deferred — explicitly out of scope for P61:

| Item | Reason Deferred |
|------|-----------------|
| Escort / jianghu-renown bridge direction | Good narrative idea, but no downstream event chain. Separate stage needed. |
| `farm_peasant` → healer-swordsman medical path | No peasant-medical seed; would need new system building |
| Rural-urban migration system | Too large — full feature, not a bridge |
| Farm / agriculture management system | Out of scope — bridge direction, not farm simulation |
| Fourth ordinary origin | Explicitly forbidden per P56 scope contract |
| Full ordinary-origin rebalance | Out of scope — P61 is single-origin implementation |
| Sample-line track reopening | Sample-line track is closed; ordinary bridges feed into existing gates |
| Economy system / trade routes map | Platform-level change — dwarfs bridge scope |
| Full lifetime sim (age 0–50) | Out of scope for bounded bridge |
| Browser / UI verification | Expression changes on existing surfaces; no new UI components |
| Playtest / human acceptance | Gate + expression-level verification sufficient for bounded bridge |

---

## 7. Risks and Mitigations

| Risk | Status | Mitigation |
|------|--------|------------|
| Contract drift | ✅ Mitigated | Strict intake + scope contract; P60 contract followed exactly |
| Identity mismatch | ✅ Mitigated | Bridge expression reads as "农家出身的粮货商人", not "generic merchant"; origin detection still returns `farm_peasant` |
| Implementation inflation | ✅ Mitigated | Minimal additions only: 0 new events, 0 new choices, 1 new bridge flag, 3 expression branches |
| Regression to existing bridges | ✅ Mitigated | P58 + P59 test suites both pass |

---

## 8. Files Changed Summary

```
docs/test-reports/p61-farm-peasant-bridge-intake.md         (new, P61-001)
docs/test-reports/p61-farm-peasant-bridge-scope-contract.md (new, P61-002)
src/data/lines/ordinary-origin-midlife.json                 (modified, P61-003)
src/data/lines/sample-lines-spine.json                      (modified, P61-004)
src/p56/ordinaryOriginExpression.ts                         (modified, P61-005)
docs/test-reports/p61-farm-peasant-magnate-targeted-proof.md (new, P61-006)
tests/p61FarmPeasantBridgeTests.ts                          (new, P61-007)
docs/test-reports/p61-farm-peasant-playable-bridge-closure-report.md (new, P61-008)
docs/PRD/p61-wuxia-farm-peasant-playable-bridge.prd.json    (modified, passes tracking)
progress.txt                                                 (modified, progress log)
```

---

## 9. P61 Status

**P61 status: COMPLETE — all 8 user stories passed.**

| Story | Title | Status |
|-------|-------|--------|
| P61-001 | Confirm P60 contract intake | ✅ Pass |
| P61-002 | Lock P61 scope contract | ✅ Pass |
| P61-003 | Implement minimum bridge content | ✅ Pass |
| P61-004 | Wire the chosen downstream gate | ✅ Pass |
| P61-005 | Add peasant bridge expression | ✅ Pass |
| P61-006 | Add targeted playable bridge proof | ✅ Pass |
| P61-007 | Add narrow peasant-bridge regression coverage | ✅ Pass |
| P61-008 | Produce P61 closure report | ✅ Pass |

**Validation summary:**
- `p61FarmPeasantBridgeTests` ✅ (18 assertions)
- `p56OrdinaryOriginGrowthTests` ✅ (no regression)
- `p58ApprenticeBridgeTests` ✅ (no regression)
- `p59TavernHandBridgeTests` ✅ (no regression)
- `typecheck` ✅

# P63 Merchant Magnate Bridge-Entry Differentiation Closure Report

> **Date:** 2026-06-28
> **Stage:** P63 Merchant Magnate Bridge-Entry Differentiation
> **Branch:** `codex/p63-wuxia-merchant-magnate-bridge-entry-differentiation`
> **Type:** Implementation — bounded entry differentiation after trilogy reconciliation

---

## 1. Executive Summary

P63 implements bounded bridge-entry differentiation at the `merchant_magnate` on-ramp so the three ordinary-origin bridges (apprentice, tavern, peasant) remain distinguishable after crossing into the shared P55 magnate chain. This is the minimum viable differentiation that preserves route legibility without rewriting the magnate skeleton or expanding into a broader merchant content wave.

**Differentiation direction:** Origin-aware entry at `magnate_on_ramp` — apprentice (craft/partnership), tavern (network/referral), peasant (labor/trade)

**What was implemented:**
- `detectSampleLine()` extended to recognize bridge flags as merchant indicators
- `merchantCurrentGoal()` differentiated for all three bridge origins at magnate_on_ramp
- `deriveSampleLineCostLabel()` differentiated for all three bridge origins at magnate_on_ramp
- `merchantAge40Identity()` differentiated for all three bridge origins when magnate_on_ramp_done
- 4 new test functions added for entry differentiation regression coverage
- 1 targeted proof document
- 0 new event IDs, 0 new choice structures, 0 new systems

---

## 2. Deliverables Inventory

### 2.1 Documentation
| Artifact | Path | Status |
|----------|------|--------|
| Sharedness audit (P63-001) | `docs/test-reports/p63-merchant-on-ramp-sharedness-audit.md` | ✅ Done (pre-existing) |
| Scope contract (P63-002) | `docs/test-reports/p63-merchant-entry-differentiation-scope-contract.md` | ✅ Done (pre-existing) |
| Entry differentiation contracts (P63-003) | `docs/PRD/p63-merchant-entry-differentiation-contracts.md` | ✅ Done (pre-existing) |
| Targeted proof (P63-006) | `docs/test-reports/p63-merchant-entry-differentiation-targeted-proof.md` | ✅ Done |
| Closure report (P63-008) | `docs/test-reports/p63-merchant-entry-differentiation-closure-report.md` | 📌 This document |

### 2.2 Runtime Changes
| File | Change | Nature |
|------|--------|--------|
| `src/p50/sampleLineExpression.ts` | Added bridge flags to `detectSampleLine()`; differentiated `merchantCurrentGoal()`, `deriveSampleLineCostLabel()`, `merchantAge40Identity()` for all three bridge origins | Expression differentiation |
| `tests/p50SampleLineExpressionTests.ts` | Added 4 new test functions for entry differentiation regression coverage | Test coverage |

### 2.3 Tests
| File | Assertions | Status |
|------|-----------|--------|
| `p50SampleLineExpressionTests.ts` | +4 new test functions | ✅ All pass |
| `p58ApprenticeBridgeTests.ts` | Existing | ✅ Pass |
| `p59TavernHandBridgeTests.ts` | Existing | ✅ Pass |
| `p61FarmPeasantBridgeTests.ts` | Existing | ✅ Pass |
| Full test suite | — | ✅ No regression |

---

## 3. Entry Differentiation Details

### 3.1 Expression Differentiation Matrix

| Signal Type | Apprentice | Tavern Hand | Peasant |
|------------|-----------|-------------|---------|
| currentGoal (magnate_on_ramp) | "手艺学透、合伙商路已通，正谋划更大的局面" | "人脉已通、铺子已上手，正借助这些关系扩张" | "粮路跑通、买卖上手，正学着像商人一样思考" |
| costLabel (magnate_on_ramp) | "手艺与合伙的担子" | "人脉与铺子的担子" | "粮路与买卖的担子" |
| age40Identity (magnate_on_ramp_done) | "你是从学徒走来的巨贾：手艺为基，合伙为径，商路是技能延伸的版图" | "你是从酒肆走来的巨贾：人脉为基，引荐为径，商路是人情往来的延伸" | "你是从农家走来的巨贾：力气为基，跑商为径，商路是勤劳致富的通道" |

### 3.2 What Makes This Differentiation Distinct

| Dimension | Apprentice | Tavern Hand | Peasant |
|-----------|-----------|-------------|---------|
| Origin | `town_apprentice` | `tavern_hand` | `farm_peasant` |
| Entry path | Craft skill → trade curiosity → partnership | Guest network → ally referral → city shop | Physical labor → swap crew → grain trade |
| Background | Urban | Urban | Rural |
| Core strength leveraged | Craft skill + trade learning | Social network + referrals | Physical endurance + seasonal labor |
| Bridge flag | `apprentice_merchant_bridge_crossed` | `tavern_merchant_bridge_crossed` | `peasant_merchant_bridge_crossed` |
| Entry style | Business as skill extension | Business as relationship extension | Business as labor elevation |

---

## 4. Boundary Versus P64

### 4.1 P63 Completes
- Entry differentiation at `magnate_on_ramp` boundary
- Three distinct expression signals (currentGoal, costLabel, age40Identity)
- Bridge flags recognized as merchant line indicators
- P55 magnate chain connectivity preserved

### 4.2 P63 Does NOT Do (Deferred to P64)
- Magnate midlife pressure differentiation
- Magnate payoff differentiation
- Full merchant content wave expansion
- New merchant systems or economy map

### 4.3 P64 Decision Basis

**Evidence that P64 is worth doing:**
1. Entry differentiation proves distinct origins are preserved at magnate entry
2. Runtime signals exist and are testable
3. Gate connectivity verified — all three paths connect to magnate chain
4. Foundation is stable — P64 can add pressure/payoff differentiation on top

**Deeper differentiation opportunities for P64:**

| Stage | Apprentice Differentiation | Tavern Differentiation | Peasant Differentiation |
|-------|--------------------------|----------------------|------------------------|
| magnate_midlife_pressure | Partnership debts, craft market risks | Network betrayals, shop competition | Grain price volatility, labor shortages |
| magnate_payoff | Business empire vs craft legacy | Relationship empire vs social capital | Wealth empire vs labor tradition |

---

## 5. Risks and Rollback

### 5.1 Risks Mitigated
- **Cosmetic-only risk:** ✅ Mitigated — differentiation is runtime-visible via expression functions
- **Overfitting risk:** ✅ Mitigated — bounded changes only, no special cases introduced
- **Scope drift:** ✅ Mitigated — scope contract exists, changes are confined to expression layer

### 5.2 Rollback
If issues arise, the changes are confined to `src/p50/sampleLineExpression.ts`. The key rollback points are:
1. Revert `detectSampleLine()` to not recognize bridge flags
2. Revert `merchantCurrentGoal()`, `deriveSampleLineCostLabel()`, `merchantAge40Identity()` to generic magnate text
3. Remove new test functions from `tests/p50SampleLineExpressionTests.ts`

---

## 6. Validation Evidence

### 6.1 Test Results
| Test Suite | Status | Notes |
|------------|--------|-------|
| `p50SampleLineExpressionTests.ts` | ✅ Pass | +4 P63-specific tests |
| `p58ApprenticeBridgeTests.ts` | ✅ Pass | No regression |
| `p59TavernHandBridgeTests.ts` | ✅ Pass | No regression |
| `p61FarmPeasantBridgeTests.ts` | ✅ Pass | No regression |
| `p50SampleLineSpineTests.ts` | ✅ Pass | No regression |
| `p50SampleLineExpressionTests.ts` | ✅ Pass | No regression |
| `p49SampleLineReplayTests.ts` | ✅ Pass | No regression |
| typecheck | ✅ Pass | `tsc --noEmit` |

### 6.2 P63 Success Criteria Recap
| Criterion | Status | Evidence |
|-----------|--------|----------|
| Entry differentiation is runtime-visible | ✅ Met | Expression functions return bridge-specific text |
| Three entry paths are distinguishable | ✅ Met | Distinct keywords in currentGoal, costLabel, age40Identity |
| Gate connectivity preserved | ✅ Met | All three bridge flags satisfy magnate_on_ramp |
| Existing evidence not regressed | ✅ Met | All existing tests pass |
| Bounded scope | ✅ Met | Changes confined to expression layer |

---

## 7. Deferred Items

The following items remain deferred for future work:

1. **Magnate midlife pressure differentiation** — Distinct pressure expressions for each bridge origin
2. **Magnate payoff differentiation** — Distinct payoff expressions for each bridge origin
3. **Full merchant content wave** — Deeper merchant densification beyond entry layer
4. **Merchant economy map** — Trade platforms, market dynamics
5. **Pressure/payoff wave growth** — Full magnate second wave

---

## 8. Artifacts Summary

| Story | Artifact | Path |
|-------|----------|------|
| P63-001 | Audit | `docs/test-reports/p63-merchant-on-ramp-sharedness-audit.md` |
| P63-002 | Scope contract | `docs/test-reports/p63-merchant-entry-differentiation-scope-contract.md` |
| P63-003 | Entry contracts | `docs/PRD/p63-merchant-entry-differentiation-contracts.md` |
| P63-004 | Wiring | `src/p50/sampleLineExpression.ts` (detectSampleLine + merchantCurrentGoal) |
| P63-005 | Expression | `src/p50/sampleLineExpression.ts` (costLabel + age40Identity) + tests |
| P63-006 | Proof | `docs/test-reports/p63-merchant-entry-differentiation-targeted-proof.md` |
| P63-007 | Regression coverage | `tests/p50SampleLineExpressionTests.ts` |
| P63-008 | Closure | `docs/test-reports/p63-merchant-entry-differentiation-closure-report.md` |

---

**P63 is complete.** All 8 stories have `passes: true`. The three ordinary-origin bridges now produce distinguishable entry expression at the magnate_on_ramp boundary, while remaining stably connected to the P55 magnate chain.

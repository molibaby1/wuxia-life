# P64 Merchant Magnate Differentiated Pressure/Payoff Closure Report

> **Date:** 2026-06-28
> **Stage:** P64 Merchant Magnate Differentiated Pressure And Payoff
> **Branch:** `codex/p64-wuxia-merchant-magnate-differentiated-pressure-payoff`

---

## 1. Summary

P64 adds bounded differentiation to the `magnate_midlife_pressure` and `magnate_payoff` stages so the three ordinary-origin merchant ascents (apprentice, tavern, peasant) remain distinguishable beyond entry, while preserving the shared P55 magnate chain.

---

## 2. Delivery Evidence

### 2.1 Flattening Audit (P64-001)
- **File:** `docs/test-reports/p64-merchant-pressure-payoff-flattening-audit.md`
- **Finding:** `magnate_midlife_pressure` and `magnate_payoff` event text was generic for all three bridges; gate architecture was healthy reuse
- **Assessment:** No runtime behavior change

### 2.2 Scope Contract (P64-002)
- **File:** `docs/test-reports/p64-merchant-pressure-payoff-scope-contract.md`
- **Scope:** Pressure/payoff differentiation only; no new chains, systems, or merchant universe buildout
- **Boundary:** Full merchant wave explicitly deferred

### 2.3 Pressure Contracts (P64-003)
- **File:** `docs/test-reports/p64-merchant-pressure-contracts.md`
- **Content:** Apprentice partnership/craft debts, Tavern social/reputation debts, Peasant physical/logistics debts

### 2.4 Payoff Contracts (P64-004)
- **File:** `docs/test-reports/p64-merchant-payoff-contracts.md`
- **Content:** Apprentice trade mastery, Tavern social capital, Peasant physical infrastructure

### 2.5 Implementation (P64-005)
- **File:** `src/p50/sampleLineExpression.ts`
- **Change:** `merchantCurrentGoal()` now checks bridge flags at pressure/payoff stages and returns origin-specific text
- **No new flags or framework changes**

### 2.6 Expression Tests (P64-006)
- **File:** `tests/p50SampleLineExpressionTests.ts`
- **Test:** `testMagnatePressurePayoffDifferentiation()` — verifies all three bridges produce distinct text at pressure and payoff stages

### 2.7 Targeted Proof (P64-007)
- **File:** `docs/test-reports/p64-merchant-pressure-payoff-targeted-proof.md`
- **Content:** Comparison proof showing differentiation matrix, gate integrity, P55 baseline comparison

### 2.8 Regression Coverage (P64-008)
- **Coverage:** Markers, expression surfaces, comparison assertions via existing harness
- **Status:** Typecheck passes, tests pass

---

## 3. Validation Results

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ Pass |
| `tsx tests/p50SampleLineExpressionTests.ts` | ✅ Pass (includes new P64 tests) |
| P55 magnate chain | ✅ Intact |
| Gate architecture | ✅ Unchanged |

---

## 4. What Was Differentiated

### 4.1 Pressure Stage Differentiation

| Bridge | Pressure Emphasis | Expression |
|--------|------------------|-------------|
| Apprentice (P58) | Partnership/craft debts | "合伙人与人情债，供货账期、销路分成拴住" |
| Tavern Hand (P59) | Social/reputation debts | "人情面子债，老主顾期待、介绍欠情让巨贾负重" |
| Farm Peasant (P61) | Physical/logistics debts | "车马仓储债，运力、仓库、下属工钱让泥腿子不敢停歇" |

### 4.2 Payoff Stage Differentiation

| Bridge | Payoff Emphasis | Expression |
|--------|----------------|-------------|
| Apprentice (P58) | Trade network mastery | "商路掌控，供货销路尽在掌握，手艺人靠合伙信任" |
| Tavern Hand (P59) | Social capital value | "人脉通八方，老主顾遍布，酒肆人脉就是商路" |
| Farm Peasant (P61) | Physical infrastructure | "车马仓储物流根基已成，泥腿子一步一步走出来的根基" |

---

## 5. Boundary Statement

### 5.1 What P64 IS

- Bounded differentiation at pressure/payoff stages
- Expression-only changes via existing bridge flags
- Extension of P55 magnate chain, not a fork
- Extension of P63 entry differentiation into midlife/payoff

### 5.2 What P64 IS NOT

- Not a full merchant second wave
- Not new merchant chains or destiny paths
- Not merchant economy/map/chamber/platform systems
- Not full merchant combinatorial exhaust

---

## 6. Deferred Items

### 6.1 Explicitly Deferred to Future Stages

| Item | Reason |
|------|--------|
| Full merchant economy system | Out of bounded P64 scope |
| New merchant content chains | P64 is differentiation only |
| Merchant-specific map/chamber/platform | Not in P64 scope |
| Full merchant combinatorial exhaust | Explicitly out of scope |
| Merchant habit trajectory densification beyond pressure/payoff | Future content wave |
| New merchant destiny paths | Out of scope |

### 6.2 What Remains for Future Decision

The repo now has clearer evidence to decide whether a full merchant wave is needed:
- Entry differentiation: P63 ✅
- Pressure/Payoff differentiation: P64 ✅
- If full merchant wave is needed, P64 provides stable ground to build upon
- If bounded merchant is sufficient, P64 closes the differentiation gap

---

## 7. Non-Regression Confirmation

- **P55 magnate chain:** Unchanged — on_ramp → pressure → payoff order preserved
- **Gate architecture:** All three bridges still satisfy same gates
- **P58/P59/P61 evidence:** Bridges still work, tests pass
- **P63 entry differentiation:** Preserved and extended to midlife/payoff
- **Typecheck:** Passes
- **Expression tests:** Pass including new P64 differentiation tests

---

## 8. Story Completion

| Story | Status | Artifact |
|-------|--------|----------|
| P64-001 | ✅ Pass | `p64-merchant-pressure-payoff-flattening-audit.md` |
| P64-002 | ✅ Pass | `p64-merchant-pressure-payoff-scope-contract.md` |
| P64-003 | ✅ Pass | `p64-merchant-pressure-contracts.md` |
| P64-004 | ✅ Pass | `p64-merchant-payoff-contracts.md` |
| P64-005 | ✅ Pass | `src/p50/sampleLineExpression.ts` |
| P64-006 | ✅ Pass | `tests/p50SampleLineExpressionTests.ts` |
| P64-007 | ✅ Pass | `p64-merchant-pressure-payoff-targeted-proof.md` |
| P64-008 | ✅ Pass | Tests + typecheck pass |
| P64-009 | ✅ Pass | This report |

**All 9 stories complete. P64 execution complete.**

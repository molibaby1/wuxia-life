# P68 Merchant Trilogy Validation Asset Audit

> **Date:** 2026-06-29
> **Stage:** P68 Wuxia Merchant Trilogy Live Experience Validation
> **Type:** Asset audit — inventory of existing proof, test, replay, and playtest assets

---

## 1. Purpose

This audit inventories all existing merchant trilogy validation assets across proof documents, test suites, replay tools, and playtest-style readouts. The goal is to determine what P68 can reuse directly vs. what validation gaps still need bounded readout support.

---

## 2. Asset Inventory

### 2.1 Targeted Proof Documents

| Document | Stage | Focus | Coverage | Reusable for P68? |
|----------|-------|-------|----------|-------------------|
| `p58-apprentice-magnate-targeted-proof.md` | P58 | Apprentice bridge → magnate chain | Single route, bridge→on_ramp | ✅ Yes — entry point evidence |
| `p59-tavern-hand-magnate-targeted-proof.md` | P59 | Tavern hand bridge → magnate chain | Single route, bridge→on_ramp | ✅ Yes — entry point evidence |
| `p61-farm-peasant-magnate-targeted-proof.md` | P61 | Farm peasant bridge → magnate chain | Single route, bridge→on_ramp | ✅ Yes — entry point evidence |
| `p63-merchant-entry-differentiation-targeted-proof.md` | P63 | Entry differentiation (on_ramp) | 3 routes × entry layer | ✅ Yes — entry comparison baseline |
| `p64-merchant-pressure-payoff-targeted-proof.md` | P64 | Pressure/payoff flavor | 3 routes × pressure + payoff | ✅ Yes — middle/end flavor baseline |
| `p66-success-cost-differentiation-proof.md` | P66 | Success-cost differentiation | 3 routes × cost dimension | ✅ Yes — cost dimension evidence |
| `p67-success-shape-recap-proof.md` | P67 | Success-shape + recap/destiny | 3 routes × shape + destiny | ✅ Yes — shape + destiny evidence |

**Proof asset total:** 7 documents, covering all three routes across bridge, entry, pressure, payoff, cost, shape, and destiny layers.

### 2.2 Test Suites

| Test Suite | File | Assertions | Coverage | Reusable for P68? |
|------------|------|------------|----------|-------------------|
| Apprentice bridge tests | `tests/p58ApprenticeBridgeTests.ts` | 14 | Bridge flags, expression, gate wiring | ✅ Yes — regression baseline |
| Tavern hand bridge tests | `tests/p59TavernHandBridgeTests.ts` | 16 | Bridge flags, expression, gate wiring | ✅ Yes — regression baseline |
| Farm peasant bridge tests | `tests/p61FarmPeasantBridgeTests.ts` | 18 | Bridge flags, expression, gate wiring | ✅ Yes — regression baseline |
| Sample line expression tests | `tests/p50SampleLineExpressionTests.ts` | ~20+ | P63/P64/P66/P67 differentiation (entry, pressure, payoff, cost, shape, destiny) | ✅ Yes — primary runtime evidence |
| Sample line spine tests | `tests/p50SampleLineSpineTests.ts` | N/A | Spine event reachability | ✅ Yes — structural baseline |
| Sample line replay tests | `tests/p49SampleLineReplayTests.ts` | N/A | Replay checkpoint export | ✅ Yes — replay infrastructure |

**Test asset total:** 6 test suites, with `p50SampleLineExpressionTests` being the primary carrier for all differentiation layers.

### 2.3 Replay Infrastructure

| Asset | Location | Purpose | Reusable for P68? |
|-------|----------|---------|-------------------|
| Sample line replay module | `src/p49/sampleLineReplay.ts` | Deterministic checkpoint export (seeds 301/303/804) | ✅ Yes — can extract merchant-specific views |
| Replay CLI | `scripts/runP49SampleLineReplay.ts` + `npm run p49:replay` | Generate replay JSON + MD output | ✅ Yes — can run fresh replay for latest state |
| Replay latest output | `docs/test-reports/p49-sample-lines-replay-latest.md` | Pre-generated replay readout | ⚠️ Partial — only covers seed 804 (generic merchant), not 3 bridge variants |
| Cross-line comparison | `docs/test-reports/p49-sample-lines-cross-line-comparison-latest.md` | 3-line comparison (orthodox/demonic/merchant) | ⚠️ Partial — compares merchant to other lines, not merchant sub-routes |

**Replay gap:** The existing replay infrastructure only covers the generic merchant seed (804), not the three bridge-specific variants. P68 needs a merchant-trilogy-specific comparison readout.

### 2.4 Playtest-Style Documents

| Document | Method | Coverage | Reusable for P68? |
|----------|--------|----------|-------------------|
| `p49-sample-lines-playtest-round-1.md` | Fixed-seed replay + expression review | Orthodox (301), Demonic (303), Merchant (804) | ⚠️ Partial — only generic merchant, not 3 bridge routes |
| `p49-sample-lines-playtest-round-2.md` | Same protocol, different tester | Same 3 lines | ⚠️ Partial — same limitation |
| `p65-merchant-trilogy-experience-reconciliation.md` | Doc-level evaluation (no fresh playtest) | 3 bridge routes × 3 dimensions | ✅ Yes — analytical evaluation baseline |

**Playtest gap:** No human-readable playtest-style readout specifically for the merchant trilogy (apprentice vs tavern vs peasant). Existing playtests only compare merchant as one line vs orthodox/demonic.

### 2.5 Closure Reports

| Document | Stage | Summary |
|----------|-------|---------|
| `p58-town-apprentice-merchant-bridge-closure-report.md` | P58 | Apprentice bridge complete |
| `p59-tavern-hand-bridge-closure-report.md` | P59 | Tavern hand bridge complete |
| `p61-farm-peasant-playable-bridge-closure-report.md` | P61 | Farm peasant bridge complete |
| `p63-merchant-entry-differentiation-closure-report.md` | P63 | Entry differentiation complete |
| `p64-merchant-pressure-payoff-differentiation-closure-report.md` | P64 | Pressure/payoff flavor complete |
| `p65-merchant-trilogy-player-experience-closure-report.md` | P65 | Trilogy reconciliation + priority ranking |
| `p66-success-cost-differentiation-closure-report.md` | P66 | Success-cost differentiation complete |
| `p67-success-shape-recap-closure-report.md` | P67 | Success-shape + recap complete |

**Closure asset total:** 8 reports providing the full narrative arc of the trilogy optimization.

---

## 3. Reusable Assets vs. Validation Gaps

### 3.1 Directly Reusable

| Asset Category | What's Reusable | How P68 Uses It |
|----------------|-----------------|-----------------|
| Proof docs | All 7 targeted proofs | Evidence base for comparison readout |
| Test suites | All 6 suites | Regression validation — no runtime changes expected |
| Closure reports | All 8 reports | Narrative context + methodology summary |
| P65 reconciliation | 3-dimension evaluation | Starting point for verdict framework |
| Replay CLI | `p49:replay` command | Can be used to generate fresh evidence if needed |
| P49 playtest protocol | Round 1 + Round 2 structure | Template for merchant-trilogy-specific playtest |

### 3.2 Validation Gaps (What P68 Needs to Fill)

| Gap | Why It Matters | How P68 Fills It |
|-----|---------------|------------------|
| **No merchant-trilogy-specific comparison readout** | Existing replay compares orthodox/demonic/merchant, not apprentice/tavern/peasant | P68-004: Produce a bounded 3-route comparison readout |
| **No human-readable playtest for 3 merchant routes** | P49 playtests treat "merchant" as one line; we need intra-merchant differentiation verdict | P68-005: Run a merchant-trilogy playtest-style readout |
| **No fixed verdict contract for player experience** | P65 had informal evaluation; P68 needs consistent pass/warning/fail rules | P68-003: Define a verdict contract with clear dimensions and thresholds |
| **No transfer-readiness judgment** | Closure reports say "it's better" but don't say "ready to migrate" | P68-006: Formal methodology transfer readiness judgment |
| **No single live-experience validation truth source** | Evidence is scattered across P58–P67 | P68-008: Closure report that consolidates all evidence |

### 3.3 What P68 Does NOT Need (Already Covered)

- Runtime implementation — P58–P67 already complete
- Structural validation — existing test suites cover this
- Bridge reachability — P58/P59/P61 already verified
- Differentiation existence — P63/P64/P66/P67 already proved
- Scope boundary definition — P65 already established the framework

---

## 4. Asset Summary Matrix

| Dimension | Proof | Tests | Replay | Playtest | Verdict |
|-----------|-------|-------|--------|----------|---------|
| Entry differentiation | ✅ P63 | ✅ p50 expression | ⚠️ Partial (seed 804 only) | ⚠️ Partial (generic merchant) | ❌ No fixed contract |
| Cost differentiation | ✅ P66 | ✅ p50 expression | ⚠️ Partial | ⚠️ Partial | ❌ No fixed contract |
| Success shape | ✅ P67 | ✅ p50 expression | ⚠️ Partial | ⚠️ Partial | ❌ No fixed contract |
| Destiny sentence | ✅ P67 | ✅ p50 expression | ⚠️ Partial | ❌ None | ❌ No fixed contract |
| 3-route comparison | ⚠️ Scattered | ⚠️ Per-route only | ❌ No trilogy view | ❌ No trilogy view | ❌ No single verdict |
| Transfer readiness | ❌ None | ❌ N/A | ❌ N/A | ❌ N/A | ❌ None |

---

## 5. Implications for P68 Stories

- **P68-002 (Scope contract):** Builds on P65 scope pattern — already has precedent
- **P68-003 (Verdict contract):** New work — no existing fixed verdict framework for merchant trilogy player experience
- **P68-004 (Comparison readout):** New synthesis — existing proof is per-stage, not per-dimension across all 3 routes
- **P68-005 (Playtest readout):** New angle — P49 protocol exists but never applied to intra-merchant comparison
- **P68-006 (Transfer readiness):** New judgment — P67 §7 has methodology template but no readiness verdict
- **P68-007 (Validation reinforcement):** Likely no new runtime work needed — gaps are readout-level, not implementation-level
- **P68-008 (Closure report):** Consolidation work — pulls all P58–P67 + P68 artifacts into one truth source

---

## 6. Conclusion

The merchant trilogy has **strong implementation-level validation** (tests, proofs, closures) but **weak live-experience validation** (no trilogy-specific comparison readout, no intra-merchant playtest, no fixed verdict contract, no transfer readiness judgment).

P68's job is to fill these readout-level gaps using existing implementation evidence — not to add new runtime content. The good news: all the raw material exists. P68 just needs to synthesize it into a player-experience verdict.

**Audit complete. No runtime changes in this story.**

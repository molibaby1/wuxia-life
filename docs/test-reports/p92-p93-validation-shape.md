# P92 → P93 Validation Shape

> **Date:** 2026-06-29
> **Stage:** P92 Wuxia Medical Endgame Design-First Contract
> **Purpose:** Define what P93 (endgame implementation) must prove — targeted proof nodes, regression assertions, closure criteria
> **Target Route:** `medical_sage_healer` (一代名医)
> **Variants:** Compassionate (仁心医者) + Pragmatic (世故人医)

---

## 1. Executive Summary

P93 implements the `medical_sage_healer` endgame / final legacy stage, strictly following the P92 endgame contract. This document defines the validation shape: what targeted proof is needed, what regression tests must pass, and what counts as "endgame closed."

**Core principle:** Targeted proof only. No full lifetime exhaust. No bulk testing. Focus on the endgame-specific chain nodes.

**6 branches = 2 variants × 3 choices.** Validation must cover all 6 branches + verify variant differentiation.

---

## 2. Targeted Proof Chain Nodes

### 2.1 Core Nodes (Must Have) — ~10 nodes

| # | Node | Type | Verification Method |
|---|------|------|-------------------|
| 1 | Pre-endgame baseline (post-late-life) | Core | Verify late-life state before endgame fires |
| 2 | Endgame echo event fires at age 60-65 | Core | Verify event triggers correctly with conditions |
| 3 | Comp-A (仁心不灭·烬) flags + identity | Core | Verify compassionate_ember marker + identity |
| 4 | Comp-B (医者从容·淡) flags + identity | Core | Verify compassionate_peace marker + identity |
| 5 | Comp-C (仁心满天下·传) flags + identity | Core | Verify compassionate_legacy marker + identity |
| 6 | Prag-A (医名犹存·寂) flags + identity | Core | Verify pragmatic_fame_remain marker + identity |
| 7 | Prag-B (江湖游医·遥) flags + identity | Core | Verify pragmatic_wanderer_legend marker + identity |
| 8 | Prag-C (一代宗师·名) flags + identity | Core | Verify pragmatic_grand_master marker + identity |
| 9 | Cost label per branch (sample line) | Core | Verify 6 distinct endgame cost labels |
| 10 | Current goal per branch (sample line) | Core | Verify 6 distinct endgame current goals |

### 2.2 Bonus Nodes (Nice to Have) — ~7 nodes

| # | Node | Type | Verification Method |
|---|------|------|-------------------|
| 11 | Endgame identity per branch | Bonus | Verify 6 distinct endgame identities |
| 12 | Ordinary origin expression per branch | Bonus | Verify current goal + life memory + summary |
| 13 | Full chain traceback (origin → bridge → on-ramp → pressure → payoff → late-life → endgame) | Bonus | Trace full medical route chain |
| 14 | Mutex with other lines (renown/merchant/orthodox/demonic) | Bonus | Verify endgame doesn't fire for other routes |
| 15 | Branch matching (late-life → endgame) | Bonus | Verify correct variant for each late-life branch |
| 16 | Two-variant differentiation (compassionate ≠ pragmatic) | Bonus | Verify 2 variants have fundamentally different legacy axes, not mirrors |
| 17 | No stat changes verification | Bonus | Verify endgame events have zero stat effects |

**Total: 10 core + 7 bonus = 17 nodes**

---

## 3. Regression Test Minimum Assertions

### 3.1 Test Groups — ~10 groups

| Group | Tests | Description |
|-------|-------|-------------|
| 1. Event wiring | 3-4 | Existence, auto type, age range, conditions |
| 2. Pre-endgame baseline | 2 | Sample line detection, cost label baseline |
| 3. Comp-A post-endgame (仁心不灭·烬) | 3-4 | Flags + cost label + current goal |
| 4. Comp-B post-endgame (医者从容·淡) | 3-4 | Flags + cost label + current goal |
| 5. Comp-C post-endgame (仁心满天下·传) | 3-4 | Flags + cost label + current goal |
| 6. Prag-A post-endgame (医名犹存·寂) | 3-4 | Flags + cost label + current goal |
| 7. Prag-B post-endgame (江湖游医·遥) | 3-4 | Flags + cost label + current goal |
| 8. Prag-C post-endgame (一代宗师·名) | 3-4 | Flags + cost label + current goal |
| 9. No regression P85/P86/P88/P90/P91 | 5 | Each prior stage still works |
| 10. Endgame identity + variant differentiation | 4-6 | 6 branches all different + 2 variants not mirrors |

**Total: ~30-37 tests**

### 3.2 Regression Boundaries

**Must NOT regress:**
- P85 bridge tests (p85TavernHandMedicalBridgeTests.ts)
- P86 entry tests (p86TavernHandMedicalEntryTests.ts)
- P88 on-ramp tests (p88TavernHandMedicalOnRampTests.ts)
- P90 pressure + payoff tests (p90TavernHandMedicalPressurePayoffTests.ts)
- P91 late-life tests (p91TavernHandMedicalLateLifeTests.ts)
- Typecheck passes
- Sample line baseline guard (if applicable)

**No full lifetime exhaust required.**

---

## 4. What Counts as Endgame Closed

### 4.1 Closure Criteria — 10 criteria

| # | Criterion | Evidence |
|---|-----------|----------|
| 1 | Endgame echo event fires correctly with right conditions | Test Group 1 + proof node 2 |
| 2 | Six variants present with distinct identities | Test Groups 3-8 + proof nodes 3-8 |
| 3 | Branch-specific flags set correctly (one per path) | Test Groups 3-8 + proof nodes 3-8 |
| 4 | No stat changes (endgame is memory, not power) | Test Groups 3-8 + contract verification |
| 5 | Cost label + current goal update per branch | Test Groups 3-8 + proof nodes 9-10 |
| 6 | Endgame identity deepens per branch | Test Group 10 + proof node 11 |
| 7 | Two variants remain meaningfully different (not mirrors) | Test Group 10 + proof node 16 |
| 8 | Tavern-born medical healer flavor consistent | Proof document flavor check |
| 9 | No P85/P86/P88/P90/P91 regressions | Test Group 9 + all prior suites pass |
| 10 | Typecheck passes | `npm run typecheck` exits 0 |

**Closure verdict: 10/10 criteria satisfied = PASS**

---

## 5. No-Regression Boundary

### 5.1 What Must Not Break

| Stage | Test File | Key Assertions |
|-------|-----------|----------------|
| P85 Bridge | p85TavernHandMedicalBridgeTests.ts | Bridge event fires, flags set, expression correct |
| P86 Entry | p86TavernHandMedicalEntryTests.ts | Entry differentiation from other lines |
| P88 On-ramp | p88TavernHandMedicalOnRampTests.ts | On-ramp event fires, expression updates |
| P90 Pressure + Payoff | p90TavernHandMedicalPressurePayoffTests.ts | Pressure + payoff events fire, 2×3 choices work |
| P91 Late-life | p91TavernHandMedicalLateLifeTests.ts | Late-life fires, 6 branches (2×3) work |

### 5.2 What We Don't Need to Verify

- Full lifetime exhaust (not required)
- All possible seed variations (targeted proof only)
- Other routes' endgame (medical only)
- P19 generic endgame integration (medical endgame is separate)
- Farm/town apprentice origins (tavern_hand only)
- All possible medical skill variations (targeted proof only)

---

## 6. Implementation → Validation Mapping

| Implementation Task | Validation |
|---------------------|------------|
| Endgame event wiring (sample-lines-spine.json) | Test Group 1: Event existence, type, age, conditions |
| Comp-A (仁心不灭·烬) flags + expression | Test Group 3 + proof nodes 3, 9, 10 |
| Comp-B (医者从容·淡) flags + expression | Test Group 4 + proof nodes 4, 9, 10 |
| Comp-C (仁心满天下·传) flags + expression | Test Group 5 + proof nodes 5, 9, 10 |
| Prag-A (医名犹存·寂) flags + expression | Test Group 6 + proof nodes 6, 9, 10 |
| Prag-B (江湖游医·遥) flags + expression | Test Group 7 + proof nodes 7, 9, 10 |
| Prag-C (一代宗师·名) flags + expression | Test Group 8 + proof nodes 8, 9, 10 |
| Endgame identity (sample line) | Test Group 10 + proof node 11 |
| Ordinary origin expression | Bonus proof node 12 |
| Full chain verification | Bonus proof node 13 |
| Mutex verification | Bonus proof node 14 |
| Branch matching | Bonus proof node 15 |
| Two-variant differentiation | Bonus proof node 16 |
| No stat changes verification | Bonus proof node 17 |
| Regression checks | Test Group 9 |

---

## 7. Lightweight Compliance Checks

P93 must verify these lightweight constraints are maintained:

| Constraint | Check |
|------------|-------|
| 1 echo event maximum | Verify conceptually 1 endgame event (not 6 separate) — implemented as 6 variant-specific auto events with unified event_record `medical_endgame_echo` |
| Expression updates only | Verify no new systems/framework |
| Auto event (not choice) | Verify event type is auto |
| ≤6 variants | Verify exactly 6 variants, no more |
| Single age window | Verify 60-65, no multiple stages |
| 2+ endgame signals | Verify cost label + current goal minimum |
| No stat changes | Verify no stat effects in endgame events |

---

## 8. Quality Priority Order for Validation

1. **Lightweight compliance** — verify endgame stays within scope
2. **No regressions** — prior stages still work
3. **Event wiring correctness** — event fires under right conditions
4. **Two-variant differentiation** — compassionate ≠ pragmatic (different axes, not mirrors)
5. **Branch differentiation** — 6 meaningfully different variants
6. **Flavor consistency** — tavern-born medical healer throughout
7. **Expression correctness** — all surfaces update correctly

---

## 9. Risk-Based Testing Priority

**High risk — test first:**
- Event conditions / gating (does it fire when it should, not fire when it shouldn't?)
- Branch matching (does late-life X → endgame X, correctly for all 6?)
- Two-variant integrity (compassionate ≠ pragmatic — are they different axes or just mirrors?)
- No stat changes (contract says no stats — verify)

**Medium risk:**
- Expression updates per branch
- Identity differentiation (6 branches all different)
- Mutex with other lines

**Low risk — can be bonus:**
- Full chain traceback
- Ordinary origin expression
- Flavor consistency (design-checked in P92)

---

**P92-006 complete.** P93 validation shape defined. 10 core + 7 bonus proof nodes. ~30-37 regression tests across 10 groups. 10 closure criteria. No full lifetime exhaust required. 0 runtime changes.

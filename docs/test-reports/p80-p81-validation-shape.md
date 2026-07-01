# P80 → P81 Validation Shape

> **Date:** 2026-06-29
> **Stage:** P80 Wuxia Renown Endgame Design-First Contract
> **Purpose:** Define what P81 (endgame implementation) must prove — targeted proof nodes, regression assertions, closure criteria

---

## 1. Executive Summary

P81 implements the `jianghu_renown_sage` endgame / final legacy stage, strictly following the P80 endgame contract. This document defines the validation shape: what targeted proof is needed, what regression tests must pass, and what counts as "endgame closed."

**Core principle:** Targeted proof only. No full lifetime exhaust. No bulk testing. Focus on the endgame-specific chain nodes.

---

## 2. Targeted Proof Chain Nodes

### 2.1 Core Nodes (Must Have) — ~7 nodes

| # | Node | Type | Verification Method |
|---|------|------|-------------------|
| 1 | Pre-endgame baseline (post-late-life) | Core | Verify late-life state before endgame fires |
| 2 | Endgame echo event fires at age 60-65 | Core | Verify event triggers correctly with conditions |
| 3 | Branch A (叹) flags + identity | Core | Verify endgame_sigh marker + identity |
| 4 | Branch B (遥) flags + identity | Core | Verify endgame_distant marker + identity |
| 5 | Branch C (传) flags + identity | Core | Verify endgame_legacy marker + identity |
| 6 | Cost label per branch (sample line) | Core | Verify 身后名·叹/遥/传 |
| 7 | Current goal per branch (sample line) | Core | Verify endgame current goal |

### 2.2 Bonus Nodes (Nice to Have) — ~5 nodes

| # | Node | Type | Verification Method |
|---|------|------|-------------------|
| 8 | Endgame identity per branch | Bonus | Verify 熬干了的老传说 / 传说里的神秘人 / 活在传说里的老掌柜 |
| 9 | Ordinary origin expression per branch | Bonus | Verify current goal + life memory + summary |
| 10 | Full chain traceback (origin → bridge → on-ramp → pressure → payoff → late-life → endgame) | Bonus | Trace full renown route chain |
| 11 | Mutex with other lines (merchant/orthodox/demonic) | Bonus | Verify endgame doesn't fire for other routes |
| 12 | Branch matching (late-life → endgame) | Bonus | Verify correct variant for each late-life branch |

**Total: 7 core + 5 bonus = 12 nodes**

---

## 3. Regression Test Minimum Assertions

### 3.1 Test Groups — ~7 groups

| Group | Tests | Description |
|-------|-------|-------------|
| 1. Event wiring | 3-4 | Existence, auto type, age range, conditions |
| 2. Pre-endgame baseline | 2 | Sample line detection, cost label baseline |
| 3. Branch A post-endgame | 3-4 | Flags + cost label + current goal |
| 4. Branch B post-endgame | 3-4 | Flags + cost label + current goal |
| 5. Branch C post-endgame | 3-4 | Flags + cost label + current goal |
| 6. No regression P71/P73/P75/P77/P79 | 5 | Each prior stage still works |
| 7. Endgame identity verification | 3-4 | 3 branches + all different |

**Total: ~22-27 tests**

### 3.2 Regression Boundaries

**Must NOT regress:**
- P71 bridge tests (p71TavernHandRenownBridgeTests.ts)
- P72 entry differentiation tests (p72TavernHandRenownEntryDifferentiationTests.ts)
- P73 on-ramp tests (p73TavernHandRenownOnRampSpineTests.ts)
- P75 pressure tests (p75TavernHandRenownPressureSpineTests.ts)
- P77 payoff tests (p77TavernHandRenownPayoffSpineTests.ts)
- P79 late-life tests (p79TavernHandRenownLateLifeSpineTests.ts)
- Typecheck passes
- Sample line baseline guard (if applicable)

**No full lifetime exhaust required.**

---

## 4. What Counts as Endgame Closed

### 4.1 Closure Criteria — 9 criteria

| # | Criterion | Evidence |
|---|-----------|----------|
| 1 | Endgame echo event fires correctly with right conditions | Test Group 1 + proof node 2 |
| 2 | Three variants present with distinct identities | Test Groups 3/4/5 + proof nodes 3/4/5 |
| 3 | Branch-specific flags set correctly (one per path) | Test Groups 3/4/5 + proof nodes 3/4/5 |
| 4 | No stat changes (endgame is memory, not power) | Test Groups 3/4/5 + contract verification |
| 5 | Cost label + current goal update per branch | Test Groups 3/4/5 + proof nodes 6/7 |
| 6 | Endgame identity deepens per branch | Test Group 7 + proof node 8 |
| 7 | Tavern-born flavor consistent across all branches | Proof document flavor check |
| 8 | No P71/P72/P73/P75/P77/P79 regressions | Test Group 6 + all prior suites pass |
| 9 | Typecheck passes | `npm run typecheck` exits 0 |

**Closure verdict: 9/9 criteria satisfied = PASS**

---

## 5. No-Regression Boundary

### 5.1 What Must Not Break

| Stage | Test File | Key Assertions |
|-------|-----------|----------------|
| P71 Bridge | p71TavernHandRenownBridgeTests.ts | Bridge event fires, flags set, expression correct |
| P72 Entry | p72TavernHandRenownEntryDifferentiationTests.ts | Entry differentiation from other lines |
| P73 On-ramp | p73TavernHandRenownOnRampSpineTests.ts | On-ramp event fires, expression updates |
| P75 Pressure | p75TavernHandRenownPressureSpineTests.ts | Pressure event fires, expression updates |
| P77 Payoff | p77TavernHandRenownPayoffSpineTests.ts | Payoff event fires, 3 choices work |
| P79 Late-life | p79TavernHandRenownLateLifeSpineTests.ts | Late-life fires, 3 branches work |

### 5.2 What We Don't Need to Verify

- Full lifetime exhaust (not required)
- All possible seed variations (targeted proof only)
- Other routes' endgame (renown only)
- P19 generic endgame integration (renown endgame is separate)
- Farm/town apprentice origins (tavern_hand only)

---

## 6. Implementation → Validation Mapping

| Implementation Task | Validation |
|---------------------|------------|
| Endgame event wiring (sample-lines-spine.json) | Test Group 1: Event existence, type, age, conditions |
| Branch A (叹) flags + expression | Test Group 3 + proof nodes 3, 6, 7 |
| Branch B (遥) flags + expression | Test Group 4 + proof nodes 4, 6, 7 |
| Branch C (传) flags + expression | Test Group 5 + proof nodes 5, 6, 7 |
| Endgame identity (sample line) | Test Group 7 + proof node 8 |
| Ordinary origin expression | Bonus proof nodes 9 |
| Full chain verification | Bonus proof node 10 |
| Mutex verification | Bonus proof node 11 |
| Branch matching | Bonus proof node 12 |
| Regression checks | Test Group 6 |

---

## 7. Lightweight Compliance Checks

P81 must verify these lightweight constraints are maintained:

| Constraint | Check |
|------------|-------|
| 1 echo event maximum | Verify only 1 endgame event (not 3 separate) |
| Expression updates only | Verify no new systems/framework |
| Auto event (not choice) | Verify event type is auto |
| 3 variants max | Verify exactly 3 variants, no more |
| Single age window | Verify 60-65, no multiple stages |
| 2+ endgame signals | Verify cost label + current goal minimum |
| No stat changes | Verify no stat effects in endgame event |

---

## 8. Quality Priority Order for Validation

1. **Lightweight compliance** — verify endgame stays within scope
2. **No regressions** — prior stages still work
3. **Event wiring correctness** — event fires under right conditions
4. **Branch differentiation** — 3 meaningfully different variants
5. **Flavor consistency** — tavern-born renown throughout
6. **Expression correctness** — all surfaces update correctly

---

## 9. Risk-Based Testing Priority

**High risk — test first:**
- Event conditions / gating (does it fire when it should, not fire when it shouldn't?)
- Branch matching (does late-life A → endgame A, correctly?)
- No stat changes (contract says no stats — verify)

**Medium risk:**
- Expression updates per branch
- Identity differentiation
- Mutex with other lines

**Low risk — can be bonus:**
- Full chain traceback
- Ordinary origin expression
- Flavor consistency (design-checked in P80)

---

**P80-006 complete.** P81 validation shape defined. 7 core + 5 bonus proof nodes. ~22-27 regression tests across 7 groups. 9 closure criteria. No full lifetime exhaust required. 0 runtime changes.

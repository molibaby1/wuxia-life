# P74 Renown Pressure Design-First — Closure Report

> **Date:** 2026-06-29
> **Stage:** P74 Wuxia Renown Pressure Design-First
> **Branch:** codex/p74-wuxia-renown-pressure-design-first
> **Status:** Complete — 6/6 user stories passed

---

## 1. Executive Summary

P74 successfully delivered the **design-first contract** for the `jianghu_renown_sage` (江湖名宿) pressure stage. After this stage, the renown route has a clearly defined pressure direction, event structure, expression updates, and validation shape — all ready for P75 to implement.

**What was delivered:**
- 1 prerequisite audit (existing infrastructure mapped)
- 1 scope contract (design-only boundaries locked)
- 1 direction comparison (3 candidates evaluated, 1 selected)
- 1 pressure contract (人情债渐重 / Favor Debt Burden)
- 1 P75 validation shape (targeted proof + regression boundaries)
- 1 closure report (this document)

**Selected direction:** 人情债渐重 (Favor Debt Burden)
- Tavern-born renown flavor: 5/5
- Boundedness: 5/5
- Implementation risk: Low
- Natural extension of on-ramp (人情 → 人情债)

**Scope discipline:** Strictly design-first — 6/6 stories are documentation-only. Zero runtime code changes. Zero scope creep.

---

## 2. Stage Outputs Summary

### 2.1 Prerequisite Audit (P74-001)

**Document:** `docs/test-reports/p74-renown-pressure-prerequisite-audit.md`

**Key findings:**
- 3-stage foundation verified: bridge (P71) + entry (P72) + on-ramp (P73)
- 8+ flags/markers identified, with `renown_on_ramp_done` as the direct upstream gate
- 6+ expression surfaces available for pressure updates
- 2 events already in place: bridge (choice) + on-ramp (auto)
- 3 test suites + targeted proof + guard harness already exist
- Merchant pressure precedent available as reference pattern
- Tavern-born flavor consistent across all existing stages

**Conclusion:** Sufficient foundation for pressure stage design.

### 2.2 Scope Contract (P74-002)

**Document:** `docs/test-reports/p74-renown-pressure-scope-contract.md`

**Allowed layers (4):**
1. Gap audit / prerequisite analysis
2. Direction comparison / selection
3. Pressure contract definition
4. Validation shape definition

**Forbidden expansions (12):**
- Runtime event wiring
- Runtime expression updates
- New framework / system
- Bulk content wave
- Payoff stage design
- Late identity deepening
- Second renown seed (mentor-bond)
- Other origins (farm/town/apprentice)
- Full renown route lifecycle planning
- Stat threshold gate validation
- Cross-route interactions
- New UI components

**Red line:** No runtime code changes under `src/` directory.

### 2.3 Pressure Direction Comparison (P74-003)

**Document:** `docs/test-reports/p74-renown-pressure-direction-comparison.md`

**3 candidates evaluated:**

| Candidate | Tavern-Born Fit | Boundedness | Risk | Verdict |
|-----------|-----------------|-------------|------|---------|
| A: 人情债渐重 (Favor Debt Burden) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Low | **Selected** |
| B: 声名之累 (Fame Burden) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Medium | Deferred (backup) |
| C: 江湖恩怨站队 (Faction Conflict) | ⭐⭐⭐ | ⭐⭐ | High | Rejected |

**Selected: A — 人情债渐重 (Favor Debt Burden)**

Rationale:
1. **Best flavor fit:** Pure renown — 人情/面子/酒肆, not martial arts, not money
2. **Most bounded:** 1 event + 2-3 expression updates, zero new systems
3. **Best on-ramp continuity:** On-ramp is about 人情/面子; pressure is 人情债 — natural deepening
4. **Most memorable:** "人情债" is specific and vivid, vs generic "声名之累"
5. **Good payoff potential:** How to handle the debt — natural payoff direction

**Rejected:**
- B (声名之累): Too generic, less distinctive, less tightly coupled to on-ramp
- C (江湖恩怨站队): Too much scope, risks generic jianghu flavor, high implementation risk

### 2.4 Pressure Contract (P74-004)

**Document:** `docs/PRD/p74-renown-pressure-contract.md`

**Core contract:**

| Item | Value |
|------|-------|
| **Direction** | 人情债渐重 (Favor Debt Burden) |
| **Event ID** | `renown_midlife_pressure` |
| **Event type** | Auto (mandatory milestone) |
| **Age range** | 37–41 |
| **Upstream gate** | `renown_on_ramp_done` |
| **Checkpoint flag** | `renown_midlife_pressure_done` |
| **Event marker** | `tavern_renown_pressure` |
| **Location** | `sample-lines-spine.json` |

**Core narrative:**
> 名声越大，欠下的人情越多。酒肆里一拨又一拨的人——报恩的、讨债的、求你出面的。你站在柜台后，才明白——这人情债，是真的能压得人喘不过气。

**Player-facing signals (2+ core):**
1. **Cost label:** "江湖声名之累" → "人情债渐重"
2. **Current goal:** "常有人来请你主持公道、引荐高人" → "一面维持声名，一面应付越来越重的人情债"

**Expression surfaces (5 total: 3 P0 + 2 P1):**
- Sample line currentGoal (P0)
- Sample line cost label (P0)
- Ordinary origin currentGoal (P0)
- Ordinary origin lifeMemory (P1)
- Ordinary origin summary (P1)

**Differentiation:**
- vs On-ramp: 上升期 vs 维持期, 成就感 vs 压力感
- vs Generic midlife: renown-specific 人情债 vs generic 中年危机
- vs Merchant pressure: 人情债 vs 金钱债, 酒肆 vs 商铺

**Payoff interfaces reserved:**
- `renown_payoff_done` (flag, not implemented)
- `renown_age40_identity_done` (flag, not implemented)

**Flavor verification:** ✅ All 6 tavern-born anchors pass

### 2.5 P75 Validation Shape (P74-005)

**Document:** `docs/test-reports/p74-p75-validation-shape.md`

**Targeted proof chain:**
- ~12 total nodes, 5 core nodes (P0)
- Core nodes: pre-pressure state → pressure event fires → checkpoint set → cost label updates → current goal updates
- Bonus nodes: life memory, summary, full chain traceback
- No full lifetime exhaust required

**Regression tests:**
- ~14-17 assertions across 5 groups
- Group 1: Event wiring (5 tests)
- Group 2: Pre-pressure state (2 tests)
- Group 3: Post-pressure expression updates (5 tests: 3 P0 + 2 P1)
- Group 4: Distinct from merchant pressure (2 tests)
- Group 5: No regression of P71/P72/P73 (4 tests)

**Closure criteria (9 items, all must pass):**
1. Pressure event fires correctly
2. Checkpoint flag set correctly
3. Cost label updates correctly
4. Current goal updates correctly
5. Tavern-born flavor consistent
6. No P71/P72/P73 regressions
7. Typecheck passes
8. Sample-lines-baseline guard passes
9. Payoff flag interfaces reserved

**Regression boundaries:**
- P71 bridge: must not regress
- P72 entry differentiation: must not regress
- P73 on-ramp: must not regress
- Allowed changes: pressure-specific expression updates (5 surfaces)

---

## 3. Scope Compliance

### 3.1 Allowed Layers — All Used ✅

| Layer | Used? | Evidence |
|-------|-------|----------|
| Gap audit / prerequisite analysis | ✅ | P74-001 prerequisite audit |
| Direction comparison / selection | ✅ | P74-003 direction comparison (3 candidates) |
| Pressure contract definition | ✅ | P74-004 pressure contract |
| Validation shape definition | ✅ | P74-005 P75 validation shape |
| Documentation | ✅ | 6 documents total |

### 3.2 Forbidden Expansions — All Avoided ✅

| Forbidden Expansion | Status | Notes |
|---------------------|--------|-------|
| Runtime event wiring | ✅ Not done | Contract-only, no `src/` changes |
| Runtime expression updates | ✅ Not done | Contract-only, no `src/` changes |
| New framework / system | ✅ Not done | Zero new systems |
| Bulk content wave | ✅ Not done | 1 event defined, contract only |
| Payoff stage design | ✅ Not done | Only flag interfaces reserved |
| Late identity deepening | ✅ Not done | Deferred to payoff stage |
| Second renown seed | ✅ Not done | Single seed route only |
| Other origins | ✅ Not done | Tavern_hand only |
| Full route lifecycle | ✅ Not done | Pressure only |
| Stat threshold validation | ✅ Not done | Defined in contract, not validated |
| Cross-route interactions | ✅ Not done | Single route focus |
| New UI components | ✅ Not done | Reuse existing expression surfaces |

### 3.3 Runtime Changes — Zero ✅

**Verification:** No files under `src/` modified.
- All changes under `docs/` directory
- All changes under `progress.txt` (non-runtime)
- `prd.json` updated (non-runtime)

**Scope compliance: ✅ 100%**

---

## 4. Boundary With P75

### 4.1 What P74 Delivers to P75

P74 hands off to P75:
1. **Clear direction:** 人情债渐重 — no need for P75 to re-decide
2. **Detailed contract:** Event spec, flag spec, expression update spec — P75 implements directly
3. **Validation shape:** What to prove, what to test, what counts as done
4. **GO recommendation:** Pressure stage is worth implementing

### 4.2 What P75 Is Responsible For

P75 implementation stage covers:
- Runtime event wiring in `sample-lines-spine.json`
- Runtime expression updates in `sampleLineExpression.ts` + `ordinaryOriginExpression.ts`
- Targeted proof artifact
- Regression tests
- Typecheck + guard validation
- Closure report

### 4.3 What P75 Must Not Do (P74 Deferred Items)

P75 should not expand into:
- Payoff stage design or implementation
- Age-40 identity deepening
- Second renown seed
- Other origins
- Choice-based pressure (auto is the contract)
- Stat threshold gates (optional enhancement, not required)

---

## 5. Deferred Renown-Expansion Items

The following remain deferred after P74:

| Item | Rationale | Suggested Stage |
|------|-----------|-----------------|
| Payoff stage design & implementation | Pressure-only stage | P76+ (design-first, then implementation) |
| Age-40 identity deepening | Payoff stage concern | P75+ |
| Choice-based pressure (accept/decline) | Auto chosen for simplicity; can add later | Future refinement |
| Stat threshold gate implementation | Contract defines it; implementation optional | P75 or later |
| Mentor-bond renown seed | Second seed route, high scope | Future cycle |
| Farm_peasant / town_apprentice renown bridges | Other origins out of scope | Future cycles |
| Full renown route expansion | Way beyond pressure scope | Far future |
| Cross-route interaction (renown × merchant) | No route interaction systems | Far future |
| Renown-specific UI components | No new UI in P74 | Far future |
| Fame burden direction (candidate B) | Backup direction, not selected | If 人情债 proves weak |

---

## 6. GO / NO-GO Recommendation

### 6.1 Assessment

**Is the pressure stage worth implementing?**

| Dimension | Score | Notes |
|-----------|-------|-------|
| Foundation strength | ✅ Strong | 3-stage foundation verified |
| Direction clarity | ✅ Clear | 人情债渐重 — specific, flavorful, bounded |
| Flavor consistency | ✅ Excellent | 5/5 tavern-born renown fit |
| Implementation risk | ✅ Low | 1 event + 5 expression updates, zero new systems |
| Narrative value | ✅ High | Adds depth — renown has a cost, not just benefit |
| Precedent alignment | ✅ Good | Follows merchant pressure pattern, same structure |
| Small-step fit | ✅ Excellent | Minimal changes, easy to verify |

### 6.2 Recommendation

**GO for pressure implementation stage (P75).**

**Why GO:**
1. **Strong foundation:** Bridge + entry + on-ramp are all verified and stable
2. **Clear direction:** 人情债渐重 is well-defined, flavorful, and bounded
3. **Low risk:** Implementation is straightforward — follow the contract
4. **High value:** Adds narrative depth and cost to the renown route
5. **Precedent proven:** Merchant pressure pattern works; renown pressure follows same shape

**Conditions / risks to monitor:**
- Stay strictly within the contract — no scope creep into payoff
- Keep tavern-born flavor discipline — don't slip into generic jianghu
- Validate with existing test harness — don't break P71/P72/P73

---

## 7. Files Created/Modified

### Created (6 files)
- `docs/test-reports/p74-renown-pressure-prerequisite-audit.md` — Prerequisite audit
- `docs/test-reports/p74-renown-pressure-scope-contract.md` — Scope contract
- `docs/test-reports/p74-renown-pressure-direction-comparison.md` — Direction comparison
- `docs/PRD/p74-renown-pressure-contract.md` — Pressure contract
- `docs/test-reports/p74-p75-validation-shape.md` — P75 validation shape
- `docs/test-reports/p74-renown-pressure-closure-report.md` — This report

### Modified (2 files)
- `docs/PRD/p74-wuxia-renown-pressure-design-first.prd.json` — Updated story statuses
- `progress.txt` — Progress tracking

### Zero runtime changes
- No files under `src/` modified
- No configuration files modified
- No test files modified

---

## 8. Story Completion Summary

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| P74-001 | Audit renown pressure prerequisites | 1 | ✅ Pass |
| P74-002 | Lock P74 scope contract | 2 | ✅ Pass |
| P74-003 | Compare renown pressure directions | 3 | ✅ Pass |
| P74-004 | Define renown pressure contract | 4 | ✅ Pass |
| P74-005 | Define P75 validation shape | 5 | ✅ Pass |
| P74-006 | Produce P74 closure report | 6 | ✅ Pass |

**6/6 stories: ✅ All passed**

---

## 9. Final Verdict

P74 is **complete and ready for handoff** to verification (A1-verify) and then to P75 implementation.

The renown route now has a complete design-first contract for pressure:
- **Direction:** 人情债渐重 — tavern-born renown pressure at its finest
- **Contract:** Event, flags, expression updates — all clearly specified
- **Validation:** What to prove and test — all locked in advance
- **Recommendation:** GO for P75 implementation

**Next recommended step:** P75 renown pressure implementation — follow the contract, stay bounded, keep the flavor.

---

**P74-006 complete.** Closure report saved. 6/6 stories passed.

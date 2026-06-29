# P90 Medical Late-Life Scope Contract

> **Date:** 2026-06-29
> **Stage:** P90 Wuxia Medical Late-Life Design-First
> **Purpose:** Lock scope boundaries so P90 stays design-first and does not slip into partial implementation
> **Target Route:** `medical_sage_healer` (一代名医)
> **Origin:** `tavern_hand` (酒肆帮工)
> **Branches:** 6 (2 variants × 3 choices) — upper bound, allow reduction if needed

---

## 1. Scope Statement

**P90 is a design-first contract stage for `medical_sage_healer` late-life.** It defines what late-life looks like (6 branches per 2-variant × 3-choice payoff structure), how it connects to existing systems, and what P91 (implementation) must deliver — but does NOT implement any runtime changes.

**Core question:** Is late-life worth doing for medical route, and if so, what exact shape should it take? Can we make 6 branches all feel meaningful and different, with compassionate vs pragmatic variants feeling fundamentally different in late-life?

**Key differentiator from renown late-life:** Medical has 2 variants (compassionate + pragmatic) × 3 choices each = 6 branches, vs renown's 3 branches from a single variant. This is more complex but also creates richer differentiation opportunities.

---

## 2. Allowed Layers

P90 may work in the following layers only:

| Layer | Allowed? | Description | Deliverable |
|-------|----------|-------------|-------------|
| Prerequisite audit | ✅ Yes | Audit existing medical route foundations (5 stages deep) | Prerequisite audit doc (P90-001) |
| Scope contract | ✅ Yes | Define boundaries for this stage | This document (P90-002) |
| Branch design | ✅ Yes | Design 6 late-life branches (one per payoff choice, 2 variants) | Branch design doc (P90-003) |
| Late-life contract | ✅ Yes | Define flags, gates, events, expression updates | Contract doc (P90-004) |
| Validation shape | ✅ Yes | Define what P91 must prove | Validation shape doc (P90-005) |
| Closure report | ✅ Yes | Summarize, assess GO/NO-GO, hand off to P91 | Closure report (P90-006) |

**Total allowed layers: 6** — all focused on design, documentation, and planning.

---

## 3. Forbidden Expansions

The following are explicitly out of scope for P90:

| Forbidden Item | Rationale |
|----------------|-----------|
| Runtime event wiring | P90 is design-only; implementation is P91 |
| Expression code changes (sampleLineExpression.ts, ordinaryOriginExpression.ts) | No runtime changes in design-first stage |
| New framework or system | Zero new systems; reuse existing architecture |
| Endgame / final legacy design | Endgame is P92+ or later; stay focused on late-life |
| Second medical seed (other origins) | Single seed (tavern_hand) only for now |
| Other origins (farm_peasant, town_apprentice) | Tavern_hand only |
| Plague hero / medical pure full choice line | Expansion beyond current scope |
| Poison path as main route | Alternative medical route, not focus of this stage |
| Multiple late-life events per variant | Recommend single event with 6 branches for boundedness |
| Stat threshold gate implementation | Optional enhancement, not needed for contract |
| Bulk content wave | Design-only; no content production |
| New UI components | Reuse existing expression surfaces |
| Cross-route interactions | Single route focus |
| Full medical route expansion planning | Way beyond late-life scope |
| Full lifetime exhaust testing | Targeted proof only; no exhaust required |
| Orthodox/demonic childhood seed medical route | Only tavern-born ordinary origin in scope |

**Total forbidden items: 16**

---

## 4. Scope Guardrails

### 4.1 Boundedness Guardrail
- Late-life should be bounded: **1 auto event with 6 branches** (recommended) + expression updates
- NOT a full late-life expansion with multiple events per variant
- Rationale: Medical route is still new (only 1 origin); 6 branches is already complex enough
- If 6 branches feel too thin or redundant, allow reduction to 4-5 branches

### 4.2 Flavor Guardrail
- **Must** maintain tavern-born medical healer flavor
- **Must not** become generic old doctor late-life
- **Must** differentiate from renown late-life (healer identity vs jianghu renown identity)
- Each of the 6 branches must have distinct tavern-born healer flavor anchors

### 4.3 Differentiation Guardrails
- **6-branch differentiation:** 6 late-life branches **must** be meaningfully different (not reskinned)
- **2-variant differentiation:** Compassionate and pragmatic late-life **must** feel fundamentally different (not mirrored)
- Each branch must correspond to a distinct payoff choice identity
- Differences should span: narrative, stats, identity, expression, player experience

### 4.4 GO/NO-GO Guardrail
- P90 **must** explicitly assess whether late-life is worth doing
- NO-GO is a valid outcome — if late-life adds insufficient narrative value, stop here
- NO-GO must include clear rationale and stopping point
- GO must be conditional on scope discipline (bounded, single event with ≤6 branches)
- If 6 branches is too ambitious and some feel weak, allow reduction rather than forcing all 6

---

## 5. GO / NO-GO Criteria

### 5.1 Conditions for GO
If all of the following are true, P90 should recommend GO for P91:
1. ✅ 6 late-life branches are meaningfully differentiated (not reskinned) — or fewer if some were cut with clear rationale
2. ✅ 2 variants have fundamentally different late-life directions (compassionate ≠ pragmatic, not mirrored)
3. ✅ Each branch has clear tavern-born healer flavor
4. ✅ Late-life adds meaningful narrative value beyond payoff
5. ✅ Implementation scope is bounded (1 event + expression updates)
6. ✅ Contract is clear enough for P91 to pick up without rework
7. ✅ 2-variant × 3-choice structure is leveraged (late-life would be less interesting without it)
8. ✅ Clearly differentiated from renown late-life

### 5.2 Conditions for NO-GO
If any of the following are true, P90 should recommend NO-GO:
1. ❌ Late-life feels like "more of the same" (no new narrative dimension)
2. ❌ The 6 branches are basically reskinned versions of each other
3. ❌ Compassionate and pragmatic variants feel like mirrors in late-life
4. ❌ Payoff already feels like a satisfying conclusion
5. ❌ Implementation scope would balloon beyond 1 event
6. ❌ Tavern-born healer flavor can't be maintained in late-life
7. ❌ Narrative value doesn't justify implementation effort (6 branches = higher bar)
8. ❌ Too similar to renown late-life (no medical-unique identity)

---

## 6. Rollback Strategy

If at any point P90 scope is violated or value becomes unclear:

### 6.1 Full Rollback
- Revert all P90 documentation (or keep as reference)
- Stay at P89 payoff-only state
- Medical route remains complete with bridge → entry → on-ramp → pressure → payoff

### 6.2 Partial Rollback Scenarios
- If branch design reveals lack of differentiation → cut weakest branches, keep 4-5 strongest
- If scope creeps toward endgame → cut endgame parts, focus on late-life only
- If flavor becomes generic → redesign with stronger tavern-born healer anchors
- If variants feel too similar → strengthen variant-specific late-life directions

---

## 7. Boundary with P91 (Implementation)

| P90 (Design-First) | P91 (Implementation) |
|-------------------|---------------------|
| Prerequisite audit | Runtime event wiring in sample-lines-spine.json |
| Scope contract (this doc) | Expression updates in sampleLineExpression.ts |
| Branch design | Expression updates in ordinaryOriginExpression.ts |
| Late-life contract doc | Targeted proof document |
| Validation shape doc | Regression tests |
| Closure report + GO/NO-GO | Closure report |

**P91 must deliver on everything defined in the late-life contract. No scope expansion beyond what's defined in P90 without a new PRD.**

---

## 8. Quality Priority Order

When tradeoffs must be made, prioritize in this order:
1. **Flavor consistency** — tavern-born medical healer must feel right
2. **2-variant differentiation** — compassionate vs pragmatic must feel fundamentally different
3. **6-branch meaningfulness** — each branch must feel distinct and worth having
4. **Scope boundedness** — keep it small, keep it verifiable
5. **Implementation clarity** — P91 should know exactly what to do
6. **Narrative richness** — good but not at the expense of the above

---

## 9. Verification Method

Since P90 is design-only, verification consists of:
1. ✅ prd.json is valid JSON
2. ✅ All 6 user stories have passes: true
3. ✅ Contract document is clear and unambiguous
4. ✅ GO/NO-GO recommendation is explicit with rationale
5. ✅ No runtime code changes (verify via git diff)
6. ✅ All deliverable documents exist and are complete
7. ✅ 2 variants have genuinely different late-life directions
8. ✅ 6 branches are meaningfully differentiated (or fewer with clear rationale)

---

*Scope contract locked. P90-002 passed.*

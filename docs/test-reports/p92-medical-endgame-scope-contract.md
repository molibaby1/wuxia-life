# P92 Medical Endgame Scope Contract

> **Date:** 2026-06-29
> **Stage:** P92 Wuxia Medical Endgame Design-First
> **Purpose:** Lock scope boundaries so P92 stays design-first and does not slip into partial implementation
> **Target Route:** `medical_sage_healer` (一代名医)
> **Origin:** `tavern_hand` (酒肆帮工)
> **Branches:** 6 (2 variants × 3 choices) — upper bound, allow reduction if needed

---

## 1. Scope Statement

**P92 is a design-first contract stage for `medical_sage_healer` endgame / final legacy.** It defines what endgame looks like (6 branches per 2-variant × 3-choice late-life structure), how it connects to existing systems, and what P93 (implementation) must deliver — but does NOT implement any runtime changes.

**Core question:** Is endgame worth doing for medical route, and if so, what exact shape should it take? Can we make 6 branches all feel meaningful and different, with compassionate vs pragmatic variants feeling fundamentally different in endgame?

**Key differentiator from renown endgame:** Medical has 2 variants (compassionate + pragmatic) × 3 choices each = 6 branches, vs renown's 3 branches from a single variant. This is more complex but also creates richer differentiation opportunities.

**Lightweight constraint:** Endgame must be LIGHTWEIGHT — max 1 echo event + expression updates only. No stat changes, no multi-event arc, no new systems.

---

## 2. Allowed Layers

P92 may work in the following layers only:

| Layer | Allowed? | Description | Deliverable |
|-------|----------|-------------|-------------|
| Prerequisite audit | ✅ Yes | Audit existing medical route foundations (6 stages deep) | Prerequisite audit doc (P92-001) |
| Scope contract | ✅ Yes | Define boundaries for this stage | This document (P92-002) |
| Endgame direction assessment | ✅ Yes | GO/NO-GO assessment + core positioning | Direction assessment doc (P92-003) |
| Branch design | ✅ Yes | Design 6 endgame branches (one per late-life branch, 2 variants) | Branch design doc (P92-004) |
| Endgame contract | ✅ Yes | Define flags, gates, events, expression updates | Contract doc (P92-005) |
| Validation shape | ✅ Yes | Define what P93 must prove | Validation shape doc (P92-006) |
| Closure report | ✅ Yes | Summarize, assess GO/NO-GO, hand off to P93 | Closure report (P92-007) |

**Total allowed layers: 7** — all focused on design, documentation, and planning.

---

## 3. Forbidden Expansions

The following are explicitly out of scope for P92:

| Forbidden Item | Rationale |
|----------------|-----------|
| Runtime event wiring | P92 is design-only; implementation is P93 |
| Expression code changes (sampleLineExpression.ts, ordinaryOriginExpression.ts) | No runtime changes in design-first stage |
| New framework or system | Zero new systems; reuse existing architecture |
| Second medical seed (other origins) | Single seed (tavern_hand) only for now |
| Other origins (farm_peasant, town_apprentice) | Tavern_hand only |
| Plague hero / medical pure full choice line | Expansion beyond current scope |
| Poison path as main route | Alternative medical route, not focus of this stage |
| Multiple endgame events per variant | Recommend single echo event with 6 branches for boundedness |
| Stat threshold gate implementation | Optional enhancement, not needed for contract |
| Bulk content wave | Design-only; no content production |
| New UI components | Reuse existing expression surfaces |
| Cross-route interactions | Single route focus |
| Full medical route expansion planning | Way beyond endgame scope |
| Full lifetime exhaust testing | Targeted proof only; no exhaust required |
| Orthodox/demonic childhood seed medical route | Only tavern-born ordinary origin in scope |
| Multi-event endgame arc | Single echo event only — lightweight constraint |
| Stat changes in endgame | Endgame is memory / legacy, not power |
| P19 generic endgame integration | Route-specific echo coexists with P19, does not integrate with or modify it |

**Total forbidden items: 18**

---

## 4. Scope Guardrails

### 4.1 Boundedness Guardrail
- Endgame should be bounded: **1 auto echo event with 6 branches** (recommended) + expression updates
- NOT a full endgame expansion with multiple events per variant
- Rationale: Medical route is still new (only 1 origin); 6 branches is already complex enough
- If 6 branches feel too thin or redundant, allow reduction to 4-5 branches
- **Lightweight constraint is non-negotiable:** 1 event + expression updates only, no stat changes

### 4.2 Flavor Guardrail
- **Must** maintain tavern-born medical healer flavor
- **Must not** become generic old doctor endgame
- **Must** differentiate from renown endgame (healer identity vs jianghu renown identity)
- Each of the 6 branches must have distinct tavern-born healer flavor anchors

### 4.3 Differentiation Guardrails
- **6-branch differentiation:** 6 endgame branches **must** be meaningfully different (not reskinned)
- **2-variant differentiation:** Compassionate and pragmatic endgame **must** feel fundamentally different (not mirrored)
- Each branch must correspond to a distinct late-life identity
- Differences should span: narrative, identity, expression, player experience

### 4.4 GO/NO-GO Guardrail
- P92 **must** explicitly assess whether endgame is worth doing
- NO-GO is a valid outcome — if endgame adds insufficient narrative value, stop here
- NO-GO must include clear rationale and stopping point (late-life = medical route end)
- GO must be conditional on scope discipline (bounded, single event with ≤6 branches, lightweight)
- If 6 branches is too ambitious and some feel weak, allow reduction rather than forcing all 6

---

## 5. Lightweight Compliance Contract

P93 implementation (if GO) MUST adhere to these lightweight constraints:

| Constraint | Requirement |
|------------|-------------|
| 1 echo event maximum | Conceptually 1 echo event; implemented as 6 variant-specific auto events with unified event_record `medical_endgame_echo`, consistent with P91 late-life pattern |
| Expression updates only | No new systems, no new framework |
| Auto event | Not a choice event — endgame is an echo, not a new decision |
| 6 variants max | One per late-life branch (allow reduction if needed) |
| Single age window | 60-65, not multiple stages |
| 2+ endgame signals | Cost label + current goal minimum |
| No stat changes | Endgame is memory / legacy, not power |

**If P93 implementation requires more than this, STOP and reassess GO/NO-GO.**

---

## 6. GO / NO-GO Criteria

### 6.1 Conditions for GO
If all of the following are true, P92 should recommend GO for P93:
1. ✅ 6 endgame branches are meaningfully differentiated (not reskinned) — or fewer if some were cut with clear rationale
2. ✅ 2 variants have fundamentally different endgame directions (compassionate ≠ pragmatic, not mirrored)
3. ✅ Each branch has clear tavern-born healer flavor
4. ✅ Endgame adds meaningful narrative value beyond late-life (not just "more of the same")
5. ✅ Implementation scope is bounded and lightweight (1 event + expression updates only, no stat changes)
6. ✅ Contract is clear enough for P93 to pick up without rework
7. ✅ 2-variant × 3-choice structure is leveraged (endgame would be less interesting without it)
8. ✅ Clearly differentiated from renown endgame
9. ✅ Adds value beyond P19 generic endgame echo
10. ✅ Late-life does NOT already provide sufficient closure — endgame adds a new dimension

### 6.2 Conditions for NO-GO
If any of the following are true, P92 should recommend NO-GO:
1. ❌ Endgame feels like "more of the same" (no new narrative dimension beyond late-life)
2. ❌ The 6 branches are basically reskinned versions of each other
3. ❌ Compassionate and pragmatic variants feel like mirrors in endgame
4. ❌ Late-life already feels like a satisfying conclusion
5. ❌ Implementation scope would balloon beyond 1 event
6. ❌ Tavern-born healer flavor can't be maintained in endgame
7. ❌ Narrative value doesn't justify implementation effort (6 branches = higher bar)
8. ❌ Too similar to renown endgame (no medical-unique identity)
9. ❌ Doesn't add value beyond P19 generic endgame echo
10. ❌ Would require stat changes or new systems to work

---

## 7. Rollback Strategy

If at any point P92 scope is violated or value becomes unclear:

### 7.1 Full Rollback
- Revert all P92 documentation (or keep as reference)
- Stay at P91 late-life-only state
- Medical route remains complete with bridge → entry → on-ramp → pressure → payoff → late-life

### 7.2 Partial Rollback Scenarios
- If branch design reveals lack of differentiation → cut weakest branches, keep 4-5 strongest
- If scope creeps toward multi-event arc → cut back to single echo event
- If flavor becomes generic → redesign with stronger tavern-born healer anchors
- If variants feel too similar → strengthen variant-specific endgame directions
- If redundancy with P19 is too high → refocus on route-specific thematic coda

---

## 8. Boundary with P93 (Implementation)

| P92 (Design-First) | P93 (Implementation) |
|-------------------|---------------------|
| Prerequisite audit | Runtime event wiring in sample-lines-spine.json |
| Scope contract (this doc) | Expression updates in sampleLineExpression.ts |
| Direction assessment | Expression updates in ordinaryOriginExpression.ts |
| Branch design | Targeted proof document |
| Endgame contract doc | Regression tests |
| Validation shape doc | Closure report |
| Closure report + GO/NO-GO | — |

**P93 must deliver on everything defined in the endgame contract. No scope expansion beyond what's defined in P92 without a new PRD.**

---

## 9. Quality Priority Order

When tradeoffs must be made, prioritize in this order:
1. **Lightweight compliance** — stay within 1 event + expression updates only, no stat changes
2. **GO/NO-GO integrity** — if scope creeps, stop and reassess
3. **Flavor consistency** — tavern-born medical healer must feel right
4. **2-variant differentiation** — compassionate vs pragmatic must feel fundamentally different
5. **6-branch meaningfulness** — each branch must feel distinct and worth having
6. **Scope boundedness** — keep it small, keep it verifiable
7. **Implementation clarity** — P93 should know exactly what to do
8. **Narrative richness** — good but not at the expense of the above

---

## 10. Verification Method

Since P92 is design-only, verification consists of:
1. ✅ prd.json is valid JSON
2. ✅ All 7 user stories have passes: true
3. ✅ Contract document is clear and unambiguous
4. ✅ GO/NO-GO recommendation is explicit with rationale
5. ✅ No runtime code changes (verify via git diff)
6. ✅ All deliverable documents exist and are complete
7. ✅ 2 variants have genuinely different endgame directions (or NO-GO)
8. ✅ 6 branches are meaningfully differentiated (or fewer with clear rationale)
9. ✅ Lightweight constraint is maintained (1 event + expression only, no stat changes)

---

*Scope contract locked. P92-002 passed.*

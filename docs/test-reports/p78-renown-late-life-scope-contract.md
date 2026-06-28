# P78 Renown Late-Life Scope Contract

> **Date:** 2026-06-29
> **Stage:** P78 Wuxia Renown Late-Life Design-First
> **Purpose:** Lock scope boundaries so P78 stays design-first and does not slip into partial implementation

---

## 1. Scope Statement

**P78 is a design-first contract stage for `jianghu_renown_sage` late-life.** It defines what late-life looks like (3 branches per payoff choice), how it connects to existing systems, and what P79 (implementation) must deliver — but does NOT implement any runtime changes.

**Core question:** Is late-life worth doing for renown route, and if so, what exact shape should it take?

---

## 2. Allowed Layers

P78 may work in the following layers only:

| Layer | Allowed? | Description | Deliverable |
|-------|----------|-------------|-------------|
| Prerequisite audit | ✅ Yes | Audit existing renown route foundations | Prerequisite audit doc (P78-001) |
| Scope contract | ✅ Yes | Define boundaries for this stage | This document (P78-002) |
| Branch design | ✅ Yes | Design 3 late-life branches (one per payoff choice) | Branch design doc (P78-003) |
| Late-life contract | ✅ Yes | Define flags, gates, events, expression updates | Contract doc (P78-004) |
| Validation shape | ✅ Yes | Define what P79 must prove | Validation shape doc (P78-005) |
| Closure report | ✅ Yes | Summarize, assess GO/NO-GO, hand off to P79 | Closure report (P78-006) |

**Total allowed layers: 6** — all focused on design, documentation, and planning.

---

## 3. Forbidden Expansions

The following are explicitly out of scope for P78:

| Forbidden Item | Rationale |
|----------------|-----------|
| Runtime event wiring | P78 is design-only; implementation is P79 |
| Expression code changes (sampleLineExpression.ts, ordinaryOriginExpression.ts) | No runtime changes in design-first stage |
| New framework or system | Zero new systems; reuse existing architecture |
| Endgame / final legacy design | Endgame is P80+ or later; stay focused on late-life |
| Second renown seed (mentor-bond) | Single seed (ally_network) only for now |
| Other origins (farm_peasant, town_apprentice) | Tavern_hand only |
| Multiple late-life events | Recommend single event with 3 branches for boundedness |
| Stat threshold gate implementation | Optional enhancement, not needed for contract |
| Bulk content wave | Design-only; no content production |
| New UI components | Reuse existing expression surfaces |
| Cross-route interactions | Single route focus |
| Full renown route expansion planning | Way beyond late-life scope |
| Full lifetime exhaust testing | Targeted proof only; no exhaust required |

**Total forbidden items: 13**

---

## 4. Scope Guardrails

### 4.1 Boundedness Guardrail
- Late-life should be bounded: 1 event (or 1 shared event with 3 branches) + expression updates
- NOT a full late-life expansion with multiple events
- Rationale: Renown route is still new (only 1 origin); keep each stage small and verifiable

### 4.2 Flavor Guardrail
- **Must** maintain tavern-born renown flavor
- **Must not** become generic jianghu late-life
- **Must** differentiate from merchant late-life (守成与传承)
- Each of the 3 branches must have distinct tavern-born flavor anchors

### 4.3 Differentiation Guardrail
- 3 late-life branches **must** be meaningfully different (not reskinned)
- Each branch must correspond to a distinct payoff choice identity
- Differences should span: narrative, stats, identity, expression, player experience

### 4.4 GO/NO-GO Guardrail
- P78 **must** explicitly assess whether late-life is worth doing
- NO-GO is a valid outcome — if late-life adds insufficient narrative value, stop here
- NO-GO must include clear rationale and stopping point
- GO must be conditional on scope discipline (bounded, single event with 3 branches)

---

## 5. GO / NO-GO Criteria

### 5.1 Conditions for GO
If all of the following are true, P78 should recommend GO for P79:
1. ✅ 3 late-life branches are meaningfully differentiated (not reskinned)
2. ✅ Each branch has clear tavern-born flavor
3. ✅ Late-life adds meaningful narrative value beyond payoff
4. ✅ Implementation scope is bounded (1 event + expression updates)
5. ✅ Contract is clear enough for P79 to pick up without rework
6. ✅ 3-choice structure is leveraged (late-life would be less interesting without it)

### 5.2 Conditions for NO-GO
If any of the following are true, P78 should recommend NO-GO:
1. ❌ Late-life feels like "more of the same" (no new narrative dimension)
2. ❌ The 3 branches are basically reskinned versions of each other
3. ❌ Payoff already feels like a satisfying conclusion
4. ❌ Implementation scope would balloon beyond 1 event
5. ❌ Tavern-born flavor can't be maintained in late-life
6. ❌ Narrative value doesn't justify implementation effort

---

## 6. Rollback Strategy

If at any point P78 scope is violated or value becomes unclear:

### 6.1 Full Rollback
- Revert all P78 documentation (or keep as reference)
- Stay at P77 payoff-only state
- Renown route remains complete with bridge → entry → on-ramp → pressure → payoff

### 6.2 Partial Rollback Scenarios
- If branch design reveals lack of differentiation → scale back to simpler late-life (e.g., auto event without branching)
- If scope creeps toward endgame → cut endgame parts, focus on late-life only
- If flavor becomes generic → redesign with stronger tavern-born anchors

---

## 7. Boundary with P79 (Implementation)

| P78 (Design-First) | P79 (Implementation) |
|-------------------|---------------------|
| Prerequisite audit | Runtime event wiring in sample-lines-spine.json |
| Scope contract (this doc) | Expression updates in sampleLineExpression.ts |
| Branch design | Expression updates in ordinaryOriginExpression.ts |
| Late-life contract doc | Targeted proof document |
| Validation shape doc | Regression tests |
| Closure report + GO/NO-GO | Closure report |

**P79 must deliver on everything defined in the late-life contract. No scope expansion beyond what's defined in P78 without a new PRD.**

---

## 8. Quality Priority Order

When tradeoffs must be made, prioritize in this order:
1. **Flavor consistency** — tavern-born renown must feel right
2. **Meaningful differentiation** — 3 branches must feel different
3. **Scope boundedness** — keep it small, keep it verifiable
4. **Implementation clarity** — P79 should know exactly what to do
5. **Narrative richness** — good but not at the expense of the above

---

## 9. Verification Method

Since P78 is design-only, verification consists of:
1. ✅ prd.json is valid JSON
2. ✅ All 6 user stories have passes: true
3. ✅ Contract document is clear and unambiguous
4. ✅ GO/NO-GO recommendation is explicit with rationale
5. ✅ No runtime code changes (verify via git diff)
6. ✅ All deliverable documents exist and are complete

---

*Scope contract locked. P78-002 passed.*

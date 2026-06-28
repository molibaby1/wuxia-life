# P80 Renown Endgame Scope Contract

> **Date:** 2026-06-29
> **Stage:** P80 Wuxia Renown Endgame Design-First Contract
> **Purpose:** Lock scope boundaries so P80 stays design-first and does not slip into partial implementation

---

## 1. Scope Statement

**P80 is a design-first contract stage for `jianghu_renown_sage` endgame / final legacy.** It defines whether endgame is worth doing (GO/NO-GO), and if GO, what exact shape endgame takes (lightweight: 1 echo event + expression updates only) — but does NOT implement any runtime changes.

**Core question:** Is endgame worth doing for renown route, and if so, what exact shape should it take?

**Key constraint:** Endgame MUST be lightweight. If it requires more than 1 echo event + expression updates, it's not worth doing.

---

## 2. Allowed Layers

P80 may work in the following layers only:

| Layer | Allowed? | Description | Deliverable |
|-------|----------|-------------|-------------|
| Prerequisite audit | ✅ Yes | Audit existing renown route foundations | Prerequisite audit doc (P80-001) |
| Scope contract | ✅ Yes | Define boundaries for this stage | This document (P80-002) |
| Endgame direction design | ✅ Yes | Assess GO/NO-GO, define core positioning | Direction assessment in design doc (P80-003) |
| Endgame branch design | ✅ Yes | If GO: design 3 endgame branches (one per late-life branch) | Branch design doc (P80-004) |
| Endgame contract | ✅ Yes | If GO: define flags, gates, events, expression updates | Contract doc (P80-005) |
| Validation shape | ✅ Yes | If GO: define what P81 must prove | Validation shape doc (P80-006) |
| Closure report | ✅ Yes | Summarize, assess GO/NO-GO, hand off to P81 or stop | Closure report (P80-007) |

**Total allowed layers: 7** — all focused on design, documentation, and planning.

---

## 3. Forbidden Expansions

The following are explicitly out of scope for P80:

| Forbidden Item | Rationale |
|----------------|-----------|
| Runtime event wiring | P80 is design-only; implementation is P81 (if GO) |
| Expression code changes (sampleLineExpression.ts, ordinaryOriginExpression.ts) | No runtime changes in design-first stage |
| New framework or system | Zero new systems; reuse existing architecture |
| Second renown seed (mentor-bond) | Single seed (ally_network) only for now |
| Other origins (farm_peasant, town_apprentice) | Tavern_hand only |
| Multi-event endgame arc | Lightweight constraint: max 1 echo event |
| Stat threshold gate implementation | Optional enhancement, not needed for contract |
| Bulk content wave | Design-only; no content production |
| New UI components | Reuse existing expression surfaces |
| Cross-route interactions | Single route focus |
| Full renown route expansion planning | Way beyond endgame scope |
| Full lifetime exhaust testing | Targeted proof only; no exhaust required |
| P81 implementation work | P80 is contract only; P81 does implementation |

**Total forbidden items: 13**

---

## 4. Lightweight Constraint (NON-NEGOTIABLE)

Endgame (if GO) must be **LIGHTWEIGHT**:

1. **1 echo event maximum** — not a multi-event arc
2. **Expression updates only** — no new systems, no new framework
3. **Auto event (recommended) — not another choice point
4. **3 variants** — one per late-life branch, but all under 1 event
5. **Age 60-65** — one age window, not multiple stages
6. **2+ endgame-specific signals — not just "more late-life"

**If endgame needs more than this, it's NO-GO by definition.**

---

## 5. Scope Guardrails

### 5.1 Boundedness Guardrail
- Endgame should be bounded: 1 echo event + expression updates
- NOT a full endgame chapter with multiple events
- Rationale: Late-life already provides strong closure; endgame is coda, not a new act

### 5.2 Flavor Guardrail
- **Must** maintain tavern-born renown flavor
- **Must not** become generic jianghu endgame
- **Must** differentiate from generic P19 endgame echo
- Each of the 3 branches must have distinct tavern-born flavor anchors

### 5.3 Differentiation Guardrail
- 3 endgame branches **must** be meaningfully different (not reskinned)
- Each branch must correspond to a distinct late-life identity
- Endgame **must** be meaningfully different from late-life (not just "more late-life content")
- Differences should span: narrative, identity, expression, player experience

### 5.4 GO/NO-GO Guardrail
- P80 **must** explicitly assess whether endgame is worth doing
- NO-GO is a valid outcome — if endgame adds insufficient narrative value, stop at late-life
- NO-GO must include clear rationale and stopping point
- GO must be conditional on scope discipline (lightweight: 1 echo event + expression updates only)

---

## 6. GO / NO-GO Criteria

### GO Criteria (all must be true):
1. Endgame adds meaningful narrative value beyond late-life (not just "more content")
2. Endgame can be done within lightweight (1 echo event + expression updates)
3. 3 late-life branches create meaningful endgame differentiation
4. Tavern-born flavor is preserved and enhanced
5. Clear distinction from both late-life AND generic P19 endgame
6. P81 implementation effort is justified by narrative value

### NO-GO Criteria (any triggers NO-GO):
1. Late-life already provides sufficient closure
2. Endgame would feel redundant or tacked-on
3. Endgame requires more than lightweight scope
4. 3-branch endgame differentiation is superficial
5. Narrative value doesn't justify implementation effort

---

## 7. Rollback Strategy

- **If GO but P81 exceeds scope → rollback to P79 late-life-only state
- P79 late-life is complete and stable; endgame is optional enhancement
- No runtime changes in P80; rollback is trivial (just don't do P81)

---

## 8. P80 / P81 Boundary

| P80 (this stage) | P81 (if GO) |
|-------------------|--------------|
| Prerequisite audit | — |
| Scope contract | — |
| GO/NO-GO assessment | — |
| Endgame direction & branch design | Event wiring implementation |
| Endgame contract (LOCKED) | Follows contract exactly |
| P81 validation shape definition | Targeted proof + regression tests |
| Closure report + handoff | Implementation + verification |

**P80 produces the contract; P81 implements it. No scope creep from P80 into P81.

---

## 9. Quality Priority Order

1. **GO/NO-GO correctness** — right call on whether endgame is worth doing
2. **Scope discipline** — if GO, stays lightweight: 1 event + expression only
3. **Flavor consistency** — tavern-born renown throughout
4. **Branch differentiation** — 3 meaningfully different endgames
5. **Contract clarity** — P81 can pick up and implement without ambiguity
6. **Documentation completeness** — all docs produced and clear

---

**P80-002 complete.** Scope contract saved. 0 runtime changes.

# P69 Next-Route Selection Scope Contract

> **Date:** 2026-06-29
> **Stage:** P69 Wuxia Next Route Candidate Reconciliation
> **Story:** P69-002 — Lock P69 Route-Selection Scope Contract
> **Purpose:** Define exactly what P69 is allowed to do and what it must not do, so the stage stays focused on route selection rather than drifting into pre-implementation design.

---

## 1. Core Principle

**P69 is a route-selection stage, not an implementation-design stage.**

Its sole purpose is to compare the two leading candidate routes (`jianghu_renown_sage` vs `merchant_martial_patron`) using existing repo evidence, and either:
- Select one route as the next replication target, or
- Declare no-go if neither candidate is sufficiently grounded

P69 must **not** begin designing the chosen route. That is P70's job.

---

## 2. Allowed Layers

P69 is authorized to work in these layers only:

### 2.1 Documentation Comparison
- ✅ Side-by-side comparison of candidate features
- ✅ Evidence tables and matrices
- ✅ Gap analysis of existing repo assets
- ✅ Summary narratives of each candidate's strengths and weaknesses
- ✅ Cross-referencing with P68 methodology transfer findings

### 2.2 Evidence Synthesis
- ✅ Synthesizing evidence from existing closure reports, proofs, and test suites
- ✅ Aggregating findings from P25, P32, P37, P56, P58, P59, P60, P68, etc.
- ✅ Identifying which evidence is directly applicable vs which is inferential
- ✅ Ranking evidence strength (strong / moderate / weak / absent)

### 2.3 Risk Ranking
- ✅ Assessing implementation risk for each candidate
- ✅ Identifying no-go conditions
- ✅ Ranking candidates by quality-first priority (evidence strength × risk)
- ✅ Stating what would need to be true for a no-go to become go

### 2.4 Narrow Reinforcement (Conditional)
- ✅ If and only if evidence is insufficient to decide, adding the **smallest possible** evidence work needed to break the tie
- ✅ Must stay within documentation and analysis — no runtime changes
- ✅ Must not create new bridge contracts or implementation plans

---

## 3. Forbidden Expansions

P69 must **not** enter any of these territories. If a story seems to require them, it is out of scope.

### 3.1 No New Bridge Contracts
- ❌ No bridge contract documents (that's P70 design-first)
- ❌ No prerequisite chain definitions
- ❌ No checkpoint definitions
- ❌ No flag inventories for implementation
- ❌ No downstream gate expansion planning

### 3.2 No New Implementation
- ❌ No runtime code changes
- ❌ No configuration changes (JSON events, gates, etc.)
- ❌ No expression changes
- ❌ No test changes (except conditional P69-007 narrow reinforcement, if truly needed)
- ❌ No new systems or mechanics

### 3.3 No New Validation Platforms
- ❌ No playtest platformization
- ❌ No new gate frameworks
- ❌ No new replay or simulation infrastructure
- ❌ No new verification tools

### 3.4 No Pre-Implementation Design
- ❌ No "what would the bridge look like" exercises beyond what's needed for risk assessment
- ❌ No detailed implementation planning
- ❌ No story breakdowns for the next stage
- ❌ No PRD writing for the selected route (that's P70)

### 3.5 No Scope Expansion Beyond Two Candidates
- ❌ No adding third or fourth candidates unless the inventory (P69-001) reveals a genuinely surprising repo-grounded option
- ❌ No "let's also consider X" tangents

---

## 4. Quality-First Priority Order

When comparing candidates, P69 prioritizes in this order:

1. **Evidence strength** — How much existing repo evidence supports this route?
2. **Implementation risk** — How risky is it to build this route?
3. **Methodology fit** — How well does it fit the merchant trilogy pattern?
4. **Value density** — How much differentiation value does it add?

**Important:** Value density comes last. A high-value route with weak evidence and high risk is worse than a medium-value route with strong evidence and low risk.

---

## 5. No-Go Conditions

P69 may declare **no-go** (neither candidate selected) if:

1. **Both candidates have weak ordinary-origin evidence** — neither has a clear, repo-grounded bridge path from any ordinary origin
2. **Both candidates have high implementation risk** — neither can be built in small, bounded iterations
3. **Evidence is insufficient to decide** and adding narrow reinforcement (P69-007) still cannot break the tie

If no-go is declared, P69 must state:
- The specific evidence gaps that would need to be filled
- What kind of stage would come next (e.g., a "bridge seed discovery" stage)
- Why neither candidate is ready for P70

---

## 6. Boundary with P70

| P69 (This Stage) | P70 (Next Stage) |
|------------------|------------------|
| Compare candidates | Design the selected route |
| Evidence synthesis | Bridge contract definition |
| Risk assessment | Implementation planning |
| Select or no-go | Story breakdown for implementation |
| Documentation only | May include design documents that lead to implementation |
| No runtime changes | No runtime changes either (design-first), but prepares for implementation |

---

## 7. How This Contract Enforces Itself

Each story in P69 references this scope contract:
- P69-003 (evidence comparison) → only synthesizes existing evidence, no new implementation
- P69-004 (methodology fit) → only compares fit, doesn't redesign methodology
- P69-005 (risk comparison) → only assesses risk, doesn't mitigate it
- P69-006 (selection) → selects or no-go, doesn't start designing
- P69-007 (narrow reinforcement) → only if needed, and only the minimum
- P69-008 (closure) → summarizes, doesn't expand

If any story appears to require work outside the allowed layers, the correct response is to note the gap and defer it to P70, not to fill it in P69.

---

**P69-002 complete.** Scope contract saved.

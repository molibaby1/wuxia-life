# P82 Medical Sage Scope Contract

> **Date:** 2026-06-29
> **Stage:** P82 Wuxia Medical Sage Bridge Design-First Contract
> **Story:** P82-002 — Lock P82 Scope Contract
> **Target Route:** `medical_sage_healer` (一代名医)
> **Input from:** `docs/test-reports/p82-medical-sage-prerequisite-audit.md` (prerequisite audit complete)
> **Purpose:** Lock the scope boundaries of P82 so it remains a design-first stage and does not silently slide into implementation work.

---

## 1. Stage Definition

**P82 = Design-First Contract for `medical_sage_healer` Bridge + Entry**

P82 exists because `medical_sage_healer` has been selected as the second mainstream achievement route (after jianghu_renown_sage) for the merchant trilogy methodology replication. Before any implementation work can happen, we need to:

- Audit the real gap (done: P82-001)
- Compare candidate bridge shapes within the medical route
- Choose the smallest viable bridge entry path
- Produce an implementation-ready bridge contract
- Define P83's validation shape and success criteria
- Produce a closure report with P83 handoff

P82 does **not** implement the bridge. P82 produces the design and contract for the future implementation stage (P83).

## 2. Allowed Layers of Work

P82 covers exactly these layers:

### 2.1 Gap Audit Layer
- Inventory existing `medical_sage_healer` gates, flags, events, expressions, and tests
- Map existing habit-led medical wiring (P27/P29 study-healer + social-healer)
- Compare with existing renown bridge patterns (P70/P71)
- **Output:** Prerequisite audit document (P82-001, done)

### 2.2 Bridge-Shape Comparison
- Define at least 2 candidate bridge-shape directions for the medical route
- Bind each candidate to existing repo assets (flags, events, gate surfaces)
- Compare narrative fit, system fit, scope cost, and small-step iterability
- **Output:** Candidate bridge-shape comparison document (P82-003)

### 2.3 Bridge Contract Definition
- Define the checkpoint, required flags, and target gate acceptance
- Define bridge-specific player-facing signals (expression surfaces)
- Specify how the bridge differs from a generic path to the same destination
- Define entry differentiation shape (at least 2 variants)
- Define minimal new event/choice/flag additions
- **Output:** Bridge contract document (P82-004)

### 2.4 Validation-Shape Planning
- Define what proof/tests/closure artifacts the implementation stage (P83) must produce
- Define success criteria for the playable bridge
- State which validations are intentionally deferred (no full lifetime exhaust)
- **Output:** Validation shape definition (P82-005)

### 2.5 Closure and Handoff
- Summarize all design decisions and contracts
- Define the boundary between P82 and P83
- List deferred larger route-expansion items
- Give route planning recommendations for post-entry stages
- **Output:** Closure report (P82-006)

## 3. Forbidden Expansions

The following are explicitly **out of scope** for P82. If any story starts touching these, stop and refocus.

### 3.1 Runtime Wiring
- **Forbidden:** Modifying `ordinary-origin-midlife.json`, `sample-lines-spine.json`, `wuxiaOriginSurfaces.ts`, `medical.json`, or any other runtime config/code
- **Why:** P82 is design-only. The implementation stage (P83) will handle runtime changes.
- **Exception:** None. Not even "small" or "trivial" runtime changes.

### 3.2 New Frameworks or Systems
- **Forbidden:** Designing new systems (medical tracker, reputation economy, herbalist system, etc.) beyond what's needed for the bridge contract
- **Why:** P82 is about defining a bridge, not building a new subsystem. The renown methodology reuses existing systems.
- **Exception:** Conceptual discussion of future systems in deferred-items sections is fine — as long as they don't become requirements for P83.

### 3.3 Bulk Content Waves
- **Forbidden:** Designing multiple post-bridge events, full medical story arcs, or large content expansions
- **Why:** P82 is about the bridge + entry contract, not the full route. Post-bridge content belongs to later stages (on-ramp, pressure, payoff, etc.).
- **Exception:** The bridge contract may specify a minimal sample-line spine shape (on_ramp / pressure / payoff) for scoping purposes — but only as placeholders, not detailed content.

### 3.4 Multi-Origin Bridge Design
- **Forbidden:** Designing bridges from multiple ordinary origins (tavern_hand + farm_peasant + apprentice)
- **Why:** P82 is about the first bridge from the strongest seed (tavern_hand). Additional origins are later replication work.
- **Exception:** Comparative analysis of other origins' potential is allowed — but only to inform scope, not as deliverables.

### 3.5 Full Route Lifecycle Planning
- **Forbidden:** Planning the full medical route lifecycle (all methodology stages: bridge → entry → on-ramp → pressure → payoff → late-life → endgame)
- **Why:** P82 is only the design-first contract for the bridge + entry. The full lifecycle will unfold across P83–P88+ as each stage is approved.
- **Exception:** High-level mention of expected future stages is fine in closure/deferred sections.

### 3.6 Sample-Line Track Reopening
- **Forbidden:** Reopening the sample-line track, adding 40+ nodes, or modifying the existing sample-line framework
- **Why:** The sample-line track (P49–P57) is closed. Medical will need its own spine, but that's implementation-stage work (P83+), not P82 design.
- **Exception:** Analyzing existing sample-line patterns (e.g., merchant magnate spine, renown spine) as reference for the medical spine shape is allowed.

### 3.7 Playable Bridge Proof
- **Forbidden:** Adding bridge flags to gate expressions, creating test seeds that cross the bridge, or producing "targeted proof" artifacts
- **Why:** These are implementation-stage deliverables. P82 defines the contract; P83 proves it works.
- **Exception:** Conceptual diagrams or flag-chain descriptions in design documents are fine — as long as they don't touch runtime code.

### 3.8 Modifying Renown Route Content
- **Forbidden:** Modifying any renown route files (events, expressions, tests, contracts)
- **Why:** P82 must be regression clean for the renown route. Renown is the first complete line and serves as the reference baseline.
- **Exception:** None. Not even typo fixes — those go through a separate renown maintenance stage.

## 4. Deliverables Inventory

By the end of P82, these artifacts will exist:

| Artifact | Status | Story |
|----------|--------|-------|
| Prerequisite audit document | ✅ Done | P82-001 |
| Scope contract document | 📌 This doc | P82-002 |
| Candidate bridge-shape comparison | ⏳ Pending | P82-003 |
| Bridge contract definition | ⏳ Pending | P82-004 |
| P83 validation shape definition | ⏳ Pending | P82-005 |
| P82 closure report | ⏳ Pending | P82-006 |

**No runtime code changes.** No config changes. No test changes. All deliverables are documents under `docs/test-reports/` and `docs/PRD/`.

## 5. Boundary Guards

To detect scope creep, ask these questions at each story boundary:

1. **"Does this change any file under `src/data/`, `src/core/`, `src/components/`, or `src/p56/`?"** → If yes, stop. That's implementation work.
2. **"Does this require running gameplay simulations to verify?"** → If yes, stop. That's P83 work.
3. **"Does this design more than the minimal bridge + entry + basic spine shape?"** → If yes, refocus. P82 stops at the bridge + entry contract.
4. **"Is this about multiple origins, or just tavern_hand?"** → If about multiple, refocus. P82 is single-origin first bridge.
5. **"Is this a new system (medical tracker, herbalism system, etc.)?"** → If yes, defer. Out of scope.
6. **"Is this planning more than 1–2 stages ahead?"** → If yes, defer. Only P83 handoff is in scope.
7. **"Does this touch any renown route files?"** → If yes, stop. Must stay regression clean.

## 6. Role of the PRD

This scope contract is subordinate to the P82 PRD. In case of conflict:

1. PRD markdown (`p82-wuxia-medical-sage-bridge-design-first.md`) is the source of truth
2. This scope contract document operationalizes the PRD's non-goals
3. `prd.json` is the execution index only — it may lag the PRD in narrative detail

## 7. Quality-First Priority Order

Following the P69/P70 selection methodology, P82 prioritizes:

1. **Evidence strength** — Design decisions must be grounded in existing repo assets
2. **Implementation risk** — Choose the smallest, safest bridge shape
3. **Methodology fit** — Follow the renown trilogy pattern where applicable
4. **Value density** — Maximize value per unit of work, but only after the above three are satisfied

## 8. Consistency with Renown Methodology

P82 must maintain methodological consistency with the renown route (P70–P81):

- Same stage structure: design-first → implementation → entry differentiation → on-ramp → pressure → payoff → late-life → endgame
- Same bridge pattern: midlife choice event → bridge flags → expression updates → sample-line spine
- Same validation pattern: targeted proof + narrow regression + closure report
- Same quality-first priority order

Medical-specific differences (non-martial, habit-led seed, etc.) should be noted but not break the overall methodology pattern.

## 9. Handoff to P83

P82 completes when:

- One bridge shape is chosen and justified
- The bridge + entry contract defines the minimal implementation shape
- P83's validation shape and success criteria are defined
- The closure report summarizes everything

At that point, P83 (implementation stage) can pick up the contract and build the playable bridge — without needing to redo design work.

---

**P82-002 complete.** Scope contract saved.

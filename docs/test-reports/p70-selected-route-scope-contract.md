# P70 Selected Route Scope Contract

> **Date:** 2026-06-29
> **Stage:** P70 Wuxia Selected Next Route Design-First Contract
> **Story:** P70-002 — Lock P70 Scope Contract
> **Selected Route:** `jianghu_renown_sage` (江湖名宿)
> **Input from:** `docs/test-reports/p69-next-route-candidate-closure-report.md` (jianghu_renown_sage selected)
> **Purpose:** Lock the scope boundaries of P70 so it remains a design-first stage and does not silently slide into implementation work.

---

## 1. Stage Definition

**P70 = Design-First Contract for `jianghu_renown_sage` Bridge**

P70 exists because `jianghu_renown_sage` has been selected as the next replication target for the merchant trilogy methodology (P69). Before any implementation work can happen, we need to:

- Audit the real gap (done: P70-001)
- Compare candidate bridge shapes within the renown route
- Choose the smallest viable bridge entry path
- Produce an implementation-ready bridge contract
- Define P71's validation shape and success criteria

P70 does **not** implement the bridge. P70 produces the design and contract for the future implementation stage (P71).

## 2. Allowed Layers of Work

P70 covers exactly these layers:

### 2.1 Gap Audit Layer
- Inventory existing `jianghu_renown_sage` gates, flags, events, expressions, and tests
- Map existing ordinary-origin wiring (tavern_hand → ally_network)
- Compare with existing merchant-trilogy bridge patterns (P58/P59/P61)
- **Output:** Prerequisite audit document (P70-001, done)

### 2.2 Bridge-Shape Comparison
- Define at least 2 candidate bridge-shape directions for the renown route
- Bind each candidate to existing repo assets (flags, events, gate surfaces)
- Compare narrative fit, system fit, scope cost, and small-step iterability
- **Output:** Candidate bridge-shape comparison document (P70-003)

### 2.3 Bridge Contract Definition
- Define the checkpoint, required flags, and target gate acceptance
- Define bridge-specific player-facing signals (expression surfaces)
- Specify how the bridge differs from a generic path to the same destination
- Define minimal new event/choice/flag additions
- **Output:** Bridge contract document (P70-004)

### 2.4 Validation-Shape Planning
- Define what proof/tests/closure artifacts the implementation stage (P71) must produce
- Define success criteria for the playable bridge
- State which validations are intentionally deferred (no full lifetime exhaust)
- **Output:** Validation shape definition (P70-005)

### 2.5 Closure and Handoff
- Summarize all design decisions and contracts
- Define the boundary between P70 and P71
- List deferred larger route-expansion items
- **Output:** Closure report (P70-006)

## 3. Forbidden Expansions

The following are explicitly **out of scope** for P70. If any story starts touching these, stop and refocus.

### 3.1 Runtime Wiring
- **Forbidden:** Modifying `ordinary-origin-midlife.json`, `sample-lines-spine.json`, `wuxiaOriginSurfaces.ts`, or any other runtime config/code
- **Why:** P70 is design-only. The implementation stage (P71) will handle runtime changes.
- **Exception:** None. Not even "small" or "trivial" runtime changes.

### 3.2 New Frameworks or Systems
- **Forbidden:** Designing new systems (renown tracker, reputation economy, jianghu faction system, etc.) beyond what's needed for the bridge contract
- **Why:** P70 is about defining a bridge, not building a new subsystem. The merchant trilogy methodology reuses existing systems.
- **Exception:** Conceptual discussion of future systems in deferred-items sections is fine — as long as they don't become requirements for P71.

### 3.3 Bulk Content Waves
- **Forbidden:** Designing multiple post-bridge events, full renown story arcs, or large content expansions
- **Why:** P70 is about the bridge contract, not the full route. Post-bridge content belongs to later stages (entry differentiation, pressure/payoff, etc.).
- **Exception:** The bridge contract may specify a minimal sample-line spine shape (on_ramp / pressure / payoff) for scoping purposes — but only as placeholders, not detailed content.

### 3.4 Multi-Origin Bridge Design
- **Forbidden:** Designing bridges from multiple ordinary origins (tavern_hand + farm_peasant + apprentice)
- **Why:** P70 is about the first bridge from the strongest seed (tavern_hand). Additional origins are later replication work.
- **Exception:** Comparative analysis of other origins' potential is allowed — but only to inform scope, not as deliverables.

### 3.5 Full Route Lifecycle Planning
- **Forbidden:** Planning the full renown route lifecycle (all 5 methodology stages: bridge → entry → flavor → cost → shape+recap)
- **Why:** P70 is only the design-first contract for the bridge. The full lifecycle will unfold across P71–P75+ as each stage is approved.
- **Exception:** High-level mention of expected future stages is fine in closure/deferred sections.

### 3.6 Sample-Line Track Reopening
- **Forbidden:** Reopening the sample-line track, adding 40+ nodes, or modifying the existing sample-line framework
- **Why:** The sample-line track (P49–P57) is closed. Renown will need its own spine, but that's implementation-stage work (P71+), not P70 design.
- **Exception:** Analyzing existing sample-line patterns (e.g., merchant magnate spine) as reference for the renown spine shape is allowed.

### 3.7 Playable Bridge Proof
- **Forbidden:** Adding bridge flags to gate expressions, creating test seeds that cross the bridge, or producing "targeted proof" artifacts
- **Why:** These are implementation-stage deliverables. P70 defines the contract; P71 proves it works.
- **Exception:** Conceptual diagrams or flag-chain descriptions in design documents are fine — as long as they don't touch runtime code.

## 4. Deliverables Inventory

By the end of P70, these artifacts will exist:

| Artifact | Status | Story |
|----------|--------|-------|
| Prerequisite audit document | ✅ Done | P70-001 |
| Scope contract document | 📌 This doc | P70-002 |
| Candidate bridge-shape comparison | ⏳ Pending | P70-003 |
| Bridge contract definition | ⏳ Pending | P70-004 |
| P71 validation shape definition | ⏳ Pending | P70-005 |
| P70 closure report | ⏳ Pending | P70-006 |

**No runtime code changes.** No config changes. No test changes. All deliverables are documents under `docs/test-reports/` and `docs/PRD/`.

## 5. Boundary Guards

To detect scope creep, ask these questions at each story boundary:

1. **"Does this change any file under `src/data/`, `src/core/`, or `src/components/`?"** → If yes, stop. That's implementation work.
2. **"Does this require running gameplay simulations to verify?"** → If yes, stop. That's P71 work.
3. **"Does this design more than the minimal bridge + basic spine shape?"** → If yes, refocus. P70 stops at the bridge contract.
4. **"Is this about multiple origins, or just tavern_hand?"** → If about multiple, refocus. P70 is single-origin first bridge.
5. **"Is this a new system (reputation economy, faction system, etc.)?"** → If yes, defer. Out of scope.
6. **"Is this planning more than 1–2 stages ahead?"** → If yes, defer. Only P71 handoff is in scope.

## 6. Role of the PRD

This scope contract is subordinate to the P70 PRD. In case of conflict:

1. PRD markdown (`p70-wuxia-selected-next-route-design-first-contract.md`) is the source of truth
2. This scope contract document operationalizes the PRD's non-goals
3. `prd.json` is the execution index only — it may lag the PRD in narrative detail

## 7. Quality-First Priority Order

Following the P69 selection methodology, P70 prioritizes:

1. **Evidence strength** — Design decisions must be grounded in existing repo assets
2. **Implementation risk** — Choose the smallest, safest bridge shape
3. **Methodology fit** — Follow the merchant trilogy pattern where applicable
4. **Value density** — Maximize value per unit of work, but only after the above three are satisfied

## 8. Handoff to P71

P70 completes when:

- One bridge shape is chosen and justified
- The bridge contract defines the minimal implementation shape
- P71's validation shape and success criteria are defined
- The closure report summarizes everything

At that point, P71 (implementation stage) can pick up the contract and build the playable bridge — without needing to redo design work.

---

**P70-002 complete.** Scope contract saved.

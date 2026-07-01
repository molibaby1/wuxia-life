# P60 Farm-Peasant Bridge Scope Contract

> **Date:** 2026-06-28
> **Stage:** P60 design-first wave for `farm_peasant` bridge
> **Purpose:** Lock the scope boundaries of P60 so it remains a design-first stage and does not silently slide into implementation work.

## 1. Stage Definition

**P60 = Design-First Discovery for `farm_peasant` Bridge**

P60 exists because `farm_peasant` is the only ordinary origin without a clear, repo-grounded bridge seed into a mixed destiny. Before any implementation work can happen, we need to:
- Audit the real gap (done: P60-001)
- Compare candidate directions
- Choose one downstream target
- Produce an implementation-ready contract

P60 does **not** implement the bridge. P60 produces the design and contract for a future implementation stage (P61).

## 2. Allowed Layers of Work

P60 covers exactly these layers:

### 2.1 Audit Layer
- Inventory existing `farm_peasant` flags, events, choices, and expression
- Map existing downstream wiring (or absence thereof)
- Compare with other ordinary origins (apprentice, tavern_hand)
- **Output:** Gap audit document

### 2.2 Candidate-Direction Analysis
- Define at least 2 candidate bridge-seed directions
- Bind each candidate to existing repo assets (flags, events, profile surfaces)
- Compare narrative fit, system fit, and scope cost
- **Output:** Candidate comparison matrix

### 2.3 Seed Design
- Define the shape of the recommended bridge seed
- Specify which existing flags it chains from
- Specify which downstream gate it feeds into
- Define minimal new event/choice/flag additions
- **Output:** Bridge contract document

### 2.4 Target Selection
- Choose one downstream target (merchant-adjacent, renown-adjacent, or other)
- Justify the choice with repo evidence
- Explain why alternatives are rejected
- **Output:** Selection rationale in contract/closure docs

### 2.5 Validation-Shape Planning
- Define what proof/tests/closure artifacts the implementation stage (P61) must produce
- Define success criteria for the playable bridge
- State which validations are intentionally deferred
- **Output:** Validation shape section in handoff document

## 3. Forbidden Expansions

The following are explicitly **out of scope** for P60. If any story starts touching these, stop and refocus.

### 3.1 Runtime Configuration Changes
- **Forbidden:** Modifying `ordinary-origin-midlife.json`, `sample-lines-spine.json`, or any other runtime config
- **Why:** P60 is design-only. The implementation stage (P61) will handle config changes.
- **Exception:** None. Not even "small" or "trivial" config changes.

### 3.2 Playable Bridge Proof
- **Forbidden:** Adding bridge flags to gate expressions, creating test seeds that cross the bridge, or producing "targeted proof" artifacts
- **Why:** These are implementation-stage deliverables. P60 defines the contract; P61 proves it works.
- **Exception:** Conceptual diagrams or flag-chain descriptions in design documents are fine — as long as they don't touch runtime code.

### 3.3 Broad Content Expansion
- **Forbidden:** Adding new events beyond the minimal bridge seed, expanding the peasant origin into a full "rural life system," or adding multiple new midlife nodes
- **Why:** P60 is about finding and designing one bridge, not building a full peasant storyline.
- **Exception:** The bridge contract may specify one minimal new seed event as part of the bridge design — but only in the contract document, not in runtime config.

### 3.4 Full Ordinary-System Redesign
- **Forbidden:** Redesigning the ordinary origin system, adding new ordinary origins, or rebalancing all three ordinary origins together
- **Why:** P60 is narrowly scoped to `farm_peasant` bridge direction finding.
- **Exception:** Comparative analysis with apprentice/tavern_hand is allowed and required.

### 3.5 Economy / Migration / Platform Systems
- **Forbidden:** Designing or implementing economy systems, rural-urban migration systems, scheduler changes, or platform-level changes
- **Why:** These are large-system items that dwarf the bridge design task. They belong to a separate planning cycle.
- **Exception:** None.

### 3.6 Sample-Line Track Work
- **Forbidden:** Reopening the sample-line track, adding second 40+ nodes, or modifying sample-line spine events
- **Why:** The sample-line track is closed. Ordinary-origin bridges feed into existing mixed-destiny gates; they don't extend the sample-line track.
- **Exception:** Analyzing existing sample-line gates (e.g., `magnate_on_ramp`) to understand how a bridge would connect is allowed.

## 4. Deliverables Inventory

By the end of P60, these artifacts will exist:

| Artifact | Status | Story |
|----------|--------|-------|
| Gap audit document | ✅ Done | P60-001 |
| Scope contract document | 📌 This doc | P60-002 |
| Candidate bridge seeds comparison | ✅ Done | P60-003 |
| Downstream target selection + justification | ✅ Done | P60-004 |
| Bridge contract document | ✅ Done | P60-005 |
| P61 validation shape definition | ✅ Done | P60-006 |
| P60 closure report | ✅ Done | P60-007 |

**No runtime code changes.** No config changes. No test changes. All deliverables are documents under `docs/test-reports/` and `docs/PRD/`.

## 5. Boundary Guards

To detect scope creep, ask these questions at each story boundary:

1. **"Does this change any file under `src/data/` or `src/core/`?"** → If yes, stop. That's implementation work.
2. **"Does this require running gameplay simulations to verify?"** → If yes, stop. That's P61 work.
3. **"Does this add more than one new seed event to the design?"** → If yes, refocus. The bridge should be minimal.
4. **"Is this about all ordinary origins, or just `farm_peasant`?"** → If about all, refocus. P60 is single-origin.
5. **"Is this a new system (economy, migration, etc.)?"** → If yes, defer. Out of scope.

## 6. Role of the PRD

This scope contract is subordinate to the P60 PRD. In case of conflict:
1. PRD markdown (`p60-wuxia-farm-peasant-bridge-design-first-wave.md`) is the source of truth
2. This scope contract document operationalizes the PRD's non-goals
3. `prd.json` is the execution index only — it may lag the PRD in narrative detail

## 7. Handoff to P61

P60 completes when:
- One downstream target is chosen and justified
- The bridge contract defines the minimal implementation shape
- P61's validation shape and success criteria are defined
- The closure report summarizes everything

At that point, P61 (implementation stage) can pick up the contract and build the playable bridge — without needing to redo design work.

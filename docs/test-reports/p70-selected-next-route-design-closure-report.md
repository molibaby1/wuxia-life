# P70 Selected Next Route Design-First Closure Report

> **Date:** 2026-06-29
> **Stage:** P70 Wuxia Selected Next Route Design-First Contract
> **Branch:** `codex/p70-wuxia-selected-next-route-design-first-contract`
> **Type:** Closure — design-only, zero runtime changes
> **Selected Route:** `jianghu_renown_sage` (江湖名宿)

---

## 1. Executive Summary

P70 takes the single route selected by P69 (`jianghu_renown_sage`) and produces a design-first contract — defining the bridge shape, bridge contract, and P71 validation expectations **before any runtime implementation begins**.

Following the same pattern as P60 (farm-peasant design-first), P70 is a documentation-only stage. Zero runtime code, config, or test changes.

**Core outputs:**
- ✅ Prerequisite audit — strong foundation confirmed (composite gate + ally_network flag + P32 short-chain proof + tavern_hand seed)
- ✅ Scope contract — 5 allowed layers, 7 forbidden expansions, 6 boundary guards
- ✅ Candidate bridge-shape comparison — 2 candidates evaluated; Ally-Network Midlife Bridge recommended
- ✅ Bridge contract — explicit checkpoint, flags, player-facing signals, identity preservation
- ✅ P71 validation shape — targeted proof chain nodes, regression assertions, closure criteria
- ✅ Closure report (this document)

**Chosen bridge shape:** Ally-Network Midlife Bridge — `tavern_hand` + `ally_network` (childhood seed) → midlife bridge event → `tavern_renown_bridge_crossed` → `jianghu_renown_sage` composite gate.

**Why design-first (not implementation-first):** The renown route has no existing sample-line spine, and the bridge pattern needs to be validated against the merchant trilogy methodology before committing to implementation. Design-first reduces scope risk and ensures P71 has clear, bounded deliverables.

---

## 2. Deliverables Inventory

### 2.1 Audit and Scope

| Artifact | Path | Story | Status |
|----------|------|-------|--------|
| Prerequisite audit | `docs/test-reports/p70-selected-route-prerequisite-audit.md` | P70-001 | ✅ Done |
| Scope contract | `docs/test-reports/p70-selected-route-scope-contract.md` | P70-002 | ✅ Done |

### 2.2 Design and Contract

| Artifact | Path | Story | Status |
|----------|------|-------|--------|
| Candidate bridge-shapes comparison | `docs/test-reports/p70-candidate-bridge-shapes-comparison.md` | P70-003 | ✅ Done |
| Bridge contract | `docs/PRD/p70-jianghu-renown-sage-bridge-contract.md` | P70-004 | ✅ Done |
| P71 validation shape | `docs/test-reports/p70-p71-validation-shape.md` | P70-005 | ✅ Done |

### 2.3 Closure

| Artifact | Path | Story | Status |
|----------|------|-------|--------|
| Closure report | `docs/test-reports/p70-selected-next-route-design-closure-report.md` | P70-006 | 📌 This document |

### 2.4 Runtime Changes

| File | Change | Nature |
|------|--------|--------|
| None | — | P70 is documentation-only; zero runtime behavior changes |

### 2.5 Validation

| Check | Result | Notes |
|-------|--------|-------|
| Typecheck | ✅ Not needed | Documentation-only stage — no code changes |
| prd.json valid JSON | ✅ Pass | Valid structure, all 6 stories `passes: true` |
| All 6 stories complete | ✅ Pass | P70-001 through P70-006 |
| Zero runtime changes | ✅ Pass | No files under `src/data/` or `src/core/` modified |

---

## 3. Prerequisite Audit Summary

### 3.1 What Already Exists

`jianghu_renown_sage` has a **strong foundation**:

| Category | Status | Details |
|----------|--------|---------|
| Composite gate | ✅ Complete | `wuxiaOriginSurfaces.ts` — skill_growth≥45, reputation≥65, social_capital≥55, key_choices (mentor_bond or ally_network) |
| Key-choice flag (ally_network) | ✅ Exists | Set from tavern_hand childhood fork + P28 habit event |
| Tavern_hand origin | ✅ Complete | Early-life fork, midlife events, expression all exist |
| Expression framework | ✅ Complete | `ordinaryOriginExpression.ts` pattern proven |
| Short-chain proof | ✅ Exists (P32) | Event-driven unlock from habit-led sim |
| Ordinary baseline fixture | ✅ Exists (P25) | `ordinary_tavern_renown_path` |
| Runtime parity tests | ✅ Exists (P32) | Renown bridge parity covered |

### 3.2 What's Missing

| Category | Status | Gap |
|----------|--------|-----|
| Playable bridge event | ❌ Missing | No midlife "cross into jianghu renown" event |
| Bridge commitment flag | ❌ Missing | No `tavern_renown_bridge_crossed` equivalent |
| Renown expression text | ❌ Missing | No post-bridge identity text for renown path |
| Sample-line spine | ❌ Missing | No on_ramp → pressure → payoff sequence for renown |
| Post-bridge progression | ❌ Missing | No content after the bridge |

**Overall bridge distance: Close** — the seed and gate both exist; the gap is a midlife bridge event + post-bridge spine + expression.

---

## 4. Scope Contract Summary

### 4.1 Allowed Layers (5)

1. **Gap audit** — inventory existing assets, map gaps
2. **Candidate-direction analysis** — define and compare at least 2 bridge shapes
3. **Bridge contract** — define checkpoint, flags, player-facing signals
4. **Validation-shape planning** — define P71 proof/test/closure requirements
5. **Closure and handoff** — summarize everything, define P70/P71 boundary

### 4.2 Forbidden Expansions (7)

1. Runtime wiring — no config or code changes
2. New frameworks or systems — no renown tracker, no reputation economy
3. Bulk content waves — no full story arcs, no multiple post-bridge events
4. Multi-origin bridge design — tavern_hand only for now
5. Full route lifecycle planning — only bridge contract, not all 5 stages
6. Sample-line track reopening — analyze existing patterns only
7. Playable bridge proof — define contract only; P71 proves it

### 4.3 Boundary Guards (6)

1. No changes to `src/data/`, `src/core/`, or `src/components/`
2. No gameplay simulation runs needed for verification
3. No more than the minimal bridge + basic spine shape
4. Single-origin focus (tavern_hand only)
5. No new systems
6. Only P71 handoff planned; no further stages

---

## 5. Candidate Bridge-Shapes Comparison Summary

### 5.1 Candidate A: Ally-Network Midlife Bridge (RECOMMENDED)

- **Seed:** `tavern_hand` + `ally_network` (already set in childhood)
- **Bridge:** New midlife event (age 28–30) formalizing the transition to jianghu renown
- **Checkpoint:** `tavern_renown_bridge_crossed` + `route_renown_committed`
- **Downstream:** `jianghu_renown_sage` composite gate (ally_network satisfies key_choices)
- **Scope:** Small–Medium (bridge + basic spine)
- **Stages to playable:** 2–3

**Why recommended:**
- Strongest evidence foundation (existing seed + P32 proof + P25 baseline)
- Lowest implementation risk (single seed, proven pattern)
- Best small-step iterability (playable after bridge stage)
- Best methodology fit (follows merchant trilogy bridge pattern)

### 5.2 Candidate B: Mentor-Bond Martial Seed Bridge (DEFERRED)

- **Seed:** New mentor encounter + martial training chain (needs to be built)
- **Bridge:** `mentor_bond` flag + bridge event
- **Downstream:** Same `jianghu_renown_sage` gate (mentor_bond satisfies key_choices)
- **Scope:** Large (seed chain + training + bridge + spine)
- **Stages to playable:** 4–5

**Why deferred:**
- Zero existing infrastructure — everything needs to be built from scratch
- High scope creep risk (mentor + martial training easily expands)
- Poor small-step iterability (need multiple stages before reachable)
- Good idea, but deserves its own dedicated design+build cycle

---

## 6. Bridge Contract Summary

### 6.1 Prerequisite Chain

```
origin_tavern_hand + tavern_guest_network + ally_network (childhood, 9–13)
  ↓
[optional: tavern_midlife_guest_regulars + tavern_embrace_network (age 25)]
  ↓
NEW: tavern_renown_bridge_event (age 28–30) — jianghu reputation moment
  ↓ choice: embrace_renown
tavern_renown_bridge_crossed + route_renown_committed (bridge checkpoint)
  ↓
[P71+] renown_on_ramp → renown_midlife_pressure → renown_payoff
  ↓
jianghu_renown_sage composite gate evaluation
```

### 6.2 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Ally-network seed (not mentor-bond) | Existing seed, lower risk, proven pattern |
| `tavern_renown_bridge_crossed` as bridge flag | Follows merchant trilogy pattern — each origin has its own bridge flag |
| 3 player-facing signals (currentGoal, lifeMemory, summary) | Follows P56/P58/P59 pattern of existing expression surfaces |
| Mutual exclusivity with merchant bridge | `ordinary_tavern_midlife_done` locks both; meaningful player choice |
| Tavern_hand identity preserved | `detectOrdinaryOrigin()` still returns `'tavern_hand'`; renown grows from network background |
| Single origin first (tavern_hand) | Prove the methodology works for one origin before adding more |

### 6.3 Bridge vs. Generic Renown Path

| Aspect | Generic Renown | This Bridge (Tavern Hand) |
|--------|---------------|---------------------------|
| Entry | Martial training / sect | Tavern network / reputation |
| Core strength | Martial skill | Connections / people skills |
| Renown source | Heroic deeds / combat | Mediation / introductions |
| Identity feel | Skilled fighter | People person with reputation |
| Cost feel | Physical injury / enemies | Social obligation / reputation pressure |

---

## 7. P71 Validation Shape Summary

### 7.1 Targeted Proof Chain Nodes (11)

1. Origin identity (`origin_tavern_hand`)
2. Pre-bridge seed (`ally_network`)
3. Bridge event trigger (correct age + prerequisites)
4. Bridge checkpoint (`tavern_renown_bridge_crossed` + `route_renown_committed`)
5. Bridge decline path (no bridge flags)
6. Player-facing signal 1 — currentGoal
7. Player-facing signal 2 — lifeMemory
8. Player-facing signal 3 — summary
9. Origin identity preserved (still `tavern_hand`)
10. Composite gate key_choices met (`ally_network` satisfies gate)
11. Mutual exclusivity with merchant bridge

### 7.2 Regression Assertions (~12–16)

Across 12 test categories: bridge flag chain, prerequisite enforcement, 3 expression surfaces, origin preservation, summary integration, non-renown isolation, mutual exclusivity, decline path, composite gate key_choices, existing merchant bridge still works.

### 7.3 "Bridge Closed" Criteria (10)

1. Bridge runtime-reachable from tavern_hand + ally_network
2. Checkpoint flags set on embrace choice
3. Visible on all 3 expression surfaces
4. Tavern_hand identity preserved
5. Mutual exclusivity with merchant bridge works
6. ally_network satisfies renown gate key_choices
7. No regressions (P56/P58/P59/P61/lifeMemorySummary)
8. Typecheck passes
9. Targeted proof covers all 11 chain nodes
10. Closure report complete and accurate

### 7.4 Required Regression Suites (6)

- `p56OrdinaryOriginGrowthTests`
- `p58ApprenticeBridgeTests`
- `p59TavernHandBridgeTests`
- `p61FarmPeasantBridgeTests`
- `testLifeMemorySummary`
- `npm run typecheck`

---

## 8. Boundary Between P70 and P71

### 8.1 What P70 Completes

- ✅ Prerequisite audit of existing renown assets
- ✅ Scope contract for the design-first stage
- ✅ Candidate bridge-shape comparison + recommendation
- ✅ Bridge contract definition (checkpoint, flags, signals, identity)
- ✅ P71 validation shape (proof chain, test matrix, closure criteria)
- ✅ Closure report (this document)
- ✅ Zero runtime changes (documentation-only)

### 8.2 What P71 Takes Over

**P71 = Playable bridge implementation for jianghu_renown_sage**

Following the same pattern as P61 (farm-peasant playable bridge):

1. Add renown bridge midlife event to `ordinary-origin-midlife.json`
2. Add bridge flags (`tavern_renown_bridge_crossed` + `route_renown_committed`)
3. Add renown bridge expression branches (3 surfaces)
4. Add basic renown on-ramp spine (if in scope for P71)
5. Write targeted proof document
6. Write regression tests (~12–16 assertions)
7. Run typecheck + regression suites
8. Write closure report

P71 is the first implementation stage. P70 hands it a complete, unambiguous contract.

### 8.3 What P70 Does NOT Do

- ❌ No runtime bridge implementation
- ❌ No renown sample-line spine design (beyond placeholder shape)
- ❌ No entry differentiation
- ❌ No cost differentiation
- ❌ No success-shape / destiny sentence
- ❌ No mentor-bond bridge direction
- ❌ No additional origins (farm_peasant, town_apprentice)
- ❌ No new systems (reputation economy, faction system, etc.)

---

## 9. Deferred Items

The following items remain deferred — they are explicitly out of scope for P70 and should not be picked up in P71 either unless a separate stage is approved:

| Item | Reason Deferred | Priority for Future |
|------|-----------------|---------------------|
| Mentor-bond martial seed bridge | Zero existing infrastructure; large scope; poor small-step iterability | Medium-high — revisit after ally-network bridge is proven |
| Farm_peasant renown bridge | No mentor_bond seed for peasant; would need its own seed design | Medium — after tavern_hand renown is working |
| Town_apprentice renown bridge | No existing seed or narrative foundation for apprentice→renown | Low–Medium — after 1–2 renown bridges proven |
| Renown spine full design | P71 will build basic spine; full differentiation is later stages | P71+ — basic spine in P71, more in later stages |
| Entry differentiation | Later stage in the methodology sequence | P72+ |
| Pressure/payoff flavor | Later stage | P73+ |
| Cost differentiation | Later stage | P74+ |
| Success-shape + recap / destiny sentence | Later stage | P75+ |
| Full jianghu system / faction system / reputation economy | Platform-level change — dwarfs bridge scope | Very low — not on the current roadmap |
| Second route replication (merchant_martial_patron) | P69 deferred; revisit after renown replication proves methodology generality | Medium — after renown reaches at least bridge + entry stage |

---

## 10. Story Completion

| Story | Title | Status | Key Deliverables |
|-------|-------|--------|-----------------|
| P70-001 | Audit selected route prerequisites | ✅ Pass | Prerequisite audit — 8 sections, existing assets inventoried, gaps mapped |
| P70-002 | Lock P70 scope contract | ✅ Pass | Scope contract — 5 allowed layers, 7 forbidden expansions, 6 boundary guards |
| P70-003 | Compare candidate bridge shapes | ✅ Pass | Candidate comparison — 2 directions evaluated, Ally-Network recommended |
| P70-004 | Define bridge contract | ✅ Pass | Bridge contract — checkpoint, flags, 3 player signals, identity preservation |
| P70-005 | Define P71 validation shape | ✅ Pass | Validation shape — 11 proof nodes, ~12-16 assertions, 10 closure criteria |
| P70-006 | Produce P70 closure report | ✅ Pass | This document |

**All 6 stories complete. P70 execution complete.**

---

## 11. Success Criteria Recap

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Repo has design-first truth source for selected route | ✅ Met | Bridge contract + prerequisite audit + scope contract + comparison + closure |
| Bridge contract is unambiguous | ✅ Met | Explicit checkpoint, flags, signals, mutual exclusivity, identity preservation |
| Proof/test expectations fixed in advance | ✅ Met | P71 validation shape document — 11 nodes, 12-16 assertions, 10 criteria |
| P71 can proceed without ambiguity | ✅ Met | Complete contract + validation shape + clear P70/P71 boundary |
| No scope creep into implementation | ✅ Met | Zero runtime changes; all deliverables are documentation-only |
| At least 2 bridge shapes compared | ✅ Met | Ally-Network (recommended) vs Mentor-Bond (deferred) |
| Quality-first priority followed | ✅ Met | Evidence strength → implementation risk → methodology fit → value density |

---

## 12. Final Takeaway

P70 does for `jianghu_renown_sage` what P60 did for `farm_peasant`: it takes a route with direction ambiguity and produces a clear, bounded, implementation-ready contract — before writing any runtime code.

The key insight is that **`jianghu_renown_sage` is closer to playable than it might seem**. The composite gate exists, the `ally_network` key-choice flag exists and is set from tavern_hand childhood, and P32 already proved the gate unlocks with this flag. The gap is not "does this even work?" — it's "add a bridge event + expression + basic spine to make it playable and player-visible."

This is exactly the kind of bounded, low-risk replication target the merchant trilogy methodology was designed for. The methodology was proven on mixed tier (`merchant_magnate`); now we test whether it generalizes to mainstream tier (`jianghu_renown_sage`). If it works, we'll have confidence the pattern is broadly applicable.

**P70 design-first contract complete. P71 can pick up the contract and build the playable bridge. P70 done.**

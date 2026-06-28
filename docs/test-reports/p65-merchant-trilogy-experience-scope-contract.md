# P65 Merchant Trilogy Experience Scope Contract

> **Date:** 2026-06-28
> **Stage:** P65 Wuxia Merchant Trilogy Player Experience Reconciliation
> **Type:** Scope contract — boundary definition for player-experience reconciliation stage

---

## 1. Purpose

This contract locks P65 as a **player-experience reconciliation stage**, not another merchant content wave. P65 audits, compares, and prioritizes what already exists in the merchant trilogy package (P58/P59/P61/P63/P64), rather than expanding it.

---

## 2. Stage Type

**Bounded reconciliation / comparison / priority-sorting stage.**

P65 answers one question: *Among the three player-experience layers (success-cost differentiation, success-shape differentiation, recap-line strength), which one is currently the thinnest and most valuable to optimize next?*

---

## 3. Allowed Activities

### 3.1 Documentation & Comparison (Primary)
- Audit the existing merchant trilogy as one player-route package
- Compare player-visible surfaces across the three routes
- Evaluate success-cost differentiation strength
- Evaluate success-shape differentiation strength
- Evaluate recap-line / destiny-sentence strength
- Rank the three experience layers by priority
- Produce closure report with next-stage recommendation

### 3.2 Minimum Validation Reinforcement (Only If Needed)
- Adding the smallest comparison-level validation asset needed to support the priority conclusion
- Must not rewrite or expand existing test systems
- Must not introduce new test frameworks or methodologies

### 3.3 What "Minimum" Means
- Zero new event IDs
- Zero new choice structures
- Zero new systems
- Zero new flags or state changes
- At most one new comparison-level test function (if needed)
- Changes confined to existing expression surfaces or test files

---

## 4. Forbidden Expansions

The following are **explicitly out of scope** for P65:

### 4.1 New Merchant Content Wave
- No new merchant events
- No new merchant choices
- No new merchant chains or stages
- No new merchant flags or state
- No densification of the merchant skeleton

### 4.2 New Systems
- No new merchant economy system
- No new trade route map or platform
- No new recap or ending system
- No new UI or player-facing features
- No new game mechanics

### 4.3 New Route Implementation
- No fourth ordinary-origin bridge
- No new mixed-identity destination
- No new ordinary-to-mixed route
- No jianghu or other non-merchant route work

### 4.4 Full Playtest Platformization
- No full playtest platform buildout
- No large-scale user research
- No multiple-tester statistical validation
- No browser-based playtest automation

---

## 5. Deliverables

| Artifact | Path | Story |
|----------|------|-------|
| Player route audit | `docs/test-reports/p65-merchant-trilogy-player-route-audit.md` | P65-001 |
| This scope contract | `docs/test-reports/p65-merchant-trilogy-experience-scope-contract.md` | P65-002 |
| Success-cost evaluation | (integrated in reconciliation / closure) | P65-003 |
| Success-shape evaluation | (integrated in reconciliation / closure) | P65-004 |
| Recap-line evaluation | (integrated in reconciliation / closure) | P65-005 |
| Experience layer ranking | (integrated in closure) | P65-006 |
| Narrow validation reinforcement | (only if needed) | P65-007 |
| Closure report | `docs/test-reports/p65-merchant-trilogy-player-experience-closure-report.md` | P65-008 |

---

## 6. Runtime Change Policy

### 6.1 Default: No Runtime Changes
P65 is primarily a documentation / analysis stage. The default assumption is **zero runtime behavior changes**.

### 6.2 Exception: Minimum Validation Reinforcement
Only P65-007 may touch runtime or test code, and only if:
1. Existing proof and tests are insufficient to support the priority ranking
2. The change is the minimum possible comparison-level validation
3. The change does not alter existing game behavior or content
4. The change is clearly scoped and documented

### 6.3 Red Line
If a proposed change requires any of the following, it is out of scope and must be deferred to a later stage:
- New event IDs or choice structures
- New game systems or mechanics
- New flags or state variables
- Changes to gate architecture or event flow
- More than one new test function

---

## 7. Boundary With Adjacent Stages

### 7.1 vs. P63 / P64 (Differentiation Implementation)
- **P63/P64:** Implemented entry / pressure / payoff expression differentiation
- **P65:** Audits and evaluates the player-experience impact of that differentiation
- **Handshake:** P65 does not implement new differentiation; it assesses what P63/P64 delivered

### 7.2 vs. P66 (Next Optimization Stage)
- **P65:** Identifies the thinnest experience layer and recommends P66 target
- **P66:** Implements the optimization for the highest-priority layer
- **Handshake:** P65 closure report defines P66 scope and entry point

### 7.3 vs. Full Merchant Wave
- **Full merchant wave:** Large-scale content and system expansion
- **P65:** Small-scale analysis and prioritization
- **Boundary:** P65 explicitly defers all large expansion ideas

---

## 8. Success Criteria For This Stage

P65 is successful if:

1. ✅ Repo has a single truth source for the merchant trilogy player experience
2. ✅ Three experience layers are explicitly evaluated and compared
3. ✅ One experience layer is clearly identified as the highest priority for optimization
4. ✅ P66 has a clear, bounded entry point defined
5. ✅ P58/P59/P61/P63/P64 closure conclusions are not regressed
6. ✅ No scope creep into new merchant content or systems

---

## 9. Deferred Items

The following are explicitly deferred to future stages:

| Item | Reason |
|------|--------|
| Full merchant content wave | P65 is reconciliation, not expansion |
| New merchant systems (economy, map, platform) | Out of bounded scope |
| Fourth ordinary-origin bridge | Out of scope — P65 focuses on existing trilogy |
| Full playtest platformization | Too large for this stage |
| New recap / ending system | If needed, belongs to a dedicated stage |
| New mixed-identity destinations | Out of scope |
| Sample-line track reopening | Sample-line track remains closed |

---

## 10. Contract Enforcement

This scope contract is the single source of truth for P65 boundaries.

- Any story that would expand beyond this contract must be flagged as scope creep
- If a discovery during P65 suggests a larger expansion is needed, it is documented and deferred
- The closure report (P65-008) will explicitly confirm this contract was respected

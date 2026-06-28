# P69 Next Route Candidate Reconciliation Closure Report

> **Date:** 2026-06-29
> **Stage:** P69 Wuxia Next Route Candidate Reconciliation
> **Branch:** `codex/p69-wuxia-next-route-candidate-reconciliation`
> **Type:** Closure — route selection and candidate comparison

---

## 1. Executive Summary

P69 compares the two leading candidates for the next replication of the merchant trilogy optimization methodology: `jianghu_renown_sage` (江湖名宿) vs `merchant_martial_patron` (商武一体).

**Core finding: `jianghu_renown_sage` is selected as the next replication target.**

The selection follows the quality-first priority order established in the scope contract:
1. **Evidence strength** → `jianghu_renown_sage` wins decisively
2. **Implementation risk** → `jianghu_renown_sage` wins decisively
3. **Methodology fit** → Mixed, but quality-first gives edge to `jianghu_renown_sage` (lower scope drift)
4. **Value density** → `merchant_martial_patron` wins, but it's the lowest priority

`merchant_martial_patron` is **deferred**, not rejected. It remains a strong candidate for a later replication cycle once we've proven the methodology transfers to mainstream tier.

**Overall verdict: Pass — route selection complete, clear single recommendation.**

---

## 2. Deliverables Inventory

### 2.1 Documentation

| Artifact | Path | Story | Status |
|----------|------|-------|--------|
| Candidate route inventory | `docs/test-reports/p69-next-route-candidate-inventory.md` | P69-001 | ✅ Done |
| Selection scope contract | `docs/test-reports/p69-next-route-selection-scope-contract.md` | P69-002 | ✅ Done |
| Candidate comparison (evidence + fit + risk + selection) | `docs/test-reports/p69-next-route-candidate-comparison.md` | P69-003/004/005/006 | ✅ Done |
| Narrow reinforcement assessment | `docs/test-reports/p69-narrow-reinforcement-assessment.md` | P69-007 | ✅ Done |
| Closure report (this document) | `docs/test-reports/p69-next-route-candidate-closure-report.md` | P69-008 | ✅ Done |

### 2.2 Runtime Changes

| File | Change | Nature |
|------|--------|--------|
| None | — | P69 is documentation-only; zero runtime behavior changes |

### 2.3 Validation

| Check | Result | Notes |
|-------|--------|-------|
| Typecheck | ✅ Pass | `npm run typecheck` |
| prd.json valid JSON | ✅ Pass | Valid structure |
| Evidence sufficiency | ✅ Sufficient | No narrow reinforcement needed |
| All 8 stories complete | ✅ Pass | P69-001 through P69-008 |

---

## 3. Selection Summary

### 3.1 Selected Route: `jianghu_renown_sage` (江湖名宿)

**Why selected:**

1. **Strongest evidence foundation** — P25 ordinary wiring (tavern_hand → ally_network), P32 short-chain proof, P34 lifetime baseline. The most repo-grounded option.

2. **Lowest implementation risk** — Single-seed bridge, single-track differentiation, lower validation cost, better small-step iterability. The safest first replication.

3. **Tests methodology generality** — The merchant trilogy was proven on mixed tier (merchant_magnate). Replicating on mainstream tier tests whether the methodology generalizes beyond mixed. If it works, we'll have more confidence applying it to patron later.

4. **Clear quality-first win** — Wins on 3 out of 4 quality-first priority dimensions. Not a close call.

### 3.2 Deferred Route: `merchant_martial_patron` (商武一体)

**Why deferred (not rejected):**

1. **No ordinary-origin bridge seed** — The only trace is from merchant_house (vivid tier). Building an ordinary→patron bridge would first require building a martial-content seed for ordinary origins, which is scope expansion beyond a single bridge.

2. **Higher complexity** — Dual-seed bridge (merchant + martial) means two growth systems, more flag combinations, more edge cases. Higher scope drift risk.

3. **Higher no-go risk** — If we start down the patron path and discover that ordinary-origin martial content is too thin, we'd have to backtrack. Starting with the safer option de-risks the program.

4. **Better as a second replication** — Once we've proven the methodology transfers to renown (mainstream tier), we'll have more confidence and more patterns to apply to patron (dual-track mixed tier).

**When to revisit:** After the jianghu_renown_sage replication reaches at least the bridge + entry differentiation stage (P71–P72). If the methodology transfers cleanly, patron becomes a strong third replication candidate.

---

## 4. Comparison Recap

### 4.1 Evidence Strength

| Dimension | `jianghu_renown_sage` | `merchant_martial_patron` |
|-----------|----------------------|--------------------------|
| Ordinary-origin wiring | ✅ Strong (tavern_hand + ally_network) | ❌ Absent |
| Short-chain proof | ✅ Strong (P32 renown slice) | ❌ Absent |
| Runtime parity tests | ✅ Strong (P32) | ⚠️ Moderate (P25 mixed identity only) |
| Lifetime trace | ⚠️ Moderate (habit-led) | ✅ Strong (merchant_house 0→68) |
| **Edge** | **renown** | |

### 4.2 Methodology Fit

| Dimension | `jianghu_renown_sage` | `merchant_martial_patron` |
|-----------|----------------------|--------------------------|
| Tier type match | Medium (mainstream vs mixed) | Good (same mixed tier) |
| Differentiation surface | Medium (single-track) | High (dual-track) |
| Scope drift risk | Lower (simpler) | Higher (dual-track + martial seed) |
| **Net (quality-first)** | **Slight edge** | |

### 4.3 Implementation Risk

| Cost Dimension | `jianghu_renown_sage` | `merchant_martial_patron` |
|---------------|----------------------|--------------------------|
| Bridge cost | Lower (single seed) | Higher (needs martial seed + dual bridge) |
| Expression cost | Lower (single-track) | Higher (dual-track) |
| Validation cost | Lower (fewer test cases) | Higher (dual-track interactions) |
| Small-step iterability | Better (2–3 stages) | Worse (3–4 stages) |
| No-go likelihood | Low | Higher |
| **Edge** | **renown** | |

---

## 5. Boundary Between P69 and P70

### 5.1 What P69 Completes

- ✅ Candidate inventory (both routes profiled)
- ✅ Scope contract (allowed/forbidden layers defined)
- ✅ Evidence strength comparison
- ✅ Methodology fit comparison
- ✅ Implementation risk comparison
- ✅ Route selection (jianghu_renown_sage selected)
- ✅ Evidence sufficiency assessment (no reinforcement needed)
- ✅ Closure report (this document)
- ✅ Zero runtime changes (documentation-only stage)

### 5.2 What P70 Takes Over

**P70 = Design-first stage for jianghu_renown_sage bridge**

Following the same pattern as P60 (farm-peasant design-first):

- P70-001: Gap audit of existing renown assets
- P70-002: Scope contract for the renown bridge design
- P70-003: Candidate bridge seeds comparison
- P70-004: Bridge contract definition (prerequisites, checkpoint, downstream gates)
- P70-005: Implementation plan for P71 (playable bridge)
- P70-006: Closure report

P70 is documentation-only, like P60. Runtime implementation begins in P71.

### 5.3 What P69 Does NOT Do

- ❌ No bridge contract design
- ❌ No implementation planning
- ❌ No runtime code or config changes
- ❌ No new validation infrastructure
- ❌ No merchant_martial_patron design work
- ❌ No sample-line spine design

---

## 6. Deferred Items

| Item | Reason Deferred | Priority for Future |
|------|-----------------|---------------------|
| `merchant_martial_patron` replication | No ordinary-origin bridge seed; higher complexity; better as second replication | Medium-high — revisit after renown replication proves methodology transfer |
| Renown sample-line spine | Implementation-stage work, not selection-stage | P71+ — part of the implementation stages |
| Ordinary-origin martial content | Out of scope for P69; would be needed for patron replication | Depends on patron selection in future cycle |
| External playtest validation | P69 is selection, not validation; internal evidence is sufficient | Low — can be added after implementation if needed |

---

## 7. Story Completion

| Story | Title | Status | Key Deliverables |
|-------|-------|--------|-----------------|
| P69-001 | Audit next-route candidate inventory | ✅ Pass | Inventory doc — both candidates profiled with outcome types, linked origins, evidence surfaces |
| P69-002 | Lock P69 route-selection scope contract | ✅ Pass | Scope contract — 4 allowed layers, 5 forbidden expansions, quality-first priority |
| P69-003 | Compare repo evidence strength | ✅ Pass | Evidence comparison — renown has stronger foundation (P25 + P32 + tavern_hand seed) |
| P69-004 | Compare methodology fit | ✅ Pass | Fit comparison — patron has better type match, renown has lower drift; net edge to renown |
| P69-005 | Compare bounded implementation risk | ✅ Pass | Risk comparison — renown lower risk across all three cost dimensions |
| P69-006 | Select one route or declare no-go | ✅ Pass | Selected: jianghu_renown_sage; deferred: merchant_martial_patron |
| P69-007 | Add narrow reinforcement if evidence is missing | ✅ Pass | Evidence sufficient — no additional validation needed; typecheck passes |
| P69-008 | Produce P69 closure report | ✅ Pass | This document |

**All 8 stories complete. P69 execution complete.**

---

## 8. Success Criteria Recap

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Repo has next-route candidate reconciliation truth source | ✅ Met | This closure report + inventory + comparison + assessment |
| Clear which route is best for quality-first replication | ✅ Met | jianghu_renown_sage selected; wins on 3/4 quality-first dimensions |
| No-go condition assessed and ruled out | ✅ Met | No-go is not warranted; at least one candidate has strong evidence |
| P70 can proceed without ambiguity | ✅ Met | Single selected route; clear P69/P70 boundary |
| No scope creep into implementation design | ✅ Met | Zero runtime changes; all deliverables are documentation-only |

---

## 9. Final Takeaway

The merchant trilogy methodology is transfer-ready (P68). Now we know where to apply it next: **`jianghu_renown_sage`**.

The selection is not about which route is "cooler" or has more long-term potential. It's about which route gives us the **best chance of a successful, high-quality replication** with the evidence we have today. `jianghu_renown_sage` has a stronger foundation, lower risk, and tests the methodology's generality by moving from mixed tier to mainstream tier.

`merchant_martial_patron` is not gone — it's deferred. Once we've proven the methodology works for renown, we'll have more confidence, more patterns, and more runway to tackle the dual-track challenge of patron.

**Route selection complete. Next: P70 design-first for jianghu_renown_sage. P69 done.**

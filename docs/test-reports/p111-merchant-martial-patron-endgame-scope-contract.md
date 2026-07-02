# P111 Merchant Martial Patron Endgame Scope Contract

> **Date:** 2026-07-02
> **Stage:** P111 Wuxia Merchant Martial Patron Endgame Design-First
> **Purpose:** Lock scope boundaries so P111 stays design-first and does not slip into partial implementation

---

## 1. Scope Statement

**P111 is a design-first contract stage for `merchant_martial_patron` endgame / final legacy.** It defines whether endgame is worth doing (GO/NO-GO), and if GO, what exact shape endgame takes (lightweight: 1 echo event + expression updates only) — but does NOT implement any runtime changes.

**Core question:** Is endgame worth doing for patron route, and if so, what exact shape should it take?

**Key constraint:** Endgame MUST be lightweight. If it requires more than 1 echo event + expression updates, it's not worth doing.

---

## 2. Allowed Layers

P111 may work in the following layers only:

| Layer | Allowed? | Description | Deliverable |
|-------|----------|-------------|-------------|
| Prerequisite audit | ✅ Yes | Audit existing patron route foundations | Prerequisite audit doc (P111-001) |
| Scope contract | ✅ Yes | Define boundaries for this stage | This document (P111-002) |
| Endgame direction design | ✅ Yes | Assess GO/NO-GO, define core positioning | Direction assessment doc (P111-003) |
| Endgame branch design | ✅ Yes | If GO: design 3 endgame branches (one per late-life branch) | Branch design doc (P111-004) |
| Endgame contract | ✅ Yes | If GO: define flags, gates, events, expression updates | Contract doc (P111-005) |
| Validation shape | ✅ Yes | If GO: define what P112 must prove | Validation shape doc (P111-006) |
| Closure report | ✅ Yes | Summarize, assess GO/NO-GO, hand off to P112 or stop | Closure report (P111-007) |

**Total allowed layers: 7** — all focused on design, documentation, and planning.

---

## 3. Forbidden Expansions

The following are explicitly out of scope for P111:

| Forbidden Item | Rationale |
|----------------|-----------|
| Runtime event wiring | P111 is design-only; implementation is P112 (if GO) |
| Expression code changes (`sampleLineExpression.ts`) | No runtime changes in design-first stage |
| P102–P110 patron rewrite | Late-life and upstream stages are closed |
| P55/P97–P101 magnate spine rewrite | Separate route; no cross-contamination |
| New framework or system | Zero new systems; reuse existing architecture |
| Multi-event endgame arc | Lightweight constraint: max 1 echo event |
| Stat threshold gate implementation | Optional enhancement, not needed for contract |
| Bulk content wave | Design-only; no content production |
| New UI components | Reuse existing expression surfaces |
| Full 5×3 entry×payoff×late-life×endgame identity matrix | P112 minimum: native + 1 bridge per branch |
| Ordinary origin patron endgame expression | Defer to P112 bonus |
| P19 generic endgame integration | Route-specific coda only |
| Full lifetime exhaust testing | Targeted proof only; no exhaust required |
| P112 implementation work | P111 is contract only; P112 does implementation |
| `gate:p20` broad rerun | Out of scope |

**Total forbidden items: 15**

---

## 4. Lightweight Constraint (NON-NEGOTIABLE)

Endgame (if GO) must be **LIGHTWEIGHT**:

1. **1 echo event maximum** — not a multi-event arc
2. **Expression updates only** — no new systems, no new framework
3. **Auto event (recommended)** — not another choice point
4. **3 variants** — one per late-life branch, but all under 1 event
5. **Age 60–65** — one age window, not multiple stages
6. **2+ endgame-specific signals** — not just "more late-life"
7. **No stat changes** — endgame is echo/memory, not power-up (align renown P81)

**If endgame needs more than this, it's NO-GO by definition.**

---

## 5. Scope Guardrails

### 5.1 Boundedness Guardrail
- Endgame should be bounded: 1 echo event + expression updates
- NOT a full endgame chapter with multiple events
- NOT a Wave 3 mixed-achievement graph

### 5.2 Route Isolation Guardrail
- P111 focuses exclusively on `merchant_martial_patron`
- Does not reopen magnate endgame (P100/P101)
- Does not reopen renown endgame (P80/P81)
- Does not cross-contaminate with medical endgame (P93)

### 5.3 Evidence Non-Regression Guardrail
- P102–P110 patron evidence must not degrade
- P100/P101 magnate evidence must not degrade
- `guard:sample-lines-baseline` must continue passing
- P111 produces zero runtime changes

### 5.4 Handoff Guardrail
- If GO: P112 receives unambiguous contract (event spec + flags + expression + validation shape)
- If NO-GO: explicit stop point at late-life with rationale; no P112 stage

---

## 6. Deliverable Checklist

| # | Deliverable | Path | Story |
|---|-------------|------|-------|
| 1 | Prerequisite audit | `docs/test-reports/p111-merchant-martial-patron-endgame-prerequisite-audit.md` | P111-001 |
| 2 | Scope contract | `docs/test-reports/p111-merchant-martial-patron-endgame-scope-contract.md` | P111-002 |
| 3 | Direction assessment | `docs/test-reports/p111-merchant-martial-patron-endgame-direction-assessment.md` | P111-003 |
| 4 | Branch design | `docs/test-reports/p111-merchant-martial-patron-endgame-branch-design.md` | P111-004 |
| 5 | Endgame contract | `docs/PRD/p111-merchant-martial-patron-endgame-contract.md` | P111-005 |
| 6 | P112 validation shape | `docs/test-reports/p111-p112-validation-shape.md` | P111-006 |
| 7 | Closure report | `docs/test-reports/p111-merchant-martial-patron-endgame-closure-report.md` | P111-007 |

---

## 7. Success Criteria for P111 Stage

- [ ] All 7 deliverables produced
- [ ] GO/NO-GO verdict with rationale
- [ ] If GO: P112 can start without ambiguity
- [ ] If NO-GO: explicit stop point documented
- [ ] Zero runtime code changes
- [ ] Typecheck passes
- [ ] P102–P110 evidence not degraded

---

**P111-002 complete.**

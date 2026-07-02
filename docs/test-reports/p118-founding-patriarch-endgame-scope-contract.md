# P118 Founding Patriarch Endgame Scope Contract

> **Date:** 2026-07-02
> **Stage:** P118 Wuxia Founding Patriarch Endgame Design-First
> **Purpose:** Lock scope boundaries so P118 stays design-first and does not slip into partial implementation

---

## 1. Scope Statement

**P118 is a design-first contract stage for `founding_patriarch` endgame / final legacy.** It defines whether endgame is worth doing (GO/NO-GO), and if GO, what exact shape endgame takes (lightweight: 1 echo event + expression updates only) — but does NOT implement any runtime changes.

**Core question:** Is endgame worth doing for founding-patriarch route, and if so, what exact shape should it take?

**Key constraint:** Endgame MUST be lightweight. If it requires more than 1 echo event + expression updates, it's not worth doing.

---

## 2. Allowed Layers

P118 may work in the following layers only:

| Layer | Allowed? | Description | Deliverable |
|-------|----------|-------------|-------------|
| Prerequisite audit | ✅ Yes | Audit existing founding-patriarch route foundations | Prerequisite audit doc (P118-001) |
| Scope contract | ✅ Yes | Define boundaries for this stage | This document (P118-002) |
| Endgame direction design | ✅ Yes | Assess GO/NO-GO, define core positioning | Direction assessment doc (P118-003) |
| Endgame branch design | ✅ Yes | If GO: design 2 endgame branches (one per late-life branch) | Branch design doc (P118-004) |
| Endgame contract | ✅ Yes | If GO: define flags, gates, events, expression updates | Contract doc (P118-005) |
| Validation shape | ✅ Yes | If GO: define what P119 must prove | Validation shape doc (P118-006) |
| Closure report | ✅ Yes | Summarize, assess GO/NO-GO, hand off to P119 or stop | Closure report (P118-007) |

**Total allowed layers: 7** — all focused on design, documentation, and planning.

---

## 3. Forbidden Expansions

The following are explicitly out of scope for P118:

| Forbidden Item | Rationale |
|----------------|-----------|
| Runtime event wiring | P118 is design-only; implementation is P119 (if GO) |
| Expression code changes (`sampleLineExpression.ts`) | No runtime changes in design-first stage |
| P113–P117 founding-patriarch rewrite | Late-life and upstream stages are closed |
| P102–P112 patron spine rewrite | Separate route; no cross-contamination |
| P55/P97–P101 magnate spine rewrite | Separate route; no cross-contamination |
| New framework or system | Zero new systems; reuse existing architecture |
| Multi-event endgame arc | Lightweight constraint: max 1 echo event |
| Stat threshold gate implementation | Optional enhancement, not needed for contract |
| Bulk content wave | Design-only; no content production |
| New UI components | Reuse existing expression surfaces |
| Full 2×3 pressure×payoff×late-life×endgame identity matrix | P119 minimum: 2 pressure branches only |
| Ordinary origin founding-patriarch endgame expression | Defer to P119 bonus |
| P19 generic endgame integration | Route-specific coda only |
| Full lifetime exhaust testing | Targeted proof only; no exhaust required |
| P119 implementation work | P118 is contract only; P119 does implementation |
| `gate:p20` broad rerun | Out of scope |
| Sect inheritance handoff marker system | Narrative element only within lightweight boundary |

**Total forbidden items: 16**

---

## 4. Lightweight Constraint (NON-NEGOTIABLE)

Endgame (if GO) must be **LIGHTWEIGHT**:

1. **1 echo event maximum** — not a multi-event arc
2. **Expression updates only** — no new systems, no new framework
3. **Auto event (recommended)** — not another choice point
4. **2 variants** — one per late-life branch, but all under 1 event
5. **Age 60–65** — one age window, not multiple stages
6. **2+ endgame-specific signals** — not just "more late-life"
7. **No stat changes** — endgame is echo/memory, not power-up (align renown P81 / patron P111)

**If endgame needs more than this, it's NO-GO by definition.**

---

## 5. Scope Guardrails

### 5.1 Boundedness Guardrail
- Endgame should be bounded: 1 echo event + expression updates
- NOT a full endgame chapter with multiple events
- NOT a Wave 3 mixed-achievement graph

### 5.2 Route Isolation Guardrail
- P118 focuses exclusively on `founding_patriarch`
- Does not reopen patron endgame (P111/P112)
- Does not reopen renown endgame (P80/P81)
- Does not reopen magnate endgame (P100/P101)
- Does not cross-contaminate with medical endgame (P93)

### 5.3 Evidence Non-Regression Guardrail
- P113–P117 founding-patriarch evidence must not degrade
- P37 lifetime trace evidence must not degrade
- P102–P112 patron evidence must not degrade
- `guard:sample-lines-baseline` must continue passing
- P118 produces zero runtime changes

### 5.4 Handoff Guardrail
- If GO: P119 receives unambiguous contract (event spec + flags + expression + validation shape)
- If NO-GO: explicit stop point at late-life with rationale; no P119 stage

---

## 6. Deliverable Checklist

| # | Deliverable | Path | Story |
|---|-------------|------|-------|
| 1 | Prerequisite audit | `docs/test-reports/p118-founding-patriarch-endgame-prerequisite-audit.md` | P118-001 |
| 2 | Scope contract | `docs/test-reports/p118-founding-patriarch-endgame-scope-contract.md` | P118-002 |
| 3 | Direction assessment | `docs/test-reports/p118-founding-patriarch-endgame-direction-assessment.md` | P118-003 |
| 4 | Branch design | `docs/test-reports/p118-founding-patriarch-endgame-branch-design.md` | P118-004 |
| 5 | Endgame contract | `docs/PRD/p118-founding-patriarch-endgame-contract.md` | P118-005 |
| 6 | P119 validation shape | `docs/test-reports/p118-p119-validation-shape.md` | P118-006 |
| 7 | Closure report | `docs/test-reports/p118-founding-patriarch-endgame-closure-report.md` | P118-007 |

---

## 7. Success Criteria for P118 Stage

- [ ] All 7 deliverables produced
- [ ] GO/NO-GO verdict with rationale
- [ ] If GO: P119 can start without ambiguity
- [ ] If NO-GO: explicit stop point documented
- [ ] Zero runtime code changes
- [ ] Typecheck passes
- [ ] P113–P117 evidence not degraded

---

**P118-002 complete.**

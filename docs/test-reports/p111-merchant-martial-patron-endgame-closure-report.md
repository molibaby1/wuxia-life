# P111 Merchant Martial Patron Endgame Closure Report

> **Stage:** P111 Patron Endgame Design-First Contract
> **Date:** 2026-07-02
> **Contract:** P111 merchant-martial-patron-endgame-design-first
> **Branch:** `codex/p111-wuxia-merchant-martial-patron-endgame-design-first`

## Summary

P111 delivers design-first contract for `merchant_martial_patron` endgame / final legacy: prerequisite audit, scope contract, GO/NO-GO assessment (CONDITIONAL_GO), 3 endgame branch designs, endgame contract, P112 validation shape, and this closure report. Zero runtime changes.

## Deliverables (7/7)

| # | Story | Deliverable | Status |
|---|-------|-------------|--------|
| 1 | P111-001 | `docs/test-reports/p111-merchant-martial-patron-endgame-prerequisite-audit.md` | ✅ |
| 2 | P111-002 | `docs/test-reports/p111-merchant-martial-patron-endgame-scope-contract.md` | ✅ |
| 3 | P111-003 | `docs/test-reports/p111-merchant-martial-patron-endgame-direction-assessment.md` | ✅ |
| 4 | P111-004 | `docs/test-reports/p111-merchant-martial-patron-endgame-branch-design.md` | ✅ |
| 5 | P111-005 | `docs/PRD/p111-merchant-martial-patron-endgame-contract.md` | ✅ |
| 6 | P111-006 | `docs/test-reports/p111-p112-validation-shape.md` | ✅ |
| 7 | P111-007 | This closure report | ✅ |

## GO/NO-GO Verdict for P112

**Verdict: GO (CONDITIONAL_GO — lightweight only)**

**Rationale:**
- Patron route theme (商武一体) benefits from covenant settlement echo beyond late-life active aging
- P110 closure explicitly recommends opening P111+
- Lightweight constraint achievable: 1 auto echo + 3 variants + expression updates, no stat changes
- Three late-life branches provide natural, meaningfully different endgame variants
- Clear differentiation from late-life (active life vs final coda), renown (江湖记忆 vs 盟约收官), magnate (守成传承 vs 商武回响)
- P102–P110 evidence not at risk (docs-only stage)

**Conditions for P112:**
1. Max 1 echo event (or 3 spine auto events mirroring P110 late-life pattern)
2. Auto only — no choice event
3. No stat changes
4. Age 60–65
5. 3 variants keyed on `merchant_patron_late_*` markers
6. At least 2 endgame-specific expression signals (cost label + goal; identity bonus)
7. 12-criteria closure per validation shape

## What P111 Defines

### Core Direction
**商武终局回响** — single auto echo at age 60–65 answering "商武名号与盟约如何收官"

### Three Endgame Variants

| Late-Life Branch | Endgame Variant | Cost Label | Core Theme |
|------------------|-----------------|------------|------------|
| 盟约绑紧 (A) | 商武终局·担 | 商武终局·担 | 盟约比人长久 |
| 自由孤立 (B) | 商武终局·孤 | 商武终局·孤 | 孤商自立定论 |
| 新盟可持续 (C) | 商武终局·传 | 商武终局·传 | 商武分寸传下去 |

### Flag Interface (P112 target)

| Flag | Purpose |
|------|---------|
| `merchant_patron_endgame_echo_done` | Endgame checkpoint |
| `merchant_patron_endgame_identity_done` | Endgame identity deepening |
| `merchant_patron_endgame_covenant_echo` | Branch A marker |
| `merchant_patron_endgame_solitary_echo` | Branch B marker |
| `merchant_patron_endgame_legacy_echo` | Branch C marker |

### Expression Priority (P112)
`endgame_echo_done` > `late_life_done` > `payoff_done` > pressure > on-ramp (magnate markers still win)

## Closure Criteria (P111 stage)

| # | Criterion | Status |
|---|-----------|--------|
| C1 | Prerequisite audit complete | ✅ |
| C2 | Scope contract locked | ✅ |
| C3 | GO/NO-GO with rationale | ✅ GO |
| C4 | 3 endgame branches designed | ✅ |
| C5 | Endgame contract locked | ✅ |
| C6 | P112 validation shape defined | ✅ |
| C7 | Closure report produced | ✅ |
| C8 | Zero runtime changes | ✅ |
| C9 | Typecheck passes | ✅ |
| C10 | P102–P110 evidence not degraded | ✅ (no code changes) |

**10/10 = P111 design-first closed.**

## Deferred (Beyond P112)

| Item | Defer Reason |
|------|--------------|
| Ordinary origin patron endgame expression | P112 optional bonus |
| Full 5×3 entry×payoff×late-life×endgame identity matrix | Scope creep |
| Life memory / summary endgame surfaces | Beyond lightweight |
| P19 generic endgame integration | Route-specific coda only |
| Stat threshold gates for endgame | Not in contract |
| `gate:p20` broad rerun | Out of scope |
| Multi-event endgame arc | Violates lightweight constraint |
| Cross-route patron×magnate endgame interactions | Separate routes |

## P112 Handoff Checklist

P112 can start with:
- [x] Event spec: `merchant_patron_endgame_echo_*` auto, age 60–65
- [x] Upstream gate: `merchant_patron_late_life_done` + late-life branch marker
- [x] Checkpoint flags: `endgame_echo_done`, `endgame_identity_done`, 3 branch markers
- [x] Expression updates: cost label, goal, identity per branch
- [x] Validation shape: 12-criteria closure, R1–R32 regression map
- [x] Non-regression boundaries: P102–P110 + P100/P101 magnate

## Runtime Change Summary

**Zero.** P111 is docs-only. No changes to `sample-lines-spine.json`, `sampleLineExpression.ts`, or tests.

---

**P111-007 complete. P111 stage closed.**

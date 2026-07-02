# P96 Merchant 26–40 Midlife Expansion Identity Closure Report

> **Stage:** P96 Wuxia Merchant 26–40 Midlife Expansion Identity  
> **Date:** 2026-07-02  
> **Branch:** `codex/p96-wuxia-merchant-26-40-midlife-expansion-identity`

## 1. What Was Added (Age 26–40)

| Node | Age | ID | Purpose |
| ---- | --- | -- | ------- |
| Midlife expansion rhythm | 26–30 | `hvg_merchant_midlife_expansion_rhythm` | Ledger/caravan track-specific expansion confirmation after P95 operating pressure; steady vs credit / market vs fast |
| Midlife debt continuity | 32–38 | `merchant_midlife_debt_milestone` | Choice event reading P96 expansion sub-flags; track-specific debt branches + generic fallback |
| Age-40/45 spine gates | 38–48 | `merchant_age40_identity_summary`, `merchant_age45_expansion_fork` | Conditions gate on P95/P96 expansion continuity for native merchant_house path |
| Age-40 identity expression | — | `merchantAge40Identity()` | Ledger vs caravan differentiated identity reading expansion and midlife debt flags |
| Player-facing expression | 26–40+ | `sampleLineExpression.ts` | currentGoal + cost label for expansion rhythm, midlife debt, and age-45 fork framing |
| Proof + regression | — | `tests/p96MerchantMidlifeExpansionTests.ts` | Narrow guards for gates, track divergence, spine continuity, seed 804 baseline |

## 2. What This Stage Proves

- Merchant_house 26–40 now has **one expansion rhythm node** bridging P95 operating pressure to midlife debt
- Ledger and caravan produce **readable differences** in expansion, midlife debt, age-40 identity, and checkpoint goals
- Chain **feeds forward** into `merchant_midlife_debt_milestone`, `merchant_age40_identity_summary`, and `merchant_age45_expansion_fork` without orphaning spine events
- P95 chain (`hvg_merchant_operating_pressure_done`, track flags) remains valid upstream input
- Bridge-origin merchants (apprentice/tavern/peasant) retain generic midlife debt fallback without requiring P96 expansion
- Seed 804 replay remains deterministic (`p50SampleLineSpineTests` passes)

## 3. Explicitly Deferred

- `merchant_magnate` / Wave 3 mixed-achievement on-ramp (**not entered**)
- `merchant_martial_patron` cross-route bridge (**not entered**)
- Full merchant 40+ empire / ending route rewrite
- Scholar / orthodox / demonic parallel reinforcement
- New skill system or progression container
- Full-lifetime broad route audits

## 4. Does Not Enter merchant_magnate or merchant_martial_patron

This stage **does not** implement, design, or wire `merchant_magnate` or `merchant_martial_patron`. Both remain out of scope per PRD §3 Non-Goals and §11 Out-Of-Scope Follow-Up. `magnate_on_ramp` spine event is preserved unchanged.

## 5. Next Bounded Candidate Stage

**P97 — Merchant Magnate On-Ramp Entry Differentiation (narrow playable)**

Scope candidate:

- Bounded magnate on-ramp experience differentiation for merchant_house native path vs bridge origins
- Ledger/caravan operating personality carries into magnate entry framing
- Still does not implement full `merchant_magnate` empire chain or `merchant_martial_patron` bridge

Prerequisite: P96 closure verified (this report + `p96-merchant-26-40-midlife-expansion-chain-proof.md`).

## 6. Story Completion

| Story | Status |
| ----- | ------ |
| P96-001 Gap audit | ✅ |
| P96-002 Midlife expansion rhythm | ✅ |
| P96-003 Spine continuity wiring | ✅ |
| P96-004 Age-40 identity expression | ✅ |
| P96-005 Player-facing midlife expression | ✅ |
| P96-006 Proof + regression | ✅ |
| P96-007 Closure report | ✅ |

**7/7 stories complete. Ready for A1-verify.**

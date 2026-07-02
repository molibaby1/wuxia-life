# P95 Merchant 16–25 Operating Pressure Chain Closure Report

> **Stage:** P95 Wuxia Merchant 16–25 Operating Pressure Chain  
> **Date:** 2026-07-02  
> **Branch:** `codex/p95-wuxia-merchant-16-25-operating-pressure-chain`

## 1. What Was Added (Age 16–25)

| Node | Age | ID | Purpose |
| ---- | --- | -- | ------- |
| Post-shop operating rhythm | 16–19 | `hvg_merchant_post_shop_operating_rhythm` | Ledger/caravan track-specific operating rhythm after shop open; steady vs expand / fast vs market |
| First operating pressure | 19–22 | `hvg_merchant_first_operating_pressure` | Credit/stockout vs market-swing pressure with readable consequences |
| Continuity wiring | — | `merchant.json` | `merchant_shop_failure` and `merchant_caravan_guard` read P95 chain flags |
| Player-facing expression | 16–25+ | `sampleLineExpression.ts`, `playerFacingLabels.ts` | currentGoal + cost label differentiate ledger vs caravan operating voice |
| Proof + regression | — | `tests/p95MerchantOperatingChainTests.ts` | Narrow guards for gates, track divergence, downstream continuity |

## 2. What This Stage Proves

- Merchant_house 16–25 now has **two consecutive operating nodes** after first shop (rhythm + pressure)
- Ledger and caravan produce **readable differences** in rhythm, pressure, goal, and cost label
- Chain **feeds forward** into `merchant_shop_failure` and `merchant_caravan_guard` without orphaning either
- `merchant_first_shop` remains the age 16–22 entry milestone
- P94 flags (`hvg_merchant_*_track`, `hvg_merchant_first_challenge_done`) remain valid upstream inputs
- Seed 804 replay remains deterministic (`p50SampleLineSpineTests` passes)

## 3. Explicitly Deferred

- `merchant_magnate` / Wave 3 mixed-achievement on-ramp (**not entered**)
- `merchant_martial_patron` cross-route bridge (**not entered**)
- Full merchant 26–40 expansion and identity deepening (existing spine nodes preserved)
- Scholar / orthodox / demonic parallel reinforcement
- New skill system or progression container
- Full-lifetime broad route audits

## 4. Does Not Enter merchant_magnate or merchant_martial_patron

This stage **does not** implement, design, or wire `merchant_magnate` or `merchant_martial_patron`. Both remain out of scope per PRD §3 Non-Goals and §11 Out-Of-Scope Follow-Up.

## 5. Next Bounded Candidate Stage

**P96 — Merchant 26–40 Midlife Expansion Identity (narrow playable)**

Scope candidate:

- Midlife debt / age-40 identity expression reinforcement for ledger vs caravan operators
- Bounded payoff before magnate on-ramp
- Still merchant_house only; no martial patron bridge until a dedicated later stage

Prerequisite: P95 closure verified (this report + `p95-merchant-16-25-operating-chain-proof.md`).

## 6. Story Completion

| Story | Status |
| ----- | ------ |
| P95-001 Gap audit | ✅ |
| P95-002 Post-shop operating rhythm | ✅ |
| P95-003 First operating pressure | ✅ |
| P95-004 Continuity wiring | ✅ |
| P95-005 Player-facing expression | ✅ |
| P95-006 Proof + regression | ✅ |
| P95-007 Closure report | ✅ |

**7/7 stories complete. Ready for A1-verify.**

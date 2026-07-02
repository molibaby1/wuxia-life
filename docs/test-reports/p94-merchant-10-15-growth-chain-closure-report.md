# P94 Merchant 10–15 Growth Chain Closure Report

> **Stage:** P94 Wuxia Merchant 10–15 Growth Chain Reinforcement  
> **Date:** 2026-07-02  
> **Branch:** `codex/p94-wuxia-merchant-10-15-growth-chain-reinforcement`

## 1. What Was Added (Age 10–15)

| Node | Age | ID | Purpose |
| ---- | --- | -- | ------- |
| Post-fork confirmation | 10–12 | `hvg_merchant_post_fork_confirmation` | Ledger/caravan track-specific visible confirmation with stat + branch flag |
| First responsibility challenge | 13–15 | `hvg_merchant_first_responsibility_challenge` | Track-specific first pressure (steady vs rushed / bold) with readable consequences |
| Player-facing expression | 10–15+ | `sampleLineExpression.ts`, `playerFacingLabels.ts` | currentGoal + cost label differentiate ledger vs caravan; replaces generic「尚未开张」after chain |
| Continuity wiring | — | `merchant.json` | `merchant_talent_discovery` accepts `hvg_merchant_first_challenge_done` as eligibility input |
| Proof + regression | — | `tests/p94MerchantGrowthChainTests.ts` | Narrow guards for gates, track divergence, player-facing outcomes |

## 2. What This Stage Proves

- Merchant_house 10–15 now has **two consecutive growth nodes** after the early fork
- Ledger and caravan produce **readable differences** in confirmation, challenge, goal, and cost label
- Chain **feeds forward** into `merchant_talent_discovery` without orphaning it
- `merchant_first_shop` remains the age 16–22 major business milestone
- Seed 804 replay remains deterministic (`p50SampleLineSpineTests` passes)

## 3. Explicitly Deferred

- Full merchant 16–25 operating pressure and reward chain
- `merchant_martial_patron` cross-route bridge (**not entered in this stage**)
- Scholar / orthodox / demonic parallel reinforcement
- New skill system or progression container
- Full-lifetime broad route audits
- Age-40 identity logic changes (preserved as-is)

## 4. Does Not Enter merchant_martial_patron

This stage **does not** implement, design, or wire `merchant_martial_patron`. That bridge remains out of scope per PRD §3 Non-Goals and §11 Out-Of-Scope Follow-Up.

## 5. Next Bounded Candidate Stage

**P95 — Merchant 16–25 Operating Pressure Chain (design-first or narrow playable)**

Scope candidate:

- Post-shop operating rhythm (周转、赊欠、扩张试探)
- First mid-teen to mid-twenties business payoff before magnate on-ramp
- Bounded to merchant_house; no martial patron bridge until a dedicated later stage

Prerequisite: P94 closure verified (this report + `p94-merchant-10-15-growth-chain-proof.md`).

## 6. Story Completion

| Story | Status |
| ----- | ------ |
| P94-001 Gap audit | ✅ |
| P94-002 Post-fork confirmation | ✅ |
| P94-003 First challenge | ✅ |
| P94-004 Continuity wiring | ✅ |
| P94-005 Player-facing expression | ✅ |
| P94-006 Proof + regression | ✅ |
| P94-007 Closure report | ✅ |

**7/7 stories complete. Ready for A1-verify.**

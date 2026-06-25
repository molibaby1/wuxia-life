# P51 Merchant Trigger Root Cause (RW-01)

> **Date:** 2026-06-26  
> **Seed:** 804 (`p8-wealth-shen` / 沈聚财)

## Symptom

Benchmark replay age 25+ `currentGoal` stuck at「营商天赋已显，尚未开张」; `merchant_first_shop` never fires.

## Root cause

1. **`merchant_first_shop` money gate** — Condition was `flags.merchant_talent == true && money >= 50`. Seed 804 reaches `merchant_talent` at age 9 via `merchant_talent_discovery`, but **money drops to 0** during ages 10–22 (setbacks, shop-adjacent spends, passive drains). At ages 16–22 the event is eligible by age but **fails the money expression**.

2. **Scheduling cap (secondary)** — Even when conditions pass, mainline once events without `mandatory` can be trimmed from the formal candidate pool (`FORMAL_CANDIDATE_POOL_CAP`). Age-40 identity spine events shared this pattern (RW-02).

## Seed 804 persona context

| Age | merchant_talent | merchant_childhood_seed_done | money | merchant_first_shop eligible |
| --- | --- | --- | --- | --- |
| 9 | true (discovery) | true (age 7 milestone) | varies | no (age < 16) |
| 16 | true | true | **0** | **no (money)** |
| 22 | true | true | **0** | **no (money)** |
| 25 | true | true | 390 | no (age > 22) |

`merchant_childhood_seed_milestone` writes `route_merchant` but does not guarantee `merchant_talent`; discovery at age 9 supplies talent. The blocker is **money**, not missing route flags.

## Fix (P51-001)

- Relax `merchant_first_shop` condition: allow `merchant_childhood_seed_done` or `p8_route_wealth` as alternate capital readiness alongside `money >= 50`.
- Tag `merchant_first_shop` with `mandatory` so benchmark replay cannot drop it from the candidate pool.
- Tag `*_age40_identity_summary` spine events with `mandatory` (RW-02, same scheduling class).

## Verification

- Seed 804 replay: `merchant_first_shop` fires age 16–22; at least one `merchant_shop_*` flag by age 25; age 25 `currentGoal` reflects shop operation.
- `p50SampleLineSpineTests` / `p49SampleLineReplayTests` shop-chain assertion for seed 804.

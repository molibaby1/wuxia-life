# P122 Merchant Visible Growth Sample Baseline

Locked verification chain for `merchant_house` early visible growth (P122-001).

## Sample scope

| Field | Value |
| --- | --- |
| Route / origin | `merchant_house` via `origin_merchant_family` |
| Primary age band | 5–8 |
| Continuation band | 8–12 (readability only, no 10–15 fork expansion) |
| Shaping threshold | `businessHabit >= 2` on existing habit wiring |
| Expected shapingSummary at threshold | `营生 · 渐成` |

## Locked sample actions

1. `action_household_errand` — errand, +1 businessHabit, sets echo hooks
2. `action_household_apprentice` — apprentice, +1 businessHabit, reaches threshold 2

## Baseline chain (aligns with hvg-merchant-visible-growth-proof.md)

```
age 5 start → businessHabit 0 → 塑形未成
after errand → businessHabit 1 → 塑形未成 + p9_echo_business_hook
after apprentice → businessHabit 2 → 营生 · 渐成
age 7–12 → merchant_childhood_seed_milestone (confirmation event)
age 9–11 → hvg_merchant_early_opportunity_fork (8–12 continuation)
```

## Out of scope guards

- No second origin/route parallel sample
- No merchant 10–15 key fork reinforcement in this wave
- No new growth containers, panels, or skill trees

## Code anchor

Constants: `src/hvg/p122MerchantSampleBaseline.ts`

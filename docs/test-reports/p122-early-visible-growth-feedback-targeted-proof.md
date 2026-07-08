# P122 Early Visible Growth Feedback Targeted Proof

Bounded proof for `merchant_house` ages 5–12: behavior → habit → visible confirmation → continuation readability.

## Verification chain

1. Player performs merchant business actions at ages 5–8
2. `businessHabit` accumulates on existing wiring
3. Main-screen `shapingSummary` confirms growth (`营生 · 渐成`)
4. Active-action feedback shows long-term impact lines
5. Period settlement summarizes shaping growth
6. Age 8–12 events read as follow-on from prior shaping

## Sample action loop (merchant_house 5–8)

- **action_household_errand**: businessHabit=1, shapingSummary=`塑形未成`, longTerm=[营生塑形加深；营生方向已被记住，后续机会会由此打开；早期营生重心已确立，人生会沿此方向展开]
- **action_household_apprentice**: businessHabit=2, shapingSummary=`营生 · 渐成`, longTerm=[营生塑形加深]

## Signal A — shapingSummary (summary surface)

| Checkpoint | businessHabit | shapingSummary |
| --- | --- | --- |
| scenario start | 0 | 塑形未成 |
| after action_household_errand | 1 | 塑形未成 |
| after action_household_apprentice | 2 | 营生 · 渐成 |

## Signal B — period settlement (periodSummaryDisplay)

- headline: 营生小成
- shaping growth line present: **true**
- body excerpt: 回看这一期，你的成长主轴是：营生 · 渐成。这是你反复做事积累出来的，不是年岁自然带来的。

## Signal C — long-term impact (feedback area)

- echo hook label: 营生方向已被记住，后续机会会由此打开
- shaping flag label: 营生塑形加深

## 8–12 continuation readability

- `merchant_childhood_seed_milestone` copy references prior errand/apprentice behavior
- `hvg_merchant_early_opportunity_fork` copy references prior营生底子
- Route flags (`route_merchant`, track flags) follow seed confirmation, not isolated events

## Required acceptance (§10)

- At least 2 timepoint confirmations: **yes** (action feedback + period summary / shapingSummary)
- At least 1 from summary/feedback: **yes** (shapingSummary + longTermImpactLines)
- At least 1 from period settlement: **yes** (buildPeriodSummary shaping line)
- Distinguishes growth from background flavor: **yes** (behavior-driven copy)
- No new system nouns: **yes** (existing habit / echo / flag wiring only)

## Scope guards

- Single route: merchant_house only
- No merchant 10–15 fork expansion in this wave
- No second-route parallel work

## HVG baseline cross-check

# HVG Merchant Visible Growth Proof

Multi-scenario proof aligned with browser semantics (primary flag is canonical; trait-only is a risk control).

## flag-only-merchant

Canonical player path: origin_background flag without preset trait origin (browser-aligned).

- business palette at age 6: **true**
- confirmation eligible: **true**
- fork eligible after confirmation: **true**
- merchant_talent_discovery via ledger track: **true**
- merchant_talent_discovery via caravan track: **true**

| Age | businessHabit | shapingSummary | flags | notes |
| --- | --- | --- | --- | --- |
| 5 | 0 | 塑形未成 | origin_merchant_family, origin_id | scenario start |
| 5 | 1 | 塑形未成 | origin_merchant_family, origin_id, p9_echo_business_hook, p9_early_business_focus | after action_household_errand |
| 8 | 2 | 营生 · 渐成 | origin_merchant_family, origin_id, p9_echo_business_hook, p9_early_business_focus | after action_household_apprentice |

## trait-only-merchant

Risk sample: latent trait origin alone must not fake the merchant childhood gate.

- business palette at age 6: **false**


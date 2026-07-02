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
- confirmation eligible: **false**
- fork eligible after confirmation: **false**
- merchant_talent_discovery via ledger track: **false**
- merchant_talent_discovery via caravan track: **false**

| Age | businessHabit | shapingSummary | flags | notes |
| --- | --- | --- | --- | --- |
| 5 | 0 | 塑形未成 | none | scenario start |
| 5 | 1 | 塑形未成 | p9_echo_business_hook, p9_early_business_focus | after action_household_errand |
| 8 | 2 | 营生 · 渐成 | p9_echo_business_hook, p9_early_business_focus | after action_household_apprentice |

## realistic-new-game-merchant

Fresh new game -> origin_background merchant choice -> business loop (no preset random origin).

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


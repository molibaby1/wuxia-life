# P95 Merchant 16-25 Operating Chain Proof

Narrow proof for post-shop rhythm + first operating pressure chain.

## Ledger path (age 23)

| Field | Value |
| --- | --- |
| age | 23 |
| route flags | origin_merchant_family, route_merchant, merchant_shop_grocery |
| branch flag | hvg_merchant_ledger_track |
| chain flags | hvg_merchant_post_shop_rhythm_done, hvg_merchant_operating_pressure_done, hvg_merchant_ledger_pressure_credit |
| player-facing outcome | 赊欠已压稳，店铺周转渐入正轨 |

## Caravan path (age 23)

| Field | Value |
| --- | --- |
| age | 23 |
| route flags | origin_merchant_family, route_merchant, merchant_shop_grocery |
| branch flag | hvg_merchant_caravan_track |
| chain flags | hvg_merchant_post_shop_rhythm_done, hvg_merchant_operating_pressure_done, hvg_merchant_caravan_pressure_swing_loss |
| player-facing outcome | 行市一跌痛彻心扉，押货脚步慢了下来 |

## Continuity

- `merchant_shop_failure` reads `hvg_merchant_operating_pressure_done` for ledger track gating
- `merchant_caravan_guard` reads P95 caravan rhythm/pressure flags for caravan track gating
- `merchant_first_shop` remains age 16-22 entry milestone (unchanged)


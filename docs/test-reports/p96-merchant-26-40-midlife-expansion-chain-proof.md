# P96 Merchant 26-40 Midlife Expansion Chain Proof

Narrow proof for expansion rhythm + midlife spine continuity.

## Ledger path (age 35 checkpoint)

| Field | Value |
| --- | --- |
| age | 35 |
| branch flag | hvg_merchant_ledger_track |
| chain flags | hvg_merchant_operating_pressure_done, hvg_merchant_expansion_rhythm_done, hvg_merchant_ledger_expansion_steady, merchant_midlife_debt_ledger_steady |
| player-facing outcome | 稳扩欠下的债，守信誉比抢规模要紧 |

## Caravan path (age 35 checkpoint)

| Field | Value |
| --- | --- |
| age | 35 |
| branch flag | hvg_merchant_caravan_track |
| chain flags | hvg_merchant_operating_pressure_done, hvg_merchant_expansion_rhythm_done, hvg_merchant_caravan_expansion_market, merchant_midlife_debt_caravan_market |
| player-facing outcome | 赌市扩货的债，行市一跌便喘不过气 |

## Age 40 identity

| Ledger | 你是靠稳扩守信誉做起来的账房式商人：控债务、守周转，宁可慢一步也不砸招牌，四十岁回望，招牌比规模更金贵 |
| Caravan | 你是靠赌市扩货做起来的跑货式商人：吃波动、押行市，四十岁回望，行市的风向比账本上写得烫手 |

## Continuity

- `merchant_midlife_debt_milestone` reads P96 expansion sub-flags for track-specific debt branches
- `merchant_age40_identity_summary` and `merchant_age45_expansion_fork` gate on expansion continuity for P95 path
- `merchantAge40Identity()` distinguishes ledger vs caravan when expansion flags are set


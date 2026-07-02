# P100 Merchant Magnate Native Endgame Chain Proof

> **Stage:** P100 Wuxia Merchant Magnate Native Endgame Echo Sample
> **Date:** 2026-07-02

Narrow proof for native ledger/caravan magnate_endgame_echo differentiation after magnate_late_life_done.

## Ledger path (age 62 endgame checkpoint)

| Field | Value |
| --- | --- |
| age | 62 |
| P97 flags | magnate_native_ledger_entry, magnate_native_ledger_steady |
| P98 flags | magnate_native_payoff_ledger_steady |
| P99 flags | magnate_late_life_done, magnate_native_late_ledger_steady |
| P100 flags | magnate_endgame_echo_done, magnate_native_endgame_ledger_legacy |
| currentGoal | 稳态招牌化作身后名，信誉比规模更长久 |
| costLabel | 稳态身后回响 |
| age40Identity | 你是稳态招牌留名的巨贾：半生稳扩积势守住了信誉，晚年收束之后，江湖提起你说的不是银两多少，而是招牌立得住 |

## Caravan path (age 62 endgame checkpoint)

| Field | Value |
| --- | --- |
| age | 62 |
| P97 flags | magnate_native_caravan_entry, magnate_native_caravan_market |
| P98 flags | magnate_native_payoff_caravan_market |
| P99 flags | magnate_late_life_done, magnate_native_late_caravan_market |
| P100 flags | magnate_endgame_echo_done, magnate_native_endgame_caravan_legacy |
| currentGoal | 行市货路化作身后名，涨跌余波都成了江湖谈资 |
| costLabel | 行市身后回响 |
| age40Identity | 你是行市货路留名的巨贾：半生赌市扩货铺了货路，晚年收势之后，江湖提起你说的不是账本多厚，而是货路走得通 |

## Continuity

- `magnate_endgame_echo_*` auto events read P99 late-life markers or P98/P97 fallback
- Ledger vs caravan produce distinguishable goals, cost labels, and age40 identity at endgame
- P63/P64 bridge expressions retain priority when bridge markers are set
- P55 magnate chain (on-ramp → pressure → payoff → late-life → endgame) remains reachable

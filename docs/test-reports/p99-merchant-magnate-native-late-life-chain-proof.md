# P99 Merchant Magnate Native Late-Life Chain Proof

> **Stage:** P99 Wuxia Merchant Magnate Native Late-Life Sample
> **Date:** 2026-07-02

Narrow proof for native ledger/caravan magnate_late_life differentiation after magnate_payoff_done.

## Ledger path (age 52 late-life checkpoint)

| Field | Value |
| --- | --- |
| age | 52 |
| P97 flags | magnate_native_ledger_entry, magnate_native_ledger_steady |
| P98 flags | magnate_native_payoff_ledger_steady, magnate_native_pressure_ledger_steady |
| P99 flags | magnate_late_life_done, magnate_native_late_ledger_steady |
| currentGoal | 晚年守稳态招牌：信誉比规模更金贵，接班与收束都在眼前 |
| costLabel | 稳态守成之累 |
| age40Identity | 你是稳态守成的晚年巨贾：招牌立住了，跨过中年压力后守信誉比再扩规模更要紧，晚年要把接班与收束一并考量 |

## Caravan path (age 52 late-life checkpoint)

| Field | Value |
| --- | --- |
| age | 52 |
| P97 flags | magnate_native_caravan_entry, magnate_native_caravan_market |
| P98 flags | magnate_native_payoff_caravan_market, magnate_native_pressure_caravan_market |
| P99 flags | magnate_late_life_done, magnate_native_late_caravan_market |
| currentGoal | 晚年收行市余波：涨跌都在心上，货路收势比再押更难 |
| costLabel | 行市收势之累 |
| age40Identity | 你是行市收势的晚年巨贾：赌市扩货铺了货路，晚年涨跌余波仍在心上，收势比再押更难 |

## Continuity

- `magnate_late_life` choice branches read P98 payoff markers or P97 entry lineage
- Ledger vs caravan produce distinguishable goals, cost labels, and age40 identity at late-life
- P63/P64 bridge expressions retain priority when bridge markers are set
- P55 magnate chain (on-ramp → pressure → payoff → late-life) remains reachable


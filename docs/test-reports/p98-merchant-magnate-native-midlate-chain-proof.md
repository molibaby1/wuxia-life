# P98 Merchant Magnate Native Mid/Late Chain Proof

> **Stage:** P98 Wuxia Merchant Magnate Native Mid/Late Differentiation
> **Date:** 2026-07-02

Narrow proof for native ledger/caravan magnate_midlife_pressure and magnate_payoff differentiation.

## Ledger path (age 38 pressure checkpoint)

| Field | Value |
| --- | --- |
| age | 38 |
| P97 flags | magnate_native_ledger_entry, magnate_native_ledger_steady |
| P98 flags | magnate_native_pressure_ledger_steady |
| currentGoal | 商号遍九州，稳扩欠下的人情债也遍九州，守信誉比抢规模要紧 |
| costLabel | 稳扩中年之累 |

## Caravan path (age 44 payoff checkpoint)

| Field | Value |
| --- | --- |
| age | 44 |
| P97 flags | magnate_native_caravan_entry, magnate_native_caravan_market |
| P98 flags | magnate_native_payoff_caravan_market |
| currentGoal | 行市赢家之位已成：赌市扩货铺了货路，涨跌都在心上，守住比再押更难 |
| costLabel | 行市赢家之累 |

## Continuity

- `magnate_midlife_pressure` choice branches read P97 entry markers and set P98 pressure-phase markers
- `magnate_payoff` choice branches read P98 pressure markers or P97 entry lineage
- Ledger vs caravan produce distinguishable goals, cost labels, and age40 identity at pressure/payoff
- P63/P64 bridge expressions retain priority when bridge markers are set
- P55 magnate chain (on-ramp → pressure → payoff) remains reachable


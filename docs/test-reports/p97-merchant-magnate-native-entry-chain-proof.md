# P97 Merchant Magnate Native Entry Chain Proof

> **Stage:** P97 Wuxia Merchant Magnate Native Entry Differentiation
> **Date:** 2026-07-02

Narrow proof for native ledger/caravan magnate_on_ramp differentiation.

## Ledger path (age 30 checkpoint)

| Field | Value |
| --- | --- |
| age | 30 |
| P95/P96 flags | hvg_merchant_ledger_track, hvg_merchant_ledger_expansion_steady |
| magnate entry marker | magnate_native_ledger_entry, magnate_native_ledger_steady |
| currentGoal | 稳扩积势已足，正守信誉跨巨贾门槛 |
| costLabel | 稳扩跨门槛之累 |

## Caravan path (age 30 checkpoint)

| Field | Value |
| --- | --- |
| age | 30 |
| P95/P96 flags | hvg_merchant_caravan_track, hvg_merchant_caravan_expansion_market |
| magnate entry marker | magnate_native_caravan_entry, magnate_native_caravan_market |
| currentGoal | 赌市扩货撑了货路，正押行市跨巨贾门槛 |
| costLabel | 赌市跨门槛之累 |

## Continuity

- `magnate_on_ramp` choice branches read P95/P96 track and expansion flags
- `magnate_midlife_pressure` expression reads native entry markers + P96 expansion sub-flags
- P63 bridge expressions retain priority when bridge markers are set
- P55 magnate chain (on-ramp → pressure → payoff) remains reachable; seed 804 baseline passes


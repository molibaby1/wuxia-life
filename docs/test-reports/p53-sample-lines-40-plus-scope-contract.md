# P53 Sample Lines 40+ Payoff — Scope Contract

> **Date:** 2026-06-26  
> **Stage:** P53 bounded 40+ payoff expansion  
> **Related:** `p53-sample-lines-40-plus-gap-audit.md`

## 1. Age slice

| Line | Seed | Target slice | Max payoff nodes |
| --- | --- | --- | --- |
| Orthodox | 301 | age 44–50 | **1** (primary @ 44–48) |
| Demonic | 303 | age 44–50 | **1** (primary @ 44–48) |
| Merchant | 804 | age 44–50 | **1** (primary @ 44–48) |

**Upper bound:** age 50 for replay/guard checkpoint（不扩至 full lifetime）。

## 2. Continuation conditions（续链 P52 age-40 identity）

| Line | Required pre-flag | Payoff flag (target) | Spine carrier |
| --- | --- | --- | --- |
| Orthodox | `orthodox_age40_identity_done` | `orthodox_age45_payoff_done` | `sample-lines-spine.json` |
| Demonic | `demonic_age40_identity_done` + `route_demonic` | `demonic_age45_payoff_done` | `sample-lines-spine.json` |
| Merchant | `merchant_age40_identity_done` | `merchant_age45_payoff_done` | `sample-lines-spine.json` |

**Rule:** 40+ 节点不得另起 childhood/route 无关主线；必须 gate on `*_age40_identity_done`。

## 3. Pass / warning / fail bar

| Bar | Criteria |
| --- | --- |
| **Pass** | 三线 benchmark seed 在 age 44–50 各触发 ≥1 40+ payoff event/flag；`guard:sample-lines-baseline` Pass；P52 G-01–G-10 不退化 |
| **Warning** | 45+ currentGoal 可读但文案需 polish；M-merchant-debt 仍 monitor-only |
| **Fail** | 任一线 benchmark seed 无 40+ payoff；P52 age-25/40 guard 回归；replay determinism 破坏 |

**Verification:** 仿真（spine + replay tests）为主；轻量人工 spot-check 可选，非 blocking。

## 4. Non-goals（contract 边界）

- 不新增第四条样本线
- 不做 birth→death lifetime sim
- 不重开 P46–P52 blocker
- 不替代 `gate:playability`
- 每线 payoff 节点 **≤ 2**（本 contract 取 1）

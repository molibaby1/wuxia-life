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

---

## Appendix A — Orthodox 40+ payoff spine (P53-003)

**Event ID:** `orthodox_age45_legacy_stewardship`  
**Age:** 44–48 trigger @ 44  
**Theme:** 传承守门 — 承接 age-40 正派身份，延续门派 stewardship/legacy  
**Pre:** `orthodox_age40_identity_done`, not `route_demonic`  
**Post flags:** `orthodox_age45_payoff_done`, `orthodox_age45_legacy_steward_done`  
**Bridge:** 语义对齐 `sect_midlife_stewardship` / `sect_midlife_ledger`，但不依赖其完整 midlife 链  
**Expression hook:** currentGoal →「传承守门，门派遗命在肩」（payoff done）或「四十回望之后，守山之责待承」（age≥44 pre-payoff）

## Appendix B — Demonic 40+ payoff spine (P53-004)

**Event ID:** `demonic_age45_territory_consolidation`  
**Age:** 44–48 trigger @ 44  
**Theme:** 地盘巩固与反噬 — 诱惑/收益/孤立延续，不复述 age-40 邪路总结  
**Pre:** `demonic_age40_identity_done`, `route_demonic`  
**Post flags:** `demonic_age45_payoff_done`, `demonic_age45_territory_consolidated`  
**Bridge:** 语义对齐 `demonic_midlife_consequence` / expansion 主题，spine 保证 benchmark 触发  
**Expression hook:** currentGoal →「地盘既固，反噬与孤立加深」（payoff done）

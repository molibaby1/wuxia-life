# P52 Discovery Gaps — Post-Run (A1 Discovery)

**Date:** 2026-06-26  
**Branch:** `codex/p52-wuxia-sample-lines-baseline-hardening-and-cross-tester-validation`  
**Parent PRD:** `docs/PRD/p52-wuxia-sample-lines-baseline-hardening-and-cross-tester-validation.md`  
**Finalize commit:** `c99cfc0`

---

## Stage assessment

| Field | Value |
| --- | --- |
| **stage_status** | **CLEAR** |
| **Stories** | 13/13 `passes: true`（P52-001 … P52-013） |
| **Verify** | `agent_docs/p52-wuxia-sample-lines-baseline-hardening-and-cross-tester-validation-verify-result.md` — **PASS** |
| **Closure** | `docs/test-reports/p52-baseline-hardening-closure-report.md` — **present** |

### Evidence (2026-06-26 A1 discovery)

| Check | Result |
| --- | --- |
| Round-2 playtest raw | `docs/test-reports/p49-sample-lines-playtest-round-2.md` — **present** |
| Cross-tester comparison | `docs/test-reports/p52-cross-tester-playtest-comparison.md` — **present** |
| Guard contract G-01–G-10 | `docs/test-reports/p52-sample-line-baseline-guard-contract.md` — **present** |
| `guard:sample-lines-baseline` | **Pass** |
| `npm run typecheck` | **Pass** |
| RW-04 defer | **Closed** (P52) |

---

## Product End-State (North Star §8 + P46 sample-line track)

| Track | Status | Notes |
| --- | --- | --- |
| P46 0–40 三线样本线 | **Met** | P49 Pass → P51 tuning → P52 hardening |
| P52 baseline guard | **Met** | cheap guard + cross-tester evidence |
| Sample-line 40+ payoff | **Open** | age-40 identity 后无 structured payoff |
| North Star §8 lifetime sim | **Open** | Wave 2–4 / 平凡出身 / 巅峰运气+选择 — 非 P52 scope |
| `gate:playability` / P20 | **Met** (no regression) | P52 non-goal respected |

**end_state_status:** **OPEN**

---

## Blocking gaps

(none — P52 stage complete)

---

## Gap routing

| ID | Gap | Route | Priority | Target |
| --- | --- | --- | --- | --- |
| GAP-SAMPLE-40PLUS-PAYOFF | 三线 age-40 后缺少 bounded 40+ payoff 节点与 guard/replay 延伸 | **next-stage** | P0 | **P53** (spawned) |
| GAP-NS8-LIFETIME-SIM | North Star §8 五项 checklist 未全 Met（Wave 2–4、平凡出身等） | **defer** | P2 | lifetime sim pipeline（非本 spawn） |
| M-orthodox-gray | seed 301 gray mission 分支未稳定触发 | **monitor** | — | 可选 expression polish；非 blocking |
| M-merchant-debt | seed 804 midlife 债务/人情信号偏轻 | **monitor** | — | P53 可顺带加强；非 blocking |

### in-stage gaps

(none)

### next-stage spawn

| Field | Value |
| --- | --- |
| **spawned** | **true** |
| **prd_md** | `docs/PRD/p53-wuxia-sample-lines-40-plus-payoff-expansion.md` |
| **prd_json** | `docs/PRD/p53-wuxia-sample-lines-40-plus-payoff-expansion.prd.json` |
| **stage_slug** | `p53-wuxia-sample-lines-40-plus-payoff-expansion` |
| **queued_behind_current** | **true** |
| **Rationale** | P52 PRD §8 首要 follow-up（round-2 + guard 稳定 → 40+ payoff）；P46 sample-line 0–40 已 Met，下一 bounded 扩展为 40+ slice |

---

## Monitor-only residuals

| ID | Description | Action |
| --- | --- | --- |
| M-orthodox-gray | Round-2 测试者对正派 gray mission 复述略弱 | monitor；P53 非必须 |
| M-merchant-debt | 商路 midlife debt 玩家感知可加强 | P53-005 可选回应；非 blocking |

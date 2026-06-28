# P54 Sample Lines Residual Polish — Closure Report

> **Date:** 2026-06-26  
> **Stage:** P54 bounded residual polish (post-P53)  
> **Branch:** `codex/p54-wuxia-sample-lines-residual-polish`

## 1. Summary

P54 在 **不改变三线主轴、age-40/45 结论与 P52/P53 guard** 的前提下，将两个 monitor-only residual 补强为 guarded baseline：

| Residual | Status | Evidence |
| --- | --- | --- |
| **M-orthodox-gray** (seed 301) | **Closed** (polished baseline) | Spine 桥接 age 25/32 + expression + G-16 |
| **M-merchant-debt** (seed 804) | **Closed** (polished baseline) | Midlife debt gate 修正 + expression + G-17 |

P54 是 **residual polish**，不是新主阶段扩张。

## 2. Layer evidence

### 2.1 Story configuration

| Change | File | Seed impact |
| --- | --- | --- |
| `orthodox_age25_righteousness_cost_milestone` | `sample-lines-spine.json` | 301 @ 25–28 → `orthodox_righteousness_cost_visible` |
| `orthodox_age32_gray_pressure_milestone` | `sample-lines-spine.json` | 301 @ 32–36 → `orthodox_gray_pressure_visible` |
| `merchant_midlife_debt_milestone` gate 放宽 + mandatory | `sample-lines-spine.json` | 804 shop 路径 @ 32 → `merchant_midlife_debt` |

**Root fixes:** 正派 gray 链不再依赖完整 sect midlife；商路 debt 覆盖 benchmark shop-only 路径。

### 2.2 Light presentation

| Surface | Change |
| --- | --- |
| `orthodoxCurrentGoal` | P54 flags →「守正有代价…」「灰度压力在肩…」 |
| `merchantCurrentGoal` | midlife debt →「周转吃紧，人情债未清」 |
| `merchantAge40Identity` | debt 分支强化「人情与周转风险」 |

### 2.3 Validation scripts

| Harness | New / updated asserts |
| --- | --- |
| `p50SampleLineSpineTests` | `testOrthodox301ResidualSpineSignals`, `testMerchant804ResidualDebtSpine` |
| `p50SampleLineExpressionTests` | `testOrthodox301ResidualExpression`, `testMerchant804ResidualExpression` |
| `p49SampleLineReplayTests` | `testLiveResidualSignalAlignment` |
| Guard contract §8 | G-16, G-17 |

## 3. Validation results

| Command | Result |
| --- | --- |
| `npm exec tsx tests/p50SampleLineSpineTests.ts` | **Pass** |
| `npm exec tsx tests/p50SampleLineExpressionTests.ts` | **Pass** |
| `npm exec tsx tests/p49SampleLineReplayTests.ts` | **Pass** |
| `npm run p49:replay` | **Pass** (latest artifacts refreshed) |
| `npm run guard:sample-lines-baseline` | **Pass** |
| `npm run typecheck` | **Pass** |

## 4. Residual disposition

| ID | Pre-P54 | Post-P54 |
| --- | --- | --- |
| M-orthodox-gray | monitor-only — gray branch 未稳定 | **Closed** — spine 桥接 + 窄 guard；full `sect_midlife_gray_mission` 选择链仍 optional |
| M-merchant-debt | monitor-only — midlife debt 偏轻 | **Closed** — benchmark 804 32+/40 可读 debt/favor |

**Note:** 仿真年内事件顺序导致 checkpoint 25/32 字面年龄可能 +1 年可见（测试用 age 28/35 断言）。属预期 sim 行为，非 blocking。

## 5. Non-regression

- P52 G-01–G-10：**不退化**
- P53 G-11–G-15：**不退化**
- 804 age-25「第一桶金已得，店铺经营中」：**保持**
- 三线 age-40/45 identity / payoff：**保持**

## 6. Related artifacts

- Gap audit: `p54-sample-lines-residual-polish-gap-audit.md`
- Scope contract: `p54-sample-lines-residual-polish-scope-contract.md`
- Guard addendum: `p52-sample-line-baseline-guard-contract.md` §8
- Replay latest: `p49-sample-lines-replay-latest.*`

## 7. Verdict

**P54 complete** — 两个 monitor-only residual 已转为 guarded polished baseline；无 blocking 残余；不建议 spawn 新 expansion stage。

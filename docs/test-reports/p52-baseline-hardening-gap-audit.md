# P52 Baseline Hardening — Post-P51 Evidence Gap Audit

> **Date:** 2026-06-26  
> **Stage:** P52 baseline hardening & cross-tester validation  
> **Baseline:** P51 closure (`docs/test-reports/p51-sample-lines-tuning-closure-report.md`, commit `cb5e92e`)

## 1. Purpose

盘点 P51 收口后仍薄弱的证据项，区分 **真人证据缺口** 与 **自动化守护缺口**，避免重开已关闭的 P46–P51 工作。

## 2. P51 已关闭（不在 P52 重开范围）

| ID | 状态 | 证据 |
| --- | --- | --- |
| RW-01 | **Closed** — seed 804 `merchant_first_shop` 16–22 触发；age 25 经营态 goal | `p50SampleLineSpineTests` `testMerchant804ShopChain` |
| RW-02 | **Closed** — 301/303/804 age-40 identity spine + `*_age40_identity_done` | `p50SampleLineSpineTests` age-40 identity asserts |
| RW-03 | **Closed** — age 13 代价维三线 distinct | `p50SampleLineExpressionTests` `testCrossLineAge13CostLabels` |
| RW-05 | **Closed** — merchant 804 并行 `route_demonic` 时 currentGoal 保持商路表达 | `p50SampleLineExpressionTests` `testMerchantLineWinsOverParallelDemonicRoute` |

P49 整体验证 verdict **Pass**；`gate:playability` 无 regression（P51 closure matrix）。

## 3. Human-evidence gaps（P52 范围）

| Gap | 现状 | P52 目标 |
| --- | --- | --- |
| RW-04 round-2 playtest | P51 **deferred**；仅 round 1 归档（`p49-sample-lines-playtest-round-1.md`） | 第二名测试者完成三线 checklist，归档 round 2 |
| Cross-tester comparison | 缺失 round 1 vs round 2 对比报告 | `p52-cross-tester-playtest-comparison.md` + verdict 表 |
| Single-tester bias | round 1 为 maintainer simulation-assisted review | 跨测试者验证可复述性 / 继续意愿 / 重开意愿 |

**Non-goal:** 不因 round 2 轻微主观差异立即进入大范围调参（PRD §3）。

## 4. Automated-guard gaps（P52 范围）

| Gap | 现状 | P52 目标 |
| --- | --- | --- |
| 301/303 age-25 checkpoint guard | 804 有 `testMerchant804ShopChain` age-25 断言；301/303 缺 age-25 currentGoal guard | `p50SampleLineSpineTests` 窄断言 |
| Guard contract 文档化 | 守护项分散于测试，无集中 contract | `p52-sample-line-baseline-guard-contract.md` |
| Cheap guard 入口 | 需分别跑三个 tsx 测试 | `npm run guard:sample-lines-baseline`（或等价别名） |
| Replay 归档与 RW-05 不同步 | `p49-sample-lines-replay-latest.*` 仍显示 804 age 25+ goal「试探底线，换取力量」（commit `07bddbf`，早于 `cb5e92e`） | 重跑 `p49:replay` 刷新 latest 报告 |
| Playability gate 关系未文档化 | cheap guard 与 `gate:playability` 边界未写明 | guard contract / closure addendum |

## 5. Already adequate（P52 不重做）

| Surface | 覆盖 |
| --- | --- |
| Age-40 identity guard | 三线 `testBenchmarkAge40Identity` in spine tests |
| Merchant goal bleed (RW-05) | expression + spine tests |
| Cross-line cost distinct (age 13) | `testCrossLineAge13CostLabels` |
| P49 replay determinism | `p49SampleLineReplayTests` |
| Full playability | `gate:playability`（P52 不替代，仅声明非回归） |

## 6. P52 scope summary

| 类别 | 条目 |
| --- | --- |
| **Human** | round-2 protocol → execution → cross-tester comparison → verdict |
| **Automated** | age-25 guards (301/303) → guard contract → cheap runner → replay refresh |
| **Closure** | P52 addendum distinguishing P51 pass vs P52 hardened baseline |
| **Out of scope** | 第四条样本线、40+ 内容扩写、大 UI、全 checkpoint snapshot 体系、gameplay 行为改动 |

## 7. Verdict

P51 baseline **passes** on spine/replay/expression and RW-01–03/05. P52 closes RW-04 defer and hardens regression surface without reopening P46–P51 blockers.

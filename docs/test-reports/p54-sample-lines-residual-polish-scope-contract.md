# P54 Sample Lines Residual Polish — Scope Contract

> **Date:** 2026-06-26  
> **Stage:** P54 bounded residual polish  
> **Related:** `p54-sample-lines-residual-polish-gap-audit.md`

## 1. Residual scope（唯一 in-scope 项）

| ID | Line | Seed | P54 目标 |
| --- | --- | --- | --- |
| M-orthodox-gray | Orthodox | 301 | age 25/32 守正代价与灰度压力更可感知 |
| M-merchant-debt | Merchant | 804 | age 32/40 债务与人情代价更可感知 |

**Explicitly excluded:** 第四条线、303 邪路、P53 40+ payoff 重开、full lifetime sim。

## 2. Allowed work layers

| 层 | 允许改动 | 载体 |
| --- | --- | --- |
| 剧情配置 | bounded spine 桥接、现有 milestone 条件修正 | `sample-lines-spine.json` |
| 轻量展示 | currentGoal / identity summary / life-memory 衍生 | `src/p50/sampleLineExpression.ts` |
| 验证脚本 | 窄 spine / expression / replay / guard 断言 | `tests/p50*`, `tests/p49*`, guard contract |

## 3. Forbidden expansions

- 不新增第四条样本线
- 不扩至 age 55+ 或第二个 40+ payoff 节点
- 不重做 sample-line spine 主结构
- 不切回 birth→death lifetime sim
- 不做 runtime 平台化、调度器重写、大 UI 改造
- 不把 monitor-only residual 扩成全量事件池重写
- 不引入新测试框架或新 gate 类型
- **不替代** `npm run gate:playability`

## 4. Pass / warning / fail bar

| Bar | Criteria |
| --- | --- |
| **Pass** | seed 301 在 age 25/32 各 ≥1 守正代价 signal；seed 804 在 age 32/40 各 ≥1 debt/favor signal；P52 G-01–G-15 + P54 G-16/G-17 Pass |
| **Warning** | residual 体验改善但 playtest 仍偏 flat — closure 记 warning，不 reopen P46–P53 |
| **Fail** | 任一线 age-25/40/45 baseline guard 回归；replay determinism 破坏；route bleed |

## 5. Verification harness（复用）

- `npm exec tsx tests/p50SampleLineSpineTests.ts`
- `npm exec tsx tests/p50SampleLineExpressionTests.ts`
- `npm exec tsx tests/p49SampleLineReplayTests.ts`
- `npm run guard:sample-lines-baseline`
- `npm run p49:replay`（刷新 latest artifacts）

## 6. Non-goals restatement

P54 是 **residual polish**，不是新主阶段扩张。closure 不得表述为「样本线下一阶段」。

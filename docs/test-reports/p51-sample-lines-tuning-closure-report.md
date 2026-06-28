# P51 Sample Lines Tuning Closure Report

> **Date:** 2026-06-26  
> **Stage:** P51 merchant trigger + age-40 wiring + cross-line cost tuning  
> **Branch:** `codex/p51-wuxia-sample-lines-merchant-trigger-and-gate-wiring`  
> **Baseline:** P50 Warning (`docs/test-reports/p49-sample-lines-closure-report.md` pre-P51)

## 1. Residual warnings — before / after

| ID | P50 (before) | P51 (after) | Evidence |
| --- | --- | --- | --- |
| RW-01 | seed 804 age 25+「尚未开张」；`merchant_first_shop` 未触发 | **Resolved** — shop chain age 16–22；age 25 goal「第一桶金已得，店铺经营中」 | `p50SampleLineSpineTests` shop-chain assert；`p51-merchant-trigger-root-cause.md` |
| RW-02 | 三线 `*_age40_identity_done` 未稳定写入 | **Resolved** — 301/303/804 均触发专用 age-40 spine + 文案 | `p50SampleLineSpineTests` age40 identity asserts；replay age-40 identity row distinct |
| RW-03 | age 13 代价维 1× collapsed（三线「商路债务」） | **Resolved** — age 13 代价 **distinct**（守正/邪路/商路） | `p50SampleLineExpressionTests` cost labels；cross-line comparison collapsed=0 |
| RW-04 | 第二名 playtest 缺失 | **Deferred** (optional) | Round 1 archived；非 blocking |

## 2. Replay summary (post-P51)

| Seed | Line | finalAge | Age 25 currentGoal (sample) | Age 40 identity done |
| --- | --- | --- | --- | --- |
| 301 | 正派 | 40 | 行侠守义，承担门派义务 | `orthodox_age40_identity_done` |
| 303 | 邪路 | 40 | 力量与地盘在涨，诱惑未止 | `demonic_age40_identity_done` |
| 804 | 商路 | 40 | 第一桶金已得，店铺经营中 | `merchant_age40_identity_done` |

Cross-line comparison: **distinct=22, partial=3, collapsed=0** (`p49-sample-lines-cross-line-comparison-latest.md`).

## 3. Validation matrix

| Check | Result |
| --- | --- |
| `npm run typecheck` | **Pass** |
| `p50SampleLineSpineTests` | **Pass** |
| `p50SampleLineExpressionTests` | **Pass** |
| `p49SampleLineReplayTests` | **Pass** (deterministic hash stable across dual run) |
| `gate:playability` | **Pass** (0 blockers, 3 warnings — no regression vs P50 class) |
| Seeds 301/303/804 finalAge ≥ 38 | **Pass** (all 40) |

## 4. Key code / config changes

- `merchant.json` — relaxed `merchant_first_shop` capital gate + `mandatory` tag
- `sample-lines-spine.json` — mandatory age-38 identity events; childhood seed gating; line-specific age-40 conditions
- `src/p50/sampleLineExpression.ts` — `detectSampleLine` prefers sample-line seeds / merchant shop flags over parallel `route_*`; `deriveSampleLineCostLabel`; age-40 identity prefers `*_done` flags
- `src/p49/sampleLineReplay.ts` — cost dimension uses expression layer
- `src/headless/parity/routeTrackFixtures.ts` — benchmark route-track bootstrap flags at age 7

## 5. Documented defer / follow-up

- **RW-04:** Second human playtest round (optional).
- **RW-05:** **Resolved in current checkout** — merchant seed 804 midlife `currentGoal` now stays on merchant expression when parallel `route_demonic` appears; covered by `p50SampleLineExpressionTests` and `p50SampleLineSpineTests`.

## 6. Overall verdict

**P51 stage: Complete.** RW-01–05 are closed or explicitly deferred, with **RW-04** the only remaining defer. P49 overall verdict stays **Pass**. P46 §11.3 remains **Pass with documented defer**.

# P52 Sample Line Baseline Guard Contract

> **Date:** 2026-06-26  
> **Stage:** P52 minimum automated guard layer  
> **Scope:** Post-P51 three-line baseline (seeds 301, 303, 804) — **does not replace** `npm run gate:playability`

## 1. Purpose

Define must-keep invariants so future sample-line work knows which regressions are blocking vs monitor-only.

## 2. Invariants and guard locations

| ID | Invariant | Guard location | Checkpoint / trigger |
| --- | --- | --- | --- |
| G-01 | Merchant 804 `merchant_first_shop` fires age 16–22; shop flag by age 25 | `tests/p50SampleLineSpineTests.ts` → `testMerchant804ShopChain` | Live sim seed 804 |
| G-02 | Merchant 804 age-25+ currentGoal is 商路经营表达（店铺/经营/周转）；不含「尚未开张」「试探底线」 | `testMerchant804ShopChain` (age 25 goal asserts) | age ≤25 record |
| G-03 | Merchant 804 + parallel `route_demonic` → `detectSampleLine` = merchant; goal stays merchant-facing | `tests/p50SampleLineExpressionTests.ts` → `testMerchantLineWinsOverParallelDemonicRoute` | Fixture state age 28 |
| G-04 | Orthodox 301 age-25 currentGoal 含「行侠」或「门派」类；无 raw key；无商/邪语义渗入 | `tests/p50SampleLineSpineTests.ts` → `testOrthodox301Age25Goal` | Live sim age ≤25 |
| G-05 | Demonic 303 age-25 currentGoal 含「力量」或「地盘」或邪路语义；无 raw key；无商路语义渗入 | `tests/p50SampleLineSpineTests.ts` → `testDemonic303Age25Goal` | Live sim age ≤25 |
| G-06 | 三线 age-40 `*_age40_identity_done` + player-visible identity text | `tests/p50SampleLineSpineTests.ts` → `testBenchmarkAge40Identity` (×3) | age ≤40 record |
| G-07 | Age-13 cost labels distinct across 301/303/804 | `tests/p50SampleLineExpressionTests.ts` → `testCrossLineAge13CostLabels` | Fixture age 13 |
| G-08 | P49 replay matrix spec + deterministic export hash stable | `tests/p49SampleLineReplayTests.ts` → `testMatrixSpec`, `testDeterministicExport`, `testLiveDeterminism` | Fixture + live sim |
| G-09 | Matrix 全三线 age-25 currentGoal 与线 ID 一致（live sim） | `tests/p49SampleLineReplayTests.ts` → `testLiveAge25GoalAlignment` | Live sim checkpoint 25 |
| G-10 | Replay latest artifacts reflect current code (804 merchant goal) | `npm run p49:replay` → `docs/test-reports/p49-sample-lines-replay-latest.*` | Manual / CI on demand |

## 3. Cheap guard runner

**Command:** `npm run guard:sample-lines-baseline`

Runs in sequence:
1. `npm exec tsx tests/p50SampleLineSpineTests.ts`
2. `npm exec tsx tests/p50SampleLineExpressionTests.ts`
3. `npm exec tsx tests/p49SampleLineReplayTests.ts`

**When to run cheap guard:**
- Sample-line expression or spine JSON edits
- `sampleLineExpression.ts` / `sampleLineReplay.ts` changes
- Merchant / orthodox / demonic flag wiring near benchmark seeds
- Before committing P47–P51 class content tuning PRs

**When to run full gate (`npm run gate:playability`):**
- Playability pacing, frustration, or UI-facing changes
- Pre-release / merge to main for gameplay-impacting work
- Any change touching event scheduling, choice economy, or P8 gate surfaces
- Cheap guard pass **does not** imply playability pass

## 4. Non-regression declaration

- Cheap guard **supplements** P49/P50 tests; it **does not substitute** `gate:playability`.
- P52 adds age-25 guards and documents workflow; playability gate scope unchanged from P51.

## 5. Out of scope (explicit non-guards)

- Full checkpoint snapshot for ages 13/18/32
- Fourth sample line
- Full birth→death lifetime sim
- Human playtest automation

## 6. P53 addendum — G-40+ checkpoints (2026-06-26)

| ID | Invariant | Guard location | Checkpoint / trigger |
| --- | --- | --- | --- |
| G-11 | Orthodox 301 age-45 `orthodox_age45_payoff_done` + payoff event in 44–48 | `p50SampleLineSpineTests` → `testBenchmarkAge45Payoff` | Live sim seed 301 age ≤50 |
| G-12 | Demonic 303 age-45 `demonic_age45_payoff_done` + payoff event in 44–48 | `testBenchmarkAge45Payoff` | Live sim seed 303 |
| G-13 | Merchant 804 age-45 `merchant_age45_payoff_done` + payoff event in 44–48 | `testBenchmarkAge45Payoff` | Live sim seed 804 |
| G-14 | Replay matrix age-45 post40PayoffDone + line-consistent currentGoal | `p49SampleLineReplayTests` → `testLiveAge45PayoffAlignment` | Live sim checkpoint 45 |
| G-15 | P49 checkpoint ages include 45/50; replay latest reflects 40+ slice | `p49:replay` → `p49-sample-lines-replay-latest.*` | On demand |

P52 G-01–G-10 **unchanged**. P53 extends guard surface only for 40+ slice.

## 7. Related artifacts

- Gap audit: `p52-baseline-hardening-gap-audit.md`
- Cross-tester comparison: `p52-cross-tester-playtest-comparison.md`
- Closure: `p52-baseline-hardening-closure-report.md`

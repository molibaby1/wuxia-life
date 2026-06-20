# Stage-3 Four-Origin Infant Quest Chains — Divergence Report (US-015)

**PRD:** `docs/PRD/early-childhood-origin-infant-quest-chains.md`  
**Date:** 2026-06-20T00:10:55.216Z  
**Decision:** **PASS**  
**Stage-2 baseline:** 书香×边疆 70.6% overlap (full narrative to age 7)  
**Stage-3 target:** C(4,2) chain-node overlap <50% at age 2

## Repro

```bash
npm run report:infant-passive-verification
npm exec tsx tests/infantPassiveChainVerificationTests.ts
npm run gate:p16
```

## Pairwise chain-node overlap at age 2 (C(4,2)=6)

| 对比 | 交集 | 并集 | 重合度 | 结果 |
| --- | --- | --- | --- | --- |
| 书香门第 × 武林世家 | 0 | 10 | 0.0% | PASS |
| 书香门第 × 商贾之家 | 0 | 10 | 0.0% | PASS |
| 书香门第 × 边疆异族 | 0 | 10 | 0.0% | PASS |
| 武林世家 × 商贾之家 | 0 | 10 | 0.0% | PASS |
| 武林世家 × 边疆异族 | 0 | 10 | 0.0% | PASS |
| 商贾之家 × 边疆异族 | 0 | 10 | 0.0% | PASS |

**书香×边疆 Stage-3:** 0.0% (PASS) — down from Stage-2 70.6%

## Agency & stat guards (0～2 岁)

| 出身 | 被动期 | 规划违规 | 占位句 | 链完成 |
| --- | --- | --- | --- | --- |
| 书香门第 | 12 | 0 | 0 | 是 |
| 武林世家 | 12 | 0 | 0 | 是 |
| 商贾之家 | 12 | 0 | 0 | 是 |
| 边疆异族 | 12 | 0 | 0 | 是 |

## Chain node sequences (selector simulation)

- **书香门第:** scholar_infant_01_hall_birth → scholar_infant_02_swaddle_ink → scholar_infant_03_grasp_brush → scholar_infant_04_trace_red → scholar_infant_05_corridor_steps
- **武林世家:** martial_infant_01_hall_birth → martial_infant_02_swaddle_dummy → martial_infant_03_grasp_wood → martial_infant_04_corridor_watch → martial_infant_05_yard_steps
- **商贾之家:** merchant_infant_01_shop_birth → merchant_infant_02_swaddle_abacus → merchant_infant_03_grasp_scale → merchant_infant_04_counter_crawl → merchant_infant_05_alley_steps
- **边疆异族:** frontier_infant_01_camp_birth → frontier_infant_02_swaddle_wind → frontier_infant_03_grasp_bow → frontier_infant_04_tent_crawl → frontier_infant_05_rampart_steps

Full AC-X detail: `docs/test-reports/infant-passive-chain-verification.md`

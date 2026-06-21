# Neutral Passive Title Deduplication — Stage-9 (US-005)

**Date:** 2026-06-21  
**PRD:** Stage-9 US-005 (conditional — final playtest was PARTIAL before fix)

## Root cause

Frontier seed 70004: infant shared filler `infant_crawl_home`（「咿呀学语」）为唯一 1～2 岁候链 filler，等待链节点时连出 **3** 次。

## Changes

| Area | Change |
| --- | --- |
| `originInfantPassiveChain.ts` | Title dedup + rotated `infant_passive_gap::*` when single filler would repeat |
| `preschoolPassiveSpine.ts` | Window 7; 8–12 gap titles; consecutive cap; id-agnostic title history |
| `infantPassiveNarratives.ts` | Ages ≤12 use preschool selector (8–12 gap path) |
| `HeadlessEngineSessionImpl.ts` | Record displayed passive title in history on tick |

## Final playtest (after fix)

| Origin | maxConsecutivePassiveTitle |
| --- | --- |
| 四出身 | **1** each |

**Suite:** Passive title consecutive **PASS** (≤2).

## Reproduce

```bash
npm exec tsx tests/neutralPassiveDedupTests.ts
npm exec tsx scripts/runEarlyChildhoodFinalPlaytest.ts
npm exec tsx tests/infantPassiveChainVerificationTests.ts
```

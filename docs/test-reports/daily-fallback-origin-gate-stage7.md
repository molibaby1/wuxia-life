# Daily Fallback Origin Gate — Stage-7 (US-003)

**PRD:** `docs/PRD/early-childhood-childhood-experience-stage7.md`  
**Date:** 2026-06-21T08:11:21.123Z  
**Decision:** **PASS**

## Wiring

| Location | Behavior |
| --- | --- |
| `DailyEventSystem.selectEvent` | Filters configs via `isSpineOriginEligible(buildProbeEvent(...))` before weighted pick |
| `GameEngineIntegration.selectEvent` | Unchanged call sites; daily branch inherits gate via `dailyEventSystem` |

## Production pool semantics

Current `src/data/life/dailyEvents.ts` entries have **no** `spineOriginStageFit` — all pass gate (origin-neutral). See US-001 audit appendix A.

## Headless mock matrix

| Case | Primary | Mock pool | Result |
| --- | --- | --- | --- |
| Scholar vs martial exclusive | `origin_scholar_family` | martial + neutral dailies × 50 rolls | martial never selected ✅ |
| Martial match | `origin_wuxia_family` | martial daily only | selected ✅ |
| All filtered | `origin_scholar_family` | martial + merchant exclusive | `null` ✅ |

## Reproduce

```bash
npm exec tsx tests/dailyFallbackOriginGateTests.ts
npm exec tsx tests/spineOriginIsolationTests.ts
npm exec tsx tests/preschoolOriginIsolationTests.ts
```

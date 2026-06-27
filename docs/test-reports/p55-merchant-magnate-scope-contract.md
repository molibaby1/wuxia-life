# P55 Merchant Magnate Scope Contract

> **Date:** 2026-06-27
> **Stage:** P55 bounded merchant magnate expansion

## 1. Scope Statement

P55 delivers a **bounded, verifiable, reproducible** merchant magnate growth stage. It extends the existing P25 static mixed identity proof into a minimal content chain, player-facing expression, targeted simulation evidence, and narrow regression coverage.

## 2. Allowed Layers

| Layer | What P55 Does | Constraints |
| --- | --- | --- |
| **Story Configuration** | Add magnate-specific spine events in `sample-lines-spine.json`; add magnate-relevant flags to existing merchant events in `merchant.json` | Reuse existing config format; no new config systems |
| **Light Presentation** | Add ≥2 magnate-specific expression signals in `sampleLineExpression.ts` and/or `deriveLifeMemorySummary.ts` | No new UI components; text-only changes |
| **Validation Scripts** | Add 1 targeted sim slice, 1+ regression tests, replay/audit artifact | Reuse existing test harness (tsx scripts, p50 pattern) |
| **Documentation** | Gap audit, scope contract, on-ramp/payoff design, replay artifact, closure report | Follow existing docs/test-reports conventions |

## 3. Forbidden Expansions

| Forbidden | Why |
| --- | --- |
| **Wave 4 ordinary growth** | Explicitly deferred; not P55 scope |
| **Full economy system** | Would require new runtime framework; P55 is bounded content growth |
| **Sample-line track reopening** | P46→P54 is closed; P55 extends outside the sample-line track |
| **Runtime platformization** | No event pool batch activation, no scheduler rewrite |
| **New configuration systems** | P55 uses existing JSON config carriers only |
| **New UI components** | P55 expression is text-only in existing surfaces |

## 4. Boundary Definition

### 4.1 P55 vs Sample-Line Track

| Dimension | Sample-Line Track (P46→P54) | P55 Merchant Magnate |
| --- | --- | --- |
| Scope | Full birth→age-45+ per-line proof | Bounded magnate arc (on-ramp → pressure → payoff) |
| Config location | `sample-lines-spine.json` primary | `sample-lines-spine.json` + `merchant.json` |
| Expression | Line-specific currentGoal/identity | Magnate-specific signals within merchant line |
| Validation | Full replay + cross-line comparison | Targeted sim slice + narrow tests |

### 4.2 P55 vs Wave 4

| Dimension | Wave 4 (deferred) | P55 |
| --- | --- | --- |
| Content scope | Ordinary origin growth, full routes | Magnate bounded chain only |
| Config scope | New pools, new events | Minimal spine events + flag wiring |
| Runtime scope | May require scheduling changes | No runtime changes |

### 4.3 P55 vs Full Economy

| Dimension | Full Economy (not P55) | P55 |
| --- | --- | --- |
| System scope | Trade routes, market simulation, faction economics | Magnate narrative chain only |
| Data scope | Dynamic market data, price systems | Static event configs |
| UI scope | Trade UI, inventory, market screens | No new UI |

## 5. Acceptance Criteria

- [ ] Magnate on-ramp, pressure, payoff chain exists in config
- [ ] ≥2 magnate-specific expression signals visible to player
- [ ] 1 targeted sim slice proves magnate terminal outcome
- [ ] Regression tests for on-ramp, payoff, expression
- [ ] Guard `guard:sample-lines-baseline` passes
- [ ] `typecheck` passes
- [ ] No regression in sample-line / P25 / P39 evidence

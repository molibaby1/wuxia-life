# P16 Early-Life Variance Surface Audit (US-001)

Read-only audit of origin, childhood, and route-entry variance before P16 implementation.

## Summary

Early-life differentiation exists but is fragmented across TraitSystem random profiles, a parallel age-1 `origin_background` choice event, and daily-event trait preferences. Several config surfaces (`backgroundWeights`, `longTermHooks.addTendency`) are authored but not wired at runtime.

## Variance Surfaces

| Surface | Source of truth | Classification | Notes |
|---------|-----------------|----------------|-------|
| Origin identity (6 types) | `src/data/traits/origins.ts` | Config-driven | Applied at `TraitSystem.applyProfile()` |
| Origin player choice (4 types) | `src/data/lines/origin.json` (`origin_background`) | Config-driven | Age 1; overlaps TraitSystem flags with different naming |
| Initial stats / money | `OriginConfig.initialStats` | Config-driven | One-time at new game |
| Early event biases | `OriginConfig.earlyEventBiases` | Config-driven | `TraitSystem.getEventWeightMultiplier()`; damped after age 18 |
| Childhood formal spine | `src/data/lines/general.json`, `origin.json` | Config-driven | Age 0–12 milestones via `EventLoader` |
| Daily childhood pool | `src/data/life/dailyEvents.ts` | Config-driven | Trait `preferredTraits` / `suppressedTraits`; age 8+ |
| Life states (discipline, fatigue…) | `src/data/life/lifeStates.ts` + trait `startingStates` | Partially config-driven | Runtime accumulation via events |
| Background event weights | `metadata.backgroundWeights` in line JSON | **Config only — unwired** | No reader in `src/core/` |
| Tendency hooks | `DailyEventConfig.longTermHooks.addTendency` | **Config only — unwired** | Types exist; no runtime consumer |
| Family resources (abstract) | Implicit via `money` stat modifiers | Partially config-driven | No explicit `familyResources` field pre-P16 |
| Guidance / teaching | `childhood_preference`, `preteen_training` events | Config-driven | Choice at age 4; not origin-conditioned |
| Social exposure | Daily `emotion`/`family` groups, `clever_speech` | Config-driven | Mostly age 10+; origin via trait prefs only |
| Route-entry active actions | `src/data/activeActionCatalog.ts` | Runtime-bound | No age guardrails; all 5 actions at any age |
| P11 stage/route scheduling | `src/p11/schedulingPolicy.ts` | Semi config-driven | Uses narrative scheduling metadata |
| WorldProfile origin slot | `wuxiaSummarySignals` `sourceRole: origin` | Profile metadata only | Summary variable; no origin schema pre-P16 |
| Deferred childhood pack | `src/data/childhoodEvents.ts` | **Not loaded** | Absent from `EventLoader.lineMap` |

## Source-of-Truth Map

```
New game
  └─ TraitSystem.generateProfile() → origins.ts (random 6-way)
       └─ applyProfile() → stats, flags, lifeStates, growthBiasSummary

Age 0–12 formal events
  └─ EventLoader → general.json + origin.json
       └─ GameEngineIntegration.selectEvent() / pickWeightedFormalEvent()
            └─ trait weight + path + P11 scheduling + lifeStates

Story gap fallback
  └─ getAvailableActiveActions() → all P7 minimum actions (no age filter)
       └─ OR DailyEventSystem → dailyEvents.ts

Age 40 summary
  └─ NarrativeConfigLoader.resolveConfiguredAge40Identity()
       └─ origin name from trait profile (not profile originSurfaces)
```

## Highest-Impact Gaps (P16 targets)

1. **Dual origin tracks** — TraitSystem random origin vs age-1 four-choice event; flag naming mismatch (`origin_frontier` vs `origin_frontier_family`).
2. **Unwired differentiation config** — `backgroundWeights` and `addTendency` never affect selection or state.
3. **No profile-first origin surfaces** — family resources, guidance quality, social capital, hardship exposure not expressible in WorldProfile.
4. **Childhood agency** — commerce/travel/socializing available from age 0 via active-action fallback.
5. **No composite destiny or rare-line infrastructure** — only PRD targets; `CompositeConditionEvaluator` is generic boolean logic only.

## Non-Goals for This Story

No gameplay or schema changes were made in US-001.

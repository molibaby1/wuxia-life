# P16 Before-and-After Findings (US-025)

Evidence summary for the main P16 experience targets.

## Origin variance

| Before | After |
|--------|-------|
| Origin differences mostly via one-time `initialStats` and trait `earlyEventBiases` | `WorldProfile.originSurfaces` exposes family resources, guidance, social capital, hardship, regional background per origin |
| No profile-first material/guidance weighting in event selection | `getOriginChildhoodEventMultiplier()` wired into `pickWeightedFormalEvent()` for ages 0–18 |
| Audits showed merchant vs poor not traceable in reports | `p16-origin-variance-slice.json` shows materialΔ ≥ 0.35 and survival weight spread > 0.15 |

## Childhood agency sanity

| Before | After |
|--------|-------|
| All 5 P7 actions available at any age in story-gap fallback | `filterActionsForChildhoodAgency()` — age 0–7 training only; age 8–12 training + study |
| Business/travel/socializing could seed `p9_early_*` route entry in infancy | Suppressed actions removed from `getAvailableActiveActions()` until age 13 |
| No automated gate | P16 gate reports suppressed action IDs at age 5 |

## Composite destiny coverage

| Before | After |
|--------|-------|
| No multi-factor destiny model | `CompositeDestinyOutcome` schema with 6 dimensions |
| High outcomes implied single-axis martial grind | 3 representative outcomes: martial+reputation+choice, org+cultivation+resources, martial+rare-line+anti-social |
| No progress visibility | `evaluateCompositeDestinyOutcome()` reports satisfied/missing/blocked per dimension |

## Rare-line observability

| Before | After |
|--------|-------|
| `TraitSystem.RARE_COMBOS` titles only | `rareEventLines` config with origin/stage/choice conditions |
| Luck did not alter opportunity space | Triggered lines set flags and boost matching event-tag weights via engine checkpoints at ages 10/15/20 |
| Not testable | `p16-origin-choice-luck-slice.json` demonstrates rare-line divergence and composite lock without rare flag |

## Gate regression (see p16-gate-verification.md)

Playability and profile gates re-run after implementation; outcomes recorded in verification note.

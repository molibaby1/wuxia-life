# US-009 Route Compatibility Rules

## Scope

This story defines deterministic compatibility/conflict rules for core P2 route identities and expresses them as a testable table for runtime checks.

Covered route identities:

- `merchant`
- `hero`
- `sect`
- `demonic`
- `official`
- `hermit`
- `wanderer`

## Testable Compatibility Table

| Route A | Route B | Compatibility Level | Conflict Resolution | Rationale |
| --- | --- | --- | --- | --- |
| `hero` | `demonic` | `strong_exclusion` | `block_candidate` | Core righteous-vs-demonic identity contradiction |
| `official` | `demonic` | `strong_exclusion` | `block_candidate` | Institutional authority and demonic path are structurally incompatible |
| `sect` | `demonic` | `strong_exclusion` | `block_candidate` | Sect orthodoxy and demonic allegiance conflict on core commitment |
| `merchant` | `hero` | `soft_exclusion` | `require_turn_event` | Profit-first and chivalry-first priorities can conflict but are pivotable |
| `official` | `hermit` | `soft_exclusion` | `require_turn_event` | Entering office and withdrawing from society conflict in value direction |
| `sect` | `wanderer` | `soft_exclusion` | `require_turn_event` | Sect-bound commitment conflicts with no-sect wandering identity |
| `merchant` | `official` | `coexist` | `allow_coexist` | Merchant and official paths can form a mutually beneficial relation |
| `hero` | `wanderer` | `coexist` | `allow_coexist` | Wandering can coexist with roaming hero behavior |
| `hermit` | `wanderer` | `coexist` | `allow_coexist` | Hermit and wanderer represent compatible life-style overlap |

Implementation source of truth: `src/core/RouteCompatibilityRules.ts`.

## Conflict Resolution Behavior

- `strong_exclusion`:
  - Always resolves to `block_candidate`.
  - Candidate route cannot be entered in the current state.
- `soft_exclusion`:
  - If route is not lock-in: resolves to `allow_coexist` (temporary coexistence allowed).
  - If route is lock-in: resolves to `require_turn_event` (must pass explicit pivot/turn flow).
- `coexist`:
  - Resolves to `allow_coexist`.
  - Route can be entered without conflict workflow.

When multiple conflicts exist simultaneously, highest priority wins:

`strong_exclusion` > `soft_exclusion` > `coexist`

## Verification Evidence

- Rule table is encoded as executable constants in `ROUTE_COMPATIBILITY_TABLE`.
- Regression tests added in `tests/AllTests.ts` verify:
  - strong exclusion + coexist classification,
  - soft exclusion behavior difference between lock-in and non-lock-in states,
  - strong exclusion precedence over soft exclusion in mixed conflicts.

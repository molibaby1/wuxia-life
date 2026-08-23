# Game State Snapshot Contract

## Current version

The current snapshot schema is `3.15.0`. All other versions are rejected.

`GameStateSnapshot` is the JSON transport shape. Its exact envelope is `{ metadata, state }`; both objects are closed allowlists. The browser `SaveData` wrapper is separately `{ id, name, timestamp, snapshot, metadata }`, where wrapper metadata is exactly `{ playerAge, playerName, eventCount, playTime }`.

`src/contracts/validation/canonicalGameStateValidation.ts` is the single runtime-safe validation source. Headless conversion, browser save/load/autosave/import, and runtime state loading use this boundary.

## Required state

The following top-level state fields are required:

- `player`
- `facts`
- `flags`
- `relations`
- `eventHistory`
- `actionHistory`
- `actionFocusStreak`

`player.wealthCapacity` is required and categorical. `player.lifeStates` is required and must contain exactly `trainingHabit`, `studyHabit`, and `businessHabit`. Each value is a finite number in the inclusive range `0..5`.

The complete top-level `state` requires the five fields above and validates every present nested object. `eventHistory[*].stateSnapshot` is a different shape: it is an explicitly partial state, so keys may be omitted, but every present key and nested value still follows the same closed allowlists and primitive rules. A partial nested snapshot is never treated as a complete top-level state.

All required numeric values are finite numbers; booleans, strings, arrays, facts, relations, current time, identities, life path, karma, critical choices, inventory, action history, focus streak, tendency shaping, and ending values have exact structural validation. Unknown keys, wrong primitive types, missing required fields, invalid enum values, non-JSON values, and non-finite numbers are rejected.

Optional persisted fields use omission semantics: an absent field is represented by no own property, while an existing own property with value `undefined` is invalid canonical JSON. Runtime producers must omit or delete optional fields when they are absent; converters and persistence boundaries do not silently remove `undefined`. For example, `{}` is valid for an absent optional field, while `{ timestamp: undefined }` is invalid.

## Route flags

Route flags remain ordinary persisted flags. They are content signals and may coexist. They do not imply a structured route state, route history, commitment, lifecycle, conflict, lock, completion, or migration record.

## Forbidden fields

Snapshots reject the removed route lifecycle fields:

- `routeStates`
- `routeHistory`
- `roadCommitments`

They are rejected at validation, conversion, runtime load, save, autosave, and import boundaries. No default containers, fallback, normalization, or migration is applied.

The same validation applies recursively to `eventHistory[*].stateSnapshot`. Retired `comprehension`, legacy `energy`, `health`, old `lifeStates` keys, and legacy habit flags are rejected by structure, not by matching arbitrary event text.

Investments must contain exactly `martial`, `statecraft`, `official`, and `hermit`; each value is a finite non-negative number. `statuses` and `traits` must contain only current IDs, and statuses cannot repeat.

## Converter behavior

`toSnapshot()` serializes the current canonical state with fully isolated nested copies and throws when a removed field is dynamically present. `fromSnapshot()` accepts only version `3.15.0` snapshots without removed fields and does not synthesize them. `lifePath.focus` and `player.comprehension` are unknown fields and are rejected in both top-level and nested `stateSnapshot` values; there is no migration, compatibility, fallback, or silent cleanup.

`loadGameState()` applies the hydrated state exactly: required fields overwrite the engine state, optional persisted fields are copied when present and deleted when absent, and existing engine values are never retained as fallback. Valid falsy values such as `0`, `false`, empty strings, and empty arrays are applied. Runtime application remains detached from source objects.

## Persistence classification

| Field | Classification | Rule |
| --- | --- | --- |
| `actionHistory` | persistent | Round-trips because scheduling context consumes it. |
| `actionFocusStreak` | persistent | Round-trips because active-action planning consumes it. |
| `p16TendencyShaping` | persistent | Round-trips because later childhood/worldview outcomes consume it. |
| `selfAwareness` | transient/derived | Runtime presentation state; not in the snapshot allowlist. |
| `playerFeedbackMessage` | transient UI | Runtime feedback only; not in the snapshot allowlist. |
| `p16RareLineLog` | transient audit log | Producer-only in the current runtime; not in the snapshot allowlist. |
| `statistics` | derived | Recomputed/runtime-only; not in the snapshot allowlist. |

## Compatibility policy

This is a contract retirement, not a compatibility bridge. Old snapshots must be explicitly re-created under the current contract by an external product migration process; the runtime does not perform that migration.

Browser saves persist the strict `SaveData` wrapper above. Export files additionally require `{ version: "3.15.0", exportTime, save }`. Old P2 raw `GameState` saves are rejected; there is no migration, adapter, silent cleanup, or fallback read.

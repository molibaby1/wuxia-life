# Game State Snapshot Contract

## Current version

The current snapshot schema is `3.9.0`. Versions `3.8.x` and earlier are not accepted.

`GameStateSnapshot` is the JSON transport shape. It contains the persisted player core, canonical flags, facts, relations, event history, life path, identity, karma, choices, inventory, ending, and save metadata.

## Required state

The following top-level state fields are required:

- `player`
- `facts`
- `flags`
- `relations`
- `eventHistory`

`player.lifeStates` is required and must contain exactly `trainingHabit`, `studyHabit`, and `businessHabit`. Each value is a finite number in the inclusive range `0..5`.

## Route flags

Route flags remain ordinary persisted flags. They are content signals and may coexist. They do not imply a structured route state, route history, commitment, lifecycle, conflict, lock, completion, or migration record.

## Forbidden fields

Snapshots reject the removed route lifecycle fields:

- `routeStates`
- `routeHistory`
- `roadCommitments`

They are rejected at validation, conversion, runtime load, save, autosave, and import boundaries. No default containers, fallback, normalization, or migration is applied.

## Converter behavior

`toSnapshot()` serializes the current canonical state and throws when a removed field is dynamically present. `fromSnapshot()` accepts only version `3.9.0` snapshots without removed fields and does not synthesize them.

## Derived and volatile data

Runtime-only statistics, UI state, pending session state, and life-memory presentation are not persisted. They are recomputed from canonical state and event history where needed.

## Compatibility policy

This is a contract retirement, not a compatibility bridge. Old snapshots must be explicitly re-created under the current contract by an external product migration process; the runtime does not perform that migration.

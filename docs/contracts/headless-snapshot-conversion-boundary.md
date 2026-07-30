# Headless Snapshot Conversion Boundary

`DefaultSnapshotConverter` converts between runtime `GameState` and the `3.9.0` `GameStateSnapshot` contract.

## Persisted data

The converter preserves the canonical player core, required `player.lifeStates`, facts, flags, relations, event history, life path, identity, karma, critical choices, inventory, ending, and save metadata.

Route flags are persisted as ordinary content flags. No route lifecycle container is part of runtime state or snapshot state.

## Rejection rules

The converter rejects:

- snapshots older than `3.9.0`;
- removed route lifecycle fields (`routeStates`, `routeHistory`, `roadCommitments`);
- missing required player state or invalid `lifeStates`.

The converter does not add defaults, normalize legacy route data, re-compute routes from event history, or translate removed fields.

## Derived and volatile data

Statistics, life-memory presentation, UI state, and other volatile session values are omitted. They are derived after hydration where required.

`toSnapshot()` fails if a removed field is injected into the runtime object. `fromSnapshot()` returns only the current canonical runtime shape.

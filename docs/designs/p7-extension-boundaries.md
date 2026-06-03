# P7 Extension Boundaries (US-039)

## Talents (not implemented)

Hook: multiply action reward channels in `ActionResultResolver` via future `talentModifiers` parameter.

## Items (not implemented)

Hook: adjust action costs and choice threshold explanations via inventory flags.

## Worldbuilding / regions / factions

Hook: filter `activeActionCatalog` and disturbance pool by `state.flags.region_*` and faction standing.

## Explicit non-implementation

P7 does **not** ship talent trees, inventory UI, region map, or faction reputation grids — only typed extension points and documentation.

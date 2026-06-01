# Event Catalog Service Boundary (P4 US-014)

Boundary for future backend event catalog delivery without changing current `EventLoader` runtime behavior.

## 1. Catalog Concepts

| Concept | Description |
| --- | --- |
| `catalogVersion` | Semver or content hash of the full event bundle |
| `eventBundle` | Versioned collection of triggerable event definitions |
| `eventId` | Stable event identifier |
| `routeTrack` | Route affinity tags (hero, merchant, scholar, etc.) |
| `ageRange` | Min/max player age for eligibility |
| `status` | `active`, `candidate`, `deferred`, `broken`, `dead` |
| `validationState` | Asset QA state from inventory scripts |

## 2. Query Boundaries

Future catalog read service may own:

- Fetch bundle by `catalogVersion`
- Filter by age range, route track, status scope
- Return validation summary counts

Engine-side filtering **remains** for:

- Player-specific eligibility (flags, relationships, route lifecycle)
- Weighted selection and guard rules
- Cooldown and repetition guards
- Hidden trigger conditions requiring full game state

## 3. Payload Constraints

- Do not expose full internal QA fields to player clients by default.
- Deferred/broken/dead events must not appear in player-facing bundles unless diagnostic mode.
- Server-only fields: asset file paths, author notes, simulation-only weights.
- Diagnostic-only fields: broken reason codes, migration notes.

## 4. Ownership Split

| Concern | Current (P4) | Future service |
| --- | --- | --- |
| Event JSON storage | Client bundle (`events.json`) | Versioned catalog store |
| Version pinning | Build-time | Request metadata + save snapshot |
| Active/deferred scope | EventLoader + inventory | Catalog bundle manifest |
| Trigger eligibility | Engine | Engine (unchanged) |

## 5. Non-Goals

- No EventLoader migration in P4.
- No event asset batch edits.

## 6. References

- `src/core/EventLoader.ts`
- `scripts/inventoryEventAssets.ts`

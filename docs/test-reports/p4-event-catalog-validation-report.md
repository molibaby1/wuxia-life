# P4 Event Catalog Contract Validation Report (US-016)

Generated from `src/data/event-asset-manifest.json` inventory against P4 event catalog contract categories.

## 1. Status Counts (Runtime-Loaded Events)

| Status | Count | Catalog contract mapping |
| --- | ---: | --- |
| active | 36 | Player-triggerable spine events |
| candidate | 73 | Eligible pool; engine selection applies |
| deferred | 84 | Backlog / non-loaded or deferred scope |
| broken | 41 | QA broken; must not ship in player bundle |
| dead | 0 | Retired assets |

**Runtime scope:** 21 loaded files, 234 total events in runtime bundle.

## 2. Misfit Fields vs Future Catalog Contract

| Current asset pattern | Future handling |
| --- | --- |
| File-level `deferred` backlog not in `events.json` | Exclude from default bundle response |
| Broken event ids in runtime | Diagnostic-only until fixed; filter from player bundle |
| Internal simulation weights | Server-only / engine-only |
| Author notes in JSON comments (if any) | Strip from API payload |
| Golden-line overlap metadata | Diagnostic inventory, not player-facing |

## 3. Server-Only / Diagnostic-Only Fields (Later)

**Server-only (do not expose to client by default):**

- Raw file paths and import graph
- Broken reason codes from QA inventory
- Migration/backlog notes

**Diagnostic-only:**

- `validationState`, `overlapsGoldenLine`
- Per-file status breakdown
- Simulation-only tagging

## 4. Migration Risk Summary

- **High:** 41 broken runtime events could leak if catalog service mirrors client bundle blindly.
- **Medium:** 84 deferred events require explicit bundle scope filtering.
- **Low:** 36 active spine events align with current golden-line gates.

## 5. Regeneration

```bash
npm run report:event-asset-inventory
```

Reads inventory output from `src/data/event-asset-manifest.json`. Does not modify event runtime behavior.

## 6. References

- `docs/contracts/event-catalog-service-boundary.md`
- `src/contracts/eventCatalog.ts`

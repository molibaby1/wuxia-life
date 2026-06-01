# Platform Adapter Requirements (P4 US-022)

Requirements for future Web and mini-program platform adapters. No mini-program implementation in P4.

## 1. Adapter Surfaces

| Adapter | Responsibility | Sync/async |
| --- | --- | --- |
| Storage | Save slots, export/import blobs | async preferred |
| Time | `now()`, monotonic clocks | sync |
| Random seed | Deterministic RNG streams | sync |
| Logging | Structured diagnostic logs | async |
| Network | Future API calls | async |
| UI feedback | Toasts, alerts, prompts | async (mini-program) / sync (web) |

## 2. Platform Metadata

Represent in request/snapshot metadata:

- `sourcePlatform`: `web-browser` | `mini-program` | `node-headless` | `api-server`
- `clientVersion`: build semver
- Optional storage quota hints for mini-program

## 3. Platform Differences

| Concern | Web | Mini-program (future) |
| --- | --- | --- |
| Storage | localStorage | sandbox file/kv limits |
| UI feedback | DOM alerts | native toast API |
| Network | fetch | restricted domain list |
| Background | tab lifecycle | suspend/resume |

## 4. Non-Goals

- No mini-program adapter implementation
- No Web behavior changes
